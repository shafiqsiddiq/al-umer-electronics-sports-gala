"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminStatsCards from "@/components/AdminStatsCards";
import AdminDashboardCharts from "@/components/AdminDashboardCharts";
import { useToast } from "@/context/ToastContext";
import ConfirmModal from "@/components/ConfirmModal";
import CricketLoader from "@/components/CricketLoader";
import { TOTAL_TEAMS } from "@/lib/tournament-logic";
import {
  Trophy,
  Swords,
  ShieldAlert,
  Medal,
  Users,
  ClipboardList,
  Sparkles,
} from "lucide-react";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [confirmFixtures, setConfirmFixtures] = useState(false);
  const [confirmLosers, setConfirmLosers] = useState(false);
  const [confirmFinalEight, setConfirmFinalEight] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to load dashboard stats");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLoadingStats(false);
    }
  }

  async function executeGenerateFixtures() {
    setConfirmFixtures(false);
    setGenerating(true);
    try {
      const res = await fetch("/api/tournament/generate-fixtures", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate fixtures");
      toast(`Fixtures generated! ${data.matchesCreated} matches created.`, "success");
      await loadStats();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setGenerating(false);
    }
  }

  const executeGenerateLosers = async () => {
    try {
      setGenerating(true);
      const res = await fetch("/api/tournament/generate-losers", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to generate losers bracket");

      const ab = data.created?.loserAb?.matchesCreated ?? 0;
      const ko = data.created?.knockout?.matchesCreated ?? 0;
      toast(
        `Second-chance pools ready — Loser AB: ${ab || "—"} matches, Knockout: ${ko || "—"}.`,
        "success"
      );
      setConfirmLosers(false);
      await loadStats();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setGenerating(false);
    }
  };

  async function executeGenerateFinalEight() {
    setConfirmFinalEight(false);
    setGenerating(true);
    try {
      const res = await fetch("/api/tournament/generate-final-eight", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate Top 16");
      toast(`Top 16 generated! ${data.matchesCreated} matches created.`, "success");
      await loadStats();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setGenerating(false);
    }
  }

  if (loadingStats && !stats) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <CricketLoader label="Loading dashboard…" />
      </div>
    );
  }

  const regPct = stats?.targetTeams
    ? Math.min(Math.round((stats.totalTeams / stats.targetTeams) * 100), 100)
    : 0;

  const actions = [
    {
      label: "Generate Group Fixtures",
      desc: `Create knockout brackets for ${TOTAL_TEAMS} teams`,
      icon: Swords,
      onClick: () => setConfirmFixtures(true),
      tone: "from-emerald-500 to-teal-600 shadow-emerald-500/25",
    },
    {
      label: "Generate Loser AB / Knockout",
      desc: "A+B losers pool + C knockout (when R1 done)",
      icon: ShieldAlert,
      onClick: () => setConfirmLosers(true),
      tone: "from-amber-500 to-orange-600 shadow-amber-500/25",
    },
    {
      label: "Generate Top 16",
      desc: "R16 → quarters → semis → final",
      icon: Medal,
      onClick: () => setConfirmFinalEight(true),
      tone: "from-sky-500 to-teal-600 shadow-sky-500/25",
    },
    {
      label: "Manage Teams",
      desc: "Approve, edit, assign groups",
      icon: Users,
      href: "/admin/teams",
      tone: "from-zinc-700 to-zinc-900 shadow-zinc-900/20",
    },
    {
      label: "Update Scores",
      desc: "Live results & lucky draw",
      icon: ClipboardList,
      href: "/admin/scores",
      tone: "from-teal-600 to-emerald-700 shadow-teal-600/25",
    },
  ];

  return (
    <div className="relative">
      <div className="relative mb-5 overflow-hidden rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 px-4 py-4 text-white shadow-md shadow-emerald-600/15 sm:px-5 sm:py-4 dark:border-emerald-800">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />

        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur">
              <Trophy size={11} className="text-amber-200" />
              Control Room
            </div>
            <h1 className="text-xxl font-black tracking-tight sm:text-2xl">
              Al Umer Electronics
            </h1>
            <p className="mt-0 max-w-md text-md text-emerald-50/90">
              Sports Gala Season 3
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            {[
              { label: "Teams", value: stats?.totalTeams ?? 0, sub: `/ ${stats?.targetTeams || TOTAL_TEAMS}` },
              { label: "Matches", value: stats?.totalMatches ?? 0, sub: "total" },
              { label: "Filled", value: `${regPct}%`, sub: "slots" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-white/20 bg-white/10 px-2.5 py-2 text-center backdrop-blur sm:min-w-[76px]"
              >
                <p className="text-lg font-black tabular-nums sm:text-xl">
                  {item.value}
                  <span className="text-[10px] font-semibold text-emerald-100/80">
                    {item.sub?.startsWith("/") ? item.sub : ""}
                  </span>
                </p>
                <p className="text-[9px] font-semibold uppercase tracking-wide text-emerald-100/80">
                  {item.label}
                  {item.sub && !item.sub.startsWith("/") ? ` · ${item.sub}` : ""}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mt-3">
          <div className="mb-1 flex justify-between text-[10px] font-semibold text-emerald-100/90">
            <span>Registration progress</span>
            <span>
              {stats?.totalTeams ?? 0}/{stats?.targetTeams || TOTAL_TEAMS}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-black/20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-300 to-white transition-all duration-700"
              style={{ width: `${regPct}%` }}
            />
          </div>
        </div>
      </div>

      <AdminStatsCards stats={stats} />

      <AdminDashboardCharts stats={stats} />

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-emerald-600" />
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">
            Quick Actions
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {actions.map((action) => {
            const Icon = action.icon;
            const className = `group relative flex min-w-0 items-start gap-2 overflow-hidden rounded-xl bg-gradient-to-br p-2.5 text-left text-white shadow-md transition hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-50 ${action.tone}`;
            const inner = (
              <>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
                  <Icon size={15} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold leading-snug sm:text-sm">{action.label}</p>
                  <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-white/80">
                    {action.desc}
                  </p>
                </div>
              </>
            );

            if (action.href) {
              return (
                <Link key={action.label} href={action.href} className={className}>
                  {inner}
                </Link>
              );
            }

            return (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                disabled={generating}
                className={className}
              >
                {inner}
              </button>
            );
          })}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmFixtures}
        title="Generate Fixtures"
        message={`Are you sure you want to generate fixtures for all ${TOTAL_TEAMS} approved teams? This will clear any existing fixtures.`}
        confirmText="Generate Fixtures"
        cancelText="Cancel"
        onConfirm={executeGenerateFixtures}
        onCancel={() => setConfirmFixtures(false)}
        loading={generating}
        danger={false}
      />

      <ConfirmModal
        isOpen={confirmLosers}
        title="Generate Loser AB / Knockout"
        message="Generates Loser AB (after A+B Round 1) and/or Knockout Group (after C Round 1). Existing matches in those pools will be replaced."
        confirmText="Generate Pools"
        cancelText="Cancel"
        onConfirm={executeGenerateLosers}
        onCancel={() => setConfirmLosers(false)}
        loading={generating}
        danger={false}
      />

      <ConfirmModal
        isOpen={confirmFinalEight}
        title="Generate Top 16 Fixtures"
        message="Generate Top 16 fixtures from 16 qualified teams (4+4+4 from groups + 2 Loser AB + 2 Knockout)?"
        confirmText="Generate Top 16"
        cancelText="Cancel"
        onConfirm={executeGenerateFinalEight}
        onCancel={() => setConfirmFinalEight(false)}
        loading={generating}
        danger={false}
      />
    </div>
  );
}
