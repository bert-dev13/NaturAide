/* eslint-disable @typescript-eslint/no-explicit-any */
import pool from "@/lib/db";
import {
  ensureReviewTables,
  getProjectApprovedSteps,
  SECTION_TOTAL_STEPS,
} from "@/lib/expert-review-assignment";
import {
  EXPERT_REVIEW_AREAS,
  normalizeReviewAreaKey,
} from "@/lib/expert-review-areas";
import {
  ensureManuscriptUploadColumns,
  getManuscriptRecord,
} from "@/lib/manuscript-upload-service";
import { calculateV2ProjectProgress } from "@/lib/v2-progress-service";

export interface ManuscriptUploadRecord {
  id?: number;
  projectId: number;
  title?: string;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  storagePath: string | null;
  fileUrl: string | null;
  uploadedAt: string | null;
  status: string;
  hasFile: boolean;
}

export type SpecialtyReviewUiStatus =
  | "Pending"
  | "In Review"
  | "Revision Required"
  | "Approved";

export interface SpecialtyApprovalRow {
  code: string;
  areaKey: string;
  specialty: string;
  roleTitle: string;
  reviewerId: number | null;
  reviewerName: string | null;
  reviewerQualification: string | null;
  status: SpecialtyReviewUiStatus;
  rawStatus: string;
  decision: string | null;
  decisionDate: string | null;
  comments: string | null;
  strengths: string | null;
  concerns: string | null;
  requiredRevisions: string | null;
  carriedForward: boolean;
  openFeedbackCount: number;
  hasFeedback: boolean;
  secKey?: "section1" | "section2" | "section3";
  approvedSteps?: number[];
  approvedStepCount?: number;
  totalSteps?: number;
  approvedPercent?: number;
}

export interface SubmissionHistoryEntry {
  submissionId: number;
  versionNumber: number;
  versionTag: string;
  status: string;
  submittedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  specialties: Array<{
    code: string;
    areaKey: string;
    specialty: string;
    reviewerName: string | null;
    reviewerQualification: string | null;
    status: SpecialtyReviewUiStatus;
    decision: string | null;
    decisionDate: string | null;
    comments: string | null;
    strengths: string | null;
    concerns: string | null;
    requiredRevisions: string | null;
    carriedForward: boolean;
  }>;
}

export interface ProfessionalApprovalState {
  projectId: number;
  researcherId: number;
  projectTitle: string;
  plantName: string;
  scientificName: string | null;
  projectStatus: string;
  hasSubmission: boolean;
  latestSubmission: {
    id: number;
    versionNumber: number;
    versionTag: string;
    status: string;
    submittedAt: string | null;
    completedAt: string | null;
    isLocked: boolean;
  } | null;
  specialties: SpecialtyApprovalRow[];
  approvedCount: number;
  totalSpecialties: number;
  revisionsRequiredSpecialties: string[];
  unresolvedRevisionsCount: number;
  overallReviewStatus: string;
  readiness: {
    isSection1Complete: boolean;
    isSection2Complete: boolean;
    isSummaryReady: boolean;
    isManuscriptUploaded: boolean;
    isDossierComplete: boolean;
  };
  manuscript: ManuscriptUploadRecord | null;
  isCompleted: boolean;
  completedAt: string | null;
  approvedSubmissionId: number | null;
  approvedVersionTag: string | null;
  canCompleteResearch: boolean;
  completionBlockers: string[];
  submissionHistory: SubmissionHistoryEntry[];
  approvedStepsBySection?: {
    section1: number[];
    section2: number[];
    section3: number[];
  };
  overallApprovalPercent?: number;
}

export interface CompletedResearchListItem {
  projectId: number;
  title: string;
  plantName: string;
  scientificName: string | null;
  dosageForm: string | null;
  completedAt: string;
  approvedVersionTag: string;
  approvedCount: number;
  totalSpecialties: number;
  approvalStatusLabel: string;
  hasManuscript: boolean;
  manuscriptFileName: string | null;
}

export interface CompletedResearchDetail {
  projectId: number;
  researcherId: number;
  researcherName: string;
  title: string;
  plantName: string;
  scientificName: string | null;
  dosageForm: string | null;
  targetCondition: string | null;
  completedAt: string;
  approvedVersionTag: string;
  approvedSubmissionId: number | null;
  approvalState: ProfessionalApprovalState;
  executiveSummary: string;
  manuscript: ManuscriptUploadRecord | null;
  computationalResults: {
    phytochemicalsCount: number;
    phytochemicals: Array<{
      id: number;
      name: string;
      formula: string | null;
      molecularWeight: number | null;
      smiles: string | null;
    }>;
    screeningCount: number;
    lipinskiPassCount: number;
    screenings: Array<{
      id: number;
      compoundName: string;
      molecularWeight: number | null;
      logP: number | null;
      hBondDonors: number | null;
      hBondAcceptors: number | null;
      tpsa: number | null;
      lipinskiViolations: number | null;
      passedLipinski: boolean;
      bioavailabilityScore: number | null;
      hepatotoxicity: string | null;
    }>;
    targetsCount: number;
    targets: Array<{
      id: number;
      targetName: string;
      pdbId: string | null;
      uniprotId: string | null;
      therapeuticRole: string | null;
    }>;
    dockingCount: number;
    dockingResults: Array<{
      id: number;
      ligandName: string;
      targetName: string;
      pdbId: string | null;
      bindingAffinity: number | null;
      rmsdLb: number | null;
      rmsdUb: number | null;
      hydrogenBonds: number | null;
      interactingResidues: string | null;
    }>;
    scientificInterpretation: {
      overallFindings: string | null;
      mechanisticSummary: string | null;
      limitations: string | null;
      recommendations: string | null;
    } | null;
  };
}

