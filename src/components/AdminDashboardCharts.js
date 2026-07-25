"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { BarChart3, PieChart, Target } from "lucide-react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

function Panel({ title, icon: Icon, children }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white/90 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="flex items-center gap-2 border-b border-zinc-100 bg-gradient-to-r from-emerald-50/80 to-transparent px-3.5 py-2.5 dark:border-zinc-800 dark:from-emerald-950/30">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
          <Icon size={13} />
        </span>
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{title}</h3>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex min-h-[140px] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50/60 dark:border-zinc-700 dark:bg-zinc-900/40">
      <p className="max-w-xs px-3 text-center text-xs text-zinc-500 dark:text-zinc-400">
        {message}
      </p>
    </div>
  );
}

const baseChart = {
  chart: {
    fontFamily: "inherit",
    toolbar: { show: false },
    animations: {
      enabled: true,
      speed: 700,
      animateGradually: { enabled: true, delay: 80 },
    },
  },
  dataLabels: { enabled: false },
  legend: {
    fontSize: "13px",
    fontWeight: 600,
    labels: { colors: "#71717a" },
    markers: { size: 6, offsetX: -3 },
    itemMargin: { horizontal: 8, vertical: 4 },
  },
  tooltip: {
    theme: "light",
    style: { fontSize: "13px" },
  },
};

const TRACK_LIGHT = {
  "#10b981": "#bbf7d0",
  "#0284c7": "#bae6fd",
  "#0d9488": "#99f6e4",
  "#f59e0b": "#fde68a",
  "#d97706": "#fde68a",
  "#ef4444": "#fecaca",
  "#ca8a04": "#fef08a",
  "#059669": "#a7f3d0",
  "#71717a": "#e4e4e7",
};

function lightTrackColor(hex) {
  const key = String(hex || "").toLowerCase();
  return TRACK_LIGHT[key] || TRACK_LIGHT[hex] || "#e4e4e7";
}

function StatusRadialChart({ data, targetTeams = 48 }) {
  const registered = data.reduce((a, b) => a + (b.value || 0), 0);
  const target = targetTeams || 48;
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const stroke = 12;
  const gap = 6;
  const startAngle = -135;
  const sweep = 270; // degrees of the gauge arc

  const rings = data.map((d, i) => {
    const pct = Math.min(((d.value || 0) / target) * 100, 100);
    const radius = 68 - i * (stroke + gap);
    const color = d.color || "#10b981";
    return {
      label: d.label,
      value: d.value || 0,
      pct: Math.round(pct),
      color,
      track: lightTrackColor(color),
      radius,
    };
  });

  function polar(r, deg) {
    const rad = ((deg - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  }

  function arcPath(r, fromDeg, toDeg) {
    const start = polar(r, fromDeg);
    const end = polar(r, toDeg);
    const large = toDeg - fromDeg > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
  }

  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {rings.map((ring) => {
            const filledTo = startAngle + (sweep * ring.pct) / 100;
            return (
              <g key={ring.label}>
                {/* Remaining track — light color */}
                <path
                  d={arcPath(ring.radius, startAngle, startAngle + sweep)}
                  fill="none"
                  stroke={ring.track}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                />
                {/* Filled progress */}
                {ring.pct > 0 && (
                  <path
                    d={arcPath(
                      ring.radius,
                      startAngle,
                      Math.max(startAngle + 0.5, filledTo)
                    )}
                    fill="none"
                    stroke={ring.color}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                  />
                )}
              </g>
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-2">
          <p className="text-[11px] font-semibold text-zinc-500">Registered</p>
          <p className="text-xl font-black tabular-nums text-zinc-900 dark:text-white">
            {registered}/{target}
          </p>
        </div>
      </div>

      <div className="mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        {rings.map((ring) => (
          <p
            key={ring.label}
            className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300"
          >
            <span
              className="mr-1.5 inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: ring.color }}
            />
            {ring.label}: {ring.value} ({ring.pct}%)
          </p>
        ))}
      </div>
    </div>
  );
}

function ProgressBarChart({ stats }) {
  const items = [
    {
      label: "Registration",
      pct: stats.targetTeams
        ? Math.min(Math.round((stats.totalTeams / stats.targetTeams) * 100), 100)
        : 0,
      count: `${stats.totalTeams}/${stats.targetTeams}`,
      unit: "Teams",
      bar: "bg-emerald-500",
      track: "bg-emerald-100 dark:bg-emerald-950/50",
      text: "text-emerald-700 dark:text-emerald-300",
    },
    {
      label: "Entry Fees",
      pct: stats.totalTeams
        ? Math.min(
            Math.round((stats.entryFeeUploaded / stats.totalTeams) * 100),
            100
          )
        : 0,
      count: `${stats.entryFeeUploaded}/${stats.totalTeams || 0}`,
      unit: "Fees",
      bar: "bg-amber-500",
      track: "bg-amber-100 dark:bg-amber-950/50",
      text: "text-amber-700 dark:text-amber-300",
    },
    {
      label: "Matches",
      pct: stats.totalMatches
        ? Math.min(
            Math.round((stats.completedMatches / stats.totalMatches) * 100),
            100
          )
        : 0,
      count: `${stats.completedMatches || 0}/${stats.totalMatches || 0}`,
      unit: "Done",
      bar: "bg-teal-600",
      track: "bg-teal-100 dark:bg-teal-950/50",
      text: "text-teal-700 dark:text-teal-300",
    },
  ];

  return (
    <div className="grid min-h-[200px] grid-cols-3 gap-2 pt-1">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col items-center">
          <p className={`mb-1.5 text-sm font-black tabular-nums ${item.text}`}>
            {item.pct}%
          </p>

          <div className="flex h-[140px] w-5 items-end sm:w-6">
            <div
              className={`relative flex h-full w-full items-end overflow-hidden rounded-full ${item.track}`}
            >
              <div
                className={`w-full rounded-full transition-all duration-700 ease-out ${item.bar}`}
                style={{
                  height: `${item.pct > 0 ? Math.max(item.pct, 4) : 0}%`,
                }}
              />
            </div>
          </div>

          <p className="mt-2 text-center text-[10px] font-bold leading-tight text-zinc-800 dark:text-zinc-100">
            {item.label}
          </p>
          <p className="mt-0.5 text-center text-[11px] font-black tabular-nums text-zinc-700 dark:text-zinc-200">
            {item.count}
          </p>
          <p className="text-[9px] font-medium uppercase tracking-wide text-zinc-400">
            {item.unit}
          </p>
        </div>
      ))}
    </div>
  );
}

