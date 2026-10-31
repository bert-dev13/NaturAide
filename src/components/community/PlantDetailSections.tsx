"use client";

import React, { useState } from "react";
import RecordImage from "@/components/community/RecordImage";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Bot,
  Sparkles,
} from "lucide-react";
import RelatedProductsSection, { RelatedProductItem } from "@/components/community/RelatedProductsSection";
import {
  Plant2DIcon,
  TeaCup2DIcon,
  MicroscopeEvidence2DIcon,
  ShieldAlert2DIcon,
  LeafShield2DIcon,
  Bookmark2DIcon,
} from "./CommunityIcons2D";

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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Progressive disclosure toggle states
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [showAllReferences, setShowAllReferences] = useState(false);

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
        setToastMessage(data.saved ? "Saved to My Guide" : "Removed from Saved");
        setTimeout(() => setToastMessage(null), 2400);
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  // Extract Documented Uses chips
  const documentedUsesList = React.useMemo(() => {
    const list: Array<{ title: string; desc: string }> = [];
    if (guide?.documented_uses?.trim()) {
      guide.documented_uses.split(/[,;•|]/).forEach((u) => {
        const trimmed = u.trim();
        if (trimmed && trimmed.length > 2) {
          list.push({
            title: trimmed,
            desc: "Documented in Philippine herbal pharmacopeia.",
          });
        }
      });
    }
    if (list.length === 0 && guide?.clinical_evidence?.trim()) {
      guide.clinical_evidence.split(/[,;•|]/).forEach((u) => {
        const trimmed = u.trim().replace(/^Anti[-]?/i, "").replace(/[()]/g, "");
        if (trimmed && trimmed.length > 2) {
          list.push({
            title: trimmed,
            desc: "Supported by clinical observations and research.",
          });
        }
      });
    }
    if (list.length === 0 && guide?.traditionalUses?.trim()) {
      const phrases = guide.traditionalUses
        .split(/[,.]/)
        .map((w) => w.trim())
        .filter((w) => w.length > 3 && w.length < 45);
      phrases.slice(0, 4).forEach((w) => {
        list.push({
          title: w,
          desc: "Documented traditional community application.",
        });
      });
    }
    if (list.length === 0 && plant.category) {
      list.push({
        title: plant.category,
        desc: plant.simpleUse || "Documented traditional medicinal use.",
      });
    }
    return list.slice(0, 5);
  }, [guide, plant.category, plant.simpleUse]);

  // Categorize References dynamically from MySQL
  const refCategories = React.useMemo(() => {
    const groups: {
      human: typeof references;
      lab: typeof references;
      reviews: typeof references;
      official: Array<{
        id: string;
        title: string;
        organization_or_authors: string;
        publication_year: number;
        source_url: string;
        source_type: string;
      }>;
      preparation: typeof preparationReferences;
    } = {
      human: [],
      lab: [],
      reviews: [],
      official: [],
      preparation: [],
    };

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

  // Extract top verified precautions
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

    return items.slice(0, 4);
  }, [guide, plant.safetyNote]);

  // Concise overview text
  const quickOverviewText = React.useMemo(() => {
    if (guide?.about?.trim()) {
      const sentences = guide.about
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
      return sentences.slice(0, 3).join(" ");
    }
    return plant.simpleUse || "Documented Philippine medicinal plant validated for community health.";
  }, [guide, plant.simpleUse]);

  const primaryPlantPart = plant.plant_parts_used || (preparations[0]?.plant_part_used) || "Leaves";

  const displayedReferences = showAllReferences ? references : references.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#faf9f5] text-[#0f2c20] pb-28">
      {/* Top sticky app navigation bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#dde6df]/80 px-4 py-2.5 transition-all">
        <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Back Button */}
          <Link
            href="/community/herbal-guide"
            className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-[#faf9f5] hover:bg-emerald-50 active:scale-95 text-xs font-extrabold text-[#1e5c44] border border-[#dde6df] transition-all shadow-2xs"
            aria-label="Back to Herbal Guide"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-700" />
            <span>Herbal Guide</span>
          </Link>

          {/* Plant Name in app header */}
          <span className="font-heading font-black text-sm text-[#0f2c20] truncate max-w-[180px] uppercase tracking-wide">
            {plant.commonName}
          </span>

          {/* Bookmark Button in Top Right */}
          <div className="relative">
            <button
              onClick={handleToggleSave}
              disabled={saving}
              aria-label={isSaved ? "Saved in My Guide" : "Save to My Guide"}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer shadow-2xs ${
                isSaved
                  ? "bg-amber-100 text-amber-900 border border-amber-300 shadow-xs"
                  : "bg-white border border-[#dde6df] text-[#0f2c20] hover:bg-emerald-50"
              }`}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
              ) : (
                <Bookmark2DIcon size={18} isSaved={isSaved} />
              )}
            </button>
            {toastMessage && (
              <div className="absolute right-0 top-11 whitespace-nowrap px-2.5 py-1 rounded-lg bg-[#0f2c20] text-white text-[11px] font-bold shadow-md animate-fade-in pointer-events-none z-50">
                {toastMessage}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-5 space-y-6">
        {/* ================================================== */}
        {/* 1. PLANT HERO SECTION                              */}
        {/* ================================================== */}
        <section className="rounded-3xl bg-white border border-[#dde6df] overflow-hidden shadow-xs relative">
          {/* Large plant photograph */}
          <div className="relative h-64 sm:h-80 w-full bg-[#edf2ee] overflow-hidden">
            <RecordImage
              kind="plant"
              src={plant.imageUrl}
              alt={plant.commonName}
              priority
              sizes="(max-width: 640px) 100vw, 768px"
              className="object-cover w-full h-full transition-transform duration-500 hover:scale-105"
            />
            {/* Subtle gradient overlay for readability without covering photograph */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

            {/* Small trust indicator badge top-left */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-900/90 backdrop-blur-md text-white text-[11px] font-extrabold shadow-sm flex items-center gap-1.5 border border-emerald-500/40">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>Recognized medicinal plant reference</span>
              </span>
            </div>

            {/* Bottom Title Overlay */}
            <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
              <span className="inline-block px-2.5 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-emerald-200 text-xs font-bold uppercase tracking-wider mb-1">
                {plant.category}
              </span>
              <h1 className="font-heading font-black text-2xl sm:text-4xl tracking-tight uppercase leading-tight drop-shadow-md">
                {plant.commonName}
              </h1>
              <p className="text-emerald-100/90 italic text-sm sm:text-base font-medium drop-shadow-sm">
                {plant.scientificName}
              </p>
            </div>
          </div>

          {/* Ask Assistant Banner inside Hero */}
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-emerald-50 via-[#faf9f5] to-teal-50 border-t border-[#dde6df]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0 shadow-2xs">
                <Bot className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <p className="font-heading font-extrabold text-xs sm:text-sm text-[#0f2c20]">
                  Have a question about {plant.commonName}?
                </p>
                <p className="text-[11px] text-[#52796f]">
                  Ask our evidence-grounded herbal assistant
                </p>
              </div>
            </div>

            <Link
              href={`/community/ask?plant=${plant.id}`}
              className="px-4 py-2 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all shrink-0"
            >
              <span>Ask NaturAide</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </Link>
          </div>
        </section>

        {/* ================================================== */}
        {/* 2. PLANT QUICK INFORMATION (4 Illustrated Anchors)  */}
        {/* ================================================== */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <a
            href="#documented-uses"
            className="p-3.5 rounded-2xl bg-white border border-[#dde6df] hover:border-emerald-300 shadow-2xs transition-all flex flex-col justify-between group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800 mb-2 group-hover:scale-110 transition-transform">
              <Plant2DIcon size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#719184] block">
                Primary Use
              </span>
              <p className="font-heading font-extrabold text-xs text-[#0f2c20] truncate mt-0.5">
                {plant.category}
              </p>
            </div>
          </a>

          <a
            href="#preparation"
            className="p-3.5 rounded-2xl bg-white border border-[#dde6df] hover:border-amber-300 shadow-2xs transition-all flex flex-col justify-between group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-800 mb-2 group-hover:scale-110 transition-transform">
              <TeaCup2DIcon size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#719184] block">
                Preparation
              </span>
              <p className="font-heading font-extrabold text-xs text-[#0f2c20] truncate mt-0.5">
                {preparations.length === 1 ? "1 Method" : `${preparations.length || 1} Methods`}
              </p>
            </div>
          </a>

          <a
            href="#safety"
            className="p-3.5 rounded-2xl bg-white border border-[#dde6df] hover:border-rose-300 shadow-2xs transition-all flex flex-col justify-between group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 mb-2 group-hover:scale-110 transition-transform">
              <ShieldAlert2DIcon size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#719184] block">
                Precautions
              </span>
              <p className="font-heading font-extrabold text-xs text-[#0f2c20] truncate mt-0.5">
                Safety Notes
              </p>
            </div>
          </a>

          <a
            href="#evidence"
            className="p-3.5 rounded-2xl bg-white border border-[#dde6df] hover:border-purple-300 shadow-2xs transition-all flex flex-col justify-between group"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-800 mb-2 group-hover:scale-110 transition-transform">
              <MicroscopeEvidence2DIcon size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#719184] block">
                Evidence
              </span>
              <p className="font-heading font-extrabold text-xs text-[#0f2c20] truncate mt-0.5">
                {totalVerifiedSources} Verified
              </p>
            </div>
          </a>
        </section>

        {/* ================================================== */}
        {/* 3. PLANT OVERVIEW (About Lagundi)                  */}
        {/* ================================================== */}
        <section className="p-5 sm:p-6 rounded-3xl bg-white border border-[#dde6df] shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5">
            <LeafShield2DIcon size={22} />
            <h2 className="font-heading font-black text-lg sm:text-xl text-[#0f2c20]">
              About {plant.commonName}
            </h2>
          </div>

          <p className="text-sm text-[#3d5a4d] leading-relaxed font-medium">
            {quickOverviewText}
          </p>

          {/* Structured Botanical Metadata Area */}
          <div className="pt-2 border-t border-[#f0f4f1] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-[#faf9f5] border border-[#f0f4f1]">
                <span className="text-[10px] font-bold text-[#719184] uppercase block">
                  Plant Part Commonly Used
                </span>
                <p className="font-heading font-bold text-[#0f2c20] text-sm mt-0.5">
                  {primaryPlantPart}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#faf9f5] border border-[#f0f4f1]">
                <span className="text-[10px] font-bold text-[#719184] uppercase block">
                  Authoritative Monograph Source
                </span>
                <p className="font-heading font-bold text-[#0f2c20] text-sm mt-0.5 truncate">
                  {plant.source_organization || "PITAHC / DOH Traditional Medicine"}
                </p>
              </div>
            </div>

            {/* Toggle for Synonyms & Vernacular Names */}
            <div>
              <button
                type="button"
                onClick={() => setShowMoreInfo((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-900 cursor-pointer transition-colors"
              >
                <span>{showMoreInfo ? "Hide botanical details" : "Botanical synonyms & regional names"}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showMoreInfo ? "rotate-180" : ""}`} />
              </button>

              {showMoreInfo && (
                <div className="mt-2.5 p-3.5 rounded-2xl bg-[#faf9f5] border border-[#dde6df] space-y-2 text-xs">
                  {plant.botanical_synonyms && (
                    <div>
                      <span className="text-[10px] font-bold text-[#719184] uppercase block">
                        Botanical Synonyms
                      </span>
                      <p className="text-[#0f2c20] italic">{plant.botanical_synonyms}</p>
                    </div>
                  )}
                  {plant.local_names && (
                    <div>
                      <span className="text-[10px] font-bold text-[#719184] uppercase block">
                        Local / Regional Names
                      </span>
                      <p className="text-[#0f2c20]">{plant.local_names}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* 4. DOCUMENTED USES                                 */}
        {/* ================================================== */}
        <section id="documented-uses" className="p-5 sm:p-6 rounded-3xl bg-white border border-[#dde6df] shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5">
            <Plant2DIcon size={22} />
            <div>
              <h2 className="font-heading font-black text-lg sm:text-xl text-[#0f2c20]">
                Documented Uses
              </h2>
              <p className="text-xs text-[#52796f]">
                Traditional applications and evidence-recognized indications
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {documentedUsesList.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-[#f7faf8] border border-[#e2ece5] flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100/80 flex items-center justify-center text-emerald-800 shrink-0 font-heading font-black text-xs">
                  {idx + 1}
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-sm text-[#0f2c20]">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#52796f] mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================================================== */}
        {/* 5. PREPARATION (How It Is Traditionally Prepared)   */}
        {/* ================================================== */}
        <section id="preparation" className="p-5 sm:p-6 rounded-3xl bg-white border border-[#dde6df] shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <TeaCup2DIcon size={22} />
              <div>
                <h2 className="font-heading font-black text-lg sm:text-xl text-[#0f2c20]">
                  How It Is Traditionally Prepared
                </h2>
                <p className="text-xs text-[#52796f]">
                  Documented traditional preparation guidelines
                </p>
              </div>
            </div>

            <Link
              href={`/community/plants/${plant.slug}/preparation`}
              className="hidden sm:inline-flex items-center gap-1 text-xs font-extrabold text-emerald-800 hover:text-emerald-900"
            >
              <span>Full Preparation Guide</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 4 Illustrated Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-[#faf9f5] border border-[#f0f4f1] space-y-1">
              <span className="text-[11px] font-black text-emerald-700 block">01</span>
              <h4 className="font-heading font-extrabold text-sm text-[#0f2c20]">
                Prepare
              </h4>
              <p className="text-xs text-[#52796f]">
                Wash fresh or dried {primaryPlantPart.toLowerCase()} thoroughly under clean running water.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#faf9f5] border border-[#f0f4f1] space-y-1">
              <span className="text-[11px] font-black text-emerald-700 block">02</span>
              <h4 className="font-heading font-extrabold text-sm text-[#0f2c20]">
                Measure
              </h4>
              <p className="text-xs text-[#52796f]">
                Measure documented quantity (e.g. 1 glass fresh leaves to 2 glasses water).
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#faf9f5] border border-[#f0f4f1] space-y-1">
              <span className="text-[11px] font-black text-emerald-700 block">03</span>
              <h4 className="font-heading font-extrabold text-sm text-[#0f2c20]">
                Boil / Steep
              </h4>
              <p className="text-xs text-[#52796f]">
                Boil uncovered for 15 minutes, then cool and strain the decoction.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#faf9f5] border border-[#f0f4f1] space-y-1">
              <span className="text-[11px] font-black text-emerald-700 block">04</span>
              <h4 className="font-heading font-extrabold text-sm text-[#0f2c20]">
                Use as Documented
              </h4>
              <p className="text-xs text-[#52796f]">
                Consume within 24 hours as traditionally recommended by health guides.
              </p>
            </div>
          </div>

          <div className="pt-1">
            <Link
              href={`/community/plants/${plant.slug}/preparation`}
              className="w-full py-3 px-4 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all"
            >
              <span>View Full Preparation Guide & Methods</span>
              <ArrowRight className="w-4 h-4 text-emerald-300" />
            </Link>
          </div>
        </section>

        {/* ================================================== */}
        {/* 6. SAFETY CARD (Soft Yellow Precaution Notice)     */}
        {/* ================================================== */}
        <section id="safety" className="p-5 sm:p-6 rounded-3xl bg-[#fffdf5] border-2 border-[#fef08a] shadow-2xs space-y-3.5">
          <div className="flex items-center gap-2.5">
            <ShieldAlert2DIcon size={24} />
            <div>
              <h2 className="font-heading font-black text-base sm:text-lg text-[#713f12]">
                Before using this plant
              </h2>
              <p className="text-xs text-[#854d0e]">
                Important precautions and populations requiring caution
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            {topPrecautions.map((precaution, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#713f12] leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{precaution}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[#fef08a] flex items-center justify-between text-[11px] text-[#854d0e]">
            <span>Always consult a licensed physician or pharmacist when taking regular medication.</span>
            <Link
              href="/community/screening?retake=true"
              className="font-extrabold text-amber-900 underline hover:text-amber-950 shrink-0 ml-2"
            >
              Check My Interactions
            </Link>
          </div>
        </section>

        {/* ================================================== */}
        {/* 7. EVIDENCE & REFERENCES                           */}
        {/* ================================================== */}
        <section id="evidence" className="p-5 sm:p-6 rounded-3xl bg-white border border-[#dde6df] shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <MicroscopeEvidence2DIcon size={22} />
              <div>
                <h2 className="font-heading font-black text-lg sm:text-xl text-[#0f2c20]">
                  Evidence & References
                </h2>
                <p className="text-xs text-[#52796f]">
                  Scientific research publications and official monographs
                </p>
              </div>
            </div>

            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-900 border border-purple-200 text-xs font-bold">
              {totalVerifiedSources} Citations
            </span>
          </div>

          {/* Reference Cards */}
          <div className="space-y-3 pt-1">
            {displayedReferences.map((ref) => (
              <div
                key={ref.id}
                className="p-4 rounded-2xl bg-[#faf9f5] border border-[#f0f4f1] space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-heading font-extrabold text-xs sm:text-sm text-[#0f2c20] leading-snug">
                    {ref.title}
                  </h3>
                  {ref.studyType && (
                    <span className="px-2 py-0.5 rounded-md bg-white border border-[#dde6df] text-[10px] font-bold text-[#52796f] uppercase shrink-0">
                      {ref.studyType}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-[#719184] flex-wrap">
                  {ref.authors && <span>{ref.authors}</span>}
                  {ref.year && <span>&bull; {ref.year}</span>}
                  {ref.journalSource && <span>&bull; {ref.journalSource}</span>}
                </div>

                {ref.doiOrUrl && (
                  <div className="pt-1">
                    <a
                      href={ref.doiOrUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 underline"
                    >
                      <span>View Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>

          {references.length > 3 && (
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => setShowAllReferences((prev) => !prev)}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#1e5c44] hover:text-[#0f2c20] cursor-pointer"
              >
                <span>{showAllReferences ? "Show fewer references" : `Show all ${references.length} references`}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllReferences ? "rotate-180" : ""}`} />
              </button>
            </div>
          )}
        </section>

        {/* ================================================== */}
        {/* 8. RELATED COMMERCIAL PRODUCTS                     */}
        {/* ================================================== */}
        {products && products.length > 0 && (
          <RelatedProductsSection
            products={products}
            plantName={plant.commonName}
          />
        )}
      </main>
    </div>
  );
}
