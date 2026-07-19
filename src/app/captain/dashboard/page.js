"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CaptainProfileForm from "@/components/CaptainProfileForm";
import TeamProfileForm from "@/components/TeamProfileForm";
import CaptainProfileCard from "@/components/CaptainProfileCard";
import DashboardModal from "@/components/DashboardModal";
import { useToast } from "@/context/ToastContext";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  eliminated: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${style}`}>
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

  async function handleUpdateCaptain(formData) {
    setSavingCaptain(true);
    try {
      const res = await fetch("/api/teams/captain", { method: "PATCH", body: formData });
      if (!res.ok) throw new Error("Failed to update profile");
      setEditingCaptain(false);
      toast("Profile updated successfully", "success");
      await fetchTeam();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSavingCaptain(false);
    }
  }

  async function handleUpdateTeam(formData) {
    setSavingTeam(true);
    try {
      const res = await fetch("/api/teams/me", { method: "PATCH", body: formData });
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

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!team) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 py-8">
      {/* Header & Status */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white sm:text-3xl">
            {team.name}
          </h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <span>Status:</span>
            <StatusBadge status={team.status} />
            <span className="ml-4">Fee Verified:</span>
            {team.entryFeeVerified ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Yes</span>
            ) : (
              <span className="text-red-500 font-semibold">Pending</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          <CaptainProfileCard
            team={team}
            captain={team.captain}
            onEditTeam={() => setEditingTeam(true)}
            onEditProfile={() => setEditingCaptain(true)}
          />
        </div>

        <div className="space-y-8">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-white">Payment Receipt</h2>
            {team.entryFeeImageUrl ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                <img
                  src={team.entryFeeImageUrl}
                  alt="Entry Fee Receipt"
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex aspect-video w-full items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No receipt uploaded</p>
              </div>
            )}
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              Your payment receipt has been uploaded. An administrator will verify it shortly.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
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
