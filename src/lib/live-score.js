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

function emptyBatsman(name, onStrike = false) {
  return {
    name: String(name || "Batsman").trim() || "Batsman",
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    onStrike: Boolean(onStrike),
  };
}

function emptyBowler(name) {
  return {
    name: String(name || "Bowler").trim() || "Bowler",
    runs: 0,
    wickets: 0,
    balls: 0,
  };
}

function ensureBatter(b, onStrikeFallback = false) {
  return {
    name: b?.name || "Batsman",
    runs: Number(b?.runs) || 0,
    balls: Number(b?.balls) || 0,
    fours: Number(b?.fours) || 0,
    sixes: Number(b?.sixes) || 0,
    onStrike: b?.onStrike ?? onStrikeFallback,
  };
}

function ensureBowler(b) {
  return {
    name: b?.name || "Bowler",
    runs: Number(b?.runs) || 0,
    wickets: Number(b?.wickets) || 0,
    balls: Number(b?.balls) || 0,
  };
}

function addBoundary(bat, runs) {
  if (runs === 4) bat.fours = (Number(bat.fours) || 0) + 1;
  if (runs === 6) bat.sixes = (Number(bat.sixes) || 0) + 1;
}

function archiveBowler(live) {
  const cur = ensureBowler(live.bowler);
  if (!cur.name) return;
  if (!cur.balls && !cur.runs && !cur.wickets) return;
  const list = Array.isArray(live.bowlingCard) ? [...live.bowlingCard] : [];
  list.push({ ...cur });
  live.bowlingCard = list;
}

function startBowler(live, name) {
  const n = String(name || "").trim();
  if (!n) throw new Error("Enter the new bowler name");
  const list = Array.isArray(live.bowlingCard) ? [...live.bowlingCard] : [];
  const idx = list.findIndex(
    (b) => String(b.name || "").trim().toLowerCase() === n.toLowerCase()
  );
  if (idx >= 0) {
    const prev = ensureBowler(list[idx]);
    list.splice(idx, 1);
    live.bowlingCard = list;
    live.bowler = prev;
  } else {
    live.bowler = emptyBowler(n);
  }
}

/** Chase text: "23 runs needed from 10 balls" */
export function chaseNeeded(live) {
  if (!live || !live.target || live.inningsNumber !== 2) return null;
  const target = Number(live.target) || 0;
  const runs = Number(live.runs) || 0;
  const balls = Number(live.balls) || 0;
  const maxBalls = (Number(live.oversLimit) || DEFAULT_OVERS_LIMIT) * 6;
  const needed = Math.max(0, target - runs);
  const ballsLeft = Math.max(0, maxBalls - balls);
  const result = live.result || (live.status === "ended" ? computeMatchResult(live) : null);
  if (live.status === "ended" && result?.text) return result.text;
  if (needed <= 0) return "Target achieved";
  if (ballsLeft <= 0) return `${needed} run${needed === 1 ? "" : "s"} short`;
  return `${needed} run${needed === 1 ? "" : "s"} needed from ${ballsLeft} ball${ballsLeft === 1 ? "" : "s"}`;
}

function sideName(live, side) {
  return side === "team2" ? live.team2Name : live.team1Name;
}

function sideShort(live, side) {
  return side === "team2" ? live.team2Short : live.team1Short;
}

function sideId(live, side) {
  return side === "team2" ? live.team2Id : live.team1Id;
}

function closeInningsCards(next) {
  if (next._cardsClosed) return;
  if (next.wickets < 10) {
    const nos = [];
    for (const bat of [next.batsman1, next.batsman2]) {
      if (bat?.name) {
        nos.push({
          name: bat.name,
          runs: Number(bat.runs) || 0,
          balls: Number(bat.balls) || 0,
          fours: Number(bat.fours) || 0,
          sixes: Number(bat.sixes) || 0,
          how: "not out",
        });
      }
    }
    next.battingCard = [...(next.battingCard || []), ...nos];
  }
  archiveBowler(next);
  next._cardsClosed = true;
  next._overJustEnded = false;
}

/** Winner + margin once 2nd innings is decided */
export function computeMatchResult(live) {
  if (!live?.innings1 || live.inningsNumber !== 2) return null;
  const target = Number(live.target) || 0;
  const runs = Number(live.runs) || 0;
  const wickets = Number(live.wickets) || 0;
  const maxBalls = (Number(live.oversLimit) || DEFAULT_OVERS_LIMIT) * 6;
  const balls = Number(live.balls) || 0;
  const chased = target > 0 && runs >= target;
  const inningsComplete =
    live.status === "ended" ||
    chased ||
    balls >= maxBalls ||
    wickets >= 10;
  if (!inningsComplete) return null;

  const chasingSide = live.battingSide;
  const defendingSide = chasingSide === "team1" ? "team2" : "team1";

  if (chased) {
    const wktsLeft = Math.max(0, 10 - wickets);
    return {
      winnerSide: chasingSide,
      winnerId: sideId(live, chasingSide),
      winnerName: sideName(live, chasingSide),
      winnerShort: sideShort(live, chasingSide),
      isTie: false,
      margin: `won by ${wktsLeft} wicket${wktsLeft === 1 ? "" : "s"}`,
      text: `${sideName(live, chasingSide)} won by ${wktsLeft} wicket${wktsLeft === 1 ? "" : "s"}`,
    };
  }

  const byRuns = Math.max(0, (Number(live.innings1.runs) || 0) - runs);
  if (byRuns === 0) {
    return {
      winnerSide: null,
      winnerId: null,
      winnerName: null,
      winnerShort: null,
      isTie: true,
      margin: "Match tied",
      text: "Match tied",
    };
  }
  return {
    winnerSide: defendingSide,
    winnerId: sideId(live, defendingSide),
    winnerName: sideName(live, defendingSide),
    winnerShort: sideShort(live, defendingSide),
    isTie: false,
    margin: `won by ${byRuns} run${byRuns === 1 ? "" : "s"}`,
    text: `${sideName(live, defendingSide)} won by ${byRuns} run${byRuns === 1 ? "" : "s"}`,
  };
}

export function matchResult(live) {
  if (!live) return null;
  if (live.result?.text) return live.result;
  return computeMatchResult(live);
}

function snapshotInnings2(next) {
  next.innings2 = {
    side: next.battingSide,
    runs: next.runs,
    wickets: next.wickets,
    balls: next.balls,
    battingCard: next.battingCard || [],
    bowlingCard: next.bowlingCard || [],
  };
}

function sealSecondInnings(next) {
  closeInningsCards(next);
  snapshotInnings2(next);
  next.status = "ended";
  next.result = computeMatchResult(next);
}

/** Manual end from admin — close cards + set winner if possible */
export function finalizeLiveMatch(live) {
  const next = cloneScore(live || {});
  next.batsman1 = ensureBatter(next.batsman1, true);
  next.batsman2 = ensureBatter(next.batsman2, false);
  next.bowler = ensureBowler(next.bowler);
  next.battingCard = Array.isArray(next.battingCard) ? next.battingCard : [];
  next.bowlingCard = Array.isArray(next.bowlingCard) ? next.bowlingCard : [];

  if (next.status === "live") {
    if (next.inningsNumber === 2) {
      sealSecondInnings(next);
    } else {
      closeInningsCards(next);
      next.status = "innings_break";
    }
  } else if (next.status === "innings_break") {
    // Force-end without 2nd innings — 1st batting team wins by default
    next.status = "ended";
    next.result = {
      winnerSide: next.battingSide,
      winnerId: sideId(next, next.battingSide),
      winnerName: sideName(next, next.battingSide),
      winnerShort: sideShort(next, next.battingSide),
      isTie: false,
      margin: "won (2nd innings not played)",
      text: `${sideName(next, next.battingSide)} won (2nd innings not played)`,
    };
  } else if (next.status === "ended" && !next.result) {
    if (next.inningsNumber === 2 && !next.innings2) snapshotInnings2(next);
    next.result = computeMatchResult(next);
  }

  next.updatedAt = new Date().toISOString();
  return next;
}

