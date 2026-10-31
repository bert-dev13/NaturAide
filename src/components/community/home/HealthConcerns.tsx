"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  CoughColdsIcon,
  SkinConcernsIcon,
  DigestiveIcon,
  UrinaryHealthIcon,
  ImmuneIcon,
  HeartHealthIcon,
  JointMuscleIcon,
  AllTopicsIcon,
} from "./HomeIcons2D";

interface ConcernItem {
  id: string;
  name: string;
  query: string;
  href: string;
  icon: React.ReactNode;
}

const HEALTH_CONCERNS: ConcernItem[] = [
  {
    id: "cough",
    name: "Cough & Colds",
    query: "cough",
    href: "/community/herbal-guide?q=cough",
    icon: <CoughColdsIcon className="w-8 h-8" />,
  },
  {
    id: "skin",
    name: "Skin Concerns",
    query: "skin",
    href: "/community/herbal-guide?q=skin",
    icon: <SkinConcernsIcon className="w-8 h-8" />,
  },
  {
    id: "digestive",
    name: "Digestive Health",
    query: "digestive",
    href: "/community/herbal-guide?q=digestive",
    icon: <DigestiveIcon className="w-8 h-8" />,
  },
  {
    id: "urinary",
    name: "Urinary Health",
    query: "kidney",
    href: "/community/herbal-guide?q=kidney",
    icon: <UrinaryHealthIcon className="w-8 h-8" />,
  },
  {
    id: "immune",
    name: "Immune Support",
    query: "immune",
    href: "/community/herbal-guide?q=immune",
    icon: <ImmuneIcon className="w-8 h-8" />,
  },
  {
    id: "heart",
    name: "Heart Health",
    query: "heart",
    href: "/community/herbal-guide?q=heart",
    icon: <HeartHealthIcon className="w-8 h-8" />,
  },
  {
    id: "joint",
    name: "Joint & Muscle",
    query: "pain",
    href: "/community/herbal-guide?q=pain",
    icon: <JointMuscleIcon className="w-8 h-8" />,
  },
  {
    id: "all",
    name: "All Topics",
    query: "",
    href: "/community/herbal-guide",
    icon: <AllTopicsIcon className="w-8 h-8" />,
  },
];

export default function HealthConcerns() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="space-y-3.5">
      {/* Section Header */}
      <div>
        <h2 className="font-heading font-black text-lg sm:text-xl text-[#0f2c20] tracking-tight">
          What do you need help with?
        </h2>
        <p className="text-xs sm:text-sm text-[#52796f] font-medium">
          Explore common health concerns and related medicinal plant information.
        </p>
      </div>

      {/* 8 Compact Category Tiles Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {HEALTH_CONCERNS.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-2xl"
          >
            <motion.div
              whileHover={
                shouldReduceMotion
                  ? {}
                  : {
                      y: -3,
                      transition: { duration: 0.18, ease: "easeOut" },
                    }
              }
              whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
              className="p-3 sm:p-3.5 rounded-2xl bg-white hover:bg-[#f2f8f4] border border-[#dce7e0] hover:border-emerald-300 shadow-2xs hover:shadow-xs transition-all flex items-center gap-3 cursor-pointer select-none"
            >
              <div className="shrink-0 group-hover:scale-105 transition-transform">
                {item.icon}
              </div>
              <span className="text-xs sm:text-[13px] font-bold text-[#1e3a2b] group-hover:text-emerald-800 transition-colors truncate">
                {item.name}
              </span>
            </motion.div>
          </Link>
        ))}
      </div>
    </section>
  );
}

