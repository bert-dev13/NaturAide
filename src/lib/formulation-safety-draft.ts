import { PLANT_ALIASES, queryLiterature, type LiteratureItem } from "@/lib/literature-service";

export type DraftProvenance = "LITERATURE" | "REFERENCE" | "PREDICTED" | "RESEARCHER INPUT";

export type DraftPaper = {
  pmid: string | null;
  doi: string | null;
  title: string;
  authors: string;
  journal: string;
  year: number | null;
  href: string | null;
  doiHref: string | null;
  topic: string;
  quote: string | null;
  relevanceScore: number;
};

export type SafetyAreaKey = "toxicity" | "contraindications" | "interactions" | "dose" | "formulation";

export type SafetyAreaDraft = {
  key: SafetyAreaKey;
  label: string;
  status: "ready" | "review";
  text: string;
  papers: DraftPaper[];
};

export type CompoundCarryForward = {
  name: string;
  formula: string | null;
  screening: boolean;
  docking: { line: string; provenance: "PREDICTED" | "EXTERNALLY GENERATED" }[];
};

export type FormulationSafetyAutomation = {
  prototypeName: string;
  formulationType: string | null;
  formulationTypeProvenance: DraftProvenance | null;
  dosageForm: string | null;
  dosageFormProvenance: DraftProvenance | null;
  compounds: CompoundCarryForward[];
  extraction: string | null;
  sopSteps: string[];
  areas: SafetyAreaDraft[];
  papers: DraftPaper[];
  rationale: string;
  literatureNote: string | null;
};

const NEEDS_REVIEW = "Needs Researcher Review";

const TOPIC_PATTERN: Record<SafetyAreaKey, RegExp> = {
  toxicity: /toxic|adverse|safety|ld50|hepatotox|nephrotox|cytotox|poison/i,
  contraindications: /contraindicat/i,
  interactions: /drug interaction|herb-drug|herb drug|pharmacokinetic interaction/i,
  dose: /\bdose\b|\bdosage\b|ld50|mg\/kg|mg\/day/i,
  formulation: /extract|formulation|macerat|solvent|preparation|dosage form/i,
};

function clip(value: string, max = 320) {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

function formatAffinity(value: unknown) {
  const numeric = typeof value === "number" ? value : parseFloat(String(value ?? "").replace("−", "-"));
  if (!Number.isFinite(numeric)) return String(value ?? "").trim();
  const digits = Math.abs(numeric).toFixed(3);
  if (numeric < 0) return `\u2212${digits}`;
  if (numeric > 0) return `+${digits}`;
  return digits;
}

function pubmedHref(pmid?: string | null) {
  return pmid && /^\d+$/.test(pmid) ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : null;
}

function doiHref(doi?: string | null) {
  const raw = String(doi || "").trim().replace(/^doi:/i, "");
  if (!raw || !/^10\.\d+\//.test(raw)) return null;
  return `https://doi.org/${raw}`;
}

function entityTerms(plantName: string, scientific: string | null, compoundNames: string[]) {
  const aliases = PLANT_ALIASES[(scientific || "").toLowerCase()] || [];
  return Array.from(
    new Set([plantName, scientific || "", ...aliases, ...compoundNames].map((term) => term.trim().toLowerCase()).filter((term) => term.length > 3))
  );
}

function sentencesOf(text: string, minimum = 40) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.replace(/\s+/g, " ").trim())
    .filter((sentence) => sentence.length >= minimum);
}

function quoteFor(item: LiteratureItem, entities: string[], pattern: RegExp) {
  const sentence = sentencesOf(item.abstract || "").find((line) => {
    const lower = line.toLowerCase();
    return pattern.test(line) && entities.some((entity) => lower.includes(entity));
  });
  return sentence ? clip(sentence) : null;
}

function referenceQuote(note: string, pattern: RegExp) {
  const matches = sentencesOf(note, 12).filter((sentence) => pattern.test(sentence));
  if (matches.length === 0) return "";
  return `REFERENCE · Plant record\n"${clip(matches.join(" "))}"`;
}

