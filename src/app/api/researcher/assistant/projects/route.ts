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
      `SELECT rp.id, rp.title, rp.status, rp.currentStage,
              COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
              p.scientificName as plantScientificName
       FROM research_projects rp
       LEFT JOIN plants p ON rp.plantId = p.id
       WHERE rp.researcherId = ?
       ORDER BY rp.updatedAt DESC`,
      [session.id]
    );

    return NextResponse.json({
      success: true,
      projects: rows || [],
    });
  } catch (error: any) {
    console.error("Error fetching researcher projects for assistant:", error);
    return NextResponse.json(
      { error: "Failed to fetch researcher projects" },
      { status: 500 }
    );
  }
}
