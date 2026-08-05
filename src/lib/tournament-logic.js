/**
 * Tournament structure (Season 3):
 * 48 teams → Groups A, B, C × 16
 *
 * Group main:
 *   R1: 16 → 8
 *   R2: 8 → 4 qualifiers each → Top 16
 *
 * After A+B Round 1 complete:
 *   Loser AB: 16 R1 losers (A+B) → 16→8→4→2 → 2 to Top 16
 *
 * After C Round 1 complete:
 *   Knockout Group: 8 C R1 losers (+ optional new-entry teams)
 *   → reduce to 2 → Top 16
 *
 * Top 16: 4+4+4+2+2 = 16
 *   R16 → QF → SF → Final
 */

export const SECTIONS = ["A", "B", "C"];
export const TEAMS_PER_SECTION = 16;
export const TOTAL_TEAMS = 48;
export const MAIN_QUALIFIERS_PER_SECTION = 4;
export const LOSER_AB_EXPECTED = 16; // A+B R1 losers
export const LOSER_AB_QUALIFIERS = 2;
export const KNOCKOUT_BASE_EXPECTED = 8; // C R1 losers
export const KNOCKOUT_QUALIFIERS = 2;
export const LOSER_QUALIFIERS = LOSER_AB_QUALIFIERS + KNOCKOUT_QUALIFIERS; // 4 total
export const TOP_SIXTEEN = 16;
/** @deprecated use TOP_SIXTEEN — kept as alias for older imports */
export const FINAL_EIGHT = TOP_SIXTEEN;

export const SECTION_LOSER_AB = "loser_ab";
export const SECTION_KNOCKOUT = "knockout";
export const SECTION_FINAL = "final";

/**
 * Teams after the main 48 (A/B/C) go into Knockout as new entries.
 * @param {number} existingTeamCount
 * @param {string} [requestedSection]
 */
export function resolveTeamSection(existingTeamCount, requestedSection) {
  const requested = String(requestedSection || "").trim();
  if (requested && requested !== "unassigned") {
    return {
      section: requested,
      newEntry: requested === SECTION_KNOCKOUT,
    };
  }
  if (Number(existingTeamCount) >= TOTAL_TEAMS) {
    return { section: SECTION_KNOCKOUT, newEntry: true };
  }
  return { section: "unassigned", newEntry: false };
}

export const MAIN_PLAYERS = 0;
export const RESERVED_PLAYERS = 0;
export const ADDITIONAL_MAIN_PLAYERS = 0;
export const TOTAL_PLAYER_SLOTS = 0;
export const TOTAL_SQUAD = 0;
export const TOTAL_PLAYERS = 0;

export function getSquadCounts(players = []) {
  const addedMain = players.filter((p) => p.role === "main").length;
  const reserved = players.filter((p) => p.role === "reserved").length;

  return {
    addedMain,
    reserved,
    displayMain: addedMain + 1,
    displayTotal: players.length + 1,
    isSquadComplete:
      addedMain >= ADDITIONAL_MAIN_PLAYERS && reserved >= RESERVED_PLAYERS,
  };
}

export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function assignTeamsToSections(teams) {
  if (teams.length !== TOTAL_TEAMS) {
    throw new Error(`Expected ${TOTAL_TEAMS} teams, got ${teams.length}`);
  }
  const shuffled = shuffleArray(teams);
  const assignments = {};
  SECTIONS.forEach((section, idx) => {
    assignments[section] = shuffled.slice(
      idx * TEAMS_PER_SECTION,
      (idx + 1) * TEAMS_PER_SECTION
    );
  });
  return assignments;
}

export function generateKnockoutPairings(teams) {
  const pairings = [];
  for (let i = 0; i < teams.length; i += 2) {
    if (teams[i + 1]) {
      pairings.push({ team1: teams[i], team2: teams[i + 1] });
    }
  }
  return pairings;
}

