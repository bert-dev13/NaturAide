"use client";

import React, { useState, useEffect } from "react";
import MobileAppHeader from "@/components/community/MobileAppHeader";
import SavedDirectoryView from "@/components/community/saved/SavedDirectoryView";
import {
  SavedPlantItem,
  SavedProductItem,
  SavedGuideItem,
} from "@/components/community/saved/types";

export default function MyHerbalGuidePage() {
  const [loading, setLoading] = useState(true);
  const [savedPlants, setSavedPlants] = useState<SavedPlantItem[]>([]);
  const [savedProducts, setSavedProducts] = useState<SavedProductItem[]>([]);
  const [savedGuides, setSavedGuides] = useState<SavedGuideItem[]>([]);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const savedRes = await fetch("/api/community/saved");
        const savedData = await savedRes.json();

        if (savedRes.status === 403 && savedData.redirect) {
          window.location.href = savedData.redirect;
          return;
        }

        if (active) {
          if (savedData.success) {
            setSavedPlants(savedData.savedPlants || []);
            setSavedProducts(savedData.savedProducts || []);
            setSavedGuides(savedData.savedGuides || []);
          }
        }
      } catch (err) {
        console.error("Error loading user guide collection:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#faf7f2]">
      {/* Top Header (Unmodified) */}
      <MobileAppHeader
        showBack={true}
        backHref="/community"
        title="Saved Guides"
        subtitle="Your personalized herbal library"
      />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-28">
        <SavedDirectoryView
          key={loading ? "loading" : "loaded"}
          initialPlants={savedPlants}
          initialProducts={savedProducts}
          initialGuides={savedGuides}
          loading={loading}
        />
      </main>
    </div>
  );
}
