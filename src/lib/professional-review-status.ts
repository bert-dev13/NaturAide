import pool from "@/lib/db";
import { normalizeReviewAreaKey } from "@/lib/expert-review-areas";
import {
  type ReviewCanonicalStatus,
  type ReviewerActionsState,
  getReviewerActions,
} from "./professional-review-types";

export * from "./professional-review-types";

export interface ProfessionalReviewStageConfig {
  number: string;
  stageNumber: number;
  stageKey: string;
  stageName: string;
  discipline: string;
  areaKey: string;
  profession: string;
  description: string;
}

export const STAGE_REVIEW_DEFINITIONS: Record<number, ProfessionalReviewStageConfig> = {
  1: {
    number: "01",
    stageNumber: 1,
    stageKey: "plant-literature",
    stageName: "Plant & Literature",
    discipline: "Pharmacognosy",
    areaKey: "pharmacognosy",
    profession: "Pharmacist / Pharmacognosist",
    description: "Botanical identity, specimen provenance and supporting literature.",
  },
  2: {
    number: "02",
    stageNumber: 2,
    stageKey: "in-silico",
    stageName: "In-Silico Analysis",
    discipline: "Bioinformatics",
    areaKey: "bioinformatics",
    profession: "Bioinformatician / Computational Scientist",
    description: "Computational screening, molecular docking and related analysis.",
  },
  3: {
    number: "03",
    stageNumber: 3,
    stageKey: "docking",
    stageName: "Molecular Docking",
    discipline: "Pharmacology",
    areaKey: "pharmacology",
    profession: "Pharmacologist",
    description: "Pharmacological evidence and biological interpretation.",
  },
  4: {
    number: "04",
    stageNumber: 4,
    stageKey: "formulation-safety",
    stageName: "Formulation Development",
    discipline: "Formulation",
    areaKey: "formulation",
    profession: "Pharmacist / Pharmaceutical Scientist",
    description: "Formulation and pharmaceutical assessment.",
  },
  5: {
    number: "05",
    stageNumber: 5,
    stageKey: "safety",
    stageName: "Safety / Clinical",
    discipline: "Clinical Safety",
    areaKey: "clinical_safety",
    profession: "Physician / Clinical Pharmacist",
    description: "Clinical safety and risk assessment.",
  },
  6: {
    number: "06",
    stageNumber: 6,
    stageKey: "knowledge-integration",
    stageName: "Knowledge Integration",
    discipline: "Knowledge Integration",
    areaKey: "pharmacognosy", // reviewed by lead pharmacognosist / scientific board
    profession: "Pharmacist / Pharmacognosist",
    description: "Multi-disciplinary cross-validation, synthesis and final dossier sign-off.",
  },
};

export interface ResolvedStageStatus {
  number: string;
  stageNumber: number;
  stageName: string;
  discipline: string;
  checkingArea: string; // Alias for discipline to maintain UI compatibility
  areaKey: string;
  profession: string;
  description: string;
  status: ReviewCanonicalStatus;
  statusLabel: string; // "Not Submitted" | "Needs Review" | "In Review" | "Revision Required" | "Revision Resubmitted" | "Approved"
  displayStatus: string;
  isReady: boolean;
  isCompleted: boolean;
  actionLabel: string;
  actionUrl: string;
  assignmentId: number | null;
  reviewerName: string | null;
  approvedAt: string | null;
  assessment?: string | null;
  comments?: string | null;
}

/**
 * Checks whether the Researcher stage has completed or submitted data.
 * Independent of other stages or review progress.
 */
