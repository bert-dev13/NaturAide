const mysql = require("mysql2/promise");

async function listMissing() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: parseInt(process.env.MYSQL_PORT || "3306"),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "natureaide_db"
  });

  const [rows] = await conn.query(`
    SELECT hp.id, hp.slug, hp.name, hp.brandName, hp.dosageForm, hp.dosageStrength, hp.productType, hp.productClassification,
           GROUP_CONCAT(p.commonName SEPARATOR ", ") as plantNames,
           GROUP_CONCAT(p.slug SEPARATOR ", ") as plantSlugs
    FROM herbal_products hp
    LEFT JOIN product_plants pp ON pp.productId = hp.id
    LEFT JOIN plants p ON p.id = pp.plantId
    WHERE hp.publicationStatus = 'PUBLISHED' AND hp.isPublished = 1 AND hp.image_verified = 0
    GROUP BY hp.id
    ORDER BY hp.slug ASC
  `);

  console.log("Total missing products:", rows.length);
  rows.forEach((r, idx) => {
    console.log(`${idx + 1}. [${r.slug}] ${r.name}`);
    console.log(`   Form: ${r.dosageForm || r.productType} | Strength: ${r.dosageStrength || 'N/A'} | Plants: ${r.plantNames || 'N/A'} (${r.plantSlugs || 'N/A'})`);
  });

  await conn.end();
}
listMissing().catch(console.error);
