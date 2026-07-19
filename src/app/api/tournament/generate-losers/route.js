import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { writeClient } from "@/lib/sanity";
import { buildLoserBracketFixtures, TOTAL_TEAMS } from "@/lib/tournament-logic";

export async function POST() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const losers = await writeClient.fetch(
      `*[_type == "match" && bracketType == "main" && round == 1 && status == "completed"].loser._ref`
    );

    const expectedLosers = TOTAL_TEAMS / 2;
    if (losers.length !== expectedLosers) {
      return NextResponse.json(
        { error: `Need ${expectedLosers} completed matches from Round 1, currently have ${losers.length}.` },
        { status: 400 }
      );
    }

    const existingLosers = await writeClient.fetch(
      `*[_type == "match" && bracketType == "loser"]._id`
    );
    if (existingLosers.length > 0) {
      for (const id of existingLosers) {
        await writeClient.delete(id);
      }
    }

    const fixtures = buildLoserBracketFixtures(losers);
    let matchesCreated = 0;

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
      matchesCreated++;
    }

    const tournament = await writeClient.fetch(`*[_type == "tournament"][0]`);
    if (tournament) {
      await writeClient.patch(tournament._id).set({ status: "loser_bracket" }).commit();
    }

    return NextResponse.json({ success: true, matchesCreated });
  } catch (error) {
    console.error("Generate losers error:", error);
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 });
  }
}