export function isResearcherStageSubmitted(
  stageNumber: number,
  project: { currentStage?: string | null; status?: string | null },
  stages: Array<{ stageKey: string; status: string; completedAt?: any }>,
  dataFlags?: {
    hasLiterature?: boolean;
    hasCompounds?: boolean;
    hasDocking?: boolean;
    hasFormulations?: boolean;
    hasSafety?: boolean;
  }
): boolean {
  if (project.status === "COMPLETED") return true;

  const currentStage = String(project.currentStage || "").toLowerCase();

  const isStageRecordComplete = (keys: string[]) => {
    return stages.some((s) => {
      const match = keys.includes(s.stageKey);
      if (!match) return false;
      const st = (s.status || "").toUpperCase();
      return (
        st === "COMPLETED" ||
        st === "UNDER_REVIEW" ||
        st === "IN_REVIEW" ||
        st === "REVISION_REQUIRED" ||
        s.completedAt != null
      );
    });
  };

  switch (stageNumber) {
    case 1: {
      if (isStageRecordComplete(["plant-literature"])) return true;
      if (
        [
          "in-silico",
          "docking",
          "formulation-safety",
          "formulation",
          "safety",
          "expert-review",
          "knowledge-integration",
          "completion-integration",
        ].includes(currentStage)
      ) {
        return true;
      }
      if (dataFlags?.hasLiterature) return true;
      return false;
    }
    case 2: {
      if (isStageRecordComplete(["in-silico"])) return true;
      if (
        [
          "docking",
          "formulation-safety",
          "formulation",
          "safety",
          "expert-review",
          "knowledge-integration",
          "completion-integration",
        ].includes(currentStage)
      ) {
        return true;
      }
      if (dataFlags?.hasCompounds) return true;
      return false;
    }
    case 3: {
      if (isStageRecordComplete(["docking"])) return true;
      if (
        [
          "formulation-safety",
          "formulation",
          "safety",
          "expert-review",
          "knowledge-integration",
          "completion-integration",
        ].includes(currentStage)
      ) {
        return true;
      }
      if (dataFlags?.hasDocking) return true;
      return false;
    }
    case 4: {
      if (isStageRecordComplete(["formulation-safety", "formulation"])) return true;
      if (
        [
          "safety",
          "expert-review",
          "knowledge-integration",
          "completion-integration",
        ].includes(currentStage)
      ) {
        return true;
      }
      if (dataFlags?.hasFormulations) return true;
      return false;
    }
    case 5: {
      if (isStageRecordComplete(["safety", "expert-review"])) return true;
      if (["knowledge-integration", "completion-integration"].includes(currentStage)) {
        return true;
      }
      if (dataFlags?.hasSafety) return true;
      return false;
    }
    case 6: {
      if (isStageRecordComplete(["knowledge-integration", "completion-integration"])) return true;
      if (project.status === "COMPLETED") return true;
      if (
        ["knowledge-integration", "completion-integration"].includes(currentStage) &&
        (project.status === "UNDER_REVIEW" || project.status === "READY_FOR_REVIEW")
      ) {
        return true;
      }
      return false;
    }
    default:
      return false;
  }
}

/**
 * Resolves the canonical review status for a single stage from pre-fetched context.
 */
