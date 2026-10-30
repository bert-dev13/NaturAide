import React from "react";
import {
  Leaf,
  Cpu,
  Dna,
  FlaskConical,
  ClipboardCheck,
  CheckCircle2,
} from "lucide-react";

export interface WorkflowStage {
  key: string;
  number: number;
  label: string;
  shortLabel: string;
  path: string;
  description: string;
  icon: React.ElementType;
}

export const WORKFLOW_STAGES: WorkflowStage[] = [
  {
    key: "plant-literature",
    number: 1,
    label: "Plant & Literature Research",
    shortLabel: "Plant & Lit",
    path: "plant-literature",
    description: "Investigate botanical classification, specimen authentication, and auto-curated scientific evidence.",
    icon: Leaf,
  },
  {
    key: "in-silico",
    number: 2,
    label: "In-Silico Analysis",
    shortLabel: "In-Silico",
    path: "in-silico",
    description: "Perform computational screening and evaluate pharmacokinetics & drug-likeness (ADMET).",
    icon: Cpu,
  },
  {
    key: "docking",
    number: 3,
    label: "Molecular Docking",
    shortLabel: "Docking",
    path: "docking",
    description: "Model binding interactions and molecular affinities with biological target proteins.",
    icon: Dna,
  },
  {
    key: "formulation-safety",
    number: 4,
    label: "Formulation & Safety",
    shortLabel: "Formulation & Safety",
    path: "formulation-safety",
    description: "Design standardized botanical preparations and evaluate toxicological safety profiles.",
    icon: FlaskConical,
  },
  {
    key: "completion-integration",
    number: 5,
    label: "Research Integration",
    shortLabel: "Integration",
    path: "completion-integration",
    description: "Bring literature, computational, formulation, safety, and interpretation evidence into one research dossier.",
    icon: CheckCircle2,
  },
  {
    key: "expert-review",
    number: 6,
    label: "Final Professional Review",
    shortLabel: "Final Review",
    path: "expert-review",
    description: "Submit the complete research dossier once for professional review across scientific areas.",
    icon: ClipboardCheck,
  },
];

// Mapping aliases for backward compatibility and redirects
const STAGE_KEY_ALIASES: Record<string, string> = {
  "evidence": "plant-literature",
  "evidence-review": "plant-literature",
  "plant-research": "plant-literature",
  "plant": "plant-literature",
  "literature": "plant-literature",
  "plant-literature": "plant-literature",
  "in-silico": "in-silico",
  "insilico": "in-silico",
  "docking": "docking",
  "formulation": "formulation-safety",
  "safety": "formulation-safety",
  "safety-assessment": "formulation-safety",
  "formulation-safety": "formulation-safety",
  "laboratory": "completion-integration",
  "lab": "completion-integration",
  "completion": "completion-integration",
  "knowledge-integration": "completion-integration",
  "completion-integration": "completion-integration",
  "review": "expert-review",
  "revisions": "expert-review",
  "expert-review": "expert-review",
};

export function getStageByNumber(num: number): WorkflowStage | undefined {
  const boundedNum = Math.max(1, Math.min(6, num));
  return WORKFLOW_STAGES.find((s) => s.number === boundedNum) || WORKFLOW_STAGES[0];
}

export function getStageByKey(key: string): WorkflowStage | undefined {
  if (!key) return WORKFLOW_STAGES[0];
  const cleanKey = key.toLowerCase().trim();
  const canonicalKey = STAGE_KEY_ALIASES[cleanKey] || cleanKey;
  return (
    WORKFLOW_STAGES.find(
      (s) => s.key === canonicalKey || s.path === canonicalKey || s.key === cleanKey || s.path === cleanKey
    ) || WORKFLOW_STAGES[0]
  );
}

export function getStageUrl(projectId: number | string, stageKeyOrPath: string): string {
  const stage = getStageByKey(stageKeyOrPath);
  const path = stage ? stage.path : stageKeyOrPath;
  return `/researcher/projects/${projectId}/${path}`;
}
