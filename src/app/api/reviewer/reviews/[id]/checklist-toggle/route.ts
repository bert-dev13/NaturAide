import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { normalizeReviewAreaKey } from "@/lib/expert-review-areas";

// POST /api/reviewer/reviews/[id]/checklist-toggle
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
    const assignmentId = parseInt(id, 10);
    if (isNaN(assignmentId)) {
      return NextResponse.json({ error: "Invalid assignment ID" }, { status: 400 });
    }

    const [assignRows]: any = await pool.query(
      `SELECT submissionId, specialtyNeeded FROM review_assignments WHERE id = ? AND reviewerId = ? LIMIT 1`,
      [assignmentId, session.id]
    );

    if (assignRows.length === 0) {
      return NextResponse.json({ error: "Assignment not found or unauthorized" }, { status: 404 });
    }

    const assignment = assignRows[0];
    const body = await request.json();
    const { itemKey, checked, specialty } = body;

    if (!itemKey || typeof checked !== "boolean") {
      return NextResponse.json({ error: "itemKey and checked boolean are required" }, { status: 400 });
    }

    const specialtyKey = specialty === "OVERALL" ? "OVERALL" : normalizeReviewAreaKey(specialty || assignment.specialtyNeeded);

    // Fetch existing checked items
    const [existingRows]: any = await pool.query(
      `SELECT id, checkedItemKeys FROM review_checklist_progress WHERE assignmentId = ? AND specialtyKey = ? LIMIT 1`,
      [assignmentId, specialtyKey]
    );

    let checkedKeys: string[] = [];
    if (existingRows.length > 0 && existingRows[0].checkedItemKeys) {
      try {
        checkedKeys = typeof existingRows[0].checkedItemKeys === "string" 
          ? JSON.parse(existingRows[0].checkedItemKeys) 
          : existingRows[0].checkedItemKeys;
      } catch {}
    }

    if (checked) {
      if (!checkedKeys.includes(itemKey)) {
        checkedKeys.push(itemKey);
      }
    } else {
      checkedKeys = checkedKeys.filter((k) => k !== itemKey);
    }

    // Persist
    await pool.query(
      `
      INSERT INTO review_checklist_progress (assignmentId, submissionId, reviewerId, specialtyKey, checkedItemKeys, updatedAt)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3))
      ON DUPLICATE KEY UPDATE
        checkedItemKeys = VALUES(checkedItemKeys),
        updatedAt = CURRENT_TIMESTAMP(3)
      `,
      [assignmentId, assignment.submissionId, session.id, specialtyKey, JSON.stringify(checkedKeys)]
    );

    return NextResponse.json({
      success: true,
      itemKey,
      checked,
      checkedKeys,
    });
  } catch (error: any) {
    console.error("Error in checklist-toggle route:", error);
    return NextResponse.json({ error: error.message || "Failed to update checklist item" }, { status: 500 });
  }
}

