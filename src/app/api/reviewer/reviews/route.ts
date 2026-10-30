import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  EXPERT_REVIEW_AREAS,
  normalizeReviewAreaKey,
  expertReviewAreaLabel,
  expertProfessionTitle,
} from "@/lib/expert-review-areas";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "REVIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const status = searchParams.get("status")?.trim();
    const area = searchParams.get("area")?.trim();
    const sort = searchParams.get("sort") || "newest";

    // Query latest assignment per (projectId, specialtyNeeded)
    let query = `
      SELECT
        ra.id as assignmentId,
        ra.submissionId,
        ra.projectId,
        ra.reviewerId,
        u_rev.name as assignedReviewerName,
        ra.status as assignmentStatus,
        ra.specialtyNeeded,
        ra.reviewRound,
        ra.assignedAt,
        ra.startedAt,
        ra.completedAt,
        ra.updatedAt,
        rp.title as projectTitle,
        rp.shortDescription,
        rp.currentStage,
        rp.progressPercent,
        COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
        p.scientificName as plantScientificName,
        p.category as plantCategory,
        u.id as researcherId,
        u.name as researcherName,
        u.email as researcherEmail,
        rs.versionTag,
        rs.submittedAt,
        rs.messageToReviewers,
        pr.assessment,
        pr.comments as reviewComments,
        pr.status as reviewFormStatus,
        (
          SELECT COUNT(*)
          FROM review_feedback rf
          WHERE rf.submissionId = ra.submissionId
            AND (rf.areaKey = ra.specialtyNeeded OR rf.reviewerId = ra.reviewerId)
        ) as totalFindingsCount,
        (
          SELECT COUNT(*)
          FROM review_feedback rf
          WHERE rf.submissionId = ra.submissionId
            AND (rf.areaKey = ra.specialtyNeeded OR rf.reviewerId = ra.reviewerId)
            AND rf.status = 'OPEN'
        ) as openFindingsCount
      FROM review_assignments ra
      JOIN research_projects rp ON ra.projectId = rp.id
      JOIN users u ON rp.researcherId = u.id
      LEFT JOIN users u_rev ON ra.reviewerId = u_rev.id
      LEFT JOIN plants p ON rp.plantId = p.id
      JOIN review_submissions rs ON ra.submissionId = rs.id
      LEFT JOIN professional_reviews pr ON (
        pr.submissionId = ra.submissionId
        AND pr.areaKey = ra.specialtyNeeded
      )
      WHERE ra.id IN (
        SELECT MAX(ra_latest.id)
        FROM review_assignments ra_latest
        GROUP BY ra_latest.projectId, ra_latest.specialtyNeeded
      )
    `;

    const params: any[] = [];

    // Filter by specific area if provided
    if (area && area !== "ALL") {
      const normArea = normalizeReviewAreaKey(area);
      const areaDef = EXPERT_REVIEW_AREAS.find((a) => a.key === normArea);
      const possibleKeys = areaDef ? [areaDef.key, ...(areaDef.aliases || [])] : [normArea];
      const placeholders = possibleKeys.map(() => "?").join(",");
      query += ` AND (ra.specialtyNeeded IN (${placeholders}) OR ra.specialtyNeeded = 'EXPERT_REVIEW')`;
      params.push(...possibleKeys);
    }

    // Status filtering
    if (status && status !== "ALL") {
      if (status === "PENDING") {
        query += ` AND ra.status = 'PENDING'`;
      } else if (status === "IN_REVIEW") {
        query += ` AND ra.status = 'IN_REVIEW'`;
      } else if (status === "REVISION_REQUIRED" || status === "REVISIONS") {
        query += ` AND (ra.status = 'REVISION_REQUIRED' OR ra.status = 'RESUBMITTED')`;
      } else if (status === "COMPLETED" || status === "APPROVED") {
        query += ` AND (ra.status = 'COMPLETED' OR ra.status = 'APPROVED')`;
      } else {
        query += ` AND ra.status = ?`;
        params.push(status);
      }
    }

    // Text search
    if (q) {
      query += ` AND (
        rp.title LIKE ? OR
        p.commonName LIKE ? OR
        rp.plantCustomName LIKE ? OR
        u.name LIKE ?
      )`;
      const term = `%${q}%`;
      params.push(term, term, term, term);
    }

    if (sort === "oldest") {
      query += ` ORDER BY ra.assignedAt ASC`;
    } else if (sort === "round") {
      query += ` ORDER BY ra.reviewRound DESC, ra.assignedAt DESC`;
    } else {
      query += ` ORDER BY ra.assignedAt DESC, ra.id DESC`;
    }

    const [reviews]: any = await pool.query(query, params);

    // Fetch prior historical review cycles for each check
    const formattedReviews = await Promise.all(
      reviews.map(async (r: any) => {
        const normalizedArea = normalizeReviewAreaKey(r.specialtyNeeded);
        const isAssignedToCurrentUser = r.reviewerId === session.id;

        const [history]: any = await pool.query(
          `
          SELECT
            ra_hist.id as assignmentId,
            ra_hist.submissionId,
            ra_hist.reviewRound,
            ra_hist.status as assignmentStatus,
            ra_hist.assignedAt,
            ra_hist.completedAt,
            rs_hist.versionTag,
            rs_hist.submittedAt,
            pr_hist.assessment,
            pr_hist.comments as reviewComments
          FROM review_assignments ra_hist
          JOIN review_submissions rs_hist ON ra_hist.submissionId = rs_hist.id
          LEFT JOIN professional_reviews pr_hist ON (
            pr_hist.submissionId = ra_hist.submissionId
            AND pr_hist.areaKey = ?
          )
          WHERE ra_hist.projectId = ?
            AND (ra_hist.specialtyNeeded = ? OR ra_hist.specialtyNeeded = 'EXPERT_REVIEW')
          ORDER BY ra_hist.reviewRound DESC
          `,
          [normalizedArea, r.projectId, r.specialtyNeeded]
        );

        return {
          ...r,
          reviewAreaKey: normalizedArea,
          reviewAreaLabel: expertReviewAreaLabel(normalizedArea),
          professionTitle: expertProfessionTitle(normalizedArea),
          isAssignedToCurrentUser,
          history: history || [],
          displayStatus:
            r.assignmentStatus === "COMPLETED" || r.assignmentStatus === "APPROVED"
              ? "Approved"
              : r.assignmentStatus === "REVISION_REQUIRED"
              ? "Revision Required"
              : r.assignmentStatus === "IN_REVIEW"
              ? "In Review"
              : "Pending",
        };
      })
    );

    return NextResponse.json({
      success: true,
      reviews: formattedReviews,
    });
  } catch (error) {
    console.error("GET /api/reviewer/reviews error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}
