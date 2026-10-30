const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'natureaide_db',
  });

  const [plants] = await pool.query('SELECT id, slug, commonName, scientificName FROM plants ORDER BY commonName ASC');
  console.log(`Total plants in database: ${plants.length}`);

  for (const p of plants) {
    const cleanCommon = p.commonName.replace(/\s*\([^)]*\)/, '').trim();
    const [refs] = await pool.query(
      `SELECT sr.id, sr.pubmedId, sr.title, sr.evidence_scope, sr.source_verified, sr.botanical_identity_verified
       FROM scientific_references sr
       WHERE sr.source_verified = 1
         AND (sr.plantOrIngredientStudied LIKE ? OR sr.plantOrIngredientStudied LIKE ?)
       ORDER BY sr.publicationYear DESC`,
      [`%${cleanCommon}%`, `%${p.scientificName}%`]
    );
    console.log(`\nPlant: ${p.commonName} (${p.scientificName}) -> ${refs.length} verified refs:`);
    for (const r of refs) {
      console.log(`  * PMID ${r.pubmedId} [${r.evidence_scope}]: ${r.title.substring(0, 75)}...`);
    }
  }

  const [allRefs] = await pool.query('SELECT id, pubmedId, title, evidence_scope, source_verified FROM scientific_references ORDER BY id ASC');
  console.log(`\n========================================`);
  console.log(`Total scientific_references in DB: ${allRefs.length}`);
  for (const r of allRefs) {
    console.log(`ID ${r.id} | PMID ${r.pubmedId} | Verified: ${r.source_verified} | Scope: ${r.evidence_scope} | Title: ${r.title.substring(0, 60)}...`);
  }

  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
