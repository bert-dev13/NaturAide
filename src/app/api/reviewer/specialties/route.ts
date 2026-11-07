import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  EXPERT_REVIEW_AREAS,
  normalizeReviewAreaKeyOrNull,
  type ExpertReviewAreaKey,
} from "@/lib/expert-review-areas";
import {
  ensureReviewTables,
  getReviewerSpecialties,
  setReviewerSpecialties,
} from "@/lib/expert-review-assignment";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (String(session.role) !== "REVIEWER" && String(session.role) !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureReviewTables();

    const assignedKeys = await getReviewerSpecialties(session.id);

    const [reviewerRows]: any = await pool.query(
      `
      SELECT u.id, u.name, u.email, u.status,
             rp.specialty, rp.verificationStatus, rp.professionalTitle, rp.institution
      FROM users u
      LEFT JOIN reviewer_profiles rp ON rp.userId = u.id
      WHERE u.role = 'REVIEWER' AND u.status = 'ACTIVE'
      ORDER BY u.id ASC
      `
    );

    const [allAreaRows]: any = await pool.query(
      `SELECT userId, areaKey FROM professional_review_areas ORDER BY id ASC`
    );

    const reviewers = (reviewerRows || []).map((r: any) => {
      const rawKeys = (allAreaRows || [])
        .filter((a: any) => Number(a.userId) === Number(r.id))
        .map((a: any) => normalizeReviewAreaKeyOrNull(a.areaKey))
        .filter((k: any): k is ExpertReviewAreaKey => Boolean(k));
      const uniqueKeys = Array.from(new Set(rawKeys));
      return {
        ...r,
        assignedSpecialties: uniqueKeys,
      };
    });

    return NextResponse.json({
      success: true,
      currentUserId: session.id,
      assignedSpecialties: assignedKeys,
      availableSpecialties: EXPERT_REVIEW_AREAS,
      reviewers,
    });
  } catch (error: any) {
    console.error("GET /api/reviewer/specialties error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load reviewer specialties" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (String(session.role) !== "REVIEWER" && String(session.role) !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureReviewTables();

    const body = await req.json().catch(() => ({}));
    const targetUserId = body.userId ? Number(body.userId) : session.id;
    const rawSpecialties: string[] = Array.isArray(body.specialties)
      ? body.specialties
      : Array.isArray(body.areaKeys)
      ? body.areaKeys
      : [];

    if (rawSpecialties.length === 0) {
      return NextResponse.json(
        { error: "At least one professional specialty must be assigned." },
        { status: 400 }
      );
    }

    const updatedKeys = await setReviewerSpecialties(
      targetUserId,
      rawSpecialties,
      session.id
    );

    // Sync active PENDING / IN_REVIEW assignments to this reviewer for the assigned specialties
    if (body.syncActiveAssignments !== false && updatedKeys.length > 0) {
      const placeholders = updatedKeys.map(() => "?").join(", ");
      await pool.query(
        `UPDATE review_assignments
         SET reviewerId = ?, updatedAt = CURRENT_TIMESTAMP(3)
         WHERE specialtyNeeded IN (${placeholders})
           AND status IN ('PENDING', 'IN_REVIEW')`,
        [targetUserId, ...updatedKeys]
      );
      await pool.query(
        `UPDATE review_area_coverage
         SET reviewerId = ?, updatedAt = CURRENT_TIMESTAMP(3)
         WHERE areaKey IN (${placeholders})
           AND status IN ('PENDING', 'IN_REVIEW')`,
        [targetUserId, ...updatedKeys]
      );
    }

    return NextResponse.json({
      success: true,
      userId: targetUserId,
      assignedSpecialties: updatedKeys,
      message: `Updated assigned specialties (${updatedKeys.length} active).`,
    });
  } catch (error: any) {
    console.error("POST /api/reviewer/specialties error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update reviewer specialties" },
      { status: 500 }
    );
  }
}
