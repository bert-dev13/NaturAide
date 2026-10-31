"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Search, ShieldCheck, Sparkles } from "lucide-react";

interface HeroSectionProps {
  firstName: string;
}

const POPULAR_SEARCHES = [
  {
    label: "Lagundi",
    href: "/community/herbal-guide?q=lagundi",
    bg: "bg-emerald-50 hover:bg-emerald-100/90 text-emerald-800 border-emerald-200/90 hover:border-emerald-400",
    dot: "bg-emerald-500",
  },
  {
    label: "Sambong",
    href: "/community/herbal-guide?q=sambong",
    bg: "bg-teal-50 hover:bg-teal-100/90 text-teal-800 border-teal-200/90 hover:border-teal-400",
    dot: "bg-teal-500",
  },
  {
    label: "Ampalaya",
    href: "/community/herbal-guide?q=ampalaya",
    bg: "bg-lime-50 hover:bg-lime-100/90 text-lime-900 border-lime-200/90 hover:border-lime-400",
    dot: "bg-lime-600",
  },
  {
    label: "Cough & Colds",
    href: "/community/herbal-guide?q=cough",
    bg: "bg-amber-50 hover:bg-amber-100/90 text-amber-900 border-amber-200/90 hover:border-amber-400",
    dot: "bg-amber-500",
  },
  {
    label: "Skin Care",
    href: "/community/herbal-guide?q=skin",
    bg: "bg-purple-50 hover:bg-purple-100/90 text-purple-900 border-purple-200/90 hover:border-purple-400",
    dot: "bg-purple-500",
  },
];

