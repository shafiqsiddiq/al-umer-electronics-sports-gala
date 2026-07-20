"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Settings, Trophy } from "lucide-react";

const links = [
  { href: "/captain/dashboard", label: "My Team", icon: Users },
  { href: "/captain/settings", label: "Settings", icon: Settings },
];

export default function CaptainSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 border-b border-zinc-200 bg-gradient-to-b from-emerald-50/80 via-white to-white md:w-64 md:border-b-0 md:border-r dark:border-zinc-800 dark:from-emerald-950/30 dark:via-zinc-950 dark:to-zinc-950">
      <div className="hidden items-center gap-3 p-5 md:flex">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30">
          <Trophy size={18} />
        </span>
        <div>
          <p className="text-sm font-black tracking-tight text-zinc-900 dark:text-white">
            Captain
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Team Panel
          </p>
        </div>
      </div>
      <nav className="flex flex-row gap-1 overflow-x-auto px-3 py-2.5 scrollbar-none md:flex-col md:space-y-1 md:px-3 md:pb-5 md:pt-0">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition md:gap-3 md:text-sm ${
                active
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25"
                  : "text-zinc-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-zinc-300 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
