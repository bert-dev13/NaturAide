import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "REVIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const studyType = searchParams.get("studyType")?.trim();
    const plant = searchParams.get("plant")?.trim();
    const year = searchParams.get("year")?.trim();

    let sql = `
      SELECT DISTINCT
        lr.*,
        rp.title as projectTitle,
        COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
        u.name as researcherName
      FROM literature_references lr
      JOIN research_projects rp ON lr.projectId = rp.id
      JOIN review_assignments ra ON ra.projectId = rp.id
      JOIN users u ON rp.researcherId = u.id
      LEFT JOIN plants p ON rp.plantId = p.id
      WHERE ra.reviewerId = ?
    `;

    const params: any[] = [session.id];

    if (studyType && studyType !== "ALL") {
      sql += ` AND lr.studyType = ?`;
      params.push(studyType);
    }

    if (plant && plant !== "ALL") {
      sql += ` AND (p.commonName = ? OR rp.plantCustomName = ?)`;
      params.push(plant, plant);
    }

    if (year) {
      sql += ` AND lr.year = ?`;
      params.push(parseInt(year, 10));
    }

    if (q) {
      sql += ` AND (lr.title LIKE ? OR lr.authors LIKE ? OR lr.journalSource LIKE ? OR lr.plantOrCompound LIKE ? OR lr.tags LIKE ?)`;
      const term = `%${q}%`;
      params.push(term, term, term, term, term);
    }

    sql += ` ORDER BY lr.year DESC, lr.id DESC`;

    const [references]: any = await pool.query(sql, params);

    return NextResponse.json({ success: true, references });
  } catch (error) {
    console.error("Reviewer evidence GET error:", error);
    return NextResponse.json({ error: "Failed to load reviewer evidence library" }, { status: 500 });
  }
}
