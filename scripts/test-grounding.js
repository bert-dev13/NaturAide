const fs = require('fs');
const mysql = require('mysql2/promise');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
}

(async () => {
  const conn = await mysql.createConnection({
    host: env.DATABASE_HOST || '127.0.0.1',
    port: parseInt(env.DATABASE_PORT || '3306', 10),
    user: env.DATABASE_USER || 'root',
    password: env.DATABASE_PASSWORD || '',
    database: env.DATABASE_NAME || 'natureaide_db'
  });

  const [rows] = await conn.query('SELECT evidenceClass, title, numericalValue, authors, publicationYear, journalOrSource, pmid FROM project_evidence_items WHERE projectId = 1 LIMIT 10');
  console.log('--- Grounded Project Evidence Records for AI Assistant ---');
  for (const r of rows) {
    const val = r.numericalValue ? ` [Value: ${r.numericalValue}]` : '';
    const pmid = r.pmid ? ` [PMID: ${r.pmid}]` : '';
    console.log(`• [${r.evidenceClass}] ${r.title}${val}${pmid}`);
  }
  await conn.end();
})();
