import pool from "../src/lib/db";

async function main() {
  const [rows]: any = await pool.query("SELECT * FROM scientific_references");
  console.log(`Total scientific_references in MySQL: ${rows.length}\n`);
  for (const r of rows) {
    console.log(`ID: ${r.id}`);
    console.log(`PMID: ${r.pubmedId}`);
    console.log(`Title: ${r.title}`);
    console.log(`Authors: ${r.authors}`);
    console.log(`Year: ${r.publicationYear} | Journal: ${r.journalOrPublisher}`);
    console.log(`DOI: ${r.doi}`);
    console.log(`StudyType: ${r.studyType}`);
    console.log(`Plant/Ingredient: ${r.plantOrIngredientStudied}`);
    console.log(`Source URL: ${r.sourceUrl}`);
    console.log(`Short Summary: ${r.shortSummary}`);
    console.log("--------------------------------------------------");
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
