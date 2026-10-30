import { callTogetherChat } from "@/lib/ai/together-provider";
import type { SafetyAreaKey } from "@/lib/formulation-safety-draft";

export type EvidenceStatus = "SUPPORTED" | "PARTIAL_EVIDENCE" | "INSUFFICIENT_EVIDENCE" | "RESEARCHER_INPUT_REQUIRED";

export type AiAssessment = {
  status: EvidenceStatus;
  summary: string;
  key_findings: string[];
  limitations: string;
  missing_inputs: string[];
  cited_reference_ids: string[];
};

export type SafetyAiPaper = {
  id: string;
  title: string;
  journal?: string;
  year?: number | null;
  pmid?: string | null;
  excerpt?: string | null;
};

export type SafetyAiContext = {
  area: SafetyAreaKey;
  plant: string;
  scientificName: string;
  formulationName: string;
  formulationType: string;
  dosageForm: string;
  purpose: string;
  plantPart: string;
  solvent: string;
  extraction: string;
  compounds: {
    name: string;
    formula?: string | null;
    concentration?: string;
    screening?: boolean;
    docking?: string[];
  }[];
  papers: SafetyAiPaper[];
};

const STATUSES = new Set<EvidenceStatus>([
  "SUPPORTED",
  "PARTIAL_EVIDENCE",
  "INSUFFICIENT_EVIDENCE",
  "RESEARCHER_INPUT_REQUIRED",
]);

const AREA_TASK: Record<SafetyAreaKey, string> = {
  toxicity: "Judge whether the supplied records contain toxicity or safety information for this plant or its constituents.",
  contraindications: "Judge whether the supplied records actually contain contraindication, warning, or avoid-population information. A paper that does not discuss that topic is not evidence for this category.",
  interactions: "Judge whether the supplied records contain interaction evidence. Computational or docking results are predicted context, not confirmation of a clinical interaction.",
  dose: "Judge whether a formulation dose or concentration can be stated. Never invent a number. A missing researcher-entered concentration is RESEARCHER_INPUT_REQUIRED even when dose papers were retrieved.",
  formulation: "Judge formulation-safety evidence for the recorded extract, solvent, and dosage form. A missing concentration or other required formulation input is RESEARCHER_INPUT_REQUIRED even when related papers were retrieved.",
};

function extractJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = (fenced?.[1] || text).trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("NO_JSON");
  return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
}

function asStringList(value: unknown, limit = 4) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || "").trim()).filter(Boolean).slice(0, limit);
}

function hasResearcherConcentration(context: SafetyAiContext) {
  return context.compounds.some((compound) => {
    const value = (compound.concentration || "").trim();
    return Boolean(value) && !/needs researcher/i.test(value);
  });
}

function canonicalStatus(value: unknown): EvidenceStatus | null {
  const text = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  const aliases: Record<string, EvidenceStatus> = {
    SUPPORTED: "SUPPORTED",
    PARTIAL: "PARTIAL_EVIDENCE",
    PARTIAL_EVIDENCE: "PARTIAL_EVIDENCE",
    INSUFFICIENT: "INSUFFICIENT_EVIDENCE",
    INSUFFICIENT_EVIDENCE: "INSUFFICIENT_EVIDENCE",
    RESEARCHER_INPUT: "RESEARCHER_INPUT_REQUIRED",
    RESEARCHER_INPUT_REQUIRED: "RESEARCHER_INPUT_REQUIRED",
  };
  return aliases[text] || null;
}

