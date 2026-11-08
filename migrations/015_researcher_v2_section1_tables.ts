import { Migration, DbExecutor, addColumnIfNotExists } from "../src/lib/migration-helpers";

/**
 * V2 Section 1 tables used by Formulation R&D Steps 2/4/6 and Section 3 manuscript.
 * Previously only created lazily via ensureV2ResearchSchema() on materials routes,
 * so fresh setups that never hit those routes failed with:
 *   Table 'natureaide_db.research_product_selections' doesn't exist
 */
export const migration: Migration = {
  id: "015_researcher_v2_section1_tables",
  name: "Researcher V2 product selections, materials, batch analyses, manuscripts",
  domain: "researcher",
  up: async (conn: DbExecutor) => {
    await conn.query(`
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

    await conn.query(`
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

    await addColumnIfNotExists(conn, "research_materials", "unit", "VARCHAR(50) NULL");
    await addColumnIfNotExists(
      conn,
      "research_materials",
      "inventoryStatus",
      "VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE'"
    );
    await addColumnIfNotExists(
      conn,
      "research_materials",
      "source",
      "VARCHAR(100) NOT NULL DEFAULT 'MANUAL'"
    );
    await addColumnIfNotExists(
      conn,
      "research_materials",
      "extractFractionId",
      "VARCHAR(100) NULL"
    );
    await addColumnIfNotExists(
      conn,
      "research_materials",
      "scientificJustification",
      "TEXT NULL"
    );
    await addColumnIfNotExists(conn, "research_materials", "compatibilityNotes", "TEXT NULL");

    await conn.query(`
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

    await conn.query(`
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
  },
};
