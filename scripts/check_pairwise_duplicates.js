const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({ host: '127.0.0.1', user: 'root', database: 'natureaide_db', port: 3306 });
  
  const [products] = await pool.query(`
    SELECT hp.id, hp.name, hp.brandName, hp.manufacturer, hp.dosageForm, hp.dosageStrength,
           prr.registrationNumber
    FROM herbal_products hp
    LEFT JOIN (SELECT productId, registrationNumber FROM product_regulatory_records GROUP BY productId) prr ON prr.productId = hp.id
  `);

  console.log('Comparing all pairs among', products.length, 'products:');
  for (let i = 0; i < products.length; i++) {
    for (let j = i + 1; j < products.length; j++) {
      const a = products[i];
      const b = products[j];
      
      const sameBrand = a.brandName.toLowerCase().trim() === b.brandName.toLowerCase().trim();
      const sameReg = a.registrationNumber && b.registrationNumber && a.registrationNumber.trim() === b.registrationNumber.trim();
      const sameMfr = a.manufacturer.toLowerCase().trim() === b.manufacturer.toLowerCase().trim();

      if (sameReg) {
        console.log(`[SAME REGISTRATION NUMBER] ${a.id} vs ${b.id}: CPR ${a.registrationNumber}`);
      } else if (sameBrand && sameMfr && a.dosageForm === b.dosageForm && a.dosageStrength === b.dosageStrength) {
        console.log(`[SAME BRAND + MFR + FORM + STRENGTH] ${a.id} vs ${b.id}`);
      }
    }
  }

  await pool.end();
})();
