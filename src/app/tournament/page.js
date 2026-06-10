import Link from "next/link";
import { fetchSanity } from "@/lib/sanity";
import TournamentFlow from "@/components/TournamentFlow";
import MatchCard from "@/components/MatchCard";
import HeroCarousel from "@/components/HeroCarousel";
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

export default async function TournamentPage() {
  const { teams, liveMatches, tournament } = await getHomeData();

  return (
    <div className="min-h-screen bg-transparent transition-colors duration-300 animate-fadeIn">
      {/* Hero Carousel */}
      <HeroCarousel />

      {/* Stats Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 text-center md:text-left">
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
            Tournament Statistics
          </h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Real-time numbers of the Al-Umer Electronics Sports Gala.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Users,
              label: "Registered Teams",
              value: teams,
              max: 48,
              description: `${48 - teams} registration slots remaining`,
              hasProgress: true,
            },
            {
              icon: Target,
              label: "Tournament Sections",
              value: 3,
              max: null,
              description: "Sections A, B, and C",
            },
            {
              icon: Zap,
              label: "Second Chance Teams",
              value: 24,
              max: null,
              description: "Redemption bracket qualifiers",
            },
            {
              icon: Trophy,
              label: "Final Stage Teams",
              value: 8,
              max: null,
              description: "Quarter-finalists competing for title",
            },
          ].map(({ icon: Icon, label, value, max, description, hasProgress }) => {
            const progressPercent = hasProgress ? Math.min((value / (max || 1)) * 100, 100) : 0;
            return (
              <div
                key={label}
                className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white/80 p-6 shadow-md shadow-zinc-100/50 backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5 dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:shadow-none dark:hover:border-emerald-500/30"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold tracking-wide text-zinc-400 dark:text-zinc-500 uppercase">
                      {label}
                    </span>
                    <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                      <Icon size={20} />
                    </div>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                      {value}
                    </span>
                    {max && (
                      <span className="text-lg font-medium text-zinc-400 dark:text-zinc-600">
                        /{max}
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    {description}
                  </p>
                </div>

                {hasProgress && (
                  <div className="mt-4">
                    <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-1000"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Live Matches */}
      {liveMatches.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
              Live Matches
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {liveMatches.map((match) => (
              <MatchCard key={match._id} match={match} />
            ))}
          </div>
        </section>
      )}

      {/* Tournament Flow */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <TournamentFlow />
      </section>
    </div>
  );
}
