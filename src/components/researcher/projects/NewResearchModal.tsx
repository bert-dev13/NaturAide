"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical,
  X,
  Search,
  Check,
  ChevronDown,
  AlertCircle,
  Loader2,
} from "lucide-react";

export interface CatalogPlant {
  id: string;
  slug?: string;
  commonName: string;
  scientificName: string;
  category?: string;
  is_pitahc?: number;
  imageUrl?: string | null;
  plant_parts_used?: string | null;
}

// Authoritative DOH / PITAHC recognized medicinal plants + curated catalog specimens
const DEFAULT_PLANTS_CATALOG: CatalogPlant[] = [
  {
    id: "sambong",
    slug: "sambong",
    commonName: "Sambong",
    scientificName: "Blumea balsamifera",
    category: "Renal & Diuretic",
    is_pitahc: 1,
  },
  {
    id: "lagundi",
    slug: "lagundi",
    commonName: "Lagundi",
    scientificName: "Vitex negundo",
    category: "Respiratory & Anti-tussive",
    is_pitahc: 1,
  },
  {
    id: "ampalaya",
    slug: "ampalaya",
    commonName: "Ampalaya",
    scientificName: "Momordica charantia",
    category: "Metabolic & Glycemic Support",
    is_pitahc: 1,
  },
  {
    id: "bawang",
    slug: "bawang",
    commonName: "Bawang",
    scientificName: "Allium sativum",
    category: "Cardiovascular & Lipid Control",
    is_pitahc: 1,
  },
  {
    id: "bayabas",
    slug: "bayabas",
    commonName: "Bayabas",
    scientificName: "Psidium guajava",
    category: "Antimicrobial & Astringent",
    is_pitahc: 1,
  },
  {
    id: "akapulko",
    slug: "akapulko",
    commonName: "Akapulko",
    scientificName: "Senna alata",
    category: "Dermatological & Antifungal",
    is_pitahc: 1,
  },
  {
    id: "niyog-niyogan",
    slug: "niyog-niyogan",
    commonName: "Niyog-niyogan",
    scientificName: "Quisqualis indica",
    category: "Anthelmintic & Gastrointestinal",
    is_pitahc: 1,
  },
  {
    id: "tsaang-gubat",
    slug: "tsaang-gubat",
    commonName: "Tsaang Gubat",
    scientificName: "Carmona retusa",
    category: "Gastrointestinal & Antispasmodic",
    is_pitahc: 1,
  },
  {
    id: "ulasimang-bato",
    slug: "ulasimang-bato",
    commonName: "Ulasimang Bato / Pansit-pansitan",
    scientificName: "Peperomia pellucida",
    category: "Renal & Uric Acid Control",
    is_pitahc: 1,
  },
  {
    id: "yerba-buena",
    slug: "yerba-buena",
    commonName: "Yerba Buena",
    scientificName: "Mentha cordifolia",
    category: "Analgesic & Neuromuscular",
    is_pitahc: 1,
  },
  {
    id: "turmeric",
    slug: "turmeric",
    commonName: "Turmeric",
    scientificName: "Curcuma longa",
    category: "Joints & Antioxidant Support",
    is_pitahc: 0,
  },
  {
    id: "ginger",
    slug: "ginger",
    commonName: "Ginger",
    scientificName: "Zingiber officinale",
    category: "Digestive & Anti-nausea",
    is_pitahc: 0,
  },
];

const THERAPEUTIC_AREAS = [
  "Anti-inflammatory",
  "Antimicrobial",
  "Cardiovascular",
  "Dermatological",
  "Gastrointestinal",
  "Metabolic",
  "Neurological",
  "Renal",
  "Respiratory",
  "Other",
] as const;

interface NewResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  plantsCatalog?: CatalogPlant[];
  loadingPlants?: boolean;
}

