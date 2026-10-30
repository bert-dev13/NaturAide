import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import { getLatestUserScreening } from "@/lib/safety-server";
import { isVerifiedProductImage, PRODUCT_PLACEHOLDER, getProductImageKind, resolveProductImage } from "@/lib/record-images";

export async function GET(request: Request) {
  try {
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

    const { searchParams } = new URL(request.url);
    const plantId = searchParams.get("plantId");
    const q = searchParams.get("q")?.trim();

    let query = `
      SELECT hp.id, hp.slug, hp.name, hp.brandName, hp.manufacturer, hp.productType, hp.dosageForm,
             hp.imageUrl, hp.image_path, hp.image_type, hp.original_image_url, hp.image_source, hp.image_source_url,
             hp.image_verified, hp.image_verified_at,
             prr.registrationNumber, prr.registrationStatus, prr.regulatoryAgency,
             (SELECT GROUP_CONCAT(pi.ingredientName SEPARATOR ', ') FROM product_ingredients pi WHERE pi.productId = hp.id) as ingredientsList
      FROM herbal_products hp
      LEFT JOIN product_regulatory_records prr ON prr.productId = hp.id
    `;
    const params: any[] = [];
    const whereConditions: string[] = ["hp.publicationStatus IN ('VERIFIED', 'PUBLISHED')", "hp.isPublished = 1"];

    if (plantId) {
      query += ` JOIN product_plants pp ON pp.productId = hp.id `;
      whereConditions.push("pp.plantId = ?");
      params.push(plantId);
    }

    if (q) {
      whereConditions.push("(hp.name LIKE ? OR hp.brandName LIKE ? OR hp.manufacturer LIKE ?)");
      const term = `%${q}%`;
      params.push(term, term, term);
    }

    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(" AND ")} `;
    }

    query += ` GROUP BY hp.id ORDER BY hp.name ASC `;

    const [rows]: any = await pool.query(query, params);

    const products = rows.map((row: any) => {
      const imageKind = getProductImageKind(row.image_path || row.imageUrl, row.image_verified, row.image_type);
      const resolvedImg = resolveProductImage(row.image_path || row.imageUrl, row.image_verified, imageKind);
      return {
        ...row,
        imageUrl: resolvedImg,
        image_path: resolvedImg,
        image_type: imageKind,
        image_verified: imageKind === "AUTHENTIC_PRODUCT",
      };
    });

    return NextResponse.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load herbal products" },
      { status: 500 }
    );
  }
}
