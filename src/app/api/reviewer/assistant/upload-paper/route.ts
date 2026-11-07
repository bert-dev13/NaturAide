import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { getSession } from "@/lib/auth";
import {
  extractTextFromPdfBuffer,
  extractTextFromDocxBuffer,
  sanitizeUntrustedManuscriptText,
} from "@/lib/manuscript-text-extractor";

const MAX_UPLOAD_SIZE = 25 * 1024 * 1024; // 25 MB

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "REVIEWER" && session.role !== "RESEARCHER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const projectIdRaw = formData.get("projectId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        { error: "File exceeds the 25 MB maximum size limit." },
        { status: 400 }
      );
    }

    const fileName = file.name || "uploaded_paper.pdf";
    const ext = path.extname(fileName).toLowerCase();

    if (![".pdf", ".docx", ".txt", ".md"].includes(ext)) {
      return NextResponse.json(
        {
          error:
            "Unsupported file format. Please upload a PDF (.pdf), Word document (.docx), or plain text (.txt, .md).",
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = "";
    let pageCount = 1;
    let fileType: "pdf" | "docx" | "txt" | "md" = "pdf";

    if (ext === ".pdf") {
      fileType = "pdf";
      try {
        const res = extractTextFromPdfBuffer(buffer);
        extractedText = res.fullText;
        pageCount = res.pages.length || 1;
      } catch (err: any) {
        console.warn("PDF extraction notice:", err?.message);
        // Fallback: try raw text search or clean string
        extractedText = sanitizeUntrustedManuscriptText(buffer.toString("latin1"));
      }
    } else if (ext === ".docx") {
      fileType = "docx";
      try {
        const res = extractTextFromDocxBuffer(buffer);
        extractedText = res.fullText;
        pageCount = res.pages.length || 1;
      } catch (err: any) {
        console.warn("DOCX extraction notice:", err?.message);
        extractedText = sanitizeUntrustedManuscriptText(buffer.toString("utf-8"));
      }
    } else {
      fileType = ext === ".md" ? "md" : "txt";
      extractedText = buffer.toString("utf-8");
      pageCount = Math.max(1, Math.ceil(extractedText.length / 2500));
    }

    // Sanitize untrusted tokens
    const sanitized = sanitizeUntrustedManuscriptText(extractedText);

    if (!sanitized.trim()) {
      return NextResponse.json(
        {
          error:
            "No extractable text was found in this file. If this is a scanned PDF image, please provide a document with machine-readable text.",
        },
        { status: 422 }
      );
    }

    // Identify key sections (Abstract, Introduction, Methods, Results, Discussion, Conclusion)
    const detectedSections: Array<{ heading: string; preview: string }> = [];
    const sectionKeywords = [
      "abstract",
      "introduction",
      "materials and methods",
      "methodology",
      "results and discussion",
      "results",
      "discussion",
      "conclusion",
      "limitations",
      "safety",
      "phytochemical",
      "docking",
    ];

    const lines = sanitized.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lower = line.toLowerCase();
      if (
        line.length > 2 &&
        line.length < 50 &&
        sectionKeywords.some((kw) => lower.includes(kw))
      ) {
        const nextFewLines = lines
          .slice(i + 1, i + 5)
          .map((l) => l.trim())
          .filter(Boolean)
          .join(" ");
        detectedSections.push({
          heading: line,
          preview: nextFewLines.slice(0, 160) + (nextFewLines.length > 160 ? "..." : ""),
        });
      }
    }

    const preview = sanitized.slice(0, 300) + (sanitized.length > 300 ? "..." : "");

    return NextResponse.json({
      success: true,
      paper: {
        fileName,
        fileType,
        fileSize: file.size,
        pageCount,
        characterCount: sanitized.length,
        preview,
        fullText: sanitized,
        sections: detectedSections.slice(0, 8),
      },
    });
  } catch (error: any) {
    console.error("POST /api/reviewer/assistant/upload-paper error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process uploaded research paper." },
      { status: 500 }
    );
  }
}