export function resolveSingleStageStatus(
  stageNumber: number,
  projectId: number,
  project: { currentStage?: string | null; status?: string | null; updatedAt?: any },
  stages: Array<{ stageKey: string; status: string; completedAt?: any }>,
  assignments: Array<{
    id: number;
    specialtyNeeded: string;
    status: string;
    reviewerName?: string | null;
    completedAt?: any;
    assessment?: string | null;
    reviewComments?: string | null;
  }>,
  coverage: Array<{
    areaKey: string;
    status: string;
    reviewerName?: string | null;
    updatedAt?: any;
  }>,
  profReviews: Array<{
    id: number;
    areaKey: string;
    assessment: string;
    status: string;
    submittedAt?: any;
    comments?: string | null;
    reviewerName?: string | null;
  }>,
  dataFlags?: {
    hasLiterature?: boolean;
    hasCompounds?: boolean;
    hasDocking?: boolean;
    hasFormulations?: boolean;
    hasSafety?: boolean;
  }
): ResolvedStageStatus {
  const config = STAGE_REVIEW_DEFINITIONS[stageNumber] || STAGE_REVIEW_DEFINITIONS[1];
  const isSubmitted = isResearcherStageSubmitted(stageNumber, project, stages, dataFlags);

  // Match review assignment & coverage
  const matchedAss = assignments.find((a) => {
    const norm = normalizeReviewAreaKey(a.specialtyNeeded);
    return norm === config.areaKey;
  });

  const matchedCov = coverage.find((c) => {
    const norm = normalizeReviewAreaKey(c.areaKey);
    return norm === config.areaKey;
  });

  const matchedRev = profReviews.find((r) => {
    const norm = normalizeReviewAreaKey(r.areaKey);
    return norm === config.areaKey;
  });

  const assignmentId = matchedAss ? matchedAss.id : null;
  const actionUrl =
    stageNumber === 6
      ? `/reviewer/checking/pharmacognosy?projectId=${projectId}&stage=6`
      : `/reviewer/checking/${config.areaKey}?projectId=${projectId}${
          assignmentId ? `&assignmentId=${assignmentId}` : ""
        }`;

  // If the researcher has NOT submitted/completed this stage yet
  if (!isSubmitted) {
    return {
      number: config.number,
      stageNumber,
      stageName: config.stageName,
      discipline: config.discipline,
      checkingArea: config.discipline,
      areaKey: config.areaKey,
      profession: config.profession,
      description: config.description,
      status: "NOT_SUBMITTED",
      statusLabel: "Not Submitted",
      displayStatus: "Not Submitted",
      isReady: false,
      isCompleted: false,
      actionLabel: "",
      actionUrl,
      assignmentId,
      reviewerName: null,
      approvedAt: null,
      assessment: null,
      comments: null,
    };
  }

  // Researcher stage IS submitted/completed.
  // Evaluate professional review status independently.
  let status: ReviewCanonicalStatus = "NEEDS_REVIEW";
  let statusLabel = "Needs Review";
  let isCompleted = false;
  let actionLabel = `Start ${config.discipline} Review →`;

  const revAssessment = (matchedRev?.assessment || matchedAss?.assessment || "").toUpperCase();
  const assStatus = (matchedAss?.status || "").toUpperCase();
  const covStatus = (matchedCov?.status || "").toUpperCase();

  const isApproved =
    revAssessment === "ACCEPTABLE" ||
    assStatus === "COMPLETED" ||
    assStatus === "APPROVED" ||
    covStatus === "APPROVED" ||
    project.status === "COMPLETED";

  const isResubmitted =
    revAssessment === "REVISION_RESUBMITTED" ||
    assStatus === "RESUBMITTED" ||
    covStatus === "RESUBMITTED";

  const isRevisionRequired =
    revAssessment === "REVISION_REQUIRED" ||
    revAssessment === "REVISIONS_REQUIRED" ||
    assStatus === "REVISION_REQUIRED" ||
    covStatus === "REVISION_REQUIRED";

  const isInReview =
    assStatus === "IN_REVIEW" ||
    covStatus === "IN_REVIEW" ||
    (matchedRev && matchedRev.status === "DRAFT");

  if (isApproved) {
    status = "APPROVED";
    statusLabel = "Approved";
    isCompleted = true;
    actionLabel = `View ${config.discipline} Review →`;
  } else if (isResubmitted) {
    status = "REVISION_RESUBMITTED";
    statusLabel = "Revision Resubmitted";
    isCompleted = false;
    actionLabel = `Review ${config.discipline} Revision →`;
  } else if (isRevisionRequired) {
    status = "REVISION_REQUIRED";
    statusLabel = "Revision Required";
    isCompleted = false;
    actionLabel = `Review ${config.discipline} Revision →`;
  } else if (isInReview) {
    status = "IN_REVIEW";
    statusLabel = "In Review";
    isCompleted = false;
    actionLabel = `Continue ${config.discipline} Review →`;
  } else {
    status = "NEEDS_REVIEW";
    statusLabel = "Needs Review";
    isCompleted = false;
    actionLabel = `Start ${config.discipline} Review →`;
  }

  const reviewerName =
    matchedRev?.reviewerName ||
    matchedAss?.reviewerName ||
    matchedCov?.reviewerName ||
    (isCompleted ? "Scientific Review Board" : null);

  const approvedAt =
    matchedRev?.submittedAt ||
    matchedAss?.completedAt ||
    matchedCov?.updatedAt ||
    (isCompleted ? project.updatedAt : null);

  return {
    number: config.number,
    stageNumber,
    stageName: config.stageName,
    discipline: config.discipline,
    checkingArea: config.discipline,
    areaKey: config.areaKey,
    profession: config.profession,
    description: config.description,
    status,
    statusLabel,
    displayStatus: statusLabel,
    isReady: true,
    isCompleted,
    actionLabel,
    actionUrl,
    assignmentId,
    reviewerName,
    approvedAt,
    assessment: matchedRev?.assessment || matchedAss?.assessment || null,
    comments: matchedRev?.comments || matchedAss?.reviewComments || null,
  };
}

/**
 * Loads and resolves canonical review status for all 6 stages of a project.
 */
