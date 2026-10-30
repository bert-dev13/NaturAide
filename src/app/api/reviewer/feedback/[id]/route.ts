import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "REVIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const feedbackId = parseInt(id, 10);
    if (isNaN(feedbackId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await pool.query(
      `DELETE FROM review_feedback WHERE id = ? AND reviewerId = ?`,
      [feedbackId, session.id]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete feedback error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete finding" }, { status: 500 });
  }
}

