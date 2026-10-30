"use client";

import React, { useState } from "react";
import RecordImage from "@/components/community/RecordImage";
import ProductImageBadge from "@/components/community/ProductImageBadge";
import Link from "next/link";
import {
  Package,
  ArrowRight,
  Info,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";

export interface RelatedProductItem {
  id: string;
  slug: string;
  name: string;
  brandName: string;
  manufacturer: string;
  productType: string;
  productClassification?: string | null;
  dosageForm: string;
  dosageStrength?: string | null;
  isMultiIngredient?: number | boolean | null;
  imageUrl?: string | null;
  image_path?: string | null;
  image_type?: string | null;
  image_verified?: number | boolean | null;
  image_source?: string | null;
  registrationNumber?: string | null;
  registrationStatus?: string | null;
  regulatoryAgency?: string | null;
  issuanceDate?: string | null;
  expiryDate?: string | null;
  ingredientsList?: string | null;
}

interface RelatedProductsSectionProps {
  plantName: string;
  products: RelatedProductItem[];
}

export default function RelatedProductsSection({
  plantName,
  products = [],
}: RelatedProductsSectionProps) {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showAll, setShowAll] = useState(false);

  if (products.length === 0) {
    return (
      <div className="rounded-3xl bg-white border border-[#dde6df] p-4 shadow-2xs space-y-1.5 text-center">
        <div className="flex items-center justify-center gap-2 text-[#0f2c20]">
          <Package className="w-4 h-4 text-emerald-700" />
          <h3 className="font-heading font-black text-xs sm:text-sm uppercase tracking-wide">
            Herbal Products Containing {plantName}
          </h3>
        </div>
        <p className="text-[11px] text-[#52796f]">
          No commercial products containing {plantName} are currently in the catalog.
        </p>
      </div>
    );
  }

  // If <= 6 products: show them directly. If > 6: show first 4 unless showAll is true
  const displayedProducts = products.length <= 6 || showAll ? products : products.slice(0, 4);

  return (
    <section className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading font-black text-sm text-[#0f2c20] uppercase tracking-wide">
              Commercial Products
            </h3>
            <p className="text-[11px] text-[#52796f]">
              Containing {plantName} ({products.length})
            </p>
          </div>
        </div>

        {/* Small Disclaimer Toggle */}
        <button
          onClick={() => setShowDisclaimer((prev) => !prev)}
          className="inline-flex items-center gap-1 text-[11px] text-[#52796f] hover:text-[#0f2c20] font-bold cursor-pointer py-1 active:scale-95 transition-all"
          aria-expanded={showDisclaimer}
        >
          <Info className="w-3.5 h-3.5 text-emerald-700" />
          <span>About</span>
          <ChevronDown
            className={`w-3 h-3 text-emerald-700 transition-transform duration-300 ${
              showDisclaimer ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Expandable Small Disclaimer */}
      {showDisclaimer && (
        <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-amber-950 text-xs leading-relaxed flex items-start gap-2 animate-in fade-in duration-200">
          <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
          <span>
            Products shown are included for educational and regulatory reference. NaturAide does not endorse, prescribe, or recommend commercial products.
          </span>
        </div>
      )}

      {/* Mobile: Horizontal scrollable carousel / Desktop: Clean responsive grid */}
      <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 snap-x -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
        {displayedProducts.map((prod) => {
          const isActive = (prod.registrationStatus || "").toUpperCase() === "ACTIVE";
          const formattedType = (prod.productType || "Herbal Product").replace(/_/g, " ");

          return (
            <div
              key={prod.id}
              className="min-w-[210px] sm:min-w-0 w-[210px] sm:w-auto shrink-0 snap-start rounded-3xl bg-white border border-[#dde6df] hover:border-emerald-300 p-3 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                {/* Product Image */}
                <div className="relative h-32 w-full rounded-2xl overflow-hidden bg-[#faf7f2] border border-[#edf2ee]">
                  <RecordImage
                    kind="product"
                    src={prod.image_path || prod.imageUrl}
                    isVerified={Boolean(prod.image_verified)}
                    imageType={prod.image_type}
                    alt={prod.name}
                    sizes="(max-width: 640px) 210px, 280px"
                    className="object-contain p-2"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-800 text-white text-[9px] font-black uppercase tracking-wider shadow-2xs">
                      Commercial
                    </span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <ProductImageBadge imageType={prod.image_type} />
                  </div>
                </div>

                {/* Product Identity */}
                <div className="space-y-0.5">
                  <h4 className="font-heading font-black text-xs text-[#0f2c20] line-clamp-2 leading-snug">
                    {prod.name}
                  </h4>
                  <p className="text-[10px] text-[#52796f] font-medium capitalize truncate">
                    {formattedType} {prod.dosageForm ? `• ${prod.dosageForm}` : ""}
                  </p>
                </div>

                {/* Quick Info Tags */}
                <div className="space-y-0.5 text-[10px] pt-1 border-t border-[#edf2ee]">
                  <p className="text-[#3d4a45] flex items-center justify-between">
                    <span className="text-[#52796f]">Ingredient:</span>
                    <strong className="text-[#0f2c20] truncate ml-1">{plantName}</strong>
                  </p>
                  <p className="text-[#3d4a45] flex items-center justify-between">
                    <span className="text-[#52796f]">Status:</span>
                    <span
                      className={`inline-flex items-center gap-0.5 font-bold ${
                        isActive ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {isActive && <CheckCircle2 className="w-2.5 h-2.5" />}
                      <span>{isActive ? "Active" : prod.registrationStatus || "Regulated"}</span>
                    </span>
                  </p>
                </div>
              </div>

              {/* View Product CTA */}
              <div className="pt-2 mt-2 border-t border-[#edf2ee]">
                <Link
                  href={`/community/products/${prod.slug}`}
                  className="w-full py-2 px-3 rounded-2xl bg-[#0f2c20] hover:bg-[#1a4b36] active:scale-95 text-white text-[11px] font-black flex items-center justify-center gap-1 transition-all shadow-2xs min-h-[36px]"
                >
                  <span>View Product</span>
                  <ArrowRight className="w-3 h-3 text-emerald-300" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* If > 6 products and not expanded: show view all toggle */}
      {products.length > 6 && (
        <div className="text-center pt-1">
          <button
            onClick={() => setShowAll((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white border border-[#dde6df] hover:bg-emerald-50 text-xs font-black text-[#0f2c20] transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <span>{showAll ? "Show Fewer" : `View All (${products.length})`}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-emerald-700 transition-transform duration-300 ${
                showAll ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      )}
    </section>
  );
}
