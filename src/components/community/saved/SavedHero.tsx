"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Library2DIcon } from "./SavedIcons2D";

interface SavedHeroProps {
  plantCount: number;
  productCount: number;
  guideCount: number;
}

export default function SavedHero({
  plantCount,
  productCount,
  guideCount,
}: SavedHeroProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isHoveringMascot, setIsHoveringMascot] = useState(false);

  const totalSaved = plantCount + productCount + guideCount;

  // Build dynamic breakdown text (only for existing categories)
  const breakdownParts: string[] = [];
  if (plantCount > 0) breakdownParts.push(`${plantCount} ${plantCount === 1 ? "Plant" : "Plants"}`);
  if (productCount > 0) breakdownParts.push(`${productCount} ${productCount === 1 ? "Product" : "Products"}`);
  if (guideCount > 0) breakdownParts.push(`${guideCount} ${guideCount === 1 ? "Guide" : "Guides"}`);

  return (
    <section className="relative w-full rounded-[24px] bg-gradient-to-br from-[#fcfbf7] via-[#f7faf7] to-[#eff8f2] border border-[#dcebe1] shadow-[0_6px_24px_-4px_rgba(15,44,32,0.06)] p-4 sm:p-5 md:p-6 overflow-visible transition-all">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-1/4 w-56 h-56 bg-amber-300/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-6 left-12 w-48 h-48 bg-emerald-200/15 rounded-full blur-3xl pointer-events-none" />

      {/* Subtle decorative leaf/book watermark SVG */}
      <svg
        className="absolute top-2 right-4 w-28 h-28 text-emerald-600/5 pointer-events-none select-none"
        viewBox="0 0 100 100"
        fill="currentColor"
      >
        <path d="M50 15C35 15 20 22 10 32V85C20 75 35 70 50 70C65 70 80 75 90 85V32C80 22 65 15 50 15Z" />
      </svg>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5 items-center">
        {/* ================================================================= */}
        {/* LEFT CONTENT AREA (~60%)                                          */}
        {/* ================================================================= */}
        <div className="md:col-span-7 lg:col-span-8 space-y-2.5 sm:space-y-3">
          {/* Contextual Label */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50/90 border border-amber-300/60 text-amber-950 text-[11px] font-black shadow-2xs select-none">
            <Library2DIcon className="w-3.5 h-3.5" />
            <span>MY HERBAL LIBRARY</span>
          </div>

          {/* Main Heading & Supporting Description */}
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl lg:text-[28px] font-heading font-black tracking-tight text-[#0f2c20] leading-snug">
              Your Saved Guides
            </h1>
            <p className="text-xs sm:text-[13px] text-[#3b6051] leading-relaxed max-w-lg font-medium">
              Keep your favorite plants, products, and herbal information in one place.
            </p>
          </div>

          {/* Dynamic Summary Breakdown Badge */}
          <div className="pt-1 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-emerald-950 bg-emerald-100/90 px-3 py-1 rounded-full border border-emerald-300/50 shadow-2xs">
              {totalSaved} {totalSaved === 1 ? "Saved Item" : "Saved Items"}
            </span>

            {breakdownParts.length > 0 && (
              <span className="text-[11px] font-bold text-[#52796f] bg-white/80 border border-[#dde6df] px-2.5 py-1 rounded-full">
                {breakdownParts.join(" • ")}
              </span>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT MASCOT READING HERBAL GUIDE (~40%)                          */}
        {/* ================================================================= */}
        <div className="md:col-span-5 lg:col-span-4 flex flex-col sm:flex-row md:flex-col items-center justify-center relative pt-1 md:pt-0">
          {/* Friendly Mascot Speech Bubble */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={shouldReduceMotion ? {} : { scale: 1.04, y: -2 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="relative z-20 mb-1.5 sm:mb-0 md:mb-1 bg-white/95 backdrop-blur-md border border-amber-300/80 shadow-xs rounded-xl px-3 py-1.5 text-center sm:text-left text-[#0f2c20] text-xs font-semibold max-w-[220px] cursor-default select-none"
          >
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-500 shrink-0 animate-pulse" />
              <p className="leading-snug text-[11px] sm:text-xs">
                Your favorites are right here! 🌿
              </p>
            </div>
            {/* Pointer arrow pointing towards mascot */}
            <div className="hidden md:block absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-b border-r border-amber-300/80 rotate-45" />
          </motion.div>

          {/* Interactive Mascot with TRUE ALPHA TRANSPARENCY */}
          <motion.div
            onMouseEnter={() => setIsHoveringMascot(true)}
            onMouseLeave={() => setIsHoveringMascot(false)}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12, scale: 0.97 }}
            animate={
              shouldReduceMotion
                ? { opacity: 1, y: 0, scale: 1 }
                : {
                    opacity: 1,
                    y: isHoveringMascot ? -4 : [0, -3, 0],
                    rotate: isHoveringMascot ? 2 : [0, 0.8, 0],
                    scale: isHoveringMascot ? 1.04 : 1,
                  }
            }
            transition={
              shouldReduceMotion
                ? { duration: 0.3 }
                : {
                    opacity: { duration: 0.4 },
                    y: {
                      duration: isHoveringMascot ? 0.2 : 4.0,
                      repeat: isHoveringMascot ? 0 : Infinity,
                      ease: "easeInOut",
                    },
                    rotate: {
                      duration: isHoveringMascot ? 0.2 : 4.5,
                      repeat: isHoveringMascot ? 0 : Infinity,
                      ease: "easeInOut",
                    },
                  }
            }
            className="relative w-36 sm:w-44 md:w-48 lg:w-52 aspect-[1431/1099] flex items-center justify-center shrink-0 cursor-pointer select-none -mt-1 md:-mt-2"
          >
            {/* Official NaturAide Saved/Library Mascot */}
            <Image
              src="/images/mascot-saved.png"
              alt="NaturAide Herbal Library Mascot"
              width={1431}
              height={1099}
              priority
              className="object-contain w-full h-full select-none pointer-events-none"
            />

            {/* Tiny Floating Golden Bookmarks & Sparkles */}
            {!shouldReduceMotion && (
              <>
                <motion.span
                  className="absolute -top-1 right-2 text-amber-500 pointer-events-none"
                  animate={{
                    y: [0, -4, 0],
                    rotate: [0, 15, 0],
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{
                    duration: 3.0,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M4 2C4 1.4 4.4 1 5 1H11C11.6 1 12 1.4 12 2V15L8 12.5L4 15V2Z" />
                  </svg>
                </motion.span>
                <motion.span
                  className="absolute bottom-2 left-2 text-emerald-500 pointer-events-none"
                  animate={{
                    y: [0, -4, 0],
                    scale: [0.8, 1.2, 0.8],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5,
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z" />
                  </svg>
                </motion.span>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

