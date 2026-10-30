const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'natureaide_db',
  });

  const [cols] = await pool.query('DESCRIBE conversations');
  const existingFields = cols.map(c => c.Field);

  if (!existingFields.includes('currentPlantId')) {
    console.log('Adding currentPlantId to conversations...');
    await pool.query('ALTER TABLE conversations ADD COLUMN currentPlantId VARCHAR(191) NULL');
  }

  if (!existingFields.includes('currentProductId')) {
    console.log('Adding currentProductId to conversations...');
    await pool.query('ALTER TABLE conversations ADD COLUMN currentProductId VARCHAR(191) NULL');
  }

  if (!existingFields.includes('activeContextType')) {
    console.log('Adding activeContextType to conversations...');
    await pool.query("ALTER TABLE conversations ADD COLUMN activeContextType ENUM('NONE', 'PLANT', 'PRODUCT') NOT NULL DEFAULT 'NONE'");
  }

  console.log('conversations schema updated successfully:');
  const [updatedCols] = await pool.query('DESCRIBE conversations');
  console.log(updatedCols.map(c => `${c.Field} (${c.Type})`));

  await pool.end();
}

main().catch(console.error);
