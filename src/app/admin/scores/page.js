"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import LuckyDrawSpinner from "@/components/LuckyDrawSpinner";
import ChampionCard from "@/components/ChampionCard";
import ConfirmModal from "@/components/ConfirmModal";
import ChangeMatchTeamsModal from "@/components/ChangeMatchTeamsModal";
import CricketLoader from "@/components/CricketLoader";
import {
  Trophy,
  ShieldAlert,
  Flag,
  Activity,
  CheckCircle2,
  Medal,
  Users,
  ClipboardList,
  CalendarClock,
  RotateCcw,
  Pencil,
  ShieldPlus,
  RefreshCw,
  Wand2,
  Trash2,
  FileDown,
  ArrowLeftRight,
  ImageDown,
  Clock,
  Radio,
} from "lucide-react";
import {
  TOP_SIXTEEN,
  MAIN_QUALIFIERS_PER_SECTION,
  TEAMS_PER_SECTION,
  LOSER_AB_EXPECTED,
  LOSER_AB_QUALIFIERS,
  KNOCKOUT_QUALIFIERS,
  KNOCKOUT_BASE_EXPECTED,
  knockoutRoundSizeLabel,
  expectedR1MatchCount,
  expectedR1PlayingCount,
} from "@/lib/tournament-logic";
import {
  downloadRoundSchedulePdf,
  downloadAllGroupsRound1Pdf,
  MATCH_DURATION_MINUTES,
  SCHEDULE_START_HOUR,
  SCHEDULE_START_MINUTE,
  slotTime,
} from "@/lib/match-schedule-pdf";
import { generateMatchPost } from "@/lib/match-post";
import { generateTop4Post } from "@/lib/top4-post";

/** Match-card design tokens (clean white / green) */
const CARD_GREEN = "#22C55E";
const CARD_NAVY = "#0F172A";
const CARD_MUTED = "#64748B";

const SCORES_TAB_KEY = "admin-scores-active-tab";
const SCORES_TAB_IDS = [
  "A",
  "B",
  "C",
  "loser_ab",
  "knockout",
  "top8",
  "final",
];
const test=10
function readStoredScoresTab() {
  if (typeof window === "undefined") return "A";
  try {
    const saved = window.localStorage.getItem(SCORES_TAB_KEY);
    if (SCORES_TAB_IDS.includes(saved)) return saved;
  } catch {
    /* ignore */
  }
  return "A";
}

function scoresTabLabel(tabId) {
  const labels = {
    A: "Group A",
    B: "Group B",
    C: "Group C",
    loser_ab: "Loser AB",
    knockout: "Knockout Group",
    top8: "Top 16",
    final: "Final Stage",
  };
  return labels[tabId] || tabId;
}

/** Fallback portrait pool when captain has no profile photo */
const CAPTAIN_AVATARS = [
  "/banned-players/ali-jutt-lidhar.png",
  "/banned-players/baber-padana.png",
  "/banned-players/faraz-jutt-mota-singh.png",
  "/banned-players/faisal-badouki.png",
  "/banned-players/ameer-hamza-chachuwali.png",
  "/banned-players/ikram-pathanki.png",
  "/banned-players/saqib-lefti-knaker.png",
  "/banned-players/shebi-hadyarah.png",
  "/banned-players/sohail-sikandar.png",
  "/banned-players/zahid-lefti-karbhat.png",
  "/banned-players/farman-jahman.png",
  "/banned-players/rehman-shah-kamahan.png",
  "/cricket_action_shot.png",
];

function pickCaptainAvatar(seed = "") {
  let hash = 0;
  const s = String(seed || "player");
  for (let i = 0; i < s.length; i += 1) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return CAPTAIN_AVATARS[hash % CAPTAIN_AVATARS.length];
}

/** Same portrait for a team everywhere (match card + Top 4) */
function teamPortrait(teamName = "", captainName = "") {
  return pickCaptainAvatar(`${teamName.trim().toLowerCase()}|${captainName.trim().toLowerCase()}`);
}

