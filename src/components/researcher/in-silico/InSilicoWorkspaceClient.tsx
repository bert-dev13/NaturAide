"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileText,
  FlaskConical,
  Leaf,
  Loader2,
  Microscope,
  Plus,
  Sprout,
  X,
} from "lucide-react";
import ResearchStageFooter from "@/components/researcher/stage/ResearchStageFooter";
import ResearchStageHeader from "@/components/researcher/stage/ResearchStageHeader";

interface CompoundItem {
  id: number;
  projectId: number;
  compoundName: string;
  iupacName?: string | null;
  smiles?: string | null;
  molecularFormula?: string | null;
  molecularWeight?: number | string | null;
  pubchemId?: string | null;
  plantSource?: string | null;
  sourceReference?: string | null;
  sourceNotes?: string | null;
  sourceProvenance: "VERIFIED_DATABASE" | "RESEARCHER_ENTERED" | "EXTERNAL_SOURCE";
  selectedForDocking: boolean | number;
  preparationStatus: string;
  createdAt?: string;
}

interface InsilicoResultItem {
  id: number;
  projectId: number;
  compoundId?: number | null;
  compoundName: string;
  analysisCategory?: string | null;
  predictionType: string;
  targetSelection?: string | null;
  resultSummary: string;
  detailedMetrics?: string | null;
  researcherNotes?: string | null;
  filePath?: string | null;
  engineTool?: string | null;
  engineVersion?: string | null;
  parameters?: string | null;
  resultProvenance: "SYSTEM_GENERATED" | "UPLOADED_RESULT" | "MANUAL_ENTRY" | "EXTERNAL_SOURCE";
  compoundSmiles?: string | null;
  molecularFormula?: string | null;
  molecularWeight?: number | string | null;
  createdAt?: string;
}

interface LiteratureReferenceItem {
  id?: number;
  title: string;
  authors?: string | null;
  year?: number | string | null;
  journalSource?: string | null;
  doiOrUrl?: string | null;
  pubmedId?: string | null;
  plantOrCompound?: string | null;
  keyFindings?: string | null;
  relevanceToCurrentResearch?: string | null;
}

interface InsilicoSynthesisData {
  keyFindings?: string | null;
  potentialLimitations?: string | null;
  selectionRationale?: string | null;
  compoundsForDocking?: string | null;
  status?: string | null;
}

interface InSilicoWorkspaceClientProps {
  projectId: number;
  project: {
    id: number;
    title: string;
    currentStage: string;
    status: string;
    plantName: string;
    plantScientificName?: string | null;
    researchObjective?: string | null;
    researchQuestion?: string | null;
  };
  initialCompounds: CompoundItem[];
  initialResults: InsilicoResultItem[];
  initialSynthesis: InsilicoSynthesisData;
  initialLiterature?: LiteratureReferenceItem[];
}

interface MetricField {
  value?: string;
  status?: string;
}

interface ScreeningMetrics {
  cid?: string | number;
  properties?: {
    molecularWeight?: MetricField;
    molecularFormula?: MetricField;
    logP?: MetricField;
    hBondDonors?: MetricField;
    hBondAcceptors?: MetricField;
    tpsa?: MetricField;
    rotatableBonds?: MetricField;
  };
  drugLikeness?: {
    lipinskiRuleOfFive?: {
      result?: string;
      violations?: number;
      violationsList?: string[];
      status?: string;
    };
  };
  admet?: {
    giAbsorption?: { prediction?: string; status?: string; model?: string };
    bbbPermeability?: { prediction?: string; status?: string; model?: string };
    cyp3a4Inhibition?: { prediction?: string; status?: string; model?: string };
    waterSolubility?: { prediction?: string; status?: string; model?: string };
    hergCardiacToxicity?: { prediction?: string; status?: string; note?: string };
    amesMutagenicity?: { prediction?: string; status?: string; note?: string };
    renalClearance?: { prediction?: string; status?: string; note?: string };
  };
}

type StepId = 1 | 2 | 3;
type ModalState =
  | { type: "add" }
  | { type: "results"; compoundId: number }
  | { type: "research"; compoundId: number }
  | { type: "rationale" }
  | null;

type ScreeningProfile = {
  screened: boolean;
  violations: number;
  violationsList: string[];
  gi: string;
  bbb: string;
  lipinskiLine: string;
  admetLine: string;
  verdict: string;
  step3Detail: string;
  badge: "Recommended" | "Review" | "Pending";
  suitable: boolean;
  metrics: ScreeningMetrics | null;
};

const STEPS: Array<{ id: StepId; label: string }> = [
  { id: 1, label: "Compounds" },
  { id: 2, label: "Screening" },
  { id: 3, label: "Docking Selection" },
];

const VERIFIED_PLANT_SUGGESTIONS: Record<
  string,
  Array<{
    name: string;
    provenance: string;
    source: string;
    formula: string;
    mw: number;
    cid: string;
  }>
> = {
  "momordica charantia": [
    {
      name: "Quercetin",
      provenance: "Literature-supported",
      source: "Sultana & Anwar (2008), Food Chemistry 108(3): 879-884",
      formula: "C15H10O7",
      mw: 302.24,
      cid: "5280343",
    },
    {
      name: "Charantin",
      provenance: "Literature-supported",
      source: "Pitiphanpong et al. (2007), J Chromatogr A 1163(1-2): 1-6",
      formula: "C35H60O6",
      mw: 576.85,
      cid: "11953835",
    },
    {
      name: "Momordicoside A",
      provenance: "Literature-supported",
      source: "Okabe et al. (1980), Chem Pharm Bull 28(9): 2753-2762",
      formula: "C36H58O9",
      mw: 634.84,
      cid: "14611414",
    },
    {
      name: "Cucurbitane-type triterpenoids (Kuguacin J)",
      provenance: "Literature-supported",
      source: "Chen et al. (2009), J Nat Prod 72(5): 884-888",
      formula: "C30H44O4",
      mw: 468.67,
      cid: "44445838",
    },
    {
      name: "Vicine",
      provenance: "Literature-supported",
      source: "Dutta et al. (1981), Phytochemistry 20(8): 2019-2020",
      formula: "C10H16N4O7",
      mw: 304.26,
      cid: "439528",
    },
  ],
  "blumea balsamifera": [
    {
      name: "L-Borneol",
      provenance: "Literature-supported",
      source: "Ali et al. (2014), J Ethnopharmacol 155(1): 230-238",
      formula: "C10H18O",
      mw: 154.25,
      cid: "8552",
    },
    {
      name: "Blumeatin",
      provenance: "Literature-supported",
      source: "Pang et al. (2014), Fitoterapia 99: 130-137",
      formula: "C16H14O6",
      mw: 302.28,
      cid: "101831",
    },
    {
      name: "Quercetin",
      provenance: "Literature-supported",
      source: "Zhu et al. (2018), Molecules 23(12): 3108",
      formula: "C15H10O7",
      mw: 302.24,
      cid: "5280343",
    },
  ],
  "vitex negundo": [
    {
      name: "Casticin",
      provenance: "Literature-supported",
      source: "Chowdhury et al. (2003), Phytochemistry 63(3): 365-369",
      formula: "C19H18O8",
      mw: 374.34,
      cid: "5315263",
    },
    {
      name: "Chrysosplenol D",
      provenance: "Literature-supported",
      source: "Diaz et al. (2003), J Nat Prod 66(6): 865-867",
      formula: "C18H16O8",
      mw: 360.31,
      cid: "155160",
    },
    {
      name: "Negundoside",
      provenance: "Literature-supported",
      source: "Azhar-Ul-Haq et al. (2004), Z Naturforsch B 59(4): 419-423",
      formula: "C22H26O11",
      mw: 466.43,
      cid: "11964251",
    },
  ],
};

