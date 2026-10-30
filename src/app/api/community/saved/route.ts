import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getLatestUserScreening } from "@/lib/safety-server";
import { isVerifiedProductImage, PRODUCT_PLACEHOLDER, getProductImageKind, resolveProductImage } from "@/lib/record-images";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const screening = await getLatestUserScreening(session.id);
    if (!screening) {
      return NextResponse.json(
        { success: false, error: "Screening required", redirect: "/community/screening" },
        { status: 403 }
      );
    }
    if (screening.evaluationResult === "PROFESSIONAL_GUIDANCE_REQUIRED") {
      return NextResponse.json(
        { success: false, error: "Guidance required", redirect: "/community/guidance" },
        { status: 403 }
      );
    }

    // Saved plants
    const [savedPlants]: any = await pool.query(
      `
      SELECT p.id, p.slug, p.commonName, p.scientificName, p.category, p.simpleUse, p.badge, p.imageUrl, p.safetyNote, sp.createdAt as savedAt
      FROM saved_plants sp
      JOIN plants p ON sp.plantId = p.id
      WHERE sp.userId = ?
      ORDER BY sp.createdAt DESC
      `,
      [session.id]
    );

    // Saved preparation guides
    const [savedGuides]: any = await pool.query(
      `
      SELECT pg.id, pg.title, pg.category, pg.plantId, pg.description, pg.whatYouNeed, pg.preparationSteps,
             p.commonName as plantName, spg.createdAt as savedAt
      FROM saved_preparation_guides spg
      JOIN preparation_guides pg ON spg.guideId = pg.id
      LEFT JOIN plants p ON pg.plantId = p.id
      WHERE spg.userId = ?
      ORDER BY spg.createdAt DESC
      `,
      [session.id]
    );

    // Saved herbal products
    const [savedProducts]: any = await pool.query(
      `
      SELECT hp.id, hp.slug, hp.name, hp.brandName, hp.manufacturer, hp.productType, hp.dosageForm,
             hp.imageUrl, hp.image_path, hp.image_type, hp.original_image_url, hp.image_source, hp.image_source_url,
             hp.image_verified, hp.image_verified_at,
             prr.registrationNumber, p.commonName as plantName, sp.createdAt as savedAt
      FROM saved_products sp
      JOIN herbal_products hp ON sp.productId = hp.id
      LEFT JOIN product_plants pp ON hp.id = pp.productId
      LEFT JOIN plants p ON pp.plantId = p.id
      LEFT JOIN product_regulatory_records prr ON hp.id = prr.productId
      WHERE sp.userId = ?
      GROUP BY sp.id
      ORDER BY sp.createdAt DESC
      `,
      [session.id]
    );

    return NextResponse.json({
      success: true,
      savedPlants: savedPlants.map((p: any) => ({ ...p, isSaved: true })),
      savedProducts: savedProducts.map((p: any) => {
        const imageKind = getProductImageKind(p.image_path || p.imageUrl, p.image_verified, p.image_type);
        const resolvedImg = resolveProductImage(p.image_path || p.imageUrl, p.image_verified, imageKind);
        return {
          ...p,
          imageUrl: resolvedImg,
          image_path: resolvedImg,
          image_type: imageKind,
          image_verified: imageKind === "AUTHENTIC_PRODUCT",
          isSaved: true,
        };
      }),
      savedGuides: savedGuides.map((g: any) => ({ ...g, isSaved: true })),
    });
  } catch (error) {
    console.error("Error fetching saved items:", error);
    return NextResponse.json({ error: "Failed to fetch saved items" }, { status: 500 });
  }
}
