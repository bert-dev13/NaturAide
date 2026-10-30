const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({ host: '127.0.0.1', user: 'root', database: 'natureaide_db', port: 3306 });
  const [rows] = await pool.query(`
    SELECT hp.id, hp.name, hp.brandName, hp.manufacturer, hp.productClassification, hp.dosageForm, hp.dosageStrength,
           prr.registrationNumber, prr.regulatoryAgency, prr.registrationStatus, prr.verificationSource, prr.verificationUrl,
           prr.issuanceDate, prr.expiryDate, hp.publicationStatus, hp.isPublished
    FROM herbal_products hp
    LEFT JOIN (SELECT * FROM product_regulatory_records GROUP BY productId) prr ON prr.productId = hp.id
    ORDER BY hp.name ASC
  `);
  console.log(`Total unique herbal_products: ${rows.length}`);
  rows.forEach((r, i) => {
    console.log(`[${i+1}] ${r.id}`);
    console.log(`    Name: ${r.name}`);
    console.log(`    Brand: ${r.brandName} | Mfr: ${r.manufacturer}`);
    console.log(`    CPR: ${r.registrationNumber} | Agency: ${r.regulatoryAgency} | Status: ${r.registrationStatus}`);
    console.log(`    PubStatus: ${r.publicationStatus} (isPublished: ${r.isPublished})`);
  });
  await pool.end();
})();
