"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Atom,
  Ban,
  Dna,
  Sparkles,
  Target,
  Biohazard,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleCheck,
  Droplets,
  ExternalLink,
  FileText,
  FlaskConical,
  Leaf,
  Loader2,
  Microscope,
  Pill,
  Plus,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";

import type { FormulationSafetyAutomation, SafetyAreaKey } from "@/lib/formulation-safety-draft";
import { getStageByKey } from "@/lib/workflow-stages";
import { ResearchStageFooter } from "@/components/researcher/stage/ResearchStageFooter";
import { ResearchStageHeader } from "@/components/researcher/stage/ResearchStageHeader";

const APPROVED_MARK = "[NATUREAIDE_RATIONALE_APPROVED]";
const REVIEWED_PATTERN = /\[NATUREAIDE_SAFETY_REVIEWED:([^\]]*)\]/;
const AI_BLOCK_PATTERN = /\[NATUREAIDE_AI_SAFETY\]([\s\S]*?)\[\/NATUREAIDE_AI_SAFETY\]/;
const SYNTHESIS_MARK = "[NATUREAIDE_SYNTHESIS_APPROVED]";
const NEEDS_REVIEW = "Needs Researcher Review";
const INSUFFICIENT = "Insufficient Evidence — Researcher Review Required";

const FORMULATION_TYPES = [
  "Extract",
  "Standardized Extract",
  "Experimental Extract",
  "Aqueous Decoction",
  "Suspension",
  "Topical Gel",
  "Topical Cream",
  "Topical Ointment",
  "Capsule Prototype",
  "Tablet Prototype",
  "Lyophilized Powder",
  "Experimental Mixture",
  "Other",
];

const DOSAGE_FORMS = [
  "Oral Solution",
  "Oral Suspension",
  "Capsule",
  "Tablet",
  "Topical Cream",
  "Topical Gel",
  "Ointment",
  "Decoction",
];

const NEEDS_INPUT = "Needs Researcher Input";
const NOT_PROVIDED = "Not provided";

const AREA_ORDER: SafetyAreaKey[] = ["toxicity", "contraindications", "interactions", "dose", "formulation"];

const AREA_META: Record<SafetyAreaKey, { label: string; short: string; icon: LucideIcon }> = {
  toxicity: { label: "Toxicity", short: "Toxicity", icon: Biohazard },
  contraindications: { label: "Contraindications", short: "Contraindications", icon: Ban },
  interactions: { label: "Interactions", short: "Interactions", icon: RefreshCw },
  dose: { label: "Dose", short: "Dose", icon: Pill },
  formulation: { label: "Formulation Safety", short: "Formulation", icon: FlaskConical },
};

const FIELD =
  "w-full rounded-xl border border-[#dde6df] bg-white px-3 py-2 text-sm text-[#0c2419] outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";
const LABEL = "mb-1 block text-xs font-semibold text-[#0f2c20]";
const SECONDARY_BTN =
  "inline-flex items-center gap-1.5 rounded-xl border border-[#dde6df] bg-white px-3.5 py-2 text-xs font-bold text-[#0f2c20] shadow-xs transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md disabled:translate-y-0 disabled:opacity-50";
const ICON_BTN =
  "inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#dde6df] bg-white text-[#52645d] transition hover:border-emerald-300 hover:text-[#0f2c20] disabled:opacity-40";
const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0f3626] to-[#16a34a] px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:from-[#0c2c1f] hover:to-[#15803d] disabled:opacity-60";

type AreaNotes = Record<SafetyAreaKey, string>;
type Busy = null | "continue" | "save" | "mark" | "formulation" | "approve" | "complete";

interface FormulationSafetyProps {
  projectId: number;
  project: any;
  plantData: any;
  compounds: any[];
  initialFormulation: any;
  initialVersions: any[];
  initialActiveVersion: any;
  initialComponents: any[];
  initialSteps: any[];
  initialBatches: any[];
  initialRationale: any;
  surfacedEvidence: any;
  initialSafetyAssessment: any;
  initialComponentAssessments: any[];
  initialConcerns: any[];
  initialSummary: any;
  automation: FormulationSafetyAutomation;
}

function isLegacyPlaceholder(value: string) {
  return /still requires literature review|are not established in this record|remain under review and are not inferred|have not been fixed for this prototype|still need to be specified|research concentration pending|was selected as a /i.test(
    value
  );
}

function isRealAmount(value: string) {
  const text = value.trim();
  if (!text || isLegacyPlaceholder(text)) return false;
  if (/^needs researcher review$/i.test(text)) return false;
  return true;
}

function cleanChoice(value: string) {
  const text = value.trim();
  if (!text || isLegacyPlaceholder(text) || /^needs researcher (review|input)$/i.test(text)) return "";
  return text;
}

function matchOption(value: string, options: string[]) {
  const text = cleanChoice(value);
  if (!text) return "";
  return options.find((option) => option.toLowerCase() === text.toLowerCase()) || text;
}

function choiceOptions(options: string[], current: string) {
  const value = matchOption(current, options);
  if (value && !options.includes(value)) return [value, ...options];
  return options;
}

function splitMergedStep(value: string) {
  const parts = value
    .split(/(?<=\.)\s+(?=(?:Plant part|Recorded |Concentration))/);
  const pieces = parts.map((part) => part.trim()).filter(Boolean);
  return pieces.length > 0 ? pieces : [value];
}

function firstSentences(text: string, count: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  const parts = clean.match(/[^.!?]+[.!?]+/g);
  if (!parts || parts.length <= count) return clean;
  return parts.slice(0, count).join(" ").trim();
}

function clip(value: string, max = 240) {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max).replace(/\s+\S*$/, "").trim();
  return `${cut || text.slice(0, max).trim()}…`;
}

type EvidenceStatus = "SUPPORTED" | "PARTIAL_EVIDENCE" | "INSUFFICIENT_EVIDENCE" | "RESEARCHER_INPUT_REQUIRED";
type StoredAssessment = {
  status: EvidenceStatus;
  summary: string;
  key_findings: string[];
  limitations: string;
  missing_inputs: string[];
  cited_reference_ids: string[];
};
const AI_SCHEMA = 2;
type AiStore = {
  schema: number;
  areas: Partial<Record<SafetyAreaKey, StoredAssessment>>;
  synthesis: string;
  synthesisApproved: boolean;
};

function stripControlMarks(notes: string) {
  return notes.replace(REVIEWED_PATTERN, "").replace(AI_BLOCK_PATTERN, "").replaceAll(SYNTHESIS_MARK, "").replace(/\n{3,}/g, "\n\n").trim();
}

function readReviewed(notes: string) {
  const match = notes.match(REVIEWED_PATTERN);
  const keys = (match?.[1] || "")
    .split(",")
    .map((key) => key.trim())
    .filter((key): key is SafetyAreaKey => (AREA_ORDER as string[]).includes(key));
  return { notes: stripControlMarks(notes), keys };
}

function isEvidenceStatus(value: string): value is EvidenceStatus {
  return value === "SUPPORTED" || value === "PARTIAL_EVIDENCE" || value === "INSUFFICIENT_EVIDENCE" || value === "RESEARCHER_INPUT_REQUIRED";
}

