"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

export default function EngineStatusBanner({
  engineName,
  engineType,
  allowManual = true,
  allowUpload = true,
}: {
  engineName: string;
  engineType: "In-Silico" | "Molecular Docking" | "Laboratory";
  allowManual?: boolean;
  allowUpload?: boolean;
}) {
  return (
    <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs sm:text-sm space-y-1.5 shadow-2xs">
      <div className="flex items-center gap-2 font-bold text-amber-900">
        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
        <span>{engineName} Not Connected</span>
      </div>
      <p className="text-xs text-amber-900/90 leading-relaxed font-normal">
        NatureAide maintains strict scientific integrity and never simulates or fabricates computational results.
        {allowManual && " You may record verified manual benchmarks"}
        {allowManual && allowUpload && " or "}
        {allowUpload && "upload external raw computation files (.pdb, .sdf, .tsv, .pdf)"}.
      </p>
      <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] font-bold">
        <span className="px-2 py-0.5 rounded-md bg-amber-200/60 text-amber-900">
          STATUS: PENDING ENGINE CONNECTION
        </span>
        <span className="px-2 py-0.5 rounded-md bg-white border border-amber-300 text-amber-900">
          ACCEPTED SOURCES: {allowManual ? "MANUAL ENTRY" : ""} {allowUpload ? "| UPLOADED RESULT" : ""}
        </span>
      </div>
    </div>
  );
}
