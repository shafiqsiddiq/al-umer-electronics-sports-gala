import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { writeClient } from "@/lib/sanity";
import {
  buildLoserAbFixtures,
  buildKnockoutGroupFixtures,
  SECTION_LOSER_AB,
  SECTION_KNOCKOUT,
  LOSER_AB_EXPECTED,
} from "@/lib/tournament-logic";
import {
  fetchKnockoutPoolIds,
  assertKnockoutPoolReady,
} from "@/lib/knockout-pool";
import {
  clearSectionPoolByes,
  setPoolBye,
  expectedR1PlayingCount,
} from "@/lib/pool-bye";

/**
 * POST body (optional): { pool: "loser_ab" | "knockout" | "both", force?: boolean }
 * Knockout admin rebuild always replaces fixtures from the full current pool
 * (C losers + new entries) so late registrations get Round 1 slots.
 */
export async function POST(request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let pool = "both";
    let force = false;
    try {
      const body = await request.json();
      if (body?.pool) pool = body.pool;
      if (body?.force) force = true;
    } catch {
      /* no body */
    }

    const created = {};

    if (pool === "loser_ab" || pool === "both") {
      // Admin generate/rebuild: A+B Round 1 losers → Loser AB fixtures
      created.loserAb = await generateLoserAb(
        true,
        force || pool === "loser_ab"
      );
    }
    if (pool === "knockout" || pool === "both") {
      // Admin "Rebuild fixtures" always force-rebuilds from full pool
      created.knockout = await generateKnockout(true, force || pool === "knockout");
    }

    return NextResponse.json({ success: true, created });
  } catch (error) {
    console.error("Generate losers error:", error);
    return NextResponse.json(
      { error: error.message || "Failed" },
      { status: 500 }
    );
  }
}

/**
 * Pool = Group A Round 1 losers + Group B Round 1 losers (16 teams).
 * @param {boolean} replaceExisting
 * @param {boolean} force - delete existing Loser AB matches even if scored
 */
async function generateLoserAb(replaceExisting, force = false) {
  const pending = await writeClient.fetch(`
    count(*[_type == "match" && bracketType == "main" && round == 1 && section in ["A","B"] && status != "completed"])
  `);
  if (pending > 0) {
    throw new Error(
      `Finish all Group A & B Round 1 matches first (${pending} remaining).`
    );
  }

  const loserRows = await writeClient.fetch(`
    *[_type == "match" && bracketType == "main" && round == 1 && section in ["A","B"] && status == "completed" && defined(loser)] | order(section asc, matchNumber asc) {
      section,
      "loserId": loser._ref
    }
  `);
  const uniqueLosers = [];
  const seen = new Set();
  let fromA = 0;
  let fromB = 0;
  for (const row of loserRows || []) {
    if (!row?.loserId || seen.has(row.loserId)) continue;
    seen.add(row.loserId);
    uniqueLosers.push(row.loserId);
    if (row.section === "A") fromA += 1;
    if (row.section === "B") fromB += 1;
  }

  if (uniqueLosers.length !== LOSER_AB_EXPECTED) {
    throw new Error(
      `Need ${LOSER_AB_EXPECTED} A+B Round 1 losers (Group A + Group B), have ${uniqueLosers.length} (A:${fromA} B:${fromB}).`
    );
  }

  const existing = await writeClient.fetch(
    `*[_type == "match" && (section == $section || section == "loser")]{ _id, status, round }`,
    { section: SECTION_LOSER_AB }
  );
  if (existing.length > 0) {
    if (!replaceExisting) {
      return { skipped: true, reason: "already exists" };
    }
    const hasResults = existing.some(
      (m) => m.status === "completed" || m.status === "live"
    );
    if (hasResults && !force) {
      return {
        skipped: true,
        reason: "Loser AB has live/completed matches — use force rebuild",
      };
    }
    const ids = existing.map((m) => m._id);
    for (let i = 0; i < ids.length; i += 50) {
      const chunk = ids.slice(i, i + 50);
      const delTx = writeClient.transaction();
      for (const id of chunk) delTx.delete(id);
      await delTx.commit();
    }
  }

  const fixtures = buildLoserAbFixtures(uniqueLosers);
  await commitFixtures(fixtures, "Loser AB");

  const r1 = fixtures.filter((f) => f.round === 1);
  const tournament = await writeClient.fetch(`*[_type == "tournament"][0]._id`);
  if (tournament) {
    await writeClient.patch(tournament).set({ status: "loser_bracket" }).commit();
  }

  return {
    matchesCreated: fixtures.length,
    teams: uniqueLosers.length,
    round1Matches: r1.length,
    fromA,
    fromB,
    rebuilt: true,
  };
}

/**
 * @param {boolean} replaceExisting
 * @param {boolean} force - Admin rebuild: delete all KO matches even if results exist
 */
