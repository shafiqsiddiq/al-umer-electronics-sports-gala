import {
  MAIN_QUALIFIERS_PER_SECTION,
  LOSER_AB_QUALIFIERS,
  KNOCKOUT_QUALIFIERS,
  SECTION_LOSER_AB,
  SECTION_KNOCKOUT,
  TOP_SIXTEEN,
} from "@/lib/tournament-logic";

const TEAM_PROJECTION = `{
  _id, name, status, section,
  "wins": coalesce(wins, 0),
  "points": coalesce(points, 0),
  captain->{
    _id, name,
    "profilePictureUrl": profilePicture.asset->url
  }
}`;

function uniqById(teams) {
  const seen = new Set();
  const out = [];
  for (const t of teams || []) {
    if (!t?._id || seen.has(t._id)) continue;
    seen.add(t._id);
    out.push(t);
  }
  return out;
}

/** Group A/B/C Round 2 winners → 4 per group */
async function mainGroupQualifiers(client, section) {
  const rows = await client.fetch(
    `*[
      _type == "match" &&
      bracketType == "main" &&
      section == $section &&
      round == 2 &&
      status == "completed" &&
      defined(winner)
    ] | order(matchNumber asc) {
      matchNumber,
      "team": winner->${TEAM_PROJECTION}
    }`,
    { section }
  );

  return uniqById((rows || []).map((r) => r.team).filter(Boolean)).slice(
    0,
    MAIN_QUALIFIERS_PER_SECTION
  );
}

/**
 * Final qualifier round for a pool: last round that has exactly `target`
 * completed matches (all done) → those winners.
 */
async function poolQualifiers(client, sections, target) {
  const sectionFilter =
    sections.length === 1
      ? `section == $s0`
      : `section in [${sections.map((_, i) => `$s${i}`).join(", ")}]`;
  const params = Object.fromEntries(sections.map((s, i) => [`s${i}`, s]));

  const matches = await client.fetch(
    `*[
      _type == "match" &&
      ${sectionFilter} &&
      status == "completed" &&
      defined(winner)
    ] | order(round desc, matchNumber asc) {
      section, round, matchNumber,
      "team": winner->${TEAM_PROJECTION}
    }`,
    params
  );

  if (!matches?.length) return [];

  const rounds = [...new Set(matches.map((m) => Number(m.round)))].sort(
    (a, b) => b - a
  );

  for (const round of rounds) {
    const roundMatches = matches.filter((m) => Number(m.round) === round);
    // Qualifier round is exactly `target` matches
    if (roundMatches.length === target) {
      return uniqById(roundMatches.map((m) => m.team).filter(Boolean)).slice(
        0,
        target
      );
    }
  }

  return [];
}

function sourceLabel(team, from) {
  if (from === "loser_ab") return "Loser AB";
  if (from === "knockout") return "Knockout";
  if (team?.section === "A" || team?.section === "B" || team?.section === "C") {
    return `Group ${team.section}`;
  }
  return "Top 16";
}

/**
 * Authoritative Top 16 list from completed match results
 * (not team.status — survives clear / R16 losses).
 */
export async function fetchTopSixteenQualifiers(client) {
  const [a, b, c, loserAb, knockout] = await Promise.all([
    mainGroupQualifiers(client, "A"),
    mainGroupQualifiers(client, "B"),
    mainGroupQualifiers(client, "C"),
    poolQualifiers(client, [SECTION_LOSER_AB, "loser"], LOSER_AB_QUALIFIERS),
    poolQualifiers(client, [SECTION_KNOCKOUT], KNOCKOUT_QUALIFIERS),
  ]);

  const tagged = [
    ...a.map((t) => ({ ...t, source: sourceLabel(t, "main"), qualifyFrom: "main" })),
    ...b.map((t) => ({ ...t, source: sourceLabel(t, "main"), qualifyFrom: "main" })),
    ...c.map((t) => ({ ...t, source: sourceLabel(t, "main"), qualifyFrom: "main" })),
    ...loserAb.map((t) => ({
      ...t,
      source: sourceLabel(t, "loser_ab"),
      qualifyFrom: "loser_ab",
    })),
    ...knockout.map((t) => ({
      ...t,
      source: sourceLabel(t, "knockout"),
      qualifyFrom: "knockout",
    })),
  ];

  const teams = uniqById(tagged);

  return {
    teams,
    count: teams.length,
    capacity: TOP_SIXTEEN,
    breakdown: {
      A: a.length,
      B: b.length,
      C: c.length,
      loserAb: loserAb.length,
      knockout: knockout.length,
    },
  };
}

/**
 * Re-apply qualified_main / qualified_loser from match results.
 * Use after clearing Top 16 fixtures (R16 losers were marked eliminated).
 * @param {object} writeClient
 * @param {{ includeFinalEight?: boolean }} [opts] — set true after Clear fixtures
 */
export async function syncTopSixteenQualifierStatuses(
  writeClient,
  { includeFinalEight = false } = {}
) {
  const { teams } = await fetchTopSixteenQualifiers(writeClient);
  let patched = 0;

  for (const team of teams) {
    const next =
      team.qualifyFrom === "main" ? "qualified_main" : "qualified_loser";
    if (team.status === "champion") continue;
    if (team.status === next) continue;
    if (team.status === "final_eight" && !includeFinalEight) continue;
    await writeClient.patch(team._id).set({ status: next }).commit();
    patched += 1;
  }

  return { synced: teams.length, patched };
}
