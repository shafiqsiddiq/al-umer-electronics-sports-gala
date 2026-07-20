"use client";

import { useEffect, useState } from "react";
import { Trophy, Users } from "lucide-react";
import {
  SECTIONS,
  MAIN_QUALIFIERS_PER_SECTION,
  FINAL_EIGHT,
  LOSER_QUALIFIERS,
} from "@/lib/tournament-logic";

export default function AdminBracketsPage() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetch("/api/admin/brackets")
      .then((r) => r.json())
      .then(setSummary)
      .catch(console.error);
  }, []);

  if (!summary) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  const top8 = summary.top8?.teams || [];
  const emptySlots = Math.max(0, (summary.top8?.capacity || FINAL_EIGHT) - top8.length);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Bracket Management</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {SECTIONS.map((section) => {
          const data = summary.sections?.[section] || {};
          const qualifiedTeams = data.qualifiedTeams || [];
          return (
            <div
              key={section}
              className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"
            >
              <h2 className="mb-3 font-semibold text-emerald-600">Group {section}</h2>
              <p className="text-sm text-zinc-500">Teams: {data.teams || 0}</p>
              <p className="text-sm text-zinc-500">Matches: {data.matches || 0}</p>
              <p className="text-sm text-zinc-500">
                Qualified: {data.qualified || 0}/{MAIN_QUALIFIERS_PER_SECTION}
              </p>
              {qualifiedTeams.length > 0 && (
                <ul className="mt-3 space-y-1.5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  {qualifiedTeams.map((team, i) => (
                    <li
                      key={team._id}
                      className="flex items-center gap-2 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-sm font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                        {i + 1}
                      </span>
                      {team.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
          <h2 className="mb-3 font-semibold">Second Chance / Loser Pool</h2>
          <p className="mb-1 text-xs text-zinc-400">
            Only Round 1 losers from Groups A, B, C enter this pool.
          </p>
          <p className="text-sm text-zinc-500">
            Loser Pool: {summary.loserBracket?.pool || 0}
          </p>
          <p className="text-sm text-zinc-500">
            Qualified: {summary.loserBracket?.qualified || 0}/{LOSER_QUALIFIERS}
          </p>
          {(summary.loserBracket?.poolTeams || []).length > 0 && (
            <ul className="mt-3 max-h-56 space-y-1.5 overflow-y-auto border-t border-zinc-100 pt-3 dark:border-zinc-800">
              {summary.loserBracket.poolTeams.map((team) => (
                <li
                  key={team._id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-sm dark:bg-amber-950/40"
                >
                  <span className="truncate font-medium text-amber-900 dark:text-amber-200">
                    {team.name}
                  </span>
                  <span className="shrink-0 text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">
                    Sec {team.fromSection}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {(summary.loserBracket?.qualifiedTeams || []).length > 0 && (
            <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Qualified from loser pool
              </p>
              <ul className="space-y-1.5">
                {summary.loserBracket.qualifiedTeams.map((team) => (
                  <li
                    key={team._id}
                    className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-sm font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                  >
                    {team.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
          <h2 className="mb-3 font-semibold">Final Stage</h2>
          <p className="text-sm text-zinc-500">
            Teams: {summary.finalEight?.teams || 0}/{FINAL_EIGHT}
          </p>
          <p className="text-sm text-zinc-500">
            Matches: {summary.finalEight?.matches || 0}
          </p>
        </div>
      </div>

      {/* Top 8 Pool */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50/80 to-white dark:border-emerald-900/50 dark:from-emerald-950/30 dark:to-zinc-950">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 px-5 py-4 dark:border-emerald-900/40">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-900/20">
              <Trophy size={20} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Top 8 Pool</h2>
              <p className="text-sm text-zinc-500">
                Teams appear here as they qualify from each group (2 per group + 2 from loser pool)
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600/10 px-3 py-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            <Users size={14} />
            {top8.length}/{FINAL_EIGHT} filled
          </div>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {top8.map((team, i) => (
            <div
              key={team._id}
              className="rounded-xl border border-emerald-200/80 bg-white p-4 shadow-sm dark:border-emerald-900/40 dark:bg-zinc-900"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {team.source}
                </span>
              </div>
              <p className="truncate font-semibold text-zinc-900 dark:text-white" title={team.name}>
                {team.name}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {team.wins ?? 0}W · {team.points ?? 0} pts
              </p>
            </div>
          ))}

          {Array.from({ length: emptySlots }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex min-h-[104px] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50/70 p-4 text-center dark:border-zinc-700 dark:bg-zinc-900/40"
            >
              <span className="mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-500 dark:bg-zinc-800">
                {top8.length + i + 1}
              </span>
              <p className="text-xs font-medium text-zinc-400">Waiting for qualifier</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
