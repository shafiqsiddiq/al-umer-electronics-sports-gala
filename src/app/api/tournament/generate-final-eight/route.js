import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { writeClient } from "@/lib/sanity";
import { buildFinalEightFixtures, FINAL_EIGHT } from "@/lib/tournament-logic";

export async function POST() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const qualified = await writeClient.fetch(
      `*[_type == "team" && status in ["qualified_main", "qualified_loser"]] | order(name asc) {
        _id, name
      }`
    );

    if (qualified.length < FINAL_EIGHT) {
      return NextResponse.json(
        { error: `Need ${FINAL_EIGHT} qualified teams, have ${qualified.length}` },
        { status: 400 }
      );
    }

    const teamIds = qualified.slice(0, FINAL_EIGHT).map((t) => t._id);
    const fixtures = buildFinalEightFixtures(teamIds);
    let matchesCreated = 0;

    for (const teamId of teamIds) {
      await writeClient.patch(teamId).set({ status: "final_eight" }).commit();
    }

    for (const fixture of fixtures) {
      await writeClient.create({
        _type: "match",
        section: "final",
        bracketType: fixture.bracketType,
        round: fixture.round,
        matchNumber: fixture.matchNumber,
        status: "scheduled",
        team1: fixture.team1Id
          ? { _type: "reference", _ref: fixture.team1Id }
          : undefined,
        team2: fixture.team2Id
          ? { _type: "reference", _ref: fixture.team2Id }
          : undefined,
        title: `Final ${fixture.bracketType} R${fixture.round}`,
      });
      matchesCreated++;
    }

    const tournament = await writeClient.fetch(`*[_type == "tournament"][0]`);
    if (tournament) {
      await writeClient.patch(tournament._id).set({ status: "final_eight" }).commit();
    }

    return NextResponse.json({ success: true, matchesCreated });
  } catch (error) {
    console.error("Generate final eight error:", error);
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 });
  }
}
