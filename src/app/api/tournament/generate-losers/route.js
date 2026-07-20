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

    const uniqueLosers = [...new Set(losers.filter(Boolean))];
    const expectedLosers = TOTAL_TEAMS / 2;
    if (uniqueLosers.length !== expectedLosers) {
      return NextResponse.json(
        {
          error: `Need ${expectedLosers} unique Round 1 losers, currently have ${uniqueLosers.length} (raw ${losers.length}).`,
        },
        { status: 400 }
      );
    }

    const existingLosers = await writeClient.fetch(
      `*[_type == "match" && bracketType == "loser"]._id`
    );
    if (existingLosers.length > 0) {
      const delTx = writeClient.transaction();
      for (const id of existingLosers) delTx.delete(id);
      await delTx.commit();
    }

    const fixtures = buildLoserBracketFixtures(uniqueLosers);
    const createTx = writeClient.transaction();

    for (const fixture of fixtures) {
      createTx.create({
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
    await createTx.commit();
    const matchesCreated = fixtures.length;

    const tournament = await writeClient.fetch(`*[_type == "tournament"][0]`);
    if (tournament) {
      await writeClient
        .patch(tournament._id)
        .set({ status: "loser_bracket" })
        .unset(["loserBracketLock"])
        .commit();
    }

    return NextResponse.json({ success: true, matchesCreated });
  } catch (error) {
    console.error("Generate losers error:", error);
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 });
  }
}