let completionSchemaEnsured = false;

export async function ensureResearchCompletionSchema(): Promise<void> {
  await ensureReviewTables();
  await ensureManuscriptUploadColumns();

  if (completionSchemaEnsured) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS research_completions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      projectId INT NOT NULL UNIQUE,
      finalTitle VARCHAR(500) NULL,
      abstract LONGTEXT NULL,
      scientificInterpretation LONGTEXT NULL,
      isSynthesisApproved TINYINT(1) NOT NULL DEFAULT 0,
      isCompleted TINYINT(1) NOT NULL DEFAULT 0,
      approvedSubmissionId INT NULL,
      approvedVersionTag VARCHAR(32) NULL,
      completedAt DATETIME(3) NULL,
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  const columnsToEnsure: Array<{ name: string; definition: string }> = [
    { name: "isCompleted", definition: "TINYINT(1) NOT NULL DEFAULT 0" },
    { name: "approvedSubmissionId", definition: "INT NULL" },
    { name: "approvedVersionTag", definition: "VARCHAR(32) NULL" },
    { name: "completedAt", definition: "DATETIME(3) NULL" },
  ];

  for (const col of columnsToEnsure) {
    try {
      const [existing]: any = await pool.query(
        `SHOW COLUMNS FROM research_completions LIKE ?`,
        [col.name]
      );
      if (!existing || existing.length === 0) {
        await pool.query(
          `ALTER TABLE research_completions ADD COLUMN ${col.name} ${col.definition}`
        );
      }
    } catch {
      // Ignore if column already exists in concurrent execution
    }
  }

  completionSchemaEnsured = true;
}

function mapRawSpecialtyStatusToUiStatus(
  rawStatus: string | null | undefined,
  assessment: string | null | undefined
): SpecialtyReviewUiStatus {
  const statusUpper = String(rawStatus || "").toUpperCase();
  const assessmentUpper = String(assessment || "").toUpperCase();

  if (
    statusUpper === "APPROVED" ||
    statusUpper === "COMPLETED" ||
    assessmentUpper === "ACCEPTABLE" ||
    assessmentUpper === "APPROVE" ||
    assessmentUpper === "APPROVED"
  ) {
    return "Approved";
  }
  if (
    statusUpper === "REVISION_REQUIRED" ||
    statusUpper === "REVISION_REQUESTED" ||
    statusUpper === "REJECTED" ||
    assessmentUpper === "REVISION_REQUIRED" ||
    assessmentUpper === "REQUEST_REVISION" ||
    assessmentUpper === "REJECT"
  ) {
    return "Revision Required";
  }
  if (statusUpper === "IN_REVIEW" || statusUpper === "ASSIGNED") {
    return "In Review";
  }
  return "Pending";
}

function toIsoOrNull(val: any): string | null {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString();
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? String(val) : parsed.toISOString();
}

