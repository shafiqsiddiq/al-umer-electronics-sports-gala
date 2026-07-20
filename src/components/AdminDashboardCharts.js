"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { Activity, BarChart3, PieChart, Target } from "lucide-react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

function Panel({ title, icon: Icon, children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/90 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="flex items-center gap-2 border-b border-zinc-100 bg-gradient-to-r from-emerald-50/80 to-transparent px-5 py-3.5 dark:border-zinc-800 dark:from-emerald-950/30">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
          <Icon size={15} />
        </span>
        <h3 className="font-bold text-zinc-900 dark:text-white">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 dark:border-zinc-700 dark:bg-zinc-900/40">
      <div className="mb-2 h-2 w-16 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 opacity-60" />
      <p className="max-w-xs text-center text-sm text-zinc-500 dark:text-zinc-400">
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

function StatusDonut({ data }) {
  const series = data.map((d) => d.value);
  const labels = data.map((d) => d.label);
  const colors = data.map((d) => d.color || "#10b981");
  const total = series.reduce((a, b) => a + b, 0);

  const options = useMemo(
    () => ({
      ...baseChart,
      chart: { ...baseChart.chart, type: "donut" },
      labels,
      colors,
      stroke: { width: 3, colors: ["#fff"] },
      plotOptions: {
        pie: {
          donut: {
            size: "72%",
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: "13px",
                fontWeight: 600,
                color: "#71717a",
                offsetY: 18,
              },
              value: {
                show: true,
                fontSize: "28px",
                fontWeight: 800,
                color: "#18181b",
                offsetY: -10,
                formatter: (v) => String(v),
              },
              total: {
                show: true,
                label: "Teams",
                fontSize: "13px",
                fontWeight: 600,
                color: "#71717a",
                formatter: () => String(total),
              },
            },
          },
        },
      },
      legend: {
        ...baseChart.legend,
        position: "bottom",
        horizontalAlign: "center",
      },
      responsive: [
        {
          breakpoint: 640,
          options: {
            chart: { height: 280 },
          },
        },
      ],
    }),
    [labels, colors, total]
  );

  return (
    <Chart type="donut" series={series} options={options} height={300} width="100%" />
  );
}

function GroupBarChart({ data }) {
  const categories = data.map((d) => d.label);
  const series = useMemo(
    () => [{ name: "Teams", data: data.map((d) => d.value) }],
    [data]
  );
  const colors = data.map((d) => d.color || "#10b981");

  const options = useMemo(
    () => ({
      ...baseChart,
      chart: { ...baseChart.chart, type: "bar" },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 8,
          barHeight: "58%",
          distributed: true,
          dataLabels: { position: "top" },
        },
      },
      colors,
      xaxis: {
        categories,
        labels: {
          style: { colors: "#71717a", fontSize: "12px", fontWeight: 600 },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          style: { colors: "#3f3f46", fontSize: "13px", fontWeight: 700 },
        },
      },
      grid: {
        borderColor: "#f4f4f5",
        strokeDashArray: 4,
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: false } },
      },
      legend: { show: false },
      dataLabels: {
        enabled: true,
        offsetX: 28,
        style: { colors: ["#3f3f46"], fontSize: "12px", fontWeight: 700 },
      },
      tooltip: {
        ...baseChart.tooltip,
        y: { formatter: (v) => `${v} teams` },
      },
    }),
    [categories, colors]
  );

  return (
    <Chart type="bar" series={series} options={options} height={280} width="100%" />
  );
}

function MatchStatusChart({ data }) {
  const categories = data.map((d) => d.label);
  const series = useMemo(
    () => [{ name: "Matches", data: data.map((d) => d.value) }],
    [data]
  );
  const colors = data.map((d) => d.color || "#10b981");

  const options = useMemo(
    () => ({
      ...baseChart,
      chart: { ...baseChart.chart, type: "bar" },
      plotOptions: {
        bar: {
          borderRadius: 10,
          columnWidth: "48%",
          distributed: true,
        },
      },
      colors,
      xaxis: {
        categories,
        labels: {
          style: { colors: "#71717a", fontSize: "12px", fontWeight: 600 },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          style: { colors: "#71717a", fontSize: "12px", fontWeight: 600 },
        },
        forceNiceScale: true,
        min: 0,
      },
      grid: {
        borderColor: "#f4f4f5",
        strokeDashArray: 4,
      },
      legend: { show: false },
      dataLabels: {
        enabled: true,
        style: { colors: ["#fff"], fontSize: "12px", fontWeight: 700 },
      },
      tooltip: {
        ...baseChart.tooltip,
        y: { formatter: (v) => `${v} matches` },
      },
    }),
    [categories, colors]
  );

  return (
    <Chart type="bar" series={series} options={options} height={280} width="100%" />
  );
}

