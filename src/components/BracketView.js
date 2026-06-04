export default function BracketView({ matches, title }) {
  const rounds = {};
  matches.forEach((m) => {
    const key = `R${m.round}`;
    if (!rounds[key]) rounds[key] = [];
    rounds[key].push(m);
  });

  const roundKeys = Object.keys(rounds).sort();

  return (
    <div>
      <h3 className="mb-4 text-lg font-bold">{title}</h3>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {roundKeys.map((roundKey) => (
          <div key={roundKey} className="min-w-[220px] flex-shrink-0">
            <h4 className="mb-3 text-center text-sm font-semibold uppercase text-zinc-500">
              {roundKey}
            </h4>
            <div className="space-y-3">
              {rounds[roundKey]
                .sort((a, b) => a.matchNumber - b.matchNumber)
                .map((match) => (
                  <div
                    key={match._id}
                    className="rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <p className={match.winner?._id === match.team1?._id ? "font-bold text-emerald-600" : ""}>
                      {match.team1?.name || "TBD"}
                    </p>
                    <p className="my-1 text-center text-xs text-zinc-400">vs</p>
                    <p className={match.winner?._id === match.team2?._id ? "font-bold text-emerald-600" : ""}>
                      {match.team2?.name || "TBD"}
                    </p>
                    {match.status === "completed" && (
                      <p className="mt-2 text-center text-xs text-zinc-500">
                        {match.team1Score} - {match.team2Score}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
