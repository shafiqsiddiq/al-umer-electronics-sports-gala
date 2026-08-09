import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { writeClient } from "@/lib/sanity";

export async function GET(request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    let query = `*[_type == "match"]`;
    if (statusFilter) {
      query = `*[_type == "match" && status in $statuses]`;
    }

    query += ` | order(section asc, round asc, matchNumber asc) {
    _id, section, round, matchNumber, bracketType, status,
    team1Score, team2Score, venue, scheduledAt,
    team1->{
      _id, name,
      captain->{
        _id, name,
        "profilePictureUrl": profilePicture.asset->url
      }
    },
    team2->{
      _id, name,
      captain->{
        _id, name,
        "profilePictureUrl": profilePicture.asset->url
      }
    },
    winner->{
      _id, name,
      captain->{
        _id, name,
        "profilePictureUrl": profilePicture.asset->url
      }
    }
  }`;

    const matches = await writeClient.fetch(query, {
      statuses: statusFilter?.split(","),
    });

    return NextResponse.json({ matches });
  } catch (err) {
    console.error("matches GET failed:", err);
    return NextResponse.json(
      {
        error:
          err?.cause?.code === "SELF_SIGNED_CERT_IN_CHAIN" ||
          /self-signed certificate/i.test(String(err?.message || err?.cause || ""))
            ? "Sanity SSL blocked (self-signed cert). Set SANITY_INSECURE_TLS=1 in .env.local and restart npm run dev."
            : err.message || "Failed to load matches",
        matches: [],
      },
      { status: 500 }
    );
  }
}