export function buildSectionFixtures(sectionTeams, section) {
  const matches = [];
  const round1Pairings = generateKnockoutPairings(sectionTeams);

  round1Pairings.forEach((pair, idx) => {
    matches.push({
      section,
      bracketType: "main",
      round: 1,
      matchNumber: idx + 1,
      team1Id: pair.team1._id,
      team2Id: pair.team2._id,
      sendLoserToBracket: true,
      qualifies: round1Pairings.length === MAIN_QUALIFIERS_PER_SECTION,
    });
  });

  let currentRoundMatches = round1Pairings.length;
  let currentRound = 1;

  while (currentRoundMatches > MAIN_QUALIFIERS_PER_SECTION) {
    currentRound++;
    currentRoundMatches = currentRoundMatches / 2;
    for (let i = 0; i < currentRoundMatches; i++) {
      matches.push({
        section,
        bracketType: "main",
        round: currentRound,
        matchNumber: i + 1,
        team1Id: null,
        team2Id: null,
        placeholder: true,
        qualifies: currentRoundMatches === MAIN_QUALIFIERS_PER_SECTION,
      });
    }
  }

  return matches;
}

/**
 * Generic knockout pool: pair teams each round until `qualifiers` winners remain.
 * Odd counts get a bye — leftover team is seeded into Round 2 Match 1.
 */
export function buildReduceToQualifiersFixtures(
  teamIds,
  { section, bracketType = "loser", qualifiers = 2 }
) {
  if (!Array.isArray(teamIds) || teamIds.length < qualifiers) {
    throw new Error(
      `Expected at least ${qualifiers} teams for ${section}, got ${teamIds?.length ?? 0}`
    );
  }
  if (teamIds.length === qualifiers) {
    return [];
  }

  const matches = [];
  const shuffled = shuffleArray([...teamIds].filter(Boolean));
  let round = 1;
  let remaining = shuffled.length;

  // Round 1 with assigned teams
  const r1Count = Math.floor(remaining / 2);
  for (let i = 0; i < r1Count; i++) {
    matches.push({
      section,
      bracketType,
      round: 1,
      matchNumber: i + 1,
      team1Id: shuffled[i * 2],
      team2Id: shuffled[i * 2 + 1],
    });
  }

  // Odd team gets a bye into Round 2
  const byeTeamId = remaining % 2 === 1 ? shuffled[remaining - 1] : null;
  remaining = r1Count + (byeTeamId ? 1 : 0);

  while (remaining > qualifiers) {
    round++;
    const matchCount = Math.floor(remaining / 2);
    for (let i = 0; i < matchCount; i++) {
      const fixture = {
        section,
        bracketType,
        round,
        matchNumber: i + 1,
        team1Id: null,
        team2Id: null,
        placeholder: true,
      };
      // Seed bye into first slot of Round 2 Match 1
      if (round === 2 && i === 0 && byeTeamId) {
        fixture.team1Id = byeTeamId;
      }
      matches.push(fixture);
    }
    remaining = matchCount + (remaining % 2);
  }

  return matches;
}

/** Loser AB: 16 teams from Group A+B R1 losers → 2 qualifiers */
export function buildLoserAbFixtures(loserTeamIds) {
  if (loserTeamIds.length !== LOSER_AB_EXPECTED) {
    throw new Error(
      `Expected ${LOSER_AB_EXPECTED} Loser AB teams, got ${loserTeamIds.length}`
    );
  }
  return buildReduceToQualifiersFixtures(loserTeamIds, {
    section: SECTION_LOSER_AB,
    bracketType: "loser",
    qualifiers: LOSER_AB_QUALIFIERS,
  });
}

/**
 * Knockout Group: Group C R1 losers (8) + optional new-entry team ids → 2 qualifiers
 */
export function buildKnockoutGroupFixtures(teamIds) {
  if (teamIds.length < KNOCKOUT_QUALIFIERS) {
    throw new Error(
      `Expected at least ${KNOCKOUT_QUALIFIERS} Knockout teams, got ${teamIds.length}`
    );
  }
  return buildReduceToQualifiersFixtures(teamIds, {
    section: SECTION_KNOCKOUT,
    bracketType: "loser",
    qualifiers: KNOCKOUT_QUALIFIERS,
  });
}

/** @deprecated use buildLoserAbFixtures — kept for older callers expecting 24 */
export function buildLoserBracketFixtures(loserTeamIds) {
  if (loserTeamIds.length === LOSER_AB_EXPECTED) {
    return buildLoserAbFixtures(loserTeamIds);
  }
  return buildReduceToQualifiersFixtures(loserTeamIds, {
    section: "loser",
    bracketType: "loser",
    qualifiers: 2,
  });
}

