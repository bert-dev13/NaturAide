"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import RecordImage from "@/components/community/RecordImage";
import ProductImageBadge from "@/components/community/ProductImageBadge";
import {
  Search,
  Leaf,
  Package,
  Coffee,
  Microscope,
  CheckCircle2,
  ArrowRight,
  SlidersHorizontal,
  X,
  ChevronDown,
  Info,
  ArrowUpDown,
} from "lucide-react";

export interface HerbalPlantItem {
  id: string;
  slug: string;
  commonName: string;
  scientificName: string;
  category: string;
  simpleUse: string;
  local_names?: string;
  is_pitahc?: boolean;
  imageUrl?: string | null;
  prepCount: number;
  refCount: number;
}

export interface HerbalProductItem {
  id: string | number;
  slug: string;
  name: string;
  brandName?: string | null;
  manufacturer?: string | null;
  dosageForm?: string | null;
  productClassification?: string | null;
  productType?: string | null;
  registrationStatus?: string | null;
  image_path?: string | null;
  image_type?: "AUTHENTIC_PRODUCT" | "AI_REPRESENTATIVE" | null;
  image_verified?: boolean | number | null;
  mainPlantName?: string | null;
  mainPlantSlug?: string | null;
}

interface HerbalGuideClientProps {
  plants: HerbalPlantItem[];
  products: HerbalProductItem[];
  initialTab?: "plants" | "products";
  initialQuery?: string;
}

const ALL_CONCERNS = [
  { id: "all", label: "All Concerns" },
  { id: "cough", label: "Cough & Colds", match: "cough" },
  { id: "digestion", label: "Digestive Comfort", match: "digestive" },
  { id: "kidney", label: "Kidney & Urinary", match: "kidney" },
  { id: "skin", label: "Skin Health", match: "skin" },
  { id: "blood-sugar", label: "Blood Sugar", match: "blood sugar" },
  { id: "cardio", label: "Cardiovascular", match: "cardiovascular" },
  { id: "pain", label: "Pain Relief", match: "pain" },
  { id: "parasite", label: "Parasite-related traditional use", match: "parasite" },
];

const QUICK_CHIPS = [
  { id: "all", label: "All" },
  { id: "cough", label: "Cough & Colds", match: "cough" },
  { id: "digestion", label: "Digestion", match: "digestive" },
  { id: "skin", label: "Skin", match: "skin" },
];

function getShortPurpose(plant: HerbalPlantItem): string {
  const name = (plant.commonName || "").toLowerCase();
  const cat = (plant.category || "").toLowerCase();

  if (name.includes("lagundi")) return "Cough & Respiratory Health";
  if (name.includes("sambong")) return "Kidney & Urinary Health";
  if (name.includes("akapulko")) return "Skin Health";
  if (name.includes("yerba")) return "Pain & Comfort";
  if (name.includes("ampalaya")) return "Blood Sugar Research";
  if (name.includes("bawang") || name.includes("garlic")) return "Cardiovascular Health";
  if (name.includes("bayabas") || name.includes("guava")) return "Antiseptic & Oral Health";
  if (name.includes("tsaang")) return "Digestive & Oral Health";
  if (name.includes("ulasimang") || name.includes("pansit")) return "Uric Acid & Joint Comfort";
  if (name.includes("niyog")) return "Parasite-Related Traditional Use";
  if (name.includes("ginger") || name.includes("luya")) return "Digestive Comfort";
  if (name.includes("turmeric")) return "Joint & Digestive Health";

  if (cat.includes("skin")) return "Skin Health";
  if (cat.includes("respiratory") || cat.includes("cough")) return "Respiratory Health";
  if (cat.includes("kidney") || cat.includes("urinary")) return "Kidney & Urinary Health";
  if (cat.includes("blood sugar") || cat.includes("metabolic")) return "Blood Sugar Research";
  if (cat.includes("digestive")) return "Digestive Comfort";
  if (cat.includes("pain")) return "Pain & Comfort";

  return plant.category || "General Wellness";
}

