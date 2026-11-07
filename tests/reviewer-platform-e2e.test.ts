import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import pool from "../src/lib/db";
import {
  EXPERT_REVIEW_AREAS,
  expertReviewAreaLabel,
} from "../src/lib/expert-review-areas";
import {
  ensureReviewTables,
  getReviewerSpecialties,
  setReviewerSpecialties,
  assertReviewerPermissionForSpecialty,
  buildFullDossierSnapshot,
  openExpertReviewCycle,
  evaluateOverallApproval,
} from "../src/lib/expert-review-assignment";

async function runTests() {
  console.log("=================================================================");
  console.log("NatureAide V2 — Professional Reviewer Platform E2E Verification");
  console.log("=================================================================\n");

  await ensureReviewTables();

  const researcherId = 2; // Dr. Aris Dela Cruz
  const reviewerId = 3; // Elena Rostova, RPh

  // Create a dedicated temporary test project cloned from Project 36 so we never corrupt existing researcher work
  const [proj36Rows]: any = await pool.query(
    `SELECT * FROM research_projects WHERE id = 36 LIMIT 1`
  );
  const baseProj = proj36Rows[0] || {
    plantId: 5,
    title: "Akapulko Topical Hydrogel Review Test",
    researchObjective: "Evaluate Akapulko hydrogel formulation and docking",
  };

  const [insProj]: any = await pool.query(
    `INSERT INTO research_projects (
       researcherId, plantId, title, researchObjective, status, currentStage, progressPercent, createdAt, updatedAt
     ) VALUES (?, ?, ?, ?, 'IN_PROGRESS', 'submission', 100, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))`,
    [
      researcherId,
      baseProj.plantId || 5,
      "[E2E TEST] Akapulko Topical Hydrogel Multidisciplinary Review",
      baseProj.researchObjective || "Test objective",
    ]
  );
  const testProjectId = Number(insProj.insertId);

  try {
    // Seed realistic V2 Section 1, 2, 3 data for testProjectId
    await pool.query(
      `INSERT INTO research_plant_data (projectId, commonName, scientificName, family, partsStudied, extractionMethod, extractionSolvent, materialType)
       VALUES (?, 'Akapulko', 'Senna alata', 'Fabaceae', 'Leaves', 'Ultrasonic-Assisted Extraction', '70% Ethanol', 'Hydroethanolic Extract')`,
      [testProjectId]
    );
    await pool.query(
      `INSERT INTO research_product_selections (projectId, productType, deliveryFormat, targetIndications)
       VALUES (?, 'Topical Hydrogel', 'Hydrogel', 'Cutaneous fungal and inflammatory conditions')`,
      [testProjectId]
    );
    await pool.query(
      `INSERT INTO research_batch_analyses (projectId, batchNumber, activeConcentrationPercent, pH, viscosity, appearance, status)
       VALUES (?, 'BATCH-01', 5.0, 5.8, 4200, 'Homogeneous amber gel', 'Simulated')`,
      [testProjectId]
    );
    const [compIns]: any = await pool.query(
      `INSERT INTO research_compounds (projectId, compoundName, molecularFormula, molecularWeight, smiles, selectedForDocking)
       VALUES (?, 'Aloe-emodin', 'C15H10O5', 270.24, 'C1=CC2=C(C(=C1)O)C(=O)C3=C(C2=O)C=C(C=C3O)CO', 1)`,
      [testProjectId]
    );
    const testCompoundId = compIns.insertId;
    const [targIns]: any = await pool.query(
      `INSERT INTO docking_targets (projectId, targetName, pdbId, organism)
       VALUES (?, 'Prostaglandin G/H synthase 2', '5KIR', 'Homo sapiens')`,
      [testProjectId]
    );
    const testTargetId = targIns.insertId;
    await pool.query(
      `INSERT INTO docking_runs (projectId, compoundId, targetId, ligandName, targetProtein, pdbId, bindingAffinity, jobStatus)
       VALUES (?, ?, ?, 'Aloe-emodin', 'Prostaglandin G/H synthase 2', '5KIR', -8.91, 'COMPLETED')`,
      [testProjectId, testCompoundId, testTargetId]
    );
    await pool.query(
      `INSERT INTO research_dossiers (projectId, researcherId, currentVersionTag, executiveSummary, status)
       VALUES (?, ?, 'v1.0', 'Compiled executive summary for Akapulko Topical Hydrogel.', 'DRAFT')`,
      [testProjectId, researcherId]
    );

    // -------------------------------------------------------------------------
    // TEST 1: All 5 Reviewer Specialties & Multi-Specialty Assignment
    // -------------------------------------------------------------------------
    console.log("Test 1: Verify 5 Reviewer Specialties & Multi-Specialty Assignment...");
    assert.strictEqual(EXPERT_REVIEW_AREAS.length, 5, "Must have exactly 5 specialties");
    const expectedLabels = [
      "Pharmacognosy",
      "Bioinformatics",
      "Pharmacology",
      "Formulation Science",
      "Clinical Safety",
    ];
    assert.deepStrictEqual(
      EXPERT_REVIEW_AREAS.map((a) => a.label),
      expectedLabels,
      "Specialty labels must match requirements"
    );

    // Test assigning a subset (2 specialties) to reviewerId
    const subset = await setReviewerSpecialties(
      reviewerId,
      ["pharmacognosy", "bioinformatics"],
      reviewerId
    );
    assert.deepStrictEqual(subset, ["pharmacognosy", "bioinformatics"]);
    const fetchedSubset = await getReviewerSpecialties(reviewerId);
    assert.deepStrictEqual(fetchedSubset, ["pharmacognosy", "bioinformatics"]);

    // Restore all 5 specialties to reviewerId (multi-specialty in same account)
    const allFiveKeys = EXPERT_REVIEW_AREAS.map((a) => a.key);
    const assignedAll = await setReviewerSpecialties(reviewerId, allFiveKeys, reviewerId);
    assert.strictEqual(assignedAll.length, 5, "Reviewer account holds all 5 specialties");
    console.log("  ✓ Passed Test 1 (Single & multi-specialty assignment in same account)");

    // -------------------------------------------------------------------------
    // TEST 2: Research Submissions Appear in Reviewer Assignments (v1.0)
    // -------------------------------------------------------------------------
    console.log("Test 2: Verify Research Submission v1.0 Creates All 5 Specialty Assignments...");
    const snapV1 = await buildFullDossierSnapshot(testProjectId);
    const subV1 = await openExpertReviewCycle({
      projectId: testProjectId,
      researcherId,
      message: "Initial submission v1.0",
      snapshotData: snapV1,
    });
    assert.strictEqual(subV1.versionTag, "v1.0");
    assert.strictEqual(subV1.reviewRound, 1);

    const [v1Cov]: any = await pool.query(
      `SELECT areaKey, status, reviewerId FROM review_area_coverage WHERE submissionId = ?`,
      [subV1.submissionId]
    );
    assert.strictEqual(v1Cov.length, 5, "All 5 specialties must have coverage records");
    for (const row of v1Cov) {
      assert.strictEqual(row.status, "PENDING", `Initial status for ${row.areaKey} is PENDING`);
    }
    console.log("  ✓ Passed Test 2 (v1.0 submission assigned across all 5 specialties)");

    // -------------------------------------------------------------------------
    // TEST 3: Reviewer Draft & Comments Save Successfully
    // -------------------------------------------------------------------------
    console.log("Test 3: Verify Reviewer Draft & Checklist Save...");
    await assertReviewerPermissionForSpecialty({
      reviewerId,
      projectId: testProjectId,
      submissionId: subV1.submissionId,
      areaKey: "pharmacognosy",
      requireUnlocked: true,
    });

    await pool.query(
      `UPDATE professional_reviews
       SET comments = 'Draft pharmacognosy notes on Senna alata leaves.',
           checklistData = ?,
           status = 'DRAFT'
       WHERE submissionId = ? AND areaKey = 'pharmacognosy'`,
      [
        JSON.stringify({ "Botanical identity and scientific name verification": true }),
        subV1.submissionId,
      ]
    );
    await pool.query(
      `UPDATE review_area_coverage SET status = 'IN_REVIEW' WHERE submissionId = ? AND areaKey = 'pharmacognosy'`,
      [subV1.submissionId]
    );

    const [draftRow]: any = await pool.query(
      `SELECT comments, status, checklistData FROM professional_reviews WHERE submissionId = ? AND areaKey = 'pharmacognosy'`,
      [subV1.submissionId]
    );
    assert.strictEqual(draftRow[0].status, "DRAFT");
    assert.ok(draftRow[0].comments.includes("Senna alata"));
    console.log("  ✓ Passed Test 3 (Reviewer draft and criteria checklist saved)");

    // -------------------------------------------------------------------------
    // TEST 4: Approve 4 Specialties & Request Revisions on 1 Specialty (Formulation Science)
    // -------------------------------------------------------------------------
    console.log("Test 4: Approve 4 Specialties & Request Revisions on Formulation Science...");
    const approvedInV1 = ["pharmacognosy", "bioinformatics", "pharmacology", "clinical_safety"];
    for (const areaKey of approvedInV1) {
      await pool.query(
        `UPDATE professional_reviews
         SET assessment = 'ACCEPTABLE',
             comments = ?,
             status = 'SUBMITTED',
             submittedAt = CURRENT_TIMESTAMP(3)
         WHERE submissionId = ? AND areaKey = ?`,
        [`Approved ${expertReviewAreaLabel(areaKey)} in v1.0.`, subV1.submissionId, areaKey]
      );
      await pool.query(
        `UPDATE review_area_coverage SET status = 'APPROVED' WHERE submissionId = ? AND areaKey = ?`,
        [subV1.submissionId, areaKey]
      );
      await pool.query(
        `UPDATE review_assignments SET status = 'COMPLETED', completedAt = CURRENT_TIMESTAMP(3) WHERE submissionId = ? AND specialtyNeeded = ?`,
        [subV1.submissionId, areaKey]
      );
    }

    // Request revisions on Formulation Science
    const revisionComment =
      "Please clarify the viscosity specification and add a second batch concentration at 7.5% extract.";
    await pool.query(
      `UPDATE professional_reviews
       SET assessment = 'REVISION_REQUIRED',
           comments = ?,
           status = 'SUBMITTED',
           submittedAt = CURRENT_TIMESTAMP(3)
       WHERE submissionId = ? AND areaKey = 'formulation'`,
      [revisionComment, subV1.submissionId]
    );
    await pool.query(
      `UPDATE review_area_coverage SET status = 'REVISION_REQUIRED' WHERE submissionId = ? AND areaKey = 'formulation'`,
      [subV1.submissionId]
    );
    await pool.query(
      `INSERT INTO review_feedback (
         projectId, submissionId, reviewerId, reviewRound, areaKey, sectionName, title,
         commentType, severity, reviewerName, comment, recommendation, status, affectedStage
       ) VALUES (?, ?, ?, 1, 'formulation', 'Formulation Science Review', 'Batch Viscosity Clarification',
                 'REQUIRED_CORRECTION', 'MAJOR', 'Elena Rostova, RPh', ?, ?, 'OPEN', 'formulation')`,
      [testProjectId, subV1.submissionId, reviewerId, revisionComment, revisionComment]
    );

    const evalV1 = await evaluateOverallApproval(subV1.submissionId, testProjectId);
    assert.strictEqual(evalV1.allApproved, false, "Project must not be approved when 1 area requires revision");
    assert.strictEqual(evalV1.approvedCount, 4);
    assert.strictEqual(evalV1.revisionCount, 1);

    const [fbCheck]: any = await pool.query(
      `SELECT * FROM review_feedback WHERE submissionId = ? AND areaKey = 'formulation'`,
      [subV1.submissionId]
    );
    assert.strictEqual(fbCheck.length, 1, "Revision feedback must be stored for researcher");
    console.log("  ✓ Passed Test 4 (Revision request saved and researcher feedback recorded)");

    // -------------------------------------------------------------------------
    // TEST 5, 6, 7: Researcher Revises Formulation & Resubmits (v2.0)
    // - Unchanged approved sections retain valid decisions
    // - Previous versions and comments remain available
    // -------------------------------------------------------------------------
    console.log("Test 5, 6 & 7: Researcher Revises Formulation & Resubmits v2.0...");
    // Researcher modifies Formulation batch analysis ONLY (leaving Pharmacognosy, Bioinformatics, Pharmacology, Clinical Safety unchanged)
    await pool.query(
      `INSERT INTO research_batch_analyses (projectId, batchNumber, activeConcentrationPercent, pH, viscosity, appearance, status)
       VALUES (?, 'BATCH-02', 7.5, 5.7, 4650, 'Homogeneous amber gel', 'Simulated')`,
      [testProjectId]
    );

    const snapV2 = await buildFullDossierSnapshot(testProjectId);
    const subV2 = await openExpertReviewCycle({
      projectId: testProjectId,
      researcherId,
      message: "Added 7.5% trial batch per Formulation Science reviewer request.",
      snapshotData: snapV2,
    });

    assert.strictEqual(subV2.versionTag, "v2.0", "New submission version must be v2.0");
    assert.strictEqual(subV2.reviewRound, 2);
    assert.ok(
      subV2.changedAreas.includes("formulation"),
      "Formulation Science must be detected as modified"
    );
    assert.strictEqual(
      subV2.retainedApprovedAreas.length,
      4,
      "All 4 unchanged approved specialties must retain their valid approvals in v2.0"
    );
    assert.deepStrictEqual(
      subV2.requiresReviewAreas,
      ["formulation"],
      "Only Formulation Science requires re-review in v2.0"
    );

    // Verify v1.0 submission and comments are still preserved in MySQL
    const [allSubsAfterV2]: any = await pool.query(
      `SELECT id, versionTag, reviewRound FROM review_submissions WHERE projectId = ? ORDER BY reviewRound ASC`,
      [testProjectId]
    );
    assert.strictEqual(allSubsAfterV2.length, 2, "Both v1.0 and v2.0 must be preserved");
    console.log("  ✓ Passed Tests 5, 6 & 7 (v2.0 created, v1.0 preserved, 4 unchanged approvals retained)");

    // -------------------------------------------------------------------------
    // TEST 8: Substantially Changed Approved Section Requires Renewed Approval
    // -------------------------------------------------------------------------
    console.log("Test 8: Verify Substantially Changed Approved Section Requires Renewed Approval...");
    // Suppose before final approval, the researcher modifies Pharmacognosy extraction solvent and resubmits v3.0
    await pool.query(
      `UPDATE research_plant_data SET extractionSolvent = '95% Absolute Ethanol' WHERE projectId = ?`,
      [testProjectId]
    );
    const snapV3 = await buildFullDossierSnapshot(testProjectId);
    const subV3 = await openExpertReviewCycle({
      projectId: testProjectId,
      researcherId,
      message: "Updated extraction solvent to 95% ethanol.",
      snapshotData: snapV3,
    });

    assert.strictEqual(subV3.versionTag, "v3.0");
    assert.ok(
      subV3.changedAreas.includes("formulation"),
      "Formulation must be detected as changed when extraction solvent changes"
    );
    assert.ok(
      subV3.requiresReviewAreas.includes("formulation"),
      "Previously approved Formulation must require renewed approval after substantial modification"
    );
    assert.ok(
      !subV3.retainedApprovedAreas.includes("formulation"),
      "Modified Formulation must NOT retain prior approval"
    );
    // Meanwhile Bioinformatics, Pharmacology remain unchanged and retain approval!
    assert.strictEqual(subV3.retainedApprovedAreas.length, 2);
    console.log("  ✓ Passed Test 8 (Modified Formulation returned for renewed approval; 2 unchanged retained)");

    // -------------------------------------------------------------------------
    // TEST 9: All 5 Valid Approvals on Same Version Trigger Final Approval & Lock
    // -------------------------------------------------------------------------
    console.log("Test 9: Approve Remaining Specialties on v3.0 to Trigger Final Approval...");
    for (const areaKey of ["pharmacognosy", "formulation"]) {
      await pool.query(
        `UPDATE professional_reviews
         SET assessment = 'ACCEPTABLE',
             comments = ?,
             status = 'SUBMITTED',
             submittedAt = CURRENT_TIMESTAMP(3)
         WHERE submissionId = ? AND areaKey = ?`,
        [`Verified and approved ${areaKey} in v3.0.`, subV3.submissionId, areaKey]
      );
      await pool.query(
        `UPDATE review_area_coverage SET status = 'APPROVED' WHERE submissionId = ? AND areaKey = ?`,
        [subV3.submissionId, areaKey]
      );
      await pool.query(
        `UPDATE review_assignments SET status = 'COMPLETED', completedAt = CURRENT_TIMESTAMP(3) WHERE submissionId = ? AND specialtyNeeded = ?`,
        [subV3.submissionId, areaKey]
      );
    }

    const finalEval = await evaluateOverallApproval(subV3.submissionId, testProjectId);
    assert.strictEqual(finalEval.allApproved, true, "All 5 specialties approved on v3.0");
    assert.strictEqual(finalEval.approvedCount, 5);
    assert.ok(finalEval.finalApprovalSummary, "Final approval summary must be generated");
    assert.strictEqual(finalEval.finalApprovalSummary.approvedVersionTag, "v3.0");
    assert.strictEqual(finalEval.finalApprovalSummary.specialties.length, 5);
    assert.ok(
      finalEval.finalApprovalSummary.regulatoryDisclaimer.includes("NOT constitute clinical validation"),
      "Regulatory disclaimer must state approval is not clinical validation"
    );

    const [lockedSub]: any = await pool.query(
      `SELECT status, isLocked FROM review_submissions WHERE id = ?`,
      [subV3.submissionId]
    );
    assert.strictEqual(lockedSub[0].status, "APPROVED");
    assert.strictEqual(Number(lockedSub[0].isLocked), 1, "Approved submission version must be locked");

    const [approvedProj]: any = await pool.query(
      `SELECT status FROM research_projects WHERE id = ?`,
      [testProjectId]
    );
    assert.strictEqual(approvedProj[0].status, "APPROVED");
    console.log("  ✓ Passed Test 9 (All 5 specialties approved v3.0 -> Final Approval & Locked)");

    // -------------------------------------------------------------------------
    // TEST 10: Reviewer Permissions & Security Guards
    // -------------------------------------------------------------------------
    console.log("Test 10: Verify Reviewer Permissions (No Self-Approval, Unassigned Blocked, Locked Immutable)...");

    // 10a: Researcher cannot approve their own research
    let selfApprovalBlocked = false;
    try {
      await assertReviewerPermissionForSpecialty({
        reviewerId: researcherId, // Same as project.researcherId!
        projectId: testProjectId,
        submissionId: subV3.submissionId,
        areaKey: "pharmacognosy",
      });
    } catch (err: any) {
      selfApprovalBlocked = err.status === 403 && err.message.includes("own research");
    }
    assert.strictEqual(selfApprovalBlocked, true, "Self-approval by researcher must be blocked with 403");

    // 10b: Locked submission cannot be modified
    let lockedModificationBlocked = false;
    try {
      await assertReviewerPermissionForSpecialty({
        reviewerId,
        projectId: testProjectId,
        submissionId: subV3.submissionId,
        areaKey: "pharmacognosy",
        requireUnlocked: true,
      });
    } catch (err: any) {
      lockedModificationBlocked = err.status === 409;
    }
    assert.strictEqual(lockedModificationBlocked, true, "Locked submission modification must be blocked with 409");

    // 10c: Unassigned specialty blocked
    await setReviewerSpecialties(reviewerId, ["pharmacognosy"], reviewerId);
    let unassignedBlocked = false;
    try {
      await assertReviewerPermissionForSpecialty({
        reviewerId,
        projectId: testProjectId,
        submissionId: subV1.submissionId,
        areaKey: "clinical_safety", // Not in ['pharmacognosy']
        requireUnlocked: false,
      });
    } catch (err: any) {
      unassignedBlocked = err.status === 403 && err.message.includes("not assigned");
    }
    assert.strictEqual(unassignedBlocked, true, "Unassigned specialty must be blocked with 403");

    // Restore all 5 specialties to reviewerId
    await setReviewerSpecialties(reviewerId, allFiveKeys, reviewerId);
    console.log("  ✓ Passed Test 10 (Self-approval, unassigned specialty, and locked version guards verified)");

    // -------------------------------------------------------------------------
    // UI & LAYOUT VERIFICATION: Single-Column Workspace & Dashboard Components
    // -------------------------------------------------------------------------
    console.log("Bonus Check: Verify Reviewer Dashboard & Single-Column Workspace Components...");
    const dashboardSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/reviewer/ReviewerDashboardClient.tsx"),
      "utf8"
    );
    assert.ok(dashboardSrc.includes("Assigned Research"), "Dashboard has Assigned Research metric");
    assert.ok(dashboardSrc.includes("Pending Reviews"), "Dashboard has Pending Reviews metric");
    assert.ok(dashboardSrc.includes("Revisions Requested"), "Dashboard has Revisions Requested metric");
    assert.ok(dashboardSrc.includes("Completed Reviews"), "Dashboard has Completed Reviews metric");
    assert.ok(dashboardSrc.includes("Open Review"), "Dashboard has Open Review action");

    const workspaceSrc = fs.readFileSync(
      path.join(process.cwd(), "src/components/reviewer/ProjectReviewWorkspaceClient.tsx"),
      "utf8"
    );
    assert.ok(workspaceSrc.includes("Save Draft"), "Workspace has Save Draft action");
    assert.ok(workspaceSrc.includes("Request Revisions"), "Workspace has Request Revisions action");
    assert.ok(workspaceSrc.includes("Approve Research"), "Workspace has Approve Research action");
    assert.ok(
      workspaceSrc.includes("Professional Review Comments & Recommendations"),
      "Workspace has main review comments textarea"
    );
    console.log("  ✓ Passed Bonus Check (Dashboard & Single-Column Workspace UI verified)");

    console.log("\n=================================================================");
    console.log("ALL 10 PROFESSIONAL REVIEWER PLATFORM E2E TESTS PASSED!");
    console.log("=================================================================");
  } finally {
    // Clean up temporary test project & restore all 5 specialties on reviewerId
    const allFiveKeys = EXPERT_REVIEW_AREAS.map((a) => a.key);
    await setReviewerSpecialties(reviewerId, allFiveKeys, reviewerId);

    await pool.query(`DELETE FROM review_activity_logs WHERE projectId = ?`, [testProjectId]);
    await pool.query(`DELETE FROM research_activity_logs WHERE projectId = ?`, [testProjectId]);
    await pool.query(`DELETE FROM review_notifications WHERE link LIKE ?`, [
      `%/projects/${testProjectId}%`,
    ]);
    await pool.query(`DELETE FROM review_feedback WHERE projectId = ?`, [testProjectId]);
    await pool.query(`DELETE FROM professional_reviews WHERE projectId = ?`, [testProjectId]);
    await pool.query(`DELETE FROM review_area_coverage WHERE projectId = ?`, [testProjectId]);
    await pool.query(`DELETE FROM review_assignments WHERE projectId = ?`, [testProjectId]);
    await pool.query(`DELETE FROM review_submissions WHERE projectId = ?`, [testProjectId]);
    await pool.query(`DELETE FROM research_dossiers WHERE projectId = ?`, [testProjectId]);
    await pool.query(`DELETE FROM docking_runs WHERE projectId = ?`, [testProjectId]);
    await pool.query(`DELETE FROM docking_targets WHERE projectId = ?`, [testProjectId]);
    await pool.query(`DELETE FROM research_compounds WHERE projectId = ?`, [testProjectId]);
    await pool.query(`DELETE FROM research_batch_analyses WHERE projectId = ?`, [testProjectId]);
    await pool.query(`DELETE FROM research_product_selections WHERE projectId = ?`, [testProjectId]);
    await pool.query(`DELETE FROM research_plant_data WHERE projectId = ?`, [testProjectId]);
    await pool.query(`DELETE FROM research_projects WHERE id = ?`, [testProjectId]);
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("E2E Test Failed:", err);
    process.exit(1);
  });
