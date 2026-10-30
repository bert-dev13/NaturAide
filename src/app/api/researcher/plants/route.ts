import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "RESEARCHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    let sql = `
      SELECT id, slug, commonName, scientificName, category, is_pitahc,
             COALESCE(local_image_path, imageUrl) as imageUrl,
             plant_parts_used
      FROM plants
    `;
    const params: any[] = [];

    if (q) {
      sql += ` WHERE (commonName LIKE ? OR scientificName LIKE ? OR category LIKE ?)`;
      const term = `%${q}%`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY is_pitahc DESC, commonName ASC`;

    const [plants]: any = await pool.query(sql, params);

    return NextResponse.json({ success: true, plants });
  } catch (error) {
    console.error("Error fetching researcher plants catalog:", error);
    return NextResponse.json({ error: "Failed to fetch medicinal plants" }, { status: 500 });
  }
}
