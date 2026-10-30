const fs = require('fs');

const path = 'src/components/community/PlantDetailSections.tsx';
let code = fs.readFileSync(path, 'utf8');

// Update interface
const oldInterface = `  references?: Array<{
    id: number;
    title: string;
    authors?: string;
    year?: number;
    journalSource?: string;
    doiOrUrl?: string;
    studyType?: string;
    keyFindings?: string;
  }>;`;

const newInterface = `  references?: Array<{
    id: string | number;
    title: string;
    authors?: string;
    year?: number;
    journalSource?: string;
    doiOrUrl?: string;
    studyType?: string;
    plantOrCompound?: string;
    keyFindings?: string;
    pubmedId?: string;
    doi?: string;
    source_verified?: number | boolean;
    evidence_scope?: string;
    botanical_identity_verified?: number | boolean;
  }>;`;

code = code.replace(oldInterface, newInterface);

// Update WHAT RESEARCH SAYS accordion
const oldResearchSection = `          {/* WHAT RESEARCH SAYS */}
          <AccordionItem
            id="research"
            title="Scientifically Validated Evidence"
            icon={<Microscope className="w-5 h-5 text-teal-700" />}
            isOpen={openSections.research}
            onToggle={() => toggleSection("research")}
          >
            {guide?.whatResearchSays ? (
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-900 border border-teal-200 text-[10px] font-extrabold uppercase tracking-wider">
                  Laboratory & Clinical Pharmacognosy
                </span>
                <p className="text-sm sm:text-base text-[#3d4a45] leading-relaxed">
                  {guide.whatResearchSays}
                </p>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-[#78997f] italic leading-relaxed">
                Verified information is not currently available in the NatureAide knowledge base.
              </p>
            )}
          </AccordionItem>`;

const newResearchSection = `          {/* WHAT RESEARCH SAYS */}
          <AccordionItem
            id="research"
            title="Scientifically Validated Evidence"
            icon={<Microscope className="w-5 h-5 text-teal-700" />}
            isOpen={openSections.research}
            onToggle={() => toggleSection("research")}
          >
            {references.length > 0 && guide?.whatResearchSays ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 text-[10px] font-extrabold uppercase tracking-wider">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Verified Botanical Evidence ({references.length} {references.length === 1 ? "Study" : "Studies"})
                  </span>
                  {references.some((r) => r.evidence_scope === "MULTI_INGREDIENT_EVIDENCE") && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold">
                      Includes Multi-Ingredient Studies
                    </span>
                  )}
                </div>
                <p className="text-sm sm:text-base text-[#3d4a45] leading-relaxed">
                  {guide.whatResearchSays}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[#faf9f5] border border-dashed border-[#dde6df] text-center space-y-1">
                <p className="text-xs sm:text-sm text-[#78997f] italic leading-relaxed font-medium">
                  Verified scientific evidence is not currently available in the NatureAide knowledge base.
                </p>
                <p className="text-[11px] text-[#52796f]">
                  Scientific accuracy is prioritized: unverified citations or mismatched species have been removed.
                </p>
              </div>
            )}
          </AccordionItem>`;

code = code.replace(oldResearchSection, newResearchSection);

