"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
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
  Info,
  Leaf,
  ChevronRight,
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

const easeOut = [0.22, 1, 0.36, 1] as const;
const LIT_PAGE_SIZE = 6;

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
  onSelectPlant,
}: BotanicalStep1SectionProps) {
  const [plantDropdownOpen, setPlantDropdownOpen] = useState(false);
  const [plantSearchQuery, setPlantSearchQuery] = useState("");
  const plantDropdownRef = useRef<HTMLDivElement>(null);
  const plantInputRef = useRef<HTMLInputElement>(null);

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

  const [showFullProfileModal, setShowFullProfileModal] = useState(false);
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
        (comp.compoundClass &&
          comp.compoundClass.toLowerCase().includes(phytoSearch.toLowerCase()));
      const matchesClass = phytoClassFilter === "ALL" || comp.compoundClass === phytoClassFilter;
      return matchesSearch && matchesClass;
    });
  }, [verifiedPhytochemicals, phytoSearch, phytoClassFilter]);

  const handleCopySmiles = (smiles: string) => {
    navigator.clipboard.writeText(smiles);
    setCopiedSmiles(smiles);
    setTimeout(() => setCopiedSmiles(null), 2000);
  };

  const [litSearch, setLitSearch] = useState("");
  const [selectedLitModal, setSelectedLitModal] = useState<LiteratureItem | null>(null);
  const [litVisibleCount, setLitVisibleCount] = useState(LIT_PAGE_SIZE);

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

  useEffect(() => {
    setLitVisibleCount(LIT_PAGE_SIZE);
  }, [litSearch]);

  const visibleLiterature = filteredLiterature.slice(0, litVisibleCount);

  const traditionalUsesText =
    verifiedPlant?.traditionalUses || plantData?.traditionalUses || "Not documented";
  const traditionalPrepText =
    verifiedPlant?.traditionalPreparations ||
    plantData?.ethnobotanicalNotes ||
    "Not documented";

  const jumpLinks = [
    { id: "identity", label: "Identity" },
    { id: "profile", label: "Profile" },
    { id: "parts", label: "Plant Parts" },
    { id: "compounds", label: "Compounds" },
    { id: "literature", label: "Literature" },
  ];

  const scrollTo = (id: string) => {
    document.getElementById(`botanical-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-4">
      {/* Jump nav */}
      <div className="sticky top-0 z-10 -mx-1 flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-[#d7e4dc]/90 bg-white/95 px-2.5 py-2 shadow-[0_1px_2px_rgba(15,44,32,0.04)] backdrop-blur-sm scrollbar-none">
        {jumpLinks.map((link) => (
          <button
            key={link.id}
            type="button"
            onClick={() => scrollTo(link.id)}
            className="shrink-0 rounded-xl border border-[#e8f0eb] bg-[#f7faf8] px-2.5 py-1.5 text-[11px] font-semibold text-[#52645d] transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-900"
          >
            {link.label}
          </button>
        ))}
        <div className="ml-auto hidden shrink-0 items-center gap-2 px-1 text-[11px] text-[#8aa094] sm:flex">
          <span className="font-semibold text-emerald-800">{studyCompoundNames.length}</span>
          compounds selected
          <span className="text-[#d7e4dc]">·</span>
          <span className="font-semibold text-teal-800">{selectedPartsList.length}</span>
          parts
        </div>
      </div>

      {/* Plant identity */}
      <motion.section
        id="botanical-identity"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: easeOut }}
        className="relative overflow-hidden rounded-2xl border border-[#d7e4dc]/90 bg-[linear-gradient(165deg,#ffffff_0%,#f8fbf9_100%)] p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-5"
      >
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-emerald-600 via-teal-400 to-cyan-300" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[#d7e4dc] bg-[#edf5f0] shadow-sm">
              {verifiedPlant?.imageUrl ? (
                <Image
                  src={verifiedPlant.imageUrl}
                  alt={verifiedPlant.commonName}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-emerald-700">
                  <Sprout className="h-7 w-7" />
                </div>
              )}
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="truncate text-base font-semibold tracking-tight text-[#0f2c20] sm:text-lg">
                  {verifiedPlant?.commonName || project.plantName}
                </h2>
                {verifiedPlant?.isPitahc ? (
                  <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                    PITAHC Endorsed
                  </span>
                ) : (
                  <span className="rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-900">
                    Verified Species
                  </span>
                )}
                {verifiedPlant?.family && verifiedPlant.family !== "Not documented" && (
                  <span className="rounded-md border border-[#d7e4dc] bg-white px-2 py-0.5 font-mono text-[10px] font-semibold text-[#5f7468]">
                    {verifiedPlant.family}
                  </span>
                )}
              </div>
              <p className="text-xs font-medium italic text-[#6d7f76]">
                {verifiedPlant?.scientificName ||
                  project.plantScientificName ||
                  "Binomial unassigned"}
              </p>
              {verifiedPlant?.localNames && verifiedPlant.localNames !== "Not documented" && (
                <p className="line-clamp-1 text-[11px] text-[#8aa094]">
                  <span className="font-semibold text-[#6d7f76]">Local:</span>{" "}
                  {verifiedPlant.localNames}
                </p>
              )}
            </div>
          </div>

          <div className="relative shrink-0" ref={plantDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setPlantDropdownOpen(!plantDropdownOpen);
                setTimeout(() => plantInputRef.current?.focus(), 50);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#d7e4dc] bg-white px-3 py-2 text-xs font-semibold text-[#0f2c20] shadow-sm transition hover:border-emerald-400 hover:bg-emerald-50"
            >
              <Search className="h-3.5 w-3.5 text-emerald-700" />
              Change Plant
              <ChevronDown
                className={`h-3.5 w-3.5 text-[#8aa094] transition ${plantDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {plantDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute right-0 z-40 mt-1.5 w-80 overflow-hidden rounded-2xl border border-[#d7e4dc] bg-white shadow-xl sm:w-96"
                >
                  <div className="flex items-center gap-2 border-b border-[#e8f0eb] bg-[#f7faf8] p-2.5">
                    <Search className="h-3.5 w-3.5 shrink-0 text-[#8aa094]" />
                    <input
                      ref={plantInputRef}
                      type="text"
                      value={plantSearchQuery}
                      onChange={(e) => setPlantSearchQuery(e.target.value)}
                      placeholder="Search common, scientific, or local name..."
                      className="w-full border-0 bg-transparent text-xs text-[#0f2c20] outline-none placeholder:text-[#8aa094]"
                    />
                    {plantSearchQuery && (
                      <button type="button" onClick={() => setPlantSearchQuery("")}>
                        <X className="h-3 w-3 text-[#8aa094]" />
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 divide-y divide-[#eef4f0] overflow-y-auto text-xs">
                    {filteredPlants.length > 0 ? (
                      filteredPlants.map((plant) => {
                        const isCurrent = plant.id === verifiedPlant?.id;
                        return (
                          <button
                            key={plant.id}
                            type="button"
                            onClick={() => handleChoosePlant(plant)}
                            className={`flex w-full items-center justify-between p-2.5 text-left transition ${
                              isCurrent
                                ? "bg-emerald-50 text-emerald-950"
                                : "text-[#0f2c20] hover:bg-[#f4f8f5]"
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate font-semibold">{plant.commonName}</span>
                                {plant.isPitahc && (
                                  <span className="rounded bg-emerald-100 px-1 text-[9px] font-bold text-emerald-800">
                                    PITAHC
                                  </span>
                                )}
                              </div>
                              <p className="truncate text-[11px] italic text-[#8aa094]">
                                {plant.scientificName}
                              </p>
                            </div>
                            {isCurrent && <Check className="h-4 w-4 shrink-0 text-emerald-600" />}
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-[#8aa094]">
                        No plants matching &ldquo;{plantSearchQuery}&rdquo;
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.section>

      {/* Botanical profile */}
      <motion.section
        id="botanical-profile"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.04, ease: easeOut }}
        className="rounded-2xl border border-[#d7e4dc]/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-5"
      >
        <div className="mb-3 flex flex-col gap-1 border-b border-[#e8f0eb] pb-2.5 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#52645d]">
            <Info className="h-3.5 w-3.5 text-emerald-700" />
            Botanical Profile &amp; Pharmacopeial Knowledge
          </h3>
          <span className="text-[10px] text-[#8aa094]">
            Source: {verifiedPlant?.pharmacopeiaStatus || "Philippine Herbal Pharmacopeia"}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {[
            { title: "Documented Traditional Uses", body: traditionalUsesText },
            { title: "Traditional Preparation & Extraction", body: traditionalPrepText },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-xl border border-[#e8f0eb] bg-[linear-gradient(145deg,#f4f8f5_0%,#ffffff_55%)] p-3.5"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8aa094]">
                {card.title}
              </p>
              <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-[#52645d]">{card.body}</p>
              {card.body.length > 140 && (
                <button
                  type="button"
                  onClick={() => setShowFullProfileModal(true)}
                  className="mt-2 inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-800 hover:underline"
                >
                  View More
                  <ChevronRight className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {verifiedPlant?.documentedParts && verifiedPlant.documentedParts.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-[#6d7f76]">Documented parts:</span>
            {verifiedPlant.documentedParts.map((part) => (
              <span
                key={part}
                className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-900"
              >
                {part}
              </span>
            ))}
          </div>
        )}
      </motion.section>

      {/* Plant parts */}
      <motion.section
        id="botanical-parts"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08, ease: easeOut }}
        className="rounded-2xl border border-[#d7e4dc]/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-5"
      >
        <div className="mb-3 flex flex-col gap-2 border-b border-[#e8f0eb] pb-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#52645d]">
              <Leaf className="h-3.5 w-3.5 text-emerald-700" />
              Experimental Plant Parts
            </h3>
            <p className="mt-0.5 text-[11px] text-[#8aa094]">
              Select anatomical parts investigated. Literature-suggested parts show a badge.
            </p>
          </div>
          <span className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-mono text-[11px] font-bold text-emerald-900">
            {selectedPartsList.length} selected
          </span>
        </div>

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
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                  isSelected
                    ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                    : "border-[#d7e4dc] bg-white text-[#52645d] hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-900"
                }`}
              >
                {isSelected && <Check className="h-3.5 w-3.5" />}
                {part}
                {isDocumented && !isSelected && (
                  <span className="rounded bg-emerald-50 px-1 text-[9px] font-bold text-emerald-700">
                    Lit
                  </span>
                )}
              </button>
            );
          })}

          {selectedPartsList
            .filter((p) => !STANDARD_PLANT_PARTS.includes(p as any))
            .map((customPart) => (
              <button
                key={customPart}
                type="button"
                onClick={() => togglePart(customPart)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
              >
                <Check className="h-3.5 w-3.5" />
                {customPart}
                <X className="h-3 w-3 opacity-80" />
              </button>
            ))}

          {!showCustomPartField && (
            <button
              type="button"
              onClick={() => setShowCustomPartField(true)}
              className="inline-flex items-center gap-1 rounded-xl border border-dashed border-[#c5d4cb] bg-white px-3 py-1.5 text-xs font-semibold text-[#6d7f76] hover:border-emerald-400 hover:text-emerald-800"
            >
              <Plus className="h-3.5 w-3.5" />
              Other Part...
            </button>
          )}
        </div>

        {showCustomPartField && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
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
              placeholder="e.g. Inflorescence, Petiole..."
              className="h-9 w-64 rounded-xl border border-[#d5e3da] bg-[#fbfdfb] px-3 text-xs outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
              autoFocus
            />
            <button
              type="button"
              onClick={addCustomPart}
              className="rounded-xl bg-[#0f2c20] px-3 py-2 text-xs font-semibold text-white hover:bg-[#164533]"
            >
              Add Part
            </button>
            <button
              type="button"
              onClick={() => setShowCustomPartField(false)}
              className="text-xs font-medium text-[#8aa094] hover:text-[#0f2c20]"
            >
              Cancel
            </button>
          </div>
        )}
      </motion.section>

      {/* Phytochemicals */}
      <motion.section
        id="botanical-compounds"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.12, ease: easeOut }}
        className="rounded-2xl border border-[#d7e4dc]/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-5"
      >
        <div className="mb-3 flex flex-col gap-3 border-b border-[#e8f0eb] pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#52645d]">
              <Dna className="h-3.5 w-3.5 text-teal-700" />
              Phytochemical Constituents
            </h3>
            <p className="mt-0.5 text-[11px] text-[#8aa094]">
              {verifiedPhytochemicals.length} cataloged ·{" "}
              <span className="font-semibold text-teal-800">
                {studyCompoundNames.length} selected
              </span>{" "}
              for Section 2 docking
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8aa094]" />
              <input
                type="text"
                placeholder="Search compounds..."
                value={phytoSearch}
                onChange={(e) => setPhytoSearch(e.target.value)}
                className="h-9 w-40 rounded-xl border border-[#d5e3da] bg-[#fbfdfb] pl-8 pr-2 text-xs outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 sm:w-48"
              />
            </div>
            {phytoClasses.length > 0 && (
              <select
                value={phytoClassFilter}
                onChange={(e) => setPhytoClassFilter(e.target.value)}
                className="h-9 rounded-xl border border-[#d5e3da] bg-white px-2 text-xs text-[#52645d] outline-none focus:border-emerald-600"
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

        {filteredPhytochemicals.length > 0 ? (
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
            {filteredPhytochemicals.map((comp, index) => {
              const isSelected = studyCompoundNames.includes(comp.compoundName);
              return (
                <motion.div
                  key={comp.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.2) }}
                  className={`flex flex-col justify-between gap-2.5 rounded-2xl border p-3.5 transition ${
                    isSelected
                      ? "border-teal-300 bg-[linear-gradient(165deg,#f0fdfa_0%,#ffffff_70%)] shadow-[0_0_0_1px_rgba(45,212,191,0.25)]"
                      : "border-[#e8f0eb] bg-[#fbfdfb] hover:border-emerald-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-xs font-semibold text-[#0f2c20]">
                          {comp.compoundName}
                        </span>
                        <span className="rounded border border-[#d7e4dc] bg-white px-1.5 py-0.5 font-mono text-[10px] text-[#5f7468]">
                          {comp.molecularFormula}
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-[10px] text-[#8aa094]">
                        MW:{" "}
                        {typeof comp.molecularWeight === "number"
                          ? comp.molecularWeight.toFixed(2)
                          : comp.molecularWeight || "N/A"}{" "}
                        ·{" "}
                        <span className="font-sans font-semibold text-teal-800">
                          {comp.compoundClass || "Metabolite"}
                        </span>
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        isSelected
                          ? "bg-teal-600 text-white"
                          : "bg-[#edf5f0] text-[#6d7f76]"
                      }`}
                    >
                      {isSelected ? "In Study" : "Available"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-[#e8f0eb] pt-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedPhytoModal(comp)}
                      className="text-[11px] font-semibold text-[#6d7f76] hover:text-[#0f2c20]"
                    >
                      View Details
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleStudyCompound(comp)}
                      className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition ${
                        isSelected
                          ? "bg-teal-700 text-white hover:bg-teal-600"
                          : "border border-[#d7e4dc] bg-white text-[#0f2c20] hover:border-teal-400 hover:bg-teal-50"
                      }`}
                    >
                      {isSelected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                      {isSelected ? "Selected" : "Select"}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#d7e4dc] bg-[#f7faf8] p-8 text-center text-xs text-[#8aa094]">
            No phytochemicals match filter criteria.
          </div>
        )}
      </motion.section>

      {/* Literature */}
      <motion.section
        id="botanical-literature"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.16, ease: easeOut }}
        className="rounded-2xl border border-[#d7e4dc]/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-5"
      >
        <div className="mb-3 flex flex-col gap-3 border-b border-[#e8f0eb] pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#52645d]">
              <BookOpen className="h-3.5 w-3.5 text-emerald-700" />
              Scientific Literature
            </h3>
            <p className="mt-0.5 text-[11px] text-[#8aa094]">
              {scientificLiterature.length} references · showing {visibleLiterature.length} of{" "}
              {filteredLiterature.length}
            </p>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8aa094]" />
            <input
              type="text"
              placeholder="Search references..."
              value={litSearch}
              onChange={(e) => setLitSearch(e.target.value)}
              className="h-9 w-48 rounded-xl border border-[#d5e3da] bg-[#fbfdfb] pl-8 pr-2 text-xs outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 sm:w-56"
            />
          </div>
        </div>

        {visibleLiterature.length > 0 ? (
          <div className="space-y-2">
            {visibleLiterature.map((lit, index) => (
              <motion.article
                key={lit.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: Math.min(index * 0.02, 0.15) }}
                className="rounded-xl border border-[#e8f0eb] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdfb_100%)] p-3.5 transition hover:border-emerald-300"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h4 className="line-clamp-2 text-xs font-semibold leading-snug text-[#0f2c20]">
                      {lit.title}
                    </h4>
                    <p className="mt-1 text-[11px] text-[#8aa094]">
                      <span className="font-medium text-[#52645d]">{lit.authors}</span> ·{" "}
                      {lit.journalOrPublisher} ({lit.publicationYear})
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {lit.doi && (
                      <a
                        href={`https://doi.org/${lit.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800"
                      >
                        DOI
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                    {lit.pubmedId && (
                      <a
                        href={`https://pubmed.ncbi.nlm.nih.gov/${lit.pubmedId}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-800"
                      >
                        PubMed
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-[#eef4f0] pt-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {lit.studyType && (
                      <span className="rounded-md border border-[#d7e4dc] bg-white px-2 py-0.5 text-[10px] font-medium text-[#52645d]">
                        {lit.studyType}
                      </span>
                    )}
                    {lit.verification_source && (
                      <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                        {lit.verification_source}
                      </span>
                    )}
                  </div>
                  {lit.shortSummary && (
                    <button
                      type="button"
                      onClick={() => setSelectedLitModal(lit)}
                      className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-800 hover:underline"
                    >
                      View Abstract
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </motion.article>
            ))}

            {litVisibleCount < filteredLiterature.length && (
              <button
                type="button"
                onClick={() => setLitVisibleCount((n) => n + LIT_PAGE_SIZE)}
                className="w-full rounded-xl border border-[#d7e4dc] bg-[#f7faf8] py-2.5 text-xs font-semibold text-[#0f2c20] transition hover:border-emerald-400 hover:bg-emerald-50"
              >
                Show more references ({filteredLiterature.length - litVisibleCount} remaining)
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#d7e4dc] bg-[#f7faf8] p-8 text-center text-xs text-[#8aa094]">
            No references matching &ldquo;{litSearch}&rdquo;
          </div>
        )}
      </motion.section>

      {/* Profile modal */}
      <AnimatePresence>
        {showFullProfileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f2c20]/40 p-4 backdrop-blur-sm"
            onClick={() => setShowFullProfileModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl space-y-4 rounded-2xl border border-[#d7e4dc] bg-white p-5 shadow-2xl"
            >
              <div className="flex items-start justify-between border-b border-[#e8f0eb] pb-3">
                <div>
                  <h3 className="flex items-center gap-2 text-base font-semibold text-[#0f2c20]">
                    <Sprout className="h-4 w-4 text-emerald-700" />
                    {verifiedPlant?.commonName || project.plantName}
                  </h3>
                  <p className="text-xs italic text-[#8aa094]">
                    {verifiedPlant?.scientificName || project.plantScientificName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFullProfileModal(false)}
                  className="rounded-lg p-1 text-[#8aa094] hover:bg-[#edf5f0] hover:text-[#0f2c20]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3 text-xs">
                <div className="rounded-xl border border-[#e8f0eb] bg-[#f7faf8] p-3">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                    Traditional Medicinal Indications
                  </p>
                  <p className="whitespace-pre-wrap leading-relaxed text-[#52645d]">
                    {traditionalUsesText}
                  </p>
                </div>
                <div className="rounded-xl border border-[#e8f0eb] bg-[#f7faf8] p-3">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                    Preparation &amp; Ethnobotanical Administration
                  </p>
                  <p className="whitespace-pre-wrap leading-relaxed text-[#52645d]">
                    {traditionalPrepText}
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowFullProfileModal(false)}
                  className="rounded-xl bg-[#edf5f0] px-4 py-2 text-xs font-semibold text-[#0f2c20] hover:bg-[#e2eee7]"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phyto modal */}
      <AnimatePresence>
        {selectedPhytoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f2c20]/40 p-4 backdrop-blur-sm"
            onClick={() => setSelectedPhytoModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg space-y-4 rounded-2xl border border-[#d7e4dc] bg-white p-5 shadow-2xl"
            >
              <div className="flex items-start justify-between border-b border-[#e8f0eb] pb-3">
                <div>
                  <h3 className="flex items-center gap-2 text-base font-semibold text-[#0f2c20]">
                    <Dna className="h-4 w-4 text-teal-700" />
                    {selectedPhytoModal.compoundName}
                  </h3>
                  <p className="text-xs text-[#8aa094]">
                    {selectedPhytoModal.compoundClass || "Bioactive Secondary Metabolite"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPhytoModal(null)}
                  className="rounded-lg p-1 text-[#8aa094] hover:bg-[#edf5f0]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-xl border border-[#e8f0eb] bg-[#f7faf8] p-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                    Formula
                  </p>
                  <p className="mt-0.5 font-mono font-bold text-[#0f2c20]">
                    {selectedPhytoModal.molecularFormula}
                  </p>
                </div>
                <div className="rounded-xl border border-[#e8f0eb] bg-[#f7faf8] p-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                    Molecular Weight
                  </p>
                  <p className="mt-0.5 font-mono font-bold text-[#0f2c20]">
                    {typeof selectedPhytoModal.molecularWeight === "number"
                      ? selectedPhytoModal.molecularWeight.toFixed(2)
                      : selectedPhytoModal.molecularWeight || "N/A"}{" "}
                    g/mol
                  </p>
                </div>
              </div>
              {selectedPhytoModal.smiles && (
                <div className="rounded-xl border border-[#e8f0eb] bg-[#f7faf8] p-2.5 text-xs">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                      SMILES
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopySmiles(selectedPhytoModal.smiles!)}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800"
                    >
                      <Copy className="h-3 w-3" />
                      {copiedSmiles === selectedPhytoModal.smiles ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <p className="break-all rounded-lg border border-[#e8f0eb] bg-white p-2 font-mono text-[10px] text-[#52645d]">
                    {selectedPhytoModal.smiles}
                  </p>
                </div>
              )}
              {selectedPhytoModal.pubchemId && (
                <a
                  href={`https://pubchem.ncbi.nlm.nih.gov/compound/${selectedPhytoModal.pubchemId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 hover:underline"
                >
                  PubChem CID: {selectedPhytoModal.pubchemId}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedPhytoModal(null)}
                  className="rounded-xl bg-[#edf5f0] px-4 py-2 text-xs font-semibold text-[#0f2c20]"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Literature modal */}
      <AnimatePresence>
        {selectedLitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f2c20]/40 p-4 backdrop-blur-sm"
            onClick={() => setSelectedLitModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl space-y-4 rounded-2xl border border-[#d7e4dc] bg-white p-5 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3 border-b border-[#e8f0eb] pb-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold leading-snug text-[#0f2c20] sm:text-base">
                    {selectedLitModal.title}
                  </h3>
                  <p className="mt-1 text-xs text-[#8aa094]">
                    {selectedLitModal.authors} · {selectedLitModal.journalOrPublisher} (
                    {selectedLitModal.publicationYear})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLitModal(null)}
                  className="shrink-0 rounded-lg p-1 text-[#8aa094] hover:bg-[#edf5f0]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="rounded-xl border border-[#e8f0eb] bg-[#f7faf8] p-3.5 text-xs">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                  Study Abstract &amp; Findings
                </p>
                <p className="whitespace-pre-wrap leading-relaxed text-[#52645d]">
                  {selectedLitModal.shortSummary ||
                    "No detailed abstract provided in citation record."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {selectedLitModal.doi && (
                  <a
                    href={`https://doi.org/${selectedLitModal.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:underline"
                  >
                    Open DOI
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {selectedLitModal.pubmedId && (
                  <a
                    href={`https://pubmed.ncbi.nlm.nih.gov/${selectedLitModal.pubmedId}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 hover:underline"
                  >
                    View on PubMed
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedLitModal(null)}
                  className="rounded-xl bg-[#edf5f0] px-4 py-2 text-xs font-semibold text-[#0f2c20]"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