function readAiStore(notes: string): AiStore {
  const empty: AiStore = { schema: AI_SCHEMA, areas: {}, synthesis: "", synthesisApproved: notes.includes(SYNTHESIS_MARK) };
  const match = notes.match(AI_BLOCK_PATTERN);
  if (!match) return empty;
  try {
    const parsed = JSON.parse(match[1]) as { schema?: number; areas?: Partial<Record<SafetyAreaKey, StoredAssessment & { evidence_limitations?: string }>>; synthesis?: string; synthesisApproved?: boolean };
    if (parsed.schema !== AI_SCHEMA) return { schema: AI_SCHEMA, areas: {}, synthesis: "", synthesisApproved: false };
    const areas: AiStore["areas"] = {};
    let dropped = false;
    for (const key of AREA_ORDER) {
      const area = parsed.areas?.[key];
      const status = String(area?.status || "");
      if (!area?.summary || !isEvidenceStatus(status)) {
        if (area) dropped = true;
        continue;
      }
      areas[key] = {
        status,
        summary: String(area.summary),
        key_findings: Array.isArray(area.key_findings) ? area.key_findings.map((item) => String(item)) : [],
        limitations: String(area.limitations || area.evidence_limitations || ""),
        missing_inputs: Array.isArray(area.missing_inputs) ? area.missing_inputs.map((item) => String(item)) : [],
        cited_reference_ids: Array.isArray(area.cited_reference_ids) ? area.cited_reference_ids.map((item) => String(item)) : [],
      };
    }
    return {
      schema: AI_SCHEMA,
      areas,
      synthesis: dropped ? "" : String(parsed.synthesis || ""),
      synthesisApproved: dropped ? false : Boolean(parsed.synthesisApproved) || notes.includes(SYNTHESIS_MARK),
    };
  } catch {
    return empty;
  }
}

function packNotes(base: string, keys: string[], ai: AiStore) {
  const clean = stripControlMarks(base);
  const block = `[NATUREAIDE_AI_SAFETY]${JSON.stringify(ai)}[/NATUREAIDE_AI_SAFETY]`;
  const reviewed = keys.length ? `[NATUREAIDE_SAFETY_REVIEWED:${keys.join(",")}]` : "";
  const synth = ai.synthesisApproved ? SYNTHESIS_MARK : "";
  return [clean, block, reviewed, synth].filter(Boolean).join("\n\n");
}

function visibleSynthesis(text: string) {
  return text
    .replace(/;?\s*the status counts are[^.]*\./gi, ".")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+\./g, ".")
    .trim();
}

function researcherNote(saved: string, generated: string) {
  const current = String(saved || "").trim();
  if (!current || isLegacyPlaceholder(current)) return "";
  if (/^needs researcher review$/i.test(current)) return "";
  if (current === INSUFFICIENT) return "";
  if (generated && current === generated.trim()) return "";
  if (/^(?:LITERATURE|REFERENCE)\s·/m.test(current)) return "";
  return current;
}

function recordedOrMissing(value: string) {
  const text = value.trim();
  return text || NOT_PROVIDED;
}

function displayText(value: string, emptyLabel = NOT_PROVIDED) {
  return cleanChoice(value) || emptyLabel;
}

function shownAmount(value: string) {
  return isRealAmount(value) ? value.trim() : NEEDS_INPUT;
}

function shownNote(value: string) {
  return cleanChoice(value) || "—";
}

function readoutTone(value: string) {
  if (value === NOT_PROVIDED || value === NEEDS_INPUT) return "text-amber-800";
  if (value === "—") return "text-[#9aab9f]";
  return "text-[#0f2c20]";
}


type FormulationDraft = {
  prototypeName: string;
  formulationType: string;
  dosageForm: string;
  researchPurpose: string;
  amounts: Record<string, string>;
  methods: Record<string, string>;
  steps: string[];
  stepIds: (number | null)[];
};

