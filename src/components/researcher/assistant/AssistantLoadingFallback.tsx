"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export default function AssistantLoadingFallback() {
  return (
    <div className="w-full h-[600px] flex flex-col items-center justify-center space-y-3">
      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      <p className="text-sm font-semibold text-[#475550]">
        Initializing Ask NatureAide...
      </p>
    </div>
  );
}

