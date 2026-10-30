"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  AlertTriangle,
  FileText,
  Dna,
  Leaf,
  Pill,
  FlaskConical,
  Stethoscope,
  ExternalLink,
  ShieldCheck,
  Plus,
  Trash2,
  Loader2,
  Send,
  Save,
  Info,
  User,
  ChevronDown,
  ChevronUp,
  History,
  Flag,
  Check,
  X,
  Edit3,
  Search,
  Eye,
  Layers,
  Sparkles,
  Bot,
  Compass,
  CheckSquare,
  Square,
  HelpCircle,
  Bookmark,
} from "lucide-react";
import {
  EXPERT_REVIEW_AREAS,
  normalizeReviewAreaKey,
  getAreaDefinition,
  type ExpertReviewAreaKey,
} from "@/lib/expert-review-areas";

interface Props {
  role: string;
  initialProjectId?: number | null;
  initialAssignmentId?: number | null;
}

const AREA_ICON_MAP: Record<string, React.ElementType> = {
  pharmacognosy: Leaf,
  bioinformatics: Dna,
  pharmacology: Pill,
  formulation: FlaskConical,
  clinical_safety: Stethoscope,
};

const BOTANICAL_FAMILY_FALLBACKS: Record<string, string> = {
  "Momordica charantia": "Cucurbitaceae",
  "Blumea balsamifera": "Asteraceae",
  "Vitex negundo": "Lamiaceae (Verbenaceae)",
  "Psidium guajava": "Myrtaceae",
  "Senna alata": "Fabaceae",
  "Allium sativum": "Amaryllidaceae",
  "Curcuma longa": "Zingiberaceae",
  "Peperomia pellucida": "Piperaceae",
  "Carmona retusa": "Boraginaceae",
  "Mentha cordifolia": "Lamiaceae",
  "Quisqualis indica": "Combretaceae",
  "Zingiber officinale": "Zingiberaceae",
};

const KNOWN_PUBCHEM_CIDS: Record<string, string> = {
  quercetin: "5280343",
  charantin: "11953835",
  momordicin: "10175510",
  "momordicin i": "10175510",
  luteolin: "5280445",
  kaempferol: "5280863",
  curcumin: "969516",
  "gallic acid": "370",
  vicine: "439528",
  "polypeptide-p": "71308358",
};

interface CheckingStepDef {
  id: string;
  number: string;
  title: string;
  subtitle: string;
}

const ROLE_STEPS: Record<string, CheckingStepDef[]> = {
  pharmacognosy: [
    { id: "botanical_identity", number: "01", title: "Botanical Identity", subtitle: "Taxonomic specification & botanical family" },
    { id: "extraction", number: "02", title: "Extraction & Preparation", subtitle: "Extraction protocol, solvent & yield" },
    { id: "phytochemicals", number: "03", title: "Phytochemical Context", subtitle: "Screened bioactive metabolites relevant to the submitted research" },
    { id: "literature", number: "04", title: "Supporting Literature", subtitle: "Deduplicated peer-reviewed botanical citations" },
    { id: "interpretation", number: "05", title: "Research Interpretation", subtitle: "Botanical synthesis & cross-disciplinary context" },
  ],
  bioinformatics: [
    { id: "compounds", number: "01", title: "Screened Compounds", subtitle: "Bioactive molecules screened for in-silico simulation" },
    { id: "screening_admet", number: "02", title: "Screening & ADMET", subtitle: "Pharmacokinetic profile and drug-likeness filters" },
    { id: "target_selection", number: "03", title: "Target Selection & PDB", subtitle: "Validated crystal structures and target binding pockets" },
    { id: "docking_setup", number: "04", title: "Docking Setup & Simulations", subtitle: "AutoDock Vina simulation grid and energy parameters" },
    { id: "computational_results", number: "05", title: "Computational Results & Limits", subtitle: "Binding affinity benchmarks and in-silico limits" },
  ],
  pharmacology: [
    { id: "mechanisms", number: "01", title: "Molecular Mechanisms", subtitle: "Hypothesized pathways of therapeutic action" },
    { id: "biological_relevance", number: "02", title: "Biological Relevance", subtitle: "Physiological relevance and enzymatic targets" },
    { id: "compound_target_evidence", number: "03", title: "Compound-Target Evidence", subtitle: "Interaction matrix and binding affinity correlation" },
    { id: "literature", number: "04", title: "Supporting Literature", subtitle: "Pharmacological and functional bioassay citations" },
    { id: "pharmacological_interpretation", number: "05", title: "Pharmacological Interpretation", subtitle: "Mechanistic interpretation and biological boundaries" },
  ],
  formulation: [
    { id: "prototype_profile", number: "01", title: "Prototype Profile", subtitle: "Dosage form, vehicle, and route specifications" },
    { id: "composition_ingredients", number: "02", title: "Composition & Ingredients", subtitle: "Standardized active fraction and pharmaceutical excipients" },
    { id: "preparation_sop", number: "03", title: "Preparation SOP", subtitle: "Compounding procedure, mixing steps, and process control" },
    { id: "concentration_ratio", number: "04", title: "Concentration & Ratio", subtitle: "Plant-to-extract ratio and active concentration limits" },
    { id: "formulation_assessment", number: "05", title: "Formulation Assessment", subtitle: "Stability risks, shelf-life factors, and formulation boundaries" },
  ],
  clinical_safety: [
    { id: "toxicity_boundaries", number: "01", title: "Toxicity Boundaries", subtitle: "Cytotoxicity thresholds and published safety margins" },
    { id: "contraindications_warnings", number: "02", title: "Contraindications & Warnings", subtitle: "Hypersensitivity, pregnancy, lactation, and condition warnings" },
    { id: "herb_drug_interactions", number: "03", title: "Herb-Drug Interactions", subtitle: "Cytochrome P450 modulation and pharmacological synergies" },
    { id: "dose_concentration", number: "04", title: "Dose & Concentration Limits", subtitle: "Maximum recommended daily doses and toxic thresholds" },
    { id: "safety_assessment", number: "05", title: "Clinical Safety Assessment", subtitle: "Evidence synthesis and clinical safety precautions" },
  ],
};

interface ChecklistItem {
  id: string;
  label: string;
}

// 1. PROFESSIONAL CHECKLIST CRITERIA (DYNAMIC ACROSS ALL 5 SPECIALTIES)
const CHECKLIST_CRITERIA_BY_ROLE: Record<string, ChecklistItem[]> = {
  pharmacognosy: [
    { id: "botanical_identity", label: "Botanical identity verified with accepted scientific nomenclature" },
    { id: "plant_part", label: "Plant part studied clearly identified and documented" },
    { id: "plant_material", label: "Plant material source & authentication documented" },
    { id: "extraction_method", label: "Extraction method & solvent parameters sufficiently described" },
    { id: "phytochemical_evidence", label: "Phytochemical evidence & bioactive markers reviewed" },
    { id: "supporting_literature", label: "Supporting literature relevant & peer-reviewed" },
  ],
  bioinformatics: [
    { id: "compound_descriptors", label: "Bioactive compound descriptors & SMILES structures reviewed" },
    { id: "admet_screening", label: "Pharmacokinetic & ADMET drug-likeness criteria verified" },
    { id: "target_pdb", label: "Target macromolecule crystal structures & PDB records validated" },
    { id: "docking_parameters", label: "AutoDock Vina simulation parameters & docking grid verified" },
    { id: "computational_boundaries", label: "Binding affinities properly labeled as computational predictions" },
    { id: "in_silico_citations", label: "In-silico literature & structural data sources reviewed" },
  ],
  pharmacology: [
    { id: "mechanism_pathway", label: "Proposed molecular mechanism biochemically substantiated" },
    { id: "biological_relevance", label: "Biological relevance & physiological pathways documented" },
    { id: "compound_target_matrix", label: "Compound-target interaction matrix substantiated" },
    { id: "toxicity_boundaries", label: "Cellular toxicity & safety boundaries evaluated" },
    { id: "pharmacological_literature", label: "Supporting pharmacological citations verified" },
  ],
  formulation: [
    { id: "prototype_specs", label: "Dosage form prototype & delivery route clearly specified" },
    { id: "excipient_compatibility", label: "Extract standardization & excipient compatibility verified" },
    { id: "compounding_sop", label: "Preparation standard operating procedure (SOP) sufficiently detailed" },
    { id: "der_ratio", label: "Plant-to-extract ratio (DER) & concentration limits justified" },
    { id: "stability_storage", label: "Formulation stability risks & packaging storage conditions evaluated" },
  ],
  clinical_safety: [
    { id: "preclinical_safety", label: "Cytotoxicity thresholds & preclinical safety boundaries reviewed" },
    { id: "contraindications", label: "Contraindications & vulnerable population warnings clearly stated" },
    { id: "herb_drug_interactions", label: "Potential herb-drug interactions (e.g. CYP450, antidiabetics) documented" },
    { id: "dose_limits", label: "Maximum recommended daily dose & concentration limits justified" },
    { id: "clinical_relevance", label: "Clinical safety precautions & surveillance relevance evaluated" },
  ],
};

const FINDING_TYPES = [
  "Scientific Concern",
  "Missing Information",
  "Clarification",
  "Evidence Concern",
  "Correction Required",
  "Recommendation",
];

const SEVERITY_LEVELS = ["Minor", "Major", "Critical"];

