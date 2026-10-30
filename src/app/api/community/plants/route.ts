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
        { success: false, error: "Health screening required before browsing herbal finder", redirect: "/community/screening" },
        { status: 403 }
      );
    }
    if (screening.evaluationResult === "PROFESSIONAL_GUIDANCE_REQUIRED") {
      return NextResponse.json(
        { success: false, error: "Recommendation-oriented herbal browsing is restricted based on safety screening", redirect: "/community/guidance" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("q")?.trim() || "";
    const category = searchParams.get("category")?.trim() || "";
    const concern = searchParams.get("concern")?.trim() || category;
    const includeAll = searchParams.get("all") === "true";

    // Public directory strictly focuses on the official DOH/PITAHC medicinal plants (is_pitahc = 1)
    let sql = `
      SELECT p.id, p.slug, p.commonName, p.scientificName, p.category, p.simpleUse, p.badge, p.imageUrl, p.safetyNote,
        p.botanical_synonyms, p.local_names, p.plant_parts_used, p.source_organization, p.source_url, p.is_pitahc,
        EXISTS(SELECT 1 FROM saved_plants sp WHERE sp.userId = ? AND sp.plantId = p.id) as isSaved
      FROM plants p
      WHERE ${includeAll ? "1=1" : "p.is_pitahc = 1"}
    `;
    const params: any[] = [session.id];

    // Search supports common name, scientific name, botanical synonyms, local/vernacular names, and therapeutic use
    if (search) {
      sql += ` AND (p.commonName LIKE ? OR p.scientificName LIKE ? OR p.botanical_synonyms LIKE ? OR p.local_names LIKE ? OR p.simpleUse LIKE ? OR p.category LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term, term, term);
    }

    if (concern && concern !== "All" && concern !== "All Plants" && concern !== "General Botanical Interest") {
      const lowerConcern = concern.toLowerCase();
      if (lowerConcern.includes("cough") || lowerConcern.includes("cold")) {
        sql += ` AND (p.category LIKE '%Cough%' OR p.simpleUse LIKE '%cough%' OR p.simpleUse LIKE '%cold%' OR p.simpleUse LIKE '%congestion%' OR p.simpleUse LIKE '%throat%')`;
      } else if (lowerConcern.includes("digest") || lowerConcern.includes("stomach")) {
        sql += ` AND (p.category LIKE '%Digest%' OR p.simpleUse LIKE '%digest%' OR p.simpleUse LIKE '%stomach%' OR p.simpleUse LIKE '%nausea%' OR p.simpleUse LIKE '%cramp%' OR p.simpleUse LIKE '%diarrhea%')`;
      } else if (lowerConcern.includes("everyday") || lowerConcern.includes("wellness")) {
        sql += ` AND (p.category LIKE '%Everyday%' OR p.category LIKE '%Wellness%' OR p.simpleUse LIKE '%wellness%' OR p.simpleUse LIKE '%fluid%' OR p.simpleUse LIKE '%diuretic%' OR p.simpleUse LIKE '%inflammatory%')`;
      } else if (lowerConcern.includes("relax") || lowerConcern.includes("sleep")) {
        sql += ` AND (p.category LIKE '%Relax%' OR p.simpleUse LIKE '%relax%' OR p.simpleUse LIKE '%sleep%' OR p.simpleUse LIKE '%calm%' OR p.simpleUse LIKE '%tiredness%')`;
      } else if (lowerConcern.includes("ache") || lowerConcern.includes("pain")) {
        sql += ` AND (p.simpleUse LIKE '%ache%' OR p.simpleUse LIKE '%pain%' OR p.simpleUse LIKE '%headache%' OR p.simpleUse LIKE '%joint%' OR p.simpleUse LIKE '%toothache%')`;
      } else if (lowerConcern.includes("skin") || lowerConcern.includes("fungal")) {
        sql += ` AND (p.simpleUse LIKE '%skin%' OR p.category LIKE '%skin%' OR p.simpleUse LIKE '%itch%' OR p.simpleUse LIKE '%rash%' OR p.simpleUse LIKE '%fungal%')`;
      } else if (lowerConcern.includes("sugar") || lowerConcern.includes("diabetes")) {
        sql += ` AND (p.simpleUse LIKE '%sugar%' OR p.category LIKE '%Sugar%' OR p.simpleUse LIKE '%diabetes%')`;
      } else if (lowerConcern.includes("kidney") || lowerConcern.includes("stone")) {
        sql += ` AND (p.simpleUse LIKE '%kidney%' OR p.category LIKE '%Kidney%' OR p.simpleUse LIKE '%stone%')`;
      } else {
        sql += ` AND (p.category LIKE ? OR p.simpleUse LIKE ?)`;
        params.push(`%${concern}%`, `%${concern}%`);
      }
    }

    sql += ` ORDER BY p.commonName ASC`;

    const [plants]: any = await pool.query(sql, params);

    return NextResponse.json({
      success: true,
      plants: plants.map((p: any) => ({
        ...p,
        isSaved: Boolean(p.isSaved),
      })),
    });
  } catch (error) {
    console.error("Error fetching plants:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch plants" }, { status: 500 });
  }
}