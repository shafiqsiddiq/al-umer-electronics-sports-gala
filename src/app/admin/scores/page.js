"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/context/ToastContext";

export default function AdminScoresPage() {
  const { toast } = useToast();
  const [matches, setMatches] = useState([]);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  async function fetchMatches() {
    const res = await fetch("/api/admin/matches?status=scheduled,live");
    const data = await res.json();
    setMatches(data.matches || []);
  }

  async function updateScore(matchId, form) {
    setUpdating(matchId);
    try {
      const res = await fetch(`/api/matches/${matchId}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update match score");
      toast("Match score updated successfully.", "success");
      await fetchMatches();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Score Updates</h1>
      <div className="space-y-6">
        {matches.map((match) => (
          <ScoreUpdateForm
            key={match._id}
            match={match}
            updating={updating === match._id}
            onSubmit={(form) => updateScore(match._id, form)}
          />
        ))}
        {matches.length === 0 && (
          <p className="text-zinc-500">No scheduled or live matches.</p>
        )}
      </div>
    </div>
  );
}

function ScoreUpdateForm({ match, updating, onSubmit }) {
  const [team1Score, setTeam1Score] = useState("");
  const [team2Score, setTeam2Score] = useState("");
  const [team1Runs, setTeam1Runs] = useState("");
  const [team2Runs, setTeam2Runs] = useState("");
  const [winnerId, setWinnerId] = useState("");
  const [status, setStatus] = useState("completed");

  return (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
      <p className="mb-3 font-semibold">
        {match.team1?.name || "TBD"} vs {match.team2?.name || "TBD"}
        <span className="ml-2 text-xs text-zinc-500">
          ({match.section} · R{match.round})
        </span>
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          placeholder={`${match.team1?.name || "Team 1"} Score`}
          value={team1Score}
          onChange={(e) => setTeam1Score(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
        />
        <input
          placeholder={`${match.team2?.name || "Team 2"} Score`}
          value={team2Score}
          onChange={(e) => setTeam2Score(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
        />
        <input
          type="number"
          placeholder="Team 1 Runs"
          value={team1Runs}
          onChange={(e) => setTeam1Runs(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
        />
        <input
          type="number"
          placeholder="Team 2 Runs"
          value={team2Runs}
          onChange={(e) => setTeam2Runs(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <select
          value={winnerId}
          onChange={(e) => setWinnerId(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
        >
          <option value="">Select Winner</option>
          {match.team1 && <option value={match.team1._id}>{match.team1.name}</option>}
          {match.team2 && <option value={match.team2._id}>{match.team2.name}</option>}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
        >
          <option value="live">Live</option>
          <option value="completed">Completed</option>
        </select>
        <button
          onClick={() =>
            onSubmit({
              team1Score,
              team2Score,
              team1Runs: Number(team1Runs) || 0,
              team2Runs: Number(team2Runs) || 0,
              winnerId,
              status,
            })
          }
          disabled={updating || !winnerId}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {updating ? "Saving..." : "Save Score"}
        </button>
      </div>
    </div>
  );
}
