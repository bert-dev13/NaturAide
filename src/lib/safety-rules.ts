export const SCREENING_RULE_VERSION = "v1.0-community-safety";

export type ScreeningOutcome = "ELIGIBLE_TO_CONTINUE" | "PROFESSIONAL_GUIDANCE_REQUIRED";

export type ScreeningSeverity = "low" | "moderate" | "severe";

export interface ScreeningInput {
  ageGroup: string; // "under-2" | "2-17" | "18-64" | "65-plus"
  age?: number | null;
  healthConcern: string;
  currentMedications: string[]; // e.g. ["Blood thinners / Anticoagulants", "Blood pressure medication", "None"]
  medicationDetails?: string;
  knownAllergies: string[]; // e.g. ["Plant / Asteraceae allergy", "None"]
  allergyDetails?: string;
  isPregnantOrLactating: boolean;
  hasSevereSymptoms: boolean; // e.g. chest pain, breathing difficulty, coughing blood, high fever > 3 days
  hasOrganFailure: boolean; // severe kidney failure, liver failure
}

export interface ScreeningEvaluation {
  result: ScreeningOutcome;
  severity: ScreeningSeverity;
  ruleVersion: string;
  triggeredRules: string[];
  reasonSummary: string;
}

export interface SeverityMeta {
  level: ScreeningSeverity;
  title: string;
  description: string;
  badgeLabel: string;
  colorScheme: {
    bg: string;
    border: string;
    borderAccent: string;
    text: string;
    subtext: string;
    badge: string;
    icon: string;
  };
}

/**
 * Determine severity level deterministically
 */
export function getScreeningSeverity(screening: any): ScreeningSeverity {
  if (!screening) return "low";
  if (screening.severity && (screening.severity === "low" || screening.severity === "moderate" || screening.severity === "severe")) {
    return screening.severity;
  }

  // 1. High risk / Severe check
  const hasSevere = Boolean(
    screening.hasSevereSymptoms ||
    screening.has_severe_symptoms ||
    screening.hasOrganFailure ||
    screening.has_organ_failure
  );

  const meds = Array.isArray(screening.currentMedications)
    ? screening.currentMedications
    : typeof screening.currentMedications === "string"
    ? screening.currentMedications.split(",")
    : [];

  const isAnticoagulant = meds.some((m: string) => {
    const s = String(m).toLowerCase();
    return (
      s.includes("thinner") ||
      s.includes("anticoagulant") ||
      s.includes("warfarin") ||
      s.includes("aspirin") ||
      s.includes("blood-thinner")
    );
  });

  if (hasSevere || isAnticoagulant) {
    return "severe";
  }

  // 2. Moderate caution check
  const isPregnant = Boolean(screening.isPregnantOrLactating || screening.is_pregnant_or_lactating);
  const isInfant = screening.ageGroup === "under-2" || screening.age_group === "under-2" || (typeof screening.age === "number" && screening.age < 2);
  const isGeriatric = screening.ageGroup === "65-plus" || screening.age_group === "65-plus";
  const hasPrescriptionMeds = meds.some((m: string) => {
    const s = String(m).trim().toLowerCase();
    return s && s !== "none";
  });

  const allergies = Array.isArray(screening.knownAllergies)
    ? screening.knownAllergies
    : typeof screening.knownAllergies === "string"
    ? screening.knownAllergies.split(",")
    : [];
  const hasAllergies = allergies.some((a: string) => {
    const s = String(a).trim().toLowerCase();
    return s && s !== "none";
  });

  const outcome = screening.evaluationResult || screening.result;
  const isGuidanceRequired = outcome === "PROFESSIONAL_GUIDANCE_REQUIRED";

  if (isPregnant || isInfant || (isGeriatric && hasPrescriptionMeds) || isGuidanceRequired || hasAllergies || hasPrescriptionMeds) {
    return "moderate";
  }

  return "low";
}

/**
 * Returns structured design tokens & descriptive copy for each severity level
 */
export function getSeverityMeta(severity: ScreeningSeverity): SeverityMeta {
  switch (severity) {
    case "severe":
      return {
        level: "severe",
        title: "Severe Symptoms Identified",
        description: "Your responses indicate symptoms that may require professional medical attention.",
        badgeLabel: "High Risk",
        colorScheme: {
          bg: "bg-rose-50/90",
          border: "border-rose-200",
          borderAccent: "border-l-4 border-l-rose-600",
          text: "text-rose-950",
          subtext: "text-rose-800",
          badge: "bg-rose-100 text-rose-800 border-rose-300",
          icon: "text-rose-600",
        },
      };
    case "moderate":
      return {
        level: "moderate",
        title: "Caution Recommended",
        description: "Some of your responses may require additional attention before continuing.",
        badgeLabel: "Caution",
        colorScheme: {
          bg: "bg-amber-50/90",
          border: "border-amber-200",
          borderAccent: "border-l-4 border-l-amber-500",
          text: "text-amber-950",
          subtext: "text-amber-800",
          badge: "bg-amber-100 text-amber-900 border-amber-300",
          icon: "text-amber-600",
        },
      };
    case "low":
    default:
      return {
        level: "low",
        title: "Low-Risk Symptoms",
        description: "No severe warning signs were identified from your responses.",
        badgeLabel: "Low Risk",
        colorScheme: {
          bg: "bg-emerald-50/90",
          border: "border-emerald-200",
          borderAccent: "border-l-4 border-l-emerald-600",
          text: "text-emerald-950",
          subtext: "text-emerald-800",
          badge: "bg-emerald-100 text-emerald-900 border-emerald-300",
          icon: "text-emerald-600",
        },
      };
  }
}

