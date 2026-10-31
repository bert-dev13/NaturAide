import React from "react";
import MobileAppHeader from "@/components/community/MobileAppHeader";

export default function FacilitiesLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-[#faf9f5] animate-pulse">
      <MobileAppHeader
        showBack={true}
        backHref="/community/guidance"
        title="Find Healthcare Near You"
        subtitle="Locate nearby healthcare facilities when professional care is recommended"
      />
      <div className="flex-1 px-4 sm:px-6 py-5 max-w-2xl mx-auto w-full space-y-4">
        <div className="h-12 rounded-2xl bg-white border border-[#dde6df]" />
        <div className="h-40 rounded-3xl bg-white border border-[#dde6df]" />
        <div className="h-72 rounded-3xl bg-[#edf3ef] border border-[#dcebe0]" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-3xl bg-white border border-[#dde6df]" />
          ))}
        </div>
      </div>
    </div>
  );
}

