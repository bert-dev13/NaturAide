"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sprout, Sparkles } from "lucide-react";

export function FinalCtaSection() {
  return (
    <section className="py-20 sm:py-28 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-[#faf8f5] via-[#f5f0ea] to-[#f1f5f2] rounded-3xl p-8 sm:p-14 lg:p-16 border border-[#e2ebe4] text-center max-w-4xl mx-auto shadow-sm relative overflow-hidden"
        >
          {/* Subtle Background Accent */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-[#c5d7cb]/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-[#e2ebe4] shadow-xs">
              <Sprout className="w-4 h-4 text-[#16a34a]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#143d2b]">
                Join Our Growing Community
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-[#143d2b] tracking-tight">
              Explore Herbal Knowledge with Confidence.
            </h2>

            <p className="text-base sm:text-lg text-[#4a5a50] max-w-xl mx-auto leading-relaxed">
              Whether you want to learn, research, or contribute your expertise, NatureAide gives you a place to start.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <a
                href="#users"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm sm:text-base font-semibold text-white bg-[#143d2b] hover:bg-[#1b533a] px-8 py-3.5 rounded-full shadow-xs hover:shadow-md transition-all hover:translate-y-[-1px]"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 text-[#c5d7cb]" />
              </a>

              <a
                href="#plants"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm sm:text-base font-semibold text-[#143d2b] bg-white hover:bg-[#f1f5f2] border border-[#e2ebe4] px-8 py-3.5 rounded-full shadow-xs transition-colors"
              >
                <span>Explore NatureAide</span>
              </a>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