export async function getProjectProfessionalApprovalState(
  projectId: number
): Promise<ProfessionalApprovalState | null> {
  await ensureResearchCompletionSchema();

  const [projRows]: any = await pool.query(
    `
    SELECT
      rp.id,
      rp.researcherId,
      rp.title,
      rp.status,
      rp.currentStage,
      rp.progressPercent,
      rp.updatedAt,
      rp.createdAt,
      rp.plantCustomName,
      p.commonName AS plantCommonName,
      p.scientificName AS plantScientificName
    FROM research_projects rp
    LEFT JOIN plants p ON rp.plantId = p.id
    WHERE rp.id = ?
    LIMIT 1
    `,
    [projectId]
  );

  if (!projRows || projRows.length === 0) {
    return null;
  }

  const project = projRows[0];

  const [
    [dossierRows],
    [completionRows],
    [submissionRows],
    [feedbackRows],
    manuscript,
    v2Progress,
  ]: any = await Promise.all([
    pool.query(
      `SELECT * FROM research_dossiers WHERE projectId = ? LIMIT 1`,
      [projectId]
    ),
    pool.query(
      `SELECT * FROM research_completions WHERE projectId = ? LIMIT 1`,
      [projectId]
    ),
    pool.query(
      `SELECT * FROM review_submissions WHERE projectId = ? ORDER BY reviewRound DESC, id DESC`,
      [projectId]
    ),
    pool.query(
      `SELECT * FROM review_feedback WHERE projectId = ? ORDER BY createdAt DESC`,
      [projectId]
    ),
    getManuscriptRecord(projectId),
    calculateV2ProjectProgress(projectId),
  ]);

  const dossier = dossierRows?.[0] || null;
  const completion = completionRows?.[0] || null;
  const submissions: any[] = submissionRows || [];
  const latestSub = submissions[0] || null;

  // Fetch all coverage and professional reviews across all submissions of this project
  const submissionIds = submissions.map((s) => Number(s.id));
  let allCoverageRows: any[] = [];
  let allProfReviewRows: any[] = [];

  if (submissionIds.length > 0) {
    const [covRows]: any = await pool.query(
      `
      SELECT
        rac.*,
        u.name AS assignedReviewerName
      FROM review_area_coverage rac
      LEFT JOIN users u ON rac.reviewerId = u.id
      WHERE rac.submissionId IN (?)
      ORDER BY rac.submissionId DESC, rac.id ASC
      `,
      [submissionIds]
    );
    allCoverageRows = covRows || [];

    const [prRows]: any = await pool.query(
      `
      SELECT
        pr.*,
        u.name AS reviewerName
      FROM professional_reviews pr
      LEFT JOIN users u ON pr.reviewerId = u.id
      WHERE pr.submissionId IN (?)
      ORDER BY pr.submissionId DESC, pr.updatedAt DESC
      `,
      [submissionIds]
    );
    allProfReviewRows = prRows || [];
  }

  const openFeedbackItems = (feedbackRows || []).filter((f: any) => {
    const st = String(f.status || "OPEN").toUpperCase();
    return st === "OPEN" || st === "IN_REVIEW" || st === "IN_PROGRESS" || st === "PENDING";
  });

  // Build specialties for the latest submission (or default Pending when not yet submitted)
  const latestSubId = latestSub ? Number(latestSub.id) : null;
  const latestCoverageByArea = new Map<string, any>();
  const latestReviewByArea = new Map<string, any>();

  if (latestSubId !== null) {
    for (const cov of allCoverageRows) {
      if (Number(cov.submissionId) !== latestSubId) continue;
      const normKey = normalizeReviewAreaKey(cov.areaKey);
      const existing = latestCoverageByArea.get(normKey);
      const covSt = String(cov.status || "").toUpperCase();
      const existingSt = existing ? String(existing.status || "").toUpperCase() : "";
      if (
        !existing ||
        cov.areaKey === normKey ||
        covSt === "APPROVED" ||
        covSt === "COMPLETED" ||
        (existingSt !== "APPROVED" && existingSt !== "COMPLETED" && covSt === "IN_REVIEW")
      ) {
        latestCoverageByArea.set(normKey, cov);
      }
    }
    for (const pr of allProfReviewRows) {
      if (Number(pr.submissionId) !== latestSubId) continue;
      const normKey = normalizeReviewAreaKey(pr.areaKey);
      const existing = latestReviewByArea.get(normKey);
      const prAssessment = String(pr.assessment || "").toUpperCase();
      if (
        !existing ||
        pr.areaKey === normKey ||
        prAssessment === "ACCEPTABLE"
      ) {
        latestReviewByArea.set(normKey, pr);
      }
    }
  }

  const approvedSteps = await getProjectApprovedSteps(projectId);

  const specialties: SpecialtyApprovalRow[] = EXPERT_REVIEW_AREAS.map((areaDef) => {
    const cov = latestCoverageByArea.get(areaDef.key) || null;
    const pr = latestReviewByArea.get(areaDef.key) || null;

    // Priority: review_area_coverage.status is authoritative for the current submission version
    const rawStatus = cov?.status || (pr?.status === "SUBMITTED" ? pr?.assessment : "PENDING");
    const assessment =
      cov?.status === "APPROVED"
        ? "ACCEPTABLE"
        : cov?.status === "REVISION_REQUIRED"
          ? "REVISION_REQUIRED"
          : cov?.status
            ? null
            : pr?.assessment || null;

    const uiStatus: SpecialtyReviewUiStatus = latestSubId
      ? mapRawSpecialtyStatusToUiStatus(rawStatus, assessment)
      : "Pending";

    const reviewerId = cov?.reviewerId ?? pr?.reviewerId ?? null;
    const reviewerName = cov?.assignedReviewerName || pr?.reviewerName || null;
    const reviewerQualification =
      cov?.assignedReviewerQualification || pr?.reviewerQualification || null;

    const decisionDate =
      uiStatus === "Approved" || uiStatus === "Revision Required"
        ? toIsoOrNull(pr?.submittedAt || cov?.updatedAt || pr?.updatedAt)
        : null;

    const areaOpenFeedback = openFeedbackItems.filter(
      (f: any) => normalizeReviewAreaKey(f.areaKey) === areaDef.key
    ).length;

    const comments = pr?.comments || null;
    const code = String(areaDef.order).padStart(2, "0");

    const secKey: "section1" | "section2" | "section3" =
      (areaDef.key as string) === "formulation" || (areaDef.key as string) === "pharmacognosy"
        ? "section1"
        : areaDef.key === "bioinformatics"
        ? "section2"
        : "section3";
    const secApprovedSteps = approvedSteps[secKey] || [];
    const totalSteps = SECTION_TOTAL_STEPS[secKey];
    const approvedPercent =
      uiStatus === "Approved"
        ? 100
        : Math.round((secApprovedSteps.length / totalSteps) * 100);

    const hasFeedback =
      uiStatus === "Revision Required" ||
      areaOpenFeedback > 0 ||
      Boolean(comments && String(comments).trim().length > 0);

    return {
      code,
      areaKey: areaDef.key,
      specialty: areaDef.label,
      roleTitle: areaDef.professionTitle,
      reviewerId: reviewerId ? Number(reviewerId) : null,
      reviewerName,
      reviewerQualification,
      status: uiStatus,
      rawStatus: String(rawStatus || "PENDING"),
      decision: assessment ? String(assessment) : null,
      decisionDate,
      comments,
      strengths: null,
      concerns: null,
      requiredRevisions: uiStatus === "Revision Required" ? comments : null,
      carriedForward: false,
      openFeedbackCount: areaOpenFeedback,
      hasFeedback,
      secKey,
      approvedSteps: secApprovedSteps,
      approvedStepCount: secApprovedSteps.length,
      totalSteps,
      approvedPercent,
    };
  });

  // Build submission history with specialty decisions per version
  const submissionHistory: SubmissionHistoryEntry[] = submissions.map((sub) => {
    const subId = Number(sub.id);
    const subCovMap = new Map<string, any>();
    const subPrMap = new Map<string, any>();

    for (const cov of allCoverageRows) {
      if (Number(cov.submissionId) !== subId) continue;
      const normKey = normalizeReviewAreaKey(cov.areaKey);
      const existing = subCovMap.get(normKey);
      const covSt = String(cov.status || "").toUpperCase();
      if (!existing || cov.areaKey === normKey || covSt === "APPROVED" || covSt === "COMPLETED") {
        subCovMap.set(normKey, cov);
      }
    }
    for (const pr of allProfReviewRows) {
      if (Number(pr.submissionId) !== subId) continue;
      const normKey = normalizeReviewAreaKey(pr.areaKey);
      const existing = subPrMap.get(normKey);
      const prAssessment = String(pr.assessment || "").toUpperCase();
      if (!existing || pr.areaKey === normKey || prAssessment === "ACCEPTABLE") {
        subPrMap.set(normKey, pr);
      }
    }

    const subSpecialties = EXPERT_REVIEW_AREAS.map((areaDef) => {
      const cov = subCovMap.get(areaDef.key) || null;
      const pr = subPrMap.get(areaDef.key) || null;
      const rawSt = cov?.status || (pr?.status === "SUBMITTED" ? pr?.assessment : "PENDING");
      const dec =
        cov?.status === "APPROVED"
          ? "ACCEPTABLE"
          : cov?.status === "REVISION_REQUIRED"
            ? "REVISION_REQUIRED"
            : cov?.status
              ? null
              : pr?.assessment || null;
      const uiSt = mapRawSpecialtyStatusToUiStatus(rawSt, dec);
      const code = String(areaDef.order).padStart(2, "0");

      return {
        code,
        areaKey: areaDef.key,
        specialty: areaDef.label,
        reviewerName: cov?.assignedReviewerName || pr?.reviewerName || null,
        reviewerQualification:
          cov?.assignedReviewerQualification || pr?.reviewerQualification || null,
        status: uiSt,
        decision: dec ? String(dec) : null,
        decisionDate:
          uiSt === "Approved" || uiSt === "Revision Required"
            ? toIsoOrNull(pr?.submittedAt || cov?.updatedAt || pr?.updatedAt)
            : null,
        comments: pr?.comments || null,
        strengths: null,
        concerns: null,
        requiredRevisions: uiSt === "Revision Required" ? pr?.comments || null : null,
        carriedForward: false,
      };
    });

    const roundNum = Number(sub.reviewRound || 1);
    return {
      submissionId: subId,
      versionNumber: roundNum,
      versionTag: String(sub.versionTag || `v${roundNum}.0`),
      status: String(sub.status || "UNDER_REVIEW"),
      submittedAt: toIsoOrNull(sub.submittedAt),
      completedAt: toIsoOrNull(sub.reviewedAt),
      notes: sub.submissionNotes ? String(sub.submissionNotes) : null,
      specialties: subSpecialties,
    };
  });

  // Strict approval count for the current latest submission version
  const approvedCount = latestSub
    ? specialties.filter((s) => s.status === "Approved").length
    : 0;
  const totalSpecialties = EXPERT_REVIEW_AREAS.length; // 3 professional reviewer roles

  const revisionsRequiredSpecialties = specialties
    .filter((s) => s.status === "Revision Required")
    .map((s) => s.specialty);

  const unresolvedRevisionsCount =
    revisionsRequiredSpecialties.length + openFeedbackItems.length;

  const isSection1Complete = v2Progress?.section1?.status === "COMPLETED";
  const isSection2Complete = v2Progress?.section2?.status === "COMPLETED";
  const executiveSummaryText = String(
    dossier?.executiveSummary || completion?.abstract || ""
  ).trim();
  const isSummaryReady = executiveSummaryText.length > 0;
  const hasManuscriptFile = Boolean(
    manuscript &&
      (manuscript.fileName ||
        manuscript.fileUrl ||
        manuscript.storagePath ||
        (manuscript.abstract && manuscript.conclusion))
  );
  const normalizedManuscript: ManuscriptUploadRecord | null = manuscript
    ? {
        id: manuscript.id ? Number(manuscript.id) : undefined,
        projectId: Number(project.id),
        title: manuscript.title ? String(manuscript.title) : undefined,
        fileName: manuscript.fileName ? String(manuscript.fileName) : null,
        fileSize:
          manuscript.fileSize !== null && manuscript.fileSize !== undefined
            ? Number(manuscript.fileSize)
            : null,
        mimeType: manuscript.mimeType ? String(manuscript.mimeType) : null,
        storagePath: manuscript.storagePath ? String(manuscript.storagePath) : null,
        fileUrl: manuscript.fileUrl ? String(manuscript.fileUrl) : null,
        uploadedAt: toIsoOrNull(manuscript.uploadedAt),
        status: String(manuscript.status || "UPLOADED"),
        hasFile: hasManuscriptFile,
      }
    : null;
  const isManuscriptUploaded = hasManuscriptFile;
  const isDossierComplete =
    isSection1Complete &&
    isSection2Complete &&
    isSummaryReady &&
    isManuscriptUploaded;

  const projectStatusUpper = String(project.status || "").toUpperCase();
  const isCompleted =
    projectStatusUpper === "COMPLETED" || Boolean(completion?.isCompleted);

  const completedAt = isCompleted
    ? toIsoOrNull(completion?.completedAt || project.updatedAt)
    : null;

  const hasSubmission = Boolean(latestSub);

  let overallReviewStatus: string;
  if (isCompleted) {
    overallReviewStatus = "Completed";
  } else if (!hasSubmission) {
    overallReviewStatus = "Draft — Not Submitted";
  } else if (
    revisionsRequiredSpecialties.length > 0 ||
    projectStatusUpper === "REVISION_REQUESTED" ||
    projectStatusUpper === "REVISION_REQUIRED" ||
    String(latestSub?.status || "").toUpperCase() === "REVISION_REQUESTED"
  ) {
    overallReviewStatus = "Revisions Required";
  } else if (approvedCount === totalSpecialties && unresolvedRevisionsCount === 0) {
    overallReviewStatus = "Fully Approved — Ready to Complete";
  } else {
    overallReviewStatus = `Under Professional Review — ${approvedCount}/${totalSpecialties} Approved`;
  }

  const completionBlockers: string[] = [];
  if (isCompleted) {
    completionBlockers.push("This research project has already been marked as Completed.");
  }
  if (!hasSubmission) {
    completionBlockers.push("The research dossier has not been submitted for professional review.");
  }
  if (approvedCount < totalSpecialties) {
    completionBlockers.push(
      `All 3 professional reviewer roles must approve the current version (${approvedCount} of ${totalSpecialties} approved).`
    );
  }
  if (revisionsRequiredSpecialties.length > 0) {
    completionBlockers.push(
      `Revisions are still required from: ${revisionsRequiredSpecialties.join(", ")}.`
    );
  } else if (openFeedbackItems.length > 0) {
    completionBlockers.push(
      `${openFeedbackItems.length} unresolved revision feedback item(s) remain open.`
    );
  }
  if (!isSection1Complete) {
    completionBlockers.push("Section 1 (Formulation Research) must be complete.");
  }
  if (!isSection2Complete) {
    completionBlockers.push("Section 2 (In-Silico Analysis) must be complete.");
  }
  if (!isSummaryReady) {
    completionBlockers.push("Research Summary in Section 3 Step 1 must be saved.");
  }
  if (!isManuscriptUploaded) {
    completionBlockers.push("A final Research Paper (PDF or DOCX) must be uploaded.");
  }

  const canCompleteResearch =
    !isCompleted &&
    hasSubmission &&
    approvedCount === totalSpecialties &&
    revisionsRequiredSpecialties.length === 0 &&
    unresolvedRevisionsCount === 0 &&
    isDossierComplete &&
    isManuscriptUploaded;

  const basePlantCommon = project.plantCommonName || project.plantCustomName || null;
  const plantName = basePlantCommon
    ? project.plantScientificName
      ? `${basePlantCommon} (${project.plantScientificName})`
      : String(basePlantCommon)
    : project.plantScientificName || "Medicinal Plant";

  const latestRound = Number(latestSub?.reviewRound || 1);

  return {
    projectId: Number(project.id),
    researcherId: Number(project.researcherId),
    projectTitle: String(project.title || "Untitled Research Project"),
    plantName,
    scientificName: project.plantScientificName ? String(project.plantScientificName) : null,
    projectStatus: String(project.status || "IN_PROGRESS"),
    hasSubmission,
    latestSubmission: latestSub
      ? {
          id: Number(latestSub.id),
          versionNumber: latestRound,
          versionTag: String(latestSub.versionTag || `v${latestRound}.0`),
          status: String(latestSub.status || "UNDER_REVIEW"),
          submittedAt: toIsoOrNull(latestSub.submittedAt),
          completedAt: toIsoOrNull(latestSub.reviewedAt),
          isLocked: Boolean(latestSub.isLocked),
        }
      : null,
    specialties,
    approvedCount,
    totalSpecialties,
    revisionsRequiredSpecialties,
    unresolvedRevisionsCount,
    overallReviewStatus,
    readiness: {
      isSection1Complete,
      isSection2Complete,
      isSummaryReady,
      isManuscriptUploaded,
      isDossierComplete,
    },
    manuscript: normalizedManuscript,
    isCompleted,
    completedAt,
    approvedSubmissionId: completion?.approvedSubmissionId
      ? Number(completion.approvedSubmissionId)
      : latestSub && approvedCount === totalSpecialties
        ? Number(latestSub.id)
        : null,
    approvedVersionTag:
      completion?.approvedVersionTag ||
      (latestSub ? String(latestSub.versionTag || `v${latestRound}.0`) : null),
    canCompleteResearch,
    completionBlockers,
    submissionHistory,
    approvedStepsBySection: approvedSteps,
    overallApprovalPercent:
      specialties.length > 0
        ? Math.round(
            specialties.reduce((acc, s) => acc + (s.approvedPercent || 0), 0) /
              specialties.length
          )
        : 0,
  };
}

