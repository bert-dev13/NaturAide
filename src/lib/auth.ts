import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import pool from "./db";

export const COOKIE_NAME = "natureaide_session";
const DEV_FALLBACK_SECRET = "natureaide_default_dev_secret_key_32chars_long!!";

/**
 * Resolves the JWT signing key lazily. In production a missing/short AUTH_SECRET
 * is a hard failure (the development fallback is publicly known).
 */
function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET must be configured (min 32 chars) in production.");
    }
    return new TextEncoder().encode(secret || DEV_FALLBACK_SECRET);
  }
  return new TextEncoder().encode(secret);
}

export interface SessionUser {
  id: number;
  email: string;
  role: "COMMUNITY" | "RESEARCHER" | "REVIEWER";
  name: string;
  status?: "ACTIVE" | "DISABLED";
  firstName?: string;
  lastName?: string;
  screeningResult?: "ELIGIBLE_TO_CONTINUE" | "PROFESSIONAL_GUIDANCE_REQUIRED" | null;
}

export interface SessionPayload {
  sub: string;
  email: string;
  role: "COMMUNITY" | "RESEARCHER" | "REVIEWER";
  name: string;
  screeningResult?: "ELIGIBLE_TO_CONTINUE" | "PROFESSIONAL_GUIDANCE_REQUIRED" | "NONE";
  exp?: number;
}

/**
 * Creates and signs a JWT for the given user.
 */
export async function createSessionToken(user: {
  id: number;
  email: string;
  role: string;
  name: string;
  screeningResult?: "ELIGIBLE_TO_CONTINUE" | "PROFESSIONAL_GUIDANCE_REQUIRED" | "NONE";
}): Promise<string> {
  return await new SignJWT({
    email: user.email,
    role: user.role,
    name: user.name,
    screeningResult: user.screeningResult || "NONE",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id.toString())
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

/**
 * Verifies a JWT token.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Retrieves the currently logged-in user from the session cookie in Server Components / Route Handlers.
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload || !payload.sub) return null;

    const userId = parseInt(payload.sub, 10);
    if (isNaN(userId)) return null;

    // Fetch user & profile from MySQL safely
    let rows: any = null;
    try {
      const res: any = await pool.query(
        `
        SELECT u.id, u.email, u.role, u.name, u.status, p.firstName, p.lastName
        FROM users u
        LEFT JOIN user_profiles p ON u.id = p.userId
        WHERE u.id = ?
        LIMIT 1
        `,
        [userId]
      );
      if (Array.isArray(res) && res.length > 0) {
        rows = res[0];
      }
    } catch (dbErr) {
      console.error("Database connection/query error in getSession:", dbErr);
      return null;
    }

    if (!rows || rows.length === 0) return null;

    const row = rows[0];

    // Block disabled accounts from continuing privileged session usage
    if (row.status === "DISABLED") {
      return null;
    }

    // For Community users, fetch latest completed health screening status directly from MySQL
    let screeningResult: "ELIGIBLE_TO_CONTINUE" | "PROFESSIONAL_GUIDANCE_REQUIRED" | null = null;
    if (row.role === "COMMUNITY") {
      try {
        const sRes: any = await pool.query(
          `SELECT COALESCE(evaluationResult, result) as evaluationResult
           FROM community_health_screenings
           WHERE (userId = ? OR user_id = ?)
             AND (status = 'COMPLETED' OR status = 'completed' OR status IS NULL OR completedAt IS NOT NULL OR completed_at IS NOT NULL)
             AND (UPPER(COALESCE(evaluationResult, result, '')) IN ('ELIGIBLE_TO_CONTINUE', 'PROFESSIONAL_GUIDANCE_REQUIRED'))
           ORDER BY COALESCE(completedAt, completed_at, createdAt) DESC
           LIMIT 1`,
          [userId, userId]
        );
        if (Array.isArray(sRes) && sRes.length > 0) {
          const screeningRows = sRes[0];
          if (Array.isArray(screeningRows) && screeningRows.length > 0) {
            screeningResult = screeningRows[0].evaluationResult;
          }
        }
      } catch (screeningErr) {
        console.error("Screening query error in getSession:", screeningErr);
      }
    }

    return {
      id: row.id,
      email: row.email,
      role: row.role as SessionUser["role"],
      status: (row.status || "ACTIVE") as SessionUser["status"],
      name: row.name || `${row.firstName || ""} ${row.lastName || ""}`.trim() || "User",
      firstName: row.firstName || "",
      lastName: row.lastName || "",
      screeningResult,
    };
  } catch (err: any) {
    if (
      err?.digest?.includes?.("HANGING_PROMISE") ||
      err?.message?.includes?.("prerendering")
    ) {
      return null;
    }
    console.error("getSession error:", err);
    return null;
  }
}
