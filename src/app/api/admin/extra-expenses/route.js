import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { writeClient } from "@/lib/sanity";

const FIELDS = `_id, name, amount, notes, date, _createdAt`;

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const extras = await writeClient.fetch(
      `*[_type == "extraExpense"] | order(coalesce(date, _createdAt) desc) { ${FIELDS} }`
    );
    return NextResponse.json({ extras: extras || [] });
  } catch (error) {
    console.error("List extra expenses error:", error);
    return NextResponse.json({ error: "Failed to load extra expenses" }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const amount = Number(body.amount);
    const notes = String(body.notes || "").trim();
    const date = body.date ? new Date(body.date).toISOString() : new Date().toISOString();

    if (!name) {
      return NextResponse.json({ error: "Expense name is required" }, { status: 400 });
    }
    if (Number.isNaN(amount) || amount < 0) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
    }

    const created = await writeClient.create({
      _type: "extraExpense",
      name,
      amount,
      notes: notes || undefined,
      date,
    });

    const extra = await writeClient.fetch(
      `*[_type == "extraExpense" && _id == $id][0]{ ${FIELDS} }`,
      { id: created._id }
    );

    return NextResponse.json({ extra }, { status: 201 });
  } catch (error) {
    console.error("Create extra expense error:", error);
    return NextResponse.json({ error: "Failed to create extra expense" }, { status: 500 });
  }
}
