import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "REVIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [rows]: any = await pool.query(
      `
      SELECT
        rp.id,
        rp.title,
        rp.status,
        rp.currentStage,
        COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
        p.scientificName as plantScientificName,
        (
          SELECT rs.versionTag
          FROM review_submissions rs
          WHERE rs.projectId = rp.id
          ORDER BY rs.reviewRound DESC, rs.id DESC
          LIMIT 1
        ) as versionTag
      FROM review_assignments ra
      JOIN research_projects rp ON ra.projectId = rp.id
      LEFT JOIN plants p ON rp.plantId = p.id
      WHERE ra.reviewerId = ?
      GROUP BY rp.id, rp.title, rp.status, rp.currentStage, plantName, plantScientificName, rp.updatedAt
      ORDER BY rp.updatedAt DESC
      `,
      [session.id]
    );

    return NextResponse.json({
      success: true,
      projects: rows,
    });
  } catch (error) {
    console.error("GET /api/reviewer/assistant/projects error:", error);
    return NextResponse.json({ error: "Failed to load projects" }, { status: 500 });
  }
}
