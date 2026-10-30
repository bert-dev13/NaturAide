const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'natureaide_db',
  });

  const [prods] = await pool.query('SELECT id, slug, brandName, name FROM herbal_products WHERE isPublished = 1');
  console.log(`Checking ${prods.length} published herbal products:`);

  for (const p of prods) {
    const [refs] = await pool.query(
      `SELECT pr.productId, pr.evidenceClassification, sr.pubmedId, sr.title, sr.evidence_scope, sr.source_verified
       FROM product_references pr
       JOIN scientific_references sr ON sr.id = pr.referenceId
       WHERE pr.productId = ? AND sr.source_verified = 1`,
      [p.id]
    );
    console.log(`\nProduct: ${p.brandName} - ${p.name} (${p.slug}) -> ${refs.length} verified references:`);
    for (const r of refs) {
      console.log(`  * PMID ${r.pubmedId} [${r.evidenceClassification}] (${r.evidence_scope}): ${r.title.substring(0, 60)}...`);
    }
  }

  await pool.end();
}

main().catch(console.error);
