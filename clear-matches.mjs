import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "bubodoq1",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: "skKCBPX9mGj0F0ZOFik5hf1IG7gAB35O2JdL1ucWD2ma5kTof82DEfhMUcbiOOEpuOMReOrbFb29XRdbmXJceN3VAOlJBzdANfxWuYY5IL1Ph7rECKdB3tJFewL8ujt2Gd0q8n6myufyhua5ecQBgFA1tfTYN2d1WMRlWNvZsy58gwWERrqN",
});

async function run() {
  const matches = await client.fetch(`*[_type == "match"]._id`);
  console.log(`Found ${matches.length} matches. Deleting...`);
  const tx = client.transaction();
  for (const id of matches) {
    tx.delete(id);
  }
  await tx.commit();
  console.log("Deleted all matches.");
}
run().catch(console.error);
