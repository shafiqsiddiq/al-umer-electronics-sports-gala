"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";

async function checkAdminAuth() {
  const res = await fetch("/api/auth/me");
  const data = await res.json();
  return data.user?.role === "admin";
}

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    checkAdminAuth().then((authed) => {
      if (active) setIsAdmin(authed);
    });
    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    function refreshAuth() {
      checkAdminAuth().then(setIsAdmin);
    }
    window.addEventListener("admin-auth-change", refreshAuth);
    return () => window.removeEventListener("admin-auth-change", refreshAuth);
  }, []);

  if (!isAdmin) {
    return (
      <div className="flex min-h-[calc(100vh-120px)]">
        <div className="flex flex-1 items-start justify-center p-6">{children}</div>
      </div>
    );
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
