import React from "react";
import MobileAppHeader from "@/components/community/MobileAppHeader";

export default function GuidanceLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-[#faf9f5] animate-pulse">
      <MobileAppHeader
        showBack={true}
        backHref="/community/profile"
        title="Safety Guidance"
        subtitle="Important herbal consultation notice"
      />
      <div className="flex-1 px-4 sm:px-6 py-5 max-w-4xl mx-auto w-full space-y-5">
        <div className="h-44 rounded-3xl bg-white border border-[#dde6df]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 rounded-3xl bg-white border border-[#dde6df]" />
          ))}
        </div>
      </div>
    </div>
  );
}

