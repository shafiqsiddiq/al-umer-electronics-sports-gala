import { writeClient } from "@/lib/sanity";
import { SECTION_KNOCKOUT, KNOCKOUT_BASE_EXPECTED } from "@/lib/tournament-logic";

/** Statuses that still belong in the Knockout pool (matches admin brackets UI). */
const KNOCKOUT_POOL_STATUSES = ["approved", "active", "pending", "eliminated"];

/**
 * Full Knockout pool = Group C R1 losers + knockout/new-entry teams.
 * Includes eliminated so late entries / pool display stay in sync with fixtures.
 */
export async function fetchKnockoutPoolIds() {
  const losers = await writeClient.fetch(`
    *[_type == "match" && bracketType == "main" && round == 1 && section == "C" && status == "completed"].loser._ref
  `);
  const uniqueLosers = [...new Set((losers || []).filter(Boolean))];

  const newEntries = await writeClient.fetch(
    `*[
      _type == "team" &&
      (section == "knockout" || newEntry == true) &&
      status in $statuses
    ]._id`,
    { statuses: KNOCKOUT_POOL_STATUSES }
  );

  // Anyone already placed in a Knockout match must stay in the pool on rebuild
  const fixtureRows = await writeClient.fetch(
    `*[_type == "match" && section == $section]{
      "t1": team1._ref,
      "t2": team2._ref,
      "w": winner._ref,
      "l": loser._ref
    }`,
    { section: SECTION_KNOCKOUT }
  );
  const inFixtures = [];
  for (const row of fixtureRows || []) {
    for (const id of [row.t1, row.t2, row.w, row.l]) {
      if (id) inFixtures.push(id);
    }
  }

  const pool = [
    ...new Set([
      ...uniqueLosers,
      ...((newEntries || []).filter(Boolean)),
      ...inFixtures,
    ]),
  ];

  return {
    losers: uniqueLosers,
    newEntries: [...new Set((newEntries || []).filter(Boolean))],
    pool,
  };
}

export function assertKnockoutPoolReady(losersCount, poolCount) {
  if (losersCount < KNOCKOUT_BASE_EXPECTED) {
    throw new Error(
      `Need at least ${KNOCKOUT_BASE_EXPECTED} Group C Round 1 losers, have ${losersCount}.`
    );
  }
  if (poolCount < 2) {
    throw new Error("Need at least 2 teams in the Knockout pool.");
  }
}
