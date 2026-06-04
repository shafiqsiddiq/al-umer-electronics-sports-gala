import { NextResponse } from "next/server";
import { getCaptainSession } from "@/lib/auth";
import { writeClient } from "@/lib/sanity";
import { validateCnic } from "@/lib/cnic";
import { MAIN_PLAYERS, RESERVED_PLAYERS, ADDITIONAL_MAIN_PLAYERS } from "@/lib/tournament-logic";

async function getPlayerForCaptain(playerId, teamId) {
  const player = await writeClient.fetch(
    `*[_type == "player" && _id == $playerId && team._ref == $teamId][0]{
      _id, name, fatherName, cnic, address, role,
      "profilePictureUrl": profilePicture.asset->url,
      "cnicImageUrl": cnicImage.asset->url,
      "profilePictureRef": profilePicture.asset._ref,
      "cnicImageRef": cnicImage.asset._ref
    }`,
    { playerId, teamId }
  );
  return player;
}

async function getTeamPlayerCounts(teamId, excludePlayerId = null) {
  const team = await writeClient.fetch(
    `*[_type == "team" && _id == $teamId][0]{
      _id, players,
      "playerDetails": players[]->{ _id, role }
    }`,
    { teamId }
  );

  const others = team?.playerDetails?.filter((p) => p && p._id !== excludePlayerId) || [];
  return {
    team,
    mainCount: others.filter((p) => p.role === "main").length,
    reservedCount: others.filter((p) => p.role === "reserved").length,
  };
}

export async function GET(_request, { params }) {
  const session = await getCaptainSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const player = await getPlayerForCaptain(id, session.teamId);

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  return NextResponse.json({ player });
}

export async function PATCH(request, { params }) {
  const session = await getCaptainSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getPlayerForCaptain(id, session.teamId);

  if (!existing) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  try {
    const formData = await request.formData();
    const name = formData.get("name");
    const fatherName = formData.get("fatherName");
    const cnic = formData.get("cnic");
    const address = formData.get("address");
    const role = formData.get("role");
    const profilePicture = formData.get("profilePicture");
    const cnicImage = formData.get("cnicImage");

    if (!name || !fatherName || !cnic || !address || !role) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (!validateCnic(cnic)) {
      return NextResponse.json({ error: "Invalid CNIC format. Use 35201-8511102-5" }, { status: 400 });
    }

    const duplicateCnic = await writeClient.fetch(
      `*[_type in ["captain", "player"] && cnic == $cnic && !(_type == "player" && _id == $playerId)][0]`,
      { cnic, playerId: id }
    );
    if (duplicateCnic) {
      return NextResponse.json({ error: "CNIC already registered" }, { status: 400 });
    }

    const { mainCount, reservedCount } = await getTeamPlayerCounts(session.teamId, id);

    if (role === "main" && mainCount >= ADDITIONAL_MAIN_PLAYERS) {
      return NextResponse.json(
        { error: "Maximum 6 additional main players allowed (captain counts as 1 of 7 main)" },
        { status: 400 }
      );
    }
    if (role === "reserved" && reservedCount >= RESERVED_PLAYERS) {
      return NextResponse.json({ error: "Maximum 2 reserved players allowed" }, { status: 400 });
    }

    const patch = writeClient.patch(id).set({ name, fatherName, cnic, address, role });

    if (profilePicture && profilePicture.size > 0) {
      const profileAsset = await writeClient.assets.upload("image", profilePicture, {
        filename: `profile-${cnic.replace(/-/g, "")}.jpg`,
      });
      patch.set({
        profilePicture: {
          _type: "image",
          asset: { _type: "reference", _ref: profileAsset._id },
        },
      });
    }

    if (cnicImage && cnicImage.size > 0) {
      const cnicAsset = await writeClient.assets.upload("image", cnicImage, {
        filename: `cnic-${cnic.replace(/-/g, "")}.jpg`,
      });
      patch.set({
        cnicImage: {
          _type: "image",
          asset: { _type: "reference", _ref: cnicAsset._id },
        },
      });
    }

    await patch.commit();

    const player = await getPlayerForCaptain(id, session.teamId);
    return NextResponse.json({ success: true, player });
  } catch (error) {
    console.error("Update player error:", error);
    return NextResponse.json({ error: "Failed to update player" }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  const session = await getCaptainSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getPlayerForCaptain(id, session.teamId);

  if (!existing) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  try {
    const team = await writeClient.fetch(
      `*[_type == "team" && _id == $teamId][0]{ players }`,
      { teamId: session.teamId }
    );

    const updatedPlayers = (team?.players || []).filter((ref) => ref._ref !== id);

    await writeClient.patch(session.teamId).set({ players: updatedPlayers }).commit();
    await writeClient.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete player error:", error);
    return NextResponse.json({ error: "Failed to delete player" }, { status: 500 });
  }
}
