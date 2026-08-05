import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { writeClient } from "@/lib/sanity";
import {
  SECTION_LOSER_AB,
  SECTION_KNOCKOUT,
} from "@/lib/tournament-logic";

/**
 * Reset a section round and every later round in that section.
 * Clears scores/winners, undoes W/L/pts, and unfills later-round team slots.
 *
 * Body: { section: "A"|"B"|"C"|"loser_ab"|"knockout"|"final"|"loser", round: number }
 */
export async function POST(request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const section = String(body.section || "").trim();
    const round = Number(body.round);

    if (!section || !Number.isFinite(round) || round < 1) {
      return NextResponse.json(
        { error: "section and round are required" },
        { status: 400 }
      );
    }

    const sectionFilter =
      section === "loser_ab" || section === "loser"
        ? `section in ["loser_ab", "loser"]`
        : `section == $section`;

    const matches = await writeClient.fetch(
      `*[
        _type == "match" &&
        ${sectionFilter} &&
        round >= $round
      ] | order(round desc, matchNumber desc) {
        _id, section, round, matchNumber, bracketType, status,
        team1, team2, winner, loser,
        team1Score, team2Score
      }`,
      { section, round }
    );

    if (!matches?.length) {
      return NextResponse.json(
        { error: "No matches found for this round" },
        { status: 404 }
      );
    }

    const affectedTeamIds = new Set();
    let clearedResults = 0;
    let clearedSlots = 0;

    for (const match of matches) {
      const winnerId = match.winner?._ref || match.winner?._id || null;
      const loserId = match.loser?._ref || match.loser?._id || null;
      const hadResult =
        Boolean(winnerId) ||
        match.status === "completed" ||
        match.status === "live" ||
        match.team1Score != null ||
        match.team2Score != null;

      if (winnerId && loserId) {
        await undoMatchStats(winnerId, loserId);
        affectedTeamIds.add(winnerId);
        affectedTeamIds.add(loserId);
      } else if (winnerId) {
        await undoWinnerOnly(winnerId);
        affectedTeamIds.add(winnerId);
      }

      const patch = writeClient
        .patch(match._id)
        .set({ status: "scheduled" })
        .unset([
          "winner",
          "loser",
          "team1Score",
          "team2Score",
          "team1Runs",
          "team2Runs",
        ]);

      // Later rounds were filled by winners — clear team slots
      if (Number(match.round) > round) {
        patch.unset(["team1", "team2"]);
        clearedSlots += 1;
      }

      await patch.commit();
      if (hadResult) clearedResults += 1;
    }

    // Recompute statuses from remaining completed matches (fixes Top 4 / eliminated)
    for (const teamId of affectedTeamIds) {
      await recomputeTeamStatus(teamId);
    }

    // Belt-and-suspenders: group Top 4 status must drop when R2+ was cleared
    if (["A", "B", "C"].includes(section) && round <= 2) {
      await clearSectionMainQualifiers(section);
    }

    // If main R1 is reset, auto-generated secondary pools become invalid
    let deletedPoolMatches = 0;
    if (round === 1 && (section === "A" || section === "B")) {
      deletedPoolMatches += await deleteSectionMatches(SECTION_LOSER_AB);
      deletedPoolMatches += await deleteSectionMatches("loser");
    }
    if (round === 1 && section === "C") {
      deletedPoolMatches += await deleteSectionMatches(SECTION_KNOCKOUT);
    }

    // Clearing any final-stage result may invalidate champion
    if (section === "final") {
      await clearChampionIfNeeded();
    }

    return NextResponse.json({
      success: true,
      clearedResults,
      clearedSlots,
      deletedPoolMatches,
      affectedTeams: affectedTeamIds.size,
    });
  } catch (error) {
    console.error("Reset round error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reset round" },
      { status: 500 }
    );
  }
}

async function undoMatchStats(winnerId, loserId) {
  const teams = await writeClient.fetch(
    `*[_type == "team" && _id in $ids]{ _id, wins, losses, points }`,
    { ids: [winnerId, loserId] }
  );
  const byId = Object.fromEntries((teams || []).map((t) => [t._id, t]));

  const winner = byId[winnerId];
  if (winner) {
    await writeClient
      .patch(winnerId)
      .set({
        wins: Math.max(0, Number(winner.wins || 0) - 1),
        points: Math.max(0, Number(winner.points || 0) - 2),
      })
      .commit();
  }

  const loser = byId[loserId];
  if (loser) {
    await writeClient
      .patch(loserId)
      .set({
        losses: Math.max(0, Number(loser.losses || 0) - 1),
      })
      .commit();
  }
}

