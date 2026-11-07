import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession, createSessionToken, COOKIE_NAME } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "REVIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [rows]: any = await pool.query(
      `
      SELECT
        u.id, u.email, u.role, u.name,
        up.firstName, up.lastName, up.phone,
        rp.specialty, rp.professionalTitle, rp.institution, rp.licenseNumber,
        rp.areasOfExpertise, rp.bio, rp.verificationStatus, rp.verifiedAt
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.userId
      LEFT JOIN reviewer_profiles rp ON u.id = rp.userId
      WHERE u.id = ?
      LIMIT 1
      `,
      [session.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Reviewer not found" }, { status: 404 });
    }

    const [areas]: any = await pool.query(
      `SELECT areaKey FROM professional_review_areas WHERE userId = ? ORDER BY id ASC`,
      [session.id]
    );

    return NextResponse.json({
      success: true,
      profile: {
        ...rows[0],
        assignedAreas: areas.map((a: any) => a.areaKey),
      },
    });
  } catch (error) {
    console.error("Reviewer profile GET error:", error);
    return NextResponse.json({ error: "Failed to load reviewer profile" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession(request);
    if (!session || session.role !== "REVIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      name,
      phone,
      specialty,
      professionalTitle,
      institution,
      licenseNumber,
      areasOfExpertise,
      bio,
    } = body;

    const computedName = `${(firstName || "").trim()} ${(lastName || "").trim()}`.trim();
    const fullName = (name?.trim() || computedName || session.name).trim();

    await pool.query("UPDATE users SET name = ? WHERE id = ?", [fullName, session.id]);

    await pool.query(
      `
      INSERT INTO user_profiles (
        userId, firstName, lastName, phone
      ) VALUES (
        ?, ?, ?, ?
      )
      ON DUPLICATE KEY UPDATE
        firstName = COALESCE(VALUES(firstName), firstName),
        lastName = COALESCE(VALUES(lastName), lastName),
        phone = COALESCE(VALUES(phone), phone),
        updatedAt = CURRENT_TIMESTAMP(3)
      `,
      [
        session.id,
        firstName?.trim() || (fullName.split(" ")[0] || ""),
        lastName?.trim() || (fullName.split(" ").slice(1).join(" ") || ""),
        phone?.trim() || null,
      ]
    );

    await pool.query(
      `
      INSERT INTO reviewer_profiles (
        userId, specialty, professionalTitle, institution, licenseNumber,
        areasOfExpertise, bio, verificationStatus
      ) VALUES (
        ?, COALESCE(?, 'PHARMACIST'), ?, ?, ?, ?, ?, 'PENDING_VERIFICATION'
      )
      ON DUPLICATE KEY UPDATE
        specialty = COALESCE(VALUES(specialty), specialty),
        professionalTitle = COALESCE(VALUES(professionalTitle), professionalTitle),
        institution = COALESCE(VALUES(institution), institution),
        licenseNumber = COALESCE(VALUES(licenseNumber), licenseNumber),
        areasOfExpertise = COALESCE(VALUES(areasOfExpertise), areasOfExpertise),
        bio = COALESCE(VALUES(bio), bio),
        updatedAt = CURRENT_TIMESTAMP(3)
      `,
      [
        session.id,
        specialty || "PHARMACIST",
        professionalTitle?.trim() || null,
        institution?.trim() || null,
        licenseNumber?.trim() || null,
        areasOfExpertise?.trim() || null,
        bio?.trim() || null,
      ]
    );

    const response = NextResponse.json({
      success: true,
      message: "Reviewer professional profile updated successfully.",
      name: fullName,
    });

    const token = await createSessionToken({
      id: session.id,
      email: session.email,
      role: session.role,
      name: fullName,
      screeningResult: (session.screeningResult as any) || "NONE",
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Reviewer profile PUT error:", error);
    return NextResponse.json({ error: "Failed to update reviewer profile" }, { status: 500 });
  }
}
