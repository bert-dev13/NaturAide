import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  EXPERT_REVIEW_AREAS,
  normalizeReviewAreaKey,
  getAreaDefinition,
  expertCheckingTitle,
  type ExpertReviewAreaKey,
} from "@/lib/expert-review-areas";
import { buildFullDossierSnapshot } from "@/lib/expert-review-assignment";

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
  { params }: { params: Promise<{ role: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "REVIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = await params;
    const roleKey = normalizeReviewAreaKey(role);
    const areaDef = getAreaDefinition(roleKey);

    const { searchParams } = new URL(request.url);
    const requestedProjectId = searchParams.get("projectId")
      ? parseInt(searchParams.get("projectId")!, 10)
      : null;
    const requestedAssignmentId = searchParams.get("assignmentId")
      ? parseInt(searchParams.get("assignmentId")!, 10)
      : null;

    // Fetch latest assignment per project for this role across the system
    const [assignments]: any = await pool.query(
      `
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
        rp.title as projectTitle,
        rp.shortDescription,
        rp.researchObjective,
        rp.currentStage,
        rp.status as projectStatus,
        COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
        p.scientificName as plantScientificName,
        p.category as plantCategory,
        u.id as researcherId,
        u.name as researcherName,
        rs.versionTag,
        rs.submittedAt,
        rs.messageToReviewers,
        rs.snapshotData,
        pr.assessment,
        pr.comments as reviewComments,
        pr.status as reviewStatus,
        (
          SELECT COUNT(*)
          FROM review_feedback rf
          WHERE rf.submissionId = ra.submissionId AND rf.areaKey = ? AND rf.status = 'OPEN'
        ) as openFindingsCount
      FROM review_assignments ra
      JOIN research_projects rp ON ra.projectId = rp.id
      JOIN users u ON rp.researcherId = u.id
      LEFT JOIN users u_rev ON ra.reviewerId = u_rev.id
      LEFT JOIN plants p ON rp.plantId = p.id
      JOIN review_submissions rs ON ra.submissionId = rs.id
      LEFT JOIN professional_reviews pr ON (pr.submissionId = ra.submissionId AND pr.areaKey = ?)
      WHERE (ra.specialtyNeeded = ? OR ra.specialtyNeeded = 'EXPERT_REVIEW')
        AND ra.id IN (
          SELECT MAX(ra2.id)
          FROM review_assignments ra2
          WHERE (ra2.specialtyNeeded = ? OR ra2.specialtyNeeded = 'EXPERT_REVIEW')
          GROUP BY ra2.projectId
        )
      ORDER BY
        (ra.reviewerId = ?) DESC,
        ra.assignedAt DESC,
        ra.id DESC
      `,
      [roleKey, roleKey, roleKey, roleKey, session.id]
    );

    if (assignments.length === 0) {
      // If no assignments exist yet, fetch latest submitted project snapshot for viewing
      const [latestSub]: any = await pool.query(
        `
        SELECT rs.id as submissionId, rs.projectId, rs.versionTag, rs.snapshotData,
               rp.title as projectTitle, rp.researchObjective,
               COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
               p.scientificName as plantScientificName,
               u.id as researcherId, u.name as researcherName
        FROM review_submissions rs
        JOIN research_projects rp ON rs.projectId = rp.id
        JOIN users u ON rp.researcherId = u.id
        LEFT JOIN plants p ON rp.plantId = p.id
        ORDER BY rs.id DESC
        LIMIT 1
        `
      );

      let fallbackSnapshot: any = null;
      let activeAssignment: any = null;

      if (latestSub.length > 0) {
        const sub = latestSub[0];
        try {
          fallbackSnapshot = typeof sub.snapshotData === "string" ? JSON.parse(sub.snapshotData) : sub.snapshotData;
        } catch (e) {
          console.error(e);
        }
        if (!fallbackSnapshot || !fallbackSnapshot.compounds) {
          fallbackSnapshot = await buildFullDossierSnapshot(sub.projectId);
        }

        activeAssignment = {
          assignmentId: 0,
          submissionId: sub.submissionId,
          projectId: sub.projectId,
          reviewerId: null,
          assignedReviewerName: "Unassigned",
          assignmentStatus: "PENDING",
          specialtyNeeded: roleKey,
          reviewRound: 1,
          projectTitle: sub.projectTitle,
          plantName: sub.plantName,
          plantScientificName: sub.plantScientificName,
          researcherName: sub.researcherName,
          versionTag: sub.versionTag || "v1.0",
          reviewArea: roleKey,
          reviewAreaLabel: areaDef.shortLabel,
        };
      }

      return NextResponse.json({
        success: true,
        roleKey,
        areaDefinition: areaDef,
        checkingTitle: expertCheckingTitle(roleKey),
        assignments: activeAssignment ? [activeAssignment] : [],
        activeAssignment,
        canEdit: false,
        isAssignedToCurrentUser: false,
        snapshot: fallbackSnapshot,
        reviewHistory: [],
        review: null,
        findings: [],
      });
    }

    // Determine active assignment
    let activeAssignment = assignments[0];
    if (requestedAssignmentId) {
      const match = assignments.find((a: any) => a.assignmentId === requestedAssignmentId);
      if (match) activeAssignment = match;
    } else if (requestedProjectId) {
      const match = assignments.find((a: any) => a.projectId === requestedProjectId);
      if (match) activeAssignment = match;
    }

    const projectId = activeAssignment.projectId;
    const submissionId = activeAssignment.submissionId;
    const isAssignedToCurrentUser = activeAssignment.reviewerId === session.id;
    const canEdit = isAssignedToCurrentUser;

    // Transition PENDING -> IN_REVIEW automatically upon opening if assigned to current user
    if (isAssignedToCurrentUser && activeAssignment.assignmentStatus === "PENDING") {
      await pool.query(
        "UPDATE review_assignments SET status = 'IN_REVIEW', startedAt = CURRENT_TIMESTAMP(3) WHERE id = ?",
        [activeAssignment.assignmentId]
      );
      await pool.query(
        "UPDATE review_area_coverage SET status = 'IN_REVIEW' WHERE submissionId = ? AND areaKey = ?",
        [submissionId, roleKey]
      );
      activeAssignment.assignmentStatus = "IN_REVIEW";
    }

    // Load or build exact versioned dossier snapshot
    let snapshot: any = null;
    if (activeAssignment.snapshotData) {
      try {
        snapshot =
          typeof activeAssignment.snapshotData === "string"
            ? JSON.parse(activeAssignment.snapshotData)
            : activeAssignment.snapshotData;
      } catch (e) {
        console.error("Error parsing snapshotData:", e);
      }
    }

    if (!snapshot || !snapshot.literature || !snapshot.compounds) {
      const fullSnapshot = await buildFullDossierSnapshot(projectId);
      snapshot = { ...fullSnapshot, ...snapshot };
    }

    // Attach botanical family
    if (!snapshot.botanicalFamily && !snapshot.plantFamily) {
      const sciName = activeAssignment.plantScientificName || snapshot.plantScientificName || "";
      snapshot.botanicalFamily = PLANT_FAMILY_MAP[sciName] || "Cucurbitaceae";
    }

    // Fetch review history across all cycles for this project & role
    const [historyRows]: any = await pool.query(
      `
      SELECT
        ra.id as assignmentId,
        ra.submissionId,
        ra.reviewRound,
        ra.status as assignmentStatus,
        ra.assignedAt,
        ra.completedAt,
        rs.versionTag,
        rs.submittedAt,
        pr.assessment,
        pr.comments as reviewComments
      FROM review_assignments ra
      JOIN review_submissions rs ON ra.submissionId = rs.id
      LEFT JOIN professional_reviews pr ON (
        pr.submissionId = ra.submissionId
        AND pr.areaKey = ?
      )
      WHERE ra.projectId = ?
        AND (ra.specialtyNeeded = ? OR ra.specialtyNeeded = 'EXPERT_REVIEW')
      ORDER BY ra.reviewRound DESC
      `,
      [roleKey, projectId, roleKey]
    );

    // Load current review draft/submission for this role
    const [reviewRows]: any = await pool.query(
      `SELECT * FROM professional_reviews WHERE submissionId = ? AND areaKey = ? LIMIT 1`,
      [submissionId, roleKey]
    );

    // Load findings for this role
    const [findings]: any = await pool.query(
      `
      SELECT rf.*, u.name as reviewerDisplayName
      FROM review_feedback rf
      LEFT JOIN users u ON rf.reviewerId = u.id
      WHERE rf.submissionId = ?
        AND (rf.areaKey = ? OR rf.areaKey IS NULL)
      ORDER BY
        CASE rf.severity
          WHEN 'CRITICAL' THEN 1
          WHEN 'MAJOR' THEN 2
          WHEN 'MINOR' THEN 3
          ELSE 4
        END ASC,
        rf.id ASC
      `,
      [submissionId, roleKey]
    );

    // Load findings from OTHER review areas for this submission (for cross-professional awareness)
    const [crossFindings]: any = await pool.query(
      `
      SELECT rf.id, rf.areaKey, rf.sectionName, rf.severity, rf.comment, rf.recommendation, rf.status, rf.createdAt
      FROM review_feedback rf
      WHERE rf.submissionId = ?
        AND rf.areaKey IS NOT NULL
        AND rf.areaKey != ?
        AND rf.status != 'RESOLVED'
      ORDER BY rf.id DESC
      `,
      [submissionId, roleKey]
    );

    return NextResponse.json({
      success: true,
      roleKey,
      areaDefinition: areaDef,
      checkingTitle: expertCheckingTitle(roleKey),
      assignments,
      activeAssignment: {
        ...activeAssignment,
        reviewArea: roleKey,
        reviewAreaLabel: areaDef.shortLabel,
      },
      canEdit,
      isAssignedToCurrentUser,
      assignedReviewerName: activeAssignment.assignedReviewerName,
      snapshot,
      reviewHistory: historyRows || [],
      review: reviewRows[0] || null,
      findings: findings || [],
      crossAreaFindings: crossFindings || [],
    });
  } catch (error) {
    console.error("GET /api/reviewer/checking/[role] error:", error);
    return NextResponse.json({ error: "Failed to load checking workspace" }, { status: 500 });
  }
}
