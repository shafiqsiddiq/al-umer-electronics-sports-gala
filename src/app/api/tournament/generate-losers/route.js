import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { writeClient } from "@/lib/sanity";
import {
  buildLoserAbFixtures,
  buildKnockoutGroupFixtures,
  SECTION_LOSER_AB,
  SECTION_KNOCKOUT,
  LOSER_AB_EXPECTED,
} from "@/lib/tournament-logic";
import {
  fetchKnockoutPoolIds,
  assertKnockoutPoolReady,
} from "@/lib/knockout-pool";

/**
 * POST body (optional): { pool: "loser_ab" | "knockout" | "both", force?: boolean }
 * Knockout admin rebuild always replaces fixtures from the full current pool
 * (C losers + new entries) so late registrations get Round 1 slots.
 */
export async function POST(request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let pool = "both";
    let force = false;
    try {
      const body = await request.json();
      if (body?.pool) pool = body.pool;
      if (body?.force) force = true;
    } catch {
      /* no body */
    }

    const created = {};

    if (pool === "loser_ab" || pool === "both") {
      created.loserAb = await generateLoserAb(true);
    }
    if (pool === "knockout" || pool === "both") {
      // Admin "Rebuild fixtures" always force-rebuilds from full pool
      created.knockout = await generateKnockout(true, force || pool === "knockout");
    }

    return NextResponse.json({ success: true, created });
  } catch (error) {
    console.error("Generate losers error:", error);
    return NextResponse.json(
      { error: error.message || "Failed" },
      { status: 500 }
    );
  }
}

async function generateLoserAb(replaceExisting) {
  const pending = await writeClient.fetch(`
    count(*[_type == "match" && bracketType == "main" && round == 1 && section in ["A","B"] && status != "completed"])
  `);
  if (pending > 0) {
    throw new Error(
      `Finish all Group A & B Round 1 matches first (${pending} remaining).`
    );
  }

  const losers = await writeClient.fetch(`
    *[_type == "match" && bracketType == "main" && round == 1 && section in ["A","B"] && status == "completed"].loser._ref
  `);
  const uniqueLosers = [...new Set(losers.filter(Boolean))];
  if (uniqueLosers.length !== LOSER_AB_EXPECTED) {
    throw new Error(
      `Need ${LOSER_AB_EXPECTED} A+B Round 1 losers, have ${uniqueLosers.length}.`
    );
  }

  const existing = await writeClient.fetch(
    `*[_type == "match" && section == $section]._id`,
    { section: SECTION_LOSER_AB }
  );
  if (existing.length > 0) {
    if (!replaceExisting) return { skipped: true, reason: "already exists" };
    const delTx = writeClient.transaction();
    for (const id of existing) delTx.delete(id);
    await delTx.commit();
  }

  const fixtures = buildLoserAbFixtures(uniqueLosers);
  await commitFixtures(fixtures, "Loser AB");

  const tournament = await writeClient.fetch(`*[_type == "tournament"][0]._id`);
  if (tournament) {
    await writeClient.patch(tournament).set({ status: "loser_bracket" }).commit();
  }

  return { matchesCreated: fixtures.length, teams: uniqueLosers.length };
}

/**
 * @param {boolean} replaceExisting
 * @param {boolean} force - Admin rebuild: delete all KO matches even if results exist
 */
async function generateKnockout(replaceExisting, force = false) {
  const pending = await writeClient.fetch(`
    count(*[_type == "match" && bracketType == "main" && round == 1 && section == "C" && status != "completed"])
  `);
  if (pending > 0) {
    throw new Error(
      `Finish all Group C Round 1 matches first (${pending} remaining).`
    );
  }

  const { losers: uniqueLosers, newEntries, pool } = await fetchKnockoutPoolIds();
  assertKnockoutPoolReady(uniqueLosers.length, pool.length);

  const existing = await writeClient.fetch(
    `*[_type == "match" && section == $section]{ _id, status, round, team1, team2 }`,
    { section: SECTION_KNOCKOUT }
  );

  if (existing.length > 0) {
    const completed = existing.filter((m) => m.status === "completed").length;

    if (completed > 0 && !force) {
      return {
        skipped: true,
        reason:
          "Knockout already has results. Reset Knockout Round 1 first, then Rebuild.",
        teams: pool.length,
        completed,
      };
    }

    const r1TeamIds = new Set();
    for (const m of existing) {
      if (Number(m.round) !== 1) continue;
      if (m.team1?._ref) r1TeamIds.add(m.team1._ref);
      if (m.team2?._ref) r1TeamIds.add(m.team2._ref);
    }
    const poolGrew = pool.some((id) => !r1TeamIds.has(id));
    const coverageShort = r1TeamIds.size < pool.length;
    const needsRebuild = force || poolGrew || coverageShort;

    if (!needsRebuild) {
      return {
        skipped: true,
        reason: "already covers full pool",
        teams: pool.length,
        round1Teams: r1TeamIds.size,
        round1Matches: existing.filter((m) => Number(m.round) === 1).length,
      };
    }

    // Delete in chunks — large brackets can exceed one transaction
    const ids = existing.map((m) => m._id);
    for (let i = 0; i < ids.length; i += 50) {
      const chunk = ids.slice(i, i + 50);
      const delTx = writeClient.transaction();
      for (const id of chunk) delTx.delete(id);
      await delTx.commit();
    }
  }

  const fixtures = buildKnockoutGroupFixtures(pool);
  await commitFixtures(fixtures, "Knockout");

  const r1 = fixtures.filter((f) => f.round === 1);
  const r1TeamIds = new Set();
  for (const f of r1) {
    if (f.team1Id) r1TeamIds.add(f.team1Id);
    if (f.team2Id) r1TeamIds.add(f.team2Id);
  }

  // Odd leftover is seeded as bye into R2 — count that too
  const expectedCovered = pool.length;
  if (r1TeamIds.size < expectedCovered && pool.length % 2 === 0) {
    throw new Error(
      `Fixture build failed: pool ${pool.length} but Round 1 only paired ${r1TeamIds.size}.`
    );
  }
  if (pool.length % 2 === 1 && r1TeamIds.size !== pool.length - 1) {
    throw new Error(
      `Fixture build failed: odd pool ${pool.length} should pair ${pool.length - 1} in Round 1.`
    );
  }

  const tournament = await writeClient.fetch(`*[_type == "tournament"][0]._id`);
  if (tournament) {
    await writeClient.patch(tournament).set({ status: "loser_bracket" }).commit();
  }

  return {
    matchesCreated: fixtures.length,
    teams: pool.length,
    round1Matches: r1.length,
    round1Teams: r1TeamIds.size,
    newEntries: newEntries.length,
    cLosers: uniqueLosers.length,
    rebuilt: true,
  };
}

async function commitFixtures(fixtures, label) {
  // Chunk creates — Sanity transactions have mutation limits
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
        title: `${label} R${fixture.round} M${fixture.matchNumber}`,
      });
    }
    await tx.commit();
  }
}
