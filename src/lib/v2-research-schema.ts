import pool from "@/lib/db";

export async function ensureV2ResearchSchema() {
  const connection = await pool.getConnection();
  try {
    // 1. research_product_selections (Step 2 of Section 1)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS research_product_selections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        projectId INT NOT NULL UNIQUE,
        productType VARCHAR(100) NOT NULL DEFAULT 'Herbal Topical Formulation',
        deliveryFormat VARCHAR(100) NOT NULL DEFAULT 'Topical Gel',
        targetIndications TEXT,
        intendedPopulation VARCHAR(255) DEFAULT 'Adult general population',
        packagingType VARCHAR(100) DEFAULT 'Amber glass jar / pump dispenser',
        rationale TEXT,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        INDEX idx_rps_project (projectId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. research_materials (Step 4 of Section 1)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS research_materials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        projectId INT NOT NULL,
        materialType VARCHAR(50) NOT NULL DEFAULT 'ACTIVE_BOTANICAL',
        materialName VARCHAR(255) NOT NULL,
        gradeOrPurity VARCHAR(100),
        supplierOrSource VARCHAR(255),
        lotOrBatchNumber VARCHAR(100),
        storageConditions VARCHAR(255),
        functionDescription TEXT,
        quantityAvailable VARCHAR(100),
        unit VARCHAR(50) NULL,
        inventoryStatus VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
        source VARCHAR(100) NOT NULL DEFAULT 'MANUAL',
        extractFractionId VARCHAR(100) NULL,
        scientificJustification TEXT NULL,
        compatibilityNotes TEXT NULL,
        certificatesUrl VARCHAR(500),
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        INDEX idx_rm_project (projectId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Safely add missing columns to research_materials if table existed from earlier migration
    const materialCols = [
      { name: "unit", sql: "ALTER TABLE research_materials ADD COLUMN unit VARCHAR(50) NULL" },
      { name: "inventoryStatus", sql: "ALTER TABLE research_materials ADD COLUMN inventoryStatus VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE'" },
      { name: "source", sql: "ALTER TABLE research_materials ADD COLUMN source VARCHAR(100) NOT NULL DEFAULT 'MANUAL'" },
      { name: "extractFractionId", sql: "ALTER TABLE research_materials ADD COLUMN extractFractionId VARCHAR(100) NULL" },
      { name: "scientificJustification", sql: "ALTER TABLE research_materials ADD COLUMN scientificJustification TEXT NULL" },
      { name: "compatibilityNotes", sql: "ALTER TABLE research_materials ADD COLUMN compatibilityNotes TEXT NULL" },
    ];

    for (const col of materialCols) {
      try {
        await connection.query(col.sql);
      } catch (err: any) {
        // Ignore ER_DUP_FIELDNAME if column already exists
        if (err.code !== "ER_DUP_FIELDNAME" && !err.message?.includes("Duplicate column name")) {
          console.warn(`Note on research_materials ${col.name}:`, err.message);
        }
      }
    }

    // 3. research_batch_analyses (Step 6 of Section 1)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS research_batch_analyses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        projectId INT NOT NULL,
        formulationId INT NULL,
        batchNumber VARCHAR(100) NOT NULL,
        testDate DATE,
        appearance VARCHAR(255),
        pH DECIMAL(4,2),
        viscosity VARCHAR(100),
        density VARCHAR(100),
        stabilityCentrifuge VARCHAR(100),
        microbialLimitStatus VARCHAR(100) DEFAULT 'Compliant',
        assayMethod VARCHAR(255),
        assayResults TEXT,
        status VARCHAR(50) DEFAULT 'Passed',
        notes TEXT,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        INDEX idx_rba_project (projectId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. research_manuscripts (Step 3 of Section 3)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS research_manuscripts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        projectId INT NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        abstract TEXT,
        introduction LONGTEXT,
        materialsMethods LONGTEXT,
        resultsDiscussion LONGTEXT,
        conclusion LONGTEXT,
        referencesText LONGTEXT,
        fileUrl VARCHAR(500),
        status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
        versionNumber INT NOT NULL DEFAULT 1,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        INDEX idx_rm_manuscript_project (projectId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. Expand research_projects status enum or allow V2 statuses if needed
    // Check current status column
    try {
      await connection.query(`
        ALTER TABLE research_projects
        MODIFY COLUMN status VARCHAR(60) NOT NULL DEFAULT 'Draft'
      `);
    } catch {
      // Column might already be varchar or modified
    }

    return { success: true };
  } finally {
    connection.release();
  }
}

