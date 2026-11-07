import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import {
  ensureManuscriptUploadColumns,
  getManuscriptRecord,
  removeManuscriptFile,
  saveManuscriptFile,
} from "@/lib/manuscript-upload-service";

// GET /api/researcher/projects/[id]/manuscript
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "RESEARCHER" && session.role !== "REVIEWER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const manuscript = await getManuscriptRecord(projectId);

    return NextResponse.json({
      success: true,
      manuscript,
    });
  } catch (error: any) {
    console.error("Error fetching manuscript:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch manuscript" },
      { status: 500 }
    );
  }
}

// POST /api/researcher/projects/[id]/manuscript
export async function POST(
  req: Request,
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

    const [projRows]: any = await pool.query(
      `SELECT id, title, status FROM research_projects WHERE id = ? AND researcherId = ? LIMIT 1`,
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
    const projectTitle = projRows[0].title;

    const contentType = req.headers.get("content-type") || "";

    // 1. Multipart file upload (PDF or DOCX)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file || typeof file.arrayBuffer !== "function") {
        return NextResponse.json(
          { error: "Please select a PDF or DOCX file to upload." },
          { status: 400 }
        );
      }

      const arrayBuf = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);

      const saved = await saveManuscriptFile({
        projectId,
        projectTitle,
        originalName: file.name,
        mimeType: file.type || "",
        buffer,
      });

      const updatedRecord = await getManuscriptRecord(projectId);
      return NextResponse.json({
        success: true,
        message: "Research paper uploaded successfully.",
        manuscript: updatedRecord || saved,
      });
    }

    // 2. JSON actions (remove or metadata save)
    const body = await req.json();

    if (body.action === "remove") {
      await removeManuscriptFile(projectId);
      const updatedRecord = await getManuscriptRecord(projectId);
      return NextResponse.json({
        success: true,
        message: "Uploaded research paper removed.",
        manuscript: updatedRecord,
      });
    }

    await ensureManuscriptUploadColumns();
    const {
      title,
      abstract = "",
      introduction = "",
      materialsMethods = "",
      resultsDiscussion = "",
      conclusion = "",
      referencesText = "",
      fileUrl = null,
      status = "DRAFT",
    } = body;

    const finalTitle = (title || `${projectTitle} — Research Manuscript`).trim();

    await pool.query(
      `
      INSERT INTO research_manuscripts
        (projectId, title, abstract, introduction, materialsMethods, resultsDiscussion, conclusion, referencesText, fileUrl, status, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3))
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        abstract = VALUES(abstract),
        introduction = VALUES(introduction),
        materialsMethods = VALUES(materialsMethods),
        resultsDiscussion = VALUES(resultsDiscussion),
        conclusion = VALUES(conclusion),
        referencesText = VALUES(referencesText),
        fileUrl = COALESCE(VALUES(fileUrl), fileUrl),
        status = VALUES(status),
        updatedAt = CURRENT_TIMESTAMP(3)
      `,
      [
        projectId,
        finalTitle,
        abstract,
        introduction,
        materialsMethods,
        resultsDiscussion,
        conclusion,
        referencesText,
        fileUrl,
        status,
      ]
    );

    const updatedRecord = await getManuscriptRecord(projectId);
    return NextResponse.json({
      success: true,
      message: "Research manuscript saved successfully",
      manuscript: updatedRecord,
    });
  } catch (error: any) {
    console.error("Error saving/uploading manuscript:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save manuscript" },
      { status: 400 }
    );
  }
}

// DELETE /api/researcher/projects/[id]/manuscript
export async function DELETE(
  req: Request,
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

    const [projRows]: any = await pool.query(
      `SELECT id, status FROM research_projects WHERE id = ? AND researcherId = ? LIMIT 1`,
      [projectId, session.id]
    );
    if (projRows.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (String(projRows[0].status || "").toUpperCase() === "COMPLETED") {
      return NextResponse.json(
        { error: "This research project is Completed and locked against removing the manuscript." },
        { status: 403 }
      );
    }

    await removeManuscriptFile(projectId);
    const updatedRecord = await getManuscriptRecord(projectId);

    return NextResponse.json({
      success: true,
      message: "Uploaded research paper removed.",
      manuscript: updatedRecord,
    });
  } catch (error: any) {
    console.error("Error removing manuscript file:", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove manuscript file" },
      { status: 500 }
    );
  }
}
