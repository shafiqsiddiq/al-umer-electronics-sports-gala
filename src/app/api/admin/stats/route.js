import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { writeClient } from "@/lib/sanity";
import { TOTAL_TEAMS } from "@/lib/tournament-logic";

const STATUS_COLORS = {
  pending: "#f59e0b",
  approved: "#0284c7",
  active: "#10b981",
  eliminated: "#ef4444",
  qualified_main: "#0d9488",
  qualified_loser: "#d97706",
  final_eight: "#059669",
  champion: "#ca8a04",
};

const MATCH_COLORS = {
  scheduled: "#3b82f6",
  live: "#f59e0b",
  completed: "#10b981",
};

const SECTION_COLORS = {
  A: "#10b981",
  B: "#0d9488",
  C: "#0284c7",
  unassigned: "#71717a",
};

const SECTION_LABELS = {
  A: "Group A",
  B: "Group B",
  C: "Group C",
  unassigned: "Unassigned",
};

function formatStatusLabel(status) {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
}

function buildStatusChart(teams) {
  const counts = {};
  for (const team of teams) {
    const key = team.status || "unknown";
    counts[key] = (counts[key] || 0) + 1;
  }

  return Object.entries(counts).map(([status, value]) => ({
    label: formatStatusLabel(status),
    value,
    color: STATUS_COLORS[status] || "#71717a",
  }));
}

function buildSectionChart(teams) {
  const counts = { A: 0, B: 0, C: 0, unassigned: 0 };
  for (const team of teams) {
    const key = counts[team.section] !== undefined ? team.section : "unassigned";
    counts[key] = (counts[key] || 0) + 1;
  }

  return Object.entries(counts).map(([section, value]) => ({
    label: SECTION_LABELS[section] || section,
    value,
    color: SECTION_COLORS[section] || "#71717a",
  }));
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [
      totalTeams,
      pendingTeams,
      approvedTeams,
      activeTeams,
      qualifiedTeams,
      entryFeeUploaded,
      entryFeeVerified,
      entryFeePaidList,
      totalPlayers,
      totalCaptains,
      totalMatches,
      scheduledMatches,
      liveMatches,
      completedMatches,
      teams,
    ] = await Promise.all([
      writeClient.fetch(`count(*[_type == "team"])`),
      writeClient.fetch(`count(*[_type == "team" && status == "pending"])`),
      writeClient.fetch(`count(*[_type == "team" && status == "approved"])`),
      writeClient.fetch(`count(*[_type == "team" && status == "active"])`),
      writeClient.fetch(
        `count(*[_type == "team" && status in ["qualified_main", "qualified_loser", "final_eight"]])`
      ),
      writeClient.fetch(`count(*[_type == "team" && defined(entryFeeImage.asset)])`),
      writeClient.fetch(`count(*[_type == "team" && entryFeeVerified == true])`),
      writeClient.fetch(`*[_type == "team"]{ "paid": coalesce(entryFeePaid, 0) }`),
      writeClient.fetch(`count(*[_type == "player"])`),
      writeClient.fetch(`count(*[_type == "captain"])`),
      writeClient.fetch(`count(*[_type == "match"])`),
      writeClient.fetch(`count(*[_type == "match" && status == "scheduled"])`),
      writeClient.fetch(`count(*[_type == "match" && status == "live"])`),
      writeClient.fetch(`count(*[_type == "match" && status == "completed"])`),
      writeClient.fetch(`*[_type == "team"]{ status, section }`),
    ]);

    const totalEntryFeePaid = (entryFeePaidList || []).reduce(
      (sum, t) => sum + Number(t.paid || 0),
      0
    );

    const teamStatusChart = buildStatusChart(teams || []);
    const sectionChart = buildSectionChart(teams || []);

    const matchStatusChart = [
      { label: "Scheduled", value: scheduledMatches, color: MATCH_COLORS.scheduled },
      { label: "Live", value: liveMatches, color: MATCH_COLORS.live },
      { label: "Completed", value: completedMatches, color: MATCH_COLORS.completed },
    ];

    return NextResponse.json({
      totalTeams,
      pendingTeams,
      approvedTeams,
      activeTeams,
      qualifiedTeams,
      entryFeeUploaded,
      entryFeeVerified,
      totalEntryFeePaid,
      totalPlayers,
      totalCaptains,
      totalMatches,
      scheduledMatches,
      liveMatches,
      completedMatches,
      targetTeams: TOTAL_TEAMS,
      teamStatusChart,
      matchStatusChart,
      sectionChart,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to load dashboard stats" }, { status: 500 });
  }
}
