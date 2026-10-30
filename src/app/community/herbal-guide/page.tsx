import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import { getLatestUserScreening } from "@/lib/safety-server";
import MobileAppHeader from "@/components/community/MobileAppHeader";
import HerbalGuideClient, {
  HerbalPlantItem,
  HerbalProductItem,
} from "@/components/community/HerbalGuideClient";

export const instant = false;

export default async function HerbalGuidePage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; q?: string; concern?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login?redirect=/community/herbal-guide");
  }

  // Health safety screening check
  const screening = await getLatestUserScreening(session.id);
  if (!screening) {
    redirect("/community/screening");
  }

  const resolvedParams = searchParams ? await searchParams : {};
  const initialTab = resolvedParams.tab === "products" ? "products" : "plants";
  const initialQuery = resolvedParams.q || "";

  // 1. Query all published medicinal plants from MySQL
  const [plantRows]: any = await pool.query(`
    SELECT p.id, p.slug, p.commonName, p.scientificName, p.category, p.simpleUse,
           p.local_names, p.is_pitahc, p.imageUrl, p.local_image_path,
           (SELECT COUNT(*) FROM traditional_preparations tp WHERE tp.plant_id = p.id AND tp.status = 'PUBLISHED') as prepCount,
           (SELECT COUNT(*) FROM preparation_references pr JOIN traditional_preparations tp2 ON tp2.id = pr.preparation_id WHERE tp2.plant_id = p.id) as prepRefCount,
           (SELECT COUNT(*) FROM scientific_references sr WHERE sr.source_verified = 1 AND (sr.plantOrIngredientStudied LIKE CONCAT('%', p.commonName, '%') OR sr.plantOrIngredientStudied LIKE CONCAT('%', p.scientificName, '%'))) as sciRefCount
    FROM plants p
    ORDER BY p.commonName ASC
  `);

  const plants: HerbalPlantItem[] = (plantRows || []).map((p: any) => {
    const prepCount = Number(p.prepCount) || 0;
    const prepRefCount = Number(p.prepRefCount) || 0;
    const sciRefCount = Number(p.sciRefCount) || 0;
    // Total verified sources: official monograph (1) + sci references + prep references
    const totalRefCount = 1 + sciRefCount + prepRefCount;

    return {
      id: p.id,
      slug: p.slug,
      commonName: p.commonName,
      scientificName: p.scientificName,
      category: p.category || "General Wellness",
      simpleUse: p.simpleUse || "",
      local_names: p.local_names || "",
      is_pitahc: Boolean(p.is_pitahc),
      imageUrl: p.local_image_path || p.imageUrl,
      prepCount,
      refCount: totalRefCount,
    };
  });

  // 2. Query all published commercial herbal products from MySQL with registration status
  const [productRows]: any = await pool.query(`
    SELECT hp.id, hp.slug, hp.name, hp.brandName, hp.manufacturer, hp.dosageForm,
           hp.productClassification, hp.productType, hp.image_path, hp.imageUrl,
           hp.image_type, hp.image_verified,
           prr.registrationStatus,
           (SELECT p.commonName FROM product_plants pp JOIN plants p ON p.id = pp.plantId WHERE pp.productId = hp.id LIMIT 1) as mainPlantName,
           (SELECT p.slug FROM product_plants pp JOIN plants p ON p.id = pp.plantId WHERE pp.productId = hp.id LIMIT 1) as mainPlantSlug
    FROM herbal_products hp
    LEFT JOIN product_regulatory_records prr ON prr.productId = hp.id
    WHERE hp.isPublished = 1
    ORDER BY hp.name ASC
  `);

  const products: HerbalProductItem[] = (productRows || []).map((prod: any) => ({
    id: prod.id,
    slug: prod.slug,
    name: prod.name,
    brandName: prod.brandName,
    manufacturer: prod.manufacturer,
    dosageForm: prod.dosageForm,
    productClassification: prod.productClassification,
    productType: prod.productType,
    registrationStatus: prod.registrationStatus || "Active",
    image_path: prod.image_path || prod.imageUrl,
    image_type: prod.image_type,
    image_verified: prod.image_verified,
    mainPlantName: prod.mainPlantName,
    mainPlantSlug: prod.mainPlantSlug,
  }));

  return (
    <div className="flex flex-col min-h-screen bg-[#faf7f2]">
      <MobileAppHeader user={session} />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-28">
        <HerbalGuideClient
          plants={plants}
          products={products}
          initialTab={initialTab}
          initialQuery={initialQuery}
        />
      </main>
    </div>
  );
}
