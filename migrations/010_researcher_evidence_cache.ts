import { Migration, DbExecutor } from "../src/lib/migration-helpers";

export const migration: Migration = {
  id: "010_researcher_evidence_cache",
  name: "Researcher Literature Cache and Evidence Architecture Schema",
  domain: "researcher",
  up: async (conn: DbExecutor) => {
    // 1. literature_cache
    await conn.query(`
      CREATE TABLE IF NOT EXISTS literature_cache (
        id INT AUTO_INCREMENT PRIMARY KEY,
        normalized_query VARCHAR(500) NOT NULL,
        raw_query VARCHAR(500) NOT NULL,
        stage_context VARCHAR(50) NULL,
        results_count INT NOT NULL DEFAULT 0,
        pubmed_results LONGTEXT NOT NULL,
        retrieval_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        UNIQUE KEY uq_norm_query (normalized_query)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. project_evidence_items
    await conn.query(`
      CREATE TABLE IF NOT EXISTS project_evidence_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        projectId INT NOT NULL,
        evidenceClass ENUM('REFERENCE', 'LITERATURE', 'PREDICTED', 'EXPERIMENTAL', 'INTERPRETATION') NOT NULL,
        stageKey VARCHAR(50) NOT NULL,
        title VARCHAR(500) NOT NULL,
        summary TEXT NULL,
        authors VARCHAR(500) NULL,
        publicationYear INT NULL,
        journalOrSource VARCHAR(255) NULL,
        pmid VARCHAR(50) NULL,
        doi VARCHAR(255) NULL,
        sourceUrl VARCHAR(500) NULL,
        abstract MEDIUMTEXT NULL,
        relevanceScore DECIMAL(5,2) NULL,
        relevanceExplanation TEXT NULL,
        retrievalQuery VARCHAR(500) NULL,
        targetCompound VARCHAR(191) NULL,
        targetBiological VARCHAR(191) NULL,
        assayOrEndpoint VARCHAR(191) NULL,
        numericalValue VARCHAR(100) NULL,
        unit VARCHAR(50) NULL,
        associatedResultId INT NULL,
        associatedResultType VARCHAR(50) NULL,
        isVerified TINYINT(1) NOT NULL DEFAULT 1,
        verificationSource VARCHAR(255) NOT NULL DEFAULT 'NatureAide Evidence Engine',
        metadataJson JSON NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        INDEX idx_pei_proj (projectId),
        INDEX idx_pei_class (evidenceClass),
        INDEX idx_pei_stage (stageKey),
        INDEX idx_pei_assoc (associatedResultType, associatedResultId),
        INDEX idx_pei_compound (targetCompound),
        INDEX idx_pei_target (targetBiological)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. research_evidence_traceability
    await conn.query(`
      CREATE TABLE IF NOT EXISTS research_evidence_traceability (
        id INT AUTO_INCREMENT PRIMARY KEY,
        completionId INT NOT NULL,
        projectId INT NOT NULL,
        findingId INT NULL,
        findingTitle VARCHAR(255) NOT NULL,
        evidenceType ENUM(
          'LITERATURE_REFERENCE', 'COMPUTATIONAL_RESULT', 'DOCKING_RESULT',
          'FORMULATION_VERSION', 'SAFETY_ASSESSMENT', 'PROFESSIONAL_REVIEW', 'LABORATORY_RESULT'
        ) NOT NULL,
        evidenceReference TEXT NOT NULL,
        notes TEXT NULL,
        createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        INDEX idx_ret_completion (completionId),
        INDEX idx_ret_project (projectId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. research_studies
    await conn.query(`
      CREATE TABLE IF NOT EXISTS research_studies (
        id INT(11) NOT NULL AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        abstract TEXT DEFAULT NULL,
        authors VARCHAR(255) DEFAULT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'REVIEWED',
        plantId VARCHAR(191) DEFAULT NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY idx_rs_plant (plantId),
        CONSTRAINT fk_rs_plant FOREIGN KEY (plantId) REFERENCES plants(id) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. research_literature_syntheses
    await conn.query(`
      CREATE TABLE IF NOT EXISTS research_literature_syntheses (
        id INT(11) NOT NULL AUTO_INCREMENT,
        projectId INT(11) NOT NULL,
        keyFindings TEXT DEFAULT NULL,
        areasOfAgreement TEXT DEFAULT NULL,
        conflictingFindings TEXT DEFAULT NULL,
        evidenceLimitations TEXT DEFAULT NULL,
        remainingGaps TEXT DEFAULT NULL,
        relevanceToQuestion TEXT DEFAULT NULL,
        status VARCHAR(50) DEFAULT 'IN_PROGRESS',
        updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY uq_rls_project (projectId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }
};
