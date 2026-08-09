"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import CricketLoader from "@/components/CricketLoader";
import { useToast } from "@/context/ToastContext";
import {
  Shield,
  Lock,
  Loader2,
  Sparkles,
  Eye,
  EyeOff,
  Trophy,
  LayoutDashboard,
  ClipboardList,
  Users,
} from "lucide-react";

async function checkAdminAuth() {
  const res = await fetch("/api/auth/me");
  const data = await res.json();
  return data.user?.role === "admin";
}

function AdminLoginForm({ onSuccess }) {
  const { toast } = useToast();
  const [username] = useState("Admin");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, role: "admin" }),
      });
      if (!res.ok) throw new Error("Invalid password");
      window.dispatchEvent(new Event("admin-auth-change"));
      toast("Logged in successfully as Admin.", "success");
      onSuccess?.();
    } catch (err) {
      setError(err.message);
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-8rem)] w-full overflow-hidden">
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
              Control Room
            </div>
            <h1 className="text-3xl font-black tracking-tight xl:text-4xl">
              Admin Panel
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-emerald-50/90">
              Manage teams, fixtures, scores, and the full Sports Gala Season 3
              tournament from one place.
            </p>
          </div>

          <div className="relative mt-10 space-y-3">
            {[
              { icon: Users, text: "Approve & manage teams" },
              { icon: ClipboardList, text: "Update live match scores" },
              { icon: LayoutDashboard, text: "Generate brackets & Final 8" },
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

        {/* Form */}
        <div className="flex h-full min-h-0">
          <div className="relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-emerald-200/80 bg-white/95 p-6 shadow-xl shadow-emerald-500/10 backdrop-blur sm:p-8 dark:border-emerald-900/50 dark:bg-zinc-950/95">
            <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-400/15 blur-3xl" />

            <div className="relative mb-6 text-center lg:text-left">
              <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 lg:mx-0">
                <Shield size={22} />
              </span>
              <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
                Admin Access
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Sports Gala Season 3
              </p>
            </div>

            {error && (
              <div className="relative mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="relative mt-auto flex flex-1 flex-col justify-end space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-500">
                  Username
                </label>
                <div className="relative">
                  <Users
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    type="text"
                    value={username}
                    readOnly
                    tabIndex={-1}
                    className="w-full cursor-default rounded-xl border border-zinc-200 bg-zinc-100 py-3 pl-10 pr-3 text-sm font-semibold text-zinc-700 outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-500">
                  Admin Password
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                    Signing in…
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Go to Dashboard
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [authState, setAuthState] = useState("loading"); // loading | admin | guest

  function refreshAuth() {
    return checkAdminAuth().then((authed) => {
      setAuthState(authed ? "admin" : "guest");
    });
  }

  useEffect(() => {
    let active = true;
    checkAdminAuth().then((authed) => {
      if (active) setAuthState(authed ? "admin" : "guest");
    });
    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    function onAuthChange() {
      refreshAuth();
    }
    window.addEventListener("admin-auth-change", onAuthChange);
    return () => window.removeEventListener("admin-auth-change", onAuthChange);
  }, []);

  if (authState === "loading") {
    return <CricketLoader fullscreen label="Loading admin…" />;
  }

  if (authState === "guest") {
    return <AdminLoginForm onSuccess={() => setAuthState("admin")} />;
  }

  return (
    <div className="flex min-h-[calc(100vh-120px)] flex-col md:flex-row">
      <AdminSidebar />
      <div className="flex-1 overflow-x-hidden bg-gradient-to-b from-emerald-50/40 via-transparent to-teal-50/20 p-4 md:p-6 dark:from-emerald-950/20 dark:to-transparent">
        {children}
      </div>
    </div>
  );
}
