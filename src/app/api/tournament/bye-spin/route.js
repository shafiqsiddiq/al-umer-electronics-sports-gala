import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { writeClient } from "@/lib/sanity";
import {
  isLoserPoolSection,
  poolRoundNeedsByeSpin,
  shuffleArray,
} from "@/lib/tournament-logic";

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

async function checkRoundByeSpin(section, fromRound) {
  const roundMatches = await writeClient.fetch(
    `*[_type == "match" && section == $section && round == $fromRound] | order(matchNumber asc) {
      _id, status, matchNumber,
      winner->{ _id, name, captainName }
    }`,
    { section, fromRound }
  );

  if (!roundMatches.length) {
    return { needsSpinner: false, teams: [] };
  }

  const allDone = roundMatches.every(
    (m) => m.status === "completed" && m.winner?._id
  );
  if (!allDone) {
    return { needsSpinner: false, teams: [] };
  }

  const winners = roundMatches.map((m) => m.winner).filter(Boolean);
  const winnerIds = winners.map((w) => w._id);
  const playRound = fromRound + 1;
  const byeRound = fromRound + 2;

  const playMatches = await writeClient.fetch(
    `*[_type == "match" && section == $section && round == $playRound] | order(matchNumber asc) {
      _id, status, matchNumber, team1, team2,
      team1->{ _id, name }, team2->{ _id, name }
    }`,
    { section, playRound }
  );

  if (!playMatches.length) {
    return { needsSpinner: false, teams: [] };
  }

  if (!poolRoundNeedsByeSpin(winnerIds.length, playMatches.length)) {
    return { needsSpinner: false, teams: [] };
  }

  const byeMatches = await writeClient.fetch(
    `*[_type == "match" && section == $section && round == $byeRound] | order(matchNumber asc) {
      _id, team1, team2, team1->{ _id, name }, team2->{ _id, name }
    }`,
    { section, byeRound }
  );

  const idsInPlay = new Set(
    playMatches
      .flatMap((m) => [m.team1?._ref || m.team1?._id, m.team2?._ref || m.team2?._id])
      .filter(Boolean)
  );
  const idsInBye = new Set(
    byeMatches
      .flatMap((m) => [m.team1?._ref || m.team1?._id, m.team2?._ref || m.team2?._id])
      .filter(Boolean)
  );

  const byeFromWinners = winnerIds.filter(
    (id) => idsInBye.has(id) && !idsInPlay.has(id)
  );
  const slots = playMatches.length * 2;
  const inPlayCount = winnerIds.filter((id) => idsInPlay.has(id)).length;

  if (byeFromWinners.length === 1 && inPlayCount === slots) {
    const byeTeam = winners.find((w) => w._id === byeFromWinners[0]);
    return {
      needsSpinner: false,
      spinDone: true,
      teams: winners,
      byeTeam,
      section,
      fromRound,
      playRound,
      byeRound,
    };
  }

  return {
    needsSpinner: true,
    spinDone: false,
    teams: winners,
    section,
    fromRound,
    playRound,
    byeRound,
    playSlots: slots,
  };
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

    const winnerIds = status.teams.map((t) => t._id);
    if (!winnerIds.includes(byeTeamId)) {
      return NextResponse.json(
        { error: "Bye team must be a winner of this round" },
        { status: 400 }
      );
    }

    const playRound = status.playRound;
    const byeRound = status.byeRound;

    const playMatches = await writeClient.fetch(
      `*[_type == "match" && section == $section && round == $playRound] | order(matchNumber asc) {
        _id, status, team1, team2
      }`,
      { section, playRound }
    );

    if (playMatches.some((m) => m.status === "completed" || m.winner)) {
      return NextResponse.json(
        {
          error:
            "Next round already has results. Reset that round first, then spin again.",
        },
        { status: 400 }
      );
    }

    const byeMatches = await writeClient.fetch(
      `*[_type == "match" && section == $section && round == $byeRound] | order(matchNumber asc) {
        _id, team1, team2
      }`,
      { section, byeRound }
    );

    if (!byeMatches.length) {
      return NextResponse.json(
        { error: `No Round ${byeRound} fixtures for bye placement` },
        { status: 400 }
      );
    }

    const playTeams = shuffleArray(winnerIds.filter((id) => id !== byeTeamId));
    if (playTeams.length !== playMatches.length * 2) {
      return NextResponse.json(
        { error: "Play-round team count mismatch" },
        { status: 400 }
      );
    }

    // Clear + refill play round
    for (let i = 0; i < playMatches.length; i++) {
      await writeClient
        .patch(playMatches[i]._id)
        .set({
          team1: { _type: "reference", _ref: playTeams[i * 2] },
          team2: { _type: "reference", _ref: playTeams[i * 2 + 1] },
        })
        .commit();
    }

    // Clear this bye team from play round if somehow still there (handled by set above)

    // Remove bye team from any bye-round slot first, then place in first empty
    for (const m of byeMatches) {
      const patch = writeClient.patch(m._id);
      let changed = false;
      if (m.team1?._ref === byeTeamId) {
        patch.unset(["team1"]);
        changed = true;
      }
      if (m.team2?._ref === byeTeamId) {
        patch.unset(["team2"]);
        changed = true;
      }
      if (changed) await patch.commit();
    }

    const freshBye = await writeClient.fetch(
      `*[_type == "match" && section == $section && round == $byeRound] | order(matchNumber asc) {
        _id, team1, team2
      }`,
      { section, byeRound }
    );

    let placed = false;
    for (const m of freshBye) {
      if (!m.team1) {
        await writeClient
          .patch(m._id)
          .set({ team1: { _type: "reference", _ref: byeTeamId } })
          .commit();
        placed = true;
        break;
      }
      if (!m.team2) {
        await writeClient
          .patch(m._id)
          .set({ team2: { _type: "reference", _ref: byeTeamId } })
          .commit();
        placed = true;
        break;
      }
    }

    if (!placed) {
      return NextResponse.json(
        { error: `No empty slot in Round ${byeRound} for bye` },
        { status: 400 }
      );
    }

    const byeTeam = status.teams.find((t) => t._id === byeTeamId);

    return NextResponse.json({
      success: true,
      byeTeam,
      playRound,
      byeRound,
      playTeams: playTeams.length,
    });
  } catch (error) {
    console.error("Bye spin error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
