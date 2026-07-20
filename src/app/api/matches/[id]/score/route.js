// force hot reload
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { writeClient } from "@/lib/sanity";
import {
  getNextMainMatchQuery,
  getLoserNextMatch,
  getFinalNextMatch,
  buildLoserBracketFixtures,
  TOTAL_TEAMS
} from "@/lib/tournament-logic";

export async function POST(request, { params }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  console.log("Forcing Turbopack to recompile this file...", Date.now());

  try {
    const { team1Score, team2Score, team1Runs, team2Runs, winnerId, status } =
      await request.json();

    if (!winnerId) {
      return NextResponse.json({ error: "Winner must be selected" }, { status: 400 });
    }

    const match = await writeClient.fetch(
      `*[_type == "match" && _id == $id][0]{
        _id, section, round, matchNumber, bracketType,
        team1->{ _id, name }, team2->{ _id, name }
      }`,
      { id }
    );

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 400 });
    }

    const loserId =
      match.team1._id === winnerId ? match.team2._id : match.team1._id;

    await writeClient
      .patch(id)
      .set({
        team1Score,
        team2Score,
        winner: { _type: "reference", _ref: winnerId },
        loser: { _type: "reference", _ref: loserId },
        status: status || "completed",
      })
      .commit();

    await writeClient
      .patch(winnerId)
      .setIfMissing({ wins: 0, losses: 0, points: 0 })
      .inc({ wins: 1, points: 2 })
      .commit();

    await writeClient
      .patch(loserId)
      .setIfMissing({ wins: 0, losses: 0, points: 0 })
      .inc({ losses: 1 })
      .commit();

    if ((status || "completed") === "completed") {
      await advanceWinner(match, winnerId);
      await handleLoser(match, loserId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Score update error:", error);
    return NextResponse.json({ error: error.message || "Failed to update score" }, { status: 500 });
  }
}

async function advanceWinner(match, winnerId) {
  const next = getNextMatchTarget(match);
  if (!next) {
    if (match.bracketType === "main" && match.round === 3) {
      await writeClient.patch(winnerId).set({ status: "qualified_main" }).commit();
    }
    if (match.bracketType === "loser") {
      if ((TOTAL_TEAMS === 12 && match.round >= 2) || (TOTAL_TEAMS !== 12 && match.round >= 4)) {
        const qualifiedCount = await writeClient.fetch(
          `count(*[_type == "team" && status == "qualified_loser"])`
        );
        if (qualifiedCount < 2) {
          await writeClient.patch(winnerId).set({ status: "qualified_loser" }).commit();
        }
      }
    }
    // Grand final winner
    if (
      match.section === "final" &&
      (match.bracketType === "final" || match.round === 3)
    ) {
      await writeClient.patch(winnerId).set({ status: "champion" }).commit();
      const tournament = await writeClient.fetch(`*[_type == "tournament"][0]._id`);
      if (tournament) {
        await writeClient
          .patch(tournament)
          .set({
            status: "completed",
            champion: { _type: "reference", _ref: winnerId },
          })
          .commit();
      }
    }
    return;
  }

  // Prefer the oldest placeholder / empty slot if duplicates ever exist
  const nextMatch = await writeClient.fetch(
    `*[_type == "match" && section == $section && bracketType == $bracketType && round == $round && matchNumber == $matchNumber] | order(_createdAt asc)[0]{
      _id, team1, team2
    }`,
    {
      section: match.section,
      bracketType: next.bracketType || match.bracketType,
      round: next.round,
      matchNumber: next.matchNumber,
    }
  );

  if (!nextMatch) return;

  if (
    nextMatch.team1?._ref === winnerId ||
    nextMatch.team2?._ref === winnerId
  ) {
    return;
  }

  const patch = writeClient.patch(nextMatch._id);
  if (!nextMatch.team1) {
    patch.set({ team1: { _type: "reference", _ref: winnerId } });
  } else if (!nextMatch.team2) {
    patch.set({ team2: { _type: "reference", _ref: winnerId } });
  }
  await patch.commit();
}

async function handleLoser(match, loserId) {
  // Only Round 1 main-bracket losers enter the Loser Pool / Second Chance
  if (match.bracketType === "main" && match.round === 1) {
    await writeClient
      .patch(loserId)
      .set({ status: "eliminated", loserBracketEligible: true })
      .commit();
    await maybeGenerateLoserBracket();
    return;
  }

  // Later main rounds / loser / final stages: out of tournament (not loser pool)
  if (
    match.bracketType === "main" ||
    match.bracketType === "loser" ||
    match.bracketType === "quarter" ||
    match.bracketType === "semi"
  ) {
    await writeClient
      .patch(loserId)
      .set({ status: "eliminated", loserBracketEligible: false })
      .commit();
  }
}

function getNextMatchTarget(match) {
  if (match.bracketType === "main") {
    return getNextMainMatchQuery(match.section, match.round, match.matchNumber);
  }
  if (match.bracketType === "loser") {
    return getLoserNextMatch(match.round, match.matchNumber);
  }
  if (["quarter", "semi", "final"].includes(match.bracketType)) {
    return getFinalNextMatch(match.bracketType, match.matchNumber);
  }
  return null;
}

async function maybeGenerateLoserBracket() {
  const r1Complete = await writeClient.fetch(`
    count(*[_type == "match" && bracketType == "main" && round == 1 && status != "completed"])
  `);
  if (r1Complete > 0) return;

  const existingLoser = await writeClient.fetch(
    `count(*[_type == "match" && bracketType == "loser"])`
  );
  if (existingLoser > 0) return;

  // Atomic lock: only one concurrent request can create this document
  const lockId = "lock.loserBracketGeneration";
  try {
    await writeClient.create({
      _id: lockId,
      _type: "generationLock",
      createdAt: new Date().toISOString(),
    });
  } catch {
    return;
  }

  try {
    const stillEmpty = await writeClient.fetch(
      `count(*[_type == "match" && bracketType == "loser"])`
    );
    if (stillEmpty > 0) return;

    const losers = await writeClient.fetch(`
      *[_type == "match" && bracketType == "main" && round == 1 && status == "completed"].loser._ref
    `);
    const uniqueLosers = [...new Set(losers.filter(Boolean))];
    const expectedLosers = TOTAL_TEAMS / 2;
    if (uniqueLosers.length !== expectedLosers) return;

    const fixtures = buildLoserBracketFixtures(uniqueLosers);
    const tx = writeClient.transaction();
    for (const fixture of fixtures) {
      tx.create({
        _type: "match",
        section: "loser",
        bracketType: "loser",
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
        title: `Loser Bracket R${fixture.round} M${fixture.matchNumber}`,
      });
    }
    await tx.commit();

    const tournament = await writeClient.fetch(`*[_type == "tournament"][0]._id`);
    if (tournament) {
      await writeClient
        .patch(tournament)
        .set({ status: "loser_bracket" })
        .unset(["loserBracketLock"])
        .commit();
    }
  } finally {
    try {
      await writeClient.delete(lockId);
    } catch {
      /* ignore */
    }
  }
}
