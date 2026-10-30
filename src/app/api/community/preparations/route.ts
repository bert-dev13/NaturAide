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

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";
    const filter = searchParams.get("filter")?.trim() || "";

    // Query published plants and their associated traditional preparations
    let sql = `
      SELECT 
        p.id as plant_id,
        p.slug as plant_slug,
        p.commonName,
        p.scientificName,
        p.imageUrl,
        p.local_image_path,
        p.category,
        p.simpleUse,
        tp.id as preparation_id,
        tp.title as preparation_title,
        tp.preparation_type,
        tp.plant_part_used,
        tp.traditional_use_context,
        tp.description,
        tp.status as preparation_status,
        (SELECT COUNT(*) FROM preparation_references pr WHERE pr.preparation_id = tp.id) as reference_count
      FROM plants p
      JOIN traditional_preparations tp ON p.id = tp.plant_id
      WHERE tp.status = 'PUBLISHED'
    `;
    const params: any[] = [];

    if (query) {
      sql += ` AND (p.commonName LIKE ? OR p.scientificName LIKE ? OR tp.title LIKE ? OR tp.plant_part_used LIKE ?)`;
      const qPattern = `%${query}%`;
      params.push(qPattern, qPattern, qPattern, qPattern);
    }

    if (filter && filter !== "All") {
      if (filter === "Decoction") {
        sql += ` AND tp.preparation_type = 'DECOCTION'`;
      } else if (filter === "Infusion / Tea" || filter === "Infusion" || filter === "Tea") {
        sql += ` AND (tp.preparation_type = 'INFUSION' OR tp.preparation_type = 'HERBAL_TEA')`;
      } else if (filter === "Topical") {
        sql += ` AND (tp.preparation_type = 'TOPICAL_APPLICATION' OR tp.preparation_type = 'POULTICE')`;
      } else if (filter === "Wash") {
        sql += ` AND tp.preparation_type = 'WASH'`;
      } else if (filter === "Other") {
        sql += ` AND tp.preparation_type NOT IN ('DECOCTION', 'INFUSION', 'HERBAL_TEA', 'TOPICAL_APPLICATION', 'POULTICE', 'WASH')`;
      }
    }

    sql += ` ORDER BY p.commonName ASC, tp.id ASC`;

    const [rows]: any = await pool.query(sql, params);

    // Group preparations by plant for the catalog view
    const plantsMap = new Map<string, any>();
    for (const r of rows) {
      if (!plantsMap.has(r.plant_id)) {
        plantsMap.set(r.plant_id, {
          id: r.plant_id,
          slug: r.plant_slug,
          commonName: r.commonName,
          scientificName: r.scientificName,
          imageUrl: r.local_image_path || r.imageUrl,
          category: r.category,
          simpleUse: r.simpleUse,
          preparations: [],
        });
      }
      plantsMap.get(r.plant_id).preparations.push({
        id: r.preparation_id,
        title: r.preparation_title,
        preparation_type: r.preparation_type,
        plant_part_used: r.plant_part_used,
        traditional_use_context: r.traditional_use_context,
        description: r.description,
        reference_count: r.reference_count,
      });
    }

    return NextResponse.json({
      success: true,
      plants: Array.from(plantsMap.values()),
      isProfessionalGuidanceRequired: screening.evaluationResult === "PROFESSIONAL_GUIDANCE_REQUIRED",
    });
  } catch (error) {
    console.error("Error fetching traditional preparations:", error);
    return NextResponse.json({ error: "Failed to fetch traditional preparations" }, { status: 500 });
  }
}
