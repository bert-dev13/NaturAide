import pool from "@/lib/db";
import {
  EXPERT_REVIEW_AREAS,
  normalizeReviewAreaKey,
  normalizeReviewAreaKeyOrNull,
  expertReviewAreaLabel,
  expertProfessionTitle,
  type ExpertReviewAreaKey,
} from "@/lib/expert-review-areas";

const PLANT_FAMILY_MAP: Record<string, string> = {
  "Momordica charantia": "Cucurbitaceae",
  "Blumea balsamifera": "Asteraceae",
  "Vitex negundo": "Lamiaceae (Verbenaceae)",
  "Psidium guajava": "Myrtaceae",
  "Senna alata": "Fabaceae",
  "Allium sativum": "Amaryllidaceae",
  "Curcuma longa": "Zingiberaceae",
  "Peperomia pellucida": "Piperaceae",
  "Carmona retusa": "Boraginaceae",
  "Mentha cordifolia": "Lamiaceae",
  "Quisqualis indica": "Combretaceae",
  "Zingiber officinale": "Zingiberaceae",
};

let tablesInitialized = false;

export async function ensureReviewTables() {
  if (tablesInitialized) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS professional_review_areas (
      id INT NOT NULL AUTO_INCREMENT,
      userId INT NOT NULL,
      areaKey VARCHAR(50) NOT NULL,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uq_user_area (userId, areaKey),
      KEY idx_user (userId)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS review_area_coverage (
      id INT NOT NULL AUTO_INCREMENT,
      submissionId INT NOT NULL,
      projectId INT NOT NULL,
      areaKey VARCHAR(50) NOT NULL,
      reviewerId INT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uq_submission_area (submissionId, areaKey),
      KEY idx_coverage_reviewer (reviewerId)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS professional_reviews (
      id INT NOT NULL AUTO_INCREMENT,
      assignmentId INT NULL,
      submissionId INT NOT NULL,
      projectId INT NOT NULL,
      reviewerId INT NOT NULL,
      areaKey VARCHAR(50) NOT NULL,
      reviewCycle INT NOT NULL DEFAULT 1,
      assessment ENUM('ACCEPTABLE', 'REVISION_REQUIRED') NULL,
      comments TEXT NULL,
      checklistData TEXT NULL,
      status ENUM('DRAFT', 'SUBMITTED') NOT NULL DEFAULT 'DRAFT',
      submittedAt DATETIME(3) NULL,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uq_sub_reviewer_area (submissionId, reviewerId, areaKey),
      KEY idx_assignment (assignmentId),
      KEY idx_project (projectId)
    ) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviewer_specialty_config (
      userId INT NOT NULL,
      configuredBy INT NULL,
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (userId)
    )
  `);

  try {
    const [colCheck]: any = await pool.query(
      `SHOW COLUMNS FROM review_ai_summaries LIKE 'keyFindingsJson'`
    );
    if (!colCheck || colCheck.length === 0) {
      await pool.query(`DROP TABLE IF EXISTS review_ai_summaries`);
    }
  } catch {
    // Table may not exist yet
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS review_ai_summaries (
      id INT NOT NULL AUTO_INCREMENT,
      projectId INT NOT NULL,
      submissionId INT NOT NULL,
      versionTag VARCHAR(32) NOT NULL DEFAULT 'v1.0',
      specialty VARCHAR(64) NOT NULL,
      reviewerId INT NULL,
      summaryText TEXT NOT NULL,
      keyFindingsJson LONGTEXT NOT NULL,
      potentialIssuesJson LONGTEXT NOT NULL,
      checklistJson LONGTEXT NOT NULL,
      sourceReferencesJson LONGTEXT NOT NULL,
      manuscriptExtracted TINYINT(1) NOT NULL DEFAULT 0,
      manuscriptFileName VARCHAR(255) NULL,
      modelIdentifier VARCHAR(191) NOT NULL,
      isCurrentVersion TINYINT(1) NOT NULL DEFAULT 1,
      isLatestForSubmission TINYINT(1) NOT NULL DEFAULT 1,
      generatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      KEY idx_ras_proj_sub_spec (projectId, submissionId, specialty),
      KEY idx_ras_current (projectId, specialty, isCurrentVersion, isLatestForSubmission)
    ) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  try {
    await pool.query("ALTER TABLE review_assignments MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'PENDING'");
  } catch {}
  try {
    await pool.query("ALTER TABLE review_area_coverage MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'PENDING'");
  } catch {}
  try {
    await pool.query("ALTER TABLE review_submissions MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'UNDER_REVIEW'");
  } catch {}
  try {
    await pool.query("ALTER TABLE review_submissions ADD COLUMN isLocked TINYINT(1) NOT NULL DEFAULT 0");
  } catch {}
  try {
    await pool.query("ALTER TABLE review_submissions ADD COLUMN finalApprovalSummary LONGTEXT NULL");
  } catch {}
  try {
    await pool.query("ALTER TABLE review_feedback ADD COLUMN areaKey VARCHAR(50) NULL");
  } catch {}
  try {
    await pool.query("ALTER TABLE review_feedback ADD COLUMN title VARCHAR(191) NULL");
  } catch {}
  try {
    await pool.query("ALTER TABLE review_feedback ADD COLUMN reviewId INT NULL");
  } catch {}
  try {
    await pool.query("ALTER TABLE professional_reviews ADD COLUMN checklistData TEXT NULL");
  } catch {}

  // 4. review_step_approvals: Persistent per-step approval tracking in MySQL
  await pool.query(`
    CREATE TABLE IF NOT EXISTS review_step_approvals (
      id INT NOT NULL AUTO_INCREMENT,
      projectId INT NOT NULL,
      submissionId INT NULL,
      sectionKey VARCHAR(32) NOT NULL,
      stepNumber INT NOT NULL,
      reviewerId INT NOT NULL,
      approvedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uq_rsa_proj_sec_step (projectId, sectionKey, stepNumber),
      KEY idx_rsa_proj (projectId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // One-time: before Lab became approveable, Section 3 manuscript approvals were step 2.
  // Remap those rows to step 3 so Lab can own step 2 going forward.
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS natureaide_meta (
        metaKey VARCHAR(64) NOT NULL,
        metaValue VARCHAR(255) NULL,
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
          ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (metaKey)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    const [flags]: any = await pool.query(
      `SELECT metaValue FROM natureaide_meta WHERE metaKey = 's3_manuscript_step_remap_v1' LIMIT 1`
    );
    if (!flags.length) {
      // Drop conflicting legacy step-2 rows when step 3 already exists for the project
      await pool.query(`
        DELETE rsa2 FROM review_step_approvals rsa2
        INNER JOIN review_step_approvals rsa3
          ON rsa3.projectId = rsa2.projectId
         AND rsa3.sectionKey = 'section3'
         AND rsa3.stepNumber = 3
        WHERE rsa2.sectionKey = 'section3' AND rsa2.stepNumber = 2
      `);
      await pool.query(`
        UPDATE review_step_approvals
        SET stepNumber = 3
        WHERE sectionKey = 'section3' AND stepNumber = 2
      `);
      await pool.query(
        `INSERT INTO natureaide_meta (metaKey, metaValue) VALUES ('s3_manuscript_step_remap_v1', 'done')`
      );
    }
  } catch (migrateErr) {
    console.warn("Section 3 manuscript step remap skipped:", migrateErr);
  }

  // Ensure default verified reviewer has all 5 specialties seeded if not explicitly configured yet
  try {
    const defaultId = await findDefaultExpertReviewerId();
    if (defaultId) {
      const [cfgRows]: any = await pool.query(
        "SELECT userId FROM reviewer_specialty_config WHERE userId = ? LIMIT 1",
        [defaultId]
      );
      if (cfgRows.length === 0) {
        for (const area of EXPERT_REVIEW_AREAS) {
          await pool.query(
            `INSERT IGNORE INTO professional_review_areas (userId, areaKey) VALUES (?, ?)`,
            [defaultId, area.key]
          );
        }
        await pool.query(
          `INSERT IGNORE INTO reviewer_specialty_config (userId, configuredBy) VALUES (?, ?)`,
          [defaultId, defaultId]
        );
      }
    }
  } catch (e) {
    console.warn("Could not seed default reviewer areas:", e);
  }

  tablesInitialized = true;
}

export async function findDefaultExpertReviewerId(): Promise<number | null> {
  const [rows]: any = await pool.query(
    `
    SELECT u.id
    FROM users u
    JOIN reviewer_profiles rp ON rp.userId = u.id
    WHERE u.role = 'REVIEWER'
      AND u.status = 'ACTIVE'
      AND rp.verificationStatus = 'VERIFIED'
    ORDER BY u.id ASC
    LIMIT 1
    `
  );
  return rows[0]?.id ? Number(rows[0].id) : null;
}

export interface ProjectApprovedSteps {
  section1: number[];
  section2: number[];
  section3: number[];
}

export const SECTION_TOTAL_STEPS: Record<"section1" | "section2" | "section3", number> = {
  section1: 6,
  section2: 7, // Target Protein → Results & Interpretation (legacy step 8 removed)
  section3: 3, // Research Summary, Laboratory Results, Manuscript
};

export const SECTION_TO_AREA_MAP: Record<"section1" | "section2" | "section3", string> = {
  section1: "formulation",
  section2: "bioinformatics",
  section3: "pharmacology",
};

export function countValidSectionSteps(steps: number[] | undefined | null, totalSteps: number): number {
  return new Set(
    (steps || [])
      .map(Number)
      .filter((n) => Number.isFinite(n) && n >= 1 && n <= totalSteps)
  ).size;
}

function areaKeyMatchValues(areaKey: string): string[] {
  const norm = normalizeReviewAreaKey(areaKey);
  const area = EXPERT_REVIEW_AREAS.find((a) => a.key === norm);
  const values = new Set<string>([norm, ...(area?.aliases || [])]);
  return Array.from(values);
}

async function markAreaCoverageApproved(params: {
  projectId: number;
  submissionId: number;
  areaKey: string;
  reviewerId: number;
  sectionKey: "section1" | "section2" | "section3";
  totalSteps: number;
}): Promise<void> {
  const { projectId, submissionId, areaKey, reviewerId, sectionKey, totalSteps } = params;
  const matchKeys = areaKeyMatchValues(areaKey);

  await pool.query(
    `UPDATE review_area_coverage
     SET status = 'APPROVED', reviewerId = ?, updatedAt = CURRENT_TIMESTAMP(3)
     WHERE submissionId = ? AND LOWER(REPLACE(areaKey, '-', '_')) IN (?)`,
    [reviewerId, submissionId, matchKeys.map((k) => k.toLowerCase().replace(/-/g, "_"))]
  );
  await pool.query(
    `UPDATE review_assignments
     SET status = 'COMPLETED', reviewerId = ?, completedAt = CURRENT_TIMESTAMP(3), updatedAt = CURRENT_TIMESTAMP(3)
     WHERE submissionId = ? AND LOWER(REPLACE(specialtyNeeded, '-', '_')) IN (?)`,
    [reviewerId, submissionId, matchKeys.map((k) => k.toLowerCase().replace(/-/g, "_"))]
  );
  const normKey = normalizeReviewAreaKey(areaKey);
  await pool.query(
    `INSERT INTO professional_reviews (
       submissionId, projectId, reviewerId, areaKey, assessment, comments, status, submittedAt
     ) VALUES (?, ?, ?, ?, 'ACCEPTABLE', ?, 'SUBMITTED', CURRENT_TIMESTAMP(3))
     ON DUPLICATE KEY UPDATE
       assessment = 'ACCEPTABLE',
       status = 'SUBMITTED',
       updatedAt = CURRENT_TIMESTAMP(3)`,
    [
      submissionId,
      projectId,
      reviewerId,
      normKey,
      `All ${totalSteps} steps in ${sectionKey.toUpperCase()} approved by specialist reviewer.`,
    ]
  );
  // Full step approval closes open findings for this specialty
  await pool.query(
    `UPDATE review_feedback
     SET status = 'RESOLVED', resolvedAt = CURRENT_TIMESTAMP(3), updatedAt = CURRENT_TIMESTAMP(3)
     WHERE projectId = ?
       AND LOWER(REPLACE(areaKey, '-', '_')) IN (?)
       AND status IN ('OPEN', 'IN_REVIEW', 'IN_PROGRESS', 'PENDING', 'ADDRESSED')`,
    [projectId, matchKeys.map((k) => k.toLowerCase().replace(/-/g, "_"))]
  );
}

/**
 * When every current section step is approved but coverage still says Pending/In Review
 * (e.g. after SECTION_TOTAL_STEPS shrinks), promote coverage to APPROVED.
 */
export async function syncCoverageFromStepApprovals(
  projectId: number,
  submissionId: number,
  approvedSteps?: ProjectApprovedSteps
): Promise<boolean> {
  await ensureReviewTables();
  const steps = approvedSteps || (await getProjectApprovedSteps(projectId));
  const [covRows]: any = await pool.query(
    "SELECT id, areaKey, reviewerId, status FROM review_area_coverage WHERE submissionId = ?",
    [submissionId]
  );
  const [stepReviewerRows]: any = await pool.query(
    `SELECT sectionKey, reviewerId FROM review_step_approvals
     WHERE projectId = ? AND reviewerId IS NOT NULL
     ORDER BY approvedAt DESC`,
    [projectId]
  );
  const reviewerBySection: Partial<Record<"section1" | "section2" | "section3", number>> = {};
  for (const row of stepReviewerRows || []) {
    const sk = row.sectionKey as "section1" | "section2" | "section3";
    if (sk && !reviewerBySection[sk] && row.reviewerId) {
      reviewerBySection[sk] = Number(row.reviewerId);
    }
  }

  let healed = false;
  for (const sectionKey of ["section1", "section2", "section3"] as const) {
    const totalSteps = SECTION_TOTAL_STEPS[sectionKey];
    const validCount = countValidSectionSteps(steps[sectionKey], totalSteps);
    if (validCount < totalSteps) continue;

    const areaKey = SECTION_TO_AREA_MAP[sectionKey];
    const matchKeys = new Set(areaKeyMatchValues(areaKey).map((k) => k.toLowerCase().replace(/-/g, "_")));
    const cov = (covRows || []).find((r: any) =>
      matchKeys.has(String(r.areaKey || "").toLowerCase().replace(/-/g, "_"))
    );
    const covStatus = String(cov?.status || "").toUpperCase();
    if (covStatus === "APPROVED" || covStatus === "COMPLETED" || covStatus === "REVISION_REQUIRED") {
      continue;
    }

    const reviewerId =
      Number(cov?.reviewerId) ||
      reviewerBySection[sectionKey] ||
      null;
    if (!reviewerId) continue;

    await markAreaCoverageApproved({
      projectId,
      submissionId,
      areaKey,
      reviewerId,
      sectionKey,
      totalSteps,
    });
    healed = true;
  }

  if (healed) {
    await evaluateOverallApproval(submissionId, projectId);
  }
  return healed;
}

/**
 * Fetch persistent step approvals for a project from MySQL database.
 */
export async function getProjectApprovedSteps(projectId: number): Promise<ProjectApprovedSteps> {
  await ensureReviewTables();
  const [rows]: any = await pool.query(
    "SELECT sectionKey, stepNumber FROM review_step_approvals WHERE projectId = ? ORDER BY stepNumber ASC",
    [projectId]
  );
  const result: ProjectApprovedSteps = {
    section1: [],
    section2: [],
    section3: [],
  };
  for (const r of rows || []) {
    const k = r.sectionKey as keyof ProjectApprovedSteps;
    if (result[k] && !result[k].includes(Number(r.stepNumber))) {
      result[k].push(Number(r.stepNumber));
    }
  }
  return result;
}

/**
 * Toggle or explicitly set step approval in MySQL, automatically updating section & project statuses.
 */
export async function toggleStepApproval(
  projectId: number,
  sectionKey: "section1" | "section2" | "section3",
  stepNumber: number,
  reviewerId: number,
  explicitApproved?: boolean,
  submissionId?: number | null
): Promise<{
  approvedSteps: ProjectApprovedSteps;
  isStepApproved: boolean;
  sectionStatus: string;
  sectionApprovedPercent: number;
  overallApprovedPercent: number;
  overallStatus: string;
}> {
  await ensureReviewTables();

  // 1. Check if step is currently approved in DB
  const [existing]: any = await pool.query(
    "SELECT id FROM review_step_approvals WHERE projectId = ? AND sectionKey = ? AND stepNumber = ? LIMIT 1",
    [projectId, sectionKey, stepNumber]
  );
  const isCurrentlyApproved = existing && existing.length > 0;
  // Once approved, steps remain approved unless explicitly disapproved with explicitApproved === false
  const shouldApprove = explicitApproved !== undefined ? explicitApproved : true;

  // 2. Resolve submissionId if not provided
  let effectiveSubId = submissionId;
  if (!effectiveSubId) {
    const [subRows]: any = await pool.query(
      "SELECT id FROM review_submissions WHERE projectId = ? ORDER BY reviewRound DESC, id DESC LIMIT 1",
      [projectId]
    );
    effectiveSubId = subRows[0]?.id || null;
  }

  // 3. Persist change to review_step_approvals
  if (shouldApprove) {
    await pool.query(
      `INSERT INTO review_step_approvals (projectId, submissionId, sectionKey, stepNumber, reviewerId, approvedAt)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3))
       ON DUPLICATE KEY UPDATE reviewerId = VALUES(reviewerId), approvedAt = CURRENT_TIMESTAMP(3)`,
      [projectId, effectiveSubId, sectionKey, stepNumber, reviewerId]
    );
  } else {
    await pool.query(
      "DELETE FROM review_step_approvals WHERE projectId = ? AND sectionKey = ? AND stepNumber = ?",
      [projectId, sectionKey, stepNumber]
    );
  }

  // 4. Fetch updated step list for this section & project
  const allApproved = await getProjectApprovedSteps(projectId);
  const totalSteps = SECTION_TOTAL_STEPS[sectionKey];
  const secSteps = (allApproved[sectionKey] || []).filter(
    (n) => Number(n) >= 1 && Number(n) <= totalSteps
  );
  const approvedCount = new Set(secSteps.map(Number)).size;
  const isSectionFullyApproved = approvedCount >= totalSteps;
  const areaKey = SECTION_TO_AREA_MAP[sectionKey];

  // 5. Update section-level coverage & assignments in DB
  if (effectiveSubId && areaKey) {
    if (isSectionFullyApproved) {
      await markAreaCoverageApproved({
        projectId,
        submissionId: Number(effectiveSubId),
        areaKey,
        reviewerId,
        sectionKey,
        totalSteps,
      });
    } else {
      const matchKeys = areaKeyMatchValues(areaKey).map((k) =>
        k.toLowerCase().replace(/-/g, "_")
      );
      // Revert if previously approved but now missing steps
      await pool.query(
        `UPDATE review_area_coverage
         SET status = 'IN_REVIEW', reviewerId = ?, updatedAt = CURRENT_TIMESTAMP(3)
         WHERE submissionId = ? AND LOWER(REPLACE(areaKey, '-', '_')) IN (?) AND status = 'APPROVED'`,
        [reviewerId, effectiveSubId, matchKeys]
      );
      await pool.query(
        `UPDATE review_assignments
         SET status = 'IN_REVIEW', updatedAt = CURRENT_TIMESTAMP(3)
         WHERE submissionId = ? AND LOWER(REPLACE(specialtyNeeded, '-', '_')) IN (?) AND status = 'COMPLETED'`,
        [effectiveSubId, matchKeys]
      );
    }

    await evaluateOverallApproval(effectiveSubId, projectId);
  }

  const sectionApprovedPercent = Math.round((approvedCount / totalSteps) * 100);
  const p1 = Math.round(
    (countValidSectionSteps(allApproved.section1, SECTION_TOTAL_STEPS.section1) /
      SECTION_TOTAL_STEPS.section1) *
      100
  );
  const p2 = Math.round(
    (countValidSectionSteps(allApproved.section2, SECTION_TOTAL_STEPS.section2) /
      SECTION_TOTAL_STEPS.section2) *
      100
  );
  const p3 = Math.round(
    (countValidSectionSteps(allApproved.section3, SECTION_TOTAL_STEPS.section3) /
      SECTION_TOTAL_STEPS.section3) *
      100
  );
  const overallApprovedPercent = Math.round((p1 + p2 + p3) / 3);

  const sectionStatus = isSectionFullyApproved
    ? "Approved"
    : approvedCount > 0
      ? "In Review"
      : "Pending";
  const overallStatus = overallApprovedPercent === 100 ? "Approved" : "Under Review";

  return {
    approvedSteps: allApproved,
    isStepApproved: shouldApprove,
    sectionStatus,
    sectionApprovedPercent,
    overallApprovedPercent,
    overallStatus,
  };
}

/**
 * Mark all steps of a section as approved in MySQL when an entire section is approved.
 */
export async function approveAllSectionSteps(
  projectId: number,
  sectionKey: "section1" | "section2" | "section3",
  reviewerId: number,
  submissionId?: number | null
): Promise<ProjectApprovedSteps> {
  await ensureReviewTables();
  const total = SECTION_TOTAL_STEPS[sectionKey];

  let effectiveSubId = submissionId;
  if (!effectiveSubId) {
    const [subRows]: any = await pool.query(
      "SELECT id FROM review_submissions WHERE projectId = ? ORDER BY reviewRound DESC, id DESC LIMIT 1",
      [projectId]
    );
    effectiveSubId = subRows[0]?.id || null;
  }

  for (let s = 1; s <= total; s++) {
    await pool.query(
      `INSERT INTO review_step_approvals (projectId, submissionId, sectionKey, stepNumber, reviewerId, approvedAt)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3))
       ON DUPLICATE KEY UPDATE reviewerId = VALUES(reviewerId), approvedAt = CURRENT_TIMESTAMP(3)`,
      [projectId, effectiveSubId, sectionKey, s, reviewerId]
    );
  }

  const areaKey = SECTION_TO_AREA_MAP[sectionKey];
  if (effectiveSubId && areaKey) {
    await markAreaCoverageApproved({
      projectId,
      submissionId: Number(effectiveSubId),
      areaKey,
      reviewerId,
      sectionKey,
      totalSteps: total,
    });
    await evaluateOverallApproval(effectiveSubId, projectId);
  }

  return getProjectApprovedSteps(projectId);
}

export async function findReviewerForArea(areaKey: string, excludeUserId?: number): Promise<number | null> {
  const normKey = normalizeReviewAreaKey(areaKey);
  const params: any[] = [normKey];
  let excludeClause = "";
  if (excludeUserId) {
    excludeClause = "AND u.id != ?";
    params.push(excludeUserId);
  }

  const [rows]: any = await pool.query(
    `
    SELECT u.id
    FROM users u
    JOIN reviewer_profiles rp ON rp.userId = u.id
    JOIN professional_review_areas pra ON pra.userId = u.id
    WHERE u.role = 'REVIEWER'
      AND u.status = 'ACTIVE'
      AND rp.verificationStatus = 'VERIFIED'
      AND pra.areaKey = ?
      ${excludeClause}
    ORDER BY u.id ASC
    LIMIT 1
    `,
    params
  );
  if (rows[0]?.id) return Number(rows[0].id);
  return findDefaultExpertReviewerId();
}

/**
 * Returns all specialty keys assigned to a given reviewer account.
 */
export async function getReviewerSpecialties(userId: number): Promise<ExpertReviewAreaKey[]> {
  await ensureReviewTables();
  const [rows]: any = await pool.query(
    `SELECT areaKey FROM professional_review_areas WHERE userId = ? ORDER BY id ASC`,
    [userId]
  );
  const validKeys: ExpertReviewAreaKey[] = [];
  for (const r of rows) {
    const k = normalizeReviewAreaKeyOrNull(r.areaKey);
    if (k && !validKeys.includes(k)) {
      validKeys.push(k);
    }
  }
  return validKeys;
}

/**
 * Assigns one or multiple specialties to a reviewer account and updates reviewer_specialty_config.
 */
export async function setReviewerSpecialties(
  userId: number,
  areaKeys: string[],
  actorId?: number
): Promise<ExpertReviewAreaKey[]> {
  await ensureReviewTables();
  const normalized: ExpertReviewAreaKey[] = [];
  for (const raw of areaKeys) {
    const k = normalizeReviewAreaKeyOrNull(raw);
    if (k && !normalized.includes(k)) {
      normalized.push(k);
    }
  }

  await pool.query(
    `INSERT INTO reviewer_specialty_config (userId, configuredBy)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE configuredBy = VALUES(configuredBy), updatedAt = CURRENT_TIMESTAMP(3)`,
    [userId, actorId || userId]
  );

  await pool.query(`DELETE FROM professional_review_areas WHERE userId = ?`, [userId]);

  for (const k of normalized) {
    await pool.query(
      `INSERT IGNORE INTO professional_review_areas (userId, areaKey) VALUES (?, ?)`,
      [userId, k]
    );
  }

  return normalized;
}

/**
 * Enforces reviewer permissions:
 * 1. Researchers cannot review or approve their own research.
 * 2. Reviewers can only submit decisions for their assigned specialties.
 * 3. Completed APPROVED review decisions and locked submission versions cannot be modified.
 */
export async function assertReviewerPermissionForSpecialty(params: {
  reviewerId: number;
  projectId: number;
  submissionId: number;
  areaKey: string;
  requireUnlocked?: boolean;
}): Promise<{
  normAreaKey: ExpertReviewAreaKey;
  project: any;
  submission: any;
  assignedAreas: ExpertReviewAreaKey[];
}> {
  await ensureReviewTables();
  const normAreaKey = normalizeReviewAreaKey(params.areaKey);

  // 1. Check project & prevent self-review / self-approval
  const [projRows]: any = await pool.query(
    `SELECT id, title, researcherId, status FROM research_projects WHERE id = ? LIMIT 1`,
    [params.projectId]
  );
  if (projRows.length === 0) {
    const err: any = new Error("Research project not found.");
    err.status = 404;
    throw err;
  }
  const project = projRows[0];

  if (Number(project.researcherId) === Number(params.reviewerId)) {
    const err: any = new Error("Forbidden: Researchers cannot review or approve their own research.");
    err.status = 403;
    throw err;
  }

  // 2. Check assigned specialties for this reviewer account
  const assignedAreas = await getReviewerSpecialties(params.reviewerId);
  if (!assignedAreas.includes(normAreaKey)) {
    const err: any = new Error(
      `Forbidden: Your reviewer account is not assigned to the ${expertReviewAreaLabel(normAreaKey)} specialty.`
    );
    err.status = 403;
    throw err;
  }

  // 3. Check submission status & lock state
  const [subRows]: any = await pool.query(
    `SELECT id, projectId, versionTag, reviewRound, status, isLocked FROM review_submissions WHERE id = ? LIMIT 1`,
    [params.submissionId]
  );
  if (subRows.length === 0) {
    const err: any = new Error("Review submission version not found.");
    err.status = 404;
    throw err;
  }
  const submission = subRows[0];

  if (params.requireUnlocked) {
    if (
      Number(submission.isLocked) === 1 ||
      String(submission.status || "").toUpperCase() === "APPROVED"
    ) {
      const err: any = new Error(
        "Forbidden: This research submission version has already received final approval and is locked."
      );
      err.status = 409;
      throw err;
    }

    // Check if this specific specialty is already APPROVED for this submission version
    const [covRows]: any = await pool.query(
      `SELECT status FROM review_area_coverage WHERE submissionId = ? AND areaKey = ? LIMIT 1`,
      [params.submissionId, normAreaKey]
    );
    const [prRows]: any = await pool.query(
      `SELECT status, assessment FROM professional_reviews WHERE submissionId = ? AND areaKey = ? LIMIT 1`,
      [params.submissionId, normAreaKey]
    );

    const covStatus = String(covRows[0]?.status || "").toUpperCase();
    const prStatus = String(prRows[0]?.status || "").toUpperCase();
    const prAssessment = String(prRows[0]?.assessment || "").toUpperCase();

    if (covStatus === "APPROVED" && prStatus === "SUBMITTED" && prAssessment === "ACCEPTABLE") {
      const err: any = new Error(
        `Completed review decision locked: ${expertReviewAreaLabel(normAreaKey)} has already been approved for ${submission.versionTag || "this version"} and cannot be modified.`
      );
      err.status = 409;
      throw err;
    }
  }

  return {
    normAreaKey,
    project,
    submission,
    assignedAreas,
  };
}

/**
 * Builds the complete finalized scientific dossier snapshot across Sections 1–3.
 * This guarantees the exact scientific dossier snapshot is frozen at submission time.
 */
export async function buildFullDossierSnapshot(projectId: number): Promise<any> {
  // 1. Completion record
  const [compRows]: any = await pool.query(
    "SELECT * FROM research_completions WHERE projectId = ? LIMIT 1",
    [projectId]
  );
  const completion = compRows[0] || null;

  // 2. Plant data and Project details
  const [pRows]: any = await pool.query(
    `SELECT rp.*,
            COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
            p.scientificName as plantScientificName,
            p.category as plantCategory,
            p.botanical_synonyms as botanicalSynonyms,
            p.local_names as plantLocalNames,
            p.plant_parts_used as plantPartsUsed,
            p.source_organization as sourceOrganization,
            p.source_verified as sourceVerified,
            p.simpleUse as traditionalUses
     FROM research_projects rp
     LEFT JOIN plants p ON rp.plantId = p.id
     WHERE rp.id = ?
     LIMIT 1`,
    [projectId]
  );
  const project = pRows[0] || null;

  const [plantDataRows]: any = await pool.query(
    "SELECT * FROM research_plant_data WHERE projectId = ? LIMIT 1",
    [projectId]
  );
  const plantData = plantDataRows[0] || null;

  // V2 Tables: Product Selection, Materials, Batch Analyses, Manuscript, Targets, Dossier, In-Silico
  const [productSelectionRows]: any = await pool.query(
    "SELECT * FROM research_product_selections WHERE projectId = ? LIMIT 1",
    [projectId]
  );
  const productSelection = productSelectionRows[0] || null;

  const [materialsRows]: any = await pool.query(
    "SELECT * FROM research_materials WHERE projectId = ? ORDER BY id ASC",
    [projectId]
  );
  const materialsList = materialsRows || [];

  const [batchAnalysesRows]: any = await pool.query(
    "SELECT * FROM research_batch_analyses WHERE projectId = ? ORDER BY id ASC",
    [projectId]
  );
  const batchAnalysesList = batchAnalysesRows || [];

  const [manuscriptRows]: any = await pool.query(
    "SELECT * FROM research_manuscripts WHERE projectId = ? LIMIT 1",
    [projectId]
  );
  const manuscript = manuscriptRows[0] || null;

  const [targetRows]: any = await pool.query(
    "SELECT * FROM docking_targets WHERE projectId = ? ORDER BY id ASC",
    [projectId]
  );
  const targetList = targetRows || [];

  const [dossierRows]: any = await pool.query(
    "SELECT * FROM research_dossiers WHERE projectId = ? LIMIT 1",
    [projectId]
  );
  const dossier = dossierRows[0] || null;

  const [insilicoResultsRows]: any = await pool.query(
    "SELECT * FROM insilico_results WHERE projectId = ? ORDER BY id ASC",
    [projectId]
  );
  const insilicoResults = insilicoResultsRows || [];

  const [insilicoSynthRows]: any = await pool.query(
    "SELECT * FROM research_insilico_syntheses WHERE projectId = ? LIMIT 1",
    [projectId]
  );
  const insilicoSynthesis = insilicoSynthRows[0] || null;

  const [stage1SynthRows]: any = await pool.query(
    "SELECT * FROM research_literature_syntheses WHERE projectId = ? LIMIT 1",
    [projectId]
  );
  const stage1Synthesis = stage1SynthRows[0] || null;

  // 3. Literature References
  const [litRefs]: any = await pool.query(
    "SELECT * FROM literature_references WHERE projectId = ? ORDER BY year DESC, id DESC",
    [projectId]
  );

  // 4. Screened Compounds
  const [compounds]: any = await pool.query(
    "SELECT * FROM research_compounds WHERE projectId = ? ORDER BY selectedForDocking DESC, id ASC",
    [projectId]
  );

  // 5. Molecular Docking Runs
  const [dockingRuns]: any = await pool.query(
    `SELECT * FROM docking_runs
     WHERE projectId = ?
       AND jobStatus = 'COMPLETED'
       AND bindingAffinity IS NOT NULL
     ORDER BY CAST(bindingAffinity AS DECIMAL(10,3)) ASC, id DESC`,
    [projectId]
  );

  // 6. Formulations & Components
  let formulationsList: any[] = [];
  let allComponentsList: any[] = [];
  const [rForm]: any = await pool.query(
    "SELECT * FROM research_formulations WHERE projectId = ? ORDER BY id DESC LIMIT 1",
    [projectId]
  );
  const [directComponents]: any = await pool.query(
    "SELECT * FROM formulation_components WHERE projectId = ? ORDER BY id ASC",
    [projectId]
  );
  allComponentsList = directComponents || [];

  if (rForm.length > 0) {
    const [vRows]: any = await pool.query(
      "SELECT * FROM formulation_versions WHERE formulationId = ? AND isCurrentVersion = 1 LIMIT 1",
      [rForm[0].id]
    );
    let cRows: any[] = allComponentsList;
    let sRows: any[] = [];
    if (vRows.length > 0) {
      const [verCompRows]: any = await pool.query(
        "SELECT * FROM formulation_components WHERE versionId = ? ORDER BY id ASC",
        [vRows[0].id]
      );
      if (verCompRows.length > 0) cRows = verCompRows;
      const [verStepRows]: any = await pool.query(
        "SELECT * FROM formulation_steps WHERE versionId = ? ORDER BY stepNumber ASC",
        [vRows[0].id]
      );
      sRows = verStepRows;
    }
    formulationsList = [
      {
        id: vRows[0]?.id || rForm[0].id,
        formulationName: rForm[0].formulationName || productSelection?.formulationName || "Botanical Formulation",
        formulationType: rForm[0].formulationType || productSelection?.productType || "Topical Hydrogel",
        dosageFormType: rForm[0].dosageFormType || productSelection?.dosageForm || "Topical Hydrogel",
        versionNumber: vRows[0]?.versionNumber || 1,
        versionTag: vRows[0]?.versionTag || "v1.0",
        preparationMethod: sRows.map((s: any) => `${s.stepNumber}. ${s.procedureText}`).join("\n"),
        components: cRows.map((c: any) => ({
          id: c.id,
          componentName: c.componentName || c.name,
          quantity: c.quantity || c.percentage,
          unit: c.unit || "%",
          roleInFormulation: c.roleInFormulation || c.functionRole || c.role,
          concentration: c.concentration || c.percentage || null,
        })),
      },
    ];
  }

  const [safetyRows]: any = await pool.query(
    "SELECT * FROM research_safety_assessments WHERE projectId = ? ORDER BY id DESC LIMIT 1",
    [projectId]
  );
  const safetyRecord = safetyRows[0] || null;

  const [safetyConcerns]: any = await pool.query(
    `SELECT sc.*
     FROM safety_concerns sc
     JOIN research_safety_assessments rsa ON sc.safetyAssessmentId = rsa.id
     WHERE rsa.projectId = ?
     ORDER BY
       CASE sc.severity
         WHEN 'CRITICAL' THEN 1
         WHEN 'HIGH' THEN 2
         WHEN 'MODERATE' THEN 3
         ELSE 4
       END ASC`,
    [projectId]
  );

  let keyFindings: string[] = [];
  if (completion?.keyFindings) {
    try {
      keyFindings = typeof completion.keyFindings === "string" ? JSON.parse(completion.keyFindings) : completion.keyFindings;
    } catch {
      keyFindings = [completion.keyFindings];
    }
  }

  const resolvedPlantName =
    plantData?.commonName || project?.plantName || "Unspecified Plant";
  const resolvedScientificName =
    plantData?.scientificName || project?.plantScientificName || "";
  const resolvedFamily =
    plantData?.family ||
    (resolvedScientificName && PLANT_FAMILY_MAP[resolvedScientificName]) ||
    project?.plantCategory ||
    "";

  return {
    completionId: completion?.id || null,
    finalTitle: completion?.finalTitle || project?.title || "Research Dossier",
    abstract: completion?.abstract || dossier?.executiveSummary || project?.shortDescription || "",
    executiveSummary: dossier?.executiveSummary || completion?.abstract || "",
    evidenceAlignment: completion?.evidenceAlignment || "",
    keyFindings: Array.isArray(keyFindings) ? keyFindings : [],
    scientificInterpretation:
      insilicoSynthesis?.keyFindings ||
      completion?.scientificInterpretation ||
      completion?.biologicalInterpretation ||
      "",
    limitations:
      insilicoSynthesis?.potentialLimitations ||
      completion?.limitations ||
      completion?.evidenceGaps ||
      "",
    finalConclusion: completion?.conclusion || "",
    isSynthesisApproved: Boolean(
      completion?.isSynthesisApproved ||
        (completion?.isInterpretationApproved && completion?.isConclusionApproved)
    ),
    // Botanical & Plant Data
    plantName: resolvedPlantName,
    plantScientificName: resolvedScientificName,
    plantFamily: resolvedFamily,
    plantLocalNames: plantData?.localNames || project?.plantLocalNames || "",
    plantPartsStudied: plantData?.partsStudied || plantData?.plantPart || project?.plantPartsUsed || "Leaves",
    botanicalSynonyms: project?.botanicalSynonyms || "",
    sourceOrganization:
      project?.sourceOrganization ||
      "Philippine Institute of Traditional and Alternative Health Care (PITAHC)",
    sourceVerified: Boolean(project?.sourceVerified || project?.plantId),
    specimenSource: plantData?.specimenSource || "",
    collectionDate: plantData?.collectionDate || "",
    collectionLocation: plantData?.collectionLocation || "",
    voucherSpecimenNumber: plantData?.voucherSpecimenNumber || "",
    sampleIdentifier: plantData?.sampleIdentifier || "",
    authenticationMethod:
      plantData?.authenticationMethod || "Macro-morphological & Taxonomic Key",
    authenticatedBy: plantData?.authenticatedBy || "",
    selectionRationale: plantData?.selectionRationale || "",
    materialType: plantData?.materialType || "Crude Extract",
    extractionMethod:
      plantData?.extractionMethod || "Cold Maceration with Rotary Evaporation",
    extractionSolvent: plantData?.extractionSolvent || "80% Aqueous Ethanol",
    extractFractionName: plantData?.extractFractionName || "",
    storageHandlingNotes: plantData?.storageHandlingNotes || "",
    authenticationStatus: plantData?.authenticationStatus || "VERIFIED",
    plantData,
    stage1Synthesis: stage1Synthesis
      ? {
          keyFindings: stage1Synthesis.keyFindings || "",
          areasOfAgreement: stage1Synthesis.areasOfAgreement || "",
          conflictingFindings: stage1Synthesis.conflictingFindings || "",
          evidenceLimitations: stage1Synthesis.evidenceLimitations || "",
          remainingGaps: stage1Synthesis.remainingGaps || "",
          relevanceToQuestion: stage1Synthesis.relevanceToQuestion || "",
        }
      : null,
    // Comprehensive V2 Arrays
    literature: litRefs || [],
    compounds: compounds || [],
    insilicoResults,
    insilicoSynthesis,
    dockingRuns: dockingRuns || [],
    dockingTargets: targetList,
    targets: targetList,
    formulations: formulationsList,
    components: allComponentsList,
    productSelection,
    materials: materialsList,
    batchAnalyses: batchAnalysesList,
    manuscript,
    dossier,
    safetyRecord,
    safetyConcerns: safetyConcerns || [],
    section1: {
      plantData,
      productSelection,
      materials: materialsList,
      formulations: rForm[0] || formulationsList[0] || null,
      components: allComponentsList,
      batchAnalyses: batchAnalysesList,
    },
    section2: {
      compounds: compounds || [],
      targets: targetList,
      dockingRuns: dockingRuns || [],
      insilicoResults,
      insilicoSynthesis,
    },
    section3: {
      dossier,
      literature: litRefs || [],
      manuscript,
    },
    stages: {
      stage1: {
        label: "Plant & Literature",
        count: litRefs.length,
        unit: "Supporting Studies",
      },
      stage2: {
        label: "In-Silico Analysis",
        count: compounds.length,
        unit: "Compounds Screened",
      },
      stage3: {
        label: "Molecular Docking",
        count: dockingRuns.length,
        unit: "Docking Runs",
      },
      stage4: {
        label: "Formulation Science",
        prototype:
          formulationsList[0]?.formulationName ||
          productSelection?.formulationName ||
          "Botanical Formulation",
        dosageForm:
          formulationsList[0]?.dosageFormType ||
          productSelection?.productType ||
          "Topical Hydrogel",
      },
      stage5: {
        label: "Research Integration",
        status: dossier || completion ? "Summary Ready" : "Complete",
      },
    },
  };
}

/**
 * Computes a deterministic JSON digest for a specific specialty's scientific domain
 * so we can detect whether a specialty's section was modified between submission rounds.
 */
export function computeSpecialtyDomainDigest(
  areaKey: ExpertReviewAreaKey,
  snapshot: any
): string {
  if (!snapshot) return "";
  const s1 = snapshot.section1 || {};
  const s2 = snapshot.section2 || {};
  const s3 = snapshot.section3 || {};

  const plantData = s1.plantData || snapshot.plantData || {};
  const materials = s1.materials || snapshot.materials || [];
  const literature = s3.literature || snapshot.literature || [];
  const productSelection = s1.productSelection || snapshot.productSelection || {};
  const formulations = s1.formulations || (snapshot.formulations && snapshot.formulations[0]) || {};
  const components = s1.components || snapshot.components || (formulations?.components) || [];
  const batchAnalyses = s1.batchAnalyses || snapshot.batchAnalyses || [];
  const compounds = s2.compounds || snapshot.compounds || [];
  const insilicoResults = s2.insilicoResults || snapshot.insilicoResults || [];
  const targets = s2.targets || snapshot.targets || snapshot.dockingTargets || [];
  const dockingRuns = s2.dockingRuns || snapshot.dockingRuns || [];
  const insilicoSynthesis = s2.insilicoSynthesis || snapshot.insilicoSynthesis || {};
  const safetyRecord = snapshot.safetyRecord || {};
  const safetyConcerns = snapshot.safetyConcerns || [];

  switch (areaKey) {
    case "formulation":
      return JSON.stringify({
        plantName: snapshot.plantName || plantData.commonName || "",
        scientificName: snapshot.plantScientificName || plantData.scientificName || "",
        family: snapshot.plantFamily || plantData.family || "",
        partsStudied: plantData.partsStudied || plantData.plantPart || snapshot.plantPartsStudied || "",
        extractionMethod: plantData.extractionMethod || snapshot.extractionMethod || "",
        extractionSolvent: plantData.extractionSolvent || snapshot.extractionSolvent || "",
        materialType: plantData.materialType || snapshot.materialType || "",
        voucherSpecimenNumber: plantData.voucherSpecimenNumber || snapshot.voucherSpecimenNumber || "",
        productType: productSelection?.productType || formulations?.formulationType || "",
        dosageForm:
          productSelection?.deliveryFormat ||
          productSelection?.dosageForm ||
          formulations?.dosageFormType ||
          "",
        formulationName:
          productSelection?.formulationName || formulations?.formulationName || "",
        components: (Array.isArray(components) ? components : []).map((c: any) => ({
          name: c.componentName || c.name || "",
          qty: c.quantity || c.percentage || "",
          unit: c.unit || "",
          role: c.roleInFormulation || c.functionRole || c.role || "",
        })),
        batches: (Array.isArray(batchAnalyses) ? batchAnalyses : []).map((b: any) => ({
          code: b.batchNumber || b.batchCode || "",
          conc: b.activeConcentrationPercent ?? b.concentrationPercent ?? "",
          ph: b.pH ?? b.phValue ?? b.ph ?? "",
          visc: b.viscosity ?? b.viscosityCps ?? "",
          sim: b.status ?? b.isSimulated ?? "",
        })),
        materials: (Array.isArray(materials) ? materials : []).map((m: any) => ({
          name: m.materialName || m.name || m.itemName || "",
          cat: m.materialType || m.category || "",
          qty: m.quantityAvailable ?? m.quantity ?? m.amount ?? "",
          unit: m.unit || "",
        })),
        literature: (Array.isArray(literature) ? literature : []).map((l: any) => ({
          title: l.title || "",
          doi: l.doi || "",
          year: l.year || "",
        })),
      });

    case "bioinformatics":
      return JSON.stringify({
        compounds: (Array.isArray(compounds) ? compounds : []).map((c: any) => ({
          name: c.compoundName || c.name || "",
          smiles: c.smiles || c.canonicalSmiles || "",
          formula: c.molecularFormula || "",
          mw: c.molecularWeight || "",
          selected: Boolean(c.selectedForDocking),
          logP: c.logP ?? "",
          tpsa: c.tpsa ?? "",
          violations: c.lipinskiViolations ?? "",
        })),
        targets: (Array.isArray(targets) ? targets : []).map((t: any) => ({
          name: t.targetName || t.proteinName || "",
          pdb: t.pdbId || "",
        })),
        runs: (Array.isArray(dockingRuns) ? dockingRuns : []).map((r: any) => ({
          compound: r.ligandName || r.compoundName || r.compoundId || "",
          target: r.targetProtein || r.targetName || r.pdbId || "",
          affinity: Number(r.bindingAffinity ?? r.affinity ?? 0).toFixed(3),
        })),
        insilico: (Array.isArray(insilicoResults) ? insilicoResults : []).map((r: any) => ({
          cid: r.compoundId || "",
          mw: r.molecularWeight || "",
          logP: r.logP || "",
          violations: r.lipinskiViolations || "",
        })),
      });

    case "pharmacology":
      return JSON.stringify({
        keyFindings: (insilicoSynthesis?.keyFindings || snapshot.scientificInterpretation || "").trim(),
        safety: {
          status: safetyRecord?.safetyStatus || "",
          contra: safetyRecord?.contraindications || "",
          inter: safetyRecord?.drugInteractions || "",
          prec: safetyRecord?.precautions || "",
          notes: safetyRecord?.additionalSafetyNotes || "",
        },
        concerns: (Array.isArray(safetyConcerns) ? safetyConcerns : []).map((sc: any) => ({
          title: sc.title || "",
          sev: sc.severity || "",
        })),
        limitations: (insilicoSynthesis?.potentialLimitations || snapshot.limitations || "").trim(),
      });
  }
}

/**
 * Compares previous and new snapshots across all 5 specialties.
 */
export function compareSubmissionSnapshots(
  prevSnapshot: any,
  newSnapshot: any,
  explicitModifiedAreas?: string[]
): {
  changedAreas: ExpertReviewAreaKey[];
  unchangedAreas: ExpertReviewAreaKey[];
  summaryModified: boolean;
  manuscriptModified: boolean;
  changeDescriptions: Array<{ areaKey: string; label: string; description: string }>;
} {
  const explicitSet = new Set(
    (explicitModifiedAreas || [])
      .map((a) => normalizeReviewAreaKeyOrNull(a))
      .filter((a): a is ExpertReviewAreaKey => Boolean(a))
  );

  const changedAreas: ExpertReviewAreaKey[] = [];
  const unchangedAreas: ExpertReviewAreaKey[] = [];
  const changeDescriptions: Array<{ areaKey: string; label: string; description: string }> = [];

  for (const area of EXPERT_REVIEW_AREAS) {
    const prevDigest = computeSpecialtyDomainDigest(area.key, prevSnapshot);
    const newDigest = computeSpecialtyDomainDigest(area.key, newSnapshot);
    const isChanged =
      explicitSet.has(area.key) || (Boolean(prevSnapshot) && prevDigest !== newDigest);

    if (isChanged) {
      changedAreas.push(area.key);
      changeDescriptions.push({
        areaKey: area.key,
        label: area.label,
        description: `${area.label} scientific data was updated in this revision.`,
      });
    } else {
      unchangedAreas.push(area.key);
    }
  }

  const prevSummary =
    prevSnapshot?.section3?.dossier?.executiveSummary ||
    prevSnapshot?.dossier?.executiveSummary ||
    prevSnapshot?.executiveSummary ||
    "";
  const newSummary =
    newSnapshot?.section3?.dossier?.executiveSummary ||
    newSnapshot?.dossier?.executiveSummary ||
    newSnapshot?.executiveSummary ||
    "";
  const summaryModified = Boolean(prevSnapshot) && prevSummary.trim() !== newSummary.trim();

  const prevMs = prevSnapshot?.section3?.manuscript || prevSnapshot?.manuscript || {};
  const newMs = newSnapshot?.section3?.manuscript || newSnapshot?.manuscript || {};
  const manuscriptModified =
    Boolean(prevSnapshot) &&
    (prevMs?.fileName !== newMs?.fileName ||
      prevMs?.fileSize !== newMs?.fileSize ||
      prevMs?.updatedAt !== newMs?.updatedAt);

  return {
    changedAreas,
    unchangedAreas,
    summaryModified,
    manuscriptModified,
    changeDescriptions,
  };
}

export async function openExpertReviewCycle(input: {
  projectId: number;
  researcherId: number;
  message?: string | null;
  previousSubmissionId?: number | null;
  snapshotData?: any;
  modifiedAreas?: string[];
}) {
  await ensureReviewTables();

  const [subRows]: any = await pool.query(
    "SELECT id, versionTag, reviewRound, snapshotData FROM review_submissions WHERE projectId = ? ORDER BY reviewRound DESC, id DESC LIMIT 1",
    [input.projectId]
  );
  const prevSub = subRows[0] || null;
  const reviewRound = prevSub ? Number(prevSub.reviewRound || 1) + 1 : 1;
  const previousSubmissionId = input.previousSubmissionId ?? (prevSub?.id || null);
  const versionTag = `v${reviewRound}.0`;

  // Ensure full rich snapshot
  const fullSnapshot = await buildFullDossierSnapshot(input.projectId);
  const snapshotPayload: any = input.snapshotData
    ? { ...fullSnapshot, ...input.snapshotData }
    : fullSnapshot;

  // Parse previous snapshot for change detection & version comparison when reviewRound > 1
  let prevSnapshot: any = null;
  const prevCoverageByArea: Record<string, any> = {};
  const prevReviewByArea: Record<string, any> = {};

  if (reviewRound > 1 && previousSubmissionId) {
    try {
      prevSnapshot =
        typeof prevSub?.snapshotData === "string"
          ? JSON.parse(prevSub.snapshotData)
          : prevSub?.snapshotData || null;
    } catch {
      prevSnapshot = null;
    }

    const [prevCovRows]: any = await pool.query(
      `SELECT * FROM review_area_coverage WHERE submissionId = ?`,
      [previousSubmissionId]
    );
    for (const row of prevCovRows) {
      prevCoverageByArea[normalizeReviewAreaKey(row.areaKey)] = row;
    }

    const [prevPrRows]: any = await pool.query(
      `SELECT * FROM professional_reviews WHERE submissionId = ?`,
      [previousSubmissionId]
    );
    for (const row of prevPrRows) {
      prevReviewByArea[normalizeReviewAreaKey(row.areaKey)] = row;
    }
  }

  const diffResult =
    reviewRound > 1 && prevSnapshot
      ? compareSubmissionSnapshots(prevSnapshot, snapshotPayload, input.modifiedAreas)
      : {
          changedAreas: [] as ExpertReviewAreaKey[],
          unchangedAreas: EXPERT_REVIEW_AREAS.map((a) => a.key),
          summaryModified: false,
          manuscriptModified: false,
          changeDescriptions: [],
        };

  const retainedApprovedAreas: ExpertReviewAreaKey[] = [];
  const requiresReviewAreas: ExpertReviewAreaKey[] = [];

  for (const area of EXPERT_REVIEW_AREAS) {
    if (reviewRound > 1 && previousSubmissionId) {
      const prevCov = prevCoverageByArea[area.key];
      const prevPr = prevReviewByArea[area.key];
      const wasApproved =
        String(prevCov?.status || "").toUpperCase() === "APPROVED" &&
        (!prevPr || String(prevPr.assessment || "").toUpperCase() === "ACCEPTABLE");
      const didChange = diffResult.changedAreas.includes(area.key);

      if (wasApproved && !didChange) {
        retainedApprovedAreas.push(area.key);
      } else {
        requiresReviewAreas.push(area.key);
      }
    } else {
      requiresReviewAreas.push(area.key);
    }
  }

  snapshotPayload.versionComparison = {
    reviewRound,
    versionTag,
    previousSubmissionId: reviewRound > 1 ? previousSubmissionId : null,
    previousVersionTag: reviewRound > 1 ? prevSub?.versionTag || `v${reviewRound - 1}.0` : null,
    changedAreas: diffResult.changedAreas,
    unchangedAreas: diffResult.unchangedAreas,
    retainedApprovedAreas,
    requiresReviewAreas,
    summaryModified: diffResult.summaryModified,
    manuscriptModified: diffResult.manuscriptModified,
    changeDescriptions: diffResult.changeDescriptions,
    comparedAt: new Date().toISOString(),
  };

  const snapshotJson = JSON.stringify(snapshotPayload);

  // Find a default reviewer (never the researcher themselves if another reviewer exists)
  const defaultReviewerId = await findDefaultExpertReviewerId();
  if (!defaultReviewerId) {
    throw new Error("No verified expert reviewer account is available in the platform.");
  }

  // 1. Create review_submission snapshot
  const [insertRes]: any = await pool.query(
    `
    INSERT INTO review_submissions (
      projectId, versionTag, reviewRound, messageToReviewers, readinessSnapshot, snapshotData,
      previousSubmissionId, assignedReviewerId, status, isLocked, submittedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'UNDER_REVIEW', 0, CURRENT_TIMESTAMP(3))
    `,
    [
      input.projectId,
      versionTag,
      reviewRound,
      input.message?.trim() || null,
      JSON.stringify({
        areas: EXPERT_REVIEW_AREAS.map((a) => a.key),
        retainedApprovedAreas,
        requiresReviewAreas,
      }),
      snapshotJson,
      reviewRound === 1 ? null : previousSubmissionId,
      defaultReviewerId,
    ]
  );
  const submissionId = insertRes.insertId;

  // Mark any AI review summaries from older submission versions as superseded (preserving them in audit history)
  try {
    await pool.query(
      `UPDATE review_ai_summaries
       SET isCurrentVersion = 0
       WHERE projectId = ? AND submissionId != ?`,
      [input.projectId, submissionId]
    );
  } catch (e) {
    console.warn("Could not mark older review_ai_summaries as superseded:", e);
  }

  // 2. Create assignments & coverage for all 5 professional specialties
  for (const area of EXPERT_REVIEW_AREAS) {
    const reviewerId =
      (await findReviewerForArea(area.key, input.researcherId)) || defaultReviewerId;
    const isRetainedApproval = retainedApprovedAreas.includes(area.key);
    const prevPr = prevReviewByArea[area.key];

    const initialAssignmentStatus = isRetainedApproval ? "COMPLETED" : "PENDING";
    const initialCoverageStatus = isRetainedApproval ? "APPROVED" : "PENDING";
    const initialSectionStatus = isRetainedApproval ? "REVIEWED" : "NOT_REVIEWED";

    // Create review_assignment row
    const [assignRes]: any = await pool.query(
      `
      INSERT INTO review_assignments (
        projectId, submissionId, reviewerId, specialtyNeeded, status, reviewRound, assignedAt, completedAt
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), ${isRetainedApproval ? "CURRENT_TIMESTAMP(3)" : "NULL"})
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        reviewerId = VALUES(reviewerId),
        completedAt = VALUES(completedAt),
        updatedAt = CURRENT_TIMESTAMP(3)
      `,
      [input.projectId, submissionId, reviewerId, area.key, initialAssignmentStatus, reviewRound]
    );
    const assignmentId = assignRes.insertId || null;

    // Create review_area_coverage row
    await pool.query(
      `
      INSERT INTO review_area_coverage (submissionId, projectId, areaKey, reviewerId, status)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE status = VALUES(status), reviewerId = VALUES(reviewerId), updatedAt = CURRENT_TIMESTAMP(3)
      `,
      [submissionId, input.projectId, area.key, reviewerId, initialCoverageStatus]
    );

    // Create review_section_status row
    await pool.query(
      `
      INSERT INTO review_section_status (submissionId, reviewerId, sectionKey, status)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE status = VALUES(status)
      `,
      [submissionId, reviewerId, area.key, initialSectionStatus]
    );

    if (isRetainedApproval) {
      const retainedReviewerId = prevPr?.reviewerId || reviewerId;
      const retainedComments =
        prevPr?.comments ||
        `Approved in previous version (${prevSub?.versionTag || `v${reviewRound - 1}.0`}). Unchanged section approval retained.`;
      await pool.query(
        `
        INSERT INTO professional_reviews (
          assignmentId, submissionId, projectId, reviewerId, areaKey, reviewCycle,
          assessment, comments, checklistData, status, submittedAt
        ) VALUES (?, ?, ?, ?, ?, ?, 'ACCEPTABLE', ?, ?, 'SUBMITTED', ?)
        ON DUPLICATE KEY UPDATE
          assessment = 'ACCEPTABLE',
          comments = VALUES(comments),
          status = 'SUBMITTED',
          submittedAt = VALUES(submittedAt),
          updatedAt = CURRENT_TIMESTAMP(3)
        `,
        [
          assignmentId,
          submissionId,
          input.projectId,
          retainedReviewerId,
          area.key,
          reviewRound,
          retainedComments,
          prevPr?.checklistData || null,
          prevPr?.submittedAt || new Date(),
        ]
      );
    } else {
      // Seed draft in professional_reviews
      await pool.query(
        `
        INSERT INTO professional_reviews (
          assignmentId, submissionId, projectId, reviewerId, areaKey, reviewCycle, status
        ) VALUES (?, ?, ?, ?, ?, ?, 'DRAFT')
        ON DUPLICATE KEY UPDATE status = 'DRAFT', assessment = NULL, updatedAt = CURRENT_TIMESTAMP(3)
        `,
        [assignmentId, submissionId, input.projectId, reviewerId, area.key, reviewRound]
      );
    }
  }

  // Update research project stages
  await pool.query(
    `
    UPDATE research_project_stages
    SET status = 'UNDER_REVIEW', updatedAt = CURRENT_TIMESTAMP(3)
    WHERE projectId = ? AND (stageKey = 'expert-review' OR stageKey = 'review')
    `,
    [input.projectId]
  );

  await pool.query(
    `
    UPDATE research_projects
    SET status = 'UNDER_REVIEW', currentStage = 'expert-review', updatedAt = CURRENT_TIMESTAMP(3)
    WHERE id = ?
    `,
    [input.projectId]
  );

  await pool.query(
    `
    INSERT INTO research_activity_logs (projectId, researcherId, actionType, description)
    VALUES (?, ?, 'STAGE_SUBMITTED', ?)
    `,
    [
      input.projectId,
      input.researcherId,
      `Submitted research dossier (${versionTag}, Cycle ${reviewRound}) for Multidisciplinary Professional Review`,
    ]
  );

  return {
    submissionId,
    reviewRound,
    versionTag,
    retainedApprovedAreas,
    requiresReviewAreas,
    changedAreas: diffResult.changedAreas,
  };
}

export async function syncCoverageStatus(
  submissionId: number,
  reviewerId: number,
  areaKey: string,
  status: string
) {
  try {
    const normKey = normalizeReviewAreaKey(areaKey);
    await pool.query(
      `
      UPDATE review_area_coverage
      SET status = ?, updatedAt = CURRENT_TIMESTAMP(3)
      WHERE submissionId = ? AND areaKey = ? AND reviewerId = ?
      `,
      [status, submissionId, normKey, reviewerId]
    );
  } catch (err) {
    console.error("syncCoverageStatus error:", err);
  }
}

/**
 * Checks overall project approval across all 3 professional reviewer roles (1 role per section).
 * A research project is marked Approved ONLY when all 3 roles have approved
 * the same final research version.
 */
export async function evaluateOverallApproval(submissionId: number, projectId: number) {
  await ensureReviewTables();

  const [coverageRows]: any = await pool.query(
    "SELECT areaKey, reviewerId, status, updatedAt FROM review_area_coverage WHERE submissionId = ?",
    [submissionId]
  );

  // Group by normalized area key to handle both 3-role schema and any legacy 5-area records
  const coverageByNormalizedArea = new Map<string, any>();
  for (const r of coverageRows) {
    const norm = normalizeReviewAreaKey(r.areaKey);
    const existing = coverageByNormalizedArea.get(norm);
    if (!existing || r.status === "APPROVED" || r.status === "COMPLETED") {
      coverageByNormalizedArea.set(norm, r);
    }
  }

  const normalizedRows = Array.from(coverageByNormalizedArea.values());
  const approvedCount = normalizedRows.filter(
    (r: any) => r.status === "APPROVED" || r.status === "COMPLETED"
  ).length;
  const revisionCount = normalizedRows.filter((r: any) => r.status === "REVISION_REQUIRED").length;
  const inReviewCount = normalizedRows.filter((r: any) => r.status === "IN_REVIEW").length;

  const allApproved =
    coverageByNormalizedArea.size >= EXPERT_REVIEW_AREAS.length &&
    approvedCount >= EXPERT_REVIEW_AREAS.length;

  let finalApprovalSummary: any = null;

  if (allApproved) {
    // Fetch submission info and all 3 professional reviews for the Final Approval Summary
    const [subRows]: any = await pool.query(
      `SELECT id, versionTag, reviewRound, submittedAt FROM review_submissions WHERE id = ? LIMIT 1`,
      [submissionId]
    );
    const subInfo = subRows[0] || { versionTag: "v1.0", reviewRound: 1 };

    const [prRows]: any = await pool.query(
      `
      SELECT pr.*, u.name as reviewerName
      FROM professional_reviews pr
      LEFT JOIN users u ON pr.reviewerId = u.id
      WHERE pr.submissionId = ?
      `,
      [submissionId]
    );
    const prByArea: Record<string, any> = {};
    for (const r of prRows) {
      prByArea[normalizeReviewAreaKey(r.areaKey)] = r;
    }

    const approvedAtIso = new Date().toISOString();
    finalApprovalSummary = {
      submissionId,
      projectId,
      approvedVersionTag: subInfo.versionTag || "v1.0",
      reviewRound: subInfo.reviewRound || 1,
      approvedAt: approvedAtIso,
      isLocked: true,
      specialties: EXPERT_REVIEW_AREAS.map((area) => {
        const pr = prByArea[area.key];
        const cov = coverageByNormalizedArea.get(area.key);
        return {
          areaKey: area.key,
          order: area.order,
          specialtyLabel: area.label,
          professionTitle: area.professionTitle,
          sectionTitle: area.sectionTitle,
          reviewerId: pr?.reviewerId || cov?.reviewerId || null,
          reviewerName: pr?.reviewerName || expertProfessionTitle(area.key),
          decision: "APPROVED",
          comments: pr?.comments || "Approved for scientific rigor and documentation completeness.",
          approvedAt: pr?.submittedAt
            ? new Date(pr.submittedAt).toISOString()
            : cov?.updatedAt
            ? new Date(cov.updatedAt).toISOString()
            : approvedAtIso,
        };
      }),
      regulatoryDisclaimer:
        "Professional peer review approval on NatureAide confirms internal scientific documentation and computational methodology across all 3 sections. It does NOT constitute clinical validation, empirical efficacy proof, or FDA/regulatory approval.",
    };

    const summaryJson = JSON.stringify(finalApprovalSummary);

    // 1. Lock the approved research version & store final approval summary
    await pool.query(
      `UPDATE review_submissions
       SET status = 'APPROVED',
           isLocked = 1,
           finalApprovalSummary = ?,
           reviewedAt = CURRENT_TIMESTAMP(3)
       WHERE id = ?`,
      [summaryJson, submissionId]
    );

    // 2. Update research_dossiers and research_projects to APPROVED (do NOT auto-mark COMPLETED)
    await pool.query(
      `UPDATE research_dossiers SET status = 'APPROVED', updatedAt = CURRENT_TIMESTAMP(3) WHERE projectId = ?`,
      [projectId]
    );
    await pool.query(
      `UPDATE research_projects
       SET status = 'APPROVED', currentStage = 'submission', progressPercent = 95, updatedAt = CURRENT_TIMESTAMP(3)
       WHERE id = ? AND status != 'COMPLETED'`,
      [projectId]
    );

    const [pRows]: any = await pool.query(
      "SELECT researcherId, COALESCE(p.commonName, rp.plantCustomName, 'Botanical Subject') as plantName FROM research_projects rp LEFT JOIN plants p ON rp.plantId = p.id WHERE rp.id = ? LIMIT 1",
      [projectId]
    );
    const researcherId = pRows[0]?.researcherId || 2;
    const plantName = pRows[0]?.plantName || "Botanical Research";

    // 3. Notify researcher (idempotent)
    const notifTitle = `Final Multidisciplinary Approval (${subInfo.versionTag || "v1.0"})`;
    const [notifExists]: any = await pool.query(
      "SELECT id FROM review_notifications WHERE userId = ? AND title = ? AND link LIKE ? LIMIT 1",
      [researcherId, notifTitle, `%/projects/${projectId}%`]
    );

    if (notifExists.length === 0) {
      await pool.query(
        `INSERT INTO review_notifications (userId, type, title, message, link, isRead, createdAt)
         VALUES (?, 'ACCEPTED_FOR_NEXT_STAGE', ?, ?, ?, 0, CURRENT_TIMESTAMP(3))`,
        [
          researcherId,
          notifTitle,
          `${plantName} (${subInfo.versionTag || "v1.0"}): All 3 professional review roles have approved your research dossier (Section 1, 2, and 3). Open Step 4 (Professional Approval & Completion) to officially Complete Research.`,
          `/researcher/projects/${projectId}/submission?step=4`,
        ]
      );
    }

    await pool.query(
      `INSERT INTO research_activity_logs (projectId, researcherId, actionType, description)
       VALUES (?, ?, 'PROJECT_APPROVED', ?)`,
      [
        projectId,
        researcherId,
        `All 3 professional reviewer roles approved research version ${subInfo.versionTag || "v1.0"}. Final dossier locked.`,
      ]
    );

    await pool.query(
      `INSERT INTO review_activity_logs (projectId, submissionId, actorId, actorRole, actionType, description)
       VALUES (?, ?, ?, 'SYSTEM', 'FINAL_PROJECT_APPROVED', ?)`,
      [
        projectId,
        submissionId,
        researcherId,
        `Final approval achieved across all 3 professional reviewer roles for ${subInfo.versionTag || "v1.0"}. Submission locked.`,
      ]
    );
  } else if (revisionCount > 0) {
    // At least one area requested revision
    await pool.query(
      `UPDATE review_submissions SET status = 'REVISION_REQUESTED', reviewedAt = CURRENT_TIMESTAMP(3) WHERE id = ?`,
      [submissionId]
    );
    await pool.query(
      `UPDATE research_dossiers SET status = 'REVISION_REQUESTED', updatedAt = CURRENT_TIMESTAMP(3) WHERE projectId = ?`,
      [projectId]
    );
    await pool.query(
      `UPDATE research_project_stages SET status = 'REVISION_REQUESTED', updatedAt = CURRENT_TIMESTAMP(3)
       WHERE projectId = ? AND (stageKey = 'expert-review' OR stageKey = 'review')`,
      [projectId]
    );
    await pool.query(
      `UPDATE research_projects SET status = 'REVISION_REQUIRED', currentStage = 'expert-review', updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?`,
      [projectId]
    );
  } else if (inReviewCount > 0 || approvedCount > 0) {
    await pool.query(
      `UPDATE review_submissions SET status = 'UNDER_REVIEW' WHERE id = ?`,
      [submissionId]
    );
    await pool.query(
      `UPDATE research_projects SET status = 'UNDER_REVIEW', currentStage = 'expert-review', updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?`,
      [projectId]
    );
  }

  return {
    totalAreas: coverageRows.length,
    approvedCount,
    revisionCount,
    inReviewCount,
    allApproved,
    finalApprovalSummary,
  };
}
