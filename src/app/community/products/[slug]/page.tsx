import React from "react";
import { notFound, redirect } from "next/navigation";
import { resolveProductImage, getProductImageKind } from "@/lib/record-images";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import { getLatestUserScreening } from "@/lib/safety-server";
import { communityVerificationMessage, getRegulatoryAudit } from "@/lib/regulatory-verification";
import ProductDetailSections from "@/components/community/ProductDetailSections";

function isValidOfficialUrl(url: unknown): boolean {
  if (typeof url !== "string") return false;
  const trimmed = url.trim().toLowerCase();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) return false;
  const invalidSubstrings = [
    "placeholder",
    "example.com",
    "example.org",
    "localhost",
    "test.com",
    "sample.com",
    "dummy",
    "fake",
    "none",
    "null",
    "undefined",
    "void(0)",
    "#",
  ];
  return !invalidSubstrings.some((inv) => trimmed.includes(inv));
}

function isVerifiedScientificReference(ref: any): boolean {
  if (!ref || !ref.id) return false;
  if (!ref.title || typeof ref.title !== "string" || ref.title.trim().length === 0) return false;
  if (ref.source_verified !== 1 && ref.source_verified !== true) return false;

  const lowerTitle = ref.title.trim().toLowerCase();
  if (
    lowerTitle === "placeholder" ||
    lowerTitle === "untitled" ||
    lowerTitle === "n/a" ||
    lowerTitle.startsWith("dummy") ||
    lowerTitle.startsWith("test reference")
  ) {
    return false;
  }

  // Must have at least one valid verifiable identifier or citation source
  const hasValidPubmed = Boolean(ref.pubmedId && /^\d+$/.test(String(ref.pubmedId).trim()));
  const hasValidDoi = Boolean(
    ref.doi &&
    typeof ref.doi === "string" &&
    ref.doi.trim().startsWith("10.") &&
    !ref.doi.toLowerCase().includes("example")
  );
  const hasValidUrl = isValidOfficialUrl(ref.sourceUrl);

  if (!hasValidPubmed && !hasValidDoi && !hasValidUrl) {
    return false;
  }

  const validClassifications = [
    "EXACT_PRODUCT_STUDY",
    "FORMULATION_STUDY",
    "INGREDIENT_EVIDENCE",
    "PLANT_EVIDENCE",
    "SAFETY_EVIDENCE",
  ];
  return validClassifications.includes(ref.evidenceClassification);
}

