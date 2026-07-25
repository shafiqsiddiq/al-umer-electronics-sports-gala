import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { writeClient } from "@/lib/sanity";

const EXPENSE_FIELDS = `
  _id, name, totalCost, advance, pendingAmount, notes, date, _createdAt
`;

function calcPending(totalCost, advance) {
  const total = Math.max(0, Number(totalCost) || 0);
  const paid = Math.max(0, Number(advance) || 0);
  return Math.max(0, total - paid);
}

export async function GET(_request, { params }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const expense = await writeClient.fetch(
      `*[_type == "expense" && _id == $id][0]{ ${EXPENSE_FIELDS} }`,
      { id }
    );
    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }
    return NextResponse.json({ expense });
  } catch (error) {
    console.error("Get expense error:", error);
    return NextResponse.json({ error: "Failed to load expense" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const existing = await writeClient.fetch(
      `*[_type == "expense" && _id == $id][0]{ _id, totalCost, advance }`,
      { id }
    );
    if (!existing) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
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

    if (body.totalCost !== undefined) {
      const totalCost = Number(body.totalCost);
      if (Number.isNaN(totalCost) || totalCost < 0) {
        return NextResponse.json({ error: "Valid total cost is required" }, { status: 400 });
      }
      updates.totalCost = totalCost;
    }

    if (body.advance !== undefined) {
      const advance = Number(body.advance);
      if (Number.isNaN(advance) || advance < 0) {
        return NextResponse.json({ error: "Advance must be 0 or more" }, { status: 400 });
      }
      updates.advance = advance;
    }

    if (body.notes !== undefined) {
      updates.notes = String(body.notes || "").trim();
    }

    if (body.date !== undefined) {
      updates.date = body.date
        ? new Date(body.date).toISOString()
        : new Date().toISOString();
    }

    const nextTotal =
      updates.totalCost !== undefined ? updates.totalCost : Number(existing.totalCost || 0);
    const nextAdvance =
      updates.advance !== undefined ? updates.advance : Number(existing.advance || 0);

    if (nextAdvance > nextTotal) {
      return NextResponse.json(
        { error: "Advance cannot be greater than total cost" },
        { status: 400 }
      );
    }

    updates.pendingAmount = calcPending(nextTotal, nextAdvance);

    await writeClient.patch(id).set(updates).commit();

    const expense = await writeClient.fetch(
      `*[_type == "expense" && _id == $id][0]{ ${EXPENSE_FIELDS} }`,
      { id }
    );

    return NextResponse.json({ expense });
  } catch (error) {
    console.error("Update expense error:", error);
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
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
      `*[_type == "expense" && _id == $id][0]{ _id }`,
      { id }
    );
    if (!existing) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    await writeClient.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete expense error:", error);
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