export default function HerbalGuideClient({
  plants,
  products,
  initialTab = "plants",
  initialQuery = "",
}: HerbalGuideClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const queryParam = searchParams.get("q");

  const [activeTab, setActiveTab] = useState<"plants" | "products">(
    tabParam === "products" ? "products" : initialTab
  );
  const [searchQuery, setSearchQuery] = useState(queryParam || initialQuery || "");
  const [selectedConcern, setSelectedConcern] = useState("all");
  const [hasPrepOnly, setHasPrepOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<"A-Z" | "Z-A">("A-Z");
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [showAboutGuide, setShowAboutGuide] = useState(false);

  // Sync tab with URL parameter
  const handleTabChange = (tab: "plants" | "products") => {
    setActiveTab(tab);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tab);
    if (!searchQuery) {
      params.delete("q");
    }
    router.replace(`/community/herbal-guide?${params.toString()}`, { scroll: false });
  };

  // Close sheet on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFilterSheetOpen(false);
    };
    if (isFilterSheetOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isFilterSheetOpen]);

  // Filtered Medicinal Plants
  const filteredPlants = useMemo(() => {
    let list = plants.filter((p) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          p.commonName.toLowerCase().includes(q) ||
          p.scientificName.toLowerCase().includes(q) ||
          (p.local_names && p.local_names.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q) ||
          p.simpleUse.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 2. Concern Filter
      if (selectedConcern !== "all") {
        const activeItem = ALL_CONCERNS.find((c) => c.id === selectedConcern);
        const matchStr = activeItem?.match || selectedConcern;
        const text = `${p.category} ${p.simpleUse} ${p.commonName}`.toLowerCase();
        if (!text.includes(matchStr.toLowerCase())) {
          return false;
        }
      }

      // 3. Preparation Available
      if (hasPrepOnly && p.prepCount === 0) {
        return false;
      }

      return true;
    });

    // 4. Sort
    list = [...list].sort((a, b) => {
      return sortOrder === "A-Z"
        ? a.commonName.localeCompare(b.commonName)
        : b.commonName.localeCompare(a.commonName);
    });

    return list;
  }, [plants, searchQuery, selectedConcern, hasPrepOnly, sortOrder]);

  // Filtered Commercial Herbal Products
  const filteredProducts = useMemo(() => {
    let list = products.filter((prod) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          prod.name.toLowerCase().includes(q) ||
          (prod.brandName && prod.brandName.toLowerCase().includes(q)) ||
          (prod.manufacturer && prod.manufacturer.toLowerCase().includes(q)) ||
          (prod.mainPlantName && prod.mainPlantName.toLowerCase().includes(q)) ||
          (prod.dosageForm && prod.dosageForm.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });

    list = [...list].sort((a, b) => {
      return sortOrder === "A-Z"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    });

    return list;
  }, [products, searchQuery, sortOrder]);

  const hasSearch = searchQuery.trim().length > 0;
  const activeConcernObj = ALL_CONCERNS.find((c) => c.id === selectedConcern);
  const isFiltering = selectedConcern !== "all" || hasPrepOnly || sortOrder !== "A-Z";

  const clearAllFilters = () => {
    setSelectedConcern("all");
    setHasPrepOnly(false);
    setSortOrder("A-Z");
    setSearchQuery("");
  };

  return (
    <div className="space-y-4">
      {/* ================================================== */}
      {/* 1. SIMPLE PAGE HEADER                              */}
      {/* ================================================== */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-heading font-black text-[#0f2c20] tracking-tight uppercase">
          Herbal Guide
        </h1>
        <p className="text-xs sm:text-sm text-[#52796f] font-medium">
          Explore medicinal plants and herbal products.
        </p>
      </div>

      {/* ================================================== */}
      {/* 2. LARGE SEARCH BAR                                */}
      {/* ================================================== */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-700 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search plants or herbal products..."
          className="w-full bg-white text-[#0f2c20] placeholder-[#6b7c76] text-sm pl-11 pr-10 py-3 sm:py-3.5 rounded-2xl border border-[#dde6df] focus:outline-none focus:ring-3 focus:ring-emerald-600/15 focus:border-emerald-600 transition-all font-medium shadow-2xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6b7c76] hover:text-[#0f2c20] p-1 rounded-full bg-slate-100 hover:bg-slate-200 cursor-pointer active:scale-90 transition-all"
            aria-label="Clear Search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ================================================== */}
      {/* 3. PLANTS / PRODUCTS SEGMENTED SWITCH               */}
      {/* ================================================== */}
      <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-[#e8ede9] rounded-2xl border border-[#dde6df]">
        <button
          onClick={() => handleTabChange("plants")}
          className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 ${
            activeTab === "plants"
              ? "bg-[#0f2c20] text-white shadow-xs"
              : "text-[#475550] hover:text-[#0f2c20]"
          }`}
        >
          <Leaf className="w-4 h-4 text-emerald-400" />
          <span>Medicinal Plants</span>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
              activeTab === "plants"
                ? "bg-white/20 text-white"
                : "bg-black/10 text-[#475550]"
            }`}
          >
            {plants.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange("products")}
          className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 ${
            activeTab === "products"
              ? "bg-[#0f2c20] text-white shadow-xs"
              : "text-[#475550] hover:text-[#0f2c20]"
          }`}
        >
          <Package className="w-4 h-4 text-teal-300" />
          <span>Herbal Products</span>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
              activeTab === "products"
                ? "bg-white/20 text-white"
                : "bg-black/10 text-[#475550]"
            }`}
          >
            {products.length}
          </span>
        </button>
      </div>

      {/* ================================================== */}
      {/* 4. CLEAN CONCERN QUICK CHIPS & FILTER BUTTON        */}
      {/* ================================================== */}
      <div className="flex items-center justify-between gap-2 pt-1">
        {/* Quick Chips (Mobile Horizontal Scroll / Desktop Row) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-xs">
          {QUICK_CHIPS.map((chip) => {
            const isSelected = selectedConcern === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setSelectedConcern(chip.id)}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all font-bold cursor-pointer text-xs active:scale-95 ${
                  isSelected
                    ? "bg-[#0f2c20] text-white shadow-2xs"
                    : "bg-white text-[#475550] border border-[#dde6df] hover:border-[#b0c4b1]"
                }`}
              >
                {chip.label}
              </button>
            );
          })}

          <button
            onClick={() => setIsFilterSheetOpen(true)}
            className="px-3 py-1.5 rounded-full whitespace-nowrap bg-white text-[#475550] border border-[#dde6df] hover:border-[#b0c4b1] font-bold cursor-pointer text-xs flex items-center gap-1 active:scale-95"
          >
            <span>More</span>
            <ChevronDown className="w-3 h-3 text-[#52796f]" />
          </button>
        </div>

        {/* Filters Button */}
        <button
          onClick={() => setIsFilterSheetOpen(true)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 shrink-0 transition-all border cursor-pointer active:scale-95 ${
            isFiltering
              ? "bg-emerald-100 text-emerald-950 border-emerald-300 shadow-2xs"
              : "bg-white text-[#0f2c20] border-[#dde6df] hover:bg-emerald-50"
          }`}
          aria-label="Open Filters"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-800" />
          <span>Filters</span>
          {isFiltering && (
            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
          )}
        </button>
      </div>

      {/* ================================================== */}
      {/* 5. LIGHTWEIGHT RESULT CONTEXT                       */}
      {/* ================================================== */}
      <div className="flex items-center justify-between pt-1 border-t border-[#edf2ee] text-xs">
        <div>
          <span className="font-heading font-black text-sm text-[#0f2c20]">
            {activeTab === "plants"
              ? selectedConcern !== "all"
                ? activeConcernObj?.label || "Medicinal Plants"
                : "Medicinal Plants"
              : "Herbal Products"}
          </span>
          <span className="text-[#52796f] ml-1.5">
            {activeTab === "plants"
              ? `${filteredPlants.length} plants`
              : `${filteredProducts.length} products`}
          </span>

          {isFiltering && (
            <button
              onClick={clearAllFilters}
              className="ml-3 text-emerald-800 hover:underline font-bold text-[11px]"
            >
              Clear filter
            </button>
          )}
        </div>

        {/* Quick Sort Toggle Button */}
        <button
          onClick={() => setSortOrder(sortOrder === "A-Z" ? "Z-A" : "A-Z")}
          className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#52796f] hover:text-[#0f2c20] cursor-pointer py-1"
        >
          <ArrowUpDown className="w-3 h-3 text-emerald-700" />
          <span>{sortOrder === "A-Z" ? "A–Z" : "Z–A"}</span>
        </button>
      </div>

      {/* ================================================== */}
      {/* 6. UNIFIED SEARCH MODE (IF SEARCHING)              */}
      {/* ================================================== */}
      {hasSearch && (
        <div className="space-y-6 pt-1">
          {/* SEARCH STATUS BAR */}
          <div className="p-3 rounded-2xl bg-white border border-[#dde6df] flex items-center justify-between text-xs shadow-2xs">
            <span>
              Search results for &ldquo;<strong>{searchQuery}</strong>&rdquo;:{" "}
              <strong className="text-emerald-800">{filteredPlants.length} medicinal plants</strong>,{" "}
              <strong className="text-teal-800">{filteredProducts.length} commercial products</strong>
            </span>
            <button
              onClick={() => setSearchQuery("")}
              className="text-[11px] font-bold text-emerald-800 hover:underline cursor-pointer"
            >
              Clear Search
            </button>
          </div>

          {/* MEDICINAL PLANTS SEARCH SECTION */}
          {filteredPlants.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-700" />
                <h2 className="font-heading font-black text-sm uppercase text-emerald-900 tracking-wider">
                  Medicinal Plants ({filteredPlants.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPlants.map((plant) => (
                  <PlantCard key={plant.id} plant={plant} />
                ))}
              </div>
            </section>
          )}

          {/* COMMERCIAL PRODUCTS SEARCH SECTION */}
          {filteredProducts.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-teal-700" />
                <h2 className="font-heading font-black text-sm uppercase text-teal-900 tracking-wider">
                  Commercial Herbal Products ({filteredProducts.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            </section>
          )}

          {filteredPlants.length === 0 && filteredProducts.length === 0 && (
            <EmptyState
              query={searchQuery}
              onReset={() => setSearchQuery("")}
            />
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 7. TAB 1: MEDICINAL PLANTS DIRECTORY (IMAGE-FIRST CARDS)             */}
      {/* ==================================================================== */}
      {!hasSearch && activeTab === "plants" && (
        <div>
          {filteredPlants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredPlants.map((plant) => (
                <PlantCard key={plant.id} plant={plant} />
              ))}
            </div>
          ) : (
            <EmptyState
              query={selectedConcern !== "all" ? activeConcernObj?.label : undefined}
              onReset={clearAllFilters}
            />
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 8. TAB 2: HERBAL PRODUCTS DIRECTORY (IMAGE-FIRST CARDS)              */}
      {/* ==================================================================== */}
      {!hasSearch && activeTab === "products" && (
        <div>
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          ) : (
            <EmptyState
              query={undefined}
              onReset={clearAllFilters}
            />
          )}
        </div>
      )}

      {/* ================================================== */}
      {/* 9. COMPACT ABOUT DISCLAIMER                        */}
      {/* ================================================== */}
      <div className="pt-4 border-t border-[#dde6df]">
        <button
          onClick={() => setShowAboutGuide((prev) => !prev)}
          className="inline-flex items-center gap-1.5 text-xs text-[#52796f] hover:text-[#0f2c20] font-medium transition-colors cursor-pointer"
          aria-expanded={showAboutGuide}
        >
          <Info className="w-3.5 h-3.5 text-emerald-700" />
          <span>About the Herbal Guide</span>
          <ChevronDown
            className={`w-3 h-3 text-[#52796f] transition-transform duration-200 ${
              showAboutGuide ? "rotate-180" : ""
            }`}
          />
        </button>

        {showAboutGuide && (
          <div className="mt-2 p-3.5 rounded-2xl bg-white border border-[#dde6df] text-xs text-[#52796f] leading-relaxed animate-in fade-in duration-200">
            NaturAide provides educational information about medicinal plants, traditional preparations, and herbal products. It does not replace professional medical care.
          </div>
        )}
      </div>

      {/* ================================================== */}
      {/* 10. FILTER BOTTOM SHEET / MODAL                    */}
      {/* ================================================== */}
      {isFilterSheetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setIsFilterSheetOpen(false)}
        >
          <div
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-xl space-y-5 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#edf2ee]">
              <h3 className="font-heading font-black text-base text-[#0f2c20] uppercase tracking-wide">
                Filter Herbal Guide
              </h3>
              <button
                onClick={() => setIsFilterSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-[#52796f] hover:text-[#0f2c20] cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Concern Radio List */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-[#52796f] uppercase tracking-wider block">
                Filter by Health Concern
              </span>
              <div className="grid grid-cols-1 gap-1 text-xs">
                {ALL_CONCERNS.map((c) => {
                  const isChecked = selectedConcern === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedConcern(c.id)}
                      className={`w-full py-2 px-3 rounded-xl text-left font-bold flex items-center justify-between transition-colors cursor-pointer ${
                        isChecked
                          ? "bg-emerald-50 text-emerald-950 font-black border border-emerald-200"
                          : "text-[#3d4a45] hover:bg-[#faf7f2]"
                      }`}
                    >
                      <span>{c.label}</span>
                      {isChecked && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preparation Checkbox */}
            <div className="pt-2 border-t border-[#edf2ee] space-y-2">
              <span className="text-[10px] font-black text-[#52796f] uppercase tracking-wider block">
                Traditional Preparation
              </span>
              <label className="flex items-center gap-2.5 text-xs text-[#0f2c20] font-bold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasPrepOnly}
                  onChange={(e) => setHasPrepOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600 accent-emerald-700"
                />
                <span>Has Documented Preparation Guide</span>
              </label>
            </div>

            {/* Sort Order */}
            <div className="pt-2 border-t border-[#edf2ee] space-y-2">
              <span className="text-[10px] font-black text-[#52796f] uppercase tracking-wider block">
                Alphabetical Sort
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => setSortOrder("A-Z")}
                  className={`py-2 px-3 rounded-xl font-black text-center transition-all cursor-pointer border ${
                    sortOrder === "A-Z"
                      ? "bg-[#0f2c20] text-white border-[#0f2c20]"
                      : "bg-[#faf7f2] text-[#475550] border-[#dde6df]"
                  }`}
                >
                  A–Z
                </button>
                <button
                  onClick={() => setSortOrder("Z-A")}
                  className={`py-2 px-3 rounded-xl font-black text-center transition-all cursor-pointer border ${
                    sortOrder === "Z-A"
                      ? "bg-[#0f2c20] text-white border-[#0f2c20]"
                      : "bg-[#faf7f2] text-[#475550] border-[#dde6df]"
                  }`}
                >
                  Z–A
                </button>
              </div>
            </div>

            {/* Show Results CTA */}
            <div className="pt-3 border-t border-[#edf2ee] flex gap-2">
              <button
                onClick={() => {
                  clearAllFilters();
                  setIsFilterSheetOpen(false);
                }}
                className="w-1/3 py-2.5 px-3 rounded-2xl bg-[#faf7f2] hover:bg-slate-100 text-xs font-bold text-[#52796f] transition-all cursor-pointer"
              >
                Reset
              </button>
              <button
                onClick={() => setIsFilterSheetOpen(false)}
                className="w-2/3 py-2.5 px-4 rounded-2xl bg-[#0f2c20] hover:bg-[#1a4b36] active:scale-98 text-white text-xs font-black shadow-xs transition-all cursor-pointer"
              >
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ====================================================================
// SUB-COMPONENT: IMAGE-FIRST MEDICINAL PLANT CARD
// ====================================================================
function PlantCard({ plant }: { plant: HerbalPlantItem }) {
  const shortPurpose = getShortPurpose(plant);

  return (
    <Link
      href={`/community/plants/${plant.slug}`}
      className="group block rounded-3xl bg-white border border-[#dde6df] hover:border-emerald-300 hover:shadow-md transition-all duration-200 overflow-hidden shadow-2xs flex flex-col justify-between"
    >
      {/* Image occupies ~45-55% of card */}
      <div className="relative h-48 sm:h-52 w-full bg-[#edf2ee] overflow-hidden">
        <RecordImage
          kind="plant"
          src={plant.imageUrl}
          alt={plant.commonName}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
          className="object-cover group-hover:scale-104 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/15" />

        {/* Verified DOH / PITAHC badge */}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-full bg-emerald-800/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1 border border-emerald-600/40">
            <CheckCircle2 className="w-3 h-3 text-emerald-300" />
            <span>DOH / PITAHC</span>
          </span>
        </div>
      </div>

      {/* Card Content (Clean & Minimal) */}
      <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <h2 className="font-heading font-black text-base text-[#0f2c20] uppercase tracking-wide group-hover:text-emerald-800 transition-colors">
            {plant.commonName}
          </h2>
          <p className="text-xs text-[#52796f] italic truncate">
            {plant.scientificName}
          </p>
          <p className="text-xs font-bold text-emerald-900 pt-0.5">
            {shortPurpose}
          </p>
        </div>

        {/* Dynamic Badges */}
        <div className="pt-2 border-t border-[#edf2ee] space-y-2">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            {plant.prepCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-extrabold text-[10px]">
                <Coffee className="w-3 h-3 text-amber-700" />
                <span>
                  {plant.prepCount === 1 ? "1 method" : `${plant.prepCount} methods`}
                </span>
              </span>
            )}

            {plant.refCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-900 border border-teal-200 font-extrabold text-[10px]">
                <Microscope className="w-3 h-3 text-teal-700" />
                <span>{plant.refCount} sources</span>
              </span>
            )}
          </div>

          {/* Action indicator */}
          <div className="pt-1 flex items-center justify-between text-xs font-black text-[#0f2c20] group-hover:text-emerald-800 transition-colors">
            <span>View Plant</span>
            <ArrowRight className="w-4 h-4 text-emerald-700 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}

// ====================================================================
// SUB-COMPONENT: IMAGE-FIRST COMMERCIAL HERBAL PRODUCT CARD
// ====================================================================
function ProductCard({ product }: { product: HerbalProductItem }) {
  return (
    <Link
      href={`/community/products/${product.slug || product.id}`}
      className="group block rounded-3xl bg-white border border-teal-200/80 hover:border-teal-400 hover:shadow-md transition-all duration-200 overflow-hidden shadow-2xs flex flex-col justify-between"
    >
      {/* Product Image occupies ~45-50% of card */}
      <div className="relative h-48 sm:h-52 w-full bg-[#faf7f2] flex items-center justify-center p-3 border-b border-[#edf2ee] overflow-hidden">
        <RecordImage
          kind="product"
          src={product.image_path}
          isVerified={product.image_verified}
          imageType={product.image_type}
          alt={product.name}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
          className="object-contain p-2 group-hover:scale-104 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-0.5 rounded-full bg-teal-800 text-white text-[9px] font-black uppercase tracking-wider shadow-2xs">
            Commercial Product
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <ProductImageBadge imageType={product.image_type} />
        </div>
      </div>

      {/* Product Details */}
      <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <h2 className="font-heading font-black text-sm text-[#0f2c20] line-clamp-2 leading-snug group-hover:text-teal-900 transition-colors">
            {product.name}
          </h2>

          <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px]">
            {product.mainPlantName && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold text-[10px]">
                <Leaf className="w-2.5 h-2.5 text-emerald-700" />
                <span>{product.mainPlantName}</span>
              </span>
            )}

            {product.dosageForm && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[10px]">
                {product.dosageForm}
              </span>
            )}
          </div>
        </div>

        {/* Action indicator with simplified registration */}
        <div className="pt-2 border-t border-[#edf2ee] flex items-center justify-between text-xs font-black text-[#0f2c20] group-hover:text-teal-900 transition-colors">
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800">
            <span>✓ Active Registration</span>
          </div>

          <div className="inline-flex items-center gap-1">
            <span>View Product</span>
            <ArrowRight className="w-4 h-4 text-teal-700 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}

// ====================================================================
// SUB-COMPONENT: EMPTY STATE
// ====================================================================
function EmptyState({
  query,
  onReset,
}: {
  query?: string;
  onReset: () => void;
}) {
  return (
    <div className="p-10 rounded-3xl bg-white border border-[#dde6df] text-center space-y-3">
      <Leaf className="w-8 h-8 text-[#6b7c76] mx-auto" />
      <h3 className="font-heading font-black text-base text-[#0f2c20]">
        No items found
      </h3>
      <p className="text-xs text-[#52796f] max-w-sm mx-auto">
        {query
          ? `No items match “${query}”. Try adjusting your keywords or clearing filters.`
          : "No items match your active filters. Try resetting to view all items."}
      </p>
      <button
        onClick={onReset}
        className="px-4 py-2 rounded-2xl bg-emerald-100 text-emerald-950 text-xs font-black hover:bg-emerald-200 cursor-pointer active:scale-95 transition-all"
      >
        Reset Filters
      </button>
    </div>
  );
}
