const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({ host: '127.0.0.1', user: 'root', database: 'natureaide_db', port: 3306 });
  const [rows] = await pool.query(`
    SELECT hp.id, hp.name, hp.brandName, hp.manufacturer, hp.productClassification, hp.dosageForm, hp.dosageStrength,
           prr.registrationNumber, prr.registrationStatus, hp.isPublished, hp.image_path, hp.image_verified
    FROM herbal_products hp
    LEFT JOIN product_regulatory_records prr ON prr.productId = hp.id
    GROUP BY hp.id
    ORDER BY hp.brandName ASC, hp.name ASC
  `);
  console.table(rows.slice(0, 25));
  console.table(rows.slice(25, 44));
  await pool.end();
})();
