const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'natureaide_db'
  });

  const [plants] = await conn.query("SELECT id, slug, commonName, scientificName, is_pitahc FROM plants ORDER BY id");
  console.log('Plants in DB:');
  for (const p of plants) {
    const [refs] = await conn.query(
      "SELECT id, pubmedId, title FROM scientific_references WHERE plantOrIngredientStudied LIKE ? OR plantOrIngredientStudied LIKE ?",
      [`%${p.commonName.split(' ')[0]}%`, `%${p.scientificName.split(' ')[0]}%`]
    );
    console.log(`- ${p.id} (${p.commonName} / ${p.scientificName}) | refs: ${refs.length}`);
    refs.forEach(r => console.log(`    [PMID ${r.pubmedId}] ${r.title.substring(0, 70)}`));
  }

  await conn.end();
}

main().catch(console.error);
