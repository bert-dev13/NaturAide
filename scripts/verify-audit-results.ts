import pool from "../src/lib/db";

async function verifyAll() {
  console.log("=== VERIFYING PLANT COMMUNITY PRODUCT LISTINGS ===");

  const plants = ["lagundi", "sambong", "ginger", "tsaang-gubat", "yerba-buena", "turmeric"];

  for (const plantId of plants) {
    const [rows]: any = await pool.query(
      `SELECT hp.id, hp.slug, hp.name, hp.brandName, hp.manufacturer, hp.publicationStatus, hp.isPublished, hp.image_path, hp.image_verified
       FROM herbal_products hp
       JOIN product_plants pp ON pp.productId = hp.id
       WHERE pp.plantId = ? AND hp.publicationStatus IN ('VERIFIED', 'PUBLISHED') AND hp.isPublished = 1
       ORDER BY hp.name ASC`,
      [plantId]
    );

    console.log(`\nPlant: ${plantId}`);
    if (rows.length === 0) {
      console.log(`  -> 0 products found. Community display: "No verified herbal products are currently available for this plant."`);
    } else {
      for (const r of rows) {
        console.log(`  -> Product: ${r.name}`);
        console.log(`     Brand: ${r.brandName} | Mfr: ${r.manufacturer}`);
        console.log(`     Image: ${r.image_path} (Verified: ${r.image_verified})`);
        console.log(`     Status: ${r.publicationStatus} | isPublished: ${r.isPublished}`);
      }
    }
  }

  console.log("\n=== VERIFYING PRODUCT DETAIL ACCESS FOR ARCHIVED PRODUCTS ===");
  const archivedSlugs = [
    "botanical-lagundi-leaf-tea",
    "nirpromp-tsaang-gubat-tablet",
    "nirpromp-yerba-buena-infusion",
    "san-san-instant-salabat-ginger-tea",
    "yamang-bukid-turmeric-10-in-1-tea",
  ];

  for (const slug of archivedSlugs) {
    const [rows]: any = await pool.query(
      `SELECT id, name, publicationStatus, isPublished
       FROM herbal_products
       WHERE slug = ? AND publicationStatus IN ('VERIFIED', 'PUBLISHED') AND isPublished = 1`,
      [slug]
    );
    console.log(`Slug: ${slug} -> Accessible in Community? ${rows.length > 0 ? "YES (ERROR)" : "NO (Properly Hidden / 404)"}`);
  }

  console.log("\n=== VERIFYING PRODUCT DETAIL ACCESS FOR VERIFIED PRODUCTS ===");
  const verifiedSlugs = [
    "ascof-lagundi-syrup",
    "re-leaf-sambong-tablet",
    "tolak-angin-herbal-liquid",
  ];

  for (const slug of verifiedSlugs) {
    const [rows]: any = await pool.query(
      `SELECT id, name, publicationStatus, isPublished, image_path, image_verified
       FROM herbal_products
       WHERE slug = ? AND publicationStatus IN ('VERIFIED', 'PUBLISHED') AND isPublished = 1`,
      [slug]
    );
    console.log(`Slug: ${slug} -> Accessible? ${rows.length > 0 ? "YES (Verified & Published)" : "NO (ERROR)"}`);
  }

  process.exit(0);
}

verifyAll().catch(err => {
  console.error(err);
  process.exit(1);
});
