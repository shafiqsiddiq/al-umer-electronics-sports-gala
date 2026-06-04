import { NextResponse } from "next/server";
import { getCaptainSession } from "@/lib/auth";
import { writeClient } from "@/lib/sanity";
import { validateCnic } from "@/lib/cnic";
import { RESERVED_PLAYERS, ADDITIONAL_MAIN_PLAYERS, TOTAL_PLAYER_SLOTS } from "@/lib/tournament-logic";

export async function POST(request) {
  const session = await getCaptainSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const existingCnic = await writeClient.fetch(
      `*[_type in ["captain", "player"] && cnic == $cnic][0]`,
      { cnic }
    );
    if (existingCnic) {
      return NextResponse.json({ error: "CNIC already registered" }, { status: 400 });
    }

    const team = await writeClient.fetch(
      `*[_type == "team" && _id == $teamId][0]{
        _id, players,
        "playerDetails": players[]->{ role }
      }`,
      { teamId: session.teamId }
    );

    const mainCount = team.playerDetails?.filter((p) => p?.role === "main").length || 0;
    const reservedCount = team.playerDetails?.filter((p) => p?.role === "reserved").length || 0;
    const totalCount = team.players?.length || 0;

    if (totalCount >= TOTAL_PLAYER_SLOTS) {
      return NextResponse.json({ error: "Maximum squad size reached" }, { status: 400 });
    }
    if (role === "main" && mainCount >= ADDITIONAL_MAIN_PLAYERS) {
      return NextResponse.json(
        { error: "Maximum 6 additional main players allowed (captain counts as 1 of 7 main)" },
        { status: 400 }
      );
    }
    if (role === "reserved" && reservedCount >= RESERVED_PLAYERS) {
      return NextResponse.json({ error: "Maximum 2 reserved players allowed" }, { status: 400 });
    }

    let profileAsset = null;
    let cnicAsset = null;

    if (profilePicture && profilePicture.size > 0) {
      profileAsset = await writeClient.assets.upload("image", profilePicture, {
        filename: `profile-${cnic.replace(/-/g, "")}.jpg`,
      });
    }

    if (cnicImage && cnicImage.size > 0) {
      cnicAsset = await writeClient.assets.upload("image", cnicImage, {
        filename: `cnic-${cnic.replace(/-/g, "")}.jpg`,
      });
    }

    const player = await writeClient.create({
      _type: "player",
      name,
      fatherName,
      cnic,
      address,
      role,
      profilePicture: profileAsset
        ? { _type: "image", asset: { _type: "reference", _ref: profileAsset._id } }
        : undefined,
      cnicImage: cnicAsset
        ? { _type: "image", asset: { _type: "reference", _ref: cnicAsset._id } }
        : undefined,
      team: { _type: "reference", _ref: session.teamId },
    });

    await writeClient
      .patch(session.teamId)
      .setIfMissing({ players: [] })
      .append("players", [{ _type: "reference", _ref: player._id, _key: player._id }])
      .commit();

    return NextResponse.json({ success: true, playerId: player._id });
  } catch (error) {
    console.error("Add player error:", error);
    return NextResponse.json({ error: "Failed to add player" }, { status: 500 });
  }
}
