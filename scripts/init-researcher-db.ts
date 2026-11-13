import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        process.env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
      }
    }
  });
}

async function initResearcherDb() {
  console.log("Connecting to MySQL for Researcher Database Schema...");
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "natureaide_db",
    waitForConnections: true,
    connectionLimit: 5,
  });

  const conn = await pool.getConnection();

  try {
    console.log("Adding researcher profile fields to user_profiles if missing...");
    const [profileCols]: any = await conn.query("SHOW COLUMNS FROM user_profiles");
    const colNames = profileCols.map((c: any) => c.Field);

    if (!colNames.includes("institution")) {
      await conn.query("ALTER TABLE user_profiles ADD COLUMN institution VARCHAR(191) DEFAULT 'National Institute of Health & Botanical Research' AFTER healthInterests");
    }
    if (!colNames.includes("department")) {
      await conn.query("ALTER TABLE user_profiles ADD COLUMN department VARCHAR(191) DEFAULT 'Department of Pharmacognosy & Phytochemistry' AFTER institution");
    }
    if (!colNames.includes("researchField")) {
      await conn.query("ALTER TABLE user_profiles ADD COLUMN researchField VARCHAR(191) DEFAULT 'Natural Products Chemistry & Molecular Screening' AFTER department");
    }
    if (!colNames.includes("academicInfo")) {
      await conn.query("ALTER TABLE user_profiles ADD COLUMN academicInfo TEXT DEFAULT NULL AFTER researchField");
    }
    if (!colNames.includes("bio")) {
      await conn.query("ALTER TABLE user_profiles ADD COLUMN bio TEXT DEFAULT NULL AFTER academicInfo");
    }

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
        currentStage VARCHAR(50) NOT NULL DEFAULT 'evidence-review',
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
        status ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'REQUIRES_REVISION') NOT NULL DEFAULT 'NOT_STARTED',
        completedAt DATETIME(3) NULL,
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY uq_project_stage (projectId, stageKey),
        CONSTRAINT fk_rps_project FOREIGN KEY (projectId) REFERENCES research_projects(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. research_evidence_reviews
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

    // 4. research_plant_data
    await conn.query(`
      CREATE TABLE IF NOT EXISTS research_plant_data (
        id INT(11) NOT NULL AUTO_INCREMENT,
        projectId INT(11) NOT NULL,
        commonName VARCHAR(191) NULL,
        scientificName VARCHAR(191) NULL,
        family VARCHAR(191) NULL,
        localNames VARCHAR(255) NULL,
        partsStudied VARCHAR(255) NULL,
        traditionalUses TEXT NULL,
        ethnobotanicalNotes TEXT NULL,
        knownConstituents TEXT NULL,
        researchNotes TEXT NULL,
        referencesText TEXT NULL,
        isPublishedToCommunity TINYINT(1) NOT NULL DEFAULT 0,
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY uq_rpd_project (projectId),
        CONSTRAINT fk_rpd_project FOREIGN KEY (projectId) REFERENCES research_projects(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. literature_references
    await conn.query(`
      CREATE TABLE IF NOT EXISTS literature_references (
        id INT(11) NOT NULL AUTO_INCREMENT,
        researcherId INT(11) NOT NULL,
        projectId INT(11) NULL,
        title VARCHAR(255) NOT NULL,
        authors VARCHAR(255) NULL,
        year INT(11) NULL,
        journalSource VARCHAR(255) NULL,
        doiOrUrl VARCHAR(255) NULL,
        studyType VARCHAR(100) NOT NULL DEFAULT 'Preclinical',
        plantOrCompound VARCHAR(191) NULL,
        keyFindings TEXT NULL,
        limitations TEXT NULL,
        researchNotes TEXT NULL,
        tags VARCHAR(255) NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY idx_lit_researcher (researcherId),
        KEY idx_lit_project (projectId),
        CONSTRAINT fk_lit_researcher FOREIGN KEY (researcherId) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_lit_project FOREIGN KEY (projectId) REFERENCES research_projects(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. research_compounds
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

    // 7. insilico_results
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

    // 8. docking_runs
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

    // 9. formulations
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

    // 10. formulation_ingredients
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

    // 11. safety_assessments
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

    // 12. review_submissions
    await conn.query(`
      CREATE TABLE IF NOT EXISTS review_submissions (
        id INT(11) NOT NULL AUTO_INCREMENT,
        projectId INT(11) NOT NULL,
        versionTag VARCHAR(50) NOT NULL DEFAULT 'v1.0',
        messageToReviewers TEXT NULL,
        readinessSnapshot TEXT NULL,
        status ENUM('SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUESTED', 'ACCEPTED_FOR_NEXT_STAGE') NOT NULL DEFAULT 'SUBMITTED',
        submittedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        reviewedAt DATETIME(3) NULL,
        PRIMARY KEY (id),
        KEY idx_rs_project (projectId),
        CONSTRAINT fk_rs_project FOREIGN KEY (projectId) REFERENCES research_projects(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 13. review_feedback
    await conn.query(`
      CREATE TABLE IF NOT EXISTS review_feedback (
        id INT(11) NOT NULL AUTO_INCREMENT,
        projectId INT(11) NOT NULL,
        submissionId INT(11) NULL,
        sectionName VARCHAR(100) NOT NULL,
        reviewerName VARCHAR(191) NOT NULL,
        comment TEXT NOT NULL,
        status ENUM('OPEN', 'ADDRESSED', 'RESOLVED') NOT NULL DEFAULT 'OPEN',
        researcherReply TEXT NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY idx_rf_project (projectId),
        KEY idx_rf_submission (submissionId),
        CONSTRAINT fk_rf_project FOREIGN KEY (projectId) REFERENCES research_projects(id) ON DELETE CASCADE,
        CONSTRAINT fk_rf_submission FOREIGN KEY (submissionId) REFERENCES review_submissions(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 14. laboratory_validations
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

    // 15. research_completions
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

    // 16. knowledge_proposals
    await conn.query(`
      CREATE TABLE IF NOT EXISTS knowledge_proposals (
        id INT(11) NOT NULL AUTO_INCREMENT,
        projectId INT(11) NOT NULL,
        researcherId INT(11) NOT NULL,
        plantId VARCHAR(191) NULL,
        proposalType VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        proposedContent TEXT NOT NULL,
        evidenceBasis TEXT NOT NULL,
        status ENUM('NOT_PROPOSED', 'PROPOSED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PROPOSED',
        reviewerComments TEXT NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY idx_kp_project (projectId),
        KEY idx_kp_researcher (researcherId),
        CONSTRAINT fk_kp_project FOREIGN KEY (projectId) REFERENCES research_projects(id) ON DELETE CASCADE,
        CONSTRAINT fk_kp_researcher FOREIGN KEY (researcherId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 17. research_activity_logs
    await conn.query(`
      CREATE TABLE IF NOT EXISTS research_activity_logs (
        id INT(11) NOT NULL AUTO_INCREMENT,
        projectId INT(11) NOT NULL,
        researcherId INT(11) NOT NULL,
        actionType VARCHAR(100) NOT NULL,
        description VARCHAR(255) NOT NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY idx_ral_project (projectId),
        KEY idx_ral_researcher (researcherId),
        CONSTRAINT fk_ral_project FOREIGN KEY (projectId) REFERENCES research_projects(id) ON DELETE CASCADE,
        CONSTRAINT fk_ral_researcher FOREIGN KEY (researcherId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("All 17 Researcher tables verified / created successfully.");

    // ========================================================
    // SEED DEMO RESEARCH PROJECTS FOR researcher@natureaide.test
    // ========================================================
    const [researcherUser]: any = await conn.query("SELECT id FROM users WHERE email = 'researcher@natureaide.test'");
    const researcherId = researcherUser[0]?.id;

    if (researcherId) {
      console.log("Seeding realistic demo projects for researcher@natureaide.test (ID:", researcherId, ")...");

      // Update researcher profile
      await conn.query(`
        UPDATE user_profiles
        SET 
          institution = 'Philippine Institute of Traditional & Integrative Health Care (PITAHC) Research Affiliate',
          department = 'Department of Botanical Pharmacology & Phytochemistry',
          researchField = 'Natural Products Screening & Molecular Pharmacology',
          academicInfo = 'Ph.D. in Pharmaceutical Sciences (Pharmacognosy), University of the Philippines Manila; M.Sc. in Chemistry.',
          bio = 'Specializes in the bioassay-guided fractionation, in-silico target prediction, and analytical validation of indigenous Philippine medicinal flora.'
        WHERE userId = ?
      `, [researcherId]);

      // Check if project already exists
      const [existingProjects]: any = await conn.query("SELECT id FROM research_projects WHERE researcherId = ?", [researcherId]);
      if (existingProjects.length === 0) {
        // Project 1: Sambong (In Progress - Stage: Molecular Docking)
        const [p1Res]: any = await conn.query(`
          INSERT INTO research_projects (
            researcherId, plantId, title, shortDescription, researchObjective, researchQuestion,
            areaOfInterest, expectedOutcome, status, currentStage, progressPercent
          )
          VALUES (
            ?, 'sambong',
            'In-Silico & Phytochemical Evaluation of Blumea balsamifera (Sambong) Terpenoids in Renal Inflammation Pathways',
            'Investigating the active sesquiterpene lactones and flavonoids of Sambong leaves for anti-urolithiatic and renoprotective bioactivities.',
            'Identify lead phytoconstituents responsible for modulating calcium oxalate crystallization and inflammatory cytokine cascades.',
            'Which specific terpenoid fraction in Blumea balsamifera exhibits the highest binding propensity toward kidney epithelial inflammatory markers?',
            'Urology & Natural Diuretics',
            'Provide molecular docking dossiers and analytical fingerprint benchmarks to support standardized phytopharmaceutical formulation.',
            'IN_PROGRESS', 'docking', 45
          )
        `, [researcherId]);
        const p1Id = p1Res.insertId;

        // Stages for Project 1
        const stages = [
          { key: 'evidence-review', status: 'COMPLETED' },
          { key: 'plant-research', status: 'COMPLETED' },
          { key: 'literature', status: 'COMPLETED' },
          { key: 'in-silico', status: 'COMPLETED' },
          { key: 'docking', status: 'IN_PROGRESS' },
          { key: 'formulation', status: 'NOT_STARTED' },
          { key: 'safety', status: 'IN_PROGRESS' },
          { key: 'review', status: 'NOT_STARTED' },
          { key: 'revisions', status: 'NOT_STARTED' },
          { key: 'laboratory', status: 'NOT_STARTED' },
          { key: 'completion', status: 'NOT_STARTED' },
          { key: 'knowledge-integration', status: 'NOT_STARTED' },
        ];
        for (const s of stages) {
          await conn.query(`
            INSERT INTO research_project_stages (projectId, stageKey, status, completedAt)
            VALUES (?, ?, ?, ${s.status === 'COMPLETED' ? 'CURRENT_TIMESTAMP(3)' : 'NULL'})
          `, [p1Id, s.key, s.status]);
        }

        // Evidence Review
        await conn.query(`
          INSERT INTO research_evidence_reviews (
            projectId, background, traditionalKnowledge, existingEvidence, knownGaps, initialQuestion, objectives, status
          ) VALUES (
            ?,
            'Blumea balsamifera (Sambong) is an established medicinal plant in the Philippine National Formulary recognized for its diuretic properties.',
            'Decoction of clean leaves has been used for centuries across Luzon and Visayas as a folk remedy for kidney troubles, edema, and mild fever.',
            'Extensive preclinical studies demonstrate diuretic and nephroprotective activity in rodent models. Clinical trials under NIRPROMP confirmed anti-crystallization properties.',
            'The molecular binding affinities of individual sesquiterpenoids toward specific renoprotective receptor targets remain incompletely mapped in current databases.',
            'Do the major sesquiterpenes in Sambong directly inhibit renal calcium oxalate aggregation mediators?',
            'Characterize volatile constituents, evaluate ADME properties, and conduct in-silico screening against human renal targets.',
            'COMPLETED'
          )
        `, [p1Id]);

        // Plant Research
        await conn.query(`
          INSERT INTO research_plant_data (
            projectId, commonName, scientificName, family, localNames, partsStudied, traditionalUses,
            ethnobotanicalNotes, knownConstituents, researchNotes, isPublishedToCommunity
          ) VALUES (
            ?, 'Sambong', 'Blumea balsamifera (L.) DC.', 'Asteraceae',
            'Subusub (Ilokano), Sob-sob (Igorot), Ayoban, Alibum (Visayas)',
            'Mature leaves and young aerial stems',
            'Diuretic tea, fever reduction, soothing kidney discomfort, post-partum herbal bath',
            'Widespread wild shrub in open grasslands, cultivated in tropical agroforest plots across Southeast Asia.',
            'L-borneol, camphor, caryophyllene, limonene, sesquiterpene lactones (blumeatin), dihydroflavonols',
            'Leaf samples authenticated by the National Museum of the Philippines Botany Division.',
            0
          )
        `, [p1Id]);

        // Literature references
        await conn.query(`
          INSERT INTO literature_references (
            researcherId, projectId, title, authors, year, journalSource, doiOrUrl, studyType,
            plantOrCompound, keyFindings, limitations, researchNotes, tags
          ) VALUES 
          (?, ?, 'Anti-urolithiatic activity of Blumea balsamifera in vitro and in animal models', 'Philippine Journal Research Group et al.', 2021, 'Philippine Journal of Science', 'https://doi.org/10.56899/pjs.150.04.12', 'In-Vivo', 'Sambong extract', 'Significant reduction in urinary stone weight and increased urinary volume in Sprague-Dawley rats.', 'Crude aqueous extract used; individual active compounds were not isolated.', 'Supports traditional dose titration.', 'Diuretic, Urolithiasis, Kidney'),
          (?, ?, 'Volatile constituents and antioxidant profile of Philippine medicinal asteraceae', 'Santos, M.R., Rivera, J.', 2022, 'Journal of Natural Products Research', 'https://doi.org/10.1016/j.jep.2022.115402', 'In-Vitro', 'Borneol, Blumeatin', 'Identified 32 volatile compounds with high radical-scavenging capacity.', 'In-vitro chemical assay only without cellular pharmacokinetics.', 'Key baseline for compound selection.', 'Phytochemistry, Terpenoids')
        `, [researcherId, p1Id, researcherId, p1Id]);

        // Compounds
        await conn.query(`
          INSERT INTO research_compounds (projectId, compoundName, iupacName, smiles, molecularFormula, molecularWeight, pubchemId, sourceNotes)
          VALUES 
          (?, ?, ?, ?, ?, ?, ?, ?),
          (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          p1Id, 'L-Borneol', '(1R,2S,4R)-1,7,7-trimethylbicyclo[2.2.1]heptan-2-ol', 'CC1(C)C2CCC1(C)C(O)C2', 'C10H18O', 154.25, '247', 'Major volatile constituent of Sambong leaf essential oil',
          p1Id, 'Blumeatin', "5,7,3',5'-tetrahydroxy-flavanone", 'C1C(C(=O)C2=C(C=C(C=C2O1)O)O)C3=CC(=CC(=C3)O)O', 'C15H12O6', 288.25, '5281699', 'Active dihydroflavonol isolated from Blumea balsamifera'
        ]);

        // In-Silico Result (Marked clearly as Manual Entry / External Result Upload, Engine Not Connected)
        await conn.query(`
          INSERT INTO insilico_results (
            projectId, compoundName, targetSelection, predictionType, dataSource, engineStatus,
            resultSummary, detailedMetrics, researcherNotes
          ) VALUES (
            ?, 'L-Borneol', 'Human Renal Transporter OAT1', 'ADME', 'MANUAL_ENTRY',
            'Prediction Engine Not Connected',
            'Computed Lipinski Rule of 5 compliance: MW < 500, LogP: 2.71, H-bond donors: 1, H-bond acceptors: 1. High gastrointestinal absorption predicted.',
            'LogP: 2.71 | TPSA: 20.23 A² | Rotatable Bonds: 0 | Oral Bioavailability: High (Veber Compliant)',
            'Manual entry from SwissADME benchmark run conducted externally on 2026-03-15.'
          )
        `, [p1Id]);

        // Molecular Docking Entry (Marked clearly as Manual Entry / External Upload, Engine Not Connected)
        await conn.query(`
          INSERT INTO docking_runs (
            projectId, ligandName, targetProtein, pdbId, dockingConfig, dataSource, engineStatus,
            bindingAffinity, dockingPose, interactingResidues, researcherInterpretation
          ) VALUES (
            ?, 'L-Borneol', 'Cyclooxygenase-2 (COX-2)', 'PDB: 5KIR',
            'Grid Box Center: X=24.5, Y=18.2, Z=12.1 | Spacing: 0.375 A | Exhaustiveness: 8',
            'MANUAL_ENTRY', 'Docking Engine Not Connected',
            '-6.8 kcal/mol', 'Pose 1 (RMSD: 0.00 A)', 'Tyr385, Ser530, Trp387 (Hydrophobic pocket)',
            'Shows favorable steric fit in the hydrophobic pocket of COX-2 without creating adverse steric clashes. Uploaded from external AutoDock Vina batch on workstation.'
          )
        `, [p1Id]);

        // Safety Assessment
        await conn.query(`
          INSERT INTO safety_assessments (
            projectId, knownAdverseEffects, contraindications, drugInteractions, toxicityEvidence,
            sensitivePopulations, pregnancyConsiderations, dosageExposureNotes, safetyReferences,
            researcherAssessment, unresolvedConcernsCount, safetyStatus
          ) VALUES (
            ?,
            'Mild allergic contact dermatitis occasionally noted in sensitive individuals handling fresh leaves.',
            'Contraindicated in patients with severe renal failure, cardiac edema, and end-stage kidney disease.',
            'May potentiate pharmaceutical loop diuretics and antihypertensive agents (e.g. furosemide, hydrochlorothiazide).',
            'Oral LD50 in mice exceeds 5,000 mg/kg crude extract, indicating high acute safety margin.',
            'Elderly patients with compromised renal clearance must be monitored for electrolyte shifts.',
            'Not recommended during pregnancy due to potential emmenagogue activity.',
            'Traditional dosing: 15-30g dried leaves daily boiled in divided doses.',
            'NIRPROMP Clinical Monographs (1998); PITAHC Guideline Vol. 2.',
            'High safety profile when used as an adjunct diuretic under professional clinical supervision. Continuous monitoring for electrolyte balance recommended.',
            1, 'EVALUATION_IN_PROGRESS'
          )
        `, [p1Id]);

        // Activity log
        await conn.query(`
          INSERT INTO research_activity_logs (projectId, researcherId, actionType, description)
          VALUES 
          (?, ?, 'PROJECT_CREATED', 'Initiated research project on Blumea balsamifera'),
          (?, ?, 'STAGE_COMPLETED', 'Completed Evidence Review stage'),
          (?, ?, 'STAGE_COMPLETED', 'Completed Plant Research stage'),
          (?, ?, 'DATA_RECORDED', 'Recorded manual in-silico ADME evaluation for L-Borneol')
        `, [p1Id, researcherId, p1Id, researcherId, p1Id, researcherId, p1Id, researcherId]);

        // Project 2: Lagundi (Draft)
        const [p2Res]: any = await conn.query(`
          INSERT INTO research_projects (
            researcherId, plantId, title, shortDescription, researchObjective, researchQuestion,
            areaOfInterest, expectedOutcome, status, currentStage, progressPercent
          )
          VALUES (
            ?, 'lagundi',
            'Standardized Phytochemical Profiling and Stability Assessment of Vitex negundo (Lagundi) Syrups',
            'Evaluating active chrysoplenol D degradation rates under accelerated tropical stability storage conditions.',
            'Determine shelf-life kinetics and optimal packaging materials to prevent phytochemical oxidation.',
            'What is the degradation rate of chrysoplenol D at 40°C / 75% relative humidity over 6 months?',
            'Formulation Stability & Quality Assurance',
            'Stability protocol and validated HPLC assay method for commercial and clinic dispensary preparations.',
            'DRAFT', 'evidence-review', 15
          )
        `, [researcherId]);
        const p2Id = p2Res.insertId;

        for (const s of stages) {
          await conn.query(`
            INSERT INTO research_project_stages (projectId, stageKey, status)
            VALUES (?, ?, 'NOT_STARTED')
          `, [p2Id, s.key]);
        }

        // Project 3: Turmeric (Ready for Review)
        const [p3Res]: any = await conn.query(`
          INSERT INTO research_projects (
            researcherId, plantId, title, shortDescription, researchObjective, researchQuestion,
            areaOfInterest, expectedOutcome, status, currentStage, progressPercent
          )
          VALUES (
            ?, 'turmeric',
            'Curcuma longa (Turmeric) Piperine-Enhanced Nano-Emulsion Formulation for Joint Mobility',
            'Investigation of bio-enhancement ratios between Curcuma longa rhizome curcuminoids and Piper nigrum extracts.',
            'Evaluate transdermal permeability and anti-inflammatory biomarkers in joint inflammation models.',
            'Does a 50:1 curcumin-to-piperine ratio significantly improve bioavailability across human dermal models?',
            'Rheumatology & Herbal Formulation',
            'Validated topical formulation dossier ready for clinical monograph submission.',
            'READY_FOR_REVIEW', 'review', 75
          )
        `, [researcherId]);
        const p3Id = p3Res.insertId;

        for (const s of stages) {
          const st = ['evidence-review', 'plant-research', 'literature', 'in-silico', 'docking', 'formulation', 'safety'].includes(s.key) ? 'COMPLETED' : 'IN_PROGRESS';
          await conn.query(`
            INSERT INTO research_project_stages (projectId, stageKey, status)
            VALUES (?, ?, ?)
          `, [p3Id, s.key, st]);
        }
      }
    }

    console.log("Researcher database initialization and seeding completed successfully!");
  } catch (err) {
    console.error("Researcher DB init failed:", err);
    throw err;
  } finally {
    conn.release();
    await pool.end();
  }
}

initResearcherDb();
