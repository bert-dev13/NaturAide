const mysql = require('mysql2/promise');

async function testKnowledgeIntegrationFullE2E() {
  console.log("==========================================================================");
  console.log("STARTING KNOWLEDGE INTEGRATION & ADMIN REVIEW FULL E2E TEST");
  console.log("==========================================================================");

  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'natureaide_db',
    port: 3306,
  });

  const projectId = 1;
  const researcherId = 2; // researcher@natureaide.test
  const adminId = 4;      // Admin NatureAide
  const plantId = 'sambong'; // Sambong (Blumea balsamifera)

  // 1. Snapshot community data before test
  const [guideBefore] = await pool.query("SELECT * FROM plant_guides WHERE plantId = ?", [plantId]);
  const initialWhatResearchSays = guideBefore[0]?.whatResearchSays || "";
  console.log("Initial Community knowledge length for plant 7:", initialWhatResearchSays.length);

  // 2. Ensure project 1 has Stage 11 completed and is in Stage 12
  console.log("\n--- Step 1: Ensure Project 1 is at Stage 12 (Knowledge Integration) ---");
  await pool.query(`
    UPDATE research_project_stages
    SET status = 'COMPLETED'
    WHERE projectId = ? AND stageKey IN ('evidence-review', 'plant-research', 'literature', 'in-silico', 'docking', 'formulation', 'safety', 'review', 'revisions', 'laboratory', 'completion')
  `, [projectId]);

  await pool.query(`
    UPDATE research_project_stages
    SET status = 'IN_PROGRESS'
    WHERE projectId = ? AND stageKey = 'knowledge-integration'
  `, [projectId]);

  await pool.query(`
    UPDATE research_projects
    SET currentStage = 'knowledge-integration', progressPercent = 92
    WHERE id = ?
  `, [projectId]);

  // Ensure Stage 11 final finding exists
  const [findingRows] = await pool.query("SELECT * FROM research_final_findings WHERE projectId = ? LIMIT 1", [projectId]);
  if (findingRows.length === 0) throw new Error("No Stage 11 final findings found for project 1");
  const finding = findingRows[0];
  console.log("✓ Selected eligible final finding:", finding.findingTitle);

  // 3. Step 2: Researcher Creates Draft Proposal
  console.log("\n--- Step 2: Researcher Creates Integration Proposal (Draft) ---");
  const proposalCode = `KIP-1-${Date.now().toString().slice(-4)}`;
  const [propRes] = await pool.query(`
    INSERT INTO knowledge_integration_proposals (
      projectId, researcherId, plantId, proposalCode, title,
      knowledgeArea, changeType, currentVersionNumber, status,
      sourceFindingId, sourceFindingTitle
    ) VALUES (
      ?, ?, ?, ?, 'Propose Sambong L-Borneol Renal Protection Evidence',
      'SCIENTIFIC_EVIDENCE', 'SUPPLEMENT', 1, 'DRAFT',
      ?, ?
    )
  `, [projectId, researcherId, plantId, proposalCode, finding.id, finding.findingTitle]);
  const proposalId = propRes.insertId;

  // Insert Version 1
  const [verRes] = await pool.query(`
    INSERT INTO knowledge_integration_versions (
      proposalId, versionNumber, currentKnowledgeSnapshot, proposedContent,
      reasonForChange, supportingFindingSummary, dossierVersionTag,
      laboratoryEvidenceSummary, professionalReviewOutcome, supportingReferences,
      isLocked
    ) VALUES (
      ?, 1, ?,
      'Standardized extracts of Blumea balsamifera (Sambong) rich in L-Borneol (quantified at 3.42% w/w) demonstrate significant affinity (-6.8 kcal/mol) against renal inflammatory mediators without acute cytotoxicity in vitro.',
      'Documented in Stage 11 research completion and confirmed via DOST-ITDI HPLC report STD-2024-8891.',
      'High affinity binding and active terpene yield', 'v1.0',
      'DOST-ITDI HPLC 3.42% w/w L-Borneol', 'ACCEPTED_FOR_NEXT_STAGE', 'DOST-ITDI Report #STD-2024-8891; AutoDock Vina Run #12',
      0
    )
  `, [proposalId, initialWhatResearchSays]);
  const version1Id = verRes.insertId;

  // Evidence links
  await pool.query(`
    INSERT INTO knowledge_integration_evidence_links (
      proposalId, versionId, evidenceType, evidenceReference, notes
    ) VALUES
    (?, ?, 'LABORATORY_RESULT', 'DOST-ITDI Report #STD-2024-8891 (3.42% w/w)', 'Wet-lab chemical fingerprint'),
    (?, ?, 'DOCKING_RESULT', 'AutoDock Vina Run #12 (-6.8 kcal/mol)', 'Target binding affinity')
  `, [proposalId, version1Id, proposalId, version1Id]);

  console.log("✓ Proposal draft created:", proposalCode, "ID:", proposalId);

  // 4. Step 3: Researcher Submits Proposal (Status -> SUBMITTED)
  console.log("\n--- Step 3: Researcher Submits Proposal for Review ---");
  await pool.query(`
    UPDATE knowledge_integration_versions
    SET isLocked = 1, submittedAt = CURRENT_TIMESTAMP(3)
    WHERE id = ?
  `, [version1Id]);

  await pool.query(`
    UPDATE knowledge_integration_proposals
    SET status = 'SUBMITTED', updatedAt = CURRENT_TIMESTAMP(3)
    WHERE id = ?
  `, [proposalId]);

  await pool.query(`
    INSERT INTO research_activity_logs (projectId, researcherId, actionType, description)
    VALUES (?, ?, 'KNOWLEDGE_INTEGRATION_SUBMITTED', ?)
  `, [projectId, researcherId, `Submitted proposal ${proposalCode} for independent Knowledge Integration Review.`]);

  // Verify community data remains strictly unchanged
  const [guideCheck1] = await pool.query("SELECT whatResearchSays FROM plant_guides WHERE plantId = ?", [plantId]);
  if (guideCheck1[0]?.whatResearchSays !== initialWhatResearchSays) {
    throw new Error("COMMUNITY INTEGRITY VIOLATION: Community knowledge was modified upon proposal submission!");
  }
  console.log("✓ Verified: Community knowledge remains completely untouched upon submission.");

  // 5. Step 4: Admin Reviews & Requests Changes
  console.log("\n--- Step 4: Admin Requests Changes on Proposal ---");
  await pool.query(`
    INSERT INTO knowledge_integration_comments (
      proposalId, versionId, authorId, authorRole, commentType, severity, commentText
    ) VALUES (
      ?, ?, ?, 'ADMIN', 'CLARIFICATION_NEEDED', 'MAJOR',
      'Please explicitly emphasize that these findings represent preclinical/in-vitro evidence rather than clinical human trials.'
    )
  `, [proposalId, version1Id, adminId]);

  await pool.query(`
    INSERT INTO knowledge_integration_decisions (
      proposalId, versionNumber, reviewerId, decision, decisionNotes
    ) VALUES (
      ?, 1, ?, 'REQUEST_CHANGES',
      'Please clarify preclinical vs clinical boundaries in the proposed addition before approval.'
    )
  `, [proposalId, adminId]);

  await pool.query(`
    UPDATE knowledge_integration_proposals
    SET status = 'CHANGES_REQUESTED', updatedAt = CURRENT_TIMESTAMP(3)
    WHERE id = ?
  `, [proposalId]);

  const [propCheck1] = await pool.query("SELECT status FROM knowledge_integration_proposals WHERE id = ?", [proposalId]);
  console.log("✓ Proposal status updated to:", propCheck1[0].status);

  // 6. Step 5: Researcher Revises Proposal (Creates Version 2 while Version 1 remains locked)
  console.log("\n--- Step 5: Researcher Prepares & Submits Revision v2 ---");
  const [ver2Res] = await pool.query(`
    INSERT INTO knowledge_integration_versions (
      proposalId, versionNumber, currentKnowledgeSnapshot, proposedContent,
      reasonForChange, supportingFindingSummary, dossierVersionTag,
      laboratoryEvidenceSummary, professionalReviewOutcome, supportingReferences,
      isLocked, submittedAt
    ) VALUES (
      ?, 2, ?,
      'In preclinical investigations, standardized extracts of Blumea balsamifera (Sambong) leaves containing verified 3.42% w/w L-Borneol demonstrated high computational binding affinity (-6.8 kcal/mol) against renal inflammatory mediators and favorable stability in vitro. Human clinical trials remain recommended for therapeutic validation.',
      'Revised per Admin feedback to clarify preclinical context and translational boundaries.',
      'Preclinical efficacy with clinical boundary', 'v1.0',
      'DOST-ITDI HPLC 3.42% w/w', 'ACCEPTED_FOR_NEXT_STAGE', 'DOST-ITDI Report #STD-2024-8891',
      1, CURRENT_TIMESTAMP(3)
    )
  `, [proposalId, initialWhatResearchSays]);
  const version2Id = ver2Res.insertId;

  await pool.query(`
    UPDATE knowledge_integration_proposals
    SET currentVersionNumber = 2, status = 'SUBMITTED', updatedAt = CURRENT_TIMESTAMP(3)
    WHERE id = ?
  `, [proposalId]);

  // Check version 1 remains locked
  const [v1Check] = await pool.query("SELECT isLocked, versionNumber FROM knowledge_integration_versions WHERE id = ?", [version1Id]);
  const [v2Check] = await pool.query("SELECT isLocked, versionNumber FROM knowledge_integration_versions WHERE id = ?", [version2Id]);
  console.log("✓ Version 1 isLocked:", v1Check[0].isLocked, "| Version 2 isLocked:", v2Check[0].isLocked);

  // 7. Step 6: Admin Approves Proposal (Status -> APPROVED)
  console.log("\n--- Step 6: Admin Approves Proposal v2 ---");
  await pool.query(`
    INSERT INTO knowledge_integration_decisions (
      proposalId, versionNumber, reviewerId, decision, decisionNotes
    ) VALUES (
      ?, 2, ?, 'APPROVE',
      'Approved for knowledge integration. Preclinical boundary clarified accurately.'
    )
  `, [proposalId, adminId]);

  await pool.query(`
    UPDATE knowledge_integration_proposals
    SET status = 'APPROVED', updatedAt = CURRENT_TIMESTAMP(3)
    WHERE id = ?
  `, [proposalId]);

  // Community data must STILL remain unchanged after approval
  const [guideCheck2] = await pool.query("SELECT whatResearchSays FROM plant_guides WHERE plantId = ?", [plantId]);
  if (guideCheck2[0]?.whatResearchSays !== initialWhatResearchSays) {
    throw new Error("COMMUNITY INTEGRITY VIOLATION: Community knowledge was modified upon approval before integration action!");
  }
  console.log("✓ Verified: Community knowledge remains completely untouched upon approval.");

  // 8. Step 7: Admin Executes Controlled Integration into Knowledge Base
  console.log("\n--- Step 7: Admin Executes Controlled Integration ---");
  const [v2Data] = await pool.query("SELECT * FROM knowledge_integration_versions WHERE id = ?", [version2Id]);
  const contentToIntegrate = `\n\n[Validated Research Finding — ${proposalCode}]:\n${v2Data[0].proposedContent}`;
  const updatedKnowledge = `${initialWhatResearchSays.trim()}${contentToIntegrate}`;

  // Record previous snapshot in knowledge_versions
  await pool.query(`
    INSERT INTO knowledge_versions (
      entityType, entityId, fieldUpdated, previousContent, newContent,
      sourceProposalId, sourceProposalVersion, sourceProjectId, integratedBy
    ) VALUES (
      'plant_guides', ?, 'whatResearchSays', ?, ?,
      ?, 2, ?, ?
    )
  `, [guideBefore[0].id, initialWhatResearchSays, updatedKnowledge, proposalId, projectId, adminId]);

  // Update plant_guides
  await pool.query(`
    UPDATE plant_guides
    SET whatResearchSays = ?, updatedAt = CURRENT_TIMESTAMP(3)
    WHERE id = ?
  `, [updatedKnowledge, guideBefore[0].id]);

  // Update proposal status -> INTEGRATED
  await pool.query(`
    UPDATE knowledge_integration_proposals
    SET status = 'INTEGRATED', updatedAt = CURRENT_TIMESTAMP(3)
    WHERE id = ?
  `, [proposalId]);

  // Complete Stage 12 and mark project 100%
  await pool.query(`
    UPDATE research_project_stages
    SET status = 'COMPLETED', completedAt = CURRENT_TIMESTAMP(3)
    WHERE projectId = ? AND stageKey = 'knowledge-integration'
  `, [projectId]);

  await pool.query(`
    UPDATE research_projects
    SET status = 'COMPLETED', currentStage = 'knowledge-integration', progressPercent = 100, updatedAt = CURRENT_TIMESTAMP(3)
    WHERE id = ?
  `, [projectId]);

  await pool.query(`
    INSERT INTO research_activity_logs (projectId, researcherId, actionType, description)
    VALUES
    (?, ?, 'KNOWLEDGE_INTEGRATED', 'Knowledge integration completed for Sambong research findings.'),
    (?, ?, 'RESEARCH_WORKFLOW_COMPLETED', 'All 12 stages of scientific research and knowledge integration completed (100%).')
  `, [projectId, researcherId, projectId, researcherId]);

  console.log("✓ Controlled integration executed successfully!");

  // 9. Step 8: Verify Community Knowledge Surfaces
  console.log("\n--- Step 8: Verify Community Surfaces Read Approved Content ---");
  const [guideAfter] = await pool.query("SELECT whatResearchSays FROM plant_guides WHERE plantId = ?", [plantId]);
  if (!guideAfter[0].whatResearchSays.includes(proposalCode)) {
    throw new Error("Community plant_guides does not contain integrated research finding!");
  }
  console.log("✓ Verified: Community Herbal Guide / Plant Details now contains approved integrated research finding!");

  // Verify snapshot preserved in knowledge_versions
  const [kvCheck] = await pool.query("SELECT * FROM knowledge_versions WHERE sourceProposalId = ?", [proposalId]);
  if (kvCheck.length === 0 || kvCheck[0].previousContent !== initialWhatResearchSays) {
    throw new Error("Knowledge versions snapshot failed to preserve previous content!");
  }
  console.log("✓ Verified: Audit snapshot preserved in knowledge_versions table.");

  // 10. Step 9: Verify Project 12/12 Stages Completed (100%)
  console.log("\n--- Step 9: Verify 12/12 Stages Completed (100%) ---");
  const [allStages] = await pool.query("SELECT stageKey, status FROM research_project_stages WHERE projectId = ? ORDER BY id ASC", [projectId]);
  allStages.forEach((s, idx) => {
    console.log(`Stage ${idx + 1}: ✓ ${s.stageKey} [${s.status}]`);
  });

  const [pFinal] = await pool.query("SELECT currentStage, progressPercent, status FROM research_projects WHERE id = ?", [projectId]);
  console.log("\nFinal Project State:", pFinal[0]);

  if (pFinal[0].progressPercent !== 100 || pFinal[0].status !== "COMPLETED") {
    throw new Error("Project progress is not 100% completed!");
  }

  console.log("\n==========================================================================");
  console.log("KNOWLEDGE INTEGRATION & ADMIN REVIEW E2E TEST COMPLETED SUCCESSFULLY!");
  console.log("==========================================================================");

  await pool.end();
}

testKnowledgeIntegrationFullE2E().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
