import Image from "next/image";
import { Ban, UserX } from "lucide-react";

export default function PlayersGrid({ players }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-[repeat(20,minmax(0,1fr))]">
      {players.map((player, i) => (
        <div
          key={player.name}
          className={`group relative flex flex-col items-center overflow-hidden rounded-xl border border-emerald-300/15 bg-gradient-to-b from-white/10 via-emerald-950/40 to-black/40 px-2 pb-3 pt-4 text-center shadow-xl shadow-black/40 backdrop-blur-md transition hover:-translate-y-0.5 hover:border-emerald-300/50 hover:shadow-2xl hover:shadow-emerald-900/40 ${
            i < 5 ? "lg:col-span-4" : "lg:col-span-5"
          }`}
        >
          <span className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-white shadow-lg shadow-emerald-950/50">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-rose-400 backdrop-blur-sm">
            <Ban size={10} />
          </span>

          <div className="relative mb-2 h-24 w-24 shrink-0 overflow-hidden rounded-full bg-emerald-950/60 ring-2 ring-emerald-300/80 shadow-[0_0_25px_rgba(16,185,129,0.35)] sm:h-28 sm:w-28">
            {player.image ? (
              <Image
                src={player.image}
                alt={player.name}
                fill
                sizes="112px"
                className="object-cover object-top"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 text-emerald-100/60">
                <UserX size={30} strokeWidth={1.5} />
                <span className="text-[8px] font-semibold uppercase tracking-wide">
                  No photo
                </span>
              </div>
            )}
          </div>

          <p
            className="w-full truncate text-xs font-bold text-white sm:text-sm"
            title={player.name}
          >
            {player.name}
          </p>
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-emerald-200">
            <Ban size={8} />
            Village team only
          </span>

          {/* Full photo shown inside the card on hover */}
          {player.image && (
            <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-xl bg-zinc-950 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <Image
                src={player.image}
                alt={player.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-contain"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 pb-2.5 pt-8 text-center">
                <p className="truncate text-sm font-bold text-white">{player.name}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
