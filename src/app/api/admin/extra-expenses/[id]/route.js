import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { writeClient } from "@/lib/sanity";

const FIELDS = `_id, name, amount, notes, date, _createdAt`;

export async function PATCH(request, { params }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const existing = await writeClient.fetch(
      `*[_type == "extraExpense" && _id == $id][0]{ _id }`,
      { id }
    );
    if (!existing) {
      return NextResponse.json({ error: "Extra expense not found" }, { status: 404 });
    }

    const body = await request.json();
    const updates = {};

    if (body.name !== undefined) {
      const name = String(body.name || "").trim();
      if (!name) {
        return NextResponse.json({ error: "Expense name is required" }, { status: 400 });
      }
      updates.name = name;
    }

    if (body.amount !== undefined) {
      const amount = Number(body.amount);
      if (Number.isNaN(amount) || amount < 0) {
        return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
      }
      updates.amount = amount;
    }

    if (body.notes !== undefined) {
      updates.notes = String(body.notes || "").trim();
    }

    if (body.date !== undefined) {
      updates.date = body.date
        ? new Date(body.date).toISOString()
        : new Date().toISOString();
    }

    await writeClient.patch(id).set(updates).commit();

    const extra = await writeClient.fetch(
      `*[_type == "extraExpense" && _id == $id][0]{ ${FIELDS} }`,
      { id }
    );

    return NextResponse.json({ extra });
  } catch (error) {
    console.error("Update extra expense error:", error);
    return NextResponse.json({ error: "Failed to update extra expense" }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const existing = await writeClient.fetch(
      `*[_type == "extraExpense" && _id == $id][0]{ _id }`,
      { id }
    );
    if (!existing) {
      return NextResponse.json({ error: "Extra expense not found" }, { status: 404 });
    }

    await writeClient.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete extra expense error:", error);
    return NextResponse.json({ error: "Failed to delete extra expense" }, { status: 500 });
  }
}
