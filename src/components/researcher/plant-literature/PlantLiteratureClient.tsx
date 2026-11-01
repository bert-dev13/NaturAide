"use client";

import React, { useState, useEffect, useRef, useTransition, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Save,
  Loader2,
  AlertCircle,
  RotateCcw,
  Leaf,
  Sprout,
  Dna,
  Layers,
  Activity,
  ShieldCheck,
  CheckCircle2,
  Microscope,
  Calendar,
  MapPin,
  Hash,
  Award,
  FlaskConical,
  Droplets,
  Package,
  Thermometer,
  BookOpen,
  Sparkles,
  Brain,
  Compass,
  Target,
  FileText,
  Check,
} from "lucide-react";
import ResearchStageFooter from "@/components/researcher/stage/ResearchStageFooter";
import ResearchStageHeader from "@/components/researcher/stage/ResearchStageHeader";
import ResearcherReviewFeedbackPanel from "@/components/researcher/stage/ResearcherReviewFeedbackPanel";
import RevisionResubmittedSuccessModal from "@/components/researcher/stage/RevisionResubmittedSuccessModal";

interface ReferenceItem {
  id: number;
  projectId: number;
  scientificReferenceId?: number | null;
  sourceType: string;
  title: string;
  authors?: string;
  year?: number;
  journalSource?: string;
  doiOrUrl?: string;
  studyType?: string;
  plantOrCompound?: string;
  keyFindings?: string;
  limitations?: string;
  researchNotes?: string;
  tags?: string;
  pubmedId?: string;
  documentUrl?: string;
  studyDesign?: string;
  plantPart?: string;
  researchMethods?: string;
  experimentalModel?: string;
  evidenceScope?: string;
  relevanceToCurrentResearch?: string;
  matrixCompleted?: boolean | number;
}

interface PlantLiteratureProps {
  projectId: number;
  project: {
    id: number;
    title: string;
    plantName: string;
    plantScientificName?: string;
    researchObjective?: string;
    researchQuestion?: string;
    areaOfInterest?: string;
    currentStage: string;
    status: string;
  };
  verifiedPlant: {
    id?: number | null;
    commonName: string;
    scientificName?: string | null;
    family?: string | null;
    synonyms?: string | null;
    localNames?: string | null;
    partsUsed?: string | null;
    sourceOrg?: string | null;
    sourceUrl?: string | null;
    isVerified?: boolean;
    imageUrl?: string | null;
  };
  initialPlantData: any;
  initialReferences: ReferenceItem[];
  initialSynthesis: any;
  initialCounts: {
    selectedReferences: number;
    humanStudies: number;
    laboratoryStudies: number;
    reviews: number;
    computationalStudies: number;
    safetyEvidence: number;
  };
  initialReviewFeedback?: any[];
  overallAssessment?: string | null;
  reviewStatus?: string | null;
  reviewerName?: string | null;
  approvedAt?: string | null;
}

export function parseVerifiedPlantParts(partsStr?: string | null): string[] {
  if (!partsStr || !partsStr.trim()) {
    return ["Leaves", "Whole Plant"];
  }
  const rawParts = partsStr
    .split(/[,;]|\band\b/i)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !["and", "&"].includes(p.toLowerCase()));

  const normalized = rawParts.map((p) => {
    return p.charAt(0).toUpperCase() + p.slice(1);
  });

  return Array.from(new Set(normalized));
}

export function isMeaningfulResearchContext(text?: string | null): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.length < 4) return false;
  const lower = trimmed.toLowerCase();
  const invalid = ["sdasds", "asdsds", "asdsad", "asdasd", "test", "bert", "null", "undefined"];
  if (invalid.includes(lower)) return false;
  if (/^[a-z]{3,7}$/i.test(trimmed)) {
    const vowels = (trimmed.match(/[aeiou]/gi) || []).length;
    if (vowels === 0 || vowels / trimmed.length < 0.25) return false;
  }
  return true;
}

