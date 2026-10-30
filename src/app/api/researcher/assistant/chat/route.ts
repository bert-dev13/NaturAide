import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  retrieveProjectResearchRecord,
  executeResearcherChat,
} from "@/lib/researcher-assistant-grounding";


export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "RESEARCHER") {
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
      // Generate clean title from message
      const generatedTitle = userText.length > 35 ? `${userText.slice(0, 32)}...` : userText;
      const [insertConv]: any = await pool.query(
        `INSERT INTO conversations (userId, title, projectId, activeContextType, isArchived)
         VALUES (?, ?, ?, 'RESEARCH_PROJECT', 0)`,
        [session.id, generatedTitle, selectedProjectId]
      );
      currentConvId = insertConv.insertId;
    } else {
      // Verify ownership
      const [checkConv]: any = await pool.query(
        "SELECT id, projectId FROM conversations WHERE id = ? AND userId = ? LIMIT 1",
        [currentConvId, session.id]
      );
      if (checkConv.length === 0) {
        return NextResponse.json({ error: "Conversation not found or unauthorized" }, { status: 404 });
      }

      // If user selected or changed project, update conversation
      if (selectedProjectId && checkConv[0].projectId !== selectedProjectId) {
        await pool.query(
          "UPDATE conversations SET projectId = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?",
          [selectedProjectId, currentConvId]
        );
      } else if (!selectedProjectId && checkConv[0].projectId) {
        selectedProjectId = checkConv[0].projectId;
      }
    }

    // 2. Save user message to database
    const [userMsgInsert]: any = await pool.query(
      `INSERT INTO messages (conversationId, sender, content, metadata)
       VALUES (?, 'USER', ?, ?)`,
      [currentConvId, userText, JSON.stringify({ projectId: selectedProjectId })]
    );

    // 3. Fetch recent conversation history for multi-turn context
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

    // 4. Retrieve grounded project context across Stages 1–6
    let projectRecord = null;
    if (selectedProjectId) {
      projectRecord = await retrieveProjectResearchRecord(selectedProjectId, session.id);
    }

    // 5. Execute generation via Together AI
    const aiResult = await executeResearcherChat(history, userText, projectRecord);

    // 6. Save assistant message to database
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

    // Update conversation updatedAt
    await pool.query("UPDATE conversations SET updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?", [currentConvId]);

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
      sources: aiResult.sources || [],
      model: aiResult.model,
    });
  } catch (error: any) {
    console.error("Error in researcher assistant chat:", error);
    return NextResponse.json(
      { error: error?.message || "An error occurred while generating the response" },
      { status: 500 }
    );
  }
}
