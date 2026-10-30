const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({ host: '127.0.0.1', user: 'root', database: 'natureaide_db', port: 3306 });
  const [rows] = await pool.query('SELECT COUNT(*) as rawCount FROM herbal_products');
  console.log('Raw count in herbal_products table:', rows[0].rawCount);

  const [regCount] = await pool.query('SELECT COUNT(*) as rawCount FROM product_regulatory_records');
  console.log('Raw count in product_regulatory_records table:', regCount[0].rawCount);

  // Check how many products are displayed on Commercial Products page
  // Let's see what query the Commercial Products page runs!
  await pool.end();
})();
