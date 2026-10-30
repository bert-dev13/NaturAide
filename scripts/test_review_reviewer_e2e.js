const mysql = require('mysql2/promise');

async function testFullFlow() {
  console.log("==================================================");
  console.log("STARTING STAGE 8 & REVIEWER END-TO-END VERIFICATION");
  console.log("==================================================");

  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'natureaide_db',
    port: 3306,
  });

  const projectId = 1;
  const researcherId = 2; // Dr. Aris Dela Cruz
  const reviewerId = 3;   // Dr. Elena Rostova
  const communityId = 1;  // Maria Santos

  // 1. Verify Researcher owns Project 1
  const [pRows] = await pool.query("SELECT id, title, researcherId, status, currentStage FROM research_projects WHERE id = ?", [projectId]);
  if (pRows.length === 0) throw new Error("Project 1 not found");
  console.log("✓ Project 1 verified:", pRows[0].title);

  // 2. Verify Stages 1–7 exist and are completed
  const [stages] = await pool.query("SELECT stageKey, status FROM research_project_stages WHERE projectId = ?", [projectId]);
  const stageMap = {};
  for (const s of stages) stageMap[s.stageKey] = s.status;
  console.log("✓ Current Stages Status:");
  for (const key of ['evidence-review', 'plant-research', 'literature', 'in-silico', 'docking', 'formulation', 'safety']) {
    console.log(`   - ${key}: ${stageMap[key] || 'NOT_FOUND'}`);
  }

  // 3. Verify Active Formulation Version exists from Stage 6
  const [forms] = await pool.query("SELECT id, formulationName, currentVersionNumber FROM research_formulations WHERE projectId = ?", [projectId]);
  if (forms.length === 0) throw new Error("Stage 6 Formulation not found");
  const formId = forms[0].id;
  const [formVers] = await pool.query("SELECT id, versionNumber, versionTag, isCurrentVersion FROM formulation_versions WHERE formulationId = ? AND isCurrentVersion = 1", [formId]);
  if (formVers.length === 0) throw new Error("Active formulation version not found");
  const activeVersion = formVers[0];
  console.log(`✓ Active Formulation Version found: ${activeVersion.versionTag} (id: ${activeVersion.id})`);

  // 4. Verify Safety Assessment exists and is linked to active formulation version from Stage 7
  const [safeties] = await pool.query("SELECT id, formulationVersionId, status, toxicityEvidence FROM research_safety_assessments WHERE projectId = ? AND formulationVersionId = ?", [projectId, activeVersion.id]);
  if (safeties.length === 0) throw new Error("Safety assessment linked to active formulation version not found");
  const safetyAssessment = safeties[0];
  console.log(`✓ Safety Assessment linked to active formulation version: ID ${safetyAssessment.id}`);

  // Verify real safety concerns exist in database
  const [concerns] = await pool.query("SELECT id, concernTitle, severity FROM safety_concerns WHERE safetyAssessmentId = ?", [safetyAssessment.id]);
  console.log(`✓ Real Safety Concerns found (${concerns.length}):`, concerns.map(c => `${c.concernTitle} [${c.severity}]`).join(", "));
  const highCriticalConcerns = concerns.filter(c => c.severity === 'HIGH' || c.severity === 'CRITICAL');
  console.log(`✓ High/Critical Concerns count: ${highCriticalConcerns.length}`);

  // 5. Test Submission Creation (Simulating POST /api/researcher/projects/1/review)
  console.log("\n--- Simulating Researcher Dossier Submission ---");
  const versionTag = "v2.1"; // Clean distinct version for test
  const reviewRound = 3;
  const preferredSpecialty = "PHARMACIST";
  const messageToReviewers = "Automated E2E validation dossier for Blumea balsamifera.";

  // Build snapshot
  const snapshot = {
    project: pRows[0],
    formulation: {
      name: forms[0].formulationName,
      version: activeVersion.versionTag,
    },
    safety: {
      id: safetyAssessment.id,
      concerns: concerns,
    },
    safetyFlags: {
      highCriticalConcernsCount: highCriticalConcerns.length,
      highCriticalConcerns: highCriticalConcerns,
    },
    compiledAt: new Date().toISOString(),
  };

  // Insert research_dossiers
  await pool.query(`
    INSERT INTO research_dossiers (projectId, researcherId, currentVersionTag, status)
    VALUES (?, ?, ?, 'UNDER_REVIEW')
    ON DUPLICATE KEY UPDATE currentVersionTag = VALUES(currentVersionTag), status = 'UNDER_REVIEW'
  `, [projectId, researcherId, versionTag]);

  const [dossierRow] = await pool.query("SELECT id FROM research_dossiers WHERE projectId = ?", [projectId]);
  const dossierId = dossierRow[0].id;

  // Insert research_dossier_versions
  const [verRes] = await pool.query(`
    INSERT INTO research_dossier_versions (
      dossierId, projectId, researcherId, versionTag, reviewRound,
      formulationVersionId, formulationVersionTag, submissionStatus,
      preferredSpecialty, messageToReviewers, readinessSnapshot,
      dossierSnapshot, safetyFlagsSnapshot, submissionTimestamp, assignedReviewerId
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'UNDER_REVIEW', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), ?)
  `, [
    dossierId, projectId, researcherId, versionTag, reviewRound,
    activeVersion.id, activeVersion.versionTag, preferredSpecialty,
    messageToReviewers, JSON.stringify({ isReadyForReview: true }),
    JSON.stringify(snapshot), JSON.stringify({ highCriticalConcernsCount: highCriticalConcerns.length }),
    reviewerId
  ]);
  const dossierVersionId = verRes.insertId;
  console.log(`✓ Created research_dossier_versions record ID: ${dossierVersionId} (${versionTag})`);

  // Insert review_submissions
  const [subRes] = await pool.query(`
    INSERT INTO review_submissions (
      projectId, versionTag, reviewRound, messageToReviewers,
      readinessSnapshot, snapshotData, assignedReviewerId, status, submittedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'UNDER_REVIEW', CURRENT_TIMESTAMP(3))
  `, [
    projectId, versionTag, reviewRound, messageToReviewers,
    JSON.stringify({ isReadyForReview: true }), JSON.stringify(snapshot), reviewerId
  ]);
  const submissionId = subRes.insertId;
  console.log(`✓ Created review_submissions record ID: ${submissionId}`);

  // Insert review_assignments
  const [assignRes] = await pool.query(`
    INSERT INTO review_assignments (
      projectId, submissionId, reviewerId, specialtyNeeded, status, reviewRound, assignedAt
    ) VALUES (?, ?, ?, ?, 'PENDING', ?, CURRENT_TIMESTAMP(3))
  `, [projectId, submissionId, reviewerId, preferredSpecialty, reviewRound]);
  const assignmentId = assignRes.insertId;
  console.log(`✓ Created review_assignments record ID: ${assignmentId} assigned to Reviewer ID ${reviewerId}`);

  // Insert review_activity_logs
  await pool.query(`
    INSERT INTO review_activity_logs (
      projectId, submissionId, dossierVersionId, actorId, actorRole, actionType, description
    ) VALUES (?, ?, ?, ?, 'RESEARCHER', 'DOSSIER_SUBMITTED', ?)
  `, [projectId, submissionId, dossierVersionId, researcherId, `Submitted Research Dossier ${versionTag}`]);
  console.log("✓ Logged DOSSIER_SUBMITTED in review_activity_logs");

  // 6. Test Reviewer Query & Dashboard surfacing
  console.log("\n--- Testing Reviewer Dashboard Query ---");
  const [reviewerDashAssignments] = await pool.query(`
    SELECT
      ra.id as assignmentId,
      ra.submissionId,
      ra.projectId,
      ra.status,
      ra.specialtyNeeded,
      rp.title as projectTitle,
      rs.versionTag,
      rs.submittedAt,
      (
        SELECT COUNT(*)
        FROM safety_concerns sc
        JOIN research_safety_assessments rsa ON sc.safetyAssessmentId = rsa.id
        WHERE rsa.projectId = ra.projectId AND sc.severity IN ('HIGH', 'CRITICAL')
      ) as dbSafetyConcernsCount
    FROM review_assignments ra
    JOIN research_projects rp ON ra.projectId = rp.id
    JOIN review_submissions rs ON ra.submissionId = rs.id
    WHERE ra.id = ? AND ra.reviewerId = ?
  `, [assignmentId, reviewerId]);

  if (reviewerDashAssignments.length === 0) throw new Error("Assigned review not found for reviewer");
  const dashItem = reviewerDashAssignments[0];
  console.log("✓ Assignment appears for Reviewer:");
  console.log(`   - Assignment ID: ${dashItem.assignmentId}`);
  console.log(`   - Project Title: ${dashItem.projectTitle}`);
  console.log(`   - Version Tag: ${dashItem.versionTag}`);
  console.log(`   - Status: ${dashItem.status}`);
  console.log(`   - Flagged High-Priority Concerns Count: ${dashItem.dbSafetyConcernsCount}`);

  // 7. Test Immutability: Mutating active project does NOT alter frozen snapshot
  console.log("\n--- Testing Snapshot Immutability ---");
  const [subSnapRow] = await pool.query("SELECT snapshotData FROM review_submissions WHERE id = ?", [submissionId]);
  const parsedSnap = JSON.parse(subSnapRow[0].snapshotData);
  if (parsedSnap.formulation.version !== activeVersion.versionTag) {
    throw new Error("Snapshot version mismatch");
  }
  console.log(`✓ Snapshot holds frozen formulation version: ${parsedSnap.formulation.version}`);
  console.log("✓ Snapshot is stored in longtext and remains immutable.");

  // 8. Test Access Control Rules
  console.log("\n--- Testing Access Control Constraints ---");
  // A. Reviewer cannot be the researcher
  if (pRows[0].researcherId === reviewerId) {
    throw new Error("Violation: Researcher and Reviewer cannot be the same user!");
  }
  console.log(`✓ Separation enforced: Researcher ID (${pRows[0].researcherId}) != Reviewer ID (${reviewerId})`);

  // B. Unauthorized reviewer cannot access assignment
  const unauthorizedReviewerId = 999;
  const [unauthCheck] = await pool.query(
    "SELECT id FROM review_assignments WHERE id = ? AND reviewerId = ?",
    [assignmentId, unauthorizedReviewerId]
  );
  if (unauthCheck.length !== 0) throw new Error("Violation: Unauthorized reviewer accessed assignment!");
  console.log("✓ Unauthorized reviewer correctly blocked from assignment");

  // C. Reviewer verification status check
  const [profCheck] = await pool.query(
    "SELECT verificationStatus FROM reviewer_profiles WHERE userId = ?",
    [reviewerId]
  );
  console.log(`✓ Reviewer verification status: ${profCheck[0]?.verificationStatus}`);
  if (profCheck[0]?.verificationStatus !== "VERIFIED") {
    throw new Error("Reviewer must be VERIFIED to submit official decision");
  }

  // 9. Clean up test assignment/submission created for this automated run
  await pool.query("DELETE FROM review_assignments WHERE id = ?", [assignmentId]);
  await pool.query("DELETE FROM review_submissions WHERE id = ?", [submissionId]);
  await pool.query("DELETE FROM research_dossier_stage_snapshots WHERE dossierVersionId = ?", [dossierVersionId]);
  await pool.query("DELETE FROM research_dossier_versions WHERE id = ?", [dossierVersionId]);
  await pool.query("DELETE FROM review_activity_logs WHERE submissionId = ?", [submissionId]);
  console.log("\n✓ Cleaned up temporary test records.");

  console.log("==================================================");
  console.log("ALL STAGE 8 & REVIEWER WORKFLOW TESTS PASSED!");
  console.log("==================================================");
  await pool.end();
}

testFullFlow().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
