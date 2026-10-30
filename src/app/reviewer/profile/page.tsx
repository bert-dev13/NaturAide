"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  ShieldCheck,
  Building2,
  Mail,
  Award,
  CheckCircle2,
  Save,
  Loader2,
  Leaf,
  Dna,
  Pill,
  FlaskConical,
  Stethoscope,
} from "lucide-react";
import {
  EXPERT_REVIEW_AREAS,
  normalizeReviewAreaKey,
  expertReviewAreaLabel,
} from "@/lib/expert-review-areas";

const AREA_ICONS: Record<string, React.ElementType> = {
  pharmacognosy: Leaf,
  bioinformatics: Dna,
  pharmacology: Pill,
  formulation: FlaskConical,
  clinical_safety: Stethoscope,
};

export default function ProfessionalProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [professionalTitle, setProfessionalTitle] = useState("");
  const [institution, setInstitution] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [assignedAreas, setAssignedAreas] = useState<string[]>([]);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const res = await fetch("/api/reviewer/profile");
        if (res.ok) {
          const data = await res.json();
          const p = data.profile;
          setProfile(p);
          setName(p.name || "");
          setProfessionalTitle(p.professionalTitle || "");
          setInstitution(p.institution || "");
          setLicenseNumber(p.licenseNumber || "");
          setAssignedAreas(p.assignedAreas || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/reviewer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: name.split(" ")[0] || name,
          lastName: name.split(" ").slice(1).join(" ") || "",
          professionalTitle,
          institution,
          licenseNumber,
        }),
      });

      if (res.ok) {
        setToastMessage("Professional profile credentials saved successfully.");
        setTimeout(() => setToastMessage(null), 3500);
      } else {
        alert("Failed to update reviewer profile");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center rounded-2xl bg-white border border-slate-200">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500 font-medium">Loading professional profile...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* TOAST ALERT */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* PREMIUM SCIENTIFIC BLUE HERO HEADER */}
      <div className="relative overflow-hidden p-6 sm:p-7 rounded-2xl bg-gradient-to-r from-[#071d3a] via-[#0b2b54] to-[#123e73] border border-blue-400/30 text-white shadow-lg shadow-blue-950/20 space-y-2.5">
        <div className="absolute -top-16 -right-16 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

        <div className="relative z-10 space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/25 text-blue-200 border border-blue-400/40 text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md shadow-2xs">
            <Award className="w-3.5 h-3.5 text-blue-300 animate-pulse" />
            <span>Reviewer Credentials</span>
          </span>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/30 border border-blue-400/40 text-blue-300 flex items-center justify-center shrink-0 shadow-inner">
              <User className="w-5 h-5 text-blue-300" />
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-extrabold text-white tracking-tight drop-shadow-xs">
              Professional Profile
            </h1>
          </div>

          <p className="text-xs sm:text-sm text-blue-200/85 leading-relaxed max-w-2xl">
            Manage your verified professional title, institutional affiliation, and assigned scientific review disciplines.
          </p>
        </div>
      </div>

      {/* COMPACT PROFILE CARD & FORM */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
        {/* Status Strip */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-slate-500">Account Status:</span>
            <span className="font-bold text-slate-900 uppercase">
              {profile?.status || "ACTIVE"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-600" />
            <span className="text-slate-500">Verification:</span>
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px] uppercase">
              {profile?.verificationStatus || "VERIFIED"}
            </span>
          </div>
        </div>

        {/* Assigned Scientific Review Areas Badges */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-900 block">
            Assigned Review Discipline(s)
          </label>
          <div className="flex flex-wrap gap-2">
            {assignedAreas.length > 0 ? (
              assignedAreas.map((areaKey) => {
                const normKey = normalizeReviewAreaKey(areaKey);
                const Icon = AREA_ICONS[normKey] || ShieldCheck;
                return (
                  <span
                    key={areaKey}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                  >
                    <Icon className="w-3.5 h-3.5 text-blue-600" />
                    <span>{expertReviewAreaLabel(normKey)}</span>
                  </span>
                );
              })
            ) : (
              EXPERT_REVIEW_AREAS.map((a) => {
                const Icon = AREA_ICONS[a.key] || ShieldCheck;
                return (
                  <span
                    key={a.key}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Icon className="w-3.5 h-3.5 text-blue-600" />
                    <span>{a.shortLabel}</span>
                  </span>
                );
              })
            )}
          </div>
        </div>

        {/* Profile Information Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4 pt-2 border-t border-slate-100 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 text-xs text-slate-900 outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Email Address (Read-Only)</label>
              <input
                type="email"
                value={profile?.email || ""}
                disabled
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-100 text-xs text-slate-500 outline-none cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Professional Title</label>
              <input
                type="text"
                value={professionalTitle}
                onChange={(e) => setProfessionalTitle(e.target.value)}
                placeholder="e.g. Lead Pharmacognosy Evaluator"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 text-xs text-slate-900 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Institutional Affiliation</label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. University / Research Institute"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 text-xs text-slate-900 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Professional License / Certification Number</label>
            <input
              type="text"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="e.g. PRC-PH-0082910"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 text-xs text-slate-900 outline-none max-w-sm"
            />
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
