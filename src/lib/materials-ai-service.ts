/**
 * NatureAide V2 — AI-Assisted Materials Recommendation Service
 * Provides contextual candidate materials based on project plant details,
 * extraction parameters, product category, dosage form, and phytochemicals.
 * Uses deterministic catalog grounding first with AI contextual enrichment.
 */

import { callTogetherChat } from "@/lib/ai/together-provider";
import { MaterialTypeKey } from "@/lib/materials-catalog";
import { generateExtractFractionId } from "@/lib/extraction-catalog";

export interface MaterialRecommendation {
  id: string;
  materialName: string;
  materialType: MaterialTypeKey;
  functionalRole: string;
  suggestedGrade: string;
  suggestedUnit: string;
  scientificJustification: string;
  compatibilityNotes: string;
  source: "AI_RECOMMENDATION" | "AI Suggested" | string;
  inventoryStatus: "PLANNED" | "AVAILABLE" | "RESERVED";
  extractFractionId?: string | null;
  supplierOrSource?: string | null;
  lotOrBatchNumber?: string | null;
  quantityAvailable?: number | null;
  confidenceScore?: number;
  supportingReferences?: string[];
}

export interface MaterialsRecommendationContext {
  projectId: number;
  plantName: string;
  plantScientificName?: string;
  scientificName?: string;
  plantParts?: string;
  selectedPlantParts?: string[] | string;
  extractionMethod?: string;
  extractionSolvent?: string;
  solventConcentration?: string;
  extractFractionName?: string;
  extractFractionId?: string;
  productCategory?: string;
  productType?: string;
  dosageForm?: string;
  deliveryFormat?: string;
  targetApplication?: string;
  targetApplications?: string;
  intendedPopulation?: string;
  knownCompounds?: string[];
  verifiedPhytochemicals?: Array<{
    compoundName: string;
    compoundClass?: string;
    molecularFormula?: string;
  }>;
}

// Alias for convenience
export type MaterialRecommendationContext = MaterialsRecommendationContext;

/**
 * Deterministic grounding layer: generates candidate materials based on
 * established pharmaceutical and pharmacopeial standards.
 */
