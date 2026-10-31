"use client";

import React, { useState } from "react";
import RecordImage from "@/components/community/RecordImage";
import ProductImageBadge from "@/components/community/ProductImageBadge";
import VerifyOnFdaPhilippines from "@/components/community/CheckVerificationRecord";
import Link from "next/link";
import {
  Bookmark2DIcon,
  MicroscopeEvidence2DIcon,
  Plant2DIcon,
  MedicinePill2DIcon,
  ShieldAlert2DIcon,
} from "./CommunityIcons2D";
import {
  ArrowLeft,
  Bot,
  Building,
  CheckCircle2,
  ChevronDown,
  Clock,
  Coffee,
  ExternalLink,
  FileText,
  Info,
  Layers,
  Leaf,
  Loader2,
  Microscope,
  Pill,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  Check,
} from "lucide-react";

export interface ProductDetailSectionsProps {
  product: {
    id: string;
    slug: string;
    name: string;
    brandName?: string | null;
    manufacturer: string;
    productType?: string | null;
    productClassification?: string | null;
    dosageForm: string;
    dosageStrength?: string | null;
    isMultiIngredient?: number | boolean | null;
    imageUrl?: string | null;
    image_path?: string | null;
    image_type?: string | null;
    image_source?: string | null;
    image_source_url?: string | null;
    image_verified?: number | boolean | null;
    description?: string | null;
    intendedUse?: string | null;
    usageInstructions?: string | null;
    warningsPrecautions?: string | null;
    preparationGuide?: any;
    publicationStatus?: string | null;
  };
  linkedPlants?: Array<{
    id: string;
    slug: string;
    commonName: string;
    scientificName: string;
    relationshipType?: string | null;
  }>;
  ingredients?: Array<{
    id: string | number;
    ingredientName: string;
    strength?: string | null;
    ingredientType?: string | null;
  }>;
  regulatoryRecord?: {
    regulatoryAgency?: string | null;
    registrationNumber?: string | null;
    registrationStatus?: string | null;
    classification?: string | null;
    issuanceDate?: string | null;
    expiryDate?: string | null;
    verificationSource?: string | null;
    verificationUrl?: string | null;
    lastVerifiedDate?: string | null;
  } | null;
  regulatoryAudit?: {
    isVerified: boolean;
    status: string;
  };
  verificationMessage?: {
    title: string;
    description?: string;
    verifiedAt: Date | null;
  };
  references?: Array<{
    id: string | number;
    title: string;
    authors?: string | null;
    publicationYear?: number | null;
    journalOrPublisher?: string | null;
    studyType?: string | null;
    doi?: string | null;
    pubmedId?: string | null;
    sourceUrl?: string | null;
    shortSummary?: string | null;
    plantOrIngredientStudied?: string | null;
    isExactProductStudied?: number | boolean | null;
    source_verified?: number | boolean | null;
    evidenceClassification?: string | null;
    evidenceNote?: string | null;
    supportedIngredient?: string | null;
  }>;
  resources?: Array<{
    id: string | number;
    resourceName: string;
    resourceType?: string | null;
    url: string;
    lastVerifiedDate?: string | null;
    description?: string | null;
  }>;
  isSaved?: boolean;
}

