"use client";

import { useEffect, useState } from "react";
import { formatCnic, validateCnic } from "@/lib/cnic";
import {
  ADDITIONAL_MAIN_PLAYERS,
  MAIN_PLAYERS,
  RESERVED_PLAYERS,
} from "@/lib/tournament-logic";
import { User, CreditCard, Shield, MapPin, Image as ImageIcon } from "lucide-react";

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

  async function handleSubmit(e) {
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

    try {
      await onSubmit({
        ...player,
        profilePicture: profilePicture || undefined,
        cnicImage: cnicImage || undefined,
      });

      if (!isEdit) {
        setPlayer({ ...emptyPlayer });
        setProfilePicture(null);
        setCnicImage(null);
      }
    } catch (err) {
      // The parent will handle the toast, we just prevent reset
    }
  }

  const inputClass = "w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 pl-11 text-sm transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-900/50 dark:focus:border-emerald-500 dark:focus:bg-zinc-900 outline-none";
  const selectClass = "w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 pl-11 text-sm transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-900/50 dark:focus:border-emerald-500 dark:focus:bg-zinc-900 outline-none appearance-none";
  const textareaClass = "w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 pl-11 text-sm transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-900/50 dark:focus:border-emerald-500 dark:focus:bg-zinc-900 outline-none";
  const labelClass = "mb-1.5 block text-sm font-semibold text-zinc-700 dark:text-zinc-300";

  return (
    <form onSubmit={handleSubmit} className={embedded ? "space-y-6" : "space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 shadow-sm"}>
      {!embedded && <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">{isEdit ? "Edit Player Details" : "Add New Player"}</h3>}
      
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-400">
          <Shield className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Player Name *</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
            <input
              required
              value={player.name}
              onChange={(e) => setPlayer({ ...player, name: e.target.value })}
              className={inputClass}
              placeholder="Enter player's name"
            />
          </div>
        </div>
        
        <div>
          <label className={labelClass}>Father Name *</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
            <input
              required
              value={player.fatherName}
              onChange={(e) => setPlayer({ ...player, fatherName: e.target.value })}
              className={inputClass}
              placeholder="Enter father's name"
            />
          </div>
        </div>
        
        <div>
          <label className={labelClass}>CNIC *</label>
          <div className="relative">
            <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
            <input
              required
              value={player.cnic}
              onChange={handleCnicChange}
              placeholder="35201-8511102-5"
              maxLength={15}
              className={`${inputClass} font-mono`}
            />
          </div>
        </div>
        
        <div>
          <label className={labelClass}>Role *</label>
          <div className="relative">
            <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 z-10" />
            <select
              value={player.role}
              onChange={(e) => setPlayer({ ...player, role: e.target.value })}
              className={selectClass}
            >
              <option value="main">
                Main Player ({mainCount + 1}/{MAIN_PLAYERS} incl. captain)
              </option>
              <option value="reserved">Reserved ({reservedCount}/{RESERVED_PLAYERS})</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className={labelClass}>Address *</label>
        <div className="relative">
          <MapPin className="absolute left-3.5 top-4 h-5 w-5 text-zinc-400" />
          <textarea
            required
            rows={2}
            value={player.address}
            onChange={(e) => setPlayer({ ...player, address: e.target.value })}
            className={textareaClass}
            placeholder="Enter player's address"
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 mt-2">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>
            Profile Picture {isEdit ? <span className="text-zinc-400 font-normal text-xs ml-1">(Optional)</span> : "*"}
          </label>
          <div className="relative flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all border-zinc-300 dark:border-zinc-700">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <ImageIcon className="w-8 h-8 mb-2 text-zinc-400" />
                <p className="text-sm text-zinc-500 dark:text-zinc-400"><span className="font-semibold">Click to upload</span></p>
              </div>
              <input
                required={!isEdit}
                type="file"
                accept="image/*"
                onChange={(e) => setProfilePicture(e.target.files[0])}
                className="hidden"
              />
            </label>
          </div>
          {profilePicture && (
            <div className="flex justify-center mt-2">
              <img
                src={URL.createObjectURL(profilePicture)}
                alt="Profile Preview"
                className="h-24 w-24 object-cover rounded-full border-4 border-white shadow-lg dark:border-zinc-800"
              />
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-2">
          <label className={labelClass}>
            CNIC Upload {isEdit ? <span className="text-zinc-400 font-normal text-xs ml-1">(Optional)</span> : "*"}
          </label>
          <div className="relative flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all border-zinc-300 dark:border-zinc-700">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <CreditCard className="w-8 h-8 mb-2 text-zinc-400" />
                <p className="text-sm text-zinc-500 dark:text-zinc-400"><span className="font-semibold">Click to upload</span></p>
              </div>
              <input
                required={!isEdit}
                type="file"
                accept="image/*"
                onChange={(e) => setCnicImage(e.target.files[0])}
                className="hidden"
              />
            </label>
          </div>
          {cnicImage && (
            <div className="flex justify-center mt-2">
              <img
                src={URL.createObjectURL(cnicImage)}
                alt="CNIC Preview"
                className="h-24 w-40 object-cover rounded-lg border-4 border-white shadow-lg dark:border-zinc-800"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-emerald-600 px-8 py-3 font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-700 hover:shadow-emerald-500/40 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
        >
          {loading ? (isEdit ? "Saving..." : "Adding...") : isEdit ? "Save Changes" : "Add Player"}
        </button>
        {isEdit && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border-2 border-zinc-200 px-8 py-3 font-bold text-zinc-700 transition-all hover:bg-zinc-50 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 active:scale-[0.98]"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
