"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import MobileAppHeader from "@/components/community/MobileAppHeader";
import {
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  Loader2,
  Heart,
  Stethoscope,
  Building2,
} from "lucide-react";
import {
  getScreeningSeverity,
  getSeverityMeta,
  ScreeningSeverity,
} from "@/lib/safety-rules";
import {
  LeafShield2DIcon,
  ShieldAlert2DIcon,
  Hospital2DIcon,
} from "@/components/community/CommunityIcons2D";

const HEALTH_CONCERNS = [
  { id: "cough", label: "Cough, Colds & Breathing", icon: "🍃" },
  { id: "digestion", label: "Stomach & Digestive Comfort", icon: "🍵" },
  { id: "wellness", label: "Everyday Wellness & Energy", icon: "✨" },
  { id: "relaxation", label: "Relaxation, Sleep & Stress", icon: "🌙" },
  { id: "aches", label: "Minor Body Aches & Stiffness", icon: "🌱" },
  { id: "skin", label: "Minor Skin Relief", icon: "🌿" },
  { id: "other", label: "General Botanical Interest", icon: "📖" },
];

const AGE_GROUPS = [
  { id: "under-2", label: "Infant (Under 2 years old)" },
  { id: "2-17", label: "Child / Youth (2 - 17 years old)" },
  { id: "18-64", label: "Adult (18 - 64 years old)" },
  { id: "65-plus", label: "Senior Adult (65 years or older)" },
];

const MEDICATION_OPTIONS = [
  { id: "blood-thinners", label: "Blood thinners / Anticoagulants (e.g. Warfarin, Aspirin, Clopidogrel)" },
  { id: "bp-cardiac", label: "Blood pressure / Heart medication or Prescription Diuretics" },
  { id: "diabetes", label: "Diabetes / Blood sugar medication" },
  { id: "inhalers", label: "Prescription asthma inhalers" },
  { id: "none", label: "No regular prescription medications" },
];

const ALLERGY_OPTIONS = [
  { id: "asteraceae", label: "Known allergy to daisy/sunflower plant family (Asteraceae - Sambong)" },
  { id: "lamiaceae", label: "Known allergy to mint family plants (Lamiaceae - Lagundi, Yerba Buena)" },
  { id: "none", label: "No known plant or botanical allergies" },
];

