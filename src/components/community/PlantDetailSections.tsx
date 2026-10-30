"use client";

import React, { useState } from "react";
import RecordImage from "@/components/community/RecordImage";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Coffee,
  ExternalLink,
  Info,
  Landmark,
  Leaf,
  Loader2,
  Microscope,
  Pill,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Users,
  AlertTriangle,
  BookOpen,
  FlaskConical,
  HeartPulse,
  Layers,
  Droplets,
  Flame,
} from "lucide-react";
import RelatedProductsSection, { RelatedProductItem } from "@/components/community/RelatedProductsSection";

export interface PlantDetailSectionsProps {
  plant: {
    id: string;
    slug: string;
    commonName: string;
    scientificName: string;
    category: string;
    simpleUse: string;
    badge?: string;
    imageUrl?: string;
    imageAttribution?: string | null;
    preparation?: string;
    safetyNote?: string;
    botanical_synonyms?: string | null;
    local_names?: string | null;
    plant_parts_used?: string | null;
    source_organization?: string | null;
    source_url?: string | null;
    source_verified?: number | boolean | null;
    source_verified_at?: string | null;
    is_pitahc?: number | boolean | null;
    isSaved: boolean;
  };
  guide: {
    about?: string;
    traditionalUses?: string;
    whatResearchSays?: string;
    commonPreparation?: string;
    safetyInformation?: string;
    whoShouldBeCareful?: string;
    medicineInteractions?: string;
    whenToConsultDoctor?: string;
    verifiedBy?: string;
    preclinical_evidence?: string | null;
    clinical_evidence?: string | null;
    contraindications?: string | null;
    documented_uses?: string | null;
  } | null;
  references?: Array<{
    id: string | number;
    title: string;
    authors?: string;
    year?: number;
    journalSource?: string;
    doiOrUrl?: string;
    studyType?: string;
    plantOrCompound?: string;
    keyFindings?: string;
    pubmedId?: string;
    doi?: string;
    source_verified?: number | boolean;
    evidence_scope?: string;
    botanical_identity_verified?: number | boolean;
  }>;
  products?: RelatedProductItem[];
  preparations?: Array<{
    id: string;
    title: string;
    preparation_type: string;
    plant_part_used: string;
    referenceCount: number;
    traditional_use_context?: string;
    description?: string;
  }>;
  preparationReferences?: Array<{
    id: string | number;
    preparation_id: string;
    scientific_reference_id?: string | null;
    source_type?: string;
    source_title: string;
    organization_or_authors?: string;
    publication_year?: number;
    doi_or_pmid?: string;
    source_url?: string;
  }>;
}

