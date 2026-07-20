"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Phone,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Trophy,
  Shield,
  Users,
} from "lucide-react";

export default function CaptainLoginPage() {
  const router = useRouter();
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.role === "captain") {
          router.replace("/captain/dashboard");
        }
      })
      .catch(() => {});
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp, password, role: "captain" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.replace("/captain/dashboard");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-8rem)] overflow-hidden">
      {/* Atmosphere */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950/40 dark:via-zinc-950 dark:to-teal-950/30" />
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-teal-400/15 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgb(16 185 129 / 0.25) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative mx-auto grid max-w-5xl items-stretch gap-6 px-4 py-8 sm:py-12 lg:grid-cols-2 lg:gap-10 lg:py-14">
        {/* Brand panel */}
        <div className="relative hidden h-full overflow-hidden rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 p-8 text-white shadow-xl shadow-emerald-600/20 lg:flex lg:flex-col lg:justify-between dark:border-emerald-800">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-16 left-8 h-48 w-48 rounded-full bg-amber-300/15 blur-2xl" />

          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur">
              <Trophy size={13} className="text-amber-200" />
              Season 3
            </div>
            <h1 className="text-3xl font-black tracking-tight xl:text-4xl">
              Captain Team Panel
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-emerald-50/90">
              Sign in to manage your squad, track fixtures, and stay ready for
              Al-Umer Electronics Sports Gala.
            </p>
          </div>

          <div className="relative mt-10 space-y-3">
            {[
              { icon: Shield, text: "Secure captain access" },
              { icon: Users, text: "Team profile & entry fee" },
              { icon: Trophy, text: "Live tournament updates" },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                  <Icon size={16} />
                </span>
                <span className="text-sm font-semibold">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form panel */}
        <div className="flex h-full min-h-0">
          <div className="relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-emerald-200/80 bg-white/95 p-6 shadow-xl shadow-emerald-500/10 backdrop-blur sm:p-8 dark:border-emerald-900/50 dark:bg-zinc-950/95">
            <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-400/15 blur-3xl" />

            <div className="relative mb-6 text-center lg:text-left">
              <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 lg:mx-0">
                <Shield size={22} />
              </span>
              <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
                Captain Login
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Enter your WhatsApp number and password
              </p>
            </div>

            {error && (
              <div className="relative mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="relative mt-auto flex flex-1 flex-col justify-end space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-500">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    required
                    type="tel"
                    inputMode="numeric"
                    value={whatsapp}
                    onChange={(e) =>
                      setWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 11))
                    }
                    placeholder="03001234567"
                    maxLength={11}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-3 font-mono text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:bg-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-500">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-11 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:bg-zinc-900"
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
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-teal-500 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Logging in…
                  </>
                ) : (
                  "Login to Dashboard"
                )}
              </button>
            </form>

            <p className="relative mt-5 text-center text-sm text-zinc-500">
              No account?{" "}
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("open-register"))}
                className="font-bold text-emerald-600 hover:underline dark:text-emerald-400"
              >
                Register Team
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
