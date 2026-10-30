const fs = require('fs');

const path = 'src/app/community/plants/[slug]/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// Replace the query to explicitly filter by source_verified = 1 and select the new verification fields
const oldQuery = `  // Query verified scientific references from MySQL
  const cleanCommon = plant.commonName.replace(/\\s*\\([^)]*\\)/, "").trim();
  const [refRows]: any = await pool.query(
    \`SELECT sr.id, sr.title, sr.authors, sr.publicationYear as year, sr.journalOrPublisher as journalSource,
            sr.sourceUrl as doiOrUrl, sr.studyType, sr.plantOrIngredientStudied as plantOrCompound, sr.shortSummary as keyFindings
     FROM scientific_references sr
     WHERE sr.plantOrIngredientStudied LIKE ? OR sr.plantOrIngredientStudied LIKE ? OR sr.title LIKE ?
     ORDER BY sr.publicationYear DESC\`,
    [\`%\${cleanCommon}%\`, \`%\${plant.scientificName}%\`, \`%\${cleanCommon}%\`]
  );`;

const newQuery = `  // Query verified scientific references from MySQL (strictly source_verified = 1 with botanical identity verified)
  const cleanCommon = plant.commonName.replace(/\\s*\\([^)]*\\)/, "").trim();
  const [refRows]: any = await pool.query(
    \`SELECT sr.id, sr.title, sr.authors, sr.publicationYear as year, sr.journalOrPublisher as journalSource,
            sr.sourceUrl as doiOrUrl, sr.studyType, sr.plantOrIngredientStudied as plantOrCompound, sr.shortSummary as keyFindings,
            sr.pubmedId, sr.doi, sr.source_verified, sr.evidence_scope, sr.botanical_identity_verified
     FROM scientific_references sr
     WHERE sr.source_verified = 1
       AND (sr.plantOrIngredientStudied LIKE ? OR sr.plantOrIngredientStudied LIKE ?)
     ORDER BY sr.publicationYear DESC\`,
    [\`%\${cleanCommon}%\`, \`%\${plant.scientificName}%\`]
  );`;

if (code.includes('cleanCommon') && code.includes('scientific_references sr')) {
  // Let's do a regex or direct replacement
  code = code.replace(
    /(\/\/ Query verified scientific references from MySQL[\s\S]*?)(const \[refRows\][\s\S]*?ORDER BY sr\.publicationYear DESC`,[\s\S]*?\);)/,
    newQuery
  );
  fs.writeFileSync(path, code, 'utf8');
  console.log('Successfully updated src/app/community/plants/[slug]/page.tsx');
} else {
  console.error('Could not find query target in src/app/community/plants/[slug]/page.tsx');
}