export async function completeApprovedResearchProject(params: {
  projectId: number;
  researcherId: number;
}): Promise<ProfessionalApprovalState> {
  const { projectId, researcherId } = params;
  const state = await getProjectProfessionalApprovalState(projectId);

  if (!state) {
    const err: any = new Error("Research project not found.");
    err.statusCode = 404;
    throw err;
  }

  if (state.researcherId !== Number(researcherId)) {
    const err: any = new Error("Forbidden: You do not own this research project.");
    err.statusCode = 403;
    throw err;
  }

  if (state.isCompleted) {
    const err: any = new Error(
      "This research project has already been marked as Completed."
    );
    err.statusCode = 409;
    throw err;
  }

  if (!state.canCompleteResearch || !state.latestSubmission) {
    const reason =
      state.completionBlockers.length > 0
        ? state.completionBlockers.join(" ")
        : "All 3 professional reviewer roles must approve the final version before completing research.";
    const err: any = new Error(reason);
    err.statusCode = 400;
    throw err;
  }

  const approvedSubId = state.latestSubmission.id;
  const approvedVersionTag = state.latestSubmission.versionTag;

  // 1. Mark research_projects as COMPLETED (do NOT publish to public community)
  await pool.query(
    `
    UPDATE research_projects
    SET
      status = 'COMPLETED',
      currentStage = 'completed',
      progressPercent = 100,
      updatedAt = CURRENT_TIMESTAMP(3)
    WHERE id = ? AND researcherId = ?
    `,
    [projectId, researcherId]
  );

  // 2. Mark research_dossiers as COMPLETED
  await pool.query(
    `
    UPDATE research_dossiers
    SET
      status = 'COMPLETED',
      currentVersionTag = ?,
      updatedAt = CURRENT_TIMESTAMP(3)
    WHERE projectId = ?
    `,
    [approvedVersionTag, projectId]
  );

  // 3. Upsert research_completions with completion timestamp and approved submission version
  await pool.query(
    `
    INSERT INTO research_completions
      (projectId, finalTitle, isSynthesisApproved, isCompleted, approvedSubmissionId, approvedVersionTag, completedAt, updatedAt)
    VALUES (?, ?, 1, 1, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    ON DUPLICATE KEY UPDATE
      finalTitle = COALESCE(finalTitle, VALUES(finalTitle)),
      isSynthesisApproved = 1,
      isCompleted = 1,
      approvedSubmissionId = VALUES(approvedSubmissionId),
      approvedVersionTag = VALUES(approvedVersionTag),
      completedAt = COALESCE(completedAt, CURRENT_TIMESTAMP(3)),
      updatedAt = CURRENT_TIMESTAMP(3)
    `,
    [projectId, state.projectTitle, approvedSubId, approvedVersionTag]
  );

  // 4. Lock the approved review_submissions record
  await pool.query(
    `
    UPDATE review_submissions
    SET
      status = 'APPROVED',
      isLocked = 1,
      reviewedAt = COALESCE(reviewedAt, CURRENT_TIMESTAMP(3))
    WHERE id = ?
    `,
    [approvedSubId]
  );

  // 5. Mark research_manuscripts as COMPLETED / locked
  await pool.query(
    `
    UPDATE research_manuscripts
    SET status = 'COMPLETED', updatedAt = CURRENT_TIMESTAMP(3)
    WHERE projectId = ?
    `,
    [projectId]
  );

  // 6. Mark all research_project_stages as COMPLETED
  await pool.query(
    `
    UPDATE research_project_stages
    SET
      status = 'COMPLETED',
      completedAt = COALESCE(completedAt, CURRENT_TIMESTAMP(3)),
      updatedAt = CURRENT_TIMESTAMP(3)
    WHERE projectId = ?
    `,
    [projectId]
  );

  // 7. Record completion audit logs
  try {
    await pool.query(
      `
      INSERT INTO research_activity_logs
        (projectId, researcherId, actionType, description)
      VALUES (?, ?, 'RESEARCH_COMPLETED', ?)
      `,
      [
        projectId,
        researcherId,
        `Researcher confirmed official completion of "${state.projectTitle}" (${approvedVersionTag}) with 3 of 3 professional approvals.`,
      ]
    );
  } catch {
    // Non-fatal
  }

  try {
    await pool.query(
      `
      INSERT INTO review_activity_logs
        (projectId, submissionId, actorId, actorRole, actionType, description)
      VALUES (?, ?, ?, 'RESEARCHER', 'RESEARCH_COMPLETED', ?)
      `,
      [
        projectId,
        approvedSubId,
        researcherId,
        `Project officially marked Completed on submission ${approvedVersionTag} after 3/3 professional reviewer approvals.`,
      ]
    );
  } catch {
    // Non-fatal
  }

  const updatedState = await getProjectProfessionalApprovalState(projectId);
  return updatedState!;
}

