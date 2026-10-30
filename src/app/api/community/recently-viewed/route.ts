import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [recentPlants]: any = await pool.query(
      `
      SELECT p.id, p.slug, p.commonName, p.scientificName, p.category, p.simpleUse, p.badge, p.imageUrl, p.safetyNote, rv.viewedAt,
        EXISTS(SELECT 1 FROM saved_plants sp WHERE sp.userId = ? AND sp.plantId = p.id) as isSaved
      FROM recently_viewed rv
      JOIN plants p ON rv.plantId = p.id
      WHERE rv.userId = ?
      ORDER BY rv.viewedAt DESC
      LIMIT 10
      `,
      [session.id, session.id]
    );

    return NextResponse.json({
      success: true,
      recentPlants: recentPlants.map((p: any) => ({
        ...p,
        isSaved: Boolean(p.isSaved),
      })),
    });
  } catch (error) {
    console.error("Error fetching recently viewed:", error);
    return NextResponse.json({ error: "Failed to fetch recently viewed" }, { status: 500 });
  }
}
