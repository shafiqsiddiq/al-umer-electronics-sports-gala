import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { writeClient } from "@/lib/sanity";

export async function GET(request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");

  let query = `*[_type == "match"]`;
  if (statusFilter) {
    const statuses = statusFilter.split(",");
    query = `*[_type == "match" && status in $statuses]`;
  }

  query += ` | order(section asc, round asc, matchNumber asc) {
    _id, section, round, matchNumber, bracketType, status,
    team1Score, team2Score, venue,
    team1->{ _id, name }, team2->{ _id, name }, winner->{ _id, name }
  }`;

  const matches = await writeClient.fetch(query, { statuses: statusFilter?.split(",") });

  return NextResponse.json({ matches });
}
