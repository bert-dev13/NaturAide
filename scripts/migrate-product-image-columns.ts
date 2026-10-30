import pool from "../src/lib/db";

async function main() {
  const [cols]: any = await pool.query("SHOW COLUMNS FROM herbal_products");
  const colNames = cols.map((c: any) => c.Field);

  if (!colNames.includes("image_path")) {
    await pool.query("ALTER TABLE herbal_products ADD COLUMN image_path VARCHAR(500) NULL AFTER local_image_path");
    console.log("Added image_path column");
  }
  if (!colNames.includes("image_source_url")) {
    await pool.query("ALTER TABLE herbal_products ADD COLUMN image_source_url VARCHAR(1000) NULL AFTER image_source");
    console.log("Added image_source_url column");
  }
  if (!colNames.includes("image_verified")) {
    await pool.query("ALTER TABLE herbal_products ADD COLUMN image_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER image_source_url");
    console.log("Added image_verified column");
  }

  const [updatedCols]: any = await pool.query("SHOW COLUMNS FROM herbal_products");
  console.log("Updated columns:", updatedCols.map((c: any) => c.Field));
  await pool.end();
}

main().catch(console.error);
