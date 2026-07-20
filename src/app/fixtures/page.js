import { fetchSanity } from "@/lib/sanity";
import FixturesClient from "@/components/FixturesClient";
import { CalendarDays } from "lucide-react";

async function getFixtures() {
  try {
    return await fetchSanity(`
      *[_type == "match"] | order(section asc, round asc, matchNumber asc) {
        _id, section, round, matchNumber, bracketType, status,
        team1Score, team2Score, venue, scheduledAt,
        team1->{ _id, name }, team2->{ _id, name },
        winner->{ _id, name }
      }
    `);
  } catch {
    return [];
  }
}

export default async function FixturesPage() {
  const matches = await getFixtures();

  return (
    <div className="relative min-h-[70vh] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/90 via-white to-teal-50/50 dark:from-emerald-950/40 dark:via-zinc-950 dark:to-teal-950/20" />
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-600/10" />
        <div className="absolute -right-16 top-40 h-80 w-80 rounded-full bg-teal-300/15 blur-3xl dark:bg-teal-600/10" />
        <div
          className="absolute inset-0 opacity-[0.3] dark:opacity-[0.1]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgb(16 185 129 / 0.2) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10 max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
            <CalendarDays size={13} />
            Match Schedule
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            Fixtures
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            Browse all tournament matches by group and round — Group A, B, C, Second Chance, and Final Stage.
          </p>
        </header>

        <FixturesClient matches={matches} />
      </div>
    </div>
  );
}
