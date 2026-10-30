import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

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
      "SELECT id, projectId, submissionId, reviewerId, areaKey FROM review_feedback WHERE id = ? AND reviewerId = ? LIMIT 1",
      [findingId, session.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Finding not found or unauthorized" }, { status: 404 });
    }

    const finding = rows[0];

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
        `SELECT COUNT(*) as count FROM review_feedback WHERE submissionId = ? AND areaKey = ? AND status != 'RESOLVED'`,
        [finding.submissionId, finding.areaKey]
      );

      const allResolvedForArea = (remaining[0]?.count || 0) === 0;

      return NextResponse.json({
        success: true,
        message: "Finding marked as resolved.",
        allResolvedForArea,
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

