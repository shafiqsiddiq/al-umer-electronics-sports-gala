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
      await fetchTeam();
    } catch (err) {
      alert(err.message);
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
      await fetchTeam();
    } catch (err) {
      alert(err.message);
    } finally {
      setEditing(false);
    }
  }

  async function handleDeletePlayer(player) {
    if (!confirm(`Delete ${player.name} from squad?`)) return;
    setDeletingId(player._id);
    try {
      const res = await fetch(`/api/teams/players/${player._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete player");
      if (editPlayer?._id === player._id) setEditPlayer(null);
      await fetchTeam();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
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
    } catch (err) {
      alert(err.message);
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
    } catch (err) {
      alert(err.message);
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
  }

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      {/* Top bar */}
      <div className="border-b border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Captain Dashboard</p>
            <h1 className="text-xl font-bold sm:text-2xl">{team?.name}</h1>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={team?.status} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
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
          <div className="flex flex-col gap-4 lg:col-span-1">
            <CaptainProfileCard
              className="flex-1"
              team={team}
              captain={captain}
              onEditTeam={() => setEditingTeam(true)}
              onEditProfile={() => setEditingCaptain(true)}
            />

          </div>

          {/* Squad management */}
          <div className="flex flex-col lg:col-span-2">
            <div className="flex h-full min-h-0 flex-col rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-lg shadow-zinc-300/30 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-zinc-950/40">
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
    </div>
  );
}
