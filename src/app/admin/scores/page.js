"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/context/ToastContext";
import LuckyDrawSpinner from "@/components/LuckyDrawSpinner";
import { Trophy, ShieldAlert, Flag, Activity, CheckCircle2, Circle, Medal, Users } from "lucide-react";
import { FINAL_EIGHT } from "@/lib/tournament-logic";

export default function AdminScoresPage() {
  const { toast } = useToast();
  const [matches, setMatches] = useState([]);
  const [updating, setUpdating] = useState(null);
  const [luckyDrawInfo, setLuckyDrawInfo] = useState({
    needsSpinner: false,
    spinDone: false,
    finalThreeReady: false,
    teams: [],
  });
  const [activeTab, setActiveTab] = useState("A");
  const [top8, setTop8] = useState({ teams: [], count: 0, capacity: FINAL_EIGHT });
  const [loserPoolTeams, setLoserPoolTeams] = useState([]);

  useEffect(() => {
    fetchMatches();
    checkLuckyDraw();
    fetchTop8();
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

  async function fetchTop8() {
    try {
      const res = await fetch("/api/admin/brackets");
      const data = await res.json();
      if (data.top8) setTop8(data.top8);
      setLoserPoolTeams(data.loserBracket?.poolTeams || []);
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
      toast(`${winner.name} goes directly to Super 8!`, "success");
      await fetchMatches();
      await checkLuckyDraw();
      await fetchTop8();
    } catch (err) {
      toast(err.message, "error");
    }
  }

  async function fetchMatches() {
    // Include completed so finished rounds still show round-wise
    const res = await fetch("/api/admin/matches?status=scheduled,live,completed");
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
      await fetchTop8();
      await checkLuckyDraw();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setUpdating(null);
    }
  }

  const tabs = [
    { id: "A", label: "Group A", icon: <Flag size={16} /> },
    { id: "B", label: "Group B", icon: <Flag size={16} /> },
    { id: "C", label: "Group C", icon: <Flag size={16} /> },
    { id: "loser", label: "Loser Pool", icon: <ShieldAlert size={16} /> },
    { id: "top8", label: "Top 8", icon: <Medal size={16} /> },
    { id: "final", label: "Final Stage", icon: <Trophy size={16} /> },
  ];

  const filteredMatches = matches
    .filter((m) => m.section === activeTab)
    .sort((a, b) => a.round - b.round || a.matchNumber - b.matchNumber);

  // Guard against accidental duplicate fixtures (same round + matchNumber)
  const seenKeys = new Set();
  const dedupedMatches = filteredMatches.filter((m) => {
    const key = `${m.round}-${m.matchNumber}`;
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });

  const matchesByRound = {};
  dedupedMatches.forEach((m) => {
    if (!matchesByRound[m.round]) matchesByRound[m.round] = [];
    matchesByRound[m.round].push(m);
  });

  // Loser Pool: always show full bracket structure (R1–R3), even if a round is empty
  if (activeTab === "loser") {
    for (const r of [1, 2, 3]) {
      if (!matchesByRound[r]) matchesByRound[r] = [];
    }
  }

  const roundKeys = Object.keys(matchesByRound).sort((a, b) => Number(a) - Number(b));

  function loserRoundLabel(round) {
    const labels = {
      1: "Round 1 · 12 matches (24 → 12)",
      2: "Round 2 · 6 matches (12 → 6)",
      3: "Round 3 · 3 matches (6 → 3)",
      4: "Round 4 · Super 8 playoff (2 → 1 qualifier)",
    };
    return labels[Number(round)] || `Round ${round}`;
  }

  const emptySlots = Math.max(0, (top8.capacity || FINAL_EIGHT) - (top8.teams?.length || 0));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Score Updates
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Manage live match scores and update results seamlessly.
          </p>
        </div>
      </div>

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
              {tab.id === "top8" && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {top8.count || 0}/{top8.capacity || 8}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeTab === "loser" && (
        <div className="mb-8">
          <LuckyDrawSpinner
            teams={luckyDrawInfo.teams}
            onSpinComplete={handleSpinComplete}
            locked={!luckyDrawInfo.needsSpinner}
            spinDone={!!luckyDrawInfo.spinDone}
          />
          {luckyDrawInfo.spinDone && (
            <p className="mt-3 text-center text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Lucky draw done — check Round 4 playoff match below for the 2nd Super 8 qualifier.
            </p>
          )}
        </div>
      )}

      {activeTab === "loser" && (
        <div className="mb-8 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="border-b border-amber-200/70 px-5 py-3 dark:border-amber-900/40">
            <h2 className="font-bold text-amber-900 dark:text-amber-200">
              Round 1 Loser Pool ({loserPoolTeams.length})
            </h2>
            <p className="text-xs text-amber-700/80 dark:text-amber-300/70">
              24 teams → Round 1 (12) → Round 2 (6) → Round 3 (3) → Lucky Draw picks 1 for Super 8; remaining 2 play for the last Super 8 spot.
            </p>
          </div>
          {loserPoolTeams.length === 0 ? (
            <p className="px-5 py-6 text-sm text-amber-700/70 dark:text-amber-300/60">
              No Round 1 losers yet. As soon as a Round 1 match finishes, the losing team will appear here.
            </p>
          ) : (
            <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {loserPoolTeams.map((team, i) => (
                <div
                  key={team._id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-amber-200/80 bg-white px-3 py-2.5 dark:border-amber-900/40 dark:bg-zinc-900"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                      {i + 1}. {team.name}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Lost Group {team.fromSection} · R1 M{team.lostMatchNumber}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Pool
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "top8" ? (
        <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50/80 to-white dark:border-emerald-900/50 dark:from-emerald-950/30 dark:to-zinc-950">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 px-5 py-4 dark:border-emerald-900/40">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Top 8 Pool</h2>
              <p className="mt-0.5 text-sm text-zinc-500">
                As each group finishes, its 2 qualifying teams appear here automatically.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600/10 px-3 py-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              <Users size={14} />
              {top8.count || 0}/{top8.capacity || FINAL_EIGHT} filled
            </div>
          </div>

          {(top8.teams?.length || 0) === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Medal className="mb-3 text-zinc-300 dark:text-zinc-700" size={48} />
              <p className="text-lg font-medium text-zinc-500 dark:text-zinc-400">
                No teams have qualified yet.
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                Complete groups matches — winners will show up here.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
              {top8.teams.map((team, i) => (
                <div
                  key={team._id}
                  className="rounded-xl border border-emerald-200/80 bg-white p-4 shadow-sm dark:border-emerald-900/40 dark:bg-zinc-900"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {team.source}
                    </span>
                  </div>
                  <p className="truncate font-semibold text-zinc-900 dark:text-white" title={team.name}>
                    {team.name}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {team.wins ?? 0}W · {team.points ?? 0} pts
                  </p>
                </div>
              ))}

              {Array.from({ length: emptySlots }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex min-h-[104px] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50/70 p-4 text-center dark:border-zinc-700 dark:bg-zinc-900/40"
                >
                  <span className="mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-500 dark:bg-zinc-800">
                    {(top8.teams?.length || 0) + i + 1}
                  </span>
                  <p className="text-xs font-medium text-zinc-400">Waiting for qualifier</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-12">
          {roundKeys.length > 0 ? (
            roundKeys.map((roundKey) => (
              <div key={roundKey} className="relative">
                <div className="mb-6 flex items-center gap-4">
                  <h2 className="text-xl font-bold tracking-tight text-zinc-800 dark:text-zinc-200">
                    {activeTab === "loser" ? loserRoundLabel(roundKey) : `Round ${roundKey}`}
                  </h2>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {matchesByRound[roundKey].length} match
                    {matchesByRound[roundKey].length !== 1 ? "es" : ""}
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-r from-zinc-200 to-transparent dark:from-zinc-800" />
                </div>

                <div className="grid gap-6">
                  {matchesByRound[roundKey].length === 0 ? (
                    <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 px-5 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-400">
                      Waiting for previous round winners…
                    </div>
                  ) : (
                    matchesByRound[roundKey].map((match) => (
                      <ScoreUpdateForm
                        key={match._id}
                        match={match}
                        updating={updating === match._id}
                        onSubmit={(form) => updateScore(match._id, form)}
                      />
                    ))
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 py-16 dark:border-zinc-800 dark:bg-zinc-900/20">
              <Activity className="mb-3 text-zinc-300 dark:text-zinc-700" size={48} />
              <p className="text-lg font-medium text-zinc-500 dark:text-zinc-400">
                No active matches found for {tabs.find((t) => t.id === activeTab)?.label}.
              </p>
              {["A", "B", "C"].includes(activeTab) && (top8.teams || []).some((t) => t.section === activeTab) && (
                <button
                  type="button"
                  onClick={() => setActiveTab("top8")}
                  className="mt-4 text-sm font-semibold text-emerald-600 hover:underline"
                >
                  View Group {activeTab} qualifiers in Top 8 →
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScoreUpdateForm({ match, updating, onSubmit }) {
  const [team1Score, setTeam1Score] = useState(match.team1Score || "");
  const [team2Score, setTeam2Score] = useState(match.team2Score || "");
  const [winnerId, setWinnerId] = useState(match.winner?._id || "");

  const t1Name = match.team1?.name || "TBD";
  const t2Name = match.team2?.name || "TBD";
  const ready = Boolean(match.team1 && match.team2);
  const isCompleted = match.status === "completed";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all dark:bg-zinc-950 ${
        isCompleted
          ? "border-emerald-200 dark:border-emerald-900/50"
          : ready
            ? "border-zinc-200 hover:shadow-md dark:border-zinc-800"
            : "border-dashed border-zinc-300 opacity-90 dark:border-zinc-700"
      }`}
    >
      <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/80 px-6 py-3 dark:border-zinc-800/80 dark:bg-zinc-900/50">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400">
            Round {match.round}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-200 px-2.5 py-1 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            Match {match.matchNumber}
          </span>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            ({match.section === "loser" ? "Loser Pool" : match.section === "final" ? "Finals" : `Group ${match.section}`})
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!ready ? (
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              Waiting for teams
            </span>
          ) : isCompleted ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <CheckCircle2 size={12} /> Completed
            </span>
          ) : match.status === "live" ? (
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

      <div className="px-6 py-6">
        <div className="mb-6 flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex-1 text-center md:text-left">
            <h3
              className={`truncate text-lg font-bold ${
                match.winner?._id === match.team1?._id
                  ? "text-emerald-600"
                  : match.team1
                    ? "text-zinc-800 dark:text-zinc-200"
                    : "text-zinc-400 italic"
              }`}
            >
              {t1Name}
            </h3>
            {isCompleted && (
              <p className="mt-1 font-mono text-sm text-zinc-500">{match.team1Score || "—"}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center justify-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-black text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
            VS
          </div>
          <div className="flex-1 text-center md:text-right">
            <h3
              className={`truncate text-lg font-bold ${
                match.winner?._id === match.team2?._id
                  ? "text-emerald-600"
                  : match.team2
                    ? "text-zinc-800 dark:text-zinc-200"
                    : "text-zinc-400 italic"
              }`}
            >
              {t2Name}
            </h3>
            {isCompleted && (
              <p className="mt-1 font-mono text-sm text-zinc-500">{match.team2Score || "—"}</p>
            )}
          </div>
        </div>

        {isCompleted ? (
          <p className="rounded-lg bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
            Winner: {match.winner?.name || "—"}
          </p>
        ) : ready ? (
          <>
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

            <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-xl bg-zinc-50 p-3 sm:flex-row dark:bg-zinc-900/30">
              <select
                value={winnerId}
                onChange={(e) => setWinnerId(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium outline-none transition-all focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 sm:w-48 dark:border-zinc-700 dark:bg-zinc-900"
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
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto dark:focus:ring-offset-zinc-900"
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
          </>
        ) : (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-center text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            Teams will appear here automatically when previous round winners advance.
          </p>
        )}
      </div>
    </div>
  );
}
