"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { compressImage } from "@/lib/compress-image";
import {
  User,
  Phone,
  Users,
  Shield,
  Image as ImageIcon,
  CreditCard,
  UploadCloud,
  Eye,
  EyeOff,
} from "lucide-react";

export default function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    captainName: "",
    whatsapp: "",
    password: "",
    teamName: "",
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [entryFeeImage, setEntryFeeImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(field, value) {
    setForm({ ...form, [field]: value });
    if (errors[field]) setErrors({ ...errors, [field]: "" });
  }

  function handleWhatsappChange(e) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
    handleChange("whatsapp", digits);
  }

  const validateForm = () => {
    const newErrors = {};

    if (!form.captainName || form.captainName.length < 3) {
      newErrors.captainName = "Captain Name must be at least 3 characters";
    }
    if (!form.whatsapp || form.whatsapp.length !== 11 || !form.whatsapp.startsWith("03")) {
      newErrors.whatsapp = "Enter valid 11-digit WhatsApp (e.g. 03001234567)";
    }
    if (!form.teamName || form.teamName.length < 3) {
      newErrors.teamName = "Team Name must be at least 3 characters";
    }
    if (!profilePicture) {
      newErrors.profilePicture = "Profile picture is required";
    } else if (profilePicture.size > 5 * 1024 * 1024) {
      newErrors.profilePicture = "Image size must be less than 5MB";
    }
    if (entryFeeImage && entryFeeImage.size > 5 * 1024 * 1024) {
      newErrors.entryFeeImage = "Image size must be less than 5MB";
    }
    if (!form.password || form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError("");

    if (!validateForm()) return;

    setLoading(true);
    setLoadingStep("Compressing images...");
    try {
      const [profileOut, entryOut] = await Promise.all([
        compressImage(profilePicture),
        entryFeeImage ? compressImage(entryFeeImage) : Promise.resolve(null),
      ]);

      const formData = new FormData();
      formData.append("captainName", form.captainName);
      formData.append("whatsapp", form.whatsapp);
      formData.append("password", form.password);
      formData.append("teamName", form.teamName);
      formData.append("profilePicture", profileOut);
      if (entryOut) formData.append("entryFeeImage", entryOut);

      setLoadingStep("Creating your team...");
      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      router.replace("/captain/dashboard");
      router.refresh();
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  }

  const inputClass =
    "w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 pl-11 text-sm transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-900/50 dark:focus:border-emerald-500 dark:focus:bg-zinc-900 outline-none";
  const errorInputClass = "border-red-500 focus:border-red-500 focus:ring-red-500/10";
  const labelClass = "mb-1.5 block text-sm font-semibold text-zinc-700 dark:text-zinc-300";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-200/70 bg-white p-5 shadow-xl shadow-emerald-500/10 dark:border-emerald-900/40 dark:bg-zinc-950 sm:p-8">
      <div className="mb-6 text-center sm:mb-8">
        <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
          Register Your Team
        </h1>
        <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Create your captain account and team for Al-Umer Electronics Sports Gala
          Season 3.
        </p>
      </div>

      {apiError && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-400">
          <Shield className="h-5 w-5 flex-shrink-0" />
          <p>{apiError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-white">
            <User className="h-5 w-5 text-emerald-500" />
            Captain Details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Captain Name *</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                <input
                  value={form.captainName}
                  onChange={(e) => handleChange("captainName", e.target.value)}
                  className={`${inputClass} ${errors.captainName ? errorInputClass : ""}`}
                  placeholder="Enter your name"
                />
              </div>
              {errors.captainName && (
                <p className="mt-1 text-xs text-red-500">{errors.captainName}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Phone Number *</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="03001234567"
                  maxLength={11}
                  value={form.whatsapp}
                  onChange={handleWhatsappChange}
                  className={`${inputClass} ${errors.whatsapp ? errorInputClass : ""}`}
                />
              </div>
              {errors.whatsapp && (
                <p className="mt-1 text-xs text-red-500">{errors.whatsapp}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Team Name *</label>
              <div className="relative">
                <Users className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                <input
                  value={form.teamName}
                  onChange={(e) => handleChange("teamName", e.target.value)}
                  className={`${inputClass} ${errors.teamName ? errorInputClass : ""}`}
                  placeholder="Enter your team name"
                />
              </div>
              {errors.teamName && (
                <p className="mt-1 text-xs text-red-500">{errors.teamName}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Profile Picture *</label>
              <label
                className={`flex h-28 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-zinc-50 transition-all hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 ${
                  errors.profilePicture
                    ? "border-red-400"
                    : "border-zinc-300 dark:border-zinc-700"
                }`}
              >
                <ImageIcon
                  className={`mb-1.5 h-7 w-7 ${
                    errors.profilePicture ? "text-red-400" : "text-zinc-400"
                  }`}
                />
                <p
                  className={`text-sm ${
                    errors.profilePicture
                      ? "text-red-500"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  <span className="font-semibold">Click to upload</span>
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    setProfilePicture(e.target.files[0]);
                    if (errors.profilePicture)
                      setErrors({ ...errors, profilePicture: "" });
                  }}
                  className="hidden"
                />
              </label>
              {errors.profilePicture && (
                <p className="mt-1 text-center text-xs text-red-500">
                  {errors.profilePicture}
                </p>
              )}
              {profilePicture && !errors.profilePicture && (
                <div className="mt-2 flex justify-center">
                  <img
                    src={URL.createObjectURL(profilePicture)}
                    alt="Profile Preview"
                    className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-lg dark:border-zinc-800"
                  />
                </div>
              )}
            </div>
            <div className="sm:col-span-2 sm:max-w-md">
              <label className={labelClass}>Password *</label>
              <div className="relative">
                <Shield className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className={`${inputClass} pr-11 ${errors.password ? errorInputClass : ""}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password}</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-white">
            <CreditCard className="h-5 w-5 text-indigo-500" />
            Tournament Entry Fee
          </h2>
          <div className="mb-3 rounded-lg border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-900/20">
            <p className="mb-2 text-sm text-indigo-800 dark:text-indigo-300">
              Please submit your entry fee to the following account. You can upload a
              screenshot below or share the receipt on WhatsApp.
            </p>
            <ul className="space-y-1 text-sm font-medium text-indigo-900 dark:text-indigo-200">
              <li>
                Bank: <strong>Jazz Cash / Easy Paisa</strong>
              </li>
              <li>
                Account Title: <strong>Muhammad Shafiq</strong>
              </li>
              <li>
                Account Number: <strong>03047058705</strong>
              </li>
              <li>
                Amount: <strong>Rs. 5,000/-</strong>
              </li>
              <li>
                Share receipt on WhatsApp:{" "}
                <a
                  href="https://wa.me/923044897377"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold underline decoration-indigo-400 underline-offset-2 hover:text-indigo-700 dark:hover:text-indigo-100"
                >
                  03044897377
                </a>
              </li>
            </ul>
          </div>

          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Entry Fee Receipt{" "}
            <span className="font-normal text-zinc-400">(optional)</span>
          </label>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 p-4 hover:border-indigo-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-indigo-500 dark:hover:bg-zinc-800">
            <UploadCloud className="h-5 w-5 text-zinc-400" />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {entryFeeImage ? entryFeeImage.name : "Upload Payment Screenshot"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                setEntryFeeImage(e.target.files[0]);
                if (errors.entryFeeImage) setErrors({ ...errors, entryFeeImage: "" });
              }}
            />
          </label>
          {errors.entryFeeImage && (
            <p className="mt-1 text-xs text-red-500">{errors.entryFeeImage}</p>
          )}
        </div>

        <div className="pt-1">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 py-3.5 font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-700 hover:shadow-emerald-500/40 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {loading ? loadingStep || "Creating Account..." : "Register & Create Captain"}
          </button>
        </div>

        <p className="pb-1 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Already registered?{" "}
          <Link
            href="/captain/login"
            className="font-semibold text-emerald-600 hover:text-emerald-500 hover:underline"
          >
            Captain Login
          </Link>
        </p>
      </form>
    </div>
  );
}
