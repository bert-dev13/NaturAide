import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import { getLatestUserScreening } from "@/lib/safety-server";
import MobileAppHeader from "@/components/community/MobileAppHeader";
import PreparationCatalogClient, {
  PlantWithPreparations,
} from "@/components/community/PreparationCatalogClient";

export const instant = false;

export default async function PreparationCatalogPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?redirect=/community/preparation");
  }

  // Health safety screening check
  const screening = await getLatestUserScreening(session.id);
  if (!screening) {
    redirect("/community/screening");
  }

  const isProfessionalGuidanceRequired =
    screening.evaluationResult === "PROFESSIONAL_GUIDANCE_REQUIRED";

  // Query published plants and their associated traditional preparations
  const [rows]: any = await pool.query(`
    SELECT 
      p.id as plant_id,
      p.slug as plant_slug,
      p.commonName,
      p.scientificName,
      p.imageUrl,
      p.local_image_path,
      p.category,
      p.simpleUse,
      tp.id as preparation_id,
      tp.title as preparation_title,
      tp.preparation_type,
      tp.plant_part_used,
      tp.traditional_use_context,
      tp.description,
      tp.status as preparation_status,
      (SELECT COUNT(*) FROM preparation_references pr WHERE pr.preparation_id = tp.id) as reference_count
    FROM plants p
    JOIN traditional_preparations tp ON p.id = tp.plant_id
    WHERE tp.status = 'PUBLISHED'
    ORDER BY p.commonName ASC, tp.id ASC
  `);

  // Group preparations by plant for the catalog view
  const plantsMap = new Map<string, PlantWithPreparations>();
  for (const r of rows || []) {
    if (!plantsMap.has(r.plant_id)) {
      plantsMap.set(r.plant_id, {
        id: String(r.plant_id),
        slug: r.plant_slug,
        commonName: r.commonName,
        scientificName: r.scientificName,
        imageUrl: r.local_image_path || r.imageUrl,
        category: r.category,
        simpleUse: r.simpleUse,
        preparations: [],
      });
    }
    plantsMap.get(r.plant_id)!.preparations.push({
      id: String(r.preparation_id),
      title: r.preparation_title,
      preparation_type: r.preparation_type,
      plant_part_used: r.plant_part_used,
      traditional_use_context: r.traditional_use_context,
      description: r.description,
      reference_count: Number(r.reference_count) || 0,
    });
  }

  const initialPlants = Array.from(plantsMap.values());

  return (
    <div className="flex flex-col min-h-screen bg-[#faf7f2]">
      <MobileAppHeader
        showBack={true}
        backHref="/community"
        title="Preparation Guide"
        subtitle="Philippine traditional recipes and preparation methods"
      />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-28">
        <PreparationCatalogClient
          initialPlants={initialPlants}
          isProfessionalGuidanceRequired={isProfessionalGuidanceRequired}
        />
      </main>
    </div>
  );
}
