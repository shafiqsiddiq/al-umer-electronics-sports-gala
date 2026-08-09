import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { writeClient } from "@/lib/sanity";
import {
  SECTION_LOSER_AB,
  SECTION_KNOCKOUT,
} from "@/lib/tournament-logic";

const MATCH_QUERY = `*[_type == "match" && _id == $id][0]{
  _id, section, round, matchNumber, bracketType, status,
  team1Score, team2Score, venue, scheduledAt,
  team1->{
    _id, name, section,
    captain->{ _id, name, "profilePictureUrl": profilePicture.asset->url }
  },
  team2->{
    _id, name, section,
    captain->{ _id, name, "profilePictureUrl": profilePicture.asset->url }
  },
  winner->{ _id, name },
  loser->{ _id, name }
}`;

/**
 * POST — reset a single match result (keep teams).
 * Undoes W/L/pts, clears scores, removes winner from later-round slots
 * when those later matches are not yet completed.
 */
export async function POST(_request, { params }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const match = await writeClient.fetch(
      `*[_type == "match" && _id == $id][0]{
        _id, section, round, matchNumber, bracketType, status,
        team1Score, team2Score,
        "team1Id": team1._ref,
        "team2Id": team2._ref,
        "winnerId": winner._ref,
        "loserId": loser._ref
      }`,
      { id }
    );

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const hadResult =
      Boolean(match.winnerId) ||
      match.status === "completed" ||
      match.status === "live" ||
      match.team1Score != null ||
      match.team2Score != null;

    if (!hadResult) {
      return NextResponse.json(
        { error: "This match has no result to reset" },
        { status: 400 }
      );
    }

    // Block if winner already played (completed) a later match — avoid orphaned results
    if (match.winnerId) {
      const laterCompleted = await writeClient.fetch(
        `count(*[
          _type == "match" &&
          _id != $id &&
          section == $section &&
          round > $round &&
          status == "completed" &&
          (team1._ref == $wid || team2._ref == $wid || winner._ref == $wid)
        ])`,
        {
          id,
          section: match.section,
          round: Number(match.round),
          wid: match.winnerId,
        }
      );
      if (laterCompleted > 0) {
        return NextResponse.json(
          {
            error:
              "Winner already has a completed later-round match. Reset that round first, then reset this match.",
          },
          { status: 400 }
        );
      }
    }

    if (match.winnerId && match.loserId) {
      await undoMatchStats(match.winnerId, match.loserId);
    } else if (match.winnerId) {
      await undoWinnerOnly(match.winnerId);
    }

    // Clear winner/loser from later-round team slots (placeholders)
    const laterSlots = await writeClient.fetch(
      `*[
        _type == "match" &&
        _id != $id &&
        section == $section &&
        round > $round &&
        status != "completed" &&
        (
          team1._ref in $ids ||
          team2._ref in $ids
        )
      ]{
        _id,
        "team1Id": team1._ref,
        "team2Id": team2._ref
      }`,
      {
        id,
        section: match.section,
        round: Number(match.round),
        ids: [match.winnerId, match.loserId].filter(Boolean),
      }
    );

    let clearedSlots = 0;
    for (const other of laterSlots || []) {
      const patch = writeClient.patch(other._id);
      let changed = false;
      if (
        match.winnerId &&
        (other.team1Id === match.winnerId || other.team2Id === match.winnerId)
      ) {
        if (other.team1Id === match.winnerId) {
          patch.unset(["team1"]);
          changed = true;
        }
        if (other.team2Id === match.winnerId) {
          patch.unset(["team2"]);
          changed = true;
        }
      }
      if (
        match.loserId &&
        (other.team1Id === match.loserId || other.team2Id === match.loserId)
      ) {
        // Losers usually go to secondary pools — only clear if same section slot
        if (other.team1Id === match.loserId) {
          patch.unset(["team1"]);
          changed = true;
        }
        if (other.team2Id === match.loserId) {
          patch.unset(["team2"]);
          changed = true;
        }
      }
      if (changed) {
        await patch
          .set({ status: "scheduled" })
          .unset([
            "winner",
            "loser",
            "team1Score",
            "team2Score",
            "team1Runs",
            "team2Runs",
          ])
          .commit();
        clearedSlots += 1;
      }
    }

    await writeClient
      .patch(id)
      .set({ status: "scheduled" })
      .unset([
        "winner",
        "loser",
        "team1Score",
        "team2Score",
        "team1Runs",
        "team2Runs",
        "liveInnings",
        "liveBalls",
        "liveSummary",
      ])
      .commit();

    const affected = [match.winnerId, match.loserId, match.team1Id, match.team2Id]
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i);

    for (const teamId of affected) {
      await recomputeTeamStatus(teamId);
    }

    if (
      ["A", "B", "C"].includes(match.section) &&
      Number(match.round) >= 2
    ) {
      await clearSectionMainQualifiers(match.section);
    }

    const updated = await writeClient.fetch(MATCH_QUERY, { id });
    return NextResponse.json({
      success: true,
      match: updated,
      clearedSlots,
      affectedTeams: affected.length,
    });
  } catch (error) {
    console.error("Reset single match error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reset match" },
      { status: 500 }
    );
  }
}