async function undoWinnerOnly(winnerId) {
  const team = await writeClient.fetch(
    `*[_type == "team" && _id == $id][0]{ _id, wins, points }`,
    { id: winnerId }
  );
  if (!team) return;
  await writeClient
    .patch(winnerId)
    .set({
      wins: Math.max(0, Number(team.wins || 0) - 1),
      points: Math.max(0, Number(team.points || 0) - 2),
    })
    .commit();
}

/**
 * Derive status from remaining completed matches after a reset.
 * R2 winners who still have an R1 win must drop qualified_main → active.
 */
async function recomputeTeamStatus(teamId) {
  const team = await writeClient.fetch(
    `*[_type == "team" && _id == $id][0]{ _id, status }`,
    { id: teamId }
  );
  if (!team) return;

  // Don't touch registration states
  if (["pending", "approved"].includes(team.status)) return;

  const results = await writeClient.fetch(
    `*[
      _type == "match" &&
      status == "completed" &&
      (winner._ref == $id || loser._ref == $id)
    ]{
      section, round, bracketType,
      "isWinner": winner._ref == $id,
      "isLoser": loser._ref == $id
    }`,
    { id: teamId }
  );

  const wins = (results || []).filter((m) => m.isWinner);
  const losses = (results || []).filter((m) => m.isLoser);

  const isChampion = wins.some(
    (m) =>
      m.section === "final" &&
      (m.bracketType === "final" || Number(m.round) === 4)
  );
  const isQualifiedMain = wins.some(
    (m) => m.bracketType === "main" && Number(m.round) >= 2
  );
  const isQualifiedLoser = wins.some(
    (m) =>
      (m.section === SECTION_LOSER_AB || m.section === "loser") &&
      Number(m.round) >= 3
  ) || wins.some(
    (m) => m.section === SECTION_KNOCKOUT && Number(m.round) >= 2
  );

  const lostMainR1 = losses.some(
    (m) => m.bracketType === "main" && Number(m.round) === 1
  );
  const lostEliminating = losses.some(
    (m) =>
      (m.bracketType === "main" && Number(m.round) >= 2) ||
      m.bracketType === "loser" ||
      m.section === SECTION_LOSER_AB ||
      m.section === SECTION_KNOCKOUT ||
      ["round16", "quarter", "semi"].includes(m.bracketType)
  );

  let nextStatus = "active";
  let loserBracketEligible = false;

  if (isChampion) nextStatus = "champion";
  else if (isQualifiedMain) nextStatus = "qualified_main";
  else if (isQualifiedLoser) nextStatus = "qualified_loser";
  else if (lostEliminating || lostMainR1) {
    nextStatus = "eliminated";
    loserBracketEligible = lostMainR1 && !lostEliminating;
  }

  await writeClient
    .patch(teamId)
    .set({ status: nextStatus, loserBracketEligible })
    .commit();
}

/** Drop qualified_main for a group when its Top 4 round was reset */
async function clearSectionMainQualifiers(section) {
  const teams = await writeClient.fetch(
    `*[_type == "team" && section == $section && status in ["qualified_main", "final_eight"]]{
      _id
    }`,
    { section }
  );

  for (const team of teams || []) {
    const stillR2Winner = await writeClient.fetch(
      `count(*[
        _type == "match" &&
        section == $section &&
        round == 2 &&
        status == "completed" &&
        winner._ref == $id
      ])`,
      { section, id: team._id }
    );
    if (stillR2Winner === 0) {
      await recomputeTeamStatus(team._id);
    }
  }
}

async function deleteSectionMatches(sectionName) {
  const ids = await writeClient.fetch(
    `*[_type == "match" && section == $section]._id`,
    { section: sectionName }
  );
  if (!ids?.length) return 0;

  const tx = writeClient.transaction();
  for (const id of ids) tx.delete(id);
  await tx.commit();
  return ids.length;
}

async function clearChampionIfNeeded() {
  const tournament = await writeClient.fetch(
    `*[_type == "tournament"][0]{ _id, champion }`
  );
  if (!tournament?._id || !tournament.champion) return;

  const finalDone = await writeClient.fetch(`
    count(*[
      _type == "match" &&
      section == "final" &&
      (bracketType == "final" || round == 4) &&
      status == "completed" &&
      defined(winner)
    ])
  `);

  if (finalDone === 0) {
    await writeClient
      .patch(tournament._id)
      .unset(["champion"])
      .set({ status: "active" })
      .commit();
  }
}
