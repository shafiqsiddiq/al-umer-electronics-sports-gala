import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { writeClient } from "@/lib/sanity";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teams = await writeClient.fetch(`
    *[_type == "team"] | order(_createdAt desc) {
      _id, name, section, status, entryFeeVerified, entryFeeRejected, entryFeePaid, entryFeeReceivedBy,
      "playerCount": count(players),
      "entryFeeImageUrl": entryFeeImage.asset->url,
      "captain": captain->{
        name,
        villageOrCity,
        whatsapp,
        phone,
        "profilePictureUrl": profilePicture.asset->url
      }
    }
  `);

  return NextResponse.json({ teams });
}
