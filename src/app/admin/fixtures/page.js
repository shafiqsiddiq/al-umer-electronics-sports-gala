"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MatchCard from "@/components/MatchCard";
import CricketLoader from "@/components/CricketLoader";
import { CalendarX2, GitBranch } from "lucide-react";

export default function AdminFixturesPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/matches")
      .then((r) => r.json())
      .then((d) => setMatches(d.matches || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Fixture Management</h1>
        {!loading && matches.length > 0 && (
          <p className="mt-0.5 text-sm text-zinc-500">
            {matches.length} match{matches.length === 1 ? "" : "es"} scheduled
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <CricketLoader label="Loading fixtures…" />
        </div>
      ) : matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white/60 px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <CalendarX2 size={28} />
          </span>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            No fixtures yet
          </h2>
          <p className="mt-1 max-w-sm text-sm text-zinc-500">
            Matches will appear here once fixtures are generated. Head over to
            the Brackets section to draw groups and create fixtures.
          </p>
          <Link
            href="/admin/brackets"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:from-emerald-600 hover:to-teal-700"
          >
            <GitBranch size={15} />
            Go to Brackets
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((match) => (
            <MatchCard key={match._id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
