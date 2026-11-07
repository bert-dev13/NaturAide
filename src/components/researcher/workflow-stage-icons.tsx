"use client";

import React from "react";
import {
  Leaf,
  Cpu,
  Dna,
  FlaskConical,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

export const WORKFLOW_STAGE_ICONS: Record<string, LucideIcon> = {
  "plant-literature": Leaf,
  "in-silico": Cpu,
  "docking": Dna,
  "formulation-safety": FlaskConical,
  "safety": ShieldCheck,
  "knowledge-integration": CheckCircle2,
};

export const WORKFLOW_STAGE_NUMBER_ICONS: Record<number, LucideIcon> = {
  1: Leaf,
  2: Cpu,
  3: Dna,
  4: FlaskConical,
  5: ShieldCheck,
  6: CheckCircle2,
};

export function getStageIcon(keyOrNumber: string | number): LucideIcon {
  if (typeof keyOrNumber === "number") {
    return WORKFLOW_STAGE_NUMBER_ICONS[keyOrNumber] || HelpCircle;
  }
  return WORKFLOW_STAGE_ICONS[keyOrNumber] || HelpCircle;
}

export function StageIcon({
  stageKey,
  stageNumber,
  className,
}: {
  stageKey?: string;
  stageNumber?: number;
  className?: string;
}) {
  if (stageNumber === 1 || stageKey === "plant-literature") {
    return <Leaf className={className} />;
  }
  if (stageNumber === 2 || stageKey === "in-silico") {
    return <Cpu className={className} />;
  }
  if (stageNumber === 3 || stageKey === "docking") {
    return <Dna className={className} />;
  }
  if (stageNumber === 4 || stageKey === "formulation-safety") {
    return <FlaskConical className={className} />;
  }
  if (stageNumber === 5 || stageKey === "safety") {
    return <ShieldCheck className={className} />;
  }
  if (stageNumber === 6 || stageKey === "knowledge-integration") {
    return <CheckCircle2 className={className} />;
  }
  return <HelpCircle className={className} />;
}
