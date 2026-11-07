import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  retrieveProjectForReviewer,
  executeProfessionalReviewerChat,
  AttachedPaperData,
} from "@/lib/researcher-assistant-grounding";
import { extractManuscriptTextForProject } from "@/lib/manuscript-text-extractor";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "REVIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, projectId, message, attachedPaper } = body;

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

    // 2. Resolve active attached paper (from current payload, previous turn, or project manuscript)
    let activePaper: AttachedPaperData | null = attachedPaper || null;

    // Check if previous messages in this conversation have an attached paper
    if (!activePaper && currentConvId) {
      const [prevMsgs]: any = await pool.query(
        `SELECT metadata FROM messages WHERE conversationId = ? AND metadata LIKE '%attachedPaper%' ORDER BY id DESC LIMIT 1`,
        [currentConvId]
      );
      if (prevMsgs.length > 0) {
        try {
          const parsed = JSON.parse(prevMsgs[0].metadata);
          if (parsed.attachedPaper && parsed.attachedPaper.text) {
            activePaper = parsed.attachedPaper;
          }
        } catch {}
      }
    }

    // If still no attached paper, but user query mentions "paper" or "manuscript" and project has one:
    if (!activePaper && selectedProjectId) {
      const queryLower = userText.toLowerCase();
      if (queryLower.includes("paper") || queryLower.includes("manuscript")) {
        try {
          const extraction = await extractManuscriptTextForProject(selectedProjectId);
          if (extraction.extracted && extraction.fullText.trim()) {
            activePaper = {
              fileName: extraction.fileName || "dossier_manuscript.pdf",
              fileType: extraction.fileType,
              text: extraction.fullText,
              pageCount: extraction.pageCount,
            };
          }
        } catch {}
      }
    }

    // 3. Save user message
    const userMeta: Record<string, any> = { projectId: selectedProjectId };
    if (activePaper) {
      userMeta.attachedPaper = {
        fileName: activePaper.fileName,
        fileType: activePaper.fileType,
        pageCount: activePaper.pageCount,
        // Store text in metadata so subsequent turns can recall it without re-uploading
        text: activePaper.text ? activePaper.text.slice(0, 35000) : "",
      };
    }

    const [userMsgInsert]: any = await pool.query(
      `INSERT INTO messages (conversationId, sender, content, metadata)
       VALUES (?, 'USER', ?, ?)`,
      [currentConvId, userText, JSON.stringify(userMeta)]
    );

    // 4. Fetch recent history
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

    // 5. Retrieve dossier context for reviewer
    let projectRecord = null;
    if (selectedProjectId) {
      projectRecord = await retrieveProjectForReviewer(selectedProjectId, session.id);
    }

    // 6. Execute chat with Together AI or resilient peer review grounding
    const aiResult = await executeProfessionalReviewerChat(history, userText, projectRecord, activePaper);

    // 7. Save assistant message
    const metadata = {
      model: aiResult.model,
      sources: aiResult.sources || [],
      projectId: selectedProjectId,
      plantName: projectRecord?.plantName || null,
      attachedPaper: activePaper
        ? { fileName: activePaper.fileName, pageCount: activePaper.pageCount }
        : null,
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

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "REVIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (conversationId) {
      await pool.query(
        "UPDATE conversations SET isArchived = 1, updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ? AND userId = ?",
        [parseInt(conversationId, 10), session.id]
      );
    } else {
      await pool.query(
        "UPDATE conversations SET isArchived = 1, updatedAt = CURRENT_TIMESTAMP(3) WHERE userId = ? AND activeContextType = 'PROFESSIONAL_REVIEW' AND isArchived = 0",
        [session.id]
      );
    }

    return NextResponse.json({ success: true, message: "Chat history cleared successfully." });
  } catch (error) {
    console.error("DELETE /api/reviewer/assistant/chat error:", error);
    return NextResponse.json({ error: "Failed to clear chat" }, { status: 500 });
  }
}