/** Both innings for summary UI */
export function matchInningsSummaries(live) {
  if (!live) return [];
  const fmt = (inn) =>
    inn
      ? `${formatScoreLine(inn.runs, inn.wickets)} (${ballsToOvers(inn.balls)})`
      : null;

  const list = [];
  if (live.innings1) {
    list.push({
      label: "1st innings",
      side: live.innings1.side,
      teamName: sideName(live, live.innings1.side),
      teamShort: sideShort(live, live.innings1.side),
      scoreLine: fmt(live.innings1),
      battingCard: live.innings1.battingCard || [],
      bowlingCard: live.innings1.bowlingCard || [],
    });
  }
  if (live.innings2) {
    list.push({
      label: "2nd innings",
      side: live.innings2.side,
      teamName: sideName(live, live.innings2.side),
      teamShort: sideShort(live, live.innings2.side),
      scoreLine: fmt(live.innings2),
      battingCard: live.innings2.battingCard || [],
      bowlingCard: live.innings2.bowlingCard || [],
    });
  } else if (live.inningsNumber === 2 && live.status === "ended") {
    list.push({
      label: "2nd innings",
      side: live.battingSide,
      teamName: sideName(live, live.battingSide),
      teamShort: sideShort(live, live.battingSide),
      scoreLine: fmt({
        runs: live.runs,
        wickets: live.wickets,
        balls: live.balls,
      }),
      battingCard: live.battingCard || [],
      bowlingCard: live.bowlingCard || [],
    });
  } else if (live.status === "innings_break" && !live.innings1) {
    list.push({
      label: "1st innings",
      side: live.battingSide,
      teamName: sideName(live, live.battingSide),
      teamShort: sideShort(live, live.battingSide),
      scoreLine: fmt({
        runs: live.runs,
        wickets: live.wickets,
        balls: live.balls,
      }),
      battingCard: live.battingCard || [],
      bowlingCard: live.bowlingCard || [],
    });
  }
  return list;
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
    batsman1: emptyBatsman(batsman1Name, true),
    batsman2: emptyBatsman(batsman2Name, false),
    bowler: emptyBowler(bowlerName),
    battingCard: [],
    bowlingCard: [],
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

  if (live._overJustEnded) {
    throw new Error("Over complete — set the new bowler first");
  }

  const next = cloneScore(live);
  next.batsman1 = ensureBatter(next.batsman1, true);
  next.batsman2 = ensureBatter(next.batsman2, false);
  next.bowler = ensureBowler(next.bowler);
  next.battingCard = Array.isArray(next.battingCard) ? next.battingCard : [];
  next.bowlingCard = Array.isArray(next.bowlingCard) ? next.bowlingCard : [];

  if (legalBallsInOver(next.thisOver) >= 6) {
    next.thisOver = [];
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
    battingCard: [...next.battingCard],
    bowlingCard: [...next.bowlingCard],
    status: next.status,
    result: next.result || null,
    innings2: next.innings2 || null,
    _overJustEnded: Boolean(live._overJustEnded),
    _cardsClosed: Boolean(live._cardsClosed),
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
    addBoundary(bat, runs);
    next.thisOver = [...(next.thisOver || []), label];
    if (runs % 2 === 1) rotateStrike(next);
  } else if (type === "wide") {
    const runs = 1 + extraRuns;
    next.runs += runs;
    next.bowler.runs += runs;
    next.thisOver = [
      ...(next.thisOver || []),
      extraRuns ? `Wd+${extraRuns}` : "Wd",
    ];
  } else if (type === "noball") {
    const runs = 1 + extraRuns;
    next.runs += runs;
    next.bowler.runs += runs;
    const bat = onStrikeBatsman(next);
    if (extraRuns > 0) {
      bat.runs += extraRuns;
      addBoundary(bat, extraRuns);
    }
    next.thisOver = [
      ...(next.thisOver || []),
      extraRuns ? `Nb+${extraRuns}` : "Nb",
    ];
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
    next.battingCard = [
      ...(next.battingCard || []),
      {
        name: bat.name,
        runs: Number(bat.runs) || 0,
        balls: Number(bat.balls) || 0,
        fours: Number(bat.fours) || 0,
        sixes: Number(bat.sixes) || 0,
        how: `b ${next.bowler.name}`,
      },
    ];
    if (next.wickets < 10) {
      bat.name = name;
      bat.runs = 0;
      bat.balls = 0;
      bat.fours = 0;
      bat.sixes = 0;
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

  if (legalBallsInOver(next.thisOver) >= 6) {
    rotateStrike(next);
    next._overJustEnded = true;
  }

  const maxBalls = (next.oversLimit || DEFAULT_OVERS_LIMIT) * 6;
  const chasedDown =
    next.inningsNumber === 2 &&
    next.target != null &&
    next.runs >= Number(next.target);
  const inningsDone =
    next.balls >= maxBalls || next.wickets >= 10 || chasedDown;

  next.events = [
    ...(next.events || []),
    { type, runs: extraRuns, at: Date.now(), snapshot },
  ];
  if (next.events.length > 80) next.events = next.events.slice(-80);

  next.updatedAt = new Date().toISOString();

  if (inningsDone) {
    if (next.inningsNumber === 1) {
      closeInningsCards(next);
      next.status = "innings_break";
    } else {
      sealSecondInnings(next);
    }
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
  next.batsman1 = ensureBatter(s.batsman1, true);
  next.batsman2 = ensureBatter(s.batsman2, false);
  next.bowler = ensureBowler(s.bowler);
  next.battingCard = Array.isArray(s.battingCard) ? s.battingCard : [];
  next.bowlingCard = Array.isArray(s.bowlingCard) ? s.bowlingCard : [];
  next._overJustEnded = Boolean(s._overJustEnded);
  next._cardsClosed = Boolean(s._cardsClosed);
  next.status = s.status || "live";
  next.result = s.result || null;
  next.innings2 = s.innings2 || null;
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
    battingCard: next.battingCard || [],
    bowlingCard: next.bowlingCard || [],
  };
  next.target = next.runs + 1;
  next.battingSide = next.battingSide === "team1" ? "team2" : "team1";
  next.inningsNumber = 2;
  next.runs = 0;
  next.wickets = 0;
  next.balls = 0;
  next.thisOver = [];
  next.battingCard = [];
  next.bowlingCard = [];
  next.batsman1 = emptyBatsman(batsman1Name, true);
  next.batsman2 = emptyBatsman(batsman2Name, false);
  next.bowler = emptyBowler(bowlerName);
  next._overJustEnded = false;
  next.status = "live";
  next.events = [];
  next.updatedAt = new Date().toISOString();
  return next;
}

export function patchLiveFields(live, fields = {}) {
  const next = cloneScore(live || {});
  next.batsman1 = ensureBatter(next.batsman1, true);
  next.batsman2 = ensureBatter(next.batsman2, false);
  next.bowler = ensureBowler(next.bowler);
  next.battingCard = Array.isArray(next.battingCard) ? next.battingCard : [];
  next.bowlingCard = Array.isArray(next.bowlingCard) ? next.bowlingCard : [];

  const str = (v, fallback) => {
    if (v === undefined) return fallback;
    return String(v).trim() || fallback;
  };
  if (fields.batsman1Name !== undefined)
    next.batsman1.name = str(fields.batsman1Name, next.batsman1.name);
  if (fields.batsman2Name !== undefined)
    next.batsman2.name = str(fields.batsman2Name, next.batsman2.name);

  if (
    fields.changeBowler ||
    (fields.bowlerName !== undefined && next._overJustEnded)
  ) {
    const name = str(fields.bowlerName, "");
    if (!name) throw new Error("Enter the new bowler name");
    if (
      name.toLowerCase() ===
      String(next.bowler?.name || "")
        .trim()
        .toLowerCase()
    ) {
      throw new Error(
        "Same bowler cannot bowl consecutive overs — pick a different bowler"
      );
    }
    archiveBowler(next);
    startBowler(next, name);
    next.thisOver = [];
    next._overJustEnded = false;
  } else if (fields.bowlerName !== undefined) {
    next.bowler.name = str(fields.bowlerName, next.bowler.name);
  }

  if (fields.swapStrike) rotateStrike(next);
  if (fields.runs !== undefined) next.runs = Math.max(0, Number(fields.runs) || 0);
  if (fields.wickets !== undefined)
    next.wickets = Math.min(10, Math.max(0, Number(fields.wickets) || 0));
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
      team1Score = fmt(
        live.innings1.runs,
        live.innings1.wickets,
        live.innings1.balls
      );
    } else {
      team2Score = fmt(
        live.innings1.runs,
        live.innings1.wickets,
        live.innings1.balls
      );
    }
  }

  const current = fmt(live.runs, live.wickets, live.balls);
  if (live.battingSide === "team1") team1Score = current;
  else team2Score = current;

  return { team1Score, team2Score };
}
