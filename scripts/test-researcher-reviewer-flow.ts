import pool from "../src/lib/db";
import {
  toggleStepApproval,
  getProjectApprovedSteps,
  approveAllSectionSteps,
  ensureReviewTables,
} from "../src/lib/expert-review-assignment";
import { calculateV2ProjectProgress } from "../src/lib/v2-progress-service";
import {
  getProjectProfessionalApprovalState,
  completeApprovedResearchProject,
} from "../src/lib/research-approval-completion-service";

async function runTests() {
  console.log("=================================================================");
  console.log("STARTING END-TO-END RESEARCHER <-> REVIEWER INTEGRATION TESTS");
  console.log("=================================================================\n");

  let testPassed = 0;
  let testFailed = 0;

  function assert(condition: boolean, testName: string, details?: any) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      testPassed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      if (details) console.error("    Details:", details);
      testFailed++;
    }
  }

  try {
    // 1. Ensure DB tables
    console.log("[1/6] Verifying Database Tables...");
    await ensureReviewTables();
    assert(true, "Database tables ensured (including review_step_approvals)");

    // Find or create test users
    const [researchers]: any = await pool.query(
      "SELECT id, name, email FROM users WHERE role = 'RESEARCHER' LIMIT 1"
    );
    const [reviewers]: any = await pool.query(
      "SELECT id, name, email FROM users WHERE role = 'REVIEWER' LIMIT 1"
    );

    let researcherId = researchers[0]?.id;
    let reviewerId = reviewers[0]?.id;

    if (!researcherId) {
      console.log("Creating test researcher user...");
      const [res]: any = await pool.query(
        "INSERT INTO users (name, email, passwordHash, role) VALUES ('Test Researcher', 'test.researcher@natureaide.org', 'test_hash', 'RESEARCHER')"
      );
      researcherId = res.insertId;
    }

    if (!reviewerId) {
      console.log("Creating test reviewer user...");
      const [res]: any = await pool.query(
        "INSERT INTO users (name, email, passwordHash, role) VALUES ('Test Reviewer', 'test.reviewer@natureaide.org', 'test_hash', 'REVIEWER')"
      );
      reviewerId = res.insertId;
    }

    assert(Boolean(researcherId && reviewerId), `Test users ready: Researcher #${researcherId}, Reviewer #${reviewerId}`);

    // Find or create a test project
    let [projects]: any = await pool.query(
      "SELECT id, title, status FROM research_projects WHERE researcherId = ? LIMIT 1",
      [researcherId]
    );

    let projectId: number;
    if (projects.length === 0) {
      console.log("Creating test research project...");
      const [newProj]: any = await pool.query(
        `INSERT INTO research_projects (title, researcherId, status, plantCustomName, progressPercent, createdAt, updatedAt)
         VALUES ('Akapulko Dermatological Gel R&D', ?, 'DRAFT', 'Akapulko (Senna alata)', 50, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))`,
        [researcherId]
      );
      projectId = newProj.insertId;
    } else {
      projectId = projects[0].id;
    }

    console.log(`Using Test Project #${projectId}`);
    const [allSubsForProj]: any = await pool.query("SELECT id, reviewRound, status FROM review_submissions WHERE projectId = ? ORDER BY reviewRound DESC, id DESC", [projectId]);
    console.log("Existing submissions for project:", allSubsForProj);

    // Ensure project is not marked as completed before completion test
    await pool.query("DELETE FROM research_completions WHERE projectId = ?", [projectId]);
    await pool.query("UPDATE research_projects SET status = 'UNDER_REVIEW' WHERE id = ?", [projectId]);

    // Ensure Section 1 prerequisites in DB
    await pool.query(
      `INSERT INTO research_plant_data (projectId, commonName, scientificName, partsStudied, extractionMethod, extractionSolvent, updatedAt)
       VALUES (?, 'Akapulko', 'Senna alata', 'Leaves', 'Maceration with Agitation', 'Ethanol 70%', CURRENT_TIMESTAMP(3))
       ON DUPLICATE KEY UPDATE partsStudied = 'Leaves', extractionMethod = 'Maceration with Agitation', extractionSolvent = 'Ethanol 70%', updatedAt = CURRENT_TIMESTAMP(3)`,
      [projectId]
    );

    await pool.query(
      `INSERT INTO research_product_selections (projectId, productType, deliveryFormat, createdAt, updatedAt)
       VALUES (?, 'Topical Gel', 'Hydrogel', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
       ON DUPLICATE KEY UPDATE productType = 'Topical Gel', deliveryFormat = 'Hydrogel', updatedAt = CURRENT_TIMESTAMP(3)`,
      [projectId]
    );

    await pool.query(
      `INSERT INTO research_materials (projectId, materialName, materialType, createdAt, updatedAt)
       VALUES (?, 'Carbopol 940', 'EXCIPIENT', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
       ON DUPLICATE KEY UPDATE materialName = 'Carbopol 940', updatedAt = CURRENT_TIMESTAMP(3)`,
      [projectId]
    );

    const [rfRows]: any = await pool.query("SELECT id FROM research_formulations WHERE projectId = ? LIMIT 1", [projectId]);
    let formId = rfRows[0]?.id;
    if (!formId) {
      const [newRf]: any = await pool.query(
        `INSERT INTO research_formulations (projectId, formulationName, formulationType, createdAt, updatedAt)
         VALUES (?, 'Akapulko Hydrogel', 'Topical Gel', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))`,
        [projectId]
      );
      formId = newRf.insertId;
    }

    await pool.query(
      `INSERT INTO formulation_components (projectId, formulationId, componentName, roleInFormulation, quantity)
       VALUES (?, ?, 'Akapulko Leaf Extract', 'Active Botanical', 5.0),
              (?, ?, 'Carbomer 940', 'Gelling Agent', 1.0)
       ON DUPLICATE KEY UPDATE quantity = 5.0`,
      [projectId, formId, projectId, formId]
    );

    await pool.query(
      `INSERT INTO research_batch_analyses (projectId, formulationId, batchNumber, pH, appearance, status, createdAt, updatedAt)
       VALUES (?, ?, 'BATCH-2026-001', 5.8, 'Translucent herbal gel', 'PASSED', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
       ON DUPLICATE KEY UPDATE status = 'PASSED', updatedAt = CURRENT_TIMESTAMP(3)`,
      [projectId, formId]
    );

    // Ensure Section 2 prerequisites in DB
    await pool.query(
      `INSERT INTO research_compounds (projectId, compoundName, smiles, molecularFormula, molecularWeight, pubchemId, createdAt)
       VALUES (?, 'Rhein', 'C15H8O6', 'C15H8O6', 284.22, 10168, CURRENT_TIMESTAMP(3))
       ON DUPLICATE KEY UPDATE compoundName = 'Rhein'`,
      [projectId]
    );

    await pool.query(
      `INSERT INTO docking_targets (projectId, targetName, pdbId, organism, status, createdAt)
       VALUES (?, 'Lanosterol 14-alpha demethylase', '5V5Z', 'Candida albicans', 'PREPARED', CURRENT_TIMESTAMP(3))
       ON DUPLICATE KEY UPDATE targetName = 'Lanosterol 14-alpha demethylase'`,
      [projectId]
    );

    await pool.query(
      `INSERT INTO insilico_results (projectId, compoundName, targetSelection, engineStatus, createdAt, updatedAt)
       VALUES (?, 'Rhein', 'Lanosterol 14-alpha demethylase', 'COMPLETED', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
       ON DUPLICATE KEY UPDATE engineStatus = 'COMPLETED', updatedAt = CURRENT_TIMESTAMP(3)`,
      [projectId]
    );

    await pool.query(
      `INSERT INTO docking_runs (projectId, ligandName, targetProtein, bindingAffinity, pdbId, engineStatus, createdAt, updatedAt)
       VALUES (?, 'Rhein', 'CYP51 (5V5Z)', -8.4, '5V5Z', 'COMPLETED', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
       ON DUPLICATE KEY UPDATE bindingAffinity = -8.4, engineStatus = 'COMPLETED', updatedAt = CURRENT_TIMESTAMP(3)`,
      [projectId]
    );

    await pool.query(
      `INSERT INTO research_docking_syntheses (projectId, keyFindings, importantInteractions, updatedAt)
       VALUES (?, 'High-affinity binding observed for Rhein against fungal target CYP51.', 'Hydrogen bonds at Tyr118 and Met508', CURRENT_TIMESTAMP(3))
       ON DUPLICATE KEY UPDATE keyFindings = 'High-affinity binding observed for Rhein against fungal target CYP51.', updatedAt = CURRENT_TIMESTAMP(3)`,
      [projectId]
    );

    // Ensure Section 3 prerequisites in DB
    await pool.query(
      `INSERT INTO research_dossiers (projectId, executiveSummary, createdAt, updatedAt)
       VALUES (?, 'Executive research summary of Akapulko topical gel.', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
       ON DUPLICATE KEY UPDATE executiveSummary = 'Executive research summary of Akapulko topical gel.', updatedAt = CURRENT_TIMESTAMP(3)`,
      [projectId]
    );

    await pool.query(
      `INSERT INTO research_manuscripts (projectId, title, fileName, fileSize, status, uploadedAt)
       VALUES (?, 'Akapulko Scientific Paper.pdf', 'akapulko_gel_manuscript.pdf', 1048576, 'UPLOADED', CURRENT_TIMESTAMP(3))
       ON DUPLICATE KEY UPDATE fileName = 'akapulko_gel_manuscript.pdf', status = 'UPLOADED'`,
      [projectId]
    );

    // [2/6] Test V2 Progress Service
    console.log("\n[2/6] Testing V2 Progress Calculation (Section 3 Simplification)...");
    const v2Progress = await calculateV2ProjectProgress(projectId);
    assert(v2Progress.section3.totalSteps === 2, "Section 3 totalSteps is exactly 2 (Step 1 Summary, Step 2 Manuscript)");
    assert(v2Progress.section3.steps.length === 2, "Section 3 steps array length is exactly 2");
    assert(v2Progress.section3.steps[0].stepKey === "research-summary", "Section 3 Step 1 is 'research-summary'");
    assert(v2Progress.section3.steps[1].stepKey === "upload-research-paper", "Section 3 Step 2 is 'upload-research-paper'");
    assert(Boolean(v2Progress.sectionApprovalPercent), "V2 progress includes sectionApprovalPercent object");
    assert(Boolean(v2Progress.approvedStepsBySection), "V2 progress includes approvedStepsBySection object");

    // [3/6] Test Review Submission Setup
    console.log("\n[3/6] Setting Up Review Submission for Project...");
    let [subs]: any = await pool.query(
      "SELECT id, reviewRound, status FROM review_submissions WHERE projectId = ? ORDER BY reviewRound DESC LIMIT 1",
      [projectId]
    );

    let submissionId: number;
    if (subs.length === 0) {
      const [newSub]: any = await pool.query(
        `INSERT INTO review_submissions (projectId, reviewRound, versionTag, status, submittedAt)
         VALUES (?, 1, 'v1.0', 'UNDER_REVIEW', CURRENT_TIMESTAMP(3))`,
        [projectId]
      );
      submissionId = newSub.insertId;
    } else {
      submissionId = subs[0].id;
    }

    // Ensure coverage rows
    const areas = ["formulation", "bioinformatics", "pharmacology"];
    for (const area of areas) {
      await pool.query(
        `INSERT INTO review_area_coverage (submissionId, projectId, areaKey, status, reviewerId)
         VALUES (?, ?, ?, 'IN_REVIEW', ?)
         ON DUPLICATE KEY UPDATE status = 'IN_REVIEW', reviewerId = ?`,
        [submissionId, projectId, area, reviewerId, reviewerId]
      );
      await pool.query(
        `INSERT INTO review_assignments (projectId, submissionId, reviewerId, specialtyNeeded, status)
         VALUES (?, ?, ?, ?, 'IN_REVIEW')
         ON DUPLICATE KEY UPDATE status = 'IN_REVIEW'`,
        [projectId, submissionId, reviewerId, area]
      );
    }
    assert(Boolean(submissionId), `Review submission active: #${submissionId}`);

    // [4/6] Test Database Step Approvals & Reconcile
    console.log("\n[4/6] Testing Step Approvals Persistence & Section Auto-Synchronization...");
    
    // Clear any previous step approvals for clean test
    await pool.query("DELETE FROM review_step_approvals WHERE projectId = ?", [projectId]);

    // Initial state: 0 approved steps
    let approvedSteps = await getProjectApprovedSteps(projectId);
    assert(
      approvedSteps.section1.length === 0 &&
      approvedSteps.section2.length === 0 &&
      approvedSteps.section3.length === 0,
      "Initial step approvals are empty (0 approved)"
    );

    // Toggle Section 1 Step 1 approval
    console.log("  Approving Section 1 Step 1...");
    const s1_1 = await toggleStepApproval(
      projectId,
      "section1",
      1,
      reviewerId,
      undefined,
      submissionId
    );
    assert(s1_1.isStepApproved === true, "Section 1 Step 1 toggled to APPROVED");
    assert(s1_1.approvedSteps.section1.length === 1, "Section 1 approvedCount is 1 of 6");
    assert(s1_1.sectionApprovedPercent === 17, "Section 1 approvedPercent is 17% (1/6)");
    assert(s1_1.sectionStatus === "In Review", "Section 1 status is In Review because 1 of 6 approved");

    // Verify it was persisted to MySQL
    const [dbRows]: any = await pool.query(
      "SELECT * FROM review_step_approvals WHERE projectId = ? AND sectionKey = 'section1' AND stepNumber = 1",
      [projectId]
    );
    assert(dbRows.length === 1, "Step approval found in MySQL review_step_approvals table");
    assert(dbRows[0].reviewerId === reviewerId, "Step approval has correct reviewerId");

    // Now approve all remaining steps of Section 1 (2..6)
    console.log("  Approving remaining steps of Section 1 (Steps 2 to 6)...");
    for (let st = 2; st <= 6; st++) {
      await toggleStepApproval(
        projectId,
        "section1",
        st,
        reviewerId,
        true,
        submissionId
      );
    }

    // Verify that approving already approved step keeps it approved (cannot be accidentally toggled off)
    const reApprove = await toggleStepApproval(
      projectId,
      "section1",
      1,
      reviewerId,
      undefined,
      submissionId
    );
    assert(reApprove.isStepApproved === true, "Section 1 Step 1 remains approved on re-call (not toggled off)");

    // Test explicit disapproval (admin override only)
    const s1_full = await toggleStepApproval(
      projectId,
      "section1",
      6,
      reviewerId,
      false, // explicit unapprove
      submissionId
    );
    assert(s1_full.isStepApproved === false, "Section 1 Step 6 unapproved with explicit false");
    assert(s1_full.sectionStatus === "In Review", "Section 1 reverted to In Review when missing a step");

    // toggle step 6 back on:
    const s1_complete = await toggleStepApproval(
      projectId,
      "section1",
      6,
      reviewerId,
      true,
      submissionId
    );
    assert(s1_complete.isStepApproved === true, "Section 1 Step 6 toggled back on");
    assert(s1_complete.approvedSteps.section1.length === 6, "Section 1 has all 6 of 6 steps approved");
    assert(s1_complete.sectionApprovedPercent === 100, "Section 1 approvedPercent is 100%");
    assert(s1_complete.sectionStatus === "Approved", "Section 1 automatically marked Approved in review_area_coverage & review_assignments");

    // Verify Section 2 (8 steps) bulk approve
    console.log("  Approving all 8 steps of Section 2 (Bioinformatics)...");
    await approveAllSectionSteps(projectId, "section2", reviewerId, submissionId);
    let checkSteps = await getProjectApprovedSteps(projectId);
    assert(checkSteps.section2.length === 8, "Section 2 has all 8 steps approved in MySQL");

    // Verify Section 3 (2 steps) bulk approve
    console.log("  Approving all 2 steps of Section 3 (Clinical Pharmacology & Paper Review)...");
    await approveAllSectionSteps(projectId, "section3", reviewerId, submissionId);
    checkSteps = await getProjectApprovedSteps(projectId);
    assert(checkSteps.section3.length === 2, "Section 3 has both 2 steps approved in MySQL");

    const [covRows]: any = await pool.query("SELECT areaKey, status, reviewerId FROM review_area_coverage WHERE submissionId = ?", [submissionId]);
    console.log("Coverage rows in MySQL for submissionId:", submissionId, covRows);

    // [5/6] Test Revisions & Findings Lifecycle (Reviewer -> Researcher -> Reviewer)
    console.log("\n[5/6] Testing Revisions Feedback Lifecycle (Reviewer -> Researcher -> Reviewer)...");
    // Ensure findings table
    await pool.query(
      `CREATE TABLE IF NOT EXISTS review_findings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        projectId INT NOT NULL,
        submissionId INT NOT NULL,
        reviewerId INT NOT NULL,
        areaKey VARCHAR(64) NOT NULL,
        stepNumber INT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        severity VARCHAR(32) NOT NULL DEFAULT 'MAJOR',
        status VARCHAR(32) NOT NULL DEFAULT 'OPEN',
        researcherNotes TEXT NULL,
        resubmittedAt DATETIME NULL,
        resolvedAt DATETIME NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_proj (projectId),
        INDEX idx_sub (submissionId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );

    // 1. Reviewer logs finding on Step 1
    const [findRes]: any = await pool.query(
      `INSERT INTO review_findings (projectId, submissionId, reviewerId, areaKey, stepNumber, title, description, severity, status)
       VALUES (?, ?, ?, 'formulation', 1, 'Authentication Voucher Needed', 'Please provide high resolution specimen herbarium voucher.', 'MAJOR', 'OPEN')`,
      [projectId, submissionId, reviewerId]
    );
    const findingId = findRes.insertId;
    assert(Boolean(findingId), `Reviewer created revision finding #${findingId} on Step 1`);

    // 2. Researcher views finding & resubmits with implementation note
    console.log("  Researcher resubmitting revision implementation note...");
    await pool.query(
      `UPDATE review_findings
       SET status = 'IN_REVIEW', researcherNotes = 'Added high resolution specimen voucher photo with barcode #102938.', resubmittedAt = CURRENT_TIMESTAMP(3)
       WHERE id = ?`,
      [findingId]
    );

    const [updatedFinding]: any = await pool.query(
      "SELECT id, status, researcherNotes, resubmittedAt FROM review_findings WHERE id = ?",
      [findingId]
    );
    assert(updatedFinding[0].status === "IN_REVIEW", "Finding status updated to IN_REVIEW upon researcher resubmission");
    assert(updatedFinding[0].researcherNotes.includes("barcode #102938"), "Researcher note recorded correctly");

    // 3. Reviewer inspects step & resolves revision
    console.log("  Reviewer inspecting step and marking revision as resolved...");
    await pool.query(
      `UPDATE review_findings
       SET status = 'RESOLVED', resolvedAt = CURRENT_TIMESTAMP(3)
       WHERE id = ?`,
      [findingId]
    );

    const [resolvedFinding]: any = await pool.query(
      "SELECT id, status, resolvedAt FROM review_findings WHERE id = ?",
      [findingId]
    );
    assert(resolvedFinding[0].status === "RESOLVED", "Finding status updated to RESOLVED");
    assert(Boolean(resolvedFinding[0].resolvedAt), "resolvedAt timestamp recorded");

    // Clean up test finding
    await pool.query("DELETE FROM review_findings WHERE id = ?", [findingId]);

    // [6/6] Test Professional Approval State & Project Completion
    console.log("\n[6/6] Testing Researcher Section 4 Professional Approval & Completion...");
    const profState = await getProjectProfessionalApprovalState(projectId);
    if (!profState) throw new Error("profState is null");
    console.log("  Specialties statuses:", profState.specialties.map(s => ({ key: s.areaKey, status: s.status, rawStatus: s.rawStatus })));
    
    assert(profState.approvedCount === 3, "All 3 professional roles approved");
    assert(profState.specialties.length === 3, "3 specialty approval rows returned");
    assert(profState.canCompleteResearch === true, "canCompleteResearch is TRUE");
    assert(profState.overallApprovalPercent === 100, "overallApprovalPercent is 100%");
    assert(Boolean(profState.approvedStepsBySection), "approvedStepsBySection attached to response");
    assert(profState.approvedStepsBySection?.section1.length === 6, "Section 1: 6 of 6 approved in state");
    assert(profState.approvedStepsBySection?.section2.length === 8, "Section 2: 8 of 8 approved in state");
    assert(profState.approvedStepsBySection?.section3.length === 2, "Section 3: 2 of 2 approved in state");

    // Test completion execution
    console.log("  Completing research project...");
    const completedState = await completeApprovedResearchProject({
      projectId,
      researcherId,
    });
    assert(completedState.isCompleted === true, "Project successfully transitioned to COMPLETED");
    assert(completedState.projectStatus === "COMPLETED", "projectStatus is COMPLETED");

    console.log("\n=================================================================");
    console.log(`TEST SUMMARY: ${testPassed} PASSED, ${testFailed} FAILED`);
    console.log("=================================================================\n");

    if (testFailed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Test execution threw an uncaught error:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runTests();
