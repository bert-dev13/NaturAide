import pool from "../src/lib/db";

async function main() {
  console.log("Adding reference verification columns to scientific_references...");

  const [cols]: any = await pool.query("DESCRIBE scientific_references");
  const colNames = cols.map((c: any) => c.Field);

  if (!colNames.includes("source_verified")) {
    await pool.query("ALTER TABLE scientific_references ADD COLUMN source_verified BOOLEAN NOT NULL DEFAULT 0");
    console.log("Added source_verified");
  }

  if (!colNames.includes("source_verified_at")) {
    await pool.query("ALTER TABLE scientific_references ADD COLUMN source_verified_at DATETIME(3) NULL");
    console.log("Added source_verified_at");
  }

  if (!colNames.includes("evidence_scope")) {
    await pool.query("ALTER TABLE scientific_references ADD COLUMN evidence_scope VARCHAR(100) NOT NULL DEFAULT 'SINGLE_HERBAL_EVIDENCE'");
    console.log("Added evidence_scope");
  }

  if (!colNames.includes("botanical_identity_verified")) {
    await pool.query("ALTER TABLE scientific_references ADD COLUMN botanical_identity_verified BOOLEAN NOT NULL DEFAULT 0");
    console.log("Added botanical_identity_verified");
  }

  console.log("Columns successfully verified/added in scientific_references.");
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
