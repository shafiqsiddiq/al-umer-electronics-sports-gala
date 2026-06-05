"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminStatsCards from "@/components/AdminStatsCards";
import AdminDashboardCharts from "@/components/AdminDashboardCharts";
import { useToast } from "@/context/ToastContext";
import ConfirmModal from "@/components/ConfirmModal";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [stats, setStats] = useState(null);
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [confirmFixtures, setConfirmFixtures] = useState(false);
  const [confirmFinalEight, setConfirmFinalEight] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const res = await fetch("/api/admin/stats");
    if (res.ok) {
      const data = await res.json();
      setStats(data);
      setAuthed(true);
      return true;
    }
    return false;
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, role: "admin" }),
      });
      if (!res.ok) throw new Error("Invalid password");
      const loaded = await checkAuth();
      if (!loaded) throw new Error("Logged in but failed to load dashboard stats");
      window.dispatchEvent(new Event("admin-auth-change"));
      toast("Logged in successfully as Admin.", "success");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
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
      await checkAuth();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setGenerating(false);
    }
  }

  async function executeGenerateFinalEight() {
    setConfirmFinalEight(false);
    setGenerating(true);
    try {
      const res = await fetch("/api/tournament/generate-final-eight", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate Final 8");
      toast(`Final 8 generated! ${data.matchesCreated} matches created.`, "success");
      await checkAuth();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setGenerating(false);
    }
  }

  if (!authed) {
    return (
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-2xl font-bold">Admin Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            placeholder="Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 py-2 text-white hover:bg-emerald-700"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Admin Dashboard</h1>

      <AdminStatsCards stats={stats} />

      <AdminDashboardCharts stats={stats} />

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setConfirmFixtures(true)}
            disabled={generating}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Generate Section Fixtures
          </button>
          <button
            onClick={() => setConfirmFinalEight(true)}
            disabled={generating}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Generate Final 8
          </button>
          <Link href="/admin/teams" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-600">
            Manage Teams
          </Link>
          <Link href="/admin/scores" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-600">
            Update Scores
          </Link>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmFixtures}
        title="Generate Fixtures"
        message="Are you sure you want to generate fixtures for all 48 approved teams? This will clear any existing fixtures."
        confirmText="Generate Fixtures"
        cancelText="Cancel"
        onConfirm={executeGenerateFixtures}
        onCancel={() => setConfirmFixtures(false)}
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
