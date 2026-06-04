"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import TeamViewModal from "@/components/TeamViewModal";
import TeamEditModal from "@/components/TeamEditModal";
import { TOTAL_PLAYER_SLOTS, TOTAL_SQUAD } from "@/lib/tournament-logic";

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewTeam, setViewTeam] = useState(null);
  const [editTeam, setEditTeam] = useState(null);
  const [loadingTeamId, setLoadingTeamId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  async function fetchTeams() {
    const res = await fetch("/api/admin/teams");
    if (res.ok) {
      const data = await res.json();
      setTeams(data.teams || []);
    }
    setLoading(false);
  }

  async function fetchTeamDetails(id) {
    setLoadingTeamId(id);
    try {
      const res = await fetch(`/api/admin/teams/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load team");
      return data.team;
    } finally {
      setLoadingTeamId(null);
    }
  }

  async function handleView(team) {
    try {
      const fullTeam = await fetchTeamDetails(team._id);
      setViewTeam(fullTeam);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleEdit(team) {
    try {
      const fullTeam = await fetchTeamDetails(team._id);
      setEditTeam(fullTeam);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(team) {
    if (!confirm(`Delete team "${team.name}"? This will also delete the captain and all players.`)) {
      return;
    }

    setDeletingId(team._id);
    try {
      const res = await fetch(`/api/admin/teams/${team._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete team");
      await fetchTeams();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  async function updateTeam(id, action) {
    const res = await fetch(`/api/admin/teams/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) fetchTeams();
    else {
      const data = await res.json();
      alert(data.error);
    }
  }

  function handleTeamSaved(updatedTeam) {
    setTeams((prev) =>
      prev.map((t) =>
        t._id === updatedTeam._id
          ? {
              ...t,
              name: updatedTeam.name,
              section: updatedTeam.section,
              status: updatedTeam.status,
              entryFeeImageUrl: updatedTeam.entryFeeImageUrl,
              entryFeeVerified: updatedTeam.entryFeeVerified,
              playerCount: updatedTeam.players?.length ?? t.playerCount,
            }
          : t
      )
    );
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Team Management</h1>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800">
            <tr>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3">Section</th>
              <th className="px-4 py-3">Players</th>
              <th className="px-4 py-3">Entry Fee</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team._id} className="border-t border-zinc-200 dark:border-zinc-700">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {team.captain?.profilePictureUrl ? (
                      <Image
                        src={team.captain.profilePictureUrl}
                        alt={team.captain.name || team.name}
                        width={36}
                        height={36}
                        className="h-9 w-9 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs text-zinc-500 dark:bg-zinc-700">
                        N/A
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{team.name}</div>
                      <div className="text-xs text-zinc-500">{team.captain?.name || "No captain"}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{team.section}</td>
                <td className="px-4 py-3">{(team.playerCount || 0) + 1}/{TOTAL_SQUAD}</td>
                <td className="px-4 py-3">
                  {!team.entryFeeImageUrl ? (
                    <span className="text-zinc-400">Not uploaded</span>
                  ) : team.entryFeeVerified ? (
                    <span className="font-medium text-emerald-600">Verified</span>
                  ) : (
                    <span className="font-medium text-amber-600">Pending verification</span>
                  )}
                  {team.entryFeeImageUrl && (
                    <>
                      {" · "}
                      <a
                        href={team.entryFeeImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:underline"
                      >
                        View
                      </a>
                    </>
                  )}
                </td>
                <td className="px-4 py-3 capitalize">{team.status}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleView(team)}
                      disabled={loadingTeamId === team._id}
                      className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleEdit(team)}
                      disabled={loadingTeamId === team._id}
                      className="rounded bg-amber-500 px-2 py-1 text-xs text-white hover:bg-amber-600 disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(team)}
                      disabled={deletingId === team._id}
                      className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {deletingId === team._id ? "..." : "Delete"}
                    </button>
                    {team.status === "pending" && (team.playerCount || 0) >= TOTAL_PLAYER_SLOTS && (
                      <button
                        onClick={() => updateTeam(team._id, "approve")}
                        className="rounded bg-emerald-600 px-2 py-1 text-xs text-white"
                      >
                        Approve
                      </button>
                    )}
                    {team.entryFeeImageUrl && !team.entryFeeVerified && (
                      <>
                        <button
                          onClick={() => updateTeam(team._id, "verifyEntryFee")}
                          className="rounded bg-teal-600 px-2 py-1 text-xs text-white hover:bg-teal-700"
                        >
                          Verify Fee
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Reject this receipt? Captain will need to upload again.")) {
                              updateTeam(team._id, "rejectEntryFee");
                            }
                          }}
                          className="rounded bg-orange-600 px-2 py-1 text-xs text-white hover:bg-orange-700"
                        >
                          Reject Fee
                        </button>
                      </>
                    )}
                    {team.status === "approved" && team.entryFeeImageUrl && team.entryFeeVerified && (
                      <button
                        onClick={() => updateTeam(team._id, "activate")}
                        className="rounded bg-indigo-600 px-2 py-1 text-xs text-white"
                      >
                        Activate
                      </button>
                    )}
                    {team.status === "approved" && team.entryFeeImageUrl && !team.entryFeeVerified && (
                      <span className="text-xs text-amber-600">Verify entry fee first</span>
                    )}
                    {team.status === "approved" && !team.entryFeeImageUrl && (
                      <span className="text-xs text-amber-600">Entry fee pending</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewTeam && <TeamViewModal team={viewTeam} onClose={() => setViewTeam(null)} />}
      {editTeam && (
        <TeamEditModal
          team={editTeam}
          onClose={() => setEditTeam(null)}
          onSaved={handleTeamSaved}
        />
      )}
    </div>
  );
}
