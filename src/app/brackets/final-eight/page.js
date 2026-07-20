import { fetchSanity } from "@/lib/sanity";
import BracketView from "@/components/BracketView";
import ChampionCard from "@/components/ChampionCard";
import { Trophy, Medal } from "lucide-react";

async function getFinalEightData() {
  try {
    const [teams, matches] = await Promise.all([
      fetchSanity(`
        *[_type == "team" && status in ["qualified_main", "qualified_loser", "final_eight", "champion"]] 
        | order(name asc) { _id, name, status, section, wins, losses }
      `),
      fetchSanity(`
        *[_type == "match" && section == "final"] | order(round asc, matchNumber asc) {
          _id, round, matchNumber, bracketType, status, team1Score, team2Score,
          team1->{ _id, name }, team2->{ _id, name }, winner->{ _id, name }
        }
      `),
    ]);
    return { teams: teams || [], matches: matches || [] };
  } catch {
    return { teams: [], matches: [] };
  }
}

export default async function FinalEightPage() {
  const { teams, matches } = await getFinalEightData();

  const grandFinal = matches.find(
    (m) => m.round === 3 && m.status === "completed" && m.winner
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

  return (
    <div className="relative min-h-[70vh] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/90 via-white to-teal-50/40 dark:from-emerald-950/40 dark:via-zinc-950 dark:to-teal-950/20" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
            <Trophy size={13} />
            Super 8
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            Final 8 Teams
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            6 from groups + 2 from Second Chance — quarter-finals to the grand finale
          </p>
        </header>

        {champion && (
          <ChampionCard team={champion} runnerUp={runnerUp} score={finalScore} />
        )}

        <div className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {teams.length === 0 ? (
            <p className="col-span-full rounded-2xl border border-dashed border-zinc-300 py-10 text-center text-zinc-500 dark:border-zinc-700">
              No teams qualified yet.
            </p>
          ) : (
            teams.map((team, i) => (
              <div
                key={team._id}
                className="rounded-2xl border border-emerald-200/80 bg-white p-4 shadow-sm dark:border-emerald-900/40 dark:bg-zinc-950"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <Medal size={14} className="text-amber-500" />
                </div>
                <p className="truncate font-bold text-zinc-900 dark:text-white">
                  {team.name}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {team.status === "qualified_main"
                    ? `Group ${team.section}`
                    : team.status === "qualified_loser"
                      ? "Second Chance"
                      : team.status === "champion"
                        ? "Champion"
                        : "Final Stage"}
                </p>
              </div>
            ))
          )}
        </div>

        {matches.length > 0 && (
          <BracketView matches={matches} title="Final Stage Knockout" />
        )}
      </div>
    </div>
  );
}
