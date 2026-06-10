"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, Trophy } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import CaptainNavMenu from "./CaptainNavMenu";
import AdminNavMenu from "./AdminNavMenu";

const links = [
  { href: "/", label: "Home" },
  { href: "/tournament", label: "Cricket Tournament" },
  { href: "/fixtures", label: "Fixtures" },
  { href: "/live-scores", label: "Live Scores" },
  { href: "/brackets/sections", label: "Sections" },
  { href: "/brackets/loser-bracket", label: "Second Chance" },
  { href: "/brackets/final-eight", label: "Final 8" },
  { href: "/stats", label: "Stats" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    function loadUser() {
      fetch("/api/auth/me")
        .then((res) => res.json())
        .then((data) => setUser(data.user))
        .catch(() => setUser(null))
        .finally(() => setAuthChecked(true));
    }
    loadUser();

    window.addEventListener("profile-update", loadUser);
    window.addEventListener("admin-auth-change", loadUser);

    return () => {
      window.removeEventListener("profile-update", loadUser);
      window.removeEventListener("admin-auth-change", loadUser);
    };
  }, [pathname]);

  const isAdmin = user?.role === "admin";
  const isCaptain = user?.role === "captain";
  const isAuthPage = pathname === "/register" || pathname === "/captain/login";
  const showProtectedNav = (isCaptain || isAdmin) && !isAuthPage;

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link
          href={isAdmin ? "/admin" : showProtectedNav ? "/captain/dashboard" : "/"}
          className="flex items-center gap-2 font-bold text-emerald-600"
        >
          <Trophy size={22} />
          <span>
            {isAdmin ? "Admin Panel" : showProtectedNav && user.teamName ? user.teamName : "Cricket Cup"}
          </span>
        </Link>

        {!showProtectedNav && (
          <nav className="hidden items-center gap-1 lg:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  pathname === link.href
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {!showProtectedNav && <div className="flex-1" />}

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {authChecked && showProtectedNav ? (
            isAdmin ? (
              <AdminNavMenu />
            ) : (
              <CaptainNavMenu user={user} />
            )
          ) : authChecked ? (
            <>
              <a
                href="http://localhost:3333"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:inline-block"
              >
                CMS
              </a>
              <Link
                href="/admin"
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:inline-block"
              >
                Admin
              </Link>
              <Link
                href="/captain/login"
                className="hidden rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 sm:inline-block"
              >
                Captain Login
              </Link>
              <Link
                href="/register"
                className="hidden rounded-lg border border-emerald-600 px-3 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 sm:inline-block"
              >
                Register
              </Link>
            </>
          ) : null}

          {!showProtectedNav && (
            <button
              className="rounded-lg p-2 lg:hidden"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          )}
        </div>
      </div>

      {open && !showProtectedNav && (
        <nav className="border-t border-zinc-200 px-4 py-3 lg:hidden dark:border-zinc-800">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  pathname === link.href
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "text-zinc-600 dark:text-zinc-300"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <>
              <a
                href="http://localhost:3333"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300"
              >
                CMS
              </a>
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300"
              >
                Admin
              </Link>
              <Link
                href="/captain/login"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400"
              >
                Captain Login
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400"
              >
                Register Team
              </Link>
            </>
          </div>
        </nav>
      )}
    </header>
  );
}
