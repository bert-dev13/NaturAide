const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'natureaide_db'
  });

  console.log('Connected to natureaide_db.');

  // 1. Check if is_community_visible exists on plant_guides
  const [cols] = await conn.query("SHOW COLUMNS FROM plant_guides LIKE 'is_community_visible'");
  if (cols.length === 0) {
    await conn.query("ALTER TABLE plant_guides ADD COLUMN is_community_visible TINYINT(1) NOT NULL DEFAULT 1 AFTER verifiedBy");
    console.log('Added is_community_visible to plant_guides');
  } else {
    console.log('is_community_visible already exists on plant_guides');
  }

  // 2. Create knowledge_visibility_history if not exists
  await conn.query(`
    CREATE TABLE IF NOT EXISTS knowledge_visibility_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      guideId INT NOT NULL,
      plantId VARCHAR(191) NOT NULL,
      previousVisibility TINYINT(1) NOT NULL,
      newVisibility TINYINT(1) NOT NULL,
      adminId INT NOT NULL,
      reason TEXT NOT NULL,
      changedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)
    )
  `);
  console.log('Verified knowledge_visibility_history table');

  // 3. Create knowledge_admin_activity_logs if not exists
  await conn.query(`
    CREATE TABLE IF NOT EXISTS knowledge_admin_activity_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      guideId INT NOT NULL,
      plantId VARCHAR(191) NOT NULL,
      adminId INT NOT NULL,
      actionType VARCHAR(100) NOT NULL,
      section VARCHAR(100),
      reason TEXT NOT NULL,
      versionTag VARCHAR(50),
      createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)
    )
  `);
  console.log('Verified knowledge_admin_activity_logs table');

  await conn.end();
  console.log('Migration complete.');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
