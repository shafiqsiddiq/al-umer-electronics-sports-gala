"use client";

function StatCard({ label, value, sublabel, accent = "emerald" }) {
  const accents = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
    blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
    amber: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
    violet: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300",
    zinc: "border-zinc-200 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100",
  };

  return (
    <div className={`rounded-xl border p-4 ${accents[accent] || accents.zinc}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="mt-1 text-sm font-medium opacity-90">{label}</p>
      {sublabel && <p className="mt-1 text-xs opacity-70">{sublabel}</p>}
    </div>
  );
}

export default function AdminStatsCards({ stats }) {
  if (!stats) return null;

  const cards = [
    {
      label: "Total Teams",
      value: stats.totalTeams,
      sublabel: `Target ${stats.targetTeams}`,
      accent: "emerald",
    },
    {
      label: "Pending",
      value: stats.pendingTeams,
      sublabel: "Awaiting approval",
      accent: "amber",
    },
    {
      label: "Approved",
      value: stats.approvedTeams,
      sublabel: "Ready for activation",
      accent: "blue",
    },
    {
      label: "Active",
      value: stats.activeTeams,
      sublabel: "In tournament",
      accent: "emerald",
    },
    {
      label: "Entry Fee Uploaded",
      value: stats.entryFeeUploaded,
      sublabel: "Payment receipts",
      accent: "violet",
    },
    {
      label: "Total Players",
      value: stats.totalPlayers,
      sublabel: `${stats.totalCaptains} captains`,
      accent: "blue",
    },
    {
      label: "Total Matches",
      value: stats.totalMatches,
      sublabel: `${stats.completedMatches} completed`,
      accent: "zinc",
    },
    {
      label: "Qualified Teams",
      value: stats.qualifiedTeams,
      sublabel: "Knockout stage",
      accent: "violet",
    },
  ];

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}