export async function getCompletedResearchListForResearcher(
  researcherId: number
): Promise<CompletedResearchListItem[]> {
  await ensureResearchCompletionSchema();

  const [rows]: any = await pool.query(
    `
    SELECT
      rp.id AS projectId,
      rp.title,
      rp.status,
      rp.updatedAt,
      rp.plantCustomName,
      p.commonName AS plantCommonName,
      p.scientificName AS plantScientificName,
      rps.deliveryFormat,
      rps.productType,
      rc.completedAt,
      rc.approvedVersionTag,
      rc.approvedSubmissionId,
      rm.fileName AS manuscriptFileName,
      rm.storagePath AS manuscriptStoragePath
    FROM research_projects rp
    LEFT JOIN plants p ON rp.plantId = p.id
    LEFT JOIN research_product_selections rps ON rps.projectId = rp.id
    LEFT JOIN research_completions rc ON rc.projectId = rp.id
    LEFT JOIN research_manuscripts rm ON rm.projectId = rp.id
    WHERE rp.researcherId = ?
      AND (rp.status = 'COMPLETED' OR rc.isCompleted = 1)
    ORDER BY COALESCE(rc.completedAt, rp.updatedAt) DESC, rp.id DESC
    `,
    [researcherId]
  );

  if (!rows || rows.length === 0) {
    return [];
  }

  const results: CompletedResearchListItem[] = [];
  for (const row of rows) {
    const projectId = Number(row.projectId);
    const state = await getProjectProfessionalApprovalState(projectId);
    const approvedCount = state ? state.approvedCount : 5;
    const totalSpecialties = state ? state.totalSpecialties : 5;

    const basePlantCommon = row.plantCommonName || row.plantCustomName || null;
    const plantName = basePlantCommon
      ? row.plantScientificName
        ? `${basePlantCommon} (${row.plantScientificName})`
        : String(basePlantCommon)
      : row.plantScientificName || "Medicinal Plant";

    results.push({
      projectId,
      title: String(row.title || "Untitled Research"),
      plantName,
      scientificName: row.plantScientificName ? String(row.plantScientificName) : null,
      dosageForm:
        row.productType || row.deliveryFormat
          ? String(row.productType || row.deliveryFormat)
          : null,
      completedAt:
        toIsoOrNull(row.completedAt || row.updatedAt) || new Date().toISOString(),
      approvedVersionTag: String(
        row.approvedVersionTag || state?.latestSubmission?.versionTag || "v1.0"
      ),
      approvedCount,
      totalSpecialties,
      approvalStatusLabel: `${approvedCount} of ${totalSpecialties} Approved`,
      hasManuscript: Boolean(row.manuscriptFileName && row.manuscriptStoragePath),
      manuscriptFileName: row.manuscriptFileName
        ? String(row.manuscriptFileName)
        : null,
    });
  }

  return results;
}

