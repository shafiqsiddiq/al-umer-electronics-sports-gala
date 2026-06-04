"use client";

import Image from "next/image";

export default function PlayerViewModal({ player, onClose }) {
  if (!player) return null;

  const isCaptain = player.isCaptain;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-xl font-bold">{isCaptain ? "Captain Profile" : "Player Profile"}</h2>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>

        <div className="mb-6 flex justify-center">
          {player.profilePictureUrl ? (
            <Image
              src={player.profilePictureUrl}
              alt={player.name}
              width={120}
              height={120}
              className="h-28 w-28 rounded-full object-cover ring-4 ring-emerald-100 dark:ring-emerald-900"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-zinc-200 text-zinc-500 dark:bg-zinc-700">
              No Photo
            </div>
          )}
        </div>

        <dl className="space-y-3 text-sm">
          <div className="grid grid-cols-3 gap-2">
            <dt className="font-medium text-zinc-500">Name</dt>
            <dd className="col-span-2">{player.name}</dd>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <dt className="font-medium text-zinc-500">Father Name</dt>
            <dd className="col-span-2">{player.fatherName || "—"}</dd>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <dt className="font-medium text-zinc-500">CNIC</dt>
            <dd className="col-span-2 font-mono">{player.cnic || "—"}</dd>
          </div>
          {isCaptain && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <dt className="font-medium text-zinc-500">Email</dt>
                <dd className="col-span-2">{player.email || "—"}</dd>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <dt className="font-medium text-zinc-500">WhatsApp</dt>
                <dd className="col-span-2">{player.whatsapp || player.phone || "—"}</dd>
              </div>
            </>
          )}
          {!isCaptain && player.address && (
            <div className="grid grid-cols-3 gap-2">
              <dt className="font-medium text-zinc-500">Address</dt>
              <dd className="col-span-2">{player.address}</dd>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <dt className="font-medium text-zinc-500">Role</dt>
            <dd className="col-span-2 capitalize">
              {isCaptain ? "Captain · Main Player" : player.role === "main" ? "Main Player" : "Reserved"}
            </dd>
          </div>
        </dl>

        {player.cnicImageUrl && (
          <div className="mt-6">
            <p className="mb-2 text-sm font-medium text-zinc-500">CNIC Document</p>
            <div className="mx-auto w-full max-w-[200px] overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
              <Image
                src={player.cnicImageUrl}
                alt="CNIC"
                width={200}
                height={125}
                className="aspect-[1.6/1] h-auto max-h-[125px] w-full object-cover object-center"
              />
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-zinc-100 py-2 text-sm font-medium dark:bg-zinc-800"
        >
          Close
        </button>
      </div>
    </div>
  );
}
