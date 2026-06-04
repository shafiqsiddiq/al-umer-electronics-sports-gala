"use client";

import { useEffect, useState } from "react";
import { formatCnic, validateCnic } from "@/lib/cnic";
import {
  ADDITIONAL_MAIN_PLAYERS,
  MAIN_PLAYERS,
  RESERVED_PLAYERS,
} from "@/lib/tournament-logic";

const emptyPlayer = {
  name: "",
  fatherName: "",
  cnic: "",
  address: "",
  role: "main",
};

export default function PlayerForm({
  onSubmit,
  existingPlayers = [],
  loading = false,
  mode = "add",
  initialPlayer = null,
  onCancel,
  embedded = false,
}) {
  const isEdit = mode === "edit";
  const [player, setPlayer] = useState({ ...emptyPlayer });
  const [profilePicture, setProfilePicture] = useState(null);
  const [cnicImage, setCnicImage] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEdit && initialPlayer) {
      setPlayer({
        name: initialPlayer.name || "",
        fatherName: initialPlayer.fatherName || "",
        cnic: initialPlayer.cnic || "",
        address: initialPlayer.address || "",
        role: initialPlayer.role || "main",
      });
      setProfilePicture(null);
      setCnicImage(null);
      setError("");
    }
  }, [isEdit, initialPlayer]);

  const others = isEdit
    ? existingPlayers.filter((p) => p._id !== initialPlayer?._id)
    : existingPlayers;
  const mainCount = others.filter((p) => p.role === "main").length;
  const reservedCount = others.filter((p) => p.role === "reserved").length;

  function handleCnicChange(e) {
    setPlayer({ ...player, cnic: formatCnic(e.target.value) });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!validateCnic(player.cnic)) {
      setError("CNIC must be in format 35201-8511102-5");
      return;
    }

    if (player.role === "main" && mainCount >= ADDITIONAL_MAIN_PLAYERS) {
      setError(`Maximum ${ADDITIONAL_MAIN_PLAYERS} additional main players allowed (captain counts as 1 of ${MAIN_PLAYERS} main)`);
      return;
    }

    if (player.role === "reserved" && reservedCount >= RESERVED_PLAYERS) {
      setError(`Maximum ${RESERVED_PLAYERS} reserved players allowed`);
      return;
    }

    if (!isEdit && (!profilePicture || !cnicImage)) {
      setError("Profile picture and CNIC upload are required");
      return;
    }

    onSubmit({
      ...player,
      profilePicture: profilePicture || undefined,
      cnicImage: cnicImage || undefined,
    });

    if (!isEdit) {
      setPlayer({ ...emptyPlayer });
      setProfilePicture(null);
      setCnicImage(null);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={embedded ? "space-y-4" : "space-y-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900"}>
      {!embedded && <h3 className="text-lg font-semibold">{isEdit ? "Edit Player" : "Add Player"}</h3>}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Player Name</label>
          <input
            required
            value={player.name}
            onChange={(e) => setPlayer({ ...player, name: e.target.value })}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Father Name</label>
          <input
            required
            value={player.fatherName}
            onChange={(e) => setPlayer({ ...player, fatherName: e.target.value })}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">CNIC (35201-8511102-5)</label>
          <input
            required
            value={player.cnic}
            onChange={handleCnicChange}
            placeholder="35201-8511102-5"
            maxLength={15}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono dark:border-zinc-600 dark:bg-zinc-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Role</label>
          <select
            value={player.role}
            onChange={(e) => setPlayer({ ...player, role: e.target.value })}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
          >
            <option value="main">
              Main Player ({mainCount + 1}/{MAIN_PLAYERS} incl. captain)
            </option>
            <option value="reserved">Reserved ({reservedCount}/{RESERVED_PLAYERS})</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Address</label>
        <textarea
          required
          rows={2}
          value={player.address}
          onChange={(e) => setPlayer({ ...player, address: e.target.value })}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Profile Picture{isEdit ? " (optional — leave empty to keep current)" : ""}
          </label>
          <input
            required={!isEdit}
            type="file"
            accept="image/*"
            onChange={(e) => setProfilePicture(e.target.files[0])}
            className="w-full text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            CNIC Upload{isEdit ? " (optional — leave empty to keep current)" : ""}
          </label>
          <input
            required={!isEdit}
            type="file"
            accept="image/*"
            onChange={(e) => setCnicImage(e.target.files[0])}
            className="w-full text-sm"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-6 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? (isEdit ? "Saving..." : "Adding...") : isEdit ? "Save Changes" : "Add Player"}
        </button>
        {isEdit && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-zinc-300 px-6 py-2 dark:border-zinc-600"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
