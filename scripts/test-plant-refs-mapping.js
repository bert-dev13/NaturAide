const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'natureaide_db',
  });

  const [plants] = await pool.query('SELECT id, slug, commonName, scientificName FROM medicinal_plants ORDER BY commonName ASC');
  console.log(Found  plants:);

  for (const plant of plants) {
    const cleanCommon = plant.commonName.replace(/\s*\([^)]*\)/, ").trim();
 const [refs] = await pool.query(
 SELECT sr.id, sr.pubmedId, sr.title, sr.plantOrIngredientStudied, sr.evidence_scope, sr.source_verified
 FROM scientific_references sr
 WHERE sr.source_verified = 1
 AND (sr.plantOrIngredientStudied LIKE ? OR sr.plantOrIngredientStudied LIKE ?)
 ORDER BY sr.publicationYear DESC,
 [%%, %%]
 );
 console.log(\nPlant: () - verified references:);
 refs.forEach(r => {
 console.log( - PMID []: ...);
 });
 }

 await pool.end();
}

main().catch(console.error);
