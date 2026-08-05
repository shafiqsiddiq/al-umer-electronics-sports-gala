import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { writeClient } from "@/lib/sanity";
import {
  getNextMainMatchQuery,
  getLoserAbNextMatch,
  getKnockoutNextMatch,
  getFinalNextMatch,
  buildLoserAbFixtures,
  buildKnockoutGroupFixtures,
  SECTION_LOSER_AB,
  SECTION_KNOCKOUT,
  LOSER_AB_EXPECTED,
  KNOCKOUT_BASE_EXPECTED,
  isLoserPoolSection,
  poolRoundNeedsByeSpin,
} from "@/lib/tournament-logic";
import { fetchKnockoutPoolIds } from "@/lib/knockout-pool";

export async function POST(request, { params }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { team1Score, team2Score, team1Runs, team2Runs, winnerId, status } =
      await request.json();

    if (!winnerId) {
      return NextResponse.json({ error: "Winner must be selected" }, { status: 400 });
    }

    const match = await writeClient.fetch(
      `*[_type == "match" && _id == $id][0]{
        _id, section, round, matchNumber, bracketType, status,
        team1Score, team2Score,
        team1->{ _id, name }, team2->{ _id, name },
        winner->{ _id, name },
        loser->{ _id, name }
      }`,
      { id }
    );

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 400 });
    }

    if (!match.team1?._id || !match.team2?._id) {
      return NextResponse.json(
        { error: "Both teams must be set before saving a result" },
        { status: 400 }
      );
    }

    if (
      winnerId !== match.team1._id &&
      winnerId !== match.team2._id
    ) {
      return NextResponse.json(
        { error: "Winner must be one of the two teams" },
        { status: 400 }
      );
    }

    const alreadyCompleted =
      match.status === "completed" && Boolean(match.winner?._id);

    if (alreadyCompleted) {
      const result = await correctCompletedMatch(match, {
        team1Score,
        team2Score,
        winnerId,
        status: status || "completed",
      });
      if (result?.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, corrected: true });
    }

    const loserId =
      match.team1._id === winnerId ? match.team2._id : match.team1._id;

    await writeClient
      .patch(id)
      .set({
        team1Score,
        team2Score,
        winner: { _type: "reference", _ref: winnerId },
        loser: { _type: "reference", _ref: loserId },
        status: status || "completed",
      })
      .commit();

    await writeClient
      .patch(winnerId)
      .setIfMissing({ wins: 0, losses: 0, points: 0 })
      .inc({ wins: 1, points: 2 })
      .commit();

    await writeClient
      .patch(loserId)
      .setIfMissing({ wins: 0, losses: 0, points: 0 })
      .inc({ losses: 1 })
      .commit();

    let byeSpin = null;
    if ((status || "completed") === "completed") {
      await advanceWinner(match, winnerId);
      await handleLoser(match, loserId);
      byeSpin = await detectPoolByeSpin(match);
    }

    return NextResponse.json({ success: true, byeSpin });
  } catch (error) {
    console.error("Score update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update score" },
      { status: 500 }
    );
  }
}

/**
 * Fix a wrong winner/score on an already-completed match.
 * Swaps advancement slots and recomputes team statuses.
 */
