import type { Migration, DbExecutor } from "../src/lib/migration-helpers";

/**
 * Ensures the shared plant phytochemical catalog table exists on every laptop.
 * Seed data is applied at runtime by loadVerifiedPhytochemicals / syncPhytochemicalCatalog
 * so migrate-only setups still get constituents when a researcher opens a project.
 */
export const migration: Migration = {
  id: "016_plant_compounds_catalog",
  domain: "shared",
  name: "Plant phytochemical constituents catalog table",
  up: async (conn: DbExecutor) => {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS plant_compounds (
        id INT AUTO_INCREMENT PRIMARY KEY,
        plantId VARCHAR(191) NULL,
        plantScientificName VARCHAR(191) NOT NULL,
        plantCommonName VARCHAR(191) NOT NULL,
        compoundName VARCHAR(191) NOT NULL,
        iupacName VARCHAR(255) NULL,
        molecularFormula VARCHAR(100) NULL,
        molecularWeight DECIMAL(10, 4) NULL,
        compoundClass VARCHAR(100) NULL,
        pubchemId VARCHAR(50) NULL,
        smiles VARCHAR(500) NULL,
        plantPartReported VARCHAR(150) NULL,
        referencesData JSON NULL,
        verificationStatus VARCHAR(50) DEFAULT 'VERIFIED_DATABASE',
        submittedByResearcherId INT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_plant_sci (plantScientificName),
        INDEX idx_plant_id (plantId),
        INDEX idx_compound_name (compoundName)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  },
};
