import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "bubodoq1",
  dataset: process.env.SANITY_DATASET || "development",
  apiVersion: "2024-01-01",
  useCdn: false,
  token:
    "skKCBPX9mGj0F0ZOFik5hf1IG7gAB35O2JdL1ucWD2ma5kTof82DEfhMUcbiOOEpuOMReOrbFb29XRdbmXJceN3VAOlJBzdANfxWuYY5IL1Ph7rECKdB3tJFewL8ujt2Gd0q8n6myufyhua5ecQBgFA1tfTYN2d1WMRlWNvZsy58gwWERrqN",
});

console.log(`Clearing dataset: ${client.config().dataset}`);

const BATCH = 50;

async function unsetRefs() {
  const teams = await client.fetch(`*[_type == "team"]._id`);
  const captains = await client.fetch(`*[_type == "captain"]._id`);

  console.log(`Unsetting refs on ${teams.length} teams, ${captains.length} captains...`);

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
}

async function deleteType(type) {
  const ids = await client.fetch(`*[_type == $type]._id`, { type });
  if (ids.length === 0) {
    console.log(`  ${type}: 0`);
    return 0;
  }
  for (let i = 0; i < ids.length; i += BATCH) {
    const batch = ids.slice(i, i + BATCH);
    const tx = client.transaction();
    for (const id of batch) tx.delete(id);
    await tx.commit();
  }
  console.log(`  Deleted ${ids.length} ${type}(s)`);
  return ids.length;
}

async function run() {
  const before = await client.fetch(`{
    "teams": count(*[_type == "team"]),
    "captains": count(*[_type == "captain"]),
    "players": count(*[_type == "player"]),
    "matches": count(*[_type == "match"]),
    "tournaments": count(*[_type == "tournament"])
  }`);
  console.log("Before:", before);

  await unsetRefs();

  for (const type of ["match", "tournament", "player", "captain", "team", "generationLock"]) {
    await deleteType(type);
  }

  const after = await client.fetch(`{
    "teams": count(*[_type == "team"]),
    "captains": count(*[_type == "captain"]),
    "players": count(*[_type == "player"]),
    "matches": count(*[_type == "match"]),
    "tournaments": count(*[_type == "tournament"])
  }`);
  console.log("After:", after);
  console.log("Done. Ready for real team registration.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
