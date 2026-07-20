import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { writeClient } from "@/lib/sanity";

function sourceLabel(team) {
  if (team.status === "qualified_loser") return "Loser Pool";
  if (team.section === "A" || team.section === "B" || team.section === "C") {
    return `Section ${team.section}`;
  }
  return "Final Stage";
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sections = {};
  for (const s of ["A", "B", "C"]) {
    const [teams, matches, qualifiedTeams] = await Promise.all([
      writeClient.fetch(`count(*[_type == "team" && section == $s])`, { s }),
      writeClient.fetch(`count(*[_type == "match" && section == $s])`, { s }),
      writeClient.fetch(
        `*[_type == "team" && section == $s && status in ["qualified_main", "final_eight"]] | order(name asc) {
          _id, name, status, section
        }`,
        { s }
      ),
    ]);
    sections[s] = {
      teams,
      matches,
      qualified: qualifiedTeams?.length || 0,
      qualifiedTeams: qualifiedTeams || [],
    };
  }

  // Loser Pool = ONLY Round 1 main-bracket losers (source of truth from matches)
  const [r1LoserRows, loserQualifiedTeams, finalMatches, top8Raw] = await Promise.all([
    writeClient.fetch(`
      *[_type == "match" && bracketType == "main" && round == 1 && status == "completed" && defined(loser)] | order(section asc, matchNumber asc) {
        _id, section, matchNumber,
        "team": loser->{ _id, name, section, status }
      }
    `),
    writeClient.fetch(
      `*[_type == "team" && status == "qualified_loser"] | order(name asc) {
        _id, name, status, section
      }`
    ),
    writeClient.fetch(`count(*[_type == "match" && section == "final"])`),
    writeClient.fetch(
      `*[_type == "team" && status in ["qualified_main", "qualified_loser", "final_eight"]] | order(section asc, name asc) {
        _id, name, status, section,
        "wins": coalesce(wins, 0),
        "points": coalesce(points, 0)
      }`
    ),
  ]);

  // Unique R1 loser teams (dedupe by id)
  const seen = new Set();
  const loserPoolTeams = [];
  for (const row of r1LoserRows || []) {
    const team = row.team;
    if (!team?._id || seen.has(team._id)) continue;
    seen.add(team._id);
    loserPoolTeams.push({
      ...team,
      fromSection: row.section,
      lostMatchNumber: row.matchNumber,
    });
  }

  const top8Teams = (top8Raw || []).map((team) => ({
    ...team,
    source: sourceLabel(team),
  }));

  return NextResponse.json({
    sections,
    loserBracket: {
      pool: loserPoolTeams.length,
      poolTeams: loserPoolTeams,
      qualified: loserQualifiedTeams?.length || 0,
      qualifiedTeams: loserQualifiedTeams || [],
    },
    finalEight: {
      teams: top8Teams.length,
      matches: finalMatches,
    },
    top8: {
      teams: top8Teams,
      count: top8Teams.length,
      capacity: 8,
    },
  });
}
