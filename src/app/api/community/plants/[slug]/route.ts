import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getLatestUserScreening } from "@/lib/safety-server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    // Check screening
    const screening = await getLatestUserScreening(session.id);
    if (!screening) {
      return NextResponse.json(
        { success: false, error: "Health screening required", redirect: "/community/screening" },
        { status: 403 }
      );
    }
    if (screening.evaluationResult === "PROFESSIONAL_GUIDANCE_REQUIRED") {
      return NextResponse.json(
        { success: false, error: "Professional guidance required", redirect: "/community/guidance" },
        { status: 403 }
      );
    }

    // Fetch plant
    const [plantRows]: any = await pool.query(
      `
      SELECT p.id, p.slug, p.commonName, p.scientificName, p.category, p.simpleUse, p.badge, p.imageUrl,
             p.preparation, p.safetyNote, p.botanical_synonyms, p.local_names, p.plant_parts_used,
             p.source_organization, p.source_url, p.source_verified, p.source_verified_at, p.is_pitahc,
             p.image_attribution AS imageAttribution,
             EXISTS(SELECT 1 FROM saved_plants sp WHERE sp.userId = ? AND sp.plantId = p.id) as isSaved
      FROM plants p
      WHERE p.slug = ? OR p.id = ?
      LIMIT 1
      `,
      [session.id, slug, slug]
    );

    if (!plantRows || plantRows.length === 0) {
      return NextResponse.json({ success: false, error: "Plant not found" }, { status: 404 });
    }

    const plant = plantRows[0];

    // Fetch detailed guide
    const [guideRows]: any = await pool.query(
      `
      SELECT about, traditionalUses, whatResearchSays, commonPreparation,
             safetyInformation, whoShouldBeCareful, medicineInteractions,
             whenToConsultDoctor, verifiedBy, preclinical_evidence,
             clinical_evidence, contraindications, documented_uses
      FROM plant_guides
      WHERE plantId = ? AND (is_community_visible = 1 OR is_community_visible IS NULL)
      LIMIT 1
      `,
      [plant.id]
    );

    const guide = guideRows[0] || null;

    // Fetch VERIFIED scientific references only (never researcher-private literature_references)
    const cleanCommon = String(plant.commonName || "").replace(/\s*\([^)]*\)/, "").trim();
    const [references]: any = await pool.query(
      `SELECT sr.id, sr.title, sr.authors, sr.publicationYear AS year, sr.journalOrPublisher AS journalSource,
              sr.sourceUrl AS doiOrUrl, sr.studyType, sr.plantOrIngredientStudied AS plantOrCompound,
              sr.shortSummary AS keyFindings
       FROM scientific_references sr
       WHERE sr.source_verified = 1
         AND (sr.plantOrIngredientStudied LIKE ? OR sr.plantOrIngredientStudied LIKE ?)
       ORDER BY sr.publicationYear DESC`,
      [`%${cleanCommon}%`, `%${plant.scientificName}%`]
    );

    // Record in recently_viewed for this user
    await pool.query(
      `
      INSERT INTO recently_viewed (userId, plantId)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE viewedAt = CURRENT_TIMESTAMP(3)
      `,
      [session.id, plant.id]
    );

    return NextResponse.json({
      success: true,
      plant: {
        ...plant,
        isSaved: Boolean(plant.isSaved),
        guide,
        references: references || [],
      },
    });
  } catch (error) {
    console.error("Error fetching plant details:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch plant details" }, { status: 500 });
  }
}