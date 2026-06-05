"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { formatCnic, validateCnic } from "@/lib/cnic";

export default function CaptainProfileForm({ captain, onSubmit, onCancel, loading = false, embedded = false }) {
  const [form, setForm] = useState({ name: "", fatherName: "", cnic: "", email: "", whatsapp: "" });
  const [profilePicture, setProfilePicture] = useState(null);
  const [cnicImage, setCnicImage] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (captain) {
      setForm({
        name: captain.name || "",
        fatherName: captain.fatherName || "",
        cnic: captain.cnic || "",
        email: captain.email || "",
        whatsapp: captain.whatsapp || captain.phone || "",
      });
      setProfilePicture(null);
      setCnicImage(null);
      setError("");
    }
  }, [captain]);

  function handleCnicChange(e) {
    setForm({ ...form, cnic: formatCnic(e.target.value) });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!validateCnic(form.cnic)) {
      setError("CNIC must be in format 35201-8511102-5");
      return;
    }

    onSubmit({
      ...form,
      profilePicture: profilePicture || undefined,
      cnicImage: cnicImage || undefined,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={embedded ? "space-y-4" : "space-y-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900"}
    >
      {!embedded && <h3 className="text-lg font-semibold">Edit Captain Profile</h3>}

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {profilePicture ? (
        <div className="flex items-center gap-3">
          <img
            src={URL.createObjectURL(profilePicture)}
            alt="New profile preview"
            className="h-14 w-14 rounded-full object-cover ring-4 ring-emerald-500"
          />
          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 animate-pulse">New profile picture selected (preview)</span>
        </div>
      ) : captain?.profilePictureUrl ? (
        <div className="flex items-center gap-3">
          <Image
            src={captain.profilePictureUrl}
            alt={captain.name}
            width={56}
            height={56}
            className="h-14 w-14 rounded-full object-cover"
          />
          <span className="text-sm text-zinc-500">Current profile photo</span>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Full Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Father Name</label>
          <input
            required
            value={form.fatherName}
            onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">CNIC (35201-8511102-5)</label>
          <input
            required
            value={form.cnic}
            onChange={handleCnicChange}
            placeholder="35201-8511102-5"
            maxLength={15}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono dark:border-zinc-600 dark:bg-zinc-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">WhatsApp Number</label>
          <input
            required
            type="tel"
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">New Profile Picture (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setProfilePicture(e.target.files[0] || null)}
            className="w-full text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">New CNIC Upload (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCnicImage(e.target.files[0] || null)}
            className="w-full text-sm"
          />
          {cnicImage && (
            <div className="mt-2 flex items-center gap-2">
              <img
                src={URL.createObjectURL(cnicImage)}
                alt="New CNIC preview"
                className="h-12 w-20 rounded border border-emerald-500 object-cover shadow-sm"
              />
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 animate-pulse">New CNIC selected</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-6 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Profile"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-zinc-300 px-6 py-2 dark:border-zinc-600"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
