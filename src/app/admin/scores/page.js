"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/context/ToastContext";
import LuckyDrawSpinner from "@/components/LuckyDrawSpinner";
import { Trophy, ShieldAlert, Flag, Activity, CheckCircle2, Circle } from "lucide-react";

export default function AdminScoresPage() {
  const { toast } = useToast();
  const [matches, setMatches] = useState([]);
  const [updating, setUpdating] = useState(null);
  const [luckyDrawInfo, setLuckyDrawInfo] = useState({ needsSpinner: false, teams: [] });
  const [activeTab, setActiveTab] = useState("A");

  useEffect(() => {
    fetchMatches();
    checkLuckyDraw();
  }, []);

  async function checkLuckyDraw() {
    try {
      const res = await fetch("/api/tournament/lucky-draw");
      const data = await res.json();
      setLuckyDrawInfo(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSpinComplete(winner) {
    try {
      const res = await fetch("/api/tournament/lucky-draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          winnerId: winner._id,
          allTeamIds: luckyDrawInfo.teams.map((t) => t._id),
        }),
      });
      if (!res.ok) throw new Error("Failed to save lucky draw result");
      toast(`${winner.name} goes directly to Quarter Finals!`, "success");
      await fetchMatches();
      await checkLuckyDraw();
    } catch (err) {
      toast(err.message, "error");
    }
  }

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

  const tabs = [
    { id: "A", label: "Section A", icon: <Flag size={16} /> },
    { id: "B", label: "Section B", icon: <Flag size={16} /> },
    { id: "C", label: "Section C", icon: <Flag size={16} /> },
    { id: "loser", label: "Loser Pool", icon: <ShieldAlert size={16} /> },
    { id: "final", label: "Final Stage", icon: <Trophy size={16} /> },
  ];

  const filteredMatches = matches.filter((m) => m.section === activeTab).sort((a, b) => a.matchNumber - b.matchNumber);

  // Group matches by round
  const matchesByRound = {};
  filteredMatches.forEach(m => {
    if (!matchesByRound[m.round]) matchesByRound[m.round] = [];
    matchesByRound[m.round].push(m);
  });
  const roundKeys = Object.keys(matchesByRound).sort((a, b) => Number(a) - Number(b));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Score Updates</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Manage live match scores and update results seamlessly.</p>
        </div>
      </div>
      
      {/* Premium Tabs UI */}
      <div className="mb-8 flex flex-wrap gap-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 shadow-sm ${
                isActive
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/25 ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-zinc-950 scale-105"
                  : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50 hover:text-emerald-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-emerald-400"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {luckyDrawInfo.needsSpinner && activeTab === "loser" && (
        <div className="mb-8">
          <LuckyDrawSpinner 
            teams={luckyDrawInfo.teams} 
            onSpinComplete={handleSpinComplete} 
          />
        </div>
      )}

      {/* Matches grouped by Round */}
      <div className="space-y-12">
        {roundKeys.length > 0 ? (
          roundKeys.map((roundKey) => (
            <div key={roundKey} className="relative">
              {/* Round Header */}
              <div className="mb-6 flex items-center gap-4">
                <h2 className="text-xl font-bold tracking-tight text-zinc-800 dark:text-zinc-200">
                  Round {roundKey}
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-zinc-200 to-transparent dark:from-zinc-800"></div>
              </div>

              {/* Round Matches Grid */}
              <div className="grid gap-6">
                {matchesByRound[roundKey].map((match) => (
                  <ScoreUpdateForm
                    key={match._id}
                    match={match}
                    updating={updating === match._id}
                    onSubmit={(form) => updateScore(match._id, form)}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 py-16 dark:border-zinc-800 dark:bg-zinc-900/20">
            <Activity className="mb-3 text-zinc-300 dark:text-zinc-700" size={48} />
            <p className="text-lg font-medium text-zinc-500 dark:text-zinc-400">
              No active matches found for {tabs.find((t) => t.id === activeTab)?.label}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreUpdateForm({ match, updating, onSubmit }) {
  const [team1Score, setTeam1Score] = useState("");
  const [team2Score, setTeam2Score] = useState("");
  const [winnerId, setWinnerId] = useState("");

  const t1Name = match.team1?.name || "TBD";
  const t2Name = match.team2?.name || "TBD";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/80 px-6 py-3 dark:border-zinc-800/80 dark:bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400">
            Round {match.round}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-200 px-2.5 py-1 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            Match {match.matchNumber}
          </span>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            ({match.section === 'loser' ? 'Loser Pool' : match.section === 'final' ? 'Finals' : `Section ${match.section}`})
          </span>
        </div>
        <div className="flex items-center gap-2">
          {match.status === 'live' ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-500">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
              </span>
              LIVE
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
              <Circle size={10} className="fill-current" /> Scheduled
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-6">
        <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 truncate">{t1Name}</h3>
          </div>
          <div className="flex shrink-0 items-center justify-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-black text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
            VS
          </div>
          <div className="flex-1 text-center md:text-right">
            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 truncate">{t2Name}</h3>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-500">Team 1 Score</label>
            <input
              placeholder="e.g. 150/4"
              value={team1Score}
              onChange={(e) => setTeam1Score(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900/50 dark:focus:bg-zinc-900"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-500">Team 2 Score</label>
            <input
              placeholder="e.g. 148/9"
              value={team2Score}
              onChange={(e) => setTeam2Score(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900/50 dark:focus:bg-zinc-900"
            />
          </div>
        </div>

        {/* Action Bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900/30">
          <select
            value={winnerId}
            onChange={(e) => setWinnerId(e.target.value)}
            className="w-full sm:w-48 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium outline-none transition-all focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">-- Select Winner --</option>
            {match.team1 && <option value={match.team1._id}>{t1Name}</option>}
            {match.team2 && <option value={match.team2._id}>{t2Name}</option>}
          </select>
          
          <button
            onClick={() =>
              onSubmit({
                team1Score,
                team2Score,
                team1Runs: 0,
                team2Runs: 0,
                winnerId,
                status: "completed",
              })
            }
            disabled={updating || !winnerId}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-zinc-900"
          >
            {updating ? (
              "Saving..."
            ) : (
              <>
                <CheckCircle2 size={16} />
                Save Result
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
