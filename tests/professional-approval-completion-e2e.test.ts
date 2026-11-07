import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import pool from "../src/lib/db";
import { ensureV2ResearchSchema } from "../src/lib/v2-research-schema";
import { calculateV2ProjectProgress } from "../src/lib/v2-progress-service";
import {
  openExpertReviewCycle,
  evaluateOverallApproval,
} from "../src/lib/expert-review-assignment";
import {
  getProjectProfessionalApprovalState,
  completeApprovedResearchProject,
  getCompletedResearchListForResearcher,
  getCompletedResearchDetail,
} from "../src/lib/research-approval-completion-service";

async function runTests() {
  console.log("=== Starting Section 3 Step 4 & Completed Research E2E Verification ===");

  await ensureV2ResearchSchema();

  let testProjectId = 0;
  const researcherId = 2; // Standard test researcher
  let reviewerId = 3;

  try {
    // Find a valid reviewer user ID and plant ID
    const [revUsers]: any = await pool.query(
      "SELECT id FROM users WHERE role = 'REVIEWER' ORDER BY id ASC LIMIT 1"
    );
    if (revUsers.length > 0) {
      reviewerId = Number(revUsers[0].id);
    }

    const [plantRows]: any = await pool.query(
      "SELECT id, commonName, scientificName FROM plants ORDER BY id ASC LIMIT 1"
    );
    const plantId = plantRows[0]?.id || null;

    // 1. Create a complete test project with Section 1, Section 2, Summary, and Manuscript
    const [insProj]: any = await pool.query(
      `
      INSERT INTO research_projects
        (researcherId, plantId, title, shortDescription, researchObjective, areaOfInterest, status, currentStage, progressPercent, createdAt, updatedAt)
      VALUES
        (?, ?, 'E2E Step 4 Approval & Completion Test Project', 'Testing 4-step submission and completion', 'Evaluate Senna alata hydrogel', 'Fungal skin infection', 'IN_PROGRESS', 'submission', 85, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
      `,
      [researcherId, plantId]
    );
    testProjectId = Number(insProj.insertId);
    assert.ok(testProjectId > 0, "Test project created in MySQL");

    // Seed Section 1 (6 steps)
    await pool.query(
      `INSERT INTO research_plant_data (projectId, commonName, scientificName, family, partsStudied, extractionMethod, extractionSolvent, materialType)
       VALUES (?, 'Akapulko', 'Senna alata', 'Fabaceae', 'Leaves', 'Maceration', '80% Ethanol', 'Hydroethanolic Leaf Extract')`,
      [testProjectId]
    );
    await pool.query(
      `INSERT INTO research_product_selections (projectId, productType, deliveryFormat, targetIndications, rationale)
       VALUES (?, 'Topical Hydrogel', 'Topical Hydrogel', 'Cutaneous mycoses', 'Sustained dermal contact')`,
      [testProjectId]
    );
    await pool.query(
      `INSERT INTO research_materials (projectId, materialType, materialName, gradeOrPurity, functionDescription)
       VALUES (?, 'EXCIPIENT', 'Carbopol 940', 'USP Grade', 'Matrix gelling polymer')`,
      [testProjectId]
    );
    const [insForm]: any = await pool.query(
      `INSERT INTO research_formulations (projectId, formulationName, formulationType, dosageFormType)
       VALUES (?, 'Akapulko Hydrogel v1', 'Topical Hydrogel', 'Topical Hydrogel')`,
      [testProjectId]
    );
    const formulationId = Number(insForm.insertId);
    const [insVer]: any = await pool.query(
      `INSERT INTO formulation_versions (formulationId, versionNumber, versionTag, isCurrentVersion)
       VALUES (?, 1, 'v1.0', 1)`,
      [formulationId]
    );
    const versionId = Number(insVer.insertId);
    await pool.query(
      `INSERT INTO formulation_components (projectId, versionId, componentName, quantity, unit, roleInFormulation)
       VALUES
         (?, ?, 'Senna alata leaf extract', '5.0', '%', 'Active Pharmaceutical Ingredient'),
         (?, ?, 'Carbopol 940', '1.5', '%', 'Gelling Polymer')`,
      [testProjectId, versionId, testProjectId, versionId]
    );
    await pool.query(
      `INSERT INTO research_batch_analyses (projectId, batchNumber, pH, viscosity, appearance, status)
       VALUES (?, 'BATCH-01', 5.8, '4200 cP', 'Homogeneous amber gel', 'Passed')`,
      [testProjectId]
    );

    // Seed Section 2 (8 steps)
    const [insComp]: any = await pool.query(
      `INSERT INTO research_compounds (projectId, compoundName, molecularFormula, molecularWeight, smiles, selectedForDocking)
       VALUES (?, 'Emodin', 'C15H10O5', 270.24, 'CC1=CC2=C(C(=C1)O)C(=O)C3=C(C2=O)C=CC=C3O', 1)`,
      [testProjectId]
    );
    const compoundId = Number(insComp.insertId);

    const [insTarget]: any = await pool.query(
      `INSERT INTO docking_targets (projectId, targetName, pdbId, organism)
       VALUES (?, 'Prostaglandin G/H synthase 2', '5KIR', 'Homo sapiens')`,
      [testProjectId]
    );
    const targetId = Number(insTarget.insertId);

    await pool.query(
      `INSERT INTO insilico_results (projectId, compoundName)
       VALUES (?, 'Emodin')`,
      [testProjectId]
    );

    await pool.query(
      `INSERT INTO docking_runs (projectId, compoundId, targetId, ligandName, targetProtein, pdbId, bindingAffinity, jobStatus)
       VALUES (?, ?, ?, 'Emodin', 'Prostaglandin G/H synthase 2', '5KIR', -8.884, 'COMPLETED')`,
      [testProjectId, compoundId, targetId]
    );

    await pool.query(
      `INSERT INTO research_insilico_syntheses (projectId, keyFindings, potentialLimitations)
       VALUES (?, 'Emodin bound strongly at -8.884 kcal/mol against COX-2 (5KIR).', 'Rigid receptor approximation requires in-vitro enzyme assay validation.')`,
      [testProjectId]
    );

    // Seed Section 3 Step 1 (Research Summary) & Step 2 (Uploaded Research Paper)
    await pool.query(
      `INSERT INTO research_dossiers (projectId, researcherId, currentVersionTag, status, executiveSummary, createdAt, updatedAt)
       VALUES (?, ?, 'v1.0', 'DRAFT', 'Complete executive research summary for Akapulko hydrogel.', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))`,
      [testProjectId, researcherId]
    );

    const uploadDir = path.join(process.cwd(), "uploads", "manuscripts");
    await fs.mkdir(uploadDir, { recursive: true });
    const dummyPdfPath = path.join(uploadDir, `e2e-test-manuscript-${testProjectId}.pdf`);
    await fs.writeFile(dummyPdfPath, "%PDF-1.4 E2E test manuscript content");

    await pool.query(
      `INSERT INTO research_manuscripts (projectId, title, fileName, mimeType, fileSize, storagePath, fileUrl, status, uploadedAt, updatedAt)
       VALUES (?, 'Akapulko Manuscript', 'akapulko-paper.pdf', 'application/pdf', 1024, ?, ?, 'UPLOADED', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))`,
      [
        testProjectId,
        dummyPdfPath,
        `/api/researcher/projects/${testProjectId}/manuscript/file`,
      ]
    );

    // =========================================================================
    // TEST 1: Section 3 displays all four steps in v2-progress-service
    // =========================================================================
    const v2ProgBefore = await calculateV2ProjectProgress(testProjectId);
    assert.equal(v2ProgBefore.section1.status, "COMPLETED", "Section 1 is COMPLETED");
    assert.equal(v2ProgBefore.section2.status, "COMPLETED", "Section 2 is COMPLETED");
    assert.equal(v2ProgBefore.section3.totalSteps, 4, "Section 3 must have 4 total steps");
    assert.deepEqual(
      v2ProgBefore.section3.steps.map((s) => s.title),
      [
        "Research Summary",
        "Upload Research Paper",
        "Review & Submit",
        "Professional Approval & Completion",
      ],
      "Section 3 steps must match exact 4 step titles"
    );
    console.log("✓ Test 1 passed: Section 3 displays all four steps");

    // Pre-submission state check: cannot complete before submission
    const preSubState = await getProjectProfessionalApprovalState(testProjectId);
    assert.ok(preSubState, "Approval state returned before submission");
    assert.equal(preSubState.hasSubmission, false, "hasSubmission is false before Step 3 submit");
    assert.equal(preSubState.canCompleteResearch, false, "Complete Research disabled before submit");

    // =========================================================================
    // TEST 2 & 3: Step 3 submits the research and opens Step 4 with 5 specialties
    // =========================================================================
    const cycle1 = await openExpertReviewCycle({ projectId: testProjectId, researcherId });
    assert.ok(cycle1.submissionId > 0, "Submission v1.0 created");
    assert.equal(cycle1.versionTag, "v1.0", "First submission is v1.0");

    const stateAfterSubmit = await getProjectProfessionalApprovalState(testProjectId);
    assert.ok(stateAfterSubmit, "State loaded after submission");
    assert.equal(stateAfterSubmit.hasSubmission, true, "Step 4 is now accessible (hasSubmission=true)");
    assert.equal(stateAfterSubmit.specialties.length, 5, "All 5 specialties returned in Step 4");
    assert.deepEqual(
      stateAfterSubmit.specialties.map((s) => `${s.code} ${s.specialty}`),
      [
        "01 Pharmacognosy",
        "02 Bioinformatics",
        "03 Pharmacology",
        "04 Formulation Science",
        "05 Clinical Safety",
      ],
      "Step 4 lists exact 5 professional specialties"
    );
    assert.equal(stateAfterSubmit.approvedCount, 0, "Initially 0 of 5 Approved");
    assert.equal(
      stateAfterSubmit.overallReviewStatus,
      "Under Professional Review — 0/5 Approved",
      "Overall status shows 0/5 Approved"
    );
    console.log("✓ Test 2 & 3 passed: Submission opens Step 4 with all 5 specialties (0 of 5 Approved)");

    // =========================================================================
    // TEST 4 & 5: Partial approvals + Revision request workflow
    // =========================================================================
    // Approve Pharmacognosy (01) and Bioinformatics (02)
    for (const areaKey of ["pharmacognosy", "bioinformatics"]) {
      await pool.query(
        `UPDATE review_area_coverage SET status = 'APPROVED', reviewerId = ?, updatedAt = CURRENT_TIMESTAMP(3)
         WHERE submissionId = ? AND areaKey = ?`,
        [reviewerId, cycle1.submissionId, areaKey]
      );
      await pool.query(
        `INSERT INTO professional_reviews (submissionId, projectId, reviewerId, areaKey, reviewCycle, assessment, comments, status, submittedAt)
         VALUES (?, ?, ?, ?, 1, 'ACCEPTABLE', 'Approved in cycle 1.', 'SUBMITTED', CURRENT_TIMESTAMP(3))
         ON DUPLICATE KEY UPDATE assessment = 'ACCEPTABLE', status = 'SUBMITTED', submittedAt = CURRENT_TIMESTAMP(3)`,
        [cycle1.submissionId, testProjectId, reviewerId, areaKey]
      );
    }
    await evaluateOverallApproval(cycle1.submissionId, testProjectId);

    const state2of5 = await getProjectProfessionalApprovalState(testProjectId);
    assert.equal(state2of5?.approvedCount, 2, "2 of 5 Approved calculated from MySQL");
    assert.equal(
      state2of5?.overallReviewStatus,
      "Under Professional Review — 2/5 Approved",
      "Overall status updated to 2/5 Approved"
    );
    assert.equal(state2of5?.canCompleteResearch, false, "Complete Research disabled at 2/5 Approved");

    // Pharmacology (03) requests revisions
    await pool.query(
      `UPDATE review_area_coverage SET status = 'REVISION_REQUIRED', reviewerId = ?, updatedAt = CURRENT_TIMESTAMP(3)
       WHERE submissionId = ? AND areaKey = 'pharmacology'`,
      [reviewerId, cycle1.submissionId]
    );
    await pool.query(
      `INSERT INTO professional_reviews (submissionId, projectId, reviewerId, areaKey, reviewCycle, assessment, comments, status, submittedAt)
       VALUES (?, ?, ?, 'pharmacology', 1, 'REVISION_REQUIRED', 'Please clarify catalytic pocket H-bond distance.', 'SUBMITTED', CURRENT_TIMESTAMP(3))
       ON DUPLICATE KEY UPDATE assessment = 'REVISION_REQUIRED', comments = VALUES(comments), status = 'SUBMITTED'`,
      [cycle1.submissionId, testProjectId, reviewerId]
    );
    await pool.query(
      `INSERT INTO review_feedback (projectId, submissionId, reviewerId, reviewRound, areaKey, sectionName, title, commentType, severity, reviewerName, comment, recommendation, status, affectedStage)
       VALUES (?, ?, ?, 1, 'pharmacology', 'Pharmacology Review', 'Clarify H-bond distance', 'REQUIRED_CORRECTION', 'MAJOR', 'Pharmacologist', 'Please clarify catalytic pocket H-bond distance.', 'Clarify H-bond distance', 'OPEN', 'pharmacology')`,
      [testProjectId, cycle1.submissionId, reviewerId]
    );
    await evaluateOverallApproval(cycle1.submissionId, testProjectId);

    const stateRevision = await getProjectProfessionalApprovalState(testProjectId);
    assert.equal(
      stateRevision?.overallReviewStatus,
      "Revisions Required",
      "Overall status is Revisions Required when a specialty requests changes"
    );
    assert.deepEqual(
      stateRevision?.revisionsRequiredSpecialties,
      ["Pharmacology"],
      "Identifies Pharmacology as requesting revisions"
    );
    assert.equal(stateRevision?.canCompleteResearch, false, "Complete Research disabled when Revisions Required");
    console.log("✓ Test 4 & 5 passed: Live X of 5 count & Revisions Required workflow verified");

    // =========================================================================
    // TEST 6: Resubmitted research updates review status & carries forward valid approvals
    // =========================================================================
    const cycle2 = await openExpertReviewCycle({ projectId: testProjectId, researcherId });
    assert.equal(cycle2.versionTag, "v2.0", "Resubmission creates v2.0");
    assert.ok(
      cycle2.retainedApprovedAreas.includes("formulation") &&
        cycle2.retainedApprovedAreas.includes("bioinformatics"),
      "Unchanged Formulation & Bioinformatics approvals carried forward to v2.0"
    );

    // Resolve open feedback & approve remaining 2 specialties on v2.0 (leaving Clinical Safety pending -> 4/5)
    await pool.query(
      `UPDATE review_feedback SET status = 'RESOLVED' WHERE projectId = ?`,
      [testProjectId]
    );

    for (const areaKey of ["pharmacology", "formulation"]) {
      await pool.query(
        `UPDATE review_area_coverage SET status = 'APPROVED', reviewerId = ?, updatedAt = CURRENT_TIMESTAMP(3)
         WHERE submissionId = ? AND areaKey = ?`,
        [reviewerId, cycle2.submissionId, areaKey]
      );
      await pool.query(
        `INSERT INTO professional_reviews (submissionId, projectId, reviewerId, areaKey, reviewCycle, assessment, comments, status, submittedAt)
         VALUES (?, ?, ?, ?, 2, 'ACCEPTABLE', 'Approved in v2.0.', 'SUBMITTED', CURRENT_TIMESTAMP(3))
         ON DUPLICATE KEY UPDATE assessment = 'ACCEPTABLE', status = 'SUBMITTED', submittedAt = CURRENT_TIMESTAMP(3)`,
        [cycle2.submissionId, testProjectId, reviewerId, areaKey]
      );
    }
    await evaluateOverallApproval(cycle2.submissionId, testProjectId);

    // =========================================================================
    // TEST 7: Complete Research disabled at 4/5 Approved & server rejects premature call
    // =========================================================================
    const state4of5 = await getProjectProfessionalApprovalState(testProjectId);
    assert.equal(state4of5?.approvedCount, 4, "4 of 5 Approved");
    assert.equal(state4of5?.canCompleteResearch, false, "Complete Research disabled at 4/5 Approved");

    let prematureErrorThrown = false;
    try {
      await completeApprovedResearchProject({ projectId: testProjectId, researcherId });
    } catch (err: any) {
      prematureErrorThrown = true;
      assert.equal(err.statusCode, 400, "Server rejects premature completion with 400");
    }
    assert.ok(prematureErrorThrown, "Server blocked completion when only 4 of 5 approved");
    console.log("✓ Test 6 & 7 passed: Resubmission v2.0 & server blocks premature completion at 4/5");

    // Now approve the 5th specialty (Clinical Safety)
    await pool.query(
      `UPDATE review_area_coverage SET status = 'APPROVED', reviewerId = ?, updatedAt = CURRENT_TIMESTAMP(3)
       WHERE submissionId = ? AND areaKey = 'clinical_safety'`,
      [reviewerId, cycle2.submissionId]
    );
    await pool.query(
      `INSERT INTO professional_reviews (submissionId, projectId, reviewerId, areaKey, reviewCycle, assessment, comments, status, submittedAt)
       VALUES (?, ?, ?, 'clinical_safety', 2, 'ACCEPTABLE', 'Clinical safety profile approved.', 'SUBMITTED', CURRENT_TIMESTAMP(3))
       ON DUPLICATE KEY UPDATE assessment = 'ACCEPTABLE', status = 'SUBMITTED', submittedAt = CURRENT_TIMESTAMP(3)`,
      [cycle2.submissionId, testProjectId, reviewerId]
    );
    const overallFinal = await evaluateOverallApproval(cycle2.submissionId, testProjectId);
    assert.equal(overallFinal.allApproved, true, "All 5 specialties approved");

    // Verify project is APPROVED (Fully Approved — Ready to Complete) and NOT auto-completed!
    const state5of5 = await getProjectProfessionalApprovalState(testProjectId);
    assert.equal(state5of5?.approvedCount, 5, "5 of 5 Approved");
    assert.equal(state5of5?.isCompleted, false, "Project is NOT automatically marked Completed");
    assert.equal(
      state5of5?.overallReviewStatus,
      "Fully Approved — Ready to Complete",
      "Status is Fully Approved — Ready to Complete"
    );
    assert.equal(
      state5of5?.canCompleteResearch,
      true,
      "Complete Research button is now enabled (canCompleteResearch=true)"
    );

    // =========================================================================
    // TEST 8: Complete Research marks project Completed in MySQL & prevents duplicates
    // =========================================================================
    const completedState = await completeApprovedResearchProject({
      projectId: testProjectId,
      researcherId,
    });
    assert.equal(completedState.isCompleted, true, "Project marked Completed in MySQL");
    assert.equal(completedState.projectStatus, "COMPLETED", "research_projects.status is COMPLETED");
    assert.equal(completedState.overallReviewStatus, "Completed", "Overall status is Completed");
    assert.equal(completedState.approvedVersionTag, "v2.0", "Recorded approvedVersionTag v2.0");
    assert.ok(completedState.completedAt, "Recorded completedAt timestamp");

    // Verify duplicate completion is rejected with 409
    let duplicateErrorThrown = false;
    try {
      await completeApprovedResearchProject({ projectId: testProjectId, researcherId });
    } catch (err: any) {
      duplicateErrorThrown = true;
      assert.equal(err.statusCode, 409, "Duplicate completion rejected with HTTP 409");
    }
    assert.ok(duplicateErrorThrown, "Prevented duplicate completion action");
    console.log("✓ Test 8 passed: Complete Research marks project COMPLETED in MySQL & blocks duplicates");

    // =========================================================================
    // TEST 9, 10, 11: Completed Research List, Detail Page Data & Authorization
    // =========================================================================
    const completedList = await getCompletedResearchListForResearcher(researcherId);
    const foundInList = completedList.find((item) => item.projectId === testProjectId);
    assert.ok(foundInList, "Completed project appears on Completed Research page list");
    assert.equal(foundInList.approvalStatusLabel, "5 of 5 Approved", "Shows 5 of 5 Approved");
    assert.equal(foundInList.approvedVersionTag, "v2.0", "Shows approved version v2.0");

    const detail = await getCompletedResearchDetail(testProjectId, {
      id: researcherId,
      role: "RESEARCHER",
    });
    assert.ok(detail, "Completed Research Detail retrieved");
    assert.equal(detail.approvalState.approvedCount, 5, "Detail shows 5 of 5 Approved");
    assert.ok(detail.executiveSummary.includes("Akapulko"), "Detail includes Research Summary");
    assert.ok(detail.manuscript?.hasFile, "Detail includes uploaded Research Paper");
    assert.equal(
      detail.computationalResults.phytochemicalsCount,
      1,
      "Detail includes computational phytochemicals"
    );
    assert.equal(
      detail.computationalResults.dockingCount,
      1,
      "Detail includes completed molecular docking runs"
    );
    assert.ok(
      detail.approvalState.submissionHistory.length >= 2,
      "Detail preserves full Professional Review History across v1.0 and v2.0"
    );

    // Verify unauthorized researcher cannot access another researcher's completed project
    let unauthorizedBlocked = false;
    try {
      await getCompletedResearchDetail(testProjectId, {
        id: 999999,
        role: "RESEARCHER",
      });
    } catch (err: any) {
      unauthorizedBlocked = true;
      assert.equal(err.statusCode, 403, "Unauthorized researcher blocked with 403");
    }
    assert.ok(unauthorizedBlocked, "Completed research documents restricted to authorized users");
    console.log("✓ Test 9, 10 & 11 passed: Completed Research list, details, history & auth verified");

    console.log("=== ALL E2E TESTS PASSED SUCCESSFULLY ===");
  } finally {
    // Cleanup test project records
    if (testProjectId > 0) {
      const uploadDir = path.join(process.cwd(), "uploads", "manuscripts");
      const dummyPdfPath = path.join(uploadDir, `e2e-test-manuscript-${testProjectId}.pdf`);
      await fs.unlink(dummyPdfPath).catch(() => {});

      await pool.query("DELETE FROM review_activity_logs WHERE projectId = ?", [testProjectId]).catch(() => {});
      await pool.query("DELETE FROM research_activity_logs WHERE projectId = ?", [testProjectId]).catch(() => {});
      await pool.query("DELETE FROM review_feedback WHERE projectId = ?", [testProjectId]).catch(() => {});
      await pool.query("DELETE FROM professional_reviews WHERE projectId = ?", [testProjectId]).catch(() => {});
      await pool.query("DELETE FROM review_area_coverage WHERE projectId = ?", [testProjectId]).catch(() => {});
      await pool.query("DELETE FROM review_assignments WHERE projectId = ?", [testProjectId]).catch(() => {});
      await pool.query("DELETE FROM review_submissions WHERE projectId = ?", [testProjectId]).catch(() => {});
      await pool.query("DELETE FROM research_completions WHERE projectId = ?", [testProjectId]).catch(() => {});
      await pool.query("DELETE FROM research_manuscripts WHERE projectId = ?", [testProjectId]).catch(() => {});
      await pool.query("DELETE FROM research_dossiers WHERE projectId = ?", [testProjectId]).catch(() => {});
      await pool.query("DELETE FROM research_insilico_syntheses WHERE projectId = ?", [testProjectId]).catch(() => {});
      await pool.query("DELETE FROM docking_runs WHERE projectId = ?", [testProjectId]).catch(() => {});
      await pool.query("DELETE FROM insilico_results WHERE projectId = ?", [testProjectId]).catch(() => {});
      await pool.query("DELETE FROM docking_targets WHERE projectId = ?", [testProjectId]).catch(() => {});
      await pool.query("DELETE FROM research_compounds WHERE projectId = ?", [testProjectId]).catch(() => {});
      await pool.query("DELETE FROM research_batch_analyses WHERE projectId = ?", [testProjectId]).catch(() => {});
      await pool.query("DELETE FROM formulation_components WHERE projectId = ?", [testProjectId]).catch(() => {});
      await pool.query("DELETE FROM research_formulations WHERE projectId = ?", [testProjectId]).catch(() => {});
      await pool.query("DELETE FROM research_materials WHERE projectId = ?", [testProjectId]).catch(() => {});
      await pool.query("DELETE FROM research_product_selections WHERE projectId = ?", [testProjectId]).catch(() => {});
      await pool.query("DELETE FROM research_plant_data WHERE projectId = ?", [testProjectId]).catch(() => {});
      await pool.query("DELETE FROM research_projects WHERE id = ?", [testProjectId]).catch(() => {});
    }
    await pool.end();
  }
}

runTests().catch((err) => {
  console.error("E2E Test Failed:", err);
  process.exit(1);
});
