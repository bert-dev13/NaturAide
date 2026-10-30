import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  EXPERT_REVIEW_AREAS,
  normalizeReviewAreaKey,
  expertReviewAreaLabel,
  getAreaDefinition,
} from "@/lib/expert-review-areas";
import { openExpertReviewCycle, buildFullDossierSnapshot } from "@/lib/expert-review-assignment";

async function dossierReadyForProfessionalReview(projectId: number) {
  const [stages]: any = await pool.query(
    "SELECT stageKey, status FROM research_project_stages WHERE projectId = ?",
    [projectId]
  );
  const stageMap: Record<string, string> = {};
  for (const stage of stages) stageMap[stage.stageKey] = stage.status;
  const done = (key: string) => stageMap[key] === "COMPLETED";
  return (
    (done("plant-literature") || done("evidence-review") || (done("plant-research") && done("literature"))) &&
    done("in-silico") &&
    done("docking") &&
    (done("formulation-safety") || (done("formulation") && done("safety"))) &&
    (done("completion-integration") || done("completion"))
  );
}

async function assertOwnedProject(projectId: number, researcherId: number) {
  const [rows]: any = await pool.query(
    "SELECT id FROM research_projects WHERE id = ? AND researcherId = ? LIMIT 1",
    [projectId, researcherId]
  );
  return rows.length > 0;
}

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

    // 1. Project & plant
    const [pRows]: any = await pool.query(
      `
      SELECT rp.*,
             COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
             p.scientificName as plantScientificName,
             p.category as plantFamily
      FROM research_projects rp
      LEFT JOIN plants p ON rp.plantId = p.id
      WHERE rp.id = ? AND rp.researcherId = ?
      LIMIT 1
      `,
      [projectId, session.id]
    );

    if (pRows.length === 0) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }
    const project = pRows[0];

    // 2. Stages
    const [stages]: any = await pool.query(
      "SELECT stageKey, status FROM research_project_stages WHERE projectId = ?",
      [projectId]
    );
    const stageMap: Record<string, string> = {};
    for (const s of stages) {
      stageMap[s.stageKey] = s.status;
    }

    // 3. Latest submission
    const [submissions]: any = await pool.query(
      `
      SELECT rs.*
      FROM review_submissions rs
      WHERE rs.projectId = ?
      ORDER BY rs.reviewRound DESC, rs.id DESC
      LIMIT 1
      `,
      [projectId]
    );
    const latestSubmission = submissions[0] || null;

    let coverageList: any[] = [];
    let feedbackList: any[] = [];

    if (latestSubmission) {
      // 4. Fetch 5 professional review areas coverage
      const [covRows]: any = await pool.query(
        `
        SELECT rac.areaKey, rac.status, pr.assessment, pr.comments, pr.submittedAt
        FROM review_area_coverage rac
        LEFT JOIN professional_reviews pr ON (pr.submissionId = rac.submissionId AND pr.areaKey = rac.areaKey)
        WHERE rac.submissionId = ?
        ORDER BY rac.id ASC
        `,
        [latestSubmission.id]
      );

      const covMap: Record<string, any> = {};
      for (const row of covRows) {
        covMap[normalizeReviewAreaKey(row.areaKey)] = row;
      }

      coverageList = EXPERT_REVIEW_AREAS.map((areaDef) => {
        const item = covMap[areaDef.key];
        const status = item?.status || "PENDING";
        return {
          key: areaDef.key,
          label: areaDef.shortLabel,
          order: areaDef.order,
          detail: areaDef.detail,
          status, // 'PENDING' | 'IN_REVIEW' | 'REVISION_REQUIRED' | 'APPROVED'
          isApproved: status === "APPROVED" || status === "COMPLETED",
          isRevisionRequired: status === "REVISION_REQUIRED",
          isInReview: status === "IN_REVIEW",
          isPending: status === "PENDING" || status === "NOT_REVIEWED",
          assessment: item?.assessment || null,
          comments: item?.comments || null,
          submittedAt: item?.submittedAt || null,
        };
      });

      // 5. Fetch feedback / findings (omit reviewer private emails/passwords)
      const [fbRows]: any = await pool.query(
        `
        SELECT
          rf.id,
          rf.areaKey,
          rf.sectionName,
          rf.comment,
          rf.title,
          rf.severity,
          rf.status,
          rf.affectedStage,
          rf.recommendation,
          rf.referenceLink,
          rf.researcherReply as researcherResponse,
          rf.researcherRepliedAt,
          rf.resolvedAt,
          rf.createdAt
        FROM review_feedback rf
        WHERE rf.submissionId = ?
        ORDER BY
          CASE rf.severity
            WHEN 'CRITICAL' THEN 1
            WHEN 'MAJOR' THEN 2
            WHEN 'MINOR' THEN 3
            ELSE 4
          END ASC,
          rf.id ASC
        `,
        [latestSubmission.id]
      );

      feedbackList = fbRows.map((f: any) => ({
        ...f,
        areaKey: normalizeReviewAreaKey(f.areaKey),
        areaLabel: expertReviewAreaLabel(f.areaKey),
      }));
    } else {
      coverageList = EXPERT_REVIEW_AREAS.map((a) => ({
        key: a.key,
        label: a.shortLabel,
        order: a.order,
        detail: a.detail,
        status: "NOT_SUBMITTED",
        isApproved: false,
        isRevisionRequired: false,
        isInReview: false,
        isPending: false,
      }));
    }

    // 6. Readiness check (stages 1 to 5)
    const isStage1Done =
      stageMap["plant-literature"] === "COMPLETED" ||
      stageMap["evidence-review"] === "COMPLETED" ||
      (stageMap["plant-research"] === "COMPLETED" && stageMap["literature"] === "COMPLETED");
    const isStage2Done = stageMap["in-silico"] === "COMPLETED";
    const isStage3Done = stageMap["docking"] === "COMPLETED";
    const isStage4Done =
      stageMap["formulation-safety"] === "COMPLETED" ||
      (stageMap["formulation"] === "COMPLETED" && stageMap["safety"] === "COMPLETED");
    const isStage5Done =
      stageMap["completion-integration"] === "COMPLETED" || stageMap["completion"] === "COMPLETED";

    const isReadyForReview =
      isStage1Done && isStage2Done && isStage3Done && isStage4Done && isStage5Done;

    // 7. Calculate aggregate approval progress
    const approvedCount = coverageList.filter((a) => a.isApproved).length;
    const revisionCount = coverageList.filter((a) => a.isRevisionRequired).length;
    const isFullyApproved = coverageList.length >= 5 && approvedCount === coverageList.length;

    // 8. Fetch Dossier data (current Stage 5 state + frozen snapshot if submitted)
    const currentDossier = await buildFullDossierSnapshot(projectId);
    let submittedDossier = null;
    if (latestSubmission?.snapshotData) {
      try {
        submittedDossier =
          typeof latestSubmission.snapshotData === "string"
            ? JSON.parse(latestSubmission.snapshotData)
            : latestSubmission.snapshotData;
      } catch {
        submittedDossier = null;
      }
    }
    const dossier = submittedDossier || currentDossier;

    // 9. Review history
    const [allSubmissions]: any = await pool.query(
      `
      SELECT rs.id, rs.versionTag, rs.reviewRound, rs.status, rs.submittedAt, rs.messageToReviewers
      FROM review_submissions rs
      WHERE rs.projectId = ?
      ORDER BY rs.reviewRound DESC, rs.id DESC
      `,
      [projectId]
    );

    return NextResponse.json({
      project,
      stageMap,
      isReadyForReview,
      readiness: {
        stage1: isStage1Done,
        stage2: isStage2Done,
        stage3: isStage3Done,
        stage4: isStage4Done,
        stage5: isStage5Done,
      },
      latestSubmission,
      coverageAreas: coverageList,
      approvalStats: {
        totalAreas: coverageList.length,
        approvedCount,
        revisionCount,
        isFullyApproved,
        progressText: `${approvedCount} of ${coverageList.length} professional reviews approved`,
      },
      feedbackList,
      dossier,
      currentDossier,
      submittedDossier,
      reviewHistory: allSubmissions || [],
    });
  } catch (error) {
    console.error("Expert-review GET error:", error);
    return NextResponse.json({ error: "Failed to fetch expert review data" }, { status: 500 });
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

    const body = await request.json();
    const { action } = body;

    // SUBMIT DOSSIER FOR PROFESSIONAL REVIEW (STAGE 6)
    if (action === "submit") {
      const owned = await assertOwnedProject(projectId, session.id);
      if (!owned) return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
      const ready = await dossierReadyForProfessionalReview(projectId);
      if (!ready) {
        return NextResponse.json(
          { error: "Finish research integration before submitting the dossier for professional review." },
          { status: 400 }
        );
      }

      const dossierSnapshot = await buildFullDossierSnapshot(projectId);
      const opened = await openExpertReviewCycle({
        projectId,
        researcherId: session.id,
        message: body.messageToReviewers,
        snapshotData: dossierSnapshot,
      });

      return NextResponse.json({
        success: true,
        message: "Dossier submitted for Professional Review across all 5 areas.",
        submissionId: opened.submissionId,
        reviewRound: opened.reviewRound,
      });
    }

    // SAVE RESEARCHER RESPONSE TO FINDING
    if (action === "save-response") {
      const { feedbackId, researcherReply } = body;
      if (!feedbackId) {
        return NextResponse.json({ error: "Missing feedbackId" }, { status: 400 });
      }

      await pool.query(
        `
        UPDATE review_feedback
        SET researcherReply = ?,
            researcherRepliedAt = CURRENT_TIMESTAMP(3),
            status = 'ADDRESSED',
            updatedAt = CURRENT_TIMESTAMP(3)
        WHERE id = ? AND projectId = ?
        `,
        [researcherReply?.trim() || "Addressed by researcher", feedbackId, projectId]
      );

      return NextResponse.json({
        success: true,
        message: "Researcher response saved.",
      });
    }

    // RESUBMIT REVISED DOSSIER (NEW REVIEW CYCLE)
    if (action === "resubmit") {
      const owned = await assertOwnedProject(projectId, session.id);
      if (!owned) return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });

      // Build new dossier snapshot capturing updated researcher content
      const updatedDossier = await buildFullDossierSnapshot(projectId);
      const opened = await openExpertReviewCycle({
        projectId,
        researcherId: session.id,
        message: body.revisionSummary || "Revisions addressed and returned for professional review.",
        snapshotData: updatedDossier,
      });

      return NextResponse.json({
        success: true,
        message: `Revised dossier resubmitted for Professional Review (Cycle ${opened.reviewRound}).`,
        submissionId: opened.submissionId,
        reviewRound: opened.reviewRound,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Expert-review POST error:", error);
    return NextResponse.json({ error: "Failed to process expert review action" }, { status: 500 });
  }
}
