// src/app/api/researcher/projects/[id]/batch-analyses/analyze/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import {
  evaluateBatchQcAnalysis,
  BatchAnalysisEvaluationContext,
  BatchAnalysisReport,
} from "@/lib/batch-ai-service";

// POST /api/researcher/projects/[id]/batch-analyses/analyze
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

    // Verify project ownership
    const [projectRows]: any = await pool.query(
      `
      SELECT rp.id, rp.title,
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
    const body = await req.json();

    const {
      batchNumber,
      formulationType = "Topical Hydrogel",
      batchSizeGrams = 500,
      formulationVersion = "v1.0",
      isPrepared = false,
      manufacturingDate = null,
      ingredients = [],
      qcMeasurements = [],
      isSimulated = false,
    } = body;

    if (!batchNumber || !String(batchNumber).trim()) {
      return NextResponse.json({ error: "Batch Number identifier is required" }, { status: 400 });
    }

    const evalContext: BatchAnalysisEvaluationContext = {
      projectId,
      batchNumber: String(batchNumber).trim(),
      plantName: project.plantName,
      formulationType: String(formulationType).trim(),
      batchSizeGrams: Math.max(1, Number(batchSizeGrams) || 500),
      formulationVersion: String(formulationVersion).trim(),
      isPrepared: Boolean(isPrepared),
      manufacturingDate: isPrepared && manufacturingDate ? String(manufacturingDate).trim() : null,
      isSimulated: Boolean(isSimulated),
      ingredients: Array.isArray(ingredients) ? ingredients : [],
      qcMeasurements: Array.isArray(qcMeasurements) ? qcMeasurements : [],
    };

    // Run objective scientific evaluation
    const report: BatchAnalysisReport = await evaluateBatchQcAnalysis(evalContext);

    // Extract empirical measurements for database columns if recorded (ONLY when not simulated!)
    const phItem = qcMeasurements.find(
      (q: any) => q.testName?.toLowerCase().includes("ph") && q.measuredValue
    );
    const cleanPh = !evalContext.isSimulated && phItem && !isNaN(parseFloat(phItem.measuredValue)) ? parseFloat(phItem.measuredValue) : null;

    const viscItem = qcMeasurements.find(
      (q: any) => q.testName?.toLowerCase().includes("viscosity") && q.measuredValue
    );
    const cleanViscosity = !evalContext.isSimulated && viscItem ? String(viscItem.measuredValue).trim() : null;

    const appItem = qcMeasurements.find(
      (q: any) => (q.testName?.toLowerCase().includes("appearance") || q.testName?.toLowerCase().includes("clarity")) && q.measuredValue
    );
    const cleanAppearance = evalContext.isSimulated
      ? "Simulated Sample Demonstration"
      : appItem
      ? String(appItem.measuredValue).trim()
      : isPrepared
      ? "Observed Prepared Batch"
      : `Planned (${formulationType})`;

    const stabItem = qcMeasurements.find(
      (q: any) => q.testName?.toLowerCase().includes("stability") || q.testName?.toLowerCase().includes("centrifuge")
    );
    const cleanStability = !evalContext.isSimulated && stabItem && stabItem.measuredValue
      ? String(stabItem.measuredValue).trim()
      : evalContext.isSimulated
      ? "Simulated Sample Observation"
      : "Pending Centrifuge Testing";

    const microItem = qcMeasurements.find(
      (q: any) => q.testName?.toLowerCase().includes("microbial") || q.testName?.toLowerCase().includes("tamc")
    );
    const cleanMicrobial = !evalContext.isSimulated && microItem && microItem.measuredValue
      ? String(microItem.measuredValue).trim()
      : evalContext.isSimulated
      ? "Simulated Sample Observation"
      : "Pending Microbial Assay";

    const assayItem = qcMeasurements.find(
      (q: any) => q.testName?.toLowerCase().includes("assay") || q.testName?.toLowerCase().includes("recovery")
    );
    const cleanAssay = !evalContext.isSimulated && assayItem && assayItem.measuredValue
      ? String(assayItem.measuredValue).trim()
      : evalContext.isSimulated
      ? "Simulated Sample Observation"
      : "Pending Laboratory Testing";

    // Overall batch status mapping based on actual saved batch evidence
    let overallStatus = "Planned";
    if (evalContext.isSimulated) {
      overallStatus = "Simulated";
    } else if (!evalContext.isPrepared) {
      overallStatus = "Planned";
    } else if (report.testedCount === 0) {
      overallStatus = "Compounded";
    } else if (report.testedCount < report.totalCount) {
      overallStatus = "Testing";
    } else {
      overallStatus = "Reviewed";
    }

    // Active ingredient mass & excipient sums
    const activeIng = ingredients.find(
      (i: any) => i.role?.toLowerCase().includes("active") || i.name?.toLowerCase().includes("extract")
    );
    const activePct = activeIng ? Number(activeIng.targetPercentage || 0) : 5.0;
    const activeMass = activeIng ? Number(activeIng.targetMassGrams || (evalContext.batchSizeGrams * activePct) / 100) : (evalContext.batchSizeGrams * activePct) / 100;
    const excipientMass = Math.max(0, evalContext.batchSizeGrams - activeMass);

    // Persist full structured payload inside notes
    const notesPayload = JSON.stringify({
      batchInfo: {
        batchNumber: evalContext.batchNumber,
        formulationType: evalContext.formulationType,
        batchSizeGrams: evalContext.batchSizeGrams,
        formulationVersion: evalContext.formulationVersion,
        isPrepared: evalContext.isPrepared,
        manufacturingDate: evalContext.manufacturingDate,
      },
      ingredients,
      qcMeasurements,
      report,
    });

    // Check if a batch record with this batchNumber exists for this project
    const [existingRows]: any = await pool.query(
      "SELECT id FROM research_batch_analyses WHERE projectId = ? AND batchNumber = ? LIMIT 1",
      [projectId, evalContext.batchNumber]
    );

    let batchRecordId: number;

    if (existingRows.length > 0) {
      batchRecordId = existingRows[0].id;
      if (evalContext.isSimulated) {
        // Simulation safeguard: update notes, status, and calculation metrics without overwriting actual empirical lab measurements
        await pool.query(
          `
          UPDATE research_batch_analyses
          SET status = 'Simulated', notes = ?, activeConcentrationPercent = ?,
              batchSizeGrams = ?, activeIngredientMass = ?, excipientMassSum = ?,
              massBalanceStatus = 'Balanced (100.0%)', stabilityObservations = ?,
              updatedAt = CURRENT_TIMESTAMP(3)
          WHERE id = ? AND projectId = ?
          `,
          [
            notesPayload,
            activePct,
            evalContext.batchSizeGrams,
            activeMass,
            excipientMass,
            report.aiInterpretation.slice(0, 500),
            batchRecordId,
            projectId,
          ]
        );
      } else {
        await pool.query(
          `
          UPDATE research_batch_analyses
          SET testDate = ?, appearance = ?, pH = ?, viscosity = ?, density = ?,
              stabilityCentrifuge = ?, microbialLimitStatus = ?, assayMethod = ?,
              assayResults = ?, status = ?, notes = ?, activeConcentrationPercent = ?,
              batchSizeGrams = ?, activeIngredientMass = ?, excipientMassSum = ?,
              massBalanceStatus = 'Balanced (100.0%)', stabilityObservations = ?,
              updatedAt = CURRENT_TIMESTAMP(3)
          WHERE id = ? AND projectId = ?
          `,
          [
            evalContext.manufacturingDate,
            cleanAppearance,
            cleanPh,
            cleanViscosity,
            null, // density
            cleanStability,
            cleanMicrobial,
            assayItem ? assayItem.recommendedMethod : "HPLC-DAD Phytochemical Fingerprint Assay",
            cleanAssay,
            overallStatus,
            notesPayload,
            activePct,
            evalContext.batchSizeGrams,
            activeMass,
            excipientMass,
            report.aiInterpretation.slice(0, 500),
            batchRecordId,
            projectId,
          ]
        );
      }
    } else {
      const [insertRes]: any = await pool.query(
        `
        INSERT INTO research_batch_analyses (
          projectId, formulationId, batchNumber, testDate, appearance, colorAppearance,
          pH, viscosity, density, stabilityCentrifuge, microbialLimitStatus,
          assayMethod, assayResults, status, notes, activeConcentrationPercent,
          batchSizeGrams, activeIngredientMass, excipientMassSum, massBalanceStatus,
          stabilityObservations
        ) VALUES (?, NULL, ?, ?, ?, 'Pending Observation', ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Balanced (100.0%)', ?)
        `,
        [
          projectId,
          evalContext.batchNumber,
          evalContext.manufacturingDate,
          cleanAppearance,
          cleanPh,
          cleanViscosity,
          cleanStability,
          cleanMicrobial,
          assayItem ? assayItem.recommendedMethod : "HPLC-DAD Phytochemical Fingerprint Assay",
          cleanAssay,
          overallStatus,
          notesPayload,
          activePct,
          evalContext.batchSizeGrams,
          activeMass,
          excipientMass,
          report.aiInterpretation.slice(0, 500),
        ]
      );
      batchRecordId = insertRes.insertId;
    }

    return NextResponse.json({
      success: true,
      message: "Batch analysis generated and saved successfully",
      batchRecordId,
      report,
    });
  } catch (error: any) {
    console.error("[batch-analyze] Error evaluating batch analysis:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate batch analysis" },
      { status: 500 }
    );
  }
}