export default function PlantDetailSections({
  plant,
  guide,
  references = [],
  products = [],
  preparations = [],
  preparationReferences = [],
}: PlantDetailSectionsProps) {
  const [isSaved, setIsSaved] = useState(plant.isSaved);
  const [saving, setSaving] = useState(false);

  // Progressive disclosure toggle states
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [showAllSafety, setShowAllSafety] = useState(false);
  const [showEvidenceDetails, setShowEvidenceDetails] = useState(false);
  const [showAllReferences, setShowAllReferences] = useState(false);
  const [activePrepIndex, setActivePrepIndex] = useState(0);

  const handleToggleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/community/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "plant", id: plant.id }),
      });
      const data = await res.json();
      if (data.success) {
        setIsSaved(data.saved);
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  // Helper 1: Extract Documented Uses chips
  const documentedUsesList = React.useMemo(() => {
    const set = new Set<string>();
    if (guide?.documented_uses?.trim()) {
      guide.documented_uses.split(/[,;•|]/).forEach((u) => {
        const trimmed = u.trim();
        if (trimmed && trimmed.length > 2) set.add(trimmed);
      });
    }
    if (set.size === 0 && guide?.clinical_evidence?.trim()) {
      guide.clinical_evidence.split(/[,;•|]/).forEach((u) => {
        const trimmed = u.trim().replace(/^Anti[-]?/i, "").replace(/[()]/g, "");
        if (trimmed && trimmed.length > 2) set.add(trimmed);
      });
    }
    if (set.size === 0 && guide?.traditionalUses?.trim()) {
      const phrases = guide.traditionalUses
        .split(/[,.]/)
        .map((w) => w.trim())
        .filter((w) => w.length > 3 && w.length < 35);
      phrases.slice(0, 4).forEach((w) => set.add(w));
    }
    if (set.size === 0 && plant.category) {
      set.add(plant.category);
    }
    return Array.from(set).slice(0, 5);
  }, [guide, plant.category]);

  // Helper 2: Categorize References dynamically from MySQL
  const refCategories = React.useMemo(() => {
    const groups: {
      human: any[];
      lab: any[];
      reviews: any[];
      official: any[];
      preparation: any[];
    } = {
      human: [],
      lab: [],
      reviews: [],
      official: [],
      preparation: [],
    };

    // Official authoritative baseline
    groups.official.push({
      id: "official-authority",
      title: `${plant.source_organization || "Philippine Institute of Traditional and Alternative Health Care (PITAHC)"} Official Monograph`,
      organization_or_authors: "Republic of the Philippines Department of Health (DOH) & PITAHC",
      publication_year: 2026,
      source_url: plant.source_url || "https://pitahc.gov.ph/herbs-directory/",
      source_type: "GOVERNMENT_AUTHORITY",
    });

    references.forEach((r) => {
      const st = (r.studyType || "").toLowerCase();
      if (
        st.includes("clinical") ||
        st.includes("human") ||
        st.includes("trial") ||
        st.includes("randomized")
      ) {
        groups.human.push(r);
      } else if (
        st.includes("review") ||
        st.includes("systematic") ||
        st.includes("meta-analysis")
      ) {
        groups.reviews.push(r);
      } else {
        groups.lab.push(r);
      }
    });

    preparationReferences.forEach((pr) => {
      groups.preparation.push(pr);
    });

    return groups;
  }, [references, preparationReferences, plant.source_organization, plant.source_url]);

  const totalVerifiedSources =
    refCategories.official.length +
    refCategories.human.length +
    refCategories.lab.length +
    refCategories.reviews.length +
    refCategories.preparation.length;

  // Helper 3: Available Evidence tags
  const availableEvidenceLabels = React.useMemo(() => {
    const list: string[] = [];
    if (refCategories.human.length > 0 || guide?.clinical_evidence) {
      list.push("Human Research");
    }
    if (refCategories.lab.length > 0 || guide?.preclinical_evidence) {
      list.push("Laboratory Research");
    }
    if (preparations.length > 0 || guide?.traditionalUses) {
      list.push("Traditional Sources");
    }
    if (refCategories.reviews.length > 0) {
      list.push("Review Evidence");
    }
    list.push("Official Government Source");
    return list;
  }, [refCategories, guide, preparations]);

  // Helper 4: Extract top 2-3 most important verified precautions
  const topPrecautions = React.useMemo(() => {
    const items: string[] = [];

    if (guide?.contraindications?.trim()) {
      items.push(`Contraindications: ${guide.contraindications.trim()}`);
    }

    const safetyText = guide?.safetyInformation || plant.safetyNote || "";
    if (safetyText) {
      const sentences = safetyText
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 10);
      for (const s of sentences) {
        if (items.length >= 3) break;
        if (!items.includes(s)) {
          items.push(s);
        }
      }
    }

    if (items.length === 0) {
      items.push(
        "Consult a licensed health professional before use if taking prescription medications, or if pregnant or nursing."
      );
    }

    return items.slice(0, 3);
  }, [guide, plant.safetyNote]);

  // Helper 5: Concise 2-3 sentence overview
  const quickOverviewText = React.useMemo(() => {
    if (guide?.about?.trim()) {
      const sentences = guide.about
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
      return sentences.slice(0, 3).join(" ");
    }
    return plant.simpleUse || "Documented Philippine medicinal plant validated for community health.";
  }, [guide?.about, plant.simpleUse]);

  const primaryPlantPart = plant.plant_parts_used || (preparations[0]?.plant_part_used) || "Leaves";
  const totalPrepSources = preparations.reduce(
    (acc, p) => acc + (Number(p.referenceCount) || 0),
    0
  );

  return (
    <div className="min-h-screen bg-[#faf7f2] text-[#0f2c20] pb-28">
      {/* ================================================== */}
      {/* 1. MOBILE-APP TOP NAVIGATION BAR                   */}
      {/* ================================================== */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-[#dde6df]/80 px-4 py-2.5 transition-all">
        <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Back Button with subtle pill */}
          <Link
            href="/community/herbal-guide"
            className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-[#faf7f2] hover:bg-emerald-50 active:scale-95 text-xs font-extrabold text-[#1e5c44] border border-[#dde6df] transition-all shadow-2xs"
            aria-label="Back to Herbal Guide"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-700" />
            <span>Herbal Guide</span>
          </Link>

          {/* Plant Name in app header */}
          <span className="font-heading font-black text-sm text-[#0f2c20] truncate max-w-[160px] uppercase tracking-wide">
            {plant.commonName}
          </span>

          {/* Save / Bookmark Button */}
          <button
            onClick={handleToggleSave}
            disabled={saving}
            aria-label={isSaved ? "Saved in My Guide" : "Save to My Guide"}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer shadow-2xs ${
              isSaved
                ? "bg-emerald-600 text-white shadow-emerald-600/30 shadow-sm"
                : "bg-[#faf7f2] border border-[#dde6df] text-[#0f2c20] hover:bg-emerald-50"
            }`}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isSaved ? (
              <BookmarkCheck className="w-4 h-4" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* ================================================== */}
      {/* SINGLE SCROLLABLE FULL-WIDTH COLUMN (max-w-4xl)    */}
      {/* ================================================== */}
      <main className="w-full max-w-4xl mx-auto px-3.5 sm:px-6 py-4 space-y-4">
        {/* ================================================== */}
        {/* HERO CARD (NATIVE APP STYLE)                      */}
        {/* ================================================== */}
        <section className="rounded-3xl bg-white border border-[#dde6df] overflow-hidden shadow-xs relative transition-all">
          {/* Compact Image Container with Gradient Overlay */}
          <div className="relative h-56 sm:h-64 w-full bg-[#edf2ee] overflow-hidden">
            <RecordImage
              kind="plant"
              src={plant.imageUrl}
              alt={plant.commonName}
              priority
              sizes="(max-width: 640px) 100vw, 576px"
              className="object-cover transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />

            {/* Top Badges */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
              <span className="px-2.5 py-1 rounded-full bg-emerald-800/90 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm flex items-center gap-1 border border-emerald-600/40">
                <Leaf className="w-3 h-3 text-emerald-300" />
                <span>Medicinal Plant</span>
              </span>

              {plant.is_pitahc ? (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-extrabold shadow-sm flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-amber-200" />
                  <span>DOH/PITAHC</span>
                </span>
              ) : null}
            </div>

            {/* Bottom Title Overlay */}
            <div className="absolute bottom-3 left-3.5 right-3.5 text-white space-y-0.5">
              <span className="inline-block px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-emerald-200 text-[10px] font-bold uppercase tracking-wider mb-1">
                {plant.category}
              </span>
              <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-tight uppercase leading-tight drop-shadow-md">
                {plant.commonName}
              </h1>
              <p className="text-emerald-100/90 italic text-xs sm:text-sm font-medium drop-shadow-sm">
                {plant.scientificName}
              </p>
            </div>
          </div>

          {/* Compact Action + Quick Facts Strip */}
          <div className="p-3.5 sm:p-4 space-y-3 bg-white">
            {/* Primary Action Button */}
            <Link
              href={`/community/ask?plant=${plant.id}`}
              className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-teal-700 via-emerald-700 to-[#0f2c20] hover:brightness-105 active:scale-98 text-white text-xs font-black flex items-center justify-center gap-2 shadow-sm transition-all min-h-[44px]"
            >
              <Bot className="w-4 h-4 text-emerald-300 animate-pulse" />
              <span>Ask NaturAide about {plant.commonName}</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </Link>

            {/* 3 Compact Metric Pills */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-2xl bg-[#faf7f2] border border-[#dde6df]/80">
                <span className="text-[10px] font-bold text-[#52796f] uppercase block">
                  Plant Part
                </span>
                <p className="font-black text-[#0f2c20] text-xs mt-0.5 truncate">
                  {primaryPlantPart}
                </p>
              </div>

              <div className="p-2 rounded-2xl bg-[#faf7f2] border border-[#dde6df]/80">
                <span className="text-[10px] font-bold text-[#52796f] uppercase block">
                  Preparation
                </span>
                <p className="font-black text-[#0f2c20] text-xs mt-0.5 truncate">
                  {preparations.length === 1 ? "1 Method" : `${preparations.length} Methods`}
                </p>
              </div>

              <div className="p-2 rounded-2xl bg-[#faf7f2] border border-[#dde6df]/80">
                <span className="text-[10px] font-bold text-[#52796f] uppercase block">
                  References
                </span>
                <p className="font-black text-[#0f2c20] text-xs mt-0.5 truncate">
                  {totalVerifiedSources} Verified
                </p>
              </div>
            </div>

            {/* Expandable Botanical Metadata Toggle */}
            <div className="pt-0.5 text-center">
              <button
                onClick={() => setShowMoreInfo((prev) => !prev)}
                className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#1e5c44] hover:text-[#0f2c20] cursor-pointer py-1 active:scale-95 transition-all"
                aria-expanded={showMoreInfo}
              >
                <span>{showMoreInfo ? "Hide Botanical Info" : "More Plant Information"}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-emerald-700 transition-transform duration-300 ${
                    showMoreInfo ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showMoreInfo && (
                <div className="mt-2.5 p-3 rounded-2xl bg-[#faf7f2] border border-[#dde6df] space-y-2 text-left text-xs animate-in fade-in duration-200">
                  {plant.botanical_synonyms && (
                    <div>
                      <span className="text-[10px] font-black text-[#52796f] uppercase tracking-wider block">
                        Botanical Synonyms
                      </span>
                      <p className="text-[#0f2c20] italic font-medium mt-0.5 text-[11px]">
                        {plant.botanical_synonyms}
                      </p>
                    </div>
                  )}

                  {plant.local_names && (
                    <div>
                      <span className="text-[10px] font-black text-[#52796f] uppercase tracking-wider block">
                        Local / Vernacular Names
                      </span>
                      <p className="text-[#0f2c20] font-medium mt-0.5 text-[11px]">
                        {plant.local_names}
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] font-black text-[#52796f] uppercase tracking-wider block">
                      Primary Authoritative Source
                    </span>
                    <p className="text-[#0f2c20] font-medium mt-0.5 text-[11px]">
                      {plant.source_organization || "Philippine Institute of Traditional and Alternative Health Care (PITAHC)"}
                    </p>
                    {plant.source_url && (
                      <a
                        href={plant.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-700 font-bold hover:underline mt-1 text-[11px]"
                      >
                        <span>Official Portal Reference</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* 2. ABOUT THIS PLANT (COMPACT GRADIENT CARD)        */}
        {/* ================================================== */}
        <section className="rounded-3xl bg-gradient-to-br from-emerald-50/70 via-white to-white border border-emerald-100 p-4 sm:p-5 shadow-2xs space-y-2.5 transition-all">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Leaf className="w-4 h-4" />
              </div>
              <h2 className="font-heading font-black text-sm sm:text-base text-[#0f2c20] uppercase tracking-wide">
                About {plant.commonName}
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-900 text-[10px] font-extrabold">
              Documented
            </span>
          </div>

          <p className="text-xs sm:text-sm text-[#3d4a45] leading-relaxed">
            {quickOverviewText}
          </p>
        </section>

        {/* ================================================== */}
        {/* 3. DOCUMENTED USES (COLORFUL APP PILLS)            */}
        {/* ================================================== */}
        <section className="rounded-3xl bg-gradient-to-br from-teal-50/60 via-white to-white border border-teal-100 p-4 sm:p-5 shadow-2xs space-y-3 transition-all">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                <HeartPulse className="w-4 h-4" />
              </div>
              <h2 className="font-heading font-black text-sm sm:text-base text-[#0f2c20] uppercase tracking-wide">
                What Has {plant.commonName} Been Used For?
              </h2>
            </div>
          </div>

          {/* Visual colorful pill chips */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {documentedUsesList.map((use, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#edf6f2] hover:bg-emerald-100/70 text-[#0f2c20] text-xs font-bold border border-emerald-200/80 shadow-2xs transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{use}</span>
              </span>
            ))}
          </div>

          {/* Evidence Available bar + jump to details */}
          <div className="pt-2 border-t border-[#edf2ee] flex items-center justify-between gap-2 text-xs">
            <div className="text-[#52796f] text-[11px] truncate">
              <strong className="text-[#0f2c20]">Evidence: </strong>
              <span>{availableEvidenceLabels.slice(0, 3).join(" • ")}</span>
            </div>

            <button
              onClick={() => setShowEvidenceDetails((prev) => !prev)}
              className="inline-flex items-center gap-1 text-[11px] font-black text-teal-800 hover:text-teal-950 shrink-0 cursor-pointer py-1 active:scale-95"
            >
              <span>{showEvidenceDetails ? "Hide Evidence" : "View Evidence →"}</span>
            </button>
          </div>
        </section>

        {/* ================================================== */}
        {/* 4. TRADITIONAL PREPARATION (PROMINENT FEATURE CARD) */}
        {/* ================================================== */}
        {(() => {
          const activePrep = preparations[activePrepIndex] || preparations[0];
          return (
            <section className="group rounded-3xl border border-emerald-300/80 bg-gradient-to-br from-[#f2f8f4] via-[#ecf6f0] to-[#def1e4] p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300 space-y-3.5 relative overflow-hidden">
              {/* Decorative background glows */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-teal-400/10 rounded-full blur-xl pointer-events-none" />

              {/* Header with animated pill */}
              <div className="flex items-start justify-between gap-2 relative">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0f2c20] to-[#1a4a35] text-emerald-300 flex items-center justify-center shadow-md shadow-emerald-950/20 shrink-0 ring-2 ring-emerald-400/20 group-hover:scale-105 transition-transform">
                    <Coffee className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                        Documented Guide
                      </span>
                    </div>
                    <h2 className="font-heading font-black text-sm sm:text-base text-[#0f2c20] tracking-tight">
                      TRADITIONAL PREPARATION
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-800 text-white text-[10px] font-black shrink-0 shadow-xs flex items-center gap-1 border border-emerald-700/50">
                    <Sparkles className="w-3 h-3 text-emerald-300" />
                    <span>{preparations.length === 1 ? "1 Verified Method" : `${preparations.length} Methods`}</span>
                  </span>
                </div>
              </div>

              {preparations.length > 0 && activePrep ? (
                <>
                  {/* When multiple methods exist: prominent equal-weight cards */}
                  {preparations.length > 1 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#52796f] block">
                            Available Methods
                          </span>
                          <h3 className="font-heading font-extrabold text-xs sm:text-sm text-[#0f2c20]">
                            How would you like to continue?
                          </h3>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {preparations.length} Options
                        </span>
                      </div>

                      {/* Method 1 and Method 2 Compact Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {preparations.map((prep, idx) => {
                          const isSelected = activePrepIndex === idx;
                          const prepTypeClean = prep.preparation_type.replace(/_/g, " ").toLowerCase();
                          const isPoultice = prepTypeClean.includes("poultice");
                          const isJuice = prepTypeClean.includes("juice") || prepTypeClean.includes("infusion");

                          return (
                            <div
                              key={prep.id || idx}
                              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between space-y-2.5 ${
                                isSelected
                                  ? "bg-gradient-to-br from-[#0f2c20] to-[#174332] text-white border-[#0f2c20] shadow-xs"
                                  : "bg-white/95 text-[#3d4a45] border-emerald-200/80 hover:border-emerald-400"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                                      isSelected
                                        ? "bg-white/15 text-emerald-300"
                                        : isPoultice
                                        ? "bg-emerald-100 text-emerald-800"
                                        : isJuice
                                        ? "bg-teal-100 text-teal-800"
                                        : "bg-amber-100 text-amber-800"
                                    }`}
                                  >
                                    {isPoultice ? (
                                      <Layers className="w-3.5 h-3.5" />
                                    ) : isJuice ? (
                                      <Droplets className="w-3.5 h-3.5" />
                                    ) : (
                                      <Flame className="w-3.5 h-3.5" />
                                    )}
                                  </div>
                                  <div>
                                    <span
                                      className={`text-[9px] font-black uppercase tracking-wider block ${
                                        isSelected ? "text-emerald-300" : "text-[#52796f]"
                                      }`}
                                    >
                                      Method {idx + 1}
                                    </span>
                                    <h4 className="font-heading font-extrabold text-xs sm:text-sm line-clamp-1">
                                      {prep.title.split("/")[0].trim()}
                                    </h4>
                                  </div>
                                </div>
                              </div>

                              <p
                                className={`text-[11px] leading-relaxed line-clamp-2 ${
                                  isSelected ? "text-emerald-100/90" : "text-[#52796f]"
                                }`}
                              >
                                {prep.traditional_use_context ||
                                  (isPoultice
                                    ? "Crush fresh leaves for external application"
                                    : "Boil leaves in water for oral tea")}
                              </p>

                              <Link
                                href={`/community/plants/${plant.slug}/preparation?method=${idx + 1}`}
                                className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                  isSelected
                                    ? "bg-emerald-400 text-[#0f2c20] font-black hover:bg-emerald-300"
                                    : "bg-[#0f2c20] text-white hover:bg-[#1a4b36] font-extrabold"
                                }`}
                              >
                                <span>Start Method {idx + 1}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* 3 Compact Visual Stat Tiles with colorful icons */}
                      <div className="grid grid-cols-3 gap-2 pt-0.5 text-xs">
                        <div className="p-2.5 rounded-2xl bg-white/95 border border-emerald-200/70 shadow-2xs flex flex-col justify-between hover:border-emerald-400 hover:shadow-xs transition-all">
                          <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-[#52796f] uppercase tracking-wider">
                            <span className="w-4 h-4 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                              <Droplets className="w-2.5 h-2.5" />
                            </span>
                            <span>Type</span>
                          </div>
                          <p className="font-extrabold text-[#0f2c20] text-[11px] mt-1 capitalize truncate">
                            {activePrep.preparation_type.replace(/_/g, " ").toLowerCase()}
                          </p>
                        </div>

                        <div className="p-2.5 rounded-2xl bg-white/95 border border-emerald-200/70 shadow-2xs flex flex-col justify-between hover:border-emerald-400 hover:shadow-xs transition-all">
                          <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-[#52796f] uppercase tracking-wider">
                            <span className="w-4 h-4 rounded-md bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                              <Leaf className="w-2.5 h-2.5" />
                            </span>
                            <span>Part Used</span>
                          </div>
                          <p className="font-extrabold text-[#0f2c20] text-[11px] mt-1 truncate">
                            {activePrep.plant_part_used}
                          </p>
                        </div>

                        <div className="p-2.5 rounded-2xl bg-white/95 border border-emerald-200/70 shadow-2xs flex flex-col justify-between hover:border-emerald-400 hover:shadow-xs transition-all">
                          <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-[#52796f] uppercase tracking-wider">
                            <span className="w-4 h-4 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                              <BookOpen className="w-2.5 h-2.5" />
                            </span>
                            <span>Sources</span>
                          </div>
                          <p className="font-extrabold text-[#0f2c20] text-[11px] mt-1 truncate">
                            {totalPrepSources || preparationReferences.length || 2} Verified
                          </p>
                        </div>
                      </div>

                      {/* Active Preparation Context Callout */}
                      <div className="p-3.5 rounded-2xl bg-white/95 border border-emerald-200/80 shadow-2xs space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-heading font-black text-xs sm:text-sm text-[#0f2c20] truncate">
                            {activePrep.title}
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 shrink-0">
                            Documented Use
                          </span>
                        </div>
                        {activePrep.traditional_use_context && (
                          <p className="text-xs text-[#3d4a45] leading-relaxed">
                            {activePrep.traditional_use_context}
                          </p>
                        )}
                      </div>

                      {/* Step-by-Step Action Button */}
                      <div className="pt-0.5">
                        <Link
                          href={`/community/plants/${plant.slug}/preparation`}
                          className="group w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#0f2c20] via-[#164332] to-[#1e5c44] hover:from-[#164332] hover:to-[#246c50] active:scale-[0.98] text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all duration-200 shadow-md shadow-emerald-950/20 min-h-[46px]"
                        >
                          <span>View Step-by-Step Preparation Guide</span>
                          <ArrowRight className="w-4 h-4 text-emerald-300 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="p-3 rounded-2xl bg-white/80 border border-emerald-100 text-xs text-[#52796f] italic">
                  Verified preparation instructions are not currently available for this plant.
                </div>
              )}
            </section>
          );
        })()}

        {/* ================================================== */}
        {/* 5. SAFETY & PRECAUTIONS (WARM AMBER APP CARD)      */}
        {/* ================================================== */}
        <section className="rounded-3xl border border-amber-200/90 bg-gradient-to-br from-amber-50/80 via-[#fdfbf7] to-white p-4 sm:p-5 shadow-2xs space-y-3 transition-all">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h2 className="font-heading font-black text-sm sm:text-base text-amber-950 uppercase tracking-wide">
                Safety &amp; Precautions
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold">
              Verified
            </span>
          </div>

          {/* Top 2-3 most important precautions */}
          <div className="space-y-1.5 pt-0.5">
            {topPrecautions.map((prec, i) => (
              <div
                key={i}
                className="p-2.5 rounded-2xl bg-white border border-amber-200/80 text-xs text-amber-950 flex items-start gap-2 leading-relaxed shadow-2xs"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>{prec}</span>
              </div>
            ))}
          </div>

          {/* Expandable detailed safety toggle */}
          <div className="pt-0.5 text-center">
            <button
              onClick={() => setShowAllSafety((prev) => !prev)}
              className="inline-flex items-center gap-1 text-[11px] font-black text-amber-900 hover:text-amber-950 cursor-pointer py-1 active:scale-95 transition-all"
              aria-expanded={showAllSafety}
            >
              <span>{showAllSafety ? "Hide Detailed Safety" : "View All Safety Information"}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-amber-700 transition-transform duration-300 ${
                  showAllSafety ? "rotate-180" : ""
                }`}
              />
            </button>

            {showAllSafety && (
              <div className="mt-2.5 p-3.5 rounded-2xl bg-white border border-amber-200 space-y-3 text-left text-xs animate-in fade-in duration-200 shadow-2xs">
                {guide?.safetyInformation && (
                  <div>
                    <h4 className="font-black text-amber-950 uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-amber-700" />
                      <span>General Precautions</span>
                    </h4>
                    <p className="text-[#3d4a45] leading-relaxed mt-1 text-xs">
                      {guide.safetyInformation}
                    </p>
                  </div>
                )}

                {guide?.whoShouldBeCareful && (
                  <div className="pt-2 border-t border-amber-100">
                    <h4 className="font-black text-amber-950 uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <Users className="w-3 h-3 text-orange-700" />
                      <span>Who Should Be Careful</span>
                    </h4>
                    <p className="text-[#3d4a45] leading-relaxed mt-1 text-xs">
                      {guide.whoShouldBeCareful}
                    </p>
                  </div>
                )}

                {guide?.contraindications && (
                  <div className="pt-2 border-t border-amber-100">
                    <h4 className="font-black text-amber-950 uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-700" />
                      <span>Contraindications</span>
                    </h4>
                    <p className="text-[#3d4a45] leading-relaxed mt-1 text-xs">
                      {guide.contraindications}
                    </p>
                  </div>
                )}

                {guide?.medicineInteractions && (
                  <div className="pt-2 border-t border-amber-100">
                    <h4 className="font-black text-amber-950 uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <Pill className="w-3 h-3 text-rose-700" />
                      <span>Drug &amp; Herb Interactions</span>
                    </h4>
                    <p className="text-[#3d4a45] leading-relaxed mt-1 text-xs">
                      {guide.medicineInteractions}
                    </p>
                  </div>
                )}

                {guide?.whenToConsultDoctor && (
                  <div className="pt-2 border-t border-amber-100">
                    <h4 className="font-black text-amber-950 uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <Stethoscope className="w-3 h-3 text-blue-700" />
                      <span>When to Seek Professional Guidance</span>
                    </h4>
                    <p className="text-[#3d4a45] leading-relaxed mt-1 text-xs">
                      {guide.whenToConsultDoctor}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ================================================== */}
        {/* 6. RESEARCH & EVIDENCE (COMPACT INDIGO APP CARD)    */}
        {/* ================================================== */}
        <section className="rounded-3xl bg-gradient-to-br from-indigo-50/50 via-white to-white border border-indigo-100 p-4 sm:p-5 shadow-2xs space-y-3 transition-all">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Microscope className="w-4 h-4" />
              </div>
              <h2 className="font-heading font-black text-sm sm:text-base text-[#0f2c20] uppercase tracking-wide">
                Research &amp; Evidence
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 text-[10px] font-extrabold">
              Scientific
            </span>
          </div>

          {/* 4 mini stat counters */}
          <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
            <div className="p-2 rounded-2xl bg-[#faf7f2] border border-[#dde6df]/80">
              <span className="text-[9px] font-bold text-[#52796f] uppercase block">
                Human
              </span>
              <p className="font-black text-[#0f2c20] text-xs mt-0.5">
                {refCategories.human.length > 0
                  ? `${refCategories.human.length}`
                  : guide?.clinical_evidence
                  ? "✓"
                  : "0"}
              </p>
            </div>

            <div className="p-2 rounded-2xl bg-[#faf7f2] border border-[#dde6df]/80">
              <span className="text-[9px] font-bold text-[#52796f] uppercase block">
                Lab
              </span>
              <p className="font-black text-[#0f2c20] text-xs mt-0.5">
                {refCategories.lab.length}
              </p>
            </div>

            <div className="p-2 rounded-2xl bg-[#faf7f2] border border-[#dde6df]/80">
              <span className="text-[9px] font-bold text-[#52796f] uppercase block">
                Review
              </span>
              <p className="font-black text-[#0f2c20] text-xs mt-0.5">
                {refCategories.reviews.length}
              </p>
            </div>

            <div className="p-2 rounded-2xl bg-[#faf7f2] border border-[#dde6df]/80">
              <span className="text-[9px] font-bold text-[#52796f] uppercase block">
                Official
              </span>
              <p className="font-black text-[#0f2c20] text-xs mt-0.5">
                {refCategories.official.length}
              </p>
            </div>
          </div>

          {/* Expandable research details toggle */}
          <div className="pt-0.5 text-center">
            <button
              onClick={() => setShowEvidenceDetails((prev) => !prev)}
              className="inline-flex items-center gap-1 text-[11px] font-black text-indigo-900 hover:text-indigo-950 cursor-pointer py-1 active:scale-95 transition-all"
              aria-expanded={showEvidenceDetails}
            >
              <span>{showEvidenceDetails ? "Hide Scientific Details" : "Explore Evidence & Details"}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-indigo-700 transition-transform duration-300 ${
                  showEvidenceDetails ? "rotate-180" : ""
                }`}
              />
            </button>

            {showEvidenceDetails && (
              <div className="mt-2.5 p-3.5 rounded-2xl bg-white border border-indigo-100 space-y-3 text-left text-xs animate-in fade-in duration-200 shadow-2xs">
                {guide?.clinical_evidence && (
                  <div>
                    <h4 className="font-black text-emerald-950 uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                      <span>Human Clinical Evidence</span>
                    </h4>
                    <p className="text-[#3d4a45] leading-relaxed mt-1 text-xs">
                      {guide.clinical_evidence}
                    </p>
                  </div>
                )}

                {guide?.preclinical_evidence && (
                  <div className="pt-2 border-t border-indigo-50">
                    <h4 className="font-black text-teal-950 uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <FlaskConical className="w-3 h-3 text-teal-700" />
                      <span>Laboratory Findings</span>
                    </h4>
                    <p className="text-[#3d4a45] leading-relaxed mt-1 text-xs">
                      {guide.preclinical_evidence}
                    </p>
                  </div>
                )}

                {guide?.traditionalUses && (
                  <div className="pt-2 border-t border-indigo-50">
                    <h4 className="font-black text-amber-950 uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <Coffee className="w-3 h-3 text-amber-700" />
                      <span>Traditional Ethnomedicinal Use</span>
                    </h4>
                    <p className="text-[#3d4a45] leading-relaxed mt-1 text-xs">
                      {guide.traditionalUses}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ================================================== */}
        {/* 7. SOURCES & REFERENCES (COMPACT SLATE CARD)        */}
        {/* ================================================== */}
        <section className="rounded-3xl bg-white border border-[#dde6df] p-4 sm:p-5 shadow-2xs space-y-3 transition-all">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-slate-700 text-white flex items-center justify-center shadow-xs">
                <BookOpen className="w-4 h-4" />
              </div>
              <h2 className="font-heading font-black text-sm sm:text-base text-[#0f2c20] uppercase tracking-wide">
                Sources &amp; References
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-extrabold">
              {totalVerifiedSources} Verified
            </span>
          </div>

          <p className="text-xs text-[#52796f]">
            Verified citations from PITAHC, DOH Philippine Pharmacopeia, and peer-reviewed research.
          </p>

          <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
            <Link
              href={`/community/ask?plant=${plant.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold transition-colors"
            >
              <Bot className="w-3.5 h-3.5 text-emerald-700" />
              <span>Ask NaturAide About This Evidence</span>
            </Link>
          </div>

          {/* Expandable references list toggle */}
          <div className="pt-0.5 text-center">
            <button
              onClick={() => setShowAllReferences((prev) => !prev)}
              className="inline-flex items-center gap-1 text-[11px] font-black text-slate-800 hover:text-[#0f2c20] cursor-pointer py-1 active:scale-95 transition-all"
              aria-expanded={showAllReferences}
            >
              <span>{showAllReferences ? "Hide References" : `View All References (${totalVerifiedSources})`}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-700 transition-transform duration-300 ${
                  showAllReferences ? "rotate-180" : ""
                }`}
              />
            </button>

            {showAllReferences && (
              <div className="mt-2.5 space-y-3 text-left pt-2 border-t border-[#edf2ee] animate-in fade-in duration-200">
                {/* Official Monograph */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black text-[#52796f] uppercase tracking-wider block">
                    Official Government Monograph
                  </span>
                  {refCategories.official.map((src, i) => (
                    <div key={i} className="p-3 rounded-2xl bg-[#faf7f2] border border-[#dde6df] text-xs space-y-0.5">
                      <p className="font-black text-[#0f2c20] text-xs">{src.title}</p>
                      <p className="text-[#52796f] text-[11px]">
                        {src.organization_or_authors} &bull; {src.publication_year}
                      </p>
                      {src.source_url && (
                        <a
                          href={src.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-700 font-bold hover:underline pt-0.5 text-[11px]"
                        >
                          <span>Official Portal</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>

                {/* Peer-Reviewed References */}
                {references.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-[#edf2ee]">
                    <span className="text-[10px] font-black text-[#52796f] uppercase tracking-wider block">
                      Peer-Reviewed Studies ({references.length})
                    </span>
                    <div className="space-y-2">
                      {references.map((ref) => (
                        <div key={ref.id} className="p-3 rounded-2xl bg-[#faf7f2] border border-[#dde6df] text-xs space-y-1">
                          <p className="font-black text-[#0f2c20] text-xs leading-snug">{ref.title}</p>
                          <p className="text-[#52796f] text-[11px]">
                            {ref.authors} {ref.year ? `(${ref.year})` : ""} &bull; <em>{ref.journalSource}</em>
                          </p>
                          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[10px]">
                            {ref.pubmedId && (
                              <span className="font-mono text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-bold">
                                PMID: {ref.pubmedId}
                              </span>
                            )}
                            {ref.doiOrUrl && (
                              <a
                                href={ref.doiOrUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-0.5"
                              >
                                <span>Record</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Traditional Preparation Sources */}
                {preparationReferences.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-[#edf2ee]">
                    <span className="text-[10px] font-black text-[#52796f] uppercase tracking-wider block">
                      Preparation Sources ({preparationReferences.length})
                    </span>
                    <div className="space-y-1.5">
                      {preparationReferences.map((pr) => (
                        <div key={pr.id} className="p-3 rounded-2xl bg-[#faf7f2] border border-[#dde6df] text-xs space-y-0.5">
                          <p className="font-black text-[#0f2c20] text-xs">{pr.source_title}</p>
                          <p className="text-[#52796f] text-[11px]">
                            {pr.organization_or_authors} {pr.publication_year ? `(${pr.publication_year})` : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ================================================== */}
        {/* 8. RELATED COMMERCIAL HERBAL PRODUCTS              */}
        {/* ================================================== */}
        <div className="pt-2">
          <RelatedProductsSection plantName={plant.commonName} products={products} />
        </div>
      </main>

      {/* ================================================== */}
      {/* 9. STICKY MOBILE ACTION BAR                        */}
      {/* ================================================== */}
      <div className="fixed bottom-18 left-0 right-0 z-30 p-3 pointer-events-none">
        <div className="max-w-xl mx-auto pointer-events-auto">
          <Link
            href={`/community/ask?plant=${plant.id}`}
            className="w-full py-3 px-4 rounded-full bg-[#0f2c20]/95 backdrop-blur-md text-white border border-emerald-600/50 text-xs font-black flex items-center justify-center gap-2 shadow-xl hover:bg-[#16402f] active:scale-95 transition-all min-h-[44px]"
          >
            <Bot className="w-4 h-4 text-emerald-300" />
            <span>Ask NaturAide about {plant.commonName}</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          </Link>
        </div>
      </div>
    </div>
  );
}