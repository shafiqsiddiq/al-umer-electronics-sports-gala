import { NextResponse } from "next/server";
import { writeClient } from "@/lib/sanity";
import { TOTAL_TEAMS } from "@/lib/tournament-logic";

export async function GET() {
  try {
    const triggerRound = TOTAL_TEAMS === 48 ? 3 : 1;
    const nextRound = triggerRound + 1;

    const rMatches = await writeClient.fetch(
      `*[_type == "match" && bracketType == "loser" && round == ${triggerRound}]{
        _id, status, winner->{ _id, name }
      }`
    );

    const nextMatchesCount = await writeClient.fetch(
      `count(*[_type == "match" && bracketType == "loser" && round == ${nextRound} && !defined(placeholder)])`
    );

    const isRCompleted =
      rMatches.length === 3 && rMatches.every((m) => m.status === "completed" && m.winner);

    const needsSpinner = isRCompleted && nextMatchesCount === 0;

    const teams = isRCompleted ? rMatches.map((m) => m.winner) : [];

    return NextResponse.json({ needsSpinner, teams });
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

    // 1. Mark the winner as qualified
    await writeClient.patch(winnerId).set({ status: "qualified_loser" }).commit();

    // 2. The other 2 teams play in the next Round Match 1
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
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
