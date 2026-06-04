import Link from "next/link";
import { fetchSanity } from "@/lib/sanity";
import TournamentFlow from "@/components/TournamentFlow";
import MatchCard from "@/components/MatchCard";
import { Trophy, Users, Target, Zap } from "lucide-react";

async function getHomeData() {
  try {
    const [teams, liveMatches, tournament] = await Promise.all([
      fetchSanity(`count(*[_type == "team" && status == "approved"])`),
      fetchSanity(`
        *[_type == "match" && status == "live"] | order(scheduledAt desc) [0...3] {
          _id, section, round, status, team1Score, team2Score,
          team1->{ _id, name }, team2->{ _id, name }, winner->{ _id }, venue
        }
      `),
      fetchSanity(`*[_type == "tournament"][0]{ name, status }`),
    ]);
    return { teams, liveMatches: liveMatches || [], tournament };
  } catch {
    return { teams: 0, liveMatches: [], tournament: null };
  }
}

export default async function HomePage() {
  const { teams, liveMatches, tournament } = await getHomeData();

  return (
    <div>
      <section className="bg-gradient-to-br from-emerald-600 to-emerald-800 px-4 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-4xl font-bold md:text-5xl">
            {tournament?.name || "Cricket Championship 2026"}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-100">
            48 teams · 3 knockout sections · Second chance bracket · Final 8 showdown
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/register"
              className="rounded-lg bg-white px-6 py-3 font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              Register Your Team
            </Link>
            <Link
              href="/fixtures"
              className="rounded-lg border-2 border-white px-6 py-3 font-semibold hover:bg-white/10"
            >
              View Fixtures
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Users, label: "Registered Teams", value: teams, max: 48 },
            { icon: Target, label: "Sections", value: 3, max: null },
            { icon: Zap, label: "Second Chance", value: 24, max: "losers" },
            { icon: Trophy, label: "Final Stage", value: 8, max: "teams" },
          ].map(({ icon: Icon, label, value, max }) => (
            <div
              key={label}
              className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <Icon className="mb-3 text-emerald-600" size={28} />
              <p className="text-3xl font-bold">{value}{max && typeof max === "number" ? `/${max}` : ""}</p>
              <p className="text-sm text-zinc-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {liveMatches.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-12">
          <h2 className="mb-6 text-2xl font-bold">Live Now</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {liveMatches.map((match) => (
              <MatchCard key={match._id} match={match} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-16">
        <TournamentFlow />
      </section>
    </div>
  );
}