export function buildDeterministicMaterials(
  context: MaterialsRecommendationContext
): MaterialRecommendation[] {
  const plantName = (context.plantName || "Botanical").trim();
  const plantParts = (
    Array.isArray(context.selectedPlantParts)
      ? context.selectedPlantParts.join(", ")
      : context.plantParts || context.selectedPlantParts || "Leaves"
  ).trim();
  const dosageForm = (context.dosageForm || context.deliveryFormat || "Topical Hydrogel").trim();
  const formLower = dosageForm.toLowerCase();
  const solvent = (context.extractionSolvent || "70% Ethanol").trim();
  const method = (context.extractionMethod || "Standardized Extraction").trim();
  const extractId =
    context.extractFractionName && context.extractFractionName.trim()
      ? context.extractFractionName.trim()
      : context.extractFractionId && context.extractFractionId.trim()
      ? context.extractFractionId.trim()
      : generateExtractFractionId(plantName);

  const recommendations: MaterialRecommendation[] = [];

  // 1. Active Botanical Candidate (Linked to Step 3 Extraction)
  recommendations.push({
    id: `rec-botanical-${Date.now()}-1`,
    materialName: `${plantName} ${plantParts} Extract`,
    materialType: "ACTIVE_BOTANICAL",
    functionalRole: "Active Botanical / Therapeutic Constituent",
    suggestedGrade: "Standardized Botanical Extract (PHP / USP)",
    suggestedUnit: "g",
    scientificJustification: `Primary therapeutic extract obtained via ${method} using ${solvent}. Contains marker bioactives targeted for ${context.targetApplication || "therapeutic application"}.`,
    compatibilityNotes: "Maintain matrix pH between 5.0 and 6.8 to avoid precipitation of secondary metabolites or phenolic complexes.",
    source: "AI_RECOMMENDATION",
    inventoryStatus: "PLANNED",
    extractFractionId: extractId,
    supportingReferences: [
      "Philippine Herbal Pharmacopeia (PHP) Monograph",
      "USP <561> Articles of Botanical Origin",
    ],
  });

  // 2. Functional Excipients tailored to dosage form
  if (formLower.includes("hydrogel") || formLower.includes("gel")) {
    recommendations.push(
      {
        id: `rec-excipient-${Date.now()}-2`,
        materialName: "Carbomer 940",
        materialType: "EXCIPIENT",
        functionalRole: "Primary Gelling Agent / Matrix Builder",
        suggestedGrade: "USP / NF (Compendial Grade)",
        suggestedUnit: "g",
        scientificJustification:
          "Crosslinked polyacrylate polymer yielding high optical clarity, viscoelastic rheology, and sustained topical release without greasy residue.",
        compatibilityNotes:
          "Requires neutralization with alkaline agents (e.g. TEA) to pH 5.5–6.5 for maximum gel viscosity. Sensitive to high polyvalent cation concentrations.",
        source: "AI_RECOMMENDATION",
        inventoryStatus: "PLANNED",
        supportingReferences: ["Handbook of Pharmaceutical Excipients — Carbomer Monograph"],
      },
      {
        id: `rec-excipient-${Date.now()}-3`,
        materialName: "Triethanolamine (TEA)",
        materialType: "EXCIPIENT",
        functionalRole: "pH Neutralizer & Polymer Crosslinking Clarifier",
        suggestedGrade: "NF / Reagent Grade",
        suggestedUnit: "mL",
        scientificJustification:
          "Organic tertiary amine providing precise neutralization of acidic polyacrylic polymer carboxylic groups, inducing polymer uncoiling and gel formation.",
        compatibilityNotes:
          "Add dropwise with gentle stirring to prevent air entrapment. Maintain finished product pH below 7.0 for optimal skin tolerability.",
        source: "AI_RECOMMENDATION",
        inventoryStatus: "PLANNED",
        supportingReferences: ["USP–NF Triethanolamine Monograph"],
      },
      {
        id: `rec-excipient-${Date.now()}-4`,
        materialName: "Glycerin",
        materialType: "EXCIPIENT",
        functionalRole: "Humectant & Plasticizer",
        suggestedGrade: "USP / NF (Compendial Grade)",
        suggestedUnit: "mL",
        scientificJustification:
          "Trihydroxy sugar alcohol that retains dermal moisture, prevents premature hydrogel evaporation, and provides smooth tactile spreadability.",
        compatibilityNotes:
          "Highly hygroscopic. Compatible with typical hydroethanolic plant fractions and carbomer systems.",
        source: "AI_RECOMMENDATION",
        inventoryStatus: "PLANNED",
        supportingReferences: ["Handbook of Pharmaceutical Excipients — Glycerin Monograph"],
      },
      {
        id: `rec-solvent-${Date.now()}-5`,
        materialName: "Purified Water (USP)",
        materialType: "SOLVENT",
        functionalRole: "Continuous Hydrophilic Vehicle (q.s.)",
        suggestedGrade: "USP (Deionized / Microbial Tested)",
        suggestedUnit: "mL",
        scientificJustification:
          "High-purity aqueous menstruum and continuous carrier phase ensuring hydration of water-soluble phytochemicals and excipient hydration.",
        compatibilityNotes:
          "Must comply with USP purified water conductivity and microbial limits (<100 CFU/mL).",
        source: "AI_RECOMMENDATION",
        inventoryStatus: "PLANNED",
        supportingReferences: ["USP <1231> Water for Pharmaceutical Purposes"],
      },
      {
        id: `rec-preservative-${Date.now()}-6`,
        materialName: "Phenoxyethanol",
        materialType: "PRESERVATIVE",
        functionalRole: "Antimicrobial Preservative",
        suggestedGrade: "USP / Cosmetic Grade",
        suggestedUnit: "mL",
        scientificJustification:
          "Broad-spectrum preservative active against Gram-negative bacteria, molds, and yeasts in aqueous topical formulations.",
        compatibilityNotes:
          "Effective across pH 4.0–8.0. Compatible with anionic carbomers and nonionic botanical extracts.",
        source: "AI_RECOMMENDATION",
        inventoryStatus: "PLANNED",
        supportingReferences: ["USP <51> Antimicrobial Effectiveness Testing"],
      }
    );
  } else if (formLower.includes("cream") || formLower.includes("lotion") || formLower.includes("emulsion")) {
    recommendations.push(
      {
        id: `rec-excipient-${Date.now()}-2`,
        materialName: "Cetearyl Alcohol & Ceteareth-20",
        materialType: "EXCIPIENT",
        functionalRole: "Nonionic Emulsifying Wax",
        suggestedGrade: "USP / NF",
        suggestedUnit: "g",
        scientificJustification:
          "Self-emulsifying nonionic blend that stabilizes oil-in-water emulsions and produces smooth, stable creams.",
        compatibilityNotes: "Requires heating oil and water phases to 70–75°C prior to emulsification.",
        source: "AI_RECOMMENDATION",
        inventoryStatus: "PLANNED",
      },
      {
        id: `rec-excipient-${Date.now()}-3`,
        materialName: "Caprylic/Capric Triglycerides",
        materialType: "EXCIPIENT",
        functionalRole: "Emollient / Oil Phase Carrier",
        suggestedGrade: "USP / NF",
        suggestedUnit: "mL",
        scientificJustification:
          "Lightweight medium-chain ester providing dermal emolliency and dissolving moderately lipophilic phytochemicals.",
        compatibilityNotes: "Highly stable against oxidative rancidity; excellent spreadability.",
        source: "AI_RECOMMENDATION",
        inventoryStatus: "PLANNED",
      },
      {
        id: `rec-excipient-${Date.now()}-4`,
        materialName: "Glycerin",
        materialType: "EXCIPIENT",
        functionalRole: "Aqueous Humectant",
        suggestedGrade: "USP / NF",
        suggestedUnit: "mL",
        scientificJustification: "Maintains skin hydration and humectancy in the aqueous phase.",
        compatibilityNotes: "Dissolve in aqueous phase prior to heating.",
        source: "AI_RECOMMENDATION",
        inventoryStatus: "PLANNED",
      },
      {
        id: `rec-solvent-${Date.now()}-5`,
        materialName: "Purified Water (USP)",
        materialType: "SOLVENT",
        functionalRole: "Continuous Aqueous Phase (q.s.)",
        suggestedGrade: "USP Grade",
        suggestedUnit: "mL",
        scientificJustification: "Main carrier for aqueous botanical extract.",
        compatibilityNotes: "Heat to 75°C for emulsion formation.",
        source: "AI_RECOMMENDATION",
        inventoryStatus: "PLANNED",
      },
      {
        id: `rec-preservative-${Date.now()}-6`,
        materialName: "Phenoxyethanol",
        materialType: "PRESERVATIVE",
        functionalRole: "Antimicrobial Preservative",
        suggestedGrade: "USP Grade",
        suggestedUnit: "mL",
        scientificJustification: "Prevents bacterial and fungal growth in high-water emulsion systems.",
        compatibilityNotes: "Incorporate during cooldown phase (<45°C) to prevent thermal degradation.",
        source: "AI_RECOMMENDATION",
        inventoryStatus: "PLANNED",
      }
    );
  } else if (formLower.includes("ointment")) {
    recommendations.push(
      {
        id: `rec-excipient-${Date.now()}-2`,
        materialName: "White Petrolatum (USP)",
        materialType: "EXCIPIENT",
        functionalRole: "Hydrocarbon Ointment Base / Occlusive",
        suggestedGrade: "USP / NF",
        suggestedUnit: "g",
        scientificJustification:
          "Occlusive hydrophobic matrix providing prolonged dermal contact and transepidermal water loss reduction.",
        compatibilityNotes: "Lipophilic; poorly miscible with pure water without co-emulsifiers.",
        source: "AI_RECOMMENDATION",
        inventoryStatus: "PLANNED",
      },
      {
        id: `rec-excipient-${Date.now()}-3`,
        materialName: "Cetyl Alcohol",
        materialType: "EXCIPIENT",
        functionalRole: "Stiffening Agent & Viscosity Builder",
        suggestedGrade: "USP / NF",
        suggestedUnit: "g",
        scientificJustification: "Elevates melting point and structural rigidity of hydrocarbon bases.",
        compatibilityNotes: "Melt with petrolatum at 65°C.",
        source: "AI_RECOMMENDATION",
        inventoryStatus: "PLANNED",
      },
      {
        id: `rec-excipient-${Date.now()}-4`,
        materialName: "Mineral Oil",
        materialType: "EXCIPIENT",
        functionalRole: "Levigating Agent & Plasticizer",
        suggestedGrade: "USP Grade",
        suggestedUnit: "mL",
        scientificJustification: "Facilitates incorporation of powdered extracts into ointment bases.",
        compatibilityNotes: "Use for smooth trituration of active dry botanical residues.",
        source: "AI_RECOMMENDATION",
        inventoryStatus: "PLANNED",
      }
    );
  } else if (formLower.includes("syrup") || formLower.includes("solution") || formLower.includes("oral")) {
    recommendations.push(
      {
        id: `rec-excipient-${Date.now()}-2`,
        materialName: "Simple Syrup 66.7% (USP)",
        materialType: "EXCIPIENT",
        functionalRole: "Viscosity Builder & Sweetener",
        suggestedGrade: "USP / NF",
        suggestedUnit: "mL",
        scientificJustification: "High-osmolarity aqueous sucrose solution masking bitter plant principles.",
        compatibilityNotes: "High osmotic pressure inhibits vegetative microbial proliferation.",
        source: "AI_RECOMMENDATION",
        inventoryStatus: "PLANNED",
      },
      {
        id: `rec-preservative-${Date.now()}-3`,
        materialName: "Sodium Benzoate",
        materialType: "PRESERVATIVE",
        functionalRole: "Antimicrobial Preservative",
        suggestedGrade: "USP / Food Grade",
        suggestedUnit: "g",
        scientificJustification: "Antifungal and antibacterial agent active in acidic aqueous oral liquids.",
        compatibilityNotes: "Active below pH 4.5. Adjust pH with citric acid if necessary.",
        source: "AI_RECOMMENDATION",
        inventoryStatus: "PLANNED",
      },
      {
        id: `rec-solvent-${Date.now()}-4`,
        materialName: "Purified Water (USP)",
        materialType: "SOLVENT",
        functionalRole: "Continuous Diluent Vehicle (q.s.)",
        suggestedGrade: "USP Grade",
        suggestedUnit: "mL",
        scientificJustification: "Solvent carrier for oral liquid compounding.",
        compatibilityNotes: "Microbially certified for oral pharmaceutical solutions.",
        source: "AI_RECOMMENDATION",
        inventoryStatus: "PLANNED",
      }
    );
  } else if (formLower.includes("capsule") || formLower.includes("tablet")) {
    recommendations.push(
      {
        id: `rec-excipient-${Date.now()}-2`,
        materialName: "Microcrystalline Cellulose (MCC PH-102)",
        materialType: "EXCIPIENT",
        functionalRole: "Dry Diluent & Tablet/Capsule Binder",
        suggestedGrade: "USP / NF",
        suggestedUnit: "g",
        scientificJustification:
          "Directly compressible diluent with excellent flowability and rapid disintegration properties.",
        compatibilityNotes: "Store in tightly closed container; low hygroscopicity.",
        source: "AI_RECOMMENDATION",
        inventoryStatus: "PLANNED",
      },
      {
        id: `rec-excipient-${Date.now()}-3`,
        materialName: "Colloidal Silicon Dioxide (Aerosil 200)",
        materialType: "EXCIPIENT",
        functionalRole: "Glidant & Moisture Adsorbent",
        suggestedGrade: "USP / NF",
        suggestedUnit: "g",
        scientificJustification:
          "Sub-micron silica reducing inter-particle friction in cohesive herbal powder blends.",
        compatibilityNotes: "Blend for 3–5 minutes at low shear.",
        source: "AI_RECOMMENDATION",
        inventoryStatus: "PLANNED",
      },
      {
        id: `rec-excipient-${Date.now()}-4`,
        materialName: "Magnesium Stearate",
        materialType: "EXCIPIENT",
        functionalRole: "Hydrophobic Lubricant",
        suggestedGrade: "USP / NF",
        suggestedUnit: "g",
        scientificJustification:
          "Prevents powder adhesion to encapsulation tampers and capsule filling equipment.",
        compatibilityNotes: "Over-blending (>5 min) can retard dissolution rate; add as final blending step.",
        source: "AI_RECOMMENDATION",
        inventoryStatus: "PLANNED",
      }
    );
  } else {
    // General botanical formulation excipient pack
    recommendations.push(
      {
        id: `rec-excipient-${Date.now()}-2`,
        materialName: "Glycerin",
        materialType: "EXCIPIENT",
        functionalRole: "Universal Humectant & Cosolvent",
        suggestedGrade: "USP / NF",
        suggestedUnit: "mL",
        scientificJustification: "Stabilizes secondary plant bioactives and prevents drying out.",
        compatibilityNotes: "Miscible with water and alcohols.",
        source: "AI_RECOMMENDATION",
        inventoryStatus: "PLANNED",
      },
      {
        id: `rec-solvent-${Date.now()}-3`,
        materialName: "Purified Water (USP)",
        materialType: "SOLVENT",
        functionalRole: "Continuous Diluent Vehicle (q.s.)",
        suggestedGrade: "USP Grade",
        suggestedUnit: "mL",
        scientificJustification: "Primary aqueous solvent.",
        compatibilityNotes: "Ensure microbial purity.",
        source: "AI_RECOMMENDATION",
        inventoryStatus: "PLANNED",
      }
    );
  }

  // 3. Analytical Reference Standard (if verified phytochemical is present)
  if (context.verifiedPhytochemicals && context.verifiedPhytochemicals.length > 0) {
    const leadPhyto = context.verifiedPhytochemicals[0];
    recommendations.push({
      id: `rec-analytical-${Date.now()}-7`,
      materialName: `${leadPhyto.compoundName} Analytical Standard`,
      materialType: "ANALYTICAL_STANDARD",
      functionalRole: "Quantitative Primary Chemical Reference Standard",
      suggestedGrade: "HPLC Reference Standard (≥98.0% Purity)",
      suggestedUnit: "mg",
      scientificJustification: `Certified reference standard for chromatographic quantification and fingerprinting of active ${leadPhyto.compoundName} in finished extracts and formulations.`,
      compatibilityNotes: "Store at -20°C in desiccator, protected from moisture and direct light.",
      source: "AI_RECOMMENDATION",
      inventoryStatus: "PLANNED",
      supportingReferences: ["USP / WHO Reference Standard Certificate of Analysis Guidelines"],
    });
  }

  return recommendations.map((r) => ({
    ...r,
    supplierOrSource: null,
    lotOrBatchNumber: null,
    quantityAvailable: null,
  }));
}

