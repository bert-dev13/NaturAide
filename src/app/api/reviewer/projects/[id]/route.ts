import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  EXPERT_REVIEW_AREAS,
  expertReviewAreaLabel,
  expertProfessionTitle,
  normalizeReviewAreaKey,
} from "@/lib/expert-review-areas";
import {
  ensureReviewTables,
  buildFullDossierSnapshot,
  getReviewerSpecialties,
  assertReviewerPermissionForSpecialty,
  evaluateOverallApproval,
  compareSubmissionSnapshots,
  getProjectApprovedSteps,
  approveAllSectionSteps,
  SECTION_TOTAL_STEPS,
} from "@/lib/expert-review-assignment";
import {
  hydrateSummaryRow,
  type SavedAiReviewSummaryRecord,
} from "@/lib/reviewer-ai-summary-service";

function mapCoverageStatusToDisplay(
  rawStatus?: string | null
): "Pending" | "In Review" | "Revision Required" | "Approved" {
  const norm = String(rawStatus || "PENDING").toUpperCase();
  if (norm === "APPROVED" || norm === "COMPLETED") return "Approved";
  if (norm === "REVISION_REQUIRED" || norm === "REVISIONS_REQUESTED") return "Revision Required";
  if (norm === "IN_REVIEW" || norm === "UNDER_REVIEW") return "In Review";
  return "Pending";
}

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

    await ensureReviewTables();

    const url = new URL(request.url);
    const requestedSubmissionId = url.searchParams.get("submissionId")
      ? parseInt(url.searchParams.get("submissionId")!, 10)
      : null;

    // 1. Fetch Project & Researcher Details
    const [projectRows]: any = await pool.query(
      `
      SELECT
        rp.id,
        rp.title,
        rp.researchObjective,
        rp.researchQuestion,
        rp.shortDescription,
        rp.status as projectStatus,
        rp.currentStage,
        rp.updatedAt,
        rp.researcherId,
        COALESCE(rpd.commonName, p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
        COALESCE(rpd.scientificName, p.scientificName, '') as plantScientificName,
        COALESCE(rpd.family, p.category, '') as plantFamily,
        u.name as researcherName,
        u.email as researcherEmail
      FROM research_projects rp
      JOIN users u ON rp.researcherId = u.id
      LEFT JOIN plants p ON rp.plantId = p.id
      LEFT JOIN research_plant_data rpd ON rpd.projectId = rp.id
      WHERE rp.id = ?
      LIMIT 1
      `,
      [projectId]
    );

    if (projectRows.length === 0) {
      return NextResponse.json({ error: "Research project not found" }, { status: 404 });
    }
    const project = projectRows[0];
    const isSelfResearcher = Number(project.researcherId) === Number(session.id);

    // 2. Reviewer's Assigned Specialties
    const assignedSpecialties = await getReviewerSpecialties(session.id);

    // 3. Fetch All Submission Versions for this Project
    const [allSubmissions]: any = await pool.query(
      `
      SELECT id, projectId, versionTag, reviewRound, messageToReviewers,
             previousSubmissionId, status, isLocked, finalApprovalSummary,
             submittedAt, reviewedAt, snapshotData
      FROM review_submissions
      WHERE projectId = ?
      ORDER BY reviewRound DESC, id DESC
      `,
      [projectId]
    );

    const activeSub =
      (requestedSubmissionId &&
        allSubmissions.find((s: any) => Number(s.id) === requestedSubmissionId)) ||
      allSubmissions[0] ||
      null;

    // 4. Build Complete Dossier Snapshot (merging frozen snapshot + live V2 records)
    const liveDossier = await buildFullDossierSnapshot(projectId);
    let activeSnapshot: any = liveDossier;
    if (activeSub?.snapshotData) {
      try {
        const parsed =
          typeof activeSub.snapshotData === "string"
            ? JSON.parse(activeSub.snapshotData)
            : activeSub.snapshotData;
        activeSnapshot = {
          ...liveDossier,
          ...parsed,
          section1: { ...liveDossier.section1, ...(parsed?.section1 || {}) },
          section2: { ...liveDossier.section2, ...(parsed?.section2 || {}) },
          section3: { ...liveDossier.section3, ...(parsed?.section3 || {}) },
          // Always ensure live V2 arrays are populated if snapshot had partial fields
          plantData: parsed?.section1?.plantData || parsed?.plantData || liveDossier.plantData,
          productSelection:
            parsed?.section1?.productSelection ||
            parsed?.productSelection ||
            liveDossier.productSelection,
          materials:
            parsed?.section1?.materials?.length > 0
              ? parsed.section1.materials
              : parsed?.materials?.length > 0
              ? parsed.materials
              : liveDossier.materials,
          formulations:
            parsed?.formulations?.length > 0 ? parsed.formulations : liveDossier.formulations,
          components:
            parsed?.section1?.components?.length > 0
              ? parsed.section1.components
              : parsed?.components?.length > 0
              ? parsed.components
              : liveDossier.components,
          batchAnalyses:
            parsed?.section1?.batchAnalyses?.length > 0
              ? parsed.section1.batchAnalyses
              : parsed?.batchAnalyses?.length > 0
              ? parsed.batchAnalyses
              : liveDossier.batchAnalyses,
          compounds:
            parsed?.section2?.compounds?.length > 0
              ? parsed.section2.compounds
              : parsed?.compounds?.length > 0
              ? parsed.compounds
              : liveDossier.compounds,
          insilicoResults:
            parsed?.section2?.insilicoResults?.length > 0
              ? parsed.section2.insilicoResults
              : parsed?.insilicoResults?.length > 0
              ? parsed.insilicoResults
              : liveDossier.insilicoResults,
          targets:
            parsed?.section2?.targets?.length > 0
              ? parsed.section2.targets
              : parsed?.targets?.length > 0
              ? parsed.targets
              : liveDossier.targets,
          dockingRuns:
            parsed?.section2?.dockingRuns?.length > 0
              ? parsed.section2.dockingRuns
              : parsed?.dockingRuns?.length > 0
              ? parsed.dockingRuns
              : liveDossier.dockingRuns,
          insilicoSynthesis:
            parsed?.section2?.insilicoSynthesis ||
            parsed?.insilicoSynthesis ||
            liveDossier.insilicoSynthesis,
          manuscript:
            parsed?.section3?.manuscript || parsed?.manuscript || liveDossier.manuscript,
          dossier: parsed?.section3?.dossier || parsed?.dossier || liveDossier.dossier,
          literature:
            parsed?.section3?.literature?.length > 0
              ? parsed.section3.literature
              : parsed?.literature?.length > 0
              ? parsed.literature
              : liveDossier.literature,
        };
      } catch (e) {
        console.warn("Could not parse active submission snapshot:", e);
      }
    }

    // 5. Previous Version Snapshot & Comparison (when reviewRound > 1)
    let previousSubmission: any = null;
    let previousSnapshot: any = null;
    let versionComparison: any = activeSnapshot?.versionComparison || null;

    if (activeSub && allSubmissions.length > 1) {
      previousSubmission =
        allSubmissions.find(
          (s: any) =>
            Number(s.id) === Number(activeSub.previousSubmissionId) ||
            Number(s.reviewRound) === Number(activeSub.reviewRound) - 1
        ) || null;

      if (previousSubmission?.snapshotData) {
        try {
          previousSnapshot =
            typeof previousSubmission.snapshotData === "string"
              ? JSON.parse(previousSubmission.snapshotData)
              : previousSubmission.snapshotData;
        } catch {
          previousSnapshot = null;
        }
      }

      if (!versionComparison && previousSnapshot) {
        const diff = compareSubmissionSnapshots(previousSnapshot, activeSnapshot);
        versionComparison = {
          reviewRound: activeSub.reviewRound,
          versionTag: activeSub.versionTag,
          previousSubmissionId: previousSubmission.id,
          previousVersionTag: previousSubmission.versionTag,
          ...diff,
        };
      }
    }

    // 6. Fetch Coverage, Assignments, Professional Reviews & Feedback for Active Submission
    let coverageRows: any[] = [];
    let assignmentRows: any[] = [];
    let reviewRows: any[] = [];
    let feedbackRows: any[] = [];

    if (activeSub) {
      const [covRes]: any = await pool.query(
        `SELECT rac.*, u.name as reviewerName
         FROM review_area_coverage rac
         LEFT JOIN users u ON rac.reviewerId = u.id
         WHERE rac.submissionId = ?`,
        [activeSub.id]
      );
      coverageRows = covRes || [];

      const [assRes]: any = await pool.query(
        `SELECT ra.*, u.name as reviewerName
         FROM review_assignments ra
         LEFT JOIN users u ON ra.reviewerId = u.id
         WHERE ra.submissionId = ?`,
        [activeSub.id]
      );
      assignmentRows = assRes || [];

      const [prRes]: any = await pool.query(
        `SELECT pr.*, u.name as reviewerName
         FROM professional_reviews pr
         LEFT JOIN users u ON pr.reviewerId = u.id
         WHERE pr.submissionId = ?`,
        [activeSub.id]
      );
      reviewRows = prRes || [];

      const [fbRes]: any = await pool.query(
        `SELECT rf.*, u.name as reviewerDisplayName
         FROM review_feedback rf
         LEFT JOIN users u ON rf.reviewerId = u.id
         WHERE rf.projectId = ?
         ORDER BY rf.id DESC`,
        [projectId]
      );
      feedbackRows = fbRes || [];
    }

    // Fetch all historical professional_reviews across all rounds for this project
    const [allHistoryReviews]: any = await pool.query(
      `SELECT pr.*, rs.versionTag, rs.reviewRound, u.name as reviewerName
       FROM professional_reviews pr
       JOIN review_submissions rs ON pr.submissionId = rs.id
       LEFT JOIN users u ON pr.reviewerId = u.id
       WHERE pr.projectId = ?
       ORDER BY rs.reviewRound DESC, pr.id DESC`,
      [projectId]
    );

    // Fetch saved AI Review Summaries across all versions and specialties for this project
    const [allAiSummaryRows]: any = await pool.query(
      `SELECT * FROM review_ai_summaries
       WHERE projectId = ?
       ORDER BY id DESC`,
      [projectId]
    );
    const hydratedAiSummaries: SavedAiReviewSummaryRecord[] = (allAiSummaryRows || []).map(
      hydrateSummaryRow
    );

    // 7. Build the 5 Specialty Review Sections Status & State
    const approvedSteps = await getProjectApprovedSteps(projectId);

    const specialties = EXPERT_REVIEW_AREAS.map((area) => {
      const cov =
        coverageRows.find((c) => c.areaKey === area.key) ||
        coverageRows.find(
          (c) =>
            (c.status === "APPROVED" || c.status === "COMPLETED") &&
            normalizeReviewAreaKey(c.areaKey) === area.key
        ) ||
        coverageRows.find((c) => normalizeReviewAreaKey(c.areaKey) === area.key);

      const ass =
        assignmentRows.find((a) => a.specialtyNeeded === area.key) ||
        assignmentRows.find(
          (a) =>
            (a.status === "COMPLETED" || a.status === "APPROVED") &&
            normalizeReviewAreaKey(a.specialtyNeeded) === area.key
        ) ||
        assignmentRows.find((a) => normalizeReviewAreaKey(a.specialtyNeeded) === area.key);

      const pr =
        reviewRows.find((r) => r.areaKey === area.key) ||
        reviewRows.find((r) => normalizeReviewAreaKey(r.areaKey) === area.key);

      const secKey: "section1" | "section2" | "section3" =
        (area.key as string) === "formulation" || (area.key as string) === "pharmacognosy"
          ? "section1"
          : area.key === "bioinformatics"
          ? "section2"
          : "section3";
      const stepList = approvedSteps[secKey] || [];
      const totalStepCount = SECTION_TOTAL_STEPS[secKey];

      const rawStatus = String(cov?.status || ass?.status || "PENDING").toUpperCase();
      const isFullyApprovedBySteps = stepList.length >= totalStepCount;
      const isApprovedStatus =
        isFullyApprovedBySteps || rawStatus === "APPROVED" || rawStatus === "COMPLETED";

      const displayStatus = isApprovedStatus
        ? "Approved"
        : rawStatus === "REVISION_REQUIRED"
        ? "Revision Required"
        : stepList.length > 0 || rawStatus === "IN_REVIEW"
        ? "In Review"
        : mapCoverageStatusToDisplay(rawStatus);

      const stepApprovedPercent = isApprovedStatus
        ? 100
        : Math.round((stepList.length / totalStepCount) * 100);

      const isAssignedToCurrentUser =
        !isSelfResearcher && assignedSpecialties.includes(area.key);

      const isSpecialtyApprovedAndLocked =
        isApprovedStatus &&
        pr &&
        String(pr.status || "").toUpperCase() === "SUBMITTED" &&
        String(pr.assessment || "").toUpperCase() === "ACCEPTABLE";

      const isSubmissionLocked =
        Boolean(activeSub?.isLocked) ||
        String(activeSub?.status || "").toUpperCase() === "APPROVED";

      const canSubmitDecision =
        isAssignedToCurrentUser &&
        Boolean(activeSub) &&
        !isSubmissionLocked &&
        !isSpecialtyApprovedAndLocked;

      let parsedChecklist: Record<string, boolean> = {};
      if (pr?.checklistData) {
        try {
          parsedChecklist =
            typeof pr.checklistData === "string"
              ? JSON.parse(pr.checklistData)
              : pr.checklistData;
        } catch {
          parsedChecklist = {};
        }
      }

      const areaFeedback = feedbackRows.filter(
        (f) => normalizeReviewAreaKey(f.areaKey) === area.key
      );
      const areaHistory = (allHistoryReviews || []).filter(
        (h: any) => normalizeReviewAreaKey(h.areaKey) === area.key
      );

      const retainedFromPriorRound = Boolean(
        versionComparison?.retainedApprovedAreas?.includes(area.key)
      );
      const changedInCurrentRound = Boolean(
        versionComparison?.changedAreas?.includes(area.key)
      );

      // Saved AI Review Summaries for this specialty
      const specSummaries = hydratedAiSummaries.filter((s) => s.specialty === area.key);
      const currentAiSummary = activeSub
        ? specSummaries.find(
            (s) => Number(s.submissionId) === Number(activeSub.id) && s.isLatestForSubmission
          ) || null
        : null;
      const aiRegenerationHistory = activeSub
        ? specSummaries.filter(
            (s) => Number(s.submissionId) === Number(activeSub.id) && !s.isLatestForSubmission
          )
        : [];
      const olderVersionAiSummaries = activeSub
        ? specSummaries.filter(
            (s) => Number(s.submissionId) !== Number(activeSub.id) && s.isLatestForSubmission
          )
        : specSummaries.filter((s) => s.isLatestForSubmission);

      return {
        areaKey: area.key,
        order: area.order,
        number: `0${area.order}`,
        label: area.label,
        shortLabel: area.shortLabel,
        professionTitle: area.professionTitle,
        detail: area.detail,
        criteria: area.criteria,
        checkingItems: area.checkingItems,
        rawStatus,
        status: displayStatus, // 'Pending' | 'In Review' | 'Revision Required' | 'Approved'
        isAssignedToCurrentUser,
        canSubmitDecision,
        isLocked: isSubmissionLocked || isSpecialtyApprovedAndLocked,
        retainedFromPriorRound,
        changedInCurrentRound,
        assignmentId: ass?.id || pr?.assignmentId || null,
        reviewerId: pr?.reviewerId || cov?.reviewerId || ass?.reviewerId || null,
        reviewerName:
          pr?.reviewerName ||
          cov?.reviewerName ||
          ass?.reviewerName ||
          expertProfessionTitle(area.key),
        review: pr
          ? {
              id: pr.id,
              assessment: pr.assessment,
              comments: pr.comments || "",
              checklist: parsedChecklist,
              status: pr.status,
              submittedAt: pr.submittedAt,
              updatedAt: pr.updatedAt,
            }
          : null,
        aiSummary: currentAiSummary,
        aiRegenerationHistory,
        olderVersionAiSummaries,
        feedback: areaFeedback,
        history: areaHistory,
        secKey,
        approvedSteps: stepList,
        approvedStepCount: stepList.length,
        totalStepCount,
        approvedPercent: stepApprovedPercent,
      };
    });

    // Overall review status across the 3 professional reviewer roles
    const approvedCount = specialties.filter((s) => s.status === "Approved").length;
    const revisionCount = specialties.filter((s) => s.status === "Revision Required").length;
    const inReviewCount = specialties.filter((s) => s.status === "In Review").length;

    let overallReviewStatus: "Pending" | "In Review" | "Revision Required" | "Approved" =
      "Pending";
    if (specialties.length >= EXPERT_REVIEW_AREAS.length && approvedCount >= EXPERT_REVIEW_AREAS.length) {
      overallReviewStatus = "Approved";
    } else if (revisionCount > 0) {
      overallReviewStatus = "Revision Required";
    } else if (inReviewCount > 0 || approvedCount > 0) {
      overallReviewStatus = "In Review";
    }

    let finalApprovalSummary: any = null;
    if (activeSub?.finalApprovalSummary) {
      try {
        finalApprovalSummary =
          typeof activeSub.finalApprovalSummary === "string"
            ? JSON.parse(activeSub.finalApprovalSummary)
            : activeSub.finalApprovalSummary;
      } catch {
        finalApprovalSummary = null;
      }
    }

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        title: project.title,
        plantName: activeSnapshot.plantName || project.plantName,
        plantScientificName:
          activeSnapshot.plantScientificName || project.plantScientificName,
        plantFamily: activeSnapshot.plantFamily || project.plantFamily,
        researcherId: project.researcherId,
        researcherName: project.researcherName,
        researcherEmail: project.researcherEmail,
        projectStatus: project.projectStatus,
        overallReviewStatus,
        updatedAt: project.updatedAt,
        stages: specialties.map((s) => ({
          stageNumber: s.order,
          stageName: s.label,
          areaKey: s.areaKey,
          professionalExpert: s.professionTitle,
          expertise: s.shortLabel,
          status: s.status,
          statusLabel: s.status,
          reviewerName: s.reviewerName,
          approvedAt: s.review?.submittedAt,
          approvedSteps: s.approvedSteps,
          approvedStepCount: s.approvedStepCount,
          totalStepCount: s.totalStepCount,
          approvedPercent: s.approvedPercent,
        })),
      },
      currentUser: {
        id: session.id,
        name: session.name,
        email: session.email,
        isSelfResearcher,
        assignedSpecialties,
      },
      activeSubmission: activeSub
        ? {
            id: activeSub.id,
            versionTag: activeSub.versionTag || `v${activeSub.reviewRound || 1}.0`,
            reviewRound: activeSub.reviewRound || 1,
            status: activeSub.status,
            isLocked: Boolean(activeSub.isLocked),
            submittedAt: activeSub.submittedAt,
            reviewedAt: activeSub.reviewedAt,
            messageToReviewers: activeSub.messageToReviewers,
          }
        : null,
      submissionVersions: allSubmissions.map((s: any) => ({
        id: s.id,
        versionTag: s.versionTag || `v${s.reviewRound || 1}.0`,
        reviewRound: s.reviewRound || 1,
        status: s.status,
        isLocked: Boolean(s.isLocked),
        submittedAt: s.submittedAt,
        reviewedAt: s.reviewedAt,
      })),
      versionComparison,
      previousSnapshot: previousSnapshot
        ? {
            versionTag: previousSubmission?.versionTag || "v1.0",
            submittedAt: previousSubmission?.submittedAt,
            executiveSummary:
              previousSnapshot?.section3?.dossier?.executiveSummary ||
              previousSnapshot?.dossier?.executiveSummary ||
              previousSnapshot?.executiveSummary ||
              "",
            manuscript:
              previousSnapshot?.section3?.manuscript ||
              previousSnapshot?.manuscript ||
              null,
            plantData:
              previousSnapshot?.section1?.plantData || previousSnapshot?.plantData || null,
            compoundsCount: (
              previousSnapshot?.section2?.compounds ||
              previousSnapshot?.compounds ||
              []
            ).length,
            dockingRunsCount: (
              previousSnapshot?.section2?.dockingRuns ||
              previousSnapshot?.dockingRuns ||
              []
            ).length,
            batchesCount: (
              previousSnapshot?.section1?.batchAnalyses ||
              previousSnapshot?.batchAnalyses ||
              []
            ).length,
          }
        : null,
      specialties,
      approvedStepsBySection: approvedSteps,
      dossier: activeSnapshot,
      finalApprovalSummary,
    });
  } catch (error: any) {
    console.error("GET /api/reviewer/projects/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load research review workspace" },
      { status: 500 }
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

    await ensureReviewTables();

    const body = await request.json().catch(() => ({}));
    const action = String(body.action || "").toLowerCase(); // 'save_draft' | 'request_revisions' | 'approve'
    const rawAreaKey = body.areaKey || body.specialty;
    const comments = typeof body.comments === "string" ? body.comments.trim() : "";
    const checklist = body.checklist || body.checklistData || {};

    if (!rawAreaKey) {
      return NextResponse.json({ error: "Specialty areaKey is required." }, { status: 400 });
    }

    // Resolve submissionId (use provided or latest for project)
    let submissionId = body.submissionId ? Number(body.submissionId) : null;
    if (!submissionId) {
      const [latestRows]: any = await pool.query(
        `SELECT id FROM review_submissions WHERE projectId = ? ORDER BY reviewRound DESC, id DESC LIMIT 1`,
        [projectId]
      );
      if (latestRows.length === 0) {
        return NextResponse.json(
          { error: "No review submission found for this research project." },
          { status: 404 }
        );
      }
      submissionId = Number(latestRows[0].id);
    }

    // Enforce RBAC, self-approval prevention, specialty assignment check, and lock protection
    let permResult;
    try {
      permResult = await assertReviewerPermissionForSpecialty({
        reviewerId: session.id,
        projectId,
        submissionId,
        areaKey: rawAreaKey,
        requireUnlocked: true,
      });
    } catch (permErr: any) {
      return NextResponse.json(
        { error: permErr.message || "Permission denied" },
        { status: permErr.status || 403 }
      );
    }

    const { normAreaKey, project, submission } = permResult;
    const areaLabel = expertReviewAreaLabel(normAreaKey);
    const reviewRound = Number(submission.reviewRound || 1);

    // Find or create review_assignment for this specialty
    const [assRows]: any = await pool.query(
      `SELECT id, status FROM review_assignments WHERE submissionId = ? AND specialtyNeeded = ? LIMIT 1`,
      [submissionId, normAreaKey]
    );
    let assignmentId = assRows[0]?.id || null;
    if (!assignmentId) {
      const [insAss]: any = await pool.query(
        `INSERT INTO review_assignments (projectId, submissionId, reviewerId, specialtyNeeded, status, reviewRound, assignedAt)
         VALUES (?, ?, ?, ?, 'IN_REVIEW', ?, CURRENT_TIMESTAMP(3))`,
        [projectId, submissionId, session.id, normAreaKey, reviewRound]
      );
      assignmentId = insAss.insertId;
    }

    const checklistJson =
      typeof checklist === "string" ? checklist : JSON.stringify(checklist || {});

    // -------------------------------------------------------------------------
    // ACTION 1: SAVE DRAFT
    // -------------------------------------------------------------------------
    if (action === "save_draft" || action === "draft") {
      await pool.query(
        `
        INSERT INTO professional_reviews (
          assignmentId, submissionId, projectId, reviewerId, areaKey, reviewCycle,
          comments, checklistData, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT')
        ON DUPLICATE KEY UPDATE
          comments = VALUES(comments),
          checklistData = VALUES(checklistData),
          reviewerId = VALUES(reviewerId),
          updatedAt = CURRENT_TIMESTAMP(3)
        `,
        [
          assignmentId,
          submissionId,
          projectId,
          session.id,
          normAreaKey,
          reviewRound,
          comments,
          checklistJson,
        ]
      );

      // Move PENDING -> IN_REVIEW
      await pool.query(
        `UPDATE review_area_coverage
         SET status = CASE WHEN status = 'PENDING' THEN 'IN_REVIEW' ELSE status END,
             reviewerId = ?,
             updatedAt = CURRENT_TIMESTAMP(3)
         WHERE submissionId = ? AND areaKey = ?`,
        [session.id, submissionId, normAreaKey]
      );
      await pool.query(
        `UPDATE review_assignments
         SET status = CASE WHEN status = 'PENDING' THEN 'IN_REVIEW' ELSE status END,
             reviewerId = ?,
             startedAt = COALESCE(startedAt, CURRENT_TIMESTAMP(3)),
             updatedAt = CURRENT_TIMESTAMP(3)
         WHERE id = ?`,
        [session.id, assignmentId]
      );

      await pool.query(
        `INSERT INTO review_activity_logs (projectId, submissionId, actorId, actorRole, actionType, description)
         VALUES (?, ?, ?, 'REVIEWER', 'DRAFT_SAVED', ?)`,
        [
          projectId,
          submissionId,
          session.id,
          `Saved review draft for ${areaLabel} (${submission.versionTag || `v${reviewRound}.0`}).`,
        ]
      );

      return NextResponse.json({
        success: true,
        action: "save_draft",
        areaKey: normAreaKey,
        status: "In Review",
        message: `${areaLabel} review draft saved.`,
      });
    }

    // -------------------------------------------------------------------------
    // ACTION 2: REQUEST REVISIONS
    // -------------------------------------------------------------------------
    if (action === "request_revisions" || action === "revision_required") {
      if (!comments || comments.length < 10) {
        return NextResponse.json(
          {
            error:
              "Meaningful review comments (at least 10 characters) are required when requesting revisions.",
          },
          { status: 400 }
        );
      }

      const [prRes]: any = await pool.query(
        `
        INSERT INTO professional_reviews (
          assignmentId, submissionId, projectId, reviewerId, areaKey, reviewCycle,
          assessment, comments, checklistData, status, submittedAt
        ) VALUES (?, ?, ?, ?, ?, ?, 'REVISION_REQUIRED', ?, ?, 'SUBMITTED', CURRENT_TIMESTAMP(3))
        ON DUPLICATE KEY UPDATE
          assessment = 'REVISION_REQUIRED',
          comments = VALUES(comments),
          checklistData = VALUES(checklistData),
          reviewerId = VALUES(reviewerId),
          status = 'SUBMITTED',
          submittedAt = CURRENT_TIMESTAMP(3),
          updatedAt = CURRENT_TIMESTAMP(3)
        `,
        [
          assignmentId,
          submissionId,
          projectId,
          session.id,
          normAreaKey,
          reviewRound,
          comments,
          checklistJson,
        ]
      );
      const reviewId = prRes.insertId || null;

      // Save structured feedback item in review_feedback so researcher sees it in Review Feedback
      await pool.query(
        `DELETE FROM review_feedback WHERE submissionId = ? AND areaKey = ? AND reviewerId = ?`,
        [submissionId, normAreaKey, session.id]
      );

      await pool.query(
        `
        INSERT INTO review_feedback (
          projectId, submissionId, reviewerId, reviewRound, reviewId,
          areaKey, sectionName, title, commentType, severity,
          reviewerName, comment, recommendation, status, affectedStage,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'REQUIRED_CORRECTION', 'MAJOR', ?, ?, ?, 'OPEN', ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
        `,
        [
          projectId,
          submissionId,
          session.id,
          reviewRound,
          reviewId,
          normAreaKey,
          `${areaLabel} Review`,
          `${areaLabel} Revision Request`,
          session.name || expertProfessionTitle(normAreaKey),
          comments,
          comments,
          normAreaKey,
        ]
      );

      // Update coverage & assignment status
      await pool.query(
        `UPDATE review_area_coverage
         SET status = 'REVISION_REQUIRED', reviewerId = ?, updatedAt = CURRENT_TIMESTAMP(3)
         WHERE submissionId = ? AND areaKey = ?`,
        [session.id, submissionId, normAreaKey]
      );
      await pool.query(
        `UPDATE review_assignments
         SET status = 'REVISION_REQUIRED', reviewerId = ?, completedAt = CURRENT_TIMESTAMP(3), updatedAt = CURRENT_TIMESTAMP(3)
         WHERE id = ?`,
        [session.id, assignmentId]
      );

      // Notify researcher
      if (project.researcherId) {
        await pool.query(
          `INSERT INTO review_notifications (userId, type, title, message, link, isRead, createdAt)
           VALUES (?, 'REVISION_REQUESTED', ?, ?, ?, 0, CURRENT_TIMESTAMP(3))`,
          [
            project.researcherId,
            `Revisions Requested · ${areaLabel} (${submission.versionTag || `v${reviewRound}.0`})`,
            `${session.name} (${areaLabel}) requested revisions on "${project.title}": ${comments.slice(0, 180)}`,
            `/researcher/projects/${projectId}/revisions`,
          ]
        );
      }

      // Log activity
      await pool.query(
        `INSERT INTO review_activity_logs (projectId, submissionId, actorId, actorRole, actionType, description)
         VALUES (?, ?, ?, 'REVIEWER', 'REVISION_REQUESTED', ?)`,
        [
          projectId,
          submissionId,
          session.id,
          `${session.name} requested revisions for ${areaLabel} (${submission.versionTag || `v${reviewRound}.0`}).`,
        ]
      );

      const overall = await evaluateOverallApproval(submissionId, projectId);

      return NextResponse.json({
        success: true,
        action: "request_revisions",
        areaKey: normAreaKey,
        status: "Revision Required",
        overall,
        message: `Revision request submitted for ${areaLabel}. The researcher has been notified.`,
      });
    }

    // -------------------------------------------------------------------------
    // ACTION 3: APPROVE RESEARCH (for this specialty)
    // -------------------------------------------------------------------------
    if (action === "approve" || action === "acceptable") {
      const approvalComment =
        comments ||
        `Approved by ${session.name} (${areaLabel}). Scientific documentation and methodology meet specialty review criteria.`;

      await pool.query(
        `
        INSERT INTO professional_reviews (
          assignmentId, submissionId, projectId, reviewerId, areaKey, reviewCycle,
          assessment, comments, checklistData, status, submittedAt
        ) VALUES (?, ?, ?, ?, ?, ?, 'ACCEPTABLE', ?, ?, 'SUBMITTED', CURRENT_TIMESTAMP(3))
        ON DUPLICATE KEY UPDATE
          assessment = 'ACCEPTABLE',
          comments = VALUES(comments),
          checklistData = VALUES(checklistData),
          reviewerId = VALUES(reviewerId),
          status = 'SUBMITTED',
          submittedAt = CURRENT_TIMESTAMP(3),
          updatedAt = CURRENT_TIMESTAMP(3)
        `,
        [
          assignmentId,
          submissionId,
          projectId,
          session.id,
          normAreaKey,
          reviewRound,
          approvalComment,
          checklistJson,
        ]
      );

      // Mark any open feedback for this specialty on this project as RESOLVED
      await pool.query(
        `UPDATE review_feedback
         SET status = 'RESOLVED', resolvedAt = CURRENT_TIMESTAMP(3), updatedAt = CURRENT_TIMESTAMP(3)
         WHERE projectId = ? AND areaKey = ? AND status IN ('OPEN', 'IN_REVIEW', 'ADDRESSED')`,
        [projectId, normAreaKey]
      );

      // Update coverage & assignment status
      await pool.query(
        `UPDATE review_area_coverage
         SET status = 'APPROVED', reviewerId = ?, updatedAt = CURRENT_TIMESTAMP(3)
         WHERE submissionId = ? AND areaKey = ?`,
        [session.id, submissionId, normAreaKey]
      );
      await pool.query(
        `UPDATE review_assignments
         SET status = 'COMPLETED', reviewerId = ?, completedAt = CURRENT_TIMESTAMP(3), updatedAt = CURRENT_TIMESTAMP(3)
         WHERE id = ?`,
        [session.id, assignmentId]
      );

      // Also persist all step approvals for this section in review_step_approvals
      const targetSecKey: "section1" | "section2" | "section3" =
        (normAreaKey as string) === "formulation" || (normAreaKey as string) === "pharmacognosy"
          ? "section1"
          : normAreaKey === "bioinformatics"
          ? "section2"
          : "section3";
      await approveAllSectionSteps(projectId, targetSecKey, session.id, submissionId);

      // Notify researcher of specialty approval
      if (project.researcherId) {
        await pool.query(
          `INSERT INTO review_notifications (userId, type, title, message, link, isRead, createdAt)
           VALUES (?, 'ACCEPTED_FOR_NEXT_STAGE', ?, ?, ?, 0, CURRENT_TIMESTAMP(3))`,
          [
            project.researcherId,
            `${areaLabel} Review Approved (${submission.versionTag || `v${reviewRound}.0`})`,
            `${session.name} approved the ${areaLabel} review for "${project.title}". Track progress in Professional Approval & Completion.`,
            `/researcher/projects/${projectId}/submission?step=4`,
          ]
        );
      }

      // Log activity
      await pool.query(
        `INSERT INTO review_activity_logs (projectId, submissionId, actorId, actorRole, actionType, description)
         VALUES (?, ?, ?, 'REVIEWER', 'AREA_APPROVED', ?)`,
        [
          projectId,
          submissionId,
          session.id,
          `${session.name} approved ${areaLabel} for ${submission.versionTag || `v${reviewRound}.0`}.`,
        ]
      );

      // Evaluate whether all 3 professional reviewer roles have now approved this same version
      const overall = await evaluateOverallApproval(submissionId, projectId);

      return NextResponse.json({
        success: true,
        action: "approve",
        areaKey: normAreaKey,
        status: "Approved",
        overall,
        message: overall.allApproved
          ? `All 3 professional reviewer roles have now approved ${submission.versionTag || `v${reviewRound}.0`}! Final approval complete and dossier locked.`
          : `${areaLabel} review approved (${overall.approvedCount} of 3 professional roles approved).`,
      });
    }

    return NextResponse.json({ error: "Invalid review action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/reviewer/projects/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process review decision" },
      { status: 500 }
    );
  }
}
