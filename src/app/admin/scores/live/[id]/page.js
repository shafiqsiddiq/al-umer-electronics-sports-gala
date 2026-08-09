"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Check,
  Radio,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import CricketLoader from "@/components/CricketLoader";
import LiveScoreboardOverlay from "@/components/LiveScoreboardOverlay";
import {
  ballsToOvers,
  formatScoreLine,
  formatBowlerFigures,
  battingTeamName,
  bowlingTeamName,
  remainingBallsInOver,
  matchResult,
  matchInningsSummaries,
} from "@/lib/live-score";

export default function LiveScorerPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newBatsman, setNewBatsman] = useState("");
  /** After tapping Wide / No Ball — pick extra runs */
  const [extraPicker, setExtraPicker] = useState(null); // null | "wide" | "noball"
  const [nextBowler, setNextBowler] = useState("");
  const [setup, setSetup] = useState({
    tossWinnerId: "",
    tossDecision: "bat",
    oversLimit: 4,
    batsman1Name: "",
    batsman2Name: "",
    bowlerName: "",
  });

  const live = data?.liveScore;
  const team1 = data?.team1;
  const team2 = data?.team2;

  const overlayUrl = useMemo(() => {
    if (typeof window === "undefined" || !id) return "";
    return `${window.location.origin}/overlay/${id}`;
  }, [id]);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/matches/${id}/live`, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to load");
    setData(json);
    return json;
  }, [id]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    refresh()
      .then((json) => {
        if (!alive) return;
        setSetup((s) => ({
          ...s,
          tossWinnerId: json.team1?._id || "",
          batsman1Name: json.team1?.captain?.name || s.batsman1Name,
        }));
      })
      .catch((err) => toast(err.message, "error"))
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id, refresh, toast]);

  async function postAction(body) {
    setBusy(true);
    try {
      const res = await fetch(`/api/matches/${id}/live`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Action failed");
      setData(json);
      return json;
    } catch (err) {
      toast(err.message, "error");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function handleStart(e) {
    e.preventDefault();
    await postAction({
      action: "start",
      ...setup,
      tossWinnerId: setup.tossWinnerId || team1?._id,
    });
    toast("Live scoring started — open overlay in OBS", "success");
  }

  const needsNewBowler = Boolean(
    live?.status === "live" &&
      (live?._overJustEnded || remainingBallsInOver(live?.thisOver || []) === 0)
  );

  async function sendBall(type, runs = 0) {
    if (needsNewBowler) {
      toast("Pehle naya bowler set karo", "error");
      return;
    }
    const payload = { action: "ball", type, runs };
    if (type === "wicket") {
      if (!newBatsman.trim()) {
        toast("Enter new batsman name first", "error");
        return;
      }
      payload.newBatsmanName = newBatsman.trim();
    }
    await postAction(payload);
    if (type === "wicket") setNewBatsman("");
    setExtraPicker(null);
  }

  async function sendExtra(type, extraRuns) {
    await sendBall(type, extraRuns);
  }

  async function confirmNewBowler() {
    const name = nextBowler.trim();
    if (!name) {
      toast("Naye bowler ka naam likho", "error");
      return;
    }
    await postAction({
      action: "patch",
      changeBowler: true,
      bowlerName: name,
    });
    setNextBowler("");
    toast(`Naya bowler: ${name}`, "success");
  }

  async function copyOverlay() {
    try {
      await navigator.clipboard.writeText(overlayUrl);
      setCopied(true);
      toast("Overlay URL copied", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Could not copy URL", "error");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <CricketLoader label="Loading live scorer…" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-3 px-1 pb-12 sm:space-y-4 sm:px-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <Link
          href="/admin/scores"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-600 hover:text-emerald-700"
        >
          <ArrowLeft size={16} />
          Scores
        </Link>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button
            type="button"
            onClick={copyOverlay}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-2.5 text-xs font-bold text-violet-700"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            Copy OBS URL
          </button>
          <a
            href={overlayUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-2.5 text-xs font-bold text-zinc-700"
          >
            <ExternalLink size={14} />
            Preview
          </a>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm dark:border-emerald-900/40 dark:bg-zinc-950">
        <div className="flex items-start gap-2 border-b border-zinc-100 px-3 py-3 dark:border-zinc-800 sm:px-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500 text-white">
            <Radio size={16} />
          </span>
          <div className="min-w-0">
            <h1 className="text-base font-black text-zinc-900 dark:text-white sm:text-lg">
              Live Scorer
            </h1>
            <p className="truncate text-xs text-zinc-500">
              {team1?.name || "TBD"} vs {team2?.name || "TBD"}
              {data?.status === "live" ? " · LIVE" : ""}
            </p>
          </div>
        </div>

        <div className="p-2 sm:p-3">
          <LiveScoreboardOverlay matchId={id} preview />
        </div>
      </div>

      {!live ? (
        <form
          onSubmit={handleStart}
          className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-3 sm:p-4 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <h2 className="text-sm font-black uppercase tracking-wide text-zinc-700">
            Start live (toss + openers)
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-bold text-zinc-500">
              Toss winner
              <select
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm font-semibold"
                value={setup.tossWinnerId}
                onChange={(e) =>
                  setSetup((s) => ({ ...s, tossWinnerId: e.target.value }))
                }
              >
                <option value={team1?._id}>{team1?.name}</option>
                <option value={team2?._id}>{team2?.name}</option>
              </select>
            </label>
            <label className="block text-xs font-bold text-zinc-500">
              Decision
              <select
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm font-semibold"
                value={setup.tossDecision}
                onChange={(e) =>
                  setSetup((s) => ({ ...s, tossDecision: e.target.value }))
                }
              >
                <option value="bat">Bat</option>
                <option value="bowl">Bowl</option>
              </select>
            </label>
            <label className="block text-xs font-bold text-zinc-500">
              Overs
              <input
                type="number"
                min={1}
                max={20}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm font-semibold"
                value={setup.oversLimit}
                onChange={(e) =>
                  setSetup((s) => ({
                    ...s,
                    oversLimit: Number(e.target.value) || 4,
                  }))
                }
              />
            </label>
            <label className="block text-xs font-bold text-zinc-500">
              Bowler
              <input
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm font-semibold"
                value={setup.bowlerName}
                onChange={(e) =>
                  setSetup((s) => ({ ...s, bowlerName: e.target.value }))
                }
                placeholder="Bowler name"
                required
              />
            </label>
            <label className="block text-xs font-bold text-zinc-500">
              Batsman 1 (strike)
              <input
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm font-semibold"
                value={setup.batsman1Name}
                onChange={(e) =>
                  setSetup((s) => ({ ...s, batsman1Name: e.target.value }))
                }
                placeholder="On strike"
                required
              />
            </label>
            <label className="block text-xs font-bold text-zinc-500">
              Batsman 2
              <input
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm font-semibold"
                value={setup.batsman2Name}
                onChange={(e) =>
                  setSetup((s) => ({ ...s, batsman2Name: e.target.value }))
                }
                placeholder="Non-strike"
                required
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 text-sm font-bold text-white shadow disabled:opacity-50"
          >
            {busy ? "Starting…" : "Go Live"}
          </button>
        </form>
      ) : (
        <div className="space-y-3">
          {/* Sticky score summary while tapping runs */}
          <div className="sticky top-16 z-20 rounded-2xl border border-zinc-200 bg-white/95 p-3 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95 sm:static sm:p-4">
            <p className="text-center text-[11px] font-semibold leading-snug text-zinc-500 sm:text-xs">
              {battingTeamName(live)} batting · {bowlingTeamName(live)} bowling
            </p>
            <p className="mt-1 text-center text-3xl font-black tabular-nums text-zinc-900 dark:text-white sm:text-4xl">
              {formatScoreLine(live.runs, live.wickets)}{" "}
              <span className="text-base text-zinc-500 sm:text-lg">
                ({ballsToOvers(live.balls)}/{live.oversLimit})
              </span>
            </p>
            {live.target && live.status === "live" ? (
              <p className="mt-1 text-center text-xs font-bold text-emerald-700">
                Need {Math.max(0, live.target - live.runs)} from{" "}
                {Math.max(
                  0,
                  (live.oversLimit || 4) * 6 - (live.balls || 0)
                )}{" "}
                balls (target {live.target})
              </p>
            ) : null}
            {live.status === "ended" && matchResult(live)?.text ? (
              <p className="mt-2 rounded-xl bg-emerald-600 px-3 py-2 text-center text-sm font-black text-white">
                {matchResult(live).text}
              </p>
            ) : (
              <p className="mt-1 text-center text-xs text-zinc-500">
                Bowler {live.bowler?.name}: {formatBowlerFigures(live.bowler)}
              </p>
            )}
          </div>

          {live.status === "live" && (
            <>
              {needsNewBowler && (
                <div className="rounded-2xl border-2 border-violet-400 bg-violet-50 p-3 shadow-sm dark:border-violet-700 dark:bg-violet-950/40">
                  <p className="text-center text-sm font-black text-violet-900 dark:text-violet-200">
                    Over complete — change bowler
                  </p>
                  <p className="mt-1 text-center text-[11px] text-violet-700 dark:text-violet-300">
                    Last bowler: {live.bowler?.name || "—"}. Same bowler next
                    over nahi ho sakta.
                  </p>
                  <label className="mt-3 block text-xs font-bold text-violet-800 dark:text-violet-200">
                    New bowler name
                    <input
                      className="mt-1 w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm font-semibold dark:border-violet-800 dark:bg-zinc-950"
                      value={nextBowler}
                      onChange={(e) => setNextBowler(e.target.value)}
                      placeholder="Next bowler"
                      autoFocus
                    />
                  </label>
                  <button
                    type="button"
                    disabled={busy || !nextBowler.trim()}
                    onClick={confirmNewBowler}
                    className="mt-2 min-h-[3rem] w-full rounded-xl bg-violet-600 text-sm font-bold text-white disabled:opacity-40"
                  >
                    Set bowler & continue
                  </button>
                </div>
              )}

              <fieldset
                disabled={needsNewBowler || busy}
                className="space-y-3 disabled:opacity-45"
              >
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3, 4, 6].map((r) => (
                  <button
                    key={r}
                    type="button"
                    disabled={busy}
                    onClick={() => sendBall("run", r)}
                    className="min-h-[3.25rem] rounded-2xl bg-emerald-600 text-xl font-black text-white shadow active:scale-95 disabled:opacity-40 sm:min-h-[3.5rem] sm:py-4"
                  >
                    {r}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    setExtraPicker((p) => (p === "wide" ? null : "wide"))
                  }
                  className={`col-span-2 min-h-[3.25rem] rounded-2xl text-sm font-black shadow active:scale-95 disabled:opacity-40 sm:col-span-1 sm:min-h-[3.5rem] ${
                    extraPicker === "wide"
                      ? "bg-amber-500 ring-2 ring-amber-700 text-zinc-900"
                      : "bg-amber-400 text-zinc-900"
                  }`}
                >
                  Wide
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    setExtraPicker((p) => (p === "noball" ? null : "noball"))
                  }
                  className={`min-h-[3rem] rounded-xl text-sm font-bold text-white disabled:opacity-40 ${
                    extraPicker === "noball"
                      ? "bg-amber-600 ring-2 ring-amber-800"
                      : "bg-amber-500"
                  }`}
                >
                  No Ball
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => sendBall("bye", 1)}
                  className="min-h-[3rem] rounded-xl bg-sky-600 text-sm font-bold text-white disabled:opacity-40"
                >
                  Bye 1
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => sendBall("legbye", 1)}
                  className="min-h-[3rem] rounded-xl bg-sky-700 text-sm font-bold text-white disabled:opacity-40"
                >
                  Lb 1
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => postAction({ action: "undo" })}
                  className="inline-flex min-h-[3rem] items-center justify-center gap-1 rounded-xl border border-zinc-300 bg-white text-sm font-bold text-zinc-700 disabled:opacity-40"
                >
                  <RotateCcw size={14} />
                  Undo
                </button>
              </div>

              {extraPicker && (
                <div
                  className={`rounded-2xl border p-3 ${
                    extraPicker === "wide"
                      ? "border-amber-300 bg-amber-50"
                      : "border-orange-300 bg-orange-50"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-black uppercase tracking-wide text-zinc-800">
                      {extraPicker === "wide"
                        ? "Wide + extra runs (0–4)"
                        : "No Ball + bat/bye runs (0–6)"}
                    </p>
                    <button
                      type="button"
                      onClick={() => setExtraPicker(null)}
                      className="text-[11px] font-bold text-zinc-500"
                    >
                      Cancel
                    </button>
                  </div>
                  <p className="mb-2 text-[11px] text-zinc-600">
                    {extraPicker === "wide"
                      ? "Total = 1 (wide) + selected. 0 = only wide."
                      : "Total = 1 (no-ball) + selected. 0 = only no-ball."}
                  </p>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                    {(extraPicker === "wide"
                      ? [0, 1, 2, 3, 4]
                      : [0, 1, 2, 3, 4, 5, 6]
                    ).map((r) => (
                      <button
                        key={r}
                        type="button"
                        disabled={busy}
                        onClick={() => sendExtra(extraPicker, r)}
                        className={`min-h-[3rem] rounded-xl text-lg font-black text-white shadow active:scale-95 disabled:opacity-40 ${
                          extraPicker === "wide"
                            ? "bg-amber-500"
                            : "bg-orange-600"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3">
                <label className="block text-xs font-bold text-rose-700">
                  New batsman (after wicket)
                  <input
                    className="mt-1 w-full rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-sm font-semibold"
                    value={newBatsman}
                    onChange={(e) => setNewBatsman(e.target.value)}
                    placeholder="Incoming batsman name"
                  />
                </label>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => sendBall("wicket")}
                  className="min-h-[3rem] w-full rounded-xl bg-rose-600 text-sm font-bold text-white disabled:opacity-40"
                >
                  Wicket
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                <NamePatch
                  label="Strike / Bat 1"
                  value={live.batsman1?.name}
                  disabled={busy}
                  onSave={(name) =>
                    postAction({ action: "patch", batsman1Name: name })
                  }
                />
                <NamePatch
                  label="Bat 2"
                  value={live.batsman2?.name}
                  disabled={busy}
                  onSave={(name) =>
                    postAction({ action: "patch", batsman2Name: name })
                  }
                />
                <NamePatch
                  label="Bowler"
                  value={live.bowler?.name}
                  disabled={busy}
                  onSave={(name) =>
                    postAction({ action: "patch", bowlerName: name })
                  }
                />
              </div>

              <button
                type="button"
                disabled={busy || needsNewBowler}
                onClick={() =>
                  postAction({ action: "patch", swapStrike: true })
                }
                className="min-h-[3rem] w-full rounded-xl border border-zinc-200 text-sm font-bold text-zinc-700 disabled:opacity-40"
              >
                Swap strike
              </button>
              </fieldset>
            </>
          )}

          {live.status === "innings_break" && (
            <SecondInningsForm
              busy={busy}
              onStart={(fields) =>
                postAction({ action: "second_innings", ...fields })
              }
              target={live.runs + 1}
            />
          )}

          {live.status === "ended" && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center dark:border-emerald-900 dark:bg-emerald-950/40">
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  {matchResult(live)?.isTie ? "Result" : "Winner"}
                </p>
                <p className="mt-1 text-lg font-black text-emerald-900 dark:text-emerald-100">
                  {matchResult(live)?.text || "Match ended"}
                </p>
                <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">
                  Scores page se isi winner ko select karke Save Result karo
                  (bracket advance).
                </p>
                <Link
                  href="/admin/scores"
                  className="mt-3 inline-flex rounded-full bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white"
                >
                  Back to Scores
                </Link>
              </div>

              {matchInningsSummaries(live).length > 0 && (
                <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
                  <p className="mb-2 text-center text-xs font-black uppercase tracking-wide text-zinc-500">
                    Both teams — performance
                  </p>
                  <div className="space-y-3">
                    {matchInningsSummaries(live).map((inn) => (
                      <div
                        key={inn.label}
                        className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase text-zinc-400">
                              {inn.label}
                            </p>
                            <p className="truncate text-sm font-black text-zinc-900 dark:text-white">
                              {inn.teamName}
                            </p>
                          </div>
                          <p className="shrink-0 text-base font-black tabular-nums text-emerald-700 dark:text-emerald-400">
                            {inn.scoreLine}
                          </p>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <p className="font-bold uppercase text-zinc-400">
                              Top batting
                            </p>
                            {(inn.battingCard || [])
                              .slice()
                              .sort(
                                (a, b) =>
                                  (Number(b.runs) || 0) - (Number(a.runs) || 0)
                              )
                              .slice(0, 3)
                              .map((b) => (
                                <p
                                  key={`${inn.label}-${b.name}-${b.runs}`}
                                  className="truncate text-zinc-700 dark:text-zinc-300"
                                >
                                  {b.name}{" "}
                                  <span className="font-bold">
                                    {b.runs}
                                    {b.how === "not out" ? "*" : ""}
                                  </span>
                                  {b.sixes ? (
                                    <span className="text-zinc-400">
                                      {" "}
                                      ({b.sixes}×6)
                                    </span>
                                  ) : null}
                                </p>
                              ))}
                          </div>
                          <div>
                            <p className="font-bold uppercase text-zinc-400">
                              Bowling
                            </p>
                            {(inn.bowlingCard || [])
                              .slice()
                              .sort(
                                (a, b) =>
                                  (Number(b.wickets) || 0) -
                                    (Number(a.wickets) || 0) ||
                                  (Number(a.runs) || 0) - (Number(b.runs) || 0)
                              )
                              .slice(0, 3)
                              .map((b) => (
                                <p
                                  key={`${inn.label}-bowl-${b.name}`}
                                  className="truncate text-zinc-700 dark:text-zinc-300"
                                >
                                  {b.name}{" "}
                                  <span className="font-bold">
                                    {b.wickets}-{b.runs}
                                  </span>
                                </p>
                              ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {(live.status === "live" || live.status === "innings_break") && (
            <button
              type="button"
              disabled={busy}
              onClick={() => postAction({ action: "end" })}
              className="min-h-[2.75rem] w-full rounded-xl border border-zinc-300 text-xs font-bold text-zinc-500"
            >
              End overlay scoring
            </button>
          )}
        </div>
      )}

      <p className="px-1 text-center text-[11px] leading-relaxed text-zinc-500">
        OBS: Sources → Browser → paste overlay URL → width 1920, height 220 →
        place at bottom. Facebook / YouTube pe OBS se Go Live.
      </p>
    </div>
  );
}

function NamePatch({ label, value, onSave, disabled }) {
  const [v, setV] = useState(value || "");
  useEffect(() => setV(value || ""), [value]);
  return (
    <label className="block rounded-xl border border-zinc-100 bg-zinc-50/80 p-2.5 text-[10px] font-bold uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50">
      {label}
      <div className="mt-1.5 flex gap-2">
        <input
          className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-semibold dark:border-zinc-700 dark:bg-zinc-950"
          value={v}
          onChange={(e) => setV(e.target.value)}
        />
        <button
          type="button"
          disabled={disabled || !v.trim() || v === value}
          onClick={() => onSave(v.trim())}
          className="shrink-0 rounded-xl bg-zinc-800 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-30"
        >
          Set
        </button>
      </div>
    </label>
  );
}

function SecondInningsForm({ busy, onStart, target }) {
  const [fields, setFields] = useState({
    batsman1Name: "",
    batsman2Name: "",
    bowlerName: "",
  });
  return (
    <form
      className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 sm:p-4"
      onSubmit={(e) => {
        e.preventDefault();
        onStart(fields);
      }}
    >
      <p className="text-center text-sm font-black text-amber-900">
        Innings break — Target {target}
      </p>
      <div className="grid grid-cols-1 gap-2">
        {["batsman1Name", "batsman2Name", "bowlerName"].map((key) => (
          <input
            key={key}
            required
            placeholder={
              key === "bowlerName"
                ? "Bowler"
                : key === "batsman1Name"
                  ? "Strike batsman"
                  : "Non-strike"
            }
            className="rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm font-semibold"
            value={fields[key]}
            onChange={(e) =>
              setFields((f) => ({ ...f, [key]: e.target.value }))
            }
          />
        ))}
      </div>
      <button
        type="submit"
        disabled={busy}
        className="min-h-[3rem] w-full rounded-xl bg-amber-500 text-sm font-bold text-zinc-900 disabled:opacity-40"
      >
        Start 2nd innings
      </button>
    </form>
  );
}
