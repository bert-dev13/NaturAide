import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { resolvePlantImage } from "@/lib/record-images";
import {
  getBotanicalPlantRecord,
  getAllBotanicalPlants,
  VERIFIED_BOTANICAL_REGISTRY,
} from "@/lib/botanical-registry";
import { loadVerifiedPhytochemicals, resolveCanonicalPlantId } from "@/lib/phytochemical-catalog";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const plantId = searchParams.get("id") || searchParams.get("plantId");
    const q = searchParams.get("q")?.trim().toLowerCase();
    const projectIdParam = searchParams.get("projectId");
    const projectId = projectIdParam ? parseInt(projectIdParam, 10) : null;

    // -------------------------------------------------------------------------
    // CASE 1: SPECIFIC PLANT DETAILS REQUESTED (by ID or Slug)
    // -------------------------------------------------------------------------
    if (plantId) {
      const canonicalId = resolveCanonicalPlantId(plantId) || plantId.toLowerCase();
      const registryRecord = getBotanicalPlantRecord(canonicalId) || getBotanicalPlantRecord(plantId);

      // Query database for plant record
      const [dbPlantRows]: any = await pool.query(
        "SELECT * FROM plants WHERE id = ? OR slug = ? LIMIT 1",
        [canonicalId, canonicalId]
      );
      const dbPlant = dbPlantRows[0] || null;

      const commonName = registryRecord?.commonName || dbPlant?.commonName || plantId;
      const scientificName = registryRecord?.scientificName || dbPlant?.scientificName || "";
      const family = registryRecord?.family || "Not documented";
      const localNames = registryRecord?.localNames || dbPlant?.local_names || "Not documented";
      const documentedParts = registryRecord?.documentedParts || (dbPlant?.plant_parts_used ? [dbPlant.plant_parts_used] : ["Leaves"]);
      const traditionalUses = registryRecord?.traditionalUses || dbPlant?.simpleUse || "Not documented";
      const traditionalPreparations = registryRecord?.traditionalPreparations || dbPlant?.preparation || "Not documented";
      const safetyNotes = registryRecord?.safetyNotes || dbPlant?.safetyNote || "Not documented";
      const isPitahc = Boolean(registryRecord?.isPitahc ?? dbPlant?.is_pitahc);
      const imageUrl = resolvePlantImage(dbPlant?.local_image_path || dbPlant?.imageUrl || registryRecord?.imageUrl || "/images/placeholder-plant.jpg");

      // 1. Fetch verified phytochemicals (auto-seeds catalog if this laptop has an empty table)
      const compounds = await loadVerifiedPhytochemicals({
        plantId: canonicalId,
        scientificName,
        commonName,
      });

      // 2. Fetch scientific literature
      const firstCommon = commonName.split(" ")[0].replace(/[^a-zA-Z]/g, "");
      const [literature]: any = await pool.query(
        `SELECT id, title, authors, publicationYear, journalOrPublisher, studyType,
                doi, pubmedId, sourceUrl, shortSummary, plantOrIngredientStudied,
                isExactProductStudied, source_verified, botanical_identity_verified, verification_source, evidence_scope
         FROM scientific_references
         WHERE plantOrIngredientStudied LIKE ? OR plantOrIngredientStudied LIKE ? 
            OR title LIKE ? OR title LIKE ?
         ORDER BY publicationYear DESC, isExactProductStudied DESC`,
        [`%${firstCommon}%`, `%${scientificName}%`, `%${firstCommon}%`, `%${scientificName}%`]
      );

      // 3. If projectId provided, check which compounds and literature are already linked
      let studyCompoundNames: string[] = [];
      let linkedLiteratureIds: string[] = [];

      if (projectId && !isNaN(projectId)) {
        const [rcRows]: any = await pool.query(
          "SELECT compoundName FROM research_compounds WHERE projectId = ?",
          [projectId]
        );
        studyCompoundNames = rcRows.map((r: any) => r.compoundName);

        const [lrRows]: any = await pool.query(
          "SELECT scientificReferenceId, pubmedId, title FROM literature_references WHERE projectId = ?",
          [projectId]
        );
        linkedLiteratureIds = lrRows
          .map((r: any) => r.scientificReferenceId || r.pubmedId || r.title)
          .filter(Boolean);
      }

      return NextResponse.json({
        success: true,
        plant: {
          id: canonicalId,
          slug: canonicalId,
          commonName,
          scientificName,
          family,
          localNames,
          category: registryRecord?.category || dbPlant?.category || "Medicinal Flora",
          botanicalSynonyms: registryRecord?.botanicalSynonyms || dbPlant?.botanical_synonyms || "Not documented",
          documentedParts,
          traditionalUses,
          traditionalPreparations,
          safetyNotes,
          isPitahc,
          pharmacopeiaStatus: registryRecord?.pharmacopeiaStatus || (isPitahc ? "PITAHC Priority Medicinal Flora" : "Philippine Medicinal Flora"),
          sourceOrganization: registryRecord?.sourceOrganization || dbPlant?.source_organization || "PITAHC",
          sourceUrl: registryRecord?.sourceUrl || dbPlant?.source_url || "https://pitahc.gov.ph",
          imageUrl,
          suggestedAuthenticationMethod: registryRecord?.suggestedAuthenticationMethod || "Morphological verification & herbarium comparison",
        },
        phytochemicals: compounds,
        literature,
        studyCompoundNames,
        linkedLiteratureIds,
      });
    }

    // -------------------------------------------------------------------------
    // CASE 2: SEARCH OR LIST ALL PLANTS
    // -------------------------------------------------------------------------
    const [dbPlants]: any = await pool.query(
      `SELECT id, slug, commonName, scientificName, category, is_pitahc,
              local_names, plant_parts_used, COALESCE(local_image_path, imageUrl) as imageUrl
       FROM plants
       ORDER BY is_pitahc DESC, commonName ASC`
    );

    // Merge with Botanical Registry
    const plantMap = new Map<string, any>();

    // Seed from DB
    for (const p of dbPlants) {
      const reg = getBotanicalPlantRecord(p.id) || getBotanicalPlantRecord(p.commonName);
      plantMap.set(p.id, {
        id: p.id,
        slug: p.slug || p.id,
        commonName: p.commonName,
        scientificName: p.scientificName,
        family: reg?.family || "Not documented",
        localNames: reg?.localNames || p.local_names || "Not documented",
        category: p.category || reg?.category || "Medicinal Plant",
        isPitahc: Boolean(p.is_pitahc || reg?.isPitahc),
        documentedParts: reg?.documentedParts || (p.plant_parts_used ? [p.plant_parts_used] : ["Leaves"]),
        imageUrl: resolvePlantImage(p.imageUrl || reg?.imageUrl || "/images/placeholder-plant.jpg"),
        botanicalSynonyms: reg?.botanicalSynonyms || "Not documented",
      });
    }

    // Also include any registry plants not yet in DB
    for (const reg of getAllBotanicalPlants()) {
      if (!plantMap.has(reg.id)) {
        plantMap.set(reg.id, {
          id: reg.id,
          slug: reg.slug,
          commonName: reg.commonName,
          scientificName: reg.scientificName,
          family: reg.family,
          localNames: reg.localNames,
          category: reg.category,
          isPitahc: reg.isPitahc,
          documentedParts: reg.documentedParts,
          imageUrl: resolvePlantImage(reg.imageUrl),
          botanicalSynonyms: reg.botanicalSynonyms,
        });
      }
    }

    let all = Array.from(plantMap.values());

    // Filter if query string 'q' provided
    if (q) {
      all = all.filter((p) => {
        return (
          p.commonName.toLowerCase().includes(q) ||
          p.scientificName.toLowerCase().includes(q) ||
          p.localNames.toLowerCase().includes(q) ||
          p.family.toLowerCase().includes(q) ||
          p.botanicalSynonyms.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
        );
      });
    }

    return NextResponse.json({
      success: true,
      plants: all,
    });
  } catch (error: any) {
    if (error?.digest === "NEXT_PRERENDER_INTERRUPTED" || error?.message?.includes("bail out of prerendering")) {
      throw error;
    }
    console.error("Plants search API error:", error);
    return NextResponse.json({ error: "Failed to search plants" }, { status: 500 });
  }
}
