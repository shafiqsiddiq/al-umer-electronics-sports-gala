"use client";

import { useEffect, useState } from "react";
import {
  ballsToOvers,
  formatScoreLine,
  battingShort,
  bowlingShort,
  matchupLabel,
  remainingBallsInOver,
  chaseNeeded,
  matchResult,
  matchInningsSummaries,
} from "@/lib/live-score";

const LIME = "#b4f000";
const DARK = "#1a1a1a";
const MUTED = "#2a2a2a";

function TeamBadge({ short, color, size = "md" }) {
  const sizeCls =
    size === "sm"
      ? "h-11 w-11 text-xs"
      : size === "lg"
        ? "h-14 w-14 text-base sm:h-16 sm:w-16 sm:text-lg"
        : "h-[4.6rem] w-[4.6rem] text-lg sm:h-20 sm:w-20 sm:text-xl";
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-black uppercase text-white shadow-lg ring-2 ring-white/30 ${sizeCls}`}
      style={{ background: color }}
    >
      {(short || "?").slice(0, 3)}
    </div>
  );
}

function OverBall({ label }) {
  const isWicket = label === "W";
  const isExtra =
    String(label).startsWith("Wd") || String(label).startsWith("Nb");
  const isBoundary = label === "4" || label === "6" || String(label).includes("+4") || String(label).includes("+6");
  return (
    <span
      className={`inline-flex h-8 min-w-[1.85rem] items-center justify-center rounded-md px-1.5 text-xs font-black ${
        isWicket
          ? "bg-rose-600 text-white"
          : isExtra
            ? "bg-amber-400 text-zinc-900"
            : isBoundary
              ? "bg-lime-500 text-zinc-900"
              : "bg-zinc-700 text-white"
      }`}
    >
      {label}
    </span>
  );
}

function strikeRate(runs, balls) {
  const b = Number(balls) || 0;
  if (b <= 0) return 0;
  return ((Number(runs) || 0) * 100) / b;
}

function economyRate(runs, balls) {
  const b = Number(balls) || 0;
  if (b <= 0) return 0;
  return ((Number(runs) || 0) * 6) / b;
}

function initials(name = "") {
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function Avatar({ name }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-600 text-[10px] font-black text-white ring-1 ring-white/20">
      {initials(name)}
    </span>
  );
}

function inningsClosed(live) {
  return live?.status === "innings_break" || live?.status === "ended";
}

function battingRows(live) {
  const card = Array.isArray(live.battingCard) ? live.battingCard : [];
  if (inningsClosed(live)) {
    return card.map((b, i) => ({
      ...b,
      key: `card-${i}-${b.name}`,
      active: false,
    }));
  }
  return [
    ...card.map((b, i) => ({
      ...b,
      key: `out-${i}-${b.name}`,
      active: false,
      onStrike: false,
    })),
    {
      ...live.batsman1,
      key: `a1-${live.batsman1?.name}`,
      active: true,
      how: live.batsman1?.onStrike ? "striker" : "non-striker",
    },
    {
      ...live.batsman2,
      key: `a2-${live.batsman2?.name}`,
      active: true,
      how: live.batsman2?.onStrike ? "striker" : "non-striker",
    },
  ].filter((b) => b?.name);
}

function bowlingRows(live) {
  const card = Array.isArray(live.bowlingCard) ? live.bowlingCard : [];
  if (inningsClosed(live)) {
    return card.map((b, i) => ({
      ...b,
      key: `bowl-${i}-${b.name}`,
      current: false,
    }));
  }
  return [
    ...card.map((b, i) => ({
      ...b,
      key: `prev-${i}-${b.name}`,
      current: false,
    })),
    {
      ...(live.bowler || {}),
      key: `cur-${live.bowler?.name}`,
      current: true,
    },
  ].filter((b) => b?.name);
}

/** Batting table from row list — R / B / 4s / 6s / S/R */
function BattingTable({ rows }) {
  return (
    <div style={{ background: DARK }}>
      <div className="grid grid-cols-[minmax(0,1fr)_1.75rem_1.75rem_1.75rem_1.75rem_2.75rem] items-center gap-0.5 border-b border-white/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide text-zinc-500 sm:gap-1 sm:px-4">
        <span>Batting</span>
        <span className="text-right">R</span>
        <span className="text-right">B</span>
        <span className="text-right">4s</span>
        <span className="text-right">6s</span>
        <span className="text-right">S/R</span>
      </div>
      {rows.length === 0 ? (
        <p className="px-3 py-3 text-xs text-zinc-500 sm:px-4">No batsmen yet</p>
      ) : (
        rows.map((b) => {
          const sr = Number(strikeRate(b.runs, b.balls)).toFixed(1);
          return (
            <div
              key={b.key}
              className={`grid grid-cols-[minmax(0,1fr)_1.75rem_1.75rem_1.75rem_1.75rem_2.75rem] items-center gap-0.5 border-b border-white/5 px-3 py-2 last:border-b-0 sm:gap-1 sm:px-4 ${
                b.active ? "" : "opacity-80"
              }`}
            >
              <div className="flex min-w-0 items-center gap-2">
                <Avatar name={b.name} />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-white">
                    {b.onStrike && (
                      <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-lime-400" />
                    )}
                    <span className="truncate">{b.name}</span>
                  </p>
                  <p className="mt-0.5 truncate text-[10px] font-medium text-zinc-500">
                    {b.active
                      ? b.onStrike
                        ? "striker"
                        : "non-striker"
                      : b.how || "out"}
                  </p>
                </div>
              </div>
              <span className="text-right text-sm font-black tabular-nums text-white">
                {b.runs ?? 0}
              </span>
              <span className="text-right text-sm font-semibold tabular-nums text-zinc-400">
                {b.balls ?? 0}
              </span>
              <span className="text-right text-sm font-semibold tabular-nums text-zinc-300">
                {b.fours ?? 0}
              </span>
              <span className="text-right text-sm font-semibold tabular-nums text-lime-300">
                {b.sixes ?? 0}
              </span>
              <span className="text-right text-xs font-semibold tabular-nums text-zinc-400">
                {sr}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}

function BowlingTable({ rows }) {
  return (
    <div style={{ background: DARK }}>
      <div className="grid grid-cols-[minmax(0,1fr)_2.5rem_2rem_2rem_3rem] items-center gap-1 border-b border-white/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide text-zinc-500 sm:px-4">
        <span>Bowling</span>
        <span className="text-right">O</span>
        <span className="text-right">R</span>
        <span className="text-right">W</span>
        <span className="text-right">Econ</span>
      </div>
      {rows.length === 0 ? (
        <p className="px-3 py-3 text-xs text-zinc-500 sm:px-4">No bowlers yet</p>
      ) : (
        rows.map((b) => {
          const overs = ballsToOvers(b.balls || 0);
          const econ = Number(economyRate(b.runs, b.balls)).toFixed(2);
          return (
            <div
              key={b.key}
              className={`grid grid-cols-[minmax(0,1fr)_2.5rem_2rem_2rem_3rem] items-center gap-1 border-b border-white/5 px-3 py-2 last:border-b-0 sm:px-4 ${
                b.current ? "" : "opacity-80"
              }`}
            >
              <div className="flex min-w-0 items-center gap-2">
                <Avatar name={b.name} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {b.name || "Bowler"}
                  </p>
                  {b.current ? (
                    <p className="mt-0.5 text-[10px] font-medium text-lime-400">
                      current
                    </p>
                  ) : null}
                </div>
              </div>
              <span className="text-right text-sm font-semibold tabular-nums text-zinc-300">
                {overs}
              </span>
              <span className="text-right text-sm font-semibold tabular-nums text-zinc-300">
                {b.runs ?? 0}
              </span>
              <span className="text-right text-sm font-black tabular-nums text-white">
                {b.wickets ?? 0}
              </span>
              <span className="text-right text-xs font-semibold tabular-nums text-zinc-400">
                {econ}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}

/** Batting card — R / B / 4s / 6s / S/R */
function BattingCard({ live }) {
  return <BattingTable rows={battingRows(live)} />;
}

/** Bowling card — previous + current (O / R / W / Econ) */
function BowlingCard({ live }) {
  return <BowlingTable rows={bowlingRows(live)} />;
}

function WinnerBanner({ result }) {
  if (!result?.text) return null;
  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-amber-400 via-lime-400 to-emerald-400 p-[2px] shadow-xl">
      <div className="rounded-[0.9rem] px-4 py-3 text-center" style={{ background: DARK }}>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-300">
          {result.isTie ? "Result" : "Winner"}
        </p>
        <p className="mt-1 text-base font-black leading-snug text-white sm:text-lg">
          {result.text}
        </p>
      </div>
    </div>
  );
}

function MatchSummaryCard({ live }) {
  const innings = matchInningsSummaries(live);
  const [tab, setTab] = useState(() =>
    Math.max(0, matchInningsSummaries(live).length - 1)
  );
  if (!innings.length) return null;

  const active = Math.min(tab, innings.length - 1);
  const inn = innings[active];
  const batRows = (inn.battingCard || []).map((b, i) => ({
    ...b,
    key: `${inn.label}-bat-${i}-${b.name}`,
    active: false,
  }));
  const bowlRows = (inn.bowlingCard || []).map((b, i) => ({
    ...b,
    key: `${inn.label}-bowl-${i}-${b.name}`,
    current: false,
  }));

  return (
    <div className="overflow-hidden rounded-2xl shadow-xl">
      <div
        className="px-3 py-2.5 text-center text-sm font-black uppercase tracking-wide text-zinc-900 sm:px-4"
        style={{ background: LIME }}
      >
        Match summary
      </div>

      {innings.length > 1 ? (
        <div className="grid grid-cols-2 gap-1 p-2" style={{ background: DARK }}>
          {innings.map((item, i) => {
            const selected = i === active;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => setTab(i)}
                className={`rounded-xl px-2 py-2.5 text-left transition ${
                  selected
                    ? "bg-lime-400 text-zinc-900"
                    : "bg-zinc-800 text-zinc-300 ring-1 ring-white/10"
                }`}
              >
                <p
                  className={`text-[9px] font-black uppercase tracking-wide ${
                    selected ? "text-zinc-700" : "text-zinc-500"
                  }`}
                >
                  {item.label}
                </p>
                <p className="mt-0.5 truncate text-xs font-black leading-tight">
                  {item.teamShort || item.teamName}
                </p>
                <p
                  className={`mt-0.5 text-sm font-black tabular-nums ${
                    selected ? "text-zinc-900" : "text-lime-300"
                  }`}
                >
                  {item.scoreLine}
                </p>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="space-y-2 pb-3" style={{ background: DARK }}>
        <div className="flex items-center justify-between gap-2 px-3 pt-1 sm:px-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
              {inn.label}
            </p>
            <p className="truncate text-sm font-black text-white">
              {inn.teamName}
            </p>
          </div>
          <p className="shrink-0 text-lg font-black tabular-nums text-lime-300">
            {inn.scoreLine}
          </p>
        </div>
        <BattingTable rows={batRows} />
        <BowlingTable rows={bowlRows} />
      </div>
    </div>
  );
}

function ThisOverRow({ overBalls, emptySlots }) {
  return (
    <div
      className="flex flex-wrap items-center gap-2 border-t border-white/10 px-3 py-2.5 sm:px-4"
      style={{ background: DARK }}
    >
      <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-zinc-400">
        This Over
      </span>
      <div className="flex flex-wrap gap-1.5">
        {overBalls.map((b, i) => (
          <OverBall key={`${b}-${i}`} label={b} />
        ))}
        {Array.from({ length: emptySlots }, (_, i) => (
          <span
            key={`empty-${i}`}
            className="inline-flex h-8 w-8 rounded-md border border-dashed border-zinc-600"
          />
        ))}
      </div>
    </div>
  );
}

export default function LiveScoreboardOverlay({ matchId, preview = false }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch(`/api/matches/${matchId}/live`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed");
        if (alive) {
          setData(json);
          setError("");
        }
      } catch (err) {
        if (alive) setError(err.message || "Error");
      }
    }
    load();
    const t = setInterval(load, 1500);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [matchId]);

  const live = data?.liveScore;

  if (error && !live) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-4 text-sm text-zinc-700 dark:text-white/80">
        {error}
      </div>
    );
  }

  if (!live) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <div className="rounded-2xl bg-black/70 px-5 py-3 text-sm font-semibold text-white">
          Waiting for live score…
        </div>
      </div>
    );
  }

  const batShort = battingShort(live);
  const bowlShort = bowlingShort(live);
  const overs = `${ballsToOvers(live.balls)} (${live.oversLimit})`;
  const score = formatScoreLine(live.runs, live.wickets);
  const emptySlots = remainingBallsInOver(live.thisOver || []);
  const overBalls = live.thisOver || [];
  const chase = chaseNeeded(live);
  const result = matchResult(live);
  const isMatchOver = live.status === "ended" || Boolean(result);

  const shellCls = preview
    ? "bg-zinc-900 p-3"
    : "min-h-screen bg-zinc-950 p-3 pb-8 md:bg-transparent md:p-4";

  return (
    <div className={`flex w-full flex-col ${shellCls}`}>
      {/* —— Mobile / Preview: stacked full-width —— */}
      <div
        className={`mx-auto w-full max-w-lg space-y-3 ${
          preview ? "block" : "md:hidden"
        }`}
      >
        {result ? <WinnerBanner result={result} /> : null}

        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <TeamBadge short={batShort} color="#6b4423" size="lg" />
            <div className="min-w-0">
              <p className="truncate text-xs font-bold uppercase tracking-wide text-lime-300">
                {isMatchOver ? "Final" : "Batting"}
              </p>
              <p className="truncate text-sm font-black uppercase text-white">
                {matchupLabel(live)}
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-2xl font-black tabular-nums text-white">
              {score}
            </p>
            <p className="text-xs font-bold tabular-nums text-zinc-400">
              {overs} ov
            </p>
          </div>
        </div>

        {live.innings1 ? (
          <div
            className="rounded-xl px-3 py-2 text-center text-[11px] font-bold text-zinc-300"
            style={{ background: MUTED }}
          >
            <span className="text-white">
              {live.innings1.side === "team1" ? live.team1Short : live.team2Short}{" "}
              {formatScoreLine(live.innings1.runs, live.innings1.wickets)} (
              {ballsToOvers(live.innings1.balls)})
            </span>
            <span className="mx-2 text-zinc-500">vs</span>
            <span className="text-lime-300">
              {batShort} {score} ({ballsToOvers(live.balls)})
            </span>
          </div>
        ) : null}

        {live.status === "live" && chase && !result ? (
          <p className="rounded-xl bg-lime-400/15 px-3 py-2 text-center text-sm font-bold text-lime-300 ring-1 ring-lime-400/30">
            {chase}
          </p>
        ) : null}

        {!isMatchOver && (
          <>
            <div className="overflow-hidden rounded-2xl shadow-xl">
              <div
                className="flex items-center justify-between gap-2 px-3 py-2.5"
                style={{ background: LIME }}
              >
                <p className="min-w-0 truncate text-sm font-black uppercase text-zinc-900">
                  {matchupLabel(live)}
                </p>
                <div className="flex shrink-0 items-baseline gap-2">
                  <span className="text-xl font-black tabular-nums text-zinc-900">
                    {score}
                  </span>
                  <span className="text-sm font-bold text-zinc-800">{overs}</span>
                </div>
              </div>
              <BattingCard live={live} />
            </div>

            <div className="overflow-hidden rounded-2xl shadow-xl">
              <div
                className="px-3 py-2 text-[10px] font-black uppercase tracking-wide text-zinc-900 sm:px-4"
                style={{ background: LIME }}
              >
                Bowling
              </div>
              <BowlingCard live={live} />
              {!inningsClosed(live) && (
                <ThisOverRow overBalls={overBalls} emptySlots={emptySlots} />
              )}
            </div>
          </>
        )}

        {isMatchOver ? <MatchSummaryCard live={live} /> : null}

        <div className="flex items-center justify-between gap-3">
          <div
            className="flex-1 rounded-xl px-3 py-2.5 text-center text-[11px] font-black uppercase leading-snug text-white"
            style={{ background: MUTED }}
          >
            {live.tossText || "TOSS"}
            {live.target ? (
              <span className="mt-0.5 block text-lime-300">
                Target {live.target}
              </span>
            ) : null}
            {chase && live.status === "live" && !result ? (
              <span className="mt-1 block text-[10px] font-bold normal-case tracking-normal text-amber-200">
                {chase}
              </span>
            ) : null}
            {result?.text ? (
              <span className="mt-1 block text-[10px] font-bold normal-case tracking-normal text-amber-200">
                {result.text}
              </span>
            ) : null}
          </div>
          <TeamBadge short={bowlShort} color="#1a7a3c" size="lg" />
        </div>

        {live.status === "innings_break" && (
          <p className="rounded-full bg-amber-400 px-4 py-2 text-center text-xs font-black uppercase text-zinc-900">
            Innings break — target {live.runs + 1}
          </p>
        )}
      </div>

      {/* —— Desktop / OBS: horizontal bar (not used in admin preview) —— */}
      {!preview && (
        <div className="mx-auto hidden w-full max-w-6xl flex-col justify-end md:flex md:min-h-0 md:flex-1">
          {result ? (
            <div className="mb-3">
              <WinnerBanner result={result} />
            </div>
          ) : null}
          {chase && live.status === "live" && !result ? (
            <p className="mb-2 text-center text-sm font-bold text-lime-300">
              {chase}
            </p>
          ) : null}
          {isMatchOver ? (
            <div className="mx-auto w-full max-w-2xl">
              <MatchSummaryCard live={live} />
            </div>
          ) : (
            <div className="flex w-full items-stretch gap-3">
              <TeamBadge short={batShort} color="#6b4423" />

              <div className="min-w-0 flex-1 overflow-hidden rounded-2xl shadow-2xl">
                <div
                  className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-2"
                  style={{ background: LIME }}
                >
                  <p className="truncate text-base font-black uppercase tracking-wide text-zinc-900">
                    {matchupLabel(live)}
                  </p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-black tabular-nums text-zinc-900">
                      {score}
                    </span>
                    <span className="text-base font-bold tabular-nums text-zinc-800">
                      {overs}
                    </span>
                  </div>
                </div>
                <BattingCard live={live} />
              </div>

              <div className="hidden w-32 shrink-0 flex-col justify-center lg:flex">
                <div
                  className="rounded-xl px-2 py-3 text-center text-[10px] font-black uppercase leading-tight tracking-wide text-white"
                  style={{ background: MUTED }}
                >
                  {live.tossText || "TOSS"}
                  {live.target ? (
                    <span className="mt-1 block text-lime-300">
                      TGT {live.target}
                    </span>
                  ) : null}
                  {chase && live.status === "live" ? (
                    <span className="mt-1.5 block text-[9px] font-bold normal-case tracking-normal text-amber-200">
                      {chase}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="min-w-0 flex-[0.95] overflow-hidden rounded-2xl shadow-2xl">
                <div
                  className="px-4 py-1.5 text-[10px] font-black uppercase tracking-wide text-zinc-900"
                  style={{ background: LIME }}
                >
                  Bowling
                </div>
                <BowlingCard live={live} />
                {!inningsClosed(live) && (
                  <ThisOverRow overBalls={overBalls} emptySlots={emptySlots} />
                )}
              </div>

              <TeamBadge short={bowlShort} color="#1a7a3c" />
            </div>
          )}

          {live.status === "innings_break" && (
            <p className="mx-auto mt-2 rounded-full bg-amber-400 px-4 py-1 text-center text-xs font-black uppercase text-zinc-900">
              Innings break — target {live.runs + 1}
            </p>
          )}
        </div>
      )}

      <p className="mt-3 text-center text-[10px] font-medium tracking-wide text-zinc-500">
        Developed by Saafiq Siddiq
      </p>
    </div>
  );
}
