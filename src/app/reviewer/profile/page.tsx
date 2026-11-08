"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  ShieldCheck,
  Building2,
  Award,
  CheckCircle2,
  Save,
  Loader2,
  Leaf,
  Dna,
  Pill,
  FlaskConical,
  Stethoscope,
  Lock,
  X,
} from "lucide-react";
import {
  EXPERT_REVIEW_AREAS,
  normalizeReviewAreaKey,
  expertReviewAreaLabel,
} from "@/lib/expert-review-areas";
import { broadcastProfileNameUpdate } from "@/hooks/useLiveDisplayName";

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20";

const labelClass = "mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500";

const AREA_ICONS: Record<string, React.ElementType> = {
  pharmacognosy: Leaf,
  bioinformatics: Dna,
  pharmacology: Pill,
  formulation: FlaskConical,
  clinical_safety: Stethoscope,
};

export default function ProfessionalProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    const trimmedName = name.trim();
    const firstName = trimmedName.split(" ")[0] || trimmedName;
    const lastName = trimmedName.split(" ").slice(1).join(" ") || "";

    try {
      const res = await fetch("/api/reviewer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          firstName,
          lastName,
          professionalTitle,
          institution,
          licenseNumber,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updatedName = data.name || trimmedName;

        setProfile((prev: any) => ({
          ...prev,
          name: updatedName,
          professionalTitle,
          institution,
          licenseNumber,
        }));

        broadcastProfileNameUpdate({
          name: updatedName,
          firstName,
          lastName,
        });

        router.refresh();
        setToastMessage("Profile saved");
        setTimeout(() => setToastMessage(null), 2500);
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
      <div className="flex w-full flex-col items-center gap-2 py-20">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <p className="text-[11px] font-medium text-slate-500">Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none space-y-4 pb-16">
      {/* Compact hero */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-[linear-gradient(120deg,#071930_0%,#0b2447_48%,#0f3460_100%)] px-4 py-3.5 text-white shadow-[0_12px_28px_-18px_rgba(7,25,48,0.55)] sm:px-5">
        <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-200">
              <User className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-semibold tracking-tight text-white">Profile</h1>
                <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-blue-200">
                  {profile?.role || "REVIEWER"}
                </span>
              </div>
              <p className="truncate text-[11px] text-blue-100/75">{name || profile?.name || "Reviewer"}</p>
            </div>
          </div>
          <p className="text-[10px] font-medium text-blue-200/60 sm:text-right">Shown on review sign-offs</p>
        </div>
      </div>

      {toastMessage && (
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[11px] font-semibold text-emerald-900">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {toastMessage}
          </span>
          <button type="button" onClick={() => setToastMessage(null)} aria-label="Dismiss">
            <X className="h-3.5 w-3.5 text-emerald-700/70" />
          </button>
        </div>
      )}

      <form
        onSubmit={handleSaveProfile}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(7,25,48,0.04)]"
      >
        {/* Credentials strip */}
        <section className="space-y-3 border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px]">
            <span className="inline-flex items-center gap-2 text-slate-600">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-slate-500">Status:</span>
              <span className="font-bold uppercase text-slate-900">{profile?.status || "ACTIVE"}</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <Award className="h-3.5 w-3.5 text-blue-600" />
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">
                {profile?.verificationStatus || "VERIFIED"}
              </span>
            </span>
          </div>

          <div>
            <p className={labelClass}>Assigned disciplines</p>
            <div className="flex flex-wrap gap-1.5">
              {(assignedAreas.length > 0 ? assignedAreas : EXPERT_REVIEW_AREAS.map((a) => a.key)).map(
                (areaKey) => {
                  const normKey = normalizeReviewAreaKey(areaKey);
                  const Icon = AREA_ICONS[normKey] || ShieldCheck;
                  const label =
                    assignedAreas.length > 0
                      ? expertReviewAreaLabel(normKey)
                      : EXPERT_REVIEW_AREAS.find((a) => a.key === normKey)?.shortLabel || normKey;
                  return (
                    <span
                      key={areaKey}
                      className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700"
                    >
                      <Icon className="h-3 w-3 text-blue-600" />
                      {label}
                    </span>
                  );
                }
              )}
            </div>
          </div>
        </section>

        {/* Identity */}
        <section className="space-y-3 border-b border-slate-100 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <User className="h-3.5 w-3.5" />
            </span>
            <h2 className="text-sm font-semibold text-slate-900">Identity</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fieldClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={profile?.email || ""}
                  disabled
                  className={`${fieldClass} cursor-not-allowed bg-slate-100 pr-8 text-slate-500`}
                />
                <Lock className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>
        </section>

        {/* Professional */}
        <section className="space-y-3 border-b border-slate-100 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <Building2 className="h-3.5 w-3.5" />
            </span>
            <h2 className="text-sm font-semibold text-slate-900">Credentials</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Professional title</label>
              <input
                type="text"
                value={professionalTitle}
                onChange={(e) => setProfessionalTitle(e.target.value)}
                placeholder="Lead Pharmacognosy Evaluator"
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Institution</label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="University / Institute"
                className={fieldClass}
              />
            </div>
          </div>

          <div className="max-w-md">
            <label className={labelClass}>License / certification</label>
            <input
              type="text"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="PRC-PH-0082910"
              className={fieldClass}
            />
          </div>
        </section>

        <div className="flex justify-end border-t border-slate-100 p-4 sm:p-5">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                Save profile
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
