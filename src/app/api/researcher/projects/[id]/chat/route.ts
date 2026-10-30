import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  buildResearcherEvidenceGrounding,
  ChatMessageParam,
} from "@/lib/ai-assistant-service";
import { callGrokChat, isGrokConfigured } from "@/lib/ai/grok-provider";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "RESEARCHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    // Verify project ownership
    const [projectRows]: any = await pool.query(
      "SELECT id, title, plantId, plantCustomName FROM research_projects WHERE id = ? AND researcherId = ?",
      [projectId, session.id]
    );

    if (projectRows.length === 0) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    const project = projectRows[0];
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const userText = message.trim();

    // 1. Retrieve real project evidence grounding
    const grounding = await buildResearcherEvidenceGrounding(projectId, userText);

    // 2. Build system prompt for researcher pair-programming/AI research assistant
    const systemPrompt = `You are the NatureAide AI Research Assistant, specialized in natural product drug discovery, botanical phytochemistry, and computational biology.

You are assisting a researcher on the project "${project.title}".

CRITICAL MULTI-PILLAR EVIDENCE ARCHITECTURE RULES:
1. LITERATURE: Real published scientific research from PubMed/NCBI. It provides published mechanistic precedent and biological plausibility, but NEVER converts computational predictions into experimental evidence.
2. PREDICTED: Computational outputs (e.g. molecular docking binding energies, in-silico ADMET). These are algorithmic models, NOT laboratory facts.
3. EXPERIMENTAL: Actual wet-lab measurements entered by researchers (e.g. IC50, MTT viability assays).
4. INTERPRETATION: Researcher conclusions derived from evidence.

STRICT ANTI-FABRICATION RULE:
- NEVER invent or hallucinate citations, authors, journals, publication years, PMIDs, or DOIs.
- All literature evidence must originate strictly from the ATTACHED PUBLISHED LITERATURE records provided in the grounding context.
- If the grounding context states that no verified literature exists for a target, compound, or docking result, you MUST explicitly answer:
  "No relevant verified literature found for this research context."
  Do NOT generate placeholder studies.

GROUNDING CONTEXT:
${grounding.groundingContextText}
`;

    const chatMessages: ChatMessageParam[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userText },
    ];

    let answerText = "";
    let modelUsed = "natureaide-grounded-engine";

    if (isGrokConfigured()) {
      const grokRes = await callGrokChat(chatMessages, {
        temperature: 0.1, // High precision
        maxTokens: 500,
      });

      if (grokRes.success && grokRes.content) {
        answerText = grokRes.content;
        modelUsed = grokRes.model;
      } else {
        answerText = grounding.groundedFallbackAnswer;
      }
    } else {
      answerText = grounding.groundedFallbackAnswer;
    }

    return NextResponse.json({
      success: true,
      answer: answerText,
      groundedItemsCount: grounding.literatureCount,
      hasMatchingLiterature: grounding.hasMatchingLiterature,
      modelUsed,
    });
  } catch (error) {
    console.error("Researcher Chat error:", error);
    return NextResponse.json({ error: "Failed to process research inquiry" }, { status: 500 });
  }
}
