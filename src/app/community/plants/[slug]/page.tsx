import React from "react";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import { getLatestUserScreening } from "@/lib/safety-server";
import PlantDetailSections from "@/components/community/PlantDetailSections";

export const instant = false;

export default async function PlantDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getSession();
  if (!session) {
    redirect(`/login?redirect=/community/plants/${slug}`);
  }

  // Enforce screening guard
  const screening = await getLatestUserScreening(session.id);
  if (!screening) {
    redirect("/community/screening");
  }

  if (screening.evaluationResult === "PROFESSIONAL_GUIDANCE_REQUIRED") {
    redirect("/community/guidance");
  }

  const userId = session.id;

  // Query plant from MySQL including official PITAHC metadata
  const [plantRows]: any = await pool.query(
    `SELECT p.id, p.slug, p.commonName, p.scientificName, p.category, p.simpleUse, p.badge, p.imageUrl,
      p.image_attribution AS imageAttribution, p.preparation, p.safetyNote,
      p.botanical_synonyms, p.local_names, p.plant_parts_used,
      p.source_organization, p.source_url, p.source_verified, p.source_verified_at, p.is_pitahc,
      EXISTS(SELECT 1 FROM saved_plants sp WHERE sp.userId = ? AND sp.plantId = p.id) as isSaved
     FROM plants p
     WHERE p.slug = ? OR p.id = ?
     LIMIT 1`,
    [userId, slug, slug]
  );

  if (!plantRows || plantRows.length === 0) {
    notFound();
  }

  const plant = plantRows[0];
  const isSaved = Boolean(plant.isSaved);

  // Query detailed guide including preclinical and clinical breakdowns
  const [guideRows]: any = await pool.query(
    `SELECT about, traditionalUses, whatResearchSays, commonPreparation,
            safetyInformation, whoShouldBeCareful, medicineInteractions,
            whenToConsultDoctor, verifiedBy, preclinical_evidence,
            clinical_evidence, contraindications, documented_uses
     FROM plant_guides
     WHERE plantId = ? AND (is_community_visible = 1 OR is_community_visible IS NULL)
     LIMIT 1`,
    [plant.id]
  );
  const guide = guideRows[0] || null;

  // Query related herbal products strictly from normalized MySQL database relationships
  const [productRows]: any = await pool.query(
    `SELECT hp.id, hp.slug, hp.name, hp.brandName, hp.manufacturer, hp.productType, hp.productClassification, hp.dosageForm, hp.dosageStrength, hp.isMultiIngredient,
            hp.imageUrl, hp.image_path, hp.image_type, hp.image_verified, hp.image_source,
            prr.registrationNumber, prr.registrationStatus, prr.regulatoryAgency, prr.issuanceDate, prr.expiryDate,
            (SELECT GROUP_CONCAT(pi.ingredientName SEPARATOR ', ') FROM product_ingredients pi WHERE pi.productId = hp.id) as ingredientsList
     FROM herbal_products hp
     JOIN product_plants pp ON pp.productId = hp.id
     LEFT JOIN product_regulatory_records prr ON prr.productId = hp.id
     WHERE pp.plantId = ? AND hp.publicationStatus IN ('VERIFIED', 'PUBLISHED') AND hp.isPublished = 1
     ORDER BY hp.name ASC`,
    [plant.id]
  );

  // Query verified scientific references from MySQL
  const cleanCommon = plant.commonName.replace(/\s*\([^)]*\)/, "").trim();
  const [refRows]: any = await pool.query(
    `SELECT sr.id, sr.title, sr.authors, sr.publicationYear as year, sr.journalOrPublisher as journalSource,
            sr.sourceUrl as doiOrUrl, sr.studyType, sr.plantOrIngredientStudied as plantOrCompound, sr.shortSummary as keyFindings,
            sr.pubmedId, sr.doi, sr.source_verified, sr.evidence_scope, sr.botanical_identity_verified
     FROM scientific_references sr
     WHERE sr.source_verified = 1
       AND (sr.plantOrIngredientStudied LIKE ? OR sr.plantOrIngredientStudied LIKE ?)
     ORDER BY sr.publicationYear DESC`,
    [`%${cleanCommon}%`, `%${plant.scientificName}%`]
  );

  // Query traditional preparations for this plant
  const [prepRows]: any = await pool.query(
    `SELECT tp.id, tp.title, tp.preparation_type, tp.plant_part_used,
            tp.traditional_use_context, tp.description,
            (SELECT COUNT(*) FROM preparation_references pr WHERE pr.preparation_id = tp.id) as referenceCount
     FROM traditional_preparations tp
     WHERE tp.plant_id = ? AND tp.status = 'PUBLISHED'
     ORDER BY tp.id ASC`,
    [plant.id]
  );

  // Query preparation references for this plant
  const [prepRefRows]: any = await pool.query(
    `SELECT pr.id, pr.preparation_id, pr.scientific_reference_id, pr.source_type,
            pr.source_title, pr.organization_or_authors, pr.publication_year,
            pr.doi_or_pmid, pr.source_url
     FROM preparation_references pr
     JOIN traditional_preparations tp ON tp.id = pr.preparation_id
     WHERE tp.plant_id = ?
     ORDER BY pr.id ASC`,
    [plant.id]
  );

  // Record in recently_viewed for this user
  if (userId) {
    await pool.query(
      `INSERT INTO recently_viewed (userId, plantId)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE viewedAt = CURRENT_TIMESTAMP(3)`,
      [userId, plant.id]
    );
  }

  return (
    <PlantDetailSections
      plant={{
        ...plant,
        isSaved,
      }}
      guide={guide}
      references={refRows || []}
      products={productRows || []}
      preparations={prepRows || []}
      preparationReferences={prepRefRows || []}
    />
  );
}