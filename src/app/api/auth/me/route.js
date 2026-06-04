import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { writeClient } from "@/lib/sanity";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  if (session.role === "captain") {
    const captain = await writeClient.fetch(
      `*[_type == "captain" && _id == $captainId][0]{
        name,
        email,
        "teamName": team->name,
        "profilePictureUrl": profilePicture.asset->url
      }`,
      { captainId: session.captainId }
    );

    return NextResponse.json({
      user: {
        role: "captain",
        email: session.email,
        captainId: session.captainId,
        teamId: session.teamId,
        name: captain?.name,
        teamName: captain?.teamName,
        profilePictureUrl: captain?.profilePictureUrl,
      },
    });
  }

  if (session.role === "admin") {
    return NextResponse.json({ user: { role: "admin" } });
  }

  return NextResponse.json({ user: null });
}
