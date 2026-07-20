import { Trophy, Circle } from "lucide-react";

function sectionLabel(section) {
  if (section === "loser") return "Second Chance";
  if (section === "final") return "Final Stage";
  return `Group ${section}`;
}

function initials(name) {
  if (!name || name === "TBD") return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function MatchCard({ match }) {
  const isLive = match.status === "live";
  const isCompleted = match.status === "completed";
  const isScheduled = match.status === "scheduled";

  const t1Win = match.winner?._id && match.winner._id === match.team1?._id;
  const t2Win = match.winner?._id && match.winner._id === match.team2?._id;

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:bg-zinc-950 ${
        isLive
          ? "border-rose-300 ring-1 ring-rose-200 dark:border-rose-800 dark:ring-rose-900/50"
          : isCompleted
            ? "border-emerald-200/80 dark:border-emerald-900/50"
            : "border-zinc-200/90 dark:border-zinc-800"
      }`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 ${
          isLive
            ? "bg-gradient-to-r from-rose-500 via-orange-400 to-rose-500"
            : isCompleted
              ? "bg-gradient-to-r from-emerald-500 to-teal-500"
              : "bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600"
        }`}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-100 px-4 pb-3 pt-4 dark:border-zinc-800/80">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            {sectionLabel(match.section)}
          </span>
          <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            R{match.round} · M{match.matchNumber}
          </span>
        </div>

        {isLive && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
            </span>
            Live
          </span>
        )}
        {isCompleted && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
            <Trophy size={10} />
            Done
          </span>
        )}
        {isScheduled && (
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            <Circle size={8} className="fill-current" />
            Upcoming
          </span>
        )}
      </div>

      {/* Teams */}
      <div className="space-y-3 px-4 py-4">
        <TeamRow
          name={match.team1?.name}
          score={match.team1Score}
          won={t1Win}
          lost={isCompleted && !t1Win && match.winner}
        />
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300 dark:text-zinc-600">
            vs
          </span>
          <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
        </div>
        <TeamRow
          name={match.team2?.name}
          score={match.team2Score}
          won={t2Win}
          lost={isCompleted && !t2Win && match.winner}
        />
      </div>

      {(match.venue || isCompleted) && (
        <div className="border-t border-zinc-100 bg-zinc-50/80 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/50">
          {match.venue && (
            <p className="text-xs text-zinc-500">Venue: {match.venue}</p>
          )}
          {isCompleted && match.winner?.name && (
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Winner: {match.winner.name}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

function TeamRow({ name, score, won, lost }) {
  const label = name || "TBD";
  const tbd = !name;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-2 py-1.5 transition ${
        won ? "bg-emerald-50/80 dark:bg-emerald-950/30" : ""
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
          won
            ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
            : tbd
              ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
              : "bg-gradient-to-br from-teal-500 to-emerald-600 text-white"
        }`}
      >
        {initials(label)}
      </span>
      <span
        className={`min-w-0 flex-1 truncate text-sm font-bold ${
          won
            ? "text-emerald-700 dark:text-emerald-300"
            : lost
              ? "text-zinc-400 dark:text-zinc-500"
              : tbd
                ? "italic text-zinc-400"
                : "text-zinc-900 dark:text-white"
        }`}
      >
        {label}
        {won && (
          <span className="ml-2 inline-block align-middle text-[10px] font-bold uppercase tracking-wide text-emerald-600">
            W
          </span>
        )}
      </span>
      <span
        className={`font-mono text-lg font-black tabular-nums ${
          won
            ? "text-emerald-700 dark:text-emerald-300"
            : "text-zinc-700 dark:text-zinc-200"
        }`}
      >
        {score || "—"}
      </span>
    </div>
  );
}
