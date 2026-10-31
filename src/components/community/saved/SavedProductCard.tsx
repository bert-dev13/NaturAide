"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { BookmarkCheck, Loader2 } from "lucide-react";
import RecordImage from "@/components/community/RecordImage";
import { RegisteredShield2DIcon } from "../products/ProductIcons2D";
import { CardArrow2DIcon, AllPlants2DIcon } from "../plants/PlantsIcons2D";
import { SavedProductItem } from "./types";

interface SavedProductCardProps {
  product: SavedProductItem;
  onRemove: (id: string | number) => Promise<void>;
}

export default function SavedProductCard({ product, onRemove }: SavedProductCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const [removing, setRemoving] = useState(false);

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (removing) return;

    setRemoving(true);
    try {
      await onRemove(product.id);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <motion.div
      whileHover={
        shouldReduceMotion
          ? {}
          : {
              y: -4,
              transition: { type: "spring", stiffness: 350, damping: 24 },
            }
      }
      className="group rounded-2xl bg-white border border-[#dde6df] hover:border-teal-400 shadow-[0_2px_10px_-2px_rgba(15,44,32,0.05)] hover:shadow-[0_8px_24px_-4px_rgba(13,148,136,0.16)] transition-all duration-200 overflow-hidden flex flex-col justify-between"
    >
      {/* 1. Product Image Area */}
      <div className="relative h-36 sm:h-40 w-full bg-[#fbfcfb] flex items-center justify-center p-3 border-b border-[#edf2ee] overflow-hidden">
        <RecordImage
          kind="product"
          src={product.image_path || product.imageUrl}
          isVerified={product.image_verified}
          imageType={product.image_type}
          alt={product.name}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
          className="object-contain p-2 group-hover:scale-105 transition-transform duration-400 ease-out"
        />

        {/* Top-Left: Registered 2D Shield Badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span
            title="Philippine registered herbal formulation"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider shadow-2xs border border-emerald-400/30"
          >
            <RegisteredShield2DIcon className="w-3 h-3" />
            <span>Registered</span>
          </span>
        </div>

        {/* Top-Right: Warm Gold Active Bookmark Button */}
        <motion.button
          type="button"
          onClick={handleRemove}
          disabled={removing}
          whileTap={shouldReduceMotion ? {} : { scale: 0.85 }}
          whileHover={shouldReduceMotion ? {} : { scale: 1.08 }}
          aria-label={`Remove ${product.name} from saved items`}
          title={`Remove ${product.name} from saved items`}
          className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-amber-400 hover:bg-amber-500 text-amber-950 ring-2 ring-white/90 shadow-xs cursor-pointer transition-all active:scale-90"
        >
          {removing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-950" />
          ) : (
            <BookmarkCheck className="w-4 h-4 fill-amber-950 text-amber-950" />
          )}
        </motion.button>
      </div>

      {/* 2. Compact Content Body */}
      <div className="p-3 sm:p-3.5 space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          {/* Product Name */}
          <h3 className="font-heading font-black text-sm sm:text-base text-[#0f2c20] line-clamp-1 group-hover:text-teal-900 transition-colors leading-tight">
            {product.name}
          </h3>

          {/* Brand or Manufacturer */}
          {(product.brandName || product.manufacturer) && (
            <p className="text-[11px] text-[#52796f] truncate font-medium">
              {product.brandName || product.manufacturer}
            </p>
          )}

          {/* Metadata Row */}
          <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
            {product.plantName && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200/80 text-[10px] sm:text-[11px] font-bold shadow-2xs">
                <AllPlants2DIcon className="w-3 h-3" />
                <span>{product.plantName}</span>
              </span>
            )}

            {product.dosageForm && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                {product.dosageForm}
              </span>
            )}
          </div>
        </div>

        {/* 3. Footer Action Link */}
        <div className="pt-2 border-t border-[#edf2ee]">
          <Link
            href={`/community/products/${product.slug || product.id}`}
            className="flex items-center justify-between text-xs font-black text-[#0f2c20] group-hover:text-teal-900 transition-colors py-0.5 group/btn"
          >
            <span>View Product</span>
            <div className="flex items-center gap-1 transition-transform group-hover/btn:translate-x-1 duration-200">
              <CardArrow2DIcon className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
