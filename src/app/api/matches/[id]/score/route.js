import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { writeClient } from "@/lib/sanity";
import {
  getNextMainMatchQuery,
  getLoserNextMatch,
  getFinalNextMatch,
  buildLoserBracketFixtures,
} from "@/lib/tournament-logic";

export async function POST(request, { params }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

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
        team1Runs: team1Runs || 0,
        team2Runs: team2Runs || 0,
        winner: { _type: "reference", _ref: winnerId },
        loser: { _type: "reference", _ref: loserId },
        status: status || "completed",
      })
      .commit();

    const winnerRuns = match.team1._id === winnerId ? (team1Runs || 0) : (team2Runs || 0);
    const loserRuns = match.team1._id === winnerId ? (team2Runs || 0) : (team1Runs || 0);

    await writeClient
      .patch(winnerId)
      .inc({ wins: 1, points: 2, runsScored: winnerRuns })
      .commit();

    await writeClient
      .patch(loserId)
      .inc({ losses: 1, runsConceded: loserRuns })
      .commit();

    if (status === "completed") {
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
    if (match.bracketType === "loser" && match.round >= 4) {
      const qualifiedCount = await writeClient.fetch(
        `count(*[_type == "team" && status == "qualified_loser"])`
      );
      if (qualifiedCount < 2) {
        await writeClient.patch(winnerId).set({ status: "qualified_loser" }).commit();
      }
    }
    return;
  }

  const nextMatch = await writeClient.fetch(
    `*[_type == "match" && section == $section && bracketType == $bracketType && round == $round && matchNumber == $matchNumber][0]`,
    {
      section: match.section,
      bracketType: next.bracketType || match.bracketType,
      round: next.round,
      matchNumber: next.matchNumber,
    }
  );

  if (!nextMatch) return;

  const patch = writeClient.patch(nextMatch._id);
  if (!nextMatch.team1) {
    patch.set({ team1: { _type: "reference", _ref: winnerId } });
  } else if (!nextMatch.team2) {
    patch.set({ team2: { _type: "reference", _ref: winnerId } });
  }
  await patch.commit();
}

async function handleLoser(match, loserId) {
  if (match.bracketType === "main" && match.round === 1) {
    await writeClient.patch(loserId).set({ status: "eliminated" }).commit();
    await maybeGenerateLoserBracket();
  } else if (match.bracketType === "main" && match.round > 1) {
    await writeClient.patch(loserId).set({ status: "eliminated" }).commit();
  } else if (match.bracketType === "loser") {
    await writeClient.patch(loserId).set({ status: "eliminated" }).commit();
    const next = getLoserNextMatch(match.round, match.matchNumber);
    if (next) {
      const winnerId = (
        await writeClient.fetch(`*[_type == "match" && _id == $id][0].winner._ref`, { id: match._id })
      );
      if (winnerId) await advanceWinner({ ...match, bracketType: "loser" }, winnerId);
    }
  } else if (match.bracketType === "quarter" || match.bracketType === "semi") {
    await writeClient.patch(loserId).set({ status: "eliminated" }).commit();
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

  const losers = await writeClient.fetch(`
    *[_type == "match" && bracketType == "main" && round == 1 && status == "completed"].loser._ref
  `);

  if (losers.length !== 24) return;

  const fixtures = buildLoserBracketFixtures(losers);
  for (const fixture of fixtures) {
    await writeClient.create({
      _type: "match",
      section: "loser",
      bracketType: "loser",
      round: fixture.round,
      matchNumber: fixture.matchNumber,
      status: "scheduled",
      team1: fixture.team1Id
        ? { _type: "reference", _ref: fixture.team1Id }
        : undefined,
      team2: fixture.team2Id
        ? { _type: "reference", _ref: fixture.team2Id }
        : undefined,
      title: `Loser Bracket R${fixture.round} M${fixture.matchNumber}`,
    });
  }

  const tournament = await writeClient.fetch(`*[_type == "tournament"][0]`);
  if (tournament) {
    await writeClient.patch(tournament._id).set({ status: "loser_bracket" }).commit();
  }
}
