"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sprout, 
  ArrowRight, 
  X, 
  ShieldCheck, 
  Heart, 
  BookOpen,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { COMMUNITY_PLANTS, SimplePlant } from "@/data/plantData";

// Premium botanical SVG motifs (replacing emojis with sophisticated botanical artwork)
function BotanicalMotif({ id, className = "w-6 h-6" }: { id: string; className?: string }) {
  switch (id) {
    case "chamomile":
      // Delicate blooming chamomile flower
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="12" cy="12" r="3.5" fill="#fef08a" stroke="#ca8a04" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="#eab308" />
        </svg>
      );
    case "turmeric":
      // Golden turmeric rhizome & roots
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M4 14c2-4 6-6 10-5 3 .8 6 3.5 6 6.5 0 3-3.5 5.5-7 5.5-5 0-8.5-3-9-7z" fill="#fef9c3" stroke="#ca8a04" />
          <path d="M7 11c1-3 3-5.5 6-6M9 17c1.5 2 3.5 3 6 3" stroke="#a16207" />
          <circle cx="14" cy="12" r="1.5" fill="#ca8a04" />
        </svg>
      );
    case "ashwagandha":
      // Adaptogen berry & root cluster
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M12 21V9M12 9c-2.5-3-7-3-7 1 0 3.5 5 6 7 6M12 9c2.5-3 7-3 7 1 0 3.5-5 6-7 6" fill="#dcfce7" stroke="#16a34a" />
          <circle cx="12" cy="5" r="2.5" fill="#ef4444" stroke="#dc2626" />
        </svg>
      );
    case "ginger":
      // Knotted warming ginger rhizome
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M5 16c0-3.5 2.5-6 6-6 1.5 0 3 .5 4 1.5 1-2 3-3.5 5-3.5 2 0 3 1.5 3 3.5 0 3.5-2.5 6-6 6-1 0-2-.3-2.8-.8C13 18 10 20 7 20c-1.8 0-2-2-2-4z" fill="#ffedd5" stroke="#ea580c" />
          <path d="M9 13c1 1.5 2.5 2 4.5 2" stroke="#c2410c" />
        </svg>
      );
    case "lavender":
      // Slender aromatic lavender floral stem
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M12 22V8" stroke="#7e22ce" />
          <path d="M12 8c-1.5-1.5-2.5-3-2.5-4.5 0-1 1-1.5 2.5-1.5s2.5.5 2.5 1.5C14.5 5 13.5 6.5 12 8z" fill="#f3e8ff" stroke="#9333ea" />
          <path d="M12 12c-2-1-3-2.5-3-3.5 0-.8.8-1.5 2-1.5M12 12c2-1 3-2.5 3-3.5 0-.8-.8-1.5-2-1.5" stroke="#9333ea" />
          <path d="M12 16c-2-1-3-2.5-3-3.5 0-.8.8-1.5 2-1.5M12 16c2-1 3-2.5 3-3.5 0-.8-.8-1.5-2-1.5" stroke="#7e22ce" />
        </svg>
      );
    case "peppermint":
      // Crisp serrated fresh mint leaves
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M12 21c0-5 3.5-9 8.5-9-1 4.5-4 8.5-8.5 9z" fill="#cffafe" stroke="#0891b2" />
          <path d="M12 21c0-5-3.5-9-8.5-9 1 4.5 4 8.5 8.5 9z" fill="#ccfbf1" stroke="#0d9488" />
          <path d="M12 12v9" stroke="#0f766e" />
        </svg>
      );
    default:
      return <Sprout className={className} />;
  }
}

export function ExplorePlantsSection() {
  const [selectedPlant, setSelectedPlant] = useState<SimplePlant | null>(null);

  return (
    <section 
      id="plants" 
      className="py-24 sm:py-32 bg-white relative overflow-hidden"
    >
      {/* Background Ambient Glow & Light Organic Elements */}
      <div className="absolute top-12 left-1/3 w-[600px] h-[300px] bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-[#faf8f5] px-4 py-1.5 rounded-full mb-4 border border-[#d6e3da] shadow-2xs"
          >
            <Sprout className="w-4 h-4 text-[#16a34a]" />
            <span className="text-xs font-semibold text-[#143d2b] tracking-wide">
              Curated Herbal Profiles
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-[#143d2b] tracking-tight leading-[1.15]"
          >
            Discover Medicinal Plants
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 text-base sm:text-lg text-[#4a5a50] leading-relaxed max-w-2xl mx-auto font-normal"
          >
            Simple information about familiar medicinal plants, their traditional uses, preparation, and available evidence.
          </motion.p>
        </div>

        {/* 6 Varied Botanical Plant Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 mb-14">
          {COMMUNITY_PLANTS.map((plant, idx) => (
            <motion.div
              key={plant.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: idx * 0.08 }}
              whileHover={{ y: -6 }}
              onClick={() => setSelectedPlant(plant)}
              className="bg-[#faf8f5] rounded-3xl p-6 sm:p-7 border border-[#e2ebe4] hover:border-[#16a34a]/40 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Subtle Botanical Watermark in Card Background */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 opacity-10 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none">
                <BotanicalMotif id={plant.id} className="w-full h-full" />
              </div>

              <div className="relative z-10">
                {/* Top Category & Review Badge */}
                <div className="flex items-center justify-between mb-5">
                  <span className="text-xs font-semibold text-[#78a386] tracking-wide">
                    {plant.category}
                  </span>
                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full border shadow-2xs backdrop-blur-md ${plant.badgeColor}`}>
                    {plant.badge}
                  </span>
                </div>

                {/* Botanical Artwork Motif Container */}
                <div className={`w-14 h-14 rounded-2xl bg-white border border-[#e2ebe4] flex items-center justify-center shadow-xs mb-5 group-hover:scale-105 transition-transform duration-300`}>
                  <BotanicalMotif id={plant.id} className="w-8 h-8" />
                </div>

                {/* Common Name & Scientific Name */}
                <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-[#143d2b] group-hover:text-[#16a34a] transition-colors">
                  {plant.commonName}
                </h3>
                <p className="text-xs sm:text-sm font-serif italic text-[#78a386] mb-3">
                  {plant.scientificName}
                </p>

                {/* Very Short Clear Description */}
                <p className="text-xs sm:text-sm text-[#4a5a50] leading-relaxed font-normal mb-5 line-clamp-3">
                  {plant.simpleUse}
                </p>
              </div>

              {/* View Plant Guide Link */}
              <div className="relative z-10 pt-4 border-t border-[#e2ebe4] flex items-center justify-between text-xs font-semibold text-[#143d2b] group-hover:text-[#16a34a] transition-colors">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#78a386] group-hover:text-[#16a34a]" />
                  View Plant Guide
                </span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Explore Herbal Guide CTA below */}
        <div className="text-center">
          <a
            href="#plants"
            onClick={(e) => {
              e.preventDefault();
              setSelectedPlant(COMMUNITY_PLANTS[0]);
            }}
            className="inline-flex items-center gap-2.5 text-sm sm:text-base font-semibold text-white bg-[#143d2b] hover:bg-[#1b533a] px-8 py-4 rounded-full shadow-md shadow-[#143d2b]/15 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group"
          >
            <span>Explore Herbal Guide</span>
            <ArrowRight className="w-4 h-4 text-[#a7f3d0] group-hover:translate-x-1 transition-transform duration-200" />
          </a>
        </div>

      </div>

      {/* Comprehensive, Clean Community-Friendly Plant Modal */}
      <AnimatePresence>
        {selectedPlant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-3xl border border-[#e2ebe4] shadow-2xl max-w-lg w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedPlant(null)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-[#f1f5f2] text-[#4a5a50] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Plant Identity Header */}
              <div className="flex items-center gap-2.5 mb-2">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${selectedPlant.badgeColor}`}>
                  {selectedPlant.badge}
                </span>
                <span className="text-xs text-[#78a386] font-semibold">{selectedPlant.category}</span>
              </div>

              <div className="flex items-center gap-3 mt-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-[#faf8f5] border border-[#e2ebe4] flex items-center justify-center">
                  <BotanicalMotif id={selectedPlant.id} className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-heading font-extrabold text-[#143d2b]">
                    {selectedPlant.commonName}
                  </h3>
                  <p className="text-xs sm:text-sm font-serif italic text-[#78a386]">
                    {selectedPlant.scientificName}
                  </p>
                </div>
              </div>

              <div className="space-y-3.5 mt-5 text-sm text-[#4a5a50]">
                {/* Traditional Use */}
                <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#e2ebe4]">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#143d2b] mb-1 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#16a34a]" />
                    Traditional Use & Wisdom
                  </p>
                  <p className="text-xs sm:text-sm leading-relaxed">{selectedPlant.simpleUse}</p>
                </div>

                {/* Simple Home Preparation */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#15803d] mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#15803d]" />
                    Simple Preparation Guide
                  </p>
                  <p className="text-xs sm:text-sm leading-relaxed text-[#1e5c44]">{selectedPlant.preparation}</p>
                </div>

                {/* Important Safety Guidance */}
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-1 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-800" />
                    Important Safety Guidance
                  </p>
                  <p className="text-xs leading-relaxed text-amber-950">{selectedPlant.safetyNote}</p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-6 pt-4 border-t border-[#e2ebe4] flex items-center justify-between">
                <span className="text-[11px] text-[#78a386]">
                  Verified for responsible educational use
                </span>
                <button
                  onClick={() => setSelectedPlant(null)}
                  className="px-6 py-2.5 rounded-full text-xs font-semibold bg-[#143d2b] text-white hover:bg-[#1b533a] transition-all cursor-pointer shadow-xs"
                >
                  Close Guide
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

