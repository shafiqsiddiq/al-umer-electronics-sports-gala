"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, X } from "lucide-react";

/**
 * Change who plays in a match — pick any teams (cross-group allowed).
 * teamsByGroup: { A: [...], B: [...], C: [...], knockout?: [...] }
 */
export default function ChangeMatchTeamsModal({
  match,
  teamsByGroup = {},
  onClose,
  onSaved,
}) {
  const [team1Id, setTeam1Id] = useState(match?.team1?._id || "");
  const [team2Id, setTeam2Id] = useState(match?.team2?._id || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setTeam1Id(match?.team1?._id || "");
    setTeam2Id(match?.team2?._id || "");
    setError("");
  }, [match?._id, match?.team1?._id, match?.team2?._id]);

  const flatTeams = useMemo(() => {
    const order = ["A", "B", "C", "knockout", "loser_ab", "unassigned"];
    const seen = new Set();
    const list = [];
    for (const key of order) {
      for (const t of teamsByGroup[key] || []) {
        if (!t?._id || seen.has(t._id)) continue;
        seen.add(t._id);
        list.push({
          ...t,
          groupKey: key,
          groupLabel:
            key === "knockout"
              ? "Knockout"
              : key === "loser_ab"
                ? "Loser AB"
                : key === "unassigned"
                  ? "Unassigned"
                  : `Group ${key}`,
        });
      }
    }
    // Include current match teams if missing from pools
    for (const t of [match?.team1, match?.team2]) {
      if (t?._id && !seen.has(t._id)) {
        seen.add(t._id);
        list.push({
          ...t,
          groupKey: t.section || "?",
          groupLabel: t.section
            ? ["A", "B", "C"].includes(t.section)
              ? `Group ${t.section}`
              : t.section
            : "Current",
        });
      }
    }
    return list.sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), undefined, {
        sensitivity: "base",
      })
    );
  }, [teamsByGroup, match?.team1, match?.team2]);

  const groupsInList = useMemo(() => {
    const map = new Map();
    for (const t of flatTeams) {
      if (!map.has(t.groupLabel)) map.set(t.groupLabel, []);
      map.get(t.groupLabel).push(t);
    }
    return [...map.entries()];
  }, [flatTeams]);

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    if (!team1Id || !team2Id) {
      setError("Select both teams");
      return;
    }
    if (team1Id === team2Id) {
      setError("Pick two different teams");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/matches/${match._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team1Id,
          team2Id,
          swapIfBusy: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update teams");
      onSaved?.(data.match, data.swapped);
      onClose?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!match) return null;

  const selectClass =
    "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <ArrowLeftRight size={18} />
            </span>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                Change match teams
              </h3>
              <p className="text-xs text-zinc-500">
                Round {match.round} · Match {match.matchNumber} — Group A / B / C
                kisi se bhi pair kar sakte ho. Busy team auto-swap ho jayegi.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 p-5">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-500">
              Team 1
            </label>
            <select
              value={team1Id}
              onChange={(e) => setTeam1Id(e.target.value)}
              className={selectClass}
              required
            >
              <option value="">Select team…</option>
              {groupsInList.map(([label, teams]) => (
                <optgroup key={label} label={label}>
                  {teams.map((t) => (
                    <option key={t._id} value={t._id} disabled={t._id === team2Id}>
                      {t.name}
                      {t.captain?.name ? ` (${t.captain.name})` : ""}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="flex justify-center">
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:bg-zinc-800">
              VS
            </span>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-500">
              Team 2
            </label>
            <select
              value={team2Id}
              onChange={(e) => setTeam2Id(e.target.value)}
              className={selectClass}
              required
            >
              <option value="">Select team…</option>
              {groupsInList.map(([label, teams]) => (
                <optgroup key={label} label={label}>
                  {teams.map((t) => (
                    <option key={t._id} value={t._id} disabled={t._id === team1Id}>
                      {t.name}
                      {t.captain?.name ? ` (${t.captain.name})` : ""}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <p className="text-[11px] text-zinc-500">
            Example: Group A team vs Group B team — dono dropdowns se alag groups
            choose karo. Agar team pehle se kisi match mein hai to woh slot swap ho
            jayega.
          </p>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save pairing"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
