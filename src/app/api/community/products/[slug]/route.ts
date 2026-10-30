import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import { getLatestUserScreening } from "@/lib/safety-server";
import { isVerifiedProductImage, PRODUCT_PLACEHOLDER, getProductImageKind, resolveProductImage } from "@/lib/record-images";


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

  const hasValidPubmed = Boolean(ref.pubmedId && /^d+$/.test(String(ref.pubmedId).trim()));
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
  const validTypes = ["MANUFACTURER", "REGULATORY", "OFFICIAL_LABEL", "GOVERNMENT_HEALTH"];
  if (res.resourceType && !validTypes.includes(String(res.resourceType).toUpperCase())) {
    return false;
  }
  return true;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Community screening check
    const screening = await getLatestUserScreening(session.id);
    if (!screening) {
      return NextResponse.json(
        { error: "Screening required", redirectUrl: "/community/screening" },
        { status: 403 }
      );
    }
    if (screening.evaluationResult === "PROFESSIONAL_GUIDANCE_REQUIRED") {
      return NextResponse.json(
        { error: "Professional guidance required", redirectUrl: "/community/guidance" },
        { status: 403 }
      );
    }

    // Query product
    const [productRows]: any = await pool.query(
      `SELECT id, slug, name, brandName, manufacturer, productType, dosageForm,
              imageUrl, image_path, image_type, original_image_url, image_source, image_source_url,
              image_verified, image_verified_at,
              description, intendedUse, usageInstructions, warningsPrecautions, publicationStatus
       FROM herbal_products
       WHERE slug = ? AND publicationStatus IN ('VERIFIED', 'PUBLISHED') AND isPublished = 1
       LIMIT 1`,
      [slug]
    );

    if (!productRows || productRows.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const rawProduct = productRows[0];
    const imageKind = getProductImageKind(rawProduct.image_path || rawProduct.imageUrl, rawProduct.image_verified, rawProduct.image_type);
    const resolvedImg = resolveProductImage(rawProduct.image_path || rawProduct.imageUrl, rawProduct.image_verified, imageKind);
    const product = {
      ...rawProduct,
      imageUrl: resolvedImg,
      image_path: resolvedImg,
      image_type: imageKind,
      image_verified: imageKind === "AUTHENTIC_PRODUCT",
    };

    // Ingredients
    const [ingredients]: any = await pool.query(
      `SELECT id, ingredientName, strength, ingredientType
       FROM product_ingredients
       WHERE productId = ?
       ORDER BY ingredientType ASC, id ASC`,
      [product.id]
    );

    // Linked plants
    const [plants]: any = await pool.query(
      `SELECT p.id, p.slug, p.commonName, p.scientificName, pp.relationshipType
       FROM product_plants pp
       JOIN plants p ON p.id = pp.plantId
       WHERE pp.productId = ?
       ORDER BY p.commonName ASC`,
      [product.id]
    );

    // Regulatory
    const [regulatory]: any = await pool.query(
      `SELECT regulatoryAgency, registrationNumber, registrationStatus, classification,
              verificationSource, verificationUrl, lastVerifiedDate,
              verification_status, verified_at, verified_by, verification_method
       FROM product_regulatory_records
       WHERE productId = ?
       LIMIT 1`,
      [product.id]
    );

    // Scientific References
    const [references]: any = await pool.query(
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

    // Official Resources
    const [resources]: any = await pool.query(
      `SELECT id, resourceName, resourceType, url, lastVerifiedDate, description
       FROM product_resources
       WHERE productId = ?
       ORDER BY resourceType ASC, id ASC`,
      [product.id]
    );

    const regulatoryRecord = regulatory[0] || null;
    const verifiedReferences = (references || []).filter(isVerifiedScientificReference);
    const legitimateResources = (resources || []).filter(isLegitimateOfficialResource);

    const hasExactProductStudy = verifiedReferences.some(
      (r: any) => r.evidenceClassification === "EXACT_PRODUCT_STUDY"
    );
    const hasIngredientStudy = verifiedReferences.some(
      (r: any) =>
        r.evidenceClassification === "INGREDIENT_EVIDENCE" ||
        r.evidenceClassification === "PLANT_EVIDENCE" ||
        r.evidenceClassification === "FORMULATION_STUDY"
    );
    const hasSafetyEvidence = verifiedReferences.some(
      (r: any) => r.evidenceClassification === "SAFETY_EVIDENCE"
    );
    const hasOfficialResources =
      legitimateResources.length > 0 ||
      Boolean(
        regulatoryRecord?.verificationUrl &&
        isValidOfficialUrl(regulatoryRecord.verificationUrl)
      );

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        ingredients,
        plants,
        regulatoryRecord,
        references: verifiedReferences,
        resources: legitimateResources,
        evidenceSummary: {
          hasExactProductStudy,
          hasIngredientStudy,
          hasSafetyEvidence,
          hasOfficialResources,
        },
      },
    });
  } catch (error) {
    console.error("Product detail API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load product detail" },
      { status: 500 }
    );
  }
}
