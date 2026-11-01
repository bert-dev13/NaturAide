"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileText,
  FlaskConical,
  Info,
  Leaf,
  Loader2,
  Microscope,
  Plus,
  Search,
  ChevronDown,
  Sparkles,
  Sprout,
  X,
} from "lucide-react";
import ResearchStageFooter from "@/components/researcher/stage/ResearchStageFooter";
import ResearchStageHeader from "@/components/researcher/stage/ResearchStageHeader";
import ResearcherReviewFeedbackPanel from "@/components/researcher/stage/ResearcherReviewFeedbackPanel";
import RevisionResubmittedSuccessModal from "@/components/researcher/stage/RevisionResubmittedSuccessModal";


export interface AvailablePlantCompound {
  id: number;
  plantId?: string | null;
  plantScientificName: string;
  plantCommonName: string;
  compoundName: string;
  iupacName?: string | null;
  molecularFormula?: string | null;
  molecularWeight?: number | string | null;
  compoundClass?: string | null;
  pubchemId?: string | null;
  smiles?: string | null;
  plantPartReported?: string | null;
  references: Array<{
    title: string;
    authors?: string;
    journal?: string;
    year?: number | string;
    volume?: string;
    pages?: string;
    doi?: string;
    pubmedId?: string;
    pmid?: string;
    url?: string;
    plantPart?: string;
    evidenceType?: string;
    summary?: string;
  }>;
  verificationStatus?: "VERIFIED_DATABASE" | "LITERATURE_VERIFIED" | "RESEARCHER_SUBMITTED" | "PENDING_VERIFICATION";
  structureReady?: boolean;
  isAlreadyAdded?: boolean;
}

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
  initialAvailableCompounds?: AvailablePlantCompound[];
  initialReviewFeedback?: any[];
  overallAssessment?: string | null;
  reviewStatus?: string | null;
  reviewerName?: string | null;
  approvedAt?: string | null;
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
  extraWide = false,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  wide?: boolean;
  extraWide?: boolean;
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
          extraWide ? "max-w-4xl" : wide ? "max-w-2xl" : "max-w-lg"
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
  id,
  number,
  badge,
  icon: Icon,
  title,
  subtitle,
  action,
  children,
  headerGradient = "from-emerald-50/80 via-teal-50/30 to-transparent",
  iconBg = "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20",
  borderColor = "border-[#dde6df]",
  hoverBorderColor = "hover:border-emerald-400/80",
}: {
  id?: string;
  number?: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  headerGradient?: string;
  iconBg?: string;
  borderColor?: string;
  hoverBorderColor?: string;
}) {
  return (
    <section
      id={id}
      className={`w-full overflow-hidden rounded-3xl bg-white border ${borderColor} shadow-md ${hoverBorderColor} transition-all duration-300`}
    >
      <div className={`flex flex-col items-start justify-between gap-3 border-b border-[#edf2ee] bg-gradient-to-r ${headerGradient} px-6 py-4.5 sm:flex-row sm:items-center`}>
        <div className="flex items-center gap-3">
          <div className={`rounded-xl p-2.5 text-white shadow-md ${iconBg}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              {number && (
                <span className="font-mono text-xs font-black text-emerald-800 uppercase tracking-wider">
                  {number}
                </span>
              )}
              <h2 className="text-base font-black text-[#0f2c20] sm:text-lg">{title}</h2>
              {badge && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs font-medium text-[#78997f] mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="px-4 py-4 sm:px-6 sm:py-5">{children}</div>
    </section>
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
  initialAvailableCompounds = [],
  initialReviewFeedback = [],
  overallAssessment,
  reviewStatus,
  reviewerName,
  approvedAt,
}: InSilicoWorkspaceClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [currentReviewStatus, setCurrentReviewStatus] = useState<string | null>(reviewStatus || null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState<{
    discipline: string;
    profession: string;
    reviewerName?: string | null;
    reviewCycle: number;
    addressedCount: number;
  }>({
    discipline: "Bioinformatics",
    profession: "Bioinformatician / Computational Scientist",
    reviewerName: reviewerName || null,
    reviewCycle: 1,
    addressedCount: 1,
  });

  const openReviewFeedback = React.useMemo(() => {
    return (initialReviewFeedback || []).filter((f: any) => {
      const st = (f.status || "OPEN").toUpperCase();
      return st === "OPEN" || st === "IN_REVIEW";
    });
  }, [initialReviewFeedback]);

  const isRevisionMode = Boolean(
    currentReviewStatus === "REVISION_REQUIRED" ||
      (openReviewFeedback.length > 0 && currentReviewStatus !== "REVISION_RESUBMITTED" && currentReviewStatus !== "APPROVED")
  );

  const [resubmitting, setResubmitting] = useState(false);

  const handleResubmitRevision = async () => {
    try {
      setResubmitting(true);
      await handleSaveRationaleDraft();

      const res = await fetch(`/api/researcher/projects/${projectId}/resubmit-revision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleKey: "bioinformatics",
          stageNumber: 2,
          changesSummary: "Updated candidate compounds, in-silico ADME properties, and computational synthesis.",
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to resubmit revision");

      setCurrentReviewStatus("REVISION_RESUBMITTED");
      setSuccessModalData({
        discipline: json.discipline || "Bioinformatics",
        profession: json.profession || "Bioinformatician / Computational Scientist",
        reviewerName: json.reviewerName || reviewerName || null,
        reviewCycle: json.reviewCycle || 1,
        addressedCount: initialReviewFeedback?.length || 1,
      });
      setShowSuccessModal(true);

      window.dispatchEvent(
        new CustomEvent("natureaide:revisions-updated", {
          detail: { projectId, stageNumber: 2, status: "REVISION_RESUBMITTED" },
        })
      );
      window.dispatchEvent(new CustomEvent("natureaide:project-updated", { detail: { projectId } }));

      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      console.error("Resubmit revision error:", err);
    } finally {
      setResubmitting(false);
    }
  };

  const [compounds, setCompounds] = useState<CompoundItem[]>(initialCompounds);
  const [results, setResults] = useState<InsilicoResultItem[]>(initialResults);
  const [literature, setLiterature] = useState<LiteratureReferenceItem[]>(initialLiterature);
  const [selectionRationale, setSelectionRationale] = useState(initialSynthesis.selectionRationale || "");
  const [rationaleApproved, setRationaleApproved] = useState(initialSynthesis.status === "APPROVED");
  const [step, setStep] = useState<StepId>(() => inferStep(initialCompounds, initialResults, initialSynthesis));
  const [activeAnchor, setActiveAnchor] = useState<string>("sec-compounds");

  useEffect(() => {
    const handleScroll = () => {
      const sectionIds = ["sec-compounds", "sec-screening", "sec-docking", "sec-summary"];
      const scrollY = window.scrollY + 200;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el && el.offsetTop <= scrollY) {
          setActiveAnchor(sectionIds[i]);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [screeningIds, setScreeningIds] = useState<number[]>([]);
  const [screeningErrors, setScreeningErrors] = useState<Record<number, string>>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [completingStage, setCompletingStage] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [modal, setModal] = useState<ModalState>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  // Clean initial state: guarantee no persisting loading or advancement indicators
  useEffect(() => {
    setCompletingStage(false);
    return () => {
      setCompletingStage(false);
    };
  }, []);

  // Pure Back navigation handler (NEVER triggers stage completion or advancement)
  const handleBack = useCallback(() => {
    console.log("[InSilicoWorkspaceClient] BACK_CLICK - Pure navigation to Plant & Literature Research");
    router.push(`/researcher/projects/${projectId}/plant-literature`);
  }, [projectId, router]);

  const [modalSearchTerm, setModalSearchTerm] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<
    "ALL" | "NOT_ADDED" | "ADDED" | "STRUCTURE_READY" | "EVIDENCE_AVAILABLE"
  >("ALL");
  const [selectedCompoundIds, setSelectedCompoundIds] = useState<Set<number>>(new Set());
  const [inspectingCompound, setInspectingCompound] = useState<AvailablePlantCompound | null>(null);
  const [showAdvancedCustomForm, setShowAdvancedCustomForm] = useState(false);

  const [availableCompounds, setAvailableCompounds] = useState<AvailablePlantCompound[]>(
    initialAvailableCompounds || []
  );
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [discoveryMessage, setDiscoveryMessage] = useState<string | null>(null);

  const [customCompoundName, setCustomCompoundName] = useState("");
  const [customCompoundClass, setCustomCompoundClass] = useState("");
  const [customMolecularFormula, setCustomMolecularFormula] = useState("");
  const [customPubchemId, setCustomPubchemId] = useState("");
  const [customSmiles, setCustomSmiles] = useState("");
  const [customPlantEvidence, setCustomPlantEvidence] = useState("");
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

  const loadAvailableCompounds = useCallback(async () => {
    setLoadingAvailable(true);
    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/in-silico`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.availablePlantCompounds)) {
          setAvailableCompounds(data.availablePlantCompounds);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch available compounds:", e);
    } finally {
      setLoadingAvailable(false);
    }
  }, [projectId]);

  const handleDiscoverFromLiterature = useCallback(async () => {
    setDiscovering(true);
    setCustomError(null);
    setDiscoveryMessage(null);
    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/in-silico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "discover-compounds" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to discover phytochemicals from literature.");
      }
      if (Array.isArray(data.availablePlantCompounds)) {
        setAvailableCompounds(data.availablePlantCompounds);
      }
      setDiscoveryMessage(data.message || "Literature discovery completed successfully.");
    } catch (err: any) {
      setCustomError(err.message || "Literature discovery failed.");
    } finally {
      setDiscovering(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (modal?.type === "add" && availableCompounds.length === 0) {
      void loadAvailableCompounds();
    }
  }, [modal?.type, availableCompounds.length, loadAvailableCompounds]);

  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    for (const c of availableCompounds) {
      if (c.compoundClass && c.compoundClass.trim()) {
        set.add(c.compoundClass.trim());
      }
    }
    return Array.from(set).sort();
  }, [availableCompounds]);

  const filteredCompounds = useMemo(() => {
    const term = modalSearchTerm.toLowerCase().trim();
    return availableCompounds.filter((compound) => {
      // 1. Search term (name, formula, class, pubchem CID)
      if (term) {
        const matchName = compound.compoundName?.toLowerCase().includes(term);
        const matchFormula = compound.molecularFormula?.toLowerCase().includes(term);
        const matchClass = compound.compoundClass?.toLowerCase().includes(term);
        const matchCid = compound.pubchemId?.toString().toLowerCase().includes(term);
        if (!matchName && !matchFormula && !matchClass && !matchCid) {
          return false;
        }
      }

      // 2. Class filter
      if (selectedClassFilter !== "ALL") {
        if (compound.compoundClass?.toLowerCase() !== selectedClassFilter.toLowerCase()) {
          return false;
        }
      }

      // 3. Status filter
      if (selectedStatusFilter !== "ALL") {
        const isAdded = compounds.some(
          (c) => c.compoundName.toLowerCase() === compound.compoundName.toLowerCase()
        );
        if (selectedStatusFilter === "NOT_ADDED" && isAdded) return false;
        if (selectedStatusFilter === "ADDED" && !isAdded) return false;
        if (selectedStatusFilter === "STRUCTURE_READY" && (!compound.smiles || !compound.pubchemId)) return false;
        if (selectedStatusFilter === "EVIDENCE_AVAILABLE" && (!compound.references || compound.references.length === 0)) return false;
      }

      return true;
    });
  }, [availableCompounds, modalSearchTerm, selectedClassFilter, selectedStatusFilter, compounds]);

  const selectableVisibleCompounds = useMemo(() => {
    return filteredCompounds.filter(
      (c) => !compounds.some((item) => item.compoundName.toLowerCase() === c.compoundName.toLowerCase())
    );
  }, [filteredCompounds, compounds]);

  const allVisibleSelected = useMemo(() => {
    if (selectableVisibleCompounds.length === 0) return false;
    return selectableVisibleCompounds.every((c) => selectedCompoundIds.has(c.id));
  }, [selectableVisibleCompounds, selectedCompoundIds]);

  const toggleSelectAllVisible = () => {
    setSelectedCompoundIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        for (const c of selectableVisibleCompounds) next.delete(c.id);
      } else {
        for (const c of selectableVisibleCompounds) next.add(c.id);
      }
      return next;
    });
  };

  const toggleSelectCompound = (id: number) => {
    setSelectedCompoundIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
    setActiveAnchor("sec-compounds");
    document.getElementById("sec-compounds")?.scrollIntoView({ behavior: "smooth" });
  };

  const goToScreening = () => {
    if (compounds.length === 0) {
      setValidationError("Add a candidate compound to continue.");
      goToCompounds();
      return;
    }
    setValidationError(null);
    screenMissing(compounds);
    setStep(2);
    setActiveAnchor("sec-screening");
    document.getElementById("sec-screening")?.scrollIntoView({ behavior: "smooth" });
  };

  const goToDocking = () => {
    if (compounds.length === 0) {
      setValidationError("Add a candidate compound to continue.");
      goToCompounds();
      return;
    }
    if (screeningIds.length > 0) {
      setValidationError("Screening is still running. Please wait for results.");
      setActiveAnchor("sec-screening");
      document.getElementById("sec-screening")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (results.length === 0) {
      setValidationError("Screening needs to finish before choosing docking compounds.");
      screenMissing(compounds);
      setActiveAnchor("sec-screening");
      document.getElementById("sec-screening")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setValidationError(null);
    setStep(3);
    setActiveAnchor("sec-docking");
    document.getElementById("sec-docking")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleAddSingleCompound = async (compound: AvailablePlantCompound) => {
    setAddingCompound(true);
    setCustomError(null);
    try {
      const sourceRef = compound.references?.[0]
        ? `${compound.references[0].authors || ""} (${compound.references[0].year || ""}), ${compound.references[0].journal || ""}`.trim()
        : `Documented for ${project.plantName}`;

      const response = await fetch(`/api/researcher/projects/${projectId}/in-silico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add-compound",
          compoundName: compound.compoundName,
          sourceProvenance: "VERIFIED_DATABASE",
          sourceReference: sourceRef,
          plantSource: project.plantName,
          molecularFormula: compound.molecularFormula,
          molecularWeight: compound.molecularWeight,
          pubchemId: compound.pubchemId,
          smiles: compound.smiles,
          iupacName: compound.iupacName,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to add compound");

      const created: CompoundItem = data.compound || {
        id: data.insertedId || Date.now(),
        projectId,
        compoundName: compound.compoundName,
        molecularFormula: compound.molecularFormula,
        molecularWeight: compound.molecularWeight,
        pubchemId: compound.pubchemId,
        smiles: compound.smiles,
        iupacName: compound.iupacName,
        sourceProvenance: "VERIFIED_DATABASE",
        sourceReference: sourceRef,
        plantSource: project.plantName,
        selectedForDocking: 0,
        preparationStatus: "UNPREPARED",
      };

      setCompounds((current) => [...current, created]);
      setSelectedCompoundIds((prev) => {
        const next = new Set(prev);
        next.delete(compound.id);
        return next;
      });
      void runScreening(created.id);
    } catch (error) {
      setCustomError(error instanceof Error ? error.message : "Failed to add compound.");
    } finally {
      setAddingCompound(false);
    }
  };

  const handleBatchAddCompounds = async () => {
    if (selectedCompoundIds.size === 0) return;
    setAddingCompound(true);
    setCustomError(null);
    try {
      const itemsToAdd = availableCompounds
        .filter((c) => selectedCompoundIds.has(c.id))
        .map((c) => ({
          compoundName: c.compoundName,
          sourceProvenance: "VERIFIED_DATABASE",
          sourceReference: c.references?.[0]
            ? `${c.references[0].authors || ""} (${c.references[0].year || ""}), ${c.references[0].journal || ""}`.trim()
            : `Documented for ${project.plantName}`,
          plantSource: project.plantName,
          molecularFormula: c.molecularFormula,
          molecularWeight: c.molecularWeight,
          pubchemId: c.pubchemId,
          smiles: c.smiles,
          iupacName: c.iupacName,
        }));

      const response = await fetch(`/api/researcher/projects/${projectId}/in-silico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add-compounds",
          compounds: itemsToAdd,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to add compounds");

      const inserted: CompoundItem[] = data.insertedCompounds || [];
      if (inserted.length > 0) {
        setCompounds((current) => [...current, ...inserted]);
        for (const item of inserted) {
          void runScreening(item.id);
        }
      }
      setSelectedCompoundIds(new Set());
      setModal(null);
    } catch (error) {
      setCustomError(error instanceof Error ? error.message : "Failed to add compounds.");
    } finally {
      setAddingCompound(false);
    }
  };

  const handleSubmitCustomCompound = async () => {
    if (!customCompoundName.trim()) {
      setCustomError("Compound name is required.");
      return;
    }
    if (!customSourceReference.trim()) {
      setCustomError("A supporting literature citation or verifiable reference is required.");
      return;
    }
    if (!customPlantEvidence.trim()) {
      setCustomError(`Documented evidence associating this compound with ${project.plantName} is required.`);
      return;
    }

    setAddingCompound(true);
    setCustomError(null);
    try {
      const response = await fetch(`/api/researcher/projects/${projectId}/in-silico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit-custom-compound",
          compoundName: customCompoundName.trim(),
          compoundClass: customCompoundClass.trim() || undefined,
          molecularFormula: customMolecularFormula.trim() || undefined,
          pubchemId: customPubchemId.trim() || undefined,
          smiles: customSmiles.trim() || undefined,
          plantAssociationEvidence: customPlantEvidence.trim(),
          sourceReference: customSourceReference.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to submit custom compound");

      if (data.compound) {
        setCompounds((current) => [...current, data.compound]);
        void runScreening(data.compound.id);
      }
      setCustomCompoundName("");
      setCustomCompoundClass("");
      setCustomMolecularFormula("");
      setCustomPubchemId("");
      setCustomSmiles("");
      setCustomPlantEvidence("");
      setCustomSourceReference("");
      setShowAdvancedCustomForm(false);
      setModal(null);
      void loadAvailableCompounds();
    } catch (error) {
      setCustomError(error instanceof Error ? error.message : "Failed to submit compound.");
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
      setValidationError("Add at least one candidate compound to continue.");
      goToCompounds();
      return;
    }
    if (results.length === 0) {
      setValidationError("Computational screening must finish before continuing to molecular docking.");
      goToScreening();
      return;
    }
    if (selectedCompounds.length === 0) {
      setValidationError("Select at least one compound for molecular docking.");
      goToDocking();
      return;
    }
    if (!selectionRationale.trim()) {
      setValidationError("A selection rationale is required before advancing.");
      goToDocking();
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
    } finally {
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
        statusLabel={
          currentReviewStatus === "REVISION_RESUBMITTED"
            ? "Revision Resubmitted"
            : isRevisionMode
            ? "Revisions Required"
            : "In Progress"
        }
      />

      {/* Bioinformatics Review Revision & Feedback Panel */}
      <ResearcherReviewFeedbackPanel
        projectId={projectId}
        stageTitle="Stage 2 · In-Silico Analysis"
        discipline="Bioinformatics"
        overallAssessment={overallAssessment}
        reviewStatus={currentReviewStatus}
        recommendations={openReviewFeedback.length > 0 ? openReviewFeedback : initialReviewFeedback}
        reviewerName={reviewerName}
        approvedAt={approvedAt}
      />

      {/* STICKY TAB NAVIGATION (CONTINUOUS ONE-PAGE SCROLL) */}
      <div className="sticky top-4 z-20 flex items-center justify-between gap-2 overflow-x-auto rounded-2xl border border-slate-200/90 bg-white/95 p-2 shadow-xs backdrop-blur-md no-scrollbar">
        <div className="flex items-center gap-1 sm:gap-2">
          {[
            { id: "sec-compounds", number: "01", label: "Compounds", count: compounds.length },
            { id: "sec-screening", number: "02", label: "Screening & ADMET", count: screenedIds.size },
            { id: "sec-docking", number: "03", label: "Docking Selection", count: selectedCompounds.length },
            { id: "sec-summary", number: "04", label: "Stage Summary" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveAnchor(item.id);
                document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeAnchor === item.id
                  ? "bg-[#0f2c20] text-emerald-300 shadow-2xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200/60"
              }`}
            >
              <span className="font-mono text-[10px] opacity-75">{item.number}</span>
              <span>{item.label}</span>
              {item.count !== undefined && (
                <span
                  className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                    activeAnchor === item.id
                      ? "bg-emerald-800 text-emerald-100"
                      : "bg-slate-200/80 text-slate-700"
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0 pr-1 text-xs">
          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
            {compounds.length} cmp · {screenedIds.size} screened · {selectedCompounds.length} selected
          </span>
          {saveState === "saved" && (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
              <Check className="h-3 w-3" />
              Saved
            </span>
          )}
        </div>
      </div>

      <div className="space-y-8">
        {/* ========================================================
            SECTION 01: CANDIDATE COMPOUNDS
            ======================================================== */}
        <ResearchSection
          id="sec-compounds"
          number="01"
          icon={Leaf}
          title="Selected Research Compounds"
          subtitle={`Bioactive phytochemicals curated for ${project.plantName} in-silico computational screening and ADMET evaluation.`}
          action={
            <button
              type="button"
              onClick={() => {
                setCustomError(null);
                setModal({ type: "add" });
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-700 hover:bg-emerald-800 px-3.5 py-1.5 text-xs font-bold text-white transition-all cursor-pointer shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Compounds
            </button>
          }
        >
          {compounds.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-slate-500 space-y-2">
              <Leaf className="w-8 h-8 text-slate-400 stroke-1" />
              <p className="text-xs font-semibold text-slate-700">No candidate compounds selected yet</p>
              <p className="text-[11px] text-slate-500 max-w-md">
                Click &quot;Add Compounds&quot; above to browse and select documented phytochemicals reported for {project.plantName}.
              </p>
            </div>
          ) : (
            <ul className="space-y-2.5">
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
                    className="flex items-center justify-between gap-4 rounded-2xl border border-[#e7eee9] bg-gradient-to-br from-emerald-50/40 via-[#faf9f5] to-white px-4 py-3 shadow-2xs hover:border-emerald-300 transition-all"
                  >
                    <div className="min-w-0">
                      <p className="text-base font-black text-[#0f2c20]">{compound.compoundName}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs font-medium text-[#78997f]">
                        {compound.molecularFormula && (
                          <span className="font-mono text-[#3d5248] font-bold">{compound.molecularFormula}</span>
                        )}
                        {compound.molecularFormula && compound.molecularWeight && <span>·</span>}
                        {compound.molecularWeight && (
                          <span className="font-mono text-slate-600">{Number(compound.molecularWeight).toFixed(2)} g/mol</span>
                        )}
                        <span>·</span>
                        {screening && <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-700" />}
                        {(screened || ready) && !screening && !failed && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                        {(failed || (!screening && !screened && !ready)) && (
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                        )}
                        <span className={screened ? "font-bold text-emerald-800" : ""}>{status}</span>
                      </p>
                      {failed && <p className="mt-1 text-xs font-semibold text-rose-700">{screeningErrors[compound.id]}</p>}
                    </div>
                    {pendingDeleteId === compound.id ? (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs font-bold bg-amber-50/90 border border-amber-200 p-2.5 rounded-xl">
                        {screenedIds.has(compound.id) ? (
                          <span className="text-[11px] text-amber-900 font-semibold max-w-xs">
                            This compound already has screening results. Removing it will erase its screening metrics.
                          </span>
                        ) : (
                          <span className="text-[11px] text-amber-900 font-semibold">
                            Remove this compound from project?
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                          <button
                            type="button"
                            onClick={() => void handleRemoveCompound(compound)}
                            disabled={removingId === compound.id}
                            className="rounded-lg bg-rose-600 px-2.5 py-1 text-white hover:bg-rose-700 disabled:opacity-50 cursor-pointer shadow-2xs font-bold"
                          >
                            {removingId === compound.id ? "Removing…" : "Confirm Remove"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteId(null)}
                            className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-slate-700 hover:bg-slate-100 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(compound.id)}
                        className="shrink-0 text-xs font-bold text-[#78997f] transition hover:text-rose-700 cursor-pointer"
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

        {/* ========================================================
            SECTION 02: COMPUTATIONAL SCREENING & ADMET
            ======================================================== */}
        <ResearchSection
          id="sec-screening"
          number="02"
          icon={Microscope}
          headerGradient="from-cyan-50/80 via-blue-50/30 to-transparent"
          iconBg="bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/20"
          hoverBorderColor="hover:border-cyan-400/80"
          title="Computational Screening & ADMET"
          subtitle="Screen candidate compounds for Lipinski Rule of 5 compliance, molecular properties, and pharmacokinetic predictions."
          action={
            compounds.length > 0 && screenedIds.size < compounds.length ? (
              <button
                type="button"
                onClick={() => screenMissing(compounds)}
                disabled={screeningIds.length > 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-200 bg-cyan-50 px-3.5 py-1.5 text-xs font-bold text-cyan-900 transition-all hover:bg-cyan-100 cursor-pointer shadow-2xs disabled:opacity-50"
              >
                {screeningIds.length > 0 ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-700" />
                ) : (
                  <Microscope className="h-3.5 w-3.5 text-cyan-700" />
                )}
                Screen All Compounds
              </button>
            ) : undefined
          }
        >
          {compounds.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-slate-500 space-y-2">
              <Microscope className="w-8 h-8 text-slate-400 stroke-1" />
              <p className="text-xs font-semibold text-slate-700">No candidate compounds to screen</p>
              <p className="text-[11px] text-slate-500 max-w-md">
                Add bioactive molecules in Section 01 above. Once added, NatureAide can calculate molecular descriptors, Lipinski compliance, and ADMET profiles.
              </p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {compounds.map((compound) => {
                const result = resultForCompound(results, compound.id);
                const profile = profileFor(result);
                const screening = screeningIds.includes(compound.id);
                const papers = papersForCompound(literature, compound.compoundName);
                const failed = Boolean(screeningErrors[compound.id]) && !result && !screening;
                return (
                  <li
                    key={compound.id}
                    className="flex flex-col gap-2 rounded-2xl border border-[#e7eee9] bg-gradient-to-br from-emerald-50/40 via-[#faf9f5] to-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between shadow-2xs hover:border-cyan-300 transition-all"
                  >
                    <div className="min-w-0">
                      <p className="text-base font-black text-[#0f2c20]">{compound.compoundName}</p>
                      {compound.molecularFormula && (
                        <p className="font-mono text-xs text-[#78997f] font-semibold">
                          {compound.molecularFormula}
                          {compound.molecularWeight && ` · ${Number(compound.molecularWeight).toFixed(2)} g/mol`}
                        </p>
                      )}
                      {screening && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[#78997f]">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-700" />
                          Screening molecular descriptors & ADMET…
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
                          <span className={profile.violations === 0 ? "text-emerald-800" : "text-amber-800"}>
                            {profile.violations === 0
                              ? "Lipinski Pass (0 violations)"
                              : `${profile.violations} Lipinski violation${profile.violations === 1 ? "" : "s"}`}
                          </span>
                          <span className="font-medium text-[#9aada2]">·</span>
                          <span>GI Absorption: {profile.gi}</span>
                          <span className="font-medium text-[#9aada2]">·</span>
                          <span className={profile.badge === "Recommended" ? "text-emerald-800 font-bold" : "text-amber-800 font-bold"}>
                            {profile.verdict}
                          </span>
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {(!result || failed) && !screening && (
                        <SubtleAction onClick={() => void runScreening(compound.id)}>
                          <Microscope className="h-3.5 w-3.5" />
                          {failed ? "Try again" : "Run Screening"}
                        </SubtleAction>
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
          )}
        </ResearchSection>

        {/* ========================================================
            SECTION 03: DOCKING SELECTION & RATIONALE
            ======================================================== */}
        <ResearchSection
          id="sec-docking"
          number="03"
          icon={FlaskConical}
          headerGradient="from-amber-50/80 via-orange-50/30 to-transparent"
          iconBg="bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/20"
          hoverBorderColor="hover:border-amber-400/80"
          title="Docking Selection & Rationale"
          subtitle="Choose compounds to investigate in Stage 3 Molecular Docking and document the mechanistic selection rationale."
          action={
            rationaleApproved ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-100/80 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-emerald-900">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Rationale Approved
              </span>
            ) : undefined
          }
        >
          {compounds.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-slate-500 space-y-2">
              <FlaskConical className="w-8 h-8 text-slate-400 stroke-1" />
              <p className="text-xs font-semibold text-slate-700">Docking selection requires screened compounds</p>
              <p className="text-[11px] text-slate-500 max-w-md">
                Add compounds and perform screening above to unlock docking candidate selection.
              </p>
            </div>
          ) : screenedIds.size === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-amber-50/50 border border-amber-200/80 text-amber-900 space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-500 stroke-1" />
              <p className="text-xs font-bold text-amber-950">Screening pending for candidates</p>
              <p className="text-[11px] text-amber-800 max-w-md">
                Please complete computational screening in Section 02 above to evaluate drug-likeness before selecting docking candidates.
              </p>
              <button
                type="button"
                onClick={() => {
                  screenMissing(compounds);
                  document.getElementById("sec-screening")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold cursor-pointer transition-colors"
              >
                <Microscope className="w-3.5 h-3.5 text-amber-700" />
                Run Screening Now
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700">
                  Select candidates for molecular docking ({selectedCompounds.length} selected):
                </p>
                <ul className="space-y-2.5">
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
                              ? "border-emerald-400 bg-emerald-50/80 shadow-2xs"
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
                                    <p className="mt-0.5 font-mono text-xs text-[#78997f]">
                                      {compound.molecularFormula}
                                      {compound.molecularWeight && ` · ${Number(compound.molecularWeight).toFixed(2)} g/mol`}
                                    </p>
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
              </div>

              {/* SELECTION RATIONALE CARD */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-800" />
                    <h3 className="text-xs font-extrabold text-[#0f2c20] uppercase tracking-wider">
                      Selection Rationale
                    </h3>
                  </div>
                  {rationaleApproved && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <Check className="h-3 w-3" />
                      Approved
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm font-medium leading-relaxed text-[#234237] whitespace-pre-wrap">
                  {selectionRationale.trim()
                    ? selectionRationale
                    : "Select candidate compounds above and a scientific selection rationale will be generated automatically."}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setRationaleDraft(selectionRationale);
                        setModal({ type: "rationale" });
                      }}
                      disabled={!selectionRationale.trim()}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-[#0f2c20] shadow-xs transition-all hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                    >
                      Edit Rationale
                    </button>
                    {saveState === "saved" && <span className="text-[11px] font-bold text-emerald-700">Saved</span>}
                  </div>
                  {!rationaleApproved && (
                    <button
                      type="button"
                      onClick={() => void handleApproveRationale()}
                      disabled={approving || !selectionRationale.trim()}
                      className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#0f3626] to-[#16a34a] px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-700/20 transition-all hover:from-[#0c2c1f] hover:to-[#15803d] disabled:opacity-50 cursor-pointer"
                    >
                      {approving ? "Approving…" : "Approve Rationale"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </ResearchSection>

        {/* ========================================================
            SECTION 04: IN-SILICO SYNTHESIS & STAGE SUMMARY
            ======================================================== */}
        <ResearchSection
          id="sec-summary"
          number="04"
          icon={Sparkles}
          headerGradient="from-purple-50/80 via-indigo-50/30 to-transparent"
          iconBg="bg-gradient-to-br from-purple-500 to-indigo-600 shadow-purple-500/20"
          hoverBorderColor="hover:border-purple-400/80"
          title="In-Silico Synthesis & Stage Summary"
          subtitle="Stage 2 metrics summary and readiness criteria for advancing to Stage 3 Molecular Docking."
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500">Target Botanical</span>
                <p className="font-bold text-slate-900 text-sm truncate">{project.plantName}</p>
                {project.plantScientificName && (
                  <p className="italic text-[11px] text-slate-500 truncate">{project.plantScientificName}</p>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500">Candidate Compounds</span>
                <p className="font-bold text-slate-900 text-base">{compounds.length}</p>
                <p className="text-[11px] text-slate-500">Identified in Stage 2</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500">Screening Status</span>
                <p className="font-bold text-slate-900 text-base">{screenedIds.size} / {compounds.length}</p>
                <p className="text-[11px] text-slate-500">
                  {screenedIds.size === compounds.length && compounds.length > 0
                    ? "All compounds screened"
                    : "Screening in progress"}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500">Docking Candidates</span>
                <p className="font-bold text-emerald-800 text-base">{selectedCompounds.length} Selected</p>
                <p className="text-[11px] text-slate-500">
                  Rationale: {rationaleApproved ? "Approved" : "Draft"}
                </p>
              </div>
            </div>

            {selectedCompounds.length > 0 && rationaleApproved ? (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold">Stage 2 In-Silico Analysis Complete</p>
                  <p className="text-emerald-800 text-[11px] mt-0.5">
                    {selectedCompounds.length} compound{selectedCompounds.length === 1 ? "" : "s"} validated and approved for Stage 3 Molecular Docking simulations.
                  </p>
                </div>
              </div>
            ) : selectedCompounds.length > 0 && !rationaleApproved ? (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                <div>
                  <p className="font-bold">Selection Rationale Pending Approval</p>
                  <p className="text-amber-800 text-[11px] mt-0.5">
                    Review and click &quot;Approve Rationale&quot; in Section 03 above to advance to Molecular Docking.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-xs">
                <AlertCircle className="h-5 w-5 text-slate-400 shrink-0" />
                <div>
                  <p className="font-bold">Docking Candidates Required</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Please select at least one compound for molecular docking in Section 03 above.
                  </p>
                </div>
              </div>
            )}
          </div>
        </ResearchSection>
      </div>

      {validationError && (
        <div role="alert" className="flex items-center gap-3 rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 text-xs font-extrabold text-rose-900 shadow-md">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{validationError}</span>
        </div>
      )}

      {selectedCompounds.length === 0 && !validationError && compounds.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800">
          <span>Please select at least one candidate compound in Section 03 to advance to Molecular Docking.</span>
        </div>
      )}

      <ResearchStageFooter
        projectId={project.id}
        stageNumber={2}
        stageTitle="In-Silico Analysis"
        previousStageRoute={`/researcher/projects/${projectId}/plant-literature`}
        onBack={handleBack}
        backLabel="Back to Plant & Literature Research"
        saveStatus={saveState}
        isSaving={saveState === "saving"}
        onSave={() => void handleSaveRationaleDraft()}
        saveLabel="Save Draft"
        isRevisionMode={isRevisionMode}
        onResubmitRevision={handleResubmitRevision}
        isResubmitting={resubmitting}
        reviewStatus={currentReviewStatus}
        onContinue={() => void handleCompleteAndContinue()}
        isContinuing={completingStage}
        continueLabel="Continue to Molecular Docking"
        continuingLabel="Advancing to Molecular Docking..."
        continueDisabled={selectedCompounds.length === 0 || !selectionRationale.trim() || completingStage || screeningIds.length > 0 || isRevisionMode}
      />

      {/* Revision Resubmitted Success Confirmation Modal */}
      <RevisionResubmittedSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        projectId={projectId}
        stageNumber={2}
        stageTitle="Stage 2 · In-Silico Analysis"
        discipline={successModalData.discipline}
        profession={successModalData.profession}
        reviewCycle={successModalData.reviewCycle}
        reviewerName={successModalData.reviewerName}
        addressedCount={successModalData.addressedCount}
      />

      <AnimatePresence>
        {modal?.type === "add" && (
          <CenteredModal
            title="ADD COMPOUNDS"
            subtitle={`${project.plantName}${project.plantScientificName ? ` · ${project.plantScientificName}` : ""}`}
            onClose={closeModal}
            extraWide
          >
            {customError && (
              <div className="mb-4 flex items-center justify-between gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs font-semibold text-rose-800">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{customError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomError(null)}
                  className="text-rose-500 hover:text-rose-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {discoveryMessage && (
              <div className="mb-4 flex items-center justify-between gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-xs font-semibold text-emerald-900 shadow-2xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{discoveryMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDiscoveryMessage(null)}
                  className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Context Header */}
            <div className="pb-3 border-b border-[#e7eee9]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-black text-[#0f2c20] font-heading flex items-center gap-1.5">
                    <FlaskConical className="w-4 h-4 text-emerald-600" />
                    Reported Phytochemicals
                  </h3>
                  <p className="text-xs text-[#52645d] mt-0.5">
                    Evidence-backed compounds documented for <strong className="text-[#0f2c20]">{project.plantName}</strong>{project.plantScientificName ? ` (${project.plantScientificName})` : ""} from peer-reviewed scientific literature.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {loadingAvailable && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      <span>Loading library…</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleDiscoverFromLiterature()}
                    disabled={discovering}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-2xs shrink-0"
                    title="Scan PubMed NCBI scientific literature for newly reported phytochemicals for this plant"
                  >
                    {discovering ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    <span>{discovering ? "Scanning Literature…" : "Discover from Literature"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Informative banner if limited library available */}
            {availableCompounds.length > 0 && availableCompounds.length <= 2 && (
              <div className="mt-3 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="leading-relaxed">
                    <strong>{availableCompounds.length} verified compound{availableCompounds.length === 1 ? "" : "s"}</strong> currently available. The NatureAide phytochemical library for this plant is continually expanded through literature grounding.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDiscoverFromLiterature()}
                  disabled={discovering}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs self-start sm:self-auto shrink-0"
                >
                  {discovering ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  <span>Search Literature</span>
                </button>
              </div>
            )}

            {/* Search and Filters Bar */}
            <div className="pt-3 pb-2 space-y-2.5">
              <div className="flex flex-col sm:flex-row gap-2.5">
                {/* Search input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    value={modalSearchTerm}
                    onChange={(e) => setModalSearchTerm(e.target.value)}
                    placeholder="Search compounds by name, formula, class, PubChem CID..."
                    className="w-full pl-9 pr-8 py-2 rounded-xl border border-[#d7e3db] bg-slate-50/50 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all"
                  />
                  {modalSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setModalSearchTerm("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter selects */}
                <div className="flex items-center gap-2 shrink-0">
                  {availableClasses.length > 0 && (
                    <div className="relative">
                      <select
                        value={selectedClassFilter}
                        onChange={(e) => setSelectedClassFilter(e.target.value)}
                        className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-[#d7e3db] bg-white text-xs font-semibold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer shadow-2xs"
                      >
                        <option value="ALL">All Classes ({availableClasses.length})</option>
                        {availableClasses.map((cls) => (
                          <option key={cls} value={cls}>
                            {cls}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  )}

                  <div className="relative">
                    <select
                      value={selectedStatusFilter}
                      onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                      className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-[#d7e3db] bg-white text-xs font-semibold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer shadow-2xs"
                    >
                      <option value="ALL">All Status</option>
                      <option value="NOT_ADDED">Not Yet Added</option>
                      <option value="ADDED">Already Added</option>
                      <option value="STRUCTURE_READY">Structure Ready</option>
                      <option value="EVIDENCE_AVAILABLE">Evidence Available</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Dynamic Counts & Select All Visible */}
              <div className="flex items-center justify-between text-xs py-1.5 px-1 text-slate-600 border-b border-[#e7eee9]">
                <div className="flex items-center gap-3">
                  {selectableVisibleCompounds.length > 0 && (
                    <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700 hover:text-emerald-800 transition-colors">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleSelectAllVisible}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span>Select all visible ({selectableVisibleCompounds.length})</span>
                    </label>
                  )}
                  {selectableVisibleCompounds.length > 0 && <span className="text-slate-300">|</span>}
                  <span className="font-medium">
                    <strong className="font-bold text-slate-900">{filteredCompounds.length}</strong> compound{filteredCompounds.length === 1 ? "" : "s"} available
                  </span>
                </div>

                <div>
                  <span className="text-[11.5px] font-semibold text-emerald-800">
                    <strong>{selectedCompoundIds.size}</strong> selected
                  </span>
                </div>
              </div>
            </div>

            {/* Compounds List */}
            {filteredCompounds.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl bg-slate-50/70 border border-dashed border-[#cfe0d5] space-y-3">
                {availableCompounds.length === 0 ? (
                  <div className="max-w-md mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/70 mx-auto flex items-center justify-center text-emerald-700 shadow-2xs">
                      <FlaskConical className="w-6 h-6 stroke-1.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">No curated compounds yet</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        NatureAide does not currently have referenced phytochemical records for <strong className="text-slate-800">{project.plantName}</strong>. You can catalog an ethnobotanical phytochemical candidate by submitting documented evidence.
                      </p>
                    </div>
                    {!showAdvancedCustomForm && (
                      <button
                        type="button"
                        onClick={() => setShowAdvancedCustomForm(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0f2c20] text-white text-xs font-bold hover:bg-[#184433] transition-all cursor-pointer shadow-sm hover:shadow-md"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Submit Compound With Evidence</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <Search className="w-6 h-6 mx-auto text-slate-300" />
                    <p className="text-xs font-semibold text-slate-700">No compounds match your search or filter</p>
                    <p className="text-[11px] text-slate-400">Try adjusting your keyword or resetting the filter controls.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setModalSearchTerm("");
                        setSelectedClassFilter("ALL");
                        setSelectedStatusFilter("ALL");
                      }}
                      className="mt-2 text-xs font-bold text-emerald-700 underline cursor-pointer"
                    >
                      Reset Search & Filters
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="max-h-[46vh] overflow-y-auto divide-y divide-[#edf2ee] pr-1 space-y-1 custom-scrollbar">
                {filteredCompounds.map((compound) => {
                  const isAdded =
                    compound.isAlreadyAdded ||
                    compounds.some(
                      (c) =>
                        c.compoundName.toLowerCase() === compound.compoundName.toLowerCase() ||
                        (compound.pubchemId && String(c.pubchemId) === String(compound.pubchemId))
                    );
                  const isChecked = selectedCompoundIds.has(compound.id);

                  return (
                    <div
                      key={compound.id}
                      className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl transition-all border ${
                        isAdded
                          ? "bg-slate-50/70 border-slate-100 opacity-80"
                          : isChecked
                          ? "bg-emerald-50/60 border-emerald-300/80 shadow-xs"
                          : "bg-white border-transparent hover:bg-slate-50/80 hover:border-slate-200"
                      }`}
                    >
                      {/* Checkbox and Info */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="pt-0.5 shrink-0">
                          {isAdded ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelectCompound(compound.id)}
                              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-heading font-black text-sm text-[#0f2c20]">
                              {compound.compoundName}
                            </h4>
                            {compound.molecularFormula && (
                              <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60">
                                {compound.molecularFormula}
                              </span>
                            )}
                            {compound.compoundClass && (
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                                {compound.compoundClass}
                              </span>
                            )}
                            {/* Documented Badge */}
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60" title="Botanical occurrence documented in scientific literature">
                              <FileText className="w-2.5 h-2.5 text-teal-600" />
                              Documented
                            </span>
                            {/* Structure Ready Badge */}
                            {compound.smiles || compound.pubchemId ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60" title="Canonical SMILES / 3D coordinates ready for molecular docking simulation">
                                <Check className="w-2.5 h-2.5 text-emerald-600" />
                                Structure Ready
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60" title="3D Structure pending retrieval">
                                Structure Pending
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-[11px] text-slate-500">
                            {compound.molecularWeight && (
                              <span>{Number(compound.molecularWeight).toFixed(2)} g/mol</span>
                            )}
                            {compound.pubchemId && (
                              <>
                                <span>·</span>
                                <span>PubChem CID: {compound.pubchemId}</span>
                              </>
                            )}
                            <span>·</span>
                            <span className="italic text-emerald-900/80 font-medium">
                              Reported in {compound.plantCommonName}
                            </span>
                            {compound.references && compound.references.length > 0 && (
                              <>
                                <span>·</span>
                                <button
                                  type="button"
                                  onClick={() => setInspectingCompound(compound)}
                                  className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                                >
                                  <span>{compound.references.length} source{compound.references.length > 1 ? "s" : ""} · View evidence</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {isAdded ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-200">
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                            Added
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void handleAddSingleCompound(compound)}
                            disabled={addingCompound}
                            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#0f2c20] hover:bg-[#184433] disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Sticky Multi-Select Bottom Bar */}
            {selectedCompoundIds.size > 0 && (
              <div className="sticky bottom-0 -mx-6 -mb-5 mt-4 px-6 py-3.5 bg-gradient-to-r from-[#072418] via-[#0d3626] to-[#041910] text-white flex items-center justify-between shadow-2xl border-t border-emerald-700/40">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-emerald-200">
                    <strong>{selectedCompoundIds.size}</strong> compound{selectedCompoundIds.size > 1 ? "s" : ""} selected
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedCompoundIds(new Set())}
                    className="text-xs text-slate-300 hover:text-white underline cursor-pointer"
                  >
                    Clear
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => void handleBatchAddCompounds()}
                  disabled={addingCompound}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold text-[#051a11] bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 disabled:opacity-50 transition-all cursor-pointer shadow-md shadow-emerald-500/25"
                >
                  {addingCompound ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Adding Compounds…</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add {selectedCompoundIds.size} Compound{selectedCompoundIds.size > 1 ? "s" : ""}</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Secondary Advanced Submission Workflow (accessible if library has compounds or user opened form) */}
            {(availableCompounds.length > 0 || showAdvancedCustomForm) && (
              <div className="mt-4 pt-4 border-t border-[#edf2ee]">
                {!showAdvancedCustomForm ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                    <div>
                      <p className="font-semibold text-slate-800">Can&apos;t find a reported compound?</p>
                      <p className="text-[11px] text-slate-500">
                        Submit a novel phytochemical with verifiable literature references for audit and inclusion.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAdvancedCustomForm(true)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
                    >
                      Submit Compound With Evidence
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void handleSubmitCustomCompound();
                    }}
                    className="p-4 rounded-2xl bg-slate-50 border border-emerald-200/80 space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">Submit Compound With Evidence</h4>
                        <p className="text-[11px] text-slate-500">
                          Requires documented proof associating this compound with {project.plantName}.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAdvancedCustomForm(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Compound Name *
                      </label>
                      <input
                        value={customCompoundName}
                        onChange={(e) => setCustomCompoundName(e.target.value)}
                        placeholder="e.g., Vitedoin A"
                        required
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 focus:border-emerald-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Compound Class
                      </label>
                      <input
                        value={customCompoundClass}
                        onChange={(e) => setCustomCompoundClass(e.target.value)}
                        placeholder="e.g., Flavonoid, Terpenoid, Lignan"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 focus:border-emerald-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Molecular Formula
                      </label>
                      <input
                        value={customMolecularFormula}
                        onChange={(e) => setCustomMolecularFormula(e.target.value)}
                        placeholder="e.g., C22H24O8"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 focus:border-emerald-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        PubChem CID (if available)
                      </label>
                      <input
                        value={customPubchemId}
                        onChange={(e) => setCustomPubchemId(e.target.value)}
                        placeholder="e.g., 10427847"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 focus:border-emerald-600 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Canonical SMILES
                      </label>
                      <input
                        value={customSmiles}
                        onChange={(e) => setCustomSmiles(e.target.value)}
                        placeholder="e.g., COC1=CC=C(C=C1)..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-mono text-slate-800 focus:border-emerald-600 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Evidence of Association with {project.plantName} *
                      </label>
                      <textarea
                        value={customPlantEvidence}
                        onChange={(e) => setCustomPlantEvidence(e.target.value)}
                        placeholder="Explain the botanical isolation / chromatographic identification of this phytochemical from this plant species..."
                        rows={2}
                        required
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 focus:border-emerald-600 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Scientific Reference / DOI / Source *
                      </label>
                      <input
                        value={customSourceReference}
                        onChange={(e) => setCustomSourceReference(e.target.value)}
                        placeholder="e.g., Author et al. (2020), Journal Name 15(2): 100-105. DOI: 10.1016/..."
                        required
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 focus:border-emerald-600 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] text-slate-500 italic">
                      Will be cataloged as: &quot;Researcher Submitted (Verification Pending)&quot;
                    </span>
                    <button
                      type="submit"
                      disabled={addingCompound}
                      className="px-4 py-2 rounded-xl bg-emerald-800 text-white font-bold hover:bg-emerald-900 transition-colors shadow-xs cursor-pointer"
                    >
                      {addingCompound ? "Submitting…" : "Submit & Add to Project"}
                    </button>
                  </div>
                </form>
              )}
            </div>
            )}
          </CenteredModal>
        )}

        {/* Evidence Inspection Modal */}
        {inspectingCompound && (
          <CenteredModal
            title={`Reported Evidence: ${inspectingCompound.compoundName}`}
            subtitle={`${inspectingCompound.plantCommonName} (${inspectingCompound.plantScientificName})`}
            onClose={() => setInspectingCompound(null)}
            wide
          >
            <div className="space-y-4 text-xs">
              {/* Chemical summary */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Chemical Specification
                    </span>
                    <h4 className="font-heading font-black text-base text-[#0f2c20]">
                      {inspectingCompound.compoundName}
                    </h4>
                  </div>
                  {inspectingCompound.compoundClass && (
                    <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {inspectingCompound.compoundClass}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-slate-600">
                  {inspectingCompound.molecularFormula && (
                    <div>
                      <span className="text-[10px] text-slate-400 block">Formula</span>
                      <span className="font-mono font-bold text-slate-800">{inspectingCompound.molecularFormula}</span>
                    </div>
                  )}
                  {inspectingCompound.molecularWeight && (
                    <div>
                      <span className="text-[10px] text-slate-400 block">Molecular Weight</span>
                      <span className="font-mono font-bold text-slate-800">{Number(inspectingCompound.molecularWeight).toFixed(2)} g/mol</span>
                    </div>
                  )}
                  {inspectingCompound.pubchemId && (
                    <div>
                      <span className="text-[10px] text-slate-400 block">PubChem CID</span>
                      <a
                        href={`https://pubchem.ncbi.nlm.nih.gov/compound/${inspectingCompound.pubchemId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
                      >
                        <span>{inspectingCompound.pubchemId}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {inspectingCompound.iupacName && (
                  <div className="pt-1.5 text-[11px] text-slate-600">
                    <span className="text-slate-400 font-semibold">IUPAC:</span> {inspectingCompound.iupacName}
                  </div>
                )}
                {inspectingCompound.smiles && (
                  <div className="pt-1 text-[10.5px] font-mono text-slate-500 break-all bg-white p-2 rounded-lg border border-slate-200/60">
                    {inspectingCompound.smiles}
                  </div>
                )}
              </div>

              {/* Botanical occurrence */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/60 text-emerald-950 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 block">
                  Botanical Documentation
                </span>
                <p className="font-semibold text-xs">
                  Documented constituent of <span className="font-bold">{inspectingCompound.plantCommonName}</span> (<em>{inspectingCompound.plantScientificName}</em>)
                </p>
                {inspectingCompound.plantPartReported && (
                  <p className="text-[11px] text-emerald-800">
                    Reported Plant Part: <strong className="font-bold">{inspectingCompound.plantPartReported}</strong>
                  </p>
                )}
              </div>

              {/* Documented Scientific References */}
              <div>
                <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-2">
                  Documented Scientific References ({inspectingCompound.references?.length || 0})
                </h5>
                {inspectingCompound.references && inspectingCompound.references.length > 0 ? (
                  <div className="space-y-2">
                    {inspectingCompound.references.map((ref, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1 text-xs"
                      >
                        <p className="font-bold text-slate-900 leading-snug">{ref.title}</p>
                        <p className="text-slate-600 text-[11px]">
                          {ref.authors && <span className="font-medium text-slate-700">{ref.authors}. </span>}
                          {ref.journal && <span className="italic">{ref.journal} </span>}
                          {ref.year && <span>({ref.year})</span>}
                          {ref.volume && <span> {ref.volume}</span>}
                          {ref.pages && <span>: {ref.pages}</span>}
                        </p>
                        {ref.doi && (
                          <p className="pt-0.5">
                            <a
                              href={ref.doi.startsWith("http") ? ref.doi : `https://doi.org/${ref.doi}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
                            >
                              <span>DOI: {ref.doi}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </p>
                        )}
                        {ref.pubmedId && (
                          <p className="pt-0.5">
                            <a
                              href={`https://pubmed.ncbi.nlm.nih.gov/${ref.pubmedId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-bold text-sky-700 hover:underline inline-flex items-center gap-1"
                            >
                              <span>PMID: {ref.pubmedId}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No direct citation links stored for this phytochemical.</p>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setInspectingCompound(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Close Evidence
                </button>
              </div>
            </div>
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
                {activePapers.map((paper, idx) => (
                  <article
                    key={`compound-paper-${paper.pubmedId || paper.id || idx}-${idx}`}
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
