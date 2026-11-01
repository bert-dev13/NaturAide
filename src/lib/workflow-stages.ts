import React from "react";
import {
  Leaf,
  Cpu,
  Dna,
  FlaskConical,
  ClipboardCheck,
  CheckCircle2,
  ShieldCheck,
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
    label: "Formulation Development",
    shortLabel: "Formulation",
    path: "formulation-safety",
    description: "Develop, optimize, and document the research formulation and phytochemical composition.",
    icon: FlaskConical,
  },
  {
    key: "safety",
    number: 5,
    label: "Safety / Clinical",
    shortLabel: "Safety",
    path: "safety",
    description: "Evaluate preclinical and clinical safety evidence, toxicity boundaries, contraindications, and interactions.",
    icon: ShieldCheck,
  },
  {
    key: "knowledge-integration",
    number: 6,
    label: "Knowledge Integration",
    shortLabel: "Integration",
    path: "knowledge-integration",
    description: "Synthesize multi-stage scientific findings, alignment, limitations, and final research dossier.",
    icon: CheckCircle2,
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
  "formulation-safety": "formulation-safety",
  "safety": "safety",
  "safety-clinical": "safety",
  "clinical-safety": "safety",
  "completion-integration": "safety",
  "completion": "safety",
  "laboratory": "safety",
  "lab": "safety",
  "knowledge-integration": "knowledge-integration",
  "expert-review": "knowledge-integration",
  "review": "knowledge-integration",
  "revisions": "knowledge-integration",
  "final-review": "knowledge-integration",
  "dossier": "knowledge-integration",
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
