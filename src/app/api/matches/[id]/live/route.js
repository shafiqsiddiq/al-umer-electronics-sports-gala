import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { writeClient, client } from "@/lib/sanity";
import {
  createInitialLiveScore,
  applyBall,
  undoLastBall,
  startSecondInnings,
  patchLiveFields,
  scoreSummaryStrings,
  finalizeLiveMatch,
} from "@/lib/live-score";

function parseLive(json) {
  if (!json) return null;
  if (typeof json === "object") return json;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function publicPayload(match, live) {
  return {
    matchId: match._id,
    status: match.status,
    section: match.section,
    round: match.round,
    matchNumber: match.matchNumber,
    team1: match.team1,
    team2: match.team2,
    liveScore: live,
  };
}

async function fetchMatch(id) {
  return writeClient.fetch(
    `*[_type == "match" && _id == $id][0]{
      _id, status, section, round, matchNumber,
      team1Score, team2Score, liveScoreJson,
      team1->{ _id, name },
      team2->{ _id, name }
    }`,
    { id }
  );
}

async function saveLive(id, live, extra = {}) {
  const summary = scoreSummaryStrings(live);
  const patch = {
    liveScoreJson: JSON.stringify(live),
    ...extra,
  };
  if (summary.team1Score) patch.team1Score = summary.team1Score;
  if (summary.team2Score) patch.team2Score = summary.team2Score;
  if (live?.inningsNumber === 1 && live.battingSide === "team1") {
    patch.team1Runs = live.runs;
  } else if (live?.inningsNumber === 1 && live.battingSide === "team2") {
    patch.team2Runs = live.runs;
  } else if (live?.inningsNumber === 2 && live.battingSide === "team1") {
    patch.team1Runs = live.runs;
  } else if (live?.inningsNumber === 2 && live.battingSide === "team2") {
    patch.team2Runs = live.runs;
  }
  await writeClient.patch(id).set(patch).commit();
}

/** Public read for OBS overlay + polling */
export async function GET(_request, { params }) {
  const { id } = await params;
  try {
    const match = await client.fetch(
      `*[_type == "match" && _id == $id][0]{
        _id, status, section, round, matchNumber,
        team1Score, team2Score, liveScoreJson,
        team1->{ _id, name },
        team2->{ _id, name }
      }`,
      { id }
    );
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    return NextResponse.json(publicPayload(match, parseLive(match.liveScoreJson)));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}

/** Admin scorer actions */
export async function POST(request, { params }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const action = body?.action;
    const match = await fetchMatch(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    if (!match.team1?._id || !match.team2?._id) {
      return NextResponse.json({ error: "Both teams required" }, { status: 400 });
    }

    let live = parseLive(match.liveScoreJson);

    if (action === "start") {
      live = createInitialLiveScore({
        team1: match.team1,
        team2: match.team2,
        tossWinnerId: body.tossWinnerId || match.team1._id,
        tossDecision: body.tossDecision || "bat",
        oversLimit: body.oversLimit || 4,
        batsman1Name: body.batsman1Name,
        batsman2Name: body.batsman2Name,
        bowlerName: body.bowlerName,
      });
      await saveLive(id, live, { status: "live" });
      return NextResponse.json(publicPayload({ ...match, status: "live" }, live));
    }

    if (!live) {
      return NextResponse.json(
        { error: "Live scoring not started. Call action: start first." },
        { status: 400 }
      );
    }

    if (action === "ball") {
      live = applyBall(live, {
        type: body.type,
        runs: body.runs,
        newBatsmanName: body.newBatsmanName,
      });
      await saveLive(id, live);
      return NextResponse.json(publicPayload(match, live));
    }

    if (action === "undo") {
      live = undoLastBall(live);
      await saveLive(id, live);
      return NextResponse.json(publicPayload(match, live));
    }

    if (action === "patch") {
      live = patchLiveFields(live, body);
      await saveLive(id, live);
      return NextResponse.json(publicPayload(match, live));
    }

    if (action === "second_innings") {
      live = startSecondInnings(live, {
        batsman1Name: body.batsman1Name,
        batsman2Name: body.batsman2Name,
        bowlerName: body.bowlerName,
      });
      await saveLive(id, live);
      return NextResponse.json(publicPayload(match, live));
    }

    if (action === "end") {
      live = finalizeLiveMatch(live);
      await saveLive(id, live);
      return NextResponse.json(publicPayload(match, live));
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed" }, { status: 400 });
  }
}
