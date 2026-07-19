import Link from "next/link";
import {
  ScrollText,
  Ban,
  MapPin,
  ShieldAlert,
  ArrowLeft,
  Home,
  Trophy,
  Sparkles,
  PartyPopper,
  Star,
  Medal,
  Award,
  Users,
  Clock,
  Lightbulb,
  RefreshCcw,
} from "lucide-react";

export const metadata = {
  title: "Terms & Conditions | Al-Umer Sports Gala Season 3",
  description:
    "Tournament rules and open player conditions for Al-Umer Electronics Sports Gala Season 3",
};

const OPEN_VILLAGES = ["Lidhar", "Chathiyanwala", "Hadyarah", "Chachawali", "Heir"];

const BANNED_PLAYERS = [
  "Shebi Hadyarah",
  "Ikram Pathanki",
  "Faraz Jutt Mota Singh",
  "Faisal Badouki",
  "Ameer Hamza Chachuwali",
  "Sohail Sikandar",
  "Zahid Lefti Karbhat",
  "Ali Jutt Lidhar",
  "Rehman Shah Kamahan",
  "Saqib Lefti Knaker",
  "Farman Jahman",
  "Zahid Bedu",
];

const CELEBRATION_ICONS = [
  { Icon: Trophy, className: "left-[6%] top-[12%] text-amber-400/40", size: 36 },
  { Icon: PartyPopper, className: "right-[8%] top-[16%] text-emerald-400/35", size: 32 },
  { Icon: Sparkles, className: "left-[12%] top-[42%] text-yellow-300/30", size: 28 },
  { Icon: Star, className: "right-[10%] top-[38%] text-amber-300/35", size: 24 },
  { Icon: Medal, className: "left-[5%] bottom-[28%] text-teal-300/30", size: 30 },
  { Icon: Award, className: "right-[6%] bottom-[32%] text-emerald-300/35", size: 34 },
  { Icon: Sparkles, className: "left-[18%] bottom-[14%] text-amber-200/25", size: 22 },
  { Icon: PartyPopper, className: "right-[16%] bottom-[12%] text-rose-300/25", size: 26 },
  { Icon: Star, className: "left-[48%] top-[8%] text-yellow-400/25", size: 20 },
  { Icon: Trophy, className: "right-[42%] bottom-[8%] text-amber-400/20", size: 28 },
];

const FORMAT_RULES = [
  {
    icon: Users,
    title: "Total Teams",
    text: "This tournament will have 48 teams in total.",
  },
  {
    icon: Trophy,
    title: "Groups",
    text: "Teams will be divided into 3 groups (A, B, C) — 16 teams in each group.",
  },
  {
    icon: RefreshCcw,
    title: "Second Chance",
    text: "Losing teams will get only one chance through the loser bracket.",
  },
  {
    icon: Lightbulb,
    title: "Overs",
    text: "Each side will play 4 overs. Management may reduce overs based on available time.",
  },
  {
    icon: Clock,
    title: "Arrival Time",
    text: "Every team must be at the ground at least 30 minutes before their assigned match time.",
  },
];

