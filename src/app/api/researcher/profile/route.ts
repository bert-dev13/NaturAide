import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

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
    const session = await getSession();
    if (!session || session.role !== "RESEARCHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      phone,
      institution,
      department,
      researchField,
      academicInfo,
      bio,
    } = body;

    const fullName = `${(firstName || "").trim()} ${(lastName || "").trim()}`.trim() || session.name;

    await pool.query("UPDATE users SET name = ? WHERE id = ?", [fullName, session.id]);

    await pool.query(
      `
      UPDATE user_profiles
      SET
        firstName = COALESCE(?, firstName),
        lastName = COALESCE(?, lastName),
        phone = COALESCE(?, phone),
        institution = COALESCE(?, institution),
        department = COALESCE(?, department),
        researchField = COALESCE(?, researchField),
        academicInfo = COALESCE(?, academicInfo),
        bio = COALESCE(?, bio),
        updatedAt = CURRENT_TIMESTAMP(3)
      WHERE userId = ?
      `,
      [
        firstName?.trim() || null,
        lastName?.trim() || null,
        phone?.trim() || null,
        institution?.trim() || null,
        department?.trim() || null,
        researchField?.trim() || null,
        academicInfo?.trim() || null,
        bio?.trim() || null,
        session.id,
      ]
    );

    return NextResponse.json({ success: true, message: "Researcher profile updated successfully." });
  } catch (error) {
    console.error("Researcher profile PUT error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
