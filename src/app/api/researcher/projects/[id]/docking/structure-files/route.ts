import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { analyzeProteinLigandInteractions } from "@/lib/interaction-analysis-service";
import { getDockingPaths } from "@/lib/docking-service";

// GET /api/researcher/projects/[id]/docking/structure-files?runId=123
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
    const { searchParams } = new URL(req.url);
    const runId = parseInt(searchParams.get("runId") || "", 10);

    if (isNaN(projectId) || isNaN(runId)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    // Fetch run
    const [runRows]: any = await pool.query(
      `
      SELECT dr.*, dt.cleanPdbPath, dt.receptorPdbqtPath, dt.pdbId, dt.targetName
      FROM docking_runs dr
      LEFT JOIN docking_targets dt ON dr.targetId = dt.id
      WHERE dr.id = ? AND dr.projectId = ?
      LIMIT 1
      `,
      [runId, projectId]
    );

    if (runRows.length === 0) {
      return NextResponse.json({ error: "Docking run not found" }, { status: 404 });
    }

    const run = runRows[0];
    const pdbId = (run.pdbId || "").toLowerCase();

    // Look for receptor file
    let receptorPdbText = "";
    const receptorPaths = [
      run.cleanPdbPath,
      path.join(getDockingPaths().artifactDir, `project-${projectId}`, "receptors", `${pdbId}_clean.pdb`),
      path.join(getDockingPaths().artifactDir, `project-${projectId}`, "receptors", `${pdbId}_raw.pdb`),
      path.join(getDockingPaths().artifactDir, "_smoke", `${run.pdbId}.pdb`),
    ].filter(Boolean);

    for (const p of receptorPaths) {
      if (fs.existsSync(p)) {
        receptorPdbText = fs.readFileSync(p, "utf-8");
        break;
      }
    }

    // Look for ligand docked poses file
    let ligandPdbqtText = "";
    const ligandPaths = [
      run.outputPdbqtPath,
      path.join(getDockingPaths().artifactDir, `project-${projectId}`, "jobs", String(runId), "poses.pdbqt"),
    ].filter(Boolean);

    for (const p of ligandPaths) {
      if (fs.existsSync(p)) {
        ligandPdbqtText = fs.readFileSync(p, "utf-8");
        break;
      }
    }

    // Analyze 2D/3D interactions if both structure files exist
    let interactionAnalysis = null;
    if (receptorPdbText && ligandPdbqtText) {
      interactionAnalysis = analyzeProteinLigandInteractions(receptorPdbText, ligandPdbqtText);

      // Persist interaction analysis summary in research_docking_syntheses / docking_runs
      await pool.query(
        `
        UPDATE docking_runs
        SET interactingResidues = ?
        WHERE id = ?
        `,
        [JSON.stringify(interactionAnalysis.uniqueResidues), runId]
      );

      // Also ensure research_docking_syntheses has baseline entry for V2 Step 6
      await pool.query(
        `
        INSERT INTO research_docking_syntheses (projectId, importantInteractions, keyFindings, status, updatedAt)
        VALUES (?, ?, ?, 'COMPLETED', CURRENT_TIMESTAMP(3))
        ON DUPLICATE KEY UPDATE
          importantInteractions = VALUES(importantInteractions),
          status = 'COMPLETED',
          updatedAt = CURRENT_TIMESTAMP(3)
        `,
        [projectId, interactionAnalysis.summary, `Key interacting residues: ${interactionAnalysis.uniqueResidues.join(", ")}`]
      );
    }

    return NextResponse.json({
      success: true,
      runId,
      pdbId: run.pdbId,
      ligandName: run.ligandName,
      targetProtein: run.targetProtein,
      bindingAffinity: run.bindingAffinity,
      hasReceptorFile: Boolean(receptorPdbText),
      hasLigandFile: Boolean(ligandPdbqtText),
      receptorPdb: receptorPdbText,
      ligandPdbqt: ligandPdbqtText,
      interactions: interactionAnalysis,
    });
  } catch (error: any) {
    console.error("Error retrieving docking structure files:", error);
    return NextResponse.json({ error: error.message || "Failed to load molecular structures" }, { status: 500 });
  }
}

