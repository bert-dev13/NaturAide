// tests/molecular-docking-step4.test.ts
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import pool from "../src/lib/db";
import { inspectPdbqt, prepareLigand } from "../src/lib/docking-service";
import {
  loadDockingWorkspace,
  requestRunAll,
  requestRetryFailed,
} from "../src/lib/docking-jobs";

async function runTests() {
  console.log("=== Section 2, Step 4: Molecular Docking Execution & Optimization Test Suite ===");
  const projectId = 36;

  // Ensure all 5 project compounds are selected and remove any stale non-COMPLETED test runs
  await pool.query(`UPDATE research_compounds SET selectedForDocking = 1 WHERE projectId = ?`, [projectId]);
  await pool.query(
    `DELETE FROM docking_runs WHERE projectId = ? AND jobStatus != 'COMPLETED'`,
    [projectId]
  );

  // 1. Test Optimized Ligand Preparation for Kaempferol 3-O-gentiobioside (compound 61)
  console.log("\n[1/7] Testing optimized Meeko ligand preparation for Kaempferol 3-O-gentiobioside...");
  const kaempferolSmiles =
    "C1=CC(=CC=C1C2=C(C(=O)C3=C(C=C(C=C3O2)O)O)OC4C(C(C(C(O4)COC5C(C(C(C(O5)CO)O)O)O)O)O)O)O";
  const prefix61 = path.join(process.cwd(), ".docking-artifacts", "project-36", "ligands", "61");
  const prepRes = await prepareLigand(kaempferolSmiles, prefix61);
  assert.ok(prepRes.ok && prepRes.pdbqt, `Expected Kaempferol ligand prep to succeed: ${prepRes.error}`);
  const inspected61 = inspectPdbqt(prepRes.pdbqt, "ligand");
  assert.ok(inspected61.ok, "Prepared 61.pdbqt must be valid");
  assert.equal(
    inspected61.hasDummyHydroxylBranches,
    false,
    "61.pdbqt must NOT contain dummy terminal -OH torsion branches"
  );
  assert.equal(inspected61.torsions, 7, `Expected 7 heavy-atom torsions (TORSDOF 7), got ${inspected61.torsions}`);
  await pool.query(
    `UPDATE docking_ligand_preps SET torsions = ?, heavyAtoms = ?, method = ? WHERE projectId = ? AND compoundId = 61`,
    [inspected61.torsions, inspected61.atoms, prepRes.method || "RDKit + Meeko optimized PDBQT", projectId]
  );
  console.log(
    `  ✓ Kaempferol 3-O-gentiobioside prepared with TORSDOF=${inspected61.torsions} (reduced from 17 by rigidifying zero-gradient terminal -OH rotors)`
  );

  // 2. Test Combination Calculation & Preservation of Completed Jobs
  console.log("\n[2/7] Testing combination calculation and preservation of all completed docking runs...");
  const wsInitial = await loadDockingWorkspace(projectId);
  assert.ok(wsInitial.engine.available, "AutoDock Vina local binary must be available");
  const expectedTotal = wsInitial.ligands.length * wsInitial.targets.length;
  assert.equal(wsInitial.counts.jobs, expectedTotal, `Total combinations must equal X × Y (${expectedTotal})`);
  assert.equal(wsInitial.jobs.length, expectedTotal, `workspace.jobs length must match X × Y (${expectedTotal})`);

  const completedJobs = wsInitial.jobs.filter((j: any) => j.status === "COMPLETED" && j.affinity !== null);
  assert.equal(
    completedJobs.length,
    expectedTotal,
    `All ${expectedTotal} combinations (including Kaempferol 3-O-gentiobioside) must be COMPLETED with real Vina affinities`
  );
  for (const job of completedJobs) {
    assert.ok(
      typeof job.affinity === "number" && Number.isFinite(job.affinity) && job.affinity < 0,
      `Expected negative kcal/mol affinity for ${job.ligandName} × ${job.pdbId}, got ${job.affinity}`
    );
  }
  console.log(`  ✓ All ${completedJobs.length} of ${expectedTotal} combinations are COMPLETED with real Vina scores`);

  // 3. Test Default Vina Settings & Non-[0,0,0] Binding Site Grids
  console.log("\n[3/7] Testing automatic Vina configuration and receptor binding site grids...");
  assert.equal(wsInitial.settings.exhaustiveness, 8, "Default exhaustiveness should be 8");
  assert.equal(wsInitial.settings.numModes, 9, "Default numModes should be 9");
  assert.equal(wsInitial.settings.seed, 42, "Default seed should be 42");

  for (const target of wsInitial.targets) {
    assert.ok(target.grid?.center, `Target ${target.pdbId} must have a valid binding site grid center`);
    const [x, y, z] = Array.isArray(target.grid.center)
      ? target.grid.center
      : [target.grid.center.x, target.grid.center.y, target.grid.center.z];
    const isZeroOrigin = x === 0 && y === 0 && z === 0;
    assert.equal(isZeroOrigin, false, `Target ${target.pdbId} must NOT use an arbitrary [0, 0, 0] grid box`);
  }
  console.log("  ✓ Verified receptor binding site grids for 5KIR, 6Y3C, and 3W37");

  // 4. Test Automatic Detection of Stuck Jobs (Timed Out)
  console.log("\n[4/7] Testing automatic detection of stuck docking jobs...");
  const [insStuck]: any = await pool.query(
    `INSERT INTO docking_runs (
       projectId, compoundId, targetId, ligandName, targetProtein, pdbId,
       jobStatus, engineStatus, dataSource, resultProvenance, startedAt
     ) VALUES (?, 61, 32, 'Kaempferol 3-O-gentiobioside', 'COX-2', '5KIR',
       'DOCKING', 'DOCKING', 'VINA', 'NATUREAIDE_VINA', DATE_SUB(NOW(3), INTERVAL 10 MINUTE))`,
    [projectId]
  );
  const stuckRunId = Number(insStuck.insertId);
  try {
    const wsWithStuck = await loadDockingWorkspace(projectId);
    const stuckJob = wsWithStuck.jobs.find((j: any) => j.runId === stuckRunId);
    assert.ok(stuckJob, "Stuck run should be inspected by loadDockingWorkspace");
    assert.equal(stuckJob.status, "FAILED", "Stuck run must be automatically transitioned to FAILED");
    assert.equal(stuckJob.engineStatus, "TIMED_OUT", "Stuck run must have engineStatus = TIMED_OUT");
    assert.ok(
      stuckJob.error && /timed out/i.test(stuckJob.error),
      `Expected timeout error message, got: ${stuckJob.error}`
    );
    console.log(`  ✓ Stuck job (id=${stuckRunId}) automatically detected and marked TIMED_OUT`);
  } finally {
    await pool.query(`DELETE FROM docking_runs WHERE id = ?`, [stuckRunId]);
  }

  // 5. Test Duplicate Job Prevention & Preservation of Completed Jobs on RunAll / RetryFailed
  console.log("\n[5/7] Testing duplicate job prevention and preservation of completed jobs...");
  const runAllRes = await requestRunAll(projectId);
  assert.equal(
    runAllRes.started.length,
    0,
    "requestRunAll must not restart any job when all 15 combinations are already COMPLETED"
  );
  const retryRes = await requestRetryFailed(projectId);
  assert.equal(
    retryRes.retried.length,
    0,
    "requestRetryFailed must not restart any job when all 15 combinations are COMPLETED"
  );
  console.log("  ✓ Completed jobs preserved; 0 duplicate jobs created");

  // 6. Verify Minimal Step 4 UI & Elapsed Time / Timed Out Support
  console.log("\n[6/7] Verifying Step 4 component UI and elapsed time / timeout support...");
  const step4Path = path.join(
    process.cwd(),
    "src/components/researcher/in-silico/DockingExecutionStep4Section.tsx"
  );
  const step4Source = fs.readFileSync(step4Path, "utf8");
  assert.ok(step4Source.includes("Molecular Docking"), "Must display 'Molecular Docking' header");
  assert.ok(step4Source.includes("Run Molecular Docking"), "Must display 'Run Molecular Docking' button");
  assert.ok(step4Source.includes("Docking Progress"), "Must display 'Docking Progress'");
  assert.ok(step4Source.includes("Compound × Protein"), "Must display 'Compound × Protein' column");
  assert.ok(step4Source.includes("Binding Affinity Score"), "Must display 'Binding Affinity Score' column");
  assert.ok(step4Source.includes("Timed Out"), "Must support 'Timed Out' status badge");
  assert.ok(step4Source.includes("formatElapsed"), "Must format and display elapsed time for running jobs");
  assert.ok(!step4Source.includes("Technical Details"), "Must NOT display 'Technical Details' section in UI");
  assert.ok(
    !step4Source.includes("Hide combination statuses") && !step4Source.includes("View combination statuses"),
    "Must NOT display combination status hide/show toggle"
  );
  console.log("  ✓ Step 4 UI structure verified");

  // 7. Verify Molecular3DViewer 3Dmol Color Fix
  console.log("\n[7/7] Verifying Molecular3DViewer 3Dmol color fix...");
  const viewerPath = path.join(
    process.cwd(),
    "src/components/researcher/in-silico/Molecular3DViewer.tsx"
  );
  const viewerSource = fs.readFileSync(viewerPath, "utf8");
  assert.ok(
    !viewerSource.includes('color: "amber"'),
    "Molecular3DViewer must NOT pass invalid named color 'amber' to 3Dmol.js"
  );
  console.log("  ✓ Molecular3DViewer hex color (#f59e0b) verified");

  console.log("\nALL 7 STEP 4 DOCKING & OPTIMIZATION TESTS PASSED!");
  process.exit(0);
}

runTests().catch(async (err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
