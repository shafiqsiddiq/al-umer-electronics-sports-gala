import { NextResponse } from "next/server";
import { getCaptainSession } from "@/lib/auth";
import { writeClient } from "@/lib/sanity";

export async function POST(request) {
  const session = await getCaptainSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const entryFeeImage = formData.get("entryFeeImage");

    if (!entryFeeImage || entryFeeImage.size === 0) {
      return NextResponse.json({ error: "Entry fee receipt image is required" }, { status: 400 });
    }

    const team = await writeClient.fetch(
      `*[_type == "team" && _id == $teamId][0]{ _id, name, entryFeeVerified }`,
      { teamId: session.teamId }
    );

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const asset = await writeClient.assets.upload("image", entryFeeImage, {
      filename: `entry-fee-${team.name.replace(/\s+/g, "-").toLowerCase()}.jpg`,
    });

    await writeClient
      .patch(session.teamId)
      .set({
        entryFeeImage: {
          _type: "image",
          asset: { _type: "reference", _ref: asset._id },
        },
        entryFeeVerified: false,
        entryFeeRejected: false,
      })
      .commit();

    const updated = await writeClient.fetch(
      `*[_type == "team" && _id == $teamId][0]{
        entryFeeVerified,
        "entryFeeImageUrl": entryFeeImage.asset->url
      }`,
      { teamId: session.teamId }
    );

    return NextResponse.json({
      success: true,
      entryFeeImageUrl: updated?.entryFeeImageUrl,
      entryFeeVerified: updated?.entryFeeVerified ?? false,
    });
  } catch (error) {
    console.error("Entry fee upload error:", error);
    return NextResponse.json({ error: "Failed to upload entry fee receipt" }, { status: 500 });
  }
}
