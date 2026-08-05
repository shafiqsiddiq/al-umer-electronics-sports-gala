"use client";

import { useState } from "react";
import { Dices, Sparkles } from "lucide-react";

/**
 * Generic bye spinner — picks one team to skip the next play round.
 */
export default function LuckyDrawSpinner({
  teams,
  onSpinComplete,
  locked = false,
  spinDone = false,
  title = "Lucky Draw — Final 3",
  description = "Spin sends 1 team straight to Super 8. The other 2 play one match — winner also goes to Super 8.",
  byeLabel = "Bye",
  waitingLabel = "Waiting…",
  maxGrid = 12,
}) {
  const [spinning, setSpinning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [winner, setWinner] = useState(null);

  const startSpin = () => {
    if (locked || spinning || !teams?.length || winner) return;
    setSpinning(true);
    setWinner(null);

    const spins = 30 + Math.floor(Math.random() * 20);
    const selectedWinnerIndex = Math.floor(Math.random() * teams.length);
    let currentTick = 0;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % teams.length);
      currentTick++;

      if (currentTick >= spins) {
        clearInterval(interval);
        setCurrentIndex(selectedWinnerIndex);
        setWinner(teams[selectedWinnerIndex]);
        setSpinning(false);
        if (onSpinComplete) onSpinComplete(teams[selectedWinnerIndex]);
      }
    }, 90);
  };

  if (!teams?.length) return null;

  const displayTeams = teams;
  const gridCols =
    displayTeams.length <= 3
      ? "sm:grid-cols-3"
      : displayTeams.length <= 6
        ? "sm:grid-cols-3 lg:grid-cols-6"
        : "sm:grid-cols-3 lg:grid-cols-4";

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-white to-orange-50 shadow-lg dark:border-amber-700/60 dark:from-amber-950/40 dark:via-zinc-950 dark:to-orange-950/30">
      <div className="border-b border-amber-200/80 bg-amber-100/50 px-5 py-4 dark:border-amber-900/40 dark:bg-amber-950/30">
        <div className="flex items-center gap-2">
          <Dices className="text-amber-600 dark:text-amber-400" size={22} />
          <h2 className="text-xl font-extrabold text-amber-950 dark:text-amber-100">
            {title}
          </h2>
        </div>
        <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-200/70">
          {description}
        </p>
      </div>

      <div className="p-5">
        <div className={`mb-6 grid gap-3 ${gridCols}`}>
          {displayTeams.slice(0, maxGrid).map((team, i) => {
            const isWinner = winner && winner._id === team._id;
            const isHighlight = spinning && currentIndex === i;
            return (
              <div
                key={team._id || i}
                className={`rounded-xl border px-3 py-3 text-center transition-all ${
                  isWinner
                    ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-400 dark:border-emerald-600 dark:bg-emerald-950/40"
                    : isHighlight
                      ? "scale-105 border-amber-400 bg-amber-100 dark:border-amber-500 dark:bg-amber-900/40"
                      : "border-amber-200/80 bg-white dark:border-amber-900/40 dark:bg-zinc-900"
                }`}
              >
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  #{i + 1}
                </span>
                <p className="truncate text-sm font-bold text-zinc-900 dark:text-white sm:text-base">
                  {team.name || "TBD"}
                </p>
                {isWinner && (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                    <Sparkles size={10} /> {byeLabel}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-28 w-full max-w-md items-center justify-center overflow-hidden rounded-xl bg-zinc-900 shadow-inner">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-zinc-900 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-zinc-900 to-transparent" />
            <div className="text-center">
              {winner ? (
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-widest text-emerald-400">
                    {byeLabel}
                  </span>
                  <span className="text-2xl font-black text-white">{winner.name}</span>
                </div>
              ) : (
                <span
                  className={`text-2xl font-black text-amber-300 transition-opacity ${
                    spinning ? "opacity-100" : "opacity-60"
                  }`}
                >
                  {locked
                    ? spinDone
                      ? "Draw complete"
                      : waitingLabel
                    : displayTeams[currentIndex]?.name || "Ready"}
                </span>
              )}
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-amber-400" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1 bg-amber-400" />
          </div>

          <button
            type="button"
            onClick={startSpin}
            disabled={locked || spinning || !!winner || !teams?.length}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-8 py-3 font-bold text-white shadow-lg shadow-amber-500/25 transition hover:from-amber-400 hover:to-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Dices size={18} />
            {locked
              ? spinDone
                ? "Already spun"
                : waitingLabel
              : spinning
                ? "Spinning…"
                : winner
                  ? "Spin Complete"
                  : "Spin the Wheel!"}
          </button>
        </div>
      </div>
    </div>
  );
}
