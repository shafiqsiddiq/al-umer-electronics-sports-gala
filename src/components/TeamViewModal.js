"use client";

import { useState } from "react";
import Image from "next/image";
import {
  X,
  Phone,
  IdCard,
  Mail,
  Trophy,
  Receipt,
  ExternalLink,
  Shield,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { getSquadCounts } from "@/lib/tournament-logic";

function Avatar({ src, alt, size = 40, ring = false }) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt || "Avatar"}
        width={size}
        height={size}
        className={`object-cover ${ring ? "ring-2 ring-emerald-400/60 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900" : ""}`}
        style={{ width: size, height: size, borderRadius: size > 48 ? 16 : 9999 }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center bg-emerald-100 text-sm font-black text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
      style={{ width: size, height: size, borderRadius: size > 48 ? 16 : 9999 }}
    >
      {(alt || "?").charAt(0).toUpperCase()}
    </div>
  );
}

function StatChip({ label, value, accent }) {
  return (
    <div className="rounded-xl bg-zinc-50 px-3 py-2.5 dark:bg-zinc-800/60">
      <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
        {label}
      </p>
      <p
        className={`mt-0.5 text-sm font-bold ${
          accent || "text-zinc-900 dark:text-zinc-100"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono }) {
  if (!value || value === "—") return null;
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
        <Icon size={13} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
          {label}
        </p>
        <p
          className={`truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100 ${
            mono ? "font-mono text-xs" : ""
          }`}
          title={String(value)}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function DocThumb({ src, label, onOpen }) {
  if (!src) return null;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-2 text-left transition hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-zinc-700 dark:bg-zinc-800/40 dark:hover:border-emerald-700"
    >
      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700">
        <Image src={src} alt={label} fill className="object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100">{label}</p>
        <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
          View full size <ExternalLink size={11} />
        </p>
      </div>
    </button>
  );
}

function sectionLabel(section) {
  if (!section || section === "unassigned") return "Unassigned";
  if (["A", "B", "C"].includes(section)) return `Group ${section}`;
  return String(section).replace(/_/g, " ");
}

function feeLabel(team) {
  if (team.entryFeeVerified) {
    return {
      text: "Verified",
      className: "text-emerald-600",
      icon: CheckCircle2,
      badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    };
  }
  if (team.entryFeeRejected && !team.entryFeeImageUrl) {
    return {
      text: "Rejected",
      className: "text-red-600",
      icon: XCircle,
      badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    };
  }
  // Pending until full Rs. 5000 is paid, or until admin verifies
  return {
    text: "Pending",
    className: "text-amber-600",
    icon: Clock,
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  };
}

export default function TeamViewModal({ team, onClose }) {
  const [previewUrl, setPreviewUrl] = useState(null);

  if (!team) return null;

  const squad = getSquadCounts(team.players || []);
  const fee = feeLabel(team);
  const FeeIcon = fee.icon;
  const whatsapp = team.captain?.whatsapp || team.captain?.phone;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3 backdrop-blur-[2px] sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative shrink-0 overflow-hidden border-b border-emerald-800/20 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 px-4 py-4 text-white sm:px-5">
          <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -left-4 h-20 w-20 rounded-full bg-white/5" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar
                src={team.captain?.profilePictureUrl}
                alt={team.name}
                size={52}
                ring
              />
              <div className="min-w-0">
                <h2 className="truncate text-xl font-black tracking-tight">
                  {team.name}
                </h2>
                <p className="text-sm text-emerald-50/90">
                  {team.captain?.name || "—"} · Captain
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                    {sectionLabel(team.section)}
                  </span>
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold capitalize">
                    {String(team.status || "active").replace(/_/g, " ")}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${fee.badge}`}>
                    Fee: {fee.text}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white hover:bg-white/25"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Captain */}
            <section className="rounded-2xl border border-zinc-200/80 bg-gradient-to-b from-white to-zinc-50/50 p-3.5 dark:border-zinc-800 dark:from-zinc-950 dark:to-zinc-900/40">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  <Shield size={14} />
                </span>
                <h3 className="text-sm font-black text-zinc-900 dark:text-white">
                  Captain
                </h3>
              </div>

              <div className="mb-3 flex items-center gap-3">
                <Avatar
                  src={team.captain?.profilePictureUrl}
                  alt={team.captain?.name}
                  size={56}
                />
                <div className="min-w-0">
                  <p className="truncate font-bold text-zinc-900 dark:text-white">
                    {team.captain?.name || "—"}
                  </p>
                  {team.captain?.fatherName && (
                    <p className="text-xs text-zinc-500">
                      s/o {team.captain.fatherName}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2.5">
                <InfoRow icon={IdCard} label="CNIC" value={team.captain?.cnic} mono />
                <InfoRow
                  icon={MapPin}
                  label="Village/City"
                  value={team.captain?.villageOrCity}
                />
                <InfoRow icon={Phone} label="WhatsApp" value={whatsapp} />
                <InfoRow icon={Mail} label="Email" value={team.captain?.email} />
              </div>

              {team.captain?.cnicImageUrl && (
                <div className="mt-3">
                  <DocThumb
                    src={team.captain.cnicImageUrl}
                    label="Captain CNIC"
                    onOpen={() => setPreviewUrl(team.captain.cnicImageUrl)}
                  />
                </div>
              )}
            </section>

            {/* Stats */}
            <section className="rounded-2xl border border-zinc-200/80 bg-gradient-to-b from-white to-zinc-50/50 p-3.5 dark:border-zinc-800 dark:from-zinc-950 dark:to-zinc-900/40">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                  <Trophy size={14} />
                </span>
                <h3 className="text-sm font-black text-zinc-900 dark:text-white">
                  Team Stats
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <StatChip
                  label="Record"
                  value={`${team.wins ?? 0}W · ${team.losses ?? 0}L`}
                />
                <StatChip label="Points" value={team.points ?? 0} />
                <StatChip
                  label="Squad"
                  value={`${squad.displayTotal} player${squad.displayTotal === 1 ? "" : "s"}`}
                />
                <StatChip
                  label="Entry Fee"
                  value={fee.text}
                  accent={fee.className}
                />
              </div>

              <div
                className={`mt-3 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs ${
                  team.entryFeeRejected && !team.entryFeeImageUrl
                    ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                    : team.entryFeeVerified
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
                      : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
                }`}
              >
                <FeeIcon size={14} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">
                    {team.entryFeeRejected && !team.entryFeeImageUrl
                      ? "Receipt rejected — captain must re-upload"
                      : team.entryFeeVerified
                        ? "Entry fee verified by admin"
                        : Number(team.entryFeePaid || 0) < 5000
                          ? `Pending — Rs. ${Number(team.entryFeePaid || 0).toLocaleString()} of 5,000 received`
                          : "Full Rs. 5,000 received — awaiting admin verification"}
                  </p>
                </div>
              </div>

              {team.entryFeeImageUrl && (
                <div className="mt-3">
                  <DocThumb
                    src={team.entryFeeImageUrl}
                    label="Entry Fee Receipt"
                    onOpen={() => setPreviewUrl(team.entryFeeImageUrl)}
                  />
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-zinc-100 px-4 py-3 dark:border-zinc-800 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-zinc-100 py-2.5 text-sm font-bold text-zinc-700 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Close
          </button>
        </div>
      </div>

      {previewUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="relative max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-xl bg-zinc-950 p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewUrl(null)}
              className="absolute right-3 top-3 z-[70] flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              aria-label="Close preview"
            >
              <X size={16} />
            </button>
            <div className="relative h-[70vh] w-full">
              <Image
                src={previewUrl}
                alt="Full view"
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