function mentionsEntity(item: LiteratureItem, entities: string[]) {
  const blob = `${item.title} ${item.abstract || ""}`.toLowerCase();
  return entities.some((entity) => blob.includes(entity));
}

function toPaper(item: LiteratureItem, topic: string, quote: string | null): DraftPaper {
  return {
    pmid: item.pmid || null,
    doi: item.doi || null,
    title: item.title,
    authors: item.authors && item.authors !== "NCBI Authors" ? item.authors : "",
    journal: item.journal || "",
    year: item.publicationYear || null,
    href: pubmedHref(item.pmid) || item.sourceUrl || null,
    doiHref: doiHref(item.doi),
    topic,
    quote,
    relevanceScore: item.relevanceScore || 0,
  };
}

function claimBlock(papers: DraftPaper[]) {
  return papers
    .filter((paper) => paper.quote && paper.pmid)
    .slice(0, 2)
    .map((paper) => `LITERATURE · PMID ${paper.pmid}\n"${paper.quote}"`)
    .join("\n\n");
}

async function mapPool<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>) {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()));
  return results;
}

function carriedCompounds(compounds: any[], runs: any[]) {
  const docked = new Set(runs.map((run) => String(run.ligandName || "").trim().toLowerCase()).filter(Boolean));
  const selected = compounds.filter(
    (compound) => Number(compound.selectedForDocking) === 1 || docked.has(String(compound.compoundName || "").trim().toLowerCase())
  );
  return (selected.length > 0 ? selected : compounds).filter((compound) => String(compound.compoundName || "").trim());
}

