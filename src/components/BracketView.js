import { Trophy, Radio, Circle } from "lucide-react";

function initials(name) {
  if (!name || name === "TBD") return "?";
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function BracketMatchCard({ match }) {
  const isLive = match.status === "live";
  const isCompleted = match.status === "completed";
  const t1Win = match.winner?._id && match.winner._id === match.team1?._id;
  const t2Win = match.winner?._id && match.winner._id === match.team2?._id;

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow-md dark:bg-zinc-950 ${
        isLive
          ? "border-rose-300 ring-1 ring-rose-200 dark:border-rose-800"
          : isCompleted
            ? "border-emerald-200 dark:border-emerald-900/50"
            : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <div
        className={`absolute inset-y-0 left-0 w-1 ${
          isLive
            ? "bg-rose-500"
            : isCompleted
              ? "bg-emerald-500"
              : "bg-zinc-300 dark:bg-zinc-600"
        }`}
      />

      <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-1.5 dark:border-zinc-800">
        <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
          M{match.matchNumber}
        </span>
        {isLive && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-rose-600">
            <Radio size={10} /> Live
          </span>
        )}
        {isCompleted && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-600">
            <Trophy size={10} /> Done
          </span>
        )}
        {match.status === "scheduled" && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-zinc-400">
            <Circle size={8} className="fill-current" /> TBD
          </span>
        )}
      </div>

      <div className="space-y-1 p-2.5">
        <TeamLine
          name={match.team1?.name}
          score={match.team1Score}
          won={t1Win}
          lost={isCompleted && !t1Win && !!match.winner}
          showScore={isCompleted || isLive}
        />
        <TeamLine
          name={match.team2?.name}
          score={match.team2Score}
          won={t2Win}
          lost={isCompleted && !t2Win && !!match.winner}
          showScore={isCompleted || isLive}
        />
      </div>
    </div>
  );
}

function TeamLine({ name, score, won, lost, showScore }) {
  const label = name || "TBD";
  const tbd = !name;

  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${
        won ? "bg-emerald-50 dark:bg-emerald-950/40" : ""
      }`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-black ${
          won
            ? "bg-emerald-600 text-white"
            : tbd
              ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
              : "bg-gradient-to-br from-teal-500 to-emerald-600 text-white"
        }`}
      >
        {initials(label)}
      </span>
      <span
        className={`min-w-0 flex-1 truncate text-xs font-bold ${
          won
            ? "text-emerald-700 dark:text-emerald-300"
            : lost
              ? "text-zinc-400 line-through decoration-zinc-300"
              : tbd
                ? "italic text-zinc-400"
                : "text-zinc-800 dark:text-zinc-100"
        }`}
      >
        {label}
      </span>
      {showScore && (
        <span
          className={`font-mono text-sm font-black tabular-nums ${
            won ? "text-emerald-700" : "text-zinc-600 dark:text-zinc-300"
          }`}
        >
          {score || "—"}
        </span>
      )}
    </div>
  );
}

const ROUND_LABELS = {
  1: "Round of 16",
  2: "Quarter-Final",
  3: "Semi / Qualify",
};

export default function BracketView({ matches, title, accent = "emerald" }) {
  const rounds = {};
  matches.forEach((m) => {
    if (!rounds[m.round]) rounds[m.round] = [];
    rounds[m.round].push(m);
  });

  const roundKeys = Object.keys(rounds)
    .map(Number)
    .sort((a, b) => a - b);

  if (roundKeys.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/70 px-6 py-14 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
        <p className="font-medium text-zinc-600 dark:text-zinc-300">
          No bracket matches yet
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          Fixtures will appear here once generated.
        </p>
      </div>
    );
  }

  const completed = matches.filter((m) => m.status === "completed").length;
  const live = matches.filter((m) => m.status === "live").length;

  const accentBar =
    accent === "amber"
      ? "from-amber-500 to-orange-500"
      : accent === "sky"
        ? "from-sky-500 to-teal-500"
        : "from-emerald-500 to-teal-500";

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 bg-gradient-to-r from-emerald-50/80 to-transparent px-5 py-4 dark:border-zinc-800 dark:from-emerald-950/30">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
            {title}
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            {matches.length} matches · {completed} completed
            {live > 0 ? ` · ${live} live` : ""}
          </p>
        </div>
        <div className={`h-2 w-16 rounded-full bg-gradient-to-r ${accentBar}`} />
      </div>

      <div className="overflow-x-auto p-5">
        <div
          className="inline-flex min-w-full items-stretch gap-0"
          style={{ minWidth: `${roundKeys.length * 260}px` }}
        >
          {roundKeys.map((round, colIdx) => {
            const colMatches = rounds[round].sort(
              (a, b) => a.matchNumber - b.matchNumber
            );
            const isLast = colIdx === roundKeys.length - 1;

            return (
              <div key={round} className="relative flex flex-1 items-stretch">
                {/* Round column */}
                <div className="flex w-[240px] flex-col px-2">
                  <div className="mb-4 text-center">
                    <span className="inline-flex rounded-full bg-zinc-900 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white dark:bg-white dark:text-zinc-900">
                      R{round}
                    </span>
                    <p className="mt-1.5 text-[11px] font-semibold text-zinc-400">
                      {ROUND_LABELS[round] || `Round ${round}`}
                    </p>
                  </div>

                  <div className="flex flex-1 flex-col justify-around gap-4">
                    {colMatches.map((match) => (
                      <div key={match._id} className="relative py-2">
                        <BracketMatchCard match={match} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Connector to next round */}
                {!isLast && (
                  <div className="relative w-10 shrink-0 self-stretch">
                    <svg
                      className="absolute inset-0 h-full w-full text-emerald-300 dark:text-emerald-800"
                      preserveAspectRatio="none"
                      viewBox="0 0 40 100"
                    >
                      {colMatches.map((_, i) => {
                        const n = colMatches.length;
                        const y1 = ((i + 0.5) / n) * 100;
                        const pair = Math.floor(i / 2);
                        const pairs = Math.ceil(n / 2);
                        const y2 = ((pair + 0.5) / pairs) * 100;
                        return (
                          <g key={i}>
                            <line
                              x1="0"
                              y1={y1}
                              x2="18"
                              y2={y1}
                              stroke="currentColor"
                              strokeWidth="1.5"
                            />
                            <line
                              x1="18"
                              y1={y1}
                              x2="18"
                              y2={y2}
                              stroke="currentColor"
                              strokeWidth="1.5"
                            />
                            <line
                              x1="18"
                              y1={y2}
                              x2="40"
                              y2={y2}
                              stroke="currentColor"
                              strokeWidth="1.5"
                            />
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
