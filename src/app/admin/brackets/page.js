"use client";

import { useEffect, useState } from "react";
import { SECTIONS, MAIN_QUALIFIERS_PER_SECTION, FINAL_EIGHT, LOSER_QUALIFIERS } from "@/lib/tournament-logic";

export default function AdminBracketsPage() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetch("/api/admin/brackets")
      .then((r) => r.json())
      .then(setSummary);
  }, []);

  if (!summary) return <p>Loading...</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Bracket Management</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {SECTIONS.map((section) => (
          <div key={section} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
            <h2 className="mb-3 font-semibold text-emerald-600">Section {section}</h2>
            <p className="text-sm text-zinc-500">Teams: {summary.sections?.[section]?.teams || 0}</p>
            <p className="text-sm text-zinc-500">Matches: {summary.sections?.[section]?.matches || 0}</p>
            <p className="text-sm text-zinc-500">Qualified: {summary.sections?.[section]?.qualified || 0}/{MAIN_QUALIFIERS_PER_SECTION}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
          <h2 className="mb-3 font-semibold">Second Chance</h2>
          <p className="text-sm text-zinc-500">Loser Pool: {summary.loserBracket?.pool || 0}</p>
          <p className="text-sm text-zinc-500">Qualified: {summary.loserBracket?.qualified || 0}/{LOSER_QUALIFIERS}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
          <h2 className="mb-3 font-semibold">Final Stage</h2>
          <p className="text-sm text-zinc-500">Teams: {summary.finalEight?.teams || 0}/{FINAL_EIGHT}</p>
          <p className="text-sm text-zinc-500">Matches: {summary.finalEight?.matches || 0}</p>
        </div>
      </div>
    </div>
  );
}
