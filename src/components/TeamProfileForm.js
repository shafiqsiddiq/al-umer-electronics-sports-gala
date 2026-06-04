"use client";

import { useEffect, useState } from "react";

export default function TeamProfileForm({ team, onSubmit, onCancel, loading = false, embedded = false }) {
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

  return (
    <form
      onSubmit={handleSubmit}
      className={embedded ? "space-y-4" : "space-y-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900"}
    >
      {!embedded && <h3 className="text-lg font-semibold">Edit Team</h3>}
      <p className="text-sm text-zinc-500">
        Section and status are managed by admin. You can update your team name here.
      </p>

      <div>
        <label className="mb-1 block text-sm font-medium">Team Name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
        />
      </div>

      <div className="grid gap-2 text-sm text-zinc-500 sm:grid-cols-2">
        <div>Section: <span className="capitalize text-zinc-700 dark:text-zinc-300">{team?.section || "Unassigned"}</span></div>
        <div>Status: <span className="capitalize text-zinc-700 dark:text-zinc-300">{team?.status}</span></div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-6 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Team"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-zinc-300 px-6 py-2 dark:border-zinc-600"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
