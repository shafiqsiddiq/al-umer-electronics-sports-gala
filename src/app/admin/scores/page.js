"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/context/ToastContext";
import LuckyDrawSpinner from "@/components/LuckyDrawSpinner";
import ChampionCard from "@/components/ChampionCard";
import {
  Trophy,
  ShieldAlert,
  Flag,
  Activity,
  CheckCircle2,
  Circle,
  Medal,
  Users,
  ClipboardList,
} from "lucide-react";
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
    { id: "A", label: "Group A", icon: Flag },
    { id: "B", label: "Group B", icon: Flag },
    { id: "C", label: "Group C", icon: Flag },
    { id: "loser", label: "Loser Pool", icon: ShieldAlert },
    { id: "top8", label: "Top 8", icon: Medal },
    { id: "final", label: "Final Stage", icon: Trophy },
  ];

  const filteredMatches = matches
    .filter((m) => m.section === activeTab)
    .sort((a, b) => a.round - b.round || a.matchNumber - b.matchNumber);

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

  if (activeTab === "loser") {
    for (const r of [1, 2, 3]) {
      if (!matchesByRound[r]) matchesByRound[r] = [];
    }
  }

  const roundKeys = Object.keys(matchesByRound).sort((a, b) => Number(a) - Number(b));

  function loserRoundLabel(round) {
    const labels = {
      1: "Round 1 · 24 → 12",
      2: "Round 2 · 12 → 6",
      3: "Round 3 · 6 → 3",
      4: "Round 4 · Super 8 playoff",
    };
    return labels[Number(round)] || `Round ${round}`;
  }

  const emptySlots = Math.max(0, (top8.capacity || FINAL_EIGHT) - (top8.teams?.length || 0));

  const grandFinal = matches.find(
    (m) =>
      m.section === "final" &&
      m.round === 3 &&
      m.status === "completed" &&
      m.winner
  );
  const champion = grandFinal?.winner || null;
  const runnerUp =
    grandFinal && champion
      ? grandFinal.team1?._id === champion._id
        ? grandFinal.team2
        : grandFinal.team1
      : null;
  const finalScore =
    grandFinal?.team1Score || grandFinal?.team2Score
      ? `${grandFinal.team1Score || "—"} – ${grandFinal.team2Score || "—"}`
      : null;

  const tabMatchCount =
    activeTab === "top8"
      ? top8.count || 0
      : dedupedMatches.length;

  return (
    <div className="relative w-full space-y-5">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-200/70 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 px-4 py-4 text-white shadow-md dark:border-emerald-800 sm:px-5">
        <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/10" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <ClipboardList size={20} />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight sm:text-2xl">
                Score Updates
              </h1>
              <p className="text-xs text-emerald-50/90 sm:text-sm">
                Enter results and advance brackets
              </p>
            </div>
          </div>
          <div className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
            {tabMatchCount}{" "}
            {activeTab === "top8" ? "qualified" : "matches"}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold transition ${
                isActive
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25"
                  : "border border-zinc-200 bg-white text-zinc-600 hover:border-emerald-300 hover:text-emerald-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
              }`}
            >
              <Icon size={14} />
              {tab.label}
              {tab.id === "top8" && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
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
        <div className="space-y-4">
          {(luckyDrawInfo.needsSpinner ||
            luckyDrawInfo.spinDone ||
            luckyDrawInfo.finalThreeReady) &&
            (luckyDrawInfo.teams?.length || 0) === 3 && (
              <>
                <LuckyDrawSpinner
                  teams={luckyDrawInfo.teams}
                  onSpinComplete={handleSpinComplete}
                  locked={!luckyDrawInfo.needsSpinner}
                  spinDone={!!luckyDrawInfo.spinDone}
                />
                {luckyDrawInfo.spinDone && (
                  <p className="text-center text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    Lucky draw done — Round 4 playoff decides the 2nd Super 8
                    qualifier.
                  </p>
                )}
              </>
            )}

          <div className="overflow-hidden rounded-2xl border border-amber-200/80 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20">
            <div className="border-b border-amber-200/70 px-4 py-3 dark:border-amber-900/40">
              <h2 className="text-sm font-black text-amber-900 dark:text-amber-200">
                Round 1 Loser Pool ({loserPoolTeams.length})
              </h2>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-300/70">
                24 → 12 → 6 → 3 → lucky draw (1 bye) + playoff (1)
              </p>
            </div>
            {loserPoolTeams.length === 0 ? (
              <p className="px-4 py-5 text-sm text-amber-700/70 dark:text-amber-300/60">
                No Round 1 losers yet.
              </p>
            ) : (
              <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {loserPoolTeams.map((team, i) => (
                  <div
                    key={team._id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-amber-200/80 bg-white px-3 py-2 dark:border-amber-900/40 dark:bg-zinc-900"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                        {i + 1}. {team.name}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        Lost Group {team.fromSection} · R1 M{team.lostMatchNumber}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Pool
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "top8" ? (
        <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50/80 to-white dark:border-emerald-900/50 dark:from-emerald-950/30 dark:to-zinc-950">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 px-4 py-3 dark:border-emerald-900/40 sm:px-5">
            <div>
              <h2 className="font-black text-zinc-900 dark:text-white">Top 8 Pool</h2>
              <p className="text-xs text-zinc-500">
                Qualifiers appear here as groups finish
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <Users size={13} />
              {top8.count || 0}/{top8.capacity || FINAL_EIGHT}
            </div>
          </div>

          {(top8.teams?.length || 0) === 0 ? (
            <div className="flex flex-col items-center justify-center py-14">
              <Medal className="mb-2 text-zinc-300 dark:text-zinc-700" size={40} />
              <p className="font-medium text-zinc-500">No qualifiers yet</p>
            </div>
          ) : (
            <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
              {top8.teams.map((team, i) => (
                <div
                  key={team._id}
                  className="rounded-xl border border-emerald-200/80 bg-white p-3.5 shadow-sm dark:border-emerald-900/40 dark:bg-zinc-900"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {team.source}
                    </span>
                  </div>
                  <p className="truncate text-sm font-bold text-zinc-900 dark:text-white">
                    {team.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">
                    {team.wins ?? 0}W · {team.points ?? 0} pts
                  </p>
                </div>
              ))}
              {Array.from({ length: emptySlots }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex min-h-[88px] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50/70 p-3 text-center dark:border-zinc-700 dark:bg-zinc-900/40"
                >
                  <span className="mb-1 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-500 dark:bg-zinc-800">
                    {(top8.teams?.length || 0) + i + 1}
                  </span>
                  <p className="text-[10px] font-medium text-zinc-400">Waiting…</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {activeTab === "final" && champion && (
            <ChampionCard team={champion} runnerUp={runnerUp} score={finalScore} />
          )}

          {roundKeys.length > 0 ? (
            roundKeys.map((roundKey) => (
              <div key={roundKey}>
                <div className="mb-3 flex items-center gap-3">
                  <h2 className="text-base font-black tracking-tight text-zinc-800 dark:text-zinc-100">
                    {activeTab === "loser"
                      ? loserRoundLabel(roundKey)
                      : `Round ${roundKey}`}
                  </h2>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {matchesByRound[roundKey].length} match
                    {matchesByRound[roundKey].length !== 1 ? "es" : ""}
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-r from-zinc-200 to-transparent dark:from-zinc-800" />
                </div>

                {matchesByRound[roundKey].length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/30">
                    Waiting for previous round winners…
                  </div>
                ) : (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {matchesByRound[roundKey].map((match) => (
                      <ScoreUpdateForm
                        key={match._id}
                        match={match}
                        updating={updating === match._id}
                        onSubmit={(form) => updateScore(match._id, form)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white/60 py-14 dark:border-zinc-800 dark:bg-zinc-900/20">
              <Activity className="mb-2 text-zinc-300 dark:text-zinc-700" size={40} />
              <p className="font-medium text-zinc-500 dark:text-zinc-400">
                No matches for {tabs.find((t) => t.id === activeTab)?.label}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Generate fixtures after teams are registered
              </p>
              {["A", "B", "C"].includes(activeTab) &&
                (top8.teams || []).some((t) => t.section === activeTab) && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("top8")}
                    className="mt-3 text-sm font-semibold text-emerald-600 hover:underline"
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

  const sectionLabel =
    match.section === "loser"
      ? "Loser Pool"
      : match.section === "final"
        ? "Finals"
        : `Group ${match.section}`;

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-zinc-950 ${
        isCompleted
          ? "border-emerald-200 dark:border-emerald-900/50"
          : ready
            ? "border-zinc-200 dark:border-zinc-800"
            : "border-dashed border-zinc-300 opacity-90 dark:border-zinc-700"
      }`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-zinc-100 bg-zinc-50/90 px-3.5 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
            M{match.matchNumber}
          </span>
          <span className="rounded-md bg-zinc-200/80 px-2 py-0.5 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            R{match.round}
          </span>
          <span className="text-[10px] font-medium text-zinc-400">{sectionLabel}</span>
        </div>
        <StatusBadge status={match.status} ready={ready} isCompleted={isCompleted} />
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        {/* Scoreboard row */}
        <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <TeamSide
            name={t1Name}
            score={isCompleted ? match.team1Score : null}
            isWinner={match.winner?._id === match.team1?._id}
            align="left"
            selected={!isCompleted && ready && winnerId === match.team1?._id}
            onSelect={
              ready && !isCompleted && match.team1
                ? () => setWinnerId(match.team1._id)
                : undefined
            }
          />
          <span className="rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-black text-zinc-400 dark:bg-zinc-800">
            VS
          </span>
          <TeamSide
            name={t2Name}
            score={isCompleted ? match.team2Score : null}
            isWinner={match.winner?._id === match.team2?._id}
            align="right"
            selected={!isCompleted && ready && winnerId === match.team2?._id}
            onSelect={
              ready && !isCompleted && match.team2
                ? () => setWinnerId(match.team2._id)
                : undefined
            }
          />
        </div>

        {isCompleted ? (
          <p className="mt-auto rounded-xl bg-emerald-50 px-3 py-2 text-center text-xs font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
            Winner: {match.winner?.name || "—"}
          </p>
        ) : ready ? (
          <div className="mt-auto space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block truncate text-[10px] font-bold text-zinc-400">
                  {t1Name}
                </label>
                <input
                  placeholder="Score"
                  value={team1Score}
                  onChange={(e) => setTeam1Score(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/15 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div>
                <label className="mb-1 block truncate text-[10px] font-bold text-zinc-400 text-right">
                  {t2Name}
                </label>
                <input
                  placeholder="Score"
                  value={team2Score}
                  onChange={(e) => setTeam2Score(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-right text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/15 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
            </div>

            <p className="text-center text-[10px] font-medium text-zinc-400">
              Tap a team above to select winner
            </p>

            <button
              type="button"
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
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-2.5 text-sm font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updating ? (
                "Saving…"
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  Save Result
                </>
              )}
            </button>
          </div>
        ) : (
          <p className="mt-auto rounded-xl bg-amber-50 px-3 py-2 text-center text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            Waiting for teams to advance…
          </p>
        )}
      </div>
    </div>
  );
}

function TeamSide({ name, score, isWinner, align, selected, onSelect }) {
  const Comp = onSelect ? "button" : "div";
  return (
    <Comp
      type={onSelect ? "button" : undefined}
      onClick={onSelect}
      className={`min-w-0 rounded-xl px-2 py-2 transition ${
        onSelect ? "cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/30" : ""
      } ${selected ? "bg-emerald-50 ring-2 ring-emerald-400 dark:bg-emerald-950/40" : ""} ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      <p
        className={`truncate text-sm font-bold ${
          isWinner || selected
            ? "text-emerald-700 dark:text-emerald-300"
            : name === "TBD"
              ? "italic text-zinc-400"
              : "text-zinc-800 dark:text-zinc-100"
        }`}
        title={name}
      >
        {name}
      </p>
      {score != null && (
        <p className="mt-0.5 font-mono text-xs text-zinc-500">{score || "—"}</p>
      )}
    </Comp>
  );
}

function StatusBadge({ status, ready, isCompleted }) {
  if (!ready) {
    return (
      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
        Waiting
      </span>
    );
  }
  if (isCompleted) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
        <CheckCircle2 size={11} /> Done
      </span>
    );
  }
  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-500" />
        </span>
        LIVE
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-400">
      <Circle size={8} className="fill-current" /> Scheduled
    </span>
  );
}