function ProgressRadial({ stats }) {
  const registration = stats.targetTeams
    ? Math.min(Math.round((stats.totalTeams / stats.targetTeams) * 100), 100)
    : 0;
  const fees = stats.totalTeams
    ? Math.min(Math.round((stats.entryFeeUploaded / stats.totalTeams) * 100), 100)
    : 0;
  const matches = stats.totalMatches
    ? Math.min(Math.round((stats.completedMatches / stats.totalMatches) * 100), 100)
    : 0;

  const series = [registration, fees, matches];

  const options = useMemo(
    () => ({
      ...baseChart,
      chart: { ...baseChart.chart, type: "radialBar" },
      plotOptions: {
        radialBar: {
          hollow: { size: "28%" },
          track: {
            background: "#f4f4f5",
            strokeWidth: "100%",
            margin: 8,
          },
          dataLabels: {
            name: {
              fontSize: "12px",
              fontWeight: 600,
              color: "#71717a",
            },
            value: {
              fontSize: "18px",
              fontWeight: 800,
              color: "#18181b",
              formatter: (v) => `${v}%`,
            },
            total: {
              show: true,
              label: "Overall",
              fontSize: "12px",
              fontWeight: 600,
              color: "#71717a",
              formatter: () =>
                `${Math.round(series.reduce((a, b) => a + b, 0) / series.length)}%`,
            },
          },
        },
      },
      colors: ["#10b981", "#f59e0b", "#0d9488"],
      labels: ["Registration", "Entry Fees", "Matches Done"],
      stroke: { lineCap: "round" },
      legend: {
        ...baseChart.legend,
        show: true,
        position: "bottom",
        horizontalAlign: "center",
        formatter: (seriesName, opts) =>
          `${seriesName}: ${opts.w.globals.series[opts.seriesIndex]}%`,
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [registration, fees, matches]
  );

  return (
    <div>
      <Chart
        type="radialBar"
        series={series}
        options={options}
        height={300}
        width="100%"
      />
      <div className="mt-1 grid grid-cols-3 gap-2 text-center text-xs text-zinc-500">
        <p>
          <span className="font-bold text-zinc-800 dark:text-zinc-200">
            {stats.totalTeams}/{stats.targetTeams}
          </span>
          <br />
          Teams
        </p>
        <p>
          <span className="font-bold text-zinc-800 dark:text-zinc-200">
            {stats.entryFeeUploaded}/{stats.totalTeams || 0}
          </span>
          <br />
          Fees
        </p>
        <p>
          <span className="font-bold text-zinc-800 dark:text-zinc-200">
            {stats.completedMatches}/{stats.totalMatches || 0}
          </span>
          <br />
          Done
        </p>
      </div>
    </div>
  );
}

export default function AdminDashboardCharts({ stats }) {
  if (!stats) return null;

  const hasStatus = (stats.teamStatusChart || []).some((d) => d.value > 0);
  const hasGroups = (stats.sectionChart || []).some((d) => d.value > 0);
  const hasMatches = (stats.matchStatusChart || []).some((d) => d.value > 0);

  return (
    <div className="mb-8 space-y-4">
      <div className="flex items-center gap-2">
        <Activity size={18} className="text-emerald-600" />
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
          Tournament Pulse
        </h2>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Teams by Status" icon={PieChart}>
          {hasStatus ? (
            <StatusDonut data={stats.teamStatusChart} />
          ) : (
            <EmptyState message="No teams registered yet — waiting for captains" />
          )}
        </Panel>

        <Panel title="Teams by Group" icon={BarChart3}>
          {hasGroups ? (
            <GroupBarChart data={stats.sectionChart} />
          ) : (
            <EmptyState message="No group assignments yet" />
          )}
        </Panel>

        <Panel title="Matches by Status" icon={Activity}>
          {hasMatches ? (
            <MatchStatusChart data={stats.matchStatusChart} />
          ) : (
            <EmptyState message="No matches created yet — generate fixtures when ready" />
          )}
        </Panel>

        <Panel title="Tournament Progress" icon={Target}>
          <ProgressRadial stats={stats} />
        </Panel>
      </div>
    </div>
  );
}
