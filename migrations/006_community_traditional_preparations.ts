import type { Migration, DbExecutor } from "../src/lib/migration-helpers";

export const migration: Migration = {
  id: "006_community_traditional_preparations",
  domain: "community",
  name: "Traditional botanical preparations, steps, precautions, and materials",
  up: async (conn) => {
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
        INDEX idx_tp_plant_id (plant_id),
        INDEX idx_tp_prep_type (preparation_type),
        INDEX idx_tp_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

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
        INDEX idx_pm_prep_id (preparation_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. preparation_steps
    await conn.query(`
      CREATE TABLE IF NOT EXISTS preparation_steps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        preparation_id VARCHAR(100) NOT NULL,
        step_number INT NOT NULL,
        instruction TEXT NOT NULL,
        INDEX idx_ps_prep_id_steps (preparation_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. preparation_precautions
    await conn.query(`
      CREATE TABLE IF NOT EXISTS preparation_precautions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        preparation_id VARCHAR(100) NOT NULL,
        precaution_text TEXT NOT NULL,
        sort_order INT DEFAULT 1,
        INDEX idx_pp_prep_id_prec (preparation_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. preparation_references
    await conn.query(`
      CREATE TABLE IF NOT EXISTS preparation_references (
        id INT AUTO_INCREMENT PRIMARY KEY,
        preparation_id VARCHAR(100) NOT NULL,
        citation TEXT NOT NULL,
        reference_url VARCHAR(500) DEFAULT NULL,
        INDEX idx_pr_prep_id_refs (preparation_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  },
};
export default migration;
