import React from "react";
import MobileAppHeader from "@/components/community/MobileAppHeader";

export default function ScreeningLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-[#faf9f5] animate-pulse">
      <MobileAppHeader
        showBack={true}
        backHref="/community/profile"
        title="Health Safety Screening"
        subtitle="Let's start with a quick safety check"
      />
      <div className="flex-1 px-4 sm:px-6 py-5 max-w-2xl mx-auto w-full space-y-4">
        <div className="h-20 rounded-3xl bg-white border border-[#dde6df]" />
        <div className="h-14 rounded-2xl bg-white border border-[#dde6df]" />
        <div className="h-80 rounded-3xl bg-white border border-[#dde6df]" />
      </div>
    </div>
  );
}

