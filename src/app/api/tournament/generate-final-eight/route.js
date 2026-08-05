import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { writeClient } from "@/lib/sanity";
import { buildTopSixteenFixtures, TOP_SIXTEEN } from "@/lib/tournament-logic";

export async function POST() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const qualified = await writeClient.fetch(
      `*[_type == "team" && status in ["qualified_main", "qualified_loser"]] | order(name asc) {
        _id, name, status, section
      }`
    );

    if (qualified.length < TOP_SIXTEEN) {
      return NextResponse.json(
        {
          error: `Need ${TOP_SIXTEEN} qualified teams for Top 16, have ${qualified.length} (need 4 per group A/B/C + 2 Loser AB + 2 Knockout).`,
        },
        { status: 400 }
      );
    }

    const teamIds = qualified.slice(0, TOP_SIXTEEN).map((t) => t._id);

    // Clear any previous final-stage matches
    const existingFinal = await writeClient.fetch(
      `*[_type == "match" && section == "final"]._id`
    );
    if (existingFinal.length > 0) {
      const delTx = writeClient.transaction();
      for (const id of existingFinal) delTx.delete(id);
      await delTx.commit();
    }

    const fixtures = buildTopSixteenFixtures(teamIds);

    for (const teamId of teamIds) {
      await writeClient.patch(teamId).set({ status: "final_eight" }).commit();
    }

    let matchesCreated = 0;
    for (const fixture of fixtures) {
      await writeClient.create({
        _type: "match",
        section: "final",
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
        title: `Top 16 ${fixture.bracketType} R${fixture.round} M${fixture.matchNumber}`,
      });
      matchesCreated++;
    }

    const tournament = await writeClient.fetch(`*[_type == "tournament"][0]`);
    if (tournament) {
      await writeClient
        .patch(tournament._id)
        .set({ status: "final_eight" })
        .commit();
    }

    return NextResponse.json({ success: true, matchesCreated, teams: teamIds.length });
  } catch (error) {
    console.error("Generate Top 16 error:", error);
    return NextResponse.json(
      { error: error.message || "Failed" },
      { status: 500 }
    );
  }
}
