import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import { ensureV2ResearchSchema } from "@/lib/v2-research-schema";

export interface ImportMaterialPayload {
  materialType: string;
  materialName: string;
  gradeOrPurity?: string;
  supplierOrSource?: string | null;
  lotOrBatchNumber?: string | null;
  storageConditions?: string | null;
  functionDescription?: string | null;
  quantityAvailable?: string | null;
  unit?: string | null;
  extractFractionId?: string | null;
  scientificJustification?: string | null;
  compatibilityNotes?: string | null;
}

// POST /api/researcher/projects/[id]/materials/import
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let connection: any = null;
  try {
    await ensureV2ResearchSchema();
    const session = await getSession();
    if (!session || session.role !== "RESEARCHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const body = await req.json();
    const materials: ImportMaterialPayload[] = Array.isArray(body.materials) ? body.materials : [];

    if (materials.length === 0) {
      return NextResponse.json(
        { error: "No materials provided for import" },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Fetch existing project materials to check duplicates
    const [existingRows]: any = await connection.query(
      "SELECT id, materialName, materialType, supplierOrSource, lotOrBatchNumber, quantityAvailable FROM research_materials WHERE projectId = ?",
      [projectId]
    );

    const existingNameSet = new Set(
      existingRows.map((r: any) => (r.materialName || "").toLowerCase().trim())
    );

    const imported: any[] = [];
    const skipped: any[] = [];

    for (const item of materials) {
      const cleanName = (item.materialName || "").trim();
      if (!cleanName) continue;

      const normalized = cleanName.toLowerCase();
      if (existingNameSet.has(normalized)) {
        skipped.push({
          materialName: cleanName,
          reason: "Already present in project inventory",
        });
        continue;
      }

      // Safe Planned/Unverified creation: strictly NULL stock, supplier, lot
      const [insertResult]: any = await connection.query(
        `
        INSERT INTO research_materials
          (projectId, materialType, materialName, gradeOrPurity, supplierOrSource,
           lotOrBatchNumber, storageConditions, functionDescription, quantityAvailable, unit,
           inventoryStatus, source, extractFractionId, scientificJustification, compatibilityNotes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          projectId,
          item.materialType || "EXCIPIENT",
          cleanName,
          item.gradeOrPurity || "USP / NF / Analytical Grade",
          item.supplierOrSource || null,
          item.lotOrBatchNumber || null,
          item.storageConditions || "Controlled room temperature (15–25°C)",
          item.functionDescription || "Formulation Material",
          item.quantityAvailable || null,
          item.unit || "g",
          "PLANNED",
          "AI_RECOMMENDATION",
          item.extractFractionId || null,
          item.scientificJustification || null,
          item.compatibilityNotes || null,
        ]
      );

      existingNameSet.add(normalized);

      imported.push({
        id: insertResult.insertId,
        materialName: cleanName,
        materialType: item.materialType || "EXCIPIENT",
        inventoryStatus: "PLANNED",
        source: "AI_RECOMMENDATION",
      });
    }

    await connection.commit();

    return NextResponse.json({
      success: true,
      importedCount: imported.length,
      skippedCount: skipped.length,
      imported,
      skipped,
      message:
        imported.length > 0
          ? `Successfully imported ${imported.length} material${imported.length === 1 ? "" : "s"} as Planned inventory.${skipped.length > 0 ? ` (${skipped.length} duplicate${skipped.length === 1 ? "" : "s"} skipped)` : ""}`
          : `All ${skipped.length} material${skipped.length === 1 ? "" : "s"} were already present in project inventory.`,
    });
  } catch (error: any) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rbErr) {
        console.error("Rollback error:", rbErr);
      }
    }
    console.error("Error importing materials:", error);
    return NextResponse.json(
      { error: error.message || "Failed to import materials" },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

