"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Search,
  Check,
  ChevronDown,
  ExternalLink,
  Dna,
  BookOpen,
  Sprout,
  Copy,
  Plus,
  X,
  FileText,
  Info,
  Layers,
  FlaskConical,
} from "lucide-react";
import { STANDARD_PLANT_PARTS } from "@/lib/botanical-registry";

export interface PlantRecord {
  id: string;
  slug: string;
  commonName: string;
  scientificName: string;
  family: string;
  localNames: string;
  category: string;
  isPitahc: boolean;
  documentedParts: string[];
  imageUrl: string;
  botanicalSynonyms: string;
  traditionalUses?: string;
  traditionalPreparations?: string;
  safetyNotes?: string;
  pharmacopeiaStatus?: string;
  suggestedAuthenticationMethod?: string;
  sourceOrg?: string;
  sourceUrl?: string;
}

export interface PhytochemicalItem {
  id: number;
  plantId: string;
  compoundName: string;
  iupacName?: string | null;
  molecularFormula: string;
  molecularWeight: number | string | null;
  compoundClass: string;
  pubchemId?: string | number | null;
  smiles?: string | null;
  plantPartReported?: string | null;
  referencesData?: any;
  verificationStatus?: string;
}

export interface LiteratureItem {
  id: string | number;
  title: string;
  authors: string;
  publicationYear: number;
  journalOrPublisher: string;
  studyType?: string;
  doi?: string | null;
  pubmedId?: string | null;
  sourceUrl?: string | null;
  shortSummary?: string;
  plantOrIngredientStudied?: string;
  isExactProductStudied?: boolean | number;
  source_verified?: boolean | number;
  botanical_identity_verified?: boolean | number;
  verification_source?: string;
  evidence_scope?: string;
}

interface BotanicalStep1SectionProps {
  project: {
    id: number;
    title: string;
    plantName: string;
    plantScientificName?: string;
    plantId?: string;
  };
  allPlants: PlantRecord[];
  verifiedPlant: PlantRecord;
  plantData: any;
  onUpdatePlantData: (updated: any) => void;
  verifiedPhytochemicals: PhytochemicalItem[];
  studyCompoundNames: string[];
  onToggleStudyCompound: (compound: PhytochemicalItem) => Promise<void>;
  scientificLiterature: LiteratureItem[];
  linkedLiteratureIds: string[];
  onToggleLiteratureReference: (ref: LiteratureItem) => Promise<void>;
  isSaving: boolean;
  onSave: () => Promise<void>;
  onSelectPlant: (plant: PlantRecord) => Promise<void>;
  onRefreshData?: () => void;
}

