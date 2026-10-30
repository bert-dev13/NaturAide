const fs = require('fs');
const mysql = require('mysql2/promise');

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const BASE_URL = 'http://localhost:3000';

async function run() {
  console.log('=== STEP 1: AUTHENTICATION TESTING ===');
  
  // Researcher Login
  const resLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'researcher@natureaide.test', password: 'NatureAide123!' })
  });
  const resCookie = resLogin.headers.get('set-cookie');
  console.log('Researcher Login Status:', resLogin.status, 'Cookie:', Boolean(resCookie));
  if (resLogin.status !== 200) throw new Error('Researcher login failed');

  // Reviewer Login
  const revLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'reviewer@natureaide.test', password: 'NatureAide123!' })
  });
  const revCookie = revLogin.headers.get('set-cookie');
  console.log('Reviewer Login Status:', revLogin.status, 'Cookie:', Boolean(revCookie));
  if (revLogin.status !== 200) throw new Error('Reviewer login failed');

  console.log('\n=== STEP 2: RESEARCHER PORTAL API TESTING (Project 8) ===');
  const rHeaders = { Cookie: resCookie };

  // 1. Projects List
  const pListRes = await fetch(`${BASE_URL}/api/researcher/projects`, { headers: rHeaders });
  console.log('GET /api/researcher/projects ->', pListRes.status);
  const pList = await pListRes.json();
  console.log('Found', pList.projects?.length || pList.length || 0, 'projects');

  // 2. Stage 1: Plant & Literature
  const s1Res = await fetch(`${BASE_URL}/api/researcher/projects/8/plant-literature`, { headers: rHeaders });
  console.log('GET /api/researcher/projects/8/plant-literature ->', s1Res.status);
  if (s1Res.status !== 200) {
    const s1Err = await s1Res.text();
    console.error('Stage 1 Error:', s1Err);
  } else {
    const s1Data = await s1Res.json();
    console.log('Stage 1 Loaded successfully. Plant:', s1Data.plant?.commonName || s1Data.plant?.name);
  }

  // 3. Stage 2: In-Silico
  const s2Res = await fetch(`${BASE_URL}/api/researcher/projects/8/in-silico`, { headers: rHeaders });
  console.log('GET /api/researcher/projects/8/in-silico ->', s2Res.status);
  if (s2Res.status !== 200) {
    const s2Err = await s2Res.text();
    console.error('Stage 2 Error:', s2Err);
  } else {
    const s2Data = await s2Res.json();
    console.log('Stage 2 Loaded successfully. Compounds count:', s2Data.compounds?.length);
  }

  // 4. Stage 3: Molecular Docking
  const s3Res = await fetch(`${BASE_URL}/api/researcher/projects/8/docking`, { headers: rHeaders });
  console.log('GET /api/researcher/projects/8/docking ->', s3Res.status);
  if (s3Res.status !== 200) {
    const s3Err = await s3Res.text();
    console.error('Stage 3 Error:', s3Err);
  } else {
    const s3Data = await s3Res.json();
    console.log('Stage 3 Loaded successfully. Docking runs:', s3Data.dockingRuns?.length || s3Data.runs?.length);
  }

  // 5. Stage 4: Formulation & Safety
  const s4Res = await fetch(`${BASE_URL}/api/researcher/projects/8/formulation-safety`, { headers: rHeaders });
  console.log('GET /api/researcher/projects/8/formulation-safety ->', s4Res.status);
  if (s4Res.status !== 200) {
    const s4Err = await s4Res.text();
    console.error('Stage 4 Error:', s4Err);
  } else {
    const s4Data = await s4Res.json();
    console.log('Stage 4 Loaded successfully. Prototype:', s4Data.formulationProfile?.prototypeName || s4Data.prototype?.name);
  }

  // 6. Stage 5: Research Integration
  const s5Res = await fetch(`${BASE_URL}/api/researcher/projects/8/completion-integration`, { headers: rHeaders });
  console.log('GET /api/researcher/projects/8/completion-integration ->', s5Res.status);
  if (s5Res.status !== 200) {
    const s5Err = await s5Res.text();
    console.error('Stage 5 Error:', s5Err);
  } else {
    const s5Data = await s5Res.json();
    console.log('Stage 5 Loaded successfully. Synthesis status:', s5Data.synthesis?.status || s5Data.status);
  }

  // 7. Stage 6: Expert Review
  const s6Res = await fetch(`${BASE_URL}/api/researcher/projects/8/expert-review`, { headers: rHeaders });
  console.log('GET /api/researcher/projects/8/expert-review ->', s6Res.status);
  if (s6Res.status !== 200) {
    const s6Err = await s6Res.text();
    console.error('Stage 6 Error:', s6Err);
  } else {
    const s6Data = await s6Res.json();
    console.log('Stage 6 Loaded successfully. Coverage areas:', s6Data.coverageAreas?.length, 'Approval stats:', s6Data.approvalStats);
  }

  console.log('\n=== STEP 3: PROFESSIONAL REVIEWER PORTAL API TESTING ===');
  const revHeaders = { Cookie: revCookie };

  // 1. Reviewer Dashboard / Workspace
  const revDashRes = await fetch(`${BASE_URL}/api/reviewer/reviews`, { headers: revHeaders });
  console.log('GET /api/reviewer/reviews ->', revDashRes.status);
  if (revDashRes.status !== 200) {
    console.error('Reviewer Dashboard Error:', await revDashRes.text());
  } else {
    const revDash = await revDashRes.json();
    console.log('Reviewer reviews found:', revDash.reviews?.length || revDash.assignments?.length || revDash.length || 0);
  }

  // 2. Five Checking Area Endpoints
  const areas = ['pharmacognosy', 'bioinformatics', 'pharmacology', 'formulation', 'clinical-safety'];
  for (const area of areas) {
    const areaRes = await fetch(`${BASE_URL}/api/reviewer/checking/${area}?projectId=8`, { headers: revHeaders });
    console.log(`GET /api/reviewer/checking/${area}?projectId=8 ->`, areaRes.status);
    if (areaRes.status !== 200) {
      console.error(`Area ${area} Error:`, await areaRes.text());
    } else {
      const areaData = await areaRes.json();
      console.log(`Area ${area} OK: Project:`, areaData.project?.title, 'ReviewCycle:', areaData.review?.reviewCycle, 'Checklist:', Boolean(areaData.review?.checklistData));
    }
  }

  console.log('\n=== ALL INITIAL CHECKS COMPLETED ===');
}

run().catch(err => {
  console.error('Test script error:', err);
  process.exit(1);
});

