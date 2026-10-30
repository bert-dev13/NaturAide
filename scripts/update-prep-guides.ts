import pool from "../src/lib/db";
import { AUTHORITATIVE_HERBAL_PRODUCTS } from "../src/lib/external-evidence-service";

async function main() {
  for (const prod of AUTHORITATIVE_HERBAL_PRODUCTS) {
    if (prod.preparationGuide) {
      await pool.query(
        "UPDATE herbal_products SET preparationGuide = ? WHERE id = ?",
        [JSON.stringify(prod.preparationGuide), prod.id]
      );
      console.log("Updated preparationGuide for:", prod.id);
    }
  }
  await pool.end();
}

main().catch(console.error);
