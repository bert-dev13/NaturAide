import React from "react";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import FormulationSafetyClient from "@/components/researcher/formulation-safety/FormulationSafetyClient";
import { ensureDockingSchema } from "@/lib/docking-schema";
import { ensureFormulationSchema } from "@/lib/formulation-schema";
import { ensureReviewTables } from "@/lib/expert-review-assignment";
import { getProfessionalReviewStageStatus } from "@/lib/professional-review-status";

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
  await ensureReviewTables();
  await ensureFormulationSchema();

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

  // 2. Fetch Stage 1/2 plant data (parts, solvent, method)
  const [plantDataRows]: any = await pool.query(
    `SELECT partsStudied, specimenSource, materialType, extractionMethod, extractionSolvent FROM research_plant_data WHERE projectId = ? LIMIT 1`,
    [projectId]
  );
  const plantData = plantDataRows[0] || null;

  // 3. Fetch candidate compounds from Stage 2 (prioritizing selected for docking)
  const [compounds]: any = await pool.query(
    `SELECT id, compoundName, molecularFormula, plantSource, selectedForDocking
     FROM research_compounds WHERE projectId = ? ORDER BY selectedForDocking DESC, id ASC`,
    [projectId]
  );

  // 4. Fetch docking results for these compounds (to display affinity badges)
  const [dockingRuns]: any = await pool.query(
    `SELECT ligandName, targetProtein, pdbId, bindingAffinity, units, resultProvenance
     FROM docking_runs
     WHERE projectId = ? AND bindingAffinity IS NOT NULL AND bindingAffinity <> ''
     ORDER BY id DESC`,
    [projectId]
  );

  // 5. Fetch formulation & active version
  const [formulationRows]: any = await pool.query(
    `SELECT * FROM research_formulations WHERE projectId = ? ORDER BY id DESC LIMIT 1`,
    [projectId]
  );
  const formulation = formulationRows[0] || null;

  let components: any[] = [];
  let steps: any[] = [];
  let rationale: any = null;

  if (formulation) {
    const [vRows]: any = await pool.query(
      `SELECT id FROM formulation_versions WHERE formulationId = ? AND isCurrentVersion = 1 LIMIT 1`,
      [formulation.id]
    );
    const activeVersionId = vRows[0]?.id;

    if (activeVersionId) {
      const [cRows]: any = await pool.query(
        `SELECT * FROM formulation_components WHERE versionId = ? ORDER BY id ASC`,
        [activeVersionId]
      );
      components = cRows;

      const [sRows]: any = await pool.query(
        `SELECT * FROM formulation_steps WHERE versionId = ? ORDER BY stepNumber ASC`,
        [activeVersionId]
      );
      steps = sRows;

      const [rRows]: any = await pool.query(
        `SELECT * FROM formulation_rationales WHERE versionId = ? LIMIT 1`,
        [activeVersionId]
      );
      if (rRows && rRows.length > 0) {
        rationale = rRows[0];
      }
    }
  }

  // 5b. Fetch Stage 1 Literature References
  const [litRows]: any = await pool.query(
    `SELECT id, title, authors, year, journalSource AS journal, pubmedId AS pmid, doiOrUrl AS doi FROM literature_references WHERE projectId = ? ORDER BY id ASC LIMIT 10`,
    [projectId]
  );
  const literature = litRows || [];

  // 6. Review status & Stage status
  const [revRows]: any = await pool.query(
    `SELECT status FROM review_area_coverage WHERE projectId = ? AND areaKey = 'formulation' ORDER BY id DESC LIMIT 1`,
    [projectId]
  );
  const reviewStatus = revRows[0]?.status || "NOT_SUBMITTED";

  const [stgRows]: any = await pool.query(
    `SELECT status FROM research_project_stages WHERE projectId = ? AND (stageKey = 'formulation-safety' OR stageKey = 'formulation') LIMIT 1`,
    [projectId]
  );
  const stageStatus = stgRows[0]?.status || "IN_PROGRESS";

  // 7. Reviewer feedback if any
  const [fbRows]: any = await pool.query(
    `SELECT rf.*, u.name as reviewerDisplayName
     FROM review_feedback rf
     LEFT JOIN users u ON rf.reviewerId = u.id
     WHERE rf.projectId = ? AND (rf.areaKey = 'formulation' OR rf.affectedStage LIKE '%formulation%')
     ORDER BY rf.id ASC`,
    [projectId]
  );

  // 8. Fetch canonical professional review status for Stage 4 (Formulation)
  const stageReview = await getProfessionalReviewStageStatus(projectId, 4);

  return (
    <FormulationSafetyClient
      projectId={projectId}
      project={project}
      plantData={plantData}
      compounds={compounds}
      dockingRuns={dockingRuns}
      initialFormulation={formulation}
      initialComponents={components}
      initialSteps={steps}
      initialRationale={rationale}
      literature={literature}
      stageStatus={stageStatus}
      reviewStatus={stageReview.status || reviewStatus}
      reviewerFeedback={fbRows}
      overallAssessment={stageReview.comments}
      reviewerName={stageReview.reviewerName}
      approvedAt={stageReview.approvedAt}
    />
  );
}
