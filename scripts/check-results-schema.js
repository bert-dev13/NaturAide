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

  const checkTables = [
    'insilico_results',
    'docking_runs',
    'docking_targets',
    'safety_assessments',
    'laboratory_validations',
    'laboratory_tests',
    'laboratory_test_results'
  ];

  for (const t of checkTables) {
    try {
      const [cols] = await conn.query(`DESCRIBE ${t}`);
      console.log(`\n--- ${t} ---`);
      console.log(cols.map(c => c.Field + ' (' + c.Type + ')').join(', '));
    } catch (e) {
      console.log(`Table ${t} error:`, e.message);
    }
  }

  await conn.end();
})();
