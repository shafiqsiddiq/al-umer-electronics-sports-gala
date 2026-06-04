export default function TournamentFlow() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
      <h2 className="mb-6 text-xl font-bold">Tournament Flow</h2>
      <div className="font-mono text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
        <pre className="whitespace-pre-wrap">{`48 Teams
│
├── Section A (16)
├── Section B (16)
└── Section C (16)

Each Section Knockout:
16 → 8 → 4 → 2 Qualifiers
(Round 1 losers → Second Chance)

Main Qualified: 2 + 2 + 2 = 6 Teams

Second Chance (Loser Bracket):
24 Teams → 2 Qualifiers

Final Stage: 6 + 2 = 8 Teams
Quarter Finals → Semi Finals → Final`}</pre>
      </div>
    </div>
  );
}
