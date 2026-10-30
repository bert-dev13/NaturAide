import { NextResponse } from "next/server";
import pool from "@/lib/db";

/**
 * Official professional-review eligibility (single source of truth):
 *   users.status = 'ACTIVE'
 *   AND users.role = 'REVIEWER'
 *   AND reviewer_profiles.verificationStatus = 'VERIFIED'
 *
 * Returns null when the reviewer is eligible, otherwise a ready-to-return
 * 403 response. Account status and professional verification are evaluated
 * separately and re-read from MySQL on every call (never from the JWT).
 */
export async function assertReviewerEligible(userId: number): Promise<NextResponse | null> {
  const [rows]: any = await pool.query(
    `SELECT u.status AS accountStatus, u.role, rp.verificationStatus
     FROM users u
     LEFT JOIN reviewer_profiles rp ON rp.userId = u.id
     WHERE u.id = ?
     LIMIT 1`,
    [userId]
  );
  const row = rows?.[0];
  if (!row || row.role !== "REVIEWER" || row.accountStatus !== "ACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (row.verificationStatus === "SUSPENDED") {
    return NextResponse.json(
      { error: "Your professional reviewer verification is suspended. Official review actions are unavailable." },
      { status: 403 }
    );
  }
  if (row.verificationStatus !== "VERIFIED") {
    return NextResponse.json(
      { error: "Your reviewer profile is not yet verified. Official review actions are unavailable." },
      { status: 403 }
    );
  }
  return null;
}
