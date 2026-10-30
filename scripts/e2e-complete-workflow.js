const fs = require('fs');
const mysql = require('mysql2/promise');

const BASE_URL = 'http://localhost:3000';

async function loginUser(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (res.status !== 200) throw new Error(`Login failed for ${email}`);
  const cookie = res.headers.get('set-cookie');
  return cookie;
}

async function testCompleteWorkflow() {
  console.log('===============================================================');
  console.log('   NATUREAIDE E2E AUTOMATED WORKFLOW VERIFICATION TEST');
  console.log('===============================================================\n');

  const resCookie = await loginUser('researcher@natureaide.test', 'NatureAide123!');
  const revCookie = await loginUser('reviewer@natureaide.test', 'NatureAide123!');
  const rHeaders = { Cookie: resCookie, 'Content-Type': 'application/json' };
  const revHeaders = { Cookie: revCookie, 'Content-Type': 'application/json' };

  console.log('✔ Authenticated Researcher and Reviewer demo accounts');

  // =========================================================================
  // PATH B: RESEARCH -> REVIEW -> FINDING -> REVISION -> RESUBMIT -> 5/5 APPROVAL
  // =========================================================================
  console.log('\n---------------------------------------------------------------');
  console.log('STARTING PATH B: Full Revision & 5/5 Approval Workflow');
  console.log('---------------------------------------------------------------');

  // 1. Create Project
  const testTitle = `E2E Validation Plant Study ${Date.now()}`;
  const createRes = await fetch(`${BASE_URL}/api/researcher/projects`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({
      title: testTitle,
      shortDescription: 'Comprehensive botanical and computational assessment',
      researchObjective: 'Evaluate active phytochemicals against respiratory targets',
      researchQuestion: 'What are the target affinities of standardized leaf extracts?',
      areaOfInterest: 'Phytomedicine & Respiratory Pharmacodynamics',
      plantId: 'lagundi',
      isDraft: false,
    })
  });
  const createData = await createRes.json();
  if (!createRes.ok) throw new Error(`Project creation failed: ${JSON.stringify(createData)}`);
  
  // Find project id from list
  const listRes = await fetch(`${BASE_URL}/api/researcher/projects`, { headers: rHeaders });
  const listData = await listRes.json();
  const project = listData.projects.find(p => p.title === testTitle);
  if (!project) throw new Error('Created project not found in project listing');
  const projectId = project.id;
  console.log(`✔ Step 1: Created Research Project (ID: ${projectId}) - "${testTitle}"`);

  // 2. Stage 1: Plant & Literature
  const s1Save = await fetch(`${BASE_URL}/api/researcher/projects/${projectId}/plant-literature`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({
      action: 'save-specimen',
      partsStudied: 'Leaves',
      specimenSource: 'UP Philippine National Herbarium (PNH)',
      collectionDate: '2026-05-15',
      collectionLocation: 'Los Baños, Laguna, Philippines',
      voucherSpecimenNumber: 'PNH-2026-8812',
      authenticationMethod: 'Morpho-anatomical taxonomic comparison & ITS sequencing',
      authenticatedBy: 'National Botanist Registry',
      materialType: 'Standardized Hydroalcoholic Extract',
      extractionMethod: 'Cold Maceration with Rotary Evaporation',
      extractionSolvent: '70% Aqueous Ethanol',
      selectionRationale: 'Documented bronchospasmolytic and anti-inflammatory properties supported by clinical precedent.',
      authenticationStatus: 'VERIFIED'
    })
  });
  if (!s1Save.ok) throw new Error(`Stage 1 save failed: ${await s1Save.text()}`);

  const s1Complete = await fetch(`${BASE_URL}/api/researcher/projects/${projectId}/plant-literature`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({
      action: 'complete-stage',
      partsStudied: 'Leaves',
      specimenSource: 'UP Philippine National Herbarium (PNH)',
      selectionRationale: 'Documented bronchospasmolytic and anti-inflammatory properties.'
    })
  });
  const s1CompData = await s1Complete.json();
  if (!s1Complete.ok) throw new Error(`Stage 1 completion failed: ${JSON.stringify(s1CompData)}`);
  console.log('✔ Step 2: Stage 1 (Plant & Literature) completed successfully');

  // 3. Stage 2: In-Silico Screening
  // Add compound
  const addComp = await fetch(`${BASE_URL}/api/researcher/projects/${projectId}/in-silico`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({
      action: 'add-compound',
      compoundName: 'quercetin',
      smiles: 'C1=CC(=C(C=C1C2=C(C(=O)C3=C(C=C(C=C3O2)O)O)O)O)O'
    })
  });
  const compData = await addComp.json();
  const compoundId = compData.compoundId || compData.insertedId;

  // Toggle selection for docking
  await fetch(`${BASE_URL}/api/researcher/projects/${projectId}/in-silico`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({
      action: 'toggle-docking',
      compoundId,
      selectedForDocking: true
    })
  });

  // Run in-silico screening
  await fetch(`${BASE_URL}/api/researcher/projects/${projectId}/in-silico`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({
      action: 'run-screening',
      compoundId
    })
  });

  // Save rationale
  await fetch(`${BASE_URL}/api/researcher/projects/${projectId}/in-silico`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({
      action: 'save-rationale',
      selectionRationale: 'Quercetin prioritized based on 100% Lipinski Rule of 5 compliance and favorable predicted oral bioavailability.',
      approve: true
    })
  });

  // Complete Stage 2
  const s2Complete = await fetch(`${BASE_URL}/api/researcher/projects/${projectId}/in-silico`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({
      action: 'complete-stage',
      selectionRationale: 'Quercetin prioritized based on 100% Lipinski Rule of 5 compliance and favorable predicted oral bioavailability.'
    })
  });
  if (!s2Complete.ok) throw new Error(`Stage 2 completion failed: ${await s2Complete.text()}`);
  console.log('✔ Step 3: Stage 2 (In-Silico Screening) completed successfully');

  // 4. Stage 3: Molecular Docking
  // Add verified target 5KIR
  const addTRes = await fetch(`${BASE_URL}/api/researcher/projects/${projectId}/docking`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({
      action: 'add-target',
      pdbId: '5KIR'
    })
  });
  const addTData = await addTRes.json();
  const targetId = addTData.targetId;

  // Prepare ligand and target
  await fetch(`${BASE_URL}/api/researcher/projects/${projectId}/docking`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({ action: 'prepare' })
  });

  // Poll until preparation is ready
  for (let i = 0; i < 15; i++) {
    const ws = await (await fetch(`${BASE_URL}/api/researcher/projects/${projectId}/docking`, { headers: rHeaders })).json();
    const lReady = ws.workspace?.ligands?.every(l => l.preparationReady);
    const tReady = ws.workspace?.targets?.every(t => t.receptorPrepared);
    if (lReady && tReady) break;
    await new Promise(r => setTimeout(r, 1000));
  }

  // Use detected site RCX A:601
  await fetch(`${BASE_URL}/api/researcher/projects/${projectId}/docking`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({ action: 'use-detected-site', targetId, resname: 'RCX', chain: 'A', seq: '601' })
  });

  // Run Vina docking
  await fetch(`${BASE_URL}/api/researcher/projects/${projectId}/docking`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({ action: 'run', compoundId, targetId })
  });

  // Poll until docking completes
  for (let i = 0; i < 20; i++) {
    const ws = await (await fetch(`${BASE_URL}/api/researcher/projects/${projectId}/docking`, { headers: rHeaders })).json();
    const job = ws.workspace?.jobs?.find(j => j.compoundId === compoundId && j.targetId === targetId);
    if (job?.status === 'COMPLETED' && job?.affinity != null) break;
    await new Promise(r => setTimeout(r, 2000));
  }

  // Save docking interpretation
  await fetch(`${BASE_URL}/api/researcher/projects/${projectId}/docking`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({
      action: 'save-interpretation',
      keyFindings: 'In-silico molecular docking reveals thermodynamically favorable binding energy conforming to therapeutic active-site conformations.',
      interpretation: 'In-silico molecular docking reveals thermodynamically favorable binding energy conforming to therapeutic active-site conformations.',
      approve: true
    })
  });

  // Complete Stage 3
  const s3Complete = await fetch(`${BASE_URL}/api/researcher/projects/${projectId}/docking`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({ action: 'complete-stage' })
  });
  if (!s3Complete.ok) throw new Error(`Stage 3 completion failed: ${await s3Complete.text()}`);
  console.log('✔ Step 4: Stage 3 (Molecular Docking) completed successfully');

  // 5. Stage 4: Formulation & Safety
  // Save formulation overview
  await fetch(`${BASE_URL}/api/researcher/projects/${projectId}/formulation`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({
      action: 'save-overview',
      formulationName: 'Lagundi Standardized Syrup Prototype',
      formulationCode: 'LAG-SYR-01',
      formulationType: 'Standardized Botanical Syrup',
      dosageFormType: 'Oral Syrup',
      targetRoute: 'Oral',
      researchPurpose: 'Bronchospasmolytic relief and symptom alleviation',
      intendedUse: 'Bronchospasmolytic relief and symptom alleviation'
    })
  });

  // Save safety assessment
  await fetch(`${BASE_URL}/api/researcher/projects/${projectId}/safety`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({
      action: 'save-sections',
      knownSafetyEvidence: 'Oral LD50 in rodent models exceeds 5,000 mg/kg; wide therapeutic safety margin confirmed.',
      toxicityEvidence: 'No acute or subchronic organ toxicity identified in animal models.',
      potentialContraindications: 'Contraindicated during pregnancy and lactation due to lack of longitudinal clinical safety trials.',
      herbDrugInteractions: 'May potentiate oral hypoglycemic agents; monitor blood glucose levels.',
      populationConsiderations: 'Adult population; pediatric dosing requires clinical validation.',
      doseConcentrationConcerns: 'Recommended therapeutic extract dose 300 mg/day standardized.',
      knownAdverseEffects: 'Mild, transient gastrointestinal discomfort in sensitive individuals.',
      evidenceGaps: 'Phase III human clinical trial data remaining for long-term chronic administration.'
    })
  });

  // Complete Stage 4
  const s4Complete = await fetch(`${BASE_URL}/api/researcher/projects/${projectId}/formulation-safety`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({ action: 'complete-stage' })
  });
  if (!s4Complete.ok) throw new Error(`Stage 4 completion failed: ${await s4Complete.text()}`);
  console.log('✔ Step 5: Stage 4 (Formulation & Safety) completed successfully');

  // 6. Stage 5: Research Integration
  // Approve synthesis
  await fetch(`${BASE_URL}/api/researcher/projects/${projectId}/completion-integration`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({
      action: 'approve-synthesis',
      isSynthesisApproved: true,
      evidenceAlignment: 'Multi-stage evidence demonstrates concordance between traditional usage and predicted target binding.',
      keyFindings: [
        'Documented ethnomedicinal use supported by modern pharmacology',
        'Quercetin identified with drug-like properties (Lipinski compliant)',
        'Favorable binding free energy in receptor catalytic sites',
        'Prototype formulation established with defined safety profile'
      ],
      scientificInterpretation: 'Predictive docking indicates strong steric complementarity without asserting clinical efficacy without trials.',
      limitations: 'Wet-lab enzymatic assays and bioavailability studies remain necessary in subsequent translational research phases.',
      finalConclusion: 'The integrated evidence profile supports advancement to professional scientific verification.'
    })
  });

  // Finalize Stage 5
  const s5Complete = await fetch(`${BASE_URL}/api/researcher/projects/${projectId}/completion-integration`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({ action: 'finalize' })
  });
  if (!s5Complete.ok) throw new Error(`Stage 5 finalization failed: ${await s5Complete.text()}`);
  console.log('✔ Step 6: Stage 5 (Research Integration) finalized successfully');

  // 7. Submit Stage 6 for Professional Review
  const submitRes = await fetch(`${BASE_URL}/api/researcher/projects/${projectId}/expert-review`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({
      action: 'submit',
      messageToReviewers: 'Dossier ready for peer scientific verification across all 5 disciplines.'
    })
  });
  const submitData = await submitRes.json();
  if (!submitRes.ok) throw new Error(`Stage 6 submission failed: ${JSON.stringify(submitData)}`);
  const submissionId = submitData.submissionId;
  console.log(`✔ Step 7: Dossier submitted for Stage 6 Professional Review (Submission ID: ${submissionId}, Cycle 1)`);

  // 8. Reviewer Views Checking Workspace for Pharmacognosy
  const checkRes = await fetch(`${BASE_URL}/api/reviewer/checking/pharmacognosy?projectId=${projectId}`, {
    headers: revHeaders
  });
  const checkData = await checkRes.json();
  if (!checkRes.ok) throw new Error(`Reviewer checking failed: ${await checkRes.text()}`);
  const assignmentId = checkData.activeAssignment?.assignmentId;
  console.log(`✔ Step 8: Reviewer loaded Pharmacognosy checking workspace (Assignment ID: ${assignmentId})`);

  // 9. Reviewer Autosaves Verification Checklist
  const draftRes = await fetch(`${BASE_URL}/api/reviewer/reviews/${assignmentId}/draft`, {
    method: 'POST',
    headers: revHeaders,
    body: JSON.stringify({
      checklistData: {
        '0': true, // Botanical identity verified
        '1': true, // Plant part clearly identified
        '2': false, // Plant material/source requires additional herbarium details
        '3': true,
        '4': true,
        '5': true
      },
      comments: 'Preliminary botanical check conducted. Voucher specimen provenance needs explicit herbarium confirmation.'
    })
  });
  if (!draftRes.ok) throw new Error(`Reviewer checklist autosave draft failed: ${await draftRes.text()}`);
  console.log('✔ Step 9: Reviewer verification checklist and comments autosaved successfully');

  // 10. Reviewer Adds a Structured Finding (Severity: MAJOR) and Requests Revision
  const submitRevision = await fetch(`${BASE_URL}/api/reviewer/reviews/${assignmentId}/submit`, {
    method: 'POST',
    headers: revHeaders,
    body: JSON.stringify({
      assessment: 'REVISION_REQUIRED',
      comments: 'Please clarify voucher specimen herbarium accession details in Stage 1.',
      findings: [
        {
          severity: 'MAJOR',
          title: 'Voucher Specimen Herbarium Documentation',
          sectionName: 'Botanical Identity',
          comment: 'The voucher specimen number PNH-2026-8812 should cite the physical repository accession code and verified herbarium sheet archive.',
          recommendation: 'Update Stage 1 with explicit herbarium sheet accession code.',
          referenceLink: 'Voucher Specimen Number: PNH-2026-8812',
          affectedStage: 'plant-literature'
        }
      ]
    })
  });
  const revResult = await submitRevision.json();
  if (!submitRevision.ok) throw new Error(`Submit revision failed: ${JSON.stringify(revResult)}`);
  console.log('✔ Step 10: Reviewer submitted Revision Request with Major Finding linked to evidence');

  // 11. Researcher Views Feedback in Stage 6
  const s6ReviewRes = await fetch(`${BASE_URL}/api/researcher/projects/${projectId}/expert-review`, {
    headers: rHeaders
  });
  const s6Data = await s6ReviewRes.json();
  const finding = s6Data.feedbackList?.find(f => f.title?.includes('Voucher Specimen'));
  if (!finding) throw new Error('Submitted finding not visible in Researcher Stage 6');
  console.log(`✔ Step 11: Researcher received Revision Request in Stage 6 (Finding ID: ${finding.id}, Severity: ${finding.severity})`);

  // 12. Researcher Responds to Finding
  const respRes = await fetch(`${BASE_URL}/api/researcher/projects/${projectId}/expert-review`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({
      action: 'save-response',
      feedbackId: finding.id,
      researcherReply: 'Updated Stage 1 documentation with PNH official herbarium accession sheet code #8812-B verified.'
    })
  });
  if (!respRes.ok) throw new Error(`Researcher response failed: ${await respRes.text()}`);
  console.log('✔ Step 12: Researcher formulated structured response to reviewer finding');

  // 13. Researcher Resubmits Revised Dossier
  const resubmitRes = await fetch(`${BASE_URL}/api/researcher/projects/${projectId}/expert-review`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({
      action: 'resubmit',
      revisionSummary: 'Clarified voucher specimen herbarium accession record with verified archive sheet code.'
    })
  });
  const resubmitData = await resubmitRes.json();
  if (!resubmitRes.ok) throw new Error(`Resubmit failed: ${JSON.stringify(resubmitData)}`);
  const newSubmissionId = resubmitData.submissionId;
  const newRound = resubmitData.reviewRound;
  console.log(`✔ Step 13: Resubmitted revised dossier (New Submission ID: ${newSubmissionId}, Cycle ${newRound})`);

  // 14. Reviewer Re-checks Pharmacognosy, Resolves Finding, and Approves Area
  const newCheckRes = await fetch(`${BASE_URL}/api/reviewer/checking/pharmacognosy?projectId=${projectId}`, {
    headers: revHeaders
  });
  const newCheckData = await newCheckRes.json();
  const newAssignmentId = newCheckData.activeAssignment?.assignmentId;

  // Resolve finding and approve
  const approvePharmaRes = await fetch(`${BASE_URL}/api/reviewer/reviews/${newAssignmentId}/submit`, {
    method: 'POST',
    headers: revHeaders,
    body: JSON.stringify({
      assessment: 'ACCEPTABLE',
      comments: 'Herbarium accession sheet verified. Botanical provenance and identification fully acceptable.',
      findings: [
        {
          id: finding.id,
          status: 'RESOLVED',
          comment: finding.comment,
          recommendation: finding.recommendation
        }
      ]
    })
  });
  if (!approvePharmaRes.ok) throw new Error(`Pharmacognosy approval failed: ${await approvePharmaRes.text()}`);
  console.log('✔ Step 14: Pharmacognosy review approved (Finding marked RESOLVED)');

  // 15. Verify Partial State (1 of 5 Approved) -> Project must NOT be completed
  const partialStage6 = await fetch(`${BASE_URL}/api/researcher/projects/${projectId}/expert-review`, {
    headers: rHeaders
  });
  const partialData = await partialStage6.json();
  if (partialData.approvalStats.isFullyApproved || partialData.project.status === 'COMPLETED') {
    throw new Error('Project prematurely marked completed with only 1 of 5 areas approved!');
  }
  console.log(`✔ Step 15: Partial state verified: ${partialData.approvalStats.approvedCount}/5 Approved - Project remains In Review (NOT completed)`);

  // 16. Approve Remaining 4 Professional Areas (Bioinformatics, Pharmacology, Formulation, Clinical Safety)
  const remainingRoles = ['bioinformatics', 'pharmacology', 'formulation', 'clinical-safety'];
  for (const role of remainingRoles) {
    const rCheck = await fetch(`${BASE_URL}/api/reviewer/checking/${role}?projectId=${projectId}`, {
      headers: revHeaders
    });
    const rData = await rCheck.json();
    const rAssignId = rData.activeAssignment?.assignmentId;
    if (!rAssignId) throw new Error(`Assignment not found for role ${role}`);

    const rApprove = await fetch(`${BASE_URL}/api/reviewer/reviews/${rAssignId}/submit`, {
      method: 'POST',
      headers: revHeaders,
      body: JSON.stringify({
        assessment: 'ACCEPTABLE',
        comments: `Independent peer review complete for ${role}. Research evidence verified and scientifically acceptable.`
      })
    });
    if (!rApprove.ok) throw new Error(`Approval failed for role ${role}: ${await rApprove.text()}`);
    console.log(`✔ Step 16: ${role.toUpperCase()} approved successfully`);
  }

  // 17. Verify Final 5/5 Approval & Project Completion
  const finalStage6 = await fetch(`${BASE_URL}/api/researcher/projects/${projectId}/expert-review`, {
    headers: rHeaders
  });
  const finalData = await finalStage6.json();
  if (!finalData.approvalStats.isFullyApproved) {
    throw new Error(`Expected 5/5 approved, got: ${finalData.approvalStats.progressText}`);
  }
  if (finalData.project.status !== 'COMPLETED') {
    throw new Error(`Expected project status COMPLETED, got: ${finalData.project.status}`);
  }
  if (finalData.stageMap['expert-review'] !== 'COMPLETED') {
    throw new Error(`Expected Stage 6 status COMPLETED, got: ${finalData.stageMap['expert-review']}`);
  }
  console.log('✔ Step 17: Exactly 5/5 Approved -> Project & Stage 6 status automatically COMPLETED (100%)');

  // =========================================================================
  // PATH A: RESEARCH -> REVIEW -> NO FINDINGS -> DIRECT 5/5 APPROVAL
  // =========================================================================
  console.log('\n---------------------------------------------------------------');
  console.log('STARTING PATH A: Direct Approval Workflow (No Findings)');
  console.log('---------------------------------------------------------------');

  const testTitleA = `E2E Direct Approval Study ${Date.now()}`;
  await fetch(`${BASE_URL}/api/researcher/projects`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({
      title: testTitleA,
      shortDescription: 'Direct verification study for botanical extract',
      researchObjective: 'Validate direct approval pathway',
      researchQuestion: 'Can 5/5 direct approvals complete the dossier cleanly?',
      areaOfInterest: 'Phytochemistry',
      plantId: 'ampalaya',
      isDraft: false,
    })
  });
  const listA = await (await fetch(`${BASE_URL}/api/researcher/projects`, { headers: rHeaders })).json();
  const projectA = listA.projects.find(p => p.title === testTitleA);
  const projAId = projectA.id;
  console.log(`✔ Step 1A: Created Project A (ID: ${projAId}) - "${testTitleA}"`);

  // Progress Stages 1-5 for Project A
  await fetch(`${BASE_URL}/api/researcher/projects/${projAId}/plant-literature`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({
      action: 'complete-stage',
      partsStudied: 'Leaves & Fruit',
      specimenSource: 'Bureau of Plant Industry',
      selectionRationale: 'Standardized baseline extract for metabolic enzyme inhibition profiling.'
    })
  });

  const cResA = await fetch(`${BASE_URL}/api/researcher/projects/${projAId}/in-silico`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({ action: 'add-compound', compoundName: 'charantin' })
  });
  const cDataA = await cResA.json();
  const cIdA = cDataA.compoundId || cDataA.insertedId;
  await fetch(`${BASE_URL}/api/researcher/projects/${projAId}/in-silico`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({ action: 'toggle-docking', compoundId: cIdA, selectedForDocking: true })
  });
  await fetch(`${BASE_URL}/api/researcher/projects/${projAId}/in-silico`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({ action: 'run-screening', compoundId: cIdA })
  });
  await fetch(`${BASE_URL}/api/researcher/projects/${projAId}/in-silico`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({
      action: 'complete-stage',
      selectionRationale: 'Charantin exhibits favorable QSAR metrics and targeted metabolic bioactivity profile.'
    })
  });

  // Add verified target 5KIR
  const addTARes = await fetch(`${BASE_URL}/api/researcher/projects/${projAId}/docking`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({ action: 'add-target', pdbId: '5KIR' })
  });
  const targetIdA = (await addTARes.json()).targetId;

  // Prepare ligand and target
  await fetch(`${BASE_URL}/api/researcher/projects/${projAId}/docking`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({ action: 'prepare' })
  });

  for (let i = 0; i < 15; i++) {
    const ws = await (await fetch(`${BASE_URL}/api/researcher/projects/${projAId}/docking`, { headers: rHeaders })).json();
    const lReady = ws.workspace?.ligands?.every(l => l.preparationReady);
    const tReady = ws.workspace?.targets?.every(t => t.receptorPrepared);
    if (lReady && tReady) break;
    await new Promise(r => setTimeout(r, 1000));
  }

  // Use detected site RCX A:601
  await fetch(`${BASE_URL}/api/researcher/projects/${projAId}/docking`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({ action: 'use-detected-site', targetId: targetIdA, resname: 'RCX', chain: 'A', seq: '601' })
  });

  // Run Vina docking
  await fetch(`${BASE_URL}/api/researcher/projects/${projAId}/docking`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({ action: 'run', compoundId: cIdA, targetId: targetIdA })
  });

  for (let i = 0; i < 20; i++) {
    const ws = await (await fetch(`${BASE_URL}/api/researcher/projects/${projAId}/docking`, { headers: rHeaders })).json();
    const job = ws.workspace?.jobs?.find(j => j.compoundId === cIdA && j.targetId === targetIdA);
    if (job?.status === 'COMPLETED' && job?.affinity != null) break;
    await new Promise(r => setTimeout(r, 2000));
  }

  await fetch(`${BASE_URL}/api/researcher/projects/${projAId}/docking`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({
      action: 'save-interpretation',
      keyFindings: 'Charantin docking demonstrates active-site ligand stability.',
      interpretation: 'Charantin docking demonstrates active-site ligand stability.',
      approve: true
    })
  });
  await fetch(`${BASE_URL}/api/researcher/projects/${projAId}/docking`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({ action: 'complete-stage' })
  });

  await fetch(`${BASE_URL}/api/researcher/projects/${projAId}/formulation`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({
      action: 'save-overview',
      formulationName: 'Ampalaya Extract Capsule',
      formulationCode: 'AMP-CAP-01',
      formulationType: 'Standardized Botanical Extract',
      dosageFormType: 'Hard Capsule',
      targetRoute: 'Oral',
      researchPurpose: 'Metabolic wellness supplement',
      intendedUse: 'Metabolic wellness supplement'
    })
  });
  await fetch(`${BASE_URL}/api/researcher/projects/${projAId}/safety`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({
      action: 'save-sections',
      knownSafetyEvidence: 'Subchronic oral administration demonstrates wide safety margin.',
      toxicityEvidence: 'Standard toxicology screening protocol confirmed non-toxic.',
      potentialContraindications: 'Contraindicated in pregnancy.',
      herbDrugInteractions: 'Hypoglycemic synergy.',
      populationConsiderations: 'Adults only.',
      doseConcentrationConcerns: '500 mg extract standard dose.',
      knownAdverseEffects: 'None reported.',
      evidenceGaps: 'Long term human data.'
    })
  });
  await fetch(`${BASE_URL}/api/researcher/projects/${projAId}/formulation-safety`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({ action: 'complete-stage' })
  });

  await fetch(`${BASE_URL}/api/researcher/projects/${projAId}/completion-integration`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({
      action: 'approve-synthesis',
      isSynthesisApproved: true,
      evidenceAlignment: 'Consistent alignment across Stages 1 through 4.',
      keyFindings: ['Phytochemical markers verified', 'Docking validity confirmed'],
      scientificInterpretation: 'Thermodynamically favorable binding scores observed.',
      limitations: 'Wet-lab assays recommended for clinical translation.',
      finalConclusion: 'Ready for Stage 6 expert review.'
    })
  });
  await fetch(`${BASE_URL}/api/researcher/projects/${projAId}/completion-integration`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({ action: 'finalize' })
  });
  console.log('✔ Step 2A: Stages 1-5 completed for Project A');

  // Submit Stage 6
  await fetch(`${BASE_URL}/api/researcher/projects/${projAId}/expert-review`, {
    method: 'POST',
    headers: rHeaders,
    body: JSON.stringify({ action: 'submit', messageToReviewers: 'Direct approval submission' })
  });
  console.log('✔ Step 3A: Submitted Project A to Stage 6');

  // Direct 5/5 Approval across all areas
  const allRoles = ['pharmacognosy', 'bioinformatics', 'pharmacology', 'formulation', 'clinical-safety'];
  for (const role of allRoles) {
    const rCheck = await (await fetch(`${BASE_URL}/api/reviewer/checking/${role}?projectId=${projAId}`, { headers: revHeaders })).json();
    const rAssignId = rCheck.activeAssignment?.assignmentId;
    await fetch(`${BASE_URL}/api/reviewer/reviews/${rAssignId}/submit`, {
      method: 'POST',
      headers: revHeaders,
      body: JSON.stringify({
        assessment: 'ACCEPTABLE',
        comments: `Direct peer approval verified for ${role}. No deficiencies identified.`
      })
    });
    console.log(`✔ Step 4A: ${role.toUpperCase()} approved directly`);
  }

  // Verify Project A completion
  const stage6A = await (await fetch(`${BASE_URL}/api/researcher/projects/${projAId}/expert-review`, { headers: rHeaders })).json();
  if (!stage6A.approvalStats.isFullyApproved || stage6A.project.status !== 'COMPLETED') {
    throw new Error('Project A direct 5/5 approval failed to complete project!');
  }
  console.log('✔ Step 5A: Path A Direct 5/5 Approval successfully completed Project A!');

  console.log('\n===============================================================');
  console.log('   ALL E2E WORKFLOW TESTS PASSED CLEANLY WITH ZERO ERRORS!');
  console.log('===============================================================\n');
}

testCompleteWorkflow().catch(err => {
  console.error('\n❌ E2E TEST FAILED:', err);
  process.exit(1);
});
