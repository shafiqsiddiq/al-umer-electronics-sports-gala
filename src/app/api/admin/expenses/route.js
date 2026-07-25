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

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const expenses = await writeClient.fetch(
      `*[_type == "expense"] | order(coalesce(date, _createdAt) desc) { ${EXPENSE_FIELDS} }`
    );
    return NextResponse.json({ expenses: expenses || [] });
  } catch (error) {
    console.error("List expenses error:", error);
    return NextResponse.json({ error: "Failed to load expenses" }, { status: 500 });
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
    const totalCost = Number(body.totalCost);
    const advance = Number(body.advance ?? 0);
    const notes = String(body.notes || "").trim();
    const date = body.date ? new Date(body.date).toISOString() : new Date().toISOString();

    if (!name) {
      return NextResponse.json({ error: "Expense name is required" }, { status: 400 });
    }
    if (Number.isNaN(totalCost) || totalCost < 0) {
      return NextResponse.json({ error: "Valid total cost is required" }, { status: 400 });
    }
    if (Number.isNaN(advance) || advance < 0) {
      return NextResponse.json({ error: "Advance must be 0 or more" }, { status: 400 });
    }
    if (advance > totalCost) {
      return NextResponse.json(
        { error: "Advance cannot be greater than total cost" },
        { status: 400 }
      );
    }

    const pendingAmount = calcPending(totalCost, advance);

    const created = await writeClient.create({
      _type: "expense",
      name,
      totalCost,
      advance,
      pendingAmount,
      notes: notes || undefined,
      date,
    });

    const expense = await writeClient.fetch(
      `*[_type == "expense" && _id == $id][0]{ ${EXPENSE_FIELDS} }`,
      { id: created._id }
    );

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    console.error("Create expense error:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
