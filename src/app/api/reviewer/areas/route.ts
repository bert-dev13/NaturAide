import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { EXPERT_REVIEW_AREAS, normalizeReviewAreaKey } from "@/lib/expert-review-areas";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "REVIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [rows]: any = await pool.query(
      `SELECT areaKey FROM professional_review_areas WHERE userId = ? ORDER BY id ASC`,
      [session.id]
    );

    const assignedKeys = rows.map((r: any) => normalizeReviewAreaKey(r.areaKey));

    const areasWithStatus = EXPERT_REVIEW_AREAS.map((a) => ({
      ...a,
      isAssigned: assignedKeys.length === 0 || assignedKeys.includes(a.key),
    }));

    return NextResponse.json({
      success: true,
      areas: areasWithStatus,
    });
  } catch (error) {
    console.error("GET /api/reviewer/areas error:", error);
    return NextResponse.json({ error: "Failed to load reviewer areas" }, { status: 500 });
  }
}

