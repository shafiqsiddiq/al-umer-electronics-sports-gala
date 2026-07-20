"use client";

import { Trophy, Crown, Sparkles, Star } from "lucide-react";

export default function ChampionCard({
  team,
  runnerUp,
  score,
  subtitle = "Al-Umer Electronics Sports Gala",
}) {
  if (!team?.name) return null;

  return (
    <div className="relative mb-10 overflow-hidden rounded-3xl border border-amber-300/80 bg-gradient-to-br from-amber-50 via-white to-emerald-50 shadow-xl shadow-amber-500/10 dark:border-amber-700/50 dark:from-amber-950/50 dark:via-zinc-950 dark:to-emerald-950/40">
      {/* Atmosphere */}
      <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-amber-300/30 blur-3xl dark:bg-amber-500/10" />
      <div className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-emerald-300/25 blur-3xl dark:bg-emerald-500/10" />
      <div
        className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgb(245 158 11 / 0.25) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative px-6 py-10 sm:px-10 sm:py-12">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex items-center gap-2 rounded-full border border-amber-300/70 bg-amber-100/80 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-amber-800 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-200">
            <Crown size={14} className="text-amber-600" />
            Tournament Champion
            <Sparkles size={14} className="text-amber-600" />
          </div>

          <div className="relative mb-5">
            <div className="absolute inset-0 animate-pulse rounded-full bg-amber-400/30 blur-xl" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/40 ring-4 ring-white dark:ring-zinc-900">
              <Trophy className="text-white" size={36} strokeWidth={2.2} />
            </div>
            <Star
              size={16}
              className="absolute -right-1 -top-1 fill-amber-400 text-amber-500"
            />
            <Star
              size={12}
              className="absolute -bottom-0.5 -left-2 fill-amber-300 text-amber-400"
            />
          </div>

          <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {subtitle}
          </p>

          <h2 className="bg-gradient-to-r from-amber-700 via-emerald-700 to-teal-700 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl dark:from-amber-300 dark:via-emerald-300 dark:to-teal-300">
            {team.name}
          </h2>

          {score && (
            <p className="mt-3 rounded-full bg-white/80 px-4 py-1.5 text-sm font-semibold text-zinc-700 shadow-sm dark:bg-zinc-900/80 dark:text-zinc-200">
              Final score · {score}
            </p>
          )}

          {runnerUp?.name && (
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              Runner-up:{" "}
              <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                {runnerUp.name}
              </span>
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
              Champions
            </span>
            <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
              Sports Gala Season 3
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
