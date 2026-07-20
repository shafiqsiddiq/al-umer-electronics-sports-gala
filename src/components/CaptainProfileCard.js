"use client";

import Image from "next/image";
import {
  User,
  IdCard,
  Phone,
  Mail,
  Users,
  Flag,
  Trophy,
  Pencil,
  Shield,
} from "lucide-react";

const STATUS_STYLES = {
  pending:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  approved: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  active:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  eliminated: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  qualified_main:
    "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
  qualified_loser:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  final_eight:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  champion:
    "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
};

function InfoCell({ icon: Icon, label, value, mono = false }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg bg-zinc-50/90 px-2.5 py-1.5 dark:bg-zinc-900/70">
      <Icon size={13} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-wide text-zinc-400">
          {label}
        </p>
        <p
          className={`truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100 ${
            mono ? "font-mono" : ""
          }`}
          title={value || "—"}
        >
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

export default function CaptainProfileCard({
  team,
  captain,
  onEditTeam,
  onEditProfile,
  className = "",
}) {
  const statusStyle =
    STATUS_STYLES[team?.status] ||
    "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";

  const sectionLabel =
    !team?.section || team.section === "unassigned"
      ? "Unassigned"
      : ["A", "B", "C"].includes(team.section)
        ? `Group ${team.section}`
        : team.section.replace(/_/g, " ");

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 ${className}`}
    >
      {/* Compact horizontal header */}
      <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-2.5 text-white">
        {captain?.profilePictureUrl ? (
          <Image
            src={captain.profilePictureUrl}
            alt={captain.name}
            width={48}
            height={48}
            className="h-12 w-12 rounded-xl object-cover ring-2 ring-white/40"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-lg font-black">
            {(captain?.name || "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-black" title={captain?.name}>
            {captain?.name}
          </p>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
            <Shield size={10} />
            Captain
          </span>
        </div>
      </div>

      <div className="space-y-2 p-3">
        <div className="grid grid-cols-2 gap-1.5">
          <InfoCell icon={User} label="Father" value={captain?.fatherName} />
          <InfoCell icon={IdCard} label="CNIC" value={captain?.cnic} mono />
          <InfoCell icon={Mail} label="Email" value={captain?.email} />
          <InfoCell
            icon={Phone}
            label="WhatsApp"
            value={captain?.whatsapp || captain?.phone}
          />
          <InfoCell icon={Users} label="Team" value={team?.name} />
          <InfoCell icon={Flag} label="Group" value={sectionLabel} />
          <div className="flex items-center justify-between rounded-lg bg-zinc-50/90 px-2.5 py-1.5 dark:bg-zinc-900/70">
            <span className="text-[9px] font-bold uppercase text-zinc-400">Status</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${statusStyle}`}
            >
              {team?.status?.replace(/_/g, " ") || "—"}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-zinc-50/90 px-2.5 py-1.5 dark:bg-zinc-900/70">
            <span className="text-[9px] font-bold uppercase text-zinc-400">Fee</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                team?.entryFeeVerified
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
              }`}
            >
              {team?.entryFeeVerified ? "Verified" : "Pending"}
            </span>
          </div>
          <InfoCell
            icon={Trophy}
            label="Record"
            value={`${team?.wins ?? 0}W · ${team?.losses ?? 0}L · ${team?.points ?? 0} pts`}
          />
        </div>
      </div>

      <div className="flex gap-2 border-t border-zinc-100 px-3 py-2 dark:border-zinc-800">
        <button
          type="button"
          onClick={onEditTeam}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-zinc-200 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <Pencil size={12} />
          Edit Team
        </button>
        <button
          type="button"
          onClick={onEditProfile}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 py-1.5 text-xs font-semibold text-white"
        >
          <Pencil size={12} />
          Edit Profile
        </button>
      </div>
    </div>
  );
}
