"use client";

import React, { useState } from "react";
import { ShieldAlert2DIcon } from "./ProfileIcons2D";
import { ChevronDown, ChevronUp, FileText, Info, ShieldCheck } from "lucide-react";

export default function SafetyGuidelinesCard() {
  const [openSafety, setOpenSafety] = useState(false);
  const [openAbout, setOpenAbout] = useState(false);

  return (
    <div className="bg-white rounded-3xl border border-[#dde6df] shadow-2xs overflow-hidden divide-y divide-[#f0f4f1]">
      {/* 1. Help & Safety Notice */}
      <div>
        <button
          type="button"
          onClick={() => setOpenSafety((prev) => !prev)}
          className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-[#faf9f5] transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-800 shrink-0">
              <ShieldAlert2DIcon size={20} />
            </div>
            <div>
              <h4 className="font-heading font-extrabold text-sm sm:text-base text-[#0f2c20]">
                Help & Safety Guidelines
              </h4>
              <p className="text-xs text-[#52796f]">
                Safe use of traditional remedies & clinical disclaimers
              </p>
            </div>
          </div>
          {openSafety ? (
            <ChevronUp className="w-5 h-5 text-[#78997f]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[#78997f]" />
          )}
        </button>

        {openSafety && (
          <div className="p-5 bg-amber-50/50 border-t border-amber-100/70 space-y-2.5 text-xs sm:text-sm text-amber-950 leading-relaxed">
            <p className="font-bold text-[#0f2c20]">Important Community Health Notice:</p>
            <p>
              NaturAide compiles educational summaries of documented Philippine traditional plants and scientific evaluations. It is not intended to diagnose, treat, cure, or prevent any medical condition.
            </p>
            <p>
              Always consult your physician, licensed herbalist, or pharmacist prior to initiating any herbal therapy, especially if you take daily prescription medications or have existing chronic conditions.
            </p>
          </div>
        )}
      </div>

      {/* 2. About NaturAide */}
      <div>
        <button
          type="button"
          onClick={() => setOpenAbout((prev) => !prev)}
          className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-[#faf9f5] transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-800 shrink-0">
              <Info className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h4 className="font-heading font-extrabold text-sm sm:text-base text-[#0f2c20]">
                About NaturAide
              </h4>
              <p className="text-xs text-[#52796f]">
                Version 2.0 &bull; Philippine herbal heritage & science
              </p>
            </div>
          </div>
          {openAbout ? (
            <ChevronUp className="w-5 h-5 text-[#78997f]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[#78997f]" />
          )}
        </button>

        {openAbout && (
          <div className="p-5 bg-[#faf9f5] border-t border-[#f0f4f1] space-y-2 text-xs sm:text-sm text-[#3d4a45] leading-relaxed">
            <p>
              NaturAide connects Philippine traditional healing heritage with rigorous phytochemical and computational research, providing safe and accessible herbal guidance to every Filipino community.
            </p>
            <div className="pt-2 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-emerald-100/80 text-emerald-900 font-bold text-[11px]">
                Platform Version 2.0
              </span>
              <span className="text-xs text-[#719184]">Philippine Herbal Garden</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Privacy & Terms Row */}
      <div className="p-4 sm:p-5 flex items-center justify-between text-[#0f2c20]">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <FileText className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h4 className="font-heading font-extrabold text-sm sm:text-base text-[#0f2c20]">
              Privacy & Protected Data
            </h4>
            <p className="text-xs text-[#52796f]">
              Your health preferences are confidential and never sold
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Protected</span>
        </span>
      </div>
    </div>
  );
}
