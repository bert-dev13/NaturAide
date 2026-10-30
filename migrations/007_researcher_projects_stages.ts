import type { Migration, DbExecutor } from "../src/lib/migration-helpers";

export const migration: Migration = {
  id: "007_researcher_projects_stages",
  domain: "researcher",
  name: "Research projects, 6-stage workflow pipeline, and botanical literature",
  up: async (conn) => {
    // 1. research_projects
    await conn.query(`
      CREATE TABLE IF NOT EXISTS research_projects (
        id INT(11) NOT NULL AUTO_INCREMENT,
        researcherId INT(11) NOT NULL,
        plantId VARCHAR(191) NULL,
        plantCustomName VARCHAR(191) NULL,
        title VARCHAR(255) NOT NULL,
        shortDescription TEXT NULL,
        researchObjective TEXT NULL,
        researchQuestion TEXT NULL,
        areaOfInterest VARCHAR(191) NULL,
        expectedOutcome TEXT NULL,
        status ENUM('DRAFT', 'IN_PROGRESS', 'READY_FOR_REVIEW', 'UNDER_REVIEW', 'REVISION_REQUIRED', 'APPROVED_FOR_LAB', 'LAB_VALIDATION', 'COMPLETED', 'ARCHIVED') NOT NULL DEFAULT 'IN_PROGRESS',
        currentStage VARCHAR(50) NOT NULL DEFAULT 'plant-literature',
        progressPercent INT(11) NOT NULL DEFAULT 15,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY idx_rp_researcher (researcherId),
        KEY idx_rp_plant (plantId),
        KEY idx_rp_status (status),
        CONSTRAINT fk_rp_researcher FOREIGN KEY (researcherId) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_rp_plant FOREIGN KEY (plantId) REFERENCES plants(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. research_project_stages
    await conn.query(`
      CREATE TABLE IF NOT EXISTS research_project_stages (
        id INT(11) NOT NULL AUTO_INCREMENT,
        projectId INT(11) NOT NULL,
        stageKey VARCHAR(50) NOT NULL,
        status ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'REQUIRES_REVISION', 'UNDER_REVIEW') NOT NULL DEFAULT 'NOT_STARTED',
        completedAt DATETIME(3) NULL,
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY uq_project_stage (projectId, stageKey),
        CONSTRAINT fk_rps_project FOREIGN KEY (projectId) REFERENCES research_projects(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. research_plant_data
    await conn.query(`
      CREATE TABLE IF NOT EXISTS research_plant_data (
        id INT(11) NOT NULL AUTO_INCREMENT,
        projectId INT(11) NOT NULL,
        commonName VARCHAR(191) NOT NULL,
        scientificName VARCHAR(191) NOT NULL,
        plantFamily VARCHAR(191) NULL,
        traditionalUses TEXT NULL,
        plantPart VARCHAR(191) NULL,
        habitatDistribution TEXT NULL,
        activeConstituents TEXT NULL,
        conservationStatus VARCHAR(100) NULL,
        authenticationMethod TEXT NULL,
        voucherSpecimen VARCHAR(191) NULL,
        notes TEXT NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY uq_rpd_project (projectId),
        CONSTRAINT fk_rpd_project FOREIGN KEY (projectId) REFERENCES research_projects(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. research_evidence_reviews
    await conn.query(`
      CREATE TABLE IF NOT EXISTS research_evidence_reviews (
        id INT(11) NOT NULL AUTO_INCREMENT,
        projectId INT(11) NOT NULL,
        background TEXT NULL,
        traditionalKnowledge TEXT NULL,
        existingEvidence TEXT NULL,
        knownGaps TEXT NULL,
        initialQuestion TEXT NULL,
        objectives TEXT NULL,
        supportingReferences TEXT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS',
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY uq_rer_project (projectId),
        CONSTRAINT fk_rer_project FOREIGN KEY (projectId) REFERENCES research_projects(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. literature_references
    await conn.query(`
      CREATE TABLE IF NOT EXISTS literature_references (
        id INT(11) NOT NULL AUTO_INCREMENT,
        projectId INT(11) NOT NULL,
        pmid VARCHAR(50) NULL,
        doi VARCHAR(255) NULL,
        title VARCHAR(500) NOT NULL,
        authors TEXT NULL,
        journal VARCHAR(255) NULL,
        year INT(11) NULL,
        volume VARCHAR(50) NULL,
        pages VARCHAR(50) NULL,
        abstract MEDIUMTEXT NULL,
        relevance TEXT NULL,
        studyType VARCHAR(100) NULL,
        keyFindings TEXT NULL,
        stageContext VARCHAR(50) DEFAULT 'plant-literature',
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY idx_lit_project (projectId),
        KEY idx_lit_pmid (pmid),
        CONSTRAINT fk_lit_project FOREIGN KEY (projectId) REFERENCES research_projects(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. research_activity_logs
    await conn.query(`
      CREATE TABLE IF NOT EXISTS research_activity_logs (
        id INT(11) NOT NULL AUTO_INCREMENT,
        projectId INT(11) NOT NULL,
        researcherId INT(11) NOT NULL,
        actionType VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY idx_ral_project (projectId),
        CONSTRAINT fk_ral_project FOREIGN KEY (projectId) REFERENCES research_projects(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  },
};
export default migration;
