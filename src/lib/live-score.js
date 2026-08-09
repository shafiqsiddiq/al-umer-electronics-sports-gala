/** Ball-by-ball live score helpers (4-over default). */

export const DEFAULT_OVERS_LIMIT = 4;

export function teamShort(name = "") {
  const clean = String(name)
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (!clean.length) return "TBD";
  if (clean.length === 1) return clean[0].slice(0, 3).toUpperCase();
  return clean
    .slice(0, 3)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function ballsToOvers(balls = 0) {
  const b = Math.max(0, Number(balls) || 0);
  return `${Math.floor(b / 6)}.${b % 6}`;
}

export function formatScoreLine(runs, wickets) {
  return `${Number(runs) || 0}-${Number(wickets) || 0}`;
}

export function formatBowlerFigures(bowler = {}) {
  const w = Number(bowler.wickets) || 0;
  const r = Number(bowler.runs) || 0;
  const overs = ballsToOvers(bowler.balls || 0);
  return `${w}-${r} ${overs}`;
}

export function createInitialLiveScore({
  team1,
  team2,
  tossWinnerId,
  tossDecision = "bat",
  oversLimit = DEFAULT_OVERS_LIMIT,
  batsman1Name = "Batsman 1",
  batsman2Name = "Batsman 2",
  bowlerName = "Bowler",
}) {
  const t1 = team1 || {};
  const t2 = team2 || {};
  const tossWinner =
    tossWinnerId === t2._id ? t2 : tossWinnerId === t1._id ? t1 : t1;
  const battingSide =
    tossDecision === "bowl"
      ? tossWinner._id === t1._id
        ? "team2"
        : "team1"
      : tossWinner._id === t1._id
        ? "team1"
        : "team2";

  const tossShort = teamShort(tossWinner.name);
  const tossText = `TOSS ${tossShort} (${tossDecision === "bowl" ? "BOWL" : "BAT"})`;

  return {
    oversLimit: Number(oversLimit) || DEFAULT_OVERS_LIMIT,
    inningsNumber: 1,
    battingSide,
    tossWinnerId: tossWinner._id || null,
    tossDecision: tossDecision === "bowl" ? "bowl" : "bat",
    tossText,
    runs: 0,
    wickets: 0,
    balls: 0,
    target: null,
    batsman1: {
      name: String(batsman1Name || "Batsman 1").trim() || "Batsman 1",
      runs: 0,
      balls: 0,
      onStrike: true,
    },
    batsman2: {
      name: String(batsman2Name || "Batsman 2").trim() || "Batsman 2",
      runs: 0,
      balls: 0,
      onStrike: false,
    },
    bowler: {
      name: String(bowlerName || "Bowler").trim() || "Bowler",
      runs: 0,
      wickets: 0,
      balls: 0,
    },
    thisOver: [],
    team1Short: teamShort(t1.name),
    team2Short: teamShort(t2.name),
    team1Name: t1.name || "Team 1",
    team2Name: t2.name || "Team 2",
    team1Id: t1._id || null,
    team2Id: t2._id || null,
    innings1: null,
    status: "live",
    events: [],
    updatedAt: new Date().toISOString(),
  };
}

function cloneScore(live) {
  return JSON.parse(JSON.stringify(live));
}

function rotateStrike(live) {
  const a = live.batsman1;
  const b = live.batsman2;
  a.onStrike = !a.onStrike;
  b.onStrike = !b.onStrike;
}

function onStrikeBatsman(live) {
  return live.batsman1.onStrike ? live.batsman1 : live.batsman2;
}

function legalBallsInOver(thisOver = []) {
  return thisOver.filter((x) => {
    const s = String(x);
    return !s.startsWith("Wd") && !s.startsWith("Nb");
  }).length;
}

export function remainingBallsInOver(thisOver = []) {
  return Math.max(0, 6 - legalBallsInOver(thisOver));
}

/**
 * @param {object} live
 * @param {{ type: string, runs?: number, newBatsmanName?: string }} ball
 */
export function applyBall(live, ball) {
  if (!live || live.status !== "live") {
    throw new Error("Match is not live");
  }

  const next = cloneScore(live);
  // New over after previous over completed
  if (next._overJustEnded || legalBallsInOver(next.thisOver) >= 6) {
    next.thisOver = [];
    next._overJustEnded = false;
  }

  const type = ball?.type;
  const extraRuns = Math.max(0, Number(ball?.runs) || 0);
  const snapshot = {
    runs: next.runs,
    wickets: next.wickets,
    balls: next.balls,
    thisOver: [...(next.thisOver || [])],
    batsman1: { ...next.batsman1 },
    batsman2: { ...next.batsman2 },
    bowler: { ...next.bowler },
    _overJustEnded: Boolean(live._overJustEnded),
  };

  if (type === "run") {
    const runs = Math.min(6, Math.max(0, extraRuns));
    const label = String(runs);
    next.runs += runs;
    next.balls += 1;
    next.bowler.runs += runs;
    next.bowler.balls += 1;
    const bat = onStrikeBatsman(next);
    bat.runs += runs;
    bat.balls += 1;
    next.thisOver = [...(next.thisOver || []), label];
    if (runs % 2 === 1) rotateStrike(next);
  } else if (type === "wide") {
    const runs = 1 + extraRuns;
    next.runs += runs;
    next.bowler.runs += runs;
    next.thisOver = [...(next.thisOver || []), extraRuns ? `Wd+${extraRuns}` : "Wd"];
  } else if (type === "noball") {
    const runs = 1 + extraRuns;
    next.runs += runs;
    next.bowler.runs += runs;
    const bat = onStrikeBatsman(next);
    if (extraRuns > 0) {
      bat.runs += extraRuns;
      // bat does not face a legal ball on no-ball in simplified scoring
    }
    next.thisOver = [...(next.thisOver || []), extraRuns ? `Nb+${extraRuns}` : "Nb"];
    if (extraRuns % 2 === 1) rotateStrike(next);
  } else if (type === "wicket") {
    next.wickets += 1;
    next.balls += 1;
    next.bowler.wickets += 1;
    next.bowler.balls += 1;
    const bat = onStrikeBatsman(next);
    bat.balls += 1;
    next.thisOver = [...(next.thisOver || []), "W"];
    const name = String(ball?.newBatsmanName || "").trim();
    if (!name) throw new Error("New batsman name required after wicket");
    if (next.wickets >= 10) {
      // all out handled below
    } else {
      bat.name = name;
      bat.runs = 0;
      bat.balls = 0;
    }
  } else if (type === "bye" || type === "legbye") {
    const runs = Math.max(1, extraRuns || 1);
    next.runs += runs;
    next.balls += 1;
    next.bowler.balls += 1;
    const bat = onStrikeBatsman(next);
    bat.balls += 1;
    next.thisOver = [
      ...(next.thisOver || []),
      type === "bye" ? `B${runs}` : `Lb${runs}`,
    ];
    if (runs % 2 === 1) rotateStrike(next);
  } else {
    throw new Error("Unknown ball type");
  }

  // Mark over complete — clear strip on next legal/extra after 6 (keep last over visible until next ball)
  if (legalBallsInOver(next.thisOver) >= 6) {
    rotateStrike(next);
    next._overJustEnded = true;
  }

  const maxBalls = (next.oversLimit || DEFAULT_OVERS_LIMIT) * 6;
  const inningsDone = next.balls >= maxBalls || next.wickets >= 10;

  next.events = [...(next.events || []), { type, runs: extraRuns, at: Date.now(), snapshot }];
  if (next.events.length > 80) next.events = next.events.slice(-80);

  next.updatedAt = new Date().toISOString();

  if (inningsDone) {
    next.status = next.inningsNumber === 1 ? "innings_break" : "ended";
  }

  return next;
}

export function undoLastBall(live) {
  if (!live?.events?.length) throw new Error("Nothing to undo");
  const next = cloneScore(live);
  const last = next.events.pop();
  const s = last.snapshot;
  next.runs = s.runs;
  next.wickets = s.wickets;
  next.balls = s.balls;
  next.thisOver = s.thisOver || [];
  next.batsman1 = s.batsman1;
  next.batsman2 = s.batsman2;
  next.bowler = s.bowler;
  next._overJustEnded = Boolean(s._overJustEnded);
  next.status = "live";
  next.updatedAt = new Date().toISOString();
  return next;
}

export function startSecondInnings(live, { batsman1Name, batsman2Name, bowlerName } = {}) {
  if (!live || live.status !== "innings_break") {
    throw new Error("First innings is not finished");
  }
  const next = cloneScore(live);
  next.innings1 = {
    side: next.battingSide,
    runs: next.runs,
    wickets: next.wickets,
    balls: next.balls,
  };
  next.target = next.runs + 1;
  next.battingSide = next.battingSide === "team1" ? "team2" : "team1";
  next.inningsNumber = 2;
  next.runs = 0;
  next.wickets = 0;
  next.balls = 0;
  next.thisOver = [];
  next.batsman1 = {
    name: String(batsman1Name || "Batsman 1").trim() || "Batsman 1",
    runs: 0,
    balls: 0,
    onStrike: true,
  };
  next.batsman2 = {
    name: String(batsman2Name || "Batsman 2").trim() || "Batsman 2",
    runs: 0,
    balls: 0,
    onStrike: false,
  };
  next.bowler = {
    name: String(bowlerName || "Bowler").trim() || "Bowler",
    runs: 0,
    wickets: 0,
    balls: 0,
  };
  next.status = "live";
  next.events = [];
  next.updatedAt = new Date().toISOString();
  return next;
}

export function patchLiveFields(live, fields = {}) {
  const next = cloneScore(live || {});
  const str = (v, fallback) => {
    if (v === undefined) return fallback;
    return String(v).trim() || fallback;
  };
  if (fields.batsman1Name !== undefined) next.batsman1.name = str(fields.batsman1Name, next.batsman1.name);
  if (fields.batsman2Name !== undefined) next.batsman2.name = str(fields.batsman2Name, next.batsman2.name);
  if (fields.bowlerName !== undefined) next.bowler.name = str(fields.bowlerName, next.bowler.name);
  if (fields.swapStrike) rotateStrike(next);
  if (fields.runs !== undefined) next.runs = Math.max(0, Number(fields.runs) || 0);
  if (fields.wickets !== undefined) next.wickets = Math.min(10, Math.max(0, Number(fields.wickets) || 0));
  if (fields.balls !== undefined) next.balls = Math.max(0, Number(fields.balls) || 0);
  next.updatedAt = new Date().toISOString();
  return next;
}

export function battingTeamName(live) {
  if (!live) return "";
  return live.battingSide === "team2" ? live.team2Name : live.team1Name;
}

export function bowlingTeamName(live) {
  if (!live) return "";
  return live.battingSide === "team2" ? live.team1Name : live.team2Name;
}

export function battingShort(live) {
  if (!live) return "";
  return live.battingSide === "team2" ? live.team2Short : live.team1Short;
}

export function bowlingShort(live) {
  if (!live) return "";
  return live.battingSide === "team2" ? live.team1Short : live.team2Short;
}

export function matchupLabel(live) {
  if (!live) return "";
  const a = (live.team1Name || "").split(/\s+/)[0] || live.team1Short;
  const b = (live.team2Name || "").split(/\s+/)[0] || live.team2Short;
  return `${a} v ${b}`;
}

export function scoreSummaryStrings(live) {
  if (!live) return { team1Score: null, team2Score: null };
  const fmt = (runs, wickets, balls) =>
    `${formatScoreLine(runs, wickets)} (${ballsToOvers(balls)})`;

  let team1Score = null;
  let team2Score = null;

  if (live.innings1) {
    if (live.innings1.side === "team1") {
      team1Score = fmt(live.innings1.runs, live.innings1.wickets, live.innings1.balls);
    } else {
      team2Score = fmt(live.innings1.runs, live.innings1.wickets, live.innings1.balls);
    }
  }

  const current = fmt(live.runs, live.wickets, live.balls);
  if (live.battingSide === "team1") team1Score = current;
  else team2Score = current;

  return { team1Score, team2Score };
}
