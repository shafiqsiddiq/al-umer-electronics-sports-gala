"use client";

import { useEffect, useState } from "react";
import MatchCard from "@/components/MatchCard";

export default function AdminFixturesPage() {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    fetch("/api/admin/matches")
      .then((r) => r.json())
      .then((d) => setMatches(d.matches || []));
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Fixture Management</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {matches.map((match) => (
          <MatchCard key={match._id} match={match} />
        ))}
      </div>
    </div>
  );
}
