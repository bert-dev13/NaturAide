"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import RecordImage from "@/components/community/RecordImage";
import { isVerifiedProductImage, getProductImageKind } from "@/lib/record-images";
import ProductImageBadge from "@/components/community/ProductImageBadge";
import MobileAppHeader from "@/components/community/MobileAppHeader";
import EmptyState from "@/components/community/EmptyState";
import {
  BookmarkCheck,
  Coffee,
  Clock,
  Trash2,
  ChevronRight,
  Loader2,
  Leaf,
  Search,
} from "lucide-react";

type TabType = "plants" | "products" | "guides" | "recent";

export default function MyHerbalGuidePage() {
  const [activeTab, setActiveTab] = useState<TabType>("plants");
  const [loading, setLoading] = useState(true);
  const [savedPlants, setSavedPlants] = useState<any[]>([]);
  const [savedProducts, setSavedProducts] = useState<any[]>([]);
  const [savedGuides, setSavedGuides] = useState<any[]>([]);
  const [recentPlants, setRecentPlants] = useState<any[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [savedRes, recentRes] = await Promise.all([
        fetch("/api/community/saved"),
        fetch("/api/community/recently-viewed"),
      ]);
      const savedData = await savedRes.json();
      const recentData = await recentRes.json();

      if (savedRes.status === 403 && savedData.redirect) {
        window.location.href = savedData.redirect;
        return;
      }

      if (savedData.success) {
        setSavedPlants(savedData.savedPlants || []);
        setSavedProducts(savedData.savedProducts || []);
        setSavedGuides(savedData.savedGuides || []);
      }
      if (recentData.success) {
        setRecentPlants(recentData.recentPlants || []);
      }
    } catch (err) {
      console.error("Error loading user guide collection:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRemoveItem = async (e: React.MouseEvent, type: "plant" | "product" | "guide", id: string | number) => {
    e.preventDefault();
    e.stopPropagation();
    setActionLoadingId(id);
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
        } else {
          setSavedGuides((prev) => prev.filter((g) => String(g.id) !== String(id)));
        }
      }
    } catch (err) {
      console.error("Failed to remove item:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* App Header */}
      <MobileAppHeader
        showBack={true}
        backHref="/community"
        title="My Herbal Guide"
        subtitle="Your personalized collection of herbal wisdom"
      />

      <div className="flex-1 px-4 sm:px-6 py-4 space-y-5">
        {/* Segmented Controls / Mobile Tabs */}
        <div className="bg-[#edf2ee] p-1.5 rounded-2xl flex items-center gap-1 shadow-2xs">
          <button
            onClick={() => setActiveTab("plants")}
            type="button"
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer select-none text-center ${
              activeTab === "plants"
                ? "bg-white text-[#0f2c20] shadow-xs"
                : "text-[#52796f] hover:text-[#0f2c20]"
            }`}
          >
            Saved Plants ({savedPlants.length})
          </button>

          <button
            onClick={() => setActiveTab("products")}
            type="button"
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer select-none text-center ${
              activeTab === "products"
                ? "bg-white text-[#0f2c20] shadow-xs"
                : "text-[#52796f] hover:text-[#0f2c20]"
            }`}
          >
            Commercial Products ({savedProducts.length})
          </button>

          <button
            onClick={() => setActiveTab("guides")}
            type="button"
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer select-none text-center ${
              activeTab === "guides"
                ? "bg-white text-[#0f2c20] shadow-xs"
                : "text-[#52796f] hover:text-[#0f2c20]"
            }`}
          >
            Preparation ({savedGuides.length})
          </button>

          <button
            onClick={() => setActiveTab("recent")}
            type="button"
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer select-none text-center ${
              activeTab === "recent"
                ? "bg-white text-[#0f2c20] shadow-xs"
                : "text-[#52796f] hover:text-[#0f2c20]"
            }`}
          >
            Recent ({recentPlants.length})
          </button>
        </div>

        {/* Content list */}
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <p className="text-xs sm:text-sm text-[#52796f]">Loading your saved guides...</p>
          </div>
        ) : activeTab === "plants" ? (
          savedPlants.length === 0 ? (
            <EmptyState
              title="Your herbal guide is waiting for you."
              description="You haven't saved any medicinal plants yet. Browse our verified herbal finder to bookmark your favorite traditional herbs."
              actionHref="/community/herbal-guide"
              actionLabel="Explore Herbal Guide"
            />
          ) : (
            <div className="space-y-3">
              {savedPlants.map((plant) => (
                <div
                  key={plant.id}
                  className="bg-white rounded-3xl border border-[#dde6df] overflow-hidden shadow-2xs hover:border-emerald-500 transition-all flex flex-col sm:flex-row items-stretch"
                >
                  <Link
                    href={`/community/plants/${plant.slug || plant.id}`}
                    className="relative w-full sm:w-36 h-36 sm:h-auto bg-[#edf2ee] shrink-0 block"
                  >
                    <RecordImage
                      kind="plant"
                      src={plant.imageUrl}
                      alt={plant.commonName}
                      sizes="(max-width: 640px) 100vw, 144px"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-bold text-[#0f2c20]">
                      {plant.category}
                    </div>
                  </Link>

                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div>
                      <Link href={`/community/plants/${plant.slug || plant.id}`} className="block group">
                        <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#0f2c20] group-hover:text-emerald-700 transition-colors">
                          {plant.commonName}
                        </h3>
                        <p className="text-xs italic text-[#52796f] mt-0.5">
                          {plant.scientificName}
                        </p>
                      </Link>

                      {plant.simpleUse && (
                        <p className="text-xs sm:text-sm text-[#3d4a45] line-clamp-2 mt-2 leading-relaxed">
                          {plant.simpleUse}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#f0f4f1]">
                      <Link
                        href={`/community/plants/${plant.slug || plant.id}`}
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#1e5c44] hover:text-emerald-700"
                      >
                        <span>Open Guide</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={(e) => handleRemoveItem(e, "plant", plant.id)}
                        disabled={actionLoadingId === plant.id}
                        aria-label="Remove plant from saved"
                        className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-bold px-3 py-1.5 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        {actionLoadingId === plant.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === "products" ? (
          savedProducts.length === 0 ? (
            <EmptyState
              title="No commercial products saved"
              description="Explore commercial herbal formulations with verified evidence and regulatory records."
              actionHref="/community"
              actionLabel="Explore Herbal Products"
            />
          ) : (
            <div className="space-y-3">
              {savedProducts.map((prod) => {
                const imageKind = prod.image_type || getProductImageKind(prod.image_path || prod.imageUrl, prod.image_verified);
                return (
                  <div
                    key={prod.id}
                    className="bg-white rounded-3xl border border-[#dde6df] overflow-hidden shadow-2xs hover:border-emerald-500 transition-all flex flex-col sm:flex-row items-stretch"
                  >
                    <Link
                      href={`/community/products/${prod.slug || prod.id}`}
                      className="relative w-full sm:w-36 h-36 sm:h-auto bg-[#faf9f5] border-b sm:border-b-0 sm:border-r border-[#dde6df] shrink-0 block flex items-center justify-center p-2"
                    >
                      <RecordImage
                        kind="product"
                        src={prod.image_path || prod.imageUrl}
                        isVerified={imageKind === "AUTHENTIC_PRODUCT"}
                        imageType={imageKind}
                        alt={prod.name}
                        sizes="(max-width: 640px) 100vw, 144px"
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-bold text-[#0f2c20] border border-[#dde6df]">
                        {prod.dosageForm || prod.productType}
                      </div>
                    </Link>

                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <ProductImageBadge imageType={imageKind} />
                        {prod.registrationNumber && (
                          <span className="text-[10px] font-bold text-[#52796f]">
                            Reg: {prod.registrationNumber}
                          </span>
                        )}
                      </div>

                      <Link href={`/community/products/${prod.slug || prod.id}`} className="block group mt-1">
                        <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#0f2c20] group-hover:text-emerald-700 transition-colors">
                          {prod.name}
                        </h3>
                        <p className="text-xs text-[#52796f] mt-0.5">
                          {prod.brandName} &bull; {prod.manufacturer}
                        </p>
                      </Link>

                      {prod.plantName && (
                        <p className="text-xs text-emerald-800 font-medium mt-1">
                          Herbal Source: {prod.plantName}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#f0f4f1]">
                      <Link
                        href={`/community/products/${prod.slug || prod.id}`}
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#1e5c44] hover:text-emerald-700"
                      >
                        <span>View Product &amp; Evidence</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={(e) => handleRemoveItem(e, "product", prod.id)}
                        disabled={actionLoadingId === prod.id}
                        aria-label="Remove product from saved"
                        className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-bold px-3 py-1.5 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        {actionLoadingId === prod.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          )
        ) : activeTab === "guides" ? (
          savedGuides.length === 0 ? (
            <EmptyState
              title="No preparation recipes saved"
              description="Learn how to prepare teas, infusions, and decoctions with step-by-step guidance."
              actionHref="/community/preparation-guide"
              actionLabel="Browse Preparation Guide"
            />
          ) : (
            <div className="space-y-3">
              {savedGuides.map((guide) => (
                <div
                  key={guide.id}
                  className="bg-white rounded-3xl border border-[#dde6df] p-4 sm:p-5 shadow-2xs space-y-3 hover:border-amber-400 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                        <Coffee className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">
                          {guide.category}
                        </span>
                        <h3 className="font-heading font-extrabold text-base text-[#0f2c20]">
                          {guide.title}
                        </h3>
                        {guide.plantName && (
                          <p className="text-xs text-[#52796f] font-medium">
                            Plant: {guide.plantName}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#f0f4f1]">
                    <Link
                      href="/community/preparation-guide"
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#1e5c44] hover:text-emerald-700"
                    >
                      <span>View Recipe Steps</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      onClick={(e) => handleRemoveItem(e, "guide", guide.id)}
                      disabled={actionLoadingId === guide.id}
                      className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-bold px-3 py-1.5 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      {actionLoadingId === guide.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* RECENT PLANTS */
          recentPlants.length === 0 ? (
            <EmptyState
              title="No recently viewed remedies"
              description="As you explore plants in the Herbal Finder, your recently visited monographs will show here for quick reference."
              actionHref="/community/herbal-guide"
              actionLabel="Explore Herbal Guide"
            />
          ) : (
            <div className="space-y-3">
              {recentPlants.map((plant) => (
                <Link
                  key={plant.id}
                  href={`/community/plants/${plant.slug || plant.id}`}
                  className="flex items-center gap-3.5 p-3.5 rounded-3xl bg-white border border-[#dde6df] hover:border-emerald-500 shadow-2xs group transition-all"
                >
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-[#edf2ee] shrink-0">
                    <RecordImage kind="plant" src={plant.imageUrl} alt={plant.commonName} sizes="56px" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-heading font-extrabold text-base text-[#0f2c20] truncate group-hover:text-emerald-700">
                        {plant.commonName}
                      </h4>
                      {plant.category && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-900 shrink-0">
                          {plant.category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs italic text-[#52796f] truncate mt-0.5">
                      {plant.scientificName}
                    </p>
                  </div>

                  <ChevronRight className="w-5 h-5 text-[#78997f] group-hover:text-[#0f2c20] shrink-0" />
                </Link>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