export default function TermsPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/cricket_stadium_desktop.png')" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay bg-cover bg-top"
        style={{ backgroundImage: "url('/cricket_action_shot_desktop.png')" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-zinc-950/90 via-emerald-950/75 to-zinc-950/95"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-40 h-80 w-80 rounded-full bg-teal-400/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {CELEBRATION_ICONS.map(({ Icon, className, size }, i) => (
          <Icon
            key={i}
            size={size}
            strokeWidth={1.5}
            className={`absolute animate-pulse ${className}`}
            style={{ animationDelay: `${i * 0.35}s`, animationDuration: "3.5s" }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <header className="mb-12 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.25)]">
            <ScrollText size={14} />
            Terms & Conditions
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
            AL-UMER ELECTRONICS
          </h1>
          <p className="mt-2 text-2xl font-semibold text-emerald-400 sm:text-3xl">
            Sports Gala Season 3
          </p>
          <div className="mx-auto mt-5 h-1 w-24 rounded-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
          <p className="mx-auto mt-5 max-w-xl text-base text-zinc-300 sm:text-lg">
            Following rules are below. Please read them carefully.
          </p>
        </header>

        <div className="mb-8 flex items-start gap-4 rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500/20 to-amber-600/5 p-5 shadow-lg shadow-amber-950/20 backdrop-blur-md">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/25 text-amber-300">
            <ShieldAlert size={22} />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-amber-300">
              Important Notice
            </p>
            <p className="mt-1 text-base leading-relaxed text-amber-50">
              Any local player found with a double ID card will be removed from the tournament.
            </p>
          </div>
        </div>

        <section className="mb-8 overflow-hidden rounded-2xl border border-emerald-400/25 bg-white/[0.06] shadow-2xl backdrop-blur-md">
          <div className="border-b border-emerald-400/20 bg-emerald-500/15 px-6 py-5">
            <h2 className="flex items-center gap-2 text-xl font-bold text-white">
              <Lightbulb size={22} className="text-emerald-400" />
              Flood Light Tournament — Format
            </h2>
            <p className="mt-1 text-sm text-emerald-100/80">
              Match format and schedule rules
            </p>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            {FORMAT_RULES.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="flex gap-3 rounded-xl border border-white/10 bg-black/20 p-4 transition hover:border-emerald-400/30 hover:bg-emerald-500/10"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                  <Icon size={18} />
                </span>
                <div>
                  <h3 className="font-bold text-white">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-300">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8 overflow-hidden rounded-2xl border border-teal-400/30 bg-white/[0.06] shadow-2xl backdrop-blur-md">
          <div className="border-b border-teal-400/20 bg-teal-500/15 px-6 py-5">
            <h2 className="flex items-center gap-2 text-xl font-bold text-white sm:text-2xl">
              <MapPin size={22} className="text-teal-400" />
              Additional Rules and List of villages
            </h2>
            <p className="mt-1 text-sm text-teal-100/80">
              Open player conditions for this tournament
            </p>
          </div>

          <div className="space-y-6 p-5 sm:p-6">
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-base leading-relaxed text-zinc-100">
                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500 text-xs font-black text-white">
                  1
                </span>
                An open player must have a house in their own village.
              </p>
            </div>

            {/* Highlighted villages */}
            <div className="rounded-2xl border-2 border-emerald-400/50 bg-gradient-to-b from-emerald-500/20 to-emerald-950/30 p-5 shadow-[0_0_40px_rgba(16,185,129,0.15)]">
              <p className="mb-1 text-center text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
                Special Importance
              </p>
              <p className="mb-5 text-center text-base font-semibold text-white">
                Only these villages are allowed <span className="text-emerald-300">one open player</span> each
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {OPEN_VILLAGES.map((v, i) => (
                  <div
                    key={v}
                    className="flex flex-col items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-3 py-4 text-center shadow-lg shadow-emerald-950/30 transition hover:border-emerald-300 hover:bg-emerald-500/25"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-black text-white">
                      {i + 1}
                    </span>
                    <MapPin size={16} className="text-emerald-300" />
                    <span className="text-sm font-bold text-emerald-50 sm:text-base">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <ul className="space-y-2.5 text-sm leading-relaxed text-zinc-300">
              <li className="flex gap-2.5 rounded-lg bg-emerald-500/10 px-3 py-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                Other players from Heir may play as open in any team.
              </li>
              <li className="flex gap-2.5 rounded-lg bg-rose-500/10 px-3 py-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                <strong className="font-bold text-white">Leel</strong> is not allowed any open player, and they cannot play in other teams — only in their own village team.
              </li>
            </ul>
          </div>
        </section>

        <section className="mb-8 overflow-hidden rounded-2xl border border-rose-400/30 bg-gradient-to-b from-rose-950/50 to-zinc-950/40 shadow-2xl backdrop-blur-md">
          <div className="border-b border-rose-400/25 bg-rose-500/15 px-6 py-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500 text-white shadow-lg shadow-rose-900/50">
                <Ban size={20} />
              </span>
              <div>
                <h2 className="text-xl font-bold text-white">Open Ban List</h2>
                <p className="text-sm text-rose-200/80">By order of management</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-rose-100/85">
              Management has decided that the following players cannot play as open for any other team — only for their own village team:
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2.5 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {BANNED_PLAYERS.map((name, i) => (
              <div
                key={name}
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-black/25 px-3.5 py-2.5 transition hover:border-rose-400/30 hover:bg-rose-500/10"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-500/20 text-xs font-bold text-rose-300">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-medium text-zinc-100">{name}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-rose-400/25 bg-rose-500/10 px-6 py-5 text-center">
            <p className="text-base font-semibold text-rose-50">
              These players may only play in their own village team.
            </p>
            <p className="mt-1 text-sm font-bold text-rose-300">
              They are not allowed to play as open!
            </p>
          </div>
        </section>

        <div className="mb-10 overflow-hidden rounded-2xl border border-emerald-400/30 bg-gradient-to-r from-emerald-600/25 via-teal-600/15 to-emerald-600/25 p-8 text-center shadow-xl backdrop-blur-md">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">
            Reason
          </p>
          <p className="mt-3 text-xl font-semibold text-white sm:text-2xl">
            So that all teams stay equally balanced
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/tournament"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-500"
          >
            <ArrowLeft size={16} />
            Tournament
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-zinc-200 backdrop-blur transition hover:bg-white/10"
          >
            <Home size={16} />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
