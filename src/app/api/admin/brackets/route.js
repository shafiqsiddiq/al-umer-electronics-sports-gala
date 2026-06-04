import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { writeClient } from "@/lib/sanity";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sections = {};
  for (const s of ["A", "B", "C"]) {
    const [teams, matches, qualified] = await Promise.all([
      writeClient.fetch(`count(*[_type == "team" && section == $s])`, { s }),
      writeClient.fetch(`count(*[_type == "match" && section == $s])`, { s }),
      writeClient.fetch(`count(*[_type == "team" && section == $s && status == "qualified_main"])`, { s }),
    ]);
    sections[s] = { teams, matches, qualified };
  }

  const [loserPool, loserQualified, finalTeams, finalMatches] = await Promise.all([
    writeClient.fetch(`count(*[_type == "team" && status == "eliminated" && defined(loserBracketPool) == false])`),
    writeClient.fetch(`count(*[_type == "team" && status == "qualified_loser"])`),
    writeClient.fetch(`count(*[_type == "team" && status in ["qualified_main", "qualified_loser", "final_eight"]])`),
    writeClient.fetch(`count(*[_type == "match" && section == "final"])`),
  ]);

  return NextResponse.json({
    sections,
    loserBracket: { pool: loserPool, qualified: loserQualified },
    finalEight: { teams: finalTeams, matches: finalMatches },
  });
}
