import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import { ensureV2ResearchSchema } from "@/lib/v2-research-schema";

// GET /api/researcher/projects/[id]/materials
export async function GET(
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

    const [rows]: any = await pool.query(
      "SELECT * FROM research_materials WHERE projectId = ? ORDER BY id ASC",
      [projectId]
    );

    return NextResponse.json({ success: true, materials: rows });
  } catch (error: any) {
    console.error("Error fetching materials:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch materials" }, { status: 500 });
  }
}

// POST /api/researcher/projects/[id]/materials (Add or Edit)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const {
      id: materialId = null,
      materialType = "EXCIPIENT",
      materialName,
      gradeOrPurity = "USP / NF / Analytical Grade",
      supplierOrSource = null,
      lotOrBatchNumber = null,
      storageConditions = "Cool, dry place (15-25°C)",
      functionDescription = "",
      quantityAvailable = null,
      unit = "g",
      inventoryStatus = "AVAILABLE",
      source = "MANUAL",
      extractFractionId = null,
      scientificJustification = null,
      compatibilityNotes = null,
    } = body;

    if (!materialName || !materialName.trim()) {
      return NextResponse.json({ error: "Material name is required" }, { status: 400 });
    }

    if (materialId) {
      await pool.query(
        `
        UPDATE research_materials
        SET materialType = ?, materialName = ?, gradeOrPurity = ?,
            supplierOrSource = ?, lotOrBatchNumber = ?, storageConditions = ?,
            functionDescription = ?, quantityAvailable = ?, unit = ?,
            inventoryStatus = ?, source = ?, extractFractionId = ?,
            scientificJustification = ?, compatibilityNotes = ?,
            updatedAt = CURRENT_TIMESTAMP(3)
        WHERE id = ? AND projectId = ?
        `,
        [
          materialType,
          materialName.trim(),
          gradeOrPurity,
          supplierOrSource,
          lotOrBatchNumber,
          storageConditions,
          functionDescription,
          quantityAvailable,
          unit,
          inventoryStatus,
          source,
          extractFractionId,
          scientificJustification,
          compatibilityNotes,
          materialId,
          projectId,
        ]
      );
      return NextResponse.json({ success: true, message: "Material updated successfully" });
    } else {
      const [result]: any = await pool.query(
        `
        INSERT INTO research_materials
          (projectId, materialType, materialName, gradeOrPurity, supplierOrSource,
           lotOrBatchNumber, storageConditions, functionDescription, quantityAvailable, unit,
           inventoryStatus, source, extractFractionId, scientificJustification, compatibilityNotes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          projectId,
          materialType,
          materialName.trim(),
          gradeOrPurity,
          supplierOrSource,
          lotOrBatchNumber,
          storageConditions,
          functionDescription,
          quantityAvailable,
          unit,
          inventoryStatus,
          source,
          extractFractionId,
          scientificJustification,
          compatibilityNotes,
        ]
      );
      return NextResponse.json({ success: true, id: result.insertId, message: "Material added successfully" });
    }
  } catch (error: any) {
    console.error("Error saving material:", error);
    return NextResponse.json({ error: error.message || "Failed to save material" }, { status: 500 });
  }
}

// DELETE /api/researcher/projects/[id]/materials?materialId=123
export async function DELETE(
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
    const { searchParams } = new URL(req.url);
    const materialId = parseInt(searchParams.get("materialId") || "", 10);

    if (isNaN(projectId) || isNaN(materialId)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    await pool.query(
      "DELETE FROM research_materials WHERE id = ? AND projectId = ?",
      [materialId, projectId]
    );

    return NextResponse.json({ success: true, message: "Material deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting material:", error);
    return NextResponse.json({ error: error.message || "Failed to delete material" }, { status: 500 });
  }
}