export default function NewResearchModal({
  isOpen,
  onClose,
  plantsCatalog: externalCatalog = [],
  loadingPlants: externalLoading = false,
}: NewResearchModalProps) {
  const router = useRouter();

  // Internal catalog state in case external wasn't passed or is still empty
  const [internalCatalog, setInternalCatalog] = useState<CatalogPlant[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [selectedPlant, setSelectedPlant] = useState<CatalogPlant | null>(null);
  const [isCustomPlant, setIsCustomPlant] = useState(false);
  const [customPlantName, setCustomPlantName] = useState("");
  const [therapeuticArea, setTherapeuticArea] = useState<string>("Anti-inflammatory");
  const [customTherapeuticArea, setCustomTherapeuticArea] = useState("");
  const [researchQuestion, setResearchQuestion] = useState("");

  // Track if user manually typed or modified the title
  const [isTitleUserEdited, setIsTitleUserEdited] = useState(false);

  // Selector dropdown UI state
  const [isPlantDropdownOpen, setIsPlantDropdownOpen] = useState(false);
  const [plantSearchQuery, setPlantSearchQuery] = useState("");

  // Submission & Validation States
  const [creatingProject, setCreatingProject] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    title?: string;
    plant?: string;
    customPlant?: string;
  }>({});

  // Refs for outside click handling & focus
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-fetch plants if external list is empty
  useEffect(() => {
    if (isOpen && externalCatalog.length === 0 && internalCatalog.length === 0) {
      setInternalLoading(true);
      fetch("/api/researcher/plants")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.plants) && data.plants.length > 0) {
            setInternalCatalog(data.plants);
          }
        })
        .catch((err) => {
          console.error("Failed to load plants catalog in NewResearchModal:", err);
        })
        .finally(() => setInternalLoading(false));
    }
  }, [isOpen, externalCatalog.length, internalCatalog.length]);

  const isLoading = externalLoading || internalLoading;

  // Active Catalog: use external catalog if available, or internal catalog, or curated fallback
  const activeCatalog = useMemo(() => {
    if (externalCatalog && externalCatalog.length > 0) {
      return externalCatalog;
    }
    if (internalCatalog && internalCatalog.length > 0) {
      return internalCatalog;
    }
    return DEFAULT_PLANTS_CATALOG;
  }, [externalCatalog, internalCatalog]);

  // Filtered plant list based on search query
  const filteredPlants = useMemo(() => {
    const q = plantSearchQuery.trim().toLowerCase();
    if (!q) return activeCatalog;
    return activeCatalog.filter((plant) => {
      const matchCommon = plant.commonName?.toLowerCase().includes(q);
      const matchSci = plant.scientificName?.toLowerCase().includes(q);
      const matchCategory = plant.category?.toLowerCase().includes(q);
      return matchCommon || matchSci || matchCategory;
    });
  }, [activeCatalog, plantSearchQuery]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isPlantDropdownOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isPlantDropdownOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsPlantDropdownOpen(false);
      }
    };

    if (isPlantDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPlantDropdownOpen]);

  // Handle ESC key to close dropdown or modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !creatingProject) {
        if (isPlantDropdownOpen) {
          setIsPlantDropdownOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isPlantDropdownOpen, creatingProject, onClose]);

  // Auto-suggest a sensible starting title when a plant is selected, unless user already edited title
  const handleSelectPlant = (plant: CatalogPlant) => {
    setSelectedPlant(plant);
    setIsPlantDropdownOpen(false);
    setPlantSearchQuery("");

    // Clear plant validation error
    if (fieldErrors.plant) {
      setFieldErrors((prev) => ({ ...prev, plant: undefined }));
    }

    // Generate a clean scientific starting title if user has not manually customized title
    if (!isTitleUserEdited || !title.trim()) {
      if (plant.commonName.toLowerCase() === "sambong") {
        setTitle("Anti-inflammatory potential of Sambong terpenoids");
      } else {
        setTitle(
          `Bioactive profiling and therapeutic evaluation of ${plant.commonName} (${plant.scientificName})`
        );
      }
      // Also clear title validation error if any
      setFieldErrors((prev) => ({ ...prev, title: undefined }));
    }
  };

  // Switch to custom specimen
  const handleToggleCustom = () => {
    const nextCustom = !isCustomPlant;
    setIsCustomPlant(nextCustom);
    setIsPlantDropdownOpen(false);
    if (nextCustom) {
      setSelectedPlant(null);
    } else {
      setCustomPlantName("");
    }
    // Clear relevant errors
    setFieldErrors((prev) => ({ ...prev, plant: undefined, customPlant: undefined }));
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setObjective("");
      setSelectedPlant(null);
      setIsCustomPlant(false);
      setCustomPlantName("");
      setTherapeuticArea("Anti-inflammatory");
      setCustomTherapeuticArea("");
      setResearchQuestion("");
      setIsTitleUserEdited(false);
      setIsPlantDropdownOpen(false);
      setPlantSearchQuery("");
      setServerError(null);
      setFieldErrors({});
      setCreatingProject(false);
    }
  }, [isOpen]);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { title?: string; plant?: string; customPlant?: string } = {};

    if (!title.trim()) {
      errors.title = "Research Project Title is required.";
    }

    if (!isCustomPlant && !selectedPlant) {
      errors.plant = "Please search or select a medicinal plant specimen.";
    }

    if (isCustomPlant && !customPlantName.trim()) {
      errors.customPlant = "Please provide the custom plant specimen name.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setServerError(null);
    setCreatingProject(true);

    try {
      const resolvedArea =
        therapeuticArea === "Other"
          ? customTherapeuticArea.trim() || "Herbal Pharmacology & Natural Products"
          : therapeuticArea;

      const payload = {
        title: title.trim(),
        researchObjective: objective.trim() || undefined,
        shortDescription: objective.trim().slice(0, 200) || undefined,
        plantId: isCustomPlant ? undefined : selectedPlant?.id || undefined,
        plantCustomName: isCustomPlant ? customPlantName.trim() : undefined,
        researchQuestion: researchQuestion.trim() || undefined,
        areaOfInterest: resolvedArea,
        expectedOutcome: "Empirical scientific dossier & validation benchmarks",
      };

      const res = await fetch("/api/researcher/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create research project");
      }

      onClose();
      // Redirect to the newly created project workspace
      router.push(`/researcher/projects/${data.projectId}`);
    } catch (err: any) {
      console.error("Create project error:", err);
      setServerError(
        err.message || "An unexpected error occurred while creating project."
      );
      setCreatingProject(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => !creatingProject && onClose()}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl sm:max-w-[780px] lg:max-w-[820px] bg-white rounded-xl shadow-2xl border border-slate-200/90 overflow-hidden z-10 flex flex-col max-h-[88vh] my-4 sm:my-8"
          >
            {/* 1. HEADER */}
            <div className="px-6 py-5 sm:px-7 sm:py-5.5 border-b border-slate-200/80 bg-white flex items-start justify-between shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
                  <FlaskConical className="w-5 h-5 text-emerald-700" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 tracking-tight leading-snug">
                    Start New Research Investigation
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Create a research workspace for a medicinal plant investigation.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={creatingProject}
                aria-label="Close modal"
                className="p-1.5 -mr-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2. RESEARCH SETUP FORM BODY (Scrollable) */}
            <form
              id="new-research-form"
              onSubmit={handleSubmit}
              className="px-6 py-6 sm:px-7 space-y-6 overflow-y-auto flex-1 custom-scrollbar text-slate-900"
            >
              {serverError && (
                <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{serverError}</span>
                </div>
              )}

              {/* FIELD 1: MEDICINAL PLANT (Anchored Specimen Selector) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-medium text-slate-800">
                    Medicinal Plant <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleToggleCustom}
                    disabled={creatingProject}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-medium hover:underline cursor-pointer transition-colors"
                  >
                    {isCustomPlant ? "← Select from plant catalog" : "+ Use custom specimen"}
                  </button>
                </div>

                {!isCustomPlant ? (
                  <div className="relative" ref={dropdownRef}>
                    {/* Collapsed Selected State vs Search Trigger */}
                    {selectedPlant ? (
                      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                        <div className="flex flex-wrap sm:flex-nowrap items-baseline sm:items-center gap-x-2.5 gap-y-1 min-w-0 pr-2">
                          <span className="text-sm font-semibold text-slate-900">
                            {selectedPlant.commonName}
                          </span>
                          <span className="text-xs italic text-slate-500 font-normal">
                            {selectedPlant.scientificName}
                          </span>
                          {Boolean(selectedPlant.is_pitahc) ? (
                            <span className="text-[10px] font-medium tracking-wide text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded px-1.5 py-0.5 shrink-0">
                              PITAHC recognized
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-600 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 shrink-0">
                              {selectedPlant.category || "Botanical Specimen"}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0 ml-auto">
                          <button
                            type="button"
                            onClick={() => setIsPlantDropdownOpen((prev) => !prev)}
                            disabled={creatingProject}
                            className="px-2.5 py-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedPlant(null)}
                            disabled={creatingProject}
                            title="Clear plant"
                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsPlantDropdownOpen((prev) => !prev)}
                        disabled={creatingProject || isLoading}
                        className={`w-full h-11 px-3.5 py-2.5 bg-white border text-left rounded-lg text-sm flex items-center justify-between transition-all cursor-pointer ${
                          fieldErrors.plant
                            ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                            : "border-slate-300 hover:border-slate-400 focus:ring-2 focus:ring-emerald-600/15 focus:border-emerald-600"
                        }`}
                      >
                        <span className="text-slate-500 text-sm">
                          {isLoading
                            ? "Loading botanical catalog..."
                            : "Search or select a medicinal plant"}
                        </span>
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      </button>
                    )}

                    {/* DROPDOWN POPOVER */}
                    <AnimatePresence>
                      {isPlantDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden"
                        >
                          {/* Search Input */}
                          <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                            <div className="relative flex items-center">
                              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                              <input
                                ref={searchInputRef}
                                type="text"
                                value={plantSearchQuery}
                                onChange={(e) => setPlantSearchQuery(e.target.value)}
                                placeholder="Search by common name, scientific taxon, or category..."
                                className="w-full h-9 pl-9 pr-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                              />
                              {plantSearchQuery && (
                                <button
                                  type="button"
                                  onClick={() => setPlantSearchQuery("")}
                                  className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Options List */}
                          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
                            {filteredPlants.length === 0 ? (
                              <div className="py-6 px-4 text-center">
                                <p className="text-xs text-slate-500">
                                  No plants match &ldquo;{plantSearchQuery}&rdquo;
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsCustomPlant(true);
                                    setCustomPlantName(plantSearchQuery);
                                    setIsPlantDropdownOpen(false);
                                  }}
                                  className="mt-2 text-xs font-medium text-emerald-700 hover:underline cursor-pointer"
                                >
                                  Use &ldquo;{plantSearchQuery}&rdquo; as a custom specimen
                                </button>
                              </div>
                            ) : (
                              filteredPlants.map((plant) => {
                                const isSelected = selectedPlant?.id === plant.id;
                                return (
                                  <div
                                    key={plant.id}
                                    onClick={() => handleSelectPlant(plant)}
                                    className={`px-3.5 py-2.5 flex items-center justify-between hover:bg-emerald-50/60 cursor-pointer transition-colors ${
                                      isSelected ? "bg-emerald-50/40" : ""
                                    }`}
                                  >
                                    <div className="min-w-0 pr-3">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-slate-900">
                                          {plant.commonName}
                                        </span>
                                        <span className="text-xs italic text-slate-500">
                                          {plant.scientificName}
                                        </span>
                                      </div>
                                      {plant.category && (
                                        <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                                          {plant.category}
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      {Boolean(plant.is_pitahc) && (
                                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/70 rounded px-1.5 py-0.5 tracking-wide">
                                          PITAHC
                                        </span>
                                      )}
                                      {isSelected && (
                                        <Check className="w-4 h-4 text-emerald-700 ml-1" />
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={customPlantName}
                      onChange={(e) => {
                        setCustomPlantName(e.target.value);
                        if (fieldErrors.customPlant) {
                          setFieldErrors((prev) => ({ ...prev, customPlant: undefined }));
                        }
                      }}
                      placeholder="e.g. Piper retrofractum Vahl (Chavica officinarum)"
                      disabled={creatingProject}
                      className={`w-full h-11 px-3.5 py-2.5 bg-white border rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors ${
                        fieldErrors.customPlant
                          ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                          : "border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                      }`}
                    />
                    <p className="text-[11px] text-slate-500">
                      Specify the botanical taxon, binomial nomenclature, or novel specimen identifier.
                    </p>
                  </div>
                )}

                {/* Validation messages */}
                {fieldErrors.plant && !isCustomPlant && (
                  <p className="text-xs text-rose-600 font-medium mt-1">
                    {fieldErrors.plant}
                  </p>
                )}
                {fieldErrors.customPlant && isCustomPlant && (
                  <p className="text-xs text-rose-600 font-medium mt-1">
                    {fieldErrors.customPlant}
                  </p>
                )}
              </div>

              {/* FIELD 2: RESEARCH PROJECT TITLE */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-slate-800">
                  Research Project Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setIsTitleUserEdited(true);
                    if (fieldErrors.title) {
                      setFieldErrors((prev) => ({ ...prev, title: undefined }));
                    }
                  }}
                  placeholder="e.g. Anti-inflammatory potential of Sambong terpenoids"
                  disabled={creatingProject}
                  className={`w-full h-11 px-3.5 py-2.5 bg-white border rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors ${
                    fieldErrors.title
                      ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                      : "border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                  }`}
                />
                {fieldErrors.title && (
                  <p className="text-xs text-rose-600 font-medium mt-1">
                    {fieldErrors.title}
                  </p>
                )}
              </div>

              {/* FIELD 3: PRIMARY RESEARCH OBJECTIVE */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-slate-800">
                  Primary Research Objective
                </label>
                <textarea
                  rows={3}
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="Describe the primary objective of this investigation..."
                  disabled={creatingProject}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 resize-none transition-colors leading-relaxed"
                />
              </div>

              {/* FIELD 4 & 5: RESEARCH CONTEXT (2-Column Grid on desktop, stacked on mobile) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Therapeutic Area */}
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-slate-800">
                    Therapeutic Area
                  </label>
                  <select
                    value={therapeuticArea}
                    onChange={(e) => setTherapeuticArea(e.target.value)}
                    disabled={creatingProject}
                    className="w-full h-11 px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-colors cursor-pointer"
                  >
                    {THERAPEUTIC_AREAS.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>

                  {therapeuticArea === "Other" && (
                    <input
                      type="text"
                      value={customTherapeuticArea}
                      onChange={(e) => setCustomTherapeuticArea(e.target.value)}
                      placeholder="Specify therapeutic domain..."
                      disabled={creatingProject}
                      className="w-full h-10 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-colors mt-2"
                    />
                  )}
                </div>

                {/* Core Research Question */}
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-slate-800">
                    Core Research Question
                  </label>
                  <input
                    type="text"
                    value={researchQuestion}
                    onChange={(e) => setResearchQuestion(e.target.value)}
                    placeholder="What specific question will this investigation address?"
                    disabled={creatingProject}
                    className="w-full h-11 px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-colors"
                  />
                </div>
              </div>
            </form>

            {/* 3. STICKY FOOTER ACTIONS */}
            <div className="border-t border-slate-200/90 bg-slate-50/80 px-6 py-4 sm:px-7 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
              <span className="text-xs text-slate-500 font-normal">
                Required fields are marked with <span className="text-rose-500">*</span>
              </span>

              <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={creatingProject}
                  className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  form="new-research-form"
                  disabled={creatingProject}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#0f2c20] hover:bg-[#164533] active:bg-[#091a13] text-white text-sm font-medium shadow-xs disabled:opacity-50 cursor-pointer transition-colors"
                >
                  {creatingProject ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Creating project…</span>
                    </>
                  ) : (
                    <span>Create Research Project</span>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
