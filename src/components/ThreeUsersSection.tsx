"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
  Users, 
  Microscope, 
  Stethoscope, 
  ArrowRight, 
  HeartHandshake,
  Sparkles,
  CheckCircle2,
  Share2
} from "lucide-react";

export function ThreeUsersSection() {
  const cards = [
    {
      role: "COMMUNITY",
      audience: "For Everyday Wellness",
      description: "Learn about medicinal plants, their uses, preparation, and important safety information.",
      image: "/images/traditional-herbs.jpg",
      buttonText: "Explore Herbal Guide",
      buttonLink: "#plants",
      icon: Users,
      badgeText: "01 · Community",
      badgeClass: "bg-[#e2ebe4] text-[#143d2b] border-[#c4d4c7]",
      accentBorder: "hover:border-[#16a34a]/40",
      accentGlow: "from-amber-500/10 via-emerald-500/5 to-transparent",
      highlight: "Accessible guides & preparation protocols",
      tag: "Everyday Wellness"
    },
    {
      role: "RESEARCHERS",
      audience: "For Scientists & Researchers",
      description: "Organize herbal studies, explore scientific evidence, and manage research from discovery to validation.",
      image: "/images/plant-lab.jpg",
      buttonText: "Research Platform",
      buttonLink: "#how-it-works",
      icon: Microscope,
      badgeText: "02 · Research",
      badgeClass: "bg-[#ccfbf1] text-[#0f766e] border-[#99f6e4]",
      accentBorder: "hover:border-[#14b8a6]/40",
      accentGlow: "from-teal-500/10 via-emerald-500/5 to-transparent",
      highlight: "Evidence synthesis & verified datasets",
      tag: "Scientific Inquiry"
    },
    {
      role: "HEALTH PROFESSIONALS",
      audience: "For Health Professionals & Experts",
      description: "Review research and help ensure herbal information is reliable, responsible, and safe.",
      image: "/images/botanical-science.jpg",
      buttonText: "Expert Review",
      buttonLink: "#trust",
      icon: Stethoscope,
      badgeText: "03 · Verification",
      badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
      accentBorder: "hover:border-[#15803d]/40",
      accentGlow: "from-emerald-500/10 via-teal-500/5 to-transparent",
      highlight: "Clinical safety review & patient guidance",
      tag: "Safety & Integrity"
    },
  ];

  return (
    <section id="users" className="py-24 sm:py-32 bg-white relative overflow-hidden">
      {/* Subtle Botanical Leaf & Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#faf8f5] to-transparent pointer-events-none" />
      <div className="absolute top-20 right-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-[#faf8f5] px-4 py-1.5 rounded-full mb-4 border border-[#d6e3da] shadow-2xs"
          >
            <HeartHandshake className="w-4 h-4 text-[#16a34a]" />
            <span className="text-xs font-semibold text-[#143d2b] tracking-wide">
              One Connected Platform
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-[#143d2b] tracking-tight leading-[1.15]"
          >
            NaturAide is for Everyone.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 text-base sm:text-lg text-[#4a5a50] leading-relaxed max-w-2xl mx-auto font-normal"
          >
            Whether you are curious about herbal wellness, conducting research, or helping review health and safety information.
          </motion.p>

          {/* Interactive Ecosystem Connection Rail */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 hidden md:inline-flex items-center gap-3 bg-[#faf8f5] px-5 py-2 rounded-full border border-[#e2ebe4] text-xs font-medium text-[#4a5a50]"
          >
            <span className="flex items-center gap-1.5 text-[#143d2b] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Community Needs
            </span>
            <span className="text-[#a3b8ad]">→</span>
            <span className="flex items-center gap-1.5 text-[#0f766e] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#14b8a6]" />
              Scientific Research
            </span>
            <span className="text-[#a3b8ad]">→</span>
            <span className="flex items-center gap-1.5 text-emerald-800 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              Expert Safety Review
            </span>
            <span className="text-[#a3b8ad]">→</span>
            <span className="text-[#15803d] font-bold">Trusted Care</span>
          </motion.div>
        </div>

        {/* 3 Connected Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.role}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                whileHover={{ y: -6 }}
                className={`bg-[#faf8f5] rounded-3xl border border-[#e2ebe4] p-6 sm:p-7 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden ${card.accentBorder}`}
              >
                {/* Subtle Top Ambient Gradient */}
                <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-b ${card.accentGlow} pointer-events-none`} />

                <div className="relative z-10">
                  {/* Card Visual Image */}
                  <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden mb-6 bg-white border border-[#e2ebe4] shadow-2xs">
                    <Image
                      src={card.image}
                      alt={card.audience}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 380px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#143d2b]/40 via-transparent to-transparent pointer-events-none" />

                    {/* Step / Role Badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`text-[11px] font-bold tracking-wide uppercase px-3 py-1 rounded-full border shadow-2xs backdrop-blur-md ${card.badgeClass}`}>
                        {card.badgeText}
                      </span>
                    </div>

                    <div className="absolute bottom-3 right-3">
                      <span className="text-[11px] font-medium text-white/90 bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-full">
                        {card.tag}
                      </span>
                    </div>
                  </div>

                  {/* Icon & Audience Title */}
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white border border-[#e2ebe4] flex items-center justify-center text-[#143d2b] shadow-2xs group-hover:bg-[#143d2b] group-hover:text-white transition-colors duration-200">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-heading font-extrabold text-[#143d2b]">
                      {card.audience}
                    </h3>
                  </div>

                  {/* Clear Description */}
                  <p className="text-sm text-[#4a5a50] leading-relaxed mb-5 font-normal">
                    {card.description}
                  </p>

                  {/* Feature Highlight Pill */}
                  <div className="mb-6 flex items-center gap-2 text-xs text-[#2d4235] bg-white/80 border border-[#e2ebe4] rounded-xl px-3 py-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#16a34a] shrink-0" />
                    <span className="font-medium truncate">{card.highlight}</span>
                  </div>
                </div>

                {/* Connected Ecosystem CTA Button */}
                <div className="relative z-10 pt-2 border-t border-[#e2ebe4]/70">
                  <a
                    href={card.buttonLink}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-full text-xs sm:text-sm font-semibold text-[#143d2b] bg-white hover:bg-[#143d2b] hover:text-white border border-[#d6e3da] hover:border-[#143d2b] transition-all duration-200 shadow-2xs group/btn cursor-pointer"
                  >
                    <span>{card.buttonText}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:translate-x-1" />
                  </a>
                </div>
              </motion.div>
            );
          })}

        </div>

      </div>
    </section>
  );
}

