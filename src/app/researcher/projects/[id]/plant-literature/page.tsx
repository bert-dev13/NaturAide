import React from "react";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import { resolvePlantImage } from "@/lib/record-images";
import { getProfessionalReviewStageStatus } from "@/lib/professional-review-status";
import PlantLiteratureClient from "@/components/researcher/plant-literature/PlantLiteratureClient";

export const instant = false;

export default async function PlantLiteratureStagePage({
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

  // 1. Query project ensuring researcher ownership
  const [projectRows]: any = await pool.query(
    `
    SELECT rp.*,
           COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
           p.scientificName as plantScientificName,
           p.category as plantCategory,
           p.imageUrl as plantImageUrl,
           p.botanical_synonyms as plantSynonyms,
           p.local_names as plantLocalNames,
           p.plant_parts_used as plantPartsUsed,
           p.source_organization as plantSourceOrg,
           p.source_url as plantSourceUrl,
           p.source_verified as plantSourceVerified
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
  if (project.plantImageUrl) {
    project.plantImageUrl = resolvePlantImage(project.plantImageUrl);
  }

  // 2. Fetch existing research_plant_data record
  const [plantDataRows]: any = await pool.query(
    `SELECT * FROM research_plant_data WHERE projectId = ? LIMIT 1`,
    [projectId]
  );

  const plantData = plantDataRows[0] || {
    projectId,
    commonName: project.plantName,
    scientificName: project.plantScientificName || "",
    family: project.plantFamily || "",
    localNames: project.plantLocalNames || "",
    partsStudied: project.plantPartsUsed || "Leaves",
    traditionalUses: "",
    ethnobotanicalNotes: "",
    knownConstituents: "",
    researchNotes: "",
    specimenSource: "",
    collectionDate: "",
    collectionLocation: "",
    sampleIdentifier: "",
    authenticationMethod: "Macro-morphological & Taxonomic Key",
    authenticatedBy: "",
    voucherSpecimenNumber: "",
    storageHandlingNotes: "",
    supportingDocumentUrl: null,
    materialType: "Crude Extract",
    extractionMethod: "",
    extractionSolvent: "",
    extractFractionName: "",
    authenticationStatus: "NOT_DOCUMENTED",
    selectionRationale: "",
    relevantCharacteristics: "",
    additionalBotanicalNotes: "",
  };

  // 3. Fetch all literature references for this project
  const [references]: any = await pool.query(
    `
    SELECT id, projectId, scientificReferenceId,
           COALESCE(sourceType, 'MANUAL_ENTRY') as sourceType,
           title, authors, year, journalSource, doiOrUrl, studyType,
           plantOrCompound, keyFindings, limitations, researchNotes,
           tags, pubmedId, documentUrl, studyDesign, plantPart,
           researchMethods, experimentalModel, evidenceScope,
           relevanceToCurrentResearch, matrixCompleted, createdAt, updatedAt
    FROM literature_references
    WHERE projectId = ?
    ORDER BY id DESC
    `,
    [projectId]
  );

  // 4. Fetch literature synthesis
  const [synthesisRows]: any = await pool.query(
    `SELECT * FROM research_literature_syntheses WHERE projectId = ? LIMIT 1`,
    [projectId]
  );

  const synthesis = synthesisRows[0] || {
    keyFindings: "",
    areasOfAgreement: "",
    conflictingFindings: "",
    evidenceLimitations: "",
    remainingGaps: "",
    relevanceToQuestion: "",
  };

  // 5. Compute real counts
  let humanStudies = 0;
  let laboratoryStudies = 0;
  let reviews = 0;
  let computationalStudies = 0;
  let safetyEvidence = 0;

  for (const ref of references) {
    const st = (ref.studyType || "").toLowerCase();
    const scope = (ref.evidenceScope || "").toLowerCase();
    const tags = (ref.tags || "").toLowerCase();

    if (
      st.includes("clinical") ||
      st.includes("human") ||
      st.includes("in-vivo") ||
      scope.includes("human") ||
      scope.includes("animal")
    ) {
      humanStudies++;
    }

    if (
      st.includes("in-vitro") ||
      st.includes("bioactivity") ||
      st.includes("extraction") ||
      scope.includes("preclinical") ||
      scope.includes("in-vitro")
    ) {
      laboratoryStudies++;
    }

    if (st.includes("review") || scope.includes("review")) {
      reviews++;
    }

    if (st.includes("in-silico") || st.includes("docking") || scope.includes("computational")) {
      computationalStudies++;
    }

    if (st.includes("safety") || st.includes("toxic") || tags.includes("safety") || scope.includes("safety")) {
      safetyEvidence++;
    }
  }

  const initialCounts = {
    selectedReferences: references.length,
    humanStudies,
    laboratoryStudies,
    reviews,
    computationalStudies,
    safetyEvidence,
  };

  // 6. Fetch Pharmacognosy review feedback / findings if revisions are requested
  const [reviewFeedback]: any = await pool.query(
    `
    SELECT rf.*, u.name as reviewerDisplayName
    FROM review_feedback rf
    LEFT JOIN users u ON rf.reviewerId = u.id
    WHERE rf.projectId = ? AND (
      rf.areaKey = 'pharmacognosy'
      OR rf.affectedStage IN ('Stage 1', 'plant-literature', 'botanical', '1')
      OR rf.sectionName LIKE '%Botanical%'
      OR rf.sectionName LIKE '%Extraction%'
      OR rf.sectionName LIKE '%Specimen%'
      OR rf.sectionName LIKE '%Literature%'
      OR rf.sectionName LIKE '%Synthesis%'
    )
    ORDER BY
      CASE rf.severity
        WHEN 'CRITICAL' THEN 1
        WHEN 'MAJOR' THEN 2
        WHEN 'MINOR' THEN 3
        ELSE 4
      END ASC,
      rf.id ASC
    `,
    [projectId]
  );

  // 7. Fetch canonical professional review status for Stage 1 (Pharmacognosy)
  const stageReview = await getProfessionalReviewStageStatus(projectId, 1);

  return (
    <PlantLiteratureClient
      projectId={projectId}
      project={{
        id: project.id,
        title: project.title,
        plantName: project.plantName,
        plantScientificName: project.plantScientificName,
        researchObjective: project.researchObjective,
        researchQuestion: project.researchQuestion,
        currentStage: project.currentStage,
        status: project.status,
      }}
      verifiedPlant={{
        id: project.plantId,
        commonName: project.plantName,
        scientificName: project.plantScientificName,
        family: project.plantFamily,
        synonyms: project.plantSynonyms,
        localNames: project.plantLocalNames,
        partsUsed: project.plantPartsUsed,
        sourceOrg: project.plantSourceOrg || "Philippine Institute of Traditional and Alternative Health Care (PITAHC)",
        sourceUrl: project.plantSourceUrl,
        isVerified: Boolean(project.plantSourceVerified || project.plantId),
        imageUrl: project.plantImageUrl,
      }}
      initialPlantData={plantData}
      initialReferences={references}
      initialSynthesis={synthesis}
      initialCounts={initialCounts}
      initialReviewFeedback={reviewFeedback || []}
      overallAssessment={stageReview.comments}
      reviewStatus={stageReview.status}
      reviewerName={stageReview.reviewerName}
      approvedAt={stageReview.approvedAt}
    />
  );
}
