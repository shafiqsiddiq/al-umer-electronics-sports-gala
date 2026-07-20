import { fetchSanity } from "@/lib/sanity";

const GROUPS = ["A", "B", "C"];

const GROUP_THEME = {
  A: {
    accent: "text-emerald-700 dark:text-emerald-400",
    badge: "bg-emerald-600 text-white",
    header:
      "from-emerald-50/90 via-white to-teal-50/50 dark:from-emerald-950/50 dark:via-zinc-950 dark:to-teal-950/30",
    border: "border-emerald-200/80 dark:border-emerald-900/50",
    ring: "ring-emerald-100 dark:ring-emerald-900/40",
    rankTop: "bg-emerald-600 text-white",
    glow: "bg-emerald-400/20",
  },
  B: {
    accent: "text-teal-700 dark:text-teal-400",
    badge: "bg-teal-600 text-white",
    header:
      "from-teal-50/90 via-white to-cyan-50/50 dark:from-teal-950/50 dark:via-zinc-950 dark:to-cyan-950/30",
    border: "border-teal-200/80 dark:border-teal-900/50",
    ring: "ring-teal-100 dark:ring-teal-900/40",
    rankTop: "bg-teal-600 text-white",
    glow: "bg-teal-400/20",
  },
  C: {
    accent: "text-sky-700 dark:text-sky-400",
    badge: "bg-sky-600 text-white",
    header:
      "from-sky-50/90 via-white to-emerald-50/40 dark:from-sky-950/50 dark:via-zinc-950 dark:to-emerald-950/30",
    border: "border-sky-200/80 dark:border-sky-900/50",
    ring: "ring-sky-100 dark:ring-sky-900/40",
    rankTop: "bg-sky-600 text-white",
    glow: "bg-sky-400/20",
  },
};

const STATUS_STYLES = {
  qualified_main:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  qualified_loser:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  final_eight:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  eliminated: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  active: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
};

async function getStats() {
  try {
    return await fetchSanity(`
      *[_type == "team" && status != "pending"] | order(points desc, wins desc, name asc) {
        _id, name, section, wins, losses, points, runsScored, runsConceded, status
      }
    `);
  } catch {
    return [];
  }
}

function StatusBadge({ status }) {
  const style =
    STATUS_STYLES[status] ||
    "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${style}`}
    >
      {status?.replace(/_/g, " ") || "—"}
    </span>
  );
}

function GroupTable({ group, teams }) {
  const theme = GROUP_THEME[group];
  const qualifiedCount = teams.filter((t) =>
    ["qualified_main", "final_eight"].includes(t.status)
  ).length;

  return (
    <section
      className={`relative overflow-hidden rounded-2xl border bg-white/80 shadow-sm ring-1 backdrop-blur-sm dark:bg-zinc-950/80 ${theme.border} ${theme.ring}`}
    >
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full blur-3xl ${theme.glow}`}
      />

      <div
        className={`relative flex flex-wrap items-center justify-between gap-3 border-b bg-gradient-to-r px-5 py-5 ${theme.header} ${theme.border}`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg font-black text-white shadow-sm ${theme.badge}`}
          >
            {group}
          </span>
          <div>
            <h2 className={`text-xl font-bold tracking-tight ${theme.accent}`}>
              Group {group}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {teams.length} teams · Top 2 qualify
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold shadow-sm ${theme.badge}`}
        >
          {qualifiedCount}/2 qualified
        </span>
      </div>

      <div className="relative overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/80 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
              <th className="px-4 py-3 font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">Team</th>
              <th className="px-4 py-3 font-semibold">W</th>
              <th className="px-4 py-3 font-semibold">L</th>
              <th className="px-4 py-3 font-semibold">Points</th>
              <th className="px-4 py-3 font-semibold">Runs</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {teams.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-zinc-500"
                >
                  No teams in Group {group} yet.
                </td>
              </tr>
            ) : (
              teams.map((team, idx) => {
                const isTopTwo = idx < 2;
                return (
                  <tr
                    key={team._id}
                    className={`border-t border-zinc-100/80 transition dark:border-zinc-800/80 ${
                      isTopTwo
                        ? "bg-emerald-50/40 dark:bg-emerald-950/20"
                        : "hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                          isTopTwo
                            ? theme.rankTop
                            : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-white">
                      {team.name}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-zinc-700 dark:text-zinc-300">
                      {team.wins || 0}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-zinc-700 dark:text-zinc-300">
                      {team.losses || 0}
                    </td>
                    <td className="px-4 py-3 font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {team.points || 0}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-zinc-700 dark:text-zinc-300">
                      {team.runsScored || 0}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={team.status} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function StatsPage() {
  const teams = await getStats();

  const byGroup = Object.fromEntries(
    GROUPS.map((g) => [
      g,
      teams
        .filter((t) => t.section === g)
        .sort(
          (a, b) =>
            (b.points || 0) - (a.points || 0) ||
            (b.wins || 0) - (a.wins || 0) ||
            a.name.localeCompare(b.name)
        ),
    ])
  );

  const unassigned = teams.filter((t) => !GROUPS.includes(t.section));

  return (
    <div className="relative min-h-[70vh] overflow-hidden">
      {/* Soft brand atmosphere */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/80 via-white to-teal-50/40 dark:from-emerald-950/40 dark:via-zinc-950 dark:to-teal-950/20" />
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-600/10" />
        <div className="absolute -right-16 top-40 h-80 w-80 rounded-full bg-teal-300/15 blur-3xl dark:bg-teal-600/10" />
        <div className="absolute bottom-20 left-1/3 h-64 w-64 rounded-full bg-sky-200/20 blur-3xl dark:bg-sky-700/10" />
        <div
          className="absolute inset-0 opacity-[0.35] dark:opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgb(16 185 129 / 0.18) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10 max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
            Standings
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            Points & Stats
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            Team standings by group — clear panels for Group A, B, and C
          </p>
        </header>

        <div className="space-y-8">
          {GROUPS.map((group) => (
            <GroupTable key={group} group={group} teams={byGroup[group]} />
          ))}

          {unassigned.length > 0 && (
            <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white/80 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
              <div className="border-b border-zinc-100 bg-zinc-50/90 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                <h2 className="text-lg font-bold text-zinc-700 dark:text-zinc-200">
                  Unassigned
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/80 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60">
                      <th className="px-4 py-3 font-semibold">#</th>
                      <th className="px-4 py-3 font-semibold">Team</th>
                      <th className="px-4 py-3 font-semibold">W</th>
                      <th className="px-4 py-3 font-semibold">L</th>
                      <th className="px-4 py-3 font-semibold">Points</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unassigned.map((team, idx) => (
                      <tr
                        key={team._id}
                        className="border-t border-zinc-100 dark:border-zinc-800"
                      >
                        <td className="px-4 py-3">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium">{team.name}</td>
                        <td className="px-4 py-3">{team.wins || 0}</td>
                        <td className="px-4 py-3">{team.losses || 0}</td>
                        <td className="px-4 py-3 font-semibold text-emerald-600">
                          {team.points || 0}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={team.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
