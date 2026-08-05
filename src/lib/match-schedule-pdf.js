import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/** First match of a schedule block */
export const SCHEDULE_START_HOUR = 17; // 5:30 PM
export const SCHEDULE_START_MINUTE = 30;
/** Each match slot length — no break between matches */
export const MATCH_DURATION_MINUTES = 40;

/** Group order for combined Round 1 PDF (continuous timeline) */
export const GROUP_SCHEDULE_ORDER = ["A", "B", "C"];

/**
 * @param {number} hour24
 * @param {number} minute
 * @param {number} addMinutes
 * @returns {{ hour: number, minute: number, label: string, endLabel: string }}
 */
export function slotTime(hour24, minute, addMinutes = 0) {
  const total = hour24 * 60 + minute + addMinutes;
  const h24 = ((Math.floor(total / 60) % 24) + 24) % 24;
  const m = ((total % 60) + 60) % 60;
  const endTotal = total + MATCH_DURATION_MINUTES;
  const endH = ((Math.floor(endTotal / 60) % 24) + 24) % 24;
  const endM = ((endTotal % 60) + 60) % 60;
  return {
    hour: h24,
    minute: m,
    label: formatClock(h24, m),
    endLabel: formatClock(endH, endM),
  };
}

function formatClock(h24, m) {
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function sectionTitle(section) {
  if (section === "loser_ab" || section === "loser") return "Loser AB";
  if (section === "knockout") return "Knockout Group";
  if (section === "final") return "Final Stage";
  if (["A", "B", "C"].includes(section)) return `Group ${section}`;
  return String(section || "Matches");
}

/**
 * Build timed rows for a flat list of matches (already ordered).
 * @param {Array} matches
 * @param {{ startHour?: number, startMinute?: number, duration?: number }} opts
 */
export function buildTimedRows(matches, opts = {}) {
  const startHour = opts.startHour ?? SCHEDULE_START_HOUR;
  const startMinute = opts.startMinute ?? SCHEDULE_START_MINUTE;
  const duration = opts.duration ?? MATCH_DURATION_MINUTES;

  return (matches || []).map((m, index) => {
    const start = slotTime(startHour, startMinute, index * duration);
    const end = slotTime(startHour, startMinute, index * duration + duration);
    return {
      matchNumber: m.matchNumber ?? index + 1,
      section: m.section,
      round: m.round,
      team1: m.team1?.name || "TBD",
      team2: m.team2?.name || "TBD",
      captain1: m.team1?.captain?.name || "",
      captain2: m.team2?.captain?.name || "",
      startLabel: start.label,
      endLabel: end.label,
      timeRange: `${start.label} – ${end.label}`,
      status: m.status || "scheduled",
      winner: m.winner?.name || "",
    };
  });
}

/**
 * Continuous schedule across groups for Round 1: A → B → C, no gaps.
 * @param {Array} allMatches - matches from any sections
 * @param {number} round
 */
export function buildGroupedRound1Schedule(allMatches, round = 1) {
  const bySection = {};
  for (const m of allMatches || []) {
    if (Number(m.round) !== Number(round)) continue;
    if (!["A", "B", "C"].includes(m.section)) continue;
    if (!bySection[m.section]) bySection[m.section] = [];
    bySection[m.section].push(m);
  }

  for (const s of Object.keys(bySection)) {
    bySection[s].sort(
      (a, b) => Number(a.matchNumber) - Number(b.matchNumber)
    );
  }

  const ordered = [];
  for (const section of GROUP_SCHEDULE_ORDER) {
    ordered.push(...(bySection[section] || []));
  }

  return buildTimedRows(ordered, {
    startHour: SCHEDULE_START_HOUR,
    startMinute: SCHEDULE_START_MINUTE,
    duration: MATCH_DURATION_MINUTES,
  });
}

/**
 * Download a PDF schedule for one round (current group / section).
 */
export function downloadRoundSchedulePdf({
  section,
  round,
  matches,
  eventName = "Al Umer Electronics Sports Gala S3",
}) {
  const sorted = [...(matches || [])].sort(
    (a, b) => Number(a.matchNumber) - Number(b.matchNumber)
  );
  const rows = buildTimedRows(sorted);
  const label = sectionTitle(section);
  const filename = `${label.replace(/\s+/g, "-")}-Round-${round}-schedule.pdf`;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(5, 150, 105);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(eventName, pageW / 2, 12, { align: "center" });
  doc.setFontSize(11);
  doc.text(`${label} · Round ${round} Match Schedule`, pageW / 2, 20, {
    align: "center",
  });

  doc.setTextColor(50, 50, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `First match: ${formatClock(SCHEDULE_START_HOUR, SCHEDULE_START_MINUTE)} · Each match: ${MATCH_DURATION_MINUTES} min · No break between matches`,
    pageW / 2,
    36,
    { align: "center" }
  );

  autoTable(doc, {
    startY: 42,
    head: [["#", "Time", "Team 1", "Team 2", "Status"]],
    body: rows.map((r) => [
      String(r.matchNumber),
      r.timeRange,
      r.captain1 ? `${r.team1}\n(${r.captain1})` : r.team1,
      r.captain2 ? `${r.team2}\n(${r.captain2})` : r.team2,
      r.winner ? `Winner: ${r.winner}` : String(r.status || "scheduled"),
    ]),
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      valign: "middle",
    },
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 38, halign: "center" },
      2: { cellWidth: 55 },
      3: { cellWidth: 55 },
      4: { cellWidth: 28, halign: "center" },
    },
    alternateRowStyles: { fillColor: [240, 253, 244] },
  });

  const finalY = doc.lastAutoTable?.finalY || 50;
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Generated ${new Date().toLocaleString()} · ${rows.length} match(es)`,
    pageW / 2,
    finalY + 10,
    { align: "center" }
  );

  doc.save(filename);
}

/**
 * Download combined Round 1 PDF for Groups A, B, C with continuous timeline.
 */
export function downloadAllGroupsRound1Pdf({
  matches,
  eventName = "Al Umer Electronics Sports Gala S3",
}) {
  const rows = buildGroupedRound1Schedule(matches, 1);
  if (!rows.length) {
    throw new Error("No Round 1 matches found for Groups A, B, or C");
  }

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(5, 150, 105);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(eventName, pageW / 2, 12, { align: "center" });
  doc.setFontSize(11);
  doc.text("All Groups · Round 1 Match Schedule", pageW / 2, 20, {
    align: "center",
  });

  doc.setTextColor(50, 50, 50);
  doc.setFontSize(9);
  doc.text(
    `Starts ${formatClock(SCHEDULE_START_HOUR, SCHEDULE_START_MINUTE)} · ${MATCH_DURATION_MINUTES} min each · Group A → B → C continuous (no breaks)`,
    pageW / 2,
    36,
    { align: "center" }
  );

  autoTable(doc, {
    startY: 42,
    head: [["#", "Group", "Time", "Team 1", "Team 2"]],
    body: rows.map((r, i) => [
      String(i + 1),
      `Group ${r.section}`,
      r.timeRange,
      r.team1,
      r.team2,
    ]),
    styles: { fontSize: 8, cellPadding: 2.2, valign: "middle" },
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 22,halign: "center" },
      2: { cellWidth: 38,halign: "center" },
      3: { cellWidth: 55 },
      4: { cellWidth: 55 },
    },
    alternateRowStyles: { fillColor: [240, 253, 244] },
  });

  doc.save("All-Groups-Round-1-schedule.pdf");
}
