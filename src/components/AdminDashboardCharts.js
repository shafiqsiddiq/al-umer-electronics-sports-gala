"use client";

function BarChart({ title, data, emptyMessage = "No data yet" }) {
  const max = Math.max(...(data || []).map((d) => d.value), 1);
  const hasData = (data || []).some((d) => d.value > 0);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="mb-4 font-semibold">{title}</h3>
      {!hasData ? (
        <p className="py-8 text-center text-sm text-zinc-500">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {data.map((item) => (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span>{item.label}</span>
                <span className="font-semibold">{item.value}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(item.value / max) * 100}%`,
                    backgroundColor: item.color || "#10b981",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DonutChart({ title, data, centerLabel, emptyMessage = "No data yet" }) {
  const total = (data || []).reduce((sum, item) => sum + item.value, 0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  if (total === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
        <h3 className="mb-4 font-semibold">{title}</h3>
        <p className="py-8 text-center text-sm text-zinc-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="mb-4 font-semibold">{title}</h3>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div className="relative h-40 w-40 shrink-0">
          <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="currentColor" className="text-zinc-100 dark:text-zinc-800" strokeWidth="16" />
            {data.map((item) => {
              const segment = (item.value / total) * circumference;
              const circle = (
                <circle
                  key={item.label}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke={item.color || "#10b981"}
                  strokeWidth="16"
                  strokeDasharray={`${segment} ${circumference - segment}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                />
              );
              offset += segment;
              return circle;
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">{total}</span>
            <span className="text-xs text-zinc-500">{centerLabel}</span>
          </div>
        </div>
        <div className="w-full space-y-2">
          {data.map((item) => (
            <div key={item.label} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color || "#10b981" }}
                />
                <span>{item.label}</span>
              </div>
              <span className="font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardCharts({ stats }) {
  if (!stats) return null;

  return (
    <div className="mb-8 space-y-6">
      <h2 className="text-lg font-semibold">Overview Charts</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        <DonutChart
          title="Teams by Status"
          data={stats.teamStatusChart}
          centerLabel="Teams"
          emptyMessage="No teams registered yet"
        />
        <BarChart
          title="Teams by Section"
          data={stats.sectionChart}
          emptyMessage="No section assignments yet"
        />
        <BarChart
          title="Matches by Status"
          data={stats.matchStatusChart}
          emptyMessage="No matches created yet"
        />
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
          <h3 className="mb-4 font-semibold">Tournament Progress</h3>
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Team Registration</span>
                <span className="font-semibold">
                  {stats.totalTeams}/{stats.targetTeams}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{
                    width: `${Math.min((stats.totalTeams / stats.targetTeams) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Entry Fee Submitted</span>
                <span className="font-semibold">
                  {stats.entryFeeUploaded}/{stats.totalTeams || 0}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-violet-500 transition-all duration-500"
                  style={{
                    width: `${
                      stats.totalTeams
                        ? Math.min((stats.entryFeeUploaded / stats.totalTeams) * 100, 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Matches Completed</span>
                <span className="font-semibold">
                  {stats.completedMatches}/{stats.totalMatches || 0}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{
                    width: `${
                      stats.totalMatches
                        ? Math.min((stats.completedMatches / stats.totalMatches) * 100, 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
