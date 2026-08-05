"use client";

import { useMemo, useState } from "react";
import MatchCard from "@/components/MatchCard";
import { TOTAL_TEAMS } from "@/lib/tournament-logic";
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Radio,
  Swords,
} from "lucide-react";

const GROUP_META = {
  A: {
    title: "Group A",
    tone: "from-emerald-500 to-teal-600",
    soft: "from-emerald-50 to-teal-50/40 dark:from-emerald-950/40 dark:to-teal-950/20",
    border: "border-emerald-200 dark:border-emerald-900/50",
  },
  B: {
    title: "Group B",
    tone: "from-teal-500 to-cyan-600",
    soft: "from-teal-50 to-cyan-50/40 dark:from-teal-950/40 dark:to-cyan-950/20",
    border: "border-teal-200 dark:border-teal-900/50",
  },
  C: {
    title: "Group C",
    tone: "from-sky-500 to-emerald-600",
    soft: "from-sky-50 to-emerald-50/40 dark:from-sky-950/40 dark:to-emerald-950/20",
    border: "border-sky-200 dark:border-sky-900/50",
  },
  loser_ab: {
    title: "Loser AB",
    tone: "from-amber-500 to-orange-600",
    soft: "from-amber-50 to-orange-50/40 dark:from-amber-950/40 dark:to-orange-950/20",
    border: "border-amber-200 dark:border-amber-900/50",
  },
  knockout: {
    title: "Knockout Group",
    tone: "from-violet-500 to-fuchsia-600",
    soft: "from-violet-50 to-fuchsia-50/40 dark:from-violet-950/40 dark:to-fuchsia-950/20",
    border: "border-violet-200 dark:border-violet-900/50",
  },
  loser: {
    title: "Second Chance",
    tone: "from-amber-500 to-orange-600",
    soft: "from-amber-50 to-orange-50/40 dark:from-amber-950/40 dark:to-orange-950/20",
    border: "border-amber-200 dark:border-amber-900/50",
  },
  final: {
    title: "Top 16 / Final",
    tone: "from-zinc-700 to-emerald-700",
    soft: "from-zinc-50 to-emerald-50/40 dark:from-zinc-900 dark:to-emerald-950/20",
    border: "border-zinc-200 dark:border-zinc-700",
  },
};

function groupKey(section) {
  if (
    section === "loser" ||
    section === "loser_ab" ||
    section === "knockout" ||
    section === "final"
  ) {
    return section;
  }
  return section;
}

export default function FixturesClient({ matches }) {
  const tabs = useMemo(() => {
    const order = ["A", "B", "C", "loser_ab", "knockout", "loser", "final"];
    const present = new Set(matches.map((m) => groupKey(m.section)));
    return order.filter((k) => present.has(k));
  }, [matches]);

  const [active, setActive] = useState(tabs[0] || "A");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    return matches
      .filter((m) => groupKey(m.section) === active)
      .filter((m) => (statusFilter === "all" ? true : m.status === statusFilter))
      // Groups only play to Round 2 under the new Top-16 flow
      .filter((m) => {
        if (["A", "B", "C"].includes(active) && Number(m.round) >= 3) return false;
        return true;
      })
      .sort(
        (a, b) =>
          a.round - b.round || a.matchNumber - b.matchNumber
      );
  }, [matches, active, statusFilter]);

  const byRound = useMemo(() => {
    const map = {};
    for (const m of filtered) {
      if (!map[m.round]) map[m.round] = [];
      map[m.round].push(m);
    }
    return Object.entries(map).sort((a, b) => Number(a[0]) - Number(b[0]));
  }, [filtered]);

  const counts = useMemo(() => {
    const all = matches;
    return {
      total: all.length,
      live: all.filter((m) => m.status === "live").length,
      completed: all.filter((m) => m.status === "completed").length,
      scheduled: all.filter((m) => m.status === "scheduled").length,
    };
  }, [matches]);

  const meta = GROUP_META[active] || GROUP_META.A;

  if (matches.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 p-12 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
        <Swords className="mx-auto mb-3 text-zinc-300" size={40} />
        <p className="font-medium text-zinc-600 dark:text-zinc-300">
          No fixtures yet
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          Admin can generate fixtures once {TOTAL_TEAMS} teams are registered.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Summary strip */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total Matches",
            value: counts.total,
            icon: CalendarDays,
            tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40",
          },
          {
            label: "Live",
            value: counts.live,
            icon: Radio,
            tone: "text-rose-600 bg-rose-50 dark:bg-rose-950/40",
          },
          {
            label: "Completed",
            value: counts.completed,
            icon: CheckCircle2,
            tone: "text-teal-600 bg-teal-50 dark:bg-teal-950/40",
          },
          {
            label: "Upcoming",
            value: counts.scheduled,
            icon: Circle,
            tone: "text-zinc-600 bg-zinc-100 dark:bg-zinc-800",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80"
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.tone}`}
              >
                <Icon size={18} />
              </span>
              <div>
                <p className="text-2xl font-black tabular-nums text-zinc-900 dark:text-white">
                  {item.value}
                </p>
                <p className="text-xs font-semibold text-zinc-500">{item.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Group tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((key) => {
          const g = GROUP_META[key];
          const count = matches.filter((m) => groupKey(m.section) === key).length;
          const isActive = active === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActive(key)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                isActive
                  ? `bg-gradient-to-r ${g.tone} text-white shadow-md`
                  : "border border-zinc-200 bg-white text-zinc-600 hover:border-emerald-300 hover:text-emerald-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
              }`}
            >
              {g.title}
              <span
                className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] ${
                  isActive ? "bg-white/20" : "bg-zinc-100 dark:bg-zinc-800"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Status filter */}
      <div className="mb-8 flex flex-wrap gap-2">
        {[
          { id: "all", label: "All" },
          { id: "scheduled", label: "Upcoming" },
          { id: "live", label: "Live" },
          { id: "completed", label: "Completed" },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setStatusFilter(f.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              statusFilter === f.id
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Active group banner */}
      <div
        className={`mb-6 overflow-hidden rounded-2xl border bg-gradient-to-r p-5 ${meta.soft} ${meta.border}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              className={`bg-gradient-to-r bg-clip-text text-2xl font-black text-transparent ${meta.tone}`}
            >
              {meta.title}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {filtered.length} match{filtered.length !== 1 ? "es" : ""} shown
              {byRound.length > 0 ? ` · ${byRound.length} round${byRound.length !== 1 ? "s" : ""}` : ""}
            </p>
          </div>
          <span
            className={`rounded-xl bg-gradient-to-br px-4 py-2 text-sm font-bold text-white shadow-md ${meta.tone}`}
          >
            Fixtures
          </span>
        </div>
      </div>

      {byRound.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 py-14 text-center text-sm text-zinc-500 dark:border-zinc-700">
          No matches for this filter.
        </div>
      ) : (
        byRound.map(([round, roundMatches]) => (
          <section key={round} className="mb-10">
            <div className="mb-4 flex items-center gap-3">
              <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
                Round {round}
              </h3>
              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                {roundMatches.length} matches
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-zinc-200 to-transparent dark:from-zinc-800" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {roundMatches.map((match) => (
                <MatchCard key={match._id} match={match} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
