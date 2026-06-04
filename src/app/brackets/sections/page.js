import { fetchSanity } from "@/lib/sanity";
import BracketView from "@/components/BracketView";

async function getSectionMatches(section) {
  try {
    return await fetchSanity(
      `*[_type == "match" && section == $section && bracketType == "main"] | order(round asc, matchNumber asc) {
        _id, round, matchNumber, status, team1Score, team2Score,
        team1->{ _id, name }, team2->{ _id, name }, winner->{ _id }
      }`,
      { section }
    );
  } catch {
    return [];
  }
}

export default async function SectionBracketsPage({ searchParams }) {
  const params = await searchParams;
  const activeSection = params.section || "A";
  const sections = ["A", "B", "C"];

  const allMatches = {};
  for (const s of sections) {
    allMatches[s] = await getSectionMatches(s);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">Section Brackets</h1>
      <p className="mb-6 text-zinc-500">16 teams per section · 2 qualify · Round 1 losers go to Second Chance</p>

      <div className="mb-8 flex gap-2">
        {sections.map((s) => (
          <a
            key={s}
            href={`?section=${s}`}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              activeSection === s
                ? "bg-emerald-600 text-white"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            Section {s}
          </a>
        ))}
      </div>

      <BracketView matches={allMatches[activeSection] || []} title={`Section ${activeSection} Knockout`} />
    </div>
  );
}
