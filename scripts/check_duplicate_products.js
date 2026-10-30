const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({ host: '127.0.0.1', user: 'root', database: 'natureaide_db', port: 3306 });
  
  const [products] = await pool.query(`
    SELECT hp.id, hp.name, hp.brandName, hp.manufacturer, hp.dosageForm, hp.dosageStrength,
           prr.registrationNumber, prr.classification, prr.registrationStatus
    FROM herbal_products hp
    LEFT JOIN product_regulatory_records prr ON prr.productId = hp.id
    ORDER BY hp.name ASC
  `);

  // Group by CPR
  const cprMap = new Map();
  products.forEach(p => {
    if (!p.registrationNumber) return;
    const cpr = p.registrationNumber.trim().toUpperCase();
    if (!cprMap.has(cpr)) cprMap.set(cpr, new Set());
    cprMap.get(cpr).add(p.id);
  });

  console.log('--- Checking CPR duplicates across different products ---');
  let duplicateCprFound = false;
  for (const [cpr, prodIds] of cprMap.entries()) {
    if (prodIds.size > 1) {
      duplicateCprFound = true;
      console.log(`Duplicate CPR [${cpr}] used by products:`, Array.from(prodIds));
    }
  }
  if (!duplicateCprFound) {
    console.log('No different products share the same CPR.');
  }

  // Check normalized name + brand + mfr
  const keyMap = new Map();
  const [uniqueHp] = await pool.query('SELECT * FROM herbal_products');
  uniqueHp.forEach(p => {
    const key = `${p.brandName.toLowerCase().trim()} | ${p.name.toLowerCase().trim()} | ${p.manufacturer.toLowerCase().trim()}`;
    if (!keyMap.has(key)) keyMap.set(key, []);
    keyMap.get(key).push(p.id);
  });
  let dupeKeysFound = false;
  for (const [k, pids] of keyMap.entries()) {
    if (pids.length > 1) {
      dupeKeysFound = true;
      console.log(`Duplicate product key [${k}]:`, pids);
    }
  }
  if (!dupeKeysFound) {
    console.log('No duplicate product keys in herbal_products table itself.');
  }

  await pool.end();
})();
