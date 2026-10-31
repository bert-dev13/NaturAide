"use client";

import React from "react";
import Link from "next/link";
import {
  LeafShield2DIcon,
  ShieldAlert2DIcon,
} from "./ProfileIcons2D";
import { CheckCircle2, AlertTriangle, AlertCircle, ChevronRight, Lock } from "lucide-react";
import { getScreeningSeverity, getSeverityMeta } from "@/lib/safety-rules";

export interface UserScreeningRecord {
  evaluationResult?: string;
  severity?: string;
  [key: string]: unknown;
}

interface ProfileSafetyCardProps {
  screening: UserScreeningRecord | null;
}

export default function ProfileSafetyCard({ screening }: ProfileSafetyCardProps) {
  const severity = screening ? getScreeningSeverity(screening) : null;
  const meta = severity ? getSeverityMeta(severity) : null;

  const targetHref =
    screening?.evaluationResult === "PROFESSIONAL_GUIDANCE_REQUIRED"
      ? "/community/guidance"
      : screening
      ? "/community/screening?retake=true"
      : "/community/screening";

  return (
    <div className="bg-white rounded-3xl border border-[#dde6df] shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="p-5 sm:p-6 flex items-center justify-between border-b border-[#f0f4f1] bg-gradient-to-r from-teal-50/50 via-white to-transparent">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-800 shadow-2xs">
            <LeafShield2DIcon size={22} />
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#0f2c20]">
              Health Safety Screening
            </h3>
            <p className="text-xs text-[#52796f]">
              Personalized herb-drug interaction & health profile check
            </p>
          </div>
        </div>

        <Link
          href={targetHref}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200 transition-colors"
        >
          <span>{screening ? "Update" : "Take"}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Content */}
      <div className="p-5 sm:p-6 space-y-4">
        {screening ? (
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
              severity === "severe"
                ? "bg-rose-50/70 border-rose-200 text-rose-950"
                : severity === "moderate"
                ? "bg-amber-50/70 border-amber-200 text-amber-950"
                : "bg-emerald-50/70 border-emerald-200 text-emerald-950"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                {severity === "severe" ? (
                  <AlertTriangle className="w-5 h-5 text-rose-600 animate-pulse" />
                ) : severity === "moderate" ? (
                  <AlertCircle className="w-5 h-5 text-amber-700" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                )}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-heading font-extrabold text-sm text-[#0f2c20]">
                    {meta?.title || "Screening Evaluated"}
                  </h4>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      severity === "severe"
                        ? "bg-rose-200 text-rose-900"
                        : severity === "moderate"
                        ? "bg-amber-200 text-amber-900"
                        : "bg-emerald-200 text-emerald-900"
                    }`}
                  >
                    {severity === "severe" ? "High Alert" : severity === "moderate" ? "Caution" : "Cleared"}
                  </span>
                </div>
                <p className="text-xs text-[#52796f] leading-relaxed">
                  {meta?.description || "Your health profile is actively checking for herbal contraindications."}
                </p>
              </div>
            </div>

            <Link
              href={targetHref}
              className="shrink-0 self-start sm:self-center px-3.5 py-2 rounded-xl text-xs font-extrabold bg-white hover:bg-[#faf9f5] border border-[#dde6df] text-[#0f2c20] shadow-2xs transition-colors"
            >
              {screening.evaluationResult === "PROFESSIONAL_GUIDANCE_REQUIRED"
                ? "View Guidance"
                : "Review Answers"}
            </Link>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-[#faf9f5] border border-[#dde6df] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShieldAlert2DIcon size={22} className="shrink-0" />
              <div>
                <h4 className="font-heading font-extrabold text-sm text-[#0f2c20]">
                  Initial Screening Not Completed
                </h4>
                <p className="text-xs text-[#52796f]">
                  Complete our 2-minute safety check to unlock personalized herbal precautions.
                </p>
              </div>
            </div>
            <Link
              href="/community/screening"
              className="shrink-0 px-4 py-2 rounded-xl text-xs font-extrabold bg-[#0f2c20] hover:bg-[#1e5c44] text-white shadow-2xs transition-colors text-center"
            >
              Begin Screening
            </Link>
          </div>
        )}

        {/* Privacy Note */}
        <div className="flex items-center gap-2 text-[11px] text-[#719184] bg-[#faf8f5] px-3.5 py-2.5 rounded-xl border border-[#ece7dc]">
          <Lock className="w-3.5 h-3.5 text-[#52796f] shrink-0" />
          <span>
            Your responses are private and used solely to alert you to adverse plant-medication interactions.
          </span>
        </div>
      </div>
    </div>
  );
}