/**
 * Validates and sanitizes a material recommendation.
 * Enforces server-side constraints (no fabricated suppliers, lots, or stock).
 */
export function sanitizeMaterialRecommendation(
  raw: any,
  index: number
): MaterialRecommendation | null {
  if (!raw || typeof raw !== "object") return null;

  const validTypes: MaterialTypeKey[] = [
    "ACTIVE_BOTANICAL",
    "EXCIPIENT",
    "SOLVENT",
    "PRESERVATIVE",
    "ANALYTICAL_STANDARD",
  ];

  const name = typeof raw.materialName === "string" ? raw.materialName.trim() : "";
  if (!name) return null;

  let type: MaterialTypeKey = "EXCIPIENT";
  if (typeof raw.materialType === "string") {
    const matched = validTypes.find((t) => t.toLowerCase() === raw.materialType.toLowerCase());
    if (matched) type = matched;
  }

  const role =
    typeof raw.functionalRole === "string" && raw.functionalRole.trim()
      ? raw.functionalRole.trim()
      : type === "ACTIVE_BOTANICAL"
      ? "Active Botanical Constituent"
      : "Formulation Excipient";

  const grade =
    typeof raw.suggestedGrade === "string" && raw.suggestedGrade.trim()
      ? raw.suggestedGrade.trim()
      : "USP / NF (Compendial Grade)";

  const unit =
    typeof raw.suggestedUnit === "string" && raw.suggestedUnit.trim()
      ? raw.suggestedUnit.trim()
      : type === "SOLVENT" || name.toLowerCase().includes("water") || name.toLowerCase().includes("tea") || name.toLowerCase().includes("glycerin")
      ? "mL"
      : type === "ANALYTICAL_STANDARD"
      ? "mg"
      : "g";

  const justification =
    typeof raw.scientificJustification === "string" && raw.scientificJustification.trim()
      ? raw.scientificJustification.trim()
      : `Recommended ${role.toLowerCase()} for targeted botanical formulation design.`;

  const compatibility =
    typeof raw.compatibilityNotes === "string" && raw.compatibilityNotes.trim()
      ? raw.compatibilityNotes.trim()
      : "Verify compatibility with plant extract and matrix pH prior to batch compounding.";

  return {
    id: `rec-${type.toLowerCase()}-${Date.now()}-${index}`,
    materialName: name,
    materialType: type,
    functionalRole: role,
    suggestedGrade: grade,
    suggestedUnit: unit,
    scientificJustification: justification,
    compatibilityNotes: compatibility,
    source: "AI_RECOMMENDATION",
    inventoryStatus: "PLANNED",
    supplierOrSource: null,
    lotOrBatchNumber: null,
    quantityAvailable: null,
    extractFractionId: raw.extractFractionId || null,
    supportingReferences: Array.isArray(raw.supportingReferences) ? raw.supportingReferences : undefined,
  };
}

