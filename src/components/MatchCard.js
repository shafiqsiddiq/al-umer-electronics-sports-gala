export default function MatchCard({ match }) {
  const isLive = match.status === "live";
  const isCompleted = match.status === "completed";

  return (
    <div
      className={`rounded-xl border p-4 transition ${
        isLive
          ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
          : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
      }`}
    >
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="font-medium uppercase text-zinc-500">
          {match.section !== "final" && match.section !== "loser"
            ? `Section ${match.section}`
            : match.section === "loser"
              ? "Second Chance"
              : "Final Stage"}{" "}
          · R{match.round}
        </span>
        {isLive && (
          <span className="flex items-center gap-1 font-semibold text-red-600">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            LIVE
          </span>
        )}
        {isCompleted && <span className="text-emerald-600">Completed</span>}
        {match.status === "scheduled" && <span className="text-zinc-400">Scheduled</span>}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span
            className={`font-semibold ${match.winner?._id === match.team1?._id ? "text-emerald-600" : ""}`}
          >
            {match.team1?.name || "TBD"}
          </span>
          <span className="font-mono text-lg">{match.team1Score || "-"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span
            className={`font-semibold ${match.winner?._id === match.team2?._id ? "text-emerald-600" : ""}`}
          >
            {match.team2?.name || "TBD"}
          </span>
          <span className="font-mono text-lg">{match.team2Score || "-"}</span>
        </div>
      </div>

      {match.venue && (
        <p className="mt-3 text-xs text-zinc-500">Venue: {match.venue}</p>
      )}
    </div>
  );
}
