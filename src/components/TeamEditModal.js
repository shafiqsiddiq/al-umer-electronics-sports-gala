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

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 dark:border-zinc-600 dark:bg-zinc-800";

export default function TeamEditModal({ team, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: "",
    villageOrCity: "",
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
        villageOrCity: team.captain?.villageOrCity || "",
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

    if (!form.name.trim()) {
      setError("Team name is required");
      return;
    }

    if (!form.villageOrCity.trim() || form.villageOrCity.trim().length < 2) {
      setError("Village / City name is required");
      return;
    }

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
      formData.append("name", form.name.trim());
      formData.append("villageOrCity", form.villageOrCity.trim());
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

  const displayPhoto = previewUrl || team.captain?.profilePictureUrl || "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Edit Team</h2>
            <p className="text-xs text-zinc-500">Update team, captain location & fee details</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {team.captain && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
              <label className="group relative shrink-0 cursor-pointer">
                {displayPhoto ? (
                  previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={team.captain.name}
                      className="h-12 w-12 rounded-full object-cover ring-2 ring-white dark:ring-zinc-700"
                    />
                  ) : (
                    <Image
                      src={team.captain.profilePictureUrl}
                      alt={team.captain.name}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full object-cover ring-2 ring-white dark:ring-zinc-700"
                    />
                  )
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200 text-xs dark:bg-zinc-700">
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
                <p className="truncate font-semibold text-zinc-900 dark:text-white">
                  {team.captain.name}
                </p>
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

          <form id="team-edit-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Team Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Village / City</label>
                <input
                  required
                  value={form.villageOrCity}
                  onChange={(e) => setForm({ ...form, villageOrCity: e.target.value })}
                  placeholder="e.g., Lahore"
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">WhatsApp Number</label>
                <input
                  required
                  type="tel"
                  inputMode="numeric"
                  maxLength={11}
                  placeholder="03001234567"
                  value={form.whatsapp}
                  onChange={handleWhatsappChange}
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-zinc-500">11 digits, starting with 03</p>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-zinc-400">
                Entry Fee
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Paid Amount (PKR)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={form.entryFeePaid}
                    onChange={handlePaidChange}
                    className={inputClass}
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    Full: Rs. {ENTRY_FEE_TOTAL.toLocaleString()} · Due: Rs.{" "}
                    {Math.max(
                      0,
                      ENTRY_FEE_TOTAL - Number(form.entryFeePaid || 0)
                    ).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Received By</label>
                  <select
                    value={form.entryFeeReceivedBy}
                    onChange={(e) =>
                      setForm({ ...form, entryFeeReceivedBy: e.target.value })
                    }
                    className={inputClass}
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
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Group</label>
                <select
                  value={form.section}
                  onChange={(e) => setForm({ ...form, section: e.target.value })}
                  className={inputClass}
                >
                  {SECTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className={inputClass}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {form.status === "active" && !team.entryFeeImageUrl && (
                  <p className="mt-1 text-xs text-amber-600">
                    Entry fee receipt must be uploaded before setting active.
                  </p>
                )}
                {form.status === "active" &&
                  team.entryFeeImageUrl &&
                  !team.entryFeeVerified && (
                    <p className="mt-1 text-xs text-amber-600">
                      Entry fee must be verified by admin before setting active.
                    </p>
                  )}
              </div>
            </div>
          </form>
        </div>

        <div className="flex gap-3 border-t border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <button
            type="submit"
            form="team-edit-form"
            disabled={loading}
            className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-300 px-6 py-2.5 text-sm font-medium dark:border-zinc-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
