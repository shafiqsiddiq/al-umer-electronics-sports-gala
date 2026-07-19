import { createClient } from "@sanity/client";
import { writeFileSync } from "fs";

const client = createClient({
  projectId: "bubodoq1",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token:
    "skKCBPX9mGj0F0ZOFik5hf1IG7gAB35O2JdL1ucWD2ma5kTof82DEfhMUcbiOOEpuOMReOrbFb29XRdbmXJceN3VAOlJBzdANfxWuYY5IL1Ph7rECKdB3tJFewL8ujt2Gd0q8n6myufyhua5ecQBgFA1tfTYN2d1WMRlWNvZsy58gwWERrqN",
});

// 11-digit: 03001000001 … 03001000048
function phoneFor(i) {
  return `0300${String(1000000 + i).padStart(7, "0")}`;
}

const captains = await client.fetch(
  `*[_type=="captain"]|order(name asc){ _id, name, "team": team->name }`
);

console.log(`Updating ${captains.length} captain phone numbers...`);
const credentials = [];

for (let i = 0; i < captains.length; i++) {
  const n = i + 1;
  const phone = phoneFor(n);
  const cap = captains.find((c) => c.name === `Captain ${n}`) || captains[i];
  await client.patch(cap._id).set({ phone, whatsapp: phone }).commit();
  credentials.push({
    team: cap.team || `Team ${n}`,
    captain: cap.name,
    phone,
    password: "123456",
  });
  if ((i + 1) % 12 === 0) console.log(`  Updated ${i + 1}/${captains.length}`);
}

const lines = [
  "Captain Login Credentials",
  "=========================",
  "Password for ALL captains: 123456",
  "",
  "Team | Captain | Phone (WhatsApp login)",
  "-----|---------|------------------------",
  ...credentials.map(
    (c) => `${String(c.team).padEnd(8)} | ${String(c.captain).padEnd(11)} | ${c.phone}`
  ),
  "",
  `Total teams: ${credentials.length}`,
];

writeFileSync("credentials.txt", lines.join("\n"), "utf8");
console.log("\n" + lines.join("\n"));
console.log("\nSaved to credentials.txt");
