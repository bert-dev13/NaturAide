import pool from "../src/lib/db";

async function main() {
  const [cols]: any = await pool.query(
    "SHOW COLUMNS FROM herbal_products LIKE 'preparationGuide'"
  );
  if (cols.length === 0) {
    await pool.query(
      "ALTER TABLE herbal_products ADD COLUMN preparationGuide JSON NULL AFTER usageInstructions"
    );
    console.log("Added preparationGuide column to herbal_products table.");
  } else {
    console.log("preparationGuide column already exists.");
  }
  await pool.end();
}

main().catch(console.error);
