import { createClient } from "@sanity/client";
import bcrypt from "bcryptjs";
import { writeFileSync } from "fs";
import {
  assignTeamsToSections,
  buildSectionFixtures,
  SECTIONS,
  TOTAL_TEAMS,
} from "./src/lib/tournament-logic.js";

const client = createClient({
  projectId: "bubodoq1",
  dataset: process.env.SANITY_DATASET || "development",
  apiVersion: "2024-01-01",
  useCdn: false,
  token:
    "skKCBPX9mGj0F0ZOFik5hf1IG7gAB35O2JdL1ucWD2ma5kTof82DEfhMUcbiOOEpuOMReOrbFb29XRdbmXJceN3VAOlJBzdANfxWuYY5IL1Ph7rECKdB3tJFewL8ujt2Gd0q8n6myufyhua5ecQBgFA1tfTYN2d1WMRlWNvZsy58gwWERrqN",
});

console.log(`Seeding dataset: ${client.config().dataset}`);

const PASSWORD = "123456";

function phoneFor(i) {
  // Unique 11-digit Pakistani mobiles: 03001000001 … 03001000048
  return `0300${String(1000000 + i).padStart(7, "0")}`;
}

function cnicFor(i) {
  // Unique CNICs: 35201-8511101-1 … format 35201-XXXXXXX-X
  const middle = String(8511100 + i).padStart(7, "0");
  const check = String(i % 10);
  return `35201-${middle}-${check}`;
}

async function deleteAll() {
  console.log("Fetching existing teams, matches, tournaments, captains, players...");

  // Break circular team <-> captain refs first
  const teams = await client.fetch(`*[_type == "team"]._id`);
  const captains = await client.fetch(`*[_type == "captain"]._id`);
  const BATCH = 50;

  for (let i = 0; i < teams.length; i += BATCH) {
    const batch = teams.slice(i, i + BATCH);
    const tx = client.transaction();
    for (const id of batch) tx.patch(id, (p) => p.unset(["captain", "players"]));
    await tx.commit();
  }
  for (let i = 0; i < captains.length; i += BATCH) {
    const batch = captains.slice(i, i + BATCH);
    const tx = client.transaction();
    for (const id of batch) tx.patch(id, (p) => p.unset(["team"]));
    await tx.commit();
  }

  // Delete in dependency order
  for (const type of ["match", "tournament", "player", "captain", "team", "generationLock"]) {
    const ids = await client.fetch(`*[_type == $type]._id`, { type });
    if (ids.length === 0) continue;
    for (let i = 0; i < ids.length; i += BATCH) {
      const batch = ids.slice(i, i + BATCH);
      const tx = client.transaction();
      for (const id of batch) tx.delete(id);
      await tx.commit();
    }
    console.log(`  Deleted ${ids.length} ${type}(s)`);
  }
  console.log("All old documents deleted.");
}

async function uploadDummyImage() {
  console.log("Uploading a dummy image asset...");
  const imageBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    "base64"
  );
  const imageAsset = await client.assets.upload("image", imageBuffer, {
    filename: "dummy.png",
  });
  console.log("Dummy image uploaded. Asset ID:", imageAsset._id);
  return imageAsset._id;
}

async function createTeamsAndCaptains(imageAssetId, passwordHash) {
  console.log(`Creating ${TOTAL_TEAMS} teams with captains...`);
  const credentials = [];

  for (let i = 1; i <= TOTAL_TEAMS; i++) {
    const phone = phoneFor(i);
    const teamName = `Team ${i}`;
    const captainName = `Captain ${i}`;

    const team = await client.create({
      _type: "team",
      name: teamName,
      status: "approved",
      section: "unassigned",
      players: [],
      wins: 0,
      losses: 0,
      points: 0,
      runsScored: 0,
      runsConceded: 0,
      entryFeeVerified: true,
      entryFeeImage: {
        _type: "image",
        asset: { _type: "reference", _ref: imageAssetId },
      },
    });

    const captain = await client.create({
      _type: "captain",
      name: captainName,
      fatherName: `Father ${i}`,
      cnic: cnicFor(i),
      villageOrCity: "Lahore",
      phone,
      whatsapp: phone,
      passwordHash,
      profilePicture: {
        _type: "image",
        asset: { _type: "reference", _ref: imageAssetId },
      },
      cnicImage: {
        _type: "image",
        asset: { _type: "reference", _ref: imageAssetId },
      },
      team: { _type: "reference", _ref: team._id },
    });

    await client
      .patch(team._id)
      .set({ captain: { _type: "reference", _ref: captain._id } })
      .commit();

    credentials.push({
      team: teamName,
      captain: captainName,
      phone,
      password: PASSWORD,
    });

    if (i % 8 === 0 || i === TOTAL_TEAMS) {
      console.log(`  Created ${i}/${TOTAL_TEAMS} teams`);
    }
  }

  return credentials;
}

async function generateFixtures() {
  console.log("Generating section fixtures...");
  const teams = await client.fetch(
    `*[_type == "team" && status in ["approved", "active"]] | order(_createdAt asc) { _id, name }`
  );

  if (teams.length < TOTAL_TEAMS) {
    throw new Error(`Need ${TOTAL_TEAMS} teams, have ${teams.length}`);
  }

  const selectedTeams = teams.slice(0, TOTAL_TEAMS);
  const assignments = assignTeamsToSections(selectedTeams);
  let matchesCreated = 0;

  for (const section of SECTIONS) {
    const sectionTeams = assignments[section];
    for (const team of sectionTeams) {
      await client.patch(team._id).set({ section, status: "active" }).commit();
    }

    const fixtures = buildSectionFixtures(sectionTeams, section);
    for (const fixture of fixtures) {
      await client.create({
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

  const existingTournament = await client.fetch(`*[_type == "tournament"][0]`);
  if (existingTournament) {
    await client.patch(existingTournament._id).set({ status: "main_knockout" }).commit();
  } else {
    await client.create({
      _type: "tournament",
      name: "Cricket Championship 2026",
      status: "main_knockout",
      totalTeams: TOTAL_TEAMS,
    });
  }

  console.log(`Created ${matchesCreated} matches. Tournament set to main_knockout.`);
  return matchesCreated;
}

async function run() {
  await deleteAll();
  const imageAssetId = await uploadDummyImage();
  console.log("Hashing password...");
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const credentials = await createTeamsAndCaptains(imageAssetId, passwordHash);
  const matchesCreated = await generateFixtures();

  const lines = [
    "Captain Login Credentials",
    "=========================",
    `Password for ALL captains: ${PASSWORD}`,
    "",
    "Team | Captain | Phone (WhatsApp login)",
    "-----|---------|------------------------",
    ...credentials.map(
      (c) => `${c.team.padEnd(8)} | ${c.captain.padEnd(11)} | ${c.phone}`
    ),
    "",
    `Total teams: ${credentials.length}`,
    `Total matches: ${matchesCreated}`,
  ];

  writeFileSync("credentials.txt", lines.join("\n"), "utf8");
  console.log("\n" + lines.join("\n"));
  console.log("\nSaved to credentials.txt");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
