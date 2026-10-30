import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getProjectEvidenceLibrary, attachSupportingLiterature } from "@/lib/literature-service";

export async function GET(
  request: Request,
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

    // Verify ownership
    const [projectRows]: any = await pool.query(
      "SELECT id, title, plantId, plantCustomName, researchObjective FROM research_projects WHERE id = ? AND researcherId = ?",
      [projectId, session.id]
    );

    if (projectRows.length === 0) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    const project = projectRows[0];
    const { searchParams } = new URL(request.url);
    const evidenceClass = searchParams.get("class") || "ALL";
    const stageKey = searchParams.get("stage") || "ALL";
    const compound = searchParams.get("compound") || "ALL";
    const target = searchParams.get("target") || "ALL";
    const assayEndpoint = searchParams.get("assay") || "ALL";
    const searchQuery = searchParams.get("q") || "";

    const libraryData = await getProjectEvidenceLibrary(projectId, {
      evidenceClass,
      stageKey,
      compound,
      target,
      assayEndpoint,
      searchQuery,
    });

    return NextResponse.json({
      success: true,
      projectId,
      projectTitle: project.title,
      ...libraryData,
    });
  } catch (error) {
    console.error("Error fetching project evidence library:", error);
    return NextResponse.json({ error: "Failed to retrieve evidence library" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
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

    // Verify ownership
    const [projectRows]: any = await pool.query(
      "SELECT id, title FROM research_projects WHERE id = ? AND researcherId = ?",
      [projectId, session.id]
    );
    if (projectRows.length === 0) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      authors,
      year,
      journalSource,
      studyType,
      relevanceToCurrentResearch,
      doiOrUrl,
      evidenceClass = "REFERENCE",
      stageKey = "plant-literature",
      targetCompound,
      targetBiological,
      assayOrEndpoint,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Save into project_evidence_items with strict evidenceClass
    const [insertResult]: any = await pool.query(
      `
      INSERT INTO project_evidence_items (
        projectId, evidenceClass, stageKey, title, summary, authors,
        publicationYear, journalOrSource, doi, sourceUrl,
        relevanceScore, relevanceExplanation,
        targetCompound, targetBiological, assayOrEndpoint,
        isVerified, verificationSource
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 90.0, ?, ?, ?, ?, 1, 'Researcher Manual Entry')
      `,
      [
        projectId,
        evidenceClass,
        stageKey,
        title.trim(),
        relevanceToCurrentResearch?.trim() || "Researcher-entered reference supporting investigation.",
        authors?.trim() || "Researcher Submission",
        parseInt(year, 10) || new Date().getFullYear(),
        journalSource?.trim() || "Independent Scientific Literature",
        doiOrUrl?.includes("10.") ? doiOrUrl.trim() : null,
        doiOrUrl?.trim() || null,
        relevanceToCurrentResearch?.trim() || "Provides supplementary literature context.",
        targetCompound?.trim() || null,
        targetBiological?.trim() || null,
        assayOrEndpoint?.trim() || null,
      ]
    );

    // Also mirror to literature_references for backward compatibility
    await pool.query(
      `
      INSERT INTO literature_references (
        researcherId, projectId, sourceType, title, authors,
        year, journalSource, doiOrUrl, studyType, relevanceToCurrentResearch
      ) VALUES (?, ?, 'MANUAL_ENTRY', ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        session.id,
        projectId,
        title.trim(),
        authors?.trim() || "Researcher Submission",
        parseInt(year, 10) || new Date().getFullYear(),
        journalSource?.trim() || "Independent Scientific Literature",
        doiOrUrl?.trim() || null,
        studyType || "In-Vitro",
        relevanceToCurrentResearch?.trim() || "Custom reference curated by researcher.",
      ]
    );

    await pool.query(
      `
      INSERT INTO research_activity_logs (projectId, researcherId, actionType, description)
      VALUES (?, ?, 'REFERENCE_ADDED', ?)
      `,
      [projectId, session.id, `Researcher added ${evidenceClass} evidence: "${title.trim()}"`]
    );

    return NextResponse.json({
      success: true,
      id: insertResult.insertId,
      message: `${evidenceClass} record saved to project evidence library`,
    });
  } catch (error) {
    console.error("Error adding project evidence:", error);
    return NextResponse.json({ error: "Failed to add evidence" }, { status: 500 });
  }
}