/**
 * Main AI Recommendation Endpoint Logic
 * Queries Together AI for contextual materials recommendations,
 * with deterministic fallback guarantee.
 */
export async function generateMaterialsRecommendations(
  context: MaterialsRecommendationContext
): Promise<{
  recommendations: MaterialRecommendation[];
  provenance: "ai" | "deterministic";
  modelUsed?: string;
  scientificContextSummary: {
    plant: string;
    dosageForm: string;
    targetApplication: string;
    extractionFraction: string;
  };
}> {
  const deterministicList = buildDeterministicMaterials(context);

  const contextSummary = {
    plant: `${context.plantName}${context.plantScientificName ? ` (${context.plantScientificName})` : ""}`,
    dosageForm: context.dosageForm || "Topical Hydrogel",
    targetApplication: context.targetApplication || "Dermatological / Anti-inflammatory",
    extractionFraction: context.extractFractionName || generateExtractFractionId(context.plantName),
  };

  try {
    const systemPrompt = `You are an expert pharmaceutical formulation scientist and pharmacognosist.
Your task is to recommend candidate materials for a botanical research project based on its plant identity, extraction parameters, and dosage form.

CRITICAL RULES:
1. Respond ONLY with valid JSON inside a \`\`\`json block.
2. Structure the response as: { "materials": [ { "materialName": string, "materialType": "ACTIVE_BOTANICAL"|"EXCIPIENT"|"SOLVENT"|"PRESERVATIVE"|"ANALYTICAL_STANDARD", "functionalRole": string, "suggestedGrade": string, "suggestedUnit": string, "scientificJustification": string, "compatibilityNotes": string } ] }
3. DO NOT fabricate supplier names, lot numbers, stock quantities, or clinical efficacy claims.
4. For Active Botanical, link to extract fraction "${contextSummary.extractionFraction}".
5. Ensure recommendations include appropriate excipients (gelling agent / emulsifier, pH adjuster, humectant, continuous vehicle, preservative) suitable for the specified dosage form.`;

    const userPrompt = `Project Context:
- Plant: ${contextSummary.plant}
- Plant Part: ${context.plantParts || "Leaves"}
- Extraction Method: ${context.extractionMethod || "Standardized extraction"}
- Solvent: ${context.extractionSolvent || "Hydroethanolic"} (${context.solventConcentration || "70%"})
- Extract Fraction ID: ${contextSummary.extractionFraction}
- Dosage Form: ${contextSummary.dosageForm}
- Product Category: ${context.productCategory || "Topical Semi-Solid"}
- Target Application: ${contextSummary.targetApplication}
- Intended Population: ${context.intendedPopulation || "General adult"}
${context.verifiedPhytochemicals?.length ? `- Verified Key Phytochemicals: ${context.verifiedPhytochemicals.map((p) => p.compoundName).join(", ")}` : ""}

Please suggest 5 to 7 candidate materials required for laboratory formulation and quality control testing.`;

    const aiRes = await callTogetherChat([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    if (aiRes.success && aiRes.content) {
      // Parse JSON from output
      const jsonMatch = aiRes.content.match(/```(?:json)?\s*([\s\S]*?)```/i);
      const rawText = (jsonMatch?.[1] || aiRes.content).trim();
      const start = rawText.indexOf("{");
      const end = rawText.lastIndexOf("}");
      if (start >= 0 && end > start) {
        const parsed = JSON.parse(rawText.slice(start, end + 1));
        if (Array.isArray(parsed.materials) && parsed.materials.length > 0) {
          const validated = parsed.materials
            .map((m: any, idx: number) => sanitizeMaterialRecommendation(m, idx))
            .filter((m: any): m is MaterialRecommendation => m !== null);

          if (validated.length >= 3) {
            return {
              recommendations: validated,
              provenance: "ai",
              modelUsed: aiRes.model,
              scientificContextSummary: contextSummary,
            };
          }
        }
      }
    }
  } catch (err: any) {
    console.warn("AI Materials recommendation failed, using deterministic catalog fallback:", err.message);
  }

  // Guaranteed fallback
  return {
    recommendations: deterministicList,
    provenance: "deterministic",
    scientificContextSummary: contextSummary,
  };
}

export const recommendMaterialsForProject = generateMaterialsRecommendations;
