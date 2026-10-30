import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";


export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "RESEARCHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const convId = parseInt(id, 10);
    if (isNaN(convId)) {
      return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 });
    }

    const body = await request.json();
    const title = (body.title || "").trim().slice(0, 100);
    if (!title) {
      return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
    }

    const [res]: any = await pool.query(
      "UPDATE conversations SET title = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ? AND userId = ?",
      [title, convId, session.id]
    );

    if (res.affectedRows === 0) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, title });
  } catch (error: any) {
    console.error("Error renaming conversation:", error);
    return NextResponse.json({ error: "Failed to rename conversation" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "RESEARCHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const convId = parseInt(id, 10);
    if (isNaN(convId)) {
      return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 });
    }

    // Delete messages first, then conversation
    await pool.query(
      "DELETE FROM messages WHERE conversationId IN (SELECT id FROM conversations WHERE id = ? AND userId = ?)",
      [convId, session.id]
    );

    const [res]: any = await pool.query(
      "DELETE FROM conversations WHERE id = ? AND userId = ?",
      [convId, session.id]
    );

    if (res.affectedRows === 0) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Conversation deleted" });
  } catch (error: any) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 });
  }
}
