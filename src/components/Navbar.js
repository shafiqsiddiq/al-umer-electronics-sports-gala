"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import CaptainNavMenu from "./CaptainNavMenu";
import AdminNavMenu from "./AdminNavMenu";

const links = [
  { href: "/", label: "Home" },
  { href: "/tournament", label: "Cricket Tournament" },
  { href: "/fixtures", label: "Fixtures" },
  { href: "/live-scores", label: "Live Scores" },
  { href: "/brackets/sections", label: "Groups" },
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
  const isCaptainArea = pathname.startsWith("/captain") && pathname !== "/captain/login";
  const isAdminArea = pathname.startsWith("/admin");
  const showProtectedNav = (isCaptain || isAdmin) && !isAuthPage;

  const isAdminSelected = isAdminArea;
  const isCaptainLoginSelected = pathname === "/captain/login";
  const isRegisterSelected = pathname === "/register";

  // Never send logged-in captains/admins (or captain/admin panel routes) to the public storefront home
  const logoHref = isAdmin || isAdminArea
    ? "/admin"
    : isCaptain || isCaptainArea
      ? "/captain/dashboard"
      : "/";

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="flex w-full items-center justify-between px-4 md:px-8 py-3">
        {/* Left Side: Logo */}
        <div className="flex flex-1 items-center justify-start">
          <Link
            href={logoHref}
            className="flex items-center gap-2.5 font-bold text-emerald-600"
          >
            <div className="relative h-9 w-9 rounded-lg bg-white dark:bg-zinc-900 p-1 border border-zinc-200 dark:border-zinc-800 shadow-sm flex-shrink-0">
              <Image
                src="/al_umer_electronics_logo.png"
                alt="Al-Umer Electronics Logo"
                fill
                className="object-contain p-0.5 rounded"
              />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-extrabold leading-tight tracking-wide text-zinc-900 dark:text-white">
                AL Umer Electronics
              </span>
              <span className="truncate text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                Sports Gala Season 3
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Public Links */}
        {!showProtectedNav && (
          <nav className="hidden items-center justify-center gap-1 lg:flex">
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

        {/* Right Side: Auth / Admin Actions */}
        <div className="flex flex-1 items-center justify-end gap-2">
          {authChecked && showProtectedNav ? (
            isAdmin ? (
              <AdminNavMenu />
            ) : (
              <CaptainNavMenu user={user} />
            )
          ) : authChecked ? (
            <>
              <Link
                href="/admin"
                className={`hidden rounded-lg px-3 py-2 text-sm font-medium transition sm:inline-block ${
                  isAdminSelected
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/25"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                Admin
              </Link>
              <Link
                href="/captain/login"
                className={`hidden rounded-lg px-3 py-2 text-sm font-medium transition sm:inline-block ${
                  isCaptainLoginSelected
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/25"
                    : "border border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                }`}
              >
                Captain Login
              </Link>
              <Link
                href="/register"
                className={`hidden rounded-lg px-3 py-2 text-sm font-medium transition sm:inline-block ${
                  isRegisterSelected
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/25"
                    : "border border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                }`}
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
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  isAdminSelected
                    ? "bg-emerald-600 text-white"
                    : "text-zinc-600 dark:text-zinc-300"
                }`}
              >
                Admin
              </Link>
              <Link
                href="/captain/login"
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  isCaptainLoginSelected
                    ? "bg-emerald-600 text-white"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                Captain Login
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2 text-left text-sm font-medium ${
                  isRegisterSelected
                    ? "bg-emerald-600 text-white"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
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