export default function HeroSection({ firstName }: HeroSectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isHoveringMascot, setIsHoveringMascot] = useState(false);

  return (
    <section className="relative w-full rounded-[24px] bg-gradient-to-br from-[#ebf6ee] via-[#f5faf6] to-[#fbf8f0] border border-[#d5e7dc] shadow-[0_6px_24px_-4px_rgba(15,44,32,0.06)] p-4 sm:p-5 md:p-6 overflow-visible transition-all">
      {/* Soft botanical ambient background gradients */}
      <div className="absolute top-0 right-1/4 w-56 h-56 bg-emerald-300/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-6 left-12 w-48 h-48 bg-teal-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Decorative botanical watermark SVG */}
      <svg
        className="absolute top-2 right-4 w-24 h-24 text-emerald-600/5 pointer-events-none select-none"
        viewBox="0 0 100 100"
        fill="currentColor"
      >
        <path d="M50 0C50 35 15 50 0 50C35 50 50 85 50 100C50 65 85 50 100 50C65 50 50 15 50 0Z" />
      </svg>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5 items-center">
        {/* ================================================================= */}
        {/* LEFT COMPACT CONTENT AREA (~60%)                                  */}
        {/* ================================================================= */}
        <div className="md:col-span-7 lg:col-span-8 space-y-2.5 sm:space-y-3">
          {/* Trust Credibility Indicator with Shimmer & Spring Hover */}
          <motion.div
            whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100/80 border border-emerald-300/50 text-emerald-900 text-[11px] font-bold shadow-2xs select-none cursor-default"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="truncate">Based on DOH/PITAHC medicinal plant references</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
          </motion.div>

          {/* Friendly Greeting Header */}
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl lg:text-[28px] font-heading font-black tracking-tight text-[#0f2c20] leading-snug flex items-center gap-2">
              <span>Kumusta, {firstName}!</span>
              <motion.span
                animate={
                  shouldReduceMotion
                    ? {}
                    : {
                        rotate: [0, 14, -8, 14, -4, 10, 0],
                      }
                }
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: "easeInOut",
                }}
                className="inline-block origin-bottom-right cursor-pointer text-2xl sm:text-3xl"
              >
                👋
              </motion.span>
            </h1>
            <p className="text-xs sm:text-[13px] text-[#3b6051] leading-relaxed max-w-lg font-medium">
              Explore trusted Philippine medicinal plants, safe-use guidance, and verified herbal products.
            </p>
          </div>

          {/* Compact Interactive Search Bar */}
          <div className="pt-0.5">
            <form
              action="/community/herbal-guide"
              method="GET"
              className="relative flex items-center group"
            >
              <div className="absolute left-3.5 w-4 h-4 text-[#52796f] group-focus-within:text-emerald-700 transition-colors pointer-events-none flex items-center justify-center">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="q"
                placeholder="Search plants, products, uses, or health concerns..."
                className="w-full bg-white text-[#0f2c20] placeholder-[#64746f] text-xs sm:text-[13px] pl-10 pr-20 py-2.5 sm:py-3 rounded-xl shadow-2xs border border-[#cfdfd5] focus:outline-none focus:ring-3 focus:ring-emerald-500/25 focus:border-emerald-600 transition-all font-medium"
              />
              <motion.button
                whileHover={shouldReduceMotion ? {} : { scale: 1.03 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.96 }}
                type="submit"
                className="absolute right-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-700 to-[#0f2c20] hover:brightness-110 active:scale-95 text-white text-xs font-black transition-all cursor-pointer shadow-2xs"
              >
                Search
              </motion.button>
            </form>
          </div>

          {/* Colorful Micro-Animated Popular Search Chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-xs">
            <span className="text-[11px] font-bold text-[#52796f] mr-0.5">Popular:</span>
            {POPULAR_SEARCHES.map((tag) => (
              <motion.div
                key={tag.label}
                whileHover={
                  shouldReduceMotion
                    ? {}
                    : {
                        scale: 1.06,
                        y: -1.5,
                        transition: { type: "spring", stiffness: 450, damping: 20 },
                      }
                }
                whileTap={shouldReduceMotion ? {} : { scale: 0.94 }}
              >
                <Link
                  href={tag.href}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${tag.bg} font-bold text-[11px] border transition-all shadow-2xs`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${tag.dot}`} />
                  <span>{tag.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT COMPACT MASCOT WITH SPEECH BUBBLE & TILT (~40%)             */}
        {/* ================================================================= */}
        <div className="md:col-span-5 lg:col-span-4 flex flex-col sm:flex-row md:flex-col items-center justify-center relative pt-1 md:pt-0">
          {/* Friendly Mascot Speech Bubble with subtle bounce */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={shouldReduceMotion ? {} : { scale: 1.04, y: -2 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="relative z-20 mb-1.5 sm:mb-0 md:mb-1 bg-white/95 backdrop-blur-md border border-emerald-300/80 shadow-xs rounded-xl px-3 py-1.5 text-center sm:text-left text-[#0f2c20] text-xs font-semibold max-w-[210px] cursor-default select-none"
          >
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-500 shrink-0 animate-pulse" />
              <p className="leading-snug text-[11px] sm:text-xs">
                Hi, <span className="text-emerald-800 font-extrabold">{firstName}</span>! What would you like to learn today?
              </p>
            </div>
            {/* Bubble arrow pointing towards mascot */}
            <div className="hidden md:block absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-b border-r border-emerald-300/80 rotate-45" />
          </motion.div>

          {/* Interactive Mascot Container */}
          <motion.div
            onMouseEnter={() => setIsHoveringMascot(true)}
            onMouseLeave={() => setIsHoveringMascot(false)}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={
              shouldReduceMotion
                ? { opacity: 1, y: 0 }
                : {
                    opacity: 1,
                    y: isHoveringMascot ? -5 : [0, -4, 0],
                    rotate: isHoveringMascot ? 2.5 : [-0.8, 0.8, -0.8],
                    scale: isHoveringMascot ? 1.05 : 1,
                  }
            }
            transition={
              shouldReduceMotion
                ? { duration: 0.3 }
                : {
                    opacity: { duration: 0.4 },
                    y: {
                      duration: isHoveringMascot ? 0.2 : 3.4,
                      repeat: isHoveringMascot ? 0 : Infinity,
                      ease: "easeInOut",
                    },
                    rotate: {
                      duration: isHoveringMascot ? 0.2 : 4.0,
                      repeat: isHoveringMascot ? 0 : Infinity,
                      ease: "easeInOut",
                    },
                  }
            }
            className="relative w-36 sm:w-44 md:w-48 lg:w-52 aspect-[987/1024] flex items-center justify-center shrink-0 cursor-pointer select-none -mt-1 md:-mt-2"
          >
            {/* Official NaturAide Mascot Image - 100% transparent background, no box */}
            <Image
              src="/images/mascot-home.png"
              alt="NaturAide Sprout Mascot"
              width={987}
              height={1024}
              priority
              className="object-contain w-full h-full select-none pointer-events-none"
            />

            {/* Floating Leaf Particles */}
            {!shouldReduceMotion && (
              <>
                <motion.span
                  className="absolute -top-1 right-2 text-emerald-500 pointer-events-none"
                  animate={{
                    y: [0, -5, 0],
                    rotate: [0, 18, 0],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 2.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0C8 5 3 8 0 8C5 8 8 13 8 16C8 11 13 8 16 8C11 8 8 3 8 0Z" />
                  </svg>
                </motion.span>
                <motion.span
                  className="absolute bottom-2 left-2 text-amber-400 pointer-events-none"
                  animate={{
                    y: [0, -4, 0],
                    scale: [0.8, 1.2, 0.8],
                    opacity: [0.4, 0.9, 0.4],
                  }}
                  transition={{
                    duration: 3.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.8,
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
