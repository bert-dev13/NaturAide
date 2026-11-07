import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";

// GET /api/researcher/projects/[id]/batch-analyses
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
      "SELECT * FROM research_batch_analyses WHERE projectId = ? ORDER BY id DESC",
      [projectId]
    );

    return NextResponse.json({ success: true, batches: rows });
  } catch (error: any) {
    console.error("Error fetching batch analyses:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch batch analyses" }, { status: 500 });
  }
}

// POST /api/researcher/projects/[id]/batch-analyses
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

    const body = await req.json();
    const {
      id: batchIdDb = null,
      formulationId = null,
      batchNumber,
      testDate = new Date().toISOString().slice(0, 10),
      appearance = "Planned Compounding",
      colorAppearance = "Pending Observation",
      pH = null,
      viscosity = null,
      density = null,
      stabilityCentrifuge = null,
      microbialLimitStatus = null,
      assayMethod = "HPLC-DAD Phytochemical Fingerprint Assay",
      assayResults = null,
      status = "Planned",
      notes = "",
      activeConcentrationPercent = 5.0,
      batchSizeGrams = 500,
      activeIngredientMass = null,
      excipientMassSum = null,
      massBalanceStatus = "Balanced (100.0%)",
      stabilityObservations = "",
    } = body;

    if (!batchNumber || !batchNumber.trim()) {
      return NextResponse.json({ error: "Batch number is required" }, { status: 400 });
    }

    // Clean numeric values for MySQL decimal/nullable columns
    const cleanPh = pH !== null && pH !== undefined && pH !== "" && !isNaN(Number(pH)) ? Number(pH) : null;
    const cleanViscosity = viscosity !== null && viscosity !== undefined && viscosity !== "" ? String(viscosity).trim() : null;
    const cleanActiveMass = activeIngredientMass !== null && !isNaN(Number(activeIngredientMass)) ? Number(activeIngredientMass) : null;
    const cleanExcipientMass = excipientMassSum !== null && !isNaN(Number(excipientMassSum)) ? Number(excipientMassSum) : null;
    const cleanNotes = typeof notes === "object" ? JSON.stringify(notes) : String(notes || "");

    if (batchIdDb) {
      await pool.query(
        `
        UPDATE research_batch_analyses
        SET formulationId = ?, batchNumber = ?, testDate = ?, appearance = ?,
            colorAppearance = ?, pH = ?, viscosity = ?, density = ?,
            stabilityCentrifuge = ?, microbialLimitStatus = ?, assayMethod = ?,
            assayResults = ?, status = ?, notes = ?, activeConcentrationPercent = ?,
            batchSizeGrams = ?, activeIngredientMass = ?, excipientMassSum = ?,
            massBalanceStatus = ?, stabilityObservations = ?, updatedAt = CURRENT_TIMESTAMP(3)
        WHERE id = ? AND projectId = ?
        `,
        [
          formulationId,
          batchNumber.trim(),
          testDate,
          appearance,
          colorAppearance,
          cleanPh,
          cleanViscosity,
          density,
          stabilityCentrifuge,
          microbialLimitStatus,
          assayMethod,
          assayResults,
          status,
          cleanNotes,
          activeConcentrationPercent,
          batchSizeGrams,
          cleanActiveMass,
          cleanExcipientMass,
          massBalanceStatus,
          stabilityObservations,
          batchIdDb,
          projectId,
        ]
      );
      return NextResponse.json({ success: true, message: "Batch analysis updated successfully" });
    } else {
      const [result]: any = await pool.query(
        `
        INSERT INTO research_batch_analyses
          (projectId, formulationId, batchNumber, testDate, appearance, colorAppearance,
           pH, viscosity, density, stabilityCentrifuge, microbialLimitStatus, assayMethod,
           assayResults, status, notes, activeConcentrationPercent, batchSizeGrams,
           activeIngredientMass, excipientMassSum, massBalanceStatus, stabilityObservations)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          projectId,
          formulationId,
          batchNumber.trim(),
          testDate,
          appearance,
          colorAppearance,
          cleanPh,
          cleanViscosity,
          density,
          stabilityCentrifuge,
          microbialLimitStatus,
          assayMethod,
          assayResults,
          status,
          cleanNotes,
          activeConcentrationPercent,
          batchSizeGrams,
          cleanActiveMass,
          cleanExcipientMass,
          massBalanceStatus,
          stabilityObservations,
        ]
      );

      return NextResponse.json({
        success: true,
        id: result.insertId,
        message: "Batch analysis recorded successfully",
      });
    }
  } catch (error: any) {
    console.error("Error creating batch analysis:", error);
    return NextResponse.json({ error: error.message || "Failed to save batch analysis" }, { status: 500 });
  }
}

// DELETE /api/researcher/projects/[id]/batch-analyses?batchId=123
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
    const batchId = parseInt(searchParams.get("batchId") || "", 10);

    if (isNaN(projectId) || isNaN(batchId)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    await pool.query(
      "DELETE FROM research_batch_analyses WHERE id = ? AND projectId = ?",
      [batchId, projectId]
    );

    return NextResponse.json({ success: true, message: "Batch analysis deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting batch analysis:", error);
    return NextResponse.json({ error: error.message || "Failed to delete batch analysis" }, { status: 500 });
  }
}