async function generateKnockout(replaceExisting, force = false) {
  const pending = await writeClient.fetch(`
    count(*[_type == "match" && bracketType == "main" && round == 1 && section == "C" && status != "completed"])
  `);
  if (pending > 0) {
    throw new Error(
      `Finish all Group C Round 1 matches first (${pending} remaining).`
    );
  }

  const { losers: uniqueLosers, newEntries, pool } = await fetchKnockoutPoolIds();
  assertKnockoutPoolReady(uniqueLosers.length, pool.length);

  const existing = await writeClient.fetch(
    `*[_type == "match" && section == $section]{ _id, status, round, team1, team2 }`,
    { section: SECTION_KNOCKOUT }
  );

  if (existing.length > 0) {
    const completed = existing.filter((m) => m.status === "completed").length;

    if (completed > 0 && !force) {
      return {
        skipped: true,
        reason:
          "Knockout already has results. Reset Knockout Round 1 first, then Rebuild.",
        teams: pool.length,
        completed,
      };
    }

    const r1TeamIds = new Set();
    for (const m of existing) {
      if (Number(m.round) !== 1) continue;
      if (m.team1?._ref) r1TeamIds.add(m.team1._ref);
      if (m.team2?._ref) r1TeamIds.add(m.team2._ref);
    }
    const expectedPlaying = expectedR1PlayingCount(pool.length);
    const uncovered = pool.filter((id) => !r1TeamIds.has(id));
    const openingByeOk =
      pool.length % 2 === 1 &&
      r1TeamIds.size === expectedPlaying &&
      uncovered.length === 1;
    const coverageOk =
      (r1TeamIds.size === pool.length && pool.length % 2 === 0) || openingByeOk;
    const poolGrew = uncovered.length > (openingByeOk ? 1 : 0);
    const needsRebuild = force || poolGrew || !coverageOk;

    if (!needsRebuild) {
      return {
        skipped: true,
        reason: "already covers full pool",
        teams: pool.length,
        round1Teams: r1TeamIds.size,
        round1Matches: existing.filter((m) => Number(m.round) === 1).length,
      };
    }

    // Delete in chunks — large brackets can exceed one transaction
    const ids = existing.map((m) => m._id);
    for (let i = 0; i < ids.length; i += 50) {
      const chunk = ids.slice(i, i + 50);
      const delTx = writeClient.transaction();
      for (const id of chunk) delTx.delete(id);
      await delTx.commit();
    }
  }

  await clearSectionPoolByes(SECTION_KNOCKOUT);

  const built = buildKnockoutGroupFixtures(pool);
  const fixtures = built.matches || [];
  await commitFixtures(fixtures, "Knockout");

  if (built.openingByeTeamId) {
    await setPoolBye(SECTION_KNOCKOUT, 2, built.openingByeTeamId, 0);
  }

  const r1 = fixtures.filter((f) => f.round === 1);
  const r1TeamIds = new Set();
  for (const f of r1) {
    if (f.team1Id) r1TeamIds.add(f.team1Id);
    if (f.team2Id) r1TeamIds.add(f.team2Id);
  }

  const expectedPlaying = expectedR1PlayingCount(pool.length);
  if (r1TeamIds.size !== expectedPlaying) {
    throw new Error(
      `Fixture build failed: pool ${pool.length} should pair ${expectedPlaying} in Round 1, got ${r1TeamIds.size}.`
    );
  }

  const tournament = await writeClient.fetch(`*[_type == "tournament"][0]._id`);
  if (tournament) {
    await writeClient.patch(tournament).set({ status: "loser_bracket" }).commit();
  }

  return {
    matchesCreated: fixtures.length,
    teams: pool.length,
    round1Matches: r1.length,
    round1Teams: r1TeamIds.size,
    openingBye: built.openingByeTeamId || null,
    newEntries: newEntries.length,
    cLosers: uniqueLosers.length,
    rebuilt: true,
  };
}

async function commitFixtures(fixtures, label) {
  // Chunk creates — Sanity transactions have mutation limits
  for (let i = 0; i < fixtures.length; i += 40) {
    const chunk = fixtures.slice(i, i + 40);
    const tx = writeClient.transaction();
    for (const fixture of chunk) {
      tx.create({
        _type: "match",
        section: fixture.section,
        bracketType: fixture.bracketType,
        round: fixture.round,
        matchNumber: fixture.matchNumber,
        status: "scheduled",
        ...(fixture.placeholder ? { placeholder: true } : {}),
        ...(fixture.team1Id
          ? { team1: { _type: "reference", _ref: fixture.team1Id } }
          : {}),
        ...(fixture.team2Id
          ? { team2: { _type: "reference", _ref: fixture.team2Id } }
          : {}),
        title: `${label} R${fixture.round} M${fixture.matchNumber}`,
      });
    }
    await tx.commit();
  }
}
