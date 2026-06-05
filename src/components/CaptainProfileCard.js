"use client";

import Image from "next/image";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  eliminated: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

function InfoRow({ label, value, mono = false }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</dt>
      <dd className={`text-left sm:text-right text-sm font-medium text-zinc-900 dark:text-zinc-100 break-all sm:break-normal ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </dd>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">{children}</h3>
  );
}

export default function CaptainProfileCard({ team, captain, onEditTeam, onEditProfile, className = "" }) {
  const statusStyle =
    STATUS_STYLES[team?.status] || "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";

  return (
    <div
      className={`flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-lg shadow-zinc-300/30 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-zinc-950/40 ${className}`}
    >
      {/* Profile header */}
      <div className="border-b border-zinc-100 bg-gradient-to-b from-emerald-50/80 to-white p-5 dark:border-zinc-800 dark:from-emerald-950/20 dark:to-zinc-900">
        <div className="flex flex-col items-center text-center">
          {captain?.profilePictureUrl ? (
            <Image
              src={captain.profilePictureUrl}
              alt={captain.name}
              width={96}
              height={96}
              className="h-24 w-24 rounded-full object-cover ring-4 ring-emerald-100 dark:ring-emerald-900/40"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-zinc-200 text-2xl text-zinc-500 dark:bg-zinc-800">
              ?
            </div>
          )}
          <p className="mt-3 w-full truncate px-2 text-lg font-semibold" title={captain?.name}>
            {captain?.name}
          </p>
          <span className="mt-1 inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
            Captain
          </span>
        </div>
      </div>

      {/* Personal details */}
      <div className="border-b border-zinc-100 p-5 dark:border-zinc-800">
        <SectionTitle>Personal Details</SectionTitle>
        <dl className="space-y-3">
          <InfoRow label="Father Name" value={captain?.fatherName} />
          <InfoRow label="CNIC" value={captain?.cnic} mono />
          <InfoRow label="Email" value={captain?.email} />
          <InfoRow label="WhatsApp" value={captain?.whatsapp || captain?.phone} />
        </dl>
      </div>

      {/* Team details */}
      <div className="border-b border-zinc-100 p-5 dark:border-zinc-800">
        <SectionTitle>Team Details</SectionTitle>
        <dl className="space-y-3">
          <InfoRow label="Team Name" value={team?.name} />
          <InfoRow label="Section" value={team?.section ? team.section.replace(/_/g, " ") : "Unassigned"} />
          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Status</dt>
            <dd className="text-left sm:text-right">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyle}`}>
                {team?.status?.replace(/_/g, " ") || "—"}
              </span>
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Entry Fee</dt>
            <dd className="text-left sm:text-right">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  team?.entryFeeVerified
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                }`}
              >
                {team?.entryFeeVerified ? "Paid" : "Pending"}
              </span>
            </dd>
          </div>
          <InfoRow
            label="Record"
            value={`${team?.wins ?? 0}W · ${team?.losses ?? 0}L · ${team?.points ?? 0} pts`}
          />
        </dl>
      </div>

      <div className="flex-1" aria-hidden="true" />

      {/* Actions */}
      <div className="flex gap-2 border-t border-zinc-100 p-5 dark:border-zinc-800">
        <button
          type="button"
          onClick={onEditTeam}
          className="flex-1 rounded-lg border border-zinc-200 py-2.5 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Edit Team
        </button>
        <button
          type="button"
          onClick={onEditProfile}
          className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Edit Profile
        </button>
      </div>
    </div>
  );
}
