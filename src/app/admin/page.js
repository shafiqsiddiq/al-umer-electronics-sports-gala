"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminStatsCards from "@/components/AdminStatsCards";
import AdminDashboardCharts from "@/components/AdminDashboardCharts";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

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
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function generateFixtures() {
    if (!confirm("Generate fixtures for all 48 approved teams?")) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/tournament/generate-fixtures", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(`Fixtures generated! ${data.matchesCreated} matches created.`);
      await checkAuth();
    } catch (err) {
      alert(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function generateFinalEight() {
    if (!confirm("Generate Final 8 fixtures from qualified teams?")) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/tournament/generate-final-eight", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(`Final 8 generated! ${data.matchesCreated} matches created.`);
    } catch (err) {
      alert(err.message);
    } finally {
      setGenerating(false);
    }
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-md">
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
            onClick={generateFixtures}
            disabled={generating}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Generate Section Fixtures
          </button>
          <button
            onClick={generateFinalEight}
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
    </div>
  );
}
