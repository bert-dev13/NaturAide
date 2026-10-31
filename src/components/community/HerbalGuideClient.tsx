"use client";

import React, { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PlantsDirectoryView from "@/components/community/plants/PlantsDirectoryView";
import PlantsHero from "@/components/community/plants/PlantsHero";
import ProductsDirectoryView from "@/components/community/products/ProductsDirectoryView";
import { Leaf, Package } from "lucide-react";

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

  return (
    <div className="space-y-6 sm:space-y-7">
      {/* ========================================================================= */}
      {/* 1. PLANTS HERO SECTION (DISPLAYED FIRST BEFORE THE 2 TABS)                */}
      {/* "Discover Medicinal Plants" & "Explore Philippine medicinal plants..."    */}
      {/* ========================================================================= */}
      <PlantsHero
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        plants={plants}
        onSelectSuggestion={(plant) => setSearchQuery(plant.commonName)}
      />

      {/* ================================================== */}
      {/* 2. PLANTS / PRODUCTS SEGMENTED 2 TABS (FULL WIDTH)  */}
      {/* ================================================== */}
      <div className="w-full grid grid-cols-2 gap-1.5 p-1.5 bg-white/90 backdrop-blur-md rounded-2xl border border-emerald-900/10 shadow-2xs">
        <button
          type="button"
          onClick={() => handleTabChange("plants")}
          className={`w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 ${
            activeTab === "plants"
              ? "bg-[#0f2c20] text-white shadow-xs"
              : "text-[#475550] hover:text-[#0f2c20] hover:bg-black/5"
          }`}
        >
          <Leaf className="w-4 h-4 text-emerald-400 shrink-0" />
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
          type="button"
          onClick={() => handleTabChange("products")}
          className={`w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 ${
            activeTab === "products"
              ? "bg-[#0f2c20] text-white shadow-xs"
              : "text-[#475550] hover:text-[#0f2c20] hover:bg-black/5"
          }`}
        >
          <Package className="w-4 h-4 text-teal-300 shrink-0" />
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
      {/* 3. TAB 1: MEDICINAL PLANTS (REDESIGNED VIEW)        */}
      {/* ================================================== */}
      {activeTab === "plants" && (
        <PlantsDirectoryView
          plants={plants}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showHero={false}
        />
      )}

      {/* ================================================== */}
      {/* 4. TAB 2: HERBAL PRODUCTS (REDESIGNED VIEW)         */}
      {/* ================================================== */}
      {activeTab === "products" && (
        <ProductsDirectoryView
          products={products}
          searchQuery={searchQuery}
          onClearSearch={() => setSearchQuery("")}
        />
      )}
    </div>
  );
}
