import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { normalizeReviewAreaKey, expertReviewAreaLabel } from "@/lib/expert-review-areas";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "REVIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch findings where the researcher responded or status is ADDRESSED or OPEN
    const [findings]: any = await pool.query(
      `
      SELECT
        rf.id as findingId,
        rf.projectId,
        rf.submissionId,
        rf.reviewRound,
        rf.sectionName,
        rf.comment as originalFinding,
        rf.title as findingTitle,
        rf.severity,
        rf.status as findingStatus,
        rf.researcherReply as researcherResponse,
        rf.researcherRepliedAt,
        rf.resolvedAt,
        rf.areaKey,
        rf.affectedStage,
        rp.title as projectTitle,
        COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
        p.scientificName as plantScientificName,
        u.name as researcherName,
        rs.versionTag,
        ra.id as assignmentId,
        ra.status as assignmentStatus
      FROM review_feedback rf
      JOIN research_projects rp ON rf.projectId = rp.id
      JOIN users u ON rp.researcherId = u.id
      LEFT JOIN plants p ON rp.plantId = p.id
      JOIN review_submissions rs ON rf.submissionId = rs.id
      LEFT JOIN review_assignments ra ON (ra.submissionId = rf.submissionId AND ra.reviewerId = rf.reviewerId AND (ra.specialtyNeeded = rf.areaKey OR ra.specialtyNeeded = 'EXPERT_REVIEW'))
      WHERE rf.reviewerId = ?
        AND (rf.researcherReply IS NOT NULL OR rf.status = 'ADDRESSED' OR ra.status = 'REVISION_REQUIRED' OR ra.status = 'RESUBMITTED')
      ORDER BY
        CASE rf.status
          WHEN 'ADDRESSED' THEN 1
          WHEN 'OPEN' THEN 2
          ELSE 3
        END ASC,
        rf.updatedAt DESC
      `,
      [session.id]
    );

    const formatted = findings.map((f: any) => {
      const area = normalizeReviewAreaKey(f.areaKey || "pharmacognosy");
      return {
        ...f,
        areaKey: area,
        areaLabel: expertReviewAreaLabel(area),
      };
    });

    return NextResponse.json({
      success: true,
      revisions: formatted,
    });
  } catch (error) {
    console.error("GET /api/reviewer/revisions error:", error);
    return NextResponse.json({ error: "Failed to load revisions" }, { status: 500 });
  }
}
