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
} from "@/lib/live-score";

export default function LiveScorerPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newBatsman, setNewBatsman] = useState("");
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

  async function sendBall(type, runs = 0) {
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
    <div className="mx-auto max-w-3xl space-y-4 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/admin/scores"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-600 hover:text-emerald-700"
        >
          <ArrowLeft size={16} />
          Scores
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={copyOverlay}
            className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            Copy OBS URL
          </button>
          <a
            href={overlayUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700"
          >
            <ExternalLink size={14} />
            Preview
          </a>
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm dark:border-emerald-900/40 dark:bg-zinc-950">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500 text-white">
            <Radio size={16} />
          </span>
          <div>
            <h1 className="text-lg font-black text-zinc-900 dark:text-white">
              Live Scorer
            </h1>
            <p className="text-xs text-zinc-500">
              {team1?.name || "TBD"} vs {team2?.name || "TBD"}
              {data?.status === "live" ? " · LIVE" : ""}
            </p>
          </div>
        </div>

        <LiveScoreboardOverlay matchId={id} preview />
      </div>

      {!live ? (
        <form
          onSubmit={handleStart}
          className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <h2 className="text-sm font-black uppercase tracking-wide text-zinc-700">
            Start live (toss + openers)
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-bold text-zinc-500">
              Toss winner
              <select
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold"
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
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold"
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
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold"
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
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold"
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
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold"
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
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold"
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
            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-bold text-white shadow disabled:opacity-50"
          >
            {busy ? "Starting…" : "Go Live"}
          </button>
        </form>
      ) : (
        <div className="space-y-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-center text-xs font-semibold text-zinc-500">
              {battingTeamName(live)} batting · {bowlingTeamName(live)} bowling
            </p>
            <p className="mt-1 text-center text-3xl font-black tabular-nums text-zinc-900 dark:text-white">
              {formatScoreLine(live.runs, live.wickets)}{" "}
              <span className="text-lg text-zinc-500">
                ({ballsToOvers(live.balls)}/{live.oversLimit})
              </span>
            </p>
            <p className="mt-1 text-center text-xs text-zinc-500">
              Bowler {live.bowler?.name}: {formatBowlerFigures(live.bowler)}
            </p>
          </div>

          {live.status === "live" && (
            <>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {[0, 1, 2, 3, 4, 6].map((r) => (
                  <button
                    key={r}
                    type="button"
                    disabled={busy}
                    onClick={() => sendBall("run", r)}
                    className="rounded-2xl bg-emerald-600 py-4 text-xl font-black text-white shadow active:scale-95 disabled:opacity-40"
                  >
                    {r}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => sendBall("wide")}
                  className="rounded-2xl bg-amber-400 py-4 text-sm font-black text-zinc-900 shadow active:scale-95 disabled:opacity-40"
                >
                  Wd
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => sendBall("noball")}
                  className="rounded-xl bg-amber-500 py-3 text-sm font-bold text-white disabled:opacity-40"
                >
                  No Ball
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => sendBall("bye", 1)}
                  className="rounded-xl bg-sky-600 py-3 text-sm font-bold text-white disabled:opacity-40"
                >
                  Bye 1
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => sendBall("legbye", 1)}
                  className="rounded-xl bg-sky-700 py-3 text-sm font-bold text-white disabled:opacity-40"
                >
                  Lb 1
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => postAction({ action: "undo" })}
                  className="inline-flex items-center justify-center gap-1 rounded-xl border border-zinc-300 bg-white py-3 text-sm font-bold text-zinc-700 disabled:opacity-40"
                >
                  <RotateCcw size={14} />
                  Undo
                </button>
              </div>

              <div className="flex flex-col gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 sm:flex-row sm:items-end">
                <label className="block flex-1 text-xs font-bold text-rose-700">
                  New batsman (after wicket)
                  <input
                    className="mt-1 w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-semibold"
                    value={newBatsman}
                    onChange={(e) => setNewBatsman(e.target.value)}
                    placeholder="Incoming batsman name"
                  />
                </label>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => sendBall("wicket")}
                  className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40"
                >
                  Wicket
                </button>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
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
                disabled={busy}
                onClick={() => postAction({ action: "patch", swapStrike: true })}
                className="w-full rounded-xl border border-zinc-200 py-2.5 text-sm font-bold text-zinc-700"
              >
                Swap strike
              </button>
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
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
              <p className="text-sm font-bold text-emerald-800">
                Innings / match scoring ended for overlay.
              </p>
              <p className="mt-1 text-xs text-emerald-700">
                Scores page se winner select karke Save Result karo (bracket advance).
              </p>
              <Link
                href="/admin/scores"
                className="mt-3 inline-flex rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white"
              >
                Back to Scores
              </Link>
            </div>
          )}

          {(live.status === "live" || live.status === "innings_break") && (
            <button
              type="button"
              disabled={busy}
              onClick={() => postAction({ action: "end" })}
              className="w-full rounded-xl border border-zinc-300 py-2.5 text-xs font-bold text-zinc-500"
            >
              End overlay scoring
            </button>
          )}
        </div>
      )}

      <p className="text-center text-[11px] leading-relaxed text-zinc-500">
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
    <label className="block text-[10px] font-bold uppercase text-zinc-500">
      {label}
      <div className="mt-1 flex gap-1">
        <input
          className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-sm font-semibold"
          value={v}
          onChange={(e) => setV(e.target.value)}
        />
        <button
          type="button"
          disabled={disabled || !v.trim() || v === value}
          onClick={() => onSave(v.trim())}
          className="rounded-lg bg-zinc-800 px-2 text-xs font-bold text-white disabled:opacity-30"
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
      className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        onStart(fields);
      }}
    >
      <p className="text-center text-sm font-black text-amber-900">
        Innings break — Target {target}
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
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
            className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm font-semibold"
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
        className="w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-zinc-900 disabled:opacity-40"
      >
        Start 2nd innings
      </button>
    </form>
  );
}
