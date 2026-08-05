"use client";

import Link from "next/link";
import { Users, Shield, Zap, Trophy, ChevronRight } from "lucide-react";

export default function TournamentFlow() {
  const stages = [
    {
      step: "01",
      title: "Team Registration & Grouping",
      subtitle: "48 Teams",
      icon: Users,
      color: "from-emerald-500 to-teal-600 shadow-emerald-500/10",
      description:
        "Teams are registered and divided into three groups of 16 teams each.",
      details: [
        { label: "Group A", value: "16 Teams" },
        { label: "Group B", value: "16 Teams" },
        { label: "Group C", value: "16 Teams" },
      ],
    },
    {
      step: "02",
      title: "Group Knockouts",
      subtitle: "16 → 8 → 4 Qualifiers each",
      icon: Shield,
      color: "from-blue-500 to-indigo-600 shadow-indigo-500/10",
      description:
        "Each group plays down to 4 Top 16 qualifiers. Round 1 losers enter second-chance pools.",
      note: "A+B Round 1 losers → Loser AB. C Round 1 losers → Knockout Group (+ optional new entries).",
      details: [
        { label: "Main Qualified", value: "12 Teams (4 per Group)" },
        { label: "Loser AB", value: "16 → 2 Top 16" },
        { label: "Knockout", value: "8 (+new) → 2 Top 16" },
      ],
    },
    {
      step: "03",
      title: "Second Chance Pools",
      subtitle: "Loser AB + Knockout → 4 spots",
      icon: Zap,
      color: "from-amber-500 to-orange-600 shadow-amber-500/10",
      description:
        "Two separate redemption paths feed the Top 16 alongside the group winners.",
      details: [
        { label: "Loser AB", value: "2 Teams Qualify" },
        { label: "Knockout Group", value: "2 Teams Qualify" },
      ],
    },
    {
      step: "04",
      title: "Top 16 Showdown",
      subtitle: "R16 → Quarters → Semis → Final",
      icon: Trophy,
      color: "from-rose-500 to-pink-600 shadow-rose-500/10",
      description: "16 teams battle for the championship.",
      details: [
        { label: "Qualified Teams", value: "12 (Main) + 4 (Second Chance)" },
        { label: "Match Format", value: "R16 → QF → SF → Final" },
      ],
    },
  ];

  return (
    <div
      id="flow"
      className="relative rounded-3xl border border-zinc-200 bg-white/70 p-8 shadow-2xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/70"
    >
      <div className="pointer-events-none absolute -left-12 -top-12 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -right-12 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />

      <div className="mb-10 text-center">
        <h2 className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent dark:from-emerald-400 dark:to-teal-300">
          Tournament Flow
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-zinc-500 dark:text-zinc-400">
          Groups crown 4 each, second-chance pools add 4 more, then Top 16 decides the champion.
        </p>
      </div>

      <div className="relative grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          return (
            <div
              key={stage.step}
              className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 bg-zinc-50 p-6 transition-all duration-300 hover:border-emerald-500/40 hover:bg-white hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-emerald-500/30 dark:hover:bg-zinc-900"
            >
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <span className="select-none text-4xl font-extrabold text-zinc-200 transition-colors duration-300 group-hover:text-emerald-500/20 dark:text-zinc-800">
                    {stage.step}
                  </span>
                  <div
                    className={`rounded-xl bg-gradient-to-br ${stage.color} p-3 text-white shadow-lg`}
                  >
                    <Icon size={20} />
                  </div>
                </div>

                <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                  {stage.title}
                </h3>
                <p className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {stage.subtitle}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {stage.description}
                </p>

                {stage.note && (
                  <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 text-xs text-amber-600 dark:text-amber-400">
                    {stage.note}
                  </div>
                )}
              </div>

              <div className="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <div className="space-y-2">
                  {stage.details.map((detail) => (
                    <div
                      key={detail.label}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-zinc-400 dark:text-zinc-500">
                        {detail.label}
                      </span>
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                        {detail.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {idx < 3 && (
                <div className="absolute -right-4 top-1/2 z-20 hidden -translate-y-1/2 translate-x-1/2 text-zinc-300 transition-transform duration-300 group-hover:translate-x-3/4 group-hover:text-emerald-500 dark:text-zinc-700 lg:block">
                  <ChevronRight size={24} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-10 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white shadow-lg">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-white/20 p-2.5">
              <Trophy className="text-white" size={24} />
            </div>
            <div>
              <h4 className="text-lg font-bold">Ready to make history?</h4>
              <p className="text-sm text-emerald-100">
                Secure your team&apos;s spot and compete with the best cricket talent.
              </p>
            </div>
          </div>
          <Link
            href="/register"
            className="w-full rounded-xl bg-white px-6 py-3 text-center font-semibold text-emerald-700 shadow-sm transition-all duration-300 hover:bg-emerald-50 hover:shadow-md md:w-auto"
          >
            Register Your Team
          </Link>
        </div>
      </div>
    </div>
  );
}
