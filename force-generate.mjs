import { createClient } from "@sanity/client";
import { assignTeamsToSections, buildSectionFixtures, SECTIONS, TOTAL_TEAMS } from "./src/lib/tournament-logic.js";

const writeClient = createClient({
  projectId: "bubodoq1",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: "skKCBPX9mGj0F0ZOFik5hf1IG7gAB35O2JdL1ucWD2ma5kTof82DEfhMUcbiOOEpuOMReOrbFb29XRdbmXJceN3VAOlJBzdANfxWuYY5IL1Ph7rECKdB3tJFewL8ujt2Gd0q8n6myufyhua5ecQBgFA1tfTYN2d1WMRlWNvZsy58gwWERrqN",
});

async function run() {
  console.log("Clearing all existing matches...");
  const existingMatches = await writeClient.fetch(`*[_type == "match"]._id`);
  const tx = writeClient.transaction();
  for (const id of existingMatches) {
    tx.delete(id);
  }
  await tx.commit();
  console.log(`Deleted ${existingMatches.length} matches.`);

  console.log("Fetching teams...");
  const teams = await writeClient.fetch(
    `*[_type == "team" && status in ["approved", "active"]] | order(_createdAt asc) { _id, name }`
  );

  console.log(`Found ${teams.length} teams.`);
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
        team1: fixture.team1Id ? { _type: "reference", _ref: fixture.team1Id } : undefined,
        team2: fixture.team2Id ? { _type: "reference", _ref: fixture.team2Id } : undefined,
        title: `Section ${section} R${fixture.round} M${fixture.matchNumber}`,
      });
      matchesCreated++;
    }
  }

  const existingTournament = await writeClient.fetch(`*[_type == "tournament"][0]`);
  if (existingTournament) {
    await writeClient.patch(existingTournament._id).set({ status: "main_knockout" }).commit();
  }

  console.log(`Successfully generated ${matchesCreated} matches cleanly!`);
}

run().catch(console.error);