function isLegitimateOfficialResource(res: any): boolean {
  if (!res) return false;
  if (!isValidOfficialUrl(res.url)) return false;
  if (!res.resourceName || typeof res.resourceName !== "string" || res.resourceName.trim().length === 0) {
    return false;
  }
  const lowerName = res.resourceName.trim().toLowerCase();
  if (lowerName === "placeholder" || lowerName === "dummy" || lowerName === "n/a") {
    return false;
  }
  return true;
}

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export const instant = false;

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const session = await getSession();

  if (!session) {
    redirect(`/login?redirect=/community/products/${slug}`);
  }

  // 1. Health Screening Guard (Strict adherence to Community safety workflow)
  const screening = await getLatestUserScreening(session.id);
  if (!screening) {
    redirect("/community/screening");
  }

  if (screening.evaluationResult === "PROFESSIONAL_GUIDANCE_REQUIRED") {
    redirect("/community/guidance");
  }

  // 2. Query published herbal product from MySQL
  const [productRows]: any = await pool.query(
    `SELECT id, slug, name, brandName, manufacturer, productType, productClassification, dosageForm, dosageStrength, isMultiIngredient,
            imageUrl, image_path, image_type, original_image_url, image_source, image_source_url,
            image_verified, image_verified_at, image_attribution AS imageAttribution,
            description, intendedUse, usageInstructions, warningsPrecautions, preparationGuide, publicationStatus
     FROM herbal_products
     WHERE slug = ? AND publicationStatus IN ('VERIFIED', 'PUBLISHED') AND isPublished = 1
     LIMIT 1`,
    [slug]
  );

  if (!productRows || productRows.length === 0) {
    notFound();
  }

  const product = productRows[0];
  const imageKind = getProductImageKind(
    product.image_path || product.imageUrl,
    product.image_verified,
    product.image_type
  );
  product.image_type = imageKind;
  product.image_verified = imageKind === "AUTHENTIC_PRODUCT" ? 1 : 0;
  product.image_path = resolveProductImage(
    product.image_path || product.imageUrl,
    product.image_verified,
    imageKind
  );

  // 3. Query Herbal Ingredients
  const [ingredientRows]: any = await pool.query(
    `SELECT id, ingredientName, strength, ingredientType
     FROM product_ingredients
     WHERE productId = ?
     ORDER BY ingredientType ASC, id ASC`,
    [product.id]
  );

  // 4. Query Linked Medicinal Plants
  const [linkedPlantRows]: any = await pool.query(
    `SELECT p.id, p.slug, p.commonName, p.scientificName, pp.relationshipType
     FROM product_plants pp
     JOIN plants p ON p.id = pp.plantId
     WHERE pp.productId = ?
     ORDER BY p.commonName ASC`,
    [product.id]
  );

  // 5. Query Regulatory / Registration Records
  const [regulatoryRows]: any = await pool.query(
    `SELECT regulatoryAgency, registrationNumber, registrationStatus, classification, issuanceDate, expiryDate,
            verificationSource, verificationUrl, lastVerifiedDate,
            verification_status, verified_at, verified_by, verification_method
     FROM product_regulatory_records
     WHERE productId = ?
     LIMIT 1`,
    [product.id]
  );
  const regulatoryRecord = regulatoryRows[0] || null;
  const regulatoryAudit = getRegulatoryAudit(regulatoryRecord);
  const verificationMessage = communityVerificationMessage(regulatoryAudit);

  // 6. Query Scientific Evidence & References (Normalized join - strictly source_verified = 1)
  const [referenceRows]: any = await pool.query(
    `SELECT sr.id, sr.title, sr.authors, sr.publicationYear, sr.journalOrPublisher,
            sr.studyType, sr.doi, sr.pubmedId, sr.sourceUrl, sr.shortSummary,
            sr.plantOrIngredientStudied, sr.isExactProductStudied,
            sr.source_verified, sr.evidence_scope, sr.botanical_identity_verified,
            pr.evidenceClassification, pr.evidenceNote, pr.supported_ingredient AS supportedIngredient
     FROM product_references pr
     JOIN scientific_references sr ON sr.id = pr.referenceId
     WHERE pr.productId = ? AND sr.source_verified = 1
     ORDER BY sr.isExactProductStudied DESC, sr.publicationYear DESC`,
    [product.id]
  );

  // 7. Query Official Product Resources
  const [resourceRows]: any = await pool.query(
    `SELECT id, resourceName, resourceType, url, lastVerifiedDate, description
     FROM product_resources
     WHERE productId = ?
     ORDER BY resourceType ASC, id ASC`,
    [product.id]
  );

  // 8. Query saved state for this user
  const [savedProductRows]: any = await pool.query(
    `SELECT id FROM saved_products WHERE userId = ? AND productId = ? LIMIT 1`,
    [session.id, product.id]
  );
  const isSaved = Boolean(savedProductRows && savedProductRows.length > 0);

  // Filter verified scientific references and legitimate official resources
  const verifiedReferences = (referenceRows || []).filter(isVerifiedScientificReference);
  const legitimateResources = (resourceRows || []).filter(isLegitimateOfficialResource);

  return (
    <ProductDetailSections
      product={product}
      linkedPlants={linkedPlantRows || []}
      ingredients={ingredientRows || []}
      regulatoryRecord={regulatoryRecord}
      regulatoryAudit={regulatoryAudit}
      verificationMessage={verificationMessage}
      references={verifiedReferences}
      resources={legitimateResources}
      isSaved={isSaved}
    />
  );
}
