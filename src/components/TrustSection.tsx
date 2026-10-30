"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  Microscope, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  ArrowDown, 
  CheckCircle2,
  Lock,
  Compass
} from "lucide-react";

export function TrustSection() {
  const pathways = [
    {
      title: "Traditional Knowledge",
      desc: "Time-honored knowledge and preparation practices.",
      icon: BookOpen,
      badgeText: "01 · Ancestral Wisdom",
      color: "bg-amber-50 text-amber-900 border-amber-200",
      accentBg: "bg-amber-100/60",
      strokeColor: "#f59e0b",
      dotColor: "bg-amber-500",
    },
    {
      title: "Scientific Research",
      desc: "Research and available scientific evidence.",
      icon: Microscope,
      badgeText: "02 · Empirical Data",
      color: "bg-teal-50 text-teal-900 border-teal-200",
      accentBg: "bg-teal-100/60",
      strokeColor: "#14b8a6",
      dotColor: "bg-[#14b8a6]",
    },
    {
      title: "Expert Review",
      desc: "Qualified professionals reviewing evidence and safety information.",
      icon: ShieldCheck,
      badgeText: "03 · Health Verification",
      color: "bg-emerald-50 text-emerald-900 border-emerald-200",
      accentBg: "bg-emerald-100/60",
      strokeColor: "#16a34a",
      dotColor: "bg-emerald-500",
    },
  ];

  const standards = [
    "Clear information",
    "Important safety guidance",
    "Accessible knowledge"
  ];

  return (
    <section 
      id="trust" 
      className="py-24 sm:py-32 bg-[#faf8f5] relative overflow-hidden border-t border-[#e2ebe4]"
    >
      {/* Background Soft Ambient Light */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full mb-4 border border-[#d6e3da] shadow-2xs"
          >
            <ShieldCheck className="w-4 h-4 text-[#16a34a]" />
            <span className="text-xs font-semibold text-[#143d2b] tracking-wide">
              Our Promise of Clarity
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-[#143d2b] tracking-tight leading-[1.15]"
          >
            Information You Can Trust.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 text-base sm:text-lg text-[#4a5a50] leading-relaxed max-w-2xl mx-auto font-normal"
          >
            NaturAide brings traditional knowledge, scientific research, and expert review together to provide clearer and more responsible herbal information.
          </motion.p>
        </div>

        {/* VISUAL CONVERGENCE CONCEPT CONTAINER */}
        <div className="max-w-5xl mx-auto">
          
          {/* Top 3 Input Pathways */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {pathways.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.15 }}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e2ebe4] hover:border-[#16a34a]/30 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group text-center relative"
                >
                  <div className="flex flex-col items-center">
                    {/* Top Pathway Badge */}
                    <span className="text-[10px] font-bold tracking-wider uppercase text-[#78a386] mb-3">
                      {item.badgeText}
                    </span>

                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-2xl ${item.color} border flex items-center justify-center mb-4 shadow-2xs group-hover:scale-105 transition-transform duration-300`}>
                      <Icon className="w-6 h-6" />
                    </div>

                    {/* Title */}
                    <h3 className="font-heading font-extrabold text-xl text-[#143d2b] mb-2">
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-[#4a5a50] leading-relaxed font-normal">
                      {item.desc}
                    </p>
                  </div>

                  {/* Convergence Indicator Dot */}
                  <div className="mt-5 pt-3 border-t border-[#e2ebe4]/60 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#78a386]">
                    <span className={`w-2 h-2 rounded-full ${item.dotColor} animate-pulse`} />
                    <span>Pathway Stream</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ANIMATED CONVERGENCE CONNECTOR TRACKS */}
          <div className="relative py-6 sm:py-8 flex flex-col items-center justify-center">
            {/* Desktop SVG Convergence Lines */}
            <svg
              className="hidden md:block w-full max-w-2xl h-24 text-emerald-300"
              viewBox="0 0 600 80"
              fill="none"
              preserveAspectRatio="none"
            >
              {/* Left stream -> Center */}
              <motion.path
                d="M 100 0 C 100 45, 300 35, 300 80"
                stroke="#cbd5e1"
                strokeWidth="2.5"
                strokeDasharray="6 6"
              />
              {/* Center stream -> Center */}
              <motion.path
                d="M 300 0 L 300 80"
                stroke="#cbd5e1"
                strokeWidth="2.5"
                strokeDasharray="6 6"
              />
              {/* Right stream -> Center */}
              <motion.path
                d="M 500 0 C 500 45, 300 35, 300 80"
                stroke="#cbd5e1"
                strokeWidth="2.5"
                strokeDasharray="6 6"
              />

              {/* Animated glowing convergence pulse */}
              <motion.circle
                cx="300"
                cy="40"
                r="4"
                fill="#16a34a"
                animate={{ cy: [10, 75], opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              />
            </svg>

            {/* Central Convergence Focal Badge */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2 bg-white px-5 py-2 rounded-full border border-[#d6e3da] shadow-sm z-10"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-[#16a34a] animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#143d2b]">
                Subtle Convergence into NaturAide
              </span>
            </motion.div>
          </div>

          {/* CLEAN NATURAIDE CORE STANDARD PANEL */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-[#143d2b] text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-white/10 relative overflow-hidden text-center"
          >
            {/* Subtle botanical glow backdrop */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto space-y-5">
              
              {/* NaturAide Logo & Badge */}
              <div className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15">
                <div className="w-6 h-6 rounded-lg overflow-hidden bg-white p-0.5">
                  <Image
                    src="/images/nature-logo.png"
                    alt="NaturAide logo"
                    width={24}
                    height={24}
                    className="object-contain w-full h-full"
                  />
                </div>
                <span className="text-xs font-bold tracking-wide uppercase text-[#a7f3d0]">
                  NaturAide Core Standard
                </span>
              </div>

              {/* The Mandated Core Statement */}
              <blockquote className="text-xl sm:text-2xl lg:text-[1.65rem] font-heading font-extrabold text-white leading-snug tracking-tight">
                “Herbal information should be understandable for communities, useful for researchers, and responsibly reviewed for health and safety.”
              </blockquote>

              {/* 3 Small Trust Indicators */}
              <div className="pt-4 border-t border-white/15 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm font-semibold text-[#d1fae5]">
                {standards.map((standard, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#16a34a] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <span>{standard}</span>
                  </div>
                ))}
              </div>

            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}

