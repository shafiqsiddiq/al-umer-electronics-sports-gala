"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCnic, validateCnic } from "@/lib/cnic";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    captainName: "",
    fatherName: "",
    cnic: "",
    email: "",
    whatsapp: "",
    password: "",
    confirmPassword: "",
    teamName: "",
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [cnicImage, setCnicImage] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleCnicChange(e) {
    setForm({ ...form, cnic: formatCnic(e.target.value) });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!validateCnic(form.cnic)) {
      setError("CNIC must be in format 35201-8511102-5");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!profilePicture) {
      setError("Profile picture is required");
      return;
    }

    if (!cnicImage) {
      setError("CNIC upload is required");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("captainName", form.captainName);
      formData.append("fatherName", form.fatherName);
      formData.append("cnic", form.cnic);
      formData.append("email", form.email);
      formData.append("whatsapp", form.whatsapp);
      formData.append("password", form.password);
      formData.append("teamName", form.teamName);
      formData.append("profilePicture", profilePicture);
      formData.append("cnicImage", cnicImage);

      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      router.push("/captain/dashboard");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">Register Team</h1>
      <p className="mb-8 text-zinc-500">
        Create your captain account (counts as 1 main player). After login, add 6 more main + 2 reserved.
      </p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Captain Name</label>
            <input
              required
              value={form.captainName}
              onChange={(e) => setForm({ ...form, captainName: e.target.value })}
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
        <div>
          <label className="mb-1 block text-sm font-medium">WhatsApp Number</label>
          <input
            required
            type="tel"
            placeholder="03XX-XXXXXXX"
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Team Name</label>
          <input
            required
            value={form.teamName}
            onChange={(e) => setForm({ ...form, teamName: e.target.value })}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Profile Picture</label>
            <input
              required
              type="file"
              accept="image/*"
              onChange={(e) => setProfilePicture(e.target.files[0])}
              className="w-full text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">CNIC Upload</label>
            <input
              required
              type="file"
              accept="image/*"
              onChange={(e) => setCnicImage(e.target.files[0])}
              className="w-full text-sm"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input
            required
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Confirm Password</label>
          <input
            required
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "Creating Account..." : "Register & Create Captain"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-zinc-500">
        Already registered?{" "}
        <Link href="/captain/login" className="text-emerald-600 hover:underline">
          Captain Login
        </Link>
      </p>
    </div>
  );
}
