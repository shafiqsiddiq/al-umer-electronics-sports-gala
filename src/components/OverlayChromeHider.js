"use client";

import { usePathname } from "next/navigation";

/** Hide chrome on OBS overlay routes */
export default function OverlayChromeHider({ children }) {
  const pathname = usePathname();
  const isOverlay = pathname?.startsWith("/overlay");
  if (isOverlay) return null;
  return children;
}
