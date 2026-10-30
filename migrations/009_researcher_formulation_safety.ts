import { Migration, DbExecutor } from "../src/lib/migration-helpers";

export const migration: Migration = {
  id: "009_researcher_formulation_safety",
  name: "Researcher Formulation and Safety Assessment Schema",
  domain: "researcher",
  up: async (conn: DbExecutor) => {
    // 1. formulations
    await conn.query(`
      CREATE TABLE IF NOT EXISTS formulations (
        id INT(11) NOT NULL AUTO_INCREMENT,
        projectId INT(11) NOT NULL,
        versionNumber INT(11) NOT NULL DEFAULT 1,
        formulationName VARCHAR(191) NOT NULL,
        formulationType VARCHAR(100) NOT NULL,
        plantExtract VARCHAR(191) NULL,
        extractAmount VARCHAR(100) NULL,
        unit VARCHAR(50) NULL,
        preparationMethod TEXT NULL,
        purpose TEXT NULL,
        researchNotes TEXT NULL,
        isResearchOnly TINYINT(1) NOT NULL DEFAULT 1,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY idx_f_project (projectId),
        CONSTRAINT fk_f_project FOREIGN KEY (projectId) REFERENCES research_projects(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. formulation_ingredients
    await conn.query(`
      CREATE TABLE IF NOT EXISTS formulation_ingredients (
        id INT(11) NOT NULL AUTO_INCREMENT,
        formulationId INT(11) NOT NULL,
        ingredientName VARCHAR(191) NOT NULL,
        quantity VARCHAR(100) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        role VARCHAR(100) NULL,
        PRIMARY KEY (id),
        KEY idx_fi_formulation (formulationId),
        CONSTRAINT fk_fi_formulation FOREIGN KEY (formulationId) REFERENCES formulations(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. formulation_rationales
    await conn.query(`
      CREATE TABLE IF NOT EXISTS formulation_rationales (
        id INT(11) NOT NULL AUTO_INCREMENT,
        formulationId INT(11) NOT NULL,
        versionId INT(11) NOT NULL,
        projectId INT(11) NOT NULL,
        componentSelectionRationale TEXT DEFAULT NULL,
        literatureSupport TEXT DEFAULT NULL,
        previousStagesInfluence TEXT DEFAULT NULL,
        knownLimitations TEXT DEFAULT NULL,
        validationQuestions TEXT DEFAULT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_form_rat (formulationId, versionId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. formulation_steps
    await conn.query(`
      CREATE TABLE IF NOT EXISTS formulation_steps (
        id INT(11) NOT NULL AUTO_INCREMENT,
        formulationId INT(11) NOT NULL,
        versionId INT(11) NOT NULL,
        projectId INT(11) NOT NULL,
        stepNumber INT(11) NOT NULL,
        procedureText TEXT NOT NULL,
        equipment VARCHAR(255) DEFAULT NULL,
        processingCondition VARCHAR(255) DEFAULT NULL,
        temperature VARCHAR(100) DEFAULT NULL,
        duration VARCHAR(100) DEFAULT NULL,
        otherParameters VARCHAR(255) DEFAULT NULL,
        researcherNotes TEXT DEFAULT NULL,
        supportingFileUrl VARCHAR(500) DEFAULT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_fs_form (formulationId),
        KEY idx_fs_ver (versionId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. formulation_batches
    await conn.query(`
      CREATE TABLE IF NOT EXISTS formulation_batches (
        id INT(11) NOT NULL AUTO_INCREMENT,
        formulationId INT(11) NOT NULL,
        versionId INT(11) NOT NULL,
        projectId INT(11) NOT NULL,
        batchId VARCHAR(100) NOT NULL,
        preparationDate DATE DEFAULT NULL,
        preparedBy VARCHAR(255) DEFAULT NULL,
        batchSize VARCHAR(100) DEFAULT NULL,
        storageConditions VARCHAR(255) DEFAULT NULL,
        physicalObservations TEXT DEFAULT NULL,
        stabilityObservations TEXT DEFAULT NULL,
        supportingFileUrl VARCHAR(500) DEFAULT NULL,
        researcherNotes TEXT DEFAULT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_fb_form (formulationId),
        KEY idx_fb_ver (versionId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. formulation_versions
    await conn.query(`
      CREATE TABLE IF NOT EXISTS formulation_versions (
        id INT(11) NOT NULL AUTO_INCREMENT,
        formulationId INT(11) NOT NULL,
        projectId INT(11) NOT NULL,
        versionNumber VARCHAR(20) NOT NULL,
        versionTag VARCHAR(100) DEFAULT NULL,
        changeSummary TEXT DEFAULT NULL,
        createdByResearcherId INT(11) NOT NULL,
        isCurrentVersion TINYINT(1) DEFAULT 1,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_fv_form (formulationId),
        KEY idx_fv_project (projectId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 7. formulation_components
    await conn.query(`
      CREATE TABLE IF NOT EXISTS formulation_components (
        id INT(11) NOT NULL AUTO_INCREMENT,
        formulationId INT(11) NOT NULL,
        versionId INT(11) NOT NULL,
        projectId INT(11) NOT NULL,
        componentName VARCHAR(255) NOT NULL,
        roleInFormulation VARCHAR(150) NOT NULL,
        sourceMaterial VARCHAR(255) DEFAULT NULL,
        quantity VARCHAR(100) DEFAULT NULL,
        unit VARCHAR(50) DEFAULT NULL,
        concentration VARCHAR(100) DEFAULT NULL,
        puritySpecification VARCHAR(255) DEFAULT NULL,
        sourceReference VARCHAR(255) DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_fc_form (formulationId),
        KEY idx_fc_ver (versionId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 8. research_formulations
    await conn.query(`
      CREATE TABLE IF NOT EXISTS research_formulations (
        id INT(11) NOT NULL AUTO_INCREMENT,
        projectId INT(11) NOT NULL,
        formulationName VARCHAR(255) NOT NULL,
        formulationCode VARCHAR(100) DEFAULT NULL,
        formulationType VARCHAR(100) NOT NULL,
        researchPurpose TEXT NOT NULL,
        dosageFormType VARCHAR(100) DEFAULT NULL,
        researcherRationale TEXT DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        currentVersionNumber VARCHAR(20) DEFAULT 'v1.0',
        status VARCHAR(50) DEFAULT 'DRAFT',
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_rf_project (projectId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 9. safety_assessments
    await conn.query(`
      CREATE TABLE IF NOT EXISTS safety_assessments (
        id INT(11) NOT NULL AUTO_INCREMENT,
        projectId INT(11) NOT NULL,
        knownAdverseEffects TEXT NULL,
        contraindications TEXT NULL,
        drugInteractions TEXT NULL,
        toxicityEvidence TEXT NULL,
        sensitivePopulations TEXT NULL,
        pregnancyConsiderations TEXT NULL,
        dosageExposureNotes TEXT NULL,
        safetyReferences TEXT NULL,
        researcherAssessment TEXT NULL,
        unresolvedConcernsCount INT(11) NOT NULL DEFAULT 0,
        safetyStatus VARCHAR(50) NOT NULL DEFAULT 'EVALUATION_IN_PROGRESS',
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY uq_sa_project (projectId),
        CONSTRAINT fk_sa_project FOREIGN KEY (projectId) REFERENCES research_projects(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 10. safety_concerns
    await conn.query(`
      CREATE TABLE IF NOT EXISTS safety_concerns (
        id INT(11) NOT NULL AUTO_INCREMENT,
        safetyAssessmentId INT(11) NOT NULL,
        projectId INT(11) NOT NULL,
        concernTitle VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        affectedComponent VARCHAR(255) DEFAULT NULL,
        evidenceOrReference TEXT DEFAULT NULL,
        severity ENUM('INFORMATIONAL','LOW','MODERATE','HIGH','CRITICAL') DEFAULT 'LOW',
        evidenceStatus ENUM('SUPPORTED','LIMITED','UNKNOWN') DEFAULT 'LIMITED',
        researcherNotes TEXT DEFAULT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_sc_sa (safetyAssessmentId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 11. safety_summaries
    await conn.query(`
      CREATE TABLE IF NOT EXISTS safety_summaries (
        id INT(11) NOT NULL AUTO_INCREMENT,
        safetyAssessmentId INT(11) NOT NULL,
        projectId INT(11) NOT NULL,
        overallEvidenceSummary TEXT DEFAULT NULL,
        majorIdentifiedConcerns TEXT DEFAULT NULL,
        evidenceLimitations TEXT DEFAULT NULL,
        unresolvedSafetyQuestions TEXT DEFAULT NULL,
        itemsRequiringReview TEXT DEFAULT NULL,
        recommendedNextActions TEXT DEFAULT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_sa_sum (safetyAssessmentId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 12. safety_component_assessments
    await conn.query(`
      CREATE TABLE IF NOT EXISTS safety_component_assessments (
        id INT(11) NOT NULL AUTO_INCREMENT,
        safetyAssessmentId INT(11) NOT NULL,
        projectId INT(11) NOT NULL,
        componentId INT(11) DEFAULT NULL,
        componentName VARCHAR(255) NOT NULL,
        knownConcern TEXT DEFAULT NULL,
        supportingEvidence TEXT DEFAULT NULL,
        potentialInteraction TEXT DEFAULT NULL,
        researcherAssessment TEXT DEFAULT NULL,
        needsProfessionalReview TINYINT(1) DEFAULT 0,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_sca_sa (safetyAssessmentId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 13. research_safety_assessments
    await conn.query(`
      CREATE TABLE IF NOT EXISTS research_safety_assessments (
        id INT(11) NOT NULL AUTO_INCREMENT,
        projectId INT(11) NOT NULL,
        formulationVersionId INT(11) DEFAULT NULL,
        knownSafetyEvidence TEXT DEFAULT NULL,
        toxicityEvidence TEXT DEFAULT NULL,
        potentialContraindications TEXT DEFAULT NULL,
        herbDrugInteractions TEXT DEFAULT NULL,
        populationConsiderations TEXT DEFAULT NULL,
        ingredientSpecificConcerns TEXT DEFAULT NULL,
        doseConcentrationConcerns TEXT DEFAULT NULL,
        knownAdverseEffects TEXT DEFAULT NULL,
        evidenceGaps TEXT DEFAULT NULL,
        additionalSafetyNotes TEXT DEFAULT NULL,
        status VARCHAR(50) DEFAULT 'IN_PROGRESS',
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_rsa_project (projectId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }
};
