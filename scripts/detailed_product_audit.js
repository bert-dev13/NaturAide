const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({ host: '127.0.0.1', user: 'root', database: 'natureaide_db', port: 3306 });
  
  const [products] = await pool.query('SELECT * FROM herbal_products ORDER BY id ASC');
  const [regs] = await pool.query('SELECT * FROM product_regulatory_records ORDER BY productId ASC, id ASC');
  
  console.log(`Total products: ${products.length}`);
  console.log(`Total regulatory records: ${regs.length}`);

  const regByProduct = new Map();
  regs.forEach(r => {
    if (!regByProduct.has(r.productId)) regByProduct.set(r.productId, []);
    regByProduct.get(r.productId).push(r);
  });

  products.forEach((p, idx) => {
    const pRegs = regByProduct.get(p.id) || [];
    console.log(`\n--- [${idx + 1}] ID: ${p.id} ---`);
    console.log(`  Name: ${p.name}`);
    console.log(`  Brand: ${p.brandName} | Mfr: ${p.manufacturer}`);
    console.log(`  Classification: ${p.productClassification || p.productType} | Form: ${p.dosageForm} | Strength: ${p.dosageStrength || 'N/A'}`);
    console.log(`  Image: ${p.image_path} (verified: ${p.image_verified}, src: ${p.image_source})`);
    console.log(`  PubStatus: ${p.publicationStatus} (isPublished: ${p.isPublished})`);
    console.log(`  Regulatory Records (${pRegs.length}):`);
    pRegs.forEach(r => {
      console.log(`    - ID: ${r.id} | Agency: ${r.regulatoryAgency} | CPR: ${r.registrationNumber} | Status: ${r.registrationStatus} | Class: ${r.classification} | Issuance: ${r.issuanceDate} | Expiry: ${r.expiryDate}`);
    });
  });

  await pool.end();
})();
