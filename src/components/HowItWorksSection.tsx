"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Compass, 
  Search, 
  FlaskConical, 
  ShieldCheck, 
  Share2, 
  Sparkles,
  ArrowRight,
  Leaf
} from "lucide-react";

export function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Discover",
      desc: "Traditional herbal knowledge is gathered.",
      icon: Compass,
      tag: "Ethnobotany",
      color: "bg-amber-50 text-amber-800 border-amber-200",
      accentBg: "group-hover:bg-amber-100",
      pillClass: "bg-amber-100/70 text-amber-900 border-amber-200"
    },
    {
      number: "02",
      title: "Research",
      desc: "Available scientific evidence is studied.",
      icon: Search,
      tag: "Literature & Data",
      color: "bg-teal-50 text-teal-800 border-teal-200",
      accentBg: "group-hover:bg-teal-100",
      pillClass: "bg-teal-100/70 text-teal-900 border-teal-200"
    },
    {
      number: "03",
      title: "Test",
      desc: "Researchers evaluate safety and findings.",
      icon: FlaskConical,
      tag: "Assays & Safety",
      color: "bg-emerald-50 text-emerald-800 border-emerald-200",
      accentBg: "group-hover:bg-emerald-100",
      pillClass: "bg-emerald-100/70 text-emerald-900 border-emerald-200"
    },
    {
      number: "04",
      title: "Expert Review",
      desc: "Qualified professionals review the evidence.",
      icon: ShieldCheck,
      tag: "Clinical Peer Review",
      color: "bg-blue-50 text-blue-800 border-blue-200",
      accentBg: "group-hover:bg-blue-100",
      pillClass: "bg-blue-100/70 text-blue-900 border-blue-200"
    },
    {
      number: "05",
      title: "Share",
      desc: "Clear and responsible information becomes available to the community.",
      icon: Share2,
      tag: "Open Access",
      color: "bg-emerald-100 text-[#143d2b] border-emerald-300",
      accentBg: "group-hover:bg-emerald-200",
      pillClass: "bg-emerald-200/60 text-[#143d2b] border-emerald-300"
    },
  ];

  return (
    <section 
      id="how-it-works" 
      className="py-24 sm:py-32 bg-[#f4f7f4] relative overflow-hidden border-t border-[#e2ebe4]"
    >
      {/* Subtle Background Botanical Accents */}
      <div className="absolute top-1/4 -right-16 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-16 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
      
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
            <Sparkles className="w-4 h-4 text-[#16a34a]" />
            <span className="text-xs font-semibold text-[#143d2b] tracking-wide">
              Simple 5-Step Journey
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-[#143d2b] tracking-tight leading-[1.15]"
          >
            From Traditional Knowledge to Trusted Information
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 text-base sm:text-lg text-[#4a5a50] leading-relaxed max-w-2xl mx-auto font-normal"
          >
            See how herbal knowledge moves through research, testing, expert review, and responsible sharing.
          </motion.p>
        </div>

        {/* DESKTOP HORIZONTAL CONNECTED JOURNEY (hidden on mobile/tablet vertical) */}
        <div className="hidden lg:block relative mb-8">
          
          {/* Continuous Connecting Botanical Stem Line */}
          <div className="absolute top-[38px] left-[5%] right-[5%] h-[3px] bg-gradient-to-r from-amber-200 via-teal-300 via-emerald-300 to-emerald-400 z-0 rounded-full" />
          
          {/* Subtle animated light pulse on the track */}
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            className="absolute top-[38px] left-0 w-1/4 h-[3px] bg-gradient-to-r from-transparent via-white to-transparent z-1 blur-[1px]"
          />

          <div className="grid grid-cols-5 gap-4 relative z-10">
            {steps.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.12 }}
                  whileHover={{ y: -6 }}
                  className="bg-white rounded-3xl p-5 border border-[#e2ebe4] hover:border-[#16a34a]/40 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group relative"
                >
                  <div>
                    {/* Top Connected Node + Icon */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-10 h-10 rounded-2xl bg-white border-2 border-white shadow-md flex items-center justify-center font-heading font-extrabold text-xs text-[#143d2b] ring-4 ring-[#f4f7f4]">
                        {item.number}
                      </div>

                      <div className={`w-9 h-9 rounded-2xl ${item.color} border flex items-center justify-center shadow-2xs ${item.accentBg} transition-colors`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Step Title & Tag */}
                    <div className="mb-2">
                      <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md border ${item.pillClass}`}>
                        {item.tag}
                      </span>
                      <h3 className="font-heading font-extrabold text-xl text-[#143d2b] mt-2">
                        {item.title}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-[#4a5a50] leading-relaxed font-normal">
                      {item.desc}
                    </p>
                  </div>

                  {/* Bottom Leaf Accent */}
                  <div className="pt-4 mt-3 border-t border-[#e2ebe4]/60 flex items-center justify-between text-[11px] text-[#78a386]">
                    <span>Stage {item.number} of 05</span>
                    <Leaf className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:text-[#16a34a] transition-all" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* MOBILE & TABLET VERTICAL TIMELINE (hidden on desktop) */}
        <div className="lg:hidden relative pl-6 sm:pl-8 space-y-6">
          {/* Vertical Connecting Line */}
          <div className="absolute top-4 bottom-4 left-[27px] sm:left-[35px] w-[3px] bg-gradient-to-b from-amber-300 via-teal-300 to-emerald-400 rounded-full" />

          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="relative flex items-start gap-4"
              >
                {/* Node on the timeline */}
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white border-2 border-emerald-500 shadow-md flex items-center justify-center font-heading font-bold text-xs text-[#143d2b] shrink-0 z-10 ring-4 ring-[#f4f7f4]">
                  {item.number}
                </div>

                {/* Card Content */}
                <div className="flex-1 bg-white rounded-3xl p-5 border border-[#e2ebe4] shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-md border ${item.pillClass}`}>
                      {item.tag}
                    </span>
                    <div className={`w-8 h-8 rounded-xl ${item.color} border flex items-center justify-center`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <h3 className="font-heading font-extrabold text-lg text-[#143d2b] mb-1">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#4a5a50] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

