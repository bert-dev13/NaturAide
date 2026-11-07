import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ensureFormulationSchema } from "@/lib/formulation-schema";
import {
  generateFormulationProposal,
  type FormulationAiContext,
} from "@/lib/formulation-ai-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "RESEARCHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    await ensureFormulationSchema();

    // 1. Fetch project and verify ownership
    const [projectRows]: any = await pool.query(
      `
      SELECT rp.id, rp.title, rp.currentStage, rp.status, rp.researchObjective, rp.researchQuestion, rp.areaOfInterest,
             COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
             p.scientificName as plantScientificName
      FROM research_projects rp
      LEFT JOIN plants p ON rp.plantId = p.id
      WHERE rp.id = ? AND rp.researcherId = ?
      LIMIT 1
      `,
      [projectId, session.id]
    );

    if (projectRows.length === 0) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    const project = projectRows[0];

    // Read optional overrides from client request
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    // 2. Fetch Stage 1 & 3 Plant and Extraction Data
    const [plantDataRows]: any = await pool.query(
      `SELECT partsStudied, extractionMethod, extractionSolvent, solventConcentration,
              extractFractionName, extractYieldPercent, plantMaterialMass, solventRatio, specimenSource
       FROM research_plant_data WHERE projectId = ? LIMIT 1`,
      [projectId]
    );
    const plantData = plantDataRows[0] || {};

    // 3. Fetch Stage 2 Product Selection & Formulation Scoping
    const [prodRows]: any = await pool.query(
      `SELECT productType, deliveryFormat, targetIndications, intendedPopulation, packagingType, rationale
       FROM research_product_selections WHERE projectId = ? LIMIT 1`,
      [projectId]
    );
    const prodSelection = prodRows[0] || {};

    // 4. Fetch Stage 4 Materials Inventory
    const [materialsRows]: any = await pool.query(
      `SELECT id, materialName, materialType, gradeOrPurity, supplierOrSource,
              lotOrBatchNumber, quantityAvailable, unit, inventoryStatus, extractFractionId, functionDescription
       FROM research_materials WHERE projectId = ? ORDER BY id ASC`,
      [projectId]
    );

    // 5. Fetch Stage 1 Literature References
    const [litRows]: any = await pool.query(
      `SELECT title, authors, year, journalSource AS journal, pubmedId AS pmid FROM literature_references WHERE projectId = ? ORDER BY id ASC LIMIT 8`,
      [projectId]
    );

    // 6. Fetch Stage 2 Phytochemical Compounds
    const [compounds]: any = await pool.query(
      `SELECT compoundName, molecularFormula, molecularWeight, smiles, selectedForDocking
       FROM research_compounds WHERE projectId = ? ORDER BY selectedForDocking DESC, id ASC LIMIT 10`,
      [projectId]
    );

    // 7. Fetch Stage 3 Docking Runs
    const [dockingRuns]: any = await pool.query(
      `SELECT ligandName, targetProtein, bindingAffinity, units
       FROM docking_runs
       WHERE projectId = ? AND bindingAffinity IS NOT NULL AND bindingAffinity <> ''
       ORDER BY id DESC LIMIT 8`,
      [projectId]
    );

    // Assemble comprehensive AI context
    const context: FormulationAiContext = {
      projectId,
      plantName: project.plantName,
      plantScientificName: project.plantScientificName || undefined,
      plantPart: body.plantPart || plantData.partsStudied || "Leaves",
      extractionSolvent: body.extractionSolvent || plantData.extractionSolvent || "70% Aqueous Ethanol",
      extractionMethod: body.extractionMethod || plantData.extractionMethod || "Standardized Maceration",
      solventConcentration: body.solventConcentration || plantData.solventConcentration || "70%",
      extractFractionName: body.extractFractionName || plantData.extractFractionName || "",
      extractFractionId: body.extractFractionId || plantData.extractFractionName || undefined,
      extractYieldPercent: plantData.extractYieldPercent || undefined,
      plantMaterialMass: plantData.plantMaterialMass || undefined,
      researchObjective: project.researchObjective || undefined,
      researchQuestion: project.researchQuestion || undefined,
      productType: body.productType || prodSelection.productType || "Herbal Formulation",
      dosageFormType: body.dosageFormType || prodSelection.deliveryFormat || "Topical Hydrogel",
      deliveryFormat: body.deliveryFormat || prodSelection.deliveryFormat || "Topical Hydrogel",
      targetIndications: body.targetIndications || prodSelection.targetIndications || "Topical application",
      intendedPopulation: body.intendedPopulation || prodSelection.intendedPopulation || "General Population",
      packagingType: prodSelection.packagingType || undefined,
      purpose: body.purpose || project.researchObjective || "Preliminary Botanical Formulation Design",
      materials: materialsRows || [],
      compounds: compounds || [],
      dockingRuns: dockingRuns || [],
      literature: litRows || [],
    };

    const proposal = await generateFormulationProposal(context);

    // Persist raw proposal in research_formulations for traceability
    try {
      const [existingForm]: any = await pool.query(
        "SELECT id FROM research_formulations WHERE projectId = ? ORDER BY id DESC LIMIT 1",
        [projectId]
      );
      if (existingForm.length > 0) {
        await pool.query(
          `UPDATE research_formulations
           SET aiProposalJson = ?, aiGeneratedAt = CURRENT_TIMESTAMP(3)
           WHERE id = ?`,
          [JSON.stringify(proposal), existingForm[0].id]
        );
      }
    } catch (saveErr: any) {
      console.warn("[formulation/generate] Could not update aiProposalJson:", saveErr.message);
    }

    return NextResponse.json({
      success: true,
      proposal,
    });
  } catch (error: any) {
    console.error("[formulation/generate] Failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate formulation proposal." },
      { status: 500 }
    );
  }
}
