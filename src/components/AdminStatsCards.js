"use client";

import { Users, Clock, Zap, Receipt, Medal } from "lucide-react";

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
};

function StatCard({ label, value, sublabel, accent = "emerald", icon: Icon }) {
  const a = ACCENTS[accent] || ACCENTS.emerald;

  return (
    <div
      className={`group relative min-w-0 overflow-hidden rounded-lg border border-zinc-200/80 bg-gradient-to-br px-2.5 py-2 shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 ${a.wrap} ${a.ring}`}
    >
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0">
          <p className={`truncate text-base font-black tracking-tight tabular-nums ${a.value}`}>
            {value ?? 0}
          </p>
          <p className="mt-0.5 truncate text-[11px] font-semibold text-zinc-800 dark:text-zinc-100">
            {label}
          </p>
          {sublabel && (
            <p className="mt-0.5 truncate text-[9px] text-zinc-500 dark:text-zinc-400">
              {sublabel}
            </p>
          )}
        </div>
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md shadow-sm ${a.icon}`}
        >
          <Icon size={12} />
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
      label: "Active",
      value: stats.activeTeams,
      sublabel: "In tournament",
      accent: "teal",
      icon: Zap,
    },
    {
      label: "Total Entry Fee",
      value: `Rs. ${Number(stats.totalEntryFeePaid || 0).toLocaleString()}`,
      sublabel: `${stats.entryFeeVerified || 0} verified · ${stats.entryFeeUploaded || 0} receipts`,
      accent: "amber",
      icon: Receipt,
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
    <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}
