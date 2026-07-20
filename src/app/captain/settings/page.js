"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CaptainProfileForm from "@/components/CaptainProfileForm";
import TeamProfileForm from "@/components/TeamProfileForm";
import { useToast } from "@/context/ToastContext";
import { Settings, User, Users } from "lucide-react";

export default function CaptainSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingCaptain, setSavingCaptain] = useState(false);
  const [savingTeam, setSavingTeam] = useState(false);
  const [tab, setTab] = useState("profile");

  useEffect(() => {
    fetchTeam();
  }, []);

  async function fetchTeam() {
    try {
      const res = await fetch("/api/teams/me");
      if (res.status === 401) {
        router.push("/captain/login");
        return;
      }
      const data = await res.json();
      setTeam(data.team);
    } catch {
      router.push("/captain/login");
    } finally {
      setLoading(false);
    }
  }

  async function handleEditCaptain(data) {
    setSavingCaptain(true);
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("fatherName", data.fatherName);
      formData.append("cnic", data.cnic);
      formData.append("email", data.email || "");
      formData.append("whatsapp", data.whatsapp);
      if (data.profilePicture) formData.append("profilePicture", data.profilePicture);
      if (data.cnicImage) formData.append("cnicImage", data.cnicImage);

      const res = await fetch("/api/captain/profile", {
        method: "PATCH",
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to update profile");

      setTeam((prev) => ({
        ...prev,
        captain: { ...prev.captain, ...result.captain },
      }));
      toast("Profile updated successfully", "success");
      window.dispatchEvent(new Event("profile-update"));
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSavingCaptain(false);
    }
  }

  async function handleEditTeam(data) {
    setSavingTeam(true);
    try {
      const res = await fetch("/api/teams/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to update team");

      setTeam(result.team);
      toast("Team updated successfully", "success");
      window.dispatchEvent(new Event("profile-update"));
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSavingTeam(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative w-full space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-emerald-200/70 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 px-4 py-3 text-white shadow-md dark:border-emerald-800">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
            <Settings size={18} />
          </span>
          <div>
            <h1 className="text-xl font-black tracking-tight">Settings</h1>
            <p className="text-xs text-emerald-50/90">
              Update captain profile and team details
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: "profile", label: "Captain Profile", icon: User },
          { id: "team", label: "Team Details", icon: Users },
        ].map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
                active
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25"
                  : "border border-zinc-200 bg-white text-zinc-600 hover:border-emerald-300 hover:text-emerald-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        {tab === "profile" ? (
          <div className="p-4 sm:p-5">
            <CaptainProfileForm
              captain={team?.captain}
              onSubmit={handleEditCaptain}
              loading={savingCaptain}
              embedded
            />
          </div>
        ) : (
          <div className="p-4 sm:p-5">
            <TeamProfileForm
              team={team}
              onSubmit={handleEditTeam}
              loading={savingTeam}
              embedded
            />
          </div>
        )}
      </div>
    </div>
  );
}
