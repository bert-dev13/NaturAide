const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({ host: '127.0.0.1', user: 'root', database: 'natureaide_db', port: 3306 });
  const [rows] = await pool.query("SELECT * FROM herbal_products WHERE id LIKE '%docteur%'");
  console.log(rows);
  const [plants] = await pool.query("SELECT * FROM product_plants WHERE productId LIKE '%docteur%'");
  console.log('product_plants:', plants);
  const [ingredients] = await pool.query("SELECT * FROM product_ingredients WHERE productId LIKE '%docteur%'");
  console.log('product_ingredients:', ingredients);
  await pool.end();
})();
