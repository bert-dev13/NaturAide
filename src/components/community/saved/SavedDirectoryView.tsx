"use client";

import React, { useState, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import SavedHero from "./SavedHero";
import SavedLibrarySummary from "./SavedLibrarySummary";
import SavedFilters, { SavedFilterCategory } from "./SavedFilters";
import SavedPlantCard from "./SavedPlantCard";
import SavedProductCard from "./SavedProductCard";
import SavedGuideCard from "./SavedGuideCard";
import SavedEmptyState from "./SavedEmptyState";
import SavedDiscoveryBanner from "./SavedDiscoveryBanner";
import SavedCardSkeleton from "./SavedCardSkeleton";
import { SavedPlantItem, SavedProductItem, SavedGuideItem } from "./types";

interface SavedDirectoryViewProps {
  initialPlants?: SavedPlantItem[];
  initialProducts?: SavedProductItem[];
  initialGuides?: SavedGuideItem[];
  loading?: boolean;
}

export default function SavedDirectoryView({
  initialPlants = [],
  initialProducts = [],
  initialGuides = [],
  loading = false,
}: SavedDirectoryViewProps) {
  const shouldReduceMotion = useReducedMotion();

  const [savedPlants, setSavedPlants] = useState<SavedPlantItem[]>(initialPlants);
  const [savedProducts, setSavedProducts] = useState<SavedProductItem[]>(initialProducts);
  const [savedGuides, setSavedGuides] = useState<SavedGuideItem[]>(initialGuides);

  const [selectedCategory, setSelectedCategory] = useState<SavedFilterCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const plantCount = savedPlants.length;
  const productCount = savedProducts.length;
  const guideCount = savedGuides.length;
  const totalSaved = plantCount + productCount + guideCount;

  // Handle unbookmark / remove item
  const handleRemove = async (type: "plant" | "product" | "guide", id: string | number) => {
    try {
      const res = await fetch("/api/community/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id }),
      });
      const data = await res.json();
      if (data.success) {
        if (type === "plant") {
          setSavedPlants((prev) => prev.filter((p) => String(p.id) !== String(id)));
        } else if (type === "product") {
          setSavedProducts((prev) => prev.filter((p) => String(p.id) !== String(id)));
        } else if (type === "guide") {
          setSavedGuides((prev) => prev.filter((g) => String(g.id) !== String(id)));
        }
        setToastMessage("Removed from saved items");
        setTimeout(() => setToastMessage(null), 2500);
      }
    } catch (err) {
      console.error("Failed to remove item:", err);
    }
  };

  const cleanQuery = searchQuery.toLowerCase().trim();

  // Filtered lists
  const filteredPlants = useMemo(() => {
    if (!cleanQuery) return savedPlants;
    return savedPlants.filter(
      (p) =>
        (p.commonName || "").toLowerCase().includes(cleanQuery) ||
        (p.scientificName || "").toLowerCase().includes(cleanQuery) ||
        (p.category || "").toLowerCase().includes(cleanQuery) ||
        (p.simpleUse || "").toLowerCase().includes(cleanQuery)
    );
  }, [savedPlants, cleanQuery]);

  const filteredProducts = useMemo(() => {
    if (!cleanQuery) return savedProducts;
    return savedProducts.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(cleanQuery) ||
        (p.brandName || "").toLowerCase().includes(cleanQuery) ||
        (p.manufacturer || "").toLowerCase().includes(cleanQuery) ||
        (p.plantName || "").toLowerCase().includes(cleanQuery) ||
        (p.dosageForm || "").toLowerCase().includes(cleanQuery)
    );
  }, [savedProducts, cleanQuery]);

  const filteredGuides = useMemo(() => {
    if (!cleanQuery) return savedGuides;
    return savedGuides.filter(
      (g) =>
        (g.title || "").toLowerCase().includes(cleanQuery) ||
        (g.category || "").toLowerCase().includes(cleanQuery) ||
        (g.plantName || "").toLowerCase().includes(cleanQuery) ||
        (g.description || "").toLowerCase().includes(cleanQuery)
    );
  }, [savedGuides, cleanQuery]);

  const hasSearch = cleanQuery.length > 0;

  // Active items calculation based on the 4 categories
  const showPlants = selectedCategory === "all" || selectedCategory === "plants";
  const showProducts = selectedCategory === "all" || selectedCategory === "products";
  const showGuides = selectedCategory === "all" || selectedCategory === "guides";

  const totalVisibleCount =
    (showPlants ? filteredPlants.length : 0) +
    (showProducts ? filteredProducts.length : 0) +
    (showGuides ? filteredGuides.length : 0);

  // If loading skeleton state
  if (loading) {
    return (
      <div className="space-y-5 sm:space-y-6">
        <div className="w-full h-52 rounded-[24px] bg-[#fcfbf7] border border-[#dcebe1] animate-pulse p-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-4.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SavedCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // If completely empty (no saved items at all)
  if (totalSaved === 0) {
    return (
      <div className="space-y-6 py-4">
        <SavedEmptyState type="all" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="fixed top-20 right-4 sm:right-8 z-50 bg-[#0f2c20] text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-lg border border-emerald-700/50 flex items-center gap-2"
        >
          <span>✓</span>
          <span>{toastMessage}</span>
        </motion.div>
      )}

      {/* 1. SAVED HERO (60% content / 40% mascot with true transparency) */}
      <SavedHero
        plantCount={plantCount}
        productCount={productCount}
        guideCount={guideCount}
      />

      {/* 2. PERSONAL LIBRARY SUMMARY BAR */}
      <SavedLibrarySummary
        plantCount={plantCount}
        productCount={productCount}
        guideCount={guideCount}
      />

      {/* 3. THE 4 FILTER TABS: [ All ] [ Plants ] [ Products ] [ Guides ] & SEARCH */}
      <SavedFilters
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        plantCount={plantCount}
        productCount={productCount}
        guideCount={guideCount}
      />

      {/* 4. SAVED ITEMS GRID (STRICTLY 3 PER ROW ON DESKTOP) */}
      {totalVisibleCount > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-4.5">
          {/* Saved Plants */}
          {showPlants &&
            filteredPlants.map((plant, index) => (
              <motion.div
                key={`plant-${plant.id}`}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.25,
                  delay: shouldReduceMotion ? 0 : Math.min(index * 0.04, 0.25),
                }}
              >
                <SavedPlantCard
                  plant={plant}
                  onRemove={(id) => handleRemove("plant", id)}
                />
              </motion.div>
            ))}

          {/* Saved Commercial Products */}
          {showProducts &&
            filteredProducts.map((product, index) => (
              <motion.div
                key={`product-${product.id}`}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.25,
                  delay: shouldReduceMotion ? 0 : Math.min(index * 0.04, 0.25),
                }}
              >
                <SavedProductCard
                  product={product}
                  onRemove={(id) => handleRemove("product", id)}
                />
              </motion.div>
            ))}

          {/* Saved Preparation Guides */}
          {showGuides &&
            filteredGuides.map((guide, index) => (
              <motion.div
                key={`guide-${guide.id}`}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.25,
                  delay: shouldReduceMotion ? 0 : Math.min(index * 0.04, 0.25),
                }}
              >
                <SavedGuideCard
                  guide={guide}
                  onRemove={(id) => handleRemove("guide", id)}
                />
              </motion.div>
            ))}
        </div>
      ) : hasSearch ? (
        <SavedEmptyState
          type="search"
          searchQuery={searchQuery}
          onClearSearch={() => setSearchQuery("")}
        />
      ) : (
        <SavedEmptyState
          type="filter"
          category={selectedCategory}
          onResetFilter={() => setSelectedCategory("all")}
        />
      )}

      {/* 5. CONTINUE EXPLORING DISCOVERY BANNER */}
      <div className="pt-2">
        <SavedDiscoveryBanner />
      </div>
    </div>
  );
}
