import { fetchSanity } from "@/lib/sanity";
import BracketView from "@/components/BracketView";

async function getLoserMatches() {
  try {
    return await fetchSanity(`
      *[_type == "match" && bracketType == "loser"] | order(round asc, matchNumber asc) {
        _id, round, matchNumber, status, team1Score, team2Score,
        team1->{ _id, name }, team2->{ _id, name }, winner->{ _id }
      }
    `);
  } catch {
    return [];
  }
}

export default async function LoserBracketPage() {
  const matches = await getLoserMatches();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">Second Chance Bracket</h1>
      <p className="mb-8 text-zinc-500">
        24 teams from Round 1 losses · Top 2 qualify for Final 8
      </p>

      {matches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center text-zinc-500 dark:border-zinc-700">
          Loser bracket will appear after Section Round 1 matches are completed.
        </div>
      ) : (
        <BracketView matches={matches} title="Second Chance Knockout (24 → 2)" />
      )}
    </div>
  );
}