export function buildTopSixteenFixtures(qualifiedTeamIds) {
  if (qualifiedTeamIds.length !== TOP_SIXTEEN) {
    throw new Error(
      `Expected ${TOP_SIXTEEN} teams for Top 16, got ${qualifiedTeamIds.length}`
    );
  }

  const shuffled = shuffleArray(qualifiedTeamIds);
  const matches = [];

  // Round of 16
  for (let i = 0; i < 8; i++) {
    matches.push({
      section: SECTION_FINAL,
      bracketType: "round16",
      round: 1,
      matchNumber: i + 1,
      team1Id: shuffled[i * 2],
      team2Id: shuffled[i * 2 + 1],
    });
  }

  // Quarter finals
  for (let i = 0; i < 4; i++) {
    matches.push({
      section: SECTION_FINAL,
      bracketType: "quarter",
      round: 2,
      matchNumber: i + 1,
      team1Id: null,
      team2Id: null,
      placeholder: true,
    });
  }

  // Semi finals
  for (let i = 0; i < 2; i++) {
    matches.push({
      section: SECTION_FINAL,
      bracketType: "semi",
      round: 3,
      matchNumber: i + 1,
      team1Id: null,
      team2Id: null,
      placeholder: true,
    });
  }

  // Final
  matches.push({
    section: SECTION_FINAL,
    bracketType: "final",
    round: 4,
    matchNumber: 1,
    team1Id: null,
    team2Id: null,
    placeholder: true,
  });

  return matches;
}

/** @deprecated use buildTopSixteenFixtures */
export function buildFinalEightFixtures(qualifiedTeamIds) {
  return buildTopSixteenFixtures(qualifiedTeamIds);
}

export function getNextMainMatchQuery(_section, round, matchNumber) {
  const teamsEntering = TEAMS_PER_SECTION / 2 ** (round - 1);
  const winnersFromRound = teamsEntering / 2;
  if (winnersFromRound > MAIN_QUALIFIERS_PER_SECTION) {
    return { round: round + 1, matchNumber: Math.ceil(matchNumber / 2) };
  }
  return null; // this round's winners qualify to Top 16
}

/** Next match inside a reduce-to-N pool (even sizes assumed for wiring). */
export function getPoolNextMatch(round, matchNumber, startingSize, qualifiers = 2) {
  let size = startingSize;
  let r = 1;
  while (size > qualifiers) {
    const matchCount = Math.floor(size / 2);
    if (r === round) {
      const nextSize = matchCount + (size % 2);
      if (nextSize <= qualifiers) return null;
      return { round: round + 1, matchNumber: Math.ceil(matchNumber / 2) };
    }
    size = matchCount + (size % 2);
    r++;
  }
  return null;
}

export function getLoserAbNextMatch(round, matchNumber) {
  return getPoolNextMatch(round, matchNumber, LOSER_AB_EXPECTED, LOSER_AB_QUALIFIERS);
}

export function getKnockoutNextMatch(round, matchNumber, startingSize = KNOCKOUT_BASE_EXPECTED) {
  return getPoolNextMatch(round, matchNumber, startingSize, KNOCKOUT_QUALIFIERS);
}

/** @deprecated legacy single loser pool (24→2 via lucky draw path) */
export function getLoserNextMatch(round, matchNumber) {
  // Prefer Loser AB wiring when called without section
  return getLoserAbNextMatch(round, matchNumber);
}

export function getFinalNextMatch(bracketType, matchNumber) {
  if (bracketType === "round16") {
    return {
      bracketType: "quarter",
      round: 2,
      matchNumber: Math.ceil(matchNumber / 2),
    };
  }
  if (bracketType === "quarter") {
    return {
      bracketType: "semi",
      round: 3,
      matchNumber: Math.ceil(matchNumber / 2),
    };
  }
  if (bracketType === "semi") {
    return { bracketType: "final", round: 4, matchNumber: 1 };
  }
  return null;
}

export function isLoserPoolSection(section) {
  return section === SECTION_LOSER_AB || section === SECTION_KNOCKOUT || section === "loser";
}

/**
 * Odd pool round: W winners but next round only has W-1 slots (N matches × 2).
 * One team needs a spinner bye into the round after next.
 */
export function poolRoundNeedsByeSpin(winnerCount, nextRoundMatchCount) {
  if (!nextRoundMatchCount || winnerCount < 1) return false;
  const slots = nextRoundMatchCount * 2;
  return winnerCount === slots + 1;
}
