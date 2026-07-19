import { fetchSanity } from "@/lib/sanity";
import MatchCard from "@/components/MatchCard";
import { TOTAL_TEAMS } from "@/lib/tournament-logic";

async function getFixtures() {
  try {
    return await fetchSanity(`
      *[_type == "match"] | order(section asc, round asc, matchNumber asc) {
        _id, section, round, matchNumber, bracketType, status,
        team1Score, team2Score, venue, scheduledAt,
        team1->{ _id, name }, team2->{ _id, name }, winner->{ _id }
      }
    `);
  } catch {
    return [];
  }
}

export default async function FixturesPage() {
  const matches = await getFixtures();

  const grouped = {};
  matches.forEach((m) => {
    const key = m.section === "loser" ? "Second Chance" : m.section === "final" ? "Final Stage" : `Section ${m.section}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(m);
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">Fixtures</h1>
      <p className="mb-8 text-zinc-500">All tournament matches by section and round</p>

      {matches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center text-zinc-500 dark:border-zinc-700">
          No fixtures yet. Admin can generate fixtures once {TOTAL_TEAMS} teams are registered.
        </div>
      ) : (
        Object.entries(grouped).map(([section, sectionMatches]) => (
          <div key={section} className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-emerald-600">{section}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sectionMatches.map((match) => (
                <MatchCard key={match._id} match={match} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
