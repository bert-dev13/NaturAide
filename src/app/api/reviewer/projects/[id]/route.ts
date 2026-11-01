import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getAllProfessionalReviewStages } from "@/lib/professional-review-status";

const PLANT_FAMILY_MAP: Record<string, string> = {
  "Momordica charantia": "Cucurbitaceae",
  "Blumea balsamifera": "Asteraceae",
  "Vitex negundo": "Lamiaceae (Verbenaceae)",
  "Psidium guajava": "Myrtaceae",
  "Senna alata": "Fabaceae",
  "Allium sativum": "Amaryllidaceae",
  "Curcuma longa": "Zingiberaceae",
  "Peperomia pellucida": "Piperaceae",
  "Carmona retusa": "Boraginaceae",
  "Mentha cordifolia": "Lamiaceae",
  "Quisqualis indica": "Combretaceae",
  "Zingiber officinale": "Zingiberaceae",
};

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

    const reviewData = await getAllProfessionalReviewStages(projectId);
    const { project, areas, stages, completedReviewsCount, totalRequiredReviews, overallStatus } =
      reviewData;

    const [subRows]: any = await pool.query(
      `
      SELECT
        id as submissionId,
        versionTag,
        reviewRound,
        messageToReviewers,
        status as submissionStatus,
        submittedAt
      FROM review_submissions
      WHERE projectId = ?
      ORDER BY reviewRound DESC, id DESC
      LIMIT 1
      `,
      [projectId]
    );

    const latestSubmission = subRows[0] || null;

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        title: project.title,
        shortDescription: project.shortDescription,
        researchObjective: project.researchObjective,
        currentStage: project.currentStage,
        plantName: project.plantName,
        plantScientificName: project.plantScientificName,
        plantFamily:
          (project.plantScientificName && PLANT_FAMILY_MAP[project.plantScientificName]) || null,
        researcherName: project.researcherName,
        researcherEmail: project.researcherEmail,
        cycle: latestSubmission?.reviewRound || 1,
        versionTag: latestSubmission?.versionTag || "v1.0",
        submittedAt: latestSubmission?.submittedAt || project.createdAt,
        updatedAt: project.updatedAt,
        overallStatus,
        completedReviewsCount,
        totalRequiredReviews,
        areas,
        stages,
      },
    });
  } catch (error: any) {
    console.error("GET /api/reviewer/projects/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load project review data" },
      { status: 500 }
    );
  }
}

