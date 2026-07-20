"use client";

import { useEffect, useState } from "react";
import { Flag, Users } from "lucide-react";

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/15 dark:border-zinc-700 dark:bg-zinc-900";

export default function TeamProfileForm({
  team,
  onSubmit,
  onCancel,
  loading = false,
  embedded = false,
}) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (team) {
      setName(team.name || "");
    }
  }, [team]);

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({ name: name.trim() });
  }

  const sectionLabel =
    !team?.section || team.section === "unassigned"
      ? "Unassigned"
      : ["A", "B", "C"].includes(team.section)
        ? `Group ${team.section}`
        : String(team.section).replace(/_/g, " ");

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!embedded && <h3 className="text-lg font-semibold">Edit Team</h3>}

      <p className="text-xs text-zinc-500">
        Group and status are managed by admin. You can update your team name
        here.
      </p>

      <div>
        <label className="mb-1 block text-xs font-semibold text-zinc-600 dark:text-zinc-300">
          Team Name *
        </label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2.5 dark:bg-zinc-900/60">
          <Flag size={14} className="text-emerald-600" />
          <div>
            <p className="text-[10px] font-bold uppercase text-zinc-400">Group</p>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              {sectionLabel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2.5 dark:bg-zinc-900/60">
          <Users size={14} className="text-emerald-600" />
          <div>
            <p className="text-[10px] font-bold uppercase text-zinc-400">Status</p>
            <p className="text-sm font-semibold capitalize text-zinc-800 dark:text-zinc-100">
              {team?.status?.replace(/_/g, " ") || "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2 text-sm font-bold text-white shadow-sm disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Team"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-zinc-200 px-5 py-2 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
