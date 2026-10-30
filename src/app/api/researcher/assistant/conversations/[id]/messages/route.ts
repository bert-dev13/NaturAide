import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";


export async function GET(
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

    // Verify ownership
    const [conv]: any = await pool.query(
      "SELECT id, title, projectId FROM conversations WHERE id = ? AND userId = ? LIMIT 1",
      [convId, session.id]
    );

    if (conv.length === 0) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const [messages]: any = await pool.query(
      `SELECT id, sender, content, metadata, createdAt
       FROM messages
       WHERE conversationId = ?
       ORDER BY createdAt ASC`,
      [convId]
    );

    const parsedMessages = messages.map((m: any) => {
      let parsedMeta = null;
      if (m.metadata) {
        try {
          parsedMeta = typeof m.metadata === "string" ? JSON.parse(m.metadata) : m.metadata;
        } catch {
          parsedMeta = null;
        }
      }
      return {
        id: m.id,
        sender: m.sender,
        content: m.content,
        metadata: parsedMeta,
        createdAt: m.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      conversation: conv[0],
      messages: parsedMessages,
    });
  } catch (error: any) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
