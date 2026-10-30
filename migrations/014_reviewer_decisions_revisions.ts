import { Migration, DbExecutor, addColumnIfNotExists } from "../src/lib/migration-helpers";

export const migration: Migration = {
  id: "014_reviewer_decisions_revisions",
  name: "Reviewer Decisions, Feedback, Notifications, and Revisions Schema",
  domain: "reviewer",
  up: async (conn: DbExecutor) => {
    // 1. review_submissions
    await conn.query(`
      CREATE TABLE IF NOT EXISTS review_submissions (
        id INT(11) NOT NULL AUTO_INCREMENT,
        projectId INT(11) NOT NULL,
        versionTag VARCHAR(50) NOT NULL DEFAULT 'v1.0',
        reviewRound INT(11) NOT NULL DEFAULT 1,
        messageToReviewers TEXT DEFAULT NULL,
        readinessSnapshot TEXT DEFAULT NULL,
        snapshotData LONGTEXT DEFAULT NULL,
        previousSubmissionId INT(11) DEFAULT NULL,
        assignedReviewerId INT(11) DEFAULT NULL,
        status ENUM('SUBMITTED','UNDER_REVIEW','REVISION_REQUESTED','ACCEPTED_FOR_NEXT_STAGE') NOT NULL DEFAULT 'SUBMITTED',
        submittedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        reviewedAt DATETIME(3) DEFAULT NULL,
        PRIMARY KEY (id),
        KEY idx_rs_project (projectId),
        CONSTRAINT fk_rs_project FOREIGN KEY (projectId) REFERENCES research_projects(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await addColumnIfNotExists(conn, "review_submissions", "reviewRound", "INT(11) NOT NULL DEFAULT 1 AFTER versionTag");
    await addColumnIfNotExists(conn, "review_submissions", "snapshotData", "LONGTEXT DEFAULT NULL AFTER readinessSnapshot");
    await addColumnIfNotExists(conn, "review_submissions", "previousSubmissionId", "INT(11) DEFAULT NULL AFTER snapshotData");
    await addColumnIfNotExists(conn, "review_submissions", "assignedReviewerId", "INT(11) DEFAULT NULL AFTER previousSubmissionId");

    // 2. review_feedback
    await conn.query(`
      CREATE TABLE IF NOT EXISTS review_feedback (
        id INT(11) NOT NULL AUTO_INCREMENT,
        projectId INT(11) NOT NULL,
        submissionId INT(11) DEFAULT NULL,
        reviewerId INT(11) DEFAULT NULL,
        reviewRound INT(11) NOT NULL DEFAULT 1,
        sectionName VARCHAR(100) NOT NULL,
        commentType ENUM('GENERAL_COMMENT','CLARIFICATION_NEEDED','EVIDENCE_NEEDED','CORRECTION_SUGGESTED','SAFETY_CONCERN') NOT NULL DEFAULT 'GENERAL_COMMENT',
        severity ENUM('INFORMATIONAL','MINOR','MAJOR','CRITICAL') NOT NULL DEFAULT 'INFORMATIONAL',
        reviewerName VARCHAR(191) NOT NULL,
        comment TEXT NOT NULL,
        recommendation TEXT DEFAULT NULL,
        referenceLink VARCHAR(255) DEFAULT NULL,
        status ENUM('OPEN','ADDRESSED','RESOLVED') NOT NULL DEFAULT 'OPEN',
        responseAction ENUM('CHANGE_MADE','CLARIFICATION_PROVIDED','ADDITIONAL_EVIDENCE_ADDED','NO_CHANGE_WITH_JUSTIFICATION') DEFAULT NULL,
        responseDescription TEXT DEFAULT NULL,
        affectedStage VARCHAR(100) DEFAULT NULL,
        supportingFileUrl VARCHAR(255) DEFAULT NULL,
        dossierVersionTag VARCHAR(50) DEFAULT 'v1.0',
        researcherReply TEXT DEFAULT NULL,
        researcherRepliedAt DATETIME(3) DEFAULT NULL,
        resolvedAt DATETIME(3) DEFAULT NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        areaKey VARCHAR(50) DEFAULT NULL,
        title VARCHAR(191) DEFAULT NULL,
        reviewId INT(11) DEFAULT NULL,
        PRIMARY KEY (id),
        KEY idx_rf_project (projectId),
        KEY idx_rf_submission (submissionId),
        CONSTRAINT fk_rf_project FOREIGN KEY (projectId) REFERENCES research_projects(id) ON DELETE CASCADE,
        CONSTRAINT fk_rf_submission FOREIGN KEY (submissionId) REFERENCES review_submissions(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await addColumnIfNotExists(conn, "review_feedback", "reviewerId", "INT(11) DEFAULT NULL AFTER submissionId");
    await addColumnIfNotExists(conn, "review_feedback", "reviewRound", "INT(11) NOT NULL DEFAULT 1 AFTER reviewerId");
    await addColumnIfNotExists(conn, "review_feedback", "commentType", "ENUM('GENERAL_COMMENT','CLARIFICATION_NEEDED','EVIDENCE_NEEDED','CORRECTION_SUGGESTED','SAFETY_CONCERN') NOT NULL DEFAULT 'GENERAL_COMMENT' AFTER sectionName");
    await addColumnIfNotExists(conn, "review_feedback", "severity", "ENUM('INFORMATIONAL','MINOR','MAJOR','CRITICAL') NOT NULL DEFAULT 'INFORMATIONAL' AFTER commentType");
    await addColumnIfNotExists(conn, "review_feedback", "recommendation", "TEXT DEFAULT NULL AFTER comment");
    await addColumnIfNotExists(conn, "review_feedback", "referenceLink", "VARCHAR(255) DEFAULT NULL AFTER recommendation");
    await addColumnIfNotExists(conn, "review_feedback", "responseAction", "ENUM('CHANGE_MADE','CLARIFICATION_PROVIDED','ADDITIONAL_EVIDENCE_ADDED','NO_CHANGE_WITH_JUSTIFICATION') DEFAULT NULL AFTER status");
    await addColumnIfNotExists(conn, "review_feedback", "responseDescription", "TEXT DEFAULT NULL AFTER responseAction");
    await addColumnIfNotExists(conn, "review_feedback", "affectedStage", "VARCHAR(100) DEFAULT NULL AFTER responseDescription");
    await addColumnIfNotExists(conn, "review_feedback", "supportingFileUrl", "VARCHAR(255) DEFAULT NULL AFTER affectedStage");
    await addColumnIfNotExists(conn, "review_feedback", "dossierVersionTag", "VARCHAR(50) DEFAULT 'v1.0' AFTER supportingFileUrl");
    await addColumnIfNotExists(conn, "review_feedback", "researcherRepliedAt", "DATETIME(3) DEFAULT NULL AFTER researcherReply");
    await addColumnIfNotExists(conn, "review_feedback", "resolvedAt", "DATETIME(3) DEFAULT NULL AFTER researcherRepliedAt");
    await addColumnIfNotExists(conn, "review_feedback", "areaKey", "VARCHAR(50) DEFAULT NULL AFTER updatedAt");
    await addColumnIfNotExists(conn, "review_feedback", "title", "VARCHAR(191) DEFAULT NULL AFTER areaKey");
    await addColumnIfNotExists(conn, "review_feedback", "reviewId", "INT(11) DEFAULT NULL AFTER title");

    // 3. professional_reviews
    await conn.query(`
      CREATE TABLE IF NOT EXISTS professional_reviews (
        id INT(11) NOT NULL AUTO_INCREMENT,
        assignmentId INT(11) DEFAULT NULL,
        submissionId INT(11) NOT NULL,
        projectId INT(11) NOT NULL,
        reviewerId INT(11) NOT NULL,
        areaKey VARCHAR(50) NOT NULL,
        reviewCycle INT(11) NOT NULL DEFAULT 1,
        assessment ENUM('ACCEPTABLE','REVISION_REQUIRED') DEFAULT NULL,
        comments TEXT DEFAULT NULL,
        status ENUM('DRAFT','SUBMITTED') NOT NULL DEFAULT 'DRAFT',
        submittedAt DATETIME(3) DEFAULT NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        checklistData TEXT DEFAULT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uq_sub_reviewer_area (submissionId, reviewerId, areaKey),
        KEY idx_assignment (assignmentId),
        KEY idx_project (projectId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. review_decisions
    await conn.query(`
      CREATE TABLE IF NOT EXISTS review_decisions (
        id INT(11) NOT NULL AUTO_INCREMENT,
        projectId INT(11) NOT NULL,
        submissionId INT(11) NOT NULL,
        reviewerId INT(11) NOT NULL,
        reviewRound INT(11) NOT NULL DEFAULT 1,
        decision ENUM('REQUEST_REVISION','ACCEPT_FOR_NEXT_STAGE') NOT NULL,
        overallAssessment TEXT NOT NULL,
        strengths TEXT DEFAULT NULL,
        concerns TEXT DEFAULT NULL,
        requiredRevisions TEXT DEFAULT NULL,
        additionalRecommendations TEXT DEFAULT NULL,
        checklistSnapshot LONGTEXT DEFAULT NULL,
        decidedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY idx_rd_project (projectId),
        KEY idx_rd_submission (submissionId),
        KEY idx_rd_reviewer (reviewerId),
        KEY idx_rd_decided (decidedAt),
        CONSTRAINT fk_rd_project FOREIGN KEY (projectId) REFERENCES research_projects(id) ON DELETE CASCADE,
        CONSTRAINT fk_rd_reviewer FOREIGN KEY (reviewerId) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_rd_submission FOREIGN KEY (submissionId) REFERENCES review_submissions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. review_notifications
    await conn.query(`
      CREATE TABLE IF NOT EXISTS review_notifications (
        id INT(11) NOT NULL AUTO_INCREMENT,
        userId INT(11) NOT NULL,
        type ENUM('NEW_ASSIGNMENT','RESEARCH_RESUBMITTED','RESEARCHER_RESPONDED','REVISION_REQUESTED','ACCEPTED_FOR_NEXT_STAGE','GENERAL') NOT NULL,
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

    // 6. revision_cycles
    await conn.query(`
      CREATE TABLE IF NOT EXISTS revision_cycles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        projectId INT NOT NULL,
        submissionId INT NOT NULL,
        dossierVersionTag VARCHAR(50) NOT NULL,
        nextVersionTag VARCHAR(50) NULL,
        reviewRound INT DEFAULT 1,
        reviewerId INT NOT NULL,
        reviewerDecision ENUM('REVISION_REQUESTED', 'ACCEPTED_FOR_NEXT_STAGE') NOT NULL,
        reviewerSummary TEXT NOT NULL,
        status ENUM('IN_PROGRESS', 'RESOLVED', 'SUPERSEDED') DEFAULT 'IN_PROGRESS',
        researcherSummary TEXT NULL,
        createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        resolvedAt DATETIME(3) NULL,
        INDEX idx_rc_project (projectId),
        INDEX idx_rc_submission (submissionId),
        INDEX idx_rc_reviewer (reviewerId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 7. revision_change_records
    await conn.query(`
      CREATE TABLE IF NOT EXISTS revision_change_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cycleId INT NULL,
        projectId INT NOT NULL,
        fromVersionTag VARCHAR(50) NOT NULL,
        toVersionTag VARCHAR(50) NOT NULL,
        sectionKey VARCHAR(50) NOT NULL,
        changeType ENUM('ADDED', 'MODIFIED', 'REMOVED') NOT NULL,
        previousSummary TEXT NULL,
        newSummary TEXT NULL,
        changeDescription TEXT NOT NULL,
        createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        INDEX idx_rcr_project (projectId),
        INDEX idx_rcr_cycle (cycleId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 8. review_activity_logs
    await conn.query(`
      CREATE TABLE IF NOT EXISTS review_activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        projectId INT NOT NULL,
        submissionId INT NULL,
        dossierVersionId INT NULL,
        actorId INT NOT NULL,
        actorRole VARCHAR(50) NOT NULL,
        actionType VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        INDEX idx_ral_project (projectId),
        INDEX idx_ral_submission (submissionId),
        INDEX idx_ral_actor (actorId),
        INDEX idx_ral_created (createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }
};
