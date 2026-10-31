import React from "react";
import MobileAppHeader from "@/components/community/MobileAppHeader";

export default function AskLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-[#faf9f5] animate-pulse">
      <MobileAppHeader
        showBack={true}
        backHref="/community"
        title="Ask NaturAide"
        subtitle="Guided Herbal Information Assistant"
      />
      <div className="flex-1 px-4 sm:px-6 py-6 max-w-2xl mx-auto w-full space-y-4">
        <div className="h-44 rounded-3xl bg-white border border-[#dde6df]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-white border border-[#dde6df]" />
          ))}
        </div>
      </div>
    </div>
  );
}

