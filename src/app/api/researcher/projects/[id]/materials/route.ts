import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import { ensureV2ResearchSchema } from "@/lib/v2-research-schema";

async function assertProjectAccess(
  projectId: number,
  session: { id: number; role: string },
  write: boolean
) {
  if (session.role === "REVIEWER" && write) return false;
  if (session.role === "REVIEWER" && !write) {
    const [rows]: any = await pool.query(
      "SELECT id FROM research_projects WHERE id = ? LIMIT 1",
      [projectId]
    );
    return rows.length > 0;
  }
  const [rows]: any = await pool.query(
    "SELECT id FROM research_projects WHERE id = ? AND researcherId = ? LIMIT 1",
    [projectId, session.id]
  );
  return rows.length > 0;
}

function normalizeName(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

// GET /api/researcher/projects/[id]/materials
export async function GET(
  _req: Request,
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

    const allowed = await assertProjectAccess(projectId, session, false);
    if (!allowed) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const [rows]: any = await pool.query(
      "SELECT * FROM research_materials WHERE projectId = ? ORDER BY id ASC",
      [projectId]
    );

    return NextResponse.json({ success: true, materials: rows });
  } catch (error: any) {
    console.error("Error fetching materials:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch materials" },
      { status: 500 }
    );
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

    const allowed = await assertProjectAccess(projectId, session, true);
    if (!allowed) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      id: materialId = null,
      materialType = "EXCIPIENT",
      materialName,
      gradeOrPurity = null,
      supplierOrSource = null,
      lotOrBatchNumber = null,
      storageConditions = null,
      functionDescription = "",
      quantityAvailable = null,
      unit = "g",
      inventoryStatus,
      source = "CUSTOM",
      extractFractionId = null,
      scientificJustification = null,
      compatibilityNotes = null,
    } = body;

    if (!materialName || !String(materialName).trim()) {
      return NextResponse.json({ error: "Ingredient name is required" }, { status: 400 });
    }
    if (!functionDescription || !String(functionDescription).trim()) {
      return NextResponse.json({ error: "Ingredient role is required" }, { status: 400 });
    }

    const trimmedName = String(materialName).trim();
    const qtyRaw =
      quantityAvailable === null || quantityAvailable === undefined
        ? ""
        : String(quantityAvailable).trim();
    const hasStock = qtyRaw !== "";
    const resolvedStatus =
      inventoryStatus || (hasStock ? "AVAILABLE" : "PLANNED");
    const resolvedGrade =
      gradeOrPurity && String(gradeOrPurity).trim() ? String(gradeOrPurity).trim() : null;
    const resolvedSource = String(source || "CUSTOM").trim() || "CUSTOM";

    // Soft duplicate hint only — never block custom entries
    const [dupRows]: any = await pool.query(
      `SELECT id, materialName, materialType, functionDescription, quantityAvailable, unit, inventoryStatus
       FROM research_materials
       WHERE projectId = ?
         AND LOWER(TRIM(materialName)) = ?
         ${materialId ? "AND id <> ?" : ""}
       LIMIT 5`,
      materialId
        ? [projectId, normalizeName(trimmedName), materialId]
        : [projectId, normalizeName(trimmedName)]
    );

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
          trimmedName,
          resolvedGrade,
          supplierOrSource,
          lotOrBatchNumber,
          storageConditions,
          String(functionDescription).trim(),
          hasStock ? qtyRaw : null,
          unit || "g",
          resolvedStatus,
          resolvedSource,
          extractFractionId,
          scientificJustification,
          compatibilityNotes,
          materialId,
          projectId,
        ]
      );
      return NextResponse.json({
        success: true,
        message: "Ingredient updated successfully",
        possibleDuplicates: dupRows,
      });
    }

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
        trimmedName,
        resolvedGrade,
        supplierOrSource,
        lotOrBatchNumber,
        storageConditions,
        String(functionDescription).trim(),
        hasStock ? qtyRaw : null,
        unit || "g",
        resolvedStatus,
        resolvedSource,
        extractFractionId,
        scientificJustification,
        compatibilityNotes,
      ]
    );

    return NextResponse.json({
      success: true,
      id: result.insertId,
      message: "Ingredient added successfully",
      source: resolvedSource,
      possibleDuplicates: dupRows,
    });
  } catch (error: any) {
    console.error("Error saving material:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save material" },
      { status: 500 }
    );
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

    const allowed = await assertProjectAccess(projectId, session, true);
    if (!allowed) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Block silent breakage of formulation matrix references
    try {
      const [refRows]: any = await pool.query(
        `SELECT COUNT(*) AS cnt
         FROM formulation_components
         WHERE projectId = ? AND materialId = ?`,
        [projectId, materialId]
      );
      const refCount = Number(refRows?.[0]?.cnt || 0);
      if (refCount > 0) {
        return NextResponse.json(
          {
            error:
              "This ingredient is used in Formulation Development. Remove or reassign it there before deleting from My Ingredients.",
            code: "FORMULATION_REFERENCE",
            referenceCount: refCount,
          },
          { status: 409 }
        );
      }
    } catch (refErr: any) {
      // Older DBs without materialId column — fall through to delete
      if (
        refErr?.code !== "ER_BAD_FIELD_ERROR" &&
        !String(refErr?.message || "").includes("Unknown column")
      ) {
        throw refErr;
      }
    }

    await pool.query(
      "DELETE FROM research_materials WHERE id = ? AND projectId = ?",
      [materialId, projectId]
    );

    return NextResponse.json({ success: true, message: "Ingredient removed from inventory" });
  } catch (error: any) {
    console.error("Error deleting material:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete material" },
      { status: 500 }
    );
  }
}
