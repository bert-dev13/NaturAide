// src/app/api/researcher/projects/[id]/batch-analyses/ai-suggest/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import {
  recommendQcTestsForBatch,
  BatchAiContext,
} from "@/lib/batch-ai-service";

// POST /api/researcher/projects/[id]/batch-analyses/ai-suggest
export async function POST(
  req: Request,
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

    // Verify project exists and belongs to researcher
    const [projectRows]: any = await pool.query(
      `
      SELECT rp.id, rp.title, rp.researchObjective,
             COALESCE(p.commonName, rp.plantCustomName, 'Botanical Specimen') as plantName,
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

    // Read optional overrides from client request body
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    // Fetch Product Selection (Stage 2)
    const [prodRows]: any = await pool.query(
      "SELECT productType, deliveryFormat, targetIndications FROM research_product_selections WHERE projectId = ? LIMIT 1",
      [projectId]
    );
    const prodSelection = prodRows[0] || {};

    // Fetch Formulation & Components (Stage 5)
    const [formulationRows]: any = await pool.query(
      "SELECT id, formulationName, formulationCode, dosageFormType, targetBatchSize, currentVersionNumber FROM research_formulations WHERE projectId = ? ORDER BY id DESC LIMIT 1",
      [projectId]
    );
    const formulation = formulationRows[0] || {};

    let dbComponents: any[] = [];
    if (formulation.id) {
      const [compRows]: any = await pool.query(
        `SELECT id, componentName, componentName AS ingredientName, componentType,
                concentrationValue, concentration, concentrationUnit, unit, quantity,
                roleOrFunction, roleInFormulation, isVehicle, isPhAdjuster
         FROM formulation_components
         WHERE formulationId = ?
         ORDER BY id ASC`,
        [formulation.id]
      );
      dbComponents = compRows.map((r: any) => ({
        id: r.id,
        componentName: r.componentName,
        ingredientName: r.componentName,
        name: r.componentName,
        componentType: r.componentType || (r.isVehicle ? "VEHICLE" : "EXCIPIENT"),
        concentrationValue: parseFloat(r.concentrationValue || r.concentration || "0") || 0,
        concentrationUnit: r.concentrationUnit || r.unit || "%",
        roleOrFunction: r.roleOrFunction || r.roleInFormulation || "Compounding Excipient",
        role: r.roleOrFunction || r.roleInFormulation || "Compounding Excipient",
        isVehicle: Boolean(r.isVehicle),
        isPhAdjuster: Boolean(r.isPhAdjuster),
      }));
    } else {
      // Fallback to components associated directly with the project
      const [compRows]: any = await pool.query(
        `SELECT id, componentName, componentName AS ingredientName, componentType,
                concentrationValue, concentration, concentrationUnit, unit, quantity,
                roleOrFunction, roleInFormulation, isVehicle, isPhAdjuster
         FROM formulation_components
         WHERE projectId = ?
         ORDER BY id ASC`,
        [projectId]
      );
      if (compRows.length > 0) {
        dbComponents = compRows.map((r: any) => ({
          id: r.id,
          componentName: r.componentName,
          ingredientName: r.componentName,
          name: r.componentName,
          componentType: r.componentType || (r.isVehicle ? "VEHICLE" : "EXCIPIENT"),
          concentrationValue: parseFloat(r.concentrationValue || r.concentration || "0") || 0,
          concentrationUnit: r.concentrationUnit || r.unit || "%",
          roleOrFunction: r.roleOrFunction || r.roleInFormulation || "Compounding Excipient",
          role: r.roleOrFunction || r.roleInFormulation || "Compounding Excipient",
          isVehicle: Boolean(r.isVehicle),
          isPhAdjuster: Boolean(r.isPhAdjuster),
        }));
      }
    }

    // Prioritize valid database components with real names
    let components: any[] = [];
    if (dbComponents.length > 0) {
      components = dbComponents;
    } else if (Array.isArray(body.components) && body.components.length > 0) {
      components = body.components;
    }

    // Fetch Materials (Stage 4)
    const [materials]: any = await pool.query(
      "SELECT materialName, materialType, inventoryStatus FROM research_materials WHERE projectId = ?",
      [projectId]
    );

    // Fetch Literature References (Stage 1)
    const [literature]: any = await pool.query(
      "SELECT title, authors, year, journalSource as journal FROM literature_references WHERE projectId = ? LIMIT 6",
      [projectId]
    );

    const context: BatchAiContext = {
      projectId,
      plantName: (body.refreshFromDb ? project.plantName : body.plantName) || project.plantName,
      plantScientificName: (body.refreshFromDb ? project.plantScientificName : body.plantScientificName) || project.plantScientificName,
      dosageFormType: (body.refreshFromDb ? formulation.dosageFormType : (body.dosageFormType || formulation.dosageFormType)) || prodSelection.deliveryFormat || "Topical Hydrogel",
      deliveryFormat: prodSelection.deliveryFormat,
      productType: prodSelection.productType,
      researchObjective: project.researchObjective,
      targetBatchSize: (body.refreshFromDb ? formulation.targetBatchSize : (body.targetBatchSize || formulation.targetBatchSize)) || 500,
      formulationCode: (body.refreshFromDb ? formulation.formulationCode : (body.formulationCode || formulation.formulationCode)) || "EXP-GEL",
      formulationVersion: (body.refreshFromDb ? formulation.currentVersionNumber : (body.versionNumber || formulation.currentVersionNumber)) || "v1.0",
      components,
      materials,
      literatureReferences: literature,
    };

    const recommendations = await recommendQcTestsForBatch(context);

    return NextResponse.json({
      success: true,
      recommendations,
      formulation: {
        id: formulation.id || null,
        formulationName: formulation.formulationName || body.formulationName || `${context.plantName} Formulation`,
        formulationCode: context.formulationCode,
        dosageFormType: context.dosageFormType,
        targetBatchSize: context.targetBatchSize,
        versionNumber: context.formulationVersion,
        components: components,
      },
      context: {
        plantName: context.plantName,
        dosageFormType: context.dosageFormType,
        targetBatchSize: context.targetBatchSize,
      },
    });
  } catch (error: any) {
    console.error("[batch-ai-suggest] Error generating QC recommendations:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate QC test recommendations" },
      { status: 500 }
    );
  }
}

