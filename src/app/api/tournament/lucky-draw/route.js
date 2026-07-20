import { NextResponse } from "next/server";
import { writeClient } from "@/lib/sanity";
import { TOTAL_TEAMS } from "@/lib/tournament-logic";

export async function GET() {
  try {
    const triggerRound = TOTAL_TEAMS === 48 ? 3 : 1;
    const nextRound = triggerRound + 1;

    const rMatches = await writeClient.fetch(
      `*[_type == "match" && bracketType == "loser" && round == $triggerRound] | order(matchNumber asc) {
        _id, status, matchNumber,
        winner->{ _id, name },
        team1->{ _id, name },
        team2->{ _id, name }
      }`,
      { triggerRound }
    );

    const nextMatchesCount = await writeClient.fetch(
      `count(*[_type == "match" && bracketType == "loser" && round == $nextRound])`,
      { nextRound }
    );

    const isRCompleted =
      rMatches.length === 3 &&
      rMatches.every((m) => m.status === "completed" && m.winner?._id);

    const teams = isRCompleted ? rMatches.map((m) => m.winner).filter(Boolean) : [];
    const needsSpinner = isRCompleted && nextMatchesCount === 0 && teams.length === 3;
    const spinDone = isRCompleted && nextMatchesCount > 0;

    return NextResponse.json({
      needsSpinner,
      spinDone,
      teams,
      finalThreeReady: isRCompleted,
      round: triggerRound,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { winnerId, allTeamIds } = await request.json();

    if (!winnerId || !allTeamIds || allTeamIds.length !== 3) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const nextRound = TOTAL_TEAMS === 48 ? 4 : 2;

    // Don't create duplicate playoff if already spun
    const existing = await writeClient.fetch(
      `count(*[_type == "match" && bracketType == "loser" && round == $nextRound])`,
      { nextRound }
    );
    if (existing > 0) {
      return NextResponse.json({ error: "Lucky draw already completed" }, { status: 400 });
    }

    await writeClient.patch(winnerId).set({ status: "qualified_loser" }).commit();

    const otherTeams = allTeamIds.filter((id) => id !== winnerId);

    await writeClient.create({
      _type: "match",
      section: "loser",
      bracketType: "loser",
      round: nextRound,
      matchNumber: 1,
      status: "scheduled",
      team1: { _type: "reference", _ref: otherTeams[0] },
      team2: { _type: "reference", _ref: otherTeams[1] },
      title: `Loser Bracket R${nextRound} M1 — Super 8 Playoff`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
