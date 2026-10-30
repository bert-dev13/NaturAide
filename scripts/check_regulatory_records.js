const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({ host: '127.0.0.1', user: 'root', database: 'natureaide_db', port: 3306 });
  const [rows] = await pool.query(`
    SELECT productId, COUNT(*) as count, GROUP_CONCAT(registrationNumber SEPARATOR ' | ') as regs
    FROM product_regulatory_records
    GROUP BY productId
    HAVING count > 1
    ORDER BY count DESC
  `);
  console.log(`Products with multiple regulatory records (${rows.length}):`);
  console.table(rows.slice(0, 15));

  // Also check if there are duplicate herbal_products with different IDs!
  const [products] = await pool.query('SELECT id, slug, name, brandName, manufacturer FROM herbal_products ORDER BY name ASC');
  console.log(`Total herbal_products: ${products.length}`);
  
  // Let's check for duplicate names or normalized names in herbal_products
  const nameMap = new Map();
  products.forEach(p => {
    const norm = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!nameMap.has(norm)) nameMap.set(norm, []);
    nameMap.get(norm).push(p);
  });
  const dupeNames = Array.from(nameMap.entries()).filter(([k, v]) => v.length > 1);
  console.log(`Duplicate product names in herbal_products (${dupeNames.length}):`);
  dupeNames.forEach(([k, v]) => {
    console.log(`- ${k}:`, v.map(x => `${x.id} (${x.name})`));
  });

  await pool.end();
})();