function normalizeAssessment(raw: Record<string, unknown>, context: SafetyAiContext): AiAssessment {
  const allowed = new Set(context.papers.map((paper) => paper.id));
  const cited = asStringList(raw.cited_reference_ids).filter((id) => allowed.has(id));
  let status = canonicalStatus(raw.status);
  let summary = String(raw.summary || "").replace(/\s+/g, " ").trim();
  let limitations = String(raw.limitations || raw.evidence_limitations || "").replace(/\s+/g, " ").trim();
  const findings = asStringList(raw.key_findings, 3);
  const missingInputs = asStringList(raw.missing_inputs, 4);
  const concentrationMissing = !hasResearcherConcentration(context);
  const inputGatesConclusion = context.area === "dose" || context.area === "formulation";

  if (!status) {
    if (inputGatesConclusion && concentrationMissing) status = "RESEARCHER_INPUT_REQUIRED";
    else if (context.papers.length === 0) status = "INSUFFICIENT_EVIDENCE";
    else status = "PARTIAL_EVIDENCE";
  }

  if (context.papers.length === 0 && status === "SUPPORTED") status = "INSUFFICIENT_EVIDENCE";
  if (context.papers.length === 0 && status === "PARTIAL_EVIDENCE" && !(inputGatesConclusion && concentrationMissing)) {
    status = "INSUFFICIENT_EVIDENCE";
  }

  if (!inputGatesConclusion && status === "RESEARCHER_INPUT_REQUIRED") {
    const onlyConcentration = missingInputs.length === 0 || missingInputs.every((item) => /concentrat|amount|dose/i.test(item));
    if (onlyConcentration) {
      const noCategoryEvidence = /do not (?:report|contain|discuss|address)|no (?:contraindication|interaction|toxicity)|not report/i.test(summary);
      status = noCategoryEvidence || context.papers.length === 0 ? "INSUFFICIENT_EVIDENCE" : "PARTIAL_EVIDENCE";
    }
  }

  if (inputGatesConclusion && concentrationMissing) {
    status = "RESEARCHER_INPUT_REQUIRED";
    if (!missingInputs.some((item) => /concentrat|amount|dose/i.test(item))) {
      missingInputs.unshift("Compound concentrations");
    }
  }

  if (/\b(is safe|proven safe|no safety risk|completely safe)\b/i.test(summary)) {
    if (status === "SUPPORTED") status = "PARTIAL_EVIDENCE";
    summary = summary.replace(/\b(is safe|proven safe|no safety risk|completely safe)\b/gi, "requires researcher review");
  }

  if (concentrationMissing && /\b\d+(?:\.\d+)?\s*(?:mg|g|mcg|µg|ug|ml|mL|%)\b/i.test(summary)) {
    summary = "Compound concentrations have not been specified, so a formulation dose cannot be stated.";
  }

  if (!summary) {
    summary =
      status === "RESEARCHER_INPUT_REQUIRED"
        ? "Required formulation information is missing, so this category cannot be assessed yet."
        : status === "PARTIAL_EVIDENCE"
          ? "Related evidence was retrieved, and it does not directly validate this formulation."
          : status === "SUPPORTED"
            ? "The supplied records directly address this category, with the stated limitation."
            : "No meaningful evidence for this category was retrieved.";
  }

  return {
    status,
    summary,
    key_findings: findings,
    limitations,
    missing_inputs: missingInputs,
    cited_reference_ids: cited,
  };
}

function contextBlock(context: SafetyAiContext) {
  const compounds = context.compounds
    .map((compound) => {
      const docking = (compound.docking || []).filter(Boolean);
      return [
        `- ${compound.name}${compound.formula ? ` (${compound.formula})` : ""}`,
        `  Screening advanced: ${compound.screening ? "yes" : "not recorded"}`,
        `  Researcher-entered concentration: ${compound.concentration?.trim() || "not provided"}`,
        docking.length ? `  Docking, PREDICTED only, not safety or efficacy evidence: ${docking.join(" | ")}` : "  Docking: none supplied",
      ].join("\n");
    })
    .join("\n");

  const papers = context.papers.length
    ? context.papers
        .map((paper) => {
          const excerpt = paper.excerpt?.trim();
          return `- id: ${paper.id}; title: ${paper.title}; source: ${[paper.journal, paper.year].filter(Boolean).join(" ") || "not recorded"}; pmid: ${paper.pmid || "none"}${excerpt ? `; excerpt: ${excerpt}` : ""}`;
        })
        .join("\n")
    : "- none";

  return `Plant: ${context.plant}
Scientific name: ${context.scientificName || "not recorded"}
Formulation: ${context.formulationName || "not recorded"}
Type: ${context.formulationType || "not recorded"}
Dosage form: ${context.dosageForm || "not recorded"}
Purpose: ${context.purpose || "not recorded"}
Plant part: ${context.plantPart || "not recorded"}
Solvent: ${context.solvent || "not recorded"}
Extraction: ${context.extraction || "not recorded"}

Compounds:
${compounds || "- none"}

Retrieved literature for this category only:
${papers}`;
}

