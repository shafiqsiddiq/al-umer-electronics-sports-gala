"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Settings } from "lucide-react";

const links = [
  { href: "/captain/dashboard", label: "My Team", icon: Users },
  { href: "/captain/settings", label: "Settings", icon: Settings },
];

export default function CaptainSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="p-4 md:block hidden">
        <h2 className="text-lg font-bold text-emerald-600">Captain Panel</h2>
      </div>
      <nav className="flex flex-row md:flex-col gap-1 md:space-y-1 px-4 py-2.5 md:px-2 md:py-0 overflow-x-auto scrollbar-none pb-3 md:pb-4">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 md:gap-3 shrink-0 rounded-lg px-3 py-2 text-xs md:text-sm font-medium transition ${
              pathname === href
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            <Icon size={16} className="md:w-[18px] md:h-[18px]" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
