const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'natureaide_db'
  });

  console.log('Connected to natureaide_db.');

  // 1. Update 12 newly verified products
  const verifiedUpdates = [
    {
      slug: 'plemex-forte-lagundi-syrup',
      image_path: '/images/products/plemex-forte-lagundi-syrup.webp',
      original_image_url: 'https://www.rosepharmacy.com/ph1/wp-content/uploads/2016/09/49912.png',
      image_source: 'Rose Pharmacy (Official Drugstore Catalog)',
      image_source_url: 'https://www.rosepharmacy.com/ph1/product/plemex-forte-syr-600mg-5ml-60ml/'
    },
    {
      slug: 'plemex-for-kids-lagundi-syrup',
      image_path: '/images/products/plemex-for-kids-lagundi-syrup.png',
      original_image_url: 'https://www.rosepharmacy.com/ph1/wp-content/uploads/2016/09/49909.png',
      image_source: 'Rose Pharmacy (Official Drugstore Catalog)',
      image_source_url: 'https://www.rosepharmacy.com/ph1/product/plemex-syr-300mg-5ml-sweet-orange-60ml/'
    },
    {
      slug: 'ritemed-lagundi-capsule',
      image_path: '/images/products/ritemed-lagundi-600mg.jpg',
      original_image_url: 'https://www.ritemed.com.ph/storage/app/uploads/public/66b/5ca/db2/66b5cadb2f61f693171816.jpg',
      image_source: 'RiteMed Philippines (Official Brand Website)',
      image_source_url: 'https://www.ritemed.com.ph/products/rm-lagundi-600-mg-tablet'
    },
    {
      slug: 're-leaf-sambong-250mg-tablet',
      image_path: '/images/products/re-leaf-sambong-250mg-tablet.png',
      original_image_url: 'https://cdn.shopify.com/s/files/1/0358/1335/9748/files/102502272.png?v=1687329069',
      image_source: 'ShopSuki Supermarket & Drugstore Catalog',
      image_source_url: 'https://shopsuki.ph/products/re-leaf-250mg-tablet-100s'
    },
    {
      slug: 'propan-fit-garlic-capsule',
      image_path: '/images/products/propan-fit-garlic-capsule.jpg',
      original_image_url: 'https://cdn.shopify.com/s/files/1/0358/1335/9748/products/a13a1eb3-3c37-4672-a4cd-fc9c29a617e6.jpg?v=1708927668',
      image_source: 'ShopSuki Supermarket & Drugstore Catalog',
      image_source_url: 'https://shopsuki.ph/products/propan-fit-capsule'
    },
    {
      slug: 'diavit-herbs-ampalaya-banaba-turmeric-capsule',
      image_path: '/images/products/diavit-herbs-ampalaya-capsule.jpg',
      original_image_url: 'https://diavitherbs.org/wp-content/uploads/2020/10/Diavitherbs_product_image_533x500_v2.jpg',
      image_source: 'Diavit Herbs Official Website',
      image_source_url: 'https://diavitherbs.org/'
    },
    {
      slug: 'dok-natural-banaba-sambong-drops',
      image_path: '/images/products/dok-natural-banaba-sambong-drops.jpg',
      original_image_url: 'https://doknaturalofficial.com/cdn/shop/files/DN_HERBAL_DROPS_FDA.webp',
      image_source: 'Dok Natural Official Website',
      image_source_url: 'https://doknaturalofficial.com/products/dok-natural-herbal-drops'
    },
    {
      slug: 'better-ampalaya-500-capsule',
      image_path: '/images/products/better-ampalaya-500-capsule.jpg',
      original_image_url: 'https://medsgo.ph/images/detailed/27/better_500.jpg',
      image_source: 'MedsGo Online Pharmacy Catalog',
      image_source_url: 'https://medsgo.ph/better-ampalaya-500-box-of-100-capsules.html'
    },
    {
      slug: 'urisam-sambong-500mg-tablet',
      image_path: '/images/products/urisam-sambong-500mg-tablet.webp',
      original_image_url: 'https://medsgo.ph/images/detailed/41/Urisam.webp',
      image_source: 'MedsGo Online Pharmacy Catalog',
      image_source_url: 'https://medsgo.ph/urisam-500mg-box-of-100-tablets.html'
    },
    {
      slug: 'herbakid-sambong-250mg-tablet',
      image_path: '/images/products/herbakid-sambong-250mg-tablet.png',
      original_image_url: 'https://medsgo.ph/images/thumbnails/400/400/detailed/23/Herbakid.png.png',
      image_source: 'MedsGo Online Pharmacy Catalog',
      image_source_url: 'https://medsgo.ph/herbakid-250mg-box-of-100-tablets.html'
    },
    {
      slug: 'kidneygen-forte-sambong-500mg-tablet',
      image_path: '/images/products/kidneygen-forte-sambong-500mg-tablet.jpg',
      original_image_url: 'https://medsgo.ph/images/detailed/29/kidneygen_forte.jpg',
      image_source: 'MedsGo Online Pharmacy Catalog',
      image_source_url: 'https://medsgo.ph/kidneygen-forte-500mg-box-of-100-tablets.html'
    },
    {
      slug: 'ofplemed-forte-lagundi-tablet',
      image_path: '/images/products/ofplemed-forte-lagundi-tablet.png',
      original_image_url: 'https://medsgo.ph/images/detailed/37/Ofplemed_Forte_9q78-pe.png',
      image_source: 'MedsGo Online Pharmacy Catalog',
      image_source_url: 'https://medsgo.ph/ofplemed-forte-600mg-box-of-100-tablets.html'
    }
  ];

  for (const item of verifiedUpdates) {
    const [res] = await conn.execute(
      `UPDATE herbal_products 
       SET image_path = ?,
           original_image_url = ?,
           image_source = ?,
           image_source_url = ?,
           image_verified = 1,
           image_verified_at = NOW()
       WHERE slug = ?`,
      [item.image_path, item.original_image_url, item.image_source, item.image_source_url, item.slug]
    );
    console.log(`Updated verified image for: ${item.slug} (affected: ${res.affectedRows})`);
  }

  // 2. Unpublish unsubstantiated products and set UNDER_REVIEW
  const unsubstantiatedSlugs = [
    'super-leaf-sambong-500mg-tablet',
    'adelle-pansit-pansitan-coffee-mix',
    'phlemalis-lagundi-food-supplement-capsule',
    'total-wellness-immuna-yerba-buena-capsule',
    'hp-lagunmeric-salabat-tea',
    'naturemed-sambong-food-supplement-capsule',
    'bitteractive-ampalaya-capsule'
  ];

  for (const slug of unsubstantiatedSlugs) {
    const [res] = await conn.execute(
      `UPDATE herbal_products 
       SET publicationStatus = 'UNDER_REVIEW',
           isPublished = 0
       WHERE slug = ?`,
      [slug]
    );
    console.log(`Moved to UNDER_REVIEW: ${slug} (affected: ${res.affectedRows})`);
  }

  // Check stats
  const [publishedRows] = await conn.query(
    `SELECT COUNT(*) as cnt FROM herbal_products WHERE publicationStatus = 'PUBLISHED' AND isPublished = 1`
  );
  const [verifiedRows] = await conn.query(
    `SELECT COUNT(*) as cnt FROM herbal_products WHERE publicationStatus = 'PUBLISHED' AND isPublished = 1 AND image_verified = 1`
  );
  const [unverifiedRows] = await conn.query(
    `SELECT COUNT(*) as cnt FROM herbal_products WHERE publicationStatus = 'PUBLISHED' AND isPublished = 1 AND image_verified = 0`
  );
  const [underReviewRows] = await conn.query(
    `SELECT COUNT(*) as cnt FROM herbal_products WHERE publicationStatus = 'UNDER_REVIEW'`
  );

  console.log('\n--- AUDIT SUMMARY ---');
  console.log(`TOTAL PUBLISHED VERIFIED PRODUCTS: ${publishedRows[0].cnt}`);
  console.log(`PRODUCTS WITH REAL IMAGES: ${verifiedRows[0].cnt}`);
  console.log(`PRODUCTS WITHOUT IMAGES: ${unverifiedRows[0].cnt}`);
  console.log(`PRODUCTS MOVED TO UNDER_REVIEW: ${underReviewRows[0].cnt}`);

  await conn.end();
}

run().catch(console.error);