export async function getCompletedResearchDetail(
  projectId: number,
  viewer: { id: number; role: string }
): Promise<CompletedResearchDetail | null> {
  await ensureResearchCompletionSchema();

  const state = await getProjectProfessionalApprovalState(projectId);
  if (!state) return null;

  // Enforce authorization: only the owning researcher or an authorized reviewer/admin
  if (viewer.role === "RESEARCHER" && state.researcherId !== Number(viewer.id)) {
    const err: any = new Error("Forbidden: You do not have access to this completed research.");
    err.statusCode = 403;
    throw err;
  }

  if (!state.isCompleted) {
    return null;
  }

  const [
    [projRows],
    [dossierRows],
    [compRows],
    [phytoRows],
    [screeningRows],
    [targetRows],
    [dockingRows],
    [interpRows],
  ]: any = await Promise.all([
    pool.query(
      `
      SELECT
        rp.id,
        rp.title,
        rp.areaOfInterest,
        u.name AS researcherName,
        rps.deliveryFormat,
        rps.productType
      FROM research_projects rp
      LEFT JOIN users u ON rp.researcherId = u.id
      LEFT JOIN research_product_selections rps ON rps.projectId = rp.id
      WHERE rp.id = ?
      LIMIT 1
      `,
      [projectId]
    ),
    pool.query(
      `SELECT executiveSummary FROM research_dossiers WHERE projectId = ? LIMIT 1`,
      [projectId]
    ),
    pool.query(
      `SELECT abstract, scientificInterpretation, completedAt, approvedVersionTag, approvedSubmissionId FROM research_completions WHERE projectId = ? LIMIT 1`,
      [projectId]
    ),
    pool.query(
      `SELECT * FROM research_compounds WHERE projectId = ? ORDER BY selectedForDocking DESC, id ASC`,
      [projectId]
    ),
    pool.query(
      `SELECT * FROM insilico_results WHERE projectId = ? ORDER BY id ASC`,
      [projectId]
    ),
    pool.query(
      `SELECT * FROM docking_targets WHERE projectId = ? ORDER BY id ASC`,
      [projectId]
    ),
    pool.query(
      `
      SELECT * FROM docking_runs
      WHERE projectId = ? AND jobStatus = 'COMPLETED' AND bindingAffinity IS NOT NULL
      ORDER BY CAST(bindingAffinity AS DECIMAL(10,3)) ASC, id DESC
      `,
      [projectId]
    ),
    pool.query(
      `SELECT * FROM research_insilico_syntheses WHERE projectId = ? ORDER BY id DESC LIMIT 1`,
      [projectId]
    ),
  ]);

  const proj = projRows?.[0] || {};
  const dossier = dossierRows?.[0] || {};
  const comp = compRows?.[0] || {};
  const interp = interpRows?.[0] || null;

  const executiveSummary = String(
    dossier.executiveSummary || comp.abstract || comp.scientificInterpretation || ""
  ).trim();

  const selectedPhytos = (phytoRows || []).filter(
    (r: any) => Boolean(r.selectedForDocking) || (phytoRows || []).length <= 5
  );

  const phytochemicals = selectedPhytos.map((r: any) => ({
    id: Number(r.id),
    name: String(r.compoundName || r.name || "Unknown Compound"),
    formula: r.molecularFormula || r.formula ? String(r.molecularFormula || r.formula) : null,
    molecularWeight:
      r.molecularWeight !== null && r.molecularWeight !== undefined
        ? Number(r.molecularWeight)
        : null,
    smiles: r.smiles || r.canonicalSmiles ? String(r.smiles || r.canonicalSmiles) : null,
  }));

  const screenings = (screeningRows || []).map((s: any) => {
    const violations =
      s.lipinskiViolations !== null && s.lipinskiViolations !== undefined
        ? Number(s.lipinskiViolations)
        : 0;
    const passed =
      s.passedLipinski !== undefined && s.passedLipinski !== null
        ? Boolean(s.passedLipinski)
        : s.drugLikenessPass !== undefined && s.drugLikenessPass !== null
          ? Boolean(s.drugLikenessPass)
          : violations <= 1;
    return {
      id: Number(s.id),
      compoundName: String(s.compoundName || s.ligandName || "Phytochemical"),
      molecularWeight:
        s.molecularWeight !== null && s.molecularWeight !== undefined
          ? Number(s.molecularWeight)
          : null,
      logP: s.logP !== null && s.logP !== undefined ? Number(s.logP) : null,
      hBondDonors:
        s.hBondDonors !== null && s.hBondDonors !== undefined
          ? Number(s.hBondDonors)
          : null,
      hBondAcceptors:
        s.hBondAcceptors !== null && s.hBondAcceptors !== undefined
          ? Number(s.hBondAcceptors)
          : null,
      tpsa: s.tpsa !== null && s.tpsa !== undefined ? Number(s.tpsa) : null,
      lipinskiViolations: violations,
      passedLipinski: passed,
      bioavailabilityScore:
        s.bioavailabilityScore !== null && s.bioavailabilityScore !== undefined
          ? Number(s.bioavailabilityScore)
          : null,
      hepatotoxicity: s.hepatotoxicity || s.toxicityRisk ? String(s.hepatotoxicity || s.toxicityRisk) : null,
    };
  });

  const targets = (targetRows || []).map((t: any) => ({
    id: Number(t.id),
    targetName: String(t.targetName || t.proteinName || "Target Receptor"),
    pdbId: t.pdbId ? String(t.pdbId) : null,
    uniprotId: t.uniprotId ? String(t.uniprotId) : null,
    therapeuticRole:
      t.therapeuticRole || t.therapeuticRelevance || t.biologicalRole
        ? String(t.therapeuticRole || t.therapeuticRelevance || t.biologicalRole)
        : null,
  }));

  const dockingResults = (dockingRows || []).map((d: any) => ({
    id: Number(d.id),
    ligandName: String(d.compoundName || d.ligandName || "Ligand"),
    targetName: String(d.targetName || d.proteinName || "Target"),
    pdbId: d.pdbId ? String(d.pdbId) : null,
    bindingAffinity:
      d.bindingAffinity !== null && d.bindingAffinity !== undefined
        ? Number(d.bindingAffinity)
        : null,
    rmsdLb: d.rmsdLb !== null && d.rmsdLb !== undefined ? Number(d.rmsdLb) : null,
    rmsdUb: d.rmsdUb !== null && d.rmsdUb !== undefined ? Number(d.rmsdUb) : null,
    hydrogenBonds:
      d.hydrogenBonds !== null && d.hydrogenBonds !== undefined
        ? Number(d.hydrogenBonds)
        : null,
    interactingResidues: d.interactingResidues || d.keyResidues
      ? String(d.interactingResidues || d.keyResidues)
      : null,
  }));

  return {
    projectId: state.projectId,
    researcherId: state.researcherId,
    researcherName: String(proj.researcherName || "Researcher"),
    title: state.projectTitle,
    plantName: state.plantName,
    scientificName: state.scientificName,
    dosageForm:
      proj.productType || proj.deliveryFormat
        ? String(proj.productType || proj.deliveryFormat)
        : null,
    targetCondition: proj.areaOfInterest ? String(proj.areaOfInterest) : null,
    completedAt: state.completedAt || new Date().toISOString(),
    approvedVersionTag:
      state.approvedVersionTag || state.latestSubmission?.versionTag || "v1.0",
    approvedSubmissionId: state.approvedSubmissionId,
    approvalState: state,
    executiveSummary,
    manuscript: state.manuscript,
    computationalResults: {
      phytochemicalsCount: phytochemicals.length,
      phytochemicals,
      screeningCount: screenings.length,
      lipinskiPassCount: screenings.filter((s: { passedLipinski: boolean }) => s.passedLipinski).length,
      screenings,
      targetsCount: targets.length,
      targets,
      dockingCount: dockingResults.length,
      dockingResults,
      scientificInterpretation: interp
        ? {
            overallFindings:
              interp.keyFindings ||
              interp.scientificInterpretation ||
              interp.overallFindings
                ? String(
                    interp.keyFindings ||
                      interp.scientificInterpretation ||
                      interp.overallFindings
                  )
                : null,
            mechanisticSummary:
              interp.mechanisticHypothesis || interp.mechanisticSummary
                ? String(interp.mechanisticHypothesis || interp.mechanisticSummary)
                : null,
            limitations:
              interp.potentialLimitations ||
              interp.computationalLimitations ||
              interp.limitations
                ? String(
                    interp.potentialLimitations ||
                      interp.computationalLimitations ||
                      interp.limitations
                  )
                : null,
            recommendations:
              interp.experimentalValidationPlan || interp.recommendations
                ? String(interp.experimentalValidationPlan || interp.recommendations)
                : null,
          }
        : null,
    },
  };
}
