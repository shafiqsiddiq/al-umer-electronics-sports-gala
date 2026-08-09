"use client";

/**
 * Cricket-themed loader — bat + ball with spinning ring.
 */
export default function CricketLoader({
  label = "Loading…",
  fullscreen = false,
  className = "",
}) {
  const content = (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="relative flex h-28 w-28 items-center justify-center sm:h-32 sm:w-32">
        {/* Outer soft glow */}
        <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-xl" />

        {/* Spinning ring */}
        <div
          className="absolute inset-0 animate-spin rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0%, #10b981 35%, #14b8a6 55%, #d4af37 70%, transparent 85%)",
            WebkitMask:
              "radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px))",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px))",
            animationDuration: "0.9s",
          }}
        />

        {/* Dashed orbit */}
        <div
          className="absolute inset-2 animate-spin rounded-full border border-dashed border-emerald-300/70"
          style={{ animationDuration: "2.4s", animationDirection: "reverse" }}
        />

        {/* Center plate */}
        <div className="relative z-10 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-gradient-to-br from-white to-emerald-50 shadow-lg ring-1 ring-emerald-100 sm:h-20 sm:w-20 dark:from-zinc-900 dark:to-emerald-950 dark:ring-emerald-900">
          {/* Bat */}
          <svg
            viewBox="0 0 64 64"
            className="absolute h-12 w-12 -rotate-[28deg] text-amber-800 sm:h-14 sm:w-14"
            aria-hidden
          >
            <rect x="28" y="6" width="7" height="22" rx="2" fill="#8B5A2B" />
            <rect x="29.5" y="4" width="4" height="6" rx="1" fill="#C4A484" />
            <path
              d="M22 28c0-2 3-4 10-4s10 2 10 4v22c0 4-4 8-10 8s-10-4-10-8V28z"
              fill="#A16207"
            />
            <path
              d="M26 30c1-1 4-2 6-2s5 1 6 2v4c-1-1-3-2-6-2s-5 1-6 2v-4z"
              fill="#FDE68A"
              opacity="0.55"
            />
          </svg>

          {/* Ball orbiting slightly */}
          <div
            className="absolute inset-0 animate-spin"
            style={{ animationDuration: "1.6s" }}
          >
            <span className="absolute left-1/2 top-1 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-red-500 shadow-md ring-1 ring-red-700/40 sm:h-4 sm:w-4">
              <span className="absolute left-1/2 top-0.5 h-2.5 w-px -translate-x-1/2 rotate-12 bg-white/90" />
              <span className="absolute left-1/2 top-0.5 h-2.5 w-px -translate-x-1/2 -rotate-12 bg-white/90" />
            </span>
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm font-black tracking-wide text-emerald-800 dark:text-emerald-200">
          {label}
        </p>
        <p className="mt-0.5 text-[11px] font-medium text-zinc-500">
          Please wait…
        </p>
      </div>
    </div>
  );

  if (!fullscreen) return content;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white px-4 dark:bg-zinc-950">
      <div className="rounded-3xl border border-emerald-200/80 bg-white px-8 py-8 shadow-2xl shadow-emerald-500/10 dark:border-emerald-900/50 dark:bg-zinc-950">
        {content}
      </div>
    </div>
  );
}
