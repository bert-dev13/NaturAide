import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { extractManuscriptTextForProject } from "@/lib/manuscript-text-extractor";
import { getManuscriptRecord } from "@/lib/manuscript-upload-service";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "REVIEWER" && session.role !== "RESEARCHER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectIdRaw = searchParams.get("projectId");

    if (!projectIdRaw) {
      return NextResponse.json({ error: "projectId parameter is required" }, { status: 400 });
    }

    const projectId = parseInt(projectIdRaw, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid projectId" }, { status: 400 });
    }

    // Check if manuscript record exists
    const manuscript = await getManuscriptRecord(projectId);
    if (!manuscript) {
      return NextResponse.json({
        hasManuscript: false,
        message: "No manuscript has been uploaded for this dossier yet.",
      });
    }

    // Extract text from project manuscript
    const extraction = await extractManuscriptTextForProject(projectId);

    if (!extraction.extracted && !extraction.fullText.trim()) {
      return NextResponse.json({
        hasManuscript: true,
        fileName: extraction.fileName || manuscript.fileName || "manuscript.pdf",
        extracted: false,
        message: "Manuscript file exists but contains no readable machine text streams.",
      });
    }

    const preview = extraction.fullText.slice(0, 300) + (extraction.fullText.length > 300 ? "..." : "");

    return NextResponse.json({
      hasManuscript: true,
      extracted: true,
      paper: {
        fileName: extraction.fileName || manuscript.fileName || "dossier_manuscript.pdf",
        fileType: extraction.fileType,
        pageCount: extraction.pageCount || 1,
        characterCount: extraction.fullText.length,
        preview,
        fullText: extraction.fullText,
        sections: extraction.sections.slice(0, 8).map((s) => ({
          heading: s.heading,
          preview: s.content.slice(0, 160) + (s.content.length > 160 ? "..." : ""),
        })),
      },
    });
  } catch (error: any) {
    console.error("GET /api/reviewer/assistant/project-manuscript error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load project manuscript." },
      { status: 500 }
    );
  }
}

