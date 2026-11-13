import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revisionDeepLinks } from "@/lib/revision-notification-links";

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
    const findingId = parseInt(id, 10);
    if (isNaN(findingId)) {
      return NextResponse.json({ error: "Invalid finding ID" }, { status: 400 });
    }

    const body = await request.json();
    const { action, notes } = body; // action: 'RESOLVE' | 'NEEDS_FURTHER_REVISION'

    const [rows]: any = await pool.query(
      "SELECT id, projectId, submissionId, reviewerId, areaKey, title, comment, sectionName FROM review_feedback WHERE id = ? LIMIT 1",
      [findingId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Finding not found" }, { status: 404 });
    }

    const finding = rows[0];

    // Fetch project info for notification
    const [projRows]: any = await pool.query(
      "SELECT id, title, researcherId FROM research_projects WHERE id = ? LIMIT 1",
      [finding.projectId]
    );
    const project = projRows[0] || null;

    if (action === "RESOLVE") {
      await pool.query(
        `
        UPDATE review_feedback
        SET status = 'RESOLVED', resolvedAt = CURRENT_TIMESTAMP(3), updatedAt = CURRENT_TIMESTAMP(3)
        WHERE id = ?
        `,
        [findingId]
      );

      // Check if all findings for this submission/area are resolved
      const [remaining]: any = await pool.query(
        `SELECT COUNT(*) as count FROM review_feedback WHERE projectId = ? AND status != 'RESOLVED'`,
        [finding.projectId]
      );

      const allResolvedForProject = (remaining[0]?.count || 0) === 0;

      // If all resolved, we can update project status to APPROVED if ready
      if (allResolvedForProject && project) {
        await pool.query(
          `UPDATE research_projects SET status = 'APPROVED', updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ? AND status = 'REVISION_REQUIRED'`,
          [finding.projectId]
        );
      }

      // Notify researcher
      if (project?.researcherId) {
        try {
          const { researcherLink } = revisionDeepLinks(
            finding.sectionName || finding.title,
            finding.projectId
          );
          await pool.query(
            `INSERT INTO review_notifications (userId, type, title, message, link, isRead, createdAt)
             VALUES (?, 'REVISION_RESOLVED', ?, ?, ?, 0, CURRENT_TIMESTAMP(3))`,
            [
              project.researcherId,
              `Revision Verified & Resolved · ${project.title}`,
              `Reviewer verified your response to "${finding.title || "finding"}" (${finding.sectionName || "step finding"}) and signed off on the revision.`,
              researcherLink,
            ]
          );
        } catch (notifErr) {
          console.warn("Could not dispatch researcher notification for resolved revision:", notifErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Finding marked as resolved.",
        allResolvedForProject,
      });
    } else {
      // NEEDS_FURTHER_REVISION
      await pool.query(
        `
        UPDATE review_feedback
        SET status = 'OPEN',
            recommendation = COALESCE(?, recommendation),
            updatedAt = CURRENT_TIMESTAMP(3)
        WHERE id = ?
        `,
        [notes || null, findingId]
      );

      // Update project status back to REVISION_REQUIRED
      await pool.query(
        `UPDATE research_projects SET status = 'REVISION_REQUIRED', updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?`,
        [finding.projectId]
      );

      // Notify researcher
      if (project?.researcherId) {
        try {
          const { researcherLink } = revisionDeepLinks(
            finding.sectionName || finding.title,
            finding.projectId
          );
          await pool.query(
            `INSERT INTO review_notifications (userId, type, title, message, link, isRead, createdAt)
             VALUES (?, 'REVISION_REQUIRED', ?, ?, ?, 0, CURRENT_TIMESTAMP(3))`,
            [
              project.researcherId,
              `Further Revision Required · ${project.title}`,
              `Reviewer reviewed your response to "${finding.title || "finding"}" (${finding.sectionName || "step finding"}) and requested additional updates: "${(notes || "Please check revised instructions").slice(0, 120)}"`,
              researcherLink,
            ]
          );
        } catch (notifErr) {
          console.warn("Could not dispatch researcher notification for further revision:", notifErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Finding flagged for further revision.",
      });
    }
  } catch (error) {
    console.error("Resolve finding error:", error);
    return NextResponse.json({ error: "Failed to update finding status" }, { status: 500 });
  }
}
