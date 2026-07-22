"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CaptainProfileForm from "@/components/CaptainProfileForm";
import TeamProfileForm from "@/components/TeamProfileForm";
import CaptainProfileCard from "@/components/CaptainProfileCard";
import DashboardModal from "@/components/DashboardModal";
import { useToast } from "@/context/ToastContext";
import {
  CreditCard,
  UploadCloud,
  CheckCircle2,
  Clock,
  Shield,
  ExternalLink,
  Receipt,
  XCircle,
} from "lucide-react";

const STATUS_STYLES = {
  pending:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  approved: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  active:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  eliminated: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

function StatusBadge({ status }) {
  const style =
    STATUS_STYLES[status] ||
    "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${style}`}
    >
      {status?.replace(/_/g, " ") || "unknown"}
    </span>
  );
}

export default function CaptainDashboard() {
  const router = useRouter();
  const { toast } = useToast();

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingCaptain, setEditingCaptain] = useState(false);
  const [editingTeam, setEditingTeam] = useState(false);
  const [savingCaptain, setSavingCaptain] = useState(false);
  const [savingTeam, setSavingTeam] = useState(false);
  const [uploadingFee, setUploadingFee] = useState(false);
  const [feeFile, setFeeFile] = useState(null);

  useEffect(() => {
    fetchTeam();
  }, []);

  async function fetchTeam() {
    try {
      const res = await fetch("/api/teams/me");
      if (res.status === 401) {
        router.push("/captain/login");
        return;
      }
      const data = await res.json();
      setTeam(data.team);
    } catch {
      router.push("/captain/login");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateCaptain(data) {
    setSavingCaptain(true);
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("fatherName", data.fatherName);
      formData.append("cnic", data.cnic);
      formData.append("email", data.email || "");
      formData.append("whatsapp", data.whatsapp);
      if (data.profilePicture) formData.append("profilePicture", data.profilePicture);
      if (data.cnicImage) formData.append("cnicImage", data.cnicImage);

      const res = await fetch("/api/captain/profile", {
        method: "PATCH",
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to update profile");
      setEditingCaptain(false);
      toast("Profile updated successfully", "success");
      window.dispatchEvent(new Event("profile-update"));
      await fetchTeam();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSavingCaptain(false);
    }
  }

  async function handleUpdateTeam(data) {
    setSavingTeam(true);
    try {
      const res = await fetch("/api/teams/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update team");
      }
      setEditingTeam(false);
      toast("Team updated successfully", "success");
      await fetchTeam();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSavingTeam(false);
    }
  }

  async function handleFeeUpload(e) {
    e.preventDefault();
    if (!feeFile) {
      toast("Select a receipt image first", "error");
      return;
    }
    setUploadingFee(true);
    try {
      const formData = new FormData();
      formData.append("entryFeeImage", feeFile);
      const res = await fetch("/api/teams/entry-fee", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setFeeFile(null);
      toast("Receipt uploaded successfully", "success");
      await fetchTeam();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setUploadingFee(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!team) return null;

  const sectionLabel =
    !team.section || team.section === "unassigned"
      ? "Unassigned"
      : ["A", "B", "C"].includes(team.section)
        ? `Group ${team.section}`
        : team.section;

  return (
    <div className="relative flex w-full flex-col gap-3 lg:h-[calc(100vh-7.5rem)] lg:overflow-hidden">
      {/* Compact hero */}
      <div className="relative shrink-0 overflow-hidden rounded-2xl border border-emerald-200/70 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 px-4 py-3 text-white shadow-md shadow-emerald-600/15 dark:border-emerald-800">
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="mb-0.5 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-100/90">
              <Shield size={11} />
              Captain Dashboard
            </div>
            <h1 className="truncate text-xl font-black tracking-tight sm:text-2xl">
              {team.name}
            </h1>
            <p className="text-xs text-emerald-50/85">
              {sectionLabel} · profile, team & entry fee
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <div className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 backdrop-blur">
              <p className="text-[9px] font-bold uppercase text-emerald-100/80">Status</p>
              <StatusBadge status={team.status} />
            </div>
            <div className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 backdrop-blur">
              <p className="text-[9px] font-bold uppercase text-emerald-100/80">Fee</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs font-bold">
                {team.entryFeeVerified ? (
                  <>
                    <CheckCircle2 size={12} /> Verified
                  </>
                ) : team.entryFeeRejected ? (
                  <>
                    <XCircle size={12} /> Rejected
                  </>
                ) : (
                  <>
                    <Clock size={12} /> Pending
                  </>
                )}
              </p>
            </div>
            <div className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 backdrop-blur">
              <p className="text-[9px] font-bold uppercase text-emerald-100/80">Record</p>
              <p className="mt-0.5 text-xs font-bold tabular-nums">
                {team.wins ?? 0}W · {team.losses ?? 0}L · {team.points ?? 0} pts
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2 lg:overflow-hidden">
        <CaptainProfileCard
          team={team}
          captain={team.captain}
          onEditTeam={() => setEditingTeam(true)}
          onEditProfile={() => setEditingCaptain(true)}
          className="min-h-0 lg:overflow-y-auto"
        />

        {/* Compact payment */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex shrink-0 items-center gap-2 border-b border-zinc-100 bg-gradient-to-r from-amber-50 to-transparent px-3 py-2 dark:border-zinc-800 dark:from-amber-950/30">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white">
              <CreditCard size={14} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                Payment Receipt
              </h2>
              <p className="text-[10px] text-zinc-500">Jazz Cash / Easy Paisa</p>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
            <div className="shrink-0 rounded-lg border border-amber-200/80 bg-amber-50/70 px-2.5 py-2 text-[11px] dark:border-amber-900/40 dark:bg-amber-950/20">
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-amber-900/90 dark:text-amber-100/90">
                <p>
                  Acc: <strong>03047058705</strong>
                </p>
                <p>
                  Amt: <strong>Rs. 5,000</strong>
                </p>
                <p className="col-span-2">
                  Title: <strong>Muhammad Shafiq</strong>
                </p>
                <p className="col-span-2">
                  WhatsApp:{" "}
                  <a
                    href="https://wa.me/923044897377"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 font-bold underline"
                  >
                    03044897377
                    <ExternalLink size={9} />
                  </a>
                </p>
              </div>
            </div>

            {team.entryFeeImageUrl ? (
              <div className="mx-auto w-full max-w-[160px] shrink-0 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                <img
                  src={team.entryFeeImageUrl}
                  alt="Entry Fee Receipt"
                  className="max-h-24 w-full object-contain bg-zinc-50 dark:bg-zinc-900"
                />
              </div>
            ) : (
              <div className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-300 bg-zinc-50/80 px-2 py-3 dark:border-zinc-700 dark:bg-zinc-900/40">
                <Receipt className="text-zinc-300" size={16} />
                <p className="text-[11px] font-medium text-zinc-500">No receipt yet</p>
              </div>
            )}

            {team.entryFeeVerified ? (
              <p className="flex shrink-0 items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                <CheckCircle2 size={12} />
                Verified by admin
              </p>
            ) : team.entryFeeRejected ? (
              <div className="shrink-0 space-y-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 dark:border-red-900/50 dark:bg-red-950/30">
                <p className="flex items-center gap-1 text-[11px] font-bold text-red-700 dark:text-red-300">
                  <XCircle size={12} />
                  Receipt rejected by admin
                </p>
                <p className="text-[10px] text-red-600/90 dark:text-red-300/80">
                  Please upload a clear, valid payment receipt to continue.
                </p>
              </div>
            ) : team.entryFeeImageUrl ? (
              <p className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-50 px-2 py-1.5 text-[11px] text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                <Clock size={12} />
                Waiting for verification
              </p>
            ) : (
              <p className="shrink-0 text-[11px] text-zinc-500">
                Upload optional — or share on WhatsApp.
              </p>
            )}

            {!team.entryFeeVerified && (
              <form
                onSubmit={handleFeeUpload}
                className="mt-auto flex shrink-0 flex-col gap-1.5 sm:flex-row sm:items-center"
              >
                <label className="flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/50 px-2 py-1.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300">
                  <UploadCloud size={13} />
                  <span className="truncate">
                    {feeFile
                      ? feeFile.name
                      : team.entryFeeRejected
                        ? "Re-upload receipt"
                        : team.entryFeeImageUrl
                          ? "Replace"
                          : "Choose file"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setFeeFile(e.target.files?.[0] || null)}
                  />
                </label>
                <button
                  type="submit"
                  disabled={uploadingFee || !feeFile}
                  className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-50 sm:shrink-0"
                >
                  {uploadingFee ? "…" : "Submit"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <DashboardModal
        isOpen={editingCaptain}
        onClose={() => setEditingCaptain(false)}
        title="Edit Captain Profile"
      >
        <CaptainProfileForm
          captain={team.captain}
          onSubmit={handleUpdateCaptain}
          loading={savingCaptain}
          onCancel={() => setEditingCaptain(false)}
        />
      </DashboardModal>

      <DashboardModal
        isOpen={editingTeam}
        onClose={() => setEditingTeam(false)}
        title="Edit Team Details"
      >
        <TeamProfileForm
          team={team}
          onSubmit={handleUpdateTeam}
          loading={savingTeam}
          onCancel={() => setEditingTeam(false)}
        />
      </DashboardModal>
    </div>
  );
}