export default function BotanicalStep1Section({
  project,
  allPlants = [],
  verifiedPlant,
  plantData,
  onUpdatePlantData,
  verifiedPhytochemicals = [],
  studyCompoundNames = [],
  onToggleStudyCompound,
  scientificLiterature = [],
  linkedLiteratureIds = [],
  onToggleLiteratureReference,
  onSelectPlant,
}: BotanicalStep1SectionProps) {
  // ---------------------------------------------------------------------------
  // 1. Plant Selection Dropdown State
  // ---------------------------------------------------------------------------
  const [plantDropdownOpen, setPlantDropdownOpen] = useState(false);
  const [plantSearchQuery, setPlantSearchQuery] = useState("");
  const plantDropdownRef = useRef<HTMLDivElement>(null);
  const plantInputRef = useRef<HTMLInputElement>(null);

  // Close plant dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (plantDropdownRef.current && !plantDropdownRef.current.contains(event.target as Node)) {
        setPlantDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredPlants = useMemo(() => {
    if (!plantSearchQuery.trim()) return allPlants;
    const q = plantSearchQuery.toLowerCase();
    return allPlants.filter(
      (p) =>
        p.commonName.toLowerCase().includes(q) ||
        p.scientificName.toLowerCase().includes(q) ||
        p.localNames?.toLowerCase().includes(q) ||
        p.family?.toLowerCase().includes(q)
    );
  }, [allPlants, plantSearchQuery]);

  const handleChoosePlant = (plant: PlantRecord) => {
    setPlantDropdownOpen(false);
    setPlantSearchQuery("");
    onSelectPlant(plant);
  };

  // ---------------------------------------------------------------------------
  // 2. Botanical Profile Modal State (For "View More")
  // ---------------------------------------------------------------------------
  const [showFullProfileModal, setShowFullProfileModal] = useState(false);

  // ---------------------------------------------------------------------------
  // 3. Experimental Plant Parts
  // ---------------------------------------------------------------------------
  const [customPartInput, setCustomPartInput] = useState("");
  const [showCustomPartField, setShowCustomPartField] = useState(false);

  const selectedPartsList: string[] = useMemo(() => {
    if (!plantData?.partsStudied) return [];
    return plantData.partsStudied
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
  }, [plantData?.partsStudied]);

  const togglePart = (part: string) => {
    let updated: string[];
    if (selectedPartsList.includes(part)) {
      updated = selectedPartsList.filter((p: string) => p !== part);
    } else {
      updated = [...selectedPartsList, part];
    }
    onUpdatePlantData({
      ...plantData,
      partsStudied: updated.join(", "),
    });
  };

  const addCustomPart = () => {
    const clean = customPartInput.trim();
    if (!clean) return;
    if (!selectedPartsList.includes(clean)) {
      const updated = [...selectedPartsList, clean];
      onUpdatePlantData({
        ...plantData,
        partsStudied: updated.join(", "),
      });
    }
    setCustomPartInput("");
    setShowCustomPartField(false);
  };

  // ---------------------------------------------------------------------------
  // 4. Phytochemicals Search/Filter & Detail Modal
  // ---------------------------------------------------------------------------
  const [phytoSearch, setPhytoSearch] = useState("");
  const [phytoClassFilter, setPhytoClassFilter] = useState("ALL");
  const [selectedPhytoModal, setSelectedPhytoModal] = useState<PhytochemicalItem | null>(null);
  const [copiedSmiles, setCopiedSmiles] = useState<string | null>(null);

  const phytoClasses = useMemo(() => {
    const classes = new Set<string>();
    verifiedPhytochemicals.forEach((c) => {
      if (c.compoundClass) classes.add(c.compoundClass);
    });
    return Array.from(classes).sort();
  }, [verifiedPhytochemicals]);

  const filteredPhytochemicals = useMemo(() => {
    return verifiedPhytochemicals.filter((comp) => {
      const matchesSearch =
        !phytoSearch.trim() ||
        comp.compoundName.toLowerCase().includes(phytoSearch.toLowerCase()) ||
        comp.molecularFormula.toLowerCase().includes(phytoSearch.toLowerCase()) ||
        (comp.compoundClass && comp.compoundClass.toLowerCase().includes(phytoSearch.toLowerCase()));
      const matchesClass = phytoClassFilter === "ALL" || comp.compoundClass === phytoClassFilter;
      return matchesSearch && matchesClass;
    });
  }, [verifiedPhytochemicals, phytoSearch, phytoClassFilter]);

  const handleCopySmiles = (smiles: string) => {
    navigator.clipboard.writeText(smiles);
    setCopiedSmiles(smiles);
    setTimeout(() => setCopiedSmiles(null), 2000);
  };

  // ---------------------------------------------------------------------------
  // 5. Scientific Literature Search/Filter & Abstract Modal
  // ---------------------------------------------------------------------------
  const [litSearch, setLitSearch] = useState("");
  const [selectedLitModal, setSelectedLitModal] = useState<LiteratureItem | null>(null);

  const filteredLiterature = useMemo(() => {
    if (!litSearch.trim()) return scientificLiterature;
    const q = litSearch.toLowerCase();
    return scientificLiterature.filter(
      (lit) =>
        lit.title.toLowerCase().includes(q) ||
        lit.authors.toLowerCase().includes(q) ||
        lit.journalOrPublisher.toLowerCase().includes(q)
    );
  }, [scientificLiterature, litSearch]);

  const traditionalUsesText = verifiedPlant?.traditionalUses || plantData?.traditionalUses || "Not documented";
  const traditionalPrepText = verifiedPlant?.traditionalPreparations || plantData?.ethnobotanicalNotes || "Not documented";

  return (
    <div className="space-y-4">
      {/* ===================================================================== */}
      {/* 1. PLANT IDENTITY CARD (COMPACT BUT IMMEDIATELY VISIBLE)               */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Plant Image */}
            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-2xs">
              {verifiedPlant?.imageUrl ? (
                <Image
                  src={verifiedPlant.imageUrl}
                  alt={verifiedPlant.commonName}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <Sprout className="w-7 h-7" />
                </div>
              )}
            </div>

            {/* Plant Taxonomy & Names */}
            <div className="min-w-0 space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                  {verifiedPlant?.commonName || project.plantName}
                </h2>
                {verifiedPlant?.isPitahc ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                    PITAHC Endorsed
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                    Verified Species
                  </span>
                )}
                {verifiedPlant?.family && verifiedPlant.family !== "Not documented" && (
                  <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {verifiedPlant.family}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 italic font-medium">
                {verifiedPlant?.scientificName || project.plantScientificName || "Binomial unassigned"}
              </p>

              {verifiedPlant?.localNames && verifiedPlant.localNames !== "Not documented" && (
                <p className="text-[11px] text-slate-500 truncate max-w-xl">
                  <span className="font-semibold text-slate-600">Local / Vernacular:</span> {verifiedPlant.localNames}
                </p>
              )}
            </div>
          </div>

          {/* Change Plant Search Dropdown Action */}
          <div className="relative shrink-0" ref={plantDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setPlantDropdownOpen(!plantDropdownOpen);
                setTimeout(() => plantInputRef.current?.focus(), 50);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:border-emerald-500 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span>Change Plant</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${plantDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {plantDropdownOpen && (
              <div className="absolute right-0 z-40 mt-1.5 w-80 sm:w-96 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in duration-100">
                <div className="p-2.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    ref={plantInputRef}
                    type="text"
                    value={plantSearchQuery}
                    onChange={(e) => setPlantSearchQuery(e.target.value)}
                    placeholder="Search plant by common, scientific, or local name..."
                    className="w-full bg-transparent border-0 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                  {plantSearchQuery && (
                    <button type="button" onClick={() => setPlantSearchQuery("")} className="text-slate-400 hover:text-slate-600">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {filteredPlants.length > 0 ? (
                    filteredPlants.map((plant) => {
                      const isCurrent = plant.id === verifiedPlant?.id;
                      return (
                        <div
                          key={plant.id}
                          onClick={() => handleChoosePlant(plant)}
                          className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                            isCurrent ? "bg-emerald-50 text-emerald-950 font-semibold" : "hover:bg-slate-50 text-slate-800"
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 truncate">{plant.commonName}</span>
                              {plant.isPitahc && (
                                <span className="text-[9px] font-semibold px-1 rounded bg-emerald-100 text-emerald-800">PITAHC</span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 italic truncate">{plant.scientificName}</p>
                          </div>
                          {isCurrent && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No plants matching &ldquo;{plantSearchQuery}&rdquo;
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. BOTANICAL PROFILE (DIRECTLY VISIBLE & COMPACT)                      */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-emerald-600" />
            <span>Botanical Profile &amp; Pharmacopeial Knowledge</span>
          </span>
          <span className="text-[11px] text-slate-400">
            Source: {verifiedPlant?.pharmacopeiaStatus || "Philippine Herbal Pharmacopeia"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Traditional Medicinal Uses */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Documented Traditional Uses
            </span>
            <p className="text-slate-700 leading-relaxed line-clamp-2">
              {traditionalUsesText}
            </p>
            {traditionalUsesText.length > 120 && (
              <button
                type="button"
                onClick={() => setShowFullProfileModal(true)}
                className="text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
              >
                View More →
              </button>
            )}
          </div>

          {/* Traditional Preparation Methods */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Traditional Preparation &amp; Extraction
            </span>
            <p className="text-slate-700 leading-relaxed line-clamp-2">
              {traditionalPrepText}
            </p>
            {traditionalPrepText.length > 120 && (
              <button
                type="button"
                onClick={() => setShowFullProfileModal(true)}
                className="text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
              >
                View More →
              </button>
            )}
          </div>
        </div>

        {/* Literature-Documented Plant Parts Preview */}
        {verifiedPlant?.documentedParts && verifiedPlant.documentedParts.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
            <span className="text-[11px] font-semibold text-slate-500">Documented Anatomical Parts:</span>
            <div className="flex flex-wrap gap-1">
              {verifiedPlant.documentedParts.map((part, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200"
                >
                  {part}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* BOTANICAL PROFILE DETAIL MODAL */}
      {showFullProfileModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-emerald-600" />
                  Botanical &amp; Ethnomedicinal Monograph: {verifiedPlant?.commonName || project.plantName}
                </h3>
                <p className="text-xs text-slate-500 italic">{verifiedPlant?.scientificName || project.plantScientificName}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowFullProfileModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Traditional Medicinal Indications
                </span>
                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{traditionalUsesText}</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Preparation &amp; Ethnobotanical Administration
                </span>
                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{traditionalPrepText}</p>
              </div>

              {verifiedPlant?.botanicalSynonyms && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Taxonomic Authority &amp; Botanical Synonyms
                  </span>
                  <p className="text-slate-800 italic">{verifiedPlant.botanicalSynonyms}</p>
                </div>
              )}

              {verifiedPlant?.sourceOrg && (
                <div className="text-[11px] text-slate-500">
                  <span>Authoritative Reference: </span>
                  <strong className="text-slate-700">{verifiedPlant.sourceOrg}</strong>
                  {verifiedPlant.sourceUrl && (
                    <a
                      href={verifiedPlant.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-emerald-700 hover:underline inline-flex items-center gap-0.5"
                    >
                      <span>View Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowFullProfileModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. EXPERIMENTAL PLANT PARTS (DIRECTLY SELECTABLE CHIPS)               */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <div>
            <span className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sprout className="w-3.5 h-3.5 text-emerald-600" />
              <span>Experimental Plant Parts Investigated</span>
            </span>
            <p className="text-[11px] text-slate-500">
              Select anatomical parts investigated in this experiment. Literature suggestions are indicated with a badge.
            </p>
          </div>

          <span className="text-xs font-semibold text-emerald-700 font-mono shrink-0">
            {selectedPartsList.length} part{selectedPartsList.length === 1 ? "" : "s"} selected
          </span>
        </div>

        {/* Standard Selectable Chips */}
        <div className="flex flex-wrap gap-1.5">
          {STANDARD_PLANT_PARTS.map((part) => {
            if (part === "Other") return null;
            const isSelected = selectedPartsList.includes(part);
            const isDocumented = verifiedPlant?.documentedParts?.includes(part);
            return (
              <button
                key={part}
                type="button"
                onClick={() => togglePart(part)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs font-semibold"
                    : "bg-white text-slate-700 hover:bg-slate-100 border-slate-300"
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5" />}
                <span>{part}</span>
                {isDocumented && !isSelected && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Literature
                  </span>
                )}
              </button>
            );
          })}

          {/* Any custom parts not in standard list */}
          {selectedPartsList
            .filter((p) => !STANDARD_PLANT_PARTS.includes(p as any))
            .map((customPart) => (
              <button
                key={customPart}
                type="button"
                onClick={() => togglePart(customPart)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white border border-emerald-600 shadow-2xs cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{customPart} (Custom)</span>
                <span className="ml-1 hover:text-rose-200">✕</span>
              </button>
            ))}

          {/* Toggle Custom Part Input */}
          {!showCustomPartField && (
            <button
              type="button"
              onClick={() => setShowCustomPartField(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-dashed border-slate-300 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-slate-500" />
              <span>Other Part...</span>
            </button>
          )}
        </div>

        {/* Custom Part Input Row */}
        {showCustomPartField && (
          <div className="flex items-center gap-2 pt-1 animate-in fade-in duration-150">
            <input
              type="text"
              value={customPartInput}
              onChange={(e) => setCustomPartInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomPart();
                }
              }}
              placeholder="e.g. Inflorescence, Petiole, Aril..."
              className="px-3 py-1 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-500 w-64 bg-white"
              autoFocus
            />
            <button
              type="button"
              onClick={addCustomPart}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
            >
              Add Part
            </button>
            <button
              type="button"
              onClick={() => setShowCustomPartField(false)}
              className="text-slate-400 hover:text-slate-600 text-xs px-1 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 4. PHYTOCHEMICAL METABOLITES (ALWAYS VISIBLE LIST ON PAGE)             */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <div>
            <span className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Dna className="w-3.5 h-3.5 text-emerald-600" />
              <span>Phytochemical Constituents</span>
            </span>
            <p className="text-[11px] text-slate-500">
              {verifiedPhytochemicals.length} cataloged secondary metabolites • <strong className="text-slate-700">{studyCompoundNames.length} selected</strong> for Section 2 (In-Silico Docking)
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search compounds..."
                value={phytoSearch}
                onChange={(e) => setPhytoSearch(e.target.value)}
                className="pl-7 pr-2 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 w-36 sm:w-48"
              />
            </div>

            {phytoClasses.length > 0 && (
              <select
                value={phytoClassFilter}
                onChange={(e) => setPhytoClassFilter(e.target.value)}
                className="px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-700"
              >
                <option value="ALL">All Classes</option>
                {phytoClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Visible Responsive Compound Cards Grid */}
        {filteredPhytochemicals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {filteredPhytochemicals.map((comp) => {
              const isSelected = studyCompoundNames.includes(comp.compoundName);
              return (
                <div
                  key={comp.id}
                  className={`p-3 rounded-xl border transition-all text-xs flex flex-col justify-between gap-2 ${
                    isSelected
                      ? "bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300/50 shadow-2xs"
                      : "bg-slate-50/60 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs truncate">{comp.compoundName}</span>
                        <span className="text-[10px] font-mono text-slate-600 px-1.5 py-0.2 rounded bg-white border border-slate-200">
                          {comp.molecularFormula}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                        <span>
                          MW: {typeof comp.molecularWeight === "number" ? comp.molecularWeight.toFixed(2) : comp.molecularWeight || "N/A"} g/mol
                        </span>
                        <span>•</span>
                        <span className="text-emerald-800 font-sans font-medium">{comp.compoundClass || "Metabolite"}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                        isSelected
                          ? "bg-emerald-600 text-white font-bold"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {isSelected ? "In Study" : "Available"}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPhytoModal(comp)}
                      className="text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
                    >
                      View Details
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleStudyCompound(comp)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                          : "bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-300"
                      }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      <span>{isSelected ? "Selected" : "Select"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
            No phytochemicals match filter criteria.
          </div>
        )}
      </div>

      {/* PHYTOCHEMICAL DETAILS MODAL */}
      {selectedPhytoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Dna className="w-4 h-4 text-emerald-600" />
                  {selectedPhytoModal.compoundName}
                </h3>
                <p className="text-xs text-slate-500">{selectedPhytoModal.compoundClass || "Bioactive Secondary Metabolite"}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPhytoModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Molecular Formula</span>
                <p className="font-mono font-bold text-slate-900 mt-0.5">{selectedPhytoModal.molecularFormula}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Molecular Weight</span>
                <p className="font-mono font-bold text-slate-900 mt-0.5">
                  {typeof selectedPhytoModal.molecularWeight === "number"
                    ? selectedPhytoModal.molecularWeight.toFixed(2)
                    : selectedPhytoModal.molecularWeight || "N/A"}{" "}
                  g/mol
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Chemical Class</span>
                <p className="font-medium text-slate-800 mt-0.5">{selectedPhytoModal.compoundClass || "Secondary Metabolite"}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PubChem Compound ID</span>
                {selectedPhytoModal.pubchemId ? (
                  <a
                    href={`https://pubchem.ncbi.nlm.nih.gov/compound/${selectedPhytoModal.pubchemId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <span>CID: {selectedPhytoModal.pubchemId}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <p className="text-slate-400 mt-0.5">Unassigned</p>
                )}
              </div>
            </div>

            {selectedPhytoModal.iupacName && (
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">IUPAC Systematic Name</span>
                <p className="font-mono text-[11px] text-slate-800 break-words mt-0.5">{selectedPhytoModal.iupacName}</p>
              </div>
            )}

            {selectedPhytoModal.smiles && (
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Canonical SMILES</span>
                  <button
                    type="button"
                    onClick={() => handleCopySmiles(selectedPhytoModal.smiles!)}
                    className="text-[10px] font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedSmiles === selectedPhytoModal.smiles ? "Copied!" : "Copy SMILES"}</span>
                  </button>
                </div>
                <p className="font-mono text-[10px] text-slate-700 break-all bg-white p-2 rounded border border-slate-200">
                  {selectedPhytoModal.smiles}
                </p>
              </div>
            )}

            {selectedPhytoModal.plantPartReported && (
              <div className="text-xs text-slate-500">
                <span>Reported in plant part: </span>
                <strong className="text-slate-700">{selectedPhytoModal.plantPartReported}</strong>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPhytoModal(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. SCIENTIFIC LITERATURE (ALWAYS VISIBLE LIST ON PAGE)                 */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <div>
            <span className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Scientific Literature &amp; Pharmacopeial Monographs</span>
            </span>
            <p className="text-[11px] text-slate-500">
              {scientificLiterature.length} references available supporting this botanical dossier
            </p>
          </div>

          <div className="relative">
            <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search references..."
              value={litSearch}
              onChange={(e) => setLitSearch(e.target.value)}
              className="pl-7 pr-2 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500 w-44 sm:w-56"
            />
          </div>
        </div>

        {/* Visible Reference Cards */}
        {filteredLiterature.length > 0 ? (
          <div className="space-y-2.5">
            {filteredLiterature.map((lit) => {
              return (
                <div
                  key={lit.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all text-xs space-y-2.5 shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <h4
                        className="font-bold text-slate-900 text-xs leading-snug line-clamp-2"
                        title={lit.title}
                      >
                        {lit.title}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        <span className="font-medium text-slate-700">{lit.authors}</span> • {lit.journalOrPublisher} ({lit.publicationYear})
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {lit.doi && (
                        <a
                          href={`https://doi.org/${lit.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-medium text-indigo-600 hover:underline inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-indigo-50/60 border border-indigo-200/60"
                        >
                          <span>DOI</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {lit.pubmedId && (
                        <a
                          href={`https://pubmed.ncbi.nlm.nih.gov/${lit.pubmedId}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-medium text-blue-600 hover:underline inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-blue-50/60 border border-blue-200/60"
                        >
                          <span>PubMed</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                    <div className="flex items-center gap-2">
                      {lit.studyType && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                          {lit.studyType}
                        </span>
                      )}
                      {lit.verification_source && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {lit.verification_source}
                        </span>
                      )}
                    </div>

                    {lit.shortSummary && (
                      <button
                        type="button"
                        onClick={() => setSelectedLitModal(lit)}
                        className="text-[11px] font-semibold text-indigo-700 hover:underline cursor-pointer"
                      >
                        View Abstract &amp; Findings →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
            No scientific literature references found matching &ldquo;{litSearch}&rdquo;
          </div>
        )}
      </div>

      {/* LITERATURE ABSTRACT & DETAILS MODAL */}
      {selectedLitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="space-y-1 pr-3">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                  {selectedLitModal.title}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedLitModal.authors} • {selectedLitModal.journalOrPublisher} ({selectedLitModal.publicationYear})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLitModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Study Abstract &amp; Findings
                </span>
                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {selectedLitModal.shortSummary || "No detailed abstract provided in citation record."}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {selectedLitModal.studyType && (
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Study Type</span>
                    <p className="font-medium text-slate-800">{selectedLitModal.studyType}</p>
                  </div>
                )}
                {selectedLitModal.verification_source && (
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Source Scope</span>
                    <p className="font-medium text-slate-800">{selectedLitModal.verification_source}</p>
                  </div>
                )}
                {selectedLitModal.plantOrIngredientStudied && (
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Botanical Focus</span>
                    <p className="font-medium text-slate-800">{selectedLitModal.plantOrIngredientStudied}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-1">
                {selectedLitModal.doi && (
                  <a
                    href={`https://doi.org/${selectedLitModal.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Open DOI Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {selectedLitModal.pubmedId && (
                  <a
                    href={`https://pubmed.ncbi.nlm.nih.gov/${selectedLitModal.pubmedId}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    <span>View on PubMed</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLitModal(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
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