export default function HealthScreeningPage() {
  // Wizard Step (1 to 4)
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Neutral / Unanswered Form State (No pre-selected answers)
  const [ageGroup, setAgeGroup] = useState("");
  const [healthConcern, setHealthConcern] = useState("");
  const [selectedMeds, setSelectedMeds] = useState<string[]>([]);
  const [medDetails] = useState("");
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [allergyDetails] = useState("");
  const [isPregnantOrLactating, setIsPregnantOrLactating] = useState<boolean | null>(null);
  const [hasSevereSymptoms, setHasSevereSymptoms] = useState<boolean | null>(null);
  const [hasOrganFailure, setHasOrganFailure] = useState<boolean | null>(null);

  // Status State
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [existingScreening, setExistingScreening] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const fetchCurrentStatus = async () => {
      try {
        const res = await fetch("/api/community/screening");
        const data = await res.json();
        if (data.success && data.screening) {
          setExistingScreening(data.screening);

          // Direct route protection: if user already has completed screening and did not request retake, redirect immediately
          const isRetake =
            typeof window !== "undefined" &&
            (new URLSearchParams(window.location.search).get("retake") === "true" ||
             new URLSearchParams(window.location.search).get("force") === "true");
          if (!isRetake) {
            const dest =
              data.screening.evaluationResult === "PROFESSIONAL_GUIDANCE_REQUIRED"
                ? "/community/guidance"
                : "/community";
            window.location.href = dest;
            return;
          }
        }
      } catch (err) {
        console.error("Failed to load initial screening:", err);
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchCurrentStatus();
  }, []);

  if (loadingInitial) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center space-y-3 bg-[#faf9f5]">
        <Loader2 className="w-8 h-8 text-emerald-700 animate-spin" />
        <p className="text-xs text-[#52796f] font-bold">Verifying health safety records...</p>
      </div>
    );
  }

  const toggleMedication = (id: string) => {
    if (id === "none") {
      setSelectedMeds(["none"]);
      return;
    }
    const filtered = selectedMeds.filter((m) => m !== "none");
    if (filtered.includes(id)) {
      const next = filtered.filter((m) => m !== id);
      setSelectedMeds(next);
    } else {
      setSelectedMeds([...filtered, id]);
    }
  };

  const toggleAllergy = (id: string) => {
    if (id === "none") {
      setSelectedAllergies(["none"]);
      return;
    }
    const filtered = selectedAllergies.filter((a) => a !== "none");
    if (filtered.includes(id)) {
      const next = filtered.filter((a) => a !== id);
      setSelectedAllergies(next);
    } else {
      setSelectedAllergies([...filtered, id]);
    }
  };

  const canContinueStep1 = Boolean(healthConcern && ageGroup);
  const canContinueStep2 = selectedMeds.length > 0 && selectedAllergies.length > 0;
  const canContinueStep3 =
    isPregnantOrLactating !== null && hasSevereSymptoms !== null && hasOrganFailure !== null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!canContinueStep1 || !canContinueStep2 || !canContinueStep3) {
      setErrorMessage("Please answer all screening questions before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/community/screening", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ageGroup,
          healthConcern,
          currentMedications: selectedMeds,
          medicationDetails: medDetails,
          knownAllergies: selectedAllergies,
          allergyDetails,
          isPregnantOrLactating: Boolean(isPregnantOrLactating),
          hasSevereSymptoms: Boolean(hasSevereSymptoms),
          hasOrganFailure: Boolean(hasOrganFailure),
        }),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to process health screening.");
      }

      // Immediate redirect using window.location for zero router-cache lag
      const destination =
        data.redirectUrl ||
        (data.evaluationResult === "ELIGIBLE_TO_CONTINUE" ? "/community" : "/community/guidance");

      window.location.href = destination;
    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
      setErrorMessage(msg);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* App Header */}
      <MobileAppHeader
        showBack={true}
        backHref="/community/profile"
        title="Health Safety Screening"
        subtitle="Let's start with a quick safety check"
      />

      <div className="flex-1 px-4 sm:px-6 py-4 space-y-5">
        {/* Screening Intro Header */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#f2f8f4] via-[#faf9f5] to-[#edf6f0] border border-[#dcebe0] flex flex-col sm:flex-row items-center justify-between gap-3.5 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0 shadow-2xs">
              <LeafShield2DIcon size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-black text-base sm:text-lg text-[#0f2c20]">
                  Let&apos;s Check What&apos;s Safe for You
                </h1>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  About 1 minute
                </span>
              </div>
              <p className="text-xs text-[#52796f] mt-0.5">
                Answer a few questions before exploring herbal options.
              </p>
            </div>
          </div>
        </div>

        {/* Step Progress Indicator (Step X of 4 • Track + Dots) */}
        <div className="space-y-2 p-3.5 rounded-2xl bg-white border border-[#dde6df] shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-[#52796f]">
            <span className="font-heading font-extrabold text-[#0f2c20]">
              Step {step} of {totalSteps}
            </span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4].map((s) => (
                <span
                  key={s}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    s === step
                      ? "bg-emerald-600 scale-125 ring-2 ring-emerald-200"
                      : s < step
                      ? "bg-emerald-500"
                      : "bg-[#dde6df]"
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#e2ebe4] overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* "Why we ask this" explanation banner */}
        <div className="p-4 sm:p-5 rounded-3xl bg-emerald-50/90 border border-emerald-200/80 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-950 uppercase tracking-wider">
            <HelpCircle className="w-4 h-4 text-emerald-700" />
            <span>Why we ask this</span>
          </div>
          <p className="text-xs sm:text-sm text-emerald-950 font-semibold leading-relaxed">
            Before showing recommendation-oriented herbal information, NaturAide asks a few questions to help determine whether this feature is appropriate for you.
          </p>
          <p className="text-[11px] sm:text-xs text-emerald-900 leading-relaxed font-normal">
            This information helps NaturAide perform an initial safety screening before showing recommendation-oriented herbal information. NaturAide does not diagnose medical conditions.
          </p>
        </div>

        {/* Existing screening alert if already screened */}
        {existingScreening && step === 1 && (() => {
          const existingSev = getScreeningSeverity(existingScreening);
          const meta = getSeverityMeta(existingSev);

          return (
            <div
              className={`p-4 rounded-2xl border ${meta.colorScheme.border} ${meta.colorScheme.borderAccent} ${meta.colorScheme.bg} text-xs space-y-2 transition-all duration-200`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {existingSev === "severe" ? (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 animate-pulse" />
                  ) : existingSev === "moderate" ? (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <div>
                    <p className={`font-extrabold ${meta.colorScheme.text}`}>
                      {meta.title}
                    </p>
                    <p className={`text-[11px] ${meta.colorScheme.subtext} mt-0.5 font-medium leading-relaxed`}>
                      {meta.description}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ml-2 ${meta.colorScheme.badge}`}
                >
                  {meta.badgeLabel}
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                Completed on {existingScreening.createdAt ? new Date(String(existingScreening.createdAt)).toLocaleDateString() : "earlier"}
              </p>
            </div>
          );
        })()}

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="font-medium flex-1">{errorMessage}</p>
          </div>
        )}

        {/* FORM CONTENT BY STEP */}
        <div className="bg-white rounded-3xl border border-[#dde6df] p-5 sm:p-6 shadow-2xs space-y-5">
          {/* STEP 1: CONCERN & AGE */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-heading font-extrabold text-lg sm:text-xl text-[#0f2c20]">
                  What brings you to NaturAide?
                </h2>
                <p className="text-xs sm:text-sm text-[#52796f] mt-1">
                  Select your primary wellness or traditional remedy interest.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {HEALTH_CONCERNS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setHealthConcern(item.label)}
                    className={`w-full p-3.5 rounded-2xl text-left border flex items-center gap-3 transition-all cursor-pointer ${
                      healthConcern === item.label
                        ? "bg-emerald-50 border-emerald-500 text-[#0f2c20] font-bold shadow-xs"
                        : "bg-[#faf9f5] border-[#dde6df] text-[#3d4a45] hover:border-emerald-300"
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-xs sm:text-sm flex-1">{item.label}</span>
                    {healthConcern === item.label && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <label className="block font-heading font-extrabold text-sm sm:text-base text-[#0f2c20] mb-1">
                  Age Group of the Intended Person
                </label>
                <p className="text-xs text-[#52796f] mb-3">
                  Certain herbs have specific pediatric or geriatric safety considerations.
                </p>
                <div className="grid grid-cols-1 gap-2.5">
                  {AGE_GROUPS.map((ag) => {
                    const isSelected = ageGroup === ag.id;
                    const isCaution = ag.id === "under-2" || ag.id === "65-plus";

                    return (
                      <label
                        key={ag.id}
                        className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? isCaution
                              ? "bg-amber-50/85 border-amber-400 text-amber-950 font-bold shadow-xs border-l-4 border-l-amber-500"
                              : "bg-emerald-50 border-emerald-500 text-[#0f2c20] font-bold shadow-xs border-l-4 border-l-emerald-600"
                            : "bg-[#faf9f5] border-[#dde6df] text-[#3d4a45] hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="ageGroup"
                          value={ag.id}
                          checked={isSelected}
                          onChange={(e) => setAgeGroup(e.target.value)}
                          className={`w-4 h-4 mt-0.5 ${isCaution ? "accent-amber-600 text-amber-600" : "accent-emerald-600 text-emerald-600"}`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm">{ag.label}</span>
                            {isSelected && (
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border transition-all ${
                                  isCaution
                                    ? "bg-amber-100 text-amber-900 border-amber-300"
                                    : "bg-emerald-100 text-emerald-900 border-emerald-300"
                                }`}
                              >
                                {isCaution ? "Caution" : "Low Risk"}
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <p
                              className={`text-[11px] mt-1 flex items-center gap-1 font-medium transition-opacity duration-200 ${
                                isCaution ? "text-amber-800" : "text-emerald-800"
                              }`}
                            >
                              {isCaution ? (
                                <>
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span>
                                    {ag.id === "under-2"
                                      ? "Pediatric metabolic clearance requires direct clinical supervision."
                                      : "Senior physiological sensitivity and prescription drug interactions apply."}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>Standard age eligibility for herbal wellness guidance.</span>
                                </>
                              )}
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: MEDICATIONS & ALLERGIES */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-heading font-extrabold text-lg sm:text-xl text-[#0f2c20]">
                  Current Medications & Known Allergies
                </h2>
                <p className="text-xs sm:text-sm text-[#52796f] mt-1">
                  Herbal remedies contain pharmacologically active constituents that can interact with medicines.
                </p>
              </div>

              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-[#0f2c20] uppercase tracking-wider">
                  Are you currently taking any prescription medications?
                </label>
                <div className="space-y-2">
                  {MEDICATION_OPTIONS.map((opt) => {
                    const isSelected = selectedMeds.includes(opt.id);
                    const isSevere = opt.id === "blood-thinners";
                    const isCaution = opt.id === "bp-cardiac" || opt.id === "diabetes" || opt.id === "inhalers";

                    return (
                      <label
                        key={opt.id}
                        className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? isSevere
                              ? "bg-rose-50/90 border-rose-300 text-rose-950 font-bold shadow-xs border-l-4 border-l-rose-600"
                              : isCaution
                              ? "bg-amber-50/85 border-amber-300 text-amber-950 font-bold shadow-xs border-l-4 border-l-amber-500"
                              : "bg-emerald-50/85 border-emerald-300 text-[#0f2c20] font-bold shadow-xs border-l-4 border-l-emerald-600"
                            : "bg-[#faf9f5] border-[#dde6df] text-[#3d4a45] hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleMedication(opt.id)}
                          className={`w-4 h-4 mt-0.5 rounded ${
                            isSevere
                              ? "accent-rose-600 text-rose-600"
                              : isCaution
                              ? "accent-amber-600 text-amber-600"
                              : "accent-emerald-600 text-emerald-600"
                          }`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm leading-relaxed">{opt.label}</span>
                            {isSelected && (
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ml-2 ${
                                  isSevere
                                    ? "bg-rose-100 text-rose-900 border-rose-300"
                                    : isCaution
                                    ? "bg-amber-100 text-amber-900 border-amber-300"
                                    : "bg-emerald-100 text-emerald-900 border-emerald-300"
                                }`}
                              >
                                {isSevere ? "Severe Risk" : isCaution ? "Caution" : "Low Risk"}
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <p
                              className={`text-[11px] mt-1.5 flex items-start gap-1 font-medium leading-relaxed ${
                                isSevere ? "text-rose-800" : isCaution ? "text-amber-800" : "text-emerald-800"
                              }`}
                            >
                              {isSevere ? (
                                <>
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
                                  <span>Severe interaction risk: Anticoagulants carry high bleeding risks when combined with active botanicals.</span>
                                </>
                              ) : isCaution ? (
                                <>
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                  <span>Caution recommended: Botanical constituents may alter drug levels or metabolic clearance.</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  <span>No prescription medications reported that conflict with self-care botanicals.</span>
                                </>
                              )}
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 space-y-2.5">
                <label className="block text-xs font-bold text-[#0f2c20] uppercase tracking-wider">
                  Do you have known allergies to specific plant families?
                </label>
                <div className="space-y-2">
                  {ALLERGY_OPTIONS.map((opt) => {
                    const isSelected = selectedAllergies.includes(opt.id);
                    const isCaution = opt.id === "asteraceae" || opt.id === "lamiaceae";

                    return (
                      <label
                        key={opt.id}
                        className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? isCaution
                              ? "bg-amber-50/85 border-amber-300 text-amber-950 font-bold shadow-xs border-l-4 border-l-amber-500"
                              : "bg-emerald-50/85 border-emerald-300 text-[#0f2c20] font-bold shadow-xs border-l-4 border-l-emerald-600"
                            : "bg-[#faf9f5] border-[#dde6df] text-[#3d4a45] hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleAllergy(opt.id)}
                          className={`w-4 h-4 mt-0.5 rounded ${
                            isCaution ? "accent-amber-600 text-amber-600" : "accent-emerald-600 text-emerald-600"
                          }`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm leading-relaxed">{opt.label}</span>
                            {isSelected && (
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ml-2 ${
                                  isCaution
                                    ? "bg-amber-100 text-amber-900 border-amber-300"
                                    : "bg-emerald-100 text-emerald-900 border-emerald-300"
                                }`}
                              >
                                {isCaution ? "Caution" : "Low Risk"}
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <p
                              className={`text-[11px] mt-1.5 flex items-start gap-1 font-medium leading-relaxed ${
                                isCaution ? "text-amber-800" : "text-emerald-800"
                              }`}
                            >
                              {isCaution ? (
                                <>
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                  <span>Cross-reactivity warning: Botanical family hypersensitivity documented.</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  <span>No known plant family allergies reported.</span>
                                </>
                              )}
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PREGNANCY & SAFETY RED FLAGS */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-heading font-extrabold text-lg sm:text-xl text-[#0f2c20]">
                  Health Safety Assessment
                </h2>
                <p className="text-xs sm:text-sm text-[#52796f] mt-1">
                  NaturAide checks these safety factors to determine whether recommendation-oriented guidance is appropriate.
                </p>
              </div>

              {/* Pregnancy / Nursing */}
              <div
                className={`p-4 rounded-2xl border transition-all duration-200 space-y-3 ${
                  isPregnantOrLactating === true
                    ? "bg-amber-50/50 border-amber-300 border-l-4 border-l-amber-500 shadow-xs"
                    : isPregnantOrLactating === false
                    ? "bg-emerald-50/30 border-emerald-300 border-l-4 border-l-emerald-600"
                    : "bg-[#faf9f5] border-[#dde6df]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#0f2c20]">
                    <Heart className="w-4 h-4 text-rose-600" />
                    <span>Pregnancy & Nursing Status</span>
                  </div>
                  {isPregnantOrLactating !== null && (
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        isPregnantOrLactating
                          ? "bg-amber-100 text-amber-900 border-amber-300"
                          : "bg-emerald-100 text-emerald-900 border-emerald-300"
                      }`}
                    >
                      {isPregnantOrLactating ? "Caution" : "Low Risk"}
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#52796f]">
                  Are you currently pregnant or actively breastfeeding?
                </p>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPregnantOrLactating(true)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer ${
                      isPregnantOrLactating === true
                        ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                        : "bg-white text-[#3d4a45] border-[#dde6df] hover:border-amber-300"
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPregnantOrLactating(false)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer ${
                      isPregnantOrLactating === false
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-white text-[#3d4a45] border-[#dde6df] hover:border-emerald-300"
                    }`}
                  >
                    No / Not Applicable
                  </button>
                </div>

                {isPregnantOrLactating === true && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-950 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-amber-900">Caution Recommended</p>
                      <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                        Active herbal phytochemicals can stimulate uterine tone or pass into breastmilk. Professional clinical guidance is recommended.
                      </p>
                    </div>
                  </div>
                )}
                {isPregnantOrLactating === false && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-950 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-emerald-900">Low Risk: Standard physiological safety profile reported.</span>
                  </div>
                )}
              </div>

              {/* Acute / Red Flag Symptoms */}
              <div
                className={`p-4 rounded-2xl border transition-all duration-200 space-y-3 ${
                  hasSevereSymptoms === true
                    ? "bg-rose-50/70 border-rose-300 border-l-4 border-l-rose-600 shadow-xs"
                    : hasSevereSymptoms === false
                    ? "bg-emerald-50/30 border-emerald-300 border-l-4 border-l-emerald-600"
                    : "bg-[#faf9f5] border-[#dde6df]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#0f2c20]">
                    <ShieldAlert
                      className={`w-4 h-4 ${hasSevereSymptoms === true ? "text-rose-600" : "text-amber-600"}`}
                    />
                    <span>Severe or Red-Flag Symptoms</span>
                  </div>
                  {hasSevereSymptoms !== null && (
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        hasSevereSymptoms
                          ? "bg-rose-100 text-rose-900 border-rose-300"
                          : "bg-emerald-100 text-emerald-900 border-emerald-300"
                      }`}
                    >
                      {hasSevereSymptoms ? "Severe High Risk" : "Low Risk"}
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#52796f] leading-relaxed">
                  Are you experiencing acute symptoms such as shortness of breath, severe chest pain, coughing blood, fever lasting over 3 days, or sudden severe abdominal pain?
                </p>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setHasSevereSymptoms(true)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer ${
                      hasSevereSymptoms === true
                        ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-600 shadow-xs font-extrabold"
                        : "bg-white text-[#3d4a45] border-[#dde6df] hover:border-rose-300"
                    }`}
                  >
                    Yes, I have severe symptoms
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasSevereSymptoms(false)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer ${
                      hasSevereSymptoms === false
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs font-bold"
                        : "bg-white text-[#3d4a45] border-[#dde6df] hover:border-emerald-300"
                    }`}
                  >
                    No severe symptoms
                  </button>
                </div>

                {hasSevereSymptoms === true && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-2 text-xs text-rose-950 animate-fadeIn">
                    <div className="flex items-center gap-2 font-heading font-extrabold text-sm text-rose-950">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 animate-pulse" />
                      <span>Severe Symptoms Identified</span>
                    </div>
                    <p className="text-[11px] text-rose-900 leading-relaxed font-medium">
                      Your responses indicate symptoms that may require professional medical attention. Acute red-flag signs require urgent clinical evaluation.
                    </p>
                    <div className="pt-1 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-rose-950">
                        Recommended Next Action: Seek Professional Care
                      </span>
                      <Link
                        href="/community/facilities"
                        target="_blank"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer"
                      >
                        <Building2 className="w-3 h-3" />
                        <span>Find Nearby Healthcare Facilities →</span>
                      </Link>
                    </div>
                  </div>
                )}
                {hasSevereSymptoms === false && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-950 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-emerald-900">
                      Low-Risk Symptoms: No severe warning signs were identified from your responses.
                    </span>
                  </div>
                )}
              </div>

              {/* Chronic Organ Failure */}
              <div
                className={`p-4 rounded-2xl border transition-all duration-200 space-y-3 ${
                  hasOrganFailure === true
                    ? "bg-rose-50/70 border-rose-300 border-l-4 border-l-rose-600 shadow-xs"
                    : hasOrganFailure === false
                    ? "bg-emerald-50/30 border-emerald-300 border-l-4 border-l-emerald-600"
                    : "bg-[#faf9f5] border-[#dde6df]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#0f2c20]">
                    <Stethoscope
                      className={`w-4 h-4 ${hasOrganFailure === true ? "text-rose-600" : "text-teal-600"}`}
                    />
                    <span>Severe Chronic Organ Impairment</span>
                  </div>
                  {hasOrganFailure !== null && (
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        hasOrganFailure
                          ? "bg-rose-100 text-rose-900 border-rose-300"
                          : "bg-emerald-100 text-emerald-900 border-emerald-300"
                      }`}
                    >
                      {hasOrganFailure ? "Severe High Risk" : "Low Risk"}
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#52796f]">
                  Have you been diagnosed with severe chronic kidney failure or advanced liver disease?
                </p>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setHasOrganFailure(true)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer ${
                      hasOrganFailure === true
                        ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-600 shadow-xs font-extrabold"
                        : "bg-white text-[#3d4a45] border-[#dde6df] hover:border-rose-300"
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasOrganFailure(false)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer ${
                      hasOrganFailure === false
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs font-bold"
                        : "bg-white text-[#3d4a45] border-[#dde6df] hover:border-emerald-300"
                    }`}
                  >
                    No
                  </button>
                </div>

                {hasOrganFailure === true && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-2 text-xs text-rose-950 animate-fadeIn">
                    <div className="flex items-center gap-2 font-heading font-extrabold text-sm text-rose-950">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 animate-pulse" />
                      <span>Severe Symptoms Identified</span>
                    </div>
                    <p className="text-[11px] text-rose-900 leading-relaxed font-medium">
                      Severe kidney or liver disease impairs metabolic clearance and dramatically increases botanical toxicity risk. Direct medical supervision is required.
                    </p>
                    <div className="pt-1 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-rose-950">
                        Recommended Next Action: Seek Professional Care
                      </span>
                      <Link
                        href="/community/facilities"
                        target="_blank"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer"
                      >
                        <Building2 className="w-3 h-3" />
                        <span>Find Nearby Healthcare Facilities →</span>
                      </Link>
                    </div>
                  </div>
                )}
                {hasOrganFailure === false && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-950 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-emerald-900">
                      Low Risk: Normal metabolic clearance capacity reported.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & CONFIRM */}
          {step === 4 && (() => {
            const currentSeverity: ScreeningSeverity = getScreeningSeverity({
              ageGroup,
              currentMedications: selectedMeds,
              knownAllergies: selectedAllergies,
              isPregnantOrLactating,
              hasSevereSymptoms,
              hasOrganFailure,
            });

            return (
              <div className="space-y-5">
                <div>
                  <h2 className="font-heading font-extrabold text-lg sm:text-xl text-[#0f2c20]">
                    Review Your Screening Responses
                  </h2>
                  <p className="text-xs sm:text-sm text-[#52796f] mt-1">
                    Please verify your responses before submitting for safety evaluation.
                  </p>
                </div>

                {/* VISUAL SEVERITY RESULT CARD */}
                {currentSeverity === "severe" && (
                  <div className="p-5 rounded-2xl bg-rose-50/90 border-2 border-rose-300 shadow-2xs space-y-3 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
                          <ShieldAlert2DIcon size={22} />
                        </div>
                        <div>
                          <h3 className="text-base font-heading font-black text-rose-950">
                            Professional Care Is Recommended
                          </h3>
                          <p className="text-xs text-rose-900">
                            Acute symptoms or high-risk contraindications require clinical attention.
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300 text-[10px] font-extrabold shrink-0">
                        High Risk
                      </span>
                    </div>

                    <p className="text-xs text-rose-900 leading-relaxed font-medium bg-white/70 p-3 rounded-xl border border-rose-200">
                      Your responses indicate symptoms that may require professional medical attention rather than self-treatment with traditional herbal remedies. NaturAide does not diagnose medical conditions.
                    </p>

                    <div className="pt-1">
                      <Link
                        href="/community/facilities"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
                      >
                        <Hospital2DIcon size={18} />
                        <span>Find Nearby Healthcare Facilities →</span>
                      </Link>
                    </div>
                  </div>
                )}

                {currentSeverity === "moderate" && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-300 border-l-4 border-l-amber-500 shadow-2xs space-y-2.5 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                        <h3 className="text-base font-heading font-extrabold text-amber-950">
                          Caution Recommended
                        </h3>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold">
                        Caution
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-amber-900 leading-relaxed font-medium">
                      Some of your responses may require additional attention before continuing.
                    </p>

                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      NaturAide will provide general educational herbal facts, but recommendation-oriented herbal guidance will be restricted for your safety.
                    </p>
                  </div>
                )}

                {currentSeverity === "low" && (
                  <div className="p-5 rounded-2xl bg-emerald-50/90 border-2 border-emerald-300 shadow-2xs space-y-3 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
                          <LeafShield2DIcon size={22} />
                        </div>
                        <div>
                          <h3 className="text-base font-heading font-black text-emerald-950">
                            You can continue exploring
                          </h3>
                          <p className="text-xs text-emerald-800">
                            No immediate contraindications were flagged in this screening.
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-extrabold shrink-0">
                        Cleared
                      </span>
                    </div>

                    <p className="text-xs text-emerald-900/90 leading-relaxed font-medium bg-white/70 p-3 rounded-xl border border-emerald-200">
                      Please note: A cleared screening result does not mean any specific herbal plant is automatically appropriate or prescribed for your condition. Always check individual plant cautions and dosage guidance.
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Link
                        href="/community/herbal-guide"
                        className="px-4 py-2 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-bold shadow-2xs"
                      >
                        Explore Relevant Guides →
                      </Link>
                      <Link
                        href="/community/ask"
                        className="px-4 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-bold shadow-2xs"
                      >
                        Ask NaturAide
                      </Link>
                    </div>
                  </div>
                )}

                {/* DETAILED RESPONSES TABLE WITH SEVERITY COLOR BADGES */}
                <div className="divide-y divide-[#f0f4f1] border border-[#dde6df] rounded-2xl overflow-hidden bg-[#faf9f5]">
                  <div className="p-3.5 flex items-center justify-between text-xs">
                    <span className="text-[#52796f] font-medium">Wellness Concern:</span>
                    <span className="font-bold text-[#0f2c20] text-right">{healthConcern}</span>
                  </div>

                  <div className="p-3.5 flex items-center justify-between text-xs">
                    <span className="text-[#52796f] font-medium">Age Group:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#0f2c20]">
                        {AGE_GROUPS.find((a) => a.id === ageGroup)?.label}
                      </span>
                      {ageGroup === "under-2" || ageGroup === "65-plus" ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          Caution
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                          Low Risk
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 flex items-center justify-between text-xs">
                    <span className="text-[#52796f] font-medium">Medications:</span>
                    <div className="flex items-center gap-2 text-right">
                      <span className="font-bold text-[#0f2c20] max-w-[200px]">
                        {selectedMeds.includes("none") ? "None" : `${selectedMeds.length} category reported`}
                      </span>
                      {selectedMeds.includes("blood-thinners") ? (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300">
                          Severe Risk
                        </span>
                      ) : selectedMeds.includes("none") ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                          Low Risk
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          Caution
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 flex items-center justify-between text-xs">
                    <span className="text-[#52796f] font-medium">Pregnant / Nursing:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#0f2c20]">
                        {isPregnantOrLactating ? "Yes" : "No"}
                      </span>
                      {isPregnantOrLactating ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          Caution
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                          Low Risk
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 flex items-center justify-between text-xs">
                    <span className="text-[#52796f] font-medium">Severe Symptoms:</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${hasSevereSymptoms ? "text-rose-700" : "text-[#0f2c20]"}`}>
                        {hasSevereSymptoms ? "Reported" : "None"}
                      </span>
                      {hasSevereSymptoms ? (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300">
                          Severe High Risk
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                          Low Risk
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 flex items-center justify-between text-xs">
                    <span className="text-[#52796f] font-medium">Severe Organ Impairment:</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${hasOrganFailure ? "text-rose-700" : "text-[#0f2c20]"}`}>
                        {hasOrganFailure ? "Yes" : "No"}
                      </span>
                      {hasOrganFailure ? (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300">
                          Severe High Risk
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                          Low Risk
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-[11px] leading-relaxed">
                  <strong>Educational Disclaimer:</strong> NaturAide provides educational and evidence-based information and is not intended to diagnose medical conditions, prescribe treatment, or replace professional medical care.
                </div>
              </div>
            );
          })()}

          {/* NAVIGATION BUTTONS */}
          <div className="flex items-center justify-between pt-3 border-t border-[#f0f4f1]">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-[#dde6df] hover:bg-[#faf9f5] text-xs font-bold text-[#0f2c20] flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < totalSteps ? (
              <button
                type="button"
                onClick={() => {
                  const isStepValid =
                    step === 1
                      ? canContinueStep1
                      : step === 2
                      ? canContinueStep2
                      : step === 3
                      ? canContinueStep3
                      : true;
                  if (!isStepValid) {
                    if (step === 1) setErrorMessage("Please select your wellness concern and age group to continue.");
                    else if (step === 2) setErrorMessage("Please select your current medications and plant allergies (or select None).");
                    else if (step === 3) setErrorMessage("Please answer all health safety questions (Yes or No) to continue.");
                    return;
                  }
                  setErrorMessage(null);
                  setStep(step + 1);
                }}
                disabled={
                  step === 1
                    ? !canContinueStep1
                    : step === 2
                    ? !canContinueStep2
                    : step === 3
                    ? !canContinueStep3
                    : false
                }
                className={`px-5 py-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-1.5 shadow-xs transition-all ${
                  (step === 1 && canContinueStep1) ||
                  (step === 2 && canContinueStep2) ||
                  (step === 3 && canContinueStep3)
                    ? "bg-[#0f2c20] hover:bg-[#1e5c44] text-white cursor-pointer"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                    <span>Evaluating Safety...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {getScreeningSeverity({
                        ageGroup,
                        currentMedications: selectedMeds,
                        knownAllergies: selectedAllergies,
                        isPregnantOrLactating,
                        hasSevereSymptoms,
                        hasOrganFailure,
                      }) === "low"
                        ? "Continue →"
                        : "Complete Screening"}
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
