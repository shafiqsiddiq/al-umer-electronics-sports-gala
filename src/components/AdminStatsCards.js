"use client";

import {
  Users,
  Clock,
  BadgeCheck,
  Zap,
  Receipt,
  UserCircle2,
  CalendarDays,
  Medal,
} from "lucide-react";

const ACCENTS = {
  emerald: {
    wrap: "from-emerald-500/15 via-white to-white dark:from-emerald-500/20 dark:via-zinc-950 dark:to-zinc-950",
    icon: "bg-emerald-600 text-white shadow-emerald-600/30",
    value: "text-emerald-700 dark:text-emerald-300",
    ring: "ring-emerald-100 dark:ring-emerald-900/40",
  },
  amber: {
    wrap: "from-amber-500/15 via-white to-white dark:from-amber-500/20 dark:via-zinc-950 dark:to-zinc-950",
    icon: "bg-amber-500 text-white shadow-amber-500/30",
    value: "text-amber-700 dark:text-amber-300",
    ring: "ring-amber-100 dark:ring-amber-900/40",
  },
  teal: {
    wrap: "from-teal-500/15 via-white to-white dark:from-teal-500/20 dark:via-zinc-950 dark:to-zinc-950",
    icon: "bg-teal-600 text-white shadow-teal-600/30",
    value: "text-teal-700 dark:text-teal-300",
    ring: "ring-teal-100 dark:ring-teal-900/40",
  },
  sky: {
    wrap: "from-sky-500/15 via-white to-white dark:from-sky-500/20 dark:via-zinc-950 dark:to-zinc-950",
    icon: "bg-sky-600 text-white shadow-sky-600/30",
    value: "text-sky-700 dark:text-sky-300",
    ring: "ring-sky-100 dark:ring-sky-900/40",
  },
  zinc: {
    wrap: "from-zinc-500/10 via-white to-white dark:from-zinc-500/20 dark:via-zinc-950 dark:to-zinc-950",
    icon: "bg-zinc-700 text-white shadow-zinc-700/20",
    value: "text-zinc-800 dark:text-zinc-100",
    ring: "ring-zinc-100 dark:ring-zinc-800",
  },
};

function StatCard({ label, value, sublabel, accent = "emerald", icon: Icon }) {
  const a = ACCENTS[accent] || ACCENTS.emerald;

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-zinc-200/80 bg-gradient-to-br p-3 shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 ${a.wrap} ${a.ring}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={`text-2xl font-black tracking-tight tabular-nums ${a.value}`}>
            {value ?? 0}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-zinc-800 dark:text-zinc-100">
            {label}
          </p>
          {sublabel && (
            <p className="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">{sublabel}</p>
          )}
        </div>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-md ${a.icon}`}
        >
          <Icon size={15} />
        </span>
      </div>
    </div>
  );
}

export default function AdminStatsCards({ stats }) {
  if (!stats) return null;

  const cards = [
    {
      label: "Total Teams",
      value: stats.totalTeams,
      sublabel: `Target ${stats.targetTeams}`,
      accent: "emerald",
      icon: Users,
    },
    {
      label: "Pending",
      value: stats.pendingTeams,
      sublabel: "Awaiting approval",
      accent: "amber",
      icon: Clock,
    },
    {
      label: "Approved",
      value: stats.approvedTeams,
      sublabel: "Ready to play",
      accent: "sky",
      icon: BadgeCheck,
    },
    {
      label: "Active",
      value: stats.activeTeams,
      sublabel: "In tournament",
      accent: "teal",
      icon: Zap,
    },
    {
      label: "Entry Fees",
      value: stats.entryFeeUploaded,
      sublabel: "Receipts uploaded",
      accent: "amber",
      icon: Receipt,
    },
    {
      label: "Captains",
      value: stats.totalCaptains,
      sublabel: `${stats.totalPlayers || 0} players`,
      accent: "sky",
      icon: UserCircle2,
    },
    {
      label: "Matches",
      value: stats.totalMatches,
      sublabel: `${stats.completedMatches || 0} completed`,
      accent: "zinc",
      icon: CalendarDays,
    },
    {
      label: "Qualified",
      value: stats.qualifiedTeams,
      sublabel: "Knockout / Super 8",
      accent: "emerald",
      icon: Medal,
    },
  ];

  return (
    <div className="mb-5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}