function FormulationEditModal({
  subtitle,
  compounds,
  material,
  versions,
  formulationId,
  versionId,
  initial,
  attentionKey,
  saving,
  onClose,
  onSave,
  onSwitchVersion,
}: {
  subtitle: string;
  compounds: FormulationSafetyAutomation["compounds"];
  material: { icon: LucideIcon; label: string; value: string }[];
  versions: any[];
  formulationId: number | null;
  versionId: number | null;
  initial: FormulationDraft;
  attentionKey: string | null;
  saving: boolean;
  onClose: () => void;
  onSave: (draft: FormulationDraft) => Promise<void>;
  onSwitchVersion?: (versionId: number) => Promise<void>;
}) {
  const [prototypeName, setPrototypeName] = useState(initial.prototypeName);
  const [formulationType, setFormulationType] = useState(matchOption(initial.formulationType, FORMULATION_TYPES));
  const [dosageForm, setDosageForm] = useState(matchOption(initial.dosageForm, DOSAGE_FORMS));
  const [researchPurpose, setResearchPurpose] = useState(cleanChoice(initial.researchPurpose));
  const [amounts, setAmounts] = useState(initial.amounts);
  const [methods, setMethods] = useState(initial.methods);
  const [steps, setSteps] = useState(() => initial.steps.flatMap(splitMergedStep));
  const [stepIds, setStepIds] = useState<(number | null)[]>(() => {
    const ids: (number | null)[] = [];
    initial.steps.forEach((step, index) => {
      splitMergedStep(step).forEach((_, pieceIndex) => {
        ids.push(pieceIndex === 0 ? (initial.stepIds[index] ?? null) : null);
      });
    });
    return ids;
  });
  const [rowKeys, setRowKeys] = useState(() => steps.map((_, index) => `step-${index}`));
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (attentionKey !== "concentrations") return;
    document.getElementById("compound-concentrations")?.scrollIntoView({ block: "center" });
  }, [attentionKey]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, saving]);

  function moveStep(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= steps.length) return;
    const swap = <T,>(items: T[]) => {
      const copy = [...items];
      const [item] = copy.splice(index, 1);
      copy.splice(next, 0, item);
      return copy;
    };
    setSteps(swap);
    setStepIds(swap);
    setRowKeys(swap);
  }

  function deleteStep(index: number) {
    setSteps((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setStepIds((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setRowKeys((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function handleSave() {
    const name = prototypeName.trim();
    const type = formulationType.trim();
    const form = dosageForm.trim();
    const missing = [
      !name ? "Formulation name" : "",
      !type ? "Formulation type" : "",
      !form ? "Dosage form" : "",
    ].filter(Boolean);
    if (missing.length > 0) {
      setLocalError(`${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} required.`);
      return;
    }
    setLocalError(null);
    const packed = steps
      .map((step, index) => ({ text: step.trim(), id: stepIds[index] ?? null }))
      .filter((step) => step.text);
    const blankPrompt = (value: string) => (/^needs researcher input$/i.test(value.trim()) ? "" : value);
    try {
      await onSave({
        prototypeName: name,
        formulationType: type,
        dosageForm: form,
        researchPurpose: researchPurpose.trim(),
        amounts: Object.fromEntries(Object.entries(amounts).map(([key, value]) => [key, blankPrompt(value)])),
        methods: Object.fromEntries(Object.entries(methods).map(([key, value]) => [key, blankPrompt(value)])),
        steps: packed.map((step) => step.text),
        stepIds: packed.map((step) => step.id),
      });
    } catch {
      setLocalError("The formulation could not be saved.");
    }
  }

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <button type="button" aria-label="Close dialog" className="absolute inset-0 bg-[#04140e]/55 backdrop-blur-[2px]" onClick={() => !saving && onClose()} />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-formulation-title"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="relative z-10 flex max-h-[85vh] w-full max-w-[920px] flex-col overflow-hidden rounded-3xl border border-[#dde6df] bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#edf2ee] bg-gradient-to-r from-emerald-50/80 via-teal-50/30 to-transparent px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 p-2.5 text-white shadow-md shadow-emerald-600/20">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <h2 id="edit-formulation-title" className="text-lg font-black tracking-tight text-[#0f2c20]">Edit Formulation</h2>
              <p className="mt-0.5 text-sm font-semibold text-[#52645d]">{subtitle}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="rounded-full p-2 text-[#52645d] transition hover:bg-white hover:text-[#0f2c20] disabled:opacity-50" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
          {localError && (
            <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-950">
              {localError}
            </p>
          )}

          <section className="space-y-3">
            <h3 className="text-sm font-black text-[#0f2c20]">Formulation Details</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className={attentionKey === "prototype" ? "sm:col-span-2" : ""}>
                <span className={LABEL}>Formulation Name</span>
                <input className={FIELD} value={prototypeName} onChange={(event) => setPrototypeName(event.target.value)} />
              </label>
              <label>
                <span className={LABEL}>Formulation Type</span>
                <select className={FIELD} value={formulationType} onChange={(event) => setFormulationType(event.target.value)}>
                  <option value="">Select formulation type</option>
                  {choiceOptions(FORMULATION_TYPES, formulationType).map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className={LABEL}>Dosage Form</span>
                <select className={`${FIELD} ${attentionKey === "dosage" ? "ring-2 ring-amber-300" : ""}`} value={dosageForm} onChange={(event) => setDosageForm(event.target.value)}>
                  <option value="">Select dosage form</option>
                  {choiceOptions(DOSAGE_FORMS, dosageForm).map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label className="sm:col-span-2">
                <span className={LABEL}>Research Purpose</span>
                <textarea className={FIELD} rows={3} value={researchPurpose} placeholder={NEEDS_INPUT} onChange={(event) => setResearchPurpose(event.target.value)} />
              </label>
              {versions.length > 1 && formulationId && versionId && onSwitchVersion && (
                <label className="sm:col-span-2">
                  <span className={LABEL}>Version</span>
                  <select className={FIELD} value={versionId} onChange={(event) => void onSwitchVersion(Number(event.target.value))} disabled={saving}>
                    {versions.map((version) => (
                      <option key={version.id} value={version.id}>{version.versionNumber || `Version ${version.id}`}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-black text-[#0f2c20]">Research Material</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {material.map((item) => {
                const Icon = item.icon;
                const missing = item.value === "Not recorded";
                return (
                  <div key={item.label} className="rounded-2xl border border-[#e2eae4] bg-[#f7faf8] px-3 py-2.5">
                    <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#78997f]">
                      <Icon className="h-3.5 w-3.5 text-emerald-700" />
                      {item.label}
                    </p>
                    <p className={`mt-1 text-sm font-semibold ${missing ? "text-amber-800" : "text-[#0f2c20]"}`}>{item.value}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section id="compound-concentrations" className={`space-y-3 rounded-2xl ${attentionKey === "concentrations" ? "ring-2 ring-sky-300" : ""}`}>
            <h3 className="text-sm font-black text-[#0f2c20]">Compound Details</h3>
            {compounds.length === 0 ? (
              <p className="text-sm text-[#52645d]">No compounds were carried forward from Stage 2.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {compounds.map((compound) => {
                  const key = compound.name.toLowerCase();
                  return (
                    <article key={compound.name} className="space-y-3 rounded-2xl border border-[#e2eae4] bg-white p-4">
                      <div className="flex items-center gap-2">
                        <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
                          <Atom className="h-4 w-4" />
                        </div>
                        <h4 className="text-sm font-black text-[#0f2c20]">{compound.name}</h4>
                      </div>
                      <label>
                        <span className={LABEL}>Amount / Concentration</span>
                        <input
                          className={`${FIELD} ${attentionKey === "concentrations" ? "ring-2 ring-sky-300" : ""}`}
                          value={amounts[key] || ""}
                          placeholder={NEEDS_INPUT}
                          onChange={(event) => setAmounts((current) => ({ ...current, [key]: event.target.value }))}
                        />
                      </label>
                      <label>
                        <span className={LABEL}>Preparation Note</span>
                        <input
                          className={FIELD}
                          value={methods[key] || ""}
                          placeholder={NEEDS_INPUT}
                          onChange={(event) => setMethods((current) => ({ ...current, [key]: event.target.value }))}
                        />
                      </label>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-black text-[#0f2c20]">Preparation Steps</h3>
            {steps.length === 0 && <p className="text-sm text-[#52645d]">No preparation steps are on record.</p>}
            <div className="space-y-2">
              {steps.map((step, index) => (
                <div key={rowKeys[index] || `step-${index}`} className="flex items-start gap-2">
                  <span className="mt-2 w-7 shrink-0 font-mono text-xs font-black text-emerald-800">{String(index + 1).padStart(2, "0")}</span>
                  <textarea
                    className={FIELD}
                    rows={2}
                    value={step}
                    onChange={(event) => setSteps((current) => current.map((value, valueIndex) => (valueIndex === index ? event.target.value : value)))}
                  />
                  <div className="flex shrink-0 flex-col gap-1">
                    <button type="button" className={ICON_BTN} aria-label="Move step up" disabled={index === 0} onClick={() => moveStep(index, -1)}>
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className={ICON_BTN} aria-label="Move step down" disabled={index === steps.length - 1} onClick={() => moveStep(index, 1)}>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className={ICON_BTN} aria-label="Delete step" onClick={() => deleteStep(index)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className={SECONDARY_BTN}
              onClick={() => {
                setSteps((current) => [...current, ""]);
                setStepIds((current) => [...current, null]);
                setRowKeys((current) => [...current, `step-new-${current.length}-${Date.now()}`]);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Step
            </button>
          </section>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#edf2ee] bg-white px-5 py-4 sm:px-6">
          <button type="button" className={SECONDARY_BTN} onClick={onClose} disabled={saving}>Cancel</button>
          <button type="button" className={PRIMARY_BTN} onClick={() => void handleSave()} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save Formulation
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StageDialog({
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <button type="button" aria-label="Close dialog" className="absolute inset-0 bg-[#04140e]/55 backdrop-blur-[2px]" onClick={onClose} />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="stage-dialog-title"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="relative z-10 flex max-h-[85vh] w-full max-w-[680px] flex-col overflow-hidden rounded-3xl border border-[#dde6df] bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#edf2ee] px-5 py-4">
          <div>
            <h2 id="stage-dialog-title" className="text-lg font-black tracking-tight text-[#0f2c20]">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm font-semibold text-[#52645d]">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-[#52645d] transition hover:bg-[#f4f7f5] hover:text-[#0f2c20]" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#edf2ee] px-5 py-4">{footer}</div>
      </motion.div>
    </motion.div>
  );
}

async function postJson(url: string, body: object) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) throw new Error(data.error || "The request could not be completed.");
  return data;
}

export default function FormulationSafetyClient({
  projectId,
  project,
  plantData,
  initialFormulation,
  initialVersions,
  initialActiveVersion,
  initialComponents,
  initialSteps,
  initialRationale,
  initialSafetyAssessment,
  automation,
}: FormulationSafetyProps) {
  const router = useRouter();
  const plantName = project.plantName || "Unspecified Plant";
  const stageCompleted = (getStageByKey(project.currentStage || "")?.number || 4) > 4;
  const generatedAreas = Object.fromEntries(automation.areas.map((area) => [area.key, area])) as Partial<
    Record<SafetyAreaKey, (typeof automation.areas)[number]>
  >;
  const rawSafetyNotes = String(initialSafetyAssessment?.additionalSafetyNotes || "");
  const parsedNotes = readReviewed(rawSafetyNotes);
  const initialAi = readAiStore(rawSafetyNotes);

  const [formulationId, setFormulationId] = useState<number | null>(initialFormulation?.id ?? null);
  const [versionId, setVersionId] = useState<number | null>(initialActiveVersion?.id ?? null);
  const [prototypeName, setPrototypeName] = useState(automation.prototypeName);
  const [formulationType, setFormulationType] = useState(automation.formulationType || "");
  const [dosageForm, setDosageForm] = useState(automation.dosageForm || "");
  const [researchPurpose, setResearchPurpose] = useState(String(initialFormulation?.researchPurpose || "").trim());
  const [editingFormulation, setEditingFormulation] = useState(false);
  const [showSop, setShowSop] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [componentIds, setComponentIds] = useState<Record<string, number>>(() => {
    const next: Record<string, number> = {};
    for (const component of initialComponents) {
      const key = String(component.componentName || "").trim().toLowerCase();
      if (key && component.id) next[key] = component.id;
    }
    return next;
  });
  const [amounts, setAmounts] = useState<Record<string, string>>(() => {
    const next: Record<string, string> = {};
    for (const component of initialComponents) {
      const amount = String(component.concentration || component.quantity || "").trim();
      if (isRealAmount(amount)) next[String(component.componentName || "").toLowerCase()] = amount;
    }
    return next;
  });
  const [methods, setMethods] = useState<Record<string, string>>(() => {
    const next: Record<string, string> = {};
    for (const component of initialComponents) {
      const method = String(component.notes || "").trim();
      if (method && !isLegacyPlaceholder(method)) next[String(component.componentName || "").toLowerCase()] = method;
    }
    return next;
  });
  const [steps, setSteps] = useState<string[]>(() => {
    const saved = initialSteps.map((item) => ({ id: item.id as number | null, text: String(item.procedureText || "").trim() })).filter((item) => item.text);
    return saved.length > 0 ? saved.map((item) => item.text) : automation.sopSteps;
  });
  const [stepIds, setStepIds] = useState<(number | null)[]>(() => {
    const saved = initialSteps.map((item) => ({ id: item.id as number | null, text: String(item.procedureText || "").trim() })).filter((item) => item.text);
    return saved.length > 0 ? saved.map((item) => item.id) : automation.sopSteps.map(() => null);
  });
  const [areaNotes, setAreaNotes] = useState<AreaNotes>({
    toxicity: researcherNote(initialSafetyAssessment?.toxicityEvidence || "", generatedAreas.toxicity?.text || ""),
    contraindications: researcherNote(initialSafetyAssessment?.potentialContraindications || "", generatedAreas.contraindications?.text || ""),
    interactions: researcherNote(initialSafetyAssessment?.herbDrugInteractions || "", generatedAreas.interactions?.text || ""),
    dose: researcherNote(initialSafetyAssessment?.doseConcentrationConcerns || "", generatedAreas.dose?.text || ""),
    formulation: researcherNote(initialSafetyAssessment?.ingredientSpecificConcerns || "", generatedAreas.formulation?.text || ""),
  });
  const [reviewedKeys, setReviewedKeys] = useState<SafetyAreaKey[]>(parsedNotes.keys);
  const [aiAreas, setAiAreas] = useState<AiStore["areas"]>(initialAi.areas);
  const [synthesis, setSynthesis] = useState(initialAi.synthesis);
  const [synthesisApproved, setSynthesisApproved] = useState(initialAi.synthesisApproved);
  const [generating, setGenerating] = useState<SafetyAreaKey | "synthesis" | null>(null);
  const aiRef = useRef<AiStore>(initialAi);
  const [focus, setFocus] = useState<SafetyAreaKey>("toxicity");
  const [justReviewed, setJustReviewed] = useState<SafetyAreaKey | null>(null);
  const [attentionKey, setAttentionKey] = useState<string | null>(null);
  const savedRationale = String(initialRationale?.componentSelectionRationale || "");
  const rationaleIsLegacy = !savedRationale.trim() || isLegacyPlaceholder(savedRationale);
  const [why, setWhy] = useState(rationaleIsLegacy ? automation.rationale : savedRationale);
  const [approved, setApproved] = useState(!rationaleIsLegacy && String(initialRationale?.validationQuestions || "").includes(APPROVED_MARK));
  const [safetyNotes] = useState(parsedNotes.notes);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!justReviewed) return;
    const timer = window.setTimeout(() => setJustReviewed(null), 900);
    return () => window.clearTimeout(timer);
  }, [justReviewed]);

  const generationStarted = useRef(false);
  useEffect(() => {
    if (generationStarted.current) return;
    generationStarted.current = true;
    void (async () => {
      const generatedNow: SafetyAreaKey[] = [];
      for (const key of AREA_ORDER) {
        if (aiRef.current.areas[key]?.summary) continue;
        const ok = await generateArea(key);
        if (!ok) return;
        generatedNow.push(key);
      }
      let synthesisChanged = false;
      if (!aiRef.current.synthesis) {
        const ok = await generateSynthesis();
        if (ok) synthesisChanged = true;
      }
      if (generatedNow.length || synthesisChanged) {
        const keys = reviewedKeys.filter((key) => !generatedNow.includes(key));
        setReviewedKeys(keys);
        try {
          await persist({ reviewedKeys: keys, approved: synthesisChanged ? false : undefined });
        } catch (err) {
          setError(err instanceof Error ? err.message : "The assessment could not be saved.");
        }
      }
    })();
    // Generate once from the formulation and evidence already loaded for this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function areaReviewed(key: SafetyAreaKey, keys = reviewedKeys) {
    return keys.includes(key);
  }

  const readiness = useMemo(
    () =>
      AREA_ORDER.map((key) => ({
        key,
        label: AREA_META[key].label,
        ready: areaReviewed(key),
      })),
    // areaReviewed closes over generated status and the explicit review list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reviewedKeys, automation.areas]
  );
  const readyCount = readiness.filter((area) => area.ready).length;
  const safetyComplete = readyCount === readiness.length;
  const dosageReady = Boolean(dosageForm.trim());
  const nameReady = Boolean(prototypeName.trim());
  const synthesisReady = synthesisApproved && Boolean(synthesis.trim());
  const canComplete = safetyComplete && dosageReady && nameReady && synthesisReady;
  aiRef.current = { schema: AI_SCHEMA, areas: aiAreas, synthesis, synthesisApproved };

  const part = recordedOrMissing(String(plantData?.partsStudied || ""));
  const solvent = recordedOrMissing(String(plantData?.extractionSolvent || ""));
  const extraction = recordedOrMissing(String(plantData?.extractionMethod || "").replace(/\s+with\s+/gi, " + "));
  const formLabel = displayText(dosageForm);
  const typeLabel = displayText(formulationType);
  const purposeLabel = displayText(researchPurpose);
  const nameLabel = displayText(prototypeName);
  const procedureSteps = steps.flatMap(splitMergedStep).map((item) => item.trim()).filter(Boolean);

  function valueToStore(key: SafetyAreaKey, notes: AreaNotes, keys: SafetyAreaKey[]) {
    const generatedAssessment = aiRef.current.areas[key]?.summary?.trim();
    if (generatedAssessment) return generatedAssessment;
    const written = notes[key].trim();
    if (written) return written;
    const generated = String(generatedAreas[key]?.text || "").trim();
    if (generated && generated !== NEEDS_REVIEW && !isLegacyPlaceholder(generated)) return generated;
    if (keys.includes(key) || (key !== "dose" && generatedAreas[key]?.status === "ready")) return INSUFFICIENT;
    return generated || NEEDS_REVIEW;
  }

  async function persist(input: { approved?: boolean; reviewedKeys?: SafetyAreaKey[]; areaNotes?: AreaNotes; rationale?: string; formulation?: FormulationDraft } = {}) {
    const isApproved = input.approved ?? approved;
    const keys = input.reviewedKeys ?? reviewedKeys;
    const notes = input.areaNotes ?? areaNotes;
    const rationaleText = (input.rationale ?? why).trim();
    const form = input.formulation;
    const name = (form?.prototypeName ?? prototypeName).trim();
    const type = (form?.formulationType ?? formulationType).trim();
    const dosage = (form?.dosageForm ?? dosageForm).trim();
    const purpose = (form?.researchPurpose ?? researchPurpose).trim();
    const amountMap = form?.amounts ?? amounts;
    const methodMap = form?.methods ?? methods;
    const stepTexts = form?.steps ?? steps;
    const stepIdList = form?.stepIds ?? stepIds;

    const overview = await postJson(`/api/researcher/projects/${projectId}/formulation`, {
      action: "save-overview",
      formulationName: name,
      formulationCode: initialFormulation?.formulationCode || `FORM-${projectId}-01`,
      formulationType: type || NEEDS_REVIEW,
      researchPurpose: purpose || NEEDS_REVIEW,
      dosageFormType: dosage,
      researcherRationale: rationaleText,
      notes: initialFormulation?.notes || "",
    });
    const nextFormulationId = overview.formulationId as number;
    const nextVersionId = overview.versionId as number;
    if (!nextFormulationId || !nextVersionId) throw new Error("The formulation version could not be saved.");
    setFormulationId(nextFormulationId);
    setVersionId(nextVersionId);

    const nextComponentIds = { ...componentIds };
    for (const compound of automation.compounds) {
      const key = compound.name.toLowerCase();
      const amount = (amountMap[key] || "").trim();
      const saved = await postJson(`/api/researcher/projects/${projectId}/formulation`, {
        action: "save-component",
        componentId: nextComponentIds[key] || null,
        formulationId: nextFormulationId,
        versionId: nextVersionId,
        componentName: compound.name,
        roleInFormulation: "Active constituent",
        sourceMaterial: compound.formula || "",
        quantity: amount,
        unit: "",
        concentration: amount,
        notes: (methodMap[key] || "").trim(),
      });
      if (!nextComponentIds[key] && saved.insertedId) nextComponentIds[key] = saved.insertedId;
    }
    setComponentIds(nextComponentIds);

    const nextStepIds = [...stepIdList];
    for (const [index, procedureText] of stepTexts.entries()) {
      if (!procedureText.trim()) continue;
      const saved = await postJson(`/api/researcher/projects/${projectId}/formulation`, {
        action: "save-step",
        stepId: nextStepIds[index] || null,
        formulationId: nextFormulationId,
        versionId: nextVersionId,
        stepNumber: index + 1,
        procedureText,
      });
      if (!nextStepIds[index] && saved.insertedId) nextStepIds[index] = saved.insertedId;
    }
    const keptIds = new Set(nextStepIds.filter((id): id is number => Boolean(id)));
    for (const id of stepIds) {
      if (id && !keptIds.has(id)) {
        await postJson(`/api/researcher/projects/${projectId}/formulation`, {
          action: "delete-step",
          stepId: id,
          versionId: nextVersionId,
        });
      }
    }
    setStepIds(nextStepIds);

    const preservedValidation = String(initialRationale?.validationQuestions || "").replaceAll(APPROVED_MARK, "").trim();
    await postJson(`/api/researcher/projects/${projectId}/formulation`, {
      action: "save-rationale",
      formulationId: nextFormulationId,
      versionId: nextVersionId,
      componentSelectionRationale: rationaleText,
      literatureSupport: initialRationale?.literatureSupport || "",
      previousStagesInfluence: initialRationale?.previousStagesInfluence || "",
      knownLimitations: initialRationale?.knownLimitations || "",
      validationQuestions: isApproved ? [preservedValidation, APPROVED_MARK].filter(Boolean).join("\n\n") : preservedValidation,
    });

    await postJson(`/api/researcher/projects/${projectId}/safety`, {
      action: "save-sections",
      versionId: nextVersionId,
      knownSafetyEvidence: initialSafetyAssessment?.knownSafetyEvidence || "",
      toxicityEvidence: valueToStore("toxicity", notes, keys),
      potentialContraindications: valueToStore("contraindications", notes, keys),
      herbDrugInteractions: valueToStore("interactions", notes, keys),
      populationConsiderations: initialSafetyAssessment?.populationConsiderations || "",
      ingredientSpecificConcerns: valueToStore("formulation", notes, keys),
      doseConcentrationConcerns: valueToStore("dose", notes, keys),
      knownAdverseEffects: initialSafetyAssessment?.knownAdverseEffects || "",
      evidenceGaps: initialSafetyAssessment?.evidenceGaps || "",
      additionalSafetyNotes: packNotes(safetyNotes, keys, aiRef.current),
    });
  }

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function buildContext(key: SafetyAreaKey, amountOverride?: Record<string, string>) {
    const amountMap = amountOverride ?? amounts;
    const papers = (generatedAreas[key]?.papers || []).map((paper, index) => ({
      id: paper.pmid ? `pmid:${paper.pmid}` : `ref:${key}:${index}`,
      title: paper.title,
      journal: paper.journal,
      year: paper.year,
      pmid: paper.pmid,
      excerpt: paper.quote ? clip(paper.quote, 280) : null,
    }));
    return {
      area: key,
      plant: plantName,
      scientificName: String(project.plantScientificName || ""),
      formulationName: prototypeName,
      formulationType,
      dosageForm,
      purpose: researchPurpose,
      plantPart: part === NOT_PROVIDED ? "" : part,
      solvent: solvent === NOT_PROVIDED ? "" : solvent,
      extraction: extraction === NOT_PROVIDED ? "" : extraction,
      compounds: automation.compounds.map((compound) => ({
        name: compound.name,
        formula: compound.formula,
        concentration: (amountMap[compound.name.toLowerCase()] || "").trim(),
        screening: Boolean(compound.screening),
        docking: (compound.docking || []).map((item) => `${item.line} [PREDICTED]`),
      })),
      papers,
    };
  }

  async function generateArea(key: SafetyAreaKey, amountOverride?: Record<string, string>) {
    setGenerating(key);
    setError(null);
    try {
      const data = await postJson(`/api/researcher/projects/${projectId}/formulation-safety/ai`, {
        action: "assess",
        context: buildContext(key, amountOverride),
      });
      const assessment = data.assessment as StoredAssessment;
      const next = { ...aiRef.current.areas, [key]: assessment };
      aiRef.current = { ...aiRef.current, areas: next };
      setAiAreas(next);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "The assessment could not be generated.");
      return false;
    } finally {
      setGenerating((current) => (current === key ? null : current));
    }
  }

  async function generateSynthesis() {
    if (!AREA_ORDER.every((key) => aiRef.current.areas[key]?.summary)) return false;
    setGenerating("synthesis");
    setError(null);
    try {
      const data = await postJson(`/api/researcher/projects/${projectId}/formulation-safety/ai`, {
        action: "synthesize",
        plant: plantName,
        formulationName: prototypeName,
        referenceCount: automation.papers.length,
        areas: AREA_ORDER.map((key) => ({
          key,
          summary: aiRef.current.areas[key]?.summary || "",
          status: aiRef.current.areas[key]?.status || "INSUFFICIENT_EVIDENCE",
        })),
      });
      const text = String(data.synthesis || "").trim();
      if (!text) throw new Error("The synthesis could not be generated.");
      setSynthesis(text);
      setSynthesisApproved(false);
      setApproved(false);
      aiRef.current = { ...aiRef.current, synthesis: text, synthesisApproved: false };
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "The synthesis could not be generated.");
      return false;
    } finally {
      setGenerating((current) => (current === "synthesis" ? null : current));
    }
  }

  async function approveArea(key: SafetyAreaKey) {
    const summary = aiRef.current.areas[key]?.summary?.trim();
    if (!summary) return;
    const keys = reviewedKeys.includes(key) ? reviewedKeys : [...reviewedKeys, key];
    const notes = { ...areaNotes, [key]: summary };
    setReviewedKeys(keys);
    setAreaNotes(notes);
    setJustReviewed(key);
    setBusy("mark");
    setError(null);
    try {
      await persist({ reviewedKeys: keys, areaNotes: notes });
    } catch (err) {
      setReviewedKeys(reviewedKeys);
      setAreaNotes(areaNotes);
      setJustReviewed(null);
      setError(err instanceof Error ? err.message : "The review could not be saved.");
    } finally {
      setBusy(null);
    }
  }

  async function approveSynthesis() {
    const text = synthesis.trim();
    if (!text) return;
    setSynthesisApproved(true);
    setWhy(text);
    setApproved(true);
    aiRef.current = { ...aiRef.current, synthesis: text, synthesisApproved: true };
    setBusy("approve");
    setError(null);
    try {
      await persist({ approved: true, rationale: text });
    } catch (err) {
      setSynthesisApproved(false);
      setApproved(false);
      aiRef.current = { ...aiRef.current, synthesisApproved: false };
      setError(err instanceof Error ? err.message : "The synthesis could not be approved.");
    } finally {
      setBusy(null);
    }
  }

  async function saveFormulation(draft: FormulationDraft) {
    setBusy("formulation");
    setError(null);
    setPrototypeName(draft.prototypeName);
    setFormulationType(draft.formulationType);
    setDosageForm(draft.dosageForm);
    setResearchPurpose(draft.researchPurpose);
    setAmounts(draft.amounts);
    setMethods(draft.methods);
    setSteps(draft.steps);
    setStepIds(draft.stepIds);
    try {
      await persist({ formulation: draft });
      setEditingFormulation(false);
      const doseOk = await generateArea("dose", draft.amounts);
      const formulationOk = await generateArea("formulation", draft.amounts);
      if (doseOk && formulationOk && AREA_ORDER.every((key) => aiRef.current.areas[key]?.summary)) {
        await generateSynthesis();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "The formulation could not be saved.";
      setError(message);
      throw err;
    } finally {
      setBusy(null);
    }
  }

  async function completeStage() {
    if (!canComplete) {
      const first = blockers[0];
      if (first) first.onSelect();
      return;
    }
    setBusy("complete");
    setError(null);
    try {
      await persist({ approved: true, rationale: aiRef.current.synthesis || why });
      const data = await postJson(`/api/researcher/projects/${projectId}/formulation-safety`, { action: "complete-stage" });
      router.push(data.redirectUrl || `/researcher/projects/${projectId}/completion-integration`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Stage 4 could not be completed.";
      setError(message);
      if (/safety/i.test(message)) scrollToSection(`safety-${readiness.find((area) => !area.ready)?.key || "toxicity"}`);
      else if (/formulation/i.test(message)) setEditingFormulation(true);
      setBusy(null);
    }
  }

  const safetyGaps = readiness.filter((area) => !area.ready).map((area) => ({
    key: area.key,
    label: area.label,
    onSelect: () => scrollToSection(`safety-${area.key}`),
  }));
  const blockers = [
    ...(!nameReady ? [{ key: "prototype", label: "Formulation name", onSelect: () => { setEditingFormulation(true); setAttentionKey("prototype"); } }] : []),
    ...(!dosageReady ? [{ key: "dosage", label: "Dosage form", onSelect: () => { setEditingFormulation(true); setAttentionKey("dosage"); } }] : []),
    ...safetyGaps,
    ...(!synthesisReady ? [{ key: "synthesis", label: "Safety synthesis", onSelect: () => scrollToSection("safety-synthesis") }] : []),
  ];

  const referenceCount = automation.papers.length;

  const materialFacts: { key: string; icon: LucideIcon; label: string; value: string }[] = [
    { key: "part", icon: Leaf, label: "Plant Material", value: part },
    { key: "solvent", icon: Droplets, label: "Solvent", value: solvent },
    { key: "extraction", icon: Microscope, label: "Extraction", value: extraction },
  ];

  return (
    <div className="w-full max-w-none space-y-8 pb-28 pt-2 font-sans">
      <ResearchStageHeader
        projectId={projectId}
        stageNumber={4}
        stageTitle="Formulation & Safety"
        plantCommonName={plantName}
        plantScientificName={project.plantScientificName}
        statusLabel={stageCompleted ? "Completed" : "In Progress"}
        complete={stageCompleted}
      />

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
          <TriangleAlert className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 1: FORMULATION ARCHITECTURE (Compact, Animated, Color) */}
      {/* ============================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="group relative overflow-hidden rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-white via-[#f7faf8] to-emerald-50/30 p-5 sm:p-6 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all duration-300"
      >
        {/* Subtle Ambient Glows */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 left-1/3 h-40 w-40 rounded-full bg-teal-500/10 blur-2xl" />

        <div className="relative z-10 space-y-4">
          {/* Top Bar: Title, Badges, and Quick Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 10, scale: 1.06 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-md shadow-emerald-700/20"
              >
                <FlaskConical className="h-5 w-5" />
              </motion.div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${nameLabel === NOT_PROVIDED ? "text-amber-800" : "text-[#0a2e1f]"}`}>
                    {nameLabel}
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/80 bg-emerald-100/90 px-2.5 py-0.5 text-[11px] font-bold text-emerald-950 shadow-2xs">
                    <Sparkles className="h-3 w-3 text-emerald-700" />
                    {typeLabel}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-teal-200/80 bg-teal-50 px-2.5 py-0.5 text-[11px] font-bold text-teal-900 shadow-2xs">
                    <Pill className="h-3 w-3 text-teal-700" />
                    {formLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions: Edit Formulation & Toggle SOP */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setEditingFormulation(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-emerald-900/10 hover:shadow transition-all active:scale-98"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-200" />
                <span>Edit Formulation</span>
              </button>

              <button
                type="button"
                aria-expanded={showSop}
                onClick={() => setShowSop((open) => !open)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white/90 hover:bg-emerald-50/70 px-3 py-1.5 text-xs font-bold text-[#143d2c] shadow-2xs transition-all active:scale-98"
              >
                <FileText className="h-3.5 w-3.5 text-emerald-700" />
                <span>{showSop ? "Hide SOP" : "View SOP"}</span>
                <span className="ml-0.5 rounded-md bg-emerald-100/80 px-1.5 py-0.2 text-[10px] font-extrabold text-emerald-900">
                  {procedureSteps.length}
                </span>
                {showSop ? <ChevronUp className="h-3.5 w-3.5 text-emerald-700" /> : <ChevronDown className="h-3.5 w-3.5 text-emerald-700" />}
              </button>
            </div>
          </div>

          {/* Compact Extraction & Parameter Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              {
                icon: Leaf,
                label: "Plant Material",
                value: part,
                badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-200",
                iconColor: "text-emerald-700",
              },
              {
                icon: Droplets,
                label: "Solvent",
                value: solvent,
                badgeBg: "bg-sky-100 text-sky-800 border-sky-200",
                iconColor: "text-sky-700",
              },
              {
                icon: Microscope,
                label: "Extraction Method",
                value: extraction,
                badgeBg: "bg-indigo-100 text-indigo-800 border-indigo-200",
                iconColor: "text-indigo-700",
              },
            ].map((item) => (
              <motion.div
                key={item.label}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-3 rounded-2xl border border-emerald-100/90 bg-white/90 p-3 shadow-2xs backdrop-blur-xs"
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${item.badgeBg}`}>
                  <item.icon className={`h-4.5 w-4.5 ${item.iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#6c8577]">
                    {item.label}
                  </p>
                  <p className={`truncate text-xs font-bold ${readoutTone(item.value)}`}>
                    {item.value}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Compact Purpose Bar */}
          <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-100/80 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/50 px-3.5 py-2.5 shadow-2xs">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-2xs">
              <Target className="h-3.5 w-3.5" />
            </span>
            <p className="text-xs leading-relaxed text-[#1b3d2f]">
              <span className="mr-1.5 font-black uppercase tracking-wider text-emerald-950 text-[10px]">Purpose:</span>
              <span className={`font-semibold ${readoutTone(purposeLabel)}`}>{purposeLabel}</span>
            </p>
          </div>

          {/* Compounds Subsection - Compact, Colorful, Animated */}
          <div className="pt-1">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                  <Atom className="h-3.5 w-3.5 text-emerald-700" />
                </span>
                <h3 className="text-xs font-black uppercase tracking-wider text-[#0e3022]">
                  Standardized Marker Compounds
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-emerald-800/80">
                {automation.compounds.length} compounds from Stage 2 & 3
              </span>
            </div>

            {automation.compounds.length === 0 ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs font-semibold text-amber-900">
                {NOT_PROVIDED}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {automation.compounds.map((compound) => {
                  const key = compound.name.toLowerCase();
                  const amount = shownAmount(amounts[key] || "");
                  const note = cleanChoice(methods[key] || "") || NOT_PROVIDED;
                  const needsAmount = amount === NEEDS_INPUT;
                  const noNote = note === NOT_PROVIDED;

                  return (
                    <motion.article
                      key={compound.name}
                      whileHover={{ y: -2, scale: 1.008 }}
                      transition={{ duration: 0.15 }}
                      className="group relative overflow-hidden rounded-2xl border border-emerald-200/90 bg-white/95 p-3.5 shadow-2xs hover:border-emerald-400 hover:shadow-md transition-all duration-200"
                    >
                      {/* Top Row: Compound Name & Formula Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-800 border border-emerald-200/60 shadow-2xs">
                            <Dna className="h-3.5 w-3.5 text-emerald-700" />
                          </span>
                          <p className="text-sm font-black text-[#0c2e1f] tracking-tight">
                            {compound.name}
                          </p>
                        </div>
                        {compound.formula && (
                          <span className="font-mono text-[11px] font-extrabold text-emerald-900 bg-emerald-50/90 border border-emerald-200/80 px-2 py-0.5 rounded-lg shadow-2xs">
                            {compound.formula}
                          </span>
                        )}
                      </div>

                      {/* Bottom Row: Amount & Preparation in compact pill format */}
                      <div className="mt-3 grid grid-cols-2 gap-2.5 pt-2.5 border-t border-slate-100">
                        {/* Amount */}
                        <div className="space-y-1">
                          <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            Amount
                          </span>
                          {needsAmount ? (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-amber-300/80 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-900">
                              <TriangleAlert className="h-3 w-3 text-amber-600 shrink-0" />
                              <span>Needs Input</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-xs font-bold text-emerald-900">
                              {amount}
                            </span>
                          )}
                        </div>

                        {/* Preparation */}
                        <div className="space-y-1">
                          <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            Preparation
                          </span>
                          {noNote ? (
                            <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-500">
                              Not provided
                            </span>
                          ) : (
                            <span className="truncate block text-xs font-semibold text-slate-800" title={note}>
                              {note}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            )}
          </div>

          {/* Animated SOP Procedural Steps */}
          <AnimatePresence>
            {showSop && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden pt-2"
              >
                <div className="rounded-2xl border border-emerald-200/80 bg-white/90 p-4 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between pb-1">
                    <p className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-emerald-700" />
                      Standard Operating Procedure (SOP)
                    </p>
                    <span className="text-[11px] font-semibold text-slate-400">
                      Step-by-step preparation protocol
                    </span>
                  </div>

                  {procedureSteps.length === 0 ? (
                    <p className="text-xs font-semibold text-amber-800">{NOT_PROVIDED}</p>
                  ) : (
                    <ol className="space-y-2">
                      {procedureSteps.map((item, index) => (
                        <li
                          key={`procedure-${index}`}
                          className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-[#fbfdfc] px-3 py-2 text-xs leading-relaxed text-[#1b3b2d]"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-100 font-mono text-[10px] font-black text-emerald-800">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="font-medium pt-0.5">{item}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>

      <section className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-3xl border border-[#dde6df] bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/40 p-5 sm:p-6 shadow-sm"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 right-1/4 h-40 w-40 rounded-full bg-teal-500/10 blur-2xl" />

          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-100/80 px-2.5 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider text-emerald-950">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                  Preclinical Safety
                </span>
                <span className="rounded-md border border-[#dde6df] bg-white/80 px-2 py-0.5 text-[11px] font-bold text-[#52645d]">
                  5 safety areas · 1 integrated synthesis
                </span>
              </div>

              <h2 className="flex items-center gap-2.5 text-2xl font-black tracking-tight text-[#0f2c20] sm:text-3xl">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-600/20">
                  <Sparkles className="h-5 w-5" />
                </span>
                AI Safety Assessment &amp; Synthesis
              </h2>
              <p className="text-xs font-semibold text-[#52645d] sm:text-sm">
                Evidence-assisted assessment · Researcher review required
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:flex-col sm:items-end">
              <div className="flex items-center gap-2.5 rounded-2xl border border-white/80 bg-white/90 px-3.5 py-2 shadow-xs backdrop-blur-md">
                <div className="flex flex-col text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#78997f]">Review Progress</span>
                  <span className="text-xs font-black text-[#0f2c20]">
                    {reviewedKeys.length} of 5 areas reviewed
                  </span>
                </div>
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-mono text-xs font-black">
                  {Math.round((reviewedKeys.length / 5) * 100)}%
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
                  synthesisReady
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-amber-200 bg-amber-50 text-amber-800"
                }`}
              >
                {synthesisReady ? (
                  <>
                    <CircleCheck className="h-3.5 w-3.5 text-emerald-600" />
                    Synthesis Approved
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full border-2 border-amber-500 animate-pulse" />
                    Synthesis Pending
                  </>
                )}
              </span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {AREA_ORDER.map((key) => {
            const meta = AREA_META[key];
            const Icon = meta.icon;
            const title = key === "dose" ? "Dose & Concentration" : meta.label;
            const assessment = aiAreas[key];
            const reviewed = areaReviewed(key);
            const papers = generatedAreas[key]?.papers || [];
            const busyHere = generating === key;
            return (
              <motion.article
                key={key}
                id={`safety-${key}`}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                transition={{ duration: 0.35 }}
                className="group scroll-mt-6 rounded-3xl border border-[#e2eae4] bg-white p-5 shadow-sm sm:p-6 flex flex-col justify-between hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-950/5 transition-all duration-300"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="inline-flex items-center gap-2.5 text-lg sm:text-xl font-black text-[#0f2c20]">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100/70 text-emerald-800 shrink-0 group-hover:scale-105 transition-transform">
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                      <span>{title}</span>
                    </h3>
                    {reviewed ? (
                      <motion.span
                        initial={justReviewed === key ? { scale: 0.7, opacity: 0 } : false}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800"
                      >
                        <CircleCheck className="h-3.5 w-3.5 text-emerald-600" />
                        Researcher Reviewed
                      </motion.span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                        <span className="h-2 w-2 rounded-full border-2 border-amber-400" />
                        Review required
                      </span>
                    )}
                  </div>

                  <div className={`relative mt-4 overflow-hidden rounded-2xl border p-4 sm:p-5 ${busyHere ? "border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-teal-50" : "border-[#e2eae4] bg-[#f8fbf9]"}`}>
                    {busyHere && <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-emerald-100/70 to-transparent" />}
                    <div className="relative">
                      <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-800">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
                        NatureAide AI Assessment
                      </p>
                      {assessment?.summary ? (
                        <motion.p key={assessment.summary} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mt-2.5 w-full text-sm leading-6 text-[#163328]">
                          {firstSentences(assessment.summary, 2)}
                        </motion.p>
                      ) : (
                        <p className="mt-2.5 text-xs font-semibold text-[#52645d]">{busyHere ? "Reading the retrieved studies…" : "Assessment not available yet."}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#edf2ee] pt-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#234237]">
                      <BookOpen className="h-3.5 w-3.5 text-emerald-700" />
                      {papers.length} supporting {papers.length === 1 ? "study" : "studies"}
                    </p>
                    <button type="button" className={SECONDARY_BTN} onClick={() => { setFocus(key); setEvidenceOpen(true); }}>View Evidence</button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className={SECONDARY_BTN}
                      disabled={busyHere || busy !== null}
                      onClick={() => {
                        void (async () => {
                          const ok = await generateArea(key);
                          if (!ok) return;
                          const keys = reviewedKeys.filter((item) => item !== key);
                          setReviewedKeys(keys);
                          try {
                            await persist({ reviewedKeys: keys });
                          } catch (err) {
                            setError(err instanceof Error ? err.message : "The review could not be saved.");
                          }
                        })();
                      }}
                    >
                      Regenerate
                    </button>
                    {!reviewed && (
                      <button type="button" className={PRIMARY_BTN} disabled={!assessment?.summary || busy !== null} onClick={() => void approveArea(key)}>
                        {busy === "mark" && justReviewed !== key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Review & Approve
                      </button>
                    )}
                  </div>
                </div>
              </motion.article>
            );
          })}
          <motion.article
            id="safety-synthesis"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            transition={{ duration: 0.35 }}
            className="group scroll-mt-6 rounded-3xl border border-[#e2eae4] bg-white p-5 shadow-sm sm:p-6 flex flex-col justify-between hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-950/5 transition-all duration-300"
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="inline-flex items-center gap-2.5 text-lg sm:text-xl font-black text-[#0f2c20]">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <Sparkles className="h-4.5 w-4.5" />
                  </span>
                  <span>Safety Synthesis</span>
                </h3>
                {synthesisReady ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
                    <CircleCheck className="h-3.5 w-3.5 text-emerald-600" />
                    Synthesis approved
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                    <span className="h-2 w-2 rounded-full border-2 border-amber-400" />
                    Approval required
                  </span>
                )}
              </div>

              <div className={`relative mt-4 overflow-hidden rounded-2xl border p-4 sm:p-5 ${generating === "synthesis" ? "border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-teal-50" : "border-[#e2eae4] bg-[#f8fbf9]"}`}>
                {generating === "synthesis" && <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-emerald-100/70 to-transparent" />}
                <div className="relative">
                  <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-800">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
                    AI Integrated Synthesis
                  </p>
                  {synthesis ? (
                    <motion.p key={synthesis} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2.5 w-full text-sm leading-6 text-[#163328]">
                      {firstSentences(visibleSynthesis(synthesis), 2)}
                    </motion.p>
                  ) : (
                    <p className="mt-2.5 text-xs font-semibold text-[#52645d]">
                      {generating === "synthesis" ? "Writing the synthesis…" : "Synthesis appears after the five assessments."}
                    </p>
                  )}
                  <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-[#78997f]">AI-generated synthesis · Requires researcher approval</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#edf2ee] pt-3">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#234237]">
                <BookOpen className="h-3.5 w-3.5 text-emerald-700" />
                {referenceCount} references
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className={SECONDARY_BTN}
                  disabled={generating !== null || busy !== null}
                  onClick={() => {
                    void (async () => {
                      const ok = await generateSynthesis();
                      if (!ok) return;
                      try {
                        await persist({ approved: false, rationale: aiRef.current.synthesis });
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "The synthesis could not be saved.");
                      }
                    })();
                  }}
                >
                  Regenerate
                </button>
                {!synthesisReady && (
                  <button
                    type="button"
                    className={PRIMARY_BTN}
                    disabled={!synthesis.trim() || busy !== null}
                    onClick={() => void approveSynthesis()}
                  >
                    {busy === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Approve Synthesis
                  </button>
                )}
              </div>
            </div>
          </motion.article>
        </div>
      </section>

      {canComplete && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          <CircleCheck className="h-5 w-5 shrink-0 text-emerald-700" />
          <div>
            <p className="font-black">Stage 4 Ready for Completion</p>
            <p className="text-xs font-semibold text-emerald-800">Formulation reviewed · Safety assessment reviewed · Synthesis approved</p>
          </div>
        </motion.div>
      )}

      <ResearchStageFooter
        projectId={projectId}
        stageNumber={4}
        stageTitle="Formulation & Safety"
        backHref={`/researcher/projects/${projectId}/docking`}
        backLabel="Back to Molecular Docking"
        statusMessage={
          !canComplete && blockers.length > 0
            ? `${blockers.length} requirements remaining`
            : "Formulation & Safety Complete"
        }
        primaryAction={{
          label: "Continue to Research Integration",
          onClick: completeStage,
          disabled: busy !== null || !canComplete,
          loading: busy === "complete",
        }}
      />

      <AnimatePresence>
        {editingFormulation && (
          <FormulationEditModal
            key="edit-formulation"
            subtitle={prototypeName.trim() || "Formulation"}
            compounds={automation.compounds}
            material={materialFacts}
            versions={initialVersions}
            formulationId={formulationId}
            versionId={versionId}
            attentionKey={attentionKey}
            saving={busy === "formulation"}
            initial={{ prototypeName, formulationType, dosageForm, researchPurpose, amounts, methods, steps, stepIds }}
            onClose={() => { if (busy !== "formulation") setEditingFormulation(false); }}
            onSave={saveFormulation}
            onSwitchVersion={async (nextVersionId) => {
              if (!formulationId) return;
              await postJson(`/api/researcher/projects/${projectId}/formulation`, { action: "switch-version", formulationId, versionId: nextVersionId });
              router.refresh();
            }}
          />
        )}
        {evidenceOpen && (
          <StageDialog
            key="evidence"
            title={`${focus === "dose" ? "Dose & Concentration" : AREA_META[focus].label} evidence`}
            subtitle={`${(generatedAreas[focus]?.papers || []).length} studies`}
            onClose={() => setEvidenceOpen(false)}
            footer={<button type="button" className={SECONDARY_BTN} onClick={() => setEvidenceOpen(false)}>Close</button>}
          >
            {(generatedAreas[focus]?.papers || []).length === 0 ? (
              <p className="text-sm font-semibold text-amber-900">{INSUFFICIENT}</p>
            ) : (
              <ul className="space-y-2">
                {(generatedAreas[focus]?.papers || []).map((paper) => (
                  <li key={`${paper.pmid || paper.title}-${paper.topic}`} className="rounded-xl border border-[#e2eae4] bg-[#f7faf8] px-3 py-2.5">
                    <p className="text-sm font-bold leading-5 text-[#0f2c20]">{paper.title}</p>
                    <p className="mt-0.5 text-xs text-[#52645d]">{[paper.journal, paper.year].filter(Boolean).join(" · ") || "Journal and year not recorded"}</p>
                    {paper.href && (
                      <a href={paper.href} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:underline">
                        PubMed
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </StageDialog>
        )}
      </AnimatePresence>
    </div>
  );
}
