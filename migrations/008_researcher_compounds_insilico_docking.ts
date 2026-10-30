import { Migration, DbExecutor } from "../src/lib/migration-helpers";

export const migration: Migration = {
  id: "008_researcher_compounds_insilico_docking",
  name: "Researcher Compounds, In-Silico Analysis and Molecular Docking Schema",
  domain: "researcher",
  up: async (conn: DbExecutor) => {
    // 1. research_compounds
    await conn.query(`
      CREATE TABLE IF NOT EXISTS research_compounds (
        id INT(11) NOT NULL AUTO_INCREMENT,
        projectId INT(11) NOT NULL,
        compoundName VARCHAR(191) NOT NULL,
        iupacName VARCHAR(255) NULL,
        smiles VARCHAR(500) NULL,
        molecularFormula VARCHAR(100) NULL,
        molecularWeight DECIMAL(10, 4) NULL,
        pubchemId VARCHAR(50) NULL,
        sourceNotes TEXT NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY idx_rc_project (projectId),
        CONSTRAINT fk_rc_project FOREIGN KEY (projectId) REFERENCES research_projects(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. insilico_results
    await conn.query(`
      CREATE TABLE IF NOT EXISTS insilico_results (
        id INT(11) NOT NULL AUTO_INCREMENT,
        projectId INT(11) NOT NULL,
        compoundId INT(11) NULL,
        compoundName VARCHAR(191) NOT NULL,
        targetSelection VARCHAR(191) NULL,
        predictionType VARCHAR(100) NOT NULL,
        dataSource ENUM('MANUAL_ENTRY', 'EXTERNAL_UPLOAD', 'SYSTEM_PENDING') NOT NULL DEFAULT 'MANUAL_ENTRY',
        engineStatus VARCHAR(100) NOT NULL DEFAULT 'Prediction Engine Not Connected',
        resultSummary TEXT NULL,
        detailedMetrics TEXT NULL,
        filePath VARCHAR(255) NULL,
        researcherNotes TEXT NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY idx_ir_project (projectId),
        KEY idx_ir_compound (compoundId),
        CONSTRAINT fk_ir_project FOREIGN KEY (projectId) REFERENCES research_projects(id) ON DELETE CASCADE,
        CONSTRAINT fk_ir_compound FOREIGN KEY (compoundId) REFERENCES research_compounds(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. docking_runs
    await conn.query(`
      CREATE TABLE IF NOT EXISTS docking_runs (
        id INT(11) NOT NULL AUTO_INCREMENT,
        projectId INT(11) NOT NULL,
        ligandName VARCHAR(191) NOT NULL,
        targetProtein VARCHAR(191) NOT NULL,
        pdbId VARCHAR(50) NULL,
        dockingConfig TEXT NULL,
        dataSource ENUM('MANUAL_ENTRY', 'UPLOADED_RESULT', 'NOT_YET_RUN') NOT NULL DEFAULT 'MANUAL_ENTRY',
        engineStatus VARCHAR(100) NOT NULL DEFAULT 'Docking Engine Not Connected',
        bindingAffinity VARCHAR(100) NULL,
        dockingPose VARCHAR(191) NULL,
        interactingResidues TEXT NULL,
        resultFilePath VARCHAR(255) NULL,
        researcherInterpretation TEXT NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY idx_dr_project (projectId),
        CONSTRAINT fk_dr_project FOREIGN KEY (projectId) REFERENCES research_projects(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. docking_setups
    await conn.query(`
      CREATE TABLE IF NOT EXISTS docking_setups (
        id INT(11) NOT NULL AUTO_INCREMENT,
        projectId INT(11) NOT NULL,
        softwareEngine VARCHAR(100) DEFAULT NULL,
        engineVersion VARCHAR(50) DEFAULT NULL,
        ligandPrepMethod TEXT DEFAULT NULL,
        proteinPrepMethod TEXT DEFAULT NULL,
        gridCenter VARCHAR(100) DEFAULT NULL,
        gridDimensions VARCHAR(100) DEFAULT NULL,
        dockingParameters TEXT DEFAULT NULL,
        referenceLigand VARCHAR(191) DEFAULT NULL,
        engineStatus VARCHAR(100) DEFAULT 'Docking Engine Not Connected',
        notes TEXT DEFAULT NULL,
        updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        gridConfigJson TEXT DEFAULT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uq_ds_project (projectId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. docking_targets
    await conn.query(`
      CREATE TABLE IF NOT EXISTS docking_targets (
        id INT(11) NOT NULL AUTO_INCREMENT,
        projectId INT(11) NOT NULL,
        targetName VARCHAR(191) NOT NULL,
        geneOrProtein VARCHAR(191) DEFAULT NULL,
        organism VARCHAR(191) DEFAULT NULL,
        pdbId VARCHAR(50) DEFAULT NULL,
        structureSource VARCHAR(255) DEFAULT NULL,
        selectionRationale TEXT DEFAULT NULL,
        referenceLiterature VARCHAR(255) DEFAULT NULL,
        status VARCHAR(50) DEFAULT 'TARGET_DOCUMENTED',
        createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        prepStatus VARCHAR(32) DEFAULT NULL,
        prepError TEXT DEFAULT NULL,
        prepMethod TEXT DEFAULT NULL,
        receptorPdbqtPath VARCHAR(500) DEFAULT NULL,
        cleanPdbPath VARCHAR(500) DEFAULT NULL,
        sourceUrl VARCHAR(500) DEFAULT NULL,
        structureMeta MEDIUMTEXT DEFAULT NULL,
        preparedAt DATETIME(3) DEFAULT NULL,
        detectedSites MEDIUMTEXT DEFAULT NULL,
        gridConfigJson TEXT DEFAULT NULL,
        PRIMARY KEY (id),
        KEY idx_dt_project (projectId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. docking_ligand_preps
    await conn.query(`
      CREATE TABLE IF NOT EXISTS docking_ligand_preps (
        id INT(11) NOT NULL AUTO_INCREMENT,
        projectId INT(11) NOT NULL,
        compoundId INT(11) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
        smiles TEXT DEFAULT NULL,
        pubchemCid VARCHAR(32) DEFAULT NULL,
        formula VARCHAR(64) DEFAULT NULL,
        structureSource VARCHAR(255) DEFAULT NULL,
        method TEXT DEFAULT NULL,
        pdbqtPath VARCHAR(500) DEFAULT NULL,
        heavyAtoms INT(11) DEFAULT NULL,
        torsions INT(11) DEFAULT NULL,
        molecularWeight DECIMAL(12, 3) DEFAULT NULL,
        errorMessage TEXT DEFAULT NULL,
        preparedAt DATETIME(3) DEFAULT NULL,
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY uq_dock_ligand (projectId, compoundId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 7. research_insilico_syntheses
    await conn.query(`
      CREATE TABLE IF NOT EXISTS research_insilico_syntheses (
        id INT(11) NOT NULL AUTO_INCREMENT,
        projectId INT(11) NOT NULL,
        keyFindings TEXT DEFAULT NULL,
        potentialLimitations TEXT DEFAULT NULL,
        selectionRationale TEXT DEFAULT NULL,
        compoundsForDocking TEXT DEFAULT NULL,
        engineLimitationNotes TEXT DEFAULT NULL,
        additionalNotes TEXT DEFAULT NULL,
        status VARCHAR(50) DEFAULT 'IN_PROGRESS',
        updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY uq_ris_project (projectId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 8. research_docking_syntheses
    await conn.query(`
      CREATE TABLE IF NOT EXISTS research_docking_syntheses (
        id INT(11) NOT NULL AUTO_INCREMENT,
        projectId INT(11) NOT NULL,
        keyFindings TEXT DEFAULT NULL,
        comparisonAcrossCompounds TEXT DEFAULT NULL,
        comparisonAcrossTargets TEXT DEFAULT NULL,
        importantInteractions TEXT DEFAULT NULL,
        limitations TEXT DEFAULT NULL,
        relationshipToQuestion TEXT DEFAULT NULL,
        engineLimitationNotes TEXT DEFAULT NULL,
        additionalNotes TEXT DEFAULT NULL,
        status VARCHAR(50) DEFAULT 'IN_PROGRESS',
        updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY uq_rds_project (projectId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }
};
