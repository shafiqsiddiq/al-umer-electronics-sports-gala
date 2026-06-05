"use client";

import { useState } from "react";
import Image from "next/image";
import { MAIN_PLAYERS, TOTAL_SQUAD, getSquadCounts } from "@/lib/tournament-logic";

function ProfileAvatar({ src, alt, size = 32 }) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span className="text-xs text-zinc-400">—</span>
  );
}

export default function TeamViewModal({ team, onClose }) {
  const [cnicPreviewUrl, setCnicPreviewUrl] = useState(null);

  if (!team) return null;

  const squad = getSquadCounts(team.players || []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-start gap-3">
            {team.captain?.profilePictureUrl ? (
              <Image
                src={team.captain.profilePictureUrl}
                alt={team.captain.name}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : null}
            <div>
              <h2 className="text-xl font-bold">{team.name}</h2>
              <p className="text-sm text-zinc-500">{team.captain?.name || "—"} · Captain</p>
              <p className="text-sm capitalize text-zinc-500">
                {team.section} · {team.status} · {squad.displayTotal}/{TOTAL_SQUAD} squad
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
            <h3 className="mb-3 font-semibold text-center sm:text-left">Captain</h3>
            <div className="flex flex-col items-center mb-4">
              {team.captain?.profilePictureUrl ? (
                <Image
                  src={team.captain.profilePictureUrl}
                  alt={team.captain.name}
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-full object-cover ring-4 ring-emerald-100 dark:ring-emerald-900/40"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-200 text-xs dark:bg-zinc-700">
                  N/A
                </div>
              )}
            </div>
            <dl className="space-y-2 text-sm border-t border-zinc-100 pt-3 dark:border-zinc-800">
              <div className="flex justify-between items-center gap-4"><span className="text-zinc-500">Name:</span> <span className="font-semibold text-zinc-900 dark:text-zinc-100">{team.captain?.name || "—"}</span></div>
              <div className="flex justify-between items-center gap-4"><span className="text-zinc-500">Father:</span> <span className="font-semibold text-zinc-900 dark:text-zinc-100">{team.captain?.fatherName || "—"}</span></div>
              <div className="flex justify-between items-center gap-4"><span className="text-zinc-500">CNIC:</span> <span className="font-semibold font-mono text-zinc-900 dark:text-zinc-100">{team.captain?.cnic || "—"}</span></div>
              <div className="flex justify-between items-center gap-4"><span className="text-zinc-500 shrink-0">Email:</span> <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[200px]" title={team.captain?.email}>{team.captain?.email || "—"}</span></div>
              <div className="flex justify-between items-center gap-4"><span className="text-zinc-500">WhatsApp:</span> <span className="font-semibold text-zinc-900 dark:text-zinc-100">{team.captain?.whatsapp || team.captain?.phone || "—"}</span></div>
            </dl>
            {team.captain?.cnicImageUrl && (
              <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800 flex flex-col items-center">
                <p className="mb-2 text-xs text-zinc-500 font-medium">Captain CNIC</p>
                <div 
                  onClick={() => setCnicPreviewUrl(team.captain.cnicImageUrl)}
                  className="relative group cursor-pointer"
                >
                  <Image
                    src={team.captain.cnicImageUrl}
                    alt="Captain CNIC"
                    width={180}
                    height={108}
                    className="h-[108px] w-[180px] rounded-sm border border-zinc-200 dark:border-zinc-700 object-cover shadow-sm bg-zinc-50 dark:bg-zinc-800"
                  />
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-sm transition text-white text-xs font-semibold"
                  >
                    View CNIC
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCnicPreviewUrl(team.captain.cnicImageUrl)}
                  className="mt-2 inline-flex items-center gap-1 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-2 py-1 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 transition"
                >
                  View Full Size
                </button>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
            <h3 className="mb-3 font-semibold">Team Stats</h3>
            <dl className="space-y-1 text-sm">
              <div><span className="text-zinc-500">Main:</span> {squad.displayMain}/{MAIN_PLAYERS} (incl. captain)</div>
              <div><span className="text-zinc-500">Reserved:</span> {squad.reserved}/2</div>
              <div><span className="text-zinc-500">Record:</span> {team.wins ?? 0}W · {team.losses ?? 0}L</div>
              <div><span className="text-zinc-500">Points:</span> {team.points ?? 0}</div>
              <div>
                <span className="text-zinc-500">Entry Fee:</span>{" "}
                {!team.entryFeeImageUrl
                  ? "Not uploaded"
                  : team.entryFeeVerified
                    ? "Verified"
                    : "Pending verification"}
              </div>
            </dl>
            {team.entryFeeImageUrl && (
              <div className="mt-3 flex flex-col items-center sm:items-start">
                <p className="mb-1 text-xs text-zinc-500 font-medium">Entry Fee Receipt</p>
                <div 
                  onClick={() => setCnicPreviewUrl(team.entryFeeImageUrl)}
                  className="relative group cursor-pointer rounded border border-zinc-200 dark:border-zinc-700 overflow-hidden"
                >
                  <Image
                    src={team.entryFeeImageUrl}
                    alt="Entry fee"
                    width={180}
                    height={108}
                    className="h-[108px] w-[180px] object-cover bg-zinc-50 dark:bg-zinc-800"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition text-white text-xs font-semibold">
                    View Receipt
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCnicPreviewUrl(team.entryFeeImageUrl)}
                  className="mt-2 inline-flex items-center gap-1 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-2 py-1 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 transition"
                >
                  View Full Size
                </button>
              </div>
            )}
          </div>
        </div>

        <h3 className="mb-3 font-semibold">Squad ({squad.displayTotal}/{TOTAL_SQUAD})</h3>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800">
              <tr>
                <th className="px-3 py-2">Photo</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Father</th>
                <th className="px-3 py-2">CNIC</th>
                <th className="px-3 py-2">Role</th>
              </tr>
            </thead>
            <tbody>
              {team.captain && (
                <tr className="border-t border-zinc-200 bg-emerald-50/50 dark:border-zinc-700 dark:bg-emerald-950/20">
                  <td className="px-3 py-2">
                    <ProfileAvatar src={team.captain.profilePictureUrl} alt={team.captain.name} />
                  </td>
                  <td className="px-3 py-2 font-medium">{team.captain.name}</td>
                  <td className="px-3 py-2">{team.captain.fatherName || "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs">{team.captain.cnic || "—"}</td>
                  <td className="px-3 py-2">Captain · Main</td>
                </tr>
              )}
              {(team.players || []).map((p) => (
                <tr key={p._id} className="border-t border-zinc-200 dark:border-zinc-700">
                  <td className="px-3 py-2">
                    <ProfileAvatar src={p.profilePictureUrl} alt={p.name} />
                  </td>
                  <td className="px-3 py-2">{p.name}</td>
                  <td className="px-3 py-2">{p.fatherName}</td>
                  <td className="px-3 py-2 font-mono text-xs">{p.cnic}</td>
                  <td className="px-3 py-2 capitalize">{p.role === "main" ? "Main" : "Reserved"}</td>
                </tr>
              ))}
              {!team.captain && (!team.players || team.players.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-zinc-500">
                    No squad members yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-zinc-100 py-2 text-sm font-medium dark:bg-zinc-800"
        >
          Close
        </button>
      </div>

      {/* CNIC/Receipt Full-Size Lightbox Modal */}
      {cnicPreviewUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 transition-all duration-300"
          onClick={() => setCnicPreviewUrl(null)}
        >
          <div
            className="relative max-h-[85vh] max-w-4xl overflow-hidden rounded-xl bg-zinc-950 p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setCnicPreviewUrl(null)}
              className="absolute right-4 top-4 z-[70] flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 hover:scale-105 active:scale-95 transition border border-white/20 text-lg font-bold shadow-lg"
              title="Close Preview"
            >
              ✕
            </button>
            <div className="relative h-[70vh] w-[80vw] max-w-3xl">
              <Image
                src={cnicPreviewUrl}
                alt="Full View"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
