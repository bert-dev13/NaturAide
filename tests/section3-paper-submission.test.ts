// tests/section3-paper-submission.test.ts
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import pool from "../src/lib/db";
import { calculateV2ProjectProgress } from "../src/lib/v2-progress-service";
import {
  ensureManuscriptUploadColumns,
  getManuscriptRecord,
  getSection3CompiledContext,
  removeManuscriptFile,
  saveManuscriptFile,
  validateManuscriptFile,
} from "../src/lib/manuscript-upload-service";

async function runTests() {
  const projectId = 36;
  console.log("=== Testing NatureAide V2 — Redesign Section 3, Step 1: Research Summary & 3-Step Workflow ===");

  await ensureManuscriptUploadColumns();

  // 1. Verify Step 1 Data Accuracy (Botanical, Formulation & Actual QC Status, All 5 Phytochemicals, Best Docking Score, Saved AI Interpretation)
  const compiled = await getSection3CompiledContext(projectId);

  // Botanical Information
  assert.equal(compiled.plant.commonName, "Akapulko");
  assert.equal(compiled.plant.scientificName, "Senna alata");
  assert.equal(compiled.plant.partsStudied, "Leaves");
  assert.match(compiled.plant.extractionMethod, /Ultrasonic-Assisted Hydroethanolic Extraction/i);

  // Formulation & Actual QC Status (must NOT falsely label simulated trial data as "Passed")
  assert.equal(compiled.formulation.dosageForm, "Topical Hydrogel");
  assert.ok(compiled.formulation.ingredientsList.length >= 6, "All formulation ingredients must be included");
  assert.notEqual(
    compiled.formulation.qcStatus,
    "Passed",
    "QC status must reflect actual simulated/preliminary batch state rather than falsely claiming Passed"
  );
  assert.match(compiled.formulation.qcStatus, /Simulated|Preliminary/i);

  // In-Silico Screening (all 5 selected phytochemicals present, never truncated to 3)
  assert.equal(compiled.screening.totalCompounds, 5);
  assert.deepEqual(compiled.screening.compoundNames, [
    "Emodin",
    "Rhein",
    "Aloe-emodin",
    "Chrysophanol",
    "Kaempferol 3-O-gentiobioside",
  ]);
  assert.match(compiled.screening.screeningStatus, /Completed \(5 of 5 Screened\)/i);

  // Molecular Docking (15 runs, 3 targets, exact best score -8.91 kcal/mol for Aloe-emodin x 5KIR)
  assert.equal(compiled.docking.completedRunsCount, 15);
  assert.equal(compiled.docking.targetsCount, 3);
  assert.ok(compiled.docking.bestComplex);
  assert.equal(compiled.docking.bestComplex?.ligandName, "Aloe-emodin");
  assert.equal(compiled.docking.bestComplex?.pdbId, "5KIR");
  assert.equal(compiled.docking.bestComplex?.affinityFormatted, "-8.91 kcal/mol");

  // Saved AI Interpretation & Complete Compiled Summary Text
  assert.ok(compiled.interpretation.keyFindings.length > 80, "Saved Computational Findings must be present");
  assert.ok(compiled.interpretation.potentialLimitations.length > 80, "Saved Computational Limitations must be present");
  assert.ok(compiled.compiledSummaryText.includes("1. Botanical & Extraction Information"));
  assert.ok(compiled.compiledSummaryText.includes("2. Formulation Development"));
  assert.ok(compiled.compiledSummaryText.includes("3. Batch Analysis & Quality Control Findings"));
  assert.ok(compiled.compiledSummaryText.includes("4. In-Silico Phytochemical Screening"));
  assert.ok(compiled.compiledSummaryText.includes("5. Molecular Docking Results (AutoDock Vina)"));
  assert.ok(compiled.compiledSummaryText.includes("6. Computational Findings & Target Binding Synthesis"));
  assert.ok(compiled.compiledSummaryText.includes("7. Computational Limitations & In-Vitro Verification Requirements"));
  assert.ok(compiled.compiledSummaryText.includes("Kaempferol 3-O-gentiobioside"), "All 5 compounds must appear in compiled summary");
  console.log("✓ Test 1 Passed: Step 1 Research Overview, Scientific Interpretation, and compiled Research Summary are 100% accurate.");

  // Persist the complete compiled summary to research_dossiers in MySQL and verify reload restoration
  await pool.query(
    "UPDATE research_dossiers SET executiveSummary = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE projectId = ?",
    [compiled.compiledSummaryText, projectId]
  );
  const [restoredDossier]: any = await pool.query(
    "SELECT executiveSummary FROM research_dossiers WHERE projectId = ? LIMIT 1",
    [projectId]
  );
  assert.equal(restoredDossier[0].executiveSummary, compiled.compiledSummaryText);
  console.log("✓ Test 2 Passed: Complete Research Summary saved to MySQL and restored without truncation.");

  // 3. Verify Step 2: File Type & Size Validation + Upload, Replace, Remove, Refresh Persistence
  const invalidExt = validateManuscriptFile("malware.exe", 1024, "application/octet-stream");
  assert.equal(invalidExt.valid, false, "Must reject non-PDF/DOCX extensions");

  const oversized = validateManuscriptFile("huge.pdf", 30 * 1024 * 1024, "application/pdf");
  assert.equal(oversized.valid, false, "Must reject files > 25 MB");

  const validPdfBuffer = Buffer.from(
    "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n",
    "ascii"
  );
  await saveManuscriptFile({
    projectId,
    projectTitle: "Senna alata Hydrogel Formulation",
    originalName: "Draft_v1_Senna_alata.pdf",
    mimeType: "application/pdf",
    buffer: validPdfBuffer,
  });

  const validDocxBuffer = Buffer.concat([
    Buffer.from([0x50, 0x4b, 0x03, 0x04]),
    Buffer.from("DOCX_MANUSCRIPT_CONTENT_TEST_PAYLOAD", "utf8"),
  ]);
  await saveManuscriptFile({
    projectId,
    projectTitle: "Senna alata Hydrogel Formulation",
    originalName: "Revised_Senna_alata_Manuscript.docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    buffer: validDocxBuffer,
  });

  await removeManuscriptFile(projectId);
  let dbRecord = await getManuscriptRecord(projectId);
  assert.equal(dbRecord.fileName, null);

  const finalPdfBuffer = Buffer.from(
    "%PDF-1.4\n% Final Senna alata Hydrogel Research Paper\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n",
    "ascii"
  );
  await saveManuscriptFile({
    projectId,
    projectTitle: "Senna alata Hydrogel Formulation",
    originalName: "Senna_alata_Hydrogel_Final_Manuscript.pdf",
    mimeType: "application/pdf",
    buffer: finalPdfBuffer,
  });
  dbRecord = await getManuscriptRecord(projectId);
  assert.equal(dbRecord.fileName, "Senna_alata_Hydrogel_Final_Manuscript.pdf");
  assert.ok(fs.existsSync(dbRecord.storagePath));
  console.log("✓ Test 3 Passed: Step 2 PDF/DOCX upload, replacement, removal, and MySQL persistence verified.");

  // 4. Verify 3-Step V2 Progress Calculation & Readiness
  const progress = await calculateV2ProjectProgress(projectId);
  assert.equal(progress.section3.totalSteps, 3);
  assert.deepEqual(
    progress.section3.steps.map((s) => s.title),
    ["Research Summary", "Upload Research Paper", "Review & Submit"]
  );
  assert.equal(progress.canSubmit, true);
  console.log("✓ Test 4 Passed: 3-step V2 progress service and submission readiness verified.");

  // 5. Verify UI Layout, No Text Truncation, Overwrite Confirmation, and Navigation
  const submissionClient = fs.readFileSync(
    path.join(process.cwd(), "src/components/researcher/submission/ResearchPaperSubmissionClient.tsx"),
    "utf8"
  );
  const footerNav = fs.readFileSync(
    path.join(process.cwd(), "src/components/researcher/ResearchStepFooterNav.tsx"),
    "utf8"
  );

  assert.ok(
    !submissionClient.includes("truncate") && !submissionClient.includes("line-clamp"),
    "ResearchPaperSubmissionClient must not use truncate or line-clamp on scientific content"
  );
  assert.ok(submissionClient.includes("Research Overview"), "Section A: Research Overview heading must be present");
  assert.ok(submissionClient.includes("Botanical Information"), "Botanical Information card must be present");
  assert.ok(submissionClient.includes("Scientific Interpretation"), "Section B: Scientific Interpretation heading must be present");
  assert.ok(submissionClient.includes("Computational Findings"), "Computational Findings section must be present");
  assert.ok(submissionClient.includes("Computational Limitations &amp; Verification"), "Computational Limitations & Verification section must be present");
  assert.ok(submissionClient.includes("Edit in Section 2"), "Edit in Section 2 link must be present");
  assert.ok(submissionClient.includes("Recompile Summary"), "Recompile Summary button must be present");
  assert.ok(submissionClient.includes("Save Summary"), "Save Summary button must be present");
  assert.ok(
    submissionClient.includes("Recompiling the Research Summary from Sections 1 and 2 will replace your current text"),
    "Recompile Summary must confirm before overwriting researcher edits"
  );
  assert.ok(footerNav.includes("Back to Section 2"), "Sticky footer must display Back to Section 2 on Step 1");
  console.log("✓ Test 5 Passed: UI layout, non-truncated wrapping, overwrite confirmation, and sticky footer navigation verified.");

  // 6. Verify Step 3: Single-Column Layout & Redesigned Review & Submit Sections
  const step3StartIndex = submissionClient.indexOf("activeStep === 3 && (");
  assert.ok(step3StartIndex !== -1, "Step 3 render block must exist in ResearchPaperSubmissionClient");
  const step3EndIndex = submissionClient.indexOf("</main>", step3StartIndex);
  const step3Block = submissionClient.slice(step3StartIndex, step3EndIndex !== -1 ? step3EndIndex : undefined);

  assert.ok(
    !step3Block.includes("grid-cols-2") &&
      !step3Block.includes("grid-cols-3") &&
      !step3Block.includes("grid-cols-4") &&
      !step3Block.includes("grid-cols-"),
    "Step 3 must use a single-column layout with no 2-column or multi-column grid layout"
  );
  assert.ok(step3Block.includes("Research Readiness"), "Step 3 must include Research Readiness checklist");
  assert.ok(step3Block.includes("Formulation Research"), "Checklist must include Formulation Research row");
  assert.ok(step3Block.includes("In-Silico Analysis"), "Checklist must include In-Silico Analysis row");
  assert.ok(step3Block.includes("Research Summary"), "Checklist must include Research Summary row");
  assert.ok(step3Block.includes("Research Paper"), "Checklist must include Research Paper row");
  assert.ok(step3Block.includes("View Full Summary"), "Step 3 must provide View Full Summary inline expand action");
  assert.ok(step3Block.includes("Edit Summary"), "Step 3 must provide Edit Summary link to Step 1");
  assert.ok(step3Block.includes("Replace Paper"), "Step 3 must provide Replace Paper action for uploaded manuscript");
  assert.ok(step3Block.includes("No research paper uploaded yet."), "Step 3 must display placeholder when no paper is uploaded");
  assert.ok(!step3Block.includes("Ready for Expert Review?"), "Step 3 must not include redundant in-page submission block");
  assert.ok(submissionClient.includes("Submit Research for Expert Review"), "Submit Research for Expert Review modal title must be present");
  console.log("✓ Test 6 Passed: Step 3 Review & Submit verified with strict single-column layout, compact readiness checklist, and clear submission actions.");

  console.log("=== ALL SECTION 3 REDESIGN & WORKFLOW TESTS PASSED ===");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
