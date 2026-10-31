"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

export default function MascotAssistantBanner() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative w-full rounded-[24px] bg-gradient-to-br from-[#ebf7f0] via-[#f3faf5] to-[#fcfaf4] border border-[#d2e4d7] shadow-[0_6px_20px_-3px_rgba(15,44,32,0.05)] p-5 sm:p-6 md:p-7 overflow-visible">
      {/* Botanical background glow and subtle leaf silhouette */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />
      <svg
        className="absolute bottom-2 right-4 w-28 h-28 text-emerald-700/5 pointer-events-none select-none"
        viewBox="0 0 100 100"
        fill="currentColor"
      >
        <path d="M50 0C50 35 15 50 0 50C35 50 50 85 50 100C50 65 85 50 100 50C65 50 50 15 50 0Z" />
      </svg>

      <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5 sm:gap-7">
        {/* Mascot on Left with Peeking Effect and Idle Micro-Animation */}
        <motion.div
          animate={
            shouldReduceMotion
              ? {}
              : {
                  y: [0, -3, 0],
                  rotate: [-0.5, 0.5, -0.5],
                }
          }
          transition={{
            duration: 3.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative w-36 sm:w-44 md:w-48 aspect-[987/1024] shrink-0 -mt-3 sm:-mt-5 sm:-ml-2"
        >
          {/* Official NaturAide Mascot Image - Completely transparent background */}
          <Image
            src="/images/mascot-home.png"
            alt="NaturAide Assistant Mascot"
            width={987}
            height={1024}
            className="object-contain w-full h-full select-none pointer-events-none"
          />
        </motion.div>

        {/* Content on Right */}
        <div className="flex-1 text-center sm:text-left space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100/80 border border-purple-200 text-purple-900 text-[11px] font-bold shadow-2xs">
            <Sparkles className="w-3 h-3 text-purple-700" />
            <span>AI Herbal Assistant</span>
          </div>

          <div className="space-y-1">
            <h3 className="font-heading font-black text-lg sm:text-xl text-[#0f2c20] tracking-tight leading-snug">
              Not sure what to search?
            </h3>
            <p className="text-xs sm:text-sm text-[#476859] leading-relaxed font-medium max-w-md">
              Ask NaturAide for simple, evidence-based herbal information.
            </p>
          </div>

          {/* 3 Small Credibility / Trust Points */}
          <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-4 flex-wrap text-[11px] font-bold text-emerald-900 pt-0.5">
            <span className="inline-flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
              <span>Simple explanations</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
              <span>Evidence-based references</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
              <span>Filipino or English</span>
            </span>
          </div>

          {/* Call to Action Button */}
          <div className="pt-1.5">
            <Link
              href="/community/ask"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 via-emerald-800 to-[#0f2c20] hover:brightness-110 active:scale-95 text-white text-xs font-black transition-all shadow-xs cursor-pointer"
            >
              <span>Ask NaturAide</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-300" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

