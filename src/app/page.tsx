import React from "react";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { ThreeUsersSection } from "@/components/ThreeUsersSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { ExplorePlantsSection } from "@/components/ExplorePlantsSection";
import { TrustSection } from "@/components/TrustSection";
import { FinalCtaSection } from "@/components/FinalCtaSection";
import { SimpleFooter } from "@/components/SimpleFooter";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5] text-[#143d2b]">
      {/* 1. NAVBAR */}
      <Navbar />

      <main className="flex-1">
        {/* 2. HERO */}
        <HeroSection />

        {/* 3. THREE USERS (Community, Researchers, Health Professionals) */}
        <ThreeUsersSection />

        {/* 4. HOW IT WORKS (Discover -> Research -> Test -> Expert Review -> Share) */}
        <HowItWorksSection />

        {/* 5. EXPLORE HERBAL PLANTS (Simple, understandable plant cards) */}
        <ExplorePlantsSection />

        {/* 6. TRUST SECTION (Traditional Knowledge + Scientific Research + Expert Review) */}
        <TrustSection />

        {/* 7. FINAL CTA */}
        <FinalCtaSection />
      </main>

      {/* 8. SIMPLE FOOTER */}
      <SimpleFooter />
    </div>
  );
}
