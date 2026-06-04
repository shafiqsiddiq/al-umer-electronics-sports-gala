"use client";

import { useState } from "react";
import Image from "next/image";

export default function EntryFeeUpload({ entryFeeImageUrl, onUploaded, loading, setLoading }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(!entryFeeImageUrl);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("Please select entry fee receipt image");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("entryFeeImage", file);

      const res = await fetch("/api/teams/entry-fee", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setFile(null);
      setExpanded(false);
      onUploaded(data.entryFeeImageUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-lg shadow-zinc-300/30 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-zinc-950/40">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div>
          <h3 className="font-semibold">Entry Fee</h3>
          <p className="text-sm text-zinc-500">
            {entryFeeImageUrl ? "Receipt uploaded" : "Upload payment proof"}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${
          entryFeeImageUrl
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
            : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
        }`}>
          {entryFeeImageUrl ? "Done" : "Pending"}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-zinc-200 px-5 pb-5 pt-4 dark:border-zinc-800">
          {entryFeeImageUrl && (
            <div className="mb-4">
              <Image
                src={entryFeeImageUrl}
                alt="Entry fee receipt"
                width={320}
                height={200}
                className="max-h-40 rounded-lg border border-zinc-200 object-contain dark:border-zinc-700"
              />
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium">
                {entryFeeImageUrl ? "Replace receipt" : "Receipt image"}
              </label>
              <input
                required={!entryFeeImageUrl}
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "Uploading..." : entryFeeImageUrl ? "Update" : "Upload"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
