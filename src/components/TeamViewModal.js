"use client";

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
            <h3 className="mb-3 font-semibold">Captain</h3>
            <div className="flex items-start gap-3">
              {team.captain?.profilePictureUrl ? (
                <Image
                  src={team.captain.profilePictureUrl}
                  alt={team.captain.name}
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-200 text-xs dark:bg-zinc-700">
                  N/A
                </div>
              )}
              <dl className="space-y-1 text-sm">
                <div><span className="text-zinc-500">Name:</span> {team.captain?.name || "—"}</div>
                <div><span className="text-zinc-500">Father:</span> {team.captain?.fatherName || "—"}</div>
                <div><span className="text-zinc-500">CNIC:</span> {team.captain?.cnic || "—"}</div>
                <div><span className="text-zinc-500">Email:</span> {team.captain?.email || "—"}</div>
                <div><span className="text-zinc-500">WhatsApp:</span> {team.captain?.whatsapp || team.captain?.phone || "—"}</div>
              </dl>
            </div>
            {team.captain?.cnicImageUrl && (
              <div className="mt-3">
                <p className="mb-1 text-xs text-zinc-500">Captain CNIC</p>
                <Image
                  src={team.captain.cnicImageUrl}
                  alt="Captain CNIC"
                  width={200}
                  height={120}
                  className="max-h-24 w-auto rounded border object-contain dark:border-zinc-700"
                />
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
              <div className="mt-3">
                <p className="mb-1 text-xs text-zinc-500">Entry Fee Receipt</p>
                <Image
                  src={team.entryFeeImageUrl}
                  alt="Entry fee"
                  width={200}
                  height={120}
                  className="max-h-24 w-auto rounded border object-contain dark:border-zinc-700"
                />
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
    </div>
  );
}
