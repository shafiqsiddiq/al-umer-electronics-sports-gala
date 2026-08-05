import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { writeClient } from "@/lib/sanity";

const MATCH_QUERY = `*[_type == "match" && _id == $id][0]{
  _id, section, round, matchNumber, bracketType, status,
  team1Score, team2Score, venue, scheduledAt,
  team1->{
    _id, name, section,
    captain->{ _id, name, "profilePictureUrl": profilePicture.asset->url }
  },
  team2->{
    _id, name, section,
    captain->{ _id, name, "profilePictureUrl": profilePicture.asset->url }
  },
  winner->{ _id, name }
}`;

/**
 * PATCH body: { team1Id, team2Id, swapIfBusy?: boolean }
 * Change who plays in this match. If a picked team is already in another
 * same-round match, their slots are swapped (keeps both fixtures full).
 */
export async function PATCH(request, { params }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const team1Id = body.team1Id ? String(body.team1Id) : null;
    const team2Id = body.team2Id ? String(body.team2Id) : null;
    const swapIfBusy = body.swapIfBusy !== false;

    if (!team1Id || !team2Id) {
      return NextResponse.json(
        { error: "Both team1Id and team2Id are required" },
        { status: 400 }
      );
    }
    if (team1Id === team2Id) {
      return NextResponse.json(
        { error: "Pick two different teams" },
        { status: 400 }
      );
    }

    const match = await writeClient.fetch(
      `*[_type == "match" && _id == $id][0]{
        _id, section, round, status,
        "team1Id": team1._ref,
        "team2Id": team2._ref,
        winner
      }`,
      { id }
    );

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (match.status === "completed" || match.winner) {
      return NextResponse.json(
        {
          error:
            "This match already has a result. Reset the round first, then change teams.",
        },
        { status: 400 }
      );
    }

    const teamDocs = await writeClient.fetch(
      `*[_type == "team" && _id in $ids]{ _id, name, section }`,
      { ids: [team1Id, team2Id] }
    );
    if ((teamDocs || []).length !== 2) {
      return NextResponse.json(
        { error: "One or both teams were not found" },
        { status: 400 }
      );
    }

    const oldT1 = match.team1Id || null;
    const oldT2 = match.team2Id || null;

    // Find other same-round matches that already hold the new teams
    const busy = await writeClient.fetch(
      `*[
        _type == "match" &&
        _id != $id &&
        round == $round &&
        status != "completed" &&
        (team1._ref in $ids || team2._ref in $ids)
      ]{
        _id, section, round,
        "team1Id": team1._ref,
        "team2Id": team2._ref
      }`,
      { id, round: Number(match.round), ids: [team1Id, team2Id] }
    );

    if ((busy || []).length > 0 && !swapIfBusy) {
      return NextResponse.json(
        {
          error:
            "One of these teams is already in another match this round. Enable swap or pick free teams.",
          busyMatches: busy.length,
        },
        { status: 400 }
      );
    }

    // For each busy match, put the displaced team from this match into that slot
    for (const other of busy || []) {
      const patch = writeClient.patch(other._id);
      let changed = false;

      if (other.team1Id === team1Id) {
        // team1 is moving here from `match` — put old occupant of that slot back
        const replacement =
          oldT1 && oldT1 !== team1Id && oldT1 !== team2Id
            ? oldT1
            : oldT2 && oldT2 !== team1Id && oldT2 !== team2Id
              ? oldT2
              : null;
        if (replacement) {
          patch.set({ team1: { _type: "reference", _ref: replacement } });
        } else {
          patch.unset(["team1"]);
        }
        changed = true;
      } else if (other.team2Id === team1Id) {
        const replacement =
          oldT1 && oldT1 !== team1Id && oldT1 !== team2Id
            ? oldT1
            : oldT2 && oldT2 !== team1Id && oldT2 !== team2Id
              ? oldT2
              : null;
        if (replacement) {
          patch.set({ team2: { _type: "reference", _ref: replacement } });
        } else {
          patch.unset(["team2"]);
        }
        changed = true;
      }

      if (other.team1Id === team2Id) {
        const replacement =
          oldT2 && oldT2 !== team2Id && oldT2 !== team1Id
            ? oldT2
            : oldT1 && oldT1 !== team2Id && oldT1 !== team1Id
              ? oldT1
              : null;
        if (replacement) {
          patch.set({ team1: { _type: "reference", _ref: replacement } });
        } else {
          patch.unset(["team1"]);
        }
        changed = true;
      } else if (other.team2Id === team2Id) {
        const replacement =
          oldT2 && oldT2 !== team2Id && oldT2 !== team1Id
            ? oldT2
            : oldT1 && oldT1 !== team2Id && oldT1 !== team1Id
              ? oldT1
              : null;
        if (replacement) {
          patch.set({ team2: { _type: "reference", _ref: replacement } });
        } else {
          patch.unset(["team2"]);
        }
        changed = true;
      }

      if (changed) await patch.commit();
    }

    await writeClient
      .patch(id)
      .set({
        team1: { _type: "reference", _ref: team1Id },
        team2: { _type: "reference", _ref: team2Id },
        status: "scheduled",
      })
      .unset([
        "winner",
        "loser",
        "team1Score",
        "team2Score",
        "team1Runs",
        "team2Runs",
      ])
      .commit();

    const updated = await writeClient.fetch(MATCH_QUERY, { id });
    return NextResponse.json({ success: true, match: updated, swapped: (busy || []).length });
  } catch (error) {
    console.error("Change match teams error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update match teams" },
      { status: 500 }
    );
  }
}

export async function GET(_request, { params }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const match = await writeClient.fetch(MATCH_QUERY, { id });
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }
  return NextResponse.json({ match });
}
