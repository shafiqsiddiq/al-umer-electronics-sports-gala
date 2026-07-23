import { NextResponse } from "next/server";
import { getCaptainSession } from "@/lib/auth";
import { writeClient } from "@/lib/sanity";

const TEAM_QUERY = `*[_type == "team" && _id == $teamId][0]{
  _id, name, status, section, wins, losses, points, entryFeeVerified, entryFeeRejected,
  "entryFeeImageUrl": entryFeeImage.asset->url,
  "captain": captain->{
    _id, name, fatherName, cnic, email, phone, whatsapp,
    "profilePictureUrl": profilePicture.asset->url,
    "cnicImageUrl": cnicImage.asset->url
  },
  "players": players[]->{
    _id, name, fatherName, cnic, address, role,
    "profilePictureUrl": profilePicture.asset->url,
    "cnicImageUrl": cnicImage.asset->url
  }
}`;

export async function GET() {
  const session = await getCaptainSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const team = await writeClient.fetch(TEAM_QUERY, { teamId: session.teamId });

  return NextResponse.json({ team, players: team?.players || [] });
}

export async function PATCH(request) {
  const session = await getCaptainSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 });
    }

    const duplicate = await writeClient.fetch(
      `*[_type == "team" && name == $name && _id != $teamId][0]`,
      { name: name.trim(), teamId: session.teamId }
    );
    if (duplicate) {
      return NextResponse.json({ error: "Team name already taken" }, { status: 400 });
    }

    await writeClient.patch(session.teamId).set({ name: name.trim() }).commit();

    const team = await writeClient.fetch(TEAM_QUERY, { teamId: session.teamId });
    return NextResponse.json({ success: true, team, players: team?.players || [] });
  } catch (error) {
    console.error("Update team error:", error);
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
  }
}

