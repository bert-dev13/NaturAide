import React from "react";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import InSilicoWorkspaceClient from "@/components/researcher/in-silico/InSilicoWorkspaceClient";
import { resolveCanonicalPlantId } from "@/lib/phytochemical-catalog";
import { getProfessionalReviewStageStatus } from "@/lib/professional-review-status";

export const instant = false;

export default async function InSilicoStagePage({
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

  // Query project verifying ownership
  const [projectRows]: any = await pool.query(
    `
    SELECT rp.id, rp.title, rp.currentStage, rp.status, rp.researchObjective, rp.researchQuestion,
           rp.plantId,
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
    notFound();
  }

  const project = projectRows[0];

  // Fetch candidate compounds
  const [compounds]: any = await pool.query(
    `SELECT * FROM research_compounds WHERE projectId = ? ORDER BY id ASC`,
    [projectId]
  );

  // Fetch computational results
  const [results]: any = await pool.query(
    `
    SELECT ir.*, rc.molecularFormula, rc.molecularWeight, rc.smiles as compoundSmiles
    FROM insilico_results ir
    LEFT JOIN research_compounds rc ON ir.compoundId = rc.id
    WHERE ir.projectId = ?
    ORDER BY ir.id DESC
    `,
    [projectId]
  );

  // Fetch researcher interpretation
  const [synthesisRows]: any = await pool.query(
    `SELECT * FROM research_insilico_syntheses WHERE projectId = ? LIMIT 1`,
    [projectId]
  );

  const synthesis = synthesisRows[0] || {
    projectId,
    keyFindings: "",
    potentialLimitations: "",
    selectionRationale: "",
    compoundsForDocking: "",
    engineLimitationNotes: "",
    additionalNotes: "",
    status: "IN_PROGRESS",
  };

  // Fetch supporting literature references
  const [literature]: any = await pool.query(
    `
    SELECT id, title, authors, year, journalSource, doiOrUrl, pubmedId,
           plantOrCompound, keyFindings, relevanceToCurrentResearch
    FROM literature_references
    WHERE projectId = ?
    ORDER BY id DESC
    `,
    [projectId]
  );

  // Fetch available documented phytochemicals for this project's plant
  const canonicalPlantId =
    resolveCanonicalPlantId(project.plantId) ||
    resolveCanonicalPlantId(project.plantScientificName) ||
    resolveCanonicalPlantId(project.plantName) ||
    project.plantId ||
    null;

  let availableCompounds: any[] = [];
  try {
    let pcRows: any[] = [];
    if (canonicalPlantId) {
      const [rows]: any = await pool.query(
        `
        SELECT id, plantId, plantScientificName, plantCommonName, compoundName,
               iupacName, molecularFormula, molecularWeight, compoundClass,
               pubchemId, smiles, plantPartReported, referencesData, verificationStatus
        FROM plant_compounds
        WHERE plantId = ?
        ORDER BY compoundName ASC
        `,
        [canonicalPlantId]
      );
      pcRows = rows;
    } else if (project.plantScientificName && project.plantScientificName.trim().length > 2) {
      const [rows]: any = await pool.query(
        `
        SELECT id, plantId, plantScientificName, plantCommonName, compoundName,
               iupacName, molecularFormula, molecularWeight, compoundClass,
               pubchemId, smiles, plantPartReported, referencesData, verificationStatus
        FROM plant_compounds
        WHERE LOWER(TRIM(plantScientificName)) = LOWER(TRIM(?))
        ORDER BY compoundName ASC
        `,
        [project.plantScientificName.trim()]
      );
      pcRows = rows;
    }

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
          projectAddedNames.has(row.compoundName.trim().toLowerCase()) ||
          (row.pubchemId && projectAddedCids.has(row.pubchemId)),
      };
    });
  } catch (err) {
    console.warn("Failed to load plant_compounds:", err);
  }

  // Fetch Bioinformatics review feedback / findings
  const [reviewFeedback]: any = await pool.query(
    `
    SELECT rf.*, u.name as reviewerDisplayName
    FROM review_feedback rf
    LEFT JOIN users u ON rf.reviewerId = u.id
    WHERE rf.projectId = ? AND (
      rf.areaKey = 'bioinformatics'
      OR rf.affectedStage IN ('Stage 2', 'in-silico', '2')
    )
    ORDER BY rf.id ASC
    `,
    [projectId]
  );

  // Fetch canonical professional review status for Stage 2 (Bioinformatics)
  const stageReview = await getProfessionalReviewStageStatus(projectId, 2);

  return (
    <InSilicoWorkspaceClient
      projectId={projectId}
      project={project}
      initialCompounds={compounds}
      initialResults={results}
      initialSynthesis={synthesis}
      initialLiterature={literature}
      initialAvailableCompounds={availableCompounds}
      initialReviewFeedback={reviewFeedback || []}
      overallAssessment={stageReview.comments}
      reviewStatus={stageReview.status}
      reviewerName={stageReview.reviewerName}
      approvedAt={stageReview.approvedAt}
    />
  );
}
