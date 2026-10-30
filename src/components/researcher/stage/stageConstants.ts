import React from "react";
import {
  Sprout,
  Atom,
  Network,
  FlaskConical,
  ClipboardCheck,
  BadgeCheck,
  type LucideIcon,
} from "lucide-react";

export interface StageDefinition {
  number: number;
  key: string;
  path: string;
  label: string;
  shortLabel: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  accentBg: string;
  accentText: string;
  accentBorder: string;
}

export const OFFICIAL_STAGES: StageDefinition[] = [
  {
    number: 1,
    key: "plant-literature",
    path: "plant-literature",
    label: "Plant & Literature Research",
    shortLabel: "Plant & Lit",
    subtitle: "Botanical & Auto-Curated Evidence",
    description: "Document botanical classification, specimen authentication, and evaluate auto-curated scientific evidence.",
    icon: Sprout,
    accentBg: "bg-teal-50/60",
    accentText: "text-teal-700",
    accentBorder: "border-teal-200",
  },
  {
    number: 2,
    key: "in-silico",
    path: "in-silico",
    label: "In-Silico Analysis",
    shortLabel: "In-Silico",
    subtitle: "Computational Screening",
    description: "Evaluate phytochemical properties, ADMET pharmacokinetics, and drug-likeness profiles.",
    icon: Atom,
    accentBg: "bg-cyan-50/60",
    accentText: "text-cyan-800",
    accentBorder: "border-cyan-200",
  },
  {
    number: 3,
    key: "docking",
    path: "docking",
    label: "Molecular Docking",
    shortLabel: "Docking",
    subtitle: "Target Binding Workspace",
    description: "Model ligand-target interactions, binding affinities, and therapeutic pose predictions.",
    icon: Network,
    accentBg: "bg-teal-50/60",
    accentText: "text-teal-800",
    accentBorder: "border-teal-200",
  },
  {
    number: 4,
    key: "formulation-safety",
    path: "formulation-safety",
    label: "Formulation & Safety",
    shortLabel: "Formulation & Safety",
    subtitle: "Preparation & Toxicological Profile",
    description: "Design standardized botanical preparations and evaluate comprehensive toxicological safety.",
    icon: FlaskConical,
    accentBg: "bg-amber-50/60",
    accentText: "text-amber-800",
    accentBorder: "border-amber-200",
  },
  {
    number: 5,
    key: "completion-integration",
    path: "completion-integration",
    label: "Research Integration",
    shortLabel: "Integration",
    subtitle: "Evidence Dossier Integration",
    description: "Bring literature, computational, formulation, safety, and interpretation evidence into one research dossier.",
    icon: BadgeCheck,
    accentBg: "bg-emerald-50/80",
    accentText: "text-emerald-900",
    accentBorder: "border-emerald-300",
  },
  {
    number: 6,
    key: "expert-review",
    path: "expert-review",
    label: "Final Professional Review",
    shortLabel: "Final Review",
    subtitle: "Professional Peer Review & Sign-Off",
    description: "Submit the complete research dossier for formal multidisciplinary peer review.",
    icon: ClipboardCheck,
    accentBg: "bg-slate-50/80",
    accentText: "text-slate-800",
    accentBorder: "border-slate-200",
  },
];

const STAGE_KEY_OR_PATH_MAP: Record<string, number> = {
  "evidence": 1,
  "evidence-review": 1,
  "plant-research": 1,
  "plant": 1,
  "literature": 1,
  "plant-literature": 1,
  "1": 1,
  "in-silico": 2,
  "insilico": 2,
  "2": 2,
  "docking": 3,
  "molecular-docking": 3,
  "3": 3,
  "formulation": 4,
  "safety": 4,
  "safety-assessment": 4,
  "formulation-safety": 4,
  "4": 4,
  "laboratory": 5,
  "lab": 5,
  "completion": 5,
  "knowledge-integration": 5,
  "completion-integration": 5,
  "integration": 5,
  "5": 5,
  "review": 6,
  "revisions": 6,
  "expert-review": 6,
  "professional-review": 6,
  "6": 6,
  "7": 6,
  "8": 6,
  "9": 6,
  "10": 5,
  "11": 5,
  "12": 6,
};

