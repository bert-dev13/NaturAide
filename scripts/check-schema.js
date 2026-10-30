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

  const [tables] = await conn.query('SHOW TABLES');
  console.log('Tables:', tables.map(t => Object.values(t)[0]));

  const [cols] = await conn.query('DESCRIBE literature_references');
  console.log('literature_references:', cols.map(c => c.Field + ' (' + c.Type + ')'));

  try {
    const [cacheCols] = await conn.query('DESCRIBE literature_cache');
    console.log('literature_cache:', cacheCols.map(c => c.Field));
  } catch (e) {
    console.log('literature_cache does not exist yet');
  }

  try {
    const [scCols] = await conn.query('DESCRIBE scientific_references');
    console.log('scientific_references:', scCols.map(c => c.Field + ' (' + c.Type + ')'));
  } catch (e) {
    console.log('scientific_references does not exist');
  }

  try {
    const [dockCols] = await conn.query('DESCRIBE docking_simulations');
    console.log('docking_simulations:', dockCols.map(c => c.Field));
  } catch (e) {
    console.log('docking_simulations does not exist');
  }

  try {
    const [labCols] = await conn.query('DESCRIBE laboratory_validation');
    console.log('laboratory_validation:', labCols.map(c => c.Field));
  } catch (e) {
    console.log('laboratory_validation does not exist');
  }

  await conn.end();
})();
