import pool from "../src/lib/db";

async function main() {
  const [rows]: any = await pool.query("SELECT id, pubmedId, title, plantOrIngredientStudied, doi FROM scientific_references");
  console.log(`Count: ${rows.length}`);
  for (const r of rows) {
    console.log(`[${r.id}] PMID: ${r.pubmedId} | ${r.plantOrIngredientStudied} | ${r.title.slice(0, 60)}...`);
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