async function correctCompletedMatch(match, { team1Score, team2Score, winnerId }) {
  const oldWinnerId = match.winner._id;
  const oldLoserId =
    match.loser?._id ||
    (match.team1._id === oldWinnerId ? match.team2._id : match.team1._id);
  const newLoserId =
    match.team1._id === winnerId ? match.team2._id : match.team1._id;

  const nextMatch = await fetchNextMatchDoc(match);
  if (nextMatch && (nextMatch.status === "completed" || nextMatch.winner)) {
    return {
      error:
        "Next round match already has a result. Reset that round first, then change this winner.",
    };
  }

  // R1 correction: loser pools must not have completed games with the old loser
  if (match.bracketType === "main" && Number(match.round) === 1) {
    const poolBlock = await loserPoolCompletedWithTeam(oldLoserId, match.section);
    if (poolBlock) {
      return {
        error:
          "This Round 1 loser already played in Loser AB / Knockout. Reset that pool (or Round 1) first.",
      };
    }
  }

  // Same winner — only scores change
  if (oldWinnerId === winnerId) {
    await writeClient
      .patch(match._id)
      .set({
        team1Score,
        team2Score,
        winner: { _type: "reference", _ref: winnerId },
        loser: { _type: "reference", _ref: newLoserId },
        status: "completed",
      })
      .commit();
    return { success: true };
  }

  await undoTeamStats(oldWinnerId, oldLoserId);

  if (nextMatch) {
    await swapTeamRef(nextMatch._id, oldWinnerId, winnerId);
  }

  if (match.bracketType === "main" && Number(match.round) === 1) {
    await swapLoserInSecondaryPools(oldLoserId, newLoserId, match.section);
  }

  await writeClient
    .patch(match._id)
    .set({
      team1Score,
      team2Score,
      winner: { _type: "reference", _ref: winnerId },
      loser: { _type: "reference", _ref: newLoserId },
      status: "completed",
    })
    .commit();

  await writeClient
    .patch(winnerId)
    .setIfMissing({ wins: 0, losses: 0, points: 0 })
    .inc({ wins: 1, points: 2 })
    .commit();

  await writeClient
    .patch(newLoserId)
    .setIfMissing({ wins: 0, losses: 0, points: 0 })
    .inc({ losses: 1 })
    .commit();

  // Place / qualify new winner (no-op if slot already swapped)
  await advanceWinner(match, winnerId);
  await handleLoser(match, newLoserId);

  // Grand final champion swap
  if (
    match.section === "final" &&
    (match.bracketType === "final" || Number(match.round) === 4)
  ) {
    const tournament = await writeClient.fetch(
      `*[_type == "tournament"][0]{ _id }`
    );
    if (tournament?._id) {
      await writeClient
        .patch(tournament._id)
        .set({
          status: "completed",
          champion: { _type: "reference", _ref: winnerId },
        })
        .commit();
    }
  }

  const touched = new Set([
    oldWinnerId,
    oldLoserId,
    winnerId,
    newLoserId,
  ]);
  for (const teamId of touched) {
    await recomputeTeamStatus(teamId);
  }

  return { success: true };
}

async function fetchNextMatchDoc(match) {
  const next = await getNextMatchTarget(match);
  if (!next) return null;
  return writeClient.fetch(
    `*[_type == "match" && section == $section && bracketType == $bracketType && round == $round && matchNumber == $matchNumber] | order(_createdAt asc)[0]{
      _id, team1, team2, status, winner
    }`,
    {
      section: match.section,
      bracketType: next.bracketType || match.bracketType,
      round: next.round,
      matchNumber: next.matchNumber,
    }
  );
}

async function swapTeamRef(matchId, fromId, toId) {
  const doc = await writeClient.fetch(
    `*[_type == "match" && _id == $id][0]{ team1, team2 }`,
    { id: matchId }
  );
  if (!doc) return;

  const patch = writeClient.patch(matchId);
  let changed = false;
  if (doc.team1?._ref === fromId) {
    patch.set({ team1: { _type: "reference", _ref: toId } });
    changed = true;
  }
  if (doc.team2?._ref === fromId) {
    patch.set({ team2: { _type: "reference", _ref: toId } });
    changed = true;
  }
  if (changed) await patch.commit();
}

async function loserPoolCompletedWithTeam(teamId, mainSection) {
  const poolSections =
    mainSection === "C"
      ? [SECTION_KNOCKOUT]
      : [SECTION_LOSER_AB, "loser"];

  const count = await writeClient.fetch(
    `count(*[
      _type == "match" &&
      section in $sections &&
      status == "completed" &&
      (team1._ref == $id || team2._ref == $id || winner._ref == $id || loser._ref == $id)
    ])`,
    { sections: poolSections, id: teamId }
  );
  return count > 0;
}

