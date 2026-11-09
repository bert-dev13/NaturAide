/**
 * Seed / refresh the curated plant_compounds catalog.
 * Safe to re-run after migrate-only or dump-import setup on another laptop.
 */
import { ensurePlantCompoundsTable, syncPhytochemicalCatalog } from "../src/lib/phytochemical-catalog";

async function main() {
  await ensurePlantCompoundsTable();
  const result = await syncPhytochemicalCatalog();
  console.log(
    `Phytochemical catalog ready. Synced ${result.totalSynced} new records. Total compounds: ${result.totalCatalogSize}.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
