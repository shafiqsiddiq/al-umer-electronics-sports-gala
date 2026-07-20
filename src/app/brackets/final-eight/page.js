import { fetchSanity } from "@/lib/sanity";
import BracketView from "@/components/BracketView";
import ChampionCard from "@/components/ChampionCard";

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
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">Final 8 Teams</h1>
      <p className="mb-8 text-zinc-500">6 from groups + 2 from Second Chance</p>

      {champion && (
        <ChampionCard team={champion} runnerUp={runnerUp} score={finalScore} />
      )}

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {teams.length === 0 ? (
          <p className="col-span-full text-zinc-500">No teams qualified yet.</p>
        ) : (
          teams.map((team) => (
            <div
              key={team._id}
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30"
            >
              <p className="font-bold">{team.name}</p>
              <p className="text-xs text-zinc-500">
                {team.status === "qualified_main"
                  ? `Group ${team.section}`
                  : team.status === "qualified_loser"
                    ? "Second Chance"
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
  );
}
