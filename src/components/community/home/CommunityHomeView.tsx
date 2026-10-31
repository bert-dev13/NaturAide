"use client";

import React from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import HeroSection from "./HeroSection";
import QuickActions from "./QuickActions";
import HealthConcerns from "./HealthConcerns";
import FeaturedPlantsSection from "./FeaturedPlantsSection";
import MascotAssistantBanner from "./MascotAssistantBanner";
import ContinueExploring from "./ContinueExploring";
import CommercialProductsSection from "./CommercialProductsSection";
import SafetyNotice from "@/components/community/SafetyNotice";
import {
  CommunityPlantRecord,
  CommunityProductRecord,
  CommunitySavedGuide,
} from "./types";

interface CommunityHomeViewProps {
  firstName: string;
  popularPlants: CommunityPlantRecord[];
  herbalProducts: CommunityProductRecord[];
  savedPlants: CommunityPlantRecord[];
  savedGuides: CommunitySavedGuide[];
  savedProducts: CommunityProductRecord[];
  totalSavedCount: number;
}

export default function CommunityHomeView({
  firstName,
  popularPlants,
  herbalProducts,
  savedPlants,
  savedProducts,
  totalSavedCount,
}: CommunityHomeViewProps) {
  const shouldReduceMotion = useReducedMotion();

  const sectionVariants: Variants = {
    hidden: {
      opacity: shouldReduceMotion ? 1 : 0,
      y: shouldReduceMotion ? 0 : 12,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.35,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3.5 sm:px-6 py-3 sm:py-5 space-y-5 sm:space-y-6 overflow-hidden">
      {/* 1. HERO SECTION (Kumusta, Maria! + Search + Mascot) */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <HeroSection firstName={firstName} />
      </motion.div>

      {/* 2. QUICK ACTIONS (Find a Plant, Check Safety, Ask NaturAide) */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        variants={sectionVariants}
      >
        <QuickActions />
      </motion.div>

      {/* 3. “WHAT DO YOU NEED HELP WITH?” (Health Concern Discovery) */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        variants={sectionVariants}
      >
        <HealthConcerns />
      </motion.div>

      {/* 4. FEATURED MEDICINAL PLANTS (Lush Plant Photo Carousel) */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        variants={sectionVariants}
      >
        <FeaturedPlantsSection plants={popularPlants} />
      </motion.div>

      {/* 5. NATURAIDE ASSISTANT BANNER (Mascot Interaction) */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        variants={sectionVariants}
      >
        <MascotAssistantBanner />
      </motion.div>

      {/* 6. CONTINUE EXPLORING (Personalized Bookmarks - Hidden if 0 saved) */}
      {totalSavedCount > 0 && (
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={sectionVariants}
        >
          <ContinueExploring
            totalSavedCount={totalSavedCount}
            savedPlants={savedPlants}
            savedProducts={savedProducts}
          />
        </motion.div>
      )}

      {/* 7. COMMERCIAL HERBAL PRODUCTS (Regulatory Records & Science) */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        variants={sectionVariants}
      >
        <CommercialProductsSection products={herbalProducts} />
      </motion.div>

      {/* 8. EDUCATIONAL SAFETY NOTICE */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        variants={sectionVariants}
        className="pt-1 pb-4"
      >
        <SafetyNotice />
      </motion.div>
    </div>
  );
}
