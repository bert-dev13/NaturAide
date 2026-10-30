import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getLatestUserScreening } from "@/lib/safety-server";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const screening = await getLatestUserScreening(session.id);
    if (!screening) {
      return NextResponse.json(
        { success: false, error: "Health screening required", redirect: "/community/screening" },
        { status: 403 }
      );
    }
    if (screening.evaluationResult === "PROFESSIONAL_GUIDANCE_REQUIRED") {
      return NextResponse.json(
        { success: false, error: "Preparation guides restricted under professional care guidance", redirect: "/community/guidance" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category")?.trim() || "";

    let sql = `
      SELECT pg.id, pg.title, pg.category, pg.plantId, pg.description, pg.whatYouNeed,
             pg.preparationSteps, pg.importantReminders, pg.storageGuidance, pg.safetyInformation,
             p.commonName as plantName, p.slug as plantSlug,
             EXISTS(SELECT 1 FROM saved_preparation_guides spg WHERE spg.userId = ? AND spg.guideId = pg.id) as isSaved
      FROM preparation_guides pg
      LEFT JOIN plants p ON pg.plantId = p.id
      WHERE pg.status = 'APPROVED'
    `;
    const params: any[] = [session.id];

    if (category && category !== "All" && category !== "All Guides") {
      sql += ` AND pg.category LIKE ?`;
      params.push(`%${category}%`);
    }

    sql += ` ORDER BY pg.id ASC`;

    const [guides]: any = await pool.query(sql, params);

    return NextResponse.json({
      success: true,
      guides: guides.map((g: any) => ({
        ...g,
        isSaved: Boolean(g.isSaved),
      })),
    });
  } catch (error) {
    console.error("Error fetching preparation guides:", error);
    return NextResponse.json({ error: "Failed to fetch preparation guides" }, { status: 500 });
  }
}
