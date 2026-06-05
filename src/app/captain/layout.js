"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import CaptainSidebar from "@/components/CaptainSidebar";

async function checkCaptainAuth() {
  const res = await fetch("/api/auth/me");
  const data = await res.json();
  return data.user?.role === "captain";
}

export default function CaptainLayout({ children }) {
  const pathname = usePathname();
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

  // If we are checking auth, render a loading state
  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  // If not authenticated as captain (like on the /captain/login page), render children directly
  if (!isCaptain) {
    return (
      <div className="flex min-h-[calc(100vh-120px)]">
        <div className="flex flex-1 items-start justify-center p-4 sm:p-6">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-120px)]">
      <CaptainSidebar />
      <div className="flex-1 p-4 md:p-6 overflow-x-hidden">{children}</div>
    </div>
  );
}
