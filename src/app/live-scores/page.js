import { fetchSanity } from "@/lib/sanity";
import MatchCard from "@/components/MatchCard";

export const revalidate = 10;

async function getLiveScores() {
  try {
    return await fetchSanity(`
      *[_type == "match" && (status == "live" || status == "completed")] 
      | order(status asc, scheduledAt desc) {
        _id, section, round, status, team1Score, team2Score,
        winner->{ _id, name }, venue, scheduledAt
      }
    `);
  } catch {
    return [];
  }
}

export default async function LiveScoresPage() {
  const matches = await getLiveScores();
  const live = matches.filter((m) => m.status === "live");
  const completed = matches.filter((m) => m.status === "completed");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">Live Scores</h1>
      <p className="mb-8 text-zinc-500">Real-time match updates</p>

      {live.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
            <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
            Live Matches
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {live.map((match) => (
              <MatchCard key={match._id} match={match} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-xl font-semibold">Recent Results</h2>
        {completed.length === 0 && live.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center text-zinc-500 dark:border-zinc-700">
            No live or completed matches yet.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completed.map((match) => (
              <MatchCard key={match._id} match={match} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
