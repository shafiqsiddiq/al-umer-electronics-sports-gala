"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Hide public footer while admin/captain is logged in,
 * or while browsing /admin or /captain routes.
 */
export default function HideWhenLoggedIn({ children }) {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);

  const isAppArea =
    pathname?.startsWith("/admin") || pathname?.startsWith("/captain");

  useEffect(() => {
    let active = true;

    function load() {
      fetch("/api/auth/me")
        .then((r) => r.json())
        .then((data) => {
          if (active) setLoggedIn(Boolean(data?.user));
        })
        .catch(() => {
          if (active) setLoggedIn(false);
        });
    }

    load();
    window.addEventListener("admin-auth-change", load);
    return () => {
      active = false;
      window.removeEventListener("admin-auth-change", load);
    };
  }, []);

  if (isAppArea || loggedIn) return null;
  return children;
}
