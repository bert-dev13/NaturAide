import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  retrieveProjectForReviewer,
  executeProfessionalReviewerChat,
} from "@/lib/researcher-assistant-grounding";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "REVIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, projectId, message } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }

    const userText = message.trim();
    let currentConvId = conversationId ? parseInt(conversationId, 10) : null;
    let selectedProjectId = projectId ? parseInt(projectId, 10) : null;

    // 1. Resolve or create conversation
    if (!currentConvId || isNaN(currentConvId)) {
      const generatedTitle = userText.length > 35 ? `${userText.slice(0, 32)}...` : userText;
      const [insertConv]: any = await pool.query(
        `INSERT INTO conversations (userId, title, projectId, activeContextType, isArchived)
         VALUES (?, ?, ?, 'PROFESSIONAL_REVIEW', 0)`,
        [session.id, generatedTitle, selectedProjectId]
      );
      currentConvId = insertConv.insertId;
    }

    // 2. Save user message
    const [userMsgInsert]: any = await pool.query(
      `INSERT INTO messages (conversationId, sender, content, metadata)
       VALUES (?, 'USER', ?, ?)`,
      [currentConvId, userText, JSON.stringify({ projectId: selectedProjectId })]
    );

    // 3. Fetch recent history
    const [historyRows]: any = await pool.query(
      `SELECT sender, content
       FROM messages
       WHERE conversationId = ? AND id < ?
       ORDER BY createdAt ASC
       LIMIT 8`,
      [currentConvId, userMsgInsert.insertId]
    );

    const history: Array<{ role: "user" | "assistant"; content: string }> = historyRows.map((h: any) => ({
      role: h.sender === "USER" ? "user" : "assistant",
      content: h.content,
    }));

    // 4. Retrieve dossier context for reviewer
    let projectRecord = null;
    if (selectedProjectId) {
      projectRecord = await retrieveProjectForReviewer(selectedProjectId, session.id);
    }

    // 5. Execute chat with Together AI
    const aiResult = await executeProfessionalReviewerChat(history, userText, projectRecord);

    // 6. Save assistant message
    const metadata = {
      model: aiResult.model,
      sources: aiResult.sources || [],
      projectId: selectedProjectId,
      plantName: projectRecord?.plantName || null,
      generatedAt: new Date().toISOString(),
    };

    const [assistantMsgInsert]: any = await pool.query(
      `INSERT INTO messages (conversationId, sender, content, metadata)
       VALUES (?, 'ASSISTANT', ?, ?)`,
      [currentConvId, aiResult.content, JSON.stringify(metadata)]
    );

    return NextResponse.json({
      success: true,
      conversationId: currentConvId,
      message: {
        id: assistantMsgInsert.insertId,
        sender: "ASSISTANT",
        content: aiResult.content,
        metadata,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("POST /api/reviewer/assistant/chat error:", error);
    return NextResponse.json({ error: "Failed to generate AI response" }, { status: 500 });
  }
}

