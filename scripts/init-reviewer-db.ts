import pool from "../src/lib/db";

async function main() {
  console.log("==================================================");
  console.log("INITIALIZING NATUREAIDE REVIEWER MODULE DATABASE");
  console.log("==================================================");

  const conn = await pool.getConnection();

  try {
    // 1. reviewer_profiles
    console.log("1. Creating reviewer_profiles table...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS reviewer_profiles (
        id INT(11) NOT NULL AUTO_INCREMENT,
        userId INT(11) NOT NULL UNIQUE,
        specialty ENUM('PHARMACIST', 'PHARMACOLOGIST', 'PHYSICIAN', 'ETHNOBOTANIST', 'CHEMIST') NOT NULL DEFAULT 'PHARMACIST',
        professionalTitle VARCHAR(191) NOT NULL DEFAULT 'Clinical Pharmacist & Herbal Medicine Evaluator',
        institution VARCHAR(191) NOT NULL DEFAULT 'Philippine Pharmacopeia Commission / National Herb Research Center',
        licenseNumber VARCHAR(100) DEFAULT 'RPh-088921',
        areasOfExpertise TEXT DEFAULT 'Pharmacokinetics, Botanical Drug Interactions, Standardized Formulations, Safety Screening',
        bio TEXT DEFAULT 'Board-certified clinical pharmacist with 12+ years evaluating phytomedicinal monographs, adverse event toxicology, and botanical dosage form stability.',
        verificationStatus ENUM('PENDING_VERIFICATION', 'VERIFIED', 'SUSPENDED') NOT NULL DEFAULT 'VERIFIED',
        verifiedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        CONSTRAINT fk_rev_prof_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. review_submissions table check and add missing columns
    console.log("2. Ensuring review_submissions has snapshot & round columns...");
    const [subCols]: any = await conn.query("SHOW COLUMNS FROM review_submissions");
    const subColNames = subCols.map((c: any) => c.Field);

    if (!subColNames.includes("reviewRound")) {
      await conn.query("ALTER TABLE review_submissions ADD COLUMN reviewRound INT NOT NULL DEFAULT 1 AFTER versionTag");
    }
    if (!subColNames.includes("snapshotData")) {
      await conn.query("ALTER TABLE review_submissions ADD COLUMN snapshotData LONGTEXT NULL AFTER readinessSnapshot");
    }
    if (!subColNames.includes("previousSubmissionId")) {
      await conn.query("ALTER TABLE review_submissions ADD COLUMN previousSubmissionId INT NULL AFTER snapshotData");
    }
    if (!subColNames.includes("assignedReviewerId")) {
      await conn.query("ALTER TABLE review_submissions ADD COLUMN assignedReviewerId INT NULL AFTER previousSubmissionId");
    }

    // 3. review_assignments
    console.log("3. Creating review_assignments table...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS review_assignments (
        id INT(11) NOT NULL AUTO_INCREMENT,
        projectId INT(11) NOT NULL,
        submissionId INT(11) NOT NULL,
        reviewerId INT(11) NOT NULL,
        specialtyNeeded VARCHAR(100) NOT NULL DEFAULT 'PHARMACIST',
        status ENUM('PENDING', 'IN_REVIEW', 'REVISION_REQUIRED', 'RESUBMITTED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
        reviewRound INT(11) NOT NULL DEFAULT 1,
        assignedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        startedAt DATETIME(3) NULL,
        completedAt DATETIME(3) NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY uq_assignment (submissionId, reviewerId),
        KEY idx_ra_project (projectId),
        KEY idx_ra_reviewer (reviewerId),
        KEY idx_ra_status (status),
        CONSTRAINT fk_ra_project FOREIGN KEY (projectId) REFERENCES research_projects(id) ON DELETE CASCADE,
        CONSTRAINT fk_ra_submission FOREIGN KEY (submissionId) REFERENCES review_submissions(id) ON DELETE CASCADE,
        CONSTRAINT fk_ra_reviewer FOREIGN KEY (reviewerId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. review_feedback alterations
    console.log("4. Updating review_feedback table with severity, reviewerId, and status...");
    const [fbCols]: any = await conn.query("SHOW COLUMNS FROM review_feedback");
    const fbColNames = fbCols.map((c: any) => c.Field);

    if (!fbColNames.includes("reviewerId")) {
      await conn.query("ALTER TABLE review_feedback ADD COLUMN reviewerId INT NULL AFTER submissionId");
    }
    if (!fbColNames.includes("reviewRound")) {
      await conn.query("ALTER TABLE review_feedback ADD COLUMN reviewRound INT NOT NULL DEFAULT 1 AFTER reviewerId");
    }
    if (!fbColNames.includes("commentType")) {
      await conn.query("ALTER TABLE review_feedback ADD COLUMN commentType ENUM('GENERAL_COMMENT', 'CLARIFICATION_NEEDED', 'EVIDENCE_NEEDED', 'CORRECTION_SUGGESTED', 'SAFETY_CONCERN') NOT NULL DEFAULT 'GENERAL_COMMENT' AFTER sectionName");
    }
    if (!fbColNames.includes("severity")) {
      await conn.query("ALTER TABLE review_feedback ADD COLUMN severity ENUM('INFORMATIONAL', 'MINOR', 'MAJOR', 'CRITICAL') NOT NULL DEFAULT 'INFORMATIONAL' AFTER commentType");
    }
    if (!fbColNames.includes("researcherRepliedAt")) {
      await conn.query("ALTER TABLE review_feedback ADD COLUMN researcherRepliedAt DATETIME(3) NULL AFTER researcherReply");
    }
    if (!fbColNames.includes("resolvedAt")) {
      await conn.query("ALTER TABLE review_feedback ADD COLUMN resolvedAt DATETIME(3) NULL AFTER researcherRepliedAt");
    }

    // 5. review_section_status
    console.log("5. Creating review_section_status table...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS review_section_status (
        id INT(11) NOT NULL AUTO_INCREMENT,
        submissionId INT(11) NOT NULL,
        reviewerId INT(11) NOT NULL,
        sectionKey VARCHAR(50) NOT NULL,
        status ENUM('NOT_REVIEWED', 'REVIEWED', 'NEEDS_ATTENTION') NOT NULL DEFAULT 'NOT_REVIEWED',
        notes TEXT NULL,
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY uq_rev_section (submissionId, reviewerId, sectionKey),
        CONSTRAINT fk_rss_submission FOREIGN KEY (submissionId) REFERENCES review_submissions(id) ON DELETE CASCADE,
        CONSTRAINT fk_rss_reviewer FOREIGN KEY (reviewerId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. review_decisions
    console.log("6. Creating review_decisions table...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS review_decisions (
        id INT(11) NOT NULL AUTO_INCREMENT,
        projectId INT(11) NOT NULL,
        submissionId INT(11) NOT NULL,
        reviewerId INT(11) NOT NULL,
        reviewRound INT(11) NOT NULL DEFAULT 1,
        decision ENUM('REQUEST_REVISION', 'ACCEPT_FOR_NEXT_STAGE') NOT NULL,
        overallAssessment TEXT NOT NULL,
        strengths TEXT NULL,
        concerns TEXT NULL,
        requiredRevisions TEXT NULL,
        additionalRecommendations TEXT NULL,
        checklistSnapshot LONGTEXT NULL,
        decidedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY idx_rd_project (projectId),
        KEY idx_rd_submission (submissionId),
        KEY idx_rd_reviewer (reviewerId),
        CONSTRAINT fk_rd_project FOREIGN KEY (projectId) REFERENCES research_projects(id) ON DELETE CASCADE,
        CONSTRAINT fk_rd_submission FOREIGN KEY (submissionId) REFERENCES review_submissions(id) ON DELETE CASCADE,
        CONSTRAINT fk_rd_reviewer FOREIGN KEY (reviewerId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 7. review_notifications
    console.log("7. Creating review_notifications table...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS review_notifications (
        id INT(11) NOT NULL AUTO_INCREMENT,
        userId INT(11) NOT NULL,
        type ENUM('NEW_ASSIGNMENT', 'RESEARCH_RESUBMITTED', 'RESEARCHER_RESPONDED', 'REVISION_REQUESTED', 'ACCEPTED_FOR_NEXT_STAGE', 'GENERAL') NOT NULL,
        title VARCHAR(191) NOT NULL,
        message TEXT NOT NULL,
        link VARCHAR(191) NOT NULL,
        isRead TINYINT(1) NOT NULL DEFAULT 0,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY idx_rn_user (userId),
        CONSTRAINT fk_rn_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 8. Seed / ensure demo reviewer account in reviewer_profiles
    console.log("8. Seeding demo reviewer profile for reviewer@natureaide.test...");
    const [revUser]: any = await conn.query("SELECT id FROM users WHERE email = 'reviewer@natureaide.test' LIMIT 1");
    if (revUser.length > 0) {
      const reviewerUserId = revUser[0].id;
      await conn.query(`
        INSERT INTO reviewer_profiles (
          userId, specialty, professionalTitle, institution, licenseNumber,
          areasOfExpertise, bio, verificationStatus
        ) VALUES (
          ?, 'PHARMACIST', 'Lead Clinical Pharmacist & Herbal Medicine Evaluator',
          'Philippine National Pharmacopeia Committee / UST Faculty of Pharmacy',
          'RPh-088921-PH',
          'Herbal-Drug Interactions, Pharmacokinetics, Quality Standardization, Adverse Effect Toxicology',
          'Registered Pharmacist and researcher with over 14 years evaluating botanical extracts, pharmacokinetic clearances, and herbal drug interactions.',
          'VERIFIED'
        )
        ON DUPLICATE KEY UPDATE
          specialty = 'PHARMACIST',
          verificationStatus = 'VERIFIED',
          updatedAt = CURRENT_TIMESTAMP(3)
      `, [reviewerUserId]);

      // 9. Ensure review submissions exist for projects and are assigned
      console.log("9. Linking existing research project submissions to reviewer...");
      const [projects]: any = await conn.query("SELECT id, title, plantId FROM research_projects ORDER BY id ASC");

      for (const p of projects) {
        // Build frozen snapshot for this project
        const [evReview]: any = await conn.query("SELECT * FROM research_evidence_reviews WHERE projectId = ? LIMIT 1", [p.id]);
        const [plantData]: any = await conn.query("SELECT * FROM research_plant_data WHERE projectId = ? LIMIT 1", [p.id]);
        const [litRefs]: any = await conn.query("SELECT * FROM literature_references WHERE projectId = ?", [p.id]);
        const [compounds]: any = await conn.query("SELECT * FROM research_compounds WHERE projectId = ?", [p.id]);
        const [inSilico]: any = await conn.query("SELECT * FROM insilico_results WHERE projectId = ?", [p.id]);
        const [docking]: any = await conn.query("SELECT * FROM docking_runs WHERE projectId = ?", [p.id]);
        const [formulations]: any = await conn.query("SELECT * FROM formulations WHERE projectId = ?", [p.id]);
        for (const f of formulations) {
          const [ings]: any = await conn.query("SELECT * FROM formulation_ingredients WHERE formulationId = ?", [f.id]);
          f.ingredients = ings;
        }
        const [safety]: any = await conn.query("SELECT * FROM safety_assessments WHERE projectId = ? LIMIT 1", [p.id]);
        const [labs]: any = await conn.query("SELECT * FROM laboratory_validations WHERE projectId = ?", [p.id]);

        const snapshot = JSON.stringify({
          project: p,
          evidenceReview: evReview[0] || null,
          plantData: plantData[0] || null,
          literature: litRefs || [],
          compounds: compounds || [],
          inSilico: inSilico || [],
          docking: docking || [],
          formulations: formulations || [],
          safety: safety[0] || null,
          laboratories: labs || [],
        });

        // Check if submission exists
        const [subs]: any = await conn.query("SELECT * FROM review_submissions WHERE projectId = ? ORDER BY id ASC", [p.id]);

        let subId: number;
        if (subs.length === 0) {
          const [sRes]: any = await conn.query(`
            INSERT INTO review_submissions (
              projectId, versionTag, reviewRound, messageToReviewers, readinessSnapshot, snapshotData, status, assignedReviewerId
            ) VALUES (?, 'v1.0', 1, 'Submitted for clinical safety and pharmacognostic review.', '100% Core Ready', ?, 'UNDER_REVIEW', ?)
          `, [p.id, snapshot, reviewerUserId]);
          subId = sRes.insertId;
        } else {
          subId = subs[0].id;
          // Update snapshot data if null
          await conn.query("UPDATE review_submissions SET snapshotData = COALESCE(snapshotData, ?), assignedReviewerId = ? WHERE id = ?", [snapshot, reviewerUserId, subId]);
        }

        // Create assignment for demo reviewer
        await conn.query(`
          INSERT INTO review_assignments (
            projectId, submissionId, reviewerId, specialtyNeeded, status, reviewRound
          ) VALUES (?, ?, ?, 'PHARMACIST', 'PENDING', 1)
          ON DUPLICATE KEY UPDATE
            reviewerId = VALUES(reviewerId),
            updatedAt = CURRENT_TIMESTAMP(3)
        `, [p.id, subId, reviewerUserId]);

        // Seed initial review notification
        await conn.query(`
          INSERT INTO review_notifications (userId, type, title, message, link)
          VALUES (?, 'NEW_ASSIGNMENT', ?, ?, ?)
        `, [
          reviewerUserId,
          `New Research Assigned: ${p.title}`,
          `Research project "${p.title}" has been assigned to you for Pharmacist clinical evaluation.`,
          `/reviewer/reviews/${subId}`
        ]);
      }
    }

    console.log("==================================================");
    console.log("REVIEWER DATABASE INITIALIZED SUCCESSFULLY!");
    console.log("==================================================");
  } finally {
    conn.release();
  }

  process.exit(0);
}

main().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
