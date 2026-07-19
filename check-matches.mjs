import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "bubodoq1",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: "skKCBPX9mGj0F0ZOFik5hf1IG7gAB35O2JdL1ucWD2ma5kTof82DEfhMUcbiOOEpuOMReOrbFb29XRdbmXJceN3VAOlJBzdANfxWuYY5IL1Ph7rECKdB3tJFewL8ujt2Gd0q8n6myufyhua5ecQBgFA1tfTYN2d1WMRlWNvZsy58gwWERrqN",
});

async function run() {
  const matches = await client.fetch(`*[_type == "match" && section == "A" && round == 1] | order(matchNumber asc) { _id, title, matchNumber, "t1": team1->name, "t2": team2->name }`);
  console.log(`Found ${matches.length} matches in Section A Round 1`);
  matches.forEach(m => {
    console.log(`[${m._id}] Match ${m.matchNumber}: ${m.t1} vs ${m.t2}`);
  });
}
run().catch(console.error);
