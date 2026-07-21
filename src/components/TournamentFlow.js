"use client";

import Link from "next/link";
import { Users, Shield, Zap, Trophy, ArrowDown, ChevronRight } from "lucide-react";
export default function TournamentFlow() {
  const stages = [
    {
      step: "01",
      title: "Team Registration & Grouping",
      subtitle: "48 Teams",
      icon: Users,
      color: "from-emerald-500 to-teal-600 shadow-emerald-500/10",
      description: "Teams are registered and divided into three groups of 16 teams each.",
      details: [
        { label: "Section A", value: "16 Teams" },
        { label: "Section B", value: "16 Teams" },
        { label: "Section C", value: "16 Teams" },
      ],
    },
    {
      step: "02",
      title: "Sectional Knockouts",
      subtitle: "16 → 8 → 4 → 2 Qualifiers",
      icon: Shield,
      color: "from-blue-500 to-indigo-600 shadow-indigo-500/10",
      description: "Single-elimination bracket for each section to determine the top 2 teams.",
      note: "Important: Round 1 losers drop to the Second Chance bracket.",
      details: [
        { label: "Main Qualified", value: "6 Teams (2 per Section)" },
        { label: "Loser Pool", value: "24 Teams (Round 1 Losers)" },
      ],
    },
    {
      step: "03",
      title: "Second Chance Bracket",
      subtitle: "24 Teams → 2 Qualifiers",
      icon: Zap,
      color: "from-amber-500 to-orange-600 shadow-amber-500/10",
      description: "A redemption bracket for the 24 teams that lost in Round 1 of Sectional play.",
      details: [
        { label: "Bracket Style", value: "Double Chance / Loser Pool" },
        { label: "Second Chance Spots", value: "2 Teams Qualify" },
      ],
    },
    {
      step: "04",
      title: "Final 8 Showdown",
      subtitle: "Quarter-Finals to Grand Finale",
      icon: Trophy,
      color: "from-rose-500 to-pink-600 shadow-rose-500/10",
      description: "The ultimate 8-team showdown to crown the champion.",
      details: [
        { label: "Qualified Teams", value: "6 (Main) + 2 (Second Chance)" },
        { label: "Match Format", value: "Quarter Finals → Semis → Final" },
      ],
    },
  ];

  return (
    <div id="flow" className="relative rounded-3xl border border-zinc-200 bg-white/70 p-8 dark:border-zinc-800 dark:bg-zinc-950/70 backdrop-blur-md shadow-2xl">
      {/* Decorative Glow */}
      <div className="absolute -top-12 -left-12 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

      <div className="mb-10 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">
          Tournament Flow
        </h2>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
          Explore our unique double-chance tournament progression from registrations to the grand finale.
        </p>
      </div>

      {/* Grid of Steps */}
      <div className="relative grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          return (
            <div key={stage.step} className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 bg-zinc-50 p-6 transition-all duration-300 hover:border-emerald-500/40 hover:bg-white hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-emerald-500/30 dark:hover:bg-zinc-900">
              <div>
                {/* Header info */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl font-extrabold text-zinc-200 dark:text-zinc-800 select-none group-hover:text-emerald-500/20 transition-colors duration-300">
                    {stage.step}
                  </span>
                  <div className={`rounded-xl bg-gradient-to-br ${stage.color} p-3 text-white shadow-lg`}>
                    <Icon size={20} />
                  </div>
                </div>

                {/* Body */}
                <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                  {stage.title}
                </h3>
                <p className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {stage.subtitle}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {stage.description}
                </p>

                {/* Optional Warning/Important Note */}
                {stage.note && (
                  <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 text-xs text-amber-600 dark:text-amber-400">
                    {stage.note}
                  </div>
                )}
              </div>

              {/* Technical Details */}
              <div className="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <div className="space-y-2">
                  {stage.details.map((detail) => (
                    <div key={detail.label} className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400 dark:text-zinc-500">{detail.label}</span>
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">{detail.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Arrow connectors (only visible on large screens, except for the last item) */}
              {idx < 3 && (
                <div className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 translate-x-1/2 z-20 text-zinc-300 dark:text-zinc-700 transition-transform duration-300 group-hover:translate-x-3/4 group-hover:text-emerald-500">
                  <ChevronRight size={24} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Visual representation layout footer banner */}
      <div className="mt-10 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-white/20 p-2.5">
              <Trophy className="text-white" size={24} />
            </div>
            <div>
              <h4 className="font-bold text-lg">Ready to make history?</h4>
              <p className="text-sm text-emerald-100">Secure your team's spot and compete with the best cricket talent.</p>
            </div>
          </div>
          <Link
            href="/register"
            className="w-full md:w-auto text-center rounded-xl bg-white px-6 py-3 font-semibold text-emerald-700 shadow-sm transition-all duration-300 hover:bg-emerald-50 hover:shadow-md hover:scale-102 active:scale-100"
          >
            Register Your Team
          </Link>
        </div>
      </div>
    </div>
  );
}
