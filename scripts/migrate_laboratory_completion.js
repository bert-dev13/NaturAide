const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'natureaide_db',
    port: 3306,
  });

  console.log('Running migration for Stage 10 Laboratory and Stage 11 Completion tables...');

  // 1. laboratory_tests
  await pool.query(`
    CREATE TABLE IF NOT EXISTS laboratory_tests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      projectId INT NOT NULL,
      testName VARCHAR(255) NOT NULL,
      assayCategory ENUM(
        'PHYTOCHEMICAL_ANALYSIS', 'HPLC', 'LC_MS', 'GC_MS',
        'ANTIMICROBIAL_ASSAY', 'ANTIOXIDANT_ASSAY', 'CYTOTOXICITY_ASSAY',
        'TOXICITY_ASSAY', 'STABILITY_TEST', 'PHYSICOCHEMICAL_TEST', 'OTHER'
      ) NOT NULL,
      laboratoryFacility VARCHAR(255) NOT NULL,
      testingDate DATE NULL,
      sampleBatchId VARCHAR(100) NOT NULL,
      formulationVersionTag VARCHAR(50) NULL,
      formulationVersionId INT NULL,
      plantMaterialTested VARCHAR(255) NULL,
      performedBy VARCHAR(191) NULL,
      methodProtocol TEXT NULL,
      equipmentInstrumentation TEXT NULL,
      referenceStandard VARCHAR(255) NULL,
      provenance ENUM(
        'LABORATORY_REPORT', 'RESEARCHER_ENTERED_FROM_REPORT',
        'UPLOADED_RESULT', 'EXTERNAL_LAB_RECORD'
      ) DEFAULT 'RESEARCHER_ENTERED_FROM_REPORT',
      provenanceSource VARCHAR(255) NULL,
      provenanceRecordedBy VARCHAR(191) NULL,
      status ENUM('PLANNED', 'IN_PROGRESS', 'RESULTS_RECEIVED', 'DOCUMENTED', 'CANCELLED') DEFAULT 'DOCUMENTED',
      notes TEXT NULL,
      createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      INDEX idx_lt_project (projectId),
      INDEX idx_lt_category (assayCategory),
      INDEX idx_lt_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ Created laboratory_tests table');

  // 2. laboratory_test_results
  await pool.query(`
    CREATE TABLE IF NOT EXISTS laboratory_test_results (
      id INT AUTO_INCREMENT PRIMARY KEY,
      testId INT NOT NULL,
      projectId INT NOT NULL,
      parameterAnalyte VARCHAR(191) NOT NULL,
      measuredValue VARCHAR(100) NOT NULL,
      unit VARCHAR(50) NOT NULL,
      referenceComparator VARCHAR(191) NULL,
      observation TEXT NULL,
      resultNotes TEXT NULL,
      createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      INDEX idx_ltr_test (testId),
      INDEX idx_ltr_project (projectId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ Created laboratory_test_results table');

  // 3. laboratory_files
  await pool.query(`
    CREATE TABLE IF NOT EXISTS laboratory_files (
      id INT AUTO_INCREMENT PRIMARY KEY,
      testId INT NOT NULL,
      projectId INT NOT NULL,
      fileName VARCHAR(255) NOT NULL,
      fileUrl VARCHAR(500) NOT NULL,
      fileType VARCHAR(100) NULL,
      fileSource VARCHAR(191) NULL,
      uploadedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      INDEX idx_lf_test (testId),
      INDEX idx_lf_project (projectId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ Created laboratory_files table');

  // 4. laboratory_interpretations
  await pool.query(`
    CREATE TABLE IF NOT EXISTS laboratory_interpretations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      testId INT NOT NULL UNIQUE,
      projectId INT NOT NULL,
      keyFindings TEXT NOT NULL,
      relationshipToResearchQuestion TEXT NULL,
      relationshipToComputational TEXT NULL,
      relationshipToFormulation TEXT NULL,
      limitations TEXT NULL,
      unexpectedObservations TEXT NULL,
      additionalNotes TEXT NULL,
      createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      INDEX idx_li_test (testId),
      INDEX idx_li_project (projectId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ Created laboratory_interpretations table');

  // 5. research_completion_records
  await pool.query(`
    CREATE TABLE IF NOT EXISTS research_completion_records (
      id INT AUTO_INCREMENT PRIMARY KEY,
      projectId INT NOT NULL UNIQUE,
      researcherId INT NOT NULL,
      finalResearchVersion VARCHAR(50) DEFAULT 'v1.0',
      researchQuestion TEXT NOT NULL,
      researchObjective TEXT NOT NULL,
      questionAddressedStatus ENUM('FULLY_ADDRESSED', 'PARTIALLY_ADDRESSED', 'NOT_RESOLVED') DEFAULT 'FULLY_ADDRESSED',
      questionAddressedExplanation TEXT NULL,
      finalResearchFindings TEXT NOT NULL,
      keyEvidenceSupporting TEXT NULL,
      laboratoryFindingsSummary TEXT NULL,
      computationalLabRelationship TEXT NULL,
      professionalReviewOutcome TEXT NULL,
      majorLimitations TEXT NOT NULL,
      unresolvedQuestions TEXT NULL,
      recommendationsFutureResearch TEXT NULL,
      finalConclusion TEXT NOT NULL,
      completedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      isPublishedToCommunity TINYINT(1) DEFAULT 0,
      INDEX idx_rcr_project (projectId),
      INDEX idx_rcr_researcher (researcherId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ Created research_completion_records table');

  // 6. research_final_findings
  await pool.query(`
    CREATE TABLE IF NOT EXISTS research_final_findings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      completionId INT NOT NULL,
      projectId INT NOT NULL,
      findingTitle VARCHAR(255) NOT NULL,
      findingDescription TEXT NOT NULL,
      findingCategory VARCHAR(100) NULL,
      createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      INDEX idx_rff_completion (completionId),
      INDEX idx_rff_project (projectId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ Created research_final_findings table');

  // 7. research_evidence_traceability
  await pool.query(`
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
  console.log('✓ Created research_evidence_traceability table');

  console.log('Migration completed successfully!');
  await pool.end();
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
