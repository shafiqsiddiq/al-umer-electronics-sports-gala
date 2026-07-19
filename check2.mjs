import { createClient } from "@sanity/client";
import bcrypt from "bcryptjs";

const c = createClient({
  projectId: "bubodoq1",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token:
    "skKCBPX9mGj0F0ZOFik5hf1IG7gAB35O2JdL1ucWD2ma5kTof82DEfhMUcbiOOEpuOMReOrbFb29XRdbmXJceN3VAOlJBzdANfxWuYY5IL1Ph7rECKdB3tJFewL8ujt2Gd0q8n6myufyhua5ecQBgFA1tfTYN2d1WMRlWNvZsy58gwWERrqN",
});

const stats = await c.fetch(`{
  "teams": count(*[_type=="team"]),
  "captains": count(*[_type=="captain"]),
  "matches": count(*[_type=="match"]),
  "bySection": {
    "A": count(*[_type=="team" && section=="A"]),
    "B": count(*[_type=="team" && section=="B"]),
    "C": count(*[_type=="team" && section=="C"])
  },
  "tournament": *[_type=="tournament"][0]{name,status},
  "sample": *[_type=="captain" && whatsapp=="0300000001"][0]{name,whatsapp,passwordHash,"team":team->name}
}`);

console.log(JSON.stringify(stats, null, 2));

if (stats.sample?.passwordHash) {
  const ok = await bcrypt.compare("123456", stats.sample.passwordHash);
  console.log("Password 123456 valid for Team 1 captain:", ok);
}
