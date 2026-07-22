"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import { compressImage } from "@/lib/compress-image";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "active", label: "Active" },
  { value: "eliminated", label: "Eliminated" },
  { value: "qualified_main", label: "Qualified Main" },
  { value: "qualified_loser", label: "Qualified Loser" },
  { value: "final_eight", label: "Final Eight" },
];

const SECTION_OPTIONS = [
  { value: "unassigned", label: "Unassigned" },
  { value: "A", label: "Group A" },
  { value: "B", label: "Group B" },
  { value: "C", label: "Group C" },
];

const RECEIVED_BY_OPTIONS = [
  "Usman Umer",
  "Amir Sohail",
  "Amir Umer",
  "Babar Umer",
  "Shafiq Siddiq",
];

const ENTRY_FEE_TOTAL = 5000;

export default function TeamEditModal({ team, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: "",
    section: "unassigned",
    status: "pending",
    whatsapp: "",
    entryFeePaid: "0",
    entryFeeReceivedBy: "",
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (team) {
      setForm({
        name: team.name || "",
        section: team.section || "unassigned",
        status: team.status || "pending",
        whatsapp: team.captain?.whatsapp || team.captain?.phone || "",
        entryFeePaid: String(team.entryFeePaid ?? 0),
        entryFeeReceivedBy: team.entryFeeReceivedBy || "",
      });
      setProfilePicture(null);
      setPreviewUrl("");
      setError("");
    }
  }, [team]);

  useEffect(() => {
    if (!profilePicture) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(profilePicture);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [profilePicture]);

  if (!team) return null;

  function handleWhatsappChange(e) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
    setForm({ ...form, whatsapp: digits });
  }

  function handlePaidChange(e) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
    setForm({ ...form, entryFeePaid: digits });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.whatsapp || form.whatsapp.length !== 11 || !form.whatsapp.startsWith("03")) {
      setError("Enter a valid 11-digit WhatsApp number (e.g. 03001234567)");
      return;
    }

    const paid = Number(form.entryFeePaid || 0);
    if (Number.isNaN(paid) || paid < 0) {
      setError("Paid amount must be 0 or greater");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("section", form.section);
      formData.append("status", form.status);
      formData.append("whatsapp", form.whatsapp);
      formData.append("entryFeePaid", String(paid));
      formData.append("entryFeeReceivedBy", form.entryFeeReceivedBy);

      if (profilePicture) {
        const compressed = await compressImage(profilePicture);
        formData.append("profilePicture", compressed);
      }

      const res = await fetch(`/api/admin/teams/${team._id}`, {
        method: "PATCH",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update team");
      onSaved(data.team);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const displayPhoto =
    previewUrl || team.captain?.profilePictureUrl || "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-xl font-bold">Edit Team</h2>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>

        {team.captain && (
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
            <label className="group relative cursor-pointer shrink-0">
              {displayPhoto ? (
                previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={team.captain.name}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                ) : (
                  <Image
                    src={team.captain.profilePictureUrl}
                    alt={team.captain.name}
                    width={44}
                    height={44}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                )
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-200 text-xs dark:bg-zinc-700">
                  N/A
                </div>
              )}
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 opacity-0 transition group-hover:opacity-100">
                <Camera className="h-4 w-4 text-white" />
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
              />
            </label>
            <div className="min-w-0">
              <p className="font-medium">{team.captain.name}</p>
              <p className="text-xs text-zinc-500">
                {profilePicture
                  ? "New photo selected — save to update"
                  : "Click photo to change · Captain"}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Team Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">WhatsApp Number</label>
            <input
              required
              type="tel"
              inputMode="numeric"
              maxLength={11}
              placeholder="03001234567"
              value={form.whatsapp}
              onChange={handleWhatsappChange}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
            />
            <p className="mt-1 text-xs text-zinc-500">11 digits, starting with 03</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Paid Amount (PKR)</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={form.entryFeePaid}
              onChange={handlePaidChange}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Full entry fee: Rs. {ENTRY_FEE_TOTAL.toLocaleString()} · Remaining: Rs.{" "}
              {Math.max(0, ENTRY_FEE_TOTAL - Number(form.entryFeePaid || 0)).toLocaleString()}
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Received By</label>
            <select
              value={form.entryFeeReceivedBy}
              onChange={(e) => setForm({ ...form, entryFeeReceivedBy: e.target.value })}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
            >
              <option value="">Select who received payment</option>
              {RECEIVED_BY_OPTIONS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
              {form.entryFeeReceivedBy &&
                !RECEIVED_BY_OPTIONS.includes(form.entryFeeReceivedBy) && (
                  <option value={form.entryFeeReceivedBy}>
                    {form.entryFeeReceivedBy}
                  </option>
                )}
            </select>
            <p className="mt-1 text-xs text-zinc-500">
              Jis ne payment wasool ki uska naam select karein
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Group</label>
            <select
              value={form.section}
              onChange={(e) => setForm({ ...form, section: e.target.value })}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
            >
              {SECTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {form.status === "active" && !team.entryFeeImageUrl && (
              <p className="mt-1 text-xs text-amber-600">Entry fee receipt must be uploaded before setting active.</p>
            )}
            {form.status === "active" && team.entryFeeImageUrl && !team.entryFeeVerified && (
              <p className="mt-1 text-xs text-amber-600">Entry fee must be verified by admin before setting active.</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-emerald-600 px-6 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-300 px-6 py-2 dark:border-zinc-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