function formatMatchDateTime(scheduledAt) {
  if (!scheduledAt) return null;
  const d = new Date(scheduledAt);
  if (Number.isNaN(d.getTime())) return null;
  const date = d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${date} · ${time}`;
}

export default function AdminScoresPage() {
  const { toast } = useToast();
  const [matches, setMatches] = useState([]);
  const [updating, setUpdating] = useState(null);
  const [luckyDrawInfo, setLuckyDrawInfo] = useState({
    needsSpinner: false,
    spinDone: false,
    finalThreeReady: false,
    teams: [],
  });
  const [byeSpinInfo, setByeSpinInfo] = useState({
    needsSpinner: false,
    spinDone: false,
    teams: [],
    section: null,
    fromRound: null,
    playRound: null,
    byeRound: null,
  });
  const [activeTab, setActiveTab] = useState("A");
  const [tabHydrated, setTabHydrated] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [switchingTabLabel, setSwitchingTabLabel] = useState(null);
  const [top8, setTop8] = useState({ teams: [], count: 0, capacity: TOP_SIXTEEN });
  const [loserPoolTeams, setLoserPoolTeams] = useState([]);
  const [loserAbPoolTeams, setLoserAbPoolTeams] = useState([]);
  const [knockoutPoolTeams, setKnockoutPoolTeams] = useState([]);
  const [sectionTeamsByGroup, setSectionTeamsByGroup] = useState({
    A: [],
    B: [],
    C: [],
  });
  const [resetTarget, setResetTarget] = useState(null); // { section, round, label, deleteFixtures? }
  const [resetting, setResetting] = useState(false);
  const [regeneratingKnockout, setRegeneratingKnockout] = useState(false);
  const [regeneratingLoserAb, setRegeneratingLoserAb] = useState(false);
  const [generatingSection, setGeneratingSection] = useState(null); // "A"|"B"|"C"
  const [generatingRound, setGeneratingRound] = useState(null); // { section, round }
  const [confirmGenerateSection, setConfirmGenerateSection] = useState(null); // "A"|"B"|"C"
  const [confirmClearSection, setConfirmClearSection] = useState(null); // "A"|"B"|"C"
  const [clearingSection, setClearingSection] = useState(null);
  const [confirmGenerateTop16, setConfirmGenerateTop16] = useState(false);
  const [confirmClearTop16, setConfirmClearTop16] = useState(false);
  const [generatingTop16, setGeneratingTop16] = useState(false);
  const [clearingTop16, setClearingTop16] = useState(false);
  const [changeTeamsMatch, setChangeTeamsMatch] = useState(null);
  const [resetMatchTarget, setResetMatchTarget] = useState(null);
  const [resettingMatch, setResettingMatch] = useState(false);
  const [generatingMatchPostId, setGeneratingMatchPostId] = useState(null);
  const [generatingTop4, setGeneratingTop4] = useState(false);

  useEffect(() => {
    const stored = readStoredScoresTab();
    setActiveTab(stored);
    setTabHydrated(true);
    setSwitchingTabLabel(`Opening ${scoresTabLabel(stored)}…`);

    Promise.all([fetchMatches(), checkLuckyDraw(), fetchTop8()])
      .catch(() => {})
      .finally(() => {
        setPageLoading(false);
        window.setTimeout(() => setSwitchingTabLabel(null), 320);
      });
  }, []);

  useEffect(() => {
    if (!tabHydrated) return;
    try {
      window.localStorage.setItem(SCORES_TAB_KEY, activeTab);
    } catch {
      /* ignore */
    }
  }, [activeTab, tabHydrated]);

  useEffect(() => {
    if (activeTab === "knockout" || activeTab === "loser_ab") {
      checkByeSpin(activeTab === "loser_ab" ? "loser_ab" : "knockout");
    }
  }, [activeTab]);

  function switchTab(tabId, tabLabel) {
    if (tabId === activeTab || switchingTabLabel || pageLoading) return;
    setSwitchingTabLabel(tabLabel || scoresTabLabel(tabId));
    window.setTimeout(() => {
      setActiveTab(tabId);
      try {
        window.localStorage.setItem(SCORES_TAB_KEY, tabId);
      } catch {
        /* ignore */
      }
      window.setTimeout(() => setSwitchingTabLabel(null), 280);
    }, 220);
  }

  async function checkLuckyDraw() {
    try {
      const res = await fetch("/api/tournament/lucky-draw");
      const data = await res.json();
      setLuckyDrawInfo(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function checkByeSpin(section) {
    try {
      const res = await fetch(
        `/api/tournament/bye-spin?section=${encodeURIComponent(section)}`
      );
      const data = await res.json();
      setByeSpinInfo({
        needsSpinner: !!data.needsSpinner,
        spinDone: !!data.spinDone,
        teams: data.teams || [],
        section: data.section || section,
        fromRound: data.fromRound ?? null,
        playRound: data.playRound ?? null,
        byeRound: data.byeRound ?? null,
        byeTeam: data.byeTeam || null,
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchTop8() {
    try {
      const res = await fetch("/api/admin/brackets");
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(data.error || "Failed to load brackets");
      if (data.top8) setTop8(data.top8);
      else if (data.top16) setTop8(data.top16);
      setLoserPoolTeams(data.loserBracket?.poolTeams || []);
      setLoserAbPoolTeams(data.loserAb?.poolTeams || []);
      setKnockoutPoolTeams(data.knockout?.poolTeams || []);
      setSectionTeamsByGroup({
        A: data.sections?.A?.sectionTeams || [],
        B: data.sections?.B?.sectionTeams || [],
        C: data.sections?.C?.sectionTeams || [],
      });
    } catch (err) {
      console.error(err);
      toast(err.message || "Failed to load brackets", "error");
    }
  }

  async function handleSpinComplete(winner) {
    try {
      const res = await fetch("/api/tournament/lucky-draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          winnerId: winner._id,
          allTeamIds: luckyDrawInfo.teams.map((t) => t._id),
        }),
      });
      if (!res.ok) throw new Error("Failed to save lucky draw result");
      toast(`${winner.name} goes directly to Top 16!`, "success");
      await fetchMatches();
      await checkLuckyDraw();
      await fetchTop8();
    } catch (err) {
      toast(err.message, "error");
    }
  }

  async function handleByeSpinComplete(winner) {
    try {
      const res = await fetch("/api/tournament/bye-spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: byeSpinInfo.section,
          fromRound: byeSpinInfo.fromRound,
          byeTeamId: winner._id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save bye spin");
      toast(
        `${winner.name} gets a bye to Round ${byeSpinInfo.byeRound}!`,
        "success"
      );
      await fetchMatches();
      await fetchTop8();
      await checkByeSpin(byeSpinInfo.section);
    } catch (err) {
      toast(err.message, "error");
    }
  }

  async function fetchMatches() {
    try {
      const res = await fetch(
        "/api/admin/matches?status=scheduled,live,completed"
      );
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(data.error || "Failed to load matches");
      setMatches(data.matches || []);
    } catch (err) {
      console.error(err);
      toast(err.message || "Failed to load matches", "error");
      setMatches([]);
    }
  }

  async function updateScore(matchId, form) {
    setUpdating(matchId);
    try {
      const res = await fetch(`/api/matches/${matchId}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update match score");
      toast(
        data.corrected
          ? "Winner/result corrected successfully."
          : data.byeSpin?.needsSpinner
            ? "Round complete — spin for bye (odd team)."
            : "Match score updated successfully.",
        data.byeSpin?.needsSpinner ? "info" : "success"
      );
      await fetchMatches();
      await fetchTop8();
      await checkLuckyDraw();
      if (data.byeSpin?.needsSpinner) {
        setByeSpinInfo({
          needsSpinner: true,
          spinDone: false,
          teams: data.byeSpin.teams || [],
          section: data.byeSpin.section,
          fromRound: data.byeSpin.fromRound,
          playRound: data.byeSpin.playRound,
          byeRound: data.byeSpin.byeRound,
        });
        if (data.byeSpin.section === "knockout") setActiveTab("knockout");
        else if (data.byeSpin.section === "loser_ab") setActiveTab("loser_ab");
      } else if (activeTab === "knockout" || activeTab === "loser_ab") {
        await checkByeSpin(activeTab === "loser_ab" ? "loser_ab" : "knockout");
      }
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setUpdating(null);
    }
  }

  async function confirmResetRound() {
    if (!resetTarget) return;
    const target = resetTarget;
    setResetting(true);
    try {
      const res = await fetch("/api/admin/matches/reset-round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: target.section,
          round: target.round,
          deleteFixtures: !!target.deleteFixtures,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset round");
      if (data.deletedFixtures) {
        toast(
          `${target.label} fixtures cleared (${data.deletedPoolMatches || 0} matches deleted). Ab Generate Round fixtures dabao.`,
          "success"
        );
      } else {
        toast(
          `${target.label} reset — scores cleared${
            data.deletedPoolMatches
              ? ` · ${data.deletedPoolMatches} pool matches removed`
              : ""
          }.`,
          "success"
        );
      }
      setResetTarget(null);
      await fetchMatches();
      await fetchTop8();
      await checkLuckyDraw();
      if (target.section === "knockout" || target.section === "loser_ab") {
        await checkByeSpin(target.section);
      }
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setResetting(false);
    }
  }

  async function confirmResetMatch() {
    if (!resetMatchTarget?._id) return;
    const match = resetMatchTarget;
    setResettingMatch(true);
    try {
      const res = await fetch(`/api/admin/matches/${match._id}/reset`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset match");
      toast(
        `Match ${match.matchNumber} reset — result cleared. Ab Change se teams update kar sakte ho.`,
        "success"
      );
      setResetMatchTarget(null);
      await fetchMatches();
      await fetchTop8();
      await checkLuckyDraw();
    } catch (err) {
      toast(err.message || "Failed to reset match", "error");
    } finally {
      setResettingMatch(false);
    }
  }

  async function regenerateKnockoutFixtures() {
    setRegeneratingKnockout(true);
    try {
      const res = await fetch("/api/tournament/generate-losers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pool: "knockout", force: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to regenerate Knockout");
      const ko = data.created?.knockout;
      if (ko?.skipped) {
        toast(ko.reason || "Knockout fixtures unchanged", "error");
      } else {
        const expectedR1 = expectedR1MatchCount(ko?.teams || 0);
        if (ko?.round1Matches !== expectedR1) {
          toast(
            `Rebuild incomplete: ${ko?.teams} teams but only ${ko?.round1Matches} Round 1 matches (need ${expectedR1}).`,
            "error"
          );
        } else {
          toast(
            `Knockout rebuilt — ${ko?.teams} teams · ${ko?.round1Matches} Round 1 matches` +
              (ko?.openingBye ? " (+ 1 opening bye → R2)" : ""),
            "success"
          );
        }
      }
      await fetchMatches();
      await fetchTop8();
      await checkByeSpin("knockout");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setRegeneratingKnockout(false);
    }
  }

  async function regenerateLoserAbFixtures() {
    setRegeneratingLoserAb(true);
    try {
      const res = await fetch("/api/tournament/generate-losers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pool: "loser_ab", force: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate Loser AB");
      const lab = data.created?.loserAb;
      if (lab?.skipped) {
        toast(lab.reason || "Loser AB fixtures unchanged", "error");
      } else {
        toast(
          `Loser AB ready — Group A losers ${lab?.fromA ?? "?"} + Group B losers ${lab?.fromB ?? "?"} = ${lab?.teams} teams · ${lab?.round1Matches} Round 1 matches`,
          "success"
        );
      }
      await fetchMatches();
      await fetchTop8();
      await checkByeSpin("loser_ab");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setRegeneratingLoserAb(false);
    }
  }

  async function confirmGenerateGroupFixtures() {
    const section = confirmGenerateSection;
    if (!section) return;
    setConfirmGenerateSection(null);
    setGeneratingSection(section);
    try {
      const res = await fetch("/api/tournament/generate-section-fixtures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, force: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate fixtures");
      toast(
        `Group ${section} Round 1 ready — ${data.round1Matches} matches (${data.teams} teams). Round 2 Generate se banega.`,
        "success"
      );
      await fetchMatches();
      await fetchTop8();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setGeneratingSection(null);
    }
  }

  async function generateNextRound(section, round) {
    setGeneratingRound({ section, round });
    try {
      const res = await fetch("/api/tournament/generate-round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, round, force: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate round");
      toast(
        `Round ${round} ready — ${data.matchesCreated} matches from ${data.teams} winners`,
        "success"
      );
      await fetchMatches();
      await fetchTop8();
      if (section === "loser_ab" || section === "knockout") {
        await checkByeSpin(section);
      }
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setGeneratingRound(null);
    }
  }

  async function confirmClearGroupFixtures() {
    const section = confirmClearSection;
    if (!section) return;
    setConfirmClearSection(null);
    setClearingSection(section);
    try {
      const hasCompleted = matches.some(
        (m) =>
          m.section === section &&
          m.bracketType === "main" &&
          m.status === "completed"
      );
      const res = await fetch("/api/tournament/generate-section-fixtures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section,
          action: "clear",
          force: hasCompleted,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to clear fixtures");
      toast(
        `Group ${section} fixtures cleared${
          data.deleted ? ` (${data.deleted} matches removed)` : ""
        }. Generate form is ready.`,
        "success"
      );
      await fetchMatches();
      await fetchTop8();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setClearingSection(null);
    }
  }

  async function confirmGenerateTop16Fixtures() {
    setGeneratingTop16(true);
    setConfirmGenerateTop16(false);
    await new Promise((r) => window.setTimeout(r, 80));
    try {
      const res = await fetch("/api/tournament/generate-final-eight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate Top 16");
      toast(
        `Top 16 ready — ${data.matchesCreated} matches (${data.teams} teams). Final Stage tab pe scores update karo.`,
        "success"
      );
      await fetchMatches();
      await fetchTop8();
      setActiveTab("final");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setGeneratingTop16(false);
    }
  }

  async function confirmClearTop16Fixtures() {
    setClearingTop16(true);
    setConfirmClearTop16(false);
    // Let React paint the cricket loader before the API call
    await new Promise((r) => window.setTimeout(r, 80));
    try {
      const res = await fetch("/api/tournament/generate-final-eight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to clear Top 16");
      toast(
        data.deleted
          ? `Top 16 fixtures cleared (${data.deleted} matches). Teams wapas pool mein hain — Generate dabao.`
          : data.message || "No Top 16 fixtures to clear",
        "success"
      );
      await fetchMatches();
      await fetchTop8();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setClearingTop16(false);
    }
  }

  function handleDownloadRoundPdf(section, round, roundMatches) {
    const ready = (roundMatches || []).filter((m) => m.team1 || m.team2);
    if (!ready.length) {
      toast("No matches to export for this round", "error");
      return;
    }
    try {
      downloadRoundSchedulePdf({
        section,
        round: Number(round),
        matches: ready,
      });
      toast(`Round ${round} PDF downloaded`, "success");
    } catch (err) {
      toast(err.message || "Failed to create PDF", "error");
    }
  }

  function handleDownloadAllGroupsRound1() {
    const r1 = matches.filter(
      (m) =>
        ["A", "B", "C"].includes(m.section) &&
        Number(m.round) === 1 &&
        (m.team1 || m.team2)
    );
    if (!r1.length) {
      toast("No Group A/B/C Round 1 matches to export", "error");
      return;
    }
    try {
      downloadAllGroupsRound1Pdf({ matches: r1 });
      toast("All Groups Round 1 PDF downloaded", "success");
    } catch (err) {
      toast(err.message || "Failed to create PDF", "error");
    }
  }

  async function handleGenerateMatchPost(match, roundMatches) {
    if (!match?.team1 || !match?.team2) {
      toast("Both teams must be set before generating a post", "error");
      return;
    }
    setGeneratingMatchPostId(match._id);
    try {
      const sorted = [...(roundMatches || [])].sort(
        (a, b) => Number(a.matchNumber) - Number(b.matchNumber)
      );
      const idx = Math.max(
        0,
        sorted.findIndex((m) => m._id === match._id)
      );
      const start = slotTime(
        SCHEDULE_START_HOUR,
        SCHEDULE_START_MINUTE,
        idx * MATCH_DURATION_MINUTES
      );
      const end = slotTime(
        SCHEDULE_START_HOUR,
        SCHEDULE_START_MINUTE,
        idx * MATCH_DURATION_MINUTES + MATCH_DURATION_MINUTES
      );
      await generateMatchPost({
        match,
        startLabel: start.label,
        endLabel: end.label,
        timeRange: `${start.label} – ${end.label}`,
      });
      toast("Match post downloaded", "success");
    } catch (err) {
      console.error(err);
      toast(err.message || "Failed to generate match post", "error");
    } finally {
      setGeneratingMatchPostId(null);
    }
  }

  function getMatchSlot(match, roundMatches) {
    const sorted = [...(roundMatches || [])].sort(
      (a, b) => Number(a.matchNumber) - Number(b.matchNumber)
    );
    const idx = Math.max(
      0,
      sorted.findIndex((m) => m._id === match._id)
    );
    const start = slotTime(
      SCHEDULE_START_HOUR,
      SCHEDULE_START_MINUTE,
      idx * MATCH_DURATION_MINUTES
    );
    const end = slotTime(
      SCHEDULE_START_HOUR,
      SCHEDULE_START_MINUTE,
      idx * MATCH_DURATION_MINUTES + MATCH_DURATION_MINUTES
    );
    return {
      startLabel: start.label,
      endLabel: end.label,
      timeRange: `${start.label} – ${end.label}`,
    };
  }

  const tabs = [
    { id: "A", label: "Group A", icon: Flag },
    { id: "B", label: "Group B", icon: Flag },
    { id: "C", label: "Group C", icon: Flag },
    { id: "loser_ab", label: "Loser AB", icon: ShieldAlert },
    { id: "knockout", label: "Knockout Group", icon: ShieldAlert },
    { id: "top8", label: "Top 16", icon: Medal },
    { id: "final", label: "Final Stage", icon: Trophy },
  ];

  const filteredMatches = matches
    .filter((m) => {
      if (activeTab === "loser_ab") return m.section === "loser_ab" || m.section === "loser";
      if (activeTab === "knockout") return m.section === "knockout";
      return m.section === activeTab;
    })
    // Groups A/B/C only go to Round 2 (4 qualifiers) — hide legacy Round 3+
    .filter((m) => {
      if (["A", "B", "C"].includes(activeTab) && Number(m.round) >= 3) return false;
      return true;
    })
    .sort((a, b) => a.round - b.round || a.matchNumber - b.matchNumber);

  const seenKeys = new Set();
  const dedupedMatches = filteredMatches.filter((m) => {
    const key = `${m.round}-${m.matchNumber}`;
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });

  const matchesByRound = {};
  dedupedMatches.forEach((m) => {
    if (!matchesByRound[m.round]) matchesByRound[m.round] = [];
    matchesByRound[m.round].push(m);
  });

  // Always reserve upcoming round slots so Round 2 (etc.) stays visible
  if (["A", "B", "C"].includes(activeTab)) {
    if ((matchesByRound[1] || []).length > 0 && !matchesByRound[2]) {
      matchesByRound[2] = [];
    }
  } else if (activeTab === "loser_ab" || activeTab === "knockout") {
    if (Object.keys(matchesByRound).length === 0) {
      matchesByRound[1] = [];
    }
    if ((matchesByRound[1] || []).length > 0 && !matchesByRound[2]) {
      matchesByRound[2] = [];
    }
    if ((matchesByRound[2] || []).length > 0 && !matchesByRound[3]) {
      const r2 = matchesByRound[2];
      const r2Done =
        r2.length > 0 &&
        r2.every((m) => m.status === "completed" && m.winner?._id);
      // Show Round 3 slot once R2 exists (or is ready to generate later)
      if (r2Done || r2.length > 0) {
        matchesByRound[3] = matchesByRound[3] || [];
      }
    }
  }

  const roundKeys = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => a - b)
    .map(String);

  /** Info for an empty upcoming round — Generate button inside that round section */
  function getRoundGenerateOffer(roundNum) {
    const section = activeTab;
    const poolTabs = ["A", "B", "C", "loser_ab", "knockout"];
    if (!poolTabs.includes(section)) return null;
    if (Number(roundNum) < 2) return null;
    if ((matchesByRound[roundNum] || []).length > 0) return null;

    if (["A", "B", "C"].includes(section) && Number(roundNum) > 2) return null;

    const prevRound = Number(roundNum) - 1;
    const prevMatches = matchesByRound[prevRound] || [];
    if (!prevMatches.length) {
      return {
        section,
        round: Number(roundNum),
        prevRound,
        ready: false,
        blocked: false,
        reason: `Round ${prevRound} fixtures pehle generate karo`,
      };
    }

    const completed = prevMatches.filter(
      (m) => m.status === "completed" && m.winner?._id
    ).length;
    const allDone = completed === prevMatches.length;
    if (!allDone) {
      return {
        section,
        round: Number(roundNum),
        prevRound,
        ready: false,
        blocked: false,
        winners: completed,
        total: prevMatches.length,
        reason: `Round ${prevRound} complete karo (${completed}/${prevMatches.length})`,
      };
    }

    const winners = prevMatches.length;
    if (
      (section === "loser_ab" || section === "knockout") &&
      winners <= 2
    ) {
      return {
        section,
        round: Number(roundNum),
        prevRound,
        ready: false,
        blocked: true,
        reason: "Winners already qualify — no further round needed",
      };
    }
    if (winners % 2 === 1) {
      const spinPending =
        byeSpinInfo.needsSpinner &&
        byeSpinInfo.section === section &&
        Number(byeSpinInfo.fromRound) === prevRound;
      if (spinPending) {
        return {
          section,
          round: Number(roundNum),
          prevRound,
          winners,
          ready: false,
          blocked: true,
          reason: "Odd teams — pehle bye spinner chalao",
        };
      }
      // Deferred bye (opening / prior spin) may make entering count even
      return {
        section,
        round: Number(roundNum),
        prevRound,
        winners,
        matches: Math.ceil(winners / 2),
        ready: true,
        blocked: false,
        mayIncludeBye: true,
      };
    }

    return {
      section,
      round: Number(roundNum),
      prevRound,
      winners,
      matches: winners / 2,
      ready: true,
      blocked: false,
    };
  }

  function loserRoundLabel(round) {
    if (activeTab === "knockout") {
      const poolN =
        knockoutPoolTeams.length ||
        knockoutFixtureTeamIds.size ||
        KNOCKOUT_BASE_EXPECTED;
      return knockoutRoundSizeLabel(poolN, Number(round), KNOCKOUT_QUALIFIERS);
    }
    const labels = {
      1: "Round 1 · 16 → 8",
      2: "Round 2 · 8 → 4",
      3: "Round 3 · 4 → 2 Top 16",
    };
    return labels[Number(round)] || `Round ${round}`;
  }

  const emptySlots = Math.max(0, (top8.capacity || TOP_SIXTEEN) - (top8.teams?.length || 0));
  const finalStageMatches = matches.filter((m) => m.section === "final");
  const top16PoolReady = (top8.count || 0) >= TOP_SIXTEEN;
  const hasTop16Fixtures = finalStageMatches.length > 0;

  // Group Top 4: prefer R2 match winners (same portraits as cards above), else brackets API
  const groupTop4 = (() => {
    if (!["A", "B", "C"].includes(activeTab)) return [];

    const r2Done = matches
      .filter(
        (m) =>
          m.section === activeTab &&
          Number(m.round) === 2 &&
          m.status === "completed" &&
          m.winner
      )
      .sort((a, b) => a.matchNumber - b.matchNumber);

    const fromMatches = r2Done
      .map((m) => {
        const w = m.winner;
        const sideTeam =
          m.team1?._id === w?._id
            ? m.team1
            : m.team2?._id === w?._id
              ? m.team2
              : null;
        return {
          _id: w._id,
          name: w.name || sideTeam?.name,
          section: activeTab,
          captain: w.captain || sideTeam?.captain || null,
          wins: w.wins ?? sideTeam?.wins,
          points: w.points ?? sideTeam?.points,
        };
      })
      .filter((t) => t?._id);

    const seen = new Set();
    const uniqueFromMatches = fromMatches.filter((t) => {
      if (seen.has(t._id)) return false;
      seen.add(t._id);
      return true;
    });

    // Top 4 only from completed R2 winners — never stale qualified_main after a reset
    return uniqueFromMatches.slice(0, MAIN_QUALIFIERS_PER_SECTION);
  })();
  const groupTop4Empty = Math.max(0, MAIN_QUALIFIERS_PER_SECTION - groupTop4.length);

  /** Loser AB / Knockout → Top 16 qualifiers (final round winners) */
  const poolTopQualifiers = (() => {
    if (activeTab !== "loser_ab" && activeTab !== "knockout") return [];

    const target =
      activeTab === "knockout" ? KNOCKOUT_QUALIFIERS : LOSER_AB_QUALIFIERS;
    const sectionMatches = matches
      .filter((m) =>
        activeTab === "loser_ab"
          ? m.section === "loser_ab" || m.section === "loser"
          : m.section === "knockout"
      )
      .sort((a, b) => a.round - b.round || a.matchNumber - b.matchNumber);

    if (!sectionMatches.length) return [];

    const rounds = [
      ...new Set(sectionMatches.map((m) => Number(m.round))),
    ].sort((a, b) => b - a);

    for (const round of rounds) {
      const roundMatches = sectionMatches.filter(
        (m) => Number(m.round) === round
      );
      const done = roundMatches.filter(
        (m) => m.status === "completed" && m.winner?._id
      );
      // Final qualifier round: exactly `target` matches, all done → `target` winners
      if (
        done.length === roundMatches.length &&
        done.length === target
      ) {
        return done
          .sort((a, b) => a.matchNumber - b.matchNumber)
          .map((m) => {
            const w = m.winner;
            const sideTeam =
              m.team1?._id === w?._id
                ? m.team1
                : m.team2?._id === w?._id
                  ? m.team2
                  : null;
            return {
              _id: w._id,
              name: w.name || sideTeam?.name,
              captain: w.captain || sideTeam?.captain || null,
              wins: w.wins ?? sideTeam?.wins,
              points: w.points ?? sideTeam?.points,
              fromRound: round,
            };
          })
          .filter((t) => t?._id)
          .slice(0, target);
      }
    }
    return [];
  })();
  const poolTopEmpty = Math.max(
    0,
    (activeTab === "knockout" ? KNOCKOUT_QUALIFIERS : LOSER_AB_QUALIFIERS) -
      poolTopQualifiers.length
  );

  async function handleGenerateTop4Post() {
    if (!["A", "B", "C"].includes(activeTab)) return;
    if (groupTop4.length === 0) {
      toast("No Top 4 teams yet — complete Round 2 matches first", "error");
      return;
    }
    setGeneratingTop4(true);
    try {
      await generateTop4Post({
        group: activeTab,
        teams: groupTop4.map((t) => ({
          ...t,
          captain: {
            ...t.captain,
            name: t.captain?.name || "",
            profilePictureUrl:
              t.captain?.profilePictureUrl ||
              teamPortrait(t.name, t.captain?.name || ""),
          },
        })),
      });
      toast(`Group ${activeTab} Top 4 post downloaded`, "success");
    } catch (err) {
      console.error(err);
      toast(err.message || "Failed to generate Top 4 post", "error");
    } finally {
      setGeneratingTop4(false);
    }
  }

  const knockoutR1Matches = matches.filter(
    (m) => m.section === "knockout" && Number(m.round) === 1
  );
  const knockoutFixtureTeamIds = new Set();
  for (const m of knockoutR1Matches) {
    if (m.team1?._id) knockoutFixtureTeamIds.add(m.team1._id);
    if (m.team2?._id) knockoutFixtureTeamIds.add(m.team2._id);
  }
  const knockoutPoolN = knockoutPoolTeams.length;
  const knockoutExpectedPlaying = expectedR1PlayingCount(knockoutPoolN);
  const knockoutExpectedR1 = expectedR1MatchCount(knockoutPoolN);
  const knockoutUncovered = knockoutPoolTeams.filter(
    (t) => t._id && !knockoutFixtureTeamIds.has(t._id)
  );
  const knockoutOpeningByeOk =
    knockoutPoolN % 2 === 1 &&
    knockoutFixtureTeamIds.size === knockoutExpectedPlaying &&
    knockoutR1Matches.length === knockoutExpectedR1 &&
    knockoutUncovered.length === 1;
  const knockoutCoverageOk =
    knockoutFixtureTeamIds.size === 0 ||
    (knockoutPoolN % 2 === 0 &&
      knockoutFixtureTeamIds.size === knockoutPoolN &&
      knockoutR1Matches.length === knockoutExpectedR1) ||
    knockoutOpeningByeOk;
  const knockoutPoolMismatch =
    activeTab === "knockout" &&
    knockoutPoolN > 0 &&
    knockoutFixtureTeamIds.size > 0 &&
    !knockoutCoverageOk;
  const knockoutNewEntries = Math.max(
    0,
    knockoutPoolN - KNOCKOUT_BASE_EXPECTED
  );

  const loserAbPoolList =
    loserAbPoolTeams.length > 0
      ? loserAbPoolTeams
      : loserPoolTeams.filter(
          (t) => t.fromSection === "A" || t.fromSection === "B"
        );
  const loserAbFromA = loserAbPoolList.filter((t) => t.fromSection === "A").length;
  const loserAbFromB = loserAbPoolList.filter((t) => t.fromSection === "B").length;
  const loserAbR1Matches = matches.filter(
    (m) =>
      (m.section === "loser_ab" || m.section === "loser") &&
      Number(m.round) === 1
  );
  const loserAbHasFixtures = loserAbR1Matches.length > 0;
  const loserAbCanGenerate = loserAbPoolList.length === LOSER_AB_EXPECTED;

  const grandFinal = matches.find(
    (m) =>
      m.section === "final" &&
      (m.round === 4 || m.bracketType === "final") &&
      m.status === "completed" &&
      m.winner
  );
  const champion = grandFinal?.winner || null;
  const runnerUp =
    grandFinal && champion
      ? grandFinal.team1?._id === champion._id
        ? grandFinal.team2
        : grandFinal.team1
      : null;
  const finalScore =
    grandFinal?.team1Score || grandFinal?.team2Score
      ? `${grandFinal.team1Score || "—"} – ${grandFinal.team2Score || "—"}`
      : null;

  const activeGroupTeams =
    ["A", "B", "C"].includes(activeTab)
      ? sectionTeamsByGroup[activeTab] || []
      : [];

  const tabMatchCount =
    activeTab === "top8"
      ? top8.count || 0
      : dedupedMatches.length;

  const cricketBusyLabel = pageLoading
    ? `Loading ${scoresTabLabel(activeTab)}…`
    : switchingTabLabel
      ? switchingTabLabel.startsWith("Opening ")
        ? switchingTabLabel
        : `Opening ${switchingTabLabel}…`
      : generatingSection
        ? `Generating Group ${generatingSection} fixtures…`
        : generatingRound
          ? `Generating Round ${generatingRound.round}…`
          : generatingTop16
            ? "Generating Top 16 fixtures…"
            : clearingTop16
              ? "Clearing Top 16 fixtures…"
              : clearingSection
                ? `Clearing Group ${clearingSection} fixtures…`
                : regeneratingLoserAb
                  ? "Generating Loser AB fixtures…"
                  : regeneratingKnockout
                    ? "Rebuilding Knockout fixtures…"
                    : resetting
                      ? "Resetting round…"
                      : null;

  return (
    <div className="relative w-full space-y-5">
      {cricketBusyLabel && (
        <CricketLoader fullscreen label={cricketBusyLabel} />
      )}

      {/* Sticky: Score Updates banner + group tabs (below site navbar) */}
      <div className="sticky top-[7.25rem] z-30 -mx-4 space-y-3 border-b border-emerald-200/60 bg-gradient-to-b from-emerald-50 via-emerald-50/95 to-emerald-50/90 px-4 py-3 shadow-[0_8px_24px_rgba(15,118,110,0.06)] backdrop-blur-md md:top-16 md:-mx-6 md:px-6 dark:border-emerald-900/40 dark:from-zinc-950 dark:via-zinc-950/95 dark:to-zinc-950/90">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200/70 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 px-4 py-3 text-white shadow-md dark:border-emerald-800 sm:px-5 sm:py-4">
          <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/10" />
          <div className="relative flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                <ClipboardList size={20} />
              </span>
              <div>
                <h1 className="text-xl font-black tracking-tight sm:text-2xl">
                  Score Updates
                </h1>
                <p className="text-xs text-emerald-50/90 sm:text-sm">
                  Enter results and advance brackets
                </p>
              </div>
            </div>
            <div className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
              {["A", "B", "C"].includes(activeTab)
                ? `${activeGroupTeams.length} teams · ${tabMatchCount} matches`
                : `${tabMatchCount} ${
                    activeTab === "top8" ? "qualified" : "matches"
                  }`}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-thin">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const groupCount =
              ["A", "B", "C"].includes(tab.id)
                ? sectionTeamsByGroup[tab.id]?.length || 0
                : null;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => switchTab(tab.id, tab.label)}
                disabled={Boolean(switchingTabLabel)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold transition ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25"
                    : "border border-zinc-200 bg-white text-zinc-600 hover:border-emerald-300 hover:text-emerald-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                } disabled:opacity-60`}
              >
                <Icon size={14} />
                {tab.label}
                {groupCount !== null && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    {groupCount}
                  </span>
                )}
                {tab.id === "top8" && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    }`}
                  >
                    {top8.count || 0}/{top8.capacity || TOP_SIXTEEN}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {["A", "B", "C"].includes(activeTab) && (
        <div className="overflow-hidden rounded-2xl border border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <div className="border-b border-emerald-200/70 px-4 py-3 dark:border-emerald-900/40">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-emerald-900 dark:text-emerald-200">
                  Group {activeTab} Teams ({activeGroupTeams.length})
                </h2>
                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/70">
                  Teams assigned to this group — shown whether entry fee is paid or not
                  {activeGroupTeams.length === TEAMS_PER_SECTION
                    ? ` · Ready for Round 1 (${TEAMS_PER_SECTION / 2} matches)`
                    : ` · Need ${TEAMS_PER_SECTION} teams to generate fixtures`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {["A", "B", "C"].includes(activeTab) &&
                  matches.some(
                    (m) =>
                      ["A", "B", "C"].includes(m.section) &&
                      Number(m.round) === 1 &&
                      (m.team1 || m.team2)
                  ) && (
                    <button
                      type="button"
                      onClick={handleDownloadAllGroupsRound1}
                      className="inline-flex items-center gap-1.5 rounded-full border border-teal-300 bg-white px-3.5 py-1.5 text-[11px] font-bold text-teal-800 shadow-sm transition hover:bg-teal-50 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-200"
                      title="Group A → B → C continuous from 5:30 PM, 40 min each, no breaks"
                    >
                      <FileDown size={13} />
                      All Groups R1 PDF
                    </button>
                  )}
                {dedupedMatches.length > 0 && (
                  <button
                    type="button"
                    disabled={Boolean(clearingSection || generatingSection)}
                    onClick={() => setConfirmClearSection(activeTab)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-white px-3.5 py-1.5 text-[11px] font-bold text-rose-700 shadow-sm transition hover:bg-rose-50 disabled:opacity-50 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                  >
                    <Trash2 size={13} />
                    {clearingSection === activeTab
                      ? "Clearing…"
                      : "Clear fixtures"}
                  </button>
                )}
                {activeGroupTeams.length === TEAMS_PER_SECTION &&
                  dedupedMatches.length === 0 && (
                    <button
                      type="button"
                      disabled={Boolean(generatingSection)}
                      onClick={() => setConfirmGenerateSection(activeTab)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <Wand2
                        size={13}
                        className={
                          generatingSection === activeTab ? "animate-pulse" : ""
                        }
                      />
                      {generatingSection === activeTab
                        ? "Generating…"
                        : `Generate Group ${activeTab} fixtures`}
                    </button>
                  )}
              </div>
            </div>
          </div>
          {activeGroupTeams.length === 0 ? (
            <p className="px-4 py-5 text-sm text-zinc-500">
              No teams assigned to Group {activeTab} yet. Assign a group from Teams.
            </p>
          ) : (
            <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {activeGroupTeams.map((team, i) => {
                const paid = Number(team.entryFeePaid || 0);
                const feeLabel = team.entryFeeVerified
                  ? "Fee verified"
                  : paid > 0
                    ? `Paid Rs. ${paid.toLocaleString()}`
                    : "Fee pending";
                return (
                  <div
                    key={team._id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200/80 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                        {i + 1}. {team.name}
                      </p>
                      <p className="truncate text-[10px] text-zinc-500">
                        {team.captain?.name || "—"}
                        {team.village ? ` · ${team.village}` : ""}
                        {" · "}
                        {feeLabel}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {String(team.status || "pending").replace(/_/g, " ")}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {(activeTab === "loser_ab" || activeTab === "knockout") && (
        <div className="space-y-4">
          <div
            className={`overflow-hidden rounded-2xl border ${
              activeTab === "knockout"
                ? "border-violet-200/80 bg-violet-50/60 dark:border-violet-900/40 dark:bg-violet-950/20"
                : "border-amber-200/80 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20"
            }`}
          >
            <div
              className={`border-b px-4 py-3 ${
                activeTab === "knockout"
                  ? "border-violet-200/70 dark:border-violet-900/40"
                  : "border-amber-200/70 dark:border-amber-900/40"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2
                    className={`text-sm font-black ${
                      activeTab === "knockout"
                        ? "text-violet-900 dark:text-violet-200"
                        : "text-amber-900 dark:text-amber-200"
                    }`}
                  >
                    {activeTab === "knockout"
                      ? `Knockout Group Pool (${knockoutPoolTeams.length})`
                      : `Loser AB Pool (${
                          loserAbPoolTeams.length ||
                          loserPoolTeams.filter(
                            (t) => t.fromSection === "A" || t.fromSection === "B"
                          ).length
                        })`}
                  </h2>
                  <p
                    className={`text-[11px] ${
                      activeTab === "knockout"
                        ? "text-violet-700/80 dark:text-violet-300/70"
                        : "text-amber-700/80 dark:text-amber-300/70"
                    }`}
                  >
                    {activeTab === "knockout"
                      ? `Group C R1 losers (${KNOCKOUT_BASE_EXPECTED} fixed) + new entries (${knockoutNewEntries}) = ${knockoutPoolN || 0} total → reduce to ${KNOCKOUT_QUALIFIERS} Top 16. Pool 8+ chalega; odd count pe bye spinner.`
                      : `Group A Round 1 losers (${loserAbFromA}) + Group B Round 1 losers (${loserAbFromB}) → need ${LOSER_AB_EXPECTED} → 16→8→4→2 to Top 16`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {activeTab === "loser_ab" && (
                    <button
                      type="button"
                      disabled={regeneratingLoserAb || !loserAbCanGenerate}
                      onClick={regenerateLoserAbFixtures}
                      title={
                        loserAbCanGenerate
                          ? "Generate Loser AB fixtures from A+B Round 1 losers"
                          : `Need ${LOSER_AB_EXPECTED} A+B Round 1 losers (have ${loserAbPoolList.length})`
                      }
                      className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-700"
                    >
                      <Wand2
                        size={12}
                        className={regeneratingLoserAb ? "animate-pulse" : ""}
                      />
                      {regeneratingLoserAb
                        ? "Generating…"
                        : loserAbHasFixtures
                          ? "Rebuild fixtures"
                          : "Generate fixtures"}
                    </button>
                  )}
                  {activeTab === "knockout" && (
                    <button
                      type="button"
                      disabled={regeneratingKnockout}
                      onClick={regenerateKnockoutFixtures}
                      className="inline-flex items-center gap-1.5 rounded-full border border-violet-300 bg-white px-3 py-1.5 text-[11px] font-bold text-violet-700 transition hover:bg-violet-50 disabled:opacity-50 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-200"
                    >
                      <RefreshCw
                        size={12}
                        className={regeneratingKnockout ? "animate-spin" : ""}
                      />
                      {regeneratingKnockout ? "Rebuilding…" : "Rebuild fixtures"}
                    </button>
                  )}
                </div>
              </div>
              {activeTab === "loser_ab" && !loserAbCanGenerate && (
                <p className="mt-2 rounded-lg bg-white/70 px-2.5 py-1.5 text-[11px] font-semibold text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:ring-amber-800/50">
                  Pool: Group A losers {loserAbFromA} + Group B losers {loserAbFromB} ={" "}
                  {loserAbPoolList.length}/{LOSER_AB_EXPECTED}. Complete remaining Group A
                  & B Round 1 matches, then Generate fixtures.
                </p>
              )}
              {activeTab === "knockout" && knockoutOpeningByeOk && (
                <p className="mt-2 rounded-lg bg-violet-50 px-2.5 py-1.5 text-[11px] font-semibold text-violet-800 ring-1 ring-violet-200 dark:bg-violet-950/40 dark:text-violet-200 dark:ring-violet-800/50">
                  Odd pool ({knockoutPoolN}): Round 1 has {knockoutExpectedR1} matches
                  ({knockoutExpectedPlaying} teams).{" "}
                  {knockoutUncovered[0]?.name || "1 team"} gets opening bye → Round 2.
                </p>
              )}
              {activeTab === "knockout" && knockoutPoolMismatch && (
                <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800/50">
                  Pool has {knockoutPoolN} teams but Round 1 only covers{" "}
                  {knockoutFixtureTeamIds.size} playing slots (expected{" "}
                  {knockoutExpectedPlaying} teams / {knockoutExpectedR1} matches
                  {knockoutPoolN % 2 === 1 ? " + 1 bye" : ""}). Click{" "}
                  <span className="font-black">Rebuild fixtures</span> for the full
                  current pool.
                </p>
              )}
            </div>
            {(() => {
              const pool =
                activeTab === "knockout" ? knockoutPoolTeams : loserAbPoolList;
              if (pool.length === 0) {
                return (
                  <p className="px-4 py-5 text-sm text-zinc-500">
                    {activeTab === "loser_ab"
                      ? "No Group A / Group B Round 1 losers yet. Complete those matches first."
                      : "No Round 1 losers yet for this pool."}
                  </p>
                );
              }
              return (
                <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {pool.map((team, i) => (
                    <div
                      key={team._id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200/80 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                          {i + 1}. {team.name}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          {team.fromSection === "knockout" || !team.lostMatchNumber
                            ? "New entry · Knockout"
                            : `Lost Group ${team.fromSection} · R1 M${team.lostMatchNumber}`}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[9px] font-bold uppercase text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        Pool
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {(activeTab === "knockout" || activeTab === "loser_ab") &&
        byeSpinInfo.needsSpinner &&
        byeSpinInfo.teams?.length > 0 &&
        byeSpinInfo.section ===
          (activeTab === "loser_ab" ? "loser_ab" : "knockout") && (
          <LuckyDrawSpinner
            teams={byeSpinInfo.teams}
            onSpinComplete={handleByeSpinComplete}
            title={`Odd-team bye — Round ${byeSpinInfo.fromRound} → ${byeSpinInfo.byeRound}`}
            description={`${byeSpinInfo.teams.length} winners, but Round ${byeSpinInfo.playRound} only has ${(byeSpinInfo.teams.length - 1) / 2} matches (${byeSpinInfo.teams.length - 1} slots). Spin picks 1 team for a bye to Round ${byeSpinInfo.byeRound}; the other ${byeSpinInfo.teams.length - 1} play Round ${byeSpinInfo.playRound}.`}
            byeLabel={`Bye → R${byeSpinInfo.byeRound}`}
          />
        )}

      {activeTab === "top8" ? (
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50/80 to-white dark:border-emerald-900/50 dark:from-emerald-950/30 dark:to-zinc-950">
          {(generatingTop16 || clearingTop16) && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/85 backdrop-blur-[2px] dark:bg-zinc-950/85">
              <CricketLoader
                label={
                  clearingTop16
                    ? "Clearing Top 16 fixtures…"
                    : "Generating Top 16 fixtures…"
                }
              />
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 px-4 py-3 dark:border-emerald-900/40 sm:px-5">
            <div>
              <h2 className="font-black text-zinc-900 dark:text-white">Top 16 Pool</h2>
              <p className="text-xs text-zinc-500">
                4 from each group A/B/C + 2 Loser AB + 2 Knockout
                {hasTop16Fixtures
                  ? ` · ${finalStageMatches.length} final-stage matches live`
                  : top16PoolReady
                    ? " · Ready to generate R16 → Final"
                    : ` · Need ${TOP_SIXTEEN} qualifiers`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {hasTop16Fixtures && (
                <button
                  type="button"
                  disabled={clearingTop16 || generatingTop16}
                  onClick={() => setConfirmClearTop16(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-white px-3.5 py-1.5 text-[11px] font-bold text-rose-700 shadow-sm transition hover:bg-rose-50 disabled:opacity-50 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                >
                  <Trash2 size={13} />
                  {clearingTop16 ? "Clearing…" : "Clear fixtures"}
                </button>
              )}
              {top16PoolReady && !hasTop16Fixtures && (
                <button
                  type="button"
                  disabled={generatingTop16 || clearingTop16}
                  onClick={() => setConfirmGenerateTop16(true)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Wand2
                    size={13}
                    className={generatingTop16 ? "animate-spin" : ""}
                  />
                  {generatingTop16 ? "Generating…" : "Generate fixtures"}
                </button>
              )}
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <Users size={13} />
                {top8.count || 0}/{top8.capacity || TOP_SIXTEEN}
              </div>
            </div>
          </div>

          {(top8.teams?.length || 0) === 0 ? (
            <div className="flex flex-col items-center justify-center py-14">
              <Medal className="mb-2 text-zinc-300 dark:text-zinc-700" size={40} />
              <p className="font-medium text-zinc-500">No qualifiers yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-4 lg:grid-cols-4 lg:gap-4">
              {top8.teams.map((team, i) => {
                const groupKey =
                  team.section === "A" ||
                  team.section === "B" ||
                  team.section === "C"
                    ? team.section
                    : team.status === "qualified_loser"
                      ? team.section === "knockout"
                        ? "KO"
                        : "AB"
                      : "A";
                return (
                  <QualifierCard
                    key={team._id}
                    rank={i + 1}
                    teamName={team.name}
                    captainName={team.captain?.name || ""}
                    photoUrl={team.captain?.profilePictureUrl || ""}
                    group={groupKey}
                    wins={team.wins}
                    points={team.points}
                  />
                );
              })}
              {Array.from({ length: emptySlots }).map((_, i) => (
                <QualifierCard
                  key={`t16-empty-${i}`}
                  rank={(top8.teams?.length || 0) + i + 1}
                  empty
                  waitingLabel="Waiting…"
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {activeTab === "final" && champion && (
            <ChampionCard team={champion} runnerUp={runnerUp} score={finalScore} />
          )}

          {roundKeys.length > 0 ? (
            <>
              {roundKeys.map((roundKey) => {
              const roundLabel =
                activeTab === "loser_ab" || activeTab === "knockout"
                  ? loserRoundLabel(roundKey)
                  : `Round ${roundKey}`;
              const roundMatches = matchesByRound[roundKey] || [];
              const canReset = roundMatches.some(
                (m) =>
                  m.status === "completed" ||
                  m.status === "live" ||
                  m.winner ||
                  m.team1Score ||
                  m.team2Score
              ) || roundKeys.some(
                (rk) =>
                  Number(rk) > Number(roundKey) &&
                  (matchesByRound[rk] || []).some(
                    (m) => m.winner || m.team1 || m.team2 || m.status === "completed"
                  )
              );

              return (
              <div key={roundKey}>
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <h2 className="text-base font-black tracking-tight text-zinc-800 dark:text-zinc-100">
                    {roundLabel}
                  </h2>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {roundMatches.length} match
                    {roundMatches.length !== 1 ? "es" : ""}
                  </span>
                  <div className="h-px min-w-[2rem] flex-1 bg-gradient-to-r from-zinc-200 to-transparent dark:from-zinc-800" />
                  {roundMatches.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        handleDownloadRoundPdf(
                          activeTab,
                          roundKey,
                          roundMatches
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                      title={`PDF · first match 5:30 PM · ${MATCH_DURATION_MINUTES} min each · no breaks`}
                    >
                      <FileDown size={12} />
                      PDF
                    </button>
                  )}
                  {roundMatches.length > 0 && Number(roundKey) >= 2 && (
                    <button
                      type="button"
                      disabled={resetting || Boolean(generatingRound)}
                      onClick={() =>
                        setResetTarget({
                          section: activeTab,
                          round: Number(roundKey),
                          label: `${tabs.find((t) => t.id === activeTab)?.label || activeTab} · ${roundLabel}`,
                          deleteFixtures: true,
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-white px-3 py-1.5 text-[11px] font-bold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                      title="Delete this round's fixtures — Generate Round se dubara banenge"
                    >
                      <Trash2 size={12} />
                      Clear fixtures
                    </button>
                  )}
                  {roundMatches.length > 0 && Number(roundKey) >= 2 && (
                    <button
                      type="button"
                      disabled={Boolean(generatingRound) || resetting}
                      onClick={() =>
                        generateNextRound(activeTab, Number(roundKey))
                      }
                      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                      title="Rebuild this round from previous round winners"
                    >
                      <Wand2 size={12} />
                      {generatingRound?.round === Number(roundKey)
                        ? "Generating…"
                        : "Generate Round fixtures"}
                    </button>
                  )}
                  {roundMatches.length > 0 && (
                    <button
                      type="button"
                      disabled={resetting}
                      onClick={() =>
                        setResetTarget({
                          section: activeTab,
                          round: Number(roundKey),
                          label: `${tabs.find((t) => t.id === activeTab)?.label || activeTab} · ${roundLabel}`,
                          deleteFixtures:
                            Number(roundKey) === 1 &&
                            (activeTab === "loser_ab" ||
                              activeTab === "knockout"),
                        })
                      }
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
                        canReset
                          ? "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/70"
                          : "border-zinc-200 bg-zinc-50 text-zinc-400 hover:border-rose-200 hover:text-rose-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500"
                      }`}
                      title="Clear scores for this round (and later rounds)"
                    >
                      <RotateCcw size={12} />
                      Reset
                    </button>
                  )}
                </div>

                {roundMatches.length === 0 ? (
                  (() => {
                    const offer = getRoundGenerateOffer(Number(roundKey));
                    const prevRound = Number(roundKey) - 1;
                    const prevWinners = (matchesByRound[prevRound] || [])
                      .filter((m) => m.winner?._id)
                      .map((m) => ({
                        _id: m.winner._id,
                        name: m.winner.name,
                        captainName: m.winner.captain?.name || "",
                        photoUrl: m.winner.captain?.profilePictureUrl || "",
                        fromMatch: m.matchNumber,
                      }));

                    return (
                      <div className="rounded-2xl border-2 border-dashed border-emerald-300 bg-gradient-to-b from-emerald-50/80 to-white px-4 py-6 dark:border-emerald-800 dark:from-emerald-950/30 dark:to-zinc-950">
                        <div className="text-center">
                          <p className="text-sm font-black text-zinc-800 dark:text-zinc-100">
                            Round {prevRound > 0 ? prevRound : 1} winners → Round{" "}
                            {roundKey}
                          </p>
                          <p className="mx-auto mt-1 max-w-md text-xs text-zinc-500">
                            {offer?.ready
                              ? `${prevWinners.length} winners ready — Generate se Round ${roundKey} matches banenge.`
                              : offer?.reason ||
                                "Jese jese Round 1 jeetogi, winners yahan Winner badge ke sath dikhenge."}
                          </p>
                        </div>

                        {prevWinners.length > 0 ? (
                          <div className="mx-auto mt-5 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
                            {prevWinners.map((w, i) => (
                              <div
                                key={w._id || `${w.name}-${i}`}
                                className="rounded-2xl border border-emerald-200/80 bg-white px-2 py-3 shadow-sm dark:border-emerald-900/40 dark:bg-zinc-900"
                              >
                                <TeamAvatar
                                  name={w.name}
                                  captainName={w.captainName}
                                  photoUrl={w.photoUrl}
                                  isWinner
                                />
                                <p className="mt-1 text-center text-[9px] font-bold uppercase tracking-wide text-emerald-600">
                                  R{prevRound} M{w.fromMatch}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="mx-auto mt-5 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
                            {Array.from({
                              length:
                                ["A", "B", "C"].includes(activeTab) &&
                                Number(roundKey) === 2
                                  ? 8
                                  : 4,
                            }).map((_, i) => (
                              <div
                                key={`wait-${i}`}
                                className="flex flex-col items-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 px-2 py-4 dark:border-zinc-700 dark:bg-zinc-900/40"
                              >
                                <div className="flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-400 dark:bg-zinc-800">
                                  ?
                                </div>
                                <p className="mt-2 text-[9px] font-bold uppercase text-zinc-400">
                                  Waiting
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-5 flex flex-col items-center">
                          {offer && !offer.blocked && (
                            <button
                              type="button"
                              disabled={
                                Boolean(generatingRound) || !offer.ready
                              }
                              onClick={() =>
                                generateNextRound(offer.section, offer.round)
                              }
                              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-emerald-500/25 transition hover:bg-emerald-700 disabled:opacity-45"
                            >
                              <Wand2 size={16} />
                              {generatingRound?.round === offer.round
                                ? "Generating…"
                                : `Generate Round ${offer.round} fixtures`}
                            </button>
                          )}
                          {offer?.blocked && (
                            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                              {offer.reason}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {roundMatches.map((match) => (
                      <ScoreUpdateForm
                        key={match._id}
                        match={match}
                        updating={updating === match._id}
                        onSubmit={(form) => updateScore(match._id, form)}
                        onChangeTeams={
                          match.team1 && match.team2
                            ? () => {
                                if (match.status === "completed") {
                                  toast(
                                    "Pehle is match ko Reset karo, phir Change se teams badlo.",
                                    "error"
                                  );
                                  return;
                                }
                                setChangeTeamsMatch(match);
                              }
                            : undefined
                        }
                        onResetMatch={
                          match.team1 &&
                          match.team2 &&
                          (match.status === "completed" ||
                            match.status === "live" ||
                            match.winner ||
                            match.team1Score ||
                            match.team2Score)
                            ? () => setResetMatchTarget(match)
                            : undefined
                        }
                        resettingMatch={
                          resettingMatch &&
                          resetMatchTarget?._id === match._id
                        }
                        slot={getMatchSlot(match, roundMatches)}
                        generatingPost={generatingMatchPostId === match._id}
                        onGeneratePost={() =>
                          handleGenerateMatchPost(match, roundMatches)
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
              );
              })}

              {/* Groups A/B/C: Top 4 qualifiers (no Round 3) */}
              {["A", "B", "C"].includes(activeTab) && (
                <div className="rounded-[1.5rem] border border-emerald-200/80 bg-gradient-to-b from-emerald-50/80 via-white to-white p-4 shadow-sm sm:p-5">
                  <div className="mb-2 flex flex-wrap items-center gap-2 sm:gap-3">
                    <h2 className="text-base font-black tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-lg">
                      Group {activeTab} · Top 4
                    </h2>
                    <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                      {groupTop4.length}/{MAIN_QUALIFIERS_PER_SECTION} qualified
                    </span>
                    <div className="hidden h-px flex-1 bg-gradient-to-r from-emerald-200 to-transparent sm:block" />
                    <button
                      type="button"
                      disabled={generatingTop4 || groupTop4.length === 0}
                      onClick={handleGenerateTop4Post}
                      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 sm:ml-auto"
                    >
                      <ImageDown size={14} />
                      {generatingTop4
                        ? "Generating…"
                        : "Generate Top 4 Post"}
                    </button>
                  </div>
                  <p className="mb-4 text-xs text-zinc-500">
                    Round 2 winners advance straight to Top 16 — no Round 3.
                  </p>
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                    {groupTop4.map((team, i) => (
                      <QualifierCard
                        key={team._id}
                        rank={i + 1}
                        teamName={team.name}
                        captainName={team.captain?.name || ""}
                        photoUrl={team.captain?.profilePictureUrl || ""}
                        group={activeTab}
                        wins={team.wins}
                        points={team.points}
                      />
                    ))}
                    {Array.from({ length: groupTop4Empty }).map((_, i) => (
                      <QualifierCard
                        key={`g4-empty-${i}`}
                        rank={groupTop4.length + i + 1}
                        empty
                        group={activeTab}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Loser AB / Knockout → Top 16 qualifier cards */}
              {(activeTab === "loser_ab" || activeTab === "knockout") && (
                <div
                  className={`rounded-[1.5rem] border p-4 shadow-sm sm:p-5 ${
                    activeTab === "knockout"
                      ? "border-violet-200/80 bg-gradient-to-b from-violet-50/80 via-white to-white dark:border-violet-900/40"
                      : "border-amber-200/80 bg-gradient-to-b from-amber-50/80 via-white to-white dark:border-amber-900/40"
                  }`}
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2 sm:gap-3">
                    <h2 className="text-base font-black tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-lg">
                      {activeTab === "knockout" ? "Knockout" : "Loser AB"} · Top{" "}
                      {activeTab === "knockout"
                        ? KNOCKOUT_QUALIFIERS
                        : LOSER_AB_QUALIFIERS}{" "}
                      → Top 16
                    </h2>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white ${
                        activeTab === "knockout"
                          ? "bg-violet-600"
                          : "bg-amber-600"
                      }`}
                    >
                      {poolTopQualifiers.length}/
                      {activeTab === "knockout"
                        ? KNOCKOUT_QUALIFIERS
                        : LOSER_AB_QUALIFIERS}{" "}
                      qualified
                    </span>
                  </div>
                  <p className="mb-4 text-xs text-zinc-500">
                    {activeTab === "knockout"
                      ? "Final Knockout round winners qualify to Top 16."
                      : "Round 3 (4 → 2) winners qualify to Top 16."}
                  </p>
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-2 lg:gap-4 lg:max-w-2xl">
                    {poolTopQualifiers.map((team, i) => (
                      <QualifierCard
                        key={team._id}
                        rank={i + 1}
                        teamName={team.name}
                        captainName={team.captain?.name || ""}
                        photoUrl={team.captain?.profilePictureUrl || ""}
                        group={activeTab === "knockout" ? "KO" : "AB"}
                        wins={team.wins}
                        points={team.points}
                      />
                    ))}
                    {Array.from({ length: poolTopEmpty }).map((_, i) => (
                      <QualifierCard
                        key={`pool-empty-${i}`}
                        rank={poolTopQualifiers.length + i + 1}
                        empty
                        group={activeTab === "knockout" ? "KO" : "AB"}
                        waitingLabel={
                          activeTab === "loser_ab"
                            ? "Waiting R3"
                            : "Waiting"
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="overflow-hidden rounded-2xl border-2 border-dashed border-emerald-300 bg-gradient-to-b from-emerald-50/80 to-white dark:border-emerald-800 dark:from-emerald-950/30 dark:to-zinc-950">
              <div className="flex flex-col items-center justify-center px-4 py-10 sm:py-12">
                <Activity className="mb-2 text-emerald-400 dark:text-emerald-600" size={40} />
                <p className="font-bold text-zinc-700 dark:text-zinc-200">
                  No matches for {tabs.find((t) => t.id === activeTab)?.label}
                </p>
                {["A", "B", "C"].includes(activeTab) ? (
                  <>
                    <p className="mt-1 max-w-md text-center text-xs text-zinc-500">
                      {activeGroupTeams.length === TEAMS_PER_SECTION
                        ? `${TEAMS_PER_SECTION} teams ready — generate Round 1 (${TEAMS_PER_SECTION / 2} matches). Round 2 baad me Generate se.`
                        : activeGroupTeams.length > 0
                          ? `${activeGroupTeams.length}/${TEAMS_PER_SECTION} teams — assign ${TEAMS_PER_SECTION - activeGroupTeams.length} more to unlock generate`
                          : "Assign teams to this group from Teams page"}
                    </p>
                    {activeGroupTeams.length === TEAMS_PER_SECTION && (
                      <div className="mt-5 w-full max-w-sm rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm dark:border-emerald-900/50 dark:bg-zinc-900">
                        <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                          Generate fixtures
                        </p>
                        <p className="mb-3 text-center text-xs text-zinc-500">
                          Entry fee paid ya pending — farq nahi. Saari{" "}
                          {TEAMS_PER_SECTION} teams ke Round 1 matches banenge.
                        </p>
                        <button
                          type="button"
                          disabled={Boolean(generatingSection)}
                          onClick={() => setConfirmGenerateSection(activeTab)}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-emerald-500/25 transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <Wand2 size={16} />
                          {generatingSection === activeTab
                            ? "Generating…"
                            : `Generate Group ${activeTab} fixtures`}
                        </button>
                      </div>
                    )}
                  </>
                ) : activeTab === "loser_ab" ? (
                  <>
                    <p className="mt-1 max-w-md text-center text-xs text-zinc-500">
                      Pool = Group A Round 1 losers + Group B Round 1 losers (
                      {loserAbPoolList.length}/{LOSER_AB_EXPECTED}). Jab{" "}
                      {LOSER_AB_EXPECTED} teams ready hon, fixtures generate karo.
                    </p>
                    <button
                      type="button"
                      disabled={regeneratingLoserAb || !loserAbCanGenerate}
                      onClick={regenerateLoserAbFixtures}
                      className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-amber-500/25 transition hover:bg-amber-700 disabled:opacity-50"
                    >
                      <Wand2 size={16} />
                      {regeneratingLoserAb
                        ? "Generating…"
                        : "Generate Loser AB fixtures"}
                    </button>
                  </>
                ) : activeTab === "knockout" ? (
                  <>
                    <p className="mt-1 max-w-md text-center text-xs text-zinc-500">
                      Group C ke {KNOCKOUT_BASE_EXPECTED} R1 losers + new entries (total
                      8+) — Rebuild se Round 1. Odd winners pe bye spinner.
                    </p>
                    <button
                      type="button"
                      disabled={regeneratingKnockout}
                      onClick={regenerateKnockoutFixtures}
                      className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-violet-700 disabled:opacity-50"
                    >
                      <RefreshCw size={16} />
                      {regeneratingKnockout ? "Rebuilding…" : "Generate Knockout fixtures"}
                    </button>
                  </>
                ) : (
                  <p className="mt-1 text-xs text-zinc-400">
                    Generate fixtures after teams are registered
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(resetMatchTarget)}
        title="Reset this match?"
        message={
          resetMatchTarget
            ? `Match ${resetMatchTarget.matchNumber} ka result clear ho jayega (scores + winner). Teams same rahengi — phir Change se pairing badal sakte ho ya naya result save karo.`
            : ""
        }
        confirmText="Reset Match"
        cancelText="Cancel"
        danger
        loading={resettingMatch}
        onConfirm={confirmResetMatch}
        onCancel={() => {
          if (!resettingMatch) setResetMatchTarget(null);
        }}
      />

      <ConfirmModal
        isOpen={Boolean(resetTarget)}
        title={
          resetTarget?.deleteFixtures ? "Clear fixtures?" : "Reset round?"
        }
        message={
          resetTarget
            ? resetTarget.deleteFixtures
              ? `Round ${resetTarget.round} aur uske baad ki saari matches delete ho jayengi (${resetTarget.label}). Pehle rounds rehte hain — phir Generate Round fixtures se naye matches banenge.`
              : `Clear all scores for ${resetTarget.label} and every later round in this group. Wins/losses will be undone${
                  resetTarget.round === 1 &&
                  ["A", "B"].includes(resetTarget.section)
                    ? ". Loser AB pool matches will also be deleted (they regenerate after R1 is completed again)"
                    : resetTarget.round === 1 && resetTarget.section === "C"
                      ? ". Knockout pool matches will also be deleted (they regenerate after Group C R1 completes again)"
                      : ""
                }. This cannot be undone from here.`
            : ""
        }
        confirmText={
          resetTarget?.deleteFixtures ? "Clear fixtures" : "Reset Round"
        }
        cancelText="Cancel"
        danger
        loading={resetting}
        onConfirm={confirmResetRound}
        onCancel={() => {
          if (!resetting) setResetTarget(null);
        }}
      />

      <ConfirmModal
        isOpen={Boolean(confirmGenerateSection)}
        title={`Generate Group ${confirmGenerateSection} fixtures?`}
        message={
          confirmGenerateSection
            ? `Create Round 1 pairings for all ${TEAMS_PER_SECTION} teams in Group ${confirmGenerateSection} (${TEAMS_PER_SECTION / 2} matches). Round 2 Round 1 complete hone ke baad alag Generate se banega.`
            : ""
        }
        confirmText="Generate fixtures"
        cancelText="Cancel"
        danger={false}
        loading={Boolean(generatingSection)}
        onConfirm={confirmGenerateGroupFixtures}
        onCancel={() => {
          if (!generatingSection) setConfirmGenerateSection(null);
        }}
      />

      <ConfirmModal
        isOpen={Boolean(confirmClearSection)}
        title={`Clear Group ${confirmClearSection} fixtures?`}
        message={
          confirmClearSection
            ? `Delete all Group ${confirmClearSection} matches. Generate fixtures form will appear again so you can rebuild Round 1. This cannot be undone.`
            : ""
        }
        confirmText="Clear fixtures"
        cancelText="Cancel"
        danger
        loading={Boolean(clearingSection)}
        onConfirm={confirmClearGroupFixtures}
        onCancel={() => {
          if (!clearingSection) setConfirmClearSection(null);
        }}
      />

      <ConfirmModal
        isOpen={confirmGenerateTop16}
        title="Generate Top 16 fixtures?"
        message={`Create Round of 16 → Quarters → Semis → Final from all ${TOP_SIXTEEN} qualified teams. Matches Final Stage tab pe dikhengi.`}
        confirmText="Generate Top 16"
        cancelText="Cancel"
        danger={false}
        loading={generatingTop16}
        onConfirm={confirmGenerateTop16Fixtures}
        onCancel={() => {
          if (!generatingTop16) setConfirmGenerateTop16(false);
        }}
      />

      <ConfirmModal
        isOpen={confirmClearTop16}
        title="Clear Top 16 fixtures?"
        message="Final Stage ki saari matches delete ho jayengi (R16 → Final). Scores/wins undo honge aur teams wapas Top 16 pool mein qualified status pe aa jayengi. Phir Generate se naye fixtures banenge."
        confirmText="Clear fixtures"
        cancelText="Cancel"
        danger
        loading={clearingTop16}
        onConfirm={confirmClearTop16Fixtures}
        onCancel={() => {
          if (!clearingTop16) setConfirmClearTop16(false);
        }}
      />

      {changeTeamsMatch && (
        <ChangeMatchTeamsModal
          match={changeTeamsMatch}
          teamsByGroup={{
            A: sectionTeamsByGroup.A || [],
            B: sectionTeamsByGroup.B || [],
            C: sectionTeamsByGroup.C || [],
            knockout: knockoutPoolTeams || [],
            loser_ab: loserAbPoolTeams || [],
          }}
          onClose={() => setChangeTeamsMatch(null)}
          onSaved={async (updated, swapped) => {
            toast(
              swapped
                ? "Pairing updated — busy team was swapped with the other match."
                : "Match teams updated.",
              "success"
            );
            setChangeTeamsMatch(null);
            await fetchMatches();
            await fetchTop8();
          }}
        />
      )}
    </div>
  );
}

function QualifierCard({
  rank,
  teamName = "",
  captainName = "",
  photoUrl = "",
  group = "A",
  wins,
  points,
  empty = false,
  waitingLabel = "Waiting R2",
}) {
  const src =
    photoUrl || teamPortrait(teamName, captainName) || "/cricket_action_shot.png";

  if (empty) {
    return (
      <div className="relative flex min-h-[280px] flex-col items-center justify-center overflow-hidden rounded-[1.5rem] border border-dashed border-emerald-200 bg-gradient-to-b from-emerald-50/40 to-white px-3 py-6 sm:min-h-[320px]">
        <span
          className="mb-4 flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-white"
          style={{ background: "#94a3b8" }}
        >
          #{rank}
        </span>
        <div className="mb-4 h-24 w-24 rounded-full border-2 border-dashed border-slate-200 bg-slate-50 sm:h-28 sm:w-28" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {waitingLabel}
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[280px] flex-col overflow-hidden rounded-[1.5rem] border border-emerald-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.07)] sm:min-h-[320px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.12), transparent 55%)",
        }}
      />

      <div className="relative flex flex-1 flex-col px-3 pb-4 pt-3">
        <div className="flex items-center justify-between gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black text-white shadow-md"
            style={{ background: CARD_GREEN }}
          >
            #{rank}
          </span>
          <span
            className="rounded-md px-2 py-0.5 text-[8px] font-black uppercase tracking-wide text-white"
            style={{ background: CARD_NAVY }}
          >
            Top 16
          </span>
        </div>

        <div className="mt-2 flex flex-1 flex-col items-center text-center">
          <p
            className="text-[8px] font-bold uppercase tracking-[0.28em]"
            style={{ color: CARD_GREEN }}
          >
            Al Umer · Gala S3
          </p>
          <p
            className="mt-1 line-clamp-2 w-full px-0.5 text-[12px] font-black uppercase leading-tight tracking-wide sm:text-[13px]"
            style={{ color: CARD_NAVY }}
            title={teamName}
          >
            {teamName}
          </p>

          {/* Larger portrait + dashed rings */}
          <div className="relative mt-3 flex h-[7.5rem] w-[7.5rem] items-center justify-center sm:mt-4 sm:h-[8.75rem] sm:w-[8.75rem]">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full border-2 border-dashed border-emerald-300/70"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-2 rounded-full border border-dashed border-emerald-200/80"
            />
            <div
              className="relative h-[5.75rem] w-[5.75rem] rounded-full p-[3px] sm:h-[6.75rem] sm:w-[6.75rem]"
              style={{
                background: `linear-gradient(135deg, #86efac, ${CARD_GREEN}, #16a34a)`,
                boxShadow: "0 8px 22px rgba(34,197,94,0.32)",
              }}
            >
              <div className="h-full w-full overflow-hidden rounded-full bg-slate-100 ring-2 ring-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={captainName || teamName || "Captain"}
                  className="h-full w-full object-cover object-[center_15%]"
                />
              </div>
            </div>
          </div>

          <span
            className="mt-3 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wide text-white sm:mt-3.5"
            style={{ background: CARD_GREEN }}
          >
            Qualified
          </span>

          {captainName ? (
            <p
              className="mt-2 w-full truncate text-[11px] font-bold uppercase tracking-wide"
              style={{ color: CARD_NAVY }}
            >
              {captainName}
              <span className="ml-1 font-semibold text-slate-400">(C)</span>
            </p>
          ) : (
            <p className="mt-2 text-[10px] font-medium text-slate-400">
              Captain TBA
            </p>
          )}

          <div className="mt-auto flex flex-wrap items-center justify-center gap-1.5 pt-3">
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100">
              {group === "AB"
                ? "Loser AB"
                : group === "KO"
                  ? "Knockout"
                  : `Group ${group}`}
            </span>
            {(wins != null || points != null) && (
              <span className="rounded-full bg-slate-50 px-2 py-0.5 font-mono text-[9px] font-bold text-slate-600 ring-1 ring-slate-200">
                {wins ?? 0}W · {points ?? 0}pts
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreUpdateForm({
  match,
  updating,
  onSubmit,
  onChangeTeams,
  onResetMatch,
  resettingMatch,
  slot,
  generatingPost,
  onGeneratePost,
}) {
  const [team1Score, setTeam1Score] = useState(match.team1Score || "");
  const [team2Score, setTeam2Score] = useState(match.team2Score || "");
  const [winnerId, setWinnerId] = useState(match.winner?._id || "");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setTeam1Score(match.team1Score || "");
    setTeam2Score(match.team2Score || "");
    setWinnerId(match.winner?._id || "");
    setEditing(false);
  }, [
    match._id,
    match.status,
    match.winner?._id,
    match.team1Score,
    match.team2Score,
  ]);

  const t1Name = match.team1?.name || "TBD";
  const t2Name = match.team2?.name || "TBD";
  const t1Captain = match.team1?.captain?.name || "";
  const t2Captain = match.team2?.captain?.name || "";
  const t1Photo = match.team1?.captain?.profilePictureUrl || "";
  const t2Photo = match.team2?.captain?.profilePictureUrl || "";
  const ready = Boolean(match.team1 && match.team2);
  const isCompleted = match.status === "completed";
  const isEditing = Boolean(editing && isCompleted);
  const canPickWinner = ready && (!isCompleted || isEditing);
  const metaLine =
    formatMatchDateTime(match.scheduledAt) ||
    `${sectionLabelFallback(match)} · Round ${match.round} · Match ${match.matchNumber}`;

  const displayWinnerId = isEditing ? winnerId : match.winner?._id || winnerId;

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-[1.35rem] border bg-white shadow-[0_10px_32px_rgba(15,23,42,0.07)] ${
        isCompleted
          ? "border-emerald-300"
          : ready
            ? "border-slate-200"
            : "border-dashed border-slate-300 opacity-90"
      }`}
    >
      {/* Left accent + soft mint wash — makes round cards distinct from Top 4 */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ background: CARD_GREEN }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(236,253,245,0.9) 0%, rgba(255,255,255,0.4) 42%, #ffffff 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-24 w-24 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle, #94a3b8 1px, transparent 1.2px)",
          backgroundSize: "9px 9px",
          maskImage: "radial-gradient(circle at 100% 0, black 20%, transparent 70%)",
        }}
      />

      <div className="relative px-2.5 pb-3 pt-3 pl-3.5 sm:px-4 sm:pl-5 sm:pt-4">
        {/* Time row — full width so badges don't overlap chips */}
        {(slot?.startLabel || slot?.endLabel) && (
          <div className="mb-2 flex items-center justify-between gap-2">
            {slot?.startLabel ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-400 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-zinc-900 shadow-sm sm:px-2.5">
                <Clock size={10} />
                {slot.startLabel}
              </span>
            ) : (
              <span />
            )}
            {slot?.endLabel ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sky-700 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-white shadow-sm sm:px-2.5">
                <Clock size={10} />
                {slot.endLabel}
              </span>
            ) : (
              <span />
            )}
          </div>
        )}

        <div className="mb-2.5 flex flex-wrap items-center justify-center gap-1.5 sm:mb-3 sm:gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wide text-white"
            style={{ background: CARD_GREEN }}
          >
            Round {match.round}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-slate-500">
            Match {match.matchNumber}
          </span>
          {onChangeTeams && (
            <button
              type="button"
              onClick={onChangeTeams}
              className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-emerald-700 shadow-sm transition hover:bg-emerald-50"
              title={
                match.status === "completed"
                  ? "Reset match first, then change teams"
                  : "Change teams / fix pairing"
              }
            >
              <ArrowLeftRight size={10} />
              Change
            </button>
          )}
          {onResetMatch && (
            <button
              type="button"
              disabled={Boolean(resettingMatch)}
              onClick={onResetMatch}
              className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-amber-800 shadow-sm transition hover:bg-amber-100 disabled:opacity-50"
              title="Clear this match result (keep teams)"
            >
              <RotateCcw size={10} />
              {resettingMatch ? "…" : "Reset"}
            </button>
          )}
          {onGeneratePost && match.team1 && match.team2 && (
            <button
              type="button"
              disabled={generatingPost}
              onClick={onGeneratePost}
              className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-violet-700 shadow-sm transition hover:bg-violet-100 disabled:opacity-50"
              title="Download VS match post"
            >
              <ImageDown size={10} />
              {generatingPost ? "…" : "Post"}
            </button>
          )}
          {match.team1 && match.team2 && match.status !== "completed" && (
            <Link
              href={`/admin/scores/live/${match._id}`}
              className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-rose-700 shadow-sm transition hover:bg-rose-100"
              title="Ball-by-ball live scorer + OBS overlay"
            >
              <Radio size={10} />
              {match.status === "live" ? "Scoring" : "Live"}
            </Link>
          )}
        </div>

        <div className="text-center">
          <p
            className="text-[12px] font-black uppercase tracking-[0.04em] sm:text-[14px] sm:tracking-[0.06em]"
            style={{ color: CARD_NAVY }}
          >
            Al Umer Electronics
          </p>
          <p
            className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.2em] sm:text-[10px] sm:tracking-[0.28em]"
            style={{ color: CARD_GREEN }}
          >
            Sports Gala S3
          </p>
        </div>

        <div className="relative mx-auto mt-4 grid w-full max-w-xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-x-3 gap-y-0 sm:mt-5 sm:gap-x-6">
          {/* Row 1 — team names (fixed height) */}
          <MatchupTeamName name={t1Name} />
          <div aria-hidden className="w-11 sm:w-16" />
          <MatchupTeamName name={t2Name} />

          {/* Row 2 — photos + VS (same baseline) */}
          <MatchupPhoto
            name={t1Name}
            captainName={t1Captain}
            photoUrl={t1Photo}
            isWinner={Boolean(
              displayWinnerId &&
                match.team1?._id &&
                displayWinnerId === match.team1._id
            )}
            selected={canPickWinner && winnerId === match.team1?._id}
            onSelect={
              canPickWinner && match.team1
                ? () => setWinnerId(match.team1._id)
                : undefined
            }
          />
          <div className="flex w-11 items-center justify-center self-center sm:w-16">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(15,23,42,0.12)] ring-1 ring-slate-100 sm:h-16 sm:w-16">
              <span
                className="text-xs font-black tracking-tight sm:text-xl"
                style={{ color: CARD_GREEN }}
              >
                VS
              </span>
            </div>
          </div>
          <MatchupPhoto
            name={t2Name}
            captainName={t2Captain}
            photoUrl={t2Photo}
            isWinner={Boolean(
              displayWinnerId &&
                match.team2?._id &&
                displayWinnerId === match.team2._id
            )}
            selected={canPickWinner && winnerId === match.team2?._id}
            onSelect={
              canPickWinner && match.team2
                ? () => setWinnerId(match.team2._id)
                : undefined
            }
          />

          {/* Row 3 — captain pills (fixed height, same line) */}
          <MatchupCaptain
            name={t1Name}
            captainName={t1Captain}
            isTbd={!match.team1}
            onSelect={
              canPickWinner && match.team1
                ? () => setWinnerId(match.team1._id)
                : undefined
            }
          />
          <div aria-hidden className="w-11 sm:w-16" />
          <MatchupCaptain
            name={t2Name}
            captainName={t2Captain}
            isTbd={!match.team2}
            onSelect={
              canPickWinner && match.team2
                ? () => setWinnerId(match.team2._id)
                : undefined
            }
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 px-0.5 sm:mt-4">
          <CalendarClock size={12} className="shrink-0" style={{ color: CARD_GREEN }} />
          <p
            className="max-w-full text-center text-[10px] font-semibold tracking-wide sm:text-[11px]"
            style={{ color: CARD_NAVY }}
          >
            {metaLine}
          </p>
          <span className="text-[11px] font-semibold" style={{ color: CARD_MUTED }}>
            ·
          </span>
          <StatusBadge
            status={match.status}
            ready={ready}
            isCompleted={isCompleted}
          />
        </div>
      </div>

      <div className="relative px-3 pb-4 pt-1 sm:px-4">
        {isCompleted && !isEditing ? (
          <div className="space-y-2">
            {/* Saved scores on card */}
            <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 px-2 py-2 ring-1 ring-slate-200">
              <div className="min-w-0 flex-1 text-center">
                <p className="line-clamp-2 break-words text-[9px] font-bold uppercase leading-tight text-slate-400">
                  {t1Name}
                </p>
                <p
                  className="text-base font-black tabular-nums"
                  style={{ color: CARD_NAVY }}
                >
                  {match.team1Score || "—"}
                </p>
              </div>
              <span className="shrink-0 text-xs font-bold text-slate-300">vs</span>
              <div className="min-w-0 flex-1 text-center">
                <p className="line-clamp-2 break-words text-[9px] font-bold uppercase leading-tight text-slate-400">
                  {t2Name}
                </p>
                <p
                  className="text-base font-black tabular-nums"
                  style={{ color: CARD_NAVY }}
                >
                  {match.team2Score || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 ring-1 ring-emerald-200">
              <Trophy size={14} className="shrink-0" style={{ color: CARD_GREEN }} />
              <p className="min-w-0 break-words text-center text-xs font-bold" style={{ color: CARD_NAVY }}>
                Winner: {match.winner?.name || "—"}
              </p>
            </div>
            <button
              type="button"
              disabled={updating}
              onClick={() => {
                setTeam1Score(match.team1Score || "");
                setTeam2Score(match.team2Score || "");
                setWinnerId(match.winner?._id || "");
                setEditing(true);
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <Pencil size={13} />
              Change winner / edit result
            </button>
          </div>
        ) : ready && (!isCompleted || isEditing) ? (
          <div className="space-y-2.5">
            {isEditing && (
              <p className="rounded-xl bg-emerald-50 px-2.5 py-1.5 text-center text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                Editing — tap correct winner, update scores, then save
              </p>
            )}

            <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2 sm:items-center sm:gap-2.5">
              <ScoreField
                label={t1Name}
                value={team1Score}
                onChange={setTeam1Score}
                active={winnerId === match.team1?._id}
              />
              <div className="flex flex-col items-center gap-0.5 px-0.5 pt-1 sm:pt-0">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 ring-1 ring-slate-200">
                  <ShieldPlus size={13} className="text-slate-400" />
                </div>
                <p className="w-12 text-center text-[8px] font-medium leading-tight text-slate-400 sm:w-14">
                  {winnerId
                    ? isEditing
                      ? "Save"
                      : "Picked"
                    : "Pick winner"}
                </p>
              </div>
              <ScoreField
                label={t2Name}
                value={team2Score}
                onChange={setTeam2Score}
                active={winnerId === match.team2?._id}
              />
            </div>

            <div className={`grid gap-2 ${isEditing ? "grid-cols-2" : "grid-cols-1"}`}>
              {isEditing && (
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => {
                    setTeam1Score(match.team1Score || "");
                    setTeam2Score(match.team2Score || "");
                    setWinnerId(match.winner?._id || "");
                    setEditing(false);
                  }}
                  className="rounded-full border border-slate-200 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  onSubmit({
                    team1Score,
                    team2Score,
                    team1Runs: 0,
                    team2Runs: 0,
                    winnerId,
                    status: "completed",
                  })
                }
                disabled={updating || !winnerId}
                className="flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(34,197,94,0.35)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
                style={{ background: CARD_GREEN }}
              >
                {updating ? (
                  "Saving…"
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    {isEditing ? "Save correction" : "Save Result"}
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/80 px-3 py-2.5 text-center text-xs text-amber-800">
            Waiting for teams to advance…
          </p>
        )}
      </div>
    </div>
  );
}

function ScoreField({ label, value, onChange, active }) {
  return (
    <div
      className={`min-w-0 rounded-xl bg-white px-2 py-2 transition sm:px-2.5 ${
        active
          ? "shadow-[0_0_0_1.5px_rgba(34,197,94,0.5)]"
          : "shadow-[inset_0_0_0_1px_#e2e8f0]"
      }`}
    >
      <p
        className="mb-1 line-clamp-2 break-words text-center text-[9px] font-bold uppercase leading-tight tracking-wide sm:text-[10px]"
        style={{ color: CARD_MUTED }}
        title={label}
      >
        {label}
      </p>
      <input
        placeholder="0/0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent py-0.5 text-center text-base font-black tabular-nums outline-none placeholder:text-slate-300 sm:text-sm"
        style={{ color: CARD_NAVY }}
      />
    </div>
  );
}

function sectionLabelFallback(match) {
  if (match.section === "loser_ab") return "Loser AB";
  if (match.section === "knockout") return "Knockout";
  if (match.section === "loser") return "Loser Pool";
  if (match.section === "final") return "Finals";
  return `Group ${match.section}`;
}

function MatchupTeamName({ name }) {
  const isTbd = !name || name === "TBD";
  return (
    <p
      className={`mb-1.5 flex h-[2.1rem] min-w-0 items-end justify-center overflow-hidden px-1 text-center text-[9px] font-black uppercase leading-tight tracking-wide line-clamp-2 break-words sm:mb-2 sm:h-[2.6rem] sm:px-1.5 sm:text-[12px] ${
        isTbd ? "italic text-slate-300" : ""
      }`}
      style={{ color: isTbd ? undefined : CARD_NAVY }}
      title={name}
    >
      {name}
    </p>
  );
}

function MatchupPhoto({
  name,
  captainName,
  photoUrl = "",
  isWinner,
  selected,
  onSelect,
}) {
  const Comp = onSelect ? "button" : "div";
  const isTbd = !name || name === "TBD";
  const src = isTbd
    ? ""
    : photoUrl || teamPortrait(name, captainName) || "/cricket_action_shot.png";
  const showWin = !isTbd && Boolean(isWinner || selected);

  return (
    <Comp
      type={onSelect ? "button" : undefined}
      onClick={onSelect}
      className={`relative mx-auto flex h-[4.25rem] w-full min-w-0 max-w-full items-center justify-center overflow-hidden sm:h-[6.5rem] ${
        onSelect ? "cursor-pointer" : ""
      }`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[5.5rem] w-[5.5rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-slate-200 sm:h-[8.25rem] sm:w-[8.25rem]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[4.75rem] w-[4.75rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-slate-100 sm:h-[7.2rem] sm:w-[7.2rem]"
      />
      <div
        className="relative h-[4.25rem] w-[4.25rem] shrink-0 rounded-full p-[2.5px] sm:h-[6.5rem] sm:w-[6.5rem] sm:p-[3.5px]"
        style={{
          background: showWin
            ? `linear-gradient(135deg, #86efac, ${CARD_GREEN}, #16a34a)`
            : `linear-gradient(135deg, #bbf7d0, ${CARD_GREEN})`,
          boxShadow: showWin
            ? `0 0 0 3px rgba(34,197,94,0.15), 0 8px 18px rgba(34,197,94,0.35)`
            : `0 6px 16px rgba(34,197,94,0.22)`,
        }}
      >
        <div
          className={`h-full w-full overflow-hidden rounded-full bg-slate-100 ring-2 ring-white ${
            isTbd ? "bg-slate-200" : ""
          }`}
        >
          {!isTbd && src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={captainName || name || "Captain"}
              className="h-full w-full object-cover object-[center_15%]"
            />
          ) : null}
        </div>
      </div>
      {showWin && (
        <span
          className="absolute right-0.5 top-0 z-10 rounded-full px-1 py-0.5 text-[6px] font-black uppercase text-white shadow sm:right-1 sm:px-1.5 sm:text-[8px]"
          style={{ background: CARD_GREEN }}
        >
          {isWinner ? "Winner" : "Win"}
        </span>
      )}
    </Comp>
  );
}

function MatchupCaptain({ name, captainName, isTbd, onSelect }) {
  const Comp = onSelect ? "button" : "div";
  const captainLabel = captainName || (isTbd ? "TBA" : name);
  return (
    <Comp
      type={onSelect ? "button" : undefined}
      onClick={onSelect}
      className={`mt-2 flex h-[2.15rem] w-full min-w-0 items-center justify-center px-0.5 sm:mt-2.5 sm:h-[2.4rem] ${
        onSelect ? "cursor-pointer" : ""
      }`}
    >
      <span
        className="line-clamp-2 w-full max-w-full break-words rounded-full px-1.5 py-1 text-center text-[8px] font-bold uppercase leading-tight tracking-wide text-white shadow-sm sm:max-w-[9.5rem] sm:px-3 sm:text-[10px]"
        style={{ background: isTbd ? "#94a3b8" : CARD_GREEN }}
        title={captainLabel}
      >
        {captainLabel}
      </span>
    </Comp>
  );
}

function TeamAvatar({ name, captainName, photoUrl = "", isWinner, selected, onSelect }) {
  // Kept for any leftover callers — same locked layout
  const isTbd = !name || name === "TBD";
  return (
    <div className="grid w-full min-w-0 grid-rows-[auto_auto_auto] justify-items-stretch">
      <MatchupTeamName name={name} />
      <MatchupPhoto
        name={name}
        captainName={captainName}
        photoUrl={photoUrl}
        isWinner={isWinner}
        selected={selected}
        onSelect={onSelect}
      />
      <MatchupCaptain
        name={name}
        captainName={captainName}
        isTbd={isTbd}
        onSelect={onSelect}
      />
    </div>
  );
}

function StatusBadge({ status, ready, isCompleted }) {
  if (!ready) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[11px] font-bold"
        style={{ color: "#f59e0b" }}
      >
        Waiting
      </span>
    );
  }
  if (isCompleted) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[11px] font-bold"
        style={{ color: CARD_GREEN }}
      >
        <CheckCircle2 size={12} /> Done
      </span>
    );
  }
  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-500">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-500" />
        </span>
        LIVE
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-bold"
      style={{ color: CARD_GREEN }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: CARD_GREEN }}
      />
      Scheduled
    </span>
  );
}
