// tests/insilico-step8-interpretation.test.ts
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import pool from "../src/lib/db";
import {
  generateInSilicoInterpretation,
  saveInSilicoInterpretationToDb,
} from "../src/lib/insilico-ai-interpretation-service";

async function runTests() {
  const projectId = 36;
  console.log("=== Testing Section 2 -> Step 8: Simplify Results & Interpretation with Together AI ===");

  // 0. Verify all 15 completed docking runs in Project 36 remain intact
  const [runsBefore]: any = await pool.query(
    `SELECT COUNT(*) AS cnt FROM docking_runs WHERE projectId = ? AND jobStatus = 'COMPLETED' AND bindingAffinity IS NOT NULL`,
    [projectId]
  );
  assert.equal(
    Number(runsBefore[0].cnt),
    15,
    "All 15 completed AutoDock Vina runs for Project 36 must be preserved"
  );
  console.log("✓ Test 0 Passed: All 15 completed AutoDock Vina docking runs are preserved.");

  // 1. Test Empty State (no saved interpretation -> empty fields so sections remain hidden)
  await pool.query(`DELETE FROM research_insilico_syntheses WHERE projectId = ?`, [projectId]);
  await pool.query(`DELETE FROM research_docking_syntheses WHERE projectId = ?`, [projectId]);

  const [emptyRows]: any = await pool.query(
    `SELECT keyFindings, potentialLimitations FROM research_insilico_syntheses WHERE projectId = ? LIMIT 1`,
    [projectId]
  );
  assert.equal(emptyRows.length, 0, "No saved interpretation should exist after clearing");
  console.log("✓ Test 1 Passed: Empty state verified (no pre-filled interpretation in MySQL).");

  // 2. Test Failure and Retry Handling
  let failedAsExpected = false;
  try {
    await generateInSilicoInterpretation(projectId, { simulateFailure: true });
  } catch (err: any) {
    failedAsExpected = true;
    assert.match(err.message, /Together AI service failed to generate interpretation/i);
  }
  assert.equal(failedAsExpected, true, "Simulated failure must throw an error for the Retry UI");
  console.log("✓ Test 2 Passed: Failure and Retry error handling verified.");

  // 3. Test Together AI Generation with Actual Project 36 Screening & Docking Data
  console.log("Calling Together AI via generateInSilicoInterpretation(36)...");
  const generated = await generateInSilicoInterpretation(projectId);

  assert.ok(
    generated.computationalFindings && generated.computationalFindings.length > 80,
    "Generated computationalFindings must be non-empty"
  );
  assert.ok(
    generated.computationalLimitations && generated.computationalLimitations.length > 80,
    "Generated computationalLimitations must be non-empty"
  );
  console.log(`  - Model used: ${generated.model}`);
  console.log(`  - Findings length: ${generated.computationalFindings.length} chars`);
  console.log(`  - Limitations length: ${generated.computationalLimitations.length} chars`);

  // Verify grounding in Project 36's actual compounds/targets/scores
  const combinedText = `${generated.computationalFindings} ${generated.computationalLimitations}`;
  const mentionsActualCompound =
    /Kaempferol|Emodin|Rhein|Aloe-emodin|Chrysophanol/i.test(combinedText);
  const mentionsActualTarget =
    /COX-2|5KIR|COX-1|6Y3C|glucosidase|3W37/i.test(combinedText);
  const mentionsAffinity = /kcal\/mol|-\d+\.\d+/i.test(combinedText);

  assert.equal(mentionsActualCompound, true, "AI interpretation must reference actual Project 36 compounds");
  assert.equal(mentionsActualTarget, true, "AI interpretation must reference actual Project 36 target proteins");
  assert.equal(mentionsAffinity, true, "AI interpretation must reference actual AutoDock Vina binding affinity scores");

  // Verify persistence in MySQL
  const [savedAfterGen]: any = await pool.query(
    `SELECT keyFindings, potentialLimitations, status FROM research_insilico_syntheses WHERE projectId = ? LIMIT 1`,
    [projectId]
  );
  assert.equal(savedAfterGen.length, 1, "Generated interpretation must be saved in research_insilico_syntheses");
  assert.equal(savedAfterGen[0].keyFindings, generated.computationalFindings);
  assert.equal(savedAfterGen[0].potentialLimitations, generated.computationalLimitations);
  console.log("✓ Test 3 Passed: Together AI generation grounded in actual Project 36 data and saved to MySQL.");

  // 4. Test Manual Editing, Saving, and Reload Persistence
  const editedFindings = `${generated.computationalFindings}\n\n[Researcher Note: Verified top pose orientation in Step 7 3D viewer.]`;
  const editedLimitations = `${generated.computationalLimitations}\n\n[Researcher Note: Scheduled in-vitro enzyme inhibition assay.]`;

  await saveInSilicoInterpretationToDb(projectId, editedFindings, editedLimitations);

  const [restoredRows]: any = await pool.query(
    `SELECT keyFindings, potentialLimitations FROM research_insilico_syntheses WHERE projectId = ? LIMIT 1`,
    [projectId]
  );
  assert.equal(restoredRows[0].keyFindings, editedFindings, "Manual edits to findings must persist on reload");
  assert.equal(restoredRows[0].potentialLimitations, editedLimitations, "Manual edits to limitations must persist on reload");
  console.log("✓ Test 4 Passed: Manual editing, saving, and reload restoration verified.");

  // 5. Test Regeneration (overwrites with clean AI-generated interpretation and saves to MySQL)
  const regenerated = await generateInSilicoInterpretation(projectId);
  assert.ok(regenerated.computationalFindings.length > 80);
  assert.ok(!regenerated.computationalFindings.includes("[Researcher Note:"), "Regeneration must replace manual note with fresh AI synthesis");

  const [afterRegenRows]: any = await pool.query(
    `SELECT keyFindings, potentialLimitations FROM research_insilico_syntheses WHERE projectId = ? LIMIT 1`,
    [projectId]
  );
  assert.equal(afterRegenRows[0].keyFindings, regenerated.computationalFindings);
  assert.equal(afterRegenRows[0].potentialLimitations, regenerated.computationalLimitations);
  console.log("✓ Test 5 Passed: Regeneration and persistence verified.");

  // 6. Verify UI Component Requirements in InterpretationStep8Section.tsx & InSilicoRdWorkspaceClient.tsx
  const step8File = fs.readFileSync(
    path.join(process.cwd(), "src/components/researcher/in-silico/InterpretationStep8Section.tsx"),
    "utf8"
  );
  const workspaceClientFile = fs.readFileSync(
    path.join(process.cwd(), "src/components/researcher/in-silico/InSilicoRdWorkspaceClient.tsx"),
    "utf8"
  );

  assert.ok(!step8File.includes("AI Assist"), "AI Assist button must be completely removed from Step 8");
  assert.ok(
    !workspaceClientFile.includes("<span>Proceed to Section 3</span>"),
    "Duplicate Proceed to Section 3 button at the top header must be removed"
  );
  assert.ok(
    step8File.includes("Generate AI Interpretation"),
    "Generate AI Interpretation button must be present below Leading Computational Complexes"
  );
  assert.ok(
    step8File.includes("AI-generated scientific interpretation"),
    "Content must be clearly labeled as AI-generated scientific interpretation"
  );
  assert.ok(
    step8File.includes("Regenerate"),
    "Regenerate button must be present"
  );
  assert.ok(
    step8File.includes("Retry"),
    "Retry button must be present for error recovery"
  );
  console.log("✓ Test 6 Passed: UI component requirements verified.");

  console.log("=== ALL STEP 8 TOGETHER AI INTERPRETATION TESTS PASSED ===");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
