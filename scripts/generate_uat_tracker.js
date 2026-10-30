const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'docs', 'NATUREAIDE_UAT_TEST_CASES.md');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split(/\r?\n/);

const cases = [];
let currentCase = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  const matchId = line.match(/^###\s+([A-Z0-9\-]+)/);
  if (matchId) {
    if (currentCase) cases.push(currentCase);
    currentCase = {
      id: matchId[1],
      role: '',
      module: '',
      priority: '',
      scenario: '',
      severity: '',
      status: 'NOT TESTED'
    };
    continue;
  }
  if (!currentCase) continue;
  if (line.startsWith('- **Role**:')) currentCase.role = line.replace('- **Role**:', '').trim();
  if (line.startsWith('- **Module**:')) currentCase.module = line.replace('- **Module**:', '').trim();
  if (line.startsWith('- **Priority**:')) currentCase.priority = line.replace('- **Priority**:', '').trim();
  if (line.startsWith('- **Scenario**:')) currentCase.scenario = line.replace('- **Scenario**:', '').trim();
  if (line.startsWith('- **Severity if Failed**:')) currentCase.severity = line.replace('- **Severity if Failed**:', '').trim();
}
if (currentCase) cases.push(currentCase);

function escapeCsv(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// Columns:
// Test Case ID, Priority, Role, Module, Scenario, Tester, Test Date, Status, Severity, Issue ID, Remarks, Retest Status, Retest Date, Sign-Off
const headers = [
  'Test Case ID',
  'Priority',
  'Role',
  'Module',
  'Scenario',
  'Tester',
  'Test Date',
  'Status',
  'Severity',
  'Issue ID',
  'Remarks',
  'Retest Status',
  'Retest Date',
  'Sign-Off'
];

const csvRows = [headers.map(escapeCsv).join(',')];

cases.forEach(c => {
  const row = [
    c.id,
    c.priority,
    c.role,
    c.module,
    c.scenario,
    '', // Tester (empty initially)
    '', // Test Date (empty initially)
    'NOT TESTED', // Status (allowed: NOT TESTED, PASS, FAIL, BLOCKED)
    c.severity || '',
    '', // Issue ID
    '', // Remarks
    'NOT REQUIRED', // Retest Status (allowed: NOT REQUIRED, PENDING, PASS, FAIL)
    '', // Retest Date
    ''  // Sign-Off
  ];
  csvRows.push(row.map(escapeCsv).join(','));
});

const outPath = path.join(__dirname, '..', 'docs', 'NATUREAIDE_UAT_TRACKER.csv');
fs.writeFileSync(outPath, csvRows.join('\r\n'), 'utf8');
console.log(`Updated ${outPath} with ${cases.length} test cases with standardized columns.`);
