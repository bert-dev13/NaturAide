const fs = require('fs');
const path = require('path');

/**
 * NatureAide UAT Summary Helper Script
 * 
 * IMPORTANT: This script NEVER executes tests automatically.
 * It strictly parses and summarizes human-recorded results from:
 * - docs/NATUREAIDE_UAT_TRACKER.csv
 * - docs/NATUREAIDE_UAT_DEFECT_REGISTER.csv
 */

const trackerPath = path.join(__dirname, '..', 'docs', 'NATUREAIDE_UAT_TRACKER.csv');
const defectPath = path.join(__dirname, '..', 'docs', 'NATUREAIDE_UAT_DEFECT_REGISTER.csv');
const summaryPath = path.join(__dirname, '..', 'docs', 'NATUREAIDE_UAT_ROUND1_SUMMARY.md');

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];
  
  const headers = parseCsvRow(lines[0]);
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvRow(lines[i]);
    if (values.length === 0) continue;
    const rowObj = {};
    headers.forEach((h, idx) => {
      rowObj[h.trim()] = values[idx] !== undefined ? values[idx].trim() : '';
    });
    rows.push(rowObj);
  }
  return rows;
}

function parseCsvRow(rowStr) {
  const result = [];
  let inQuotes = false;
  let currentVal = '';
  
  for (let i = 0; i < rowStr.length; i++) {
    const char = rowStr[i];
    if (char === '"') {
      if (inQuotes && rowStr[i + 1] === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(currentVal);
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  result.push(currentVal);
  return result;
}

function runSummary() {
  if (!fs.existsSync(trackerPath)) {
    console.error(`Tracker not found at: ${trackerPath}`);
    process.exit(1);
  }

  const trackerRows = parseCsv(fs.readFileSync(trackerPath, 'utf8'));
  let defectRows = [];
  if (fs.existsSync(defectPath)) {
    defectRows = parseCsv(fs.readFileSync(defectPath, 'utf8'));
  }

  const total = trackerRows.length;
  let passed = 0;
  let failed = 0;
  let blocked = 0;
  let notTested = 0;

  let p0Total = 0, p0Executed = 0, p0Passed = 0;
  let p1Total = 0, p1Executed = 0, p1Passed = 0;
  let p2Total = 0, p2Executed = 0, p2Passed = 0;

  trackerRows.forEach(r => {
    const status = (r['Status'] || 'NOT TESTED').toUpperCase();
    const priority = (r['Priority'] || 'P0').toUpperCase();

    if (priority === 'P0') p0Total++;
    else if (priority === 'P1') p1Total++;
    else if (priority === 'P2') p2Total++;

    if (status === 'PASS') {
      passed++;
      if (priority === 'P0') { p0Executed++; p0Passed++; }
      else if (priority === 'P1') { p1Executed++; p1Passed++; }
      else if (priority === 'P2') { p2Executed++; p2Passed++; }
    } else if (status === 'FAIL') {
      failed++;
      if (priority === 'P0') p0Executed++;
      else if (priority === 'P1') p1Executed++;
      else if (priority === 'P2') p2Executed++;
    } else if (status === 'BLOCKED') {
      blocked++;
    } else {
      notTested++;
    }
  });

  const executed = passed + failed;
  const passRate = executed > 0 ? ((passed / executed) * 100).toFixed(1) + '%' : 'N/A';

  const defectsBySeverity = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  const openDefectsBySeverity = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };

  defectRows.forEach(d => {
    const sev = (d['Severity'] || 'MEDIUM').toUpperCase();
    const st = (d['Status'] || 'OPEN').toUpperCase();
    if (defectsBySeverity[sev] !== undefined) defectsBySeverity[sev]++;
    if (st !== 'CLOSED' && st !== 'FIXED') {
      if (openDefectsBySeverity[sev] !== undefined) openDefectsBySeverity[sev]++;
    }
  });

  console.log('\n=============================================================');
  console.log('       NATUREAIDE UAT ROUND 1 EXECUTION SUMMARY             ');
  console.log('=============================================================');
  console.log(`Total UAT Cases    : ${total}`);
  console.log(`Executed           : ${executed} (Passed: ${passed}, Failed: ${failed})`);
  console.log(`Blocked            : ${blocked}`);
  console.log(`Not Tested         : ${notTested}`);
  console.log(`Pass Rate          : ${passRate}`);
  console.log('-------------------------------------------------------------');
  console.log('Priority Progress:');
  console.log(`  P0 (Critical)    : Executed ${p0Executed}/${p0Total} | Passed ${p0Passed}/${p0Total}`);
  console.log(`  P1 (Core)        : Executed ${p1Executed}/${p1Total} | Passed ${p1Passed}/${p1Total}`);
  console.log(`  P2 (Supporting)  : Executed ${p2Executed}/${p2Total} | Passed ${p2Passed}/${p2Total}`);
  console.log('-------------------------------------------------------------');
  console.log('Open Defect Backlog:');
  console.log(`  Critical         : ${openDefectsBySeverity.CRITICAL} open`);
  console.log(`  High             : ${openDefectsBySeverity.HIGH} open`);
  console.log(`  Medium           : ${openDefectsBySeverity.MEDIUM} open`);
  console.log(`  Low              : ${openDefectsBySeverity.LOW} open`);
  console.log('-------------------------------------------------------------');
  
  let gateStatus = 'UAT IN PROGRESS — NOT YET ELIGIBLE FOR PILOT DECISION';
  if (executed === 0) {
    gateStatus = 'UAT IN PROGRESS — 0 CASES EXECUTED';
  } else if (p0Executed === p0Total && passed / executed >= 0.95 && openDefectsBySeverity.CRITICAL === 0 && openDefectsBySeverity.HIGH === 0) {
    gateStatus = 'MEETS CANDIDATE CRITERIA FOR PILOT SIGNOFF REVIEW';
  }
  console.log(`Current Status     : ${gateStatus}`);
  console.log('=============================================================\n');

  // If --update flag is provided, update docs/NATUREAIDE_UAT_ROUND1_SUMMARY.md
  if (process.argv.includes('--update') && fs.existsSync(summaryPath)) {
    updateSummaryMarkdown({
      total,
      executed,
      passed,
      failed,
      blocked,
      notTested,
      passRate,
      p0Executed,
      p0Passed,
      p0Total,
      p1Executed,
      p1Passed,
      p1Total,
      p2Executed,
      p2Passed,
      p2Total,
      openDefectsBySeverity
    });
  }
}

function updateSummaryMarkdown(data) {
  let content = fs.readFileSync(summaryPath, 'utf8');
  
  // Update dashboard rows
  content = content.replace(/\|\s+\*\*Executed\*\*\s+\|[^|]+\|\s+\*\*(\d+)\*\*/, `| **Executed** | >= 95% (>= 63 cases) | **${data.executed}**`);
  content = content.replace(/\|\s+\*\*Passed\*\*\s+\|[^|]+\|\s+\*\*(\d+)\*\*/, `| **Passed** | - | **${data.passed}**`);
  content = content.replace(/\|\s+\*\*Failed\*\*\s+\|[^|]+\|\s+\*\*(\d+)\*\*/, `| **Failed** | - | **${data.failed}**`);
  content = content.replace(/\|\s+\*\*Blocked\*\*\s+\|[^|]+\|\s+\*\*(\d+)\*\*/, `| **Blocked** | 0 at completion | **${data.blocked}**`);
  content = content.replace(/\|\s+\*\*Not Tested\*\*\s+\|[^|]+\|\s+\*\*(\d+)\*\*/, `| **Not Tested** | 0 at completion | **${data.notTested}**`);
  content = content.replace(/\|\s+\*\*Pass Rate\*\*\s+\|[^|]+\|\s+\*\*([^*]+)\*\*/, `| **Pass Rate** | >= 95.0% | **${data.passRate}**`);

  content = content.replace(/\|\s+\*\*P0 \(Critical Governance\) Progress\*\*\s+\|[^|]+\|\s+\*\*[^|]+\*\*/, 
    `| **P0 (Critical Governance) Progress** | 41 / 41 (100%) | **Executed: ${data.p0Executed} / ${data.p0Total} &nbsp;\\|&nbsp; Passed: ${data.p0Passed} / ${data.p0Total}**`);
  content = content.replace(/\|\s+\*\*P1 \(Core Workflow\) Progress\*\*\s+\|[^|]+\|\s+\*\*[^|]+\*\*/, 
    `| **P1 (Core Workflow) Progress** | 19 / 19 (100%) | **Executed: ${data.p1Executed} / ${data.p1Total} &nbsp;\\|&nbsp; Passed: ${data.p1Passed} / ${data.p1Total}**`);
  content = content.replace(/\|\s+\*\*P2 \(UX & Supporting\) Progress\*\*\s+\|[^|]+\|\s+\*\*[^|]+\*\*/, 
    `| **P2 (UX & Supporting) Progress** | 6 / 6 (100%) | **Executed: ${data.p2Executed} / ${data.p2Total} &nbsp;\\|&nbsp; Passed: ${data.p2Passed} / ${data.p2Total}**`);

  // Update open defect counts
  content = content.replace(/\|\s+\*\*CRITICAL\*\*\s+\|\s+\*\*(\d+)\*\*/, `| **CRITICAL** | **${data.openDefectsBySeverity.CRITICAL}**`);
  content = content.replace(/\|\s+\*\*HIGH\*\*\s+\|\s+\*\*(\d+)\*\*/, `| **HIGH** | **${data.openDefectsBySeverity.HIGH}**`);
  content = content.replace(/\|\s+\*\*MEDIUM\*\*\s+\|\s+\*\*(\d+)\*\*/, `| **MEDIUM** | **${data.openDefectsBySeverity.MEDIUM}**`);
  content = content.replace(/\|\s+\*\*LOW\*\*\s+\|\s+\*\*(\d+)\*\*/, `| **LOW** | **${data.openDefectsBySeverity.LOW}**`);

  fs.writeFileSync(summaryPath, content, 'utf8');
  console.log(`Updated summary document: ${summaryPath}`);
}

runSummary();
