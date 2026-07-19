import { NextResponse } from "next/server";
import { writeClient } from "@/lib/sanity";

export async function GET() {
  try {
    // Find all active teams that played in main bracket and are not eliminated
    const activeTeams = await writeClient.fetch(
      `*[_type == "team" && status == "active"]{ _id }`
    );

    let patched = 0;
    for (const team of activeTeams) {
      await writeClient.patch(team._id).set({ status: "qualified_main" }).commit();
      patched++;
    }

    return NextResponse.json({ success: true, patched });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
