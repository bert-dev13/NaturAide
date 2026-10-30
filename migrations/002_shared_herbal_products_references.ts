import { Migration, DbExecutor, addColumnIfNotExists } from "../src/lib/migration-helpers";

export const migration: Migration = {
  id: "002_shared_herbal_products_references",
  name: "Commercial herbal products, regulatory records, and scientific references",
  domain: "shared",
  up: async (conn: DbExecutor) => {
    // 1. herbal_products
    await conn.query(`
      CREATE TABLE IF NOT EXISTS herbal_products (
        id VARCHAR(191) NOT NULL PRIMARY KEY,
        slug VARCHAR(191) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        brandName VARCHAR(255) NOT NULL,
        manufacturer VARCHAR(255) NOT NULL,
        productType VARCHAR(100) NOT NULL,
        productClassification VARCHAR(100) DEFAULT NULL,
        isMultiIngredient TINYINT(1) DEFAULT 0,
        dosageForm VARCHAR(100) NOT NULL,
        dosageStrength VARCHAR(100) DEFAULT NULL,
        imageUrl VARCHAR(500) DEFAULT NULL,
        description TEXT NOT NULL,
        intendedUse TEXT NOT NULL,
        usageInstructions TEXT DEFAULT NULL,
        preparationGuide LONGTEXT DEFAULT NULL,
        warningsPrecautions TEXT DEFAULT NULL,
        publicationStatus ENUM('DRAFT','UNDER_REVIEW','VERIFIED','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'PUBLISHED',
        isPublished TINYINT(1) NOT NULL DEFAULT 1,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        local_image_path VARCHAR(500) DEFAULT NULL,
        image_path VARCHAR(500) DEFAULT NULL,
        image_type VARCHAR(50) DEFAULT 'AUTHENTIC_PRODUCT',
        original_image_url VARCHAR(1000) DEFAULT NULL,
        image_source VARCHAR(255) DEFAULT NULL,
        image_source_url VARCHAR(1000) DEFAULT NULL,
        image_verified TINYINT(1) NOT NULL DEFAULT 0,
        image_author VARCHAR(500) DEFAULT NULL,
        image_license VARCHAR(255) DEFAULT NULL,
        image_attribution TEXT DEFAULT NULL,
        image_verified_at DATETIME(3) DEFAULT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await addColumnIfNotExists(conn, "herbal_products", "local_image_path", "VARCHAR(500) DEFAULT NULL");
    await addColumnIfNotExists(conn, "herbal_products", "image_path", "VARCHAR(500) DEFAULT NULL");
    await addColumnIfNotExists(conn, "herbal_products", "image_type", "VARCHAR(50) DEFAULT 'AUTHENTIC_PRODUCT'");
    await addColumnIfNotExists(conn, "herbal_products", "original_image_url", "VARCHAR(1000) DEFAULT NULL");
    await addColumnIfNotExists(conn, "herbal_products", "image_source", "VARCHAR(255) DEFAULT NULL");
    await addColumnIfNotExists(conn, "herbal_products", "image_source_url", "VARCHAR(1000) DEFAULT NULL");
    await addColumnIfNotExists(conn, "herbal_products", "image_verified", "TINYINT(1) NOT NULL DEFAULT 0");
    await addColumnIfNotExists(conn, "herbal_products", "image_author", "VARCHAR(500) DEFAULT NULL");
    await addColumnIfNotExists(conn, "herbal_products", "image_license", "VARCHAR(255) DEFAULT NULL");
    await addColumnIfNotExists(conn, "herbal_products", "image_attribution", "TEXT DEFAULT NULL");
    await addColumnIfNotExists(conn, "herbal_products", "image_verified_at", "DATETIME(3) DEFAULT NULL");

    // 2. product_ingredients
    await conn.query(`
      CREATE TABLE IF NOT EXISTS product_ingredients (
        id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        productId VARCHAR(191) NOT NULL,
        ingredientName VARCHAR(255) NOT NULL,
        strength VARCHAR(100) DEFAULT NULL,
        ingredientType VARCHAR(100) NOT NULL DEFAULT 'ACTIVE_HERBAL',
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        KEY fk_pi_product (productId),
        CONSTRAINT fk_pi_product FOREIGN KEY (productId) REFERENCES herbal_products (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. scientific_references
    await conn.query(`
      CREATE TABLE IF NOT EXISTS scientific_references (
        id VARCHAR(191) NOT NULL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        authors VARCHAR(500) NOT NULL,
        publicationYear INT(11) NOT NULL,
        journalOrPublisher VARCHAR(255) NOT NULL,
        studyType VARCHAR(150) NOT NULL,
        doi VARCHAR(255) DEFAULT NULL,
        pubmedId VARCHAR(50) DEFAULT NULL,
        sourceUrl VARCHAR(500) NOT NULL,
        shortSummary TEXT NOT NULL,
        plantOrIngredientStudied VARCHAR(255) NOT NULL,
        isExactProductStudied TINYINT(1) NOT NULL DEFAULT 0,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        source_verified TINYINT(1) NOT NULL DEFAULT 0,
        source_verified_at DATETIME(3) DEFAULT NULL,
        evidence_scope VARCHAR(100) NOT NULL DEFAULT 'SINGLE_HERBAL_EVIDENCE',
        botanical_identity_verified TINYINT(1) NOT NULL DEFAULT 0,
        verification_source VARCHAR(255) DEFAULT 'NCBI PubMed Official E-Utilities API'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await addColumnIfNotExists(conn, "scientific_references", "source_verified", "TINYINT(1) NOT NULL DEFAULT 0");
    await addColumnIfNotExists(conn, "scientific_references", "source_verified_at", "DATETIME(3) DEFAULT NULL");
    await addColumnIfNotExists(conn, "scientific_references", "evidence_scope", "VARCHAR(100) NOT NULL DEFAULT 'SINGLE_HERBAL_EVIDENCE'");
    await addColumnIfNotExists(conn, "scientific_references", "botanical_identity_verified", "TINYINT(1) NOT NULL DEFAULT 0");
    await addColumnIfNotExists(conn, "scientific_references", "verification_source", "VARCHAR(255) DEFAULT 'NCBI PubMed Official E-Utilities API'");

    // 4. product_references
    await conn.query(`
      CREATE TABLE IF NOT EXISTS product_references (
        id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        productId VARCHAR(191) NOT NULL,
        referenceId VARCHAR(191) NOT NULL,
        evidenceClassification ENUM('EXACT_PRODUCT_STUDY','FORMULATION_STUDY','INGREDIENT_EVIDENCE','PLANT_EVIDENCE','SAFETY_EVIDENCE') NOT NULL,
        evidenceNote TEXT DEFAULT NULL,
        source_verified TINYINT(1) DEFAULT 1,
        source_verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        verification_source VARCHAR(255) DEFAULT 'NCBI PubMed / PITAHC Monograph',
        evidence_scope VARCHAR(50) DEFAULT 'PLANT_EVIDENCE',
        botanical_identity_verified TINYINT(1) DEFAULT 1,
        supported_ingredient VARCHAR(255) DEFAULT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uk_prod_ref (productId, referenceId),
        KEY fk_pr_ref (referenceId),
        CONSTRAINT fk_pr_product FOREIGN KEY (productId) REFERENCES herbal_products (id) ON DELETE CASCADE,
        CONSTRAINT fk_pr_ref FOREIGN KEY (referenceId) REFERENCES scientific_references (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await addColumnIfNotExists(conn, "product_references", "source_verified", "TINYINT(1) DEFAULT 1");
    await addColumnIfNotExists(conn, "product_references", "source_verified_at", "DATETIME DEFAULT CURRENT_TIMESTAMP");
    await addColumnIfNotExists(conn, "product_references", "verification_source", "VARCHAR(255) DEFAULT 'NCBI PubMed / PITAHC Monograph'");
    await addColumnIfNotExists(conn, "product_references", "evidence_scope", "VARCHAR(50) DEFAULT 'PLANT_EVIDENCE'");
    await addColumnIfNotExists(conn, "product_references", "botanical_identity_verified", "TINYINT(1) DEFAULT 1");
    await addColumnIfNotExists(conn, "product_references", "supported_ingredient", "VARCHAR(255) DEFAULT NULL");
  }
};
