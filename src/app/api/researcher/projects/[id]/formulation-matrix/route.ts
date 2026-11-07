import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ensureFormulationSchema } from "@/lib/formulation-schema";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureFormulationSchema();
    const session = await getSession();
    if (!session || session.role !== "RESEARCHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    // Verify ownership
    const [pCheck]: any = await pool.query(
      "SELECT id FROM research_projects WHERE id = ? AND researcherId = ? LIMIT 1",
      [projectId, session.id]
    );
    if (pCheck.length === 0) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    const body = await request.json();
    const {
      formulationName,
      formulationCode,
      dosageFormType,
      formulationType = "Standardized Herbal Preparation",
      totalTargetMassVolume = "100 g",
      targetBatchSize = "500 g",
      formulationReferences = "",
      notes = "",
      versionNumber = "v1.0",
      components = [],
    } = body;

    if (!formulationName || !formulationName.trim()) {
      return NextResponse.json({ error: "Formulation name is required." }, { status: 400 });
    }

    // Find or create formulation record
    const [existing]: any = await pool.query(
      "SELECT id FROM research_formulations WHERE projectId = ? LIMIT 1",
      [projectId]
    );

    let formulationId: number;

    if (existing.length > 0) {
      formulationId = existing[0].id;
      await pool.query(
        `
        UPDATE research_formulations
        SET formulationName = ?,
            formulationCode = ?,
            dosageFormType = ?,
            formulationType = ?,
            totalTargetMassVolume = ?,
            targetBatchSize = ?,
            formulationReferences = ?,
            notes = ?,
            currentVersionNumber = ?,
            updatedAt = CURRENT_TIMESTAMP(3)
        WHERE id = ?
        `,
        [
          formulationName.trim(),
          formulationCode || null,
          dosageFormType || "Topical Hydrogel",
          formulationType,
          totalTargetMassVolume,
          targetBatchSize,
          formulationReferences,
          notes,
          versionNumber,
          formulationId,
        ]
      );
    } else {
      const [insertRes]: any = await pool.query(
        `
        INSERT INTO research_formulations (
          projectId, formulationName, formulationCode, dosageFormType,
          formulationType, totalTargetMassVolume, targetBatchSize,
          formulationReferences, notes, currentVersionNumber, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'IN_PROGRESS')
        `,
        [
          projectId,
          formulationName.trim(),
          formulationCode || null,
          dosageFormType || "Topical Hydrogel",
          formulationType,
          totalTargetMassVolume,
          targetBatchSize,
          formulationReferences,
          notes,
          versionNumber,
        ]
      );
      formulationId = insertRes.insertId;

      // Create initial version entry
      await pool.query(
        `
        INSERT INTO formulation_versions (
          formulationId, projectId, versionNumber, versionTag, changeSummary, createdByResearcherId, isCurrentVersion
        ) VALUES (?, ?, ?, 'Initial Formulation Prototype', 'Initial research formulation created.', ?, 1)
        `,
        [formulationId, projectId, versionNumber, session.id]
      );
    }

    // Upsert / Replace components in formulation_components for this projectId
    // First remove old components for this projectId
    await pool.query("DELETE FROM formulation_components WHERE projectId = ?", [projectId]);

    for (const comp of components) {
      const compName = comp.ingredientName || comp.componentName || "Component";
      const compType = comp.componentType || (compName.toLowerCase().includes("extract") ? "ACTIVE_EXTRACT" : "EXCIPIENT");
      const concVal = comp.concentrationValue !== undefined ? parseFloat(comp.concentrationValue) : null;
      const minVal = comp.minConcentration !== undefined && comp.minConcentration !== "" ? parseFloat(comp.minConcentration) : null;
      const maxVal = comp.maxConcentration !== undefined && comp.maxConcentration !== "" ? parseFloat(comp.maxConcentration) : null;
      const quantityStr = comp.quantity !== undefined ? String(comp.quantity) : (concVal !== null ? `${concVal} g` : "qs");

      await pool.query(
        `
        INSERT INTO formulation_components (
          formulationId, projectId, componentName, componentType, roleInFormulation,
          roleOrFunction, quantity, unit, concentration, concentrationValue,
          concentrationUnit, minConcentration, maxConcentration, notes,
          materialId, inventoryStatus, isVehicle, isPhAdjuster, sourceReference,
          isAiSuggested, evidenceStatus
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          formulationId,
          projectId,
          compName,
          compType,
          comp.roleOrFunction || comp.roleInFormulation || "Excipient",
          comp.roleOrFunction || comp.roleInFormulation || "Excipient",
          quantityStr,
          comp.unit || "% w/w",
          concVal !== null ? `${concVal}%` : comp.concentration || "%",
          concVal,
          comp.concentrationUnit || "% w/w",
          minVal,
          maxVal,
          comp.notes || null,
          comp.materialId ? parseInt(String(comp.materialId), 10) : null,
          comp.inventoryStatus || null,
          comp.isVehicle ? 1 : 0,
          comp.isPhAdjuster ? 1 : 0,
          comp.sourceReference || null,
          comp.isAiSuggested ? 1 : 0,
          comp.evidenceStatus || (comp.isConcentrationSupported === false ? "REQUIRES_EXPERIMENTAL_VALIDATION" : "SUPPORTED"),
        ]
      );
    }

    return NextResponse.json({
      success: true,
      message: "Formulation composition and components successfully saved.",
      formulationId,
    });
  } catch (error: any) {
    console.error("Error saving formulation matrix:", error);
    return NextResponse.json({ error: error.message || "Failed to save formulation matrix" }, { status: 500 });
  }
}

