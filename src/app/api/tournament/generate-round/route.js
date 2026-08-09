import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { writeClient } from "@/lib/sanity";
import {
  buildNextRoundFixtures,
  SECTIONS,
  SECTION_LOSER_AB,
  SECTION_KNOCKOUT,
  MAIN_QUALIFIERS_PER_SECTION,
  LOSER_AB_QUALIFIERS,
  KNOCKOUT_QUALIFIERS,
} from "@/lib/tournament-logic";
import { getPoolBye, clearPoolBye } from "@/lib/pool-bye";

/**
 * Generate the next round from previous-round winners.
 * Body: { section: "A"|"B"|"C"|"loser_ab"|"knockout", round: number, force?: boolean }
 * round = the round TO create (e.g. 2 after Round 1 is complete).
 */
export async function POST(request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const section = String(body?.section || "").trim();
    const round = Number(body?.round);
    const force = !!body?.force;

    const allowed = [...SECTIONS, SECTION_LOSER_AB, "loser", SECTION_KNOCKOUT];
    if (!allowed.includes(section)) {
      return NextResponse.json({ error: "Invalid section" }, { status: 400 });
    }
    if (!Number.isFinite(round) || round < 2) {
      return NextResponse.json(
        { error: "round must be 2 or higher (Round 1 uses Generate fixtures)" },
        { status: 400 }
      );
    }

    const sectionFilter =
      section === "loser_ab" || section === "loser"
        ? `section in ["loser_ab", "loser"]`
        : `section == $section`;
    const bracketType = SECTIONS.includes(section) ? "main" : "loser";
    const prevRound = round - 1;

    const prevMatches = await writeClient.fetch(
      `*[
        _type == "match" &&
        ${sectionFilter} &&
        round == $prevRound
      ] | order(matchNumber asc) {
        _id, matchNumber, status,
        "winnerId": winner._ref,
        winner->{ _id, name }
      }`,
      { section, prevRound }
    );

    if (!prevMatches?.length) {
      return NextResponse.json(
        { error: `No Round ${prevRound} matches found. Generate Round ${prevRound} first.` },
        { status: 400 }
      );
    }

    const incomplete = prevMatches.filter(
      (m) => m.status !== "completed" || !m.winnerId
    );
    if (incomplete.length > 0) {
      return NextResponse.json(
        {
          error: `Finish all Round ${prevRound} matches first (${incomplete.length} remaining).`,
          remaining: incomplete.length,
        },
        { status: 400 }
      );
    }

    let winnerIds = prevMatches.map((m) => m.winnerId).filter(Boolean);

    // Deferred bye into this round (opening bye or spinner bye)
    const storeSectionEarly =
      section === "loser" ? SECTION_LOSER_AB : section;
    if (!SECTIONS.includes(section)) {
      const joinBye = await getPoolBye(storeSectionEarly, round);
      if (joinBye?.teamId && !winnerIds.includes(joinBye.teamId)) {
        winnerIds = [...winnerIds, joinBye.teamId];
      }
    }

    if (winnerIds.length % 2 === 1) {
      return NextResponse.json(
        {
          error: `Odd teams entering Round ${round} (${winnerIds.length}) — use bye spinner first, then generate.`,
          winners: winnerIds.length,
          needsByeSpin: true,
        },
        { status: 400 }
      );
    }

    const qualifiers = SECTIONS.includes(section)
      ? MAIN_QUALIFIERS_PER_SECTION
      : section === SECTION_KNOCKOUT
        ? KNOCKOUT_QUALIFIERS
        : LOSER_AB_QUALIFIERS;

    if (winnerIds.length <= qualifiers && !SECTIONS.includes(section)) {
      return NextResponse.json(
        {
          error: `Only ${winnerIds.length} teams left — they already qualify (target ${qualifiers}). No Round ${round} needed.`,
        },
        { status: 400 }
      );
    }

    // Groups: R2 is last (8 → 4 qualifiers). Don't allow R3+.
    if (SECTIONS.includes(section) && round > 2) {
      return NextResponse.json(
        { error: "Group stages only have Round 1 and Round 2." },
        { status: 400 }
      );
    }

    const existing = await writeClient.fetch(
      `*[
        _type == "match" &&
        ${sectionFilter} &&
        round == $round
      ]{ _id, status }`,
      { section, round }
    );

    if (existing?.length) {
      const hasResults = existing.some(
        (m) => m.status === "completed" || m.status === "live"
      );
      if (hasResults && !force) {
        return NextResponse.json(
          {
            error: `Round ${round} already has results. Reset that round first.`,
          },
          { status: 400 }
        );
      }
      if (!force) {
        return NextResponse.json(
          {
            error: `Round ${round} fixtures already exist. Clear/reset them first, or force rebuild.`,
            matches: existing.length,
          },
          { status: 400 }
        );
      }
      for (let i = 0; i < existing.length; i += 50) {
        const chunk = existing.slice(i, i + 50);
        const tx = writeClient.transaction();
        for (const m of chunk) tx.delete(m._id);
        await tx.commit();
      }
    }

    // Also remove any later rounds so bracket stays consistent
    const later = await writeClient.fetch(
      `*[
        _type == "match" &&
        ${sectionFilter} &&
        round > $round
      ]._id`,
      { section, round }
    );
    if (later?.length) {
      for (let i = 0; i < later.length; i += 50) {
        const chunk = later.slice(i, i + 50);
        const tx = writeClient.transaction();
        for (const id of chunk) tx.delete(id);
        await tx.commit();
      }
    }

    const storeSection =
      section === "loser" ? SECTION_LOSER_AB : section;
    const fixtures = buildNextRoundFixtures(winnerIds, {
      section: storeSection,
      bracketType,
      round,
    });

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
          team1: { _type: "reference", _ref: fixture.team1Id },
          team2: { _type: "reference", _ref: fixture.team2Id },
          title: `${storeSection} R${fixture.round} M${fixture.matchNumber}`,
        });
      }
      await tx.commit();
    }

    if (!SECTIONS.includes(section)) {
      await clearPoolBye(storeSection, round);
    }

    return NextResponse.json({
      success: true,
      section: storeSection,
      round,
      matchesCreated: fixtures.length,
      teams: winnerIds.length,
    });
  } catch (error) {
    console.error("Generate round error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate round" },
      { status: 500 }
    );
  }
}