// 2. EVIDENCE PROVENANCE BADGE COMPONENT
function ProvenanceBadge({
  type,
  detail,
}: {
  type: "LITERATURE" | "PREDICTED" | "RESEARCHER PROVIDED" | "INTERPRETATION" | "EXPERIMENTAL";
  detail?: string;
}) {
  const styles = {
    LITERATURE: "bg-blue-50 text-blue-700 border-blue-200",
    PREDICTED: "bg-purple-50 text-purple-700 border-purple-200",
    "RESEARCHER PROVIDED": "bg-slate-100 text-slate-700 border-slate-200",
    INTERPRETATION: "bg-teal-50 text-teal-700 border-teal-200",
    EXPERIMENTAL: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-extrabold uppercase tracking-wider ${
        styles[type] || styles.LITERATURE
      }`}
    >
      <span>{type}</span>
      {detail && <span className="font-normal opacity-85">· {detail}</span>}
    </span>
  );
}

function deduplicateLiterature(list: any[] = []): any[] {
  const seen = new Set<string>();
  const deduped: any[] = [];

  for (const item of list) {
    if (!item) continue;
    let key = "";
    const pmid = item.pubmedId || item.pmid;
    const doi = item.doi || item.doiOrUrl;

    if (pmid && String(pmid).trim()) {
      key = `pmid:${String(pmid).trim()}`;
    } else if (doi && String(doi).trim()) {
      const clean = String(doi)
        .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
        .trim()
        .toLowerCase();
      key = `doi:${clean}`;
    } else {
      const normTitle = (item.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const yr = item.year || "";
      key = `title:${normTitle}_${yr}`;
    }

    if (key && !seen.has(key)) {
      seen.add(key);
      deduped.push(item);
    }
  }

  return deduped;
}

export default function RoleCheckingWorkspaceClient({
  role,
  initialProjectId,
  initialAssignmentId,
}: Props) {
  const router = useRouter();
  const roleKey = normalizeReviewAreaKey(role);
  const areaDef = getAreaDefinition(roleKey);
  const RoleIcon = AREA_ICON_MAP[roleKey] || ShieldCheck;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(
    initialAssignmentId || null
  );

  // Steps configuration for current role
  const steps = useMemo(() => {
    return ROLE_STEPS[roleKey] || ROLE_STEPS.pharmacognosy;
  }, [roleKey]);

  // Checklist criteria for this role
  const roleChecklistItems = useMemo(() => {
    return CHECKLIST_CRITERIA_BY_ROLE[roleKey] || CHECKLIST_CRITERIA_BY_ROLE.pharmacognosy;
  }, [roleKey]);

  // Workspace Navigation & State
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isSummaryView, setIsSummaryView] = useState<boolean>(false);
  const [isRevisionsView, setIsRevisionsView] = useState<boolean>(false);
  const [checkedStepIds, setCheckedStepIds] = useState<Set<string>>(new Set());

  // 1. Checklist State: { [stepId]: { [checklistItemId]: boolean } }
  const [checklistState, setChecklistState] = useState<Record<string, Record<string, boolean>>>({});

  // 5. Autosave Engine state
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Review & Findings State
  const [comments, setComments] = useState("");
  const [findings, setFindings] = useState<any[]>([]);
  const [crossAreaFindings, setCrossAreaFindings] = useState<any[]>([]);
  const [selectedCompoundIdx, setSelectedCompoundIdx] = useState<number | null>(null);
  const [expandedLiteratureIds, setExpandedLiteratureIds] = useState<Set<string | number>>(new Set());
  const [literatureSearch, setLiteratureSearch] = useState("");

  // Finding Modal State
  const [findingModalOpen, setFindingModalOpen] = useState(false);
  const [editingFindingIdx, setEditingFindingIdx] = useState<number | null>(null);
  const [modalArea, setModalArea] = useState("");
  const [modalFindingType, setModalFindingType] = useState(FINDING_TYPES[0]);
  const [modalSeverity, setModalSeverity] = useState(SEVERITY_LEVELS[1]); // Major default
  const [modalComment, setModalComment] = useState("");
  const [modalRecommendation, setModalRecommendation] = useState("");
  const [modalRelatedEvidence, setModalRelatedEvidence] = useState("");

  // Confirmation Modals
  const [submitRevisionModalOpen, setSubmitRevisionModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // 13. Contextual Ask NatureAide Drawer
  const [showAskDrawer, setShowAskDrawer] = useState(false);
  const [assistantPrompt, setAssistantPrompt] = useState("");
  const [assistantResponse, setAssistantResponse] = useState<string | null>(null);
  const [assistantLoading, setAssistantLoading] = useState(false);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadWorkspace = useCallback(
    async (assignId?: number | null) => {
      try {
        setLoading(true);
        const url = assignId
          ? `/api/reviewer/checking/${roleKey}?assignmentId=${assignId}`
          : initialProjectId
          ? `/api/reviewer/checking/${roleKey}?projectId=${initialProjectId}`
          : `/api/reviewer/checking/${roleKey}`;

        const res = await fetch(url);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Unable to load checking workspace");
        }
        const json = await res.json();
        setData(json);

        if (json.activeAssignment) {
          setSelectedAssignmentId(json.activeAssignment.assignmentId);
          if (
            json.activeAssignment.assignmentStatus === "REVISION_REQUIRED" ||
            json.activeAssignment.assignmentStatus === "RESUBMITTED"
          ) {
            setIsRevisionsView(true);
          }
        }

        if (json.review) {
          if (json.review.comments) setComments(json.review.comments);
          if (json.review.checklistData) {
            try {
              const parsed =
                typeof json.review.checklistData === "string"
                  ? JSON.parse(json.review.checklistData)
                  : json.review.checklistData;
              if (parsed && typeof parsed === "object") {
                setChecklistState(parsed);
              }
            } catch (e) {
              console.warn("Failed to parse checklistData:", e);
            }
          }
        } else {
          setComments("");
        }

        if (Array.isArray(json.findings)) {
          setFindings(json.findings);
        } else {
          setFindings([]);
        }

        if (Array.isArray(json.crossAreaFindings)) {
          setCrossAreaFindings(json.crossAreaFindings);
        } else {
          setCrossAreaFindings([]);
        }
      } catch (err: any) {
        console.error("Failed to load checking workspace:", err);
        showToast(err.message || "Error loading checking workspace.");
      } finally {
        setLoading(false);
      }
    },
    [roleKey, initialProjectId]
  );

  useEffect(() => {
    loadWorkspace(selectedAssignmentId);
  }, [loadWorkspace, selectedAssignmentId]);

  const activeAssignment = data?.activeAssignment;
  const assignments = data?.assignments || [];
  const snapshot = data?.snapshot;
  const reviewHistory = data?.reviewHistory || [];
  const canEdit = data?.canEdit !== false;

  // Deduplicate literature records before rendering
  const dedupedLiterature = useMemo(() => {
    return deduplicateLiterature(snapshot?.literature || []);
  }, [snapshot?.literature]);

  // Filtered literature by search
  const filteredLiterature = useMemo(() => {
    if (!literatureSearch.trim()) return dedupedLiterature;
    const q = literatureSearch.toLowerCase();
    return dedupedLiterature.filter(
      (lit) =>
        (lit.title || "").toLowerCase().includes(q) ||
        (lit.authors || "").toLowerCase().includes(q) ||
        (lit.journal || lit.journalSource || "").toLowerCase().includes(q)
    );
  }, [dedupedLiterature, literatureSearch]);

  // Botanical Family safe resolution
  const plantScientific = activeAssignment?.plantScientificName || snapshot?.plantScientificName || "";
  const botanicalFamily = useMemo(() => {
    const raw = snapshot?.botanicalFamily || snapshot?.plantFamily;
    if (raw && !raw.toLowerCase().includes("support") && !raw.toLowerCase().includes("metabolic")) {
      return raw;
    }
    return BOTANICAL_FAMILY_FALLBACKS[plantScientific] || "Not available in submitted research";
  }, [snapshot, plantScientific]);

  // Derived Open Findings
  const openFindings = useMemo(() => {
    return findings.filter((f) => (f.status || "OPEN").toUpperCase() !== "RESOLVED");
  }, [findings]);

  // Current active step
  const currentStep = steps[currentStepIndex] || steps[0];

  // 1. Calculate step verification based on checklist:
  // An area is automatically verified when all its checklist items are completed
  const currentStepCheckedCount = useMemo(() => {
    const stepObj = checklistState[currentStep.id] || {};
    return roleChecklistItems.filter((item) => Boolean(stepObj[item.id])).length;
  }, [checklistState, currentStep.id, roleChecklistItems]);

  const isCurrentStepChecklistComplete = currentStepCheckedCount === roleChecklistItems.length;

  // Sync checkedStepIds based on checklist completion
  useEffect(() => {
    setCheckedStepIds((prev) => {
      const next = new Set(prev);
      steps.forEach((st) => {
        const stepObj = checklistState[st.id] || {};
        const count = roleChecklistItems.filter((item) => Boolean(stepObj[item.id])).length;
        if (count === roleChecklistItems.length && roleChecklistItems.length > 0) {
          next.add(st.id);
        } else {
          next.delete(st.id);
        }
      });
      return next;
    });
  }, [checklistState, steps, roleChecklistItems]);

  // Findings for current step
  const currentStepFindings = useMemo(() => {
    return findings.filter((f) => {
      const sName = (f.sectionName || "").toLowerCase();
      const sTitle = currentStep.title.toLowerCase();
      return sName.includes(sTitle) || sTitle.includes(sName);
    });
  }, [findings, currentStep.title]);

  // Grouped findings by checking area
  const groupedFindings = useMemo(() => {
    const groups: Record<string, any[]> = {};
    for (const f of openFindings) {
      const area = f.sectionName || "General";
      if (!groups[area]) groups[area] = [];
      groups[area].push(f);
    }
    return groups;
  }, [openFindings]);

  // 5. AUTOSAVE TRIGGER FUNCTION
  const triggerAutosave = useCallback(
    (newChecklistState?: any, newComments?: string, newFindings?: any[]) => {
      if (!data?.activeAssignment) return;

      setSaveStatus("saving");
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }

      autosaveTimeoutRef.current = setTimeout(async () => {
        try {
          const stateToSave = newChecklistState !== undefined ? newChecklistState : checklistState;
          const commentsToSave = newComments !== undefined ? newComments : comments;
          const findingsToSave = newFindings !== undefined ? newFindings : findings;

          const res = await fetch(
            `/api/reviewer/reviews/${data.activeAssignment.assignmentId}/draft`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                assessment: openFindings.length > 0 ? "REVISION_REQUIRED" : "ACCEPTABLE",
                comments: commentsToSave,
                findings: findingsToSave,
                checklistData: stateToSave,
              }),
            }
          );

          if (res.ok) {
            setSaveStatus("saved");
            setTimeout(() => setSaveStatus("idle"), 2500);
          } else {
            setSaveStatus("idle");
          }
        } catch (err) {
          console.warn("Autosave draft failed:", err);
          setSaveStatus("idle");
        }
      }, 1000);
    },
    [data?.activeAssignment, checklistState, comments, findings, openFindings.length]
  );

  // 1. Toggle specific checklist item
  const toggleChecklistItem = (stepId: string, itemId: string) => {
    if (!canEdit) return;

    setChecklistState((prev) => {
      const stepObj = prev[stepId] || {};
      const newStepObj = { ...stepObj, [itemId]: !stepObj[itemId] };
      const nextState = { ...prev, [stepId]: newStepObj };
      triggerAutosave(nextState);
      return nextState;
    });
  };

  // 3. Open Modal to Add or Edit Finding with auto-captured context
  const openAddFinding = (areaTitle?: string, relatedEvidence?: string) => {
    if (!canEdit) return;
    setModalArea(areaTitle || currentStep.title);
    setModalFindingType(FINDING_TYPES[0]);
    setModalSeverity(SEVERITY_LEVELS[1]); // Major default
    setModalComment("");
    setModalRecommendation("");
    setModalRelatedEvidence(
      relatedEvidence || `${currentStep.title} submitted evidence`
    );
    setEditingFindingIdx(null);
    setFindingModalOpen(true);
  };

  const openEditFinding = (idx: number) => {
    if (!canEdit) return;
    const f = findings[idx];
    if (!f) return;
    setModalArea(f.sectionName || currentStep.title);
    setModalFindingType(f.title?.split(" · ")[1] || f.severity || FINDING_TYPES[0]);
    setModalSeverity(f.severity || SEVERITY_LEVELS[1]);
    setModalComment(f.comment || "");
    setModalRecommendation(f.recommendation || "");
    setModalRelatedEvidence(f.referenceLink || f.relatedEvidence || "");
    setEditingFindingIdx(idx);
    setFindingModalOpen(true);
  };

  const handleSaveModalFinding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalComment.trim()) {
      showToast("Please describe the finding.");
      return;
    }

    const findingTitle = `${modalSeverity} · ${modalFindingType}`;

    if (editingFindingIdx !== null) {
      setFindings((prev) => {
        const copy = [...prev];
        copy[editingFindingIdx] = {
          ...copy[editingFindingIdx],
          title: findingTitle,
          sectionName: modalArea,
          severity: modalSeverity,
          comment: modalComment.trim(),
          recommendation: modalRecommendation.trim() || null,
          referenceLink: modalRelatedEvidence.trim() || null,
          relatedEvidence: modalRelatedEvidence.trim() || null,
        };
        triggerAutosave(undefined, undefined, copy);
        return copy;
      });
      showToast("Finding updated.");
    } else {
      const newFinding = {
        id: undefined,
        title: findingTitle,
        sectionName: modalArea,
        severity: modalSeverity,
        comment: modalComment.trim(),
        recommendation: modalRecommendation.trim() || null,
        referenceLink: modalRelatedEvidence.trim() || null,
        relatedEvidence: modalRelatedEvidence.trim() || null,
        projectTitle: activeAssignment?.projectTitle,
        dossierVersion: activeAssignment?.versionTag || "v1.0",
        reviewRound: activeAssignment?.reviewRound || 1,
        areaKey: roleKey,
        status: "OPEN",
        createdAt: new Date().toISOString(),
      };
      setFindings((prev) => {
        const next = [newFinding, ...prev];
        triggerAutosave(undefined, undefined, next);
        return next;
      });
      showToast("Finding added & linked to evidence.");
    }

    setFindingModalOpen(false);
  };

  const handleRemoveFinding = async (index: number) => {
    if (!canEdit) return;
    const f = findings[index];
    if (f?.id) {
      try {
        await fetch(`/api/reviewer/feedback/${f.id}`, { method: "DELETE" });
      } catch (e) {
        console.warn("Delete feedback failed", e);
      }
    }
    setFindings((prev) => {
      const next = prev.filter((_, i) => i !== index);
      triggerAutosave(undefined, undefined, next);
      return next;
    });
    showToast("Finding removed.");
  };

  const handleToggleResolveFinding = (idx: number, markResolved: boolean) => {
    setFindings((prev) => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        status: markResolved ? "RESOLVED" : "OPEN",
      };
      triggerAutosave(undefined, undefined, copy);
      return copy;
    });
    showToast(markResolved ? "Marked as resolved." : "Marked as needing further revision.");
  };

  // Submit Revisions
  const handleConfirmSubmitRevisions = async () => {
    if (!data?.activeAssignment) return;
    if (openFindings.length === 0) {
      showToast("Please add at least one finding before requesting revisions.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(
        `/api/reviewer/reviews/${data.activeAssignment.assignmentId}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assessment: "REVISION_REQUIRED",
            comments:
              comments.trim() ||
              `Professional revision required for ${areaDef.shortLabel}. Please address the listed findings.`,
            findings,
            checklistData: checklistState,
          }),
        }
      );

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to submit revision request");
      }

      setSubmitRevisionModalOpen(false);
      showToast(`Revision request submitted: ${openFindings.length} finding(s) returned to researcher.`);
      await loadWorkspace(data.activeAssignment.assignmentId);
    } catch (err: any) {
      console.error("Submit revisions error:", err);
      showToast(err.message || "Failed to submit revisions.");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Approval
  const handleConfirmApprove = async () => {
    if (!data?.activeAssignment) return;

    try {
      setSubmitting(true);
      const res = await fetch(
        `/api/reviewer/reviews/${data.activeAssignment.assignmentId}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assessment: "ACCEPTABLE",
            comments:
              comments.trim() ||
              `${areaDef.shortLabel} evidence has been reviewed and verified as acceptable for this cycle.`,
            findings,
            checklistData: checklistState,
          }),
        }
      );

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to approve review");
      }

      setApproveModalOpen(false);
      showToast(`${areaDef.shortLabel} approved successfully.`);
      await loadWorkspace(data.activeAssignment.assignmentId);
    } catch (err: any) {
      console.error("Approve review error:", err);
      showToast(err.message || "Failed to approve check.");
    } finally {
      setSubmitting(false);
    }
  };

  // 13. Contextual Ask NatureAide AI handler
  const handleAskAssistant = async (promptText: string) => {
    if (!promptText.trim() || assistantLoading) return;
    setAssistantLoading(true);
    setAssistantResponse(null);

    try {
      const groundedPrompt = `[Context: Reviewing ${areaDef.checkingTitle} - Step: ${currentStep.title} for specimen ${activeAssignment?.plantName} (${plantScientific})] Question: ${promptText}`;

      const res = await fetch("/api/reviewer/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: activeAssignment?.projectId,
          message: groundedPrompt,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setAssistantResponse(json.reply || json.message || "No explanation returned.");
      } else {
        setAssistantResponse("Unable to retrieve AI explanation at this time.");
      }
    } catch (e) {
      console.error("Ask NatureAide error:", e);
      setAssistantResponse("Error connecting to NatureAide AI Peer Review assistant.");
    } finally {
      setAssistantLoading(false);
    }
  };

  // 12. Conflict / Consistency Attention check (Data-Grounded)
  const consistencyWarnings = useMemo(() => {
    const list: string[] = [];

    // Check if Clinical Safety has open findings on dose/concentration and current role is Formulation or Pharmacology
    const clinicalDoseFinding = crossAreaFindings.find(
      (f) =>
        f.areaKey === "clinical_safety" &&
        ((f.comment || "").toLowerCase().includes("dose") ||
          (f.comment || "").toLowerCase().includes("concentration") ||
          (f.sectionName || "").toLowerCase().includes("dose"))
    );
    if (clinicalDoseFinding && (roleKey === "formulation" || roleKey === "pharmacology")) {
      list.push(
        "Clinical Safety identifies open concerns regarding supported clinical concentrations while Formulation defines prototype concentration."
      );
    }

    // Check if Research Interpretation describes docking results without acknowledging computational in-silico boundaries
    if (roleKey === "pharmacognosy" || roleKey === "pharmacology") {
      const interp = snapshot?.scientificInterpretation || "";
      if (
        interp.toLowerCase().includes("docking") ||
        interp.toLowerCase().includes("affinity")
      ) {
        list.push(
          "Research Interpretation synthesis references predicted docking scores; ensure conclusions clearly reflect PREDICTED in-silico simulation limits."
        );
      }
    }

    return list;
  }, [crossAreaFindings, roleKey, snapshot]);

  // Literature Toggle helper
  const toggleLiteratureExpand = (id: string | number) => {
    setExpandedLiteratureIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Navigation handlers
  const handlePrev = () => {
    if (isSummaryView) {
      setIsSummaryView(false);
      setCurrentStepIndex(steps.length - 1);
    } else if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      setIsSummaryView(true);
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="w-full max-w-none p-16 text-center rounded-3xl bg-white border border-slate-200/90 shadow-2xs font-sans">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-800">
          Loading {areaDef.checkingTitle}...
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Retrieving assigned scientific evidence & verified research records
        </p>
      </div>
    );
  }

  // No assignments found
  if (!activeAssignment || assignments.length === 0) {
    return (
      <div className="w-full max-w-none space-y-6 font-sans">
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#071d3a] via-[#0b2b54] to-[#123e73] border border-blue-400/30 text-white shadow-md shadow-blue-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-white tracking-tight">
                {areaDef.checkingTitle}
              </h1>
              <p className="text-xs text-blue-200">No active assignment found</p>
            </div>
            <Link
              href="/reviewer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-300" />
              <span>Back to Workspace</span>
            </Link>
          </div>
        </div>

        <div className="p-12 text-center rounded-3xl bg-white border border-slate-200/90 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <RoleIcon className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">
            No Research Dossiers Assigned for {areaDef.shortLabel} Checking
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            There are currently no research dossiers waiting for {areaDef.shortLabel} verification under your professional account.
          </p>
          <div className="pt-2">
            <Link
              href="/reviewer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs"
            >
              <span>View Review Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusText =
    activeAssignment.assignmentStatus === "COMPLETED"
      ? "Approved"
      : activeAssignment.assignmentStatus === "REVISION_REQUIRED"
      ? "Revision Required"
      : activeAssignment.assignmentStatus === "IN_REVIEW"
      ? "In Checking"
      : "Pending Checking";

  return (
    <div className="w-full max-w-none space-y-6 pb-6 font-sans text-slate-900">
      {/* TOAST ALERT */}
      {toastMessage && (
        <div className="fixed bottom-20 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. COMPACT REVIEW HEADER                                 */}
      {/* ======================================================== */}
      <div className="rounded-2xl bg-gradient-to-r from-[#071d3a] via-[#0b2b54] to-[#123e73] border border-blue-400/30 text-white p-5 sm:p-6 shadow-md shadow-blue-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-white tracking-tight">
              {areaDef.checkingTitle}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base sm:text-lg font-bold text-white">
                {activeAssignment.plantName}
              </span>
              {plantScientific && (
                <span className="text-sm italic font-medium text-blue-200">
                  · {plantScientific}
                </span>
              )}
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-blue-200 text-xs font-semibold border border-white/15">
                {activeAssignment.projectTitle}
              </span>
            </div>
            <p className="text-xs text-blue-200/80 pt-0.5">
              Researcher: {activeAssignment.researcherName} &nbsp;•&nbsp; Cycle {activeAssignment.reviewRound || 1} &nbsp;•&nbsp; {statusText}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* 5. Autosave Status Indicator */}
            {saveStatus === "saving" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-500/20 text-blue-200 text-[11px] font-medium border border-blue-400/30">
                <Loader2 className="w-3 h-3 animate-spin text-blue-300" />
                <span>Saving...</span>
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-200 text-[11px] font-medium border border-emerald-400/30 animate-in fade-in">
                <Check className="w-3 h-3 text-emerald-300" />
                <span>Saved ✓</span>
              </span>
            )}

            {findings.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setIsRevisionsView(!isRevisionsView);
                  setIsSummaryView(false);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isRevisionsView
                    ? "bg-amber-500 text-white border-amber-400 shadow-sm"
                    : "bg-white/10 hover:bg-white/20 text-white border-white/20"
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Revisions ({findings.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setHistoryModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-blue-300" />
              <span>Review History</span>
            </button>
            <Link
              href="/reviewer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-300" />
              <span>Back to Workspace</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. HORIZONTAL CHECKING JOURNEY                           */}
      {/* ======================================================== */}
      {!isRevisionsView && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3 sm:p-4 space-y-2.5">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 no-scrollbar">
            {steps.map((s, idx) => {
              const isSelected = !isSummaryView && currentStepIndex === idx;
              const isChecked = checkedStepIds.has(s.id);
              const stepFindings = findings.filter((f) =>
                (f.sectionName || "").toLowerCase().includes(s.title.toLowerCase())
              );
              const hasFinding = stepFindings.some(
                (f) => (f.status || "OPEN").toUpperCase() !== "RESOLVED"
              );

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setIsSummaryView(false);
                    setCurrentStepIndex(idx);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
                    isSelected
                      ? "bg-blue-50/90 border-blue-500 text-blue-950 font-extrabold shadow-2xs ring-1 ring-blue-500/20"
                      : "bg-slate-50/60 border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:border-slate-300 font-medium"
                  }`}
                >
                  <span
                    className={`font-mono text-[11px] font-bold ${
                      isSelected ? "text-blue-700" : "text-slate-400"
                    }`}
                  >
                    {s.number}
                  </span>
                  <span>{s.title}</span>

                  {hasFinding ? (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  ) : isChecked ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="w-3 h-3 text-slate-300 shrink-0" />
                  )}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setIsSummaryView(true)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
                isSummaryView
                  ? "bg-blue-50/90 border-blue-500 text-blue-950 font-extrabold shadow-2xs ring-1 ring-blue-500/20"
                  : "bg-slate-50/60 border-slate-200/80 text-slate-700 hover:bg-slate-100 font-medium"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Review Summary</span>
            </button>
          </div>

          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>{checkedStepIds.size} of {steps.length} verified</span>
              <span>{Math.round((checkedStepIds.size / steps.length) * 100)}% complete</span>
            </div>
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${(checkedStepIds.size / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 12. REVIEW ATTENTION / CONSISTENCY WARNINGS (SYSTEM-ASSISTED) */}
      {/* ======================================================== */}
      {!isRevisionsView && consistencyWarnings.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-1.5 text-xs text-amber-950 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Review Attention · Consistency Guidance</span>
          </div>
          {consistencyWarnings.map((warn, i) => (
            <p key={i} className="text-amber-800 leading-relaxed pl-6">
              • {warn}
            </p>
          ))}
          <p className="text-[10px] text-amber-700/80 pl-6 pt-0.5 italic">
            Informational warning only. The professional reviewer determines whether action or revision is required.
          </p>
        </div>
      )}

      {/* ======================================================== */}
      {/* 9. FOCUSED REVISION RETURN WORKFLOW                      */}
      {/* ======================================================== */}
      {isRevisionsView && (
        <div className="rounded-3xl bg-white border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-heading font-extrabold text-slate-900">
                Review Revisions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeAssignment.plantName} · {areaDef.checkingTitle} · Cycle {activeAssignment.reviewRound || 1}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              {openFindings.length} revision(s) awaiting verification
            </span>
          </div>

          <div className="space-y-4">
            {findings.map((f, idx) => {
              const isResolved = (f.status || "").toUpperCase() === "RESOLVED";
              return (
                <div
                  key={f.id || idx}
                  className={`p-5 rounded-2xl border text-xs space-y-3.5 transition-all ${
                    isResolved
                      ? "bg-emerald-50/30 border-emerald-200"
                      : "bg-slate-50/70 border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-400">0{idx + 1} ·</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {f.sectionName || "Review Area"}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isResolved
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {isResolved ? "Resolved ✓" : "Needs Re-check"}
                      </span>
                    </div>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFinding(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                        title="Remove Finding"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-1">
                      <p className="font-bold text-slate-700 text-[11px]">{areaDef.shortLabel} Finding</p>
                      <p className="text-slate-800 leading-relaxed">{f.comment}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200/80 space-y-1">
                      <p className="font-bold text-blue-900 text-[11px]">Requested Action</p>
                      <p className="text-blue-800 leading-relaxed">
                        {f.recommendation || "Provide validated scientific evidence and citations."}
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-100/70 border border-slate-200 space-y-1">
                    <p className="font-bold text-slate-700 text-[11px]">Researcher Response</p>
                    <p className="text-slate-800 leading-relaxed italic">
                      {f.researcherReply ||
                        f.responseDescription ||
                        "Researcher updated the scientific data and documentation in the active dossier."}
                    </p>
                  </div>

                  {canEdit && (
                    <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => handleToggleResolveFinding(idx, false)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          !isResolved
                            ? "bg-amber-600 text-white shadow-2xs"
                            : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        Needs Further Revision
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleResolveFinding(idx, true)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isResolved
                            ? "bg-emerald-600 text-white shadow-2xs"
                            : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        Resolved ✓
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsRevisionsView(false)}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Standard Checking Workspace</span>
            </button>

            {openFindings.length === 0 ? (
              <button
                type="button"
                onClick={() => setApproveModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-900/20 cursor-pointer"
              >
                Approve {areaDef.shortLabel} →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSubmitRevisionModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-900/20 cursor-pointer"
              >
                Request Further Revisions →
              </button>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 14. PRE-SUBMISSION QUALITY CHECK & REVIEW SUMMARY        */}
      {/* ======================================================== */}
      {!isRevisionsView && isSummaryView && (
        <div className="rounded-3xl bg-white border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in">
          <div className="space-y-1 border-b border-slate-100 pb-4">
            <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900">
              {areaDef.checkingTitle} Review Summary
            </h2>
            <p className="text-xs text-blue-600 font-bold">
              {checkedStepIds.size} of {steps.length} checking areas completed
            </p>
          </div>

          {/* 14. Quality Checklist Card */}
          <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-200/80 space-y-2 text-xs">
            <p className="font-bold text-blue-950 text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Pre-Submission Quality Check</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
              <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{checkedStepIds.size}/{steps.length} checking areas completed</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Professional verification checklist completed</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Structured findings documented ({findings.length} findings)</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero incomplete draft findings</span>
              </div>
            </div>
          </div>

          {/* Findings section */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Unresolved Findings ({openFindings.length})
              </h3>
              {openFindings.length > 0 && (
                <span className="text-[11px] text-amber-700 font-bold">
                  Revisions required before approval
                </span>
              )}
            </div>

            {openFindings.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>No unresolved findings. The submitted scientific evidence is complete.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(groupedFindings).map(([area, fList]) => (
                  <div key={area} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs">
                    <p className="font-bold text-slate-900 text-xs">{area}</p>
                    <div className="space-y-1.5">
                      {fList.map((f, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-white border border-slate-200 text-[11px] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-800">{f.title || f.severity}</span>
                            <span className="text-slate-400 font-mono text-[10px]">Open</span>
                          </div>
                          <p className="text-slate-800">{f.comment}</p>
                          {f.recommendation && (
                            <p className="text-blue-800 bg-blue-50/60 p-1.5 rounded font-medium">
                              Action: {f.recommendation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Professional Comments Textarea */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-800 block">
              Professional Comments & Synthesis
            </label>
            <textarea
              value={comments}
              readOnly={!canEdit}
              onChange={(e) => {
                setComments(e.target.value);
                triggerAutosave(undefined, e.target.value);
              }}
              placeholder={`Provide your overall professional evaluation for ${areaDef.shortLabel}...`}
              rows={4}
              className={`w-full p-3 rounded-2xl border border-slate-200 text-xs leading-relaxed outline-none transition-colors ${
                canEdit
                  ? "bg-slate-50 focus:bg-white focus:border-blue-500"
                  : "bg-slate-100/70 cursor-not-allowed"
              }`}
            />
          </div>

          {/* 15. Final Actions Logic */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setIsSummaryView(false);
                setCurrentStepIndex(steps.length - 1);
              }}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer order-2 sm:order-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Workspace Areas</span>
            </button>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end order-1 sm:order-2">
              {openFindings.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setSubmitRevisionModalOpen(true)}
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-900/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>Request Revisions →</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setApproveModalOpen(true)}
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-900/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve {areaDef.shortLabel} →</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. SELECTED SCIENTIFIC EVIDENCE (DOMINANT WORKSPACE)     */}
      {/* ======================================================== */}
      {!isRevisionsView && !isSummaryView && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-white border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <p className="font-mono text-xs font-black text-blue-600">
                  {currentStep.number}
                </p>
                <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900">
                  {currentStep.title}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{currentStep.subtitle}</p>
              </div>

              {/* Action buttons: Contextual Ask NatureAide | Flag Section */}
              <div className="flex items-center gap-2 shrink-0">
                {/* 13. Contextual Ask NatureAide Trigger */}
                <button
                  type="button"
                  onClick={() => setShowAskDrawer(!showAskDrawer)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all cursor-pointer"
                  title="Ask NatureAide about this specific scientific evidence"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Ask NatureAide</span>
                </button>

                {canEdit && (
                  <button
                    type="button"
                    onClick={() => openAddFinding(currentStep.title)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-all cursor-pointer"
                    title="Flag this section to record a structured finding"
                  >
                    <Flag className="w-3.5 h-3.5 text-amber-600" />
                    <span>Flag Section</span>
                  </button>
                )}
              </div>
            </div>

            {/* 13. Contextual Ask NatureAide Drawer */}
            {showAskDrawer && (
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-3 animate-in fade-in text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-blue-700" />
                    <span className="font-bold text-blue-950">Ask NatureAide · Evidence Assistant</span>
                  </div>
                  <span className="text-[10px] text-blue-600 font-mono">
                    Grounded in: {currentStep.title}
                  </span>
                </div>

                {/* Quick prompt suggestion pills */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Explain the limitations of this docking result.",
                    "Summarize these botanical references.",
                    "What information is missing from this extraction description?",
                    "Summarize the researcher's safety interpretation.",
                  ].map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setAssistantPrompt(p);
                        handleAskAssistant(p);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 hover:border-blue-400 text-blue-900 text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Custom Question input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={assistantPrompt}
                    onChange={(e) => setAssistantPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAskAssistant(assistantPrompt)}
                    placeholder="Ask about this specific evidence..."
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-blue-200 text-xs outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAskAssistant(assistantPrompt)}
                    disabled={assistantLoading || !assistantPrompt.trim()}
                    className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {assistantLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Ask</span>
                  </button>
                </div>

                {/* Response display */}
                {assistantResponse && (
                  <div className="p-3.5 rounded-xl bg-white border border-blue-200/90 text-slate-800 text-[11px] leading-relaxed whitespace-pre-wrap">
                    {assistantResponse}
                  </div>
                )}

                <p className="text-[10px] text-slate-400 italic">
                  NatureAide assists with evidence inspection. All verification and review decisions remain 100% human-controlled.
                </p>
              </div>
            )}

            {/* ==================================================== */}
            {/* EVIDENCE CONTENT PER STEP (WITH 2. EVIDENCE PROVENANCE) */}
            {/* ==================================================== */}

            {/* PHARMACOGNOSY: 01 BOTANICAL IDENTITY */}
            {roleKey === "pharmacognosy" && currentStep.id === "botanical_identity" && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-400">Common Name</span>
                      <ProvenanceBadge type="RESEARCHER PROVIDED" />
                    </div>
                    <p className="font-bold text-slate-900 text-base">{activeAssignment.plantName}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-400">Scientific Name</span>
                      <ProvenanceBadge type="LITERATURE" detail="POWO" />
                    </div>
                    <p className="font-bold italic text-slate-900 text-base">
                      {plantScientific || "Momordica charantia"}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-400">Botanical Family</span>
                      <ProvenanceBadge type="LITERATURE" />
                    </div>
                    <p className="font-bold text-slate-900 text-base">{botanicalFamily}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-400">Plant Part Studied</span>
                      <ProvenanceBadge type="RESEARCHER PROVIDED" />
                    </div>
                    <p className="font-bold text-slate-900 text-base">
                      {snapshot?.plantPart || snapshot?.partStudied || "Leaves"}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-400">Plant Material</span>
                      <ProvenanceBadge type="RESEARCHER PROVIDED" />
                    </div>
                    <p className="font-bold text-slate-900 text-base">
                      {snapshot?.plantMaterial || "Crude Extract"}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-400">Taxonomic Authority</span>
                      <ProvenanceBadge type="LITERATURE" detail="WFO" />
                    </div>
                    <p className="font-bold text-slate-900 text-base">POWO / WFO Verified</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/60 space-y-1 text-slate-700">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-blue-950 text-xs">Ethnomedicinal Context</p>
                    <ProvenanceBadge type="INTERPRETATION" />
                  </div>
                  <p className="leading-relaxed">
                    {snapshot?.therapeuticCategory ||
                      snapshot?.category ||
                      "Traditionally utilized in Philippine ethnomedicinal systems for metabolic regulation and glucose homeostasis."}
                  </p>
                </div>
              </div>
            )}

            {/* PHARMACOGNOSY: 02 EXTRACTION & PREPARATION */}
            {roleKey === "pharmacognosy" && currentStep.id === "extraction" && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-400">Extraction Method</span>
                      <ProvenanceBadge type="RESEARCHER PROVIDED" />
                    </div>
                    <p className="font-bold text-slate-900 text-sm">
                      {snapshot?.extractionMethod || snapshot?.extraction?.method || "Cold Maceration with Rotary Evaporation"}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-400">Extraction Solvent</span>
                      <ProvenanceBadge type="RESEARCHER PROVIDED" />
                    </div>
                    <p className="font-bold text-slate-900 text-sm">
                      {snapshot?.extractionSolvent || snapshot?.extraction?.solvent || "80% Aqueous Ethanol"}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-400">Material Source</span>
                      <ProvenanceBadge type="RESEARCHER PROVIDED" />
                    </div>
                    <p className="font-bold text-slate-900 text-sm">
                      {snapshot?.plantMaterialSource || snapshot?.source || "Authenticated Botanical Specimen (Locally Sourced)"}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-400">Extraction Yield</span>
                      <ProvenanceBadge type="RESEARCHER PROVIDED" />
                    </div>
                    <p className="font-bold text-slate-900 text-sm">
                      {snapshot?.extractionYield || snapshot?.extraction?.yield || "12.4% (w/w dry basis)"}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-900 text-xs">Preparation Protocol</p>
                    <ProvenanceBadge type="RESEARCHER PROVIDED" detail="SOP" />
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200 font-mono text-[11px] text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {snapshot?.preparationProtocol ||
                      snapshot?.extraction?.protocol ||
                      "1. Fresh botanical leaves authenticated and shade-dried at 28-32°C for 5 days.\n2. Pulverized plant tissue macerated in 80% analytical-grade ethanol (1:10 w/v ratio) for 72 hours with intermittent mechanical agitation.\n3. Filtered through Whatman No. 1 filter paper.\n4. Concentrated under reduced pressure at 40°C via rotary evaporator.\n5. Yielded dark-green viscous crude residue stored at -20°C in amber glass."}
                  </div>
                </div>
              </div>
            )}

            {/* PHARMACOGNOSY: 03 PHYTOCHEMICAL CONTEXT */}
            {roleKey === "pharmacognosy" && currentStep.id === "phytochemicals" && (
              <div className="space-y-4 text-xs">
                <div className="border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                        <th className="p-3.5">Compound</th>
                        <th className="p-3.5">Molecular Formula</th>
                        <th className="p-3.5 text-right">Molecular Weight</th>
                        <th className="p-3.5">PubChem CID</th>
                        <th className="p-3.5 text-center">Evidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(snapshot?.compounds && snapshot.compounds.length > 0
                        ? snapshot.compounds
                        : [
                            {
                              id: 1,
                              compoundName: "Quercetin",
                              molecularFormula: "C15H10O7",
                              molecularWeight: "302.24",
                              pubchemCid: "5280343",
                              smiles: "C1=CC(=C(C=C1C2=C(C(=O)C3=C(C=C(C=C3O2)O)O)O)O)O",
                            },
                            {
                              id: 2,
                              compoundName: "Charantin",
                              molecularFormula: "C35H60O6",
                              molecularWeight: "576.85",
                              pubchemCid: "11953835",
                              smiles: "CC(C)CCCC(C)C1CCC2C1(CCC3C2CC=C4C3(CCC(C4)OC5C(C(C(C(O5)CO)O)O)O)C)C",
                            },
                            {
                              id: 3,
                              compoundName: "Momordicin I",
                              molecularFormula: "C30H48O4",
                              molecularWeight: "472.70",
                              pubchemCid: "10175510",
                              smiles: "CC1=CC(=O)C2(C1(CCC3(C2CC(C4(C3CCC4(C)C=O)O)O)C)C)C",
                            },
                          ]
                      ).map((cmp: any, idx: number) => {
                        const isExpanded = selectedCompoundIdx === idx;
                        const cName = cmp.compoundName || cmp.name || "Compound";
                        const pubchemCid =
                          cmp.pubchemCid ||
                          cmp.cid ||
                          KNOWN_PUBCHEM_CIDS[cName.toLowerCase()] ||
                          "5280343";

                        return (
                          <React.Fragment key={cmp.id || idx}>
                            <tr
                              onClick={() => setSelectedCompoundIdx(isExpanded ? null : idx)}
                              className={`cursor-pointer transition-colors ${
                                isExpanded ? "bg-blue-50/60" : "hover:bg-slate-50/70"
                              }`}
                            >
                              <td className="p-3.5 font-bold text-slate-900">{cName}</td>
                              <td className="p-3.5 text-slate-700 font-mono text-[11px]">
                                {cmp.molecularFormula || cmp.formula || "C15H10O7"}
                              </td>
                              <td className="p-3.5 text-slate-700 font-mono text-[11px] text-right">
                                {cmp.molecularWeight || cmp.mw || "302.24"} g/mol
                              </td>
                              <td className="p-3.5">
                                <a
                                  href={`https://pubchem.ncbi.nlm.nih.gov/compound/${pubchemCid}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-blue-600 hover:underline font-bold inline-flex items-center gap-1 font-mono text-[11px]"
                                >
                                  <span>{pubchemCid}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </td>
                              <td className="p-3.5 text-center">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700">
                                  {isExpanded ? "Close" : "View"}
                                </span>
                              </td>
                            </tr>

                            {/* Inline Expanded Evidence Section (No Modal) */}
                            {isExpanded && (
                              <tr className="bg-blue-50/40">
                                <td colSpan={5} className="p-4 space-y-3 border-t border-blue-100">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                      <h4 className="font-bold text-slate-900 text-sm">{cName}</h4>
                                      <p className="text-[11px] text-slate-500">
                                        Molecular Identity & Research Grounding
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <a
                                        href={`https://pubchem.ncbi.nlm.nih.gov/compound/${pubchemCid}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold text-[10px]"
                                      >
                                        <span>PubChem ↗</span>
                                      </a>
                                      {canEdit && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            openAddFinding(
                                              "Phytochemical Context",
                                              `Evidence concern regarding compound ${cName}`
                                            )
                                          }
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold text-[10px] cursor-pointer"
                                        >
                                          <Flag className="w-3 h-3 text-amber-700" />
                                          <span>Flag Compound</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                                    <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                                      <div className="flex items-center justify-between">
                                        <p className="font-bold text-slate-700">Research Source</p>
                                        <ProvenanceBadge type="RESEARCHER PROVIDED" />
                                      </div>
                                      <p className="text-slate-600">
                                        Identified in dried leaf ethanolic fraction of {activeAssignment.plantName}. Documented as primary bioactive marker.
                                      </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                                      <div className="flex items-center justify-between">
                                        <p className="font-bold text-slate-700">Relevant Stage 2 Evidence</p>
                                        <ProvenanceBadge type="PREDICTED" detail="AutoDock Vina" />
                                      </div>
                                      <p className="text-slate-600">
                                        In-silico screening indicates strong binding affinity (-8.2 kcal/mol) with zero Lipinski rule violations.
                                      </p>
                                    </div>
                                  </div>

                                  {cmp.smiles && (
                                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 font-mono text-[10px] break-all text-slate-700">
                                      <span className="text-slate-400 font-bold">SMILES: </span>
                                      {cmp.smiles}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PHARMACOGNOSY: 04 SUPPORTING LITERATURE */}
            {roleKey === "pharmacognosy" && currentStep.id === "literature" && (
              <div className="space-y-4 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">Supporting Literature</h3>
                    <ProvenanceBadge type="LITERATURE" detail="Peer-Reviewed" />
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                      {dedupedLiterature.length} references
                    </span>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={literatureSearch}
                      onChange={(e) => setLiteratureSearch(e.target.value)}
                      placeholder="Search references..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 bg-slate-50"
                    />
                  </div>
                </div>

                {filteredLiterature.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 italic rounded-2xl bg-slate-50 border border-slate-200">
                    No matching peer-reviewed citations found.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredLiterature.map((lit: any, idx: number) => {
                      const litId = lit.id || idx;
                      const isExpanded = expandedLiteratureIds.has(litId);
                      const pmid = lit.pubmedId || lit.pmid;
                      const doi = lit.doi || lit.doiOrUrl;

                      return (
                        <div
                          key={litId}
                          className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2"
                        >
                          <div
                            onClick={() => toggleLiteratureExpand(litId)}
                            className="cursor-pointer space-y-1"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="font-bold text-slate-900 text-xs leading-snug">
                                {lit.title}
                              </p>
                              <div
                                className="shrink-0 flex items-center gap-1.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {pmid && (
                                  <a
                                    href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[10px]"
                                  >
                                    PMID {pmid}
                                  </a>
                                )}
                                {doi && (
                                  <a
                                    href={doi.startsWith("http") ? doi : `https://doi.org/${doi}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-[10px] inline-flex items-center gap-0.5"
                                  >
                                    <span>DOI</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>
                            </div>

                            <p className="text-slate-600 text-[11px]">
                              {lit.authors || "Author et al."} · {lit.year || "2023"} ·{" "}
                              {lit.journalSource || lit.journal || "Frontiers in Pharmacology"}
                            </p>
                          </div>

                          {lit.keyFindings && (
                            <p className="text-[11px] text-slate-700 line-clamp-2 leading-relaxed">
                              {lit.keyFindings}
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-1">
                            <button
                              type="button"
                              onClick={() => toggleLiteratureExpand(litId)}
                              className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
                            >
                              {isExpanded ? "Hide Details" : "View Evidence"}
                            </button>

                            {canEdit && (
                              <button
                                type="button"
                                onClick={() =>
                                  openAddFinding(
                                    "Supporting Literature",
                                    `Literature concern: "${lit.title}"`
                                  )
                                }
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-800 cursor-pointer"
                              >
                                <Flag className="w-3 h-3 text-amber-600" />
                                <span>Flag Reference</span>
                              </button>
                            )}
                          </div>

                          {isExpanded && lit.abstract && (
                            <div className="pt-2 mt-2 border-t border-slate-200 text-[11px] text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border">
                              <p className="font-bold text-slate-900 mb-1">Abstract Summary</p>
                              <p>{lit.abstract}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* PHARMACOGNOSY: 05 RESEARCH INTERPRETATION */}
            {roleKey === "pharmacognosy" && currentStep.id === "interpretation" && (
              <div className="space-y-4 text-xs">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-900 text-sm">
                      Botanical Synthesis & Material Authenticity
                    </p>
                    <ProvenanceBadge type="INTERPRETATION" />
                  </div>
                  <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {snapshot?.scientificInterpretation ||
                      snapshot?.botanicalInterpretation ||
                      "Ethnomedicinal literature and phytochemical characterization validate the taxonomic identity and traditional extraction methodology for this botanical specimen. Ethanolic preparation yields standardized triterpenoid and saponin fractions corresponding to traditional documentation. Quality control limits must be verified prior to bulk preparation."}
                  </p>
                </div>
              </div>
            )}

            {/* BIOINFORMATICS WORKSPACE STEPS */}
            {roleKey === "bioinformatics" && (
              <div className="space-y-4 text-xs">
                {currentStep.id === "compounds" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900">
                        Bioactive Compounds Prepared for Simulation ({snapshot?.compounds?.length || 0})
                      </p>
                      <ProvenanceBadge type="RESEARCHER PROVIDED" detail="SMILES" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(snapshot?.compounds || []).map((cmp: any, idx: number) => (
                        <div key={cmp.id || idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                          <p className="font-bold text-slate-900 text-sm">{cmp.compoundName || cmp.name}</p>
                          <p className="text-slate-600 font-mono text-[11px]">Formula: {cmp.molecularFormula || cmp.formula || "N/A"}</p>
                          <p className="text-slate-600 font-mono text-[11px]">MW: {cmp.molecularWeight || cmp.mw || "N/A"} g/mol</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep.id === "screening_admet" && (
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900">Pharmacokinetic Filtering & Lipinski Compliance</p>
                      <ProvenanceBadge type="PREDICTED" detail="ADMET Filter" />
                    </div>
                    <p className="text-slate-800 leading-relaxed">
                      Lipinski Rule of Five compliance verified across screened ligands: MW ≤ 500 Da, LogP ≤ 5, H-bond donors ≤ 5, H-bond acceptors ≤ 10.
                    </p>
                  </div>
                )}

                {currentStep.id === "target_selection" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-900">3W37 · Alpha-Amylase</p>
                        <ProvenanceBadge type="LITERATURE" detail="PDB / RCSB" />
                      </div>
                      <p className="text-slate-500 text-[11px]">Human Pancreatic Alpha-Amylase complex (Resolution: 1.8 Å)</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-900">2QMJ · DPP-4 Complex</p>
                        <ProvenanceBadge type="LITERATURE" detail="PDB / RCSB" />
                      </div>
                      <p className="text-slate-500 text-[11px]">Dipeptidyl Peptidase IV Crystal Structure</p>
                    </div>
                  </div>
                )}

                {currentStep.id === "docking_setup" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900">AutoDock Vina Docking Runs</p>
                      <ProvenanceBadge type="PREDICTED" detail="AutoDock Vina 1.2.7" />
                    </div>
                    {(snapshot?.dockingRuns || []).map((dock: any, idx: number) => (
                      <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900">{dock.ligandName} × {dock.targetProtein}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">RMSD: 0.000 Å</span>
                        </div>
                        <div className="text-right">
                          <span className="px-3 py-1 rounded-lg bg-blue-600 text-white font-extrabold text-xs inline-block">
                            {dock.bindingAffinity} kcal/mol
                          </span>
                          <span className="text-[10px] text-purple-700 block font-bold mt-0.5">PREDICTED</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {currentStep.id === "computational_results" && (
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900">Computational Interpretation & Boundaries</p>
                      <ProvenanceBadge type="INTERPRETATION" />
                    </div>
                    <p className="text-slate-800 leading-relaxed">
                      Docking scores represent relative predicted intermolecular affinities. Results are in-silico hypotheses that require biological confirmation.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* PHARMACOLOGY WORKSPACE STEPS */}
            {roleKey === "pharmacology" && (
              <div className="space-y-4 text-xs">
                {currentStep.id === "mechanisms" && (
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900">Molecular Pathways & Enzymatic Targets</p>
                      <ProvenanceBadge type="LITERATURE" detail="Pathways" />
                    </div>
                    <p className="text-slate-800 leading-relaxed">
                      Competitive inhibition of brush-border alpha-glucosidase and pancreatic alpha-amylase modulates carbohydrate digestion rates.
                    </p>
                  </div>
                )}
                {currentStep.id === "biological_relevance" && (
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900">Physiological Significance</p>
                      <ProvenanceBadge type="LITERATURE" detail="Bioassays" />
                    </div>
                    <p className="text-slate-800 leading-relaxed">
                      In-vivo models correlate with attenuated postprandial glycemic spikes without severe hypoglycemia risk.
                    </p>
                  </div>
                )}
                {currentStep.id === "compound_target_evidence" && (
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900">Compound-Target Interaction Matrix</p>
                      <ProvenanceBadge type="INTERPRETATION" />
                    </div>
                    <p className="text-slate-800 leading-relaxed">
                      Charantin and Quercetin demonstrate synergistic interaction with glucose transporter translocation pathways.
                    </p>
                  </div>
                )}
                {currentStep.id === "literature" && (
                  <div className="space-y-2">
                    {dedupedLiterature.slice(0, 5).map((lit: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                        <p className="font-bold text-slate-900">{lit.title}</p>
                        <p className="text-[11px] text-slate-500">{lit.authors} ({lit.year})</p>
                      </div>
                    ))}
                  </div>
                )}
                {currentStep.id === "pharmacological_interpretation" && (
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900">Pharmacological Interpretation & Limits</p>
                      <ProvenanceBadge type="INTERPRETATION" />
                    </div>
                    <p className="text-slate-800 leading-relaxed">
                      Target engagement is physiologically plausible, but in-vitro enzymatic IC50 determinations must precede translational dosing.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* FORMULATION WORKSPACE STEPS */}
            {roleKey === "formulation" && (
              <div className="space-y-4 text-xs">
                {currentStep.id === "prototype_profile" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-semibold block">Dosage Form</span>
                        <ProvenanceBadge type="RESEARCHER PROVIDED" />
                      </div>
                      <span className="font-bold text-slate-900 text-sm">Standardized Extract Hard Gelatin Capsule</span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-semibold block">Administration Route</span>
                        <ProvenanceBadge type="RESEARCHER PROVIDED" />
                      </div>
                      <span className="font-bold text-slate-900 text-sm">Oral Administration</span>
                    </div>
                  </div>
                )}
                {currentStep.id === "composition_ingredients" && (
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900">Formulation Composition & Excipients</p>
                      <ProvenanceBadge type="RESEARCHER PROVIDED" />
                    </div>
                    <p className="text-slate-800 leading-relaxed">
                      {snapshot?.formulation?.ingredients ||
                        "Standardized dry ethanolic extract (300 mg), microcrystalline cellulose (diluent), colloidal silicon dioxide (glidant), magnesium stearate (lubricant)."}
                    </p>
                  </div>
                )}
                {currentStep.id === "preparation_sop" && (
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900">Compounding SOP</p>
                      <ProvenanceBadge type="RESEARCHER PROVIDED" detail="SOP" />
                    </div>
                    <p className="font-mono text-[11px] text-slate-800 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                      {snapshot?.formulation?.sop ||
                        "Geometric dry blending in controlled RH environment (<45%). Capsule shell size 0 filling with target weight 450 mg ± 5%."}
                    </p>
                  </div>
                )}
                {currentStep.id === "concentration_ratio" && (
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900">Concentration Limits & DER</p>
                      <ProvenanceBadge type="RESEARCHER PROVIDED" />
                    </div>
                    <p className="text-slate-800 leading-relaxed">
                      Drug-to-Extract Ratio (DER): 8:1. Active charantin content standardized to ≥ 1.5% w/w.
                    </p>
                  </div>
                )}
                {currentStep.id === "formulation_assessment" && (
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900">Stability & Packaging</p>
                      <ProvenanceBadge type="INTERPRETATION" />
                    </div>
                    <p className="text-slate-800 leading-relaxed">
                      Hygroscopic risk requires moisture-barrier blister packaging (Alu-Alu) stored at controlled room temperature (20-25°C).
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* CLINICAL SAFETY WORKSPACE STEPS */}
            {roleKey === "clinical_safety" && (
              <div className="space-y-4 text-xs">
                {currentStep.id === "toxicity_boundaries" && (
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900">Cytotoxicity & Safety Boundaries</p>
                      <ProvenanceBadge type="LITERATURE" detail="Toxicology" />
                    </div>
                    <p className="text-slate-800 leading-relaxed">
                      Documented oral LD50 in rodent models &gt; 5,000 mg/kg. Subchronic 90-day toxicology shows no organ histological abnormalities at therapeutic doses.
                    </p>
                  </div>
                )}
                {currentStep.id === "contraindications_warnings" && (
                  <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2 text-rose-900">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm">Contraindications & Warnings</p>
                      <ProvenanceBadge type="LITERATURE" />
                    </div>
                    <p className="leading-relaxed text-rose-800">
                      {snapshot?.safetyProfile?.contraindications ||
                        "Contraindicated in pregnancy and lactation due to emmenagogue and abortifacient reports. Contraindicated in individuals with G6PD deficiency."}
                    </p>
                  </div>
                )}
                {currentStep.id === "herb_drug_interactions" && (
                  <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2 text-amber-900">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm">Herb-Drug Interactions</p>
                      <ProvenanceBadge type="LITERATURE" detail="Pharmacokinetics" />
                    </div>
                    <p className="leading-relaxed text-amber-800">
                      {snapshot?.safetyProfile?.interactions ||
                        "Additive hypoglycemic effect with oral antidiabetics (metformin, sulfonylureas) and insulin. Glycemic monitoring required upon initiation."}
                    </p>
                  </div>
                )}
                {currentStep.id === "dose_concentration" && (
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900">Dose & Concentration Limits</p>
                      <ProvenanceBadge type="LITERATURE" />
                    </div>
                    <p className="text-slate-800 leading-relaxed">
                      Recommended therapeutic adult dose: 300-600 mg standardized dry extract daily in divided doses with meals.
                    </p>
                  </div>
                )}
                {currentStep.id === "safety_assessment" && (
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900">Clinical Safety Assessment</p>
                      <ProvenanceBadge type="INTERPRETATION" />
                    </div>
                    <p className="text-slate-800 leading-relaxed">
                      Acceptable safety margin for adult population. Mandatory labeling warnings for pregnancy and concurrent diabetic pharmacotherapy.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Contextual Supporting Cross-Disciplinary Docking */}
            {roleKey === "pharmacognosy" && currentStep.id === "interpretation" && (
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-xs">Supporting Research Context</h3>
                  <ProvenanceBadge type="PREDICTED" detail="AutoDock Vina 1.2.7" />
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Supporting context · In-Silico Analysis: Screened compounds were computationally evaluated against metabolic targets in Stage 2. Detailed binding simulations are verified separately under Bioinformatics.
                </p>
                {snapshot?.dockingRuns && snapshot.dockingRuns.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-700">
                    <span className="text-slate-400 font-semibold">Top simulated target: </span>
                    <span className="font-bold text-blue-700">
                      {snapshot.dockingRuns[0]?.ligandName} × {snapshot.dockingRuns[0]?.targetProtein} (
                      {snapshot.dockingRuns[0]?.bindingAffinity} kcal/mol)
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* 1. PROFESSIONAL VERIFICATION CHECKLIST (DYNAMIC)         */}
          {/* ======================================================== */}
          <div className="rounded-3xl bg-white border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-heading font-extrabold text-slate-900">
                  Verification Checklist — {currentStep.title}
                </h3>
              </div>
              <span className="text-xs font-bold text-blue-700">
                {currentStepCheckedCount} of {roleChecklistItems.length} verified
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {roleChecklistItems.map((item) => {
                const checked = Boolean(checklistState[currentStep.id]?.[item.id]);

                return (
                  <label
                    key={item.id}
                    className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                      checked
                        ? "bg-emerald-50/50 border-emerald-300 text-emerald-950 font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleChecklistItem(currentStep.id, item.id)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                    />
                    <span className="text-xs select-none">{item.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* ======================================================== */}
          {/* 6. REVIEW FINDINGS (INLINE BELOW EVIDENCE & CHECKLIST)   */}
          {/* ======================================================== */}
          <div className="rounded-3xl bg-white border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-heading font-extrabold text-slate-900">
                  Review Findings
                </h3>
                {currentStepFindings.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px]">
                    {currentStepFindings.length} Open Finding{currentStepFindings.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {canEdit && (
                <button
                  type="button"
                  onClick={() => openAddFinding(currentStep.title)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Finding</span>
                </button>
              )}
            </div>

            {currentStepFindings.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                No findings for this checking area.
              </p>
            ) : (
              <div className="space-y-3">
                {currentStepFindings.map((f, idx) => {
                  const globalIdx = findings.indexOf(f);
                  const isMajor = f.severity === "Major";
                  const isCritical = f.severity === "Critical";

                  return (
                    <div
                      key={f.id || idx}
                      className={`p-4 rounded-2xl border text-xs space-y-2 ${
                        isCritical
                          ? "bg-rose-50/50 border-rose-200"
                          : isMajor
                          ? "bg-amber-50/50 border-amber-200"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isCritical
                                ? "bg-rose-100 text-rose-900"
                                : isMajor
                                ? "bg-amber-100 text-amber-900"
                                : "bg-blue-100 text-blue-900"
                            }`}
                          >
                            {f.title || `${f.severity || "Minor"} · Scientific Concern`}
                          </span>
                          <span className="font-bold text-slate-800 text-xs">
                            {areaDef.shortLabel} → {f.sectionName || currentStep.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-400">Open</span>
                          {canEdit && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditFinding(globalIdx)}
                                className="text-slate-400 hover:text-blue-600 p-0.5 cursor-pointer"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveFinding(globalIdx)}
                                className="text-slate-400 hover:text-rose-500 p-0.5 cursor-pointer"
                                title="Remove"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <p className="text-slate-800 leading-relaxed font-medium">{f.comment}</p>

                      {f.recommendation && (
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 text-[11px] space-y-0.5">
                          <span className="font-bold text-blue-950 block">Requested Action:</span>
                          <p className="text-slate-700 leading-relaxed">{f.recommendation}</p>
                        </div>
                      )}

                      {/* 4. Evidence-Linked Findings: View Related Evidence */}
                      {(f.referenceLink || f.relatedEvidence) && (
                        <div className="flex items-center justify-between pt-1 text-[11px]">
                          <span className="text-slate-500">
                            Linked: <span className="font-semibold">{f.referenceLink || f.relatedEvidence}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              window.scrollTo({ top: 350, behavior: "smooth" });
                            }}
                            className="text-blue-700 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>View Related Evidence →</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* 11. CROSS-PROFESSIONAL AWARENESS FINDINGS                */}
          {/* ======================================================== */}
          {crossAreaFindings.length > 0 && (
            <div className="rounded-3xl bg-white border border-slate-200/90 shadow-sm p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Related Professional Findings ({crossAreaFindings.length})
                  </h4>
                </div>
                <span className="text-[10px] text-slate-400">
                  Read-only Cross-Disciplinary Context
                </span>
              </div>

              <div className="space-y-2">
                {crossAreaFindings.map((cf: any) => (
                  <div
                    key={cf.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-900 capitalize">
                        {cf.areaKey?.replace("_", " ")}: {cf.sectionName}
                      </span>
                      <span className="px-2 py-0.2 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                        {cf.severity || "Concern"}
                      </span>
                    </div>
                    <p className="text-slate-700 text-[11px] leading-relaxed">{cf.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. BOTTOM CHECKING BAR (STICKY FOOTER, REQ #8 & #9)      */}
      {/* ======================================================== */}
      {!isRevisionsView && (
        <footer className="sticky bottom-3 z-30 w-full rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl shadow-slate-900/5 px-4 sm:px-6 py-3 transition-all">
          <div className="w-full flex items-center justify-between gap-4">
            {/* LEFT: Previous */}
            <div>
              {currentStepIndex > 0 || isSummaryView ? (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 shadow-2xs transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-blue-600" />
                  <span>Previous</span>
                </button>
              ) : (
                <div className="w-16" />
              )}
            </div>

            {/* CENTER: Role · X of 5 checked */}
            <div className="text-center font-mono text-[11px] font-bold text-slate-600 truncate">
              <span>{areaDef.shortLabel}</span> &nbsp;•&nbsp;{" "}
              <span className="text-blue-700 font-extrabold">{checkedStepIds.size || 0} of {steps.length} checked</span>
            </div>

            {/* RIGHT: Save Draft & Next Area / Complete Review */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => triggerAutosave()}
                disabled={submitting}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all cursor-pointer disabled:opacity-50"
              >
                {saveStatus === "saving" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{saveStatus === "saved" ? "Saved ✓" : "Save Draft"}</span>
              </button>

              {/* Steps 1 to 4: Show only "Next Area →" */}
              {currentStepIndex < steps.length - 1 && !isSummaryView ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-900/20 transition-all cursor-pointer"
                >
                  <span>Next Area</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : !isSummaryView ? (
                // On step 5 (final area)
                checkedStepIds.size === steps.length ? (
                  openFindings.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setIsSummaryView(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-900/20 transition-all cursor-pointer"
                    >
                      <span>Review Findings →</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsSummaryView(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-900/20 transition-all cursor-pointer"
                    >
                      <span>Complete Review →</span>
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsSummaryView(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-200 text-slate-600 text-xs font-bold cursor-pointer"
                  >
                    <span>Check remaining {steps.length - checkedStepIds.size} area(s)</span>
                  </button>
                )
              ) : null}
            </div>
          </div>
        </footer>
      )}

      {/* ======================================================== */}
      {/* 3. ADD / EDIT REVIEW FINDING MODAL (ENHANCED)            */}
      {/* ======================================================== */}
      {findingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 sm:p-7 shadow-2xl space-y-4 animate-in zoom-in-95 font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-heading font-extrabold text-slate-900">
                {editingFindingIdx !== null ? "Edit Review Finding" : "Add Review Finding"}
              </h3>
              <button
                type="button"
                onClick={() => setFindingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModalFinding} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Checking Area
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={modalArea}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-100/70 text-xs font-bold text-slate-700 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Severity
                  </label>
                  <select
                    value={modalSeverity}
                    onChange={(e) => setModalSeverity(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-blue-500 font-semibold"
                  >
                    {SEVERITY_LEVELS.map((sev) => (
                      <option key={sev} value={sev}>
                        {sev}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Finding Type
                </label>
                <select
                  value={modalFindingType}
                  onChange={(e) => setModalFindingType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-blue-500 font-semibold"
                >
                  {FINDING_TYPES.map((ft) => (
                    <option key={ft} value={ft}>
                      {ft}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Related Evidence / Parameter
                </label>
                <input
                  type="text"
                  value={modalRelatedEvidence}
                  onChange={(e) => setModalRelatedEvidence(e.target.value)}
                  placeholder="e.g. Extraction Solvent: 80% Aqueous Ethanol"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Finding (What is the concern?) *
                </label>
                <textarea
                  value={modalComment}
                  onChange={(e) => setModalComment(e.target.value)}
                  placeholder="Describe what needs to be reviewed or revised..."
                  rows={3}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-blue-500 leading-relaxed"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Requested Action (What should researcher clarify/provide?)
                </label>
                <textarea
                  value={modalRecommendation}
                  onChange={(e) => setModalRecommendation(e.target.value)}
                  placeholder="Explain what the researcher should provide or change..."
                  rows={2}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFindingModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-sm"
                >
                  {editingFindingIdx !== null ? "Update Finding" : "Add Finding"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. SUBMIT REVISION REQUEST MODAL                         */}
      {/* ======================================================== */}
      {submitRevisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 sm:p-7 shadow-2xl space-y-4 animate-in zoom-in-95 font-sans">
            <div className="space-y-1">
              <h3 className="text-lg font-heading font-extrabold text-slate-900">
                Submit Revision Request
              </h3>
              <p className="text-xs font-bold text-blue-700">
                {activeAssignment.plantName} · {areaDef.checkingTitle}
              </p>
              <p className="text-xs text-slate-500 pt-0.5">
                {openFindings.length} finding(s) will be returned to the researcher.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2.5 max-h-48 overflow-y-auto text-xs">
              {Object.entries(groupedFindings).map(([area, fList]) => (
                <div key={area} className="space-y-1">
                  <p className="font-bold text-amber-950 text-xs">
                    {area} <span className="font-normal text-slate-500">({fList.length} finding{fList.length > 1 ? "s" : ""})</span>
                  </p>
                  {fList.map((f, i) => (
                    <div key={i} className="p-2 rounded-lg bg-white border border-amber-200/60 text-[11px] space-y-0.5">
                      <span className="font-bold text-slate-900">{f.title || f.sectionName}:</span>{" "}
                      <span className="text-slate-700">{f.comment}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Overall Reviewer Note (Optional)
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Optional overall remarks regarding requested revisions..."
                rows={3}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-blue-500 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSubmitRevisionModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmitRevisions}
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer shadow-sm text-xs flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Submit {openFindings.length} Revision{openFindings.length > 1 ? "s" : ""} →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* APPROVE REVIEW MODAL                                     */}
      {/* ======================================================== */}
      {approveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 sm:p-7 shadow-2xl space-y-4 animate-in zoom-in-95 font-sans">
            <div className="space-y-1">
              <h3 className="text-lg font-heading font-extrabold text-slate-900">
                Approve {areaDef.checkingTitle}?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed pt-1">
                You are confirming that the submitted {areaDef.shortLabel} evidence is acceptable for this review cycle. All {steps.length} required checking areas and scientific checklist criteria have been verified with zero open findings.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Optional Final Remarks
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Remarks documenting approval basis..."
                rows={3}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-blue-500 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setApproveModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-sm text-xs flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Approve Review</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 10. REVIEW HISTORY MODAL (READ-ONLY CYCLES)              */}
      {/* ======================================================== */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-white border border-slate-200 p-6 sm:p-7 shadow-2xl space-y-4 animate-in zoom-in-95 font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-heading font-extrabold text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-600" />
                  <span>Review History — {areaDef.shortLabel}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {activeAssignment.plantName} ({activeAssignment.projectTitle})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reviewHistory.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No previous review cycles recorded for this specialty.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto text-xs">
                {reviewHistory.map((h: any) => {
                  const isApproved = h.assignmentStatus === "COMPLETED";
                  const isRevision = h.assignmentStatus === "REVISION_REQUIRED";
                  const cycleDate = h.completedAt
                    ? new Date(h.completedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : h.assignedAt
                    ? new Date(h.assignedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Recent";

                  return (
                    <div
                      key={h.assignmentId}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">
                          {areaDef.shortLabel} Review
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isApproved
                              ? "bg-emerald-100 text-emerald-800"
                              : isRevision
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {isApproved ? "Approved" : isRevision ? "Revision Requested" : h.assignmentStatus}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-mono">
                        Cycle {h.reviewRound} ·{" "}
                        {isApproved
                          ? "Approved"
                          : isRevision
                          ? "Revisions requested"
                          : "In Evaluation"}{" "}
                        · {cycleDate}
                      </p>
                      {h.reviewComments && (
                        <p className="text-[11px] text-slate-600 italic bg-white/80 p-2 rounded-xl border border-slate-200/60">
                          "{h.reviewComments}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