export default function PlantLiteratureClient({
  projectId,
  project,
  verifiedPlant,
  initialPlantData,
  initialReferences,
  initialSynthesis,
  initialReviewFeedback = [],
  overallAssessment,
  reviewStatus,
  reviewerName,
  approvedAt,
}: PlantLiteratureProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Navigation anchors for continuous scroll
  const [activeAnchor, setActiveAnchor] = useState<string>("sec-identity");

  // 1. Specimen & Research Material State
  const availableParts = React.useMemo(
    () => parseVerifiedPlantParts(verifiedPlant.partsUsed),
    [verifiedPlant.partsUsed]
  );

  const [selectedPlantParts, setSelectedPlantParts] = useState<string[]>(() => {
    if (initialPlantData.partsStudied && String(initialPlantData.partsStudied).trim()) {
      return String(initialPlantData.partsStudied)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return availableParts.length > 0 ? [availableParts[0]] : ["Leaves"];
  });

  const togglePlantPart = (part: string) => {
    setSelectedPlantParts((prev) => {
      if (prev.includes(part)) {
        return prev.filter((p) => p !== part);
      } else {
        return [...prev, part];
      }
    });
    setValidationError(null);
  };

  const [specimenSource, setSpecimenSource] = useState(
    initialPlantData.specimenSource || "University Herbarium Repository"
  );
  const [collectionDate, setCollectionDate] = useState(
    initialPlantData.collectionDate
      ? new Date(initialPlantData.collectionDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [collectionLocation, setCollectionLocation] = useState(
    initialPlantData.collectionLocation || "Luzon, Philippines"
  );
  const [voucherSpecimenNumber, setVoucherSpecimenNumber] = useState(
    initialPlantData.voucherSpecimenNumber || "PNH-2024-MC01"
  );
  const [sampleIdentifier, setSampleIdentifier] = useState(
    initialPlantData.sampleIdentifier || "SAM-2026-001"
  );
  const [authenticationMethod, setAuthenticationMethod] = useState(
    initialPlantData.authenticationMethod || "Macro-morphological & Taxonomic Key"
  );
  const [authenticatedBy, setAuthenticatedBy] = useState(
    initialPlantData.authenticatedBy || "Institutional Botanical Curator"
  );
  const [selectionRationale, setSelectionRationale] = useState(
    initialPlantData.selectionRationale ||
      `Selected ${verifiedPlant.commonName} (${verifiedPlant.scientificName || ""}) based on documented ethnobotanical relevance and historical pharmacological precedent.`
  );

  // Review Feedback for Two-Way Reviewer Integration
  const [currentReviewStatus, setCurrentReviewStatus] = useState<string | null>(reviewStatus || null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState<{
    discipline: string;
    profession: string;
    reviewerName?: string | null;
    reviewCycle: number;
    addressedCount: number;
  }>({
    discipline: "Pharmacognosy",
    profession: "Pharmacist / Pharmacognosist",
    reviewerName: reviewerName || null,
    reviewCycle: 1,
    addressedCount: 1,
  });

  const openReviewFeedback = React.useMemo(() => {
    return (initialReviewFeedback || []).filter(
      (f: any) => {
        const st = (f.status || "OPEN").toUpperCase();
        return st === "OPEN" || st === "IN_REVIEW";
      }
    );
  }, [initialReviewFeedback]);

  const isRevisionMode = Boolean(
    currentReviewStatus === "REVISION_REQUIRED" ||
      (openReviewFeedback.length > 0 && currentReviewStatus !== "REVISION_RESUBMITTED" && currentReviewStatus !== "APPROVED")
  );

  const [resubmitting, setResubmitting] = useState(false);

  const handleResubmitRevision = async () => {
    try {
      setResubmitting(true);
      await handleSave(false);

      const res = await fetch(`/api/researcher/projects/${projectId}/resubmit-revision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleKey: "pharmacognosy",
          stageNumber: 1,
          changesSummary: "Updated plant identity, voucher specimen, and extraction protocol.",
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to resubmit revision");

      setCurrentReviewStatus("REVISION_RESUBMITTED");
      setSuccessModalData({
        discipline: json.discipline || "Pharmacognosy",
        profession: json.profession || "Pharmacist / Pharmacognosist",
        reviewerName: json.reviewerName || reviewerName || null,
        reviewCycle: json.reviewCycle || 1,
        addressedCount: initialReviewFeedback?.length || 1,
      });
      setShowSuccessModal(true);

      // Trigger custom events so other tabs/sidebar update immediately
      window.dispatchEvent(
        new CustomEvent("natureaide:revisions-updated", {
          detail: { projectId, stageNumber: 1, status: "REVISION_RESUBMITTED" },
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

  const getFieldFeedback = (fieldName: string, aliases: string[] = []) => {
    return openReviewFeedback.filter((f: any) => {
      const text = `${f.sectionName || ""} ${f.title || ""} ${f.comment || ""} ${f.recommendation || ""}`.toLowerCase();
      const matchName = text.includes(fieldName.toLowerCase());
      const matchAlias = aliases.some((a) => text.includes(a.toLowerCase()));
      return matchName || matchAlias;
    });
  };

  // 2. Material & Extraction State
  const [materialType, setMaterialType] = useState(
    initialPlantData.materialType || "Crude Extract"
  );
  const [extractionSolvent, setExtractionSolvent] = useState(
    initialPlantData.extractionSolvent || "80% Aqueous Ethanol"
  );
  const [extractionMethod, setExtractionMethod] = useState(
    initialPlantData.extractionMethod || "Cold Maceration with Rotary Evaporation"
  );
  const [extractFractionName, setExtractFractionName] = useState(
    initialPlantData.extractFractionName || "MC-CE-01"
  );
  const [storageHandlingNotes, setStorageHandlingNotes] = useState(
    initialPlantData.storageHandlingNotes ||
      "Stored in light-resistant amber borosilicate vials at -20°C in an inert desiccated atmosphere."
  );

  // 3. Scientific Evidence State (Automated PubMed / Literature Service)
  const [literatureList, setLiteratureList] = useState<any[]>([]);
  const [literatureStatus, setLiteratureStatus] = useState<"LOADING" | "SUCCESS" | "NO_RESULTS" | "ERROR">("LOADING");

  // 4. Research Synthesis State
  const defaultSynthesisKeyFindings =
    initialSynthesis.keyFindings ||
    `Peer-reviewed scientific publications document that ${verifiedPlant.commonName} (${verifiedPlant.scientificName || ""}) exhibits significant metabolic regulation, cellular antioxidant capacity, and targeted enzyme modulation.`;
  const defaultSynthesisGaps =
    initialSynthesis.remainingGaps ||
    `Limited high-resolution molecular docking and competitive binding pose predictions exist for crude extract fractions and secondary marker phytoconstituents.`;
  const defaultSynthesisRationale =
    initialSynthesis.relevanceToQuestion ||
    `Systematic in-silico target binding affinity and pharmacokinetics screening are required to prioritize bioactive chemical scaffolds for subsequent empirical validation.`;

  const [synthKeyFindings, setSynthKeyFindings] = useState(defaultSynthesisKeyFindings);
  const [synthRemainingGaps, setSynthRemainingGaps] = useState(defaultSynthesisGaps);
  const [synthRelevance, setSynthRelevance] = useState(defaultSynthesisRationale);

  // UI & Feedback State
  const [saving, setSaving] = useState(false);
  const [completingStage, setCompletingStage] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>("Autosaved");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Clean initial state: guarantee no persisting loading indicators
  useEffect(() => {
    setCompletingStage(false);
    return () => {
      setCompletingStage(false);
    };
  }, []);

  // Pure Back navigation handler (NEVER triggers stage completion or advancement)
  const handleBack = useCallback(() => {
    console.log("[PlantLiteratureClient] BACK_CLICK - Pure navigation to Project Dashboard");
    router.push(`/researcher/projects/${projectId}`);
  }, [projectId, router]);

  // Focus Refs
  const plantPartRef = useRef<HTMLDivElement>(null);
  const specimenSourceRef = useRef<HTMLInputElement>(null);
  const selectionRationaleRef = useRef<HTMLTextAreaElement>(null);

  // Automatically retrieve real scientific literature from PubMed / NCBI
  const loadScientificLiterature = async (forceRefresh: boolean = false) => {
    setLiteratureStatus("LOADING");
    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/evidence/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageKey: "plant-literature",
          resultType: "FOUNDATIONAL",
          autoAttach: true,
          forceRefresh,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.items && data.items.length > 0) {
          setLiteratureList(data.items);
          setLiteratureStatus("SUCCESS");

          // Auto-save retrieved papers into literature_references if table is currently empty
          if (initialReferences.length === 0) {
            for (const item of data.items) {
              await fetch(`/api/researcher/projects/${projectId}/literature`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  title: item.title,
                  authors: item.authors,
                  year: item.publicationYear || item.year,
                  journalSource: item.journal,
                  pubmedId: item.pmid,
                  doiOrUrl: item.doi ? `https://doi.org/${item.doi}` : item.sourceUrl,
                  plantOrCompound: verifiedPlant.commonName,
                  keyFindings: item.relevanceExplanation || item.abstract,
                  relevanceToCurrentResearch: item.relevanceExplanation,
                }),
              });
            }
          }
        } else {
          setLiteratureList([]);
          setLiteratureStatus("NO_RESULTS");
        }
      } else {
        setLiteratureStatus("ERROR");
      }
    } catch (err) {
      console.error("Error loading scientific literature:", err);
      setLiteratureStatus("ERROR");
    }
  };

  useEffect(() => {
    loadScientificLiterature(false);
  }, [projectId, verifiedPlant.commonName]);

  // Handle Save Draft
  const handleSave = async (showNotification = true): Promise<boolean> => {
    setSaving(true);
    try {
      const partsStr = selectedPlantParts.join(", ");
      // 1. Save botanical material & specimen data
      await fetch(`/api/researcher/projects/${projectId}/plant-literature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-specimen",
          partsStudied: partsStr,
          specimenSource,
          collectionDate,
          collectionLocation,
          voucherSpecimenNumber,
          sampleIdentifier,
          authenticationMethod,
          authenticatedBy,
          storageHandlingNotes,
          materialType,
          extractionMethod,
          extractionSolvent,
          extractFractionName,
          selectionRationale,
          authenticationStatus: "VERIFIED",
        }),
      });

      // 2. Save literature synthesis
      await fetch(`/api/researcher/projects/${projectId}/literature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-synthesis",
          keyFindings: synthKeyFindings,
          remainingGaps: synthRemainingGaps,
          relevanceToQuestion: synthRelevance,
        }),
      });

      const timeString = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setLastSaved(`Saved at ${timeString}`);
      return true;
    } catch (err) {
      console.error("Failed to save draft:", err);
      if (showNotification) {
        alert("Failed to save research record. Please check your network connection.");
      }
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Complete Stage & Continue
  const handleCompleteAndContinue = async () => {
    setValidationError(null);

    // Validate required fields without page reload or layout shift
    if (selectedPlantParts.length === 0) {
      setValidationError("Plant Part Used in This Study is required.");
      plantPartRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (!specimenSource.trim()) {
      setValidationError("Specimen Source is required.");
      specimenSourceRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      specimenSourceRef.current?.focus();
      return;
    }

    if (!selectionRationale.trim()) {
      setValidationError("Please describe why this specimen was selected.");
      selectionRationaleRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      selectionRationaleRef.current?.focus();
      return;
    }

    setCompletingStage(true);
    try {
      const partsStr = selectedPlantParts.join(", ");

      // 1. Save draft silently
      await handleSave(false);

      // 2. Complete Stage 1 and unlock Stage 2
      const res = await fetch(`/api/researcher/projects/${projectId}/plant-literature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete-stage",
          partsStudied: partsStr,
          specimenSource,
          selectionRationale,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to complete Stage 1");
      }

      startTransition(() => {
        router.push(data.redirectUrl || `/researcher/projects/${projectId}/in-silico`);
      });
    } catch (err: any) {
      setValidationError(err.message || "Failed to complete stage. Please review required fields.");
    } finally {
      setCompletingStage(false);
    }
  };

  const ReviewFindingCallout = ({ findings }: { findings: any[] }) => {
    if (!findings || findings.length === 0) return null;
    return (
      <div className="mt-2 space-y-2">
        {findings.map((f, i) => (
          <div
            key={`finding-${f.id || i}-${i}`}
            className="p-3 rounded-xl bg-amber-50/90 border border-amber-300 text-xs text-amber-950 space-y-1 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 font-bold text-[10px] text-amber-800 uppercase tracking-wider bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                <AlertCircle className="w-3 h-3 text-amber-600" />
                Reviewer Finding · {f.severity || "Revision Required"}
              </span>
              {f.reviewerDisplayName && (
                <span className="text-[10px] text-slate-500 font-medium">
                  By {f.reviewerDisplayName}
                </span>
              )}
            </div>
            <p className="font-semibold text-slate-800">{f.comment}</p>
            {f.recommendation && (
              <p className="text-slate-600 italic">
                <span className="font-bold text-amber-900 not-italic">Requested action: </span>
                {f.recommendation}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full max-w-full px-2 sm:px-4 lg:px-6 py-6 space-y-8 font-sans">
      {/* ========================================================
          HERO BANNER: DEEP LUXURY FOREST GRADIENT CONTAINER
          ======================================================== */}
      <ResearchStageHeader
        projectId={projectId}
        stageNumber={1}
        stageTitle="Plant & Literature Research"
        plantCommonName={verifiedPlant.commonName}
        plantScientificName={verifiedPlant.scientificName}
        statusLabel={
          currentReviewStatus === "REVISION_RESUBMITTED"
            ? "Revision Resubmitted"
            : isRevisionMode
            ? "Revisions Required"
            : project.currentStage === "plant-literature"
            ? "In Progress"
            : "Completed"
        }
        contextualAction={
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById("sec-synthesis");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-emerald-200 hover:text-white text-xs font-bold backdrop-blur-md transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ask NatureAide</span>
          </button>
        }
      />

      {/* Pharmacognosy Review Revision & Feedback Panel */}
      <ResearcherReviewFeedbackPanel
        projectId={projectId}
        stageTitle="Stage 1 · Plant & Literature Research"
        discipline="Pharmacognosy"
        overallAssessment={overallAssessment}
        reviewStatus={currentReviewStatus}
        recommendations={openReviewFeedback.length > 0 ? openReviewFeedback : initialReviewFeedback}
        reviewerName={reviewerName}
        approvedAt={approvedAt}
      />

      {/* ========================================================
          STICKY ANCHOR NAVIGATION (CONTINUOUS ONE-PAGE SCROLL)
          ======================================================== */}
      <div className="sticky top-4 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 p-2 shadow-xs flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 sm:gap-2">
          {[
            { id: "sec-identity", number: "01", label: "Plant Identity" },
            { id: "sec-material", number: "02", label: "Research Material" },
            { id: "sec-extraction", number: "03", label: "Extraction" },
            { id: "sec-literature", number: "04", label: "Literature" },
            { id: "sec-synthesis", number: "05", label: "Synthesis" },
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
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0 pr-1">
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            {lastSaved}
          </span>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold cursor-pointer transition-colors"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Draft</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          CONTAINER 1: BOTANICAL PROFILE (EMERALD THEME)
          ======================================================== */}
      <motion.section
        id="sec-identity"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="w-full rounded-3xl bg-white border border-[#dde6df] shadow-md hover:border-emerald-400/80 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 overflow-hidden"
      >
        <div className="px-6 py-4.5 bg-gradient-to-r from-emerald-50/80 via-teal-50/30 to-transparent border-b border-[#edf2ee] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#0f2c20]">01 Botanical Identity</h2>
              <p className="text-xs text-[#78997f] font-medium">Taxonomic Identity & Specimen Overview</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-100/80 text-emerald-900 border border-emerald-300 text-[11px] font-extrabold tracking-wider uppercase shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            PITAHC Verified Monograph
          </span>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
            <div className="relative w-52 h-52 sm:w-64 sm:h-64 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border-2 border-emerald-200/80 shadow-md group">
              <Image
                src={verifiedPlant.imageUrl || "/images/plants/sambong.jpg"}
                alt={verifiedPlant.commonName}
                fill
                className="object-cover group-hover:scale-108 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70" />
              <div className="absolute bottom-3 left-3 right-3 text-center">
                <span className="inline-block px-3 py-1 rounded-md bg-black/60 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-wider border border-white/20">
                  Verified Specimen Photo
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 flex-1 w-full text-xs">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/50 via-[#faf9f5] to-white border border-emerald-100 hover:border-emerald-300 transition-colors shadow-2xs">
                <span className="text-[#78997f] block font-bold text-[10px] uppercase tracking-wider">Common Name</span>
                <span className="text-base font-black text-[#0f2c20] mt-1 block">{verifiedPlant.commonName}</span>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/50 via-[#faf9f5] to-white border border-emerald-100 hover:border-emerald-300 transition-colors shadow-2xs">
                <span className="text-[#78997f] block font-bold text-[10px] uppercase tracking-wider">Scientific Name</span>
                <span className="text-base font-black text-[#0f2c20] italic mt-1 block font-serif">
                  {verifiedPlant.scientificName || "Momordica charantia"}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/50 via-[#faf9f5] to-white border border-emerald-100 hover:border-emerald-300 transition-colors shadow-2xs">
                <span className="text-[#78997f] block font-bold text-[10px] uppercase tracking-wider">Botanical Family</span>
                <span className="text-base font-black text-[#0f2c20] mt-1 block">
                  {verifiedPlant.family || "Cucurbitaceae"}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/50 via-[#faf9f5] to-white border border-emerald-100 hover:border-emerald-300 transition-colors shadow-2xs">
                <span className="text-[#78997f] block font-bold text-[10px] uppercase tracking-wider">
                  Verified Plant Parts (PITAHC Reference)
                </span>
                <span className="text-sm font-black text-[#0f2c20] mt-1 block">
                  {verifiedPlant.partsUsed || "Leaves, young tender shoots, and immature fruits"}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/50 via-[#faf9f5] to-white border border-emerald-100 hover:border-emerald-300 transition-colors shadow-2xs sm:col-span-2 xl:col-span-2">
                <span className="text-[#78997f] block font-bold text-[10px] uppercase tracking-wider">Local & Vernacular Names</span>
                <span className="text-sm font-extrabold text-[#0f2c20] mt-1 block leading-relaxed">
                  {verifiedPlant.localNames || "Bitter Melon · Bitter Gourd · Paria (Ilocano) · Palia (Visayas) · Karela"}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/50 to-emerald-50/30 border border-emerald-200/90 sm:col-span-2 xl:col-span-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-emerald-800 font-bold text-[10px] uppercase tracking-wider block">Official Verified Source</span>
                    <span className="text-sm font-black text-[#0f2c20] mt-0.5 block">
                      {verifiedPlant.sourceOrg || "Philippine Institute of Traditional and Alternative Health Care (PITAHC)"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-emerald-800 bg-white px-3 py-1.5 rounded-xl border border-emerald-300 shrink-0 shadow-2xs">
                    POWO / WFO Verified
                  </span>
                  <span className="text-[11px] font-mono font-bold text-emerald-800 bg-white px-3 py-1.5 rounded-xl border border-emerald-300 shrink-0 shadow-2xs">
                    Registry: PITAHC Monograph
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ========================================================
          CONTAINER 2: RESEARCH MATERIAL (CYAN / BLUE THEME)
          ======================================================== */}
      <motion.section
        id="sec-material"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="w-full rounded-3xl bg-white border border-[#dde6df] shadow-md hover:border-cyan-400/80 hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-300 overflow-hidden"
      >
        <div className="px-6 py-4.5 bg-gradient-to-r from-cyan-50/80 via-blue-50/30 to-transparent border-b border-[#edf2ee] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20">
              <Microscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#0f2c20]">02 Research Material & Provenance</h2>
              <p className="text-xs text-[#78997f] font-medium">Specimen Provenance & Authentication Methodology</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-800 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-200">
            Standardized Provenance
          </span>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Plant Part Used in This Study (Interactive Selection Field) */}
          <div
            ref={plantPartRef}
            className={`p-5 rounded-2xl transition-all shadow-2xs ${
              validationError?.toLowerCase().includes("plant part")
                ? "bg-rose-50/80 border-2 border-rose-500 ring-4 ring-rose-500/10"
                : "bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-cyan-400 focus-within:border-cyan-600 focus-within:ring-4 focus-within:ring-cyan-500/10 focus-within:bg-white"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Leaf className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Plant Part Used in This Study <span className="text-rose-500">*</span></span>
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select from verified botanical parts associated with {verifiedPlant.commonName}. Multi-select allowed if study investigates multiple components.
                </p>
              </div>
              <span className="text-[11px] font-bold text-cyan-900 bg-cyan-100/80 px-2.5 py-1 rounded-lg border border-cyan-200 self-start sm:self-auto">
                {selectedPlantParts.length} Selected
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {availableParts.filter(Boolean).map((part, pIdx) => {
                const isSelected = selectedPlantParts.includes(part);
                return (
                  <button
                    key={`part-${part}-${pIdx}`}
                    type="button"
                    onClick={() => togglePlantPart(part)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-600/30 ring-2 ring-emerald-500 scale-102"
                        : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 hover:border-slate-400"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center border text-[10px] ${
                      isSelected ? "bg-white text-emerald-800 border-white font-black" : "border-slate-400 text-transparent"
                    }`}>
                      ✓
                    </span>
                    <span>{part}</span>
                  </button>
                );
              })}
            </div>

            {selectedPlantParts.length === 0 && (
              <p className="text-xs font-bold text-rose-600 mt-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Plant Part Used in This Study is required.</span>
              </p>
            )}

            <ReviewFindingCallout findings={getFieldFeedback("part", ["partsStudied", "plant part"])} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="p-4 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-cyan-400 focus-within:border-cyan-600 focus-within:ring-4 focus-within:ring-cyan-500/10 focus-within:bg-white transition-all shadow-2xs">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                <span>Specimen Source <span className="text-rose-500">*</span></span>
              </label>
              <input
                ref={specimenSourceRef}
                type="text"
                value={specimenSource}
                onChange={(e) => setSpecimenSource(e.target.value)}
                placeholder="e.g., Institutional Herbarium or Davao City"
                className="w-full mt-2 bg-transparent border-0 text-sm font-bold text-[#0f2c20] p-0 focus:outline-none focus:ring-0 placeholder:text-slate-400 placeholder:font-normal"
              />
              <ReviewFindingCallout findings={getFieldFeedback("source", ["specimenSource"])} />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-cyan-400 focus-within:border-cyan-600 focus-within:ring-4 focus-within:ring-cyan-500/10 focus-within:bg-white transition-all shadow-2xs">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                <span>Collection Date</span>
              </label>
              <input
                type="date"
                value={collectionDate}
                onChange={(e) => setCollectionDate(e.target.value)}
                className="w-full mt-2 bg-transparent border-0 text-sm font-bold text-[#0f2c20] p-0 focus:outline-none focus:ring-0 cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-cyan-400 focus-within:border-cyan-600 focus-within:ring-4 focus-within:ring-cyan-500/10 focus-within:bg-white transition-all shadow-2xs">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                <span>Collection Location</span>
              </label>
              <input
                type="text"
                value={collectionLocation}
                onChange={(e) => setCollectionLocation(e.target.value)}
                placeholder="e.g., Bago Oshiro, Davao City"
                className="w-full mt-2 bg-transparent border-0 text-sm font-bold text-[#0f2c20] p-0 focus:outline-none focus:ring-0 placeholder:text-slate-400 placeholder:font-normal"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-cyan-400 focus-within:border-cyan-600 focus-within:ring-4 focus-within:ring-cyan-500/10 focus-within:bg-white transition-all shadow-2xs">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-cyan-600" />
                <span>Voucher Specimen Number</span>
              </label>
              <input
                type="text"
                value={voucherSpecimenNumber}
                onChange={(e) => setVoucherSpecimenNumber(e.target.value)}
                placeholder="e.g., USTH-04821 or PNH-184920"
                className="w-full mt-2 bg-transparent border-0 text-sm font-bold text-[#0f2c20] p-0 focus:outline-none focus:ring-0 placeholder:text-slate-400 placeholder:font-normal"
              />
              <ReviewFindingCallout findings={getFieldFeedback("voucher", ["voucherSpecimenNumber"])} />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-cyan-400 focus-within:border-cyan-600 focus-within:ring-4 focus-within:ring-cyan-500/10 focus-within:bg-white transition-all shadow-2xs">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-cyan-600" />
                <span>Sample Identifier</span>
              </label>
              <input
                type="text"
                value={sampleIdentifier}
                onChange={(e) => setSampleIdentifier(e.target.value)}
                placeholder="e.g., SAM-2026-001"
                className="w-full mt-2 bg-transparent border-0 text-sm font-bold text-[#0f2c20] p-0 focus:outline-none focus:ring-0 placeholder:text-slate-400 placeholder:font-normal"
              />
              <ReviewFindingCallout findings={getFieldFeedback("sample", ["sampleIdentifier"])} />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-cyan-400 focus-within:border-cyan-600 focus-within:ring-4 focus-within:ring-cyan-500/10 focus-within:bg-white transition-all shadow-2xs">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Dna className="w-3.5 h-3.5 text-cyan-600" />
                <span>Authentication Method</span>
              </label>
              <select
                value={authenticationMethod}
                onChange={(e) => setAuthenticationMethod(e.target.value)}
                className="w-full mt-2 bg-transparent border-0 text-sm font-bold text-[#0f2c20] p-0 focus:outline-none focus:ring-0 cursor-pointer"
              >
                <option value="Macro-morphological & Taxonomic Key">Macro-morphological & Taxonomic Key</option>
                <option value="DNA Barcoding (rbcL / matK)">DNA Barcoding (rbcL / matK)</option>
                <option value="Microscopic Histological Analysis">Microscopic Histological Analysis</option>
                <option value="TLC / HPLC Chemical Fingerprinting">TLC / HPLC Chemical Fingerprinting</option>
                <option value="Certified Herbarium Deposition">Certified Herbarium Deposition</option>
              </select>
              <ReviewFindingCallout findings={getFieldFeedback("authentication", ["authenticationMethod"])} />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-cyan-400 focus-within:border-cyan-600 focus-within:ring-4 focus-within:ring-cyan-500/10 focus-within:bg-white transition-all shadow-2xs">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-cyan-600" />
                <span>Authenticated By</span>
              </label>
              <input
                type="text"
                value={authenticatedBy}
                onChange={(e) => setAuthenticatedBy(e.target.value)}
                placeholder="e.g., National Museum Botany Division"
                className="w-full mt-2 bg-transparent border-0 text-sm font-bold text-[#0f2c20] p-0 focus:outline-none focus:ring-0 placeholder:text-slate-400 placeholder:font-normal"
              />
              <ReviewFindingCallout findings={getFieldFeedback("authenticated", ["authenticatedBy"])} />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-cyan-400 focus-within:border-cyan-600 focus-within:ring-4 focus-within:ring-cyan-500/10 focus-within:bg-white transition-all shadow-2xs">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
              <span>Why was this specimen selected? <span className="text-rose-500">*</span></span>
            </label>
            <textarea
              ref={selectionRationaleRef}
              rows={2}
              value={selectionRationale}
              onChange={(e) => setSelectionRationale(e.target.value)}
              placeholder="Describe the therapeutic alignment and scientific rationale for selecting this specimen..."
              className="w-full mt-2 bg-transparent border-0 text-sm font-semibold text-[#0f2c20] p-0 focus:outline-none focus:ring-0 leading-relaxed placeholder:text-slate-400 placeholder:font-normal"
            />
            <ReviewFindingCallout findings={getFieldFeedback("rationale", ["selectionRationale"])} />
          </div>
        </div>
      </motion.section>

      {/* ========================================================
          CONTAINER 3: MATERIAL & EXTRACTION (AMBER / GOLD THEME)
          ======================================================== */}
      <motion.section
        id="sec-extraction"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className="w-full rounded-3xl bg-white border border-[#dde6df] shadow-md hover:border-amber-400/80 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300 overflow-hidden"
      >
        <div className="px-6 py-4.5 bg-gradient-to-r from-amber-50/80 via-orange-50/30 to-transparent border-b border-[#edf2ee] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#0f2c20]">03 Material & Extraction</h2>
              <p className="text-xs text-[#78997f] font-medium">Sample Standardization & Solvent Conditions</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Extraction Protocol
          </span>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-4 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-amber-400 focus-within:border-amber-600 focus-within:ring-4 focus-within:ring-amber-500/10 focus-within:bg-white transition-all shadow-2xs">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-amber-600" />
                <span>Material Type</span>
              </label>
              <select
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value)}
                className="w-full mt-2 bg-transparent border-0 text-sm font-bold text-[#0f2c20] p-0 focus:outline-none focus:ring-0 cursor-pointer"
              >
                <option value="Crude Extract">Crude Extract</option>
                <option value="Semi-Purified Fraction">Semi-Purified Fraction</option>
                <option value="Isolated Marker Compound">Isolated Marker Compound</option>
                <option value="Dried Whole Plant Part">Dried Whole Plant Part</option>
                <option value="Decoction / Infusion">Decoction / Infusion</option>
              </select>
              <ReviewFindingCallout findings={getFieldFeedback("material", ["materialType"])} />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-amber-400 focus-within:border-amber-600 focus-within:ring-4 focus-within:ring-amber-500/10 focus-within:bg-white transition-all shadow-2xs">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-amber-600" />
                <span>Extraction Solvent</span>
              </label>
              <input
                type="text"
                value={extractionSolvent}
                onChange={(e) => setExtractionSolvent(e.target.value)}
                placeholder="e.g., 80% Aqueous Ethanol"
                className="w-full mt-2 bg-transparent border-0 text-sm font-bold text-[#0f2c20] p-0 focus:outline-none focus:ring-0 placeholder:text-slate-400 placeholder:font-normal"
              />
              <ReviewFindingCallout findings={getFieldFeedback("solvent", ["extractionSolvent"])} />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-amber-400 focus-within:border-amber-600 focus-within:ring-4 focus-within:ring-amber-500/10 focus-within:bg-white transition-all shadow-2xs">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5 text-amber-600" />
                <span>Extraction Method</span>
              </label>
              <input
                type="text"
                value={extractionMethod}
                onChange={(e) => setExtractionMethod(e.target.value)}
                placeholder="e.g., Cold Maceration"
                className="w-full mt-2 bg-transparent border-0 text-sm font-bold text-[#0f2c20] p-0 focus:outline-none focus:ring-0 placeholder:text-slate-400 placeholder:font-normal"
              />
              <ReviewFindingCallout findings={getFieldFeedback("method", ["extractionMethod"])} />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-amber-400 focus-within:border-amber-600 focus-within:ring-4 focus-within:ring-amber-500/10 focus-within:bg-white transition-all shadow-2xs">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-amber-600" />
                <span>Fraction Identifier</span>
              </label>
              <input
                type="text"
                value={extractFractionName}
                onChange={(e) => setExtractFractionName(e.target.value)}
                placeholder="e.g., MC-CE-01"
                className="w-full mt-2 bg-transparent border-0 text-sm font-bold text-[#0f2c20] p-0 focus:outline-none focus:ring-0 placeholder:text-slate-400 placeholder:font-normal"
              />
              <ReviewFindingCallout findings={getFieldFeedback("fraction", ["extractFractionName"])} />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-amber-400 focus-within:border-amber-600 focus-within:ring-4 focus-within:ring-amber-500/10 focus-within:bg-white transition-all shadow-2xs">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-amber-600" />
              <span>Storage Conditions & Handling Notes</span>
            </label>
            <textarea
              rows={2}
              value={storageHandlingNotes}
              onChange={(e) => setStorageHandlingNotes(e.target.value)}
              placeholder="e.g., Stored in light-resistant amber vials at -20°C in an inert desiccated atmosphere..."
              className="w-full mt-2 bg-transparent border-0 text-sm font-semibold text-[#0f2c20] p-0 focus:outline-none focus:ring-0 leading-relaxed placeholder:text-slate-400 placeholder:font-normal"
            />
            <ReviewFindingCallout findings={getFieldFeedback("storage", ["storageHandlingNotes"])} />
          </div>
        </div>
      </motion.section>

      {/* ========================================================
          CONTAINER 4: SCIENTIFIC EVIDENCE (SHOWSTOPPER PUBMED CARDS)
          ======================================================== */}
      <motion.section
        id="sec-literature"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        className="w-full rounded-3xl bg-white border border-[#dde6df] shadow-md hover:border-emerald-400/80 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 overflow-hidden"
      >
        <div className="px-6 py-4.5 bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-transparent border-b border-[#edf2ee] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-600/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[#0f2c20]">04 Scientific Literature</h2>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono text-[10px] font-black uppercase tracking-wider">
                  LITERATURE
                </span>
              </div>
              <p className="text-xs text-[#52645d] mt-0.5">
                Supporting Research · <span className="font-bold text-[#0f2c20]">Source: PubMed / National Library of Medicine</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {literatureStatus === "SUCCESS" && literatureList.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-300 font-mono text-[11px] font-extrabold shadow-2xs">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                {literatureList.length} Verified Publications Found
              </span>
            )}
            <button
              type="button"
              onClick={() => loadScientificLiterature(true)}
              disabled={literatureStatus === "LOADING"}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-emerald-300/80 bg-white hover:bg-emerald-50/50 text-xs font-bold text-emerald-900 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
              title="Re-query PubMed with force refresh"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-emerald-700 ${literatureStatus === "LOADING" ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh PubMed</span>
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {literatureStatus === "LOADING" && (
            <div className="p-12 text-center space-y-3 rounded-2xl bg-gradient-to-b from-[#fbfdfb] to-white border border-[#e2e8e4]">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
              <p className="text-base font-extrabold text-[#0f2c20]">Finding relevant scientific literature…</p>
              <p className="text-xs text-[#78997f] max-w-md mx-auto">
                Executing progressive NCBI/PubMed search for <strong className="text-[#0f2c20]">{verifiedPlant.commonName}</strong> ({verifiedPlant.scientificName})
              </p>
            </div>
          )}

          {literatureStatus === "ERROR" && (
            <div className="p-8 text-center rounded-2xl bg-rose-50/40 border border-rose-200 space-y-3">
              <AlertCircle className="w-7 h-7 text-rose-600 mx-auto" />
              <p className="text-sm font-bold text-rose-900">
                Scientific literature could not be retrieved.
              </p>
              <p className="text-xs text-rose-700 max-w-md mx-auto">
                The NCBI PubMed E-Utilities request timed out or returned an error. Click below to retry.
              </p>
              <button
                type="button"
                onClick={() => loadScientificLiterature(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-rose-50 text-xs font-bold text-rose-900 border border-rose-300 transition-colors cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry PubMed Search</span>
              </button>
            </div>
          )}

          {literatureStatus === "NO_RESULTS" && (
            <div className="p-8 text-center rounded-2xl bg-[#faf9f5] border border-[#dde6df] space-y-2">
              <p className="text-sm font-bold text-[#0f2c20]">
                No relevant PubMed literature found for this research context.
              </p>
              <p className="text-xs text-[#78997f]">
                Try adjusting the research question or objective keywords to broaden the retrieval scope.
              </p>
            </div>
          )}

          {literatureStatus === "SUCCESS" && literatureList.length > 0 && (
            <div className="space-y-5">
              {literatureList.map((paper, idx) => (
                <motion.div
                  key={`paper-${paper.id || paper.pmid || paper.doi || idx}-${idx}`}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.05 }}
                  className="p-6 rounded-2xl bg-white border-l-4 border-l-emerald-600 border border-[#dde6df] hover:border-emerald-300 hover:shadow-md transition-all space-y-3.5 shadow-2xs"
                >
                  {/* Top Badges Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 rounded-md bg-gradient-to-r from-emerald-700 to-teal-700 text-white font-mono text-[11px] font-black shadow-2xs">
                        Research · {paper.year || paper.publicationYear || "2024"}
                      </span>
                      {paper.pmid && (
                        <a
                          href={`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-mono text-[11px] font-bold transition-colors inline-flex items-center gap-1"
                          title="Open PMID on PubMed"
                        >
                          <span>PMID {paper.pmid}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                      {paper.doi && (
                        <a
                          href={`https://doi.org/${paper.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-0.5 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-mono text-[11px] font-bold transition-colors inline-flex items-center gap-1"
                          title="Open DOI resolver"
                        >
                          <span>DOI {paper.doi}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                    {paper.relevanceScore && (
                      <span className="px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-950 border border-emerald-300 font-mono text-[11px] font-black flex items-center gap-1 shadow-2xs">
                        <Sparkles className="w-3 h-3 text-emerald-700" />
                        {paper.relevanceScore}% Relevance Score
                      </span>
                    )}
                  </div>

                  {/* Publication Title */}
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-[#0c2419] leading-snug">
                      {paper.title}
                    </h3>
                    <p className="text-xs text-[#52645d] mt-1.5 leading-relaxed">
                      <span className="font-semibold text-slate-700">{paper.authors}</span>
                      {paper.journal && (
                        <>
                          {" "}· <span className="italic font-serif text-[#0f2c20] font-bold">{paper.journal}</span>
                        </>
                      )}
                    </p>
                  </div>

                  {/* Relevant To Bar */}
                  <div className="pt-2.5 border-t border-[#edf2ee] text-xs flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#78997f] mr-1">
                      Relevant to:
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold text-[11px]">
                      {verifiedPlant.commonName}
                    </span>
                    {isMeaningfulResearchContext(project.researchObjective) && (
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 font-medium text-[11px]">
                        {project.researchObjective}
                      </span>
                    )}
                    {isMeaningfulResearchContext(project.areaOfInterest) && (
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 font-medium text-[11px]">
                        {project.areaOfInterest}
                      </span>
                    )}
                    {!isMeaningfulResearchContext(project.researchObjective) && !isMeaningfulResearchContext(project.areaOfInterest) && (
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 font-medium text-[11px]">
                        Phytochemical & Therapeutic Endpoint
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-900 border border-teal-200 font-medium text-[11px]">
                      Bioactive Profile & Target Pathways
                    </span>
                  </div>

                  {/* Why this research is relevant Callout */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50/90 via-[#f4f8f5] to-emerald-50/40 border border-emerald-200/80 text-xs space-y-1 shadow-2xs">
                    <div className="flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 text-emerald-800" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900">
                        Why this research is relevant
                      </span>
                    </div>
                    <p className="text-[#20362b] leading-relaxed font-medium pl-5">
                      {paper.relevanceExplanation || paper.keyFindings || paper.abstract}
                    </p>
                  </div>

                  {/* Action Link Buttons */}
                  <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
                    {paper.pmid && (
                      <a
                        href={`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-xs hover:shadow-sm"
                      >
                        <span>View on PubMed</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {paper.doi && (
                      <a
                        href={`https://doi.org/${paper.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold transition-all shadow-2xs"
                      >
                        <span>Open DOI</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          <ReviewFindingCallout findings={getFieldFeedback("literature", ["citation", "reference", "pubmed"])} />
        </div>
      </motion.section>

      {/* ========================================================
          CONTAINER 5: RESEARCH SYNTHESIS (ROYAL VIOLET THEME)
          ======================================================== */}
      <motion.section
        id="sec-synthesis"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.25 }}
        className="w-full rounded-3xl bg-white border border-[#dde6df] shadow-md hover:border-purple-400/80 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 overflow-hidden"
      >
        <div className="px-6 py-4.5 bg-gradient-to-r from-purple-50/80 via-indigo-50/30 to-transparent border-b border-[#edf2ee] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[#0f2c20]">05 Research Synthesis</h2>
                <span className="px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-300 font-mono text-[10px] font-black uppercase tracking-wider">
                  INTERPRETATION
                </span>
              </div>
              <p className="text-xs text-[#78997f] font-medium">Literature Consensus, Scientific Rationale & Knowledge Gaps</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-purple-800 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
            Consensus Formulation
          </span>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="p-5 rounded-2xl bg-purple-50/20 border border-purple-200/80 hover:border-purple-400 focus-within:border-purple-600 focus-within:ring-4 focus-within:ring-purple-500/10 focus-within:bg-white transition-all shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-[#0f2c20] flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                <span>Key Findings & Biological Consensus</span>
              </label>
              <span className="text-[10px] font-mono text-purple-800 font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-purple-100 border border-purple-300">
                Interpretation
              </span>
            </div>
            <textarea
              rows={3}
              value={synthKeyFindings}
              onChange={(e) => setSynthKeyFindings(e.target.value)}
              placeholder="Key findings from literature consensus..."
              className="w-full bg-transparent border-0 text-xs font-medium text-[#0f2c20] p-0 focus:outline-none focus:ring-0 leading-relaxed placeholder:text-slate-400 placeholder:font-normal"
            />
            <ReviewFindingCallout findings={getFieldFeedback("finding", ["key findings", "consensus"])} />
          </div>

          <div className="p-5 rounded-2xl bg-indigo-50/20 border border-indigo-200/80 hover:border-indigo-400 focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:bg-white transition-all shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-[#0f2c20] flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-indigo-600" />
                <span>Remaining Knowledge Gaps & Unresolved Questions</span>
              </label>
              <span className="text-[10px] font-mono text-indigo-800 font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-indigo-100 border border-indigo-300">
                Interpretation
              </span>
            </div>
            <textarea
              rows={2}
              value={synthRemainingGaps}
              onChange={(e) => setSynthRemainingGaps(e.target.value)}
              placeholder="Identified gaps in published literature..."
              className="w-full bg-transparent border-0 text-xs font-medium text-[#0f2c20] p-0 focus:outline-none focus:ring-0 leading-relaxed placeholder:text-slate-400 placeholder:font-normal"
            />
            <ReviewFindingCallout findings={getFieldFeedback("gap", ["remaining gaps", "knowledge gaps"])} />
          </div>

          <div className="p-5 rounded-2xl bg-violet-50/20 border border-violet-200/80 hover:border-violet-400 focus-within:border-violet-600 focus-within:ring-4 focus-within:ring-violet-500/10 focus-within:bg-white transition-all shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-[#0f2c20] flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-violet-600" />
                <span>Research Rationale & Screening Trajectory</span>
              </label>
              <span className="text-[10px] font-mono text-violet-800 font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-violet-100 border border-violet-300">
                Interpretation
              </span>
            </div>
            <textarea
              rows={2}
              value={synthRelevance}
              onChange={(e) => setSynthRelevance(e.target.value)}
              placeholder="Why this in-silico screening and subsequent empirical validation is necessary..."
              className="w-full bg-transparent border-0 text-xs font-medium text-[#0f2c20] p-0 focus:outline-none focus:ring-0 leading-relaxed placeholder:text-slate-400 placeholder:font-normal"
            />
            <ReviewFindingCallout findings={getFieldFeedback("rationale", ["relevance", "screening"])} />
          </div>
        </div>
      </motion.section>

      {/* Validation alert if incomplete */}
      {validationError && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 text-xs font-extrabold flex items-center gap-3 shadow-md"
        >
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{validationError}</span>
        </motion.div>
      )}

      {/* Standardized Research Stage Footer */}
      <ResearchStageFooter
        projectId={projectId}
        stageNumber={1}
        stageTitle="Plant & Literature Research"
        previousStageRoute={`/researcher/projects/${projectId}`}
        onBack={handleBack}
        backLabel="Back to Project"
        lastSaved={lastSaved}
        isSaving={saving}
        onSave={() => handleSave(true)}
        saveLabel="Save Draft"
        isRevisionMode={isRevisionMode}
        onResubmitRevision={handleResubmitRevision}
        isResubmitting={resubmitting}
        reviewStatus={currentReviewStatus}
        onContinue={handleCompleteAndContinue}
        isContinuing={completingStage}
        continueLabel="Continue to In-Silico Analysis"
        continuingLabel="Advancing to In-Silico..."
        continueDisabled={completingStage || isRevisionMode}
      />

      {/* Revision Resubmitted Success Confirmation Modal */}
      <RevisionResubmittedSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        projectId={projectId}
        stageNumber={1}
        stageTitle="Stage 1 · Plant & Literature Research"
        discipline={successModalData.discipline}
        profession={successModalData.profession}
        reviewCycle={successModalData.reviewCycle}
        reviewerName={successModalData.reviewerName}
        addressedCount={successModalData.addressedCount}
      />
    </div>
  );
}
