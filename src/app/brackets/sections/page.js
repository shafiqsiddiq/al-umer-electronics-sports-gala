import { fetchSanity } from "@/lib/sanity";
import BracketView from "@/components/BracketView";
import { GitBranch, Medal, Users } from "lucide-react";

async function getSectionMatches(section) {
  try {
    return await fetchSanity(
      `*[_type == "match" && section == $section && bracketType == "main"] | order(round asc, matchNumber asc) {
        _id, round, matchNumber, status, team1Score, team2Score,
        team1->{ _id, name }, team2->{ _id, name }, winner->{ _id, name }
      }`,
      { section }
    );
  } catch {
    return [];
  }
}

const GROUP_TONE = {
  A: "from-emerald-500 to-teal-600 shadow-emerald-500/25",
  B: "from-teal-500 to-cyan-600 shadow-teal-500/25",
  C: "from-sky-500 to-emerald-600 shadow-sky-500/25",
};

export default async function SectionBracketsPage({ searchParams }) {
  const params = await searchParams;
  const activeSection = ["A", "B", "C"].includes(params.section)
    ? params.section
    : "A";
  const sections = ["A", "B", "C"];

  const allMatches = {};
  for (const s of sections) {
    allMatches[s] = await getSectionMatches(s);
  }

  const activeMatches = allMatches[activeSection] || [];
  const completed = activeMatches.filter((m) => m.status === "completed").length;
  const total = activeMatches.length;
  const qualifiers = activeMatches.filter(
    (m) => m.round === 3 && m.status === "completed" && m.winner
  );

  return (
    <div className="relative min-h-[70vh] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/90 via-white to-teal-50/40 dark:from-emerald-950/40 dark:via-zinc-950 dark:to-teal-950/20" />
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-600/10" />
        <div className="absolute -right-16 top-32 h-80 w-80 rounded-full bg-teal-300/15 blur-3xl dark:bg-teal-600/10" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
            <GitBranch size={13} />
            Knockout Path
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            Group Brackets
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            16 teams per group · Top 2 qualify · Round 1 losers enter Second Chance
          </p>
        </header>

        {/* Info cards */}
        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: Users,
              label: "Per Group",
              value: "16",
              sub: "teams in knockout",
            },
            {
              icon: Medal,
              label: "Qualify",
              value: "2",
              sub: "to Super 8 path",
            },
            {
              icon: GitBranch,
              label: "Progress",
              value: total ? `${completed}/${total}` : "—",
              sub: "matches completed",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <Icon size={18} />
                </span>
                <div>
                  <p className="text-2xl font-black tabular-nums text-zinc-900 dark:text-white">
                    {item.value}
                  </p>
                  <p className="text-xs font-semibold text-zinc-500">
                    {item.label} · {item.sub}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Group tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {sections.map((s) => {
            const isActive = activeSection === s;
            const count = allMatches[s]?.length || 0;
            const done = (allMatches[s] || []).filter(
              (m) => m.status === "completed"
            ).length;
            return (
              <a
                key={s}
                href={`?section=${s}`}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition ${
                  isActive
                    ? `bg-gradient-to-r text-white shadow-lg ${GROUP_TONE[s]}`
                    : "border border-zinc-200 bg-white text-zinc-600 hover:border-emerald-300 hover:text-emerald-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                }`}
              >
                Group {s}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    isActive ? "bg-white/20" : "bg-zinc-100 dark:bg-zinc-800"
                  }`}
                >
                  {done}/{count || "—"}
                </span>
              </a>
            );
          })}
        </div>

        {qualifiers.length > 0 && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-5 py-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Group {activeSection} Qualifiers
            </p>
            <div className="flex flex-wrap gap-2">
              {qualifiers.map((m) => (
                <span
                  key={m._id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-sm font-bold text-white"
                >
                  <Medal size={12} />
                  {m.winner?.name || "Winner"}
                </span>
              ))}
            </div>
          </div>
        )}

        <BracketView
          matches={activeMatches}
          title={`Group ${activeSection} Knockout`}
        />
      </div>
    </div>
  );
}
