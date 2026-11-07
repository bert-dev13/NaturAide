import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import { getManuscriptRecord } from "@/lib/manuscript-upload-service";

// GET /api/researcher/projects/[id]/manuscript/file
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

    // Verify ownership for RESEARCHER (REVIEWER has access to review project manuscripts)
    if (session.role === "RESEARCHER") {
      const [projRows]: any = await pool.query(
        `SELECT id FROM research_projects WHERE id = ? AND researcherId = ? LIMIT 1`,
        [projectId, session.id]
      );
      if (projRows.length === 0) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const manuscript = await getManuscriptRecord(projectId);
    if (!manuscript || !manuscript.storagePath) {
      return NextResponse.json(
        { error: "No uploaded research paper found for this project." },
        { status: 404 }
      );
    }

    const fileBuffer = await fs.readFile(manuscript.storagePath);
    const url = new URL(req.url);
    const forceDownload = url.searchParams.get("download") === "1";

    const mimeType = manuscript.mimeType || "application/octet-stream";
    const fileName = (manuscript.fileName || `manuscript-project-${projectId}.pdf`).replace(
      /["\r\n]/g,
      "_"
    );
    const disposition =
      !forceDownload && mimeType === "application/pdf"
        ? `inline; filename="${fileName}"`
        : `attachment; filename="${fileName}"`;

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(fileBuffer.length),
        "Content-Disposition": disposition,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error: any) {
    console.error("Error serving manuscript file:", error);
    return NextResponse.json(
      { error: "Unable to read uploaded manuscript file." },
      { status: 404 }
    );
  }
}