// Update REFERENCES accordion
const oldReferencesSection = `          {/* SCIENTIFIC REFERENCES */}
          <AccordionItem
            id="references"
            title="Scientific References"
            icon={<BookOpen className="w-5 h-5 text-indigo-700" />}
            isOpen={openSections.references}
            onToggle={() => toggleSection("references")}
          >
            {references.length === 0 ? (
              <p className="text-xs sm:text-sm text-[#78997f] italic leading-relaxed">
                Verified information is not currently available in the NatureAide knowledge base.
              </p>
            ) : (
              <div className="space-y-3">
                {references.map((ref) => (
                  <div
                    key={ref.id}
                    className="p-3.5 rounded-2xl bg-[#faf9f5] border border-[#dde6df] space-y-1.5 text-xs"
                  >
                    <p className="font-bold text-[#0f2c20] leading-snug">{ref.title}</p>
                    <p className="text-[#52796f]">
                      {ref.authors} {ref.year ? \`(\${ref.year})\` : ""} &bull; {ref.journalSource}
                    </p>
                    {ref.studyType && (
                      <span className="inline-block px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 text-[10px] font-bold">
                        {ref.studyType} Study
                      </span>
                    )}
                    {ref.keyFindings && (
                      <p className="text-[#3d4a45] mt-1 text-[11px] leading-relaxed">
                        <strong>Key findings:</strong> {ref.keyFindings}
                      </p>
                    )}
                    {ref.doiOrUrl && (
                      <a
                        href={ref.doiOrUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:underline font-semibold mt-1"
                      >
                        <span>View Publication Source</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </AccordionItem>`;

const newReferencesSection = `          {/* SCIENTIFIC REFERENCES */}
          <AccordionItem
            id="references"
            title="Scientific References"
            icon={<BookOpen className="w-5 h-5 text-indigo-700" />}
            isOpen={openSections.references}
            onToggle={() => toggleSection("references")}
          >
            {references.length === 0 ? (
              <div className="p-4 rounded-2xl bg-[#faf9f5] border border-dashed border-[#dde6df] text-center space-y-1">
                <p className="text-xs sm:text-sm text-[#78997f] italic leading-relaxed font-medium">
                  Verified scientific evidence is not currently available in the NatureAide knowledge base.
                </p>
                <p className="text-[11px] text-[#52796f]">
                  Scientific accuracy is prioritized over unverified citations. Only NCBI PubMed records with verified botanical identity are displayed.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {references.map((ref) => {
                  const isMultiIngredient = ref.evidence_scope === "MULTI_INGREDIENT_EVIDENCE";
                  return (
                    <div
                      key={ref.id}
                      className="p-3.5 rounded-2xl bg-[#faf9f5] border border-[#dde6df] space-y-2 text-xs"
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-extrabold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          Source Verified
                        </span>

                        {isMultiIngredient ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold">
                            ? MULTI_INGREDIENT_EVIDENCE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 text-teal-900 border border-teal-200 text-[10px] font-bold">
                            Single Botanical Evidence
                          </span>
                        )}

                        {ref.studyType && (
                          <span className="inline-block px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-bold">
                            {ref.studyType}
                          </span>
                        )}

                        {ref.pubmedId && (
                          <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200 text-[10px] font-mono font-bold">
                            PMID: {ref.pubmedId}
                          </span>
                        )}
                      </div>

                      <p className="font-bold text-[#0f2c20] leading-snug">{ref.title}</p>
                      <p className="text-[#52796f]">
                        {ref.authors} {ref.year ? \`(\${ref.year})\` : ""} &bull; <em>{ref.journalSource}</em>
                      </p>

                      {isMultiIngredient && (
                        <p className="p-2 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 text-[11px] leading-relaxed">
                          <strong>Multi-Ingredient Study:</strong> Evaluates a multi-herbal formulation and does not independently prove single-ingredient efficacy.
                        </p>
                      )}

                      {ref.keyFindings && (
                        <p className="text-[#3d4a45] mt-1 text-[11px] leading-relaxed">
                          <strong>Key findings:</strong> {ref.keyFindings}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                        {ref.plantOrCompound && (
                          <span className="text-[#52796f]">
                            Studied: <strong className="text-[#0f2c20]">{ref.plantOrCompound}</strong>
                          </span>
                        )}

                        {ref.doiOrUrl && (
                          <a
                            href={ref.doiOrUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-950 hover:underline font-bold"
                          >
                            <span>View PubMed Source</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </AccordionItem>`;

code = code.replace(oldReferencesSection, newReferencesSection);

fs.writeFileSync(path, code, 'utf8');
console.log('Successfully updated src/components/community/PlantDetailSections.tsx');
