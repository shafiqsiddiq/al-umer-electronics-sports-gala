import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { writeClient } from "@/lib/sanity";
import { buildTopSixteenFixtures, TOP_SIXTEEN } from "@/lib/tournament-logic";
import {
  fetchTopSixteenQualifiers,
  syncTopSixteenQualifierStatuses,
} from "@/lib/top16-qualifiers";

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const action = body?.action || "generate";

    if (action === "clear") {
      return clearTopSixteenFixtures();
    }

    // Prefer match-result qualifiers (survives R16 losses / bad status)
    await syncTopSixteenQualifierStatuses(writeClient);
    const bundle = await fetchTopSixteenQualifiers(writeClient);
    const pool = bundle.teams || [];

    if (pool.length < TOP_SIXTEEN) {
      const b = bundle.breakdown || {};
      return NextResponse.json(
        {
          error: `Need ${TOP_SIXTEEN} qualified teams for Top 16, have ${pool.length} (A:${b.A || 0} B:${b.B || 0} C:${b.C || 0} LoserAB:${b.loserAb || 0} Knockout:${b.knockout || 0}).`,
          breakdown: b,
        },
        { status: 400 }
      );
    }

    const existingFinal = await writeClient.fetch(
      `*[_type == "match" && section == "final"]{
        _id, status, winner, loser
      }`
    );

    if (existingFinal.length > 0 && !body.force) {
      return NextResponse.json(
        {
          error:
            "Top 16 fixtures already exist. Clear fixtures first, or send force: true to rebuild.",
          matchesExisting: existingFinal.length,
        },
        { status: 400 }
      );
    }

    if (existingFinal.length > 0) {
      await undoAndDeleteFinalMatches(existingFinal);
    }

    const teamIds = pool.slice(0, TOP_SIXTEEN).map((t) => t._id);
    const fixtures = buildTopSixteenFixtures(teamIds);

    for (const teamId of teamIds) {
      await writeClient.patch(teamId).set({ status: "final_eight" }).commit();
    }

    let matchesCreated = 0;
    for (const fixture of fixtures) {
      await writeClient.create({
        _type: "match",
        section: "final",
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
        title: `Top 16 ${fixture.bracketType} R${fixture.round} M${fixture.matchNumber}`,
      });
      matchesCreated++;
    }

    const tournament = await writeClient.fetch(`*[_type == "tournament"][0]`);
    if (tournament) {
      await writeClient
        .patch(tournament._id)
        .set({ status: "final_eight" })
        .unset(["champion"])
        .commit();
    }

    return NextResponse.json({
      success: true,
      matchesCreated,
      teams: teamIds.length,
      breakdown: bundle.breakdown,
    });
  } catch (error) {
    console.error("Generate Top 16 error:", error);
    return NextResponse.json(
      { error: error.message || "Failed" },
      { status: 500 }
    );
  }
}

async function clearTopSixteenFixtures() {
  const existingFinal = await writeClient.fetch(
    `*[_type == "match" && section == "final"]{
      _id, status, winner, loser, team1, team2
    }`
  );

  if (existingFinal.length) {
    await undoAndDeleteFinalMatches(existingFinal);
  }

  // Re-qualify from group R2 + pool finals (not only final_eight status —
  // R16 losers were already marked eliminated)
  const sync = await syncTopSixteenQualifierStatuses(writeClient, {
    includeFinalEight: true,
  });

  const tournament = await writeClient.fetch(
    `*[_type == "tournament"][0]{ _id }`
  );
  if (tournament?._id) {
    await writeClient
      .patch(tournament._id)
      .unset(["champion"])
      .set({ status: "active" })
      .commit();
  }

  return NextResponse.json({
    success: true,
    deleted: existingFinal.length,
    restoredTeams: sync.synced,
    patchedStatuses: sync.patched,
  });
}

async function undoAndDeleteFinalMatches(matches) {
  let affected = 0;
  for (const match of matches) {
    const winnerId = match.winner?._ref || match.winner?._id || null;
    const loserId = match.loser?._ref || match.loser?._id || null;
    if (winnerId && loserId) {
      await undoMatchStats(winnerId, loserId);
      affected += 2;
    } else if (winnerId) {
      await undoWinnerOnly(winnerId);
      affected += 1;
    }
  }

  const ids = matches.map((m) => m._id);
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const delTx = writeClient.transaction();
    for (const id of chunk) delTx.delete(id);
    await delTx.commit();
  }

  return affected;
}

async function undoMatchStats(winnerId, loserId) {
  const teams = await writeClient.fetch(
    `*[_type == "team" && _id in $ids]{ _id, wins, losses, points }`,
    { ids: [winnerId, loserId] }
  );
  const byId = Object.fromEntries((teams || []).map((t) => [t._id, t]));

  if (byId[winnerId]) {
    await writeClient
      .patch(winnerId)
      .set({
        wins: Math.max(0, Number(byId[winnerId].wins || 0) - 1),
        points: Math.max(0, Number(byId[winnerId].points || 0) - 2),
      })
      .commit();
  }
  if (byId[loserId]) {
    await writeClient
      .patch(loserId)
      .set({
        losses: Math.max(0, Number(byId[loserId].losses || 0) - 1),
      })
      .commit();
  }
}

async function undoWinnerOnly(winnerId) {
  const team = await writeClient.fetch(
    `*[_type == "team" && _id == $id][0]{ _id, wins, points }`,
    { id: winnerId }
  );
  if (!team) return;
  await writeClient
    .patch(winnerId)
    .set({
      wins: Math.max(0, Number(team.wins || 0) - 1),
      points: Math.max(0, Number(team.points || 0) - 2),
    })
    .commit();
}
