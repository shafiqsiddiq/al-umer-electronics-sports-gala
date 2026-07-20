import { fetchSanity } from "@/lib/sanity";
import BracketView from "@/components/BracketView";
import { Zap } from "lucide-react";

async function getLoserMatches() {
  try {
    return await fetchSanity(`
      *[_type == "match" && bracketType == "loser"] | order(round asc, matchNumber asc) {
        _id, round, matchNumber, status, team1Score, team2Score,
        team1->{ _id, name }, team2->{ _id, name }, winner->{ _id, name }
      }
    `);
  } catch {
    return [];
  }
}

export default async function LoserBracketPage() {
  const matches = await getLoserMatches();

  return (
    <div className="relative min-h-[70vh] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50/80 via-white to-orange-50/40 dark:from-amber-950/30 dark:via-zinc-950 dark:to-orange-950/20" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
            <Zap size={13} />
            Redemption Path
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            Second Chance Bracket
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            24 Round 1 losers · R1→R2→R3 → Lucky Draw · 2 teams qualify to Super 8
          </p>
        </header>

        {matches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/70 p-12 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
            <p className="font-medium text-zinc-600 dark:text-zinc-300">
              No Second Chance matches yet
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Bracket appears after all Group Round 1 matches are completed.
            </p>
          </div>
        ) : (
          <BracketView
            matches={matches}
            title="Second Chance Knockout (24 → 2)"
            accent="amber"
          />
        )}
      </div>
    </div>
  );
}
