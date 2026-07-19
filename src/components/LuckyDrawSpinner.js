"use client";

import { useState, useEffect } from "react";

export default function LuckyDrawSpinner({ teams, onSpinComplete }) {
  const [spinning, setSpinning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [winner, setWinner] = useState(null);

  const startSpin = () => {
    if (spinning || teams.length === 0) return;
    setSpinning(true);
    setWinner(null);

    const spins = 30 + Math.floor(Math.random() * 20); // Total number of ticks
    const selectedWinnerIndex = Math.floor(Math.random() * teams.length);
    let currentTick = 0;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % teams.length);
      currentTick++;

      if (currentTick >= spins) {
        clearInterval(interval);
        // Force it to land on the predetermined winner
        setCurrentIndex(selectedWinnerIndex);
        setWinner(teams[selectedWinnerIndex]);
        setSpinning(false);
        if (onSpinComplete) {
          onSpinComplete(teams[selectedWinnerIndex]);
        }
      }
    }, 100);
  };

  if (!teams || teams.length === 0) return null;

  return (
    <div className="my-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 text-xl font-bold text-zinc-900 dark:text-white">
        Lucky Draw (Bye to Quarter Finals)
      </h2>
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        1 lucky team will go directly to the Quarter Finals. The other 2 will play an elimination match.
      </p>

      <div className="flex flex-col items-center justify-center space-y-6">
        {/* Spinner UI */}
        <div className="relative flex h-32 w-full max-w-sm items-center justify-center overflow-hidden rounded-lg bg-zinc-100 shadow-inner dark:bg-zinc-800">
          <div className="text-center">
            {winner ? (
              <div className="animate-bounce">
                <span className="block text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Winner
                </span>
                <span className="text-2xl font-black text-zinc-900 dark:text-white">
                  {winner.name}
                </span>
              </div>
            ) : (
              <span
                className={`text-2xl font-bold text-zinc-800 transition-opacity dark:text-zinc-200 ${
                  spinning ? "opacity-100" : "opacity-50"
                }`}
              >
                {teams[currentIndex]?.name || "Ready to Spin"}
              </span>
            )}
          </div>
          {/* Highlight overlays */}
          <div className="absolute inset-0 border-4 border-transparent"></div>
        </div>

        <button
          onClick={startSpin}
          disabled={spinning || winner}
          className="rounded-full bg-indigo-600 px-8 py-3 font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
        >
          {spinning ? "Spinning..." : winner ? "Spin Complete" : "Spin the Wheel!"}
        </button>
      </div>
    </div>
  );
}
