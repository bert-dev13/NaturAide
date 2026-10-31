"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import MobileAppHeader from "@/components/community/MobileAppHeader";
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import {
  getScreeningSeverity,
  ScreeningSeverity,
} from "@/lib/safety-rules";
import {
  LeafShield2DIcon,
  ShieldAlert2DIcon,
  Hospital2DIcon,
  MedicinePill2DIcon,
  TeaCup2DIcon,
} from "@/components/community/CommunityIcons2D";

interface ScreeningRecord {
  evaluationResult?: string;
  severity?: string;
  reasonSummary?: string;
  [key: string]: unknown;
}

export default function ProfessionalGuidancePage() {
  const [screening, setScreening] = useState<ScreeningRecord | null>(null);
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

  const severity: ScreeningSeverity = getScreeningSeverity(screening);

  return (
    <div className="flex flex-col min-h-screen bg-[#faf9f5]">
      {/* Mobile App Header */}
      <MobileAppHeader
        showBack={true}
        backHref="/community/profile"
        title="Safety Guidance"
        subtitle="Important herbal consultation notice"
      />

      <div className="flex-1 px-4 sm:px-6 py-5 space-y-6 max-w-4xl mx-auto w-full pb-28">
        {/* ================================================== */}
        {/* 1. PERSONALIZED SCREENING STATUS BANNER            */}
        {/* ================================================== */}
        {!loading && (
          <div>
            {severity === "severe" && (
              <div className="p-6 rounded-3xl bg-rose-50/90 border-2 border-rose-300 shadow-2xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
                    <ShieldAlert2DIcon size={26} />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300 text-[10px] font-extrabold uppercase tracking-wider">
                      Safety Precaution Active • High Risk
                    </span>
                    <h1 className="text-lg sm:text-xl font-heading font-black text-rose-950 mt-0.5">
                      Professional Care Is Recommended
                    </h1>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-rose-900 leading-relaxed font-medium bg-white/70 p-3.5 rounded-2xl border border-rose-200">
                  Your responses indicate symptoms or health factors that require professional medical attention. Acute red-flag signs cannot be safely addressed with herbal self-care. Recommendation-oriented herbal suggestions are restricted.
                </p>

                {screening?.reasonSummary && (
                  <div className="p-3.5 rounded-2xl bg-white/90 border border-rose-200 text-xs text-rose-950 space-y-1">
                    <p className="font-extrabold text-rose-900">Safety rationale:</p>
                    <p className="leading-relaxed text-rose-800">{screening.reasonSummary}</p>
                  </div>
                )}

                <div className="pt-1">
                  <Link
                    href="/community/facilities"
                    className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <Hospital2DIcon size={18} />
                    <span>Find Nearby Healthcare Facilities →</span>
                  </Link>
                </div>
              </div>
            )}

            {severity === "moderate" && (
              <div className="p-6 rounded-3xl bg-amber-50/90 border-2 border-amber-300 shadow-2xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-900 shrink-0">
                    <ShieldAlert2DIcon size={26} />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold uppercase tracking-wider">
                      Safety Precaution Active • Caution
                    </span>
                    <h1 className="text-lg sm:text-xl font-heading font-black text-[#0f2c20] mt-0.5">
                      Caution Recommended
                    </h1>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-[#3d4a45] leading-relaxed font-medium bg-white/70 p-3.5 rounded-2xl border border-amber-200">
                  Based on your screening responses, NaturAide cannot provide recommendation-oriented herbal guidance at this time. You may still access general educational herbal information.
                </p>

                {screening?.reasonSummary && (
                  <div className="p-3.5 rounded-2xl bg-white/90 border border-amber-200 text-xs text-amber-950 space-y-1">
                    <p className="font-bold text-amber-900">Safety rationale:</p>
                    <p className="leading-relaxed text-amber-800">{screening.reasonSummary}</p>
                  </div>
                )}
              </div>
            )}

            {severity === "low" && (
              <div className="p-6 rounded-3xl bg-emerald-50/90 border-2 border-emerald-300 shadow-2xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
                    <LeafShield2DIcon size={26} />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                      Screening Status • Low Risk
                    </span>
                    <h1 className="text-lg sm:text-xl font-heading font-black text-emerald-950 mt-0.5">
                      Safe to Explore Educational Guides
                    </h1>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-emerald-900/90 leading-relaxed font-medium bg-white/70 p-3.5 rounded-2xl border border-emerald-200">
                  Your profile meets standard safety eligibility for educational and traditional herbal wellness guidance.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ================================================== */}
        {/* 2. CORE GUIDANCE: Use Herbal Remedies Safely       */}
        {/* ================================================== */}
        <section className="space-y-4">
          <div>
            <h2 className="font-heading font-black text-xl sm:text-2xl text-[#0f2c20]">
              Use Herbal Remedies Safely
            </h2>
            <p className="text-xs sm:text-sm text-[#52796f] mt-1">
              Documented traditional guidelines, sensitive populations, and caution rules
            </p>
          </div>

          {/* 3 Visual Levels Hierarchy Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category 1: Medication Use & Interactions (Yellow) */}
            <div className="p-4 sm:p-5 rounded-3xl bg-amber-50/60 border border-amber-200 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MedicinePill2DIcon size={20} />
                  <h3 className="font-heading font-extrabold text-sm text-[#0f2c20]">
                    Prescription Interactions
                  </h3>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  Precaution
                </span>
              </div>
              <p className="text-xs text-[#52796f] leading-relaxed">
                Herbs like Sambong (diuretic) and Ampalaya (hypoglycemic) can alter blood levels of prescription medications. Always space doses by at least 2 hours and inform your doctor.
              </p>
            </div>

            {/* Category 2: Pregnancy & Breastfeeding (Yellow) */}
            <div className="p-4 sm:p-5 rounded-3xl bg-amber-50/60 border border-amber-200 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TeaCup2DIcon size={20} />
                  <h3 className="font-heading font-extrabold text-sm text-[#0f2c20]">
                    Pregnancy &amp; Breastfeeding
                  </h3>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  Precaution
                </span>
              </div>
              <p className="text-xs text-[#52796f] leading-relaxed">
                Active botanical compounds can cross the placenta or enter breast milk. Do not ingest concentrated herbal extracts or decoctions while pregnant without obstetrician clearance.
              </p>
            </div>

            {/* Category 3: Children & Infants (Coral/Red) */}
            <div className="p-4 sm:p-5 rounded-3xl bg-rose-50/60 border border-rose-200 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert2DIcon size={20} />
                  <h3 className="font-heading font-extrabold text-sm text-[#0f2c20]">
                    Infants &amp; Young Children
                  </h3>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300">
                  Seek Professional Care
                </span>
              </div>
              <p className="text-xs text-[#52796f] leading-relaxed">
                Infants under 2 years old have immature hepatic and renal enzymes. Never administer home-boiled decoctions or strong teas to infants without pediatric direction.
              </p>
            </div>

            {/* Category 4: Older Adults (Yellow) */}
            <div className="p-4 sm:p-5 rounded-3xl bg-amber-50/60 border border-amber-200 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LeafShield2DIcon size={20} />
                  <h3 className="font-heading font-extrabold text-sm text-[#0f2c20]">
                    Older Adults (65+)
                  </h3>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  Precaution
                </span>
              </div>
              <p className="text-xs text-[#52796f] leading-relaxed">
                Senior adults often take multiple maintenance medicines and experience altered hydration. Start with lower herbal strengths and observe blood pressure and sugar levels.
              </p>
            </div>

            {/* Category 5: Chronic Conditions (Coral/Red) */}
            <div className="p-4 sm:p-5 rounded-3xl bg-rose-50/60 border border-rose-200 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                  <h3 className="font-heading font-extrabold text-sm text-[#0f2c20]">
                    Kidney &amp; Liver Conditions
                  </h3>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300">
                  Seek Professional Care
                </span>
              </div>
              <p className="text-xs text-[#52796f] leading-relaxed">
                Botanicals metabolized by the liver or cleared by kidneys can accumulate dangerously in impaired organs. Strict nephrologist or hepatologist clearance is required.
              </p>
            </div>

            {/* Category 6: Safe Storage & Preparation (Green) */}
            <div className="p-4 sm:p-5 rounded-3xl bg-emerald-50/60 border border-emerald-200 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-heading font-extrabold text-sm text-[#0f2c20]">
                    Preparation &amp; Storage
                  </h3>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                  General Info
                </span>
              </div>
              <p className="text-xs text-[#52796f] leading-relaxed">
                Boil decoctions in clean enamel or glass pots (avoid reactive aluminum). Traditional tea decoctions should be consumed fresh or discarded after 24 hours.
              </p>
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* 3. WHEN TO SEEK CARE CARD                          */}
        {/* ================================================== */}
        <section className="p-5 sm:p-6 rounded-3xl bg-white border border-[#dde6df] shadow-2xs space-y-3.5">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <h3 className="font-heading font-extrabold text-base text-[#0f2c20]">
              When to Seek Emergency or Immediate Care
            </h3>
          </div>

          <p className="text-xs sm:text-sm text-[#52796f] leading-relaxed">
            Immediately discontinue any herbal remedy and consult an emergency facility if you experience any of the following symptoms:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#3d4a45]">
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-[#faf9f5]">
              <span className="text-rose-600 font-bold">&bull;</span>
              <span>Sudden difficulty breathing or throat swelling</span>
            </div>
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-[#faf9f5]">
              <span className="text-rose-600 font-bold">&bull;</span>
              <span>Severe chest tightness, dizziness or fainting</span>
            </div>
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-[#faf9f5]">
              <span className="text-rose-600 font-bold">&bull;</span>
              <span>Coughing up blood or dark vomiting</span>
            </div>
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-[#faf9f5]">
              <span className="text-rose-600 font-bold">&bull;</span>
              <span>High fever persisting longer than 3 days</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/community/facilities"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-bold shadow-2xs active:scale-95 transition-all"
            >
              <Hospital2DIcon size={18} />
              <span>Locate Nearby Healthcare Facilities</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-300" />
            </Link>
          </div>
        </section>

        {/* Retake Screening */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#dde6df] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <h4 className="font-heading font-bold text-sm text-[#0f2c20]">
              Need to update your health profile?
            </h4>
            <p className="text-xs text-[#52796f]">
              If your medication or health circumstances have changed, you can retake the screening anytime.
            </p>
          </div>

          <Link
            href="/community/screening?retake=true"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#f0f4f1] hover:bg-emerald-100 text-xs font-bold text-[#1e5c44] transition-colors shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retake Health Screening</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