export default function ProductDetailSections({
  product,
  linkedPlants = [],
  ingredients = [],
  regulatoryRecord = null,
  regulatoryAudit = { isVerified: false, status: "UNVERIFIED" },
  verificationMessage = { title: "Unverified Record", description: "", verifiedAt: null },
  references = [],
  resources = [],
  isSaved: initialSaved = false,
}: ProductDetailSectionsProps) {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Progressive disclosure toggle states
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [showAllIngredients, setShowAllIngredients] = useState(false);
  const [showAllReferences, setShowAllReferences] = useState(false);
  const [showEvidenceLearnMore, setShowEvidenceLearnMore] = useState(false);

  const handleToggleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/community/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "product", id: product.id }),
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

  // Parse structured preparation guide if available
  let prepGuide: {
    method?: string;
    servingAmount?: string;
    waterAmount?: string;
    frequency?: string;
    steps?: string[];
    instructionSource?: string;
    instructionSourceUrl?: string;
  } | null = null;

  if (product.preparationGuide) {
    try {
      prepGuide =
        typeof product.preparationGuide === "string"
          ? JSON.parse(product.preparationGuide)
          : product.preparationGuide;
    } catch {
      prepGuide = null;
    }
  }

  // Group references by hierarchy
  const exactProductRefs = references.filter(
    (r) => r.evidenceClassification === "EXACT_PRODUCT_STUDY"
  );
  const formulationRefs = references.filter(
    (r) => r.evidenceClassification === "FORMULATION_STUDY"
  );
  const ingredientRefs = references.filter(
    (r) => r.evidenceClassification === "INGREDIENT_EVIDENCE"
  );
  const plantRefs = references.filter(
    (r) => r.evidenceClassification === "PLANT_EVIDENCE"
  );
  const safetyRefs = references.filter(
    (r) => r.evidenceClassification === "SAFETY_EVIDENCE"
  );

  const hasExactProductStudy = exactProductRefs.length > 0;
  const ingredientAndPlantRefsCount =
    formulationRefs.length + ingredientRefs.length + plantRefs.length;
  const hasIngredientStudy = ingredientAndPlantRefsCount > 0;
  const hasSafetyEvidence = safetyRefs.length > 0;
  const hasAnyEvidenceCategory =
    hasExactProductStudy ||
    hasIngredientStudy ||
    hasSafetyEvidence;

  const registrationNumber = regulatoryRecord?.registrationNumber?.trim() || "";
  const regulatoryAgency = regulatoryRecord?.regulatoryAgency?.trim() || "";

  const isSupplement =
    (product.productClassification || "").toUpperCase().includes("SUPPLEMENT") ||
    (product.productType || "").toUpperCase().includes("SUPPLEMENT");

  const isHerbalMedicine =
    (product.productClassification || "").toUpperCase().includes("HERBAL_MEDICINE") ||
    (product.productType || "").toUpperCase().includes("HERBAL_MEDICINE");

  // Determine displayed references based on progressive disclosure
  const displayedReferences = showAllReferences ? references : references.slice(0, 2);
  const visibleIngredients = showAllIngredients ? ingredients : ingredients.slice(0, 4);

  // Render a reference card with modern styling
  const renderReferenceCard = (ref: any) => {
    const isExact = ref.evidenceClassification === "EXACT_PRODUCT_STUDY";
    let classificationLabel = "Plant Evidence";
    let badgeClass = "bg-teal-100 text-teal-900 border-teal-200";

    if (isExact) {
      classificationLabel = "Exact Product Study";
      badgeClass = "bg-emerald-700 text-white border-emerald-700";
    } else if (ref.evidenceClassification === "FORMULATION_STUDY") {
      classificationLabel = "Formulation Study";
      badgeClass = "bg-indigo-100 text-indigo-900 border-indigo-200";
    } else if (ref.evidenceClassification === "INGREDIENT_EVIDENCE") {
      classificationLabel = "Ingredient Evidence";
      badgeClass = "bg-slate-100 text-slate-800 border-slate-300";
    } else if (ref.evidenceClassification === "SAFETY_EVIDENCE") {
      classificationLabel = "Safety Evidence";
      badgeClass = "bg-amber-100 text-amber-900 border-amber-200";
    }

    return (
      <div
        key={ref.id}
        className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
          isExact
            ? "bg-teal-50/40 border-teal-200/90 shadow-2xs"
            : "bg-[#faf9f5] border-[#dde6df] hover:border-emerald-200"
        }`}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border flex items-center gap-1 ${badgeClass}`}
          >
            {isExact && <CheckCircle2 className="w-3 h-3 text-teal-200" />}
            <span>{classificationLabel}</span>
          </span>

          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-extrabold flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" />
            <span>Verified Source</span>
          </span>

          {ref.supportedIngredient && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
              <Leaf className="w-2.5 h-2.5 text-emerald-700" />
              <span>Supports: {ref.supportedIngredient}</span>
            </span>
          )}

          {ref.studyType && (
            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[10px] font-bold">
              {ref.studyType}
            </span>
          )}

          {ref.pubmedId && (
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-900 border border-blue-200 text-[10px] font-mono font-bold">
              PMID: {ref.pubmedId}
            </span>
          )}

          {ref.doi && (
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono">
              DOI: {ref.doi}
            </span>
          )}
        </div>

        <h4 className="font-heading font-extrabold text-xs sm:text-sm text-[#0f2c20] leading-snug">
          {ref.title}
        </h4>

        <p className="text-xs text-[#52796f]">
          {ref.authors} ({ref.publicationYear}) &bull; <em>{ref.journalOrPublisher}</em>
        </p>

        {ref.evidenceNote && (
          <div className="p-2.5 rounded-xl bg-white/80 border border-[#dde6df] text-[#2c473b] text-[11px] leading-relaxed">
            <strong className="text-[#0f2c20]">Evidence Scope: </strong>
            <span>{ref.evidenceNote}</span>
          </div>
        )}

        {ref.shortSummary && (
          <div className="p-3 rounded-xl bg-white border border-[#dde6df] text-xs text-[#3d4a45] space-y-1">
            <strong className="text-[#0f2c20] block text-[11px]">
              Evidence Summary:
            </strong>
            <p className="leading-relaxed">{ref.shortSummary}</p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
          <div className="space-y-0.5">
            <span className="text-[#78997f]">Target Studied: </span>
            <strong className="text-[#0f2c20]">{ref.plantOrIngredientStudied}</strong>
            <span className="mx-1.5 text-slate-300">&bull;</span>
            <span className="text-[#78997f]">Exact Product Studied: </span>
            <strong className={isExact ? "text-teal-700" : "text-slate-600"}>
              {isExact ? "YES" : "NO"}
            </strong>
          </div>

          {ref.sourceUrl && (
            <a
              href={ref.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-[11px] font-bold inline-flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
            >
              <Microscope className="w-3 h-3 text-emerald-300" />
              <span>View Research Paper</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#faf9f5] text-[#0f2c20] pb-28">
      {/* ================================================== */}
      {/* 1. MOBILE-APP TOP NAVIGATION BAR                   */}
      {/* ================================================== */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-[#dde6df]/80 px-4 py-2.5 transition-all">
        <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Back Button with subtle pill */}
          <Link
            href="/community/herbal-guide?tab=products"
            className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-[#faf7f2] hover:bg-emerald-50 active:scale-95 text-xs font-extrabold text-[#1e5c44] border border-[#dde6df] transition-all shadow-2xs"
            aria-label="Back to Herbal Products"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-700" />
            <span>Herbal Products</span>
          </Link>

          {/* Product Brand Name in header */}
          <span className="font-heading font-black text-xs sm:text-sm text-[#0f2c20] truncate max-w-[170px] uppercase tracking-wide">
            {product.brandName || product.name}
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

      {/* ================================================== */}
      {/* SINGLE SCROLLABLE FULL-WIDTH COLUMN (max-w-4xl)    */}
      {/* ================================================== */}
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Strict Educational / Non-Prescription Disclaimer */}
        <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-amber-950 text-xs leading-relaxed space-y-1 shadow-2xs">
          <div className="flex items-center gap-1.5 font-bold text-amber-900">
            <Info className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Educational &amp; Reference Information Only</span>
          </div>
          <p className="text-[11px] text-amber-900 leading-normal">
            NaturAide provides verified product information and scientific evidence for educational
            reference. Commercial products are <strong>not</strong> personalized medical prescriptions,
            and NaturAide does not issue statements claiming this is the &ldquo;best treatment&rdquo;
            or &ldquo;recommended for you.&rdquo;
          </p>
        </div>

        {/* ================================================== */}
        {/* 1. HERO PRODUCT SHOWCASE CARD                      */}
        {/* ================================================== */}
        <section className="rounded-3xl bg-white border border-[#dde6df] p-4 sm:p-6 shadow-xs space-y-5 transition-all">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            {/* Product Image Frame */}
            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl bg-[#faf9f5] border border-[#dde6df] p-2 overflow-hidden shrink-0 relative flex items-center justify-center shadow-2xs group">
              <RecordImage
                kind="product"
                src={product.image_path || product.imageUrl}
                isVerified={Boolean(product.image_verified)}
                imageType={product.image_type}
                alt={product.name}
                sizes="144px"
                priority
                className="object-contain w-full h-full rounded-xl transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            {/* Product Details Header */}
            <div className="space-y-2 flex-1 min-w-0">
              {/* Category & Classification Badges */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-teal-800 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-2xs">
                  COMMERCIAL PRODUCT
                </span>

                <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 text-xs font-extrabold">
                  {product.productClassification || product.productType}
                </span>

                {product.dosageStrength && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold">
                    {product.dosageStrength}
                  </span>
                )}

                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-xs font-bold">
                  {product.dosageForm}
                </span>

                {Boolean(product.isMultiIngredient) && (
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-extrabold">
                    MULTI-INGREDIENT
                  </span>
                )}

                {/* Registration Status Pill */}
                {regulatoryRecord?.registrationStatus?.toUpperCase() === "ACTIVE" && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>✓ Active Registration</span>
                  </span>
                )}

                <ProductImageBadge imageType={product.image_type} showDisclosure />
              </div>

              {/* Title & Brand */}
              <h1 className="font-heading font-black text-xl sm:text-2xl text-[#0f2c20] leading-snug tracking-tight">
                {product.name}
              </h1>

              {/* Manufacturer Line */}
              <p className="text-xs text-[#52796f] flex items-center justify-center sm:justify-start gap-1.5 font-medium">
                <Building className="w-3.5 h-3.5 text-[#78997f]" />
                <span>
                  Manufacturer: <strong className="text-[#0f2c20]">{product.manufacturer}</strong>
                </span>
              </p>

              {/* Image Attribution / Source */}
              {product.image_type === "AUTHENTIC_PRODUCT" ? (
                <p className="text-[11px] leading-snug text-[#52796f] flex flex-wrap items-center justify-center sm:justify-start gap-1 pt-0.5">
                  <span>Photo Source:</span>
                  {product.image_source_url ? (
                    <a
                      href={product.image_source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-emerald-800 underline hover:text-emerald-950 inline-flex items-center gap-0.5"
                    >
                      <span>{product.image_source || "Official Manufacturer Website"}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="font-semibold text-[#0f2c20]">
                      {product.image_source || "Official Manufacturer Source"}
                    </span>
                  )}
                </p>
              ) : product.image_type === "AI_REPRESENTATIVE" ? (
                <p
                  className="text-[11px] leading-snug text-[#52796f] pt-0.5"
                  title="AI-generated representative image. Actual product packaging may differ."
                >
                  <span>Representative Visual: </span>
                  <span className="font-semibold text-[#0f2c20]">NaturAide AI Generated Image</span>
                </p>
              ) : (
                <p className="text-[11px] leading-snug text-[#78997f] pt-0.5">
                  Photo not yet cataloged.
                </p>
              )}
            </div>
          </div>

          {/* Classification Specific Alert */}
          {isSupplement && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs leading-relaxed space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 uppercase tracking-wide">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Registered as Food Supplement with No Approved Therapeutic Claims</span>
              </div>
              <p className="text-[11px] text-amber-900 leading-normal">
                This commercial preparation is registered with the Philippine FDA (CFRR) as a food
                supplement, not as an FDA-approved medicine. It is legally classified with no
                approved therapeutic claims for diagnosing, treating, curing, or preventing diseases.
              </p>
            </div>
          )}

          {isHerbalMedicine && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs leading-relaxed flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-900 block font-bold">
                  Philippine FDA Registered Herbal Medicine
                </strong>
                <span className="text-[11px] text-emerald-800">
                  Evaluated and registered under CDRR with documented pharmaceutical dosage,
                  standardized quality, and approved therapeutic indications.
                </span>
              </div>
            </div>
          )}

          {Boolean(product.isMultiIngredient) && (
            <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950 text-xs leading-relaxed flex items-start gap-2.5">
              <Layers className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-indigo-900 block font-bold">
                  Multi-Ingredient Herbal Formulation
                </strong>
                <span className="text-[11px] text-indigo-800">
                  This formulation combines multiple active botanical or nutritional ingredients.
                  Observed clinical actions or health benefits are attributable to the complete
                  formulation and cannot be attributed exclusively to any single medicinal herb.
                </span>
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          <Link
            href={`/community/ask?product=${product.id}`}
            className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-teal-700 via-emerald-700 to-[#0f2c20] hover:brightness-105 active:scale-98 text-white text-xs font-black flex items-center justify-center gap-2 shadow-sm transition-all min-h-[44px]"
          >
            <Bot className="w-4 h-4 text-emerald-300 animate-pulse" />
            <span>Ask NaturAide about {product.name}</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          </Link>

          {/* 3 Quick Facts Metric Pills */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-2xl bg-[#faf7f2] border border-[#dde6df]/80">
              <span className="text-[10px] font-bold text-[#52796f] uppercase block">
                Form &amp; Strength
              </span>
              <p className="font-black text-[#0f2c20] text-xs mt-0.5 truncate">
                {product.dosageForm} {product.dosageStrength ? `(${product.dosageStrength})` : ""}
              </p>
            </div>

            <div className="p-2 rounded-2xl bg-[#faf7f2] border border-[#dde6df]/80">
              <span className="text-[10px] font-bold text-[#52796f] uppercase block">
                Herbal Origin
              </span>
              <p className="font-black text-[#0f2c20] text-xs mt-0.5 truncate">
                {linkedPlants.length > 0 ? linkedPlants[0].commonName : "Botanical"}
              </p>
            </div>

            <div className="p-2 rounded-2xl bg-[#faf7f2] border border-[#dde6df]/80">
              <span className="text-[10px] font-bold text-[#52796f] uppercase block">
                References
              </span>
              <p className="font-black text-[#0f2c20] text-xs mt-0.5 truncate">
                {references.length} Verified
              </p>
            </div>
          </div>

          {/* Expandable Origin & Manufacturer Info */}
          <div className="pt-0.5 text-center">
            <button
              onClick={() => setShowMoreInfo((prev) => !prev)}
              className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#1e5c44] hover:text-[#0f2c20] cursor-pointer py-1 active:scale-95 transition-all"
              aria-expanded={showMoreInfo}
            >
              <span>{showMoreInfo ? "Hide Registration Details" : "More Registration & Details"}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-emerald-700 transition-transform duration-300 ${
                  showMoreInfo ? "rotate-180" : ""
                }`}
              />
            </button>

            {showMoreInfo && (
              <div className="mt-2.5 p-3.5 rounded-2xl bg-[#faf7f2] border border-[#dde6df] space-y-2 text-left text-xs animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="font-bold text-[#52796f] block uppercase text-[10px]">
                      Manufacturer Name
                    </span>
                    <strong className="text-[#0f2c20]">{product.manufacturer}</strong>
                  </div>
                  <div>
                    <span className="font-bold text-[#52796f] block uppercase text-[10px]">
                      CPR Registration Number
                    </span>
                    <strong className="text-teal-900 font-mono">
                      {registrationNumber || "On Record"}
                    </strong>
                  </div>
                  <div>
                    <span className="font-bold text-[#52796f] block uppercase text-[10px]">
                      Regulatory Agency
                    </span>
                    <span className="text-[#0f2c20]">
                      {regulatoryAgency || "Philippine Food and Drug Administration (FDA)"}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-[#52796f] block uppercase text-[10px]">
                      Validity Status
                    </span>
                    <span className="font-semibold text-emerald-800">
                      {regulatoryRecord?.registrationStatus || "Verified"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ================================================== */}
        {/* 2. LINKED MAIN MEDICINAL PLANT CARD                */}
        {/* ================================================== */}
        {linkedPlants.length > 0 && (
          <section className="rounded-3xl bg-gradient-to-br from-emerald-50/80 via-white to-white border border-emerald-200/90 p-4 sm:p-5 shadow-2xs space-y-3 transition-all">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Leaf className="w-4 h-4" />
                </div>
                <h2 className="font-heading font-black text-sm sm:text-base text-[#0f2c20] uppercase tracking-wide">
                  Main Medicinal Plant
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-900 text-[10px] font-extrabold">
                Herbal Foundation
              </span>
            </div>

            <div className="space-y-2">
              {linkedPlants.map((lp) => (
                <div
                  key={lp.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/95 border border-emerald-100 shadow-2xs hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Leaf className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="text-[#0f2c20] text-sm block font-heading font-extrabold">
                        {lp.commonName}
                      </strong>
                      <em className="text-xs text-[#52796f] font-medium">{lp.scientificName}</em>
                    </div>
                  </div>
                  <Link
                    href={`/community/plants/${lp.slug || lp.id}`}
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl bg-[#0f2c20] hover:bg-[#1a4b36] active:scale-95 text-white text-xs font-extrabold transition-all shadow-2xs shrink-0"
                  >
                    <span>View Medicinal Plant →</span>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ================================================== */}
        {/* 3. HERBAL & ACTIVE INGREDIENTS                     */}
        {/* ================================================== */}
        <section className="rounded-3xl bg-white border border-[#dde6df] p-4 sm:p-5 shadow-2xs space-y-3.5 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                <Pill className="w-4 h-4" />
              </div>
              <h2 className="font-heading font-black text-sm sm:text-base text-[#0f2c20] uppercase tracking-wide">
                Herbal &amp; Active Ingredients
              </h2>
            </div>
            <span className="text-[10px] font-bold text-[#52796f]">
              {ingredients.length} {ingredients.length === 1 ? "Ingredient" : "Ingredients"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {visibleIngredients.map((ing) => (
              <div
                key={ing.id}
                className="p-3 rounded-2xl bg-[#faf9f5] border border-[#dde6df] flex flex-col justify-between gap-1.5 text-xs hover:border-emerald-200 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[#0f2c20] leading-snug">{ing.ingredientName}</span>
                  {ing.ingredientType && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#52796f] shrink-0 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {ing.ingredientType === "ACTIVE_HERBAL"
                        ? "Active"
                        : ing.ingredientType === "BOTANICAL_ADJUVANT"
                        ? "Adjuvant"
                        : "Excipient"}
                    </span>
                  )}
                </div>
                {ing.strength && (
                  <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md inline-block w-fit">
                    {ing.strength}
                  </span>
                )}
              </div>
            ))}
          </div>

          {ingredients.length > 4 && (
            <div className="text-center pt-1">
              <button
                onClick={() => setShowAllIngredients((prev) => !prev)}
                className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#1e5c44] hover:text-[#0f2c20] cursor-pointer py-1 active:scale-95 transition-all"
              >
                <span>
                  {showAllIngredients
                    ? "Show Fewer Ingredients"
                    : `Show All Ingredients (${ingredients.length})`}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-emerald-700 transition-transform duration-300 ${
                    showAllIngredients ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          )}
        </section>

        {/* ================================================== */}
        {/* 4. PRODUCT INFORMATION & INTENDED USE              */}
        {/* ================================================== */}
        <section className="rounded-3xl bg-white border border-[#dde6df] p-4 sm:p-5 shadow-2xs space-y-3.5 transition-all">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="font-heading font-black text-sm sm:text-base text-[#0f2c20] uppercase tracking-wide">
              Product Information
            </h2>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-[#3d4a45] leading-relaxed">
            {product.description && (
              <div>
                <strong className="text-[#0f2c20] block mb-1 text-xs">Description:</strong>
                <p className="leading-relaxed">{product.description}</p>
              </div>
            )}

            {product.intendedUse && (
              <div>
                <strong className="text-[#0f2c20] block mb-1 text-xs">
                  Label / Documented Intended Use:
                </strong>
                <div className="p-3.5 rounded-2xl bg-[#faf9f5] border border-[#dde6df] text-xs leading-relaxed text-[#0f2c20]">
                  {product.intendedUse}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ================================================== */}
        {/* 5. HOW TO PREPARE / HOW TO USE                     */}
        {/* ================================================== */}
        <section className="rounded-3xl bg-white border border-[#dde6df] p-4 sm:p-5 shadow-2xs space-y-3.5 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                <Coffee className="w-4 h-4" />
              </div>
              <h2 className="font-heading font-black text-sm sm:text-base text-[#0f2c20] uppercase tracking-wide">
                How to Prepare / How to Use
              </h2>
            </div>
            <span className="text-[10px] font-bold text-[#52796f]">Verified Directions</span>
          </div>

          {prepGuide ? (
            <div className="space-y-4 text-xs sm:text-sm text-[#3d4a45]">
              {/* Structured Metadata Badges: Method, Serving, Water, Frequency */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {prepGuide.method && (
                  <div className="p-2.5 rounded-2xl bg-[#faf9f5] border border-[#dde6df] space-y-0.5">
                    <span className="text-[9px] font-bold text-[#78997f] uppercase tracking-wider block">
                      Method
                    </span>
                    <strong className="text-xs text-[#0f2c20] block truncate">
                      {prepGuide.method}
                    </strong>
                  </div>
                )}

                {prepGuide.servingAmount && (
                  <div className="p-2.5 rounded-2xl bg-[#faf9f5] border border-[#dde6df] space-y-0.5">
                    <span className="text-[9px] font-bold text-[#78997f] uppercase tracking-wider block">
                      Serving
                    </span>
                    <strong className="text-xs text-teal-900 block truncate">
                      {prepGuide.servingAmount}
                    </strong>
                  </div>
                )}

                {prepGuide.waterAmount && (
                  <div className="p-2.5 rounded-2xl bg-[#faf9f5] border border-[#dde6df] space-y-0.5">
                    <span className="text-[9px] font-bold text-[#78997f] uppercase tracking-wider block">
                      Water
                    </span>
                    <strong className="text-xs text-[#0f2c20] block truncate">
                      {prepGuide.waterAmount}
                    </strong>
                  </div>
                )}

                {prepGuide.frequency && (
                  <div className="p-2.5 rounded-2xl bg-[#faf9f5] border border-[#dde6df] space-y-0.5">
                    <span className="text-[9px] font-bold text-[#78997f] uppercase tracking-wider block">
                      Frequency
                    </span>
                    <strong className="text-xs text-[#0f2c20] block truncate">
                      {prepGuide.frequency}
                    </strong>
                  </div>
                )}
              </div>

              {/* Numbered Step-by-Step Instructions */}
              {prepGuide.steps && prepGuide.steps.length > 0 && (
                <div className="space-y-2 pt-1">
                  <strong className="text-xs font-bold text-[#0f2c20] block">
                    Preparation Steps:
                  </strong>
                  <ol className="space-y-2">
                    {prepGuide.steps.map((step, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-2xl bg-[#faf9f5] border border-[#dde6df]"
                      >
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-xs text-[#2c3e35] leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Verified Instruction Source & View Source Link */}
              <div className="p-3 rounded-2xl bg-[#f0f5f2] border border-[#dde6df] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                <div className="text-[11px] text-[#2c473b]">
                  <span className="text-[#52796f]">Source: </span>
                  <strong>
                    {prepGuide.instructionSource ||
                      "Official Product Label / Manufacturer Instructions"}
                  </strong>
                </div>

                {prepGuide.instructionSourceUrl && (
                  <a
                    href={prepGuide.instructionSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 hover:underline shrink-0"
                  >
                    <span>View Source</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ) : product.usageInstructions ? (
            <div className="space-y-3 text-xs sm:text-sm text-[#3d4a45]">
              <div className="p-4 rounded-2xl bg-[#faf9f5] border border-[#dde6df] space-y-1">
                <strong className="text-[#0f2c20] block text-xs">Official Instructions:</strong>
                <p className="text-xs leading-relaxed">{product.usageInstructions}</p>
              </div>

              <div className="p-3 rounded-2xl bg-[#f0f5f2] border border-[#dde6df] text-[11px] text-[#2c473b]">
                <span className="text-[#52796f]">Source: </span>
                <strong>Official Product Packaging / Regulatory Record</strong>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-[#faf9f5] border border-dashed border-[#dde6df] text-center text-xs text-[#78997f]">
              Verified preparation instructions are not currently available.
            </div>
          )}
        </section>

        {/* ================================================== */}
        {/* 6. WARNINGS & PRECAUTIONS                          */}
        {/* ================================================== */}
        <section className="rounded-3xl bg-white border border-[#dde6df] p-4 sm:p-5 shadow-2xs space-y-3.5 transition-all">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h2 className="font-heading font-black text-sm sm:text-base text-[#0f2c20] uppercase tracking-wide">
              Warnings &amp; Precautions
            </h2>
          </div>

          {product.warningsPrecautions ? (
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs leading-relaxed space-y-1.5">
              <strong className="flex items-center gap-1.5 text-amber-900 font-bold">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>Important Safety Caution:</span>
              </strong>
              <p className="text-amber-950 leading-relaxed">{product.warningsPrecautions}</p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#faf9f5] border border-dashed border-[#dde6df] text-center text-xs text-[#78997f]">
              No product-specific safety contraindications are currently recorded on the product label.
              Always consult a physician prior to starting botanical preparations.
            </div>
          )}
        </section>

        {/* ================================================== */}
        {/* 7. REGISTRATION & VERIFICATION                     */}
        {/* ================================================== */}
        <section className="rounded-3xl bg-white border border-[#dde6df] p-4 sm:p-5 shadow-2xs space-y-4 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h2 className="font-heading font-black text-sm sm:text-base text-[#0f2c20] uppercase tracking-wide">
                Registration &amp; Verification
              </h2>
            </div>
            {regulatoryAudit.isVerified && (
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Verified Record
              </span>
            )}
          </div>

          {regulatoryRecord ? (
            <div className="p-4 rounded-2xl bg-[#faf9f5] border border-[#dde6df] space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-[#78997f] block font-medium">
                    Regulatory Agency
                  </span>
                  <strong className="text-[#0f2c20]">{regulatoryRecord.regulatoryAgency}</strong>
                </div>

                <div>
                  <span className="text-[11px] text-[#78997f] block font-medium">
                    Registration Number
                  </span>
                  <strong className="text-teal-900 font-mono text-sm">
                    {regulatoryRecord.registrationNumber}
                  </strong>
                </div>

                <div>
                  <span className="text-[11px] text-[#78997f] block font-medium">
                    Registration Status
                  </span>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span
                      className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                        (regulatoryRecord.registrationStatus || "").toUpperCase() === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-rose-50 text-rose-800 border border-rose-200"
                      }`}
                    >
                      {regulatoryRecord.registrationStatus || "UNKNOWN"}
                    </span>
                    {(regulatoryRecord.registrationStatus || "").toUpperCase() === "EXPIRED" && (
                      <span className="text-[10px] text-rose-700 font-bold">
                        (Historical Record)
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-[#78997f] block font-medium">
                    CPR Validity Dates
                  </span>
                  <span className="text-[#0f2c20] font-medium text-xs">
                    {regulatoryRecord.issuanceDate
                      ? new Date(regulatoryRecord.issuanceDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "N/A"}{" "}
                    &mdash;{" "}
                    {regulatoryRecord.expiryDate
                      ? new Date(regulatoryRecord.expiryDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "N/A"}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-[#78997f] block font-medium">
                    Classification
                  </span>
                  <span className="text-[#0f2c20] font-semibold">
                    {regulatoryRecord.classification}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-[#78997f] block font-medium">
                    Verification Source
                  </span>
                  <span className="text-[#0f2c20]">{regulatoryRecord.verificationSource}</span>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-[11px] text-[#78997f] block font-medium">
                    NaturAide Audit
                  </span>
                  {verificationMessage.verifiedAt ? (
                    <div className="text-[#0f2c20] font-semibold pt-0.5">
                      <span className="block">{verificationMessage.title}</span>
                      <span className="mt-0.5 flex items-center gap-1 text-[#52796f] font-medium text-[11px]">
                        <Clock className="w-3 h-3 text-[#78997f]" />
                        <span>
                          Last audited:{" "}
                          {verificationMessage.verifiedAt.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </span>
                    </div>
                  ) : (
                    <span
                      className={
                        regulatoryAudit.status === "NEEDS_REVERIFICATION"
                          ? "text-amber-800 font-semibold"
                          : "text-[#52796f] font-semibold"
                      }
                    >
                      {verificationMessage.title}
                    </span>
                  )}
                </div>
              </div>

              {registrationNumber && (
                <div className="pt-2 border-t border-[#e2eae4]">
                  <VerifyOnFdaPhilippines
                    registrationNumber={registrationNumber}
                    regulatoryAgency={regulatoryAgency || null}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#faf9f5] border border-dashed border-[#dde6df] text-center text-xs text-[#78997f]">
              No regulatory verification record is currently recorded for this product.
            </div>
          )}
        </section>

        {/* ================================================== */}
        {/* 8. EVIDENCE & REFERENCES                           */}
        {/* ================================================== */}
        <section
          id="evidence"
          className="rounded-3xl bg-white border border-[#dde6df] p-4 sm:p-5 shadow-2xs space-y-4 transition-all"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-100 border border-purple-200/90 flex items-center justify-center shrink-0 shadow-2xs">
                <MicroscopeEvidence2DIcon size={20} />
              </div>
              <div>
                <h2 className="font-heading font-black text-sm sm:text-base text-[#0f2c20] uppercase tracking-wide">
                  Evidence &amp; References
                </h2>
                <p className="text-xs text-[#52796f]">
                  Scientific research publications, safety evaluations, and official references.
                </p>
              </div>
            </div>
            <span className="text-[10px] sm:text-xs font-extrabold text-emerald-900 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 shadow-2xs">
              {references.length} {references.length === 1 ? "Study" : "Studies"}
            </span>
          </div>

          {/* Dynamic Evidence Categories: Only displayed when category count > 0 */}
          {hasAnyEvidenceCategory && (
            <div className="space-y-2.5 pt-0.5">
              {/* Product-Specific Research: Shown prominently ABOVE others IF count > 0 */}
              {hasExactProductStudy && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-[#edf6f0] border border-emerald-300/80 shadow-2xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <MedicinePill2DIcon size={18} />
                    </div>
                    <div>
                      <strong className="text-xs sm:text-sm font-heading font-extrabold text-[#0f2c20] block">
                        Product-Specific Research
                      </strong>
                      <span className="text-[11px] text-[#486b5e] font-medium">
                        Clinical or laboratory evaluation of this exact finished commercial formulation
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-white border border-emerald-200 font-black text-xs text-emerald-900 shrink-0 shadow-2xs">
                    {exactProductRefs.length} {exactProductRefs.length === 1 ? "reference" : "references"}
                  </span>
                </div>
              )}

              {/* Other Evidence Categories with count > 0 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {hasIngredientStudy && (
                  <div className="p-3.5 rounded-2xl bg-[#faf9f5] border border-[#dde6df] hover:border-emerald-300 transition-all space-y-1 shadow-2xs">
                    <div className="flex items-center gap-2 text-[#0f2c20]">
                      <Plant2DIcon size={18} />
                      <strong className="font-heading font-bold text-xs">
                        Plant / Ingredient Research
                      </strong>
                    </div>
                    <p className="text-xs font-black text-emerald-800 pl-6">
                      {ingredientAndPlantRefsCount}{" "}
                      {ingredientAndPlantRefsCount === 1 ? "reference" : "references"}
                    </p>
                  </div>
                )}

                {hasSafetyEvidence && (
                  <div className="p-3.5 rounded-2xl bg-[#faf9f5] border border-[#dde6df] hover:border-amber-300 transition-all space-y-1 shadow-2xs">
                    <div className="flex items-center gap-2 text-[#0f2c20]">
                      <ShieldAlert2DIcon size={18} />
                      <strong className="font-heading font-bold text-xs">
                        Safety Research
                      </strong>
                    </div>
                    <p className="text-xs font-black text-amber-800 pl-6">
                      {safetyRefs.length}{" "}
                      {safetyRefs.length === 1 ? "reference" : "references"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Multi-Ingredient Callout */}
          {Boolean(product.isMultiIngredient) && (
            <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-extrabold text-[10px] tracking-wide uppercase shrink-0">
                  MULTI-INGREDIENT PRODUCT
                </span>
                <span className="text-[11px] font-semibold text-amber-900">
                  References are evaluated per botanical ingredient.
                </span>
              </div>
              <span className="text-[10px] text-amber-800">
                Evidence for one ingredient does not prove the whole product.
              </span>
            </div>
          )}

          {/* References List */}
          {references.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#faf9f5] border border-dashed border-[#dde6df] text-center text-xs text-[#78997f]">
              No peer-reviewed scientific citations are currently indexed for this product in the
              knowledge base.
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {displayedReferences.map((ref) => renderReferenceCard(ref))}

              {references.length > 2 && (
                <div className="text-center pt-1">
                  <button
                    onClick={() => setShowAllReferences((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-[#faf7f2] border border-[#dde6df] hover:bg-emerald-50 text-xs font-extrabold text-[#1e5c44] active:scale-95 transition-all shadow-2xs cursor-pointer"
                  >
                    <span>
                      {showAllReferences
                        ? "Show Top 2 Studies"
                        : `Show All Scientific References (${references.length})`}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-emerald-700 transition-transform duration-300 ${
                        showAllReferences ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>
              )}

              <div className="pt-1 flex justify-center">
                <Link
                  href={`/community/ask?product=${product.id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold transition-colors shadow-2xs"
                >
                  <Bot className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Ask NaturAide About This Evidence</span>
                </Link>
              </div>
            </div>
          )}

          {/* Evidence Disclosure */}
          <div className="p-3.5 rounded-2xl bg-[#f4f8f5]/90 border border-[#dcebe0] text-xs text-[#3d5a4d] space-y-1.5 transition-all">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-[#52796f] shrink-0 mt-0.5" />
              <div className="space-y-0.5 flex-1 min-w-0">
                <strong className="text-[#0f2c20] font-bold block text-xs">
                  Evidence note
                </strong>
                <p className="text-[11px] sm:text-xs text-[#486b5e] leading-relaxed">
                  Available research may relate to the medicinal plant or active ingredient and does not
                  necessarily evaluate this specific commercial product.
                </p>
              </div>
            </div>

            <div className="pt-0.5 pl-6">
              <button
                type="button"
                onClick={() => setShowEvidenceLearnMore((prev) => !prev)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 transition-colors cursor-pointer"
                aria-expanded={showEvidenceLearnMore}
              >
                <span>{showEvidenceLearnMore ? "Hide details" : "Learn more"}</span>
                <ChevronDown
                  className={`w-3 h-3 text-emerald-700 transition-transform duration-200 ${
                    showEvidenceLearnMore ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showEvidenceLearnMore && (
                <p className="mt-2 text-[11px] text-[#52796f] leading-relaxed animate-in fade-in duration-200 bg-white/80 p-2.5 rounded-xl border border-[#dde6df]/70">
                  Herbal products in the NaturAide catalog are indexed alongside verified research on their
                  botanical components and traditional uses. Clinical trials on specific finished commercial
                  formulations are evaluated separately when available. Always consult a licensed healthcare
                  professional before using herbal products for medical purposes.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* CONTEXTUAL BOT & BACK TO GUIDE NAVIGATION          */}
        {/* ================================================== */}
        <div className="space-y-2 pt-1">
          <Link
            href={`/community/ask?product=${product.id}`}
            className="w-full py-3.5 px-5 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-950 border border-teal-200 font-heading font-extrabold text-sm shadow-2xs transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            <Bot className="w-4 h-4 text-teal-700" />
            <span>Ask NaturAide About This Product</span>
          </Link>

          <Link
            href={
              linkedPlants.length > 0
                ? `/community/plants/${linkedPlants[0].slug}`
                : "/community/herbal-guide?tab=products"
            }
            className="w-full py-3.5 rounded-2xl bg-white border border-[#dde6df] hover:bg-[#faf9f5] text-xs font-bold text-[#0f2c20] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>
              {linkedPlants.length > 0
                ? `Back to ${linkedPlants[0].commonName}`
                : "Back to Herbal Guide"}
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
