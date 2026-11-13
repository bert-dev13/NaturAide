import pool from "@/lib/db";
import { loadVerifiedPhytochemicals, resolveCanonicalPlantId } from "@/lib/phytochemical-catalog";
import {
  getBotanicalPlantRecord,
  getAllBotanicalPlants,
} from "@/lib/botanical-registry";
import { resolvePlantImage } from "@/lib/record-images";

/**
 * Shared Section 1 Formulation R&D workspace payload.
 * Used by the researcher page and the reviewer read-only API.
 */
export async function loadFormulationRdWorkspaceData(projectId: number) {
  const [projectRows]: any = await pool.query(
    `
    SELECT rp.*,
           COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
           p.scientificName as plantScientificName,
           p.category as plantCategory,
           COALESCE(p.local_image_path, p.imageUrl) as plantImageUrl,
           p.botanical_synonyms as plantSynonyms,
           p.local_names as plantLocalNames,
           p.plant_parts_used as plantPartsUsed,
           p.source_organization as plantSourceOrg,
           p.source_url as plantSourceUrl,
           p.source_verified as plantSourceVerified,
           p.simpleUse as plantSimpleUse,
           p.preparation as plantPreparation,
           p.safetyNote as plantSafetyNote
    FROM research_projects rp
    LEFT JOIN plants p ON rp.plantId = p.id
    WHERE rp.id = ?
    LIMIT 1
    `,
    [projectId]
  );

  if (!projectRows.length) return null;
  const project = projectRows[0];
  if (project.plantImageUrl) {
    project.plantImageUrl = resolvePlantImage(project.plantImageUrl);
  }

  const [plantRows]: any = await pool.query(
    "SELECT * FROM research_plant_data WHERE projectId = ? LIMIT 1",
    [projectId]
  );
  const plantData = plantRows[0] || null;

  const canonicalPlantId =
    resolveCanonicalPlantId(project.plantId) ||
    resolveCanonicalPlantId(project.plantScientificName) ||
    resolveCanonicalPlantId(project.plantName) ||
    project.plantId ||
    null;

  const registryRecord = canonicalPlantId ? getBotanicalPlantRecord(canonicalPlantId) : null;

  const verifiedPlantDetails = {
    id: canonicalPlantId || project.plantId || "",
    slug: canonicalPlantId || project.plantId || "",
    commonName: project.plantName,
    scientificName:
      project.plantScientificName || registryRecord?.scientificName || "Not documented",
    family: registryRecord?.family || plantData?.family || "Not documented",
    localNames: registryRecord?.localNames || project.plantLocalNames || "Not documented",
    category: registryRecord?.category || "Medicinal Plant",
    isPitahc: Boolean(registryRecord?.isPitahc ?? project.plantSourceVerified ?? project.plantId),
    documentedParts:
      registryRecord?.documentedParts ||
      (project.plantPartsUsed ? [project.plantPartsUsed] : ["Leaves"]),
    imageUrl:
      project.plantImageUrl ||
      registryRecord?.imageUrl ||
      "/images/placeholder-plant.jpg",
    botanicalSynonyms: registryRecord?.botanicalSynonyms || project.plantSynonyms || "Not documented",
    traditionalUses:
      registryRecord?.traditionalUses ||
      plantData?.traditionalUses ||
      project.plantSimpleUse ||
      "Not documented",
    traditionalPreparations:
      registryRecord?.traditionalPreparations ||
      plantData?.ethnobotanicalNotes ||
      project.plantPreparation ||
      "Not documented",
    safetyNotes: registryRecord?.safetyNotes || project.plantSafetyNote || "Not documented",
    pharmacopeiaStatus: registryRecord?.pharmacopeiaStatus || "Philippine Medicinal Flora",
    suggestedAuthenticationMethod:
      registryRecord?.suggestedAuthenticationMethod ||
      "Morphological verification & herbarium reference comparison",
    sourceOrg:
      registryRecord?.sourceOrganization ||
      project.plantSourceOrg ||
      "Philippine Institute of Traditional and Alternative Health Care (PITAHC)",
    sourceUrl: registryRecord?.sourceUrl || project.plantSourceUrl || "https://pitahc.gov.ph",
  };

  const [allDbPlants]: any = await pool.query(
    `SELECT id, slug, commonName, scientificName, category, is_pitahc,
            local_names, plant_parts_used, COALESCE(local_image_path, imageUrl) as imageUrl
     FROM plants
     ORDER BY is_pitahc DESC, commonName ASC`
  );

  const plantMap = new Map<string, any>();
  for (const p of allDbPlants) {
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
  const allPlants = Array.from(plantMap.values());

  const verifiedPhytochemicals = await loadVerifiedPhytochemicals({
    plantId: canonicalPlantId || project.plantId,
    scientificName: project.plantScientificName,
    commonName: project.plantName || project.plantCustomName,
  });

  const [studyCompRows]: any = await pool.query(
    "SELECT id, compoundName FROM research_compounds WHERE projectId = ?",
    [projectId]
  );
  const initialStudyCompoundNames = studyCompRows.map((r: any) => r.compoundName);

  let scientificLiterature: any[] = [];
  try {
    const firstCommon = String(project.plantName || "")
      .split(" ")[0]
      .replace(/[^a-zA-Z]/g, "");
    const [refRows]: any = await pool.query(
      `SELECT id, title, authors, publicationYear, journalOrPublisher, studyType,
              doi, pubmedId, sourceUrl, shortSummary, plantOrIngredientStudied,
              isExactProductStudied, source_verified, botanical_identity_verified, verification_source, evidence_scope
       FROM scientific_references
       WHERE plantOrIngredientStudied LIKE ? OR plantOrIngredientStudied LIKE ?
          OR title LIKE ? OR title LIKE ?
       ORDER BY publicationYear DESC, isExactProductStudied DESC`,
      [
        `%${firstCommon}%`,
        `%${project.plantScientificName || ""}%`,
        `%${firstCommon}%`,
        `%${project.plantScientificName || ""}%`,
      ]
    );
    scientificLiterature = refRows;
  } catch (err) {
    console.warn("Failed to fetch scientific literature:", err);
  }

  const [linkedLitRows]: any = await pool.query(
    "SELECT id, title, authors, year, journalSource, doiOrUrl, scientificReferenceId, pubmedId, keyFindings FROM literature_references WHERE projectId = ? ORDER BY id DESC",
    [projectId]
  );
  const initialLinkedLiteratureIds = linkedLitRows
    .map((r: any) => r.scientificReferenceId || r.pubmedId || r.title)
    .filter(Boolean);

  const [prodRows]: any = await pool.query(
    "SELECT * FROM research_product_selections WHERE projectId = ? LIMIT 1",
    [projectId]
  );
  const productSelection = prodRows[0] || null;

  const [materials]: any = await pool.query(
    "SELECT * FROM research_materials WHERE projectId = ? ORDER BY id ASC",
    [projectId]
  );

  const [formRows]: any = await pool.query(
    "SELECT * FROM research_formulations WHERE projectId = ? ORDER BY id DESC LIMIT 1",
    [projectId]
  );
  const formulation = formRows[0] || null;

  let versions: any[] = [];
  if (formulation) {
    const [vRows]: any = await pool.query(
      "SELECT * FROM formulation_versions WHERE formulationId = ? ORDER BY id DESC",
      [formulation.id]
    );
    versions = vRows;
  }

  const [componentsRaw]: any = await pool.query(
    "SELECT * FROM formulation_components WHERE projectId = ? ORDER BY id ASC",
    [projectId]
  );
  const components = (componentsRaw || []).map((c: any) => ({
    ...c,
    ingredientName: c.ingredientName || c.componentName || "Component",
    roleOrFunction: c.roleOrFunction || c.roleInFormulation || "Compounding Agent",
    isVehicle: Boolean(
      c.isVehicle ||
        (c.roleOrFunction || c.roleInFormulation || "").toLowerCase().includes("vehicle")
    ),
    isPhAdjuster: Boolean(
      c.isPhAdjuster ||
        (c.roleOrFunction || c.roleInFormulation || "").toLowerCase().includes("ph")
    ),
  }));

  const [batches]: any = await pool.query(
    "SELECT * FROM research_batch_analyses WHERE projectId = ? ORDER BY id DESC",
    [projectId]
  );

  return {
    project: {
      id: project.id,
      title: project.title,
      plantId: project.plantId,
      plantName: project.plantName,
      plantScientificName: project.plantScientificName,
      plantImageUrl: project.plantImageUrl,
    },
    plantData,
    allPlants,
    verifiedPlantDetails,
    verifiedPhytochemicals,
    initialStudyCompoundNames,
    scientificLiterature,
    linkedLiterature: linkedLitRows || [],
    initialLinkedLiteratureIds,
    productSelection,
    materials: materials || [],
    formulation,
    formulationVersions: versions,
    components,
    batches: batches || [],
  };
}
