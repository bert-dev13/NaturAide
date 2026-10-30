"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import MobileAppHeader from "@/components/community/MobileAppHeader";
import {
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  Building2,
  RefreshCw,
  PhoneCall,
  Info,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  HeartHandshake,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import {
  getScreeningSeverity,
  getSeverityMeta,
  ScreeningSeverity,
} from "@/lib/safety-rules";

export default function ProfessionalGuidancePage() {
  const [screening, setScreening] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/community/screening");
        const data = await res.json();
        if (data.success && data.screening) {
          setScreening(data.screening);
        }
      } catch (err) {
        console.error("Failed to fetch screening guidance status:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Mobile App Header */}
      <MobileAppHeader
        showBack={true}
        backHref="/community/profile"
        title="Professional Guidance"
        subtitle="Important safety consultation notice"
      />

      <div className="flex-1 px-4 sm:px-6 py-5 space-y-6">
        {(() => {
          const severity: ScreeningSeverity = getScreeningSeverity(screening);

          if (severity === "severe") {
            return (
              <div className="p-6 sm:p-7 rounded-3xl bg-rose-50/90 border-2 border-rose-300 border-l-8 border-l-rose-600 shadow-sm text-center space-y-4 transition-all duration-200">
                <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto shadow-2xs">
                  <AlertTriangle className="w-8 h-8 text-rose-600 animate-pulse" />
                </div>

                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-900 border border-rose-300 text-xs font-extrabold">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-700" />
                    <span>Safety Precaution Active • High Risk</span>
                  </span>

                  <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-rose-950 tracking-tight">
                    Severe Symptoms Identified
                  </h1>

                  <p className="text-sm sm:text-base text-rose-900 leading-relaxed max-w-md mx-auto font-medium">
                    Your responses indicate symptoms that may require professional medical attention.
                  </p>

                  <p className="text-xs text-rose-800 leading-relaxed max-w-md mx-auto">
                    Acute or severe warning signs cannot be safely addressed with herbal self-care. Recommendation-oriented herbal suggestions are restricted.
                  </p>
                </div>

                {screening?.reasonSummary && (
                  <div className="p-4 rounded-2xl bg-white/90 border border-rose-200 text-left text-xs text-rose-950 space-y-1">
                    <p className="font-bold text-rose-900">Safety rationale:</p>
                    <p className="leading-relaxed text-rose-800">{screening.reasonSummary}</p>
                  </div>
                )}

                {/* Highly Prominent Action Callout */}
                <div className="p-4 rounded-2xl bg-rose-600 text-white text-left space-y-2 shadow-xs">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-rose-100" />
                    <h2 className="font-heading font-extrabold text-sm sm:text-base">
                      Seek Professional Care
                    </h2>
                  </div>
                  <p className="text-xs text-rose-100 leading-relaxed">
                    Please consult an emergency facility, hospital, or your primary licensed physician for immediate clinical evaluation.
                  </p>
                  <div className="pt-1">
                    <Link
                      href="/community/facilities"
                      className="w-full py-3 px-4 rounded-xl bg-white hover:bg-rose-50 text-rose-900 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                    >
                      <Building2 className="w-4 h-4 text-rose-700" />
                      <span>Find Nearby Healthcare Facilities →</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          }

          if (severity === "moderate") {
            return (
              <div className="p-6 sm:p-7 rounded-3xl bg-amber-50/90 border-2 border-amber-300 border-l-8 border-l-amber-500 shadow-sm text-center space-y-4 transition-all duration-200">
                <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center mx-auto shadow-2xs">
                  <AlertCircle className="w-8 h-8 text-amber-700" />
                </div>

                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                    <span>Safety Precaution Active • Caution Recommended</span>
                  </span>

                  <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-[#0f2c20] tracking-tight">
                    Caution Recommended
                  </h1>

                  <p className="text-sm sm:text-base text-[#3d4a45] leading-relaxed max-w-md mx-auto font-medium">
                    Some of your responses may require additional attention before continuing.
                  </p>

                  <p className="text-xs text-[#52796f] leading-relaxed max-w-md mx-auto">
                    Based on your screening responses, NaturAide cannot provide recommendation-oriented herbal information at this time. You may still access general educational information.
                  </p>
                </div>

                {screening?.reasonSummary && (
                  <div className="p-4 rounded-2xl bg-white/90 border border-amber-200 text-left text-xs text-amber-950 space-y-1">
                    <p className="font-bold text-amber-900">Safety rationale:</p>
                    <p className="leading-relaxed text-amber-800">{screening.reasonSummary}</p>
                  </div>
                )}
              </div>
            );
          }

          // Low-risk / Safe fallback
          return (
            <div className="p-6 sm:p-7 rounded-3xl bg-emerald-50/90 border-2 border-emerald-300 border-l-8 border-l-emerald-600 shadow-sm text-center space-y-4 transition-all duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-2xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-700" />
              </div>

              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Screening Status • Low Risk</span>
                </span>

                <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-emerald-950 tracking-tight">
                  Low-Risk Symptoms
                </h1>

                <p className="text-sm sm:text-base text-emerald-900 leading-relaxed max-w-md mx-auto font-medium">
                  No severe warning signs were identified from your responses.
                </p>

                <p className="text-xs text-emerald-800 leading-relaxed max-w-md mx-auto">
                  Your profile meets standard safety eligibility for educational and traditional herbal wellness guidance.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/community"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
                >
                  <span>Continue →</span>
                  <ArrowRight className="w-4 h-4 text-emerald-200" />
                </Link>
              </div>
            </div>
          );
        })()}

        {/* Action 1: Find Healthcare Facility */}
        <div className="p-5 rounded-3xl bg-white border border-[#dde6df] shadow-2xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-base text-[#0f2c20]">
                Healthcare Facility Finder
              </h2>
              <p className="text-xs text-[#52796f]">
                Find verified clinics, health centers, and public facilities
              </p>
            </div>
          </div>

          <Link
            href="/community/facilities"
            className="w-full py-3.5 px-4 rounded-2xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <span>Find Healthcare Facility Near Me</span>
            <ArrowRight className="w-4 h-4 text-emerald-300" />
          </Link>
        </div>

        {/* Guidance Checklist */}
        <div className="p-5 rounded-3xl bg-white border border-[#dde6df] shadow-2xs space-y-3">
          <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#0f2c20]">
            Recommended Next Steps
          </h3>

          <div className="space-y-2.5 text-xs sm:text-sm text-[#3d4a45]">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p>
                <strong>Consult your primary doctor or pharmacist:</strong> Share any symptoms or health concerns with a licensed provider.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p>
                <strong>Bring current medications:</strong> If taking prescriptions, inform your clinician before introducing any herbal supplement or tea.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p>
                <strong>Do not stop prescribed treatments:</strong> Always follow your physician&apos;s direct treatment plan.
              </p>
            </div>
          </div>
        </div>

        {/* Action 2: Retake Screening if conditions changed */}
        <div className="p-5 rounded-3xl bg-[#edf2ee] border border-[#dde6df] space-y-3 text-center">
          <div className="space-y-1">
            <h4 className="font-heading font-bold text-sm text-[#0f2c20]">
              Did your health circumstances change?
            </h4>
            <p className="text-xs text-[#52796f]">
              If you made a typo or your health profile has updated, you can retake the screening.
            </p>
          </div>

          <Link
            href="/community/screening?retake=true"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#dde6df] hover:bg-[#faf9f5] text-xs font-bold text-[#0f2c20] shadow-2xs transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
            <span>Retake Health Screening</span>
          </Link>
        </div>

        {/* Standard Disclaimer */}
        <p className="text-center text-[11px] text-[#78997f] leading-relaxed max-w-sm mx-auto">
          NaturAide provides educational and evidence-based information and is not intended to diagnose medical conditions, prescribe treatment, or replace professional medical care.
        </p>
      </div>
    </div>
  );
}
