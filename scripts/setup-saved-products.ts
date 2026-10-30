import pool from "../src/lib/db";

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS saved_products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      productId VARCHAR(191) NOT NULL,
      notes TEXT NULL,
      createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      UNIQUE KEY uniq_user_product (userId, productId),
      INDEX idx_user (userId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("Verified / created saved_products table in MySQL");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