export async function getAllProfessionalReviewStages(projectId: number): Promise<{
  project: any;
  areas: ResolvedStageStatus[];
  stages: ResolvedStageStatus[];
  completedReviewsCount: number;
  totalRequiredReviews: number;
  overallStatus: string;
}> {
  // 1. Fetch Project
  const [projectRows]: any = await pool.query(
    `
    SELECT rp.*,
           COALESCE(p.commonName, rp.plantCustomName, 'Botanical Subject') as plantName,
           p.scientificName as plantScientificName,
           p.category as plantCategory,
           p.imageUrl as plantImageUrl,
           u.id as researcherId,
           u.name as researcherName,
           u.email as researcherEmail
    FROM research_projects rp
    LEFT JOIN plants p ON rp.plantId = p.id
    LEFT JOIN users u ON rp.researcherId = u.id
    WHERE rp.id = ?
    LIMIT 1
    `,
    [projectId]
  );

  if (projectRows.length === 0) {
    throw new Error(`Project ${projectId} not found`);
  }
  const project = projectRows[0];

  // 2. Fetch Researcher Stages
  const [stages]: any = await pool.query(
    `SELECT stageKey, status, completedAt, updatedAt FROM research_project_stages WHERE projectId = ?`,
    [projectId]
  );

  // 3. Fetch Assignments
  const [assignments]: any = await pool.query(
    `
    SELECT ra.*, u.name as reviewerName
    FROM review_assignments ra
    LEFT JOIN users u ON ra.reviewerId = u.id
    WHERE ra.projectId = ?
    ORDER BY ra.id DESC
    `,
    [projectId]
  );

  // 4. Fetch Area Coverage
  const [coverage]: any = await pool.query(
    `
    SELECT rac.*, u.name as reviewerName
    FROM review_area_coverage rac
    LEFT JOIN users u ON rac.reviewerId = u.id
    WHERE rac.projectId = ?
    ORDER BY rac.id DESC
    `,
    [projectId]
  );

  // 5. Fetch Professional Reviews
  const [profReviews]: any = await pool.query(
    `
    SELECT pr.*, u.name as reviewerName
    FROM professional_reviews pr
    LEFT JOIN users u ON pr.reviewerId = u.id
    WHERE pr.projectId = ?
    ORDER BY pr.id DESC
    `,
    [projectId]
  );

  // 6. Data flags check for legacy completed projects
  let dataFlags = {
    hasLiterature: false,
    hasCompounds: false,
    hasDocking: false,
    hasFormulations: false,
    hasSafety: false,
  };

  try {
    const [litRows]: any = await pool.query(
      `SELECT 1 FROM literature_references WHERE projectId = ? LIMIT 1`,
      [projectId]
    );
    dataFlags.hasLiterature = litRows.length > 0;

    const [compRows]: any = await pool.query(
      `SELECT 1 FROM research_compounds WHERE projectId = ? LIMIT 1`,
      [projectId]
    );
    dataFlags.hasCompounds = compRows.length > 0;

    const [dockRows]: any = await pool.query(
      `SELECT 1 FROM docking_runs WHERE projectId = ? LIMIT 1`,
      [projectId]
    );
    dataFlags.hasDocking = dockRows.length > 0;

    const [formRows]: any = await pool.query(
      `SELECT 1 FROM formulations WHERE projectId = ? LIMIT 1`,
      [projectId]
    );
    dataFlags.hasFormulations = formRows.length > 0;

    const [safeRows]: any = await pool.query(
      `SELECT 1 FROM safety_assessments WHERE projectId = ? LIMIT 1`,
      [projectId]
    );
    dataFlags.hasSafety = safeRows.length > 0;
  } catch (err) {
    // Non-fatal if table check fails
  }

  // Resolve all 6 stages
  const resolvedStages: ResolvedStageStatus[] = [1, 2, 3, 4, 5, 6].map((num) =>
    resolveSingleStageStatus(
      num,
      projectId,
      project,
      stages,
      assignments,
      coverage,
      profReviews,
      dataFlags
    )
  );

  // Areas are Stages 1 to 5 (the 5 disciplinary review areas)
  const areas = resolvedStages.slice(0, 5);

  const completedReviewsCount = areas.filter((a) => a.isCompleted).length;

  let overallStatus = "In Scientific Review";
  if (completedReviewsCount === 5 || project.status === "COMPLETED") {
    overallStatus = "Completed";
  } else if (
    areas.some(
      (a) =>
        a.status === "REVISION_REQUIRED" ||
        a.status === "REVISION_RESUBMITTED"
    )
  ) {
    overallStatus = "Revision Requested";
  } else if (areas.some((a) => a.status === "IN_REVIEW")) {
    overallStatus = "In Scientific Review";
  } else if (areas.some((a) => a.status === "NEEDS_REVIEW")) {
    overallStatus = "Needs Review";
  } else {
    overallStatus = "Pending Research Data";
  }

  return {
    project,
    areas,
    stages: resolvedStages,
    completedReviewsCount,
    totalRequiredReviews: 5,
    overallStatus,
  };
}

/**
 * Returns canonical status for a single stage in a project.
 */
export async function getProfessionalReviewStageStatus(
  projectId: number,
  stageNumber: number
): Promise<ResolvedStageStatus> {
  const result = await getAllProfessionalReviewStages(projectId);
  return result.stages[stageNumber - 1] || result.stages[0];
}