async function undoMatchStats(winnerId, loserId) {
  const teams = await writeClient.fetch(
    `*[_type == "team" && _id in $ids]{ _id, wins, losses, points }`,
    { ids: [winnerId, loserId] }
  );
  const byId = Object.fromEntries((teams || []).map((t) => [t._id, t]));

  const winner = byId[winnerId];
  if (winner) {
    await writeClient
      .patch(winnerId)
      .set({
        wins: Math.max(0, Number(winner.wins || 0) - 1),
        points: Math.max(0, Number(winner.points || 0) - 2),
      })
      .commit();
  }

  const loser = byId[loserId];
  if (loser) {
    await writeClient
      .patch(loserId)
      .set({
        losses: Math.max(0, Number(loser.losses || 0) - 1),
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

async function recomputeTeamStatus(teamId) {
  const team = await writeClient.fetch(
    `*[_type == "team" && _id == $id][0]{ _id, status }`,
    { id: teamId }
  );
  if (!team) return;
  if (["pending", "approved"].includes(team.status)) return;

  const results = await writeClient.fetch(
    `*[
      _type == "match" &&
      status == "completed" &&
      (winner._ref == $id || loser._ref == $id)
    ]{
      section, round, bracketType,
      "isWinner": winner._ref == $id,
      "isLoser": loser._ref == $id
    }`,
    { id: teamId }
  );

  const wins = (results || []).filter((m) => m.isWinner);
  const losses = (results || []).filter((m) => m.isLoser);

  const isChampion = wins.some(
    (m) =>
      m.section === "final" &&
      (m.bracketType === "final" || Number(m.round) === 4)
  );
  const isQualifiedMain = wins.some(
    (m) => m.bracketType === "main" && Number(m.round) >= 2
  );
  const isQualifiedLoser =
    wins.some(
      (m) =>
        (m.section === SECTION_LOSER_AB || m.section === "loser") &&
        Number(m.round) >= 3
    ) ||
    wins.some(
      (m) => m.section === SECTION_KNOCKOUT && Number(m.round) >= 2
    );

  const lostMainR1 = losses.some(
    (m) => m.bracketType === "main" && Number(m.round) === 1
  );
  const lostEliminating = losses.some(
    (m) =>
      (m.bracketType === "main" && Number(m.round) >= 2) ||
      m.bracketType === "loser" ||
      m.section === SECTION_LOSER_AB ||
      m.section === SECTION_KNOCKOUT ||
      ["round16", "quarter", "semi"].includes(m.bracketType)
  );

  let nextStatus = "active";
  let loserBracketEligible = false;

  if (isChampion) nextStatus = "champion";
  else if (isQualifiedMain) nextStatus = "qualified_main";
  else if (isQualifiedLoser) nextStatus = "qualified_loser";
  else if (lostEliminating || lostMainR1) {
    nextStatus = "eliminated";
    loserBracketEligible = lostMainR1 && !lostEliminating;
  }

  await writeClient
    .patch(teamId)
    .set({ status: nextStatus, loserBracketEligible })
    .commit();
}

async function clearSectionMainQualifiers(section) {
  const teams = await writeClient.fetch(
    `*[_type == "team" && section == $section && status in ["qualified_main", "final_eight"]]{
      _id
    }`,
    { section }
  );

  for (const team of teams || []) {
    const stillR2Winner = await writeClient.fetch(
      `count(*[
        _type == "match" &&
        section == $section &&
        round == 2 &&
        status == "completed" &&
        winner._ref == $id
      ])`,
      { section, id: team._id }
    );
    if (stillR2Winner === 0) {
      await recomputeTeamStatus(team._id);
    }
  }
}
