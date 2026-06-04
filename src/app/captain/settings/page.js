"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CaptainProfileForm from "@/components/CaptainProfileForm";
import TeamProfileForm from "@/components/TeamProfileForm";

export default function CaptainSettingsPage() {
  const router = useRouter();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingCaptain, setSavingCaptain] = useState(false);
  const [savingTeam, setSavingTeam] = useState(false);

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
      formData.append("email", data.email);
      formData.append("whatsapp", data.whatsapp);
      if (data.profilePicture) formData.append("profilePicture", data.profilePicture);
      if (data.cnicImage) formData.append("cnicImage", data.cnicImage);

      const res = await fetch("/api/captain/profile", { method: "PATCH", body: formData });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to update profile");

      setTeam((prev) => ({ ...prev, captain: { ...prev.captain, ...result.captain } }));
      alert("Profile updated successfully");
    } catch (err) {
      alert(err.message);
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
      alert("Team updated successfully");
    } catch (err) {
      alert(err.message);
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
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Settings</h1>
      <p className="mb-8 text-zinc-500">Manage your captain profile and team details.</p>

      <div className="space-y-8">
        <CaptainProfileForm
          captain={team?.captain}
          onSubmit={handleEditCaptain}
          loading={savingCaptain}
        />
        <TeamProfileForm
          team={team}
          onSubmit={handleEditTeam}
          loading={savingTeam}
        />
      </div>
    </div>
  );
}
