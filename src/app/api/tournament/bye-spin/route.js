import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { writeClient } from "@/lib/sanity";
import {
  isLoserPoolSection,
  poolRoundNeedsByeSpin,
  shuffleArray,
} from "@/lib/tournament-logic";
import { getPoolBye, setPoolBye, clearPoolBye } from "@/lib/pool-bye";

async function resolveByeSpinForSection(section) {
  if (!isLoserPoolSection(section)) {
    return { needsSpinner: false, teams: [] };
  }

  const rounds = await writeClient.fetch(
    `array::unique(*[_type == "match" && section == $section].round)`,
    { section }
  );
  const sortedRounds = (rounds || []).map(Number).sort((a, b) => a - b);

  for (const fromRound of sortedRounds) {
    const result = await checkRoundByeSpin(section, fromRound);
    if (result.needsSpinner || result.spinDone) {
      return result;
    }
  }

  return { needsSpinner: false, teams: [], section };
}

async function fetchEnteringTeams(section, fromRound) {
  const roundMatches = await writeClient.fetch(
    `*[_type == "match" && section == $section && round == $fromRound] | order(matchNumber asc) {
      _id, status, matchNumber,
      winner->{ _id, name, captainName }
    }`,
    { section, fromRound }
  );

  if (!roundMatches.length) {
    return { allDone: false, winners: [], entering: [], winnerIds: [] };
  }

  const allDone = roundMatches.every(
    (m) => m.status === "completed" && m.winner?._id
  );
  if (!allDone) {
    return { allDone: false, winners: [], entering: [], winnerIds: [] };
  }

  const winners = roundMatches.map((m) => m.winner).filter(Boolean);
  const winnerIds = winners.map((w) => w._id);
  const playRound = fromRound + 1;
  const joinBye = await getPoolBye(section, playRound);

  let joinByeTeam = null;
  if (joinBye?.teamId && !winnerIds.includes(joinBye.teamId)) {
    joinByeTeam = await writeClient.fetch(
      `*[_type == "team" && _id == $id][0]{ _id, name, captainName }`,
      { id: joinBye.teamId }
    );
  }

  const entering = [...winners, ...(joinByeTeam ? [joinByeTeam] : [])];
  return {
    allDone: true,
    winners,
    entering,
    winnerIds,
    playRound,
    joinByeTeamId: joinBye?.teamId || null,
  };
}

async function checkRoundByeSpin(section, fromRound) {
  const {
    allDone,
    entering,
    playRound,
    joinByeTeamId,
  } = await fetchEnteringTeams(section, fromRound);

  if (!allDone || !entering.length) {
    return { needsSpinner: false, teams: [] };
  }

  const enteringIds = entering.map((t) => t._id);
  const byeRound = playRound + 1;

  // Even count → Generate Round (merge join bye in generate-round). No spinner.
  if (enteringIds.length % 2 === 0) {
    return { needsSpinner: false, teams: [] };
  }

  if (enteringIds.length < 3) {
    return { needsSpinner: false, teams: [] };
  }

  const playMatches = await writeClient.fetch(
    `*[_type == "match" && section == $section && round == $playRound] | order(matchNumber asc) {
      _id, status, matchNumber, team1, team2,
      team1->{ _id, name }, team2->{ _id, name }
    }`,
    { section, playRound }
  );

  const deferredBye = await getPoolBye(section, byeRound);

  if (playMatches.length) {
    if (!poolRoundNeedsByeSpin(enteringIds.length, playMatches.length)) {
      // Play round already sized for even subset — check if bye settled
      const slots = playMatches.length * 2;
      const idsInPlay = new Set(
        playMatches
          .flatMap((m) => [
            m.team1?._ref || m.team1?._id,
            m.team2?._ref || m.team2?._id,
          ])
          .filter(Boolean)
      );
      const inPlayCount = enteringIds.filter((id) => idsInPlay.has(id)).length;
      if (deferredBye?.teamId && inPlayCount === slots) {
        const byeTeam = entering.find((t) => t._id === deferredBye.teamId);
        return {
          needsSpinner: false,
          spinDone: true,
          teams: entering,
          byeTeam,
          section,
          fromRound,
          playRound,
          byeRound,
        };
      }
      return { needsSpinner: false, teams: [] };
    }
  }

  return {
    needsSpinner: true,
    spinDone: false,
    mode: playMatches.length ? "refill" : "create_play_round",
    teams: entering,
    section,
    fromRound,
    playRound,
    byeRound,
    playSlots: enteringIds.length - 1,
    joinByeTeamId,
  };
}

async function commitPlayRound(section, playRound, playTeams) {
  const existing = await writeClient.fetch(
    `*[_type == "match" && section == $section && round == $playRound]{ _id, status, winner }`,
    { section, playRound }
  );

  if (existing.some((m) => m.status === "completed" || m.winner)) {
    throw new Error(
      "Next round already has results. Reset that round first, then spin again."
    );
  }

  if (existing.length) {
    const ids = existing.map((m) => m._id);
    for (let i = 0; i < ids.length; i += 50) {
      const chunk = ids.slice(i, i + 50);
      const tx = writeClient.transaction();
      for (const id of chunk) tx.delete(id);
      await tx.commit();
    }
  }

  const matchCount = playTeams.length / 2;
  for (let i = 0; i < matchCount; i += 40) {
    const end = Math.min(i + 40, matchCount);
    const tx = writeClient.transaction();
    for (let m = i; m < end; m++) {
      tx.create({
        _type: "match",
        section,
        bracketType: "loser",
        round: playRound,
        matchNumber: m + 1,
        status: "scheduled",
        team1: { _type: "reference", _ref: playTeams[m * 2] },
        team2: { _type: "reference", _ref: playTeams[m * 2 + 1] },
        title: `${section} R${playRound} M${m + 1}`,
      });
    }
    await tx.commit();
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get("section") || "knockout";
    const data = await resolveByeSpinForSection(section);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { section, fromRound, byeTeamId } = await request.json();

    if (!isLoserPoolSection(section) || !fromRound || !byeTeamId) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const status = await checkRoundByeSpin(section, Number(fromRound));
    if (!status.needsSpinner) {
      return NextResponse.json(
        { error: status.spinDone ? "Bye already assigned" : "No bye spin needed" },
        { status: 400 }
      );
    }

    const enteringIds = status.teams.map((t) => t._id);
    if (!enteringIds.includes(byeTeamId)) {
      return NextResponse.json(
        { error: "Bye team must be in the entering pool for this round" },
        { status: 400 }
      );
    }

    const playRound = status.playRound;
    const byeRound = status.byeRound;
    const playTeams = shuffleArray(
      enteringIds.filter((id) => id !== byeTeamId)
    );

    if (playTeams.length % 2 !== 0 || playTeams.length < 2) {
      return NextResponse.json(
        { error: "Play-round team count invalid after bye" },
        { status: 400 }
      );
    }

    await commitPlayRound(section, playRound, playTeams);

    // Opening / deferred bye into playRound is consumed by this spin
    await clearPoolBye(section, playRound);
    await setPoolBye(section, byeRound, byeTeamId, Number(fromRound));

    const byeTeam = status.teams.find((t) => t._id === byeTeamId);

    return NextResponse.json({
      success: true,
      byeTeam,
      playRound,
      byeRound,
      playTeams: playTeams.length,
      matchesCreated: playTeams.length / 2,
    });
  } catch (error) {
    console.error("Bye spin error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
