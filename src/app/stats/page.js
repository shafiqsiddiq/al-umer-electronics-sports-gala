import { fetchSanity } from "@/lib/sanity";

async function getStats() {
  try {
    return await fetchSanity(`
      *[_type == "team" && status != "pending"] | order(points desc, wins desc) {
        _id, name, section, wins, losses, points, runsScored, runsConceded, status
      }
    `);
  } catch {
    return [];
  }
}

export default async function StatsPage() {
  const teams = await getStats();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">Points & Stats</h1>
      <p className="mb-8 text-zinc-500">Team standings and performance</p>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800">
            <tr>
              <th className="px-4 py-3 font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">Team</th>
              <th className="px-4 py-3 font-semibold">Section</th>
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
                <td colSpan={8} className="px-4 py-12 text-center text-zinc-500">
                  No stats available yet.
                </td>
              </tr>
            ) : (
              teams.map((team, idx) => (
                <tr key={team._id} className="border-t border-zinc-200 dark:border-zinc-700">
                  <td className="px-4 py-3">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium">{team.name}</td>
                  <td className="px-4 py-3">{team.section}</td>
                  <td className="px-4 py-3">{team.wins || 0}</td>
                  <td className="px-4 py-3">{team.losses || 0}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-600">{team.points || 0}</td>
                  <td className="px-4 py-3">{team.runsScored || 0}</td>
                  <td className="px-4 py-3 capitalize">{team.status?.replace("_", " ")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