/**
 * Standard User-Facing Classifications
 */
export function getScreeningDisplayLabel(result: ScreeningOutcome | string | null | undefined): string {
  if (result === "ELIGIBLE_TO_CONTINUE") {
    return "Eligible for Herbal Guidance";
  }
  if (result === "PROFESSIONAL_GUIDANCE_REQUIRED") {
    return "Professional Guidance Recommended";
  }
  return "Initial screening not yet completed";
}

export function getScreeningMeaning(result: ScreeningOutcome | string | null | undefined): string {
  if (result === "ELIGIBLE_TO_CONTINUE") {
    return "No configured screening rule was triggered that requires stopping recommendation-oriented herbal guidance.";
  }
  if (result === "PROFESSIONAL_GUIDANCE_REQUIRED") {
    return "The user may still access general educational NaturAide information, but recommendation-oriented herbal guidance is restricted.";
  }
  return "";
}

/**
 * Deterministic Safety Rule Engine
 * Evaluates user responses against explicit, documented, versioned clinical safety rules.
 * Does NOT call an LLM. Does NOT guess or invent medical diagnosis.
 */
export function evaluateHealthScreening(input: ScreeningInput): ScreeningEvaluation {
  const triggeredRules: string[] = [];
  const reasons: string[] = [];

  // RULE 1: Severe / Emergency red-flag symptoms
  if (input.hasSevereSymptoms) {
    triggeredRules.push("RULE_1_ACUTE_RED_FLAGS");
    reasons.push(
      "Reported acute or severe symptoms (such as breathing difficulty, severe chest discomfort, coughing blood, or prolonged high fever) require immediate clinical attention from a healthcare facility rather than self-care herbal remedies."
    );
  }

  // RULE 2: Vulnerable physiology - Pregnancy & Lactation
  if (input.isPregnantOrLactating) {
    triggeredRules.push("RULE_2_PREGNANCY_LACTATION");
    reasons.push(
      "Pregnancy or breastfeeding represents a sensitive physiological condition. Active herbal phytochemicals can stimulate uterine tone or pass into breastmilk, necessitating direct physician guidance."
    );
  }

  // RULE 3: Vulnerable physiology - Infants (under 2 years old)
  if (input.ageGroup === "under-2" || (typeof input.age === "number" && input.age < 2)) {
    triggeredRules.push("RULE_3_PEDIATRIC_INFANT");
    reasons.push(
      "Infants under two years of age have developing metabolic and renal clearance pathways. Herbal decoctions or teas are not recommended without direct pediatric supervision."
    );
  }

  // RULE 4: Chronic organ failure / impairment
  if (input.hasOrganFailure) {
    triggeredRules.push("RULE_4_CHRONIC_ORGAN_IMPAIRMENT");
    reasons.push(
      "Severe kidney or liver impairment significantly impairs the clearance and detoxification of botanical secondary metabolites, carrying increased toxicity risk."
    );
  }

  // RULE 5: High-risk concurrent prescription medications
  const medsLower = (input.currentMedications || []).map((m) => m.toLowerCase());
  const medDetailsLower = (input.medicationDetails || "").toLowerCase();

  const isAnticoagulant =
    medsLower.some((m) => m.includes("thinner") || m.includes("anticoagulant") || m.includes("warfarin") || m.includes("aspirin")) ||
    medDetailsLower.includes("warfarin") ||
    medDetailsLower.includes("heparin") ||
    medDetailsLower.includes("clopidogrel") ||
    medDetailsLower.includes("anticoagulant");

  const isCardiacOrDiuretic =
    medsLower.some((m) => m.includes("heart") || m.includes("cardiac") || m.includes("blood pressure") || m.includes("diuretic")) ||
    medDetailsLower.includes("digoxin") ||
    medDetailsLower.includes("furosemide") ||
    medDetailsLower.includes("lisinopril");

  if (isAnticoagulant) {
    triggeredRules.push("RULE_5A_ANTICOAGULANT_INTERACTION");
    reasons.push(
      "Use of prescription blood thinners or anticoagulants presents significant interaction risks with herbal preparations that alter platelet aggregation (e.g., Sambong, Turmeric, Ginger). Professional medical advice is required."
    );
  } else if (isCardiacOrDiuretic && (input.ageGroup === "65-plus" || input.hasOrganFailure)) {
    triggeredRules.push("RULE_5B_CARDIOVASCULAR_INTERACTION");
    reasons.push(
      "Concurrent use of cardiac or diuretic medications in conjunction with active symptoms necessitates clinical monitoring before initiating botanical diuretics like Sambong."
    );
  }

  // DETERMINATION
  const isSevere =
    input.hasSevereSymptoms ||
    input.hasOrganFailure ||
    isAnticoagulant;

  const severity: ScreeningSeverity = isSevere
    ? "severe"
    : triggeredRules.length > 0
    ? "moderate"
    : "low";

  if (triggeredRules.length > 0) {
    return {
      result: "PROFESSIONAL_GUIDANCE_REQUIRED",
      severity,
      ruleVersion: SCREENING_RULE_VERSION,
      triggeredRules,
      reasonSummary: reasons.join(" "),
    };
  }

  return {
    result: "ELIGIBLE_TO_CONTINUE",
    severity: "low",
    ruleVersion: SCREENING_RULE_VERSION,
    triggeredRules: [],
    reasonSummary: "Screening responses indicate standard eligibility for educational and traditional herbal wellness information.",
  };
}