function isSelected(compound: CompoundItem) {
  return compound.selectedForDocking === true || compound.selectedForDocking === 1;
}

function parseMetrics(result?: InsilicoResultItem | null): ScreeningMetrics | null {
  if (!result?.detailedMetrics) return null;
  try {
    return JSON.parse(result.detailedMetrics) as ScreeningMetrics;
  } catch {
    return null;
  }
}

function formatGi(value: string) {
  return value.replace(/\s*\/\s*/g, "/");
}

function resultForCompound(results: InsilicoResultItem[], compoundId: number) {
  return results.find((result) => result.compoundId === compoundId) || null;
}

function profileFor(result: InsilicoResultItem | null): ScreeningProfile {
  const metrics = parseMetrics(result);
  const lipinski = metrics?.drugLikeness?.lipinskiRuleOfFive;
  const violations = typeof lipinski?.violations === "number" ? lipinski.violations : 0;
  const gi = formatGi(metrics?.admet?.giAbsorption?.prediction || "—");
  const bbb = metrics?.admet?.bbbPermeability?.prediction || "—";
  const screened = Boolean(result);
  const giHigh = /high/i.test(gi) && !/low/i.test(gi);
  const suitable = screened && violations <= 1 && giHigh;

  let lipinskiLine = "Screening in progress";
  if (screened) {
    lipinskiLine =
      violations === 0
        ? "Lipinski Pass"
        : `Lipinski · ${violations} violation${violations === 1 ? "" : "s"}`;
  }

  let step3Detail = "Waiting for screening";
  if (screened && violations > 0) {
    step3Detail = `${violations} Lipinski violation${violations === 1 ? "" : "s"}`;
  } else if (screened) {
    step3Detail = `Lipinski Pass · GI ${gi}`;
  }

  return {
    screened,
    violations,
    violationsList: lipinski?.violationsList || [],
    gi,
    bbb,
    lipinskiLine,
    admetLine: screened ? `GI ${gi} · BBB ${bbb}` : "",
    verdict: !screened
      ? ""
      : suitable
        ? "Suitable for further investigation"
        : "Review before selection",
    step3Detail,
    badge: !screened ? "Pending" : suitable ? "Recommended" : "Review",
    suitable,
    metrics,
  };
}

function joinNames(names: string[]) {
  if (names.length <= 1) return names[0] || "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function buildShortRationale(selected: CompoundItem[], results: InsilicoResultItem[]) {
  const named = selected.map((compound) => ({
    name: compound.compoundName,
    profile: profileFor(resultForCompound(results, compound.id)),
  }));
  const names = named.map((item) => item.name);
  const list = joinNames(names);
  const review = named.filter((item) => item.profile.badge === "Review").map((item) => item.name);
  const allRecommended = named.every((item) => item.profile.badge === "Recommended");
  const was = names.length === 1 ? "was" : "were";

  if (review.length === names.length) {
    return names.length === 1
      ? `${names[0]} was selected for further investigation. Review its screening profile before molecular docking.`
      : `${list} were selected for further investigation. Review their screening profiles before molecular docking.`;
  }

  const lead = allRecommended
    ? `${list} ${was} selected based on ${names.length === 1 ? "its" : "their"} screening ${
        names.length === 1 ? "profile" : "profiles"
      } and suitability for further computational investigation.`
    : `${list} ${was} selected for further computational investigation.`;

  if (review.length === 0) return lead;
  return `${lead} Review ${joinNames(review)} before molecular docking.`;
}

function inferStep(
  compounds: CompoundItem[],
  results: InsilicoResultItem[],
  synthesis: InsilicoSynthesisData
): StepId {
  if (compounds.length === 0) return 1;
  const selected = compounds.some(isSelected);
  const hasRationale = Boolean(synthesis.selectionRationale?.trim());
  if (selected || hasRationale) return 3;
  if (results.length > 0) return 2;
  return 1;
}

function papersForCompound(literature: LiteratureReferenceItem[], compoundName: string) {
  const name = compoundName.toLowerCase();
  return literature.filter((paper) => {
    const haystack = `${paper.plantOrCompound || ""} ${paper.title || ""}`.toLowerCase();
    return haystack.includes(name);
  });
}

function normalizeLiterature(raw: Record<string, unknown>, compoundName: string): LiteratureReferenceItem | null {
  const title = typeof raw.title === "string" ? raw.title : "";
  if (!title) return null;
  const pubmedId = raw.pubmedId || raw.pmid;
  const doi = typeof raw.doi === "string" ? raw.doi : "";
  return {
    id: typeof raw.id === "number" ? raw.id : undefined,
    title,
    authors: typeof raw.authors === "string" ? raw.authors : null,
    year:
      typeof raw.year === "number" || typeof raw.year === "string"
        ? raw.year
        : typeof raw.publicationYear === "number"
          ? raw.publicationYear
          : null,
    journalSource:
      (typeof raw.journalSource === "string" && raw.journalSource) ||
      (typeof raw.journal === "string" && raw.journal) ||
      null,
    doiOrUrl:
      (typeof raw.doiOrUrl === "string" && raw.doiOrUrl) ||
      (doi ? `https://doi.org/${doi}` : null) ||
      (typeof raw.sourceUrl === "string" ? raw.sourceUrl : null),
    pubmedId: pubmedId ? String(pubmedId) : null,
    plantOrCompound: typeof raw.plantOrCompound === "string" ? raw.plantOrCompound : compoundName,
    keyFindings:
      (typeof raw.keyFindings === "string" && raw.keyFindings) ||
      (typeof raw.abstract === "string" && raw.abstract) ||
      (typeof raw.relevanceExplanation === "string" && raw.relevanceExplanation) ||
      null,
    relevanceToCurrentResearch:
      (typeof raw.relevanceToCurrentResearch === "string" && raw.relevanceToCurrentResearch) ||
      (typeof raw.relevanceExplanation === "string" && raw.relevanceExplanation) ||
      null,
  };
}

