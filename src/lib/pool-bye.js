import { writeClient } from "@/lib/sanity";
export {
  expectedR1PlayingCount,
  expectedR1MatchCount,
} from "@/lib/tournament-logic";

/** Stable Sanity id for a deferred bye into a given round. */
export function poolByeDocId(section, joinRound) {
  return `poolBye.${section}.r${Number(joinRound)}`;
}

export async function setPoolBye(section, joinRound, teamId, fromRound = null) {
  if (!section || !joinRound || !teamId) return;
  const id = poolByeDocId(section, joinRound);
  await writeClient.createOrReplace({
    _id: id,
    _type: "poolBye",
    section,
    joinRound: Number(joinRound),
    fromRound: fromRound == null ? null : Number(fromRound),
    teamId,
    createdAt: new Date().toISOString(),
  });
}

export async function getPoolBye(section, joinRound) {
  if (!section || !joinRound) return null;
  return writeClient.fetch(
    `*[_id == $id][0]{ _id, section, joinRound, fromRound, teamId }`,
    { id: poolByeDocId(section, joinRound) }
  );
}

export async function clearPoolBye(section, joinRound) {
  if (!section || !joinRound) return;
  try {
    await writeClient.delete(poolByeDocId(section, joinRound));
  } catch {
    /* ignore */
  }
}

export async function clearSectionPoolByes(section) {
  const ids = await writeClient.fetch(
    `*[_type == "poolBye" && section == $section]._id`,
    { section }
  );
  if (!ids?.length) return 0;
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const tx = writeClient.transaction();
    for (const id of chunk) tx.delete(id);
    await tx.commit();
  }
  return ids.length;
}
