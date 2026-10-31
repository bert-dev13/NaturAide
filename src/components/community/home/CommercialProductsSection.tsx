"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Leaf, Package, Pill } from "lucide-react";
import RecordImage from "@/components/community/RecordImage";
import ProductImageBadge from "@/components/community/ProductImageBadge";

interface ProductItem {
  id: number | string;
  slug: string;
  name: string;
  brandName?: string;
  manufacturer?: string;
  productType?: string;
  dosageForm?: string;
  imageUrl?: string;
  image_path?: string;
  image_type?: string;
  image_verified?: boolean | number;
  plantName?: string;
  registrationNumber?: string;
  regulatoryAgency?: string;
}

interface CommercialProductsSectionProps {
  products: ProductItem[];
}

export default function CommercialProductsSection({
  products,
}: CommercialProductsSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -280 : 280;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-heading font-black text-lg sm:text-xl text-[#0f2c20] tracking-tight">
            Commercial Herbal Products
          </h2>
          <p className="text-xs sm:text-sm text-[#52796f] font-medium">
            Explore herbal products with available regulatory information.
          </p>
        </div>

        {/* View All & Arrows */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/community/herbal-guide?tab=products"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-extrabold text-teal-800 hover:text-teal-950 transition-colors"
          >
            <span>View All Products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => handleScroll("left")}
              aria-label="Scroll left"
              className="w-8 h-8 rounded-full border border-[#dce7e0] bg-white hover:bg-teal-50 text-[#0f2c20] flex items-center justify-center transition-colors shadow-2xs active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleScroll("right")}
              aria-label="Scroll right"
              className="w-8 h-8 rounded-full border border-[#dce7e0] bg-white hover:bg-teal-50 text-[#0f2c20] flex items-center justify-center transition-colors shadow-2xs active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Products Horizontal Carousel */}
      {products.length > 0 ? (
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-3 pt-1 -mx-3.5 px-3.5 sm:-mx-6 sm:px-6 snap-x snap-mandatory scrollbar-none"
        >
          {products.map((product) => (
            <div key={product.id} className="snap-start shrink-0">
              <div className="w-64 sm:w-72 bg-white rounded-[20px] overflow-hidden border border-[#dde6df] hover:border-teal-400 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
                {/* Product Image Area */}
                <div className="relative h-40 w-full bg-[#faf9f5] border-b border-[#eef3f0] overflow-hidden flex items-center justify-center p-3">
                  <RecordImage
                    kind="product"
                    src={product.image_path || product.imageUrl}
                    isVerified={Boolean(product.image_verified)}
                    imageType={product.image_type}
                    alt={product.name}
                    sizes="(max-width: 640px) 256px, 288px"
                    className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Dosage Form & Image Badge */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 z-10">
                    {product.dosageForm ? (
                      <span className="px-2 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-[10px] font-extrabold text-[#0f2c20] shadow-2xs flex items-center gap-1 border border-slate-200">
                        <Pill className="w-2.5 h-2.5 text-teal-700" />
                        <span>{product.dosageForm}</span>
                      </span>
                    ) : (
                      <span />
                    )}

                    <ProductImageBadge imageType={product.image_type} />
                  </div>

                  {/* Linked Medicinal Herb */}
                  {product.plantName && (
                    <div className="absolute bottom-2 left-2.5 right-2.5 z-10">
                      <span className="text-[10px] font-bold text-[#0f2c20] bg-white/95 border border-[#dde6df] px-2 py-0.5 rounded-full backdrop-blur-md shadow-2xs flex items-center gap-1 w-fit truncate max-w-full">
                        <Leaf className="w-2.5 h-2.5 text-emerald-700 shrink-0" />
                        <span className="truncate">Herb: {product.plantName}</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    {/* Status Badge */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-900 border border-teal-200 text-[9px] font-extrabold">
                        {product.productType || "HERBAL_MEDICINE"}
                      </span>
                      {product.registrationNumber && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-bold">
                          ✓ CPR Registered
                        </span>
                      )}
                    </div>

                    <h3 className="font-heading font-black text-sm text-[#0f2c20] line-clamp-2 leading-snug pt-0.5">
                      {product.name}
                    </h3>

                    <p className="text-xs text-[#52796f] truncate font-medium">
                      {product.brandName || product.manufacturer}
                    </p>
                  </div>

                  {/* View Product Button */}
                  <Link
                    href={`/community/products/${product.slug || product.id}`}
                    className="inline-flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl bg-[#0f2c20] hover:bg-[#1a4b36] active:scale-95 text-white text-xs font-black transition-all shadow-2xs cursor-pointer"
                  >
                    <span>View Product</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-300" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 rounded-[20px] bg-white border border-[#dde6df] text-center space-y-2 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-extrabold text-sm text-[#0f2c20]">
            No commercial herbal products cataloged yet
          </h3>
          <p className="text-xs text-[#52796f] max-w-sm mx-auto">
            Verified commercial products linked to medicinal plants will appear here once registered.
          </p>
        </div>
      )}

      {/* Mobile-only View All Link */}
      <div className="sm:hidden pt-1 text-center">
        <Link
          href="/community/herbal-guide?tab=products"
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-teal-800 hover:text-teal-950"
        >
          <span>View All Products</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}

