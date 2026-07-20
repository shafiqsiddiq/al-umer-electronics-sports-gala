"use client";

import { useState } from "react";
import { MAIN_PLAYERS, RESERVED_PLAYERS, TOTAL_SQUAD } from "@/lib/tournament-logic";

function StatCard({ label, current, max, color = "emerald" }) {
  const pct = max ? Math.min((current / max) * 100, 100) : 0;
  const barColors = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    violet: "bg-violet-500",
  };

  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-md shadow-zinc-300/25 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-zinc-950/30">
      <div className="mb-2 flex items-end justify-between">
        <p className="text-sm text-zinc-500">{label}</p>
        <p className="text-2xl font-bold tabular-nums">
          {current}
          <span className="text-base font-normal text-zinc-400">/{max}</span>
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full transition-all ${barColors[color]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function EntryFeeStatCard({ verified, uploaded, onUploaded }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(e) {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("Select receipt image");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("entryFeeImage", file);

      const res = await fetch("/api/teams/entry-fee", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setFile(null);
      onUploaded?.(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-md shadow-zinc-300/25 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-zinc-950/30">
      <div className="mb-2 flex items-end justify-between gap-2">
        <p className="text-sm text-zinc-500">Entry Fee</p>
        <p className={`text-lg font-bold ${verified ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
          {verified ? "Paid" : "Pending"}
        </p>
      </div>
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full transition-all ${verified ? "bg-emerald-500" : "bg-amber-400"}`}
          style={{ width: verified ? "100%" : "0%" }}
        />
      </div>

      {!verified && uploaded && (
        <p className="text-xs text-zinc-500">Receipt submitted — awaiting admin verification</p>
      )}

      {!uploaded && (
        <form onSubmit={handleUpload} className="space-y-2">
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2 text-xs text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/50 mb-2">
            <p className="font-semibold mb-1 text-xs">Payment Instructions:</p>
            <p className="text-[11px] leading-snug">
              Send fee to <strong>JazzCash</strong> or <strong>EasyPaisa</strong>:
            </p>
            <p className="text-[12px] font-bold mt-0.5 tracking-wide">03047058705</p>
            <p className="text-[11px]">Title: <strong>Muhammad Shafiq</strong></p>
            <p className="text-[11px] mt-1">
              Share receipt on WhatsApp:{" "}
              <a
                href="https://wa.me/923044897377"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline"
              >
                03044897377
              </a>
            </p>
            <p className="text-[10px] mt-1 opacity-80">Upload receipt screenshot below (optional).</p>
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-emerald-50 file:px-2 file:py-1 file:text-xs file:font-medium file:text-emerald-700 dark:file:bg-emerald-950 dark:file:text-emerald-300"
          />
          <button
            type="submit"
            disabled={loading || !file}
            className="w-full rounded-lg bg-emerald-600 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Uploading..." : "Upload Receipt"}
          </button>
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        </form>
      )}
    </div>
  );
}

export default function CaptainStatCards({
  mainCount,
  reservedCount,
  totalCount,
  entryFeeVerified = false,
  entryFeeUploaded = false,
  onEntryFeeUploaded,
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Main" current={mainCount} max={MAIN_PLAYERS} color="emerald" />
      <StatCard label="Reserved" current={reservedCount} max={RESERVED_PLAYERS} color="blue" />
      <StatCard label="Total squad" current={totalCount} max={TOTAL_SQUAD} color="violet" />
      <EntryFeeStatCard
        verified={entryFeeVerified}
        uploaded={entryFeeUploaded}
        onUploaded={onEntryFeeUploaded}
      />
    </div>
  );
}
