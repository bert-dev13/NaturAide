import type { Migration, DbExecutor } from "../src/lib/migration-helpers";

export const migration: Migration = {
  id: "003_shared_knowledge_visibility",
  domain: "shared",
  name: "Knowledge base visibility, administration audit, and integration proposals",
  up: async (conn) => {
    // 1. knowledge_visibility_history
    await conn.query(`
      CREATE TABLE IF NOT EXISTS knowledge_visibility_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        guideId INT NOT NULL,
        plantId VARCHAR(191) NOT NULL,
        previousVisibility TINYINT(1) NOT NULL,
        newVisibility TINYINT(1) NOT NULL,
        adminId INT NOT NULL,
        reason TEXT NOT NULL,
        changedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        INDEX idx_kvh_guide (guideId),
        INDEX idx_kvh_plant (plantId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. knowledge_admin_activity_logs
    await conn.query(`
      CREATE TABLE IF NOT EXISTS knowledge_admin_activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        guideId INT NOT NULL,
        plantId VARCHAR(191) NOT NULL,
        adminId INT NOT NULL,
        actionType VARCHAR(100) NOT NULL,
        section VARCHAR(100) NULL,
        reason TEXT NOT NULL,
        versionTag VARCHAR(50) NULL,
        createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        INDEX idx_kaal_guide (guideId),
        INDEX idx_kaal_plant (plantId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. knowledge_integration_proposals
    await conn.query(`
      CREATE TABLE IF NOT EXISTS knowledge_integration_proposals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        projectId INT NOT NULL,
        researcherId INT NOT NULL,
        plantId VARCHAR(191) NULL,
        proposalCode VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        knowledgeArea ENUM(
          'MEDICINAL_PLANT_INFORMATION', 'SCIENTIFIC_EVIDENCE', 'SAFETY_PRECAUTIONS',
          'RESEARCH_SUMMARY', 'REFERENCES', 'TRADITIONAL_PREPARATION', 'OTHER'
        ) NOT NULL,
        changeType ENUM('ADD', 'UPDATE', 'CORRECT', 'SUPPLEMENT') NOT NULL,
        currentVersionNumber INT DEFAULT 1,
        status ENUM('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'INTEGRATED') DEFAULT 'DRAFT',
        sourceFindingId INT NULL,
        sourceFindingTitle VARCHAR(255) NULL,
        createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        INDEX idx_kip_project (projectId),
        INDEX idx_kip_researcher (researcherId),
        INDEX idx_kip_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. knowledge_integration_versions
    await conn.query(`
      CREATE TABLE IF NOT EXISTS knowledge_integration_versions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        proposalId INT NOT NULL,
        versionNumber INT NOT NULL DEFAULT 1,
        currentKnowledgeSnapshot TEXT NULL,
        proposedContent TEXT NOT NULL,
        reasonForChange TEXT NOT NULL,
        supportingFindingSummary TEXT NULL,
        dossierVersionTag VARCHAR(50) DEFAULT 'v1.0',
        laboratoryEvidenceSummary TEXT NULL,
        professionalReviewOutcome TEXT NULL,
        supportingReferences TEXT NULL,
        isLocked TINYINT(1) DEFAULT 0,
        submittedAt DATETIME(3) NULL,
        createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        UNIQUE KEY uq_prop_version (proposalId, versionNumber),
        INDEX idx_kiv_proposal (proposalId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. knowledge_integration_evidence_links
    await conn.query(`
      CREATE TABLE IF NOT EXISTS knowledge_integration_evidence_links (
        id INT AUTO_INCREMENT PRIMARY KEY,
        proposalId INT NOT NULL,
        evidenceType ENUM('LITERATURE', 'COMPUTATIONAL', 'DOCKING', 'FORMULATION', 'SAFETY', 'LABORATORY', 'REVIEW_DECISION', 'OTHER') NOT NULL,
        sourceTable VARCHAR(100) NOT NULL,
        sourceRecordId INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        summary TEXT NULL,
        referenceUrl VARCHAR(500) NULL,
        citationText TEXT NULL,
        relevanceNote TEXT NULL,
        sortOrder INT DEFAULT 1,
        createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        INDEX idx_kiel_proposal (proposalId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. knowledge_integration_comments
    await conn.query(`
      CREATE TABLE IF NOT EXISTS knowledge_integration_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        proposalId INT NOT NULL,
        versionId INT NULL,
        authorId INT NOT NULL,
        authorRole VARCHAR(50) NOT NULL,
        commentText TEXT NOT NULL,
        createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        INDEX idx_kic_proposal (proposalId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 7. knowledge_integration_decisions
    await conn.query(`
      CREATE TABLE IF NOT EXISTS knowledge_integration_decisions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        proposalId INT NOT NULL,
        versionId INT NOT NULL,
        decisionMakerId INT NOT NULL,
        decision ENUM('APPROVED', 'REJECTED', 'CHANGES_REQUESTED') NOT NULL,
        decisionSummary TEXT NOT NULL,
        decidedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        INDEX idx_kid_proposal (proposalId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 8. knowledge_integration_activity_logs
    await conn.query(`
      CREATE TABLE IF NOT EXISTS knowledge_integration_activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        proposalId INT NOT NULL,
        performedBy INT NOT NULL,
        actionType VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        INDEX idx_kial_proposal (proposalId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  },
};
export default migration;
