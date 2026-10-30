import { Migration, DbExecutor } from "../src/lib/migration-helpers";

export const migration: Migration = {
  id: "013_reviewer_areas_assignments",
  name: "Reviewer 5 Professional Areas and Assignments Schema",
  domain: "reviewer",
  up: async (conn: DbExecutor) => {
    // 1. professional_review_areas
    await conn.query(`
      CREATE TABLE IF NOT EXISTS professional_review_areas (
        id INT(11) NOT NULL AUTO_INCREMENT,
        userId INT(11) NOT NULL,
        areaKey VARCHAR(50) NOT NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY uq_user_area (userId, areaKey),
        KEY idx_user (userId),
        CONSTRAINT fk_pra_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. review_area_coverage
    await conn.query(`
      CREATE TABLE IF NOT EXISTS review_area_coverage (
        id INT(11) NOT NULL AUTO_INCREMENT,
        submissionId INT(11) NOT NULL,
        projectId INT(11) NOT NULL,
        areaKey VARCHAR(50) NOT NULL,
        reviewerId INT(11) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY uq_submission_area (submissionId, areaKey),
        KEY idx_coverage_reviewer (reviewerId),
        KEY idx_coverage_project (projectId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. review_assignments
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
        CONSTRAINT fk_ra_reviewer FOREIGN KEY (reviewerId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. review_section_status
    await conn.query(`
      CREATE TABLE IF NOT EXISTS review_section_status (
        id INT(11) NOT NULL AUTO_INCREMENT,
        submissionId INT(11) NOT NULL,
        reviewerId INT(11) NOT NULL,
        sectionKey VARCHAR(50) NOT NULL,
        status ENUM('PENDING', 'IN_PROGRESS', 'ACCEPTABLE', 'CONCERNS_NOTED') NOT NULL DEFAULT 'PENDING',
        commentCount INT(11) NOT NULL DEFAULT 0,
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY uq_sec_reviewer (submissionId, reviewerId, sectionKey),
        KEY idx_rss_reviewer (reviewerId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }
};