function provenanceLabel(value: CompoundItem["sourceProvenance"]) {
  if (value === "RESEARCHER_ENTERED") return "Researcher added";
  if (value === "EXTERNAL_SOURCE") return "External source";
  return "Literature-supported";
}

function CenteredModal({
  title,
  subtitle,
  onClose,
  wide = false,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-[#04140e]/55 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="insilico-modal-title"
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className={`relative z-10 flex max-h-[min(86vh,780px)] w-full flex-col overflow-hidden rounded-3xl border border-[#dde6df] bg-white shadow-2xl ${
          wide ? "max-w-2xl" : "max-w-lg"
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#edf2ee] bg-gradient-to-r from-emerald-50/80 via-teal-50/30 to-transparent px-6 py-4">
          <div>
            <h2 id="insilico-modal-title" className="text-lg font-black tracking-tight text-[#0f2c20]">
              {title}
            </h2>
            {subtitle && <p className="mt-1 text-xs font-medium leading-5 text-[#78997f]">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#52645d] transition hover:bg-[#f3f6f4] hover:text-[#10281c]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </motion.div>
    </div>
  );
}

function ResearchSection({
  icon: Icon,
  title,
  subtitle,
  action,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 }}
      className="w-full overflow-hidden rounded-3xl border border-[#dde6df] bg-white shadow-md"
    >
      <div className="flex flex-col items-start justify-between gap-3 border-b border-[#edf2ee] bg-gradient-to-r from-emerald-50/80 via-teal-50/30 to-transparent px-6 py-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 text-white shadow-md shadow-emerald-500/20">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#0f2c20] sm:text-lg">{title}</h2>
            {subtitle && <p className="text-xs font-medium text-[#78997f]">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="px-4 py-3 sm:px-6 sm:py-4">{children}</div>
    </motion.section>
  );
}

function SubtleAction({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-emerald-900 transition-colors hover:bg-emerald-50"
    >
      {children}
    </button>
  );
}

function PrimaryButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#0f3626] to-[#16a34a] px-6 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-700/20 transition-all hover:from-[#0c2c1f] hover:to-[#15803d] hover:shadow-xl hover:shadow-emerald-700/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 sm:w-auto"
    >
      {children}
    </button>
  );
}

export default function InSilicoWorkspaceClient({
  projectId,
  project,
  initialCompounds,
  initialResults,
  initialSynthesis,
  initialLiterature = [],
}: InSilicoWorkspaceClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [compounds, setCompounds] = useState<CompoundItem[]>(initialCompounds);
  const [results, setResults] = useState<InsilicoResultItem[]>(initialResults);
  const [literature, setLiterature] = useState<LiteratureReferenceItem[]>(initialLiterature);
  const [selectionRationale, setSelectionRationale] = useState(initialSynthesis.selectionRationale || "");
  const [rationaleApproved, setRationaleApproved] = useState(initialSynthesis.status === "APPROVED");
  const [step, setStep] = useState<StepId>(() => inferStep(initialCompounds, initialResults, initialSynthesis));

  const [screeningIds, setScreeningIds] = useState<number[]>([]);
  const [screeningErrors, setScreeningErrors] = useState<Record<number, string>>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [completingStage, setCompletingStage] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");
  const [modal, setModal] = useState<ModalState>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const [modalSearchTerm, setModalSearchTerm] = useState("");
  const [customCompoundName, setCustomCompoundName] = useState("");
  const [customSourceReference, setCustomSourceReference] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);
  const [addingCompound, setAddingCompound] = useState(false);
  const [rationaleDraft, setRationaleDraft] = useState("");
  const [approving, setApproving] = useState(false);

  const inFlightScreening = useRef(new Set<number>());
  const compoundIdsRef = useRef(new Set(initialCompounds.map((compound) => compound.id)));
  const selectionKeyRef = useRef<string | null>(null);
  const rationaleRef = useRef(selectionRationale);
  const approvedRef = useRef(rationaleApproved);
  const rationaleSourceRef = useRef<"saved" | "auto" | "manual">(
    initialSynthesis.selectionRationale?.trim() ? "saved" : "auto"
  );
  const saveSeq = useRef(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  rationaleRef.current = selectionRationale;
  approvedRef.current = rationaleApproved;
  compoundIdsRef.current = new Set(compounds.map((compound) => compound.id));

  const closeModal = useCallback(() => setModal(null), []);

  const plantKey = (project.plantScientificName || project.plantName || "momordica charantia")
    .toLowerCase()
    .trim();
  const plantSuggestions =
    VERIFIED_PLANT_SUGGESTIONS[plantKey] || VERIFIED_PLANT_SUGGESTIONS["momordica charantia"];
  const filteredSuggestions = plantSuggestions.filter((suggestion) =>
    suggestion.name.toLowerCase().includes(modalSearchTerm.toLowerCase())
  );

  const screenedIds = useMemo(() => {
    const ids = new Set<number>();
    for (const result of results) {
      if (result.compoundId != null) ids.add(result.compoundId);
    }
    return ids;
  }, [results]);

  const selectedCompounds = useMemo(() => compounds.filter(isSelected), [compounds]);

  const scheduleDraftSave = useCallback(
    (text: string) => {
      const seq = ++saveSeq.current;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        if (seq !== saveSeq.current || approvedRef.current || !text.trim()) return;
        try {
          const response = await fetch(`/api/researcher/projects/${projectId}/in-silico`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "save-rationale",
              selectionRationale: text,
              approve: false,
            }),
          });
          if (seq !== saveSeq.current || approvedRef.current) return;
          if (!response.ok) {
            setSaveState("error");
            return;
          }
          setSaveState("saved");
        } catch {
          if (seq === saveSeq.current) setSaveState("error");
        }
      }, 400);
    },
    [projectId]
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  useEffect(() => {
    if (saveState !== "saved") return;
    const timer = setTimeout(() => setSaveState("idle"), 1800);
    return () => clearTimeout(timer);
  }, [saveState]);

  useEffect(() => {
    const selected = compounds.filter(isSelected);
    const key = selected
      .map((compound) => compound.id)
      .sort((a, b) => a - b)
      .join(",");
    const isFirst = selectionKeyRef.current === null;
    const selectionChanged = !isFirst && selectionKeyRef.current !== key;
    selectionKeyRef.current = key;

    if (!key) {
      if (selectionChanged) {
        rationaleSourceRef.current = "auto";
        approvedRef.current = false;
        setRationaleApproved(false);
        setSelectionRationale("");
        rationaleRef.current = "";
      }
      return;
    }

    const shouldGenerate =
      selectionChanged ||
      (isFirst && !rationaleRef.current.trim()) ||
      (!approvedRef.current && rationaleSourceRef.current === "auto" && !isFirst);

    if (!shouldGenerate) return;

    const draft = buildShortRationale(selected, results);
    if (!selectionChanged && draft === rationaleRef.current) return;

    rationaleSourceRef.current = "auto";
    rationaleRef.current = draft;
    setSelectionRationale(draft);
    if (selectionChanged) {
      approvedRef.current = false;
      setRationaleApproved(false);
    }
    scheduleDraftSave(draft);
  }, [compounds, results, scheduleDraftSave]);

  const runScreening = useCallback(
    async (compoundId: number) => {
      if (inFlightScreening.current.has(compoundId)) return;
      inFlightScreening.current.add(compoundId);
      setScreeningIds((current) => (current.includes(compoundId) ? current : [...current, compoundId]));
      setScreeningErrors((current) => {
        if (!current[compoundId]) return current;
        const next = { ...current };
        delete next[compoundId];
        return next;
      });

      try {
        const response = await fetch(`/api/researcher/projects/${projectId}/in-silico`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "run-screening", compoundId }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "In-silico screening calculation failed");
        if (!compoundIdsRef.current.has(compoundId)) return;

        if (data.result) {
          setResults((current) => [data.result, ...current.filter((item) => item.compoundId !== compoundId)]);
          if (data.result.molecularFormula || data.result.molecularWeight) {
            setCompounds((current) =>
              current.map((compound) =>
                compound.id === compoundId
                  ? {
                      ...compound,
                      molecularFormula: data.result.molecularFormula || compound.molecularFormula,
                      molecularWeight: data.result.molecularWeight || compound.molecularWeight,
                      smiles: data.result.compoundSmiles || compound.smiles,
                    }
                  : compound
              )
            );
          }
        }

        if (Array.isArray(data.literature) && data.literature.length > 0) {
          const compound = compounds.find((item) => item.id === compoundId);
          const compoundName = data.result?.compoundName || compound?.compoundName || "";
          setLiterature((current) => {
            const existing = new Set(current.map((item) => item.pubmedId || item.title));
            const incoming = data.literature
              .map((item: Record<string, unknown>) => normalizeLiterature(item, compoundName))
              .filter(
                (item: LiteratureReferenceItem | null): item is LiteratureReferenceItem =>
                  Boolean(item) && !existing.has((item as LiteratureReferenceItem).pubmedId || item!.title)
              );
            return [...incoming, ...current];
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Screening didn't finish.";
        setScreeningErrors((current) => ({ ...current, [compoundId]: message }));
      } finally {
        inFlightScreening.current.delete(compoundId);
        setScreeningIds((current) => current.filter((id) => id !== compoundId));
      }
    },
    [compounds, projectId]
  );

  const screenMissing = useCallback(
    (list: CompoundItem[]) => {
      for (const compound of list) {
        if (!screenedIds.has(compound.id)) void runScreening(compound.id);
      }
    },
    [runScreening, screenedIds]
  );

  const goToCompounds = () => {
    setValidationError(null);
    setStep(1);
  };

  const goToScreening = () => {
    if (compounds.length === 0) {
      setValidationError("Add a compound to continue.");
      setStep(1);
      return;
    }
    setValidationError(null);
    screenMissing(compounds);
    setStep(2);
  };

  const goToDocking = () => {
    if (compounds.length === 0) {
      setValidationError("Add a compound to continue.");
      setStep(1);
      return;
    }
    if (screeningIds.length > 0) {
      setValidationError("Screening is still running.");
      setStep(2);
      return;
    }
    if (results.length === 0) {
      setValidationError("Screening needs to finish before you choose docking compounds.");
      screenMissing(compounds);
      setStep(2);
      return;
    }
    setValidationError(null);
    setStep(3);
  };

  const handleAddSuggestedCompound = async (suggestion: (typeof plantSuggestions)[number]) => {
    setAddingCompound(true);
    setCustomError(null);
    try {
      const response = await fetch(`/api/researcher/projects/${projectId}/in-silico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add-compound",
          compoundName: suggestion.name,
          sourceProvenance: "VERIFIED_DATABASE",
          sourceReference: suggestion.source,
          plantSource: project.plantName,
          molecularFormula: suggestion.formula,
          molecularWeight: suggestion.mw,
          pubchemId: suggestion.cid,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to add compound");

      const created: CompoundItem = {
        id: data.insertedId || Date.now(),
        projectId,
        compoundName: suggestion.name,
        molecularFormula: suggestion.formula,
        molecularWeight: suggestion.mw,
        pubchemId: suggestion.cid,
        sourceProvenance: "VERIFIED_DATABASE",
        sourceReference: suggestion.source,
        plantSource: project.plantName,
        selectedForDocking: 0,
        preparationStatus: "UNPREPARED",
      };
      setCompounds((current) => [...current, created]);
      setModal(null);
      setModalSearchTerm("");
      void runScreening(created.id);
    } catch (error) {
      setCustomError(error instanceof Error ? error.message : "Failed to add compound.");
    } finally {
      setAddingCompound(false);
    }
  };

  const handleAddCustomCompound = async () => {
    if (!customCompoundName.trim()) {
      setCustomError("Compound name is required.");
      return;
    }
    if (!customSourceReference.trim()) {
      setCustomError("A supporting reference is required for a compound you add.");
      return;
    }

    setAddingCompound(true);
    setCustomError(null);
    try {
      const response = await fetch(`/api/researcher/projects/${projectId}/in-silico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add-compound",
          compoundName: customCompoundName.trim(),
          sourceProvenance: "RESEARCHER_ENTERED",
          sourceReference: customSourceReference.trim(),
          plantSource: project.plantName,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to add custom compound");

      const created: CompoundItem = {
        id: data.insertedId || Date.now(),
        projectId,
        compoundName: customCompoundName.trim(),
        sourceProvenance: "RESEARCHER_ENTERED",
        sourceReference: customSourceReference.trim(),
        plantSource: project.plantName,
        selectedForDocking: 0,
        preparationStatus: "UNPREPARED",
      };
      setCompounds((current) => [...current, created]);
      setCustomCompoundName("");
      setCustomSourceReference("");
      setModal(null);
      void runScreening(created.id);
    } catch (error) {
      setCustomError(error instanceof Error ? error.message : "Failed to add custom compound.");
    } finally {
      setAddingCompound(false);
    }
  };

  const handleRemoveCompound = async (compound: CompoundItem) => {
    setRemovingId(compound.id);
    try {
      const response = await fetch(`/api/researcher/projects/${projectId}/in-silico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-compound", compoundId: compound.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to remove compound");
      setCompounds((current) => current.filter((item) => item.id !== compound.id));
      setResults((current) => current.filter((item) => item.compoundId !== compound.id));
      setPendingDeleteId(null);
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : "Failed to remove compound.");
    } finally {
      setRemovingId(null);
    }
  };

  const handleToggleDocking = async (compound: CompoundItem) => {
    const previous = compound.selectedForDocking;
    const nextValue = isSelected(compound) ? 0 : 1;
    setCompounds((current) =>
      current.map((item) => (item.id === compound.id ? { ...item, selectedForDocking: nextValue } : item))
    );
    setValidationError(null);

    try {
      const response = await fetch(`/api/researcher/projects/${projectId}/in-silico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle-docking",
          compoundId: compound.id,
          selectedForDocking: nextValue,
        }),
      });
      if (!response.ok) {
        setCompounds((current) =>
          current.map((item) => (item.id === compound.id ? { ...item, selectedForDocking: previous } : item))
        );
        setSaveState("error");
        return;
      }
      setSaveState("saved");
    } catch {
      setCompounds((current) =>
        current.map((item) => (item.id === compound.id ? { ...item, selectedForDocking: previous } : item))
      );
      setSaveState("error");
    }
  };

  const persistRationale = async (text: string, approve: boolean) => {
    const seq = ++saveSeq.current;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const response = await fetch(`/api/researcher/projects/${projectId}/in-silico`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save-rationale",
        selectionRationale: text,
        approve,
      }),
    });
    const data = await response.json();
    if (seq !== saveSeq.current) return data;
    if (!response.ok) throw new Error(data.error || "Failed to save the rationale");
    if (approve) {
      approvedRef.current = true;
      setRationaleApproved(true);
    }
    setSaveState("saved");
    return data;
  };

  const handleApproveRationale = async () => {
    if (!selectionRationale.trim()) {
      setValidationError("Select a compound to draft the rationale.");
      return;
    }
    setApproving(true);
    setValidationError(null);
    try {
      await persistRationale(selectionRationale, true);
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : "Failed to approve the rationale.");
    } finally {
      setApproving(false);
    }
  };

  const handleSaveRationaleDraft = async () => {
    const text = rationaleDraft.trim();
    if (!text) {
      setValidationError("Write a short rationale before saving.");
      return;
    }
    setApproving(true);
    setValidationError(null);
    try {
      rationaleSourceRef.current = "manual";
      rationaleRef.current = text;
      approvedRef.current = false;
      setSelectionRationale(text);
      setRationaleApproved(false);
      await persistRationale(text, false);
      setModal(null);
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : "Failed to save the rationale.");
    } finally {
      setApproving(false);
    }
  };

  const handleCompleteAndContinue = async () => {
    setValidationError(null);
    if (compounds.length === 0) {
      setValidationError("Add a compound to continue.");
      setStep(1);
      return;
    }
    if (results.length === 0) {
      setValidationError("Screening needs to finish before molecular docking.");
      setStep(2);
      return;
    }
    if (selectedCompounds.length === 0) {
      setValidationError("Select at least one compound for molecular docking.");
      setStep(3);
      return;
    }
    if (!selectionRationale.trim()) {
      setValidationError("A short selection rationale is required.");
      setStep(3);
      return;
    }

    setCompletingStage(true);
    try {
      const response = await fetch(`/api/researcher/projects/${projectId}/in-silico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete-stage",
          selectionRationale,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to continue to molecular docking");
      approvedRef.current = true;
      setRationaleApproved(true);
      startTransition(() => {
        router.push(data.redirectUrl || `/researcher/projects/${projectId}/docking`);
      });
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : "Failed to continue to molecular docking.");
      setCompletingStage(false);
    }
  };

  const activeModalCompound =
    modal && "compoundId" in modal ? compounds.find((compound) => compound.id === modal.compoundId) || null : null;
  const activeModalResult = activeModalCompound
    ? resultForCompound(results, activeModalCompound.id)
    : null;
  const activeModalProfile = profileFor(activeModalResult);
  const activePapers = activeModalCompound
    ? papersForCompound(literature, activeModalCompound.compoundName)
    : [];

  const step2Blocked = screeningIds.length > 0 || results.length === 0;
  const dockingReady = selectedCompounds.length > 0 && Boolean(selectionRationale.trim());

  return (
    <div className="w-full max-w-full space-y-8 px-2 pt-6 pb-28 font-sans sm:px-4 lg:px-6">
      <ResearchStageHeader
        projectId={projectId}
        stageNumber={2}
        stageTitle="In-Silico Analysis"
        plantCommonName={project.plantName}
        plantScientificName={project.plantScientificName}
        statusLabel="In Progress"
      />

      <nav aria-label="In-silico steps" className="rounded-2xl border border-[#dde6df] bg-white px-4 py-3.5 shadow-md">
        <ol className="flex items-center">
          {STEPS.map((item, index) => {
            const current = step === item.id;
            const done = step > item.id;
            return (
              <li key={item.id} className={`flex min-w-0 items-center ${index < STEPS.length - 1 ? "flex-1" : ""}`}>
                <button
                  type="button"
                  onClick={() => {
                    if (item.id === 1) goToCompounds();
                    if (item.id === 2) goToScreening();
                    if (item.id === 3) goToDocking();
                  }}
                  aria-current={current ? "step" : undefined}
                  className="flex min-w-0 items-center gap-2.5 rounded-xl px-1 py-1 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                      done
                        ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                        : current
                          ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20"
                          : "border border-[#dde6df] bg-[#f7faf8] text-[#78997f]"
                    }`}
                  >
                    {done ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : String(item.id).padStart(2, "0")}
                  </span>
                  <span
                    className={`truncate text-xs sm:text-sm ${
                      current ? "font-black text-[#0f2c20]" : done ? "font-bold text-emerald-800" : "font-semibold text-[#78997f]"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
                {index < STEPS.length - 1 && (
                  <span className={`mx-2 h-px min-w-4 flex-1 ${done ? "bg-emerald-400" : "bg-[#dde6df]"}`} aria-hidden />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <motion.section
        key={step}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="space-y-6"
      >
          {step === 1 && (
            <ResearchSection
              icon={Leaf}
              title="Compounds"
              subtitle="Select the compounds to evaluate."
              action={
                <button
                  type="button"
                  onClick={() => {
                    setCustomError(null);
                    setModal({ type: "add" });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-900 transition-all hover:bg-emerald-100"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Compound
                </button>
              }
            >
              {compounds.length === 0 ? (
                <p className="py-6 text-center text-xs font-medium text-[#78997f]">Add a compound to begin.</p>
              ) : (
                <ul className="space-y-2">
                  {compounds.map((compound) => {
                    const screening = screeningIds.includes(compound.id);
                    const screened = screenedIds.has(compound.id);
                    const ready = Boolean(
                      compound.molecularFormula || compound.molecularWeight || compound.pubchemId || compound.smiles
                    );
                    const failed = Boolean(screeningErrors[compound.id]) && !screening && !screened;
                    const status = screening
                      ? "Screening…"
                      : failed
                        ? "Screening needs another try"
                        : screened
                          ? "Screened"
                          : ready
                            ? "Screening available"
                            : "Waiting for properties";
                    return (
                      <li
                        key={compound.id}
                        className="flex items-center justify-between gap-4 rounded-2xl border border-[#e7eee9] bg-gradient-to-br from-emerald-50/40 via-[#faf9f5] to-white px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="text-base font-black text-[#0f2c20]">{compound.compoundName}</p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs font-medium text-[#78997f]">
                            {compound.molecularFormula && (
                              <span className="font-mono text-[#3d5248]">{compound.molecularFormula}</span>
                            )}
                            {compound.molecularFormula && <span>·</span>}
                            {screening && <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-700" />}
                            {(screened || ready) && !screening && !failed && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                            {(failed || (!screening && !screened && !ready)) && (
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                            )}
                            <span>{status}</span>
                          </p>
                          {failed && <p className="mt-1 text-xs font-semibold text-rose-700">{screeningErrors[compound.id]}</p>}
                        </div>
                        {pendingDeleteId === compound.id ? (
                          <div className="flex shrink-0 items-center gap-2 text-xs font-bold">
                            <button
                              type="button"
                              onClick={() => void handleRemoveCompound(compound)}
                              disabled={removingId === compound.id}
                              className="text-rose-700 disabled:opacity-50"
                            >
                              {removingId === compound.id ? "Removing…" : "Remove"}
                            </button>
                            <button type="button" onClick={() => setPendingDeleteId(null)} className="text-[#78997f]">
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPendingDeleteId(compound.id)}
                            className="shrink-0 text-xs font-bold text-[#78997f] transition hover:text-rose-700"
                          >
                            Remove
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </ResearchSection>
          )}

          {step === 2 && (
            <ResearchSection icon={Microscope} title="Screening" subtitle="Review the screening result for each compound.">
              <ul className="space-y-2">
                {compounds.map((compound) => {
                  const result = resultForCompound(results, compound.id);
                  const profile = profileFor(result);
                  const screening = screeningIds.includes(compound.id);
                  const papers = papersForCompound(literature, compound.compoundName);
                  const failed = Boolean(screeningErrors[compound.id]) && !result && !screening;
                  return (
                    <li
                      key={compound.id}
                      className="flex flex-col gap-2 rounded-2xl border border-[#e7eee9] bg-gradient-to-br from-emerald-50/40 via-[#faf9f5] to-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-base font-black text-[#0f2c20]">{compound.compoundName}</p>
                        {compound.molecularFormula && (
                          <p className="font-mono text-xs text-[#78997f]">{compound.molecularFormula}</p>
                        )}
                        {screening && (
                          <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[#78997f]">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-700" />
                            Screening…
                          </p>
                        )}
                        {failed && (
                          <p className="mt-1 text-xs font-semibold text-rose-700">
                            Screening needs another try.
                            {screeningErrors[compound.id] ? ` ${screeningErrors[compound.id]}` : ""}
                          </p>
                        )}
                        {result && (
                          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-[#234237]">
                            {profile.violations === 0 ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                            )}
                            <span>{profile.violations === 0 ? "Lipinski Pass" : `${profile.violations} Lipinski violation${profile.violations === 1 ? "" : "s"}`}</span>
                            <span className="font-medium text-[#9aada2]">·</span>
                            <span>GI {profile.gi}</span>
                            <span className="font-medium text-[#9aada2]">·</span>
                            <span className={profile.badge === "Recommended" ? "text-emerald-800" : "text-amber-800"}>{profile.verdict}</span>
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {failed && (
                          <SubtleAction onClick={() => void runScreening(compound.id)}>Try again</SubtleAction>
                        )}
                        {result && (
                          <>
                            <SubtleAction onClick={() => setModal({ type: "results", compoundId: compound.id })}>
                              <FlaskConical className="h-3.5 w-3.5" />
                              Screening Results
                            </SubtleAction>
                            <SubtleAction onClick={() => setModal({ type: "research", compoundId: compound.id })}>
                              <BookOpen className="h-3.5 w-3.5" />
                              Research ({papers.length})
                            </SubtleAction>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </ResearchSection>
          )}

          {step === 3 && (
            <>
              <ResearchSection
                icon={FlaskConical}
                title="Docking Selection"
                subtitle="Choose compounds to investigate further. NatureAide may recommend; the researcher decides."
              >
                <ul className="space-y-2">
                  {compounds.map((compound) => {
                    const checked = isSelected(compound);
                    const profile = profileFor(resultForCompound(results, compound.id));
                    const papers = papersForCompound(literature, compound.compoundName);
                    const lipinskiLabel = !profile.screened
                      ? "Waiting for screening"
                      : profile.violations === 0
                        ? "Lipinski Pass"
                        : `${profile.violations} Lipinski violation${profile.violations === 1 ? "" : "s"}`;
                    return (
                      <li key={compound.id}>
                        <div
                          role="checkbox"
                          aria-checked={checked}
                          tabIndex={0}
                          onClick={() => void handleToggleDocking(compound)}
                          onKeyDown={(event) => {
                            if (event.target !== event.currentTarget) return;
                            if (event.key === " " || event.key === "Enter") {
                              event.preventDefault();
                              void handleToggleDocking(compound);
                            }
                          }}
                          className={`cursor-pointer rounded-2xl border px-4 py-3 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${
                            checked
                              ? "border-emerald-400 bg-emerald-50/80"
                              : "border-[#e7eee9] bg-gradient-to-br from-white via-[#faf9f5] to-white hover:border-emerald-200"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                                checked ? "border-emerald-600 bg-emerald-600 text-white" : "border-[#c5d5cb] bg-white"
                              }`}
                              aria-hidden
                            >
                              {checked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-base font-black leading-tight text-[#0f2c20]">{compound.compoundName}</p>
                                  {compound.molecularFormula && (
                                    <p className="mt-0.5 font-mono text-xs text-[#78997f]">{compound.molecularFormula}</p>
                                  )}
                                </div>
                                <span
                                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider ${
                                    profile.badge === "Recommended"
                                      ? "border-emerald-300 bg-emerald-100/80 text-emerald-900"
                                      : profile.badge === "Review"
                                        ? "border-amber-200 bg-amber-50 text-amber-900"
                                        : "border-[#dde6df] bg-white text-[#78997f]"
                                  }`}
                                >
                                  {profile.badge}
                                </span>
                              </div>
                              <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-[#234237]">
                                {profile.screened && profile.violations === 0 && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                                {profile.screened && profile.violations > 0 && <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />}
                                <span>{lipinskiLabel}</span>
                                {profile.screened && profile.gi !== "—" && (
                                  <>
                                    <span className="font-medium text-[#9aada2]">·</span>
                                    <span>GI {profile.gi}</span>
                                  </>
                                )}
                              </p>
                              {profile.screened && (
                                <div className="mt-2 flex flex-wrap items-center gap-1">
                                  <SubtleAction onClick={() => setModal({ type: "results", compoundId: compound.id })}>
                                    <FlaskConical className="h-3.5 w-3.5" />
                                    Screening Results
                                  </SubtleAction>
                                  <SubtleAction onClick={() => setModal({ type: "research", compoundId: compound.id })}>
                                    <BookOpen className="h-3.5 w-3.5" />
                                    Research ({papers.length})
                                  </SubtleAction>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </ResearchSection>

              <ResearchSection
                icon={FileText}
                title="Selection Rationale"
                subtitle="A short record of why these compounds continue."
                action={
                  rationaleApproved ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-100/80 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-emerald-900">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Approved
                    </span>
                  ) : undefined
                }
              >
                <p className="line-clamp-3 text-sm font-medium leading-6 text-[#234237]">
                  {selectionRationale.trim()
                    ? selectionRationale
                    : "Select a compound and a short rationale will appear here."}
                </p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setRationaleDraft(selectionRationale);
                        setModal({ type: "rationale" });
                      }}
                      disabled={!selectionRationale.trim()}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-black text-[#0f2c20] shadow-xs transition-all hover:bg-slate-50 disabled:opacity-40"
                    >
                      Edit
                    </button>
                    {saveState === "saved" && <span className="text-[11px] font-bold text-emerald-700">Saved</span>}
                  </div>
                  {!rationaleApproved && (
                    <button
                      type="button"
                      onClick={() => void handleApproveRationale()}
                      disabled={approving || !selectionRationale.trim()}
                      className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#0f3626] to-[#16a34a] px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-700/20 transition-all hover:from-[#0c2c1f] hover:to-[#15803d] disabled:opacity-50"
                    >
                      {approving ? "Approving…" : "Approve"}
                    </button>
                  )}
                </div>
              </ResearchSection>
            </>
          )}
      </motion.section>

      {validationError && (
        <div role="alert" className="flex items-center gap-3 rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 text-xs font-extrabold text-rose-900 shadow-md">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{validationError}</span>
        </div>
      )}

      {step === 3 && selectedCompounds.length === 0 && !validationError && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800">
          <span>Please select at least one compound to advance to Molecular Docking.</span>
        </div>
      )}

      <ResearchStageFooter
        projectId={project.id}
        stageNumber={2}
        stageTitle="In-Silico Analysis"
        backLabel={step > 1 ? `Back to Step ${step - 1}` : "Back to Plant & Literature"}
        onBack={
          step > 1
            ? () => {
                setValidationError(null);
                setStep((current) => (current === 3 ? 2 : 1));
              }
            : undefined
        }
        statusMessage={`${compounds.length} compounds · ${screenedIds.size} screened · ${selectedCompounds.length} selected`}
        primaryAction={
          step === 1
            ? {
                label: "Continue to Screening",
                onClick: goToScreening,
                disabled: compounds.length === 0,
              }
            : step === 2
            ? {
                label: screeningIds.length > 0 ? "Screening…" : "Continue to Compound Selection",
                onClick: goToDocking,
                disabled: step2Blocked,
                loading: screeningIds.length > 0,
              }
            : {
                label: rationaleApproved ? "Continue to Molecular Docking" : "Approve & Continue to Molecular Docking",
                onClick: () => void handleCompleteAndContinue(),
                disabled: !dockingReady || completingStage || screeningIds.length > 0,
                loading: completingStage,
              }
        }
      />

      <AnimatePresence>
        {modal?.type === "add" && (
          <CenteredModal
            title="Add Compound"
            subtitle={project.plantName}
            onClose={closeModal}
            wide
          >
            {customError && (
              <p className="mb-4 rounded-2xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800">{customError}</p>
            )}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#52645d]" htmlFor="compound-search">
                Reported for this plant
              </label>
              <input
                id="compound-search"
                value={modalSearchTerm}
                onChange={(event) => setModalSearchTerm(event.target.value)}
                placeholder="Search compounds"
                className="w-full rounded-2xl border border-[#d7e3db] px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
              />
              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {filteredSuggestions.map((suggestion) => {
                  const alreadyAdded = compounds.some(
                    (compound) => compound.compoundName.toLowerCase() === suggestion.name.toLowerCase()
                  );
                  return (
                    <div
                      key={suggestion.name}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-[#e7eee9] px-3 py-3"
                    >
                      <div>
                        <p className="font-semibold">{suggestion.name}</p>
                        <p className="text-sm text-[#52645d]">{suggestion.formula}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleAddSuggestedCompound(suggestion)}
                        disabled={addingCompound || alreadyAdded}
                        className="rounded-full bg-[#12382a] px-3 py-1.5 text-sm font-semibold text-white disabled:bg-[#d7e0da] disabled:text-[#5c6f63]"
                      >
                        {alreadyAdded ? "Added" : addingCompound ? "Adding…" : "Add"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <form
              className="mt-6 space-y-3 border-t border-[#e7eee9] pt-5"
              onSubmit={(event) => {
                event.preventDefault();
                void handleAddCustomCompound();
              }}
            >
              <p className="text-sm font-medium">Or add your own</p>
              <input
                value={customCompoundName}
                onChange={(event) => setCustomCompoundName(event.target.value)}
                placeholder="Compound name"
                className="w-full rounded-2xl border border-[#d7e3db] px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
              />
              <input
                value={customSourceReference}
                onChange={(event) => setCustomSourceReference(event.target.value)}
                placeholder="Supporting reference"
                className="w-full rounded-2xl border border-[#d7e3db] px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
              />
              <button
                type="submit"
                disabled={addingCompound}
                className="rounded-full bg-[#12382a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {addingCompound ? "Adding…" : "Add Compound"}
              </button>
            </form>
          </CenteredModal>
        )}

        {modal?.type === "results" && activeModalCompound && (
          <CenteredModal
            title={activeModalCompound.compoundName}
            subtitle={activeModalResult?.resultSummary || "Screening results"}
            onClose={closeModal}
            wide
          >
            <ResultsBody compound={activeModalCompound} result={activeModalResult} profile={activeModalProfile} />
          </CenteredModal>
        )}

        {modal?.type === "research" && activeModalCompound && (
          <CenteredModal
            title={`${activeModalCompound.compoundName} research`}
            subtitle={`${activePapers.length} linked ${activePapers.length === 1 ? "paper" : "papers"}`}
            onClose={closeModal}
            wide
          >
            {activePapers.length === 0 ? (
              <p className="text-sm leading-6 text-[#52645d]">
                No PubMed papers are linked to this compound yet.
              </p>
            ) : (
              <div className="space-y-3">
                {activePapers.map((paper) => (
                  <article
                    key={paper.pubmedId || paper.id || paper.title}
                    className="rounded-2xl border border-[#e7eee9] p-4"
                  >
                    <h3 className="font-semibold leading-snug">{paper.title}</h3>
                    <p className="mt-1 text-sm text-[#52645d]">
                      {paper.authors || "Authors unavailable"}
                      {paper.journalSource ? ` · ${paper.journalSource}` : ""}
                      {paper.year ? ` (${paper.year})` : ""}
                    </p>
                    {(paper.relevanceToCurrentResearch || paper.keyFindings) && (
                      <p className="mt-2 text-sm leading-6 text-[#24382e]">
                        {paper.relevanceToCurrentResearch || paper.keyFindings}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
                      {paper.pubmedId && (
                        <a
                          href={`https://pubmed.ncbi.nlm.nih.gov/${paper.pubmedId}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#1b5340]"
                        >
                          View on PubMed
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {paper.doiOrUrl && (
                        <a
                          href={paper.doiOrUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#1b5340]"
                        >
                          DOI
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
            <p className="mt-4 text-xs leading-5 text-[#6a7d72]">
              Literature supports biological context. It does not validate these screening predictions.
            </p>
          </CenteredModal>
        )}

        {modal?.type === "rationale" && (
          <CenteredModal title="Edit selection rationale" onClose={closeModal}>
            <textarea
              value={rationaleDraft}
              onChange={(event) => setRationaleDraft(event.target.value)}
              rows={6}
              className="w-full resize-y rounded-2xl border border-[#d7e3db] px-3 py-3 text-sm leading-6 outline-none focus:border-emerald-600"
            />
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => void handleSaveRationaleDraft()}
                disabled={approving}
                className="rounded-full bg-[#12382a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {approving ? "Saving…" : "Save"}
              </button>
            </div>
          </CenteredModal>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResultsBody({
  compound,
  result,
  profile,
}: {
  compound: CompoundItem;
  result: InsilicoResultItem | null;
  profile: ScreeningProfile;
}) {
  const metrics = profile.metrics;
  const properties = metrics?.properties;
  const admet = metrics?.admet;
  const smiles = compound.smiles || result?.compoundSmiles;
  const pubchemId =
    compound.pubchemId ||
    (metrics?.cid && String(metrics.cid) !== "Unavailable" ? String(metrics.cid) : "");

  const propertyRows = [
    ["Molecular weight", properties?.molecularWeight?.value || (compound.molecularWeight ? `${compound.molecularWeight} g/mol` : "Unavailable"), properties?.molecularWeight?.status],
    ["Formula", properties?.molecularFormula?.value || compound.molecularFormula || "Unavailable", properties?.molecularFormula?.status],
    ["LogP", properties?.logP?.value || "Unavailable", properties?.logP?.status],
    ["H-bond donors", properties?.hBondDonors?.value || "Unavailable", properties?.hBondDonors?.status],
    ["H-bond acceptors", properties?.hBondAcceptors?.value || "Unavailable", properties?.hBondAcceptors?.status],
    ["TPSA", properties?.tpsa?.value || "Unavailable", properties?.tpsa?.status],
    ["Rotatable bonds", properties?.rotatableBonds?.value || "Unavailable", properties?.rotatableBonds?.status],
  ] as const;

  const admetRows = [
    ["GI absorption", admet?.giAbsorption?.prediction, admet?.giAbsorption?.status],
    ["BBB permeability", admet?.bbbPermeability?.prediction, admet?.bbbPermeability?.status],
    ["CYP3A4 inhibition", admet?.cyp3a4Inhibition?.prediction, admet?.cyp3a4Inhibition?.status],
    ["Water solubility", admet?.waterSolubility?.prediction, admet?.waterSolubility?.status],
    ["hERG cardiotoxicity", admet?.hergCardiacToxicity?.prediction || "Unavailable", admet?.hergCardiacToxicity?.status || "UNAVAILABLE"],
    ["Ames mutagenicity", admet?.amesMutagenicity?.prediction || "Unavailable", admet?.amesMutagenicity?.status || "UNAVAILABLE"],
    ["Renal clearance", admet?.renalClearance?.prediction || "Unavailable", admet?.renalClearance?.status || "UNAVAILABLE"],
  ] as const;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {propertyRows.map(([label, value, status]) => (
          <div key={label} className="rounded-2xl bg-[#f6f8f6] px-3 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#6b7c72]">{label}</p>
            <p className="mt-1 text-sm font-semibold">{value}</p>
            {status && <p className="mt-1 text-[10px] font-semibold tracking-wide text-[#3d6b52]">{status}</p>}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[#e7eee9] px-4 py-3">
        <p className="text-sm font-semibold">
          Lipinski {profile.screened ? (profile.violations === 0 ? "Pass" : `${profile.violations} violations`) : "not ready"}
        </p>
        {profile.violationsList.length > 0 && (
          <p className="mt-1 text-sm text-[#52645d]">{profile.violationsList.join(" · ")}</p>
        )}
      </div>

      <dl className="divide-y divide-[#e7eee9] overflow-hidden rounded-2xl border border-[#e7eee9]">
        {admetRows.map(([label, value, status]) => (
          <div key={label} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
            <dt className="text-[#52645d]">{label}</dt>
            <dd className="text-right font-medium">
              {value || "Unavailable"}
              {status && (
                <span className="ml-2 text-[10px] font-semibold tracking-wide text-[#6d8478]">{status}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>

      <div className="space-y-1 text-sm text-[#52645d]">
        <p>Source: {provenanceLabel(compound.sourceProvenance)}</p>
        {compound.sourceReference && <p>{compound.sourceReference}</p>}
        {compound.iupacName && <p>IUPAC: {compound.iupacName}</p>}
        {pubchemId && (
          <a
            href={`https://pubchem.ncbi.nlm.nih.gov/compound/${pubchemId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-[#1b5340]"
          >
            PubChem {pubchemId}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
        {smiles && <p className="break-all font-mono text-xs text-[#3e5c4c]">{smiles}</p>}
        {result?.engineTool && (
          <p>
            {result.engineTool}
            {result.engineVersion ? ` ${result.engineVersion}` : ""} · {result.resultProvenance.split("_").join(" ")}
          </p>
        )}
      </div>

      <p className="text-xs leading-5 text-[#6a7d72]">
        Retrieved values come from PubChem. Calculated values are Lipinski and solubility checks. Predicted values are
        ADMET models. Unavailable means no result was produced.
      </p>
    </div>
  );
}