async function swapLoserInSecondaryPools(oldLoserId, newLoserId, mainSection) {
  const poolSections =
    mainSection === "C"
      ? [SECTION_KNOCKOUT]
      : [SECTION_LOSER_AB, "loser"];

  const matches = await writeClient.fetch(
    `*[
      _type == "match" &&
      section in $sections &&
      status != "completed" &&
      (team1._ref == $oldId || team2._ref == $oldId)
    ]{ _id, team1, team2 }`,
    { sections: poolSections, oldId: oldLoserId }
  );

  for (const m of matches || []) {
    await swapTeamRef(m._id, oldLoserId, newLoserId);
  }
}

async function undoTeamStats(winnerId, loserId) {
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

/**
 * Loser AB / Knockout: fill next-round empty slots in order.
 * If the round ends with an odd leftover (no slot), bye-spin API assigns the bye.
 */
async function advancePoolWinner(match, winnerId) {
  const playRound = Number(match.round) + 1;
  const playMatches = await writeClient.fetch(
    `*[_type == "match" && section == $section && round == $playRound] | order(matchNumber asc) {
      _id, team1, team2
    }`,
    { section: match.section, playRound }
  );

  if (!playMatches.length) {
    await writeClient.patch(winnerId).set({ status: "qualified_loser" }).commit();
    return;
  }

  const alreadyLater = await writeClient.fetch(
    `count(*[_type == "match" && section == $section && round > $round && (team1._ref == $id || team2._ref == $id)])`,
    { section: match.section, round: Number(match.round), id: winnerId }
  );
  if (alreadyLater > 0) return;

  for (const m of playMatches) {
    if (m.team1?._ref === winnerId || m.team2?._ref === winnerId) return;
  }

  for (const m of playMatches) {
    if (!m.team1) {
      await writeClient
        .patch(m._id)
        .set({ team1: { _type: "reference", _ref: winnerId } })
        .commit();
      return;
    }
    if (!m.team2) {
      await writeClient
        .patch(m._id)
        .set({ team2: { _type: "reference", _ref: winnerId } })
        .commit();
      return;
    }
  }
  // No empty slot — odd leftover waits for bye spinner
}

async function detectPoolByeSpin(match) {
  if (!isLoserPoolSection(match.section) && match.bracketType !== "loser") {
    return null;
  }

  const fromRound = Number(match.round);
  const roundMatches = await writeClient.fetch(
    `*[_type == "match" && section == $section && round == $fromRound] | order(matchNumber asc) {
      status, winner->{ _id, name, captainName }
    }`,
    { section: match.section, fromRound }
  );

  if (
    !roundMatches.length ||
    !roundMatches.every((m) => m.status === "completed" && m.winner?._id)
  ) {
    return null;
  }

  const winners = roundMatches.map((m) => m.winner).filter(Boolean);
  const playRound = fromRound + 1;
  const playCount = await writeClient.fetch(
    `count(*[_type == "match" && section == $section && round == $playRound])`,
    { section: match.section, playRound }
  );

  if (!poolRoundNeedsByeSpin(winners.length, playCount)) {
    return null;
  }

  // Confirm bye not already settled
  const byeRound = playRound + 1;
  const playMatches = await writeClient.fetch(
    `*[_type == "match" && section == $section && round == $playRound]{ team1, team2 }`,
    { section: match.section, playRound }
  );
  const byeMatches = await writeClient.fetch(
    `*[_type == "match" && section == $section && round == $byeRound]{ team1, team2 }`,
    { section: match.section, byeRound }
  );
  const winnerIds = winners.map((w) => w._id);
  const idsInPlay = new Set(
    playMatches.flatMap((m) => [m.team1?._ref, m.team2?._ref]).filter(Boolean)
  );
  const idsInBye = new Set(
    byeMatches.flatMap((m) => [m.team1?._ref, m.team2?._ref]).filter(Boolean)
  );
  const byeSettled = winnerIds.some(
    (id) => idsInBye.has(id) && !idsInPlay.has(id)
  );
  if (byeSettled && winnerIds.filter((id) => idsInPlay.has(id)).length === playCount * 2) {
    return null;
  }

  return {
    needsSpinner: true,
    section: match.section,
    fromRound,
    playRound,
    byeRound,
    teams: winners,
  };
}

async function advanceWinner(match, winnerId) {
  if (isLoserPoolSection(match.section) || match.bracketType === "loser") {
    await advancePoolWinner(match, winnerId);
    return;
  }

  const next = await getNextMatchTarget(match);
  if (!next) {
    // Main group qualifying round → Top 16 pool
    if (match.bracketType === "main") {
      await writeClient.patch(winnerId).set({ status: "qualified_main" }).commit();
      return;
    }

    // Grand final
    if (
      match.section === "final" &&
      (match.bracketType === "final" || match.round === 4)
    ) {
      await writeClient.patch(winnerId).set({ status: "champion" }).commit();
      const tournament = await writeClient.fetch(`*[_type == "tournament"][0]._id`);
      if (tournament) {
        await writeClient
          .patch(tournament)
          .set({
            status: "completed",
            champion: { _type: "reference", _ref: winnerId },
          })
          .commit();
      }
    }
    return;
  }

  const nextMatch = await writeClient.fetch(
    `*[_type == "match" && section == $section && bracketType == $bracketType && round == $round && matchNumber == $matchNumber] | order(_createdAt asc)[0]{
      _id, team1, team2
    }`,
    {
      section: match.section,
      bracketType: next.bracketType || match.bracketType,
      round: next.round,
      matchNumber: next.matchNumber,
    }
  );

  if (!nextMatch) return;

  if (
    nextMatch.team1?._ref === winnerId ||
    nextMatch.team2?._ref === winnerId
  ) {
    return;
  }

  const patch = writeClient.patch(nextMatch._id);
  if (!nextMatch.team1) {
    patch.set({ team1: { _type: "reference", _ref: winnerId } });
  } else if (!nextMatch.team2) {
    patch.set({ team2: { _type: "reference", _ref: winnerId } });
  }
  await patch.commit();
}

async function handleLoser(match, loserId) {
  if (match.bracketType === "main" && match.round === 1) {
    await writeClient
      .patch(loserId)
      .set({ status: "eliminated", loserBracketEligible: true })
      .commit();

    // Phased pools: A+B → Loser AB; C → Knockout
    if (match.section === "A" || match.section === "B") {
      await maybeGenerateLoserAb();
    } else if (match.section === "C") {
      await maybeGenerateKnockout();
    }
    return;
  }

  if (
    match.bracketType === "main" ||
    match.bracketType === "loser" ||
    match.bracketType === "round16" ||
    match.bracketType === "quarter" ||
    match.bracketType === "semi"
  ) {
    await writeClient
      .patch(loserId)
      .set({ status: "eliminated", loserBracketEligible: false })
      .commit();
  }
}

async function getNextMatchTarget(match) {
  if (match.bracketType === "main") {
    return getNextMainMatchQuery(match.section, match.round, match.matchNumber);
  }
  if (match.section === SECTION_LOSER_AB) {
    return getLoserAbNextMatch(match.round, match.matchNumber);
  }
  if (match.section === SECTION_KNOCKOUT) {
    const startSize = await writeClient.fetch(
      `count(*[_type == "match" && section == $section && round == 1]) * 2`,
      { section: SECTION_KNOCKOUT }
    );
    return getKnockoutNextMatch(
      match.round,
      match.matchNumber,
      startSize || KNOCKOUT_BASE_EXPECTED
    );
  }
  if (match.section === "loser" || match.bracketType === "loser") {
    return getLoserAbNextMatch(match.round, match.matchNumber);
  }
  if (["round16", "quarter", "semi", "final"].includes(match.bracketType)) {
    return getFinalNextMatch(match.bracketType, match.matchNumber);
  }
  return null;
}

async function maybeGenerateLoserAb() {
  // Wait until all A+B Round 1 matches are completed
  const pending = await writeClient.fetch(`
    count(*[_type == "match" && bracketType == "main" && round == 1 && section in ["A","B"] && status != "completed"])
  `);
  if (pending > 0) return;

  const existing = await writeClient.fetch(
    `count(*[_type == "match" && section == $section])`,
    { section: SECTION_LOSER_AB }
  );
  if (existing > 0) return;

  const lockId = "lock.loserAbGeneration";
  try {
    await writeClient.create({
      _id: lockId,
      _type: "generationLock",
      createdAt: new Date().toISOString(),
    });
  } catch {
    return;
  }

  try {
    const stillEmpty = await writeClient.fetch(
      `count(*[_type == "match" && section == $section])`,
      { section: SECTION_LOSER_AB }
    );
    if (stillEmpty > 0) return;

    const losers = await writeClient.fetch(`
      *[_type == "match" && bracketType == "main" && round == 1 && section in ["A","B"] && status == "completed"].loser._ref
    `);
    const uniqueLosers = [...new Set(losers.filter(Boolean))];
    if (uniqueLosers.length !== LOSER_AB_EXPECTED) return;

    const fixtures = buildLoserAbFixtures(uniqueLosers);
    await createPoolMatches(fixtures, "Loser AB");

    const tournament = await writeClient.fetch(`*[_type == "tournament"][0]._id`);
    if (tournament) {
      await writeClient
        .patch(tournament)
        .set({ status: "loser_bracket" })
        .commit();
    }
  } finally {
    try {
      await writeClient.delete(lockId);
    } catch {
      /* ignore */
    }
  }
}

async function maybeGenerateKnockout() {
  const pending = await writeClient.fetch(`
    count(*[_type == "match" && bracketType == "main" && round == 1 && section == "C" && status != "completed"])
  `);
  if (pending > 0) return;

  const { losers: uniqueLosers, pool } = await fetchKnockoutPoolIds();
  if (uniqueLosers.length < KNOCKOUT_BASE_EXPECTED) return;
  if (pool.length < 2) return;

  const existing = await writeClient.fetch(
    `*[_type == "match" && section == $section]{ _id, status, round, team1, team2 }`,
    { section: SECTION_KNOCKOUT }
  );

  const completed = (existing || []).filter((m) => m.status === "completed").length;
  if (completed > 0) return;

  let needsBuild = !existing?.length;
  if (existing?.length > 0) {
    const r1TeamIds = new Set();
    for (const m of existing) {
      if (Number(m.round) !== 1) continue;
      if (m.team1?._ref) r1TeamIds.add(m.team1._ref);
      if (m.team2?._ref) r1TeamIds.add(m.team2._ref);
    }
    const poolGrew = pool.some((id) => !r1TeamIds.has(id));
    needsBuild = poolGrew || r1TeamIds.size < pool.length;
  }
  if (!needsBuild) return;

  const lockId = "lock.knockoutGeneration";
  try {
    await writeClient.create({
      _id: lockId,
      _type: "generationLock",
      createdAt: new Date().toISOString(),
    });
  } catch {
    return;
  }

  try {
    // Re-check under lock
    const latest = await writeClient.fetch(
      `*[_type == "match" && section == $section]{ _id, status, round, team1, team2 }`,
      { section: SECTION_KNOCKOUT }
    );
    if ((latest || []).some((m) => m.status === "completed")) return;

    if (latest?.length) {
      const ids = latest.map((m) => m._id);
      for (let i = 0; i < ids.length; i += 50) {
        const chunk = ids.slice(i, i + 50);
        const delTx = writeClient.transaction();
        for (const id of chunk) delTx.delete(id);
        await delTx.commit();
      }
    }

    const fixtures = buildKnockoutGroupFixtures(pool);
    await createPoolMatches(fixtures, "Knockout");

    const tournament = await writeClient.fetch(`*[_type == "tournament"][0]._id`);
    if (tournament) {
      await writeClient
        .patch(tournament)
        .set({ status: "loser_bracket" })
        .commit();
    }
  } finally {
    try {
      await writeClient.delete(lockId);
    } catch {
      /* ignore */
    }
  }
}

async function createPoolMatches(fixtures, label) {
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
