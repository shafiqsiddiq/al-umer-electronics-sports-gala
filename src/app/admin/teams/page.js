"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import TeamViewModal from "@/components/TeamViewModal";
import TeamEditModal from "@/components/TeamEditModal";
import { TOTAL_PLAYER_SLOTS, TOTAL_SQUAD } from "@/lib/tournament-logic";
import { Eye, Edit, Trash2, CheckCircle, ShieldCheck, XCircle, Play, MoreVertical, Key, Search, X, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import ConfirmModal from "@/components/ConfirmModal";

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-200/40 dark:border-amber-900/20",
  approved: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 border border-blue-200/40 dark:border-blue-900/20",
  active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200/40 dark:border-emerald-900/20",
  eliminated: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300 border border-red-200/40 dark:border-red-900/20",
};

function TeamActionDropdown({
  team,
  loadingTeamId,
  deletingId,
  handleView,
  handleEdit,
  handleDelete,
  updateTeam,
  onRejectFee,
  onChangePassword,
  alignUp = false,
  light = false,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`rounded-lg p-1.5 transition ${
          light
            ? "text-white/90 hover:bg-white/20 hover:text-white"
            : "text-zinc-500 hover:bg-zinc-150 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        }`}
        title="Actions"
      >
        <MoreVertical size={18} />
      </button>

      {open && (
        <div className={`absolute right-0 w-48 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950 z-50 ${
          alignUp 
            ? "bottom-full mb-1.5 origin-bottom-right" 
            : "top-full mt-1.5 origin-top-right"
        }`}>
          {/* View */}
          <button
            onClick={() => {
              setOpen(false);
              handleView(team);
            }}
            disabled={loadingTeamId === team._id}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/35 transition disabled:opacity-50"
          >
            <Eye size={14} />
            <span>View Details</span>
          </button>

          {/* Edit */}
          <button
            onClick={() => {
              setOpen(false);
              handleEdit(team);
            }}
            disabled={loadingTeamId === team._id}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/35 transition disabled:opacity-50"
          >
            <Edit size={14} />
            <span>Edit Team</span>
          </button>

          {/* Change Password */}
          {team.captain && (
            <button
              onClick={() => {
                setOpen(false);
                onChangePassword(team);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-950/35 transition"
            >
              <Key size={14} />
              <span>Change Password</span>
            </button>
          )}

          {/* Approve */}
          {team.status === "pending" && (team.playerCount || 0) >= TOTAL_PLAYER_SLOTS && (
            <button
              onClick={() => {
                setOpen(false);
                updateTeam(team._id, "approve");
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/35 transition"
            >
              <ShieldCheck size={14} />
              <span>Approve Team</span>
            </button>
          )}

          {/* Verify Fee / Mark as Paid */}
          {!team.entryFeeVerified && (
            <button
              onClick={() => {
                setOpen(false);
                updateTeam(team._id, "verifyEntryFee");
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-teal-600 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-950/35 transition"
            >
              <CheckCircle size={14} />
              <span>
                {team.entryFeeImageUrl || team.entryFeeRejected
                  ? "Verify Fee"
                  : "Mark Fee Paid"}
              </span>
            </button>
          )}

          {/* Reject Fee: available for uploaded receipts and also for
              already-verified fees (undo an accidental verification) */}
          {(team.entryFeeImageUrl || team.entryFeeVerified) && (
            <button
              onClick={() => {
                setOpen(false);
                onRejectFee(team);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950/35 transition"
            >
              <XCircle size={14} />
              <span>Reject Fee</span>
            </button>
          )}

          {/* Activate */}
          {team.status === "approved" && team.entryFeeVerified && (
            <button
              onClick={() => {
                setOpen(false);
                updateTeam(team._id, "activate");
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/35 transition"
            >
              <Play size={14} />
              <span>Activate Team</span>
            </button>
          )}

          {/* Info Status messages */}
          {team.status === "approved" && team.entryFeeImageUrl && !team.entryFeeVerified && (
            <div className="px-3 py-1.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50/20 dark:bg-amber-950/10 rounded-lg mx-1 mt-1">
              Verify entry fee first to activate
            </div>
          )}
          {team.status === "approved" && !team.entryFeeImageUrl && !team.entryFeeVerified && (
            <div className="px-3 py-1.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50/20 dark:bg-amber-950/10 rounded-lg mx-1 mt-1">
              Entry fee pending
            </div>
          )}

          {/* Delete (with border top separator) */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />
          <button
            onClick={() => {
              setOpen(false);
              handleDelete(team);
            }}
            disabled={deletingId === team._id}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/35 transition disabled:opacity-50"
          >
            <Trash2 size={14} />
            <span>Delete Team</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminTeamsPage() {
  const { toast } = useToast();
  
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewTeam, setViewTeam] = useState(null);
  const [editTeam, setEditTeam] = useState(null);
  const [loadingTeamId, setLoadingTeamId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Reusable modal states
  const [deleteTargetTeam, setDeleteTargetTeam] = useState(null);
  const [deletingTeamLoading, setDeletingTeamLoading] = useState(false);
  const [rejectTargetTeam, setRejectTargetTeam] = useState(null);
  const [rejectingTeamLoading, setRejectingTeamLoading] = useState(false);
  const [passwordTargetTeam, setPasswordTargetTeam] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [previewImageUrl, setPreviewImageUrl] = useState(null);

  // Search & filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [feeFilter, setFeeFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");

  // Pagination
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, feeFilter, sectionFilter]);

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
      toast(err.message, "error");
    }
  }

  async function handleEdit(team) {
    try {
      const fullTeam = await fetchTeamDetails(team._id);
      setEditTeam(fullTeam);
    } catch (err) {
      toast(err.message, "error");
    }
  }

  function handleDelete(team) {
    setDeleteTargetTeam(team);
  }

  async function executeDeleteTeam() {
    if (!deleteTargetTeam) return;
    setDeletingTeamLoading(true);
    try {
      const res = await fetch(`/api/admin/teams/${deleteTargetTeam._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete team");
      toast(`Team "${deleteTargetTeam.name}" deleted successfully.`, "success");
      await fetchTeams();
      setDeleteTargetTeam(null);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setDeletingTeamLoading(false);
    }
  }

  function handleRejectFeeConfirm(team) {
    setRejectTargetTeam(team);
  }

  async function executeRejectFee() {
    if (!rejectTargetTeam) return;
    setRejectingTeamLoading(true);
    try {
      const res = await fetch(`/api/admin/teams/${rejectTargetTeam._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rejectEntryFee" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject fee receipt");
      toast(`Entry fee receipt for team "${rejectTargetTeam.name}" has been rejected.`, "warning");
      await fetchTeams();
      setRejectTargetTeam(null);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setRejectingTeamLoading(false);
    }
  }

  async function executeChangePassword(e) {
    e.preventDefault();
    if (!passwordTargetTeam || !newPassword) return;
    if (newPassword.length < 6) {
      toast("Password must be at least 6 characters", "error");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch(`/api/admin/teams/${passwordTargetTeam._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "changePassword", newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");
      
      toast(`Password for captain of "${passwordTargetTeam.name}" has been updated.`, "success");
      setPasswordTargetTeam(null);
      setNewPassword("");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSavingPassword(false);
    }
  }

  async function updateTeam(id, action) {
    try {
      const res = await fetch(`/api/admin/teams/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update team");

      if (action === "verifyEntryFee") {
        toast("Entry fee receipt verified successfully.", "success");
      } else if (action === "activate") {
        toast("Team status updated to Active successfully.", "success");
      } else if (action === "approve") {
        toast("Team registration approved successfully.", "success");
      } else {
        toast("Team status updated successfully.", "success");
      }
      await fetchTeams();
    } catch (err) {
      toast(err.message, "error");
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
              entryFeeRejected: updatedTeam.entryFeeRejected,
              playerCount: updatedTeam.players?.length ?? t.playerCount,
            }
          : t
      )
    );
  }

  function feeStatusOf(team) {
    if (team.entryFeeVerified) return "verified";
    if (team.entryFeeRejected && !team.entryFeeImageUrl) return "rejected";
    if (team.entryFeeImageUrl) return "pending";
    return "not_uploaded";
  }

  const query = search.trim().toLowerCase();
  const filteredTeams = teams.filter((team) => {
    if (
      query &&
      ![team.name, team.captain?.name, team.captain?.villageOrCity].some((v) =>
        v?.toLowerCase().includes(query)
      )
    ) {
      return false;
    }
    if (statusFilter !== "all" && team.status !== statusFilter) return false;
    if (feeFilter !== "all" && feeStatusOf(team) !== feeFilter) return false;
    if (sectionFilter !== "all" && (team.section || "unassigned") !== sectionFilter)
      return false;
    return true;
  });

  const hasActiveFilters =
    query || statusFilter !== "all" || feeFilter !== "all" || sectionFilter !== "all";

  const totalPages = Math.max(1, Math.ceil(filteredTeams.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedTeams = filteredTeams.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setFeeFilter("all");
    setSectionFilter("all");
  }

  const selectClass =
    "w-full min-w-0 appearance-none rounded-xl border border-zinc-200 bg-white py-2 pl-3 pr-9 text-sm font-medium text-zinc-700 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 lg:w-auto";

  const paginationBar =
    filteredTeams.length > 0 ? (
      <div className="flex flex-wrap items-center justify-end gap-3">
        <p className="rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-900/40">
          Showing {(currentPage - 1) * PAGE_SIZE + 1}–
          {Math.min(currentPage * PAGE_SIZE, filteredTeams.length)} of{" "}
          {filteredTeams.length} team{filteredTeams.length === 1 ? "" : "s"}
        </p>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-600 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-emerald-900/50 dark:bg-zinc-950 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition ${
                  p === currentPage
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30"
                    : "border border-emerald-200 bg-white text-emerald-700 shadow-sm hover:bg-emerald-50 dark:border-emerald-900/50 dark:bg-zinc-950 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                }`}
              >
                {p}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-600 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-emerald-900/50 dark:bg-zinc-950 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    ) : null;

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold tracking-tight">Team Management</h1>

      {/* Search & filters */}
      <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:w-72">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams..."
            className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-9 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
          <div className="w-full lg:w-auto">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-zinc-400 lg:hidden">
              Status
            </p>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={selectClass}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="active">Active</option>
                <option value="eliminated">Eliminated</option>
                <option value="qualified_main">Qualified Main</option>
                <option value="qualified_loser">Qualified Loser</option>
                <option value="final_eight">Final Eight</option>
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600"
              />
            </div>
          </div>

          <div className="w-full lg:w-auto">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-zinc-400 lg:hidden">
              Entry Fee
            </p>
            <div className="relative">
              <select
                value={feeFilter}
                onChange={(e) => setFeeFilter(e.target.value)}
                className={selectClass}
              >
                <option value="all">All Fees</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="not_uploaded">Not Uploaded</option>
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600"
              />
            </div>
          </div>

          <div className="w-full lg:w-auto">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-zinc-400 lg:hidden">
              Section
            </p>
            <div className="relative">
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className={selectClass}
              >
                <option value="all">All Sections</option>
                <option value="A">Group A</option>
                <option value="B">Group B</option>
                <option value="C">Group C</option>
                <option value="unassigned">Unassigned</option>
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50 lg:w-auto"
            >
              <X size={13} />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Desktop view table */}
      <div className="hidden md:block overflow-visible rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-emerald-700/20 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-[11px] font-bold uppercase tracking-wider text-emerald-50">
              <th className="rounded-tl-2xl px-5 py-3.5">Team</th>
              <th className="hidden px-4 py-3.5 lg:table-cell">Village/City</th>
              <th className="hidden px-4 py-3.5 xl:table-cell">Section</th>
              <th className="px-4 py-3.5">Players</th>
              <th className="px-4 py-3.5">Entry Fee</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="rounded-tr-2xl px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTeams.map((team, idx) => (
              <tr
                key={team._id}
                className="group border-t border-zinc-100 transition-colors first:border-t-0 hover:bg-emerald-50/40 dark:border-zinc-800/80 dark:hover:bg-emerald-950/10"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    {team.captain?.profilePictureUrl ? (
                      <Image
                        src={team.captain.profilePictureUrl}
                        alt={team.captain.name || team.name}
                        width={40}
                        height={40}
                        className="h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-sm font-black text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                        {team.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="truncate font-bold text-zinc-900 dark:text-zinc-100">
                        {team.name}
                      </div>
                      <div className="truncate text-xs text-zinc-500">
                        {team.captain?.name || "No captain"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="hidden px-4 py-3.5 lg:table-cell">
                  <span className="text-sm font-medium capitalize text-zinc-700 dark:text-zinc-300">
                    {team.captain?.villageOrCity || "—"}
                  </span>
                </td>
                <td className="hidden px-4 py-3.5 xl:table-cell">
                  <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {!team.section || team.section === "unassigned"
                      ? "Unassigned"
                      : `Group ${team.section}`}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">
                    {(team.playerCount || 0) + 1}
                  </span>
                  <span className="text-xs text-zinc-400"> / {TOTAL_SQUAD}</span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-col items-start gap-1.5">
                    {!team.entryFeeImageUrl && team.entryFeeRejected ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200/60 dark:bg-red-950/20 dark:text-red-400 dark:ring-red-900/40">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        Rejected
                      </span>
                    ) : !team.entryFeeImageUrl ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-50 px-2.5 py-0.5 text-xs font-medium text-zinc-500 ring-1 ring-inset ring-zinc-200/60 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                        Not uploaded
                      </span>
                    ) : team.entryFeeVerified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200/60 dark:bg-emerald-950/20 dark:text-emerald-400 dark:ring-emerald-900/40">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200/60 dark:bg-amber-950/20 dark:text-amber-400 dark:ring-amber-900/40">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Pending
                      </span>
                    )}
                    {team.entryFeeImageUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewImageUrl(team.entryFeeImageUrl)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline dark:text-emerald-400"
                      >
                        <Eye size={12} />
                        View Receipt
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                    STATUS_STYLES[team.status] || "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}>
                    {team.status?.replace(/_/g, " ") || "—"}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <TeamActionDropdown
                    team={team}
                    loadingTeamId={loadingTeamId}
                    deletingId={deletingId}
                    handleView={handleView}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                    updateTeam={updateTeam}
                    onRejectFee={handleRejectFeeConfirm}
                    onChangePassword={(t) => setPasswordTargetTeam(t)}
                    alignUp={idx >= paginatedTeams.length - 2 && paginatedTeams.length > 2}
                  />
                </td>
              </tr>
            ))}
            {filteredTeams.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-zinc-400">
                  {hasActiveFilters
                    ? "No teams match your search or filters"
                    : "No teams registered yet"}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination footer inside the table card */}
        {paginationBar && (
          <div className="border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
            {paginationBar}
          </div>
        )}
      </div>

      {/* Mobile view list (Stacked details card view) */}
      <div className="md:hidden flex flex-col gap-4">
        {filteredTeams.length === 0 && (
          <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-400 dark:border-zinc-700">
            {hasActiveFilters
              ? "No teams match your search or filters"
              : "No teams registered yet"}
          </p>
        )}
        {paginatedTeams.map((team, idx) => (
          <div
            key={team._id}
            className="flex flex-col overflow-hidden bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-md transition"
          >
            {/* Header: Avatar, Team Name & Actions */}
            <div className="flex items-start justify-between bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-4 py-3 text-white">
              <div className="flex items-center gap-3 min-w-0">
                {team.captain?.profilePictureUrl ? (
                  <Image
                    src={team.captain.profilePictureUrl}
                    alt={team.captain.name || team.name}
                    width={44}
                    height={44}
                    className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white/40"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20 text-base font-bold text-white">
                    {team.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-extrabold text-white text-base leading-tight break-words pr-2">
                    {team.name}
                  </h3>
                  <p className="text-xs text-emerald-50/90 mt-0.5">Team Overview</p>
                </div>
              </div>

              <div className="shrink-0 -mt-1 -mr-1">
                <TeamActionDropdown
                  team={team}
                  loadingTeamId={loadingTeamId}
                  deletingId={deletingId}
                  handleView={handleView}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                  updateTeam={updateTeam}
                  onRejectFee={handleRejectFeeConfirm}
                  onChangePassword={(t) => setPasswordTargetTeam(t)}
                  alignUp={idx >= paginatedTeams.length - 2 && paginatedTeams.length > 2}
                  light
                />
              </div>
            </div>

            {/* Details: Each on its own full line/row */}
            <div className="flex flex-col gap-2.5 text-sm p-4">
              <div className="flex justify-between items-center py-0.5 border-b border-zinc-100/50 dark:border-zinc-800/30">
                <span className="text-zinc-400 dark:text-zinc-500 font-medium">Captain</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-right break-words max-w-[70%]">
                  {team.captain?.name || "No captain"}
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5 border-b border-zinc-100/50 dark:border-zinc-800/30">
                <span className="text-zinc-400 dark:text-zinc-500 font-medium">Village/City</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize text-right break-words max-w-[70%]">
                  {team.captain?.villageOrCity || "—"}
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5 border-b border-zinc-100/50 dark:border-zinc-800/30">
                <span className="text-zinc-400 dark:text-zinc-500 font-medium">Section</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize text-right break-words max-w-[70%]">
                  {team.section || "Unassigned"}
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5 border-b border-zinc-100/50 dark:border-zinc-800/30">
                <span className="text-zinc-400 dark:text-zinc-500 font-medium">Squad</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-right">
                  {(team.playerCount || 0) + 1} / {TOTAL_SQUAD} Players
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5 border-b border-zinc-100/50 dark:border-zinc-800/30">
                <span className="text-zinc-400 dark:text-zinc-500 font-medium">Entry Fee</span>
                <div className="flex flex-col items-end gap-1">
                  {!team.entryFeeImageUrl && team.entryFeeRejected ? (
                    <span className="inline-flex rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200/30">
                      Rejected
                    </span>
                  ) : !team.entryFeeImageUrl ? (
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">Not uploaded</span>
                  ) : team.entryFeeVerified ? (
                    <span className="inline-flex rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/30">
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/30">
                      Pending verification
                    </span>
                  )}
                  {team.entryFeeImageUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewImageUrl(team.entryFeeImageUrl)}
                      className="inline-flex items-center gap-0.5 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 transition"
                    >
                      <Eye size={10} />
                      View Receipt
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-0.5">
                <span className="text-zinc-400 dark:text-zinc-500 font-medium">Status</span>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${
                  STATUS_STYLES[team.status] || "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                }`}>
                  {team.status?.replace(/_/g, " ") || "—"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination (mobile) */}
      {paginationBar && <div className="mt-4 md:hidden">{paginationBar}</div>}

      {viewTeam && <TeamViewModal team={viewTeam} onClose={() => setViewTeam(null)} />}
      {editTeam && (
        <TeamEditModal
          team={editTeam}
          onClose={() => setEditTeam(null)}
          onSaved={handleTeamSaved}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTargetTeam}
        title="Delete Team"
        message={`Are you sure you want to delete the team "${deleteTargetTeam?.name}"? This action is permanent and cannot be undone.`}
        confirmText="Delete Team"
        cancelText="Cancel"
        onConfirm={executeDeleteTeam}
        onCancel={() => setDeleteTargetTeam(null)}
        loading={deletingTeamLoading}
        danger={true}
      />

      <ConfirmModal
        isOpen={!!rejectTargetTeam}
        title="Reject Entry Fee"
        message={`Are you sure you want to reject the entry fee receipt for "${rejectTargetTeam?.name}"? The captain will need to re-upload.`}
        confirmText="Reject Receipt"
        cancelText="Cancel"
        onConfirm={executeRejectFee}
        onCancel={() => setRejectTargetTeam(null)}
        loading={rejectingTeamLoading}
        danger={true}
      />

      {/* Change Password Modal */}
      {passwordTargetTeam && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 backdrop-blur-sm p-4 transition-all"
          onClick={() => {
            setPasswordTargetTeam(null);
            setNewPassword("");
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">
              Change Captain Password
            </h3>
            <p className="text-sm text-zinc-500 mb-4">
              Enter a new password for the captain of <span className="font-semibold text-zinc-700 dark:text-zinc-300">{passwordTargetTeam.name}</span>.
            </p>
            <form onSubmit={executeChangePassword}>
              <input
                type="password"
                placeholder="New Password (min 6 chars)"
                className="w-full rounded-xl border border-zinc-200 bg-transparent px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 mb-4"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordTargetTeam(null);
                    setNewPassword("");
                  }}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition"
                  disabled={savingPassword}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPassword || !newPassword || newPassword.length < 6}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                  {savingPassword ? "Saving..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Entry Fee Receipt Full-Size Lightbox Modal */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 transition-all duration-300"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div
            className="relative max-h-[85vh] max-w-4xl overflow-hidden rounded-xl bg-zinc-950 p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute right-4 top-4 z-[70] flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 hover:scale-105 active:scale-95 transition border border-white/20 text-lg font-bold shadow-lg"
              title="Close Preview"
            >
              ✕
            </button>
            <div className="relative h-[70vh] w-[80vw] max-w-3xl">
              <Image
                src={previewImageUrl}
                alt="Receipt Full View"
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
