const fs = require('fs');

const path = 'src/app/community/products/[slug]/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Update query
const oldQuery = `  // 6. Query Scientific Evidence & References (Normalized join)
  const [referenceRows]: any = await pool.query(
    \`SELECT sr.id, sr.title, sr.authors, sr.publicationYear, sr.journalOrPublisher,
            sr.studyType, sr.doi, sr.pubmedId, sr.sourceUrl, sr.shortSummary,
            sr.plantOrIngredientStudied, sr.isExactProductStudied,
            pr.evidenceClassification, pr.evidenceNote
     FROM product_references pr
     JOIN scientific_references sr ON sr.id = pr.referenceId
     WHERE pr.productId = ?
     ORDER BY sr.isExactProductStudied DESC, sr.publicationYear DESC\`,
    [product.id]
  );`;

const newQuery = `  // 6. Query Scientific Evidence & References (Normalized join - strictly source_verified = 1)
  const [referenceRows]: any = await pool.query(
    \`SELECT sr.id, sr.title, sr.authors, sr.publicationYear, sr.journalOrPublisher,
            sr.studyType, sr.doi, sr.pubmedId, sr.sourceUrl, sr.shortSummary,
            sr.plantOrIngredientStudied, sr.isExactProductStudied,
            sr.source_verified, sr.evidence_scope, sr.botanical_identity_verified,
            pr.evidenceClassification, pr.evidenceNote
     FROM product_references pr
     JOIN scientific_references sr ON sr.id = pr.referenceId
     WHERE pr.productId = ? AND sr.source_verified = 1
     ORDER BY sr.isExactProductStudied DESC, sr.publicationYear DESC\`,
    [product.id]
  );`;

code = code.replace(oldQuery, newQuery);

// 2. Update isVerifiedScientificReference
const oldVerifiedFn = `function isVerifiedScientificReference(ref: any): boolean {
  if (!ref || !ref.id) return false;
  if (!ref.title || typeof ref.title !== "string" || ref.title.trim().length === 0) return false;`;

const newVerifiedFn = `function isVerifiedScientificReference(ref: any): boolean {
  if (!ref || !ref.id) return false;
  if (!ref.title || typeof ref.title !== "string" || ref.title.trim().length === 0) return false;
  if (ref.source_verified !== 1 && ref.source_verified !== true) return false;`;

code = code.replace(oldVerifiedFn, newVerifiedFn);

// 3. Update the reference rendering card in products page
const oldBadgeBlock = `                      {ref.studyType && (
                        <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[10px] font-bold">
                          {ref.studyType}
                        </span>
                      )}`;

const newBadgeBlock = `                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-extrabold flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" />
                        <span>Source Verified</span>
                      </span>

                      {ref.evidence_scope === "MULTI_INGREDIENT_EVIDENCE" ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold">
                          ? MULTI_INGREDIENT_EVIDENCE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-900 border border-teal-200 text-[10px] font-bold">
                          Single Botanical Evidence
                        </span>
                      )}

                      {ref.studyType && (
                        <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[10px] font-bold">
                          {ref.studyType}
                        </span>
                      )}`;

code = code.replace(oldBadgeBlock, newBadgeBlock);

// 4. Update multi-ingredient cautionary note in product reference card
const oldSummaryBlock = `                    {ref.shortSummary && (
                      <div className="p-3 rounded-xl bg-white border border-[#dde6df] text-xs text-[#3d4a45] space-y-1">
                        <strong className="text-[#0f2c20] block text-[11px]">
                          Evidence Summary:
                        </strong>
                        <p className="leading-relaxed">{ref.shortSummary}</p>
                      </div>
                    )}`;

const newSummaryBlock = `                    {ref.evidence_scope === "MULTI_INGREDIENT_EVIDENCE" && (
                      <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 text-[11px] leading-relaxed">
                        <strong>Multi-Ingredient Evidence:</strong> This study evaluates a multi-herbal formulation and does not independently prove single-ingredient efficacy.
                      </div>
                    )}

                    {ref.shortSummary && (
                      <div className="p-3 rounded-xl bg-white border border-[#dde6df] text-xs text-[#3d4a45] space-y-1">
                        <strong className="text-[#0f2c20] block text-[11px]">
                          Evidence Summary:
                        </strong>
                        <p className="leading-relaxed">{ref.shortSummary}</p>
                      </div>
                    )}`;

code = code.replace(oldSummaryBlock, newSummaryBlock);

fs.writeFileSync(path, code, 'utf8');
console.log('Successfully updated src/app/community/products/[slug]/page.tsx');
