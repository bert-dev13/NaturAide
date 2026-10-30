import React from "react";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import FormulationSafetyClient from "@/components/researcher/formulation-safety/FormulationSafetyClient";
import { buildFormulationSafetyDraft } from "@/lib/formulation-safety-draft";
import { ensureDockingSchema } from "@/lib/docking-schema";

export const instant = false;

export default async function FormulationSafetyStagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "RESEARCHER") {
    redirect("/login");
  }

  const { id } = await params;
  const projectId = parseInt(id, 10);
  if (isNaN(projectId)) notFound();
  await ensureDockingSchema();

  // 1. Query project verifying ownership
  const [projectRows]: any = await pool.query(
    `
    SELECT rp.id, rp.title, rp.currentStage, rp.status, rp.researchObjective, rp.researchQuestion, rp.areaOfInterest,
           COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
           p.scientificName as plantScientificName,
           p.safetyNote as plantPrecautions
    FROM research_projects rp
    LEFT JOIN plants p ON rp.plantId = p.id
    WHERE rp.id = ? AND rp.researcherId = ?
    LIMIT 1
    `,
    [projectId, session.id]
  );

  if (projectRows.length === 0) {
    notFound();
  }

  const project = projectRows[0];

  // 2. Fetch Stage 2 plant data
  const [plantDataRows]: any = await pool.query(
    `SELECT partsStudied, specimenSource, materialType, extractionMethod, extractionSolvent FROM research_plant_data WHERE projectId = ? LIMIT 1`,
    [projectId]
  );
  const plantData = plantDataRows[0] || null;

  // 3. Fetch candidate compounds from Stage 3 In-Silico
  const [compounds]: any = await pool.query(
    `SELECT id, compoundName, molecularFormula, plantSource, selectedForDocking
     FROM research_compounds WHERE projectId = ? ORDER BY selectedForDocking DESC, id ASC`,
    [projectId]
  );

  // 4. Fetch formulation & versions
  const [formulationRows]: any = await pool.query(
    `SELECT * FROM research_formulations WHERE projectId = ? ORDER BY id DESC LIMIT 1`,
    [projectId]
  );

  let formulation = formulationRows[0] || null;
  let versions: any[] = [];
  let activeVersion: any = null;
  let components: any[] = [];
  let steps: any[] = [];
  let batches: any[] = [];
  let rationale: any = null;

  if (formulation) {
    const [vRows]: any = await pool.query(
      `SELECT * FROM formulation_versions WHERE formulationId = ? ORDER BY id DESC`,
      [formulation.id]
    );
    versions = vRows;
    activeVersion = versions.find((v) => v.isCurrentVersion === 1) || versions[0] || null;

    if (activeVersion) {
      const [cRows]: any = await pool.query(
        `SELECT * FROM formulation_components WHERE versionId = ? ORDER BY id ASC`,
        [activeVersion.id]
      );
      components = cRows;

      const [sRows]: any = await pool.query(
        `SELECT * FROM formulation_steps WHERE versionId = ? ORDER BY stepNumber ASC`,
        [activeVersion.id]
      );
      steps = sRows;

      const [bRows]: any = await pool.query(
        `SELECT * FROM formulation_batches WHERE formulationId = ? ORDER BY id DESC`,
        [formulation.id]
      );
      batches = bRows;

      const [rRows]: any = await pool.query(
        `SELECT * FROM formulation_rationales WHERE versionId = ? LIMIT 1`,
        [activeVersion.id]
      );
      rationale = rRows[0] || null;
    }
  }

  // 5. Fetch Surfaced Evidence for Safety
  const [stage1Rows]: any = await pool.query(
    `SELECT traditionalKnowledge as traditionalUses, existingEvidence as clinicalEvidence, knownGaps as safetyConsiderations, rationale as baselineEvidenceSummary FROM research_evidence_reviews WHERE projectId = ? LIMIT 1`,
    [projectId]
  );
  const stage1Evidence = stage1Rows[0] || null;

  const [stage3Studies]: any = await pool.query(
    `SELECT id, title, authors, journalSource as journal, year, doiOrUrl, studyType, keyFindings, COALESCE(evidenceScope, 'PRECLINICAL') as evidenceLevel FROM literature_references WHERE projectId = ? ORDER BY id DESC LIMIT 6`,
    [projectId]
  );

  const [stage4Toxicity]: any = await pool.query(
    `
    SELECT id, compoundName, analysisCategory, predictionType, resultSummary, detailedMetrics,
           engineTool, engineVersion, resultProvenance, createdAt
    FROM insilico_results
    WHERE projectId = ?
    ORDER BY id DESC
    `,
    [projectId]
  );

  const [stage5Runs]: any = await pool.query(
    `SELECT id, ligandName, targetProtein, pdbId, bindingAffinity, units, resultProvenance, jobStatus, vinaVersion
     FROM docking_runs
     WHERE projectId = ? AND bindingAffinity IS NOT NULL AND bindingAffinity <> ''
     ORDER BY id DESC`,
    [projectId]
  );

  // 6. Fetch existing safety assessment
  const [saRows]: any = await pool.query(
    `SELECT * FROM research_safety_assessments WHERE projectId = ? LIMIT 1`,
    [projectId]
  );

  let safetyAssessment = saRows[0] || null;
  let componentAssessments: any[] = [];
  let concerns: any[] = [];
  let summary: any = null;

  if (safetyAssessment) {
    const [caRows]: any = await pool.query(
      `SELECT * FROM safety_component_assessments WHERE safetyAssessmentId = ?`,
      [safetyAssessment.id]
    );
    componentAssessments = caRows;

    const [scRows]: any = await pool.query(
      `SELECT * FROM safety_concerns WHERE safetyAssessmentId = ? ORDER BY id DESC`,
      [safetyAssessment.id]
    );
    concerns = scRows;

    const [sumRows]: any = await pool.query(
      `SELECT * FROM safety_summaries WHERE safetyAssessmentId = ? LIMIT 1`,
      [safetyAssessment.id]
    );
    summary = sumRows[0] || null;
  }

  const automation = await buildFormulationSafetyDraft({
    project,
    plantData,
    compounds,
    screening: stage4Toxicity,
    dockingRuns: stage5Runs,
    formulation,
    plantPrecautions: project.plantPrecautions || null,
  });

  return (
    <FormulationSafetyClient
      projectId={projectId}
      project={project}
      plantData={plantData}
      compounds={compounds}
      initialFormulation={formulation}
      initialVersions={versions}
      initialActiveVersion={activeVersion}
      initialComponents={components}
      initialSteps={steps}
      initialBatches={batches}
      initialRationale={rationale}
      surfacedEvidence={{
        stage1: stage1Evidence,
        stage3: stage3Studies,
        stage4: stage4Toxicity,
        stage5: stage5Runs,
        plantPrecautions: project.plantPrecautions || null,
      }}
      initialSafetyAssessment={safetyAssessment}
      initialComponentAssessments={componentAssessments}
      initialConcerns={concerns}
      initialSummary={summary}
      automation={automation}
    />
  );
}
