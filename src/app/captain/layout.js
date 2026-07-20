"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import CaptainSidebar from "@/components/CaptainSidebar";

async function checkCaptainAuth() {
  const res = await fetch("/api/auth/me");
  const data = await res.json();
  return data.user?.role === "captain";
}

export default function CaptainLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCaptain, setIsCaptain] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    checkCaptainAuth().then((authed) => {
      if (active) {
        setIsCaptain(authed);
        setChecking(false);
      }
    });
    return () => {
      active = false;
    };
  }, [pathname]);

  // Block browser Back from leaving the captain panel to public pages
  useEffect(() => {
    if (!isCaptain || pathname === "/captain/login") return;

    const onPopState = () => {
      requestAnimationFrame(() => {
        const path = window.location.pathname;
        if (!path.startsWith("/captain") || path === "/captain/login") {
          router.replace("/captain/dashboard");
        }
      });
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [isCaptain, pathname, router]);

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (!isCaptain) {
    return (
      <div className="flex min-h-[calc(100vh-120px)]">
        <div className="flex flex-1 items-start justify-center p-4 sm:p-6">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-120px)] flex-col md:flex-row">
      <CaptainSidebar />
      <div className="flex-1 overflow-x-hidden bg-gradient-to-b from-emerald-50/40 via-transparent to-teal-50/20 p-2 sm:p-3 md:p-4 dark:from-emerald-950/20 dark:to-transparent">
        {children}
      </div>
    </div>
  );
}
