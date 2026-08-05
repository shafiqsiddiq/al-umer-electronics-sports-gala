"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import { compressImage } from "@/lib/compress-image";
import { VILLAGES } from "@/lib/villages";

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
  { value: "knockout", label: "Knockout" },
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

const emptyForm = {
  name: "",
  sponsorName: "",
  village: "",
  captainName: "",
  section: "unassigned",
  status: "pending",
  whatsapp: "",
  password: "",
  entryFeePaid: "0",
  entryFeeReceivedBy: "",
};

export default function TeamEditModal({ team, mode = "edit", onClose, onSaved }) {
  const isCreate = mode === "create" || !team;
  const [form, setForm] = useState(emptyForm);
  const [profilePicture, setProfilePicture] = useState(null);
  const [entryFeeImage, setEntryFeeImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isCreate) {
      setForm(emptyForm);
      setProfilePicture(null);
      setEntryFeeImage(null);
      setPreviewUrl("");
      setError("");
      return;
    }

    setForm({
      name: team.name || "",
      sponsorName: team.sponsorName || "",
      village: team.village || "",
      captainName: team.captain?.name || "",
      section: team.section || "unassigned",
      status: team.status || "pending",
      whatsapp: team.captain?.whatsapp || team.captain?.phone || "",
      password: "",
      entryFeePaid: String(team.entryFeePaid ?? 0),
      entryFeeReceivedBy: team.entryFeeReceivedBy || "",
    });
    setProfilePicture(null);
    setEntryFeeImage(null);
    setPreviewUrl("");
    setError("");
  }, [team, isCreate]);

  useEffect(() => {
    if (!profilePicture) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(profilePicture);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [profilePicture]);

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
    if (!form.captainName.trim()) {
      setError("Captain name is required");
      return;
    }
    if (!form.whatsapp || form.whatsapp.length !== 11 || !form.whatsapp.startsWith("03")) {
      setError("Enter a valid 11-digit WhatsApp number (e.g. 03001234567)");
      return;
    }

    if (isCreate && (!form.password || form.password.length < 6)) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (!isCreate && form.password && form.password.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    if (isCreate && !profilePicture) {
      setError("Captain profile picture is required");
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

      if (isCreate) {
        formData.append("teamName", form.name.trim());
        formData.append("sponsorName", form.sponsorName.trim());
        formData.append("village", form.village.trim());
        formData.append("captainName", form.captainName.trim());
        formData.append("whatsapp", form.whatsapp);
        formData.append("password", form.password);
        formData.append("section", form.section);
        formData.append("status", form.status);
        formData.append("entryFeePaid", String(paid));
        formData.append("entryFeeReceivedBy", form.entryFeeReceivedBy);

        const compressedProfile = await compressImage(profilePicture);
        formData.append("profilePicture", compressedProfile);
        if (entryFeeImage) {
          const compressedFee = await compressImage(entryFeeImage);
          formData.append("entryFeeImage", compressedFee);
        }

        const res = await fetch("/api/admin/teams", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to register team");
        onSaved?.(data.team);
        onClose();
      } else {
        formData.append("name", form.name.trim());
        formData.append("sponsorName", form.sponsorName.trim());
        formData.append("village", form.village.trim());
        formData.append("captainName", form.captainName.trim());
        formData.append("section", form.section);
        formData.append("status", form.status);
        formData.append("whatsapp", form.whatsapp);
        formData.append("entryFeePaid", String(paid));
        formData.append("entryFeeReceivedBy", form.entryFeeReceivedBy);
        if (form.password) formData.append("newPassword", form.password);

        if (profilePicture) {
          const compressed = await compressImage(profilePicture);
          formData.append("profilePicture", compressed);
        }
        if (entryFeeImage) {
          const compressedFee = await compressImage(entryFeeImage);
          formData.append("entryFeeImage", compressedFee);
        }

        const res = await fetch(`/api/admin/teams/${team._id}`, {
          method: "PATCH",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update team");
        onSaved?.(data.team);
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const displayPhoto =
    previewUrl || (!isCreate ? team?.captain?.profilePictureUrl : "") || "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              {isCreate ? "Register New Team" : "Edit Team"}
            </h2>
            <p className="text-xs text-zinc-500">
              {isCreate
                ? "Create team and captain from admin panel"
                : "Update team & captain details"}
            </p>
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
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
            <label className="group relative shrink-0 cursor-pointer">
              {displayPhoto ? (
                previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Captain"
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-white dark:ring-zinc-700"
                  />
                ) : (
                  <Image
                    src={displayPhoto}
                    alt="Captain"
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-white dark:ring-zinc-700"
                  />
                )
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-semibold text-zinc-500 dark:bg-zinc-700">
                  Photo
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
              <p className="font-semibold text-zinc-900 dark:text-white">
                Captain Photo {isCreate ? "(required)" : ""}
              </p>
              <p className="text-xs text-zinc-500">
                {profilePicture
                  ? "New photo selected — save to apply"
                  : "Click photo to upload"}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}

          <form id="team-edit-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-zinc-400">
                Team
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium">Team Name</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium">
                    Team Sponsor{" "}
                    <span className="font-normal text-zinc-400">(optional)</span>
                  </label>
                  <input
                    value={form.sponsorName}
                    onChange={(e) =>
                      setForm({ ...form, sponsorName: e.target.value })
                    }
                    className={inputClass}
                    placeholder="Sponsor name (if any)"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium">Village</label>
                  <select
                    value={form.village}
                    onChange={(e) =>
                      setForm({ ...form, village: e.target.value })
                    }
                    className={inputClass}
                  >
                    <option value="">Select village</option>
                    {VILLAGES.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                    {form.village && !VILLAGES.includes(form.village) && (
                      <option value={form.village}>{form.village}</option>
                    )}
                  </select>
                </div>
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
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-zinc-400">
                Captain
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Captain Name</label>
                  <input
                    required
                    value={form.captainName}
                    onChange={(e) =>
                      setForm({ ...form, captainName: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">WhatsApp</label>
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
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium">
                    {isCreate ? "Login Password" : "New Password (optional)"}
                  </label>
                  <input
                    type="text"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    className={inputClass}
                    placeholder={
                      isCreate ? "Min 6 characters" : "Leave blank to keep current"
                    }
                    required={isCreate}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-zinc-400">
                Entry Fee
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Paid Amount (PKR)
                  </label>
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
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium">
                    Entry Fee Receipt {isCreate ? "(optional)" : "(optional replace)"}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEntryFeeImage(e.target.files?.[0] || null)}
                    className={inputClass}
                  />
                  {!isCreate && team?.entryFeeImageUrl && !entryFeeImage && (
                    <p className="mt-1 text-xs text-emerald-600">
                      Current receipt on file
                    </p>
                  )}
                </div>
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
            {loading
              ? isCreate
                ? "Registering..."
                : "Saving..."
              : isCreate
                ? "Register Team"
                : "Save Changes"}
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