export async function buildFormulationSafetyDraft(input: {
  project: any;
  plantData: any;
  compounds: any[];
  screening: any[];
  dockingRuns: any[];
  formulation: any;
  plantPrecautions?: string | null;
}): Promise<FormulationSafetyAutomation> {
  const plantName = input.project?.plantName || "Unspecified Plant";
  const scientific = input.project?.plantScientificName || null;
  const compounds = carriedCompounds(input.compounds || [], input.dockingRuns || []);
  const compoundNames = compounds.map((compound) => String(compound.compoundName).trim());
  const entities = entityTerms(plantName, scientific, compoundNames);
  const plantQueryName = scientific || plantName;
  const entityQuery = [`"${plantQueryName}"[Title/Abstract]`, ...compoundNames.map((name) => `"${name}"[Title/Abstract]`)].join(" OR ");

  const searches: { key: SafetyAreaKey; query: string }[] = [
    { key: "toxicity", query: `"${plantQueryName}"[Title/Abstract] AND (toxicity OR toxic OR "adverse effect" OR safety)` },
    ...compoundNames.map((name) => ({
      key: "toxicity" as const,
      query: `"${name}"[Title/Abstract] AND (toxicity OR toxic OR "adverse effect" OR safety OR LD50)`,
    })),
    { key: "contraindications", query: `(${entityQuery}) AND (contraindication OR contraindicated)` },
    { key: "interactions", query: `(${entityQuery}) AND ("drug interaction" OR "herb-drug" OR "herb drug")` },
    { key: "dose", query: `(${entityQuery}) AND (dosage OR dose OR LD50 OR "mg/kg")` },
    { key: "formulation", query: `(${entityQuery}) AND (extraction OR formulation OR maceration OR "dosage form")` },
  ];

  let literatureFailed = false;
  const searchResults = await mapPool(searches, 2, async (search) => {
    try {
      const result = await queryLiterature(search.query, {
        stageKey: "formulation-safety",
        targetCompound: compoundNames.join(", ") || plantName,
        assayOrEndpoint: search.key,
        maxResults: 3,
        progressiveContext: {
          plantCommon: plantName,
          plantScientific: scientific,
          title: input.project?.title,
          objective: input.project?.researchObjective,
          question: input.project?.researchQuestion,
          areaOfInterest: input.project?.areaOfInterest,
        },
      });
      if (!result.success && result.status === "REQUEST_FAILED") literatureFailed = true;
      return { key: search.key, items: result.items || [] };
    } catch {
      literatureFailed = true;
      return { key: search.key, items: [] as LiteratureItem[] };
    }
  });

  const papersByArea: Record<SafetyAreaKey, DraftPaper[]> = {
    toxicity: [],
    contraindications: [],
    interactions: [],
    dose: [],
    formulation: [],
  };
  const seenByArea: Record<SafetyAreaKey, Set<string>> = {
    toxicity: new Set(),
    contraindications: new Set(),
    interactions: new Set(),
    dose: new Set(),
    formulation: new Set(),
  };

  for (const result of searchResults) {
    const pattern = TOPIC_PATTERN[result.key];
    const ranked = [...result.items].sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    for (const item of ranked) {
      if (!mentionsEntity(item, entities)) continue;
      const identity = item.pmid || item.title;
      if (seenByArea[result.key].has(identity)) continue;
      const quote = quoteFor(item, entities, pattern);
      if (!quote && !pattern.test(`${item.title} ${item.abstract || ""}`)) continue;
      seenByArea[result.key].add(identity);
      papersByArea[result.key].push(toPaper(item, result.key, quote));
    }
  }

  const precaution = String(input.plantPrecautions || "").replace(/\s+/g, " ").trim();
  const toxicityClaims = [referenceQuote(precaution, TOPIC_PATTERN.toxicity), claimBlock(papersByArea.toxicity)].filter(Boolean).join("\n\n");
  const contraindicationClaims = [referenceQuote(precaution, TOPIC_PATTERN.contraindications), claimBlock(papersByArea.contraindications)].filter(Boolean).join("\n\n");
  const interactionClaims = [referenceQuote(precaution, TOPIC_PATTERN.interactions), claimBlock(papersByArea.interactions)].filter(Boolean).join("\n\n");
  const formulationClaims = claimBlock(papersByArea.formulation);
  const doseContext = claimBlock(papersByArea.dose);

  const areas: SafetyAreaDraft[] = [
    {
      key: "toxicity",
      label: "Toxicity",
      status: toxicityClaims ? "ready" : "review",
      text: toxicityClaims || NEEDS_REVIEW,
      papers: papersByArea.toxicity,
    },
    {
      key: "contraindications",
      label: "Contraindications",
      status: contraindicationClaims ? "ready" : "review",
      text: contraindicationClaims || NEEDS_REVIEW,
      papers: papersByArea.contraindications,
    },
    {
      key: "interactions",
      label: "Interactions",
      status: interactionClaims ? "ready" : "review",
      text: interactionClaims || NEEDS_REVIEW,
      papers: papersByArea.interactions,
    },
    {
      key: "dose",
      label: "Dose",
      status: "review",
      text: [NEEDS_REVIEW, doseContext ? `Retrieved dose reports are context only and are not a formulation concentration.\n\n${doseContext}` : ""]
        .filter(Boolean)
        .join("\n\n"),
      papers: papersByArea.dose,
    },
    {
      key: "formulation",
      label: "Formulation Safety",
      status: formulationClaims ? "ready" : "review",
      text: formulationClaims || NEEDS_REVIEW,
      papers: papersByArea.formulation,
    },
  ];

  const paperIndex = new Map<string, DraftPaper>();
  for (const area of areas) {
    for (const paper of area.papers) {
      const identity = paper.pmid || paper.title;
      if (!paperIndex.has(identity)) paperIndex.set(identity, paper);
    }
  }
  const papers = [...paperIndex.values()].sort((a, b) => b.relevanceScore - a.relevanceScore);

  const method = String(input.plantData?.extractionMethod || "").trim();
  const solvent = String(input.plantData?.extractionSolvent || "").trim();
  const parts = String(input.plantData?.partsStudied || "").trim();
  const extractionBits = [
    parts ? `Plant part: ${parts}` : "",
    method ? `Method: ${method}` : "",
    solvent ? `Solvent: ${solvent}` : "",
  ].filter(Boolean);
  const extraction = extractionBits.length > 0 ? extractionBits.join(" · ") : null;
  const sopSteps = extraction
    ? [[parts && `Plant part on record: ${parts}.`, method && `Recorded extraction method: ${method}.`, solvent && `Recorded solvent: ${solvent}.`].filter(Boolean).join(" "), "Concentration, temperature, duration, and batch size are not on record. Needs Researcher Review."]
    : [];

  const savedType = String(input.formulation?.formulationType || "").trim();
  const savedDosage = String(input.formulation?.dosageFormType || "").trim();
  const savedName = String(input.formulation?.formulationName || "").trim();

  const compoundCards: CompoundCarryForward[] = compounds.map((compound) => {
    const name = String(compound.compoundName).trim();
    const key = name.toLowerCase();
    const screening =
      Number(compound.selectedForDocking) === 1 ||
      (input.screening || []).some((item) => String(item.compoundName || "").trim().toLowerCase() === key);
    const docking = (input.dockingRuns || [])
      .filter((run) => String(run.ligandName || "").trim().toLowerCase() === key)
      .map((run) => {
        const external = /external/i.test(String(run.resultProvenance || ""));
        const affinity = formatAffinity(run.bindingAffinity);
        const units = run.units || "kcal/mol";
        const target = run.targetProtein ? ` · ${run.targetProtein}` : "";
        return {
          line: `${affinity} ${units}${target}`,
          provenance: external ? ("EXTERNALLY GENERATED" as const) : ("PREDICTED" as const),
        };
      });
    return {
      name,
      formula: compound.molecularFormula || null,
      screening,
      docking,
    };
  });

  const dockingSentence = compoundCards
    .flatMap((compound) => compound.docking.map((run) => `${compound.name}: ${run.line} (${run.provenance})`))
    .join("; ");

  const rationaleLines = [
    `${savedName || `${plantName} research extract`} carries forward ${compoundNames.join(" and ") || "the selected compounds"} from Stage 2 screening and Stage 3 docking.`,
    dockingSentence
      ? `Stage 3 docking is ${dockingSentence}. These affinities are predicted binding scores and are not safety or efficacy evidence.`
      : "No Stage 3 docking affinity is available to carry forward.",
    extraction ? `Preparation on record: ${extraction}. REFERENCE` : "Preparation method: Needs Researcher Review.",
    savedDosage ? `Dosage form on record: ${savedDosage}. RESEARCHER INPUT` : "Dosage form: Needs Researcher Review.",
  ];
  for (const area of areas) {
    if (area.key === "dose") {
      rationaleLines.push("Dose and concentration: Needs Researcher Review. No concentration was derived.");
      continue;
    }
    const cited = area.papers.find((paper) => paper.quote && paper.pmid);
    rationaleLines.push(
      cited
        ? `${area.label}: "${cited.quote}" LITERATURE · PMID ${cited.pmid}.`
        : `${area.label}: Needs Researcher Review.`
    );
  }
  if (literatureFailed) {
    rationaleLines.push("Some literature searches could not be completed. Missing areas stay under researcher review.");
  }

  return {
    prototypeName: savedName || `${plantName} research extract`,
    formulationType: savedType || (extraction ? "Extract" : null),
    formulationTypeProvenance: savedType ? "RESEARCHER INPUT" : extraction ? "REFERENCE" : null,
    dosageForm: savedDosage || null,
    dosageFormProvenance: savedDosage ? "RESEARCHER INPUT" : null,
    compounds: compoundCards,
    extraction,
    sopSteps,
    areas,
    papers,
    rationale: rationaleLines.join("\n\n"),
    literatureNote: literatureFailed ? "Some PubMed searches could not be completed." : null,
  };
}