const GROUP_STYLES = {
  "Group A": {
    color: "bg-emerald-500",
    track: "bg-emerald-100 dark:bg-emerald-950/50",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  "Group B": {
    color: "bg-teal-600",
    track: "bg-teal-100 dark:bg-teal-950/50",
    text: "text-teal-700 dark:text-teal-300",
  },
  "Group C": {
    color: "bg-sky-600",
    track: "bg-sky-100 dark:bg-sky-950/50",
    text: "text-sky-700 dark:text-sky-300",
  },
  Unassigned: {
    color: "bg-zinc-500",
    track: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-700 dark:text-zinc-300",
  },
};

function GroupProgressList({ data, targetTeams }) {
  const total = targetTeams || 48;

  const items = data.map((d) => {
    const style = GROUP_STYLES[d.label] || GROUP_STYLES.Unassigned;
    const pct = Math.min(Math.round(((d.value || 0) / total) * 100), 100);
    return {
      label: d.label,
      value: d.value || 0,
      pct,
      detail: `${d.value || 0} / ${total} teams`,
      ...style,
    };
  });

  return (
    <div className="flex min-h-[180px] flex-col justify-center gap-3.5 px-0.5 py-1">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100">
                {item.label}
              </p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                {item.detail}
              </p>
            </div>
            <span className={`shrink-0 text-sm font-black tabular-nums ${item.text}`}>
              {item.pct}%
            </span>
          </div>
          <div className={`h-2.5 overflow-hidden rounded-full ${item.track}`}>
            <div
              className={`h-full rounded-full transition-all duration-700 ${item.color}`}
              style={{ width: `${item.pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboardCharts({ stats }) {
  if (!stats) return null;

  const hasStatus = (stats.teamStatusChart || []).some((d) => d.value > 0);
  const hasGroups = (stats.sectionChart || []).some((d) => d.value > 0);

  return (
    <div className="mb-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Panel title="Tournament Progress" icon={Target}>
          <ProgressBarChart stats={stats} />
        </Panel>

        <Panel title="Teams by Status" icon={PieChart}>
          {hasStatus ? (
            <StatusRadialChart
              data={stats.teamStatusChart}
              targetTeams={stats.targetTeams}
            />
          ) : (
            <EmptyState message="No teams registered yet — waiting for captains" />
          )}
        </Panel>

        <Panel title="Teams by Group" icon={BarChart3}>
          {hasGroups ? (
            <GroupProgressList
              data={stats.sectionChart}
              targetTeams={stats.targetTeams}
            />
          ) : (
            <EmptyState message="No group assignments yet" />
          )}
        </Panel>
      </div>
    </div>
  );
}
