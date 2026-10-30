import pool from "../src/lib/db";

async function auditAndCleanProducts() {
  console.log("=== STARTING NATUREAIDE PRODUCT AUDIT AND DATASET CLEANING ===");

  // 1. Mark unverified/sample/constructed products as ARCHIVED and unpublished
  const archivedProductIds = [
    "botanical-lagundi-leaf-tea",
    "nirpromp-tsaang-gubat-tablet",
    "nirpromp-yerba-buena-infusion",
    "san-san-instant-salabat-ginger-tea",
    "yamang-bukid-turmeric-10-in-1-tea",
  ];

  for (const id of archivedProductIds) {
    await pool.query(
      `UPDATE herbal_products
       SET publicationStatus = 'ARCHIVED',
           isPublished = 0,
           image_verified = 0,
           image_path = '/images/products/placeholder.svg',
           imageUrl = '/images/products/placeholder.svg'
       WHERE id = ?`,
      [id]
    );
    console.log(`[ARCHIVED] Unpublished unverified product: ${id}`);
  }

  // 2. Ensure verified real commercial products are marked PUBLISHED with exact commercial metadata
  const verifiedProducts = [
    {
      id: "ascof-lagundi-syrup",
      slug: "ascof-lagundi-syrup",
      name: "Ascof Lagundi 300mg/5mL Syrup",
      brandName: "Ascof Lagundi",
      manufacturer: "Pascual Laboratories, Inc.",
      productType: "Traditional Herbal Medicine",
      dosageForm: "Syrup",
      imageUrl: "/images/products/ascof-lagundi-syrup.png",
      image_path: "/images/products/ascof-lagundi-syrup.png",
      original_image_url: "https://www.pascuallab.com/uploads/optimized/products/99/ascof_grape_60ml.png",
      image_source: "Pascual Laboratories Official Website",
      image_source_url: "https://www.pascuallab.com/products/ascof-lagundi",
      image_verified: 1,
    },
    {
      id: "re-leaf-sambong-tablet",
      slug: "re-leaf-sambong-tablet",
      name: "Re-Leaf Sambong 500mg Tablet",
      brandName: "Re-Leaf",
      manufacturer: "Pascual Laboratories, Inc.",
      productType: "Traditional Herbal Medicine",
      dosageForm: "Tablet",
      imageUrl: "/images/products/re-leaf-sambong-tablet.png",
      image_path: "/images/products/re-leaf-sambong-tablet.png",
      original_image_url: "https://pascualpharma.com/wp-content/uploads/2020/06/The-Original-Sambong-Product-Image_5.4.2026-2.png",
      image_source: "Pascual Pharma Official Website",
      image_source_url: "https://pascualpharma.com/portfolio-item/re-leaf/",
      image_verified: 1,
    },
    {
      id: "tolak-angin-herbal-liquid",
      slug: "tolak-angin-herbal-liquid",
      name: "Tolak Angin Herbal Liquid Extract 15mL Sachet",
      brandName: "Tolak Angin",
      manufacturer: "PT Industri Jamu dan Farmasi Sido Muncul Tbk / Great Love Pharma Philippines, Inc.",
      productType: "Standardized Herbal Liquid Supplement",
      dosageForm: "Liquid Sachet",
      imageUrl: "/images/products/tolak-angin-herbal-liquid.png",
      image_path: "/images/products/tolak-angin-herbal-liquid.png",
      original_image_url: "https://www.sidomuncul.co.id/assets/images/product/produk-tolak-angin.png",
      image_source: "PT Industri Jamu Dan Farmasi Sido Muncul Tbk Official Portal",
      image_source_url: "https://www.sidomuncul.co.id/id/product/tolak_angin.html",
      image_verified: 1,
    },
  ];

  for (const vp of verifiedProducts) {
    await pool.query(
      `UPDATE herbal_products
       SET name = ?,
           brandName = ?,
           manufacturer = ?,
           productType = ?,
           dosageForm = ?,
           imageUrl = ?,
           image_path = ?,
           original_image_url = ?,
           image_source = ?,
           image_source_url = ?,
           image_verified = ?,
           image_verified_at = CURRENT_TIMESTAMP(3),
           publicationStatus = 'PUBLISHED',
           isPublished = 1
       WHERE id = ?`,
      [
        vp.name,
        vp.brandName,
        vp.manufacturer,
        vp.productType,
        vp.dosageForm,
        vp.imageUrl,
        vp.image_path,
        vp.original_image_url,
        vp.image_source,
        vp.image_source_url,
        vp.image_verified,
        vp.id,
      ]
    );
    console.log(`[VERIFIED & PUBLISHED] Updated verified product: ${vp.name}`);
  }

  // 3. Update Official Product Resources in MySQL
  await pool.query("DELETE FROM product_resources WHERE productId IN ('ascof-lagundi-syrup', 're-leaf-sambong-tablet', 'tolak-angin-herbal-liquid')");
  await pool.query(`
    INSERT INTO product_resources (productId, resourceName, resourceType, url, lastVerifiedDate, description)
    VALUES
      ('ascof-lagundi-syrup', 'Pascual Laboratories Official Ascof Product Information', 'MANUFACTURER', 'https://www.pascuallab.com/products/ascof-lagundi', '2026-03-15', 'Official manufacturer product information and indications for Ascof Lagundi 300mg/5mL Syrup.'),
      ('ascof-lagundi-syrup', 'Philippine FDA Verification Portal (Food and Drug Administration)', 'REGULATORY', 'https://verification.fda.gov.ph', '2026-02-28', 'Official Philippine Food and Drug Administration registered herbal medicine listing.'),
      ('re-leaf-sambong-tablet', 'Pascual Laboratories Re-Leaf Product Guide', 'MANUFACTURER', 'https://pascualpharma.com/portfolio-item/re-leaf/', '2026-03-15', 'Official patient information leaflet and indication guidelines for Re-Leaf 500mg Tablet.'),
      ('re-leaf-sambong-tablet', 'Philippine FDA Verification Portal', 'REGULATORY', 'https://verification.fda.gov.ph', '2026-02-28', 'Verified Certificate of Product Registration (Traditional Herbal Medicine).'),
      ('tolak-angin-herbal-liquid', 'PT Industri Jamu Dan Farmasi Sido Muncul Tbk Official Portal', 'MANUFACTURER', 'https://www.sidomuncul.co.id/id/product/tolak_angin.html', '2026-02-15', 'Official manufacturer product monograph and standardized formulation specs.'),
      ('tolak-angin-herbal-liquid', 'Philippine FDA Verification Portal', 'REGULATORY', 'https://verification.fda.gov.ph', '2026-02-28', 'Verified FDA Philippines Registration FR-4000004928151.')
  `);
  console.log("Updated official product resources for verified commercial products.");

  console.log("=== PRODUCT AUDIT & CLEANING FINISHED SUCCESSFULLY ===");
  await pool.end();
}

auditAndCleanProducts().catch((err) => {
  console.error("Audit error:", err);
  process.exit(1);
});
