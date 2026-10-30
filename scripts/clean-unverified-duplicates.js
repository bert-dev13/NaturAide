const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'natureaide_db',
  });

  const [rows] = await pool.query('SELECT id, pubmedId, title FROM scientific_references WHERE source_verified = 0');
  console.log(`Unverified rows in scientific_references: ${rows.length}`);
  for (const r of rows) {
    console.log(`- ${r.id}: PMID ${r.pubmedId} | ${r.title}`);
    await pool.query('DELETE FROM product_references WHERE referenceId = ?', [r.id]);
    await pool.query('DELETE FROM scientific_references WHERE id = ?', [r.id]);
    console.log(`  Deleted ${r.id}`);
  }

  const [remaining] = await pool.query('SELECT count(*) as count FROM scientific_references');
  console.log(`Remaining total references in DB: ${remaining[0].count}`);

  await pool.end();
}

main().catch(console.error);
