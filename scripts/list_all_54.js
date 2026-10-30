const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({ host: '127.0.0.1', user: 'root', database: 'natureaide_db', port: 3306 });
  const [rows] = await pool.query(`
    SELECT hp.id, hp.name, hp.brandName, hp.manufacturer, hp.productType, hp.productClassification,
           hp.dosageForm, hp.dosageStrength, hp.image_path, hp.image_verified, hp.publicationStatus, hp.isPublished,
           COUNT(prr.id) as regCount
    FROM herbal_products hp
    LEFT JOIN product_regulatory_records prr ON prr.productId = hp.id
    GROUP BY hp.id
    ORDER BY hp.name ASC
  `);
  console.log(`Unique herbal_products count: ${rows.length}`);
  rows.forEach((r, idx) => {
    console.log(`${idx + 1}. [${r.id}] "${r.name}" | Brand: ${r.brandName} | Mfr: ${r.manufacturer} | Form: ${r.dosageForm} | Img: ${r.image_path} (verified=${r.image_verified}) | RegCount: ${r.regCount} | Status: ${r.publicationStatus} (isPublished=${r.isPublished})`);
  });
  await pool.end();
})();
