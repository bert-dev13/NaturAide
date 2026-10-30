const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'natureaide_db',
    port: 3306,
  });

  console.log('Running migration for Knowledge Integration tables...');

  // 1. knowledge_integration_proposals
  await pool.query(`
    CREATE TABLE IF NOT EXISTS knowledge_integration_proposals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      projectId INT NOT NULL,
      researcherId INT NOT NULL,
      plantId INT NULL,
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
      INDEX idx_kip_status (status),
      INDEX idx_kip_plant (plantId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ Created knowledge_integration_proposals');

  // 2. knowledge_integration_versions
  await pool.query(`
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
      UNIQUE KEY uk_prop_version (proposalId, versionNumber),
      INDEX idx_kiv_proposal (proposalId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ Created knowledge_integration_versions');

  // 3. knowledge_integration_evidence_links
  await pool.query(`
    CREATE TABLE IF NOT EXISTS knowledge_integration_evidence_links (
      id INT AUTO_INCREMENT PRIMARY KEY,
      proposalId INT NOT NULL,
      versionId INT NOT NULL,
      evidenceType ENUM(
        'LITERATURE_REFERENCE', 'COMPUTATIONAL_RESULT', 'DOCKING_RESULT',
        'FORMULATION_VERSION', 'SAFETY_ASSESSMENT', 'PROFESSIONAL_REVIEW', 'LABORATORY_RESULT'
      ) NOT NULL,
      evidenceReference TEXT NOT NULL,
      notes TEXT NULL,
      createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      INDEX idx_kiel_proposal (proposalId),
      INDEX idx_kiel_version (versionId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ Created knowledge_integration_evidence_links');

  // 4. knowledge_integration_comments
  await pool.query(`
    CREATE TABLE IF NOT EXISTS knowledge_integration_comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      proposalId INT NOT NULL,
      versionId INT NULL,
      authorId INT NOT NULL,
      authorRole ENUM('ADMIN', 'REVIEWER', 'RESEARCHER') NOT NULL,
      commentType ENUM(
        'GENERAL_COMMENT', 'CLARIFICATION_NEEDED', 'EVIDENCE_NEEDED',
        'CORRECTION_REQUIRED', 'SAFETY_CONCERN'
      ) DEFAULT 'GENERAL_COMMENT',
      severity ENUM('INFORMATIONAL', 'MINOR', 'MAJOR', 'CRITICAL') DEFAULT 'INFORMATIONAL',
      commentText TEXT NOT NULL,
      createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      INDEX idx_kic_proposal (proposalId),
      INDEX idx_kic_author (authorId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ Created knowledge_integration_comments');

  // 5. knowledge_integration_decisions
  await pool.query(`
    CREATE TABLE IF NOT EXISTS knowledge_integration_decisions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      proposalId INT NOT NULL,
      versionNumber INT NOT NULL,
      reviewerId INT NOT NULL,
      decision ENUM('REQUEST_CHANGES', 'REJECT', 'APPROVE') NOT NULL,
      decisionNotes TEXT NOT NULL,
      decidedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      INDEX idx_kid_proposal (proposalId),
      INDEX idx_kid_reviewer (reviewerId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ Created knowledge_integration_decisions');

  // 6. knowledge_integration_activity_logs
  await pool.query(`
    CREATE TABLE IF NOT EXISTS knowledge_integration_activity_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      proposalId INT NOT NULL,
      projectId INT NOT NULL,
      actorId INT NOT NULL,
      actionType VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      INDEX idx_kial_proposal (proposalId),
      INDEX idx_kial_project (projectId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ Created knowledge_integration_activity_logs');

  // 7. knowledge_versions
  await pool.query(`
    CREATE TABLE IF NOT EXISTS knowledge_versions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      entityType VARCHAR(50) NOT NULL,
      entityId INT NOT NULL,
      fieldUpdated VARCHAR(100) NOT NULL,
      previousContent MEDIUMTEXT NULL,
      newContent MEDIUMTEXT NOT NULL,
      sourceProposalId INT NOT NULL,
      sourceProposalVersion INT NOT NULL,
      sourceProjectId INT NOT NULL,
      integratedBy INT NOT NULL,
      integratedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      INDEX idx_kv_entity (entityType, entityId),
      INDEX idx_kv_proposal (sourceProposalId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ Created knowledge_versions');

  console.log('All Knowledge Integration tables created successfully!');
  await pool.end();
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
