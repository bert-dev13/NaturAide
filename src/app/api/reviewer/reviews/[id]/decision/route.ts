import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { assertReviewerEligible } from "@/lib/reviewer-eligibility";

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
    const identifier = parseInt(id, 10);

    // 1. Verify reviewer assignment and verification status
    const [assignRows]: any = await pool.query(
      `
      SELECT
        ra.id as assignmentId,
        ra.submissionId,
        ra.projectId,
        ra.reviewRound,
        rp.researcherId,
        rp.title as projectTitle,
        rs.versionTag
      FROM review_assignments ra
      JOIN research_projects rp ON ra.projectId = rp.id
      JOIN review_submissions rs ON ra.submissionId = rs.id
      WHERE (ra.id = ? OR ra.submissionId = ? OR ra.projectId = ?) AND ra.reviewerId = ?
      LIMIT 1
      `,
      [identifier, identifier, identifier, session.id]
    );

    if (assignRows.length === 0) {
      return NextResponse.json({ error: "Review assignment not found or access denied." }, { status: 404 });
    }

    const {
      assignmentId,
      submissionId,
      projectId,
      reviewRound,
      researcherId,
      projectTitle,
      versionTag,
    } = assignRows[0];

    // Only ACTIVE + VERIFIED reviewers can submit official decisions
    const ineligible = await assertReviewerEligible(session.id);
    if (ineligible) return ineligible;

    const body = await request.json();
    const {
      decision, // 'REQUEST_REVISION' | 'ACCEPT_FOR_NEXT_STAGE'
      overallAssessment,
      strengths,
      concerns,
      requiredRevisions,
      additionalRecommendations,
      checklistSnapshot, // Object of { evidenceReviewed, plantReviewed, etc. }
    } = body;

    if (!decision || (decision !== "REQUEST_REVISION" && decision !== "ACCEPT_FOR_NEXT_STAGE")) {
      return NextResponse.json({ error: "Valid review decision is required." }, { status: 400 });
    }

    if (!overallAssessment || overallAssessment.trim().length < 20) {
      return NextResponse.json(
        { error: "A comprehensive Overall Assessment (at least 20 characters) is required." },
        { status: 400 }
      );
    }

    // Validation for REQUEST_REVISION
    if (decision === "REQUEST_REVISION") {
      if (!requiredRevisions || requiredRevisions.trim().length < 15) {
        return NextResponse.json(
          { error: "Detailed Required Revisions explanation is mandatory when requesting revisions." },
          { status: 400 }
        );
      }

      // Check that at least 1 comment exists
      const [commentCount]: any = await pool.query(
        "SELECT COUNT(*) as count FROM review_feedback WHERE submissionId = ?",
        [submissionId]
      );
      if ((commentCount[0]?.count || 0) === 0) {
        return NextResponse.json(
          {
            error:
              "At least one section-specific comment or safety concern must be added before requesting revisions.",
          },
          { status: 400 }
        );
      }
    }

    // Validation for ACCEPT_FOR_NEXT_STAGE
    if (decision === "ACCEPT_FOR_NEXT_STAGE") {
      // Check for unresolved CRITICAL comments
      const [criticalCount]: any = await pool.query(
        "SELECT COUNT(*) as count FROM review_feedback WHERE submissionId = ? AND severity = 'CRITICAL' AND status != 'RESOLVED'",
        [submissionId]
      );
      if ((criticalCount[0]?.count || 0) > 0) {
        return NextResponse.json(
          {
            error:
              "Cannot accept research for next stage while unresolved Critical safety concerns remain flagged.",
          },
          { status: 400 }
        );
      }
    }

    // Record formal review decision in review_decisions
    await pool.query(
      `
      INSERT INTO review_decisions (
        projectId, submissionId, reviewerId, reviewRound, decision,
        overallAssessment, strengths, concerns, requiredRevisions,
        additionalRecommendations, checklistSnapshot
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        projectId,
        submissionId,
        session.id,
        reviewRound || 1,
        decision,
        overallAssessment.trim(),
        strengths?.trim() || null,
        concerns?.trim() || null,
        requiredRevisions?.trim() || null,
        additionalRecommendations?.trim() || null,
        checklistSnapshot ? JSON.stringify(checklistSnapshot) : null,
      ]
    );

    // Update assignment and project status based on decision
    if (decision === "REQUEST_REVISION") {
      await pool.query(
        `UPDATE review_assignments SET status = 'REVISION_REQUIRED', updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?`,
        [assignmentId]
      );

      await pool.query(
        `UPDATE review_submissions SET status = 'REVISION_REQUESTED', reviewedAt = CURRENT_TIMESTAMP(3) WHERE id = ?`,
        [submissionId]
      );

      await pool.query(
        `UPDATE research_dossiers SET status = 'REVISION_REQUESTED', updatedAt = CURRENT_TIMESTAMP(3) WHERE projectId = ?`,
        [projectId]
      );

      await pool.query(
        `UPDATE research_projects SET status = 'REVISION_REQUIRED', currentStage = 'expert-review', updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?`,
        [projectId]
      );

      await pool.query(
        `UPDATE research_project_stages SET status = 'REVISION_REQUESTED' WHERE projectId = ? AND (stageKey = 'expert-review' OR stageKey = 'review')`,
        [projectId]
      );

      await pool.query(
        `UPDATE research_project_stages SET status = 'IN_PROGRESS' WHERE projectId = ? AND stageKey = 'revisions'`,
        [projectId]
      );

      // Record in revision_cycles
      await pool.query(
        `
        INSERT INTO revision_cycles (
          projectId, submissionId, dossierVersionTag, reviewRound, reviewerId,
          reviewerDecision, reviewerSummary, status
        ) VALUES (?, ?, ?, ?, ?, 'REVISION_REQUESTED', ?, 'IN_PROGRESS')
        `,
        [
          projectId,
          submissionId,
          versionTag || "v1.0",
          reviewRound || 1,
          session.id,
          requiredRevisions.trim(),
        ]
      );

      // Notify researcher
      await pool.query(
        `
        INSERT INTO review_notifications (userId, type, title, message, link)
        VALUES (?, 'REVISION_REQUESTED', ?, ?, ?)
        `,
        [
          researcherId,
          `Revision Required: ${projectTitle}`,
          `Reviewer evaluated round ${reviewRound} (${versionTag}) and requested revisions. Please check Stage 9 Revisions to respond.`,
          `/researcher/projects/${projectId}/revisions`,
        ]
      );

      // Audit logs
      await pool.query(
        `
        INSERT INTO review_activity_logs (projectId, submissionId, actorId, actorRole, actionType, description)
        VALUES (?, ?, ?, 'REVIEWER', 'REVISION_REQUESTED', ?)
        `,
        [
          projectId,
          submissionId,
          session.id,
          `Requested revisions on round ${reviewRound} (${versionTag}): "${requiredRevisions.slice(0, 100)}..."`,
        ]
      );

      await pool.query(
        `
        INSERT INTO research_activity_logs (projectId, researcherId, actionType, description)
        VALUES (?, ?, 'DECISION_SUBMITTED', ?)
        `,
        [
          projectId,
          session.id,
          `Reviewer requested revisions on round ${reviewRound} (${versionTag}): "${requiredRevisions.slice(0, 100)}..."`,
        ]
      );

      return NextResponse.json({
        success: true,
        message: "Revision request successfully recorded and sent to the researcher.",
        decision: "REQUEST_REVISION",
      });
    } else {
      // ACCEPT_FOR_NEXT_STAGE
      await pool.query(
        `UPDATE review_assignments SET status = 'COMPLETED', completedAt = CURRENT_TIMESTAMP(3), updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?`,
        [assignmentId]
      );

      await pool.query(
        `UPDATE review_submissions SET status = 'ACCEPTED_FOR_NEXT_STAGE', reviewedAt = CURRENT_TIMESTAMP(3) WHERE id = ?`,
        [submissionId]
      );

      await pool.query(
        `UPDATE research_dossiers SET status = 'ACCEPTED_FOR_NEXT_STAGE', updatedAt = CURRENT_TIMESTAMP(3) WHERE projectId = ?`,
        [projectId]
      );

      await pool.query(
        `
        UPDATE research_projects
        SET status = 'COMPLETED', currentStage = 'expert-review', progressPercent = 100, updatedAt = CURRENT_TIMESTAMP(3)
        WHERE id = ?
        `,
        [projectId]
      );

      await pool.query(
        `UPDATE research_project_stages SET status = 'COMPLETED', completedAt = CURRENT_TIMESTAMP(3) WHERE projectId = ? AND (stageKey = 'expert-review' OR stageKey = 'review')`,
        [projectId]
      );

      // Mark revision cycles resolved
      await pool.query(
        `UPDATE revision_cycles SET status = 'RESOLVED', resolvedAt = CURRENT_TIMESTAMP(3) WHERE projectId = ? AND status = 'IN_PROGRESS'`,
        [projectId]
      );

      // Notify researcher
      await pool.query(
        `
        INSERT INTO review_notifications (userId, type, title, message, link)
        VALUES (?, 'ACCEPTED_FOR_NEXT_STAGE', ?, ?, ?)
        `,
        [
          researcherId,
          `Accepted for Next Stage: ${projectTitle}`,
          `Your complete research dossier ${versionTag} has received final professional approval.`,
          `/researcher/projects/${projectId}/expert-review`,
        ]
      );

      // Audit logs
      await pool.query(
        `
        INSERT INTO review_activity_logs (projectId, submissionId, actorId, actorRole, actionType, description)
        VALUES (?, ?, ?, 'REVIEWER', 'ACCEPTED_FOR_NEXT_STAGE', ?)
        `,
        [
          projectId,
          submissionId,
          session.id,
          `Reviewer gave final approval to dossier ${versionTag}`,
        ]
      );

      await pool.query(
        `
        INSERT INTO research_activity_logs (projectId, researcherId, actionType, description)
        VALUES (?, ?, 'DECISION_SUBMITTED', ?)
        `,
        [
          projectId,
          session.id,
          `Reviewer gave final approval to dossier ${versionTag}`,
        ]
      );

      return NextResponse.json({
        success: true,
        message: "Research dossier successfully reviewed and approved.",
        decision: "ACCEPT_FOR_NEXT_STAGE",
      });
    }
  } catch (error) {
    console.error("Submit review decision error:", error);
    return NextResponse.json({ error: "Failed to submit review decision" }, { status: 500 });
  }
}
