"use client";

import { useEffect, useState } from "react";
import {
  ballsToOvers,
  formatScoreLine,
  formatBowlerFigures,
  battingShort,
  bowlingShort,
  matchupLabel,
  remainingBallsInOver,
} from "@/lib/live-score";

const LIME = "#b4f000";
const DARK = "#1a1a1a";
const MUTED = "#2a2a2a";

function TeamBadge({ short, color }) {
  return (
    <div
      className="flex h-[4.6rem] w-[4.6rem] shrink-0 items-center justify-center rounded-full text-lg font-black uppercase text-white shadow-lg ring-2 ring-white/30 sm:h-20 sm:w-20 sm:text-xl"
      style={{ background: color }}
    >
      {(short || "?").slice(0, 3)}
    </div>
  );
}

function OverBall({ label }) {
  const isWicket = label === "W";
  const isExtra = String(label).startsWith("Wd") || String(label).startsWith("Nb");
  return (
    <span
      className={`inline-flex h-8 min-w-[1.85rem] items-center justify-center rounded-md px-1.5 text-xs font-black ${
        isWicket
          ? "bg-rose-600 text-white"
          : isExtra
            ? "bg-amber-400 text-zinc-900"
            : "bg-zinc-700 text-white"
      }`}
    >
      {label}
    </span>
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
      <div className="flex h-full items-end justify-center p-4 text-sm text-white/80">
        {error}
      </div>
    );
  }

  if (!live) {
    return (
      <div className="flex h-full items-end justify-center p-6">
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

  return (
    <div
      className={`flex w-full flex-col justify-end ${
        preview ? "min-h-[180px] bg-zinc-800/40 p-3" : "h-screen bg-transparent p-3 sm:p-4"
      }`}
    >
      <div className="mx-auto flex w-full max-w-6xl items-stretch gap-2 sm:gap-3">
        <TeamBadge short={batShort} color="#6b4423" />

        <div className="min-w-0 flex-1 overflow-hidden rounded-2xl shadow-2xl">
          {/* Top lime row — batting */}
          <div
            className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2 sm:px-4"
            style={{ background: LIME }}
          >
            <p className="truncate text-sm font-black uppercase tracking-wide text-zinc-900 sm:text-base">
              {matchupLabel(live)}
            </p>
            <div className="flex items-baseline gap-2 sm:gap-3">
              <span className="text-xl font-black tabular-nums text-zinc-900 sm:text-2xl">
                {score}
              </span>
              <span className="text-sm font-bold tabular-nums text-zinc-800 sm:text-base">
                {overs}
              </span>
            </div>
          </div>

          {/* Bottom dark — batsmen */}
          <div
            className="grid grid-cols-2 gap-2 px-3 py-2 sm:px-4"
            style={{ background: DARK }}
          >
            {[live.batsman1, live.batsman2].map((b) => (
              <div key={b.name + String(b.onStrike)} className="flex items-center justify-between gap-2 text-white">
                <span className="flex min-w-0 items-center gap-1.5 truncate text-sm font-semibold sm:text-base">
                  {b.onStrike && (
                    <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-lime-400" />
                  )}
                  <span className="truncate">{b.name}</span>
                </span>
                <span className="shrink-0 text-sm font-black tabular-nums sm:text-base">
                  {b.runs}{" "}
                  <span className="font-semibold text-zinc-400">{b.balls}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Toss chip */}
        <div className="hidden w-28 shrink-0 flex-col justify-center sm:flex">
          <div
            className="rounded-xl px-2 py-3 text-center text-[10px] font-black uppercase leading-tight tracking-wide text-white"
            style={{ background: MUTED }}
          >
            {live.tossText || "TOSS"}
            {live.target ? (
              <span className="mt-1 block text-lime-300">TGT {live.target}</span>
            ) : null}
          </div>
        </div>

        <div className="min-w-0 flex-[0.95] overflow-hidden rounded-2xl shadow-2xl">
          {/* Bowler lime */}
          <div
            className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4"
            style={{ background: LIME }}
          >
            <span className="flex items-center gap-1.5 truncate text-sm font-black uppercase text-zinc-900 sm:text-base">
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-700" />
              {live.bowler?.name || "Bowler"}
            </span>
            <span className="shrink-0 text-sm font-black tabular-nums text-zinc-900 sm:text-base">
              {formatBowlerFigures(live.bowler)}
            </span>
          </div>

          {/* This over */}
          <div
            className="flex items-center gap-2 px-3 py-2 sm:px-4"
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
        </div>

        <TeamBadge short={bowlShort} color="#1a7a3c" />
      </div>

      {live.status === "innings_break" && (
        <p className="mx-auto mt-2 rounded-full bg-amber-400 px-4 py-1 text-center text-xs font-black uppercase text-zinc-900">
          Innings break — target {live.runs + 1}
        </p>
      )}
    </div>
  );
}
