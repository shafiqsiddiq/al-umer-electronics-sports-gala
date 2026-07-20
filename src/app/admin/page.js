"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminStatsCards from "@/components/AdminStatsCards";
import AdminDashboardCharts from "@/components/AdminDashboardCharts";
import { useToast } from "@/context/ToastContext";
import ConfirmModal from "@/components/ConfirmModal";
import { TOTAL_TEAMS } from "@/lib/tournament-logic";
import {
  Trophy,
  Loader2,
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

      toast("Generated " + data.matchesCreated + " loser bracket matches!", "success");
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
      if (!res.ok) throw new Error(data.error || "Failed to generate Final 8");
      toast(`Final 8 generated! ${data.matchesCreated} matches created.`, "success");
      await loadStats();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setGenerating(false);
    }
  }

  if (loadingStats && !stats) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
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
      label: "Generate Loser Pool",
      desc: "Second Chance · R1 losers bracket",
      icon: ShieldAlert,
      onClick: () => setConfirmLosers(true),
      tone: "from-amber-500 to-orange-600 shadow-amber-500/25",
    },
    {
      label: "Generate Final 8",
      desc: "Super 8 quarter-finals onward",
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
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 p-6 text-white shadow-xl shadow-emerald-600/20 sm:p-8 dark:border-emerald-800">
        <div className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-amber-300/20 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur">
              <Trophy size={13} className="text-amber-200" />
              Control Room
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Sports Gala Dashboard
            </h1>
            <p className="mt-2 max-w-lg text-sm text-emerald-50/90">
              Run the tournament from registration to Super 8 — teams, fixtures, scores, and champions in one place.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[
              { label: "Teams", value: stats?.totalTeams ?? 0, sub: `/ ${stats?.targetTeams || TOTAL_TEAMS}` },
              { label: "Matches", value: stats?.totalMatches ?? 0, sub: "total" },
              { label: "Filled", value: `${regPct}%`, sub: "slots" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/20 bg-white/10 px-3 py-3 text-center backdrop-blur sm:px-4"
              >
                <p className="text-2xl font-black tabular-nums sm:text-3xl">
                  {item.value}
                  <span className="text-sm font-semibold text-emerald-100/80">
                    {item.sub?.startsWith("/") ? item.sub : ""}
                  </span>
                </p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-100/80">
                  {item.label}
                  {item.sub && !item.sub.startsWith("/") ? ` · ${item.sub}` : ""}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mt-6">
          <div className="mb-1.5 flex justify-between text-xs font-semibold text-emerald-100/90">
            <span>Registration progress</span>
            <span>
              {stats?.totalTeams ?? 0}/{stats?.targetTeams || TOTAL_TEAMS}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-black/20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-300 to-white transition-all duration-700"
              style={{ width: `${regPct}%` }}
            />
          </div>
        </div>
      </div>

      <AdminStatsCards stats={stats} />

      <AdminDashboardCharts stats={stats} />

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-emerald-600" />
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            Quick Actions
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {actions.map((action) => {
            const Icon = action.icon;
            const className = `group relative flex items-start gap-4 overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-left text-white shadow-lg transition hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-50 ${action.tone}`;
            const inner = (
              <>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                  <Icon size={20} />
                </span>
                <div>
                  <p className="font-bold">{action.label}</p>
                  <p className="mt-0.5 text-xs text-white/80">{action.desc}</p>
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
        title="Generate Loser Pool"
        message="Are you sure you want to generate the Second Chance (Loser) bracket matches? This requires all Round 1 matches to be completed."
        confirmText="Generate Losers"
        cancelText="Cancel"
        onConfirm={executeGenerateLosers}
        onCancel={() => setConfirmLosers(false)}
        loading={generating}
        danger={false}
      />

      <ConfirmModal
        isOpen={confirmFinalEight}
        title="Generate Final 8 Fixtures"
        message="Are you sure you want to generate Final 8 fixtures from the qualified teams?"
        confirmText="Generate Final 8"
        cancelText="Cancel"
        onConfirm={executeGenerateFinalEight}
        onCancel={() => setConfirmFinalEight(false)}
        loading={generating}
        danger={false}
      />
    </div>
  );
}
