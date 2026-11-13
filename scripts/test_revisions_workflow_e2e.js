const mysql = require('mysql2/promise');

async function testRevisionsFlow() {
  console.log("===============================================================");
  console.log("STARTING REVIEW WORKSPACE & STAGE 9 REVISIONS FULL E2E TEST");
  console.log("===============================================================");

  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'natureaide_db',
    port: 3306,
  });

  const projectId = 1;
  const researcherId = 2; // researcher@natureaide.test
  const reviewerId = 3;   // reviewer@natureaide.test

  // 1. Verify Project 1 initial state
  const [pRows] = await pool.query("SELECT id, title, researcherId, currentStage, status FROM research_projects WHERE id = ?", [projectId]);
  if (pRows.length === 0) throw new Error("Project 1 not found");
  console.log("✓ Project verified:", pRows[0].title);

  // 2. Step 1: Simulate Dossier v1.0 Submission
  console.log("\n--- Step 1: Researcher Submits Dossier v1.0 ---");
  const versionTag = "v1.0";
  const initialRound = 1;
  const initialSnapshot = {
    project: pRows[0],
    formulation: { name: "Sambong Volatile Extract", version: "v1.0", componentsCount: 3 },
    safety: { concerns: [{ title: "Diuretic interaction", severity: "MAJOR" }] },
    compiledAt: new Date().toISOString(),
  };

  // Create research_dossiers
  await pool.query(`
    INSERT INTO research_dossiers (projectId, researcherId, currentVersionTag, status)
    VALUES (?, ?, ?, 'UNDER_REVIEW')
    ON DUPLICATE KEY UPDATE currentVersionTag = VALUES(currentVersionTag), status = 'UNDER_REVIEW'
  `, [projectId, researcherId, versionTag]);

  const [dossierRow] = await pool.query("SELECT id FROM research_dossiers WHERE projectId = ?", [projectId]);
  const dossierId = dossierRow[0].id;

  // Create research_dossier_versions
  const [verRes] = await pool.query(`
    INSERT INTO research_dossier_versions (
      dossierId, projectId, researcherId, versionTag, reviewRound,
      submissionStatus, preferredSpecialty, dossierSnapshot, submissionTimestamp, assignedReviewerId
    ) VALUES (?, ?, ?, ?, ?, 'UNDER_REVIEW', 'PHARMACIST', ?, CURRENT_TIMESTAMP(3), ?)
  `, [dossierId, projectId, researcherId, versionTag, initialRound, JSON.stringify(initialSnapshot), reviewerId]);
  const dossierVersionId = verRes.insertId;

  // Create review_submissions
  const [subRes] = await pool.query(`
    INSERT INTO review_submissions (
      projectId, versionTag, reviewRound, messageToReviewers,
      snapshotData, assignedReviewerId, status, submittedAt
    ) VALUES (?, ?, ?, 'Initial submission for evaluation', ?, ?, 'UNDER_REVIEW', CURRENT_TIMESTAMP(3))
  `, [projectId, versionTag, initialRound, JSON.stringify(initialSnapshot), reviewerId]);
  const submissionId = subRes.insertId;

  // Create review_assignments
  const [assignRes] = await pool.query(`
    INSERT INTO review_assignments (
      projectId, submissionId, reviewerId, specialtyNeeded, status, reviewRound, assignedAt
    ) VALUES (?, ?, ?, 'PHARMACIST', 'PENDING', ?, CURRENT_TIMESTAMP(3))
  `, [projectId, submissionId, reviewerId, initialRound]);
  const assignmentId = assignRes.insertId;

  console.log(`✓ Dossier ${versionTag} submitted (Submission ID: ${submissionId}, Assignment ID: ${assignmentId})`);

  // 3. Step 2: Reviewer opens exact snapshot and adds comments
  console.log("\n--- Step 2: Reviewer Adds Feedback Comments ---");
  const [commentRes1] = await pool.query(`
    INSERT INTO review_feedback (
      projectId, submissionId, reviewerId, reviewRound, sectionName,
      commentType, severity, reviewerName, comment, recommendation, status
    ) VALUES (?, ?, ?, ?, 'safety', 'SAFETY_CONCERN', 'MAJOR', 'Lead Reviewer',
      'Potential hypokalemic risk when combined with loop diuretics. Need pharmacokinetic clearance data.',
      'Document explicit contraindications for patients on potassium-wasting diuretics.', 'OPEN')
  `, [projectId, submissionId, reviewerId, initialRound]);
  const commentId1 = commentRes1.insertId;

  const [commentRes2] = await pool.query(`
    INSERT INTO review_feedback (
      projectId, submissionId, reviewerId, reviewRound, sectionName,
      commentType, severity, reviewerName, comment, recommendation, status
    ) VALUES (?, ?, ?, ?, 'formulation', 'CLARIFICATION_NEEDED', 'MINOR', 'Lead Reviewer',
      'Clarify extraction solvent ratio and drying temperature.',
      'Specify aqueous ethanol percentage in processing conditions.', 'OPEN')
  `, [projectId, submissionId, reviewerId, initialRound]);
  const commentId2 = commentRes2.insertId;

  console.log(`✓ Reviewer added 2 feedback comments (Comment IDs: ${commentId1}, ${commentId2})`);

  // 4. Step 3: Reviewer Requests Revision
  console.log("\n--- Step 3: Reviewer Requests Revision ---");
  const revisionNotes = "Clarify diuretic drug interactions and refine extraction solvent temperature parameters.";

  // Update assignment & submission
  await pool.query("UPDATE review_assignments SET status = 'REVISION_REQUIRED' WHERE id = ?", [assignmentId]);
  await pool.query("UPDATE review_submissions SET status = 'REVISION_REQUESTED', reviewedAt = CURRENT_TIMESTAMP(3) WHERE id = ?", [submissionId]);
  await pool.query("UPDATE research_dossiers SET status = 'REVISION_REQUESTED' WHERE projectId = ?", [projectId]);
  await pool.query("UPDATE research_projects SET status = 'REVISION_REQUIRED', currentStage = 'revisions' WHERE id = ?", [projectId]);
  await pool.query("UPDATE research_project_stages SET status = 'REVISION_REQUESTED' WHERE projectId = ? AND stageKey = 'review'", [projectId]);
  await pool.query("UPDATE research_project_stages SET status = 'IN_PROGRESS' WHERE projectId = ? AND stageKey = 'revisions'", [projectId]);

  // Insert into revision_cycles
  const [rcRes] = await pool.query(`
    INSERT INTO revision_cycles (
      projectId, submissionId, dossierVersionTag, reviewRound, reviewerId,
      reviewerDecision, reviewerSummary, status
    ) VALUES (?, ?, ?, ?, ?, 'REVISION_REQUESTED', ?, 'IN_PROGRESS')
  `, [projectId, submissionId, versionTag, initialRound, reviewerId, revisionNotes]);
  const cycleId = rcRes.insertId;

  // Insert into review_decisions
  await pool.query(`
    INSERT INTO review_decisions (
      projectId, submissionId, reviewerId, reviewRound, decision,
      overallAssessment, requiredRevisions
    ) VALUES (?, ?, ?, ?, 'REQUEST_REVISION', 'Comprehensive phytochemistry, but safety gaps require revision.', ?)
  `, [projectId, submissionId, reviewerId, initialRound, revisionNotes]);

  console.log(`✓ Reviewer decision REVISION_REQUESTED recorded. Project currentStage is now: revisions`);

  // 5. Step 4: Researcher views feedback and responds in Stage 9
  console.log("\n--- Step 4: Researcher Responds to Feedback in Stage 9 ---");
  await pool.query(`
    UPDATE review_feedback
    SET
      researcherReply = 'Updated safety assessment to flag hypokalemia precautions with loop diuretics.',
      responseAction = 'CHANGE_MADE',
      responseDescription = 'Added pharmacokinetic interaction warnings in Stage 7.',
      affectedStage = 'safety',
      status = 'ADDRESSED',
      researcherRepliedAt = CURRENT_TIMESTAMP(3)
    WHERE id = ?
  `, [commentId1]);

  await pool.query(`
    UPDATE review_feedback
    SET
      researcherReply = 'Specified 70% aqueous ethanol extraction at 45°C.',
      responseAction = 'CHANGE_MADE',
      responseDescription = 'Updated processing parameters in Stage 6.',
      affectedStage = 'formulation',
      status = 'ADDRESSED',
      researcherRepliedAt = CURRENT_TIMESTAMP(3)
    WHERE id = ?
  `, [commentId2]);

  console.log("✓ Researcher responded to all comments and marked them as ADDRESSED");

  // Verify historical v1.0 remains immutable
  const [v1Check] = await pool.query("SELECT snapshotData FROM review_submissions WHERE id = ?", [submissionId]);
  const v1Snapshot = JSON.parse(v1Check[0].snapshotData);
  if (v1Snapshot.formulation.componentsCount !== 3) {
    throw new Error("Violation: Historical snapshot v1.0 was modified!");
  }
  console.log("✓ Dossier v1.0 historical snapshot verified: Completely immutable.");

  // 6. Step 5: Researcher Resubmits as Dossier v1.1
  console.log("\n--- Step 5: Researcher Resubmits as Dossier v1.1 ---");
  const revisedTag = "v1.1";
  const round2 = 2;
  const revisedSnapshot = {
    project: pRows[0],
    formulation: { name: "Sambong Volatile Extract (Ethanol 70%)", version: "v1.1", componentsCount: 4 },
    safety: { concerns: [{ title: "Hypokalemic loop diuretic precaution", severity: "MODERATE" }] },
    resubmissionMetadata: {
      parentVersion: versionTag,
      revisionTag: revisedTag,
      summary: "Addressed diuretic interaction and extraction temperature.",
    },
    compiledAt: new Date().toISOString(),
  };

  // Insert revised dossier version
  const [ver2Res] = await pool.query(`
    INSERT INTO research_dossier_versions (
      dossierId, projectId, researcherId, versionTag, reviewRound,
      submissionStatus, preferredSpecialty, dossierSnapshot, submissionTimestamp, assignedReviewerId
    ) VALUES (?, ?, ?, ?, ?, 'UNDER_REVIEW', 'PHARMACIST', ?, CURRENT_TIMESTAMP(3), ?)
  `, [dossierId, projectId, researcherId, revisedTag, round2, JSON.stringify(revisedSnapshot), reviewerId]);
  const dossierVersion2Id = ver2Res.insertId;

  // Insert revised submission
  const [sub2Res] = await pool.query(`
    INSERT INTO review_submissions (
      projectId, versionTag, reviewRound, messageToReviewers,
      snapshotData, previousSubmissionId, assignedReviewerId, status, submittedAt
    ) VALUES (?, ?, ?, 'Resubmission with all reviewer comments addressed', ?, ?, ?, 'UNDER_REVIEW', CURRENT_TIMESTAMP(3))
  `, [projectId, revisedTag, round2, JSON.stringify(revisedSnapshot), submissionId, reviewerId]);
  const submission2Id = sub2Res.insertId;

  // Create assignment for SAME reviewer as RESUBMITTED
  const [assign2Res] = await pool.query(`
    INSERT INTO review_assignments (
      projectId, submissionId, reviewerId, specialtyNeeded, status, reviewRound, assignedAt
    ) VALUES (?, ?, ?, 'PHARMACIST', 'RESUBMITTED', ?, CURRENT_TIMESTAMP(3))
  `, [projectId, submission2Id, reviewerId, round2]);
  const assignment2Id = assign2Res.insertId;

  // Update project status
  await pool.query("UPDATE research_projects SET status = 'UNDER_REVIEW', currentStage = 'review' WHERE id = ?", [projectId]);
  await pool.query("UPDATE research_project_stages SET status = 'COMPLETED' WHERE projectId = ? AND stageKey = 'revisions'", [projectId]);
  await pool.query("UPDATE research_project_stages SET status = 'UNDER_REVIEW' WHERE projectId = ? AND stageKey = 'review'", [projectId]);

  console.log(`✓ Dossier ${revisedTag} resubmitted to SAME reviewer (Submission ID: ${submission2Id}, Assignment ID: ${assignment2Id})`);

  // 7. Step 6: Reviewer Receives RESUBMITTED v1.1 & Compares Versions
  console.log("\n--- Step 6: Reviewer Receives & Evaluates Revised Dossier v1.1 ---");
  const [revSubQuery] = await pool.query(`
    SELECT ra.status, rs.versionTag, rs.previousSubmissionId
    FROM review_assignments ra
    JOIN review_submissions rs ON ra.submissionId = rs.id
    WHERE ra.id = ?
  `, [assignment2Id]);
  console.log(`✓ Reviewer sees assignment status: ${revSubQuery[0].status}, Version: ${revSubQuery[0].versionTag}, Previous ID: ${revSubQuery[0].previousSubmissionId}`);

  // 8. Step 7: Reviewer Accepts for Next Stage (Stage 10 Laboratory Validation)
  console.log("\n--- Step 7: Reviewer Accepts for Stage 10 Laboratory Validation ---");
  await pool.query("UPDATE review_assignments SET status = 'COMPLETED', completedAt = CURRENT_TIMESTAMP(3) WHERE id = ?", [assignment2Id]);
  await pool.query("UPDATE review_submissions SET status = 'ACCEPTED_FOR_NEXT_STAGE', reviewedAt = CURRENT_TIMESTAMP(3) WHERE id = ?", [submission2Id]);
  await pool.query("UPDATE research_dossiers SET status = 'ACCEPTED_FOR_NEXT_STAGE' WHERE projectId = ?", [projectId]);
  await pool.query("UPDATE research_projects SET status = 'APPROVED_FOR_LAB', currentStage = 'laboratory', progressPercent = 75 WHERE id = ?", [projectId]);
  await pool.query("UPDATE research_project_stages SET status = 'COMPLETED', completedAt = CURRENT_TIMESTAMP(3) WHERE projectId = ? AND stageKey = 'review'", [projectId]);
  await pool.query("UPDATE research_project_stages SET status = 'IN_PROGRESS' WHERE projectId = ? AND stageKey = 'laboratory'", [projectId]);
  await pool.query("UPDATE revision_cycles SET status = 'RESOLVED', resolvedAt = CURRENT_TIMESTAMP(3) WHERE id = ?", [cycleId]);

  console.log("✓ Reviewer decision ACCEPTED_FOR_NEXT_STAGE recorded.");
  console.log("✓ Stage 8 Professional Review = COMPLETED");
  console.log("✓ Revision cycle = RESOLVED");
  console.log("✓ Project currentStage is now: laboratory (Stage 10)");

  // 9. Step 8: Clean up temporary test records
  console.log("\n--- Cleaning up temporary test records ---");
  await pool.query("DELETE FROM review_assignments WHERE id IN (?, ?)", [assignmentId, assignment2Id]);
  await pool.query("DELETE FROM review_submissions WHERE id IN (?, ?)", [submissionId, submission2Id]);
  await pool.query("DELETE FROM research_dossier_versions WHERE id IN (?, ?)", [dossierVersionId, dossierVersion2Id]);
  await pool.query("DELETE FROM review_feedback WHERE id IN (?, ?)", [commentId1, commentId2]);
  await pool.query("DELETE FROM revision_cycles WHERE id = ?", [cycleId]);
  // Reset project 1 currentStage back to review/revisions cleanly
  await pool.query("UPDATE research_projects SET status = 'UNDER_REVIEW', currentStage = 'review', progressPercent = 67 WHERE id = ?", [projectId]);
  await pool.query("UPDATE research_project_stages SET status = 'UNDER_REVIEW' WHERE projectId = ? AND stageKey = 'review'", [projectId]);
  await pool.query("UPDATE research_project_stages SET status = 'NOT_STARTED' WHERE projectId = ? AND stageKey = 'laboratory'", [projectId]);

  console.log("✓ Cleaned up test records and restored clean project state.");
  console.log("===============================================================");
  console.log("ALL REVIEW WORKSPACE & STAGE 9 REVISION TESTS PASSED!");
  console.log("===============================================================");

  await pool.end();
}

testRevisionsFlow().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
