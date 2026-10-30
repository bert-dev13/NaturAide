const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const generatedSlugs = [
  'actimed-lagundi-syrup',
  'akita-ampalaya-tea',
  'bellevine-pansit-pansitan-capsule',
  'charantia-ampalaya-capsule',
  'charantia-ampalaya-tea',
  'docteurs-choice-ampalaya-banaba-turmeric-garlic-capsule',
  'flavonpro-yerba-buena-caplets',
  'golden-spoon-lagundi-tea',
  'guavidone-bayabas-antiseptic-solution',
  'lakapulko-antifungal-lotion',
  'nocof-lagundi-strawberry-syrup',
  'nutra-heal-akapulko-lotion',
  'pitahc-akapulko-soap',
  'pitahc-bayabas-soap',
  'pitahc-lagundi-tablet',
  'pitahc-sambong-tablet',
  'pitahc-tsaang-gubat-tablet',
  'pitahc-yerba-buena-tablet',
  'rhenalaid-sambong-500mg-tablet',
  'triherbgi-tsaang-gubat-capsule',
  'uricare-sambong-250mg-tablet',
  'wilson-bayabas-tea'
];

async function applyUpdates() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'natureaide_db'
  });

  console.log('Connected to natureaide_db.');

  // Verify all 22 image files exist and are valid JPEGs
  const baseDir = path.join(process.cwd(), 'public', 'images', 'products', 'generated');
  let allFilesValid = true;

  for (const slug of generatedSlugs) {
    const filePath = path.join(baseDir, `${slug}.jpg`);
    if (!fs.existsSync(filePath)) {
      console.error(`[MISSING] ${filePath}`);
      allFilesValid = false;
      continue;
    }
    const buf = fs.readFileSync(filePath);
    const isJpg = buf.length > 5000 && buf[0] === 0xff && buf[1] === 0xd8;
    if (!isJpg) {
      console.error(`[INVALID] ${filePath} - size: ${buf.length}, magic: ${buf.slice(0, 4).toString('hex')}`);
      allFilesValid = false;
      continue;
    }
    console.log(`✓ [VALID] ${slug}.jpg (${buf.length} bytes)`);
  }

  if (!allFilesValid) {
    console.warn('WARNING: Some files are not ready yet.');
  }

  // Update MySQL records for all generated images that exist
  let updatedCount = 0;
  for (const slug of generatedSlugs) {
    const filePath = path.join(baseDir, `${slug}.jpg`);
    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 5000) {
      const imagePath = `/images/products/generated/${slug}.jpg`;
      const [res] = await conn.execute(
        `UPDATE herbal_products
         SET image_path = ?,
             image_type = 'AI_REPRESENTATIVE',
             image_source = 'NatureAide AI Generated Representative Image',
             image_verified = 0
         WHERE slug = ? AND publicationStatus = 'PUBLISHED' AND isPublished = 1`,
        [imagePath, slug]
      );
      if (res.affectedRows > 0) {
        updatedCount++;
        console.log(`Updated DB: ${slug} -> ${imagePath}`);
      }
    }
  }

  console.log(`\nUpdated ${updatedCount} products in database to AI_REPRESENTATIVE.`);

  // Print full published catalog stats
  const [published] = await conn.query(
    `SELECT slug, name, image_path, image_type, image_verified
     FROM herbal_products
     WHERE publicationStatus = 'PUBLISHED' AND isPublished = 1
     ORDER BY image_type ASC, name ASC`
  );

  const authentic = published.filter(p => p.image_type === 'AUTHENTIC_PRODUCT' && p.image_verified === 1);
  const aiRep = published.filter(p => p.image_type === 'AI_REPRESENTATIVE' && p.image_verified === 0);
  const placeholders = published.filter(p => p.image_path.includes('placeholder.svg'));

  console.log('\n========================================');
  console.log('CATALOG IMAGE BREAKDOWN:');
  console.log('Total Published Products:       ', published.length);
  console.log('Authentic Product Photos:       ', authentic.length);
  console.log('AI Representative Images:       ', aiRep.length);
  console.log('Placeholder Images Remaining:   ', placeholders.length);
  console.log('========================================');

  await conn.end();
}

applyUpdates().catch(console.error);
