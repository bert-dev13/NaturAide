import React from "react";
import MobileAppHeader from "@/components/community/MobileAppHeader";

export default function PlantPreparationLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-[#faf9f5] animate-pulse pb-28">
      <MobileAppHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 w-full space-y-5">
        <div className="h-44 rounded-3xl bg-white border border-[#dde6df]" />
        <div className="h-28 rounded-3xl bg-white border border-[#dde6df]" />
        <div className="h-64 rounded-3xl bg-white border border-[#dde6df]" />
      </main>
    </div>
  );
}

