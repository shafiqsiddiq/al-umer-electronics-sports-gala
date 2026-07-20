"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * When a captain/admin is logged in and browser Back lands on public home or login,
 * send them back into their panel instead of the storefront.
 */
export default function AuthRedirect() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function redirectIfNeeded() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (cancelled || !data.user) return;

        if (data.user.role === "captain") {
          if (pathname === "/" || pathname === "/captain/login") {
            router.replace("/captain/dashboard");
          }
          return;
        }

        if (data.user.role === "admin") {
          if (pathname === "/" || pathname === "/captain/login") {
            router.replace("/admin");
          }
        }
      } catch {
        // ignore
      }
    }

    redirectIfNeeded();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return null;
}
