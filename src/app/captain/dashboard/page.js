"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PlayerForm from "@/components/PlayerForm";
import PlayerTable from "@/components/PlayerTable";
import PlayerViewModal from "@/components/PlayerViewModal";
import CaptainProfileForm from "@/components/CaptainProfileForm";
import TeamProfileForm from "@/components/TeamProfileForm";
import CaptainStatCards from "@/components/CaptainStatCards";
import CaptainProfileCard from "@/components/CaptainProfileCard";
import DashboardModal from "@/components/DashboardModal";
import { TOTAL_PLAYER_SLOTS, getSquadCounts } from "@/lib/tournament-logic";
import { useToast } from "@/context/ToastContext";
import ConfirmModal from "@/components/ConfirmModal";

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
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [viewPlayer, setViewPlayer] = useState(null);
  const [editPlayer, setEditPlayer] = useState(null);
  const [editingCaptain, setEditingCaptain] = useState(false);
  const [editingTeam, setEditingTeam] = useState(false);
  const [savingCaptain, setSavingCaptain] = useState(false);
  const [savingTeam, setSavingTeam] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  // Custom Delete Confirm Modal State
  const [deleteTargetPlayer, setDeleteTargetPlayer] = useState(null);
  const [deletingPlayerLoading, setDeletingPlayerLoading] = useState(false);

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
      setPlayers(data.players || []);
    } catch {
      router.push("/captain/login");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddPlayer(playerData) {
    setAdding(true);
    try {
      const formData = new FormData();
      formData.append("name", playerData.name);
      formData.append("fatherName", playerData.fatherName);
      formData.append("cnic", playerData.cnic);
      formData.append("address", playerData.address);
      formData.append("role", playerData.role);
      formData.append("profilePicture", playerData.profilePicture);
      formData.append("cnicImage", playerData.cnicImage);

      const res = await fetch("/api/teams/players", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add player");
      
      setShowAddPlayer(false);
      toast(`Player "${playerData.name}" added successfully to the squad!`, "success");
      await fetchTeam();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setAdding(false);
    }
  }

  async function handleEditPlayer(playerData) {
    if (!editPlayer) return;
    setEditing(true);
    try {
      const formData = new FormData();
      formData.append("name", playerData.name);
      formData.append("fatherName", playerData.fatherName);
      formData.append("cnic", playerData.cnic);
      formData.append("address", playerData.address);
      formData.append("role", playerData.role);
      if (playerData.profilePicture) formData.append("profilePicture", playerData.profilePicture);
      if (playerData.cnicImage) formData.append("cnicImage", playerData.cnicImage);

      const res = await fetch(`/api/teams/players/${editPlayer._id}`, { method: "PATCH", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update player");
      
      setEditPlayer(null);
      toast(`Player "${playerData.name}" updated successfully.`, "success");
      await fetchTeam();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setEditing(false);
    }
  }

  function handleDeletePlayer(player) {
    setDeleteTargetPlayer(player);
  }

  async function executeDeletePlayer() {
    if (!deleteTargetPlayer) return;
    setDeletingPlayerLoading(true);
    try {
      const res = await fetch(`/api/teams/players/${deleteTargetPlayer._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete player");
      
      toast(`Player "${deleteTargetPlayer.name}" deleted from squad.`, "success");
      if (editPlayer?._id === deleteTargetPlayer._id) setEditPlayer(null);
      await fetchTeam();
      setDeleteTargetPlayer(null);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setDeletingPlayerLoading(false);
    }
  }

  async function handleEditCaptain(data) {
    setSavingCaptain(true);
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("fatherName", data.fatherName);
      formData.append("cnic", data.cnic);
      formData.append("email", data.email);
      formData.append("whatsapp", data.whatsapp);
      if (data.profilePicture) formData.append("profilePicture", data.profilePicture);
      if (data.cnicImage) formData.append("cnicImage", data.cnicImage);

      const res = await fetch("/api/captain/profile", { method: "PATCH", body: formData });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to update profile");

      setTeam((prev) => ({ ...prev, captain: { ...prev.captain, ...result.captain } }));
      setEditingCaptain(false);
      toast("Profile details updated successfully.", "success");
      window.dispatchEvent(new Event("profile-update"));
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSavingCaptain(false);
    }
  }

  async function handleEditTeam(data) {
    setSavingTeam(true);
    try {
      const res = await fetch("/api/teams/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to update team");

      setTeam(result.team);
      setPlayers(result.players || []);
      setEditingTeam(false);
      toast("Team name updated successfully.", "success");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSavingTeam(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  const squad = getSquadCounts(players);
  const { displayMain: mainCount, displayTotal: totalCount, reserved: reservedCount } = squad;
  const canAddPlayer = players.length < TOTAL_PLAYER_SLOTS;
  const captain = team?.captain;

  function handleEntryFeeUploaded(data) {
    setTeam((prev) => ({
      ...prev,
      entryFeeImageUrl: data.entryFeeImageUrl,
      entryFeeVerified: data.entryFeeVerified ?? false,
    }));
    toast("Entry fee receipt uploaded successfully. Pending verification.", "success");
  }

  return (
    <div className="min-h-screen bg-transparent">
      {/* Workspace Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center border-b border-zinc-200/80 dark:border-zinc-800 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Captain Workspace</p>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white sm:text-3xl tracking-tight mt-0.5">{team?.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={team?.status} />
        </div>
      </div>

      <div className="mx-auto max-w-6xl py-2">
        {/* Stats — full width at top */}
        <div className="mb-6 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-lg shadow-zinc-300/30 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-zinc-950/40">
          <CaptainStatCards
            mainCount={mainCount}
            reservedCount={reservedCount}
            totalCount={totalCount}
            entryFeeVerified={!!team?.entryFeeVerified}
            entryFeeUploaded={!!team?.entryFeeImageUrl}
            onEntryFeeUploaded={handleEntryFeeUploaded}
          />
        </div>

        <div className="grid items-stretch gap-6 lg:grid-cols-3">
          {/* Sidebar — team & captain profile */}
          <div className="flex flex-col gap-4 min-w-0 lg:col-span-1">
            <CaptainProfileCard
              className="flex-1"
              team={team}
              captain={captain}
              onEditTeam={() => setEditingTeam(true)}
              onEditProfile={() => setEditingCaptain(true)}
            />
          </div>

          {/* Squad management */}
          <div className="flex flex-col min-w-0 lg:col-span-2">
            <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-lg shadow-zinc-300/30 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-zinc-950/40">
              <PlayerTable
                players={players}
                captain={captain}
                onView={setViewPlayer}
                onViewCaptain={(c) => setViewPlayer({ ...c, isCaptain: true })}
                onEditCaptain={() => setEditingCaptain(true)}
                onEdit={setEditPlayer}
                onDelete={handleDeletePlayer}
                deletingId={deletingId}
                onAddPlayer={canAddPlayer ? () => setShowAddPlayer(true) : undefined}
                embedded
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {editingTeam && (
        <DashboardModal title="Edit Team" onClose={() => setEditingTeam(false)}>
          <TeamProfileForm
            team={team}
            onSubmit={handleEditTeam}
            onCancel={() => setEditingTeam(false)}
            loading={savingTeam}
            embedded
          />
        </DashboardModal>
      )}

      {editingCaptain && (
        <DashboardModal title="Edit Profile" onClose={() => setEditingCaptain(false)}>
          <CaptainProfileForm
            captain={captain}
            onSubmit={handleEditCaptain}
            onCancel={() => setEditingCaptain(false)}
            loading={savingCaptain}
            embedded
          />
        </DashboardModal>
      )}

      {editPlayer && (
        <DashboardModal title="Edit Player" onClose={() => setEditPlayer(null)}>
          <PlayerForm
            mode="edit"
            initialPlayer={editPlayer}
            onSubmit={handleEditPlayer}
            onCancel={() => setEditPlayer(null)}
            existingPlayers={players}
            loading={editing}
            embedded
          />
        </DashboardModal>
      )}

      {showAddPlayer && (
        <DashboardModal title="Add Player" onClose={() => setShowAddPlayer(false)}>
          <PlayerForm
            onSubmit={handleAddPlayer}
            existingPlayers={players}
            loading={adding}
            embedded
          />
        </DashboardModal>
      )}

      {viewPlayer && <PlayerViewModal player={viewPlayer} onClose={() => setViewPlayer(null)} />}

      {/* Reusable Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTargetPlayer}
        title="Delete Player"
        message={deleteTargetPlayer ? `Are you sure you want to delete "${deleteTargetPlayer.name}" from your squad? This action cannot be undone.` : ""}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        onConfirm={executeDeletePlayer}
        onCancel={() => setDeleteTargetPlayer(null)}
        loading={deletingPlayerLoading}
        danger={true}
      />
    </div>
  );
}
