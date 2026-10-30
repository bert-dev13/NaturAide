import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [rows]: any = await pool.query(
      `
      SELECT u.id, u.email, u.role, u.name,
             p.firstName, p.lastName, p.phone, p.preferredLanguage, p.healthInterests, p.createdAt
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
    console.error("Profile GET error:", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

// Update profile details (Name, phone, preferences). Role cannot be modified!
export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, phone, preferredLanguage, healthInterests } = body;

    if (!firstName || !lastName) {
      return NextResponse.json({ error: "First and last name are required" }, { status: 400 });
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    // Update users name
    await pool.query("UPDATE users SET name = ? WHERE id = ?", [fullName, session.id]);

    // Upsert user_profiles
    await pool.query(
      `
      INSERT INTO user_profiles (userId, firstName, lastName, phone, preferredLanguage, healthInterests)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        firstName = VALUES(firstName),
        lastName = VALUES(lastName),
        phone = VALUES(phone),
        preferredLanguage = VALUES(preferredLanguage),
        healthInterests = VALUES(healthInterests),
        updatedAt = CURRENT_TIMESTAMP(3)
      `,
      [
        session.id,
        firstName.trim(),
        lastName.trim(),
        phone?.trim() || null,
        preferredLanguage?.trim() || "English",
        healthInterests?.trim() || null,
      ]
    );

    return NextResponse.json({ success: true, message: "Profile updated successfully." });
  } catch (error) {
    console.error("Profile PUT error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

// Change password endpoint
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Both current password and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // Retrieve current password hash
    const [users]: any = await pool.query("SELECT password FROM users WHERE id = ?", [session.id]);
    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(currentPassword, users[0].password);
    if (!isMatch) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }

    // Hash new password securely
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, session.id]);

    return NextResponse.json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }
}
