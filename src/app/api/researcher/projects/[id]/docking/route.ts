import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { searchStructures } from "@/lib/docking-rcsb";
import {
  DockingRequestError,
  addVerifiedTarget,
  attachSupportingResearch,
  beginPreparation,
  completeDockingStage,
  importExternalResult,
  loadDockingWorkspace,
  removeTarget,
  requestRetryFailed,
  requestRun,
  requestRunAll,
  saveConfiguration,
  saveDockingInterpretation,
  submitDockingStageForReview,
  useDetectedSite,
} from "@/lib/docking-jobs";

async function authorize(id: string, isReadOnly = false) {
  const session = await getSession();
  if (!session || (session.role !== "RESEARCHER" && (!isReadOnly || session.role !== "REVIEWER"))) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const projectId = parseInt(id, 10);
  if (isNaN(projectId)) {
    return { error: NextResponse.json({ error: "Invalid project ID" }, { status: 400 }) };
  }
  if (session.role === "REVIEWER" && isReadOnly) {
    const [rows]: any = await pool.query(
      `SELECT id FROM research_projects WHERE id = ? LIMIT 1`,
      [projectId]
    );
    if (!rows.length) {
      return { error: NextResponse.json({ error: "Project not found" }, { status: 404 }) };
    }
    return { session, projectId };
  }
  const [rows]: any = await pool.query(
    `SELECT id FROM research_projects WHERE id = ? AND researcherId = ? LIMIT 1`,
    [projectId, session.id]
  );
  if (!rows.length) {
    return { error: NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 }) };
  }
  return { session, projectId };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await authorize(id, true);
    if (auth.error) return auth.error;
    const workspace = await loadDockingWorkspace(auth.projectId);
    return NextResponse.json({ success: true, workspace });
  } catch (error) {
    console.error("Docking GET error:", error);
    return NextResponse.json({ error: "Failed to fetch molecular docking data" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await authorize(id);
    if (auth.error) return auth.error;
    const body = await request.json();
    const projectId = auth.projectId;

    switch (body.action) {
      case "prepare": {
        await beginPreparation(projectId, {
          compoundId: body.compoundId ? Number(body.compoundId) : undefined,
          targetId: body.targetId ? Number(body.targetId) : undefined,
          force: Boolean(body.force),
        });
        return NextResponse.json({ success: true, workspace: await loadDockingWorkspace(projectId) });
      }
      case "search-structures": {
        const hits = await searchStructures(String(body.query || ""));
        return NextResponse.json({ success: true, hits });
      }
      case "suggest-targets": {
        const [projRows]: any = await pool.query(
          `SELECT rp.title, rp.researchObjective,
                  COALESCE(p.commonName, rp.plantCustomName, 'Botanical Specimen') as plantName
           FROM research_projects rp
           LEFT JOIN plants p ON rp.plantId = p.id
           WHERE rp.id = ? LIMIT 1`,
          [projectId]
        );
        const proj = projRows[0] || {};

        const [compRows]: any = await pool.query(
          `SELECT compoundName FROM research_compounds WHERE projectId = ? AND selectedForDocking = 1`,
          [projectId]
        );
        const compoundNames = compRows.map((r: any) => r.compoundName);

        const { suggestTargetsForProject } = await import("@/lib/target-protein-catalog");
        const ranked = suggestTargetsForProject({
          researchObjective: proj.researchObjective,
          plantName: proj.plantName,
          compoundNames,
        });

        return NextResponse.json({ success: true, suggestions: ranked });
      }
      case "add-target": {
        // Return the target immediately; avoid blocking checkbox selection on a full workspace rebuild.
        const added = await addVerifiedTarget(projectId, String(body.pdbId || ""));
        return NextResponse.json({ success: true, ...added });
      }
      case "remove-target": {
        await removeTarget(projectId, Number(body.targetId));
        return NextResponse.json({ success: true, workspace: await loadDockingWorkspace(projectId) });
      }
      case "save-configuration": {
        await saveConfiguration(projectId, {
          exhaustiveness: Number(body.exhaustiveness),
          numModes: Number(body.numModes),
          targets: body.targets || [],
        });
        return NextResponse.json({ success: true, workspace: await loadDockingWorkspace(projectId) });
      }
      case "use-detected-site": {
        await useDetectedSite(projectId, Number(body.targetId), String(body.resname || ""), String(body.chain || ""), String(body.seq || ""));
        return NextResponse.json({ success: true, workspace: await loadDockingWorkspace(projectId) });
      }
      case "run": {
        const result = await requestRun(projectId, Number(body.compoundId), Number(body.targetId));
        return NextResponse.json({ success: true, ...result, workspace: await loadDockingWorkspace(projectId) });
      }
      case "run-all": {
        const result = await requestRunAll(projectId);
        return NextResponse.json({ success: true, ...result, workspace: await loadDockingWorkspace(projectId) });
      }
      case "retry-failed": {
        const result = await requestRetryFailed(projectId);
        return NextResponse.json({ success: true, ...result, workspace: await loadDockingWorkspace(projectId) });
      }
      case "import-external": {
        const result = await importExternalResult(projectId, body);
        return NextResponse.json({ success: true, ...result, workspace: await loadDockingWorkspace(projectId) });
      }
      case "supporting-research": {
        const result = await attachSupportingResearch(projectId, Number(body.runId));
        return NextResponse.json({ success: true, ...result, workspace: await loadDockingWorkspace(projectId) });
      }
      case "save-interpretation": {
        await saveDockingInterpretation(projectId, String(body.keyFindings || body.interpretation || body.text || ""), body.approve);
        return NextResponse.json({ success: true, workspace: await loadDockingWorkspace(projectId) });
      }
      case "submit-for-review": {
        const result = await submitDockingStageForReview(projectId, auth.session.id);
        return NextResponse.json({ ...result, workspace: await loadDockingWorkspace(projectId) });
      }
      case "complete-stage": {
        const result = await completeDockingStage(projectId, auth.session.id);
        return NextResponse.json({ ...result });
      }
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    if (error instanceof DockingRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Docking POST error:", error);
    return NextResponse.json({ error: "Failed to process docking request" }, { status: 500 });
  }
}
