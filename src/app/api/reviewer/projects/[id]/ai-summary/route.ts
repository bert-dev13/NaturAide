import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { normalizeReviewAreaKey } from "@/lib/expert-review-areas";
import {
  getSavedAiReviewSummary,
  generateAndSaveAiReviewSummary,
} from "@/lib/reviewer-ai-summary-service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "REVIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const url = new URL(request.url);
    const rawSpecialty = url.searchParams.get("specialty") || url.searchParams.get("areaKey");
    if (!rawSpecialty) {
      return NextResponse.json({ error: "specialty query parameter is required" }, { status: 400 });
    }
    const specialty = normalizeReviewAreaKey(rawSpecialty);

    let submissionId = url.searchParams.get("submissionId")
      ? parseInt(url.searchParams.get("submissionId")!, 10)
      : null;

    if (!submissionId) {
      const [latestRows]: any = await pool.query(
        `SELECT id FROM review_submissions WHERE projectId = ? ORDER BY reviewRound DESC, id DESC LIMIT 1`,
        [projectId]
      );
      if (!latestRows || latestRows.length === 0) {
        return NextResponse.json(
          { error: "No submitted research version found for this project." },
          { status: 404 }
        );
      }
      submissionId = Number(latestRows[0].id);
    }

    const result = await getSavedAiReviewSummary({
      projectId,
      submissionId,
      specialty,
    });

    return NextResponse.json({
      success: true,
      projectId,
      submissionId,
      specialty,
      ...result,
    });
  } catch (error: any) {
    console.error("GET /api/reviewer/projects/[id]/ai-summary error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load saved AI review summary" },
      { status: error?.status || 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "REVIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const rawSpecialty = body.specialty || body.areaKey;
    if (!rawSpecialty) {
      return NextResponse.json(
        { error: "Specialty is required to generate an AI review summary." },
        { status: 400 }
      );
    }

    const submissionId = body.submissionId ? Number(body.submissionId) : null;
    const simulateFailure = Boolean(body.simulateFailure);

    const { summary, regenerationHistoryCount } = await generateAndSaveAiReviewSummary({
      projectId,
      submissionId,
      specialty: rawSpecialty,
      reviewerId: session.id,
      simulateFailure,
    });

    return NextResponse.json({
      success: true,
      summary,
      regenerationHistoryCount,
    });
  } catch (error: any) {
    console.error("POST /api/reviewer/projects/[id]/ai-summary error:", error);
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Failed to generate AI review summary with Together AI. Please try again.",
      },
      { status: error?.status || 500 }
    );
  }
}

