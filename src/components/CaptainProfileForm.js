"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { UploadCloud } from "lucide-react";

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/15 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:bg-zinc-900";

export default function CaptainProfileForm({
  captain,
  onSubmit,
  onCancel,
  loading = false,
  embedded = false,
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    whatsapp: "",
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePreview, setProfilePreview] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (captain) {
      setForm({
        name: captain.name || "",
        email: captain.email || "",
        whatsapp: captain.whatsapp || captain.phone || "",
      });
      setProfilePicture(null);
      setError("");
    }
  }, [captain]);

  useEffect(() => {
    if (!profilePicture) {
      setProfilePreview("");
      return;
    }
    const url = URL.createObjectURL(profilePicture);
    setProfilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [profilePicture]);

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!form.whatsapp || form.whatsapp.length !== 11 || !form.whatsapp.startsWith("03")) {
      setError("Enter a valid 11-digit phone number (e.g. 03001234567)");
      return;
    }

    onSubmit({
      ...form,
      profilePicture: profilePicture || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!embedded && (
        <h3 className="text-lg font-semibold">Edit Captain Profile</h3>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <label className="group relative cursor-pointer shrink-0">
          {profilePreview ? (
            <img
              src={profilePreview}
              alt="New profile preview"
              className="h-14 w-14 rounded-xl object-cover ring-2 ring-emerald-500"
            />
          ) : captain?.profilePictureUrl ? (
            <Image
              src={captain.profilePictureUrl}
              alt={captain.name}
              width={56}
              height={56}
              className="h-14 w-14 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100 text-lg font-black text-emerald-700">
              {(form.name || "?").charAt(0).toUpperCase()}
            </div>
          )}
          <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/45 opacity-0 transition group-hover:opacity-100">
            <UploadCloud className="h-5 w-5 text-white" />
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
          />
        </label>
        <div>
          <p className="text-sm font-bold text-zinc-900 dark:text-white">
            {form.name || "Captain"}
          </p>
          <p className="text-xs text-zinc-500">
            {profilePicture
              ? "New photo selected — save to update"
              : "Click photo to change"}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            Full Name *
          </label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            Phone Number *
          </label>
          <input
            required
            type="tel"
            inputMode="numeric"
            value={form.whatsapp}
            onChange={(e) =>
              setForm({
                ...form,
                whatsapp: e.target.value.replace(/\D/g, "").slice(0, 11),
              })
            }
            placeholder="03001234567"
            maxLength={11}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={inputClass}
            placeholder="optional"
          />
        </div>
      </div>

      <label className="flex cursor-pointer flex-col gap-1.5 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 px-3 py-3 text-xs dark:border-zinc-700 dark:bg-zinc-900/50">
        <span className="inline-flex items-center gap-1.5 font-semibold text-zinc-600 dark:text-zinc-300">
          <UploadCloud size={14} />
          New Profile Picture
        </span>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setProfilePicture(e.target.files[0] || null)}
          className="text-[11px] file:mr-2 file:rounded-md file:border-0 file:bg-emerald-50 file:px-2 file:py-1 file:text-[11px] file:font-semibold file:text-emerald-700"
        />
      </label>

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2 text-sm font-bold text-white shadow-sm disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Profile"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-zinc-200 px-5 py-2 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
