import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { writeClient } from "@/lib/sanity";
import {
  assignTeamsToSections,
  buildSectionFixtures,
  TOTAL_TEAMS,
  SECTIONS,
} from "@/lib/tournament-logic";

export async function POST() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const existingMatchesCount = await writeClient.fetch(`count(*[_type == "match"])`);
    if (existingMatchesCount > 0) {
      return NextResponse.json(
        { error: "Fixtures have already been generated. Please delete existing matches first if you want to regenerate." },
        { status: 400 }
      );
    }

    const teams = await writeClient.fetch(
      `*[_type == "team" && status in ["approved", "active"] && defined(entryFeeImage.asset)] | order(_createdAt asc) {
        _id, name
      }`
    );

    if (teams.length < TOTAL_TEAMS) {
      return NextResponse.json(
        { error: `Need ${TOTAL_TEAMS} approved teams with entry fee uploaded, have ${teams.length}` },
        { status: 400 }
      );
    }

    const selectedTeams = teams.slice(0, TOTAL_TEAMS);
    const assignments = assignTeamsToSections(selectedTeams);
    let matchesCreated = 0;

    for (const section of SECTIONS) {
      const sectionTeams = assignments[section];

      for (const team of sectionTeams) {
        await writeClient.patch(team._id).set({ section, status: "active" }).commit();
      }

      const fixtures = buildSectionFixtures(sectionTeams, section);

      for (const fixture of fixtures) {
        await writeClient.create({
          _type: "match",
          section: fixture.section,
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
          title: `Section ${section} R${fixture.round} M${fixture.matchNumber}`,
        });
        matchesCreated++;
      }
    }

    const existingTournament = await writeClient.fetch(`*[_type == "tournament"][0]`);
    if (existingTournament) {
      await writeClient.patch(existingTournament._id).set({ status: "main_knockout" }).commit();
    } else {
      await writeClient.create({
        _type: "tournament",
        name: "Cricket Championship 2026",
        status: "main_knockout",
        totalTeams: TOTAL_TEAMS,
      });
    }

    return NextResponse.json({ success: true, matchesCreated });
  } catch (error) {
    console.error("Generate fixtures error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate fixtures" }, { status: 500 });
  }
}
