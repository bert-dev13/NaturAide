import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { createSessionToken, COOKIE_NAME } from "@/lib/auth";
import { getLatestUserScreening } from "@/lib/safety-server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = body;

    // 1. Validation
    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Please provide both email and password." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Query MySQL users table
    const [userRows]: any = await pool.query(
      `
      SELECT u.id, u.email, u.password, u.role, u.name, u.status, p.firstName, p.lastName
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.userId
      WHERE LOWER(u.email) = ?
      LIMIT 1
      `,
      [normalizedEmail]
    );

    if (!userRows || userRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const user = userRows[0];

    // 3. Verify bcrypt password hash
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // 3.1 Check account active status
    if (user.status === "DISABLED") {
      return NextResponse.json(
        {
          success: false,
          error: "Your account is currently unavailable. Please contact NatureAide Support.",
        },
        { status: 403 }
      );
    }

    // Update lastLoginAt and lastActiveAt timestamps
    await pool.query(
      "UPDATE users SET lastLoginAt = CURRENT_TIMESTAMP(3), lastActiveAt = CURRENT_TIMESTAMP(3) WHERE id = ?",
      [user.id]
    );

    // 4. Determine role and destination URL
    const role = (user.role || "COMMUNITY").toUpperCase();

    // Verify role is one of the three supported user types
    if (role !== "COMMUNITY" && role !== "RESEARCHER" && role !== "REVIEWER") {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied. Only Community, Researcher, and Professional Reviewer accounts are supported.",
        },
        { status: 403 }
      );
    }

    let redirectUrl = "/community";
    let screeningStatus: "ELIGIBLE_TO_CONTINUE" | "PROFESSIONAL_GUIDANCE_REQUIRED" | "NONE" = "NONE";

    if (role === "RESEARCHER") {
      redirectUrl = "/researcher";
    } else if (role === "REVIEWER") {
      redirectUrl = "/reviewer";
    } else {
      // For COMMUNITY: Check user's latest valid health screening in MySQL
      const screening = await getLatestUserScreening(user.id);
      if (!screening) {
        redirectUrl = "/community/screening";
        screeningStatus = "NONE";
      } else if (screening.evaluationResult === "PROFESSIONAL_GUIDANCE_REQUIRED") {
        redirectUrl = "/community/guidance";
        screeningStatus = "PROFESSIONAL_GUIDANCE_REQUIRED";
      } else {
        redirectUrl = "/community";
        screeningStatus = "ELIGIBLE_TO_CONTINUE";
      }
    }

    const displayName =
      user.name ||
      `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      user.email.split("@")[0];

    // 5. Create signed session JWT
    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      role: role,
      name: displayName,
      screeningResult: screeningStatus,
    });

    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7; // 30 days or 7 days

    // 6. Build response with HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      message: "Authentication successful.",
      user: {
        id: user.id,
        email: user.email,
        role: role,
        name: displayName,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        screeningStatus,
      },
      redirectUrl,
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    if (role === "COMMUNITY") {
      response.cookies.set({
        name: "natureaide_screening",
        value: screeningStatus,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge,
      });
    }

    return response;
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred during authentication." },
      { status: 500 }
    );
  }
}
