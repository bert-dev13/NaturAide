import pool from "../src/lib/db";

async function main() {
  const [rows]: any = await pool.query(`
    SELECT pr.id as linkId, pr.productId, pr.referenceId, pr.evidenceClassification,
           sr.pubmedId, sr.title, sr.doi, sr.source_verified
    FROM product_references pr
    JOIN scientific_references sr ON sr.id = pr.referenceId
    ORDER BY pr.productId ASC
  `);

  console.log(`Linked product_references: ${rows.length}\n`);
  for (const r of rows) {
    console.log(`Product: ${r.productId}`);
    console.log(`  Classification: ${r.evidenceClassification}`);
    console.log(`  Ref ID: ${r.referenceId} | PMID: ${r.pubmedId}`);
    console.log(`  Title: ${r.title.slice(0, 70)}...`);
    console.log(`  DOI: ${r.doi}`);
    console.log("--------------------------------------------------");
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
