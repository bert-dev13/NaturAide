import React from "react";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import { loadDockingWorkspace } from "@/lib/docking-jobs";
import { loadVerifiedPhytochemicals, resolveCanonicalPlantId } from "@/lib/phytochemical-catalog";
import InSilicoRdWorkspaceClient from "@/components/researcher/in-silico/InSilicoRdWorkspaceClient";

export default async function InSilicoStagePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ step?: string }>;
}) {
  const session = await getSession();
  if (!session || (session.role !== "RESEARCHER" && session.role !== "REVIEWER")) {
    redirect("/login");
  }

  const { id } = await params;
  const projectId = parseInt(id, 10);
  if (isNaN(projectId)) notFound();

  const sp = (await searchParams) || {};
  const parsedStep = sp.step ? parseInt(sp.step, 10) : 1;
  // Legacy 8-step URLs used step=8 for Results & Interpretation; clamp to 7-step workflow
  const initialStep = Number.isNaN(parsedStep)
    ? 1
    : parsedStep >= 8
      ? 7
      : Math.min(7, Math.max(1, parsedStep));

  // Query project verifying ownership
  const [projectRows]: any = await pool.query(
    `
    SELECT rp.id, rp.title, rp.currentStage, rp.status, rp.researchObjective, rp.researchQuestion,
           rp.plantId,
           COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
           p.scientificName as plantScientificName
    FROM research_projects rp
    LEFT JOIN plants p ON rp.plantId = p.id
    WHERE rp.id = ? ${session.role === "RESEARCHER" ? "AND rp.researcherId = ?" : ""}
    LIMIT 1
    `,
    session.role === "RESEARCHER" ? [projectId, session.id] : [projectId]
  );

  if (projectRows.length === 0) {
    notFound();
  }

  const project = projectRows[0];

  // 1. Candidate compounds
  const [compounds]: any = await pool.query(
    `SELECT * FROM research_compounds WHERE projectId = ? ORDER BY id ASC`,
    [projectId]
  );

  // 2. Computational screening results (ADMET / Lipinski)
  const [screenResults]: any = await pool.query(
    `
    SELECT ir.*, rc.molecularFormula, rc.molecularWeight, rc.smiles as compoundSmiles, rc.pubchemId
    FROM insilico_results ir
    LEFT JOIN research_compounds rc ON ir.compoundId = rc.id
    WHERE ir.projectId = ?
    ORDER BY ir.id DESC
    `,
    [projectId]
  );

  // 3. Docking targets & runs via loadDockingWorkspace
  const dockingWorkspace = await loadDockingWorkspace(projectId);

  // 4. In-Silico Synthesis & Interpretation
  const [synthesisRows]: any = await pool.query(
    `SELECT * FROM research_insilico_syntheses WHERE projectId = ? LIMIT 1`,
    [projectId]
  );
  const synthesis = synthesisRows[0] || null;

  // 5. Available documented phytochemicals for this botanical species
  const canonicalPlantId =
    resolveCanonicalPlantId(project.plantId) ||
    resolveCanonicalPlantId(project.plantScientificName) ||
    resolveCanonicalPlantId(project.plantName) ||
    project.plantId ||
    null;

  let availableCompounds: any[] = [];
  try {
    const pcRows = await loadVerifiedPhytochemicals({
      plantId: canonicalPlantId || project.plantId,
      scientificName: project.plantScientificName,
      commonName: project.plantName,
    });

    const projectAddedNames = new Set(
      compounds.map((c: any) => c.compoundName.trim().toLowerCase())
    );
    const projectAddedCids = new Set(
      compounds.map((c: any) => c.pubchemId).filter(Boolean)
    );

    availableCompounds = pcRows.map((row: any) => {
      let parsedRefs = [];
      if (row.referencesData) {
        try {
          parsedRefs =
            typeof row.referencesData === "string"
              ? JSON.parse(row.referencesData)
              : row.referencesData;
        } catch {
          parsedRefs = [];
        }
      }

      return {
        ...row,
        references: parsedRefs,
        structureReady: Boolean(row.pubchemId && row.smiles && row.molecularFormula),
        isAlreadyAdded:
          projectAddedNames.has(String(row.compoundName || "").trim().toLowerCase()) ||
          (row.pubchemId && projectAddedCids.has(row.pubchemId)),
      };
    });
  } catch (err) {
    console.warn("Failed to load plant_compounds:", err);
  }

  // 6. Scientific literature for this botanical species & docking targets
  let scientificLiterature: any[] = [];
  try {
    const firstCommon = project.plantName.split(" ")[0].replace(/[^a-zA-Z]/g, "");
    const [refRows]: any = await pool.query(
      `SELECT id, title, authors, publicationYear, journalOrPublisher, studyType,
              doi, pubmedId, sourceUrl, shortSummary, plantOrIngredientStudied,
              isExactProductStudied
       FROM scientific_references
       WHERE plantOrIngredientStudied LIKE ? OR plantOrIngredientStudied LIKE ? 
          OR title LIKE ? OR title LIKE ?
       ORDER BY publicationYear DESC, isExactProductStudied DESC
       LIMIT 8`,
      [`%${firstCommon}%`, `%${project.plantScientificName || ""}%`, `%${firstCommon}%`, `%${project.plantScientificName || ""}%`]
    );
    scientificLiterature = refRows;
  } catch (err) {
    console.warn("Failed to fetch scientific literature:", err);
  }

  return (
    <InSilicoRdWorkspaceClient
      project={project}
      initialStep={initialStep}
      compounds={compounds}
      screenResults={screenResults}
      dockingWorkspace={dockingWorkspace}
      synthesis={synthesis}
      availableCompounds={availableCompounds}
      scientificLiterature={scientificLiterature}
    />
  );
}
