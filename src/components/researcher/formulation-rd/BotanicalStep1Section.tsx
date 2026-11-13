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
  /** Reviewer / read-only mode: hide plant change, part toggles, study compound toggles */
  readOnly?: boolean;
}

const easeOut = [0.22, 1, 0.36, 1] as const;
const LIT_PAGE_SIZE = 6;

type ProfileTab = "uses" | "preparation" | "parts" | "source";

function truncate(text: string, max = 160) {
  if (!text || text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
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
  onSelectPlant,
  readOnly = false,
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
    if (readOnly) return;
    setPlantDropdownOpen(false);
    setPlantSearchQuery("");
    onSelectPlant(plant);
  };

  const [profileTab, setProfileTab] = useState<ProfileTab>("uses");
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
    if (readOnly) return;
    const updated = selectedPartsList.includes(part)
      ? selectedPartsList.filter((p: string) => p !== part)
      : [...selectedPartsList, part];
    onUpdatePlantData({
      ...plantData,
      partsStudied: updated.join(", "),
    });
  };

  const addCustomPart = () => {
    if (readOnly) return;
    const clean = customPartInput.trim();
    if (!clean) return;
    if (!selectedPartsList.includes(clean)) {
      onUpdatePlantData({
        ...plantData,
        partsStudied: [...selectedPartsList, clean].join(", "),
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
  const [expandedLitId, setExpandedLitId] = useState<string | number | null>(null);

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
  const sourceText =
    verifiedPlant?.pharmacopeiaStatus ||
    verifiedPlant?.sourceOrg ||
    "Philippine Herbal Pharmacopeia";

  const profileTabs: { id: ProfileTab; label: string }[] = [
    { id: "uses", label: "Traditional Uses" },
    { id: "preparation", label: "Preparation" },
    { id: "parts", label: "Documented Parts" },
    { id: "source", label: "Source" },
  ];

  const activeProfileBody =
    profileTab === "uses"
      ? traditionalUsesText
      : profileTab === "preparation"
        ? traditionalPrepText
        : profileTab === "source"
          ? sourceText
          : null;

  return (
    <div className="space-y-4">
      {/* Plant identity */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: easeOut }}
        className="relative overflow-hidden rounded-2xl border border-[#d7e4dc]/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-5"
      >
        <div className="absolute inset-y-0 left-0 w-1 bg-emerald-600" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-[#d7e4dc] bg-[#edf5f0] shadow-sm sm:h-24 sm:w-24">
              {verifiedPlant?.imageUrl ? (
                <Image
                  src={verifiedPlant.imageUrl}
                  alt={verifiedPlant.commonName}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-emerald-700">
                  <Sprout className="h-8 w-8" />
                </div>
              )}
            </div>
            <div className="min-w-0 space-y-1.5">
              <h2 className="text-xl font-bold tracking-tight text-[#0f2c20] sm:text-2xl">
                {verifiedPlant?.commonName || project.plantName}
              </h2>
              <p className="text-sm italic text-[#6d7f76]">
                {verifiedPlant?.scientificName ||
                  project.plantScientificName ||
                  "Binomial unassigned"}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                {verifiedPlant?.isPitahc ? (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-bold text-emerald-900">
                    PITAHC Endorsed
                  </span>
                ) : (
                  <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 font-bold text-teal-900">
                    Verified Species
                  </span>
                )}
                {verifiedPlant?.family && verifiedPlant.family !== "Not documented" && (
                  <span className="rounded-full border border-[#d7e4dc] bg-[#f7faf8] px-2 py-0.5 font-semibold text-[#5f7468]">
                    {verifiedPlant.family}
                  </span>
                )}
              </div>
              {verifiedPlant?.localNames && verifiedPlant.localNames !== "Not documented" && (
                <p className="line-clamp-1 text-[11px] text-[#8aa094]">
                  Local names: {verifiedPlant.localNames}
                </p>
              )}
            </div>
          </div>

          {!readOnly && (
          <div className="relative shrink-0" ref={plantDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setPlantDropdownOpen(!plantDropdownOpen);
                setTimeout(() => plantInputRef.current?.focus(), 50);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#d7e4dc] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#52645d] transition hover:border-emerald-400 hover:text-[#0f2c20]"
            >
              <Search className="h-3.5 w-3.5 text-emerald-700" />
              Change Plant
              <ChevronDown
                className={`h-3.5 w-3.5 transition ${plantDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {plantDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute right-0 z-40 mt-1.5 w-80 overflow-hidden rounded-xl border border-[#d7e4dc] bg-white shadow-xl sm:w-96"
                >
                  <div className="flex items-center gap-2 border-b border-[#e8f0eb] bg-[#f7faf8] p-2.5">
                    <Search className="h-3.5 w-3.5 shrink-0 text-[#8aa094]" />
                    <input
                      ref={plantInputRef}
                      type="text"
                      value={plantSearchQuery}
                      onChange={(e) => setPlantSearchQuery(e.target.value)}
                      placeholder="Search plants..."
                      className="w-full border-0 bg-transparent text-xs text-[#0f2c20] outline-none placeholder:text-[#8aa094]"
                    />
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
                      <div className="p-4 text-center text-[#8aa094]">No matching plants</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          )}
        </div>
      </motion.section>

      {/* Botanical information — compact tabs */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.04, ease: easeOut }}
        className="rounded-2xl border border-[#d7e4dc]/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-5"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold tracking-tight text-[#0f2c20]">Botanical Information</h3>
          <button
            type="button"
            onClick={() => setShowFullProfileModal(true)}
            className="text-[11px] font-semibold text-emerald-800 hover:underline"
          >
            View Details
          </button>
        </div>

        <div className="mb-3 flex gap-1 overflow-x-auto scrollbar-none">
          {profileTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setProfileTab(tab.id)}
              className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${
                profileTab === tab.id
                  ? "bg-[#0f2c20] text-white"
                  : "bg-[#f7faf8] text-[#52645d] hover:bg-emerald-50 hover:text-emerald-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={profileTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="rounded-xl border border-[#eef4f0] bg-[#fbfdfb] p-3.5"
          >
            {profileTab === "parts" ? (
              verifiedPlant?.documentedParts?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {verifiedPlant.documentedParts.map((part) => (
                    <span
                      key={part}
                      className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-900"
                    >
                      {part}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#8aa094]">No documented parts on record.</p>
              )
            ) : (
              <p className="text-xs leading-relaxed text-[#52645d]">
                {truncate(String(activeProfileBody || "Not documented"))}
                {String(activeProfileBody || "").length > 160 && (
                  <button
                    type="button"
                    onClick={() => setShowFullProfileModal(true)}
                    className="ml-1 font-semibold text-emerald-800 hover:underline"
                  >
                    more
                  </button>
                )}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.section>

      {/* Experimental plant parts — compact chips */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.08, ease: easeOut }}
        className="rounded-2xl border border-[#d7e4dc]/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-5"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="inline-flex items-center gap-1.5 text-sm font-bold tracking-tight text-[#0f2c20]">
            <Leaf className="h-4 w-4 text-emerald-700" />
            Experimental Plant Parts
          </h3>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-900">
            {selectedPartsList.length} selected
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {STANDARD_PLANT_PARTS.map((part) => {
            if (part === "Other") return null;
            const isSelected = selectedPartsList.includes(part);
            const isDocumented = verifiedPlant?.documentedParts?.includes(part);
            const chipClass = `inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
              isSelected
                ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                : "border-[#d7e4dc] bg-white text-[#52645d]" +
                  (readOnly ? "" : " hover:border-emerald-300 hover:bg-emerald-50")
            }`;
            return readOnly ? (
              <span key={part} className={chipClass}>
                {isSelected && <Check className="h-3 w-3" />}
                {part}
                {isDocumented && !isSelected && (
                  <span className="rounded bg-emerald-50 px-1 text-[8px] font-bold text-emerald-700">
                    Lit
                  </span>
                )}
              </span>
            ) : (
              <button
                key={part}
                type="button"
                onClick={() => togglePart(part)}
                className={chipClass}
              >
                {isSelected && <Check className="h-3 w-3" />}
                {part}
                {isDocumented && !isSelected && (
                  <span className="rounded bg-emerald-50 px-1 text-[8px] font-bold text-emerald-700">
                    Lit
                  </span>
                )}
              </button>
            );
          })}

          {selectedPartsList
            .filter((p) => !STANDARD_PLANT_PARTS.includes(p as any))
            .map((customPart) =>
              readOnly ? (
                <span
                  key={customPart}
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-600 bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white"
                >
                  <Check className="h-3 w-3" />
                  {customPart}
                </span>
              ) : (
                <button
                  key={customPart}
                  type="button"
                  onClick={() => togglePart(customPart)}
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-600 bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white"
                >
                  <Check className="h-3 w-3" />
                  {customPart}
                  <X className="h-3 w-3 opacity-80" />
                </button>
              )
            )}

          {!readOnly && !showCustomPartField ? (
            <button
              type="button"
              onClick={() => setShowCustomPartField(true)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#c5d4cb] px-2.5 py-1 text-[11px] font-semibold text-[#6d7f76] hover:border-emerald-400 hover:text-emerald-800"
            >
              <Plus className="h-3 w-3" />
              Other
            </button>
          ) : !readOnly ? (
            <div className="flex w-full flex-wrap items-center gap-2 pt-1">
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
                placeholder="Custom plant part..."
                className="h-8 w-48 rounded-lg border border-[#d5e3da] bg-[#fbfdfb] px-2.5 text-xs outline-none focus:border-emerald-600"
                autoFocus
              />
              <button
                type="button"
                onClick={addCustomPart}
                className="rounded-lg bg-[#0f2c20] px-2.5 py-1.5 text-[11px] font-semibold text-white"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowCustomPartField(false)}
                className="text-[11px] font-medium text-[#8aa094]"
              >
                Cancel
              </button>
            </div>
          ) : null}
        </div>
      </motion.section>

      {/* Phytochemicals — compact list */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.12, ease: easeOut }}
        className="rounded-2xl border border-[#d7e4dc]/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-5"
      >
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="inline-flex items-center gap-1.5 text-sm font-bold tracking-tight text-[#0f2c20]">
              <Dna className="h-4 w-4 text-teal-700" />
              Phytochemical Constituents
            </h3>
            <p className="mt-0.5 text-[11px] text-[#8aa094]">
              {verifiedPhytochemicals.length} cataloged ·{" "}
              <span className="font-semibold text-teal-800">{studyCompoundNames.length} selected</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8aa094]" />
              <input
                type="text"
                placeholder="Search..."
                value={phytoSearch}
                onChange={(e) => setPhytoSearch(e.target.value)}
                className="h-8 w-36 rounded-lg border border-[#d5e3da] bg-[#fbfdfb] pl-8 pr-2 text-xs outline-none focus:border-emerald-600 sm:w-44"
              />
            </div>
            {phytoClasses.length > 0 && (
              <select
                value={phytoClassFilter}
                onChange={(e) => setPhytoClassFilter(e.target.value)}
                className="h-8 rounded-lg border border-[#d5e3da] bg-white px-2 text-xs text-[#52645d] outline-none"
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
          <div className="max-h-[28rem] divide-y divide-[#eef4f0] overflow-y-auto rounded-xl border border-[#eef4f0]">
            {filteredPhytochemicals.map((comp) => {
              const isSelected = studyCompoundNames.includes(comp.compoundName);
              const mw =
                typeof comp.molecularWeight === "number"
                  ? comp.molecularWeight.toFixed(1)
                  : comp.molecularWeight || "—";
              return (
                <div
                  key={comp.id}
                  className={`flex items-center gap-2.5 px-3 py-2.5 transition ${
                    isSelected ? "bg-teal-50/70" : "bg-white hover:bg-[#f7faf8]"
                  }`}
                >
                  {readOnly ? (
                    <span
                      aria-hidden
                      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                        isSelected
                          ? "border-teal-600 bg-teal-600 text-white"
                          : "border-[#c5d4cb] bg-white text-transparent"
                      }`}
                    >
                      {isSelected ? <Check className="h-3 w-3" /> : null}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onToggleStudyCompound(comp)}
                      aria-pressed={isSelected}
                      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                        isSelected
                          ? "border-teal-600 bg-teal-600 text-white"
                          : "border-[#c5d4cb] bg-white text-transparent hover:border-teal-400"
                      }`}
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="truncate text-xs font-bold text-[#0f2c20]">
                        {comp.compoundName}
                      </span>
                      <span className="font-mono text-[10px] text-[#6d7f76]">
                        {comp.molecularFormula}
                      </span>
                      <span className="text-[10px] text-[#8aa094]">MW {mw}</span>
                    </div>
                    <p className="truncate text-[10px] text-teal-800/80">
                      {comp.compoundClass || "Metabolite"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedPhytoModal(comp)}
                    className="shrink-0 text-[11px] font-semibold text-[#6d7f76] hover:text-[#0f2c20]"
                  >
                    Details
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#d7e4dc] bg-[#f7faf8] p-6 text-center text-xs text-[#8aa094]">
            No phytochemicals match filter criteria.
          </div>
        )}
      </motion.section>

      {/* Literature — compact list */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.16, ease: easeOut }}
        className="rounded-2xl border border-[#d7e4dc]/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-5"
      >
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="inline-flex items-center gap-1.5 text-sm font-bold tracking-tight text-[#0f2c20]">
              <BookOpen className="h-4 w-4 text-emerald-700" />
              Scientific Literature
            </h3>
            <p className="mt-0.5 text-[11px] text-[#8aa094]">
              {scientificLiterature.length} references
            </p>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8aa094]" />
            <input
              type="text"
              placeholder="Search references..."
              value={litSearch}
              onChange={(e) => setLitSearch(e.target.value)}
              className="h-8 w-48 rounded-lg border border-[#d5e3da] bg-[#fbfdfb] pl-8 pr-2 text-xs outline-none focus:border-emerald-600 sm:w-56"
            />
          </div>
        </div>

        {visibleLiterature.length > 0 ? (
          <div className="space-y-1.5">
            {visibleLiterature.map((lit) => {
              const expanded = expandedLitId === lit.id;
              return (
                <article
                  key={lit.id}
                  className="rounded-xl border border-[#eef4f0] bg-[#fbfdfb] px-3 py-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="line-clamp-2 text-xs font-bold leading-snug text-[#0f2c20]">
                        {lit.title}
                      </h4>
                      <p className="mt-0.5 text-[10px] text-[#8aa094]">
                        {lit.publicationYear}
                        {lit.journalOrPublisher ? ` · ${lit.journalOrPublisher}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {lit.doi && (
                        <a
                          href={`https://doi.org/${lit.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800"
                        >
                          DOI
                        </a>
                      )}
                      {lit.pubmedId && (
                        <a
                          href={`https://pubmed.ncbi.nlm.nih.gov/${lit.pubmedId}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded border border-teal-200 bg-teal-50 px-1.5 py-0.5 text-[9px] font-bold text-teal-800"
                        >
                          PubMed
                        </a>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedLitId(expanded ? null : lit.id)
                    }
                    className="mt-1.5 inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-800 hover:underline"
                  >
                    {expanded ? "Hide details" : "Details"}
                    <ChevronDown
                      className={`h-3 w-3 transition ${expanded ? "rotate-180" : ""}`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 space-y-2 border-t border-[#eef4f0] pt-2 text-[11px] text-[#52645d]">
                          <p>
                            <span className="font-semibold text-[#6d7f76]">Authors:</span>{" "}
                            {lit.authors}
                          </p>
                          {lit.studyType && (
                            <p>
                              <span className="font-semibold text-[#6d7f76]">Type:</span>{" "}
                              {lit.studyType}
                            </p>
                          )}
                          {lit.shortSummary && (
                            <button
                              type="button"
                              onClick={() => setSelectedLitModal(lit)}
                              className="inline-flex items-center gap-0.5 font-semibold text-emerald-800 hover:underline"
                            >
                              View abstract
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </article>
              );
            })}

            {litVisibleCount < filteredLiterature.length && (
              <button
                type="button"
                onClick={() => setLitVisibleCount((n) => n + LIT_PAGE_SIZE)}
                className="w-full rounded-xl border border-[#d7e4dc] bg-[#f7faf8] py-2 text-xs font-semibold text-[#0f2c20] hover:bg-emerald-50"
              >
                Show more ({filteredLiterature.length - litVisibleCount} remaining)
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#d7e4dc] bg-[#f7faf8] p-6 text-center text-xs text-[#8aa094]">
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
              className="max-h-[85vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-2xl border border-[#d7e4dc] bg-white p-5 shadow-2xl"
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
                  className="rounded-lg p-1 text-[#8aa094] hover:bg-[#edf5f0]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3 text-xs">
                <div className="rounded-xl border border-[#e8f0eb] bg-[#f7faf8] p-3">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                    Traditional Uses
                  </p>
                  <p className="whitespace-pre-wrap leading-relaxed text-[#52645d]">
                    {traditionalUsesText}
                  </p>
                </div>
                <div className="rounded-xl border border-[#e8f0eb] bg-[#f7faf8] p-3">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                    Preparation
                  </p>
                  <p className="whitespace-pre-wrap leading-relaxed text-[#52645d]">
                    {traditionalPrepText}
                  </p>
                </div>
                {verifiedPlant?.documentedParts?.length ? (
                  <div className="rounded-xl border border-[#e8f0eb] bg-[#f7faf8] p-3">
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                      Documented Parts
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {verifiedPlant.documentedParts.map((part) => (
                        <span
                          key={part}
                          className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-900"
                        >
                          {part}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="rounded-xl border border-[#e8f0eb] bg-[#f7faf8] p-3">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                    Source
                  </p>
                  <p className="leading-relaxed text-[#52645d]">{sourceText}</p>
                  {verifiedPlant?.sourceUrl && (
                    <a
                      href={verifiedPlant.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 inline-flex items-center gap-1 font-semibold text-emerald-800 hover:underline"
                    >
                      Open source
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowFullProfileModal(false)}
                  className="rounded-xl bg-[#edf5f0] px-4 py-2 text-xs font-semibold text-[#0f2c20]"
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
              <div className="flex justify-between gap-2">
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => onToggleStudyCompound(selectedPhytoModal)}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                      studyCompoundNames.includes(selectedPhytoModal.compoundName)
                        ? "bg-teal-700 text-white"
                        : "bg-[#0f2c20] text-white"
                    }`}
                  >
                    {studyCompoundNames.includes(selectedPhytoModal.compoundName)
                      ? "Selected for Study"
                      : "Select for Study"}
                  </button>
                )}
                {readOnly &&
                  studyCompoundNames.includes(selectedPhytoModal.compoundName) && (
                    <span className="rounded-xl bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-900">
                      Selected for Study
                    </span>
                  )}
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
              className="max-h-[85vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl border border-[#d7e4dc] bg-white p-5 shadow-2xl"
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
                  Abstract
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
