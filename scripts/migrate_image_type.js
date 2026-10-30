const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'natureaide_db'
  });

  const [cols] = await conn.query("SHOW COLUMNS FROM herbal_products LIKE 'image_type'");
  if (cols.length === 0) {
    console.log('Adding image_type column to herbal_products...');
    await conn.query(
      "ALTER TABLE herbal_products ADD COLUMN image_type VARCHAR(50) DEFAULT 'AUTHENTIC_PRODUCT' AFTER image_path"
    );
    console.log('Column image_type added.');
  } else {
    console.log('Column image_type already exists.');
  }

  // Set image_type for the 18 verified authentic products
  const [resAuth] = await conn.query(
    "UPDATE herbal_products SET image_type = 'AUTHENTIC_PRODUCT' WHERE image_verified = 1"
  );
  console.log('Updated authentic products to AUTHENTIC_PRODUCT:', resAuth.affectedRows);

  await conn.end();
}

migrate().catch(console.error);
