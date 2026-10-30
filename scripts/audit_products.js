const mysql = require('mysql2/promise');
const fs = require('fs');

(async () => {
  const pool = mysql.createPool({ host: '127.0.0.1', user: 'root', database: 'natureaide_db', port: 3306 });
  const [rows] = await pool.query(`
    SELECT hp.id, hp.slug, hp.name, hp.brandName, hp.manufacturer, hp.publicationStatus, hp.isPublished,
           hp.image_path, hp.imageUrl, hp.original_image_url, hp.image_source, hp.image_verified,
           prr.registrationNumber, prr.registrationStatus, prr.classification
    FROM herbal_products hp
    LEFT JOIN product_regulatory_records prr ON prr.productId = hp.id
    ORDER BY hp.name ASC
  `);
  console.log('Total herbal_products rows in DB:', rows.length);
  
  const byPub = {};
  rows.forEach(r => {
    const key = r.publicationStatus + ' (isPublished=' + r.isPublished + ')';
    byPub[key] = (byPub[key] || 0) + 1;
  });
  console.log('By publication status:', byPub);

  // Check image files on disk
  let verifiedFlagCount = 0;
  let fileExistsCount = 0;
  let falseVerifiedCount = 0;

  rows.forEach(r => {
    const isFlagged = Number(r.image_verified) === 1;
    if (isFlagged) verifiedFlagCount++;
    
    let pathToCheck = r.image_path || r.imageUrl;
    let exists = false;
    if (pathToCheck && typeof pathToCheck === 'string' && pathToCheck.startsWith('/')) {
      const fullPath = 'public' + pathToCheck;
      if (fs.existsSync(fullPath)) {
        exists = true;
      }
    }
    if (exists) fileExistsCount++;
    if (isFlagged && !exists) falseVerifiedCount++;
  });

  console.log({
    verifiedFlagCount,
    fileExistsCount,
    falseVerifiedCount
  });

  // Dump rows to json for inspection
  fs.writeFileSync('scripts/audit_dump.json', JSON.stringify(rows, null, 2), 'utf8');
  console.log('Dumped full audit to scripts/audit_dump.json');
  await pool.end();
})();
