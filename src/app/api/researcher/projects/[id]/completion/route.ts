import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { GET as completionIntegrationGET, POST as completionIntegrationPOST } from "../completion-integration/route";

// GET /api/researcher/projects/[id]/completion
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return completionIntegrationGET(request, context);
}

// POST /api/researcher/projects/[id]/completion
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== "RESEARCHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const [projRows]: any = await pool.query(
      "SELECT id, status FROM research_projects WHERE id = ? AND researcherId = ? LIMIT 1",
      [projectId, session.id]
    );
    if (projRows.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (String(projRows[0].status || "").toUpperCase() === "COMPLETED") {
      return NextResponse.json(
        { error: "This research project is Completed and locked against editing." },
        { status: 403 }
      );
    }

    // Clone request body to inspect
    const body = await request.json();

    // If saving Section 3 Executive Research Summary
    if (body.executiveSummary !== undefined) {
      const summary = String(body.executiveSummary || "").trim();

      // Upsert research_dossiers
      const [existingDossier]: any = await pool.query(
        "SELECT id FROM research_dossiers WHERE projectId = ? LIMIT 1",
        [projectId]
      );

      if (existingDossier.length > 0) {
        await pool.query(
          `
          UPDATE research_dossiers
          SET executiveSummary = ?, updatedAt = CURRENT_TIMESTAMP(3)
          WHERE projectId = ?
          `,
          [summary, projectId]
        );
      } else {
        await pool.query(
          `
          INSERT INTO research_dossiers (projectId, researcherId, currentVersionTag, status, executiveSummary, createdAt, updatedAt)
          VALUES (?, ?, 'v1.0', 'DRAFT', ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
          `,
          [projectId, session.id, summary]
        );
      }

      // Also upsert research_completions for backward compatibility
      const [existingComp]: any = await pool.query(
        "SELECT id FROM research_completions WHERE projectId = ? LIMIT 1",
        [projectId]
      );

      if (existingComp.length > 0) {
        await pool.query(
          `
          UPDATE research_completions
          SET abstract = ?, scientificInterpretation = ?, isSynthesisApproved = 1, updatedAt = CURRENT_TIMESTAMP(3)
          WHERE projectId = ?
          `,
          [summary, summary, projectId]
        );
      } else {
        await pool.query(
          `
          INSERT INTO research_completions (projectId, finalTitle, abstract, scientificInterpretation, isSynthesisApproved, updatedAt)
          VALUES (?, 'Research Dossier', ?, ?, 1, CURRENT_TIMESTAMP(3))
          `,
          [projectId, summary, summary]
        );
      }

      return NextResponse.json({
        success: true,
        message: "Executive research summary saved successfully!",
        executiveSummary: summary,
      });
    }

    // Otherwise, create a new Request with the parsed body and forward to completionIntegrationPOST
    const forwardReq = new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify(body),
    });
    return completionIntegrationPOST(forwardReq, context);
  } catch (error: any) {
    console.error("Error saving research completion summary:", error);
    return NextResponse.json({ error: error.message || "Failed to save completion summary" }, { status: 500 });
  }
}
