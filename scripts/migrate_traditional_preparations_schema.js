const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'natureaide_db'
  });

  console.log('=== CREATING TRADITIONAL PREPARATIONS MODULE TABLES ===');

  // 1. traditional_preparations
  await conn.query(`
    CREATE TABLE IF NOT EXISTS traditional_preparations (
      id VARCHAR(100) PRIMARY KEY,
      plant_id VARCHAR(100) NOT NULL,
      title VARCHAR(255) NOT NULL,
      preparation_type VARCHAR(50) NOT NULL,
      plant_part_used VARCHAR(255) NOT NULL,
      traditional_use_context TEXT NOT NULL,
      description TEXT,
      administration_instructions TEXT,
      when_to_seek_guidance TEXT,
      source_verified TINYINT(1) DEFAULT 1,
      status VARCHAR(50) DEFAULT 'PUBLISHED',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_plant_id (plant_id),
      INDEX idx_prep_type (preparation_type),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('+ Created/Verified table: traditional_preparations');

  // 2. preparation_materials
  await conn.query(`
    CREATE TABLE IF NOT EXISTS preparation_materials (
      id INT AUTO_INCREMENT PRIMARY KEY,
      preparation_id VARCHAR(100) NOT NULL,
      material_name VARCHAR(255) NOT NULL,
      amount VARCHAR(100) DEFAULT NULL,
      unit VARCHAR(50) DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      sort_order INT DEFAULT 1,
      INDEX idx_prep_id (preparation_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('+ Created/Verified table: preparation_materials');

  // 3. preparation_steps
  await conn.query(`
    CREATE TABLE IF NOT EXISTS preparation_steps (
      id INT AUTO_INCREMENT PRIMARY KEY,
      preparation_id VARCHAR(100) NOT NULL,
      step_number INT NOT NULL,
      instruction TEXT NOT NULL,
      INDEX idx_prep_id_steps (preparation_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('+ Created/Verified table: preparation_steps');

  // 4. preparation_precautions
  await conn.query(`
    CREATE TABLE IF NOT EXISTS preparation_precautions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      preparation_id VARCHAR(100) NOT NULL,
      precaution TEXT NOT NULL,
      source_reference_id VARCHAR(100) DEFAULT NULL,
      INDEX idx_prep_id_precautions (preparation_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('+ Created/Verified table: preparation_precautions');

  // 5. preparation_references
  await conn.query(`
    CREATE TABLE IF NOT EXISTS preparation_references (
      id INT AUTO_INCREMENT PRIMARY KEY,
      preparation_id VARCHAR(100) NOT NULL,
      scientific_reference_id VARCHAR(100) DEFAULT NULL,
      source_type VARCHAR(50) NOT NULL,
      source_title VARCHAR(255) NOT NULL,
      organization_or_authors VARCHAR(255) NOT NULL,
      publication_year INT DEFAULT NULL,
      doi_or_pmid VARCHAR(100) DEFAULT NULL,
      source_url VARCHAR(500) DEFAULT NULL,
      verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_prep_id_refs (preparation_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('+ Created/Verified table: preparation_references');

  await conn.end();
}

migrate().catch(console.error);
