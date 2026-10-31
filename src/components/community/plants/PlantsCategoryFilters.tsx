"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import {
  AllPlants2DIcon,
  Respiratory2DIcon,
  Skin2DIcon,
  Digestion2DIcon,
  Urinary2DIcon,
  BloodSugar2DIcon,
  PainComfort2DIcon,
  JointUric2DIcon,
} from "./PlantsIcons2D";

export interface CategoryFilterItem {
  id: string;
  label: string;
  match: string;
  icon: React.ReactNode;
  activeBg: string;
  activeBorder: string;
  activeText: string;
}

export const PLANT_CATEGORIES: CategoryFilterItem[] = [
  {
    id: "all",
    label: "All Plants",
    match: "",
    icon: <AllPlants2DIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />,
    activeBg: "bg-emerald-50",
    activeBorder: "border-emerald-500 ring-2 ring-emerald-500/20",
    activeText: "text-emerald-950 font-black",
  },
  {
    id: "cough",
    label: "Cough & Respiratory",
    match: "cough",
    icon: <Respiratory2DIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />,
    activeBg: "bg-emerald-50",
    activeBorder: "border-emerald-500 ring-2 ring-emerald-500/20",
    activeText: "text-emerald-950 font-black",
  },
  {
    id: "skin",
    label: "Skin Concerns",
    match: "skin",
    icon: <Skin2DIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />,
    activeBg: "bg-fuchsia-50",
    activeBorder: "border-fuchsia-500 ring-2 ring-fuchsia-500/20",
    activeText: "text-fuchsia-950 font-black",
  },
  {
    id: "digestion",
    label: "Digestive Health",
    match: "digestive",
    icon: <Digestion2DIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />,
    activeBg: "bg-amber-50",
    activeBorder: "border-amber-500 ring-2 ring-amber-500/20",
    activeText: "text-amber-950 font-black",
  },
  {
    id: "kidney",
    label: "Urinary & Kidney",
    match: "kidney",
    icon: <Urinary2DIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />,
    activeBg: "bg-sky-50",
    activeBorder: "border-sky-500 ring-2 ring-sky-500/20",
    activeText: "text-sky-950 font-black",
  },
  {
    id: "blood-sugar",
    label: "Blood Sugar",
    match: "blood sugar",
    icon: <BloodSugar2DIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />,
    activeBg: "bg-lime-50",
    activeBorder: "border-lime-500 ring-2 ring-lime-500/20",
    activeText: "text-lime-950 font-black",
  },
  {
    id: "pain",
    label: "Pain & Comfort",
    match: "pain",
    icon: <PainComfort2DIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />,
    activeBg: "bg-purple-50",
    activeBorder: "border-purple-500 ring-2 ring-purple-500/20",
    activeText: "text-purple-950 font-black",
  },
  {
    id: "joint",
    label: "Joint & Uric Acid",
    match: "joint",
    icon: <JointUric2DIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />,
    activeBg: "bg-teal-50",
    activeBorder: "border-teal-500 ring-2 ring-teal-500/20",
    activeText: "text-teal-950 font-black",
  },
];

interface PlantsCategoryFiltersProps {
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
}

export default function PlantsCategoryFilters({
  selectedCategory,
  onSelectCategory,
}: PlantsCategoryFiltersProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-black text-sm sm:text-base text-[#0f2c20] tracking-tight">
          Explore by Use
        </h2>
        {selectedCategory !== "all" && (
          <button
            type="button"
            onClick={() => onSelectCategory("all")}
            className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer"
          >
            Show All
          </button>
        )}
      </div>

      {/* Clean horizontal pill chips with no text clipping or overlapping */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 sm:pb-1 md:flex-wrap scrollbar-none">
        {PLANT_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;

          return (
            <motion.button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              whileHover={
                shouldReduceMotion
                  ? {}
                  : {
                      y: -2,
                      scale: 1.02,
                      transition: { duration: 0.15 },
                    }
              }
              whileTap={shouldReduceMotion ? {} : { scale: 0.96 }}
              aria-pressed={isSelected}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full border transition-all cursor-pointer whitespace-nowrap shrink-0 select-none text-xs sm:text-[13px] ${
                isSelected
                  ? `${cat.activeBg} ${cat.activeBorder} ${cat.activeText} shadow-xs`
                  : "bg-white hover:bg-[#f6faf7] border-[#dde6df] hover:border-emerald-300 text-[#475550] hover:text-[#0f2c20] font-medium shadow-2xs"
              }`}
            >
              <span className="shrink-0">{cat.icon}</span>
              <span>{cat.label}</span>
              {isSelected && (
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 ml-0.5">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
