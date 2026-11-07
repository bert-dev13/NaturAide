import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession, createSessionToken, COOKIE_NAME } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "RESEARCHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [rows]: any = await pool.query(
      `
      SELECT u.id, u.email, u.role, u.name,
             p.firstName, p.lastName, p.phone, p.preferredLanguage,
             p.institution, p.department, p.researchField, p.academicInfo, p.bio
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.userId
      WHERE u.id = ?
      LIMIT 1
      `,
      [session.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, profile: rows[0] });
  } catch (error) {
    console.error("Researcher profile GET error:", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession(request);
    if (!session || session.role !== "RESEARCHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      name,
      phone,
      institution,
      department,
      researchField,
      academicInfo,
      bio,
    } = body;

    const computedName = `${(firstName || "").trim()} ${(lastName || "").trim()}`.trim();
    const fullName = (name?.trim() || computedName || session.name).trim();

    await pool.query("UPDATE users SET name = ? WHERE id = ?", [fullName, session.id]);

    await pool.query(
      `
      INSERT INTO user_profiles (
        userId, firstName, lastName, phone, institution, department, researchField, academicInfo, bio
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
      ON DUPLICATE KEY UPDATE
        firstName = COALESCE(VALUES(firstName), firstName),
        lastName = COALESCE(VALUES(lastName), lastName),
        phone = COALESCE(VALUES(phone), phone),
        institution = COALESCE(VALUES(institution), institution),
        department = COALESCE(VALUES(department), department),
        researchField = COALESCE(VALUES(researchField), researchField),
        academicInfo = COALESCE(VALUES(academicInfo), academicInfo),
        bio = COALESCE(VALUES(bio), bio),
        updatedAt = CURRENT_TIMESTAMP(3)
      `,
      [
        session.id,
        firstName?.trim() || "",
        lastName?.trim() || "",
        phone?.trim() || null,
        institution?.trim() || null,
        department?.trim() || null,
        researchField?.trim() || null,
        academicInfo?.trim() || null,
        bio?.trim() || null,
      ]
    );

    const response = NextResponse.json({
      success: true,
      message: "Researcher profile updated successfully.",
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
    console.error("Researcher profile PUT error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
