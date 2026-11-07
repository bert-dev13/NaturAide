import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import { ensureV2ResearchSchema } from "@/lib/v2-research-schema";
import {
  generateMaterialsRecommendations,
  MaterialsRecommendationContext,
} from "@/lib/materials-ai-service";

// POST /api/researcher/projects/[id]/materials/recommend
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureV2ResearchSchema();
    const session = await getSession();
    if (!session || (session.role !== "RESEARCHER" && session.role !== "REVIEWER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    // 1. Fetch project baseline with plant common & scientific name joined
    const [projectRows]: any = await pool.query(
      `
      SELECT rp.id, rp.title,
             COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') AS plantName,
             p.scientificName AS plantScientificName,
             rp.researchObjective, rp.researchQuestion
      FROM research_projects rp
      LEFT JOIN plants p ON rp.plantId = p.id
      WHERE rp.id = ?
      LIMIT 1
      `,
      [projectId]
    );
    if (!projectRows || projectRows.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const project = projectRows[0];

    // Optional override body if frontend passed current in-memory edits
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Empty or no body is fine
    }

    // 2. Fetch plant research details (Step 1 & Step 3)
    const [plantRows]: any = await pool.query(
      "SELECT * FROM research_plant_data WHERE projectId = ? LIMIT 1",
      [projectId]
    );
    const plantResearch = plantRows?.[0] || {};

    // 3. Fetch product selection details (Step 2)
    const [prodRows]: any = await pool.query(
      "SELECT * FROM research_product_selections WHERE projectId = ? LIMIT 1",
      [projectId]
    );
    const prodSelection = prodRows?.[0] || {};

    // 4. Fetch verified phytochemicals
    const [compoundRows]: any = await pool.query(
      "SELECT compoundName, molecularFormula FROM research_compounds WHERE projectId = ? LIMIT 10",
      [projectId]
    );

    // Merge database state with any live state passed in request body
    const context: MaterialsRecommendationContext = {
      projectId,
      plantName: body.plantName || project.plantName || plantResearch.commonName || "Medicinal Plant",
      plantScientificName: body.plantScientificName || project.plantScientificName || plantResearch.scientificName || "",
      plantParts: body.plantParts || plantResearch.partsStudied || plantResearch.plantParts || "Leaves",
      extractionMethod: body.extractionMethod || plantResearch.extractionMethod || "Standardized Maceration",
      extractionSolvent: body.extractionSolvent || plantResearch.extractionSolvent || "70% Ethanol",
      solventConcentration: body.solventConcentration || plantResearch.solventConcentration || "70%",
      extractFractionName: body.extractFractionName || plantResearch.extractFractionName || "",
      productCategory: body.productType || prodSelection.productType || "Topical Semi-Solid",
      dosageForm: body.deliveryFormat || prodSelection.deliveryFormat || "Topical Hydrogel",
      targetApplication: body.targetApplications || prodSelection.targetIndications || "Anti-inflammatory, Dermatological",
      intendedPopulation: body.intendedPopulation || prodSelection.intendedPopulation || "General Adult",
      verifiedPhytochemicals: compoundRows || [],
    };

    const result = await generateMaterialsRecommendations(context);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("Error in materials recommendation API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate materials recommendations" },
      { status: 500 }
    );
  }
}

