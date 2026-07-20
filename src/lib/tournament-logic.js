/**
 * Tournament structure:
 * 48 teams -> 3 groups (A,B,C) x 16 teams
 * Group R1: 16 -> 8 (8 losers to loser bracket)
 * Group R2: 8 -> 4
 * Group R3: 4 -> 2 qualifiers
 * Loser bracket: 24 teams
 *   R1: 12 matches (24 -> 12)
 *   R2: 6 matches  (12 -> 6)
 *   R3: 3 matches  (6 -> 3)
 *   Lucky draw among final 3: 1 bye to Super 8; other 2 play; winner also to Super 8
 * Final / Super 8: 8 teams (quarter -> semi -> final)
 */

export const SECTIONS = ["A", "B", "C"];
export const TEAMS_PER_SECTION = 16;
export const TOTAL_TEAMS = 48;
export const MAIN_QUALIFIERS_PER_SECTION = 2; // 2 winners from round 3
export const LOSER_QUALIFIERS = 2; 
export const FINAL_EIGHT = 8; // Quarter finals

// Squads have been removed; captain registers the team alone
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
    assignments[section] = shuffled.slice(idx * TEAMS_PER_SECTION, (idx + 1) * TEAMS_PER_SECTION);
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
  let round1Pairings = generateKnockoutPairings(sectionTeams);

  // Round 1
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

export function buildLoserBracketFixtures(loserTeamIds) {
  if (loserTeamIds.length !== 24) {
    throw new Error(`Expected 24 loser bracket teams, got ${loserTeamIds.length}`);
  }

  const matches = [];
  const shuffled = shuffleArray(loserTeamIds);

  // Round 1: 12 matches (24 -> 12)
  for (let i = 0; i < 12; i++) {
    matches.push({
      section: "loser",
      bracketType: "loser",
      round: 1,
      matchNumber: i + 1,
      team1Id: shuffled[i * 2],
      team2Id: shuffled[i * 2 + 1],
    });
  }

  // Round 2: 6 matches (12 -> 6)
  for (let i = 0; i < 6; i++) {
    matches.push({
      section: "loser",
      bracketType: "loser",
      round: 2,
      matchNumber: i + 1,
      team1Id: null,
      team2Id: null,
      placeholder: true,
    });
  }

  // Round 3: 3 matches (6 -> 3)
  for (let i = 0; i < 3; i++) {
    matches.push({
      section: "loser",
      bracketType: "loser",
      round: 3,
      matchNumber: i + 1,
      team1Id: null,
      team2Id: null,
      placeholder: true,
    });
  }

  return matches;
}

export function buildFinalEightFixtures(qualifiedTeamIds) {
  if (qualifiedTeamIds.length !== FINAL_EIGHT) {
    throw new Error(`Expected ${FINAL_EIGHT} teams for final stage, got ${qualifiedTeamIds.length}`);
  }

  const shuffled = shuffleArray(qualifiedTeamIds);
  const matches = [];

  // Quarter finals
  for (let i = 0; i < 4; i++) {
    matches.push({
      section: "final",
      bracketType: "quarter",
      round: 1,
      matchNumber: i + 1,
      team1Id: shuffled[i * 2],
      team2Id: shuffled[i * 2 + 1],
    });
  }

  // Semi finals
  for (let i = 0; i < 2; i++) {
    matches.push({
      section: "final",
      bracketType: "semi",
      round: 2,
      matchNumber: i + 1,
      team1Id: null,
      team2Id: null,
      placeholder: true,
    });
  }

  // Final
  matches.push({
    section: "final",
    bracketType: "final",
    round: 3,
    matchNumber: 1,
    team1Id: null,
    team2Id: null,
    placeholder: true,
  });

  return matches;
}

export function getNextMainMatchQuery(section, round, matchNumber) {
  if (round === 1) {
    const nextMatchNum = Math.ceil(matchNumber / 2);
    return { round: 2, matchNumber: nextMatchNum };
  }
  if (round === 2) {
    const nextMatchNum = Math.ceil(matchNumber / 2);
    return { round: 3, matchNumber: nextMatchNum };
  }
  return null;
}

export function getLoserNextMatch(round, matchNumber) {
  // R1 (12) → R2 (6) → R3 (3). After R3: lucky draw, then R4 playoff for 2nd qualifier.
  if (round === 1) return { round: 2, matchNumber: Math.ceil(matchNumber / 2) };
  if (round === 2) return { round: 3, matchNumber: Math.ceil(matchNumber / 2) };
  if (round === 3) return null; // Lucky draw among 3 winners
  if (round === 4) return null; // Winner qualifies to Super 8
  return null;
}

export function getFinalNextMatch(bracketType, matchNumber) {
  if (bracketType === "quarter") {
    return { bracketType: "semi", round: 2, matchNumber: Math.ceil(matchNumber / 2) };
  }
  if (bracketType === "semi") {
    return { bracketType: "final", round: 3, matchNumber: 1 };
  }
  return null;
}
