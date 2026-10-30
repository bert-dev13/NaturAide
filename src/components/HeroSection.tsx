"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Check, 
  Sprout, 
  Leaf,
  Sparkles
} from "lucide-react";

export function HeroSection() {
  const trustIndicators = [
    "Easy to Understand",
    "Backed by Research",
    "Expert Reviewed"
  ];

  return (
    <section 
      id="hero" 
      className="relative min-h-[92vh] lg:min-h-[94vh] flex items-center pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-24 overflow-hidden bg-[#faf8f5]"
    >
      {/* BACKGROUND IMAGE INTEGRATION (hero-image.png) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        {/* Next.js Image: Positioned to showcase the medicinal plants & lab elements on the right */}
        <Image
          src="/images/hero-image.png"
          alt="NatureAide botanical medicinal herbs, traditional extracts, and modern scientific laboratory research"
          fill
          priority
          quality={90}
          sizes="100vw"
          className="object-cover object-[70%_center] sm:object-[78%_center] md:object-[82%_center] lg:object-[88%_center] xl:object-right transition-transform duration-1000 ease-out"
        />

        {/* Desktop/Tablet Horizontal Gradient Overlay:
            Keeps the left side crisp, clean, and easily readable while allowing the right side's botanical plants and scientific glassware to shine through vibrantly */}
        <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-[#faf8f5] via-[#faf8f5]/92 via-40% lg:via-48% to-[#faf8f5]/15 lg:to-transparent" />

        {/* Mobile Vertical + Horizontal Gradient Overlay:
            Ensures text readability on smaller screens while keeping the botanical composition visible */}
        <div className="md:hidden absolute inset-0 bg-gradient-to-b from-[#faf8f5]/95 via-[#faf8f5]/85 via-55% to-[#faf8f5]/70" />

        {/* Subtle Top & Bottom Blends to seamlessly merge with the Navbar and following sections */}
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-[#faf8f5] via-[#faf8f5]/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#faf8f5] via-[#faf8f5]/60 to-transparent" />

        {/* Soft Ambient Botanical Glow */}
        <div className="absolute top-1/3 right-1/4 w-[420px] h-[420px] bg-emerald-400/10 rounded-full blur-3xl" />
      </div>

      {/* SUBTLE FLOATING BOTANICAL PARTICLES (Ambient Life) */}
      <motion.div
        animate={{ 
          y: [0, -14, 0], 
          x: [0, 6, 0],
          rotate: [0, 8, 0] 
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 9, 
          ease: "easeInOut" 
        }}
        className="absolute top-36 left-6 lg:left-12 text-[#15803d]/15 pointer-events-none hidden sm:block z-10"
      >
        <Leaf className="w-10 h-10 rotate-12" />
      </motion.div>

      <motion.div
        animate={{ 
          y: [0, 16, 0], 
          x: [0, -8, 0],
          rotate: [0, -10, 0] 
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 11, 
          ease: "easeInOut", 
          delay: 1.5 
        }}
        className="absolute bottom-28 left-1/3 text-[#15803d]/10 pointer-events-none hidden md:block z-10"
      >
        <Sprout className="w-8 h-8" />
      </motion.div>

      {/* HERO MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT CONTENT COLUMN */}
          <div className="lg:col-span-7 xl:col-span-6 space-y-6 sm:space-y-7 text-left">
            
            {/* BADGE */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="inline-flex items-center gap-2.5 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-[#d6e3da] shadow-xs"
            >
              <span className="flex h-2.5 w-2.5 rounded-full bg-[#16a34a] ring-4 ring-[#16a34a]/20 animate-pulse" />
              <span className="text-xs sm:text-sm font-semibold text-[#143d2b] tracking-wide">
                Herbal Knowledge, Backed by Research
              </span>
            </motion.div>

            {/* HEADING */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-[4rem] font-heading font-extrabold text-[#143d2b] tracking-tight leading-[1.12]"
            >
              Discover Nature. <br />
              <span className="text-[#16a34a] relative inline-block mt-1">
                Understand the Science.
              </span>
            </motion.h1>

            {/* DESCRIPTION */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="text-base sm:text-lg lg:text-xl text-[#3d5245] max-w-xl leading-relaxed font-normal"
            >
              NatureAide brings trusted herbal knowledge, research, and expert guidance together in one place.
            </motion.p>

            {/* BUTTONS */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2"
            >
              {/* Primary Button */}
              <a
                href="#plants"
                className="inline-flex items-center justify-center gap-2.5 text-sm sm:text-base font-semibold text-white bg-[#143d2b] hover:bg-[#1b533a] px-7 py-3.5 sm:py-4 rounded-full shadow-md shadow-[#143d2b]/15 hover:shadow-lg hover:shadow-[#143d2b]/25 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 group cursor-pointer"
              >
                <span>Explore NatureAide</span>
                <ArrowRight className="w-4 h-4 text-[#a7f3d0] group-hover:translate-x-1 transition-transform duration-200" />
              </a>

              {/* Secondary Button */}
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 text-sm sm:text-base font-semibold text-[#143d2b] bg-white/85 hover:bg-white border border-[#d6e3da] hover:border-[#16a34a]/40 px-7 py-3.5 sm:py-4 rounded-full shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer backdrop-blur-sm"
              >
                <span>Learn How It Works</span>
              </a>
            </motion.div>

            {/* TRUST INDICATORS */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              className="pt-6 sm:pt-8 border-t border-[#143d2b]/10 flex flex-wrap items-center gap-x-6 gap-y-3"
            >
              {trustIndicators.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#16a34a]/15 text-[#16a34a] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-[#2d4235]">
                    {item}
                  </span>
                </div>
              ))}
            </motion.div>

          </div>

          {/* RIGHT COLUMN SPACER:
              Allows the botanical composition (plants, mortar, flask, test tubes) of hero-image.png
              in the background to remain fully visible and naturally breathe without any card obstruction */}
          <div className="hidden lg:block lg:col-span-5 xl:col-span-6 pointer-events-none select-none min-h-[340px]" />

        </div>
      </div>
    </section>
  );
}

