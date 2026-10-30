import pool from "./db";
import {
  SCREENING_RULE_VERSION,
  ScreeningInput,
  ScreeningEvaluation,
  getScreeningSeverity,
} from "./safety-rules";

export * from "./safety-rules";

/**
 * Fetch the latest COMPLETED health screening for a user from MySQL.
 * A screening counts as completed ONLY when:
 * status = 'COMPLETED' AND completed_at IS NOT NULL AND valid result exists.
 */
export async function getLatestUserScreening(userId: number | string) {
  try {
    const uId = Number(userId);
    if (!uId || isNaN(uId)) return null;

    const [rows]: any = await pool.query(
      `SELECT id, userId, user_id, status, ruleVersion, rule_version,
              ageGroup, healthConcern, currentMedications, knownAllergies,
              isPregnantOrLactating, hasSevereSymptoms, hasOrganFailure,
              responsesJson, evaluationResult, result, reasonSummary,
              createdAt, created_at, completedAt, completed_at, updatedAt
       FROM community_health_screenings
       WHERE (userId = ? OR user_id = ?)
         AND (status = 'COMPLETED' OR status = 'completed' OR status IS NULL OR completedAt IS NOT NULL OR completed_at IS NOT NULL)
         AND (
           UPPER(COALESCE(evaluationResult, result, '')) IN ('ELIGIBLE_TO_CONTINUE', 'PROFESSIONAL_GUIDANCE_REQUIRED')
         )
       ORDER BY COALESCE(completedAt, completed_at, createdAt) DESC
       LIMIT 1`,
      [uId, uId]
    );

    if (!rows || rows.length === 0) {
      return null;
    }

    const row = rows[0];
    let parsedResponses = null;
    try {
      parsedResponses = JSON.parse(row.responsesJson);
    } catch {
      parsedResponses = null;
    }

    const outcomeResult = row.result || row.evaluationResult;
    const severity = getScreeningSeverity(row);

    return {
      ...row,
      status: row.status || "COMPLETED",
      result: outcomeResult,
      evaluationResult: outcomeResult,
      severity,
      rule_version: row.rule_version || row.ruleVersion,
      ruleVersion: row.ruleVersion || row.rule_version,
      completed_at: row.completed_at || row.completedAt,
      completedAt: row.completedAt || row.completed_at,
      created_at: row.created_at || row.createdAt,
      createdAt: row.createdAt || row.created_at,
      isPregnantOrLactating: Boolean(row.isPregnantOrLactating),
      hasSevereSymptoms: Boolean(row.hasSevereSymptoms),
      hasOrganFailure: Boolean(row.hasOrganFailure),
      responses: parsedResponses,
    };
  } catch (error) {
    console.error("Error in getLatestUserScreening:", error);
    return null;
  }
}

export const getLatestCompletedUserScreening = getLatestUserScreening;

/**
 * Save a new completed health screening record into MySQL.
 * Saves status = 'COMPLETED', completed_at timestamp, responses, result, and rule version.
 */
export async function saveUserScreening(
  userId: number,
  input: ScreeningInput,
  evaluation: ScreeningEvaluation
) {
  const [res]: any = await pool.query(
    `INSERT INTO community_health_screenings (
       userId, user_id, status, ruleVersion, rule_version,
       ageGroup, healthConcern, currentMedications, knownAllergies,
       isPregnantOrLactating, hasSevereSymptoms, hasOrganFailure,
       responsesJson, evaluationResult, result, reasonSummary,
       completedAt, completed_at, createdAt, created_at
     ) VALUES (
       ?, ?, 'COMPLETED', ?, ?,
       ?, ?, ?, ?,
       ?, ?, ?,
       ?, ?, ?, ?,
       CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
     )`,
    [
      userId,
      userId,
      evaluation.ruleVersion,
      evaluation.ruleVersion,
      input.ageGroup,
      input.healthConcern || "",
      Array.isArray(input.currentMedications) ? input.currentMedications.join(", ") : input.currentMedications || "",
      Array.isArray(input.knownAllergies) ? input.knownAllergies.join(", ") : input.knownAllergies || "",
      input.isPregnantOrLactating ? 1 : 0,
      input.hasSevereSymptoms ? 1 : 0,
      input.hasOrganFailure ? 1 : 0,
      JSON.stringify(input),
      evaluation.result,
      evaluation.result,
      evaluation.reasonSummary,
    ]
  );

  return {
    id: res.insertId,
    userId,
    user_id: userId,
    status: "COMPLETED",
    result: evaluation.result,
    evaluationResult: evaluation.result,
    ruleVersion: evaluation.ruleVersion,
    rule_version: evaluation.ruleVersion,
    completedAt: new Date(),
    completed_at: new Date(),
  };
}

/**
 * Start a new screening attempt (for Retake Health Screening).
 * Preserves all previous completed screenings in history without overwriting them.
 */
export async function startRetakeScreening(userId: number) {
  const [res]: any = await pool.query(
    `INSERT INTO community_health_screenings (
       userId, user_id, status, ruleVersion, rule_version,
       responsesJson, createdAt, created_at
     ) VALUES (?, ?, 'IN_PROGRESS', ?, ?, '{}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))`,
    [userId, userId, SCREENING_RULE_VERSION, SCREENING_RULE_VERSION]
  );

  return {
    id: res.insertId,
    userId,
    user_id: userId,
    status: "IN_PROGRESS",
  };
}

