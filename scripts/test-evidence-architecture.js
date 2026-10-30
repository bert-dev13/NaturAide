const http = require('http');

function postJson(path, payload, cookie) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    };
    if (cookie) headers['Cookie'] = cookie;

    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'POST',
      headers
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getWithCookie(path, cookie) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'GET',
      headers: { 'Cookie': cookie }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  // 1. Login
  const loginRes = await postJson('/api/auth/login', {
    email: 'researcher@natureaide.test',
    password: 'NatureAide123!'
  });
  const cookie = loginRes.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
  console.log('Login:', loginRes.status);

  // 2. Test Centralized Evidence Library API
  const libRes = await getWithCookie('/api/researcher/projects/1/evidence', cookie);
  console.log('\n--- Evidence Library API ---');
  console.log('Status:', libRes.status);
  const libData = JSON.parse(libRes.body);
  console.log('Class counts:', libData.counts);
  console.log('Total items retrieved:', libData.items?.length);
  console.log('Available compounds:', libData.availableCompounds);
  console.log('Available targets:', libData.availableTargets);

  // 3. Test Contextual Literature Query for Stage 3 Molecular Docking
  console.log('\n--- Contextual Literature Query (Stage 3 Docking) ---');
  const queryRes = await postJson('/api/researcher/projects/1/evidence/query', {
    stageKey: 'docking',
    resultType: 'DOCKING',
    resultId: 1,
    compound: 'L-Borneol',
    target: 'Cyclooxygenase-2',
    endpoint: 'inflammation',
    autoAttach: true
  }, cookie);
  console.log('Query Status:', queryRes.status);
  const qData = JSON.parse(queryRes.body);
  console.log('Generated Query:', qData.generatedQuery);
  console.log('From Cache?', qData.fromCache);
  console.log('Results count:', qData.count);
  if (qData.items?.length > 0) {
    console.log('Sample Paper:', {
      title: qData.items[0].title.slice(0, 60) + '...',
      authors: qData.items[0].authors.slice(0, 40) + '...',
      journal: qData.items[0].journal,
      pmid: qData.items[0].pmid,
      evidenceClass: qData.items[0].evidenceClass
    });
  }

  // 4. Test Strict Anti-Fabrication Rule on empty / nonexistent term
  console.log('\n--- Anti-Fabrication Rule Test ---');
  const emptyQueryRes = await postJson('/api/researcher/projects/1/evidence/query', {
    stageKey: 'docking',
    customQuery: '"NonExistentPlantXYZ999"[Title/Abstract] AND "FakeTargetXYZ"',
  }, cookie);
  const eqData = JSON.parse(emptyQueryRes.body);
  console.log('Count:', eqData.count);
  console.log('Empty Message:', eqData.emptyMessage);

  // 5. Test Centralized Page View
  console.log('\n--- Centralized Research Evidence Page ---');
  const pageRes = await getWithCookie('/researcher/projects/1/evidence', cookie);
  console.log('Page Status:', pageRes.status);
  console.log('Page renders Research Evidence Library?', pageRes.body.includes('Research Evidence Library'));
  console.log('Page includes Multi-Pillar Evidence Architecture?', pageRes.body.includes('Multi-Pillar Evidence Architecture'));

  // 6. Test AI Research Assistant Integration
  console.log('\n--- AI Research Assistant Integration Test ---');
  const aiChatRes = await postJson('/api/researcher/projects/1/chat', {
    message: 'What literature supports my docking result for this target?',
  }, cookie);
  console.log('AI Chat Status:', aiChatRes.status);
  const aiChatData = JSON.parse(aiChatRes.body);
  console.log('AI Has Matching Literature?', aiChatData.hasMatchingLiterature);
  console.log('AI Grounded Items Count:', aiChatData.groundedItemsCount);
  console.log('AI Answer Preview:', aiChatData.answer.slice(0, 160) + '...');

  // 7. Test AI Anti-Fabrication with Non-Existent Target
  console.log('\n--- AI Anti-Fabrication Test (Non-Existent Target) ---');
  const aiEmptyRes = await postJson('/api/researcher/projects/1/chat', {
    message: 'What literature supports my docking result for NonExistentTarget999?',
  }, cookie);
  const aiEmptyData = JSON.parse(aiEmptyRes.body);
  console.log('AI Has Matching Literature?', aiEmptyData.hasMatchingLiterature);
  console.log('AI Empty Answer Contains Anti-Fabrication Notice?', aiEmptyData.answer.includes('No relevant verified literature found'));
  console.log('Full AI Anti-Fabrication Response:\n', aiEmptyData.answer);
})();
