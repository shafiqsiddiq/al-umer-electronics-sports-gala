"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings, ChevronDown, LayoutDashboard, Users, Calendar, GitBranch, ClipboardList } from "lucide-react";

export default function AdminNavMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    window.dispatchEvent(new Event("admin-auth-change"));
    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative flex items-center gap-2" ref={menuRef}>
      <Link
        href="/admin"
        className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-150 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:flex"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white shadow-md">
          A
        </span>
        <span>Admin Panel</span>
      </Link>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-750 dark:text-zinc-200 dark:hover:bg-zinc-800 transition"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Settings size={16} />
        <span className="hidden sm:inline">Settings</span>
        <ChevronDown size={14} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
          <div className="border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-850">
            <p className="truncate text-xs font-bold text-zinc-900 dark:text-white">Admin Account</p>
            <p className="truncate text-[10px] text-zinc-500">Super Administrator</p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 font-semibold transition"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
