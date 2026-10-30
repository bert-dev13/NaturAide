import React from "react";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import { getLatestUserScreening } from "@/lib/safety-server";
import MobileAppHeader from "@/components/community/MobileAppHeader";
import IndividualPreparationView, {
  DetailedPreparation,
  PlantDetails,
} from "@/components/community/IndividualPreparationView";

export const instant = false;

export default async function PlantPreparationRoutePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ method?: string }>;
}) {
  const { slug } = await params;
  const sParams = searchParams ? await searchParams : {};
  const methodNum = sParams.method ? parseInt(sParams.method, 10) : 1;
  const initialMethodIndex = !isNaN(methodNum) && methodNum > 0 ? methodNum - 1 : 0;
  const session = await getSession();
  if (!session) {
    redirect(`/login?redirect=/community/plants/${slug}/preparation`);
  }

  // Health safety screening check
  const screening = await getLatestUserScreening(session.id);
  if (!screening) {
    redirect("/community/screening");
  }

  const isProfessionalGuidanceRequired =
    screening.evaluationResult === "PROFESSIONAL_GUIDANCE_REQUIRED";

  // Query plant from MySQL
  const [plantRows]: any = await pool.query(
    `SELECT id, slug, commonName, scientificName, imageUrl, local_image_path, category, simpleUse, is_pitahc
     FROM plants
     WHERE slug = ? OR id = ?
     LIMIT 1`,
    [slug, slug]
  );

  if (!plantRows || plantRows.length === 0) {
    notFound();
  }

  const plantRaw = plantRows[0];
  const plant: PlantDetails = {
    id: plantRaw.id,
    slug: plantRaw.slug,
    commonName: plantRaw.commonName,
    scientificName: plantRaw.scientificName,
    imageUrl: plantRaw.local_image_path || plantRaw.imageUrl,
    category: plantRaw.category,
    simpleUse: plantRaw.simpleUse,
    is_pitahc: plantRaw.is_pitahc,
  };

  // Query all published traditional preparations for this plant
  const [prepRows]: any = await pool.query(
    `SELECT id, title, preparation_type, plant_part_used, traditional_use_context, description,
            administration_instructions, when_to_seek_guidance, source_verified, status
     FROM traditional_preparations
     WHERE plant_id = ? AND status = 'PUBLISHED'
     ORDER BY id ASC`,
    [plant.id]
  );

  const preparations: DetailedPreparation[] = [];

  for (const prep of prepRows) {
    // 1. Materials
    const [materials]: any = await pool.query(
      `SELECT id, material_name, amount, unit, notes
       FROM preparation_materials
       WHERE preparation_id = ?
       ORDER BY sort_order ASC, id ASC`,
      [prep.id]
    );

    // 2. Steps
    const [steps]: any = await pool.query(
      `SELECT id, step_number, instruction
       FROM preparation_steps
       WHERE preparation_id = ?
       ORDER BY step_number ASC`,
      [prep.id]
    );

    // 3. Precautions
    const [precautions]: any = await pool.query(
      `SELECT id, precaution
       FROM preparation_precautions
       WHERE preparation_id = ?
       ORDER BY id ASC`,
      [prep.id]
    );

    // 4. References
    const [references]: any = await pool.query(
      `SELECT id, source_type, source_title, organization_or_authors, publication_year, doi_or_pmid, source_url, verified_at
       FROM preparation_references
       WHERE preparation_id = ?
       ORDER BY publication_year DESC, id ASC`,
      [prep.id]
    );

    preparations.push({
      id: prep.id,
      title: prep.title,
      preparation_type: prep.preparation_type,
      plant_part_used: prep.plant_part_used,
      traditional_use_context: prep.traditional_use_context,
      description: prep.description,
      administration_instructions: prep.administration_instructions,
      when_to_seek_guidance: prep.when_to_seek_guidance,
      materials: materials || [],
      steps: steps || [],
      precautions: precautions || [],
      references: references || [],
    });
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#faf9f5]">
      <MobileAppHeader user={session} />
      <main className="flex-1 px-4 sm:px-6 py-6 max-w-4xl mx-auto w-full">
        <IndividualPreparationView
          plant={plant}
          preparations={preparations}
          isProfessionalGuidanceRequired={isProfessionalGuidanceRequired}
          backHref={`/community/plants/${plant.slug}`}
          backLabel={`← Back to ${plant.commonName}`}
          initialMethodIndex={initialMethodIndex}
        />
      </main>
    </div>
  );
}
