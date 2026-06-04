"use client";

import Image from "next/image";
import { Eye, Loader2, Pencil, Trash2 } from "lucide-react";

function ProfileAvatar({ src, alt, size = 36 }) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="rounded-full object-cover ring-2 ring-white dark:ring-zinc-900"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full bg-zinc-200 text-[10px] font-medium text-zinc-500 dark:bg-zinc-700"
      style={{ width: size, height: size }}
    >
      ?
    </div>
  );
}

function ActionBtn({ icon: Icon, label, onClick, variant = "default", disabled, iconClassName = "" }) {
  const styles = {
    default: "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
    primary: "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950",
    danger: "text-red-600 hover:bg-red-50 dark:hover:bg-red-950",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center rounded-md p-1 transition disabled:opacity-50 ${styles[variant]}`}
    >
      {Icon && <Icon size={16} className={`shrink-0 ${iconClassName}`} />}
    </button>
  );
}

export default function PlayerTable({
  players,
  captain,
  onView,
  onViewCaptain,
  onEditCaptain,
  onEdit,
  onDelete,
  deletingId,
  onAddPlayer,
  embedded = false,
}) {
  if (!captain && players.length === 0) return null;

  const wrapperClass = embedded
    ? "flex h-full min-h-[280px] flex-col overflow-hidden rounded-xl border border-zinc-200/70 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/40"
    : "flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-lg shadow-zinc-300/30 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-zinc-950/40";

  return (
    <div className={wrapperClass}>
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
        <h3 className="font-semibold">Squad</h3>
        {onAddPlayer && (
          <button
            type="button"
            onClick={onAddPlayer}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
          >
            + Add Player
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/80 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50">
              <th className="px-5 py-3 font-medium">Player Name</th>
              <th className="px-5 py-3 font-medium">Father</th>
              <th className="px-5 py-3 font-medium">CNIC</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {captain && (
              <tr className="bg-emerald-50/40 dark:bg-emerald-950/10">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <ProfileAvatar src={captain.profilePictureUrl} alt={captain.name} />
                    <div>
                      <p className="font-medium">{captain.name}</p>
                      <p className="text-xs text-zinc-500">Team Captain</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">{captain.fatherName || "—"}</td>
                <td className="px-5 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">{captain.cnic || "—"}</td>
                <td className="px-5 py-3">
                  <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                    Main
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap justify-end gap-0">
                    {onViewCaptain && (
                      <ActionBtn icon={Eye} label="View" onClick={() => onViewCaptain(captain)} />
                    )}
                    {onEditCaptain && (
                      <ActionBtn icon={Pencil} label="Edit" variant="primary" onClick={() => onEditCaptain(captain)} />
                    )}
                  </div>
                </td>
              </tr>
            )}
            {players.map((p) => (
              <tr key={p._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <ProfileAvatar src={p.profilePictureUrl} alt={p.name} />
                    <p className="font-medium">{p.name}</p>
                  </div>
                </td>
                <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">{p.fatherName}</td>
                <td className="px-5 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">{p.cnic}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    p.role === "main"
                      ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  }`}>
                    {p.role === "main" ? "Main" : "Reserved"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap justify-end gap-0">
                    <ActionBtn icon={Eye} label="View" onClick={() => onView(p)} />
                    <ActionBtn icon={Pencil} label="Edit" variant="primary" onClick={() => onEdit(p)} />
                    <ActionBtn
                      icon={deletingId === p._id ? Loader2 : Trash2}
                      iconClassName={deletingId === p._id ? "animate-spin" : ""}
                      label={deletingId === p._id ? "Deleting" : "Delete"}
                      variant="danger"
                      onClick={() => onDelete(p)}
                      disabled={deletingId === p._id}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
