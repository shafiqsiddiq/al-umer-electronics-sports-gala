import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { writeClient } from "@/lib/sanity";
import { TOP_SIXTEEN } from "@/lib/tournament-logic";
import {
  fetchTopSixteenQualifiers,
  syncTopSixteenQualifierStatuses,
} from "@/lib/top16-qualifiers";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
  const sections = {};
  for (const s of ["A", "B", "C"]) {
    const [sectionTeams, matches, qualifiedTeams] = await Promise.all([
      writeClient.fetch(
        `*[_type == "team" && section == $s] | order(name asc) {
          _id, name, village, status, section,
          "entryFeePaid": coalesce(entryFeePaid, 0),
          entryFeeVerified,
          captain->{
            _id, name,
            "profilePictureUrl": profilePicture.asset->url
          }
        }`,
        { s }
      ),
      writeClient.fetch(`count(*[_type == "match" && section == $s])`, { s }),
      writeClient.fetch(
        `*[_type == "team" && section == $s && status in ["qualified_main", "final_eight"]] | order(name asc) {
          _id, name, status, section,
          "wins": coalesce(wins, 0),
          "points": coalesce(points, 0),
          captain->{
            _id, name,
            "profilePictureUrl": profilePicture.asset->url
          }
        }`,
        { s }
      ),
    ]);
    sections[s] = {
      teams: sectionTeams?.length || 0,
      sectionTeams: sectionTeams || [],
      matches,
      qualified: qualifiedTeams?.length || 0,
      qualifiedTeams: qualifiedTeams || [],
    };
  }

  const [
    r1LoserAbRows,
    r1LoserCRows,
    loserQualifiedTeams,
    finalMatches,
    top16Bundle,
  ] = await Promise.all([
    writeClient.fetch(`
      *[_type == "match" && bracketType == "main" && round == 1 && section in ["A","B"] && status == "completed" && defined(loser)] | order(section asc, matchNumber asc) {
        _id, section, matchNumber,
        "team": loser->{ _id, name, section, status }
      }
    `),
    writeClient.fetch(`
      *[_type == "match" && bracketType == "main" && round == 1 && section == "C" && status == "completed" && defined(loser)] | order(matchNumber asc) {
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
    fetchTopSixteenQualifiers(writeClient),
  ]);

  // Repair statuses if Clear / R16 losses left winners as "eliminated"
  const statusOk = await writeClient.fetch(
    `count(*[_type == "team" && status in ["qualified_main", "qualified_loser", "final_eight"]])`
  );
  if ((top16Bundle.count || 0) > statusOk) {
    await syncTopSixteenQualifierStatuses(writeClient);
  }

  function uniqPool(rows) {
    const seen = new Set();
    const out = [];
    for (const row of rows || []) {
      const team = row.team;
      if (!team?._id || seen.has(team._id)) continue;
      seen.add(team._id);
      out.push({
        ...team,
        fromSection: row.section,
        lostMatchNumber: row.matchNumber,
      });
    }
    return out;
  }

  const loserAbPoolTeams = uniqPool(r1LoserAbRows);
  const knockoutFromC = uniqPool(r1LoserCRows);

  const knockoutNewEntries = await writeClient.fetch(`
    *[_type == "team" && (
      section == "knockout" || newEntry == true
    ) && status in ["approved", "active", "pending", "eliminated"]] | order(name asc) {
      _id, name, section, status
    }
  `);

  const knockoutSeen = new Set(knockoutFromC.map((t) => t._id));
  const knockoutPoolTeams = [
    ...knockoutFromC,
    ...(knockoutNewEntries || [])
      .filter((t) => t?._id && !knockoutSeen.has(t._id))
      .map((t) => ({
        ...t,
        fromSection: "knockout",
        lostMatchNumber: null,
      })),
  ];
  const loserPoolTeams = [...loserAbPoolTeams, ...knockoutPoolTeams];

  const top16Teams = top16Bundle.teams || [];

  return NextResponse.json({
    sections,
    loserAb: {
      pool: loserAbPoolTeams.length,
      poolTeams: loserAbPoolTeams,
      expected: 16,
      qualifiers: 2,
    },
    knockout: {
      pool: knockoutPoolTeams.length,
      poolTeams: knockoutPoolTeams,
      expected: 8,
      qualifiers: 2,
    },
    loserBracket: {
      pool: loserPoolTeams.length,
      poolTeams: loserPoolTeams,
      qualified: loserQualifiedTeams?.length || 0,
      qualifiedTeams: loserQualifiedTeams || [],
    },
    finalEight: {
      teams: top16Teams.length,
      matches: finalMatches,
    },
    top8: {
      teams: top16Teams,
      count: top16Teams.length,
      capacity: TOP_SIXTEEN,
      breakdown: top16Bundle.breakdown,
    },
    top16: {
      teams: top16Teams,
      count: top16Teams.length,
      capacity: TOP_SIXTEEN,
      breakdown: top16Bundle.breakdown,
    },
  });
  } catch (err) {
    console.error("brackets GET failed:", err);
    return NextResponse.json(
      {
        error:
          err?.cause?.code === "SELF_SIGNED_CERT_IN_CHAIN" ||
          /self-signed certificate/i.test(String(err?.message || err?.cause || ""))
            ? "Sanity SSL blocked (self-signed cert). Set SANITY_INSECURE_TLS=1 in .env.local and restart npm run dev."
            : err.message || "Failed to load brackets",
      },
      { status: 500 }
    );
  }
}
