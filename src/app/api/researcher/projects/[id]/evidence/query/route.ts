import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  buildStage1LiteratureQuery,
  buildStage2LiteratureQuery,
  buildStage3LiteratureQuery,
  buildStage4LiteratureQuery,
  buildStage6LiteratureQuery,
  queryLiterature,
  attachSupportingLiterature,
} from "@/lib/literature-service";

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

    // Verify project ownership and fetch plant/title context
    const [projectRows]: any = await pool.query(
      `
      SELECT rp.*,
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
    const body = await request.json().catch(() => ({}));
    const {
      stageKey = "plant-literature",
      resultType,
      resultId,
      compound,
      target,
      pathway,
      endpoint,
      assay,
      cellLine,
      autoAttach = false,
      customQuery,
      forceRefresh = false,
    } = body;

    // Construct contextual query according to stage rules
    let generatedQuery = "";

    if (customQuery?.trim()) {
      generatedQuery = customQuery.trim();
    } else {
      switch (stageKey) {
        case "plant-literature":
          generatedQuery = buildStage1LiteratureQuery(
            project.plantName,
            project.plantScientificName,
            project.title,
            project.researchObjective,
            project.researchQuestion
          );
          break;

        case "in-silico":
          generatedQuery = buildStage2LiteratureQuery(
            compound || project.plantName,
            target,
            pathway,
            endpoint
          );
          break;

        case "docking":
          // Stage 3 rule: Only after a docking result successfully completes!
          if (!target) {
            return NextResponse.json({
              error: "Biological target is required to retrieve supporting docking literature.",
            }, { status: 400 });
          }
          generatedQuery = buildStage3LiteratureQuery(
            compound || project.plantName,
            target,
            endpoint || project.areaOfInterest
          );
          break;

        case "formulation-safety":
          generatedQuery = buildStage4LiteratureQuery(
            project.plantScientificName || project.plantName,
            compound,
            endpoint || "toxicity OR safety OR adverse effects"
          );
          break;

        case "laboratory":
          // Stage 6 rule: compound/plant + cell line + assay + endpoint
          generatedQuery = buildStage6LiteratureQuery(
            compound || project.plantName,
            cellLine,
            assay,
            endpoint
          );
          break;

        default:
          generatedQuery = `"${project.plantScientificName || project.plantName}"[Title/Abstract] AND pharmacology`;
      }
    }

    console.log(`\n[API Evidence Query] Project ${projectId}: ${project.plantName} (${project.plantScientificName})`);
    console.log(`Generated query: ${generatedQuery}`);

    // Query PubMed NCBI with progressive fallback, cache, and strict anti-fabrication
    const searchResult = await queryLiterature(generatedQuery, {
      stageKey,
      targetCompound: compound || null,
      targetBiological: target || null,
      assayOrEndpoint: endpoint || assay || null,
      associatedResultType: resultType || null,
      associatedResultId: resultId ? parseInt(resultId, 10) : null,
      maxResults: 6,
      progressiveContext: stageKey === "plant-literature" ? {
        plantCommon: project.plantName,
        plantScientific: project.plantScientificName,
        title: project.title,
        objective: project.researchObjective,
        question: project.researchQuestion,
        areaOfInterest: project.areaOfInterest,
      } : undefined,
      forceRefresh: forceRefresh === true,
    });

    console.log(`Records returned to frontend: ${searchResult.items.length} (status: ${searchResult.status})`);

    // Optionally attach to project_evidence_items
    if (autoAttach && searchResult.items.length > 0) {
      for (const item of searchResult.items) {
        await attachSupportingLiterature(projectId, item);
      }
    }

    return NextResponse.json({
      success: searchResult.success,
      status: searchResult.status,
      projectId,
      stageKey,
      generatedQuery: searchResult.query,
      resultType,
      resultId,
      fromCache: searchResult.fromCache,
      count: searchResult.count,
      items: searchResult.items,
      emptyMessage: searchResult.emptyMessage,
      errorMessage: searchResult.errorMessage,
      disclaimer: "Supporting literature provides published biological context. It does NOT convert computational predictions into experimental evidence.",
    });
  } catch (error) {
    console.error("Contextual literature query error:", error);
    return NextResponse.json({ 
      success: false,
      status: "REQUEST_FAILED",
      error: "Scientific literature could not be retrieved.",
      items: [],
      count: 0
    }, { status: 500 });
  }
}
