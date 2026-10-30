import { Migration, DbExecutor } from "../src/lib/migration-helpers";

export const migration: Migration = {
  id: "011_researcher_dossier_integration",
  name: "Researcher Dossier, Completion, and Knowledge Integration Schema",
  domain: "researcher",
  up: async (conn: DbExecutor) => {
    // 1. research_dossiers
    await conn.query(`
      CREATE TABLE IF NOT EXISTS research_dossiers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        projectId INT NOT NULL UNIQUE,
        researcherId INT NOT NULL,
        currentVersionTag VARCHAR(50) DEFAULT 'v1.0',
        status ENUM('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUESTED', 'RESUBMITTED', 'ACCEPTED_FOR_NEXT_STAGE') DEFAULT 'SUBMITTED',
        createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        INDEX idx_rd_project (projectId),
        INDEX idx_rd_researcher (researcherId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. research_dossier_versions
    await conn.query(`
      CREATE TABLE IF NOT EXISTS research_dossier_versions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        dossierId INT NOT NULL,
        projectId INT NOT NULL,
        researcherId INT NOT NULL,
        versionTag VARCHAR(50) NOT NULL,
        reviewRound INT DEFAULT 1,
        formulationVersionId INT NULL,
        formulationVersionTag VARCHAR(50) NULL,
        submissionStatus ENUM('SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUESTED', 'RESUBMITTED', 'ACCEPTED_FOR_NEXT_STAGE') DEFAULT 'SUBMITTED',
        preferredSpecialty VARCHAR(100) NULL,
        messageToReviewers TEXT NULL,
        readinessSnapshot JSON NULL,
        dossierSnapshot LONGTEXT NOT NULL,
        safetyFlagsSnapshot JSON NULL,
        submissionTimestamp DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        assignedReviewerId INT NULL,
        reviewedAt DATETIME(3) NULL,
        createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        INDEX idx_rdv_dossier (dossierId),
        INDEX idx_rdv_project (projectId),
        INDEX idx_rdv_version (versionTag)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. research_dossier_stage_snapshots
    await conn.query(`
      CREATE TABLE IF NOT EXISTS research_dossier_stage_snapshots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        dossierVersionId INT NOT NULL,
        projectId INT NOT NULL,
        stageKey VARCHAR(50) NOT NULL,
        stageTitle VARCHAR(100) NOT NULL,
        stageStatus VARCHAR(50) NOT NULL,
        snapshotPayload LONGTEXT NOT NULL,
        createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        INDEX idx_rdss_version (dossierVersionId),
        INDEX idx_rdss_project (projectId),
        INDEX idx_rdss_stage (stageKey)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. research_completions
    await conn.query(`
      CREATE TABLE IF NOT EXISTS research_completions (
        id INT(11) NOT NULL AUTO_INCREMENT,
        projectId INT(11) NOT NULL,
        finalTitle VARCHAR(255) NOT NULL,
        abstract TEXT NOT NULL,
        keyFindings TEXT NOT NULL,
        limitations TEXT NULL,
        conclusion TEXT NOT NULL,
        recommendations TEXT NULL,
        futureResearch TEXT NULL,
        completedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY uq_rcomp_project (projectId),
        CONSTRAINT fk_rcomp_project FOREIGN KEY (projectId) REFERENCES research_projects(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. research_completion_records
    await conn.query(`
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

    // 6. research_final_findings
    await conn.query(`
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

    // 7. knowledge_integration_proposals
    await conn.query(`
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

    // 8. knowledge_integration_versions
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
        UNIQUE KEY uk_prop_version (proposalId, versionNumber),
        INDEX idx_kiv_proposal (proposalId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 9. knowledge_integration_evidence_links
    await conn.query(`
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

    // 10. knowledge_integration_comments
    await conn.query(`
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

    // 11. knowledge_integration_decisions
    await conn.query(`
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

    // 12. knowledge_integration_activity_logs
    await conn.query(`
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

    // 13. laboratory tables (Optional for compatibility, non-blocking)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS laboratory_validations (
        id INT(11) NOT NULL AUTO_INCREMENT,
        projectId INT(11) NOT NULL,
        laboratoryName VARCHAR(191) NOT NULL,
        testType VARCHAR(191) NOT NULL,
        testDate DATE NULL,
        method VARCHAR(255) NULL,
        sampleInformation TEXT NULL,
        results TEXT NOT NULL,
        interpretation TEXT NULL,
        certificateFilePath VARCHAR(255) NULL,
        researchNotes TEXT NULL,
        dataSource ENUM('MANUAL_ENTRY', 'UPLOADED_REPORT') NOT NULL DEFAULT 'MANUAL_ENTRY',
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY idx_lv_project (projectId),
        CONSTRAINT fk_lv_project FOREIGN KEY (projectId) REFERENCES research_projects(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
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

    await conn.query(`
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

    await conn.query(`
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

    await conn.query(`
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
  }
};