const SYSTEM = `You are NatureAide's research safety assistant. Use only the structured context in the user message.
Return one JSON object and no other text.
Fields:
- status: one of SUPPORTED, PARTIAL_EVIDENCE, INSUFFICIENT_EVIDENCE, RESEARCHER_INPUT_REQUIRED
- summary: 1 or 2 sentences
- key_findings: up to 3 short strings taken from the supplied records
- limitations: one sentence
- missing_inputs: array of missing researcher inputs, or an empty array
- cited_reference_ids: ids copied from the supplied literature, or an empty array

Before choosing a status, judge:
1. whether each supplied record is relevant to this category
2. whether the evidence is direct or only related
3. the limitation of that evidence
4. which researcher inputs are missing
5. whether a meaningful conclusion can actually be made

Status meanings:
- SUPPORTED: at least one supplied study directly addresses this category for this plant or constituent. State the limit. Do not call the formulation safe.
- PARTIAL_EVIDENCE: relevant or related evidence exists, but it does not directly validate this exact formulation, solvent, dose, or preparation. Related evidence with limitations is PARTIAL_EVIDENCE.
- INSUFFICIENT_EVIDENCE: no meaningful relevant evidence for this category was retrieved. Use this when supplied papers do not contain information on the question.
- RESEARCHER_INPUT_REQUIRED: evidence may exist, but a required researcher input is missing, especially compound concentration or dose, so the formulation cannot be assessed yet.

Rules:
- Do not treat "not specific to this exact formulation" as INSUFFICIENT_EVIDENCE when the study is still about the same plant, constituent, or safety question. That is PARTIAL_EVIDENCE.
- Do not use SUPPORTED for docking-only or computational-only results. Label those PREDICTED and use PARTIAL_EVIDENCE at most.
- If compound concentration is not provided, dose and formulation safety must be RESEARCHER_INPUT_REQUIRED. Do not invent a dose or concentration.
- Do not use RESEARCHER_INPUT_REQUIRED for toxicity, contraindications, or interactions only because a concentration is missing. Classify those from the literature: related evidence is PARTIAL_EVIDENCE, and papers that do not address the category are INSUFFICIENT_EVIDENCE.
- Do not invent references, PMIDs, contraindications, interactions, or safety conclusions.
- Every cited_reference_ids value must be an id from the supplied literature.
- Do not use the word "safe" as a conclusion.
- Stage 3 docking values are PREDICTED computational context. They are not proof of safety, efficacy, toxicity, or clinical effect.`;

export async function assessSafetyArea(context: SafetyAiContext): Promise<AiAssessment> {
  const result = await callTogetherChat(
    [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: `Category: ${context.area}
Task: ${AREA_TASK[context.area]}

${contextBlock(context)}`,
      },
    ],
    { json: true, maxTokens: 4096, temperature: 0.2 }
  );

  if (!result.success || !result.content) {
    console.error("Together safety assessment failed:", result.error || "REQUEST_FAILED", result.model);
    throw new Error("The assessment could not be generated.");
  }

  try {
    return normalizeAssessment(extractJson(result.content), context);
  } catch (error) {
    console.error(
      "Together safety assessment parse failed:",
      result.model,
      error instanceof Error ? error.message : "PARSE",
      result.content.slice(0, 240)
    );
    throw new Error("The assessment could not be generated.");
  }
}

export async function synthesizeSafety(input: {
  plant: string;
  formulationName: string;
  areas: { key: SafetyAreaKey; summary: string; status: EvidenceStatus }[];
  referenceCount: number;
}): Promise<string> {
  const counts = {
    SUPPORTED: input.areas.filter((area) => area.status === "SUPPORTED").length,
    PARTIAL_EVIDENCE: input.areas.filter((area) => area.status === "PARTIAL_EVIDENCE").length,
    INSUFFICIENT_EVIDENCE: input.areas.filter((area) => area.status === "INSUFFICIENT_EVIDENCE").length,
    RESEARCHER_INPUT_REQUIRED: input.areas.filter((area) => area.status === "RESEARCHER_INPUT_REQUIRED").length,
  };

  const result = await callTogetherChat(
    [
      {
        role: "system",
        content:
          'You write a short research synthesis from supplied safety assessments. Return JSON: {"synthesis":"..."}. Use 2 sentences in plain language. Describe what is known, what is uncertain, and what the researcher still needs to provide. Do not name status labels such as SUPPORTED, PARTIAL_EVIDENCE, INSUFFICIENT_EVIDENCE, or RESEARCHER_INPUT_REQUIRED, and do not recite status counts. Do not invent references, doses, or a safety approval. Do not describe docking scores as safety evidence.',
      },
      {
        role: "user",
        content: `Plant: ${input.plant}
Formulation: ${input.formulationName}
Retrieved references available to the project: ${input.referenceCount}
Status counts: ${counts.SUPPORTED} supported, ${counts.PARTIAL_EVIDENCE} partial evidence, ${counts.INSUFFICIENT_EVIDENCE} insufficient, ${counts.RESEARCHER_INPUT_REQUIRED} need researcher input.
Assessments:
${input.areas.map((area) => `- ${area.key} (${area.status}): ${area.summary}`).join("\n")}`,
      },
    ],
    { json: true, maxTokens: 500, temperature: 0.2 }
  );

  if (!result.success || !result.content) {
    throw new Error("The synthesis could not be generated.");
  }

  try {
    const parsed = extractJson(result.content);
    const synthesis = String(parsed.synthesis || "").replace(/\s+/g, " ").trim();
    if (!synthesis) throw new Error("The synthesis could not be generated.");
    return synthesis;
  } catch (error) {
    console.error(
      "Together safety synthesis parse failed:",
      result.model,
      error instanceof Error ? error.message : "PARSE",
      result.content.slice(0, 240)
    );
    throw new Error("The synthesis could not be generated.");
  }
}