export function getStageByNumber(num: number): StageDefinition {
  const boundedNum = Math.max(1, Math.min(6, num));
  return OFFICIAL_STAGES.find((s) => s.number === boundedNum) || OFFICIAL_STAGES[0];
}

export function getStageByKeyOrPath(keyOrPath: string | number): StageDefinition {
  if (typeof keyOrPath === "number") {
    return getStageByNumber(keyOrPath);
  }
  const clean = String(keyOrPath).toLowerCase().trim();
  const mappedNumber = STAGE_KEY_OR_PATH_MAP[clean];
  if (mappedNumber) {
    return getStageByNumber(mappedNumber);
  }
  return (
    OFFICIAL_STAGES.find(
      (s) => s.key === clean || s.path === clean || s.label.toLowerCase() === clean
    ) || OFFICIAL_STAGES[0]
  );
}

export function getStageUrl(projectId: number | string, stageKeyOrPath: string | number): string {
  const stage = getStageByKeyOrPath(stageKeyOrPath);
  return `/researcher/projects/${projectId}/${stage.path}`;
}

export function parseProjectStageNumber(currentStage: string | number | undefined | null): number {
  if (typeof currentStage === "number") {
    if (currentStage >= 1 && currentStage <= 6) return currentStage;
    if (currentStage > 6) {
      return STAGE_KEY_OR_PATH_MAP[String(currentStage)] || 6;
    }
    return 1;
  }
  if (!currentStage) return 1;
  const clean = String(currentStage).toLowerCase().trim();
  const mappedNumber = STAGE_KEY_OR_PATH_MAP[clean];
  if (mappedNumber) return mappedNumber;
  const num = parseInt(clean, 10);
  if (!isNaN(num)) {
    if (num >= 1 && num <= 6) return num;
    return STAGE_KEY_OR_PATH_MAP[String(num)] || 1;
  }
  const stage = OFFICIAL_STAGES.find(
    (s) => s.key === clean || s.path === clean || s.label.toLowerCase() === clean
  );
  return stage ? stage.number : 1;
}

export type StageProgressStatus =
  | "COMPLETED"
  | "CURRENT"
  | "UNDER_REVIEW"
  | "NEEDS_REVISION"
  | "UPCOMING"
  | "LOCKED";

export function resolveStageStatus(
  stageNumber: number,
  currentStageNumber: number,
  stageMapStatus?: string,
  projectStatus?: string
): StageProgressStatus {
  if (stageMapStatus === "COMPLETED") return "COMPLETED";
  if (stageMapStatus === "UNDER_REVIEW") return "UNDER_REVIEW";
  if (
    stageMapStatus === "NEEDS_REVISION" ||
    stageMapStatus === "REVISION_REQUESTED" ||
    stageMapStatus === "REQUIRES_REVISION"
  )
    return "NEEDS_REVISION";

  if (stageNumber < currentStageNumber) {
    return "COMPLETED";
  }

  if (stageNumber === currentStageNumber) {
    if (stageNumber === 6 && (projectStatus === "UNDER_REVIEW" || stageMapStatus === "UNDER_REVIEW")) {
      return "UNDER_REVIEW";
    }
    if (
      stageNumber === 6 &&
      (projectStatus === "REVISION_REQUIRED" ||
        projectStatus === "REVISIONS" ||
        stageMapStatus === "NEEDS_REVISION" ||
        stageMapStatus === "REQUIRES_REVISION")
    ) {
      return "NEEDS_REVISION";
    }
    return "CURRENT";
  }

  if (stageNumber === currentStageNumber + 1 && stageMapStatus === "IN_PROGRESS") {
    return "CURRENT";
  }

  return "LOCKED";
}
