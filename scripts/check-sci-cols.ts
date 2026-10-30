import pool from "../src/lib/db";

async function main() {
  const [cols]: any = await pool.query("DESCRIBE scientific_references");
  console.log("scientific_references columns:", cols.map((c: any) => `${c.Field} (${c.Type})`));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
