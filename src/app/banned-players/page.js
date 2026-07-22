import { Ban, Trophy, ChevronsRight, ChevronsLeft } from "lucide-react";
import PlayersGrid from "./PlayersGrid";

function LightBank({ flip = false }) {
  return (
    <div
      className={`pointer-events-none hidden md:block ${flip ? "-rotate-6" : "rotate-6"}`}
      aria-hidden="true"
    >
      <div className="grid grid-cols-6 gap-1.5 rounded-lg border border-emerald-100/20 bg-emerald-950/60 p-2 shadow-[0_0_60px_20px_rgba(209,250,229,0.18)]">
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 rounded-full bg-emerald-50 shadow-[0_0_10px_3px_rgba(209,250,229,0.75)]"
          />
        ))}
      </div>
      <div
        className={`mx-auto mt-0.5 h-10 w-1.5 bg-gradient-to-b from-emerald-100/40 to-transparent ${flip ? "-skew-x-12" : "skew-x-12"}`}
      />
    </div>
  );
}

export const metadata = {
  title: "Open Ban List | Al-Umer Sports Gala Season 3",
  description:
    "Players banned from playing as open in Al-Umer Electronics Sports Gala Season 3 — they may only play for their own village team.",
};

const BANNED_PLAYERS = [
  { name: "Shebi Hadyarah", image: "/banned-players/shebi-hadyarah.png" },
  { name: "Ikram Pathanki", image: "/banned-players/ikram-pathanki.png" },
  { name: "Faraz Jutt Mota Singh", image: "/banned-players/faraz-jutt-mota-singh.png" },
  { name: "Faisal Badouki", image: "/banned-players/faisal-badouki.png" },
  { name: "Ameer Hamza Chachuwali", image: "/banned-players/ameer-hamza-chachuwali.png" },
  { name: "Sohail Sikandar", image: "/banned-players/sohail-sikandar.png" },
  { name: "Zahid Lefti Karbhat", image: "/banned-players/zahid-lefti-karbhat.png" },
  { name: "Ali Jutt Lidhar", image: "/banned-players/ali-jutt-lidhar.png" },
  { name: "Rehman Shah Kamahan", image: "/banned-players/rehman-shah-kamahan.png" },
  { name: "Saqib Lefti Knaker", image: "/banned-players/saqib-lefti-knaker.png" },
  { name: "Farman Jahman", image: "/banned-players/farman-jahman.png" },
  { name: "Zahid Bedu", image: "/banned-players/zahid-bedu.png" },
  { name: "Baber Padana", image: "/banned-players/baber-padana.png" },
];

export default function BannedPlayersPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#03231c] via-[#052e25] to-[#01110d]">
      {/* Night sky glow above the ground */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgba(16,185,129,0.22),transparent_70%)]"
        aria-hidden="true"
      />

      {/* Floodlight towers (left & right) */}
      <div className="pointer-events-none absolute -top-4 left-[8%]" aria-hidden="true">
        <div className="h-3 w-16 rounded-full bg-emerald-50/90 blur-[3px] shadow-[0_0_45px_18px_rgba(220,255,244,0.45)]" />
        <div className="h-[26rem] w-64 -translate-x-24 rotate-[24deg] bg-gradient-to-b from-emerald-100/25 via-emerald-100/10 to-transparent blur-2xl" />
      </div>
      <div className="pointer-events-none absolute -top-4 right-[8%]" aria-hidden="true">
        <div className="ml-auto h-3 w-16 rounded-full bg-emerald-50/90 blur-[3px] shadow-[0_0_45px_18px_rgba(220,255,244,0.45)]" />
        <div className="ml-auto h-[26rem] w-64 translate-x-24 -rotate-[24deg] bg-gradient-to-b from-emerald-100/25 via-emerald-100/10 to-transparent blur-2xl" />
      </div>

      {/* Centre pitch glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 to-transparent"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="relative mb-5 shrink-0">
          {/* Floodlight banks */}
          <div className="absolute left-0 top-1">
            <LightBank />
          </div>
          <div className="absolute right-0 top-1">
            <LightBank flip />
          </div>

          <div className="text-center">
            <div className="mb-2.5 inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-950/70 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.35)] backdrop-blur-sm">
              <Ban size={12} />
              Open Ban List
            </div>

            <h1 className="text-2xl font-black uppercase tracking-tight text-white drop-shadow-[0_2px_12px_rgba(209,250,229,0.25)] sm:text-4xl">
              AL-UMER ELECTRONICS
            </h1>

            <div className="mt-1.5 flex items-center justify-center gap-3">
              <span className="hidden h-1 w-14 border-y-2 border-emerald-400/80 sm:block" />
              <p className="text-lg font-black uppercase tracking-wide text-emerald-400 sm:text-2xl">
                Sports Gala Season 3
              </p>
              <span className="hidden h-1 w-14 border-y-2 border-emerald-400/80 sm:block" />
            </div>

            <div className="mt-1.5 flex justify-center">
              <Trophy
                size={20}
                className="text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]"
              />
            </div>

            <div className="mt-2 flex items-center justify-center gap-2 text-emerald-400">
              <ChevronsRight size={15} className="shrink-0" />
              <p className="max-w-3xl text-xs font-medium text-zinc-100 sm:text-sm">
                Neeche diye gaye players apni apni village team ke ilawa kisi
                doosri team mein open player ke tor par nahi khel sakte.
              </p>
              <ChevronsLeft size={15} className="shrink-0" />
            </div>
          </div>
        </header>

        {/* Players grid (hover a card to see the full photo) */}
        <div className="min-h-0 flex-1">
          <PlayersGrid players={BANNED_PLAYERS} />
        </div>
      </div>
    </div>
  );
}
