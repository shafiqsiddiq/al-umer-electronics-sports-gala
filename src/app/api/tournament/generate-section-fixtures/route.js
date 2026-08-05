import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { writeClient } from "@/lib/sanity";
import {
  buildSectionFixtures,
  shuffleArray,
  TEAMS_PER_SECTION,
  SECTIONS,
  TOTAL_TEAMS,
} from "@/lib/tournament-logic";

/**
 * Generate or clear Round 1 fixtures for one group (A/B/C).
 * Body: { section: "A"|"B"|"C", force?: boolean, action?: "generate"|"clear" }
 * Uses all teams assigned to that section — entry fee not required.
 */
export async function POST(request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let section = null;
    let force = false;
    let action = "generate";
    try {
      const body = await request.json();
      section = body?.section;
      force = !!body?.force;
      if (body?.action === "clear") action = "clear";
    } catch {
      /* no body */
    }

    if (!SECTIONS.includes(section)) {
      return NextResponse.json(
        { error: "section must be A, B, or C" },
        { status: 400 }
      );
    }

    if (action === "clear") {
      return await clearSectionFixtures(section, force);
    }

    return await generateSectionFixtures(section, force);
  } catch (error) {
    console.error("Generate section fixtures error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate fixtures" },
      { status: 500 }
    );
  }
}

async function deleteMainSectionMatches(section) {
  const existing = await writeClient.fetch(
    `*[_type == "match" && section == $section && bracketType == "main"]._id`,
    { section }
  );
  if (!existing?.length) return 0;

  for (let i = 0; i < existing.length; i += 50) {
    const chunk = existing.slice(i, i + 50);
    const delTx = writeClient.transaction();
    for (const id of chunk) delTx.delete(id);
    await delTx.commit();
  }
  return existing.length;
}

async function clearSectionFixtures(section, force) {
  const existing = await writeClient.fetch(
    `*[_type == "match" && section == $section && bracketType == "main"]{ _id, status }`,
    { section }
  );

  if (!existing?.length) {
    return NextResponse.json({
      success: true,
      cleared: true,
      deleted: 0,
      section,
      message: `Group ${section} has no fixtures to clear`,
    });
  }

  const completed = existing.filter((m) => m.status === "completed").length;
  if (completed > 0 && !force) {
    return NextResponse.json(
      {
        error: `Group ${section} has ${completed} completed match(es). Reset those results first, or confirm force clear.`,
        completed,
      },
      { status: 400 }
    );
  }

  // Also wipe secondary pools if clearing A/B/C R1 entirely
  let deletedPools = 0;
  if (section === "A" || section === "B") {
    deletedPools += await deleteBySection("loser_ab");
    deletedPools += await deleteBySection("loser");
  }
  if (section === "C") {
    deletedPools += await deleteBySection("knockout");
  }

  const deleted = await deleteMainSectionMatches(section);

  return NextResponse.json({
    success: true,
    cleared: true,
    deleted,
    deletedPools,
    section,
  });
}

async function deleteBySection(section) {
  const ids = await writeClient.fetch(
    `*[_type == "match" && section == $section]._id`,
    { section }
  );
  if (!ids?.length) return 0;
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const delTx = writeClient.transaction();
    for (const id of chunk) delTx.delete(id);
    await delTx.commit();
  }
  return ids.length;
}

async function generateSectionFixtures(section, force) {
    const teams = await writeClient.fetch(
      `*[_type == "team" && section == $section] | order(name asc) {
        _id, name, status
      }`,
      { section }
    );

    if (!teams?.length) {
      return NextResponse.json(
        { error: `No teams assigned to Group ${section}` },
        { status: 400 }
      );
    }

    if (teams.length !== TEAMS_PER_SECTION) {
      return NextResponse.json(
        {
          error: `Group ${section} needs exactly ${TEAMS_PER_SECTION} teams to generate fixtures (have ${teams.length}).`,
          teams: teams.length,
          required: TEAMS_PER_SECTION,
        },
        { status: 400 }
      );
    }

    const existing = await writeClient.fetch(
      `*[_type == "match" && section == $section && bracketType == "main"]{ _id, status, round }`,
      { section }
    );

    if (existing?.length) {
      const completed = existing.filter((m) => m.status === "completed").length;
      if (completed > 0 && !force) {
        return NextResponse.json(
          {
            error: `Group ${section} already has completed matches. Clear fixtures (or reset) first, then generate again.`,
            completed,
          },
          { status: 400 }
        );
      }
      if (!force && completed === 0) {
        return NextResponse.json(
          {
            error: `Group ${section} fixtures already exist (${existing.length} matches). Clear fixtures first, then generate.`,
            matches: existing.length,
            skipped: true,
          },
          { status: 400 }
        );
      }

      await deleteMainSectionMatches(section);
    }

    const shuffled = shuffleArray(teams);
    const fixtures = buildSectionFixtures(shuffled, section);

    for (let i = 0; i < fixtures.length; i += 40) {
      const chunk = fixtures.slice(i, i + 40);
      const tx = writeClient.transaction();
      for (const fixture of chunk) {
        tx.create({
          _type: "match",
          section: fixture.section,
          bracketType: fixture.bracketType,
          round: fixture.round,
          matchNumber: fixture.matchNumber,
          status: "scheduled",
          ...(fixture.placeholder ? { placeholder: true } : {}),
          ...(fixture.team1Id
            ? { team1: { _type: "reference", _ref: fixture.team1Id } }
            : {}),
          ...(fixture.team2Id
            ? { team2: { _type: "reference", _ref: fixture.team2Id } }
            : {}),
          title: `Section ${section} R${fixture.round} M${fixture.matchNumber}`,
        });
      }
      await tx.commit();
    }

    const r1Count = fixtures.filter((f) => f.round === 1).length;

    const existingTournament = await writeClient.fetch(
      `*[_type == "tournament"][0]{ _id, status }`
    );
    if (existingTournament?._id) {
      if (
        !existingTournament.status ||
        existingTournament.status === "registration" ||
        existingTournament.status === "upcoming"
      ) {
        await writeClient
          .patch(existingTournament._id)
          .set({ status: "main_knockout" })
          .commit();
      }
    } else {
      await writeClient.create({
        _type: "tournament",
        name: "Cricket Championship 2026",
        status: "main_knockout",
        totalTeams: TOTAL_TEAMS,
      });
    }

    return NextResponse.json({
      success: true,
      section,
      teams: teams.length,
      matchesCreated: fixtures.length,
      round1Matches: r1Count,
    });
}
