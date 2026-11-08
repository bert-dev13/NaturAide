"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Building2,
  Microscope,
  Save,
  CheckCircle2,
  Lock,
  X,
} from "lucide-react";
import { broadcastProfileNameUpdate } from "@/hooks/useLiveDisplayName";

const fieldClass =
  "w-full rounded-xl border border-[#d7e4dc] bg-[#f8fbf9] px-3 py-2 text-xs text-[#0f2c20] outline-none transition placeholder:text-[#8aa094] focus:border-emerald-500 focus:bg-white";

const labelClass = "mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#6d7f76]";

export default function ResearcherProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [institution, setInstitution] = useState("");
  const [department, setDepartment] = useState("");
  const [researchField, setResearchField] = useState("");
  const [academicInfo, setAcademicInfo] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const res = await fetch("/api/researcher/profile");
        if (res.ok) {
          const data = await res.json();
          const p = data.profile;
          setProfile(p);
          setFirstName(p.firstName || "");
          setLastName(p.lastName || "");
          setPhone(p.phone || "");
          setInstitution(p.institution || "");
          setDepartment(p.department || "");
          setResearchField(p.researchField || "");
          setAcademicInfo(p.academicInfo || "");
          setBio(p.bio || "");
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
      const res = await fetch("/api/researcher/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          institution,
          department,
          researchField,
          academicInfo,
          bio,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updatedName =
          data.name || `${firstName.trim()} ${lastName.trim()}`.trim() || profile?.name;

        setProfile((prev: any) => ({
          ...prev,
          name: updatedName,
          firstName,
          lastName,
          phone,
          institution,
          department,
          researchField,
          academicInfo,
          bio,
        }));

        broadcastProfileNameUpdate({
          name: updatedName,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        });

        router.refresh();
        setToastMessage("Profile saved");
        setTimeout(() => setToastMessage(null), 2500);
      } else {
        alert("Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving profile");
    } finally {
      setSaving(false);
    }
  };

  const displayName =
    firstName || lastName
      ? `${firstName} ${lastName}`.trim()
      : profile?.name || "Investigator";

  if (loading) {
    return (
      <div className="flex w-full flex-col items-center gap-2 py-20">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        <p className="text-[11px] font-medium text-[#8aa094]">Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none space-y-4 pb-16">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-[#0f2c20]/15 bg-[linear-gradient(120deg,#0f2c20_0%,#134032_48%,#0b271b_100%)] px-4 py-3.5 text-white shadow-[0_12px_28px_-18px_rgba(15,44,32,0.55)] sm:px-5">
        <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-200">
              <User className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-semibold tracking-tight text-white">Profile</h1>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                  {profile?.role || "RESEARCHER"}
                </span>
                <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-emerald-100/80">
                  #{profile?.id}
                </span>
              </div>
              <p className="truncate text-[11px] text-emerald-200/70">{displayName}</p>
            </div>
          </div>
          <p className="text-[10px] font-medium text-emerald-200/60 sm:text-right">
            Visible on submitted dossiers
          </p>
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
        className="overflow-hidden rounded-2xl border border-[#d7e4dc]/90 bg-white shadow-[0_1px_2px_rgba(15,44,32,0.04)]"
      >
        {/* Identity */}
        <section className="space-y-3 border-b border-[#eef2ef] p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
              <User className="h-3.5 w-3.5" />
            </span>
            <h2 className="text-sm font-semibold text-[#0f2c20]">Identity</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className={labelClass}>First name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Last name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={profile?.email || ""}
                  className={`${fieldClass} cursor-not-allowed bg-[#edf2ee] pr-8 text-[#6d7f76]`}
                />
                <Lock className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8aa094]" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Role</label>
              <div className="relative">
                <input
                  type="text"
                  disabled
                  value={profile?.role || "RESEARCHER"}
                  className={`${fieldClass} cursor-not-allowed bg-[#edf2ee] pr-8 font-semibold text-[#52645d]`}
                />
                <Lock className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8aa094]" />
              </div>
            </div>
          </div>
        </section>

        {/* Institution */}
        <section className="space-y-3 border-b border-[#eef2ef] p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
              <Building2 className="h-3.5 w-3.5" />
            </span>
            <h2 className="text-sm font-semibold text-[#0f2c20]">Institution</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className={labelClass}>Institution</label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="University / institute"
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Department / college"
                className={fieldClass}
              />
            </div>
          </div>
        </section>

        {/* Research */}
        <section className="space-y-3 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
              <Microscope className="h-3.5 w-3.5" />
            </span>
            <h2 className="text-sm font-semibold text-[#0f2c20]">Research</h2>
          </div>

          <div className="space-y-3">
            <div>
              <label className={labelClass}>Specialization</label>
              <input
                type="text"
                value={researchField}
                onChange={(e) => setResearchField(e.target.value)}
                placeholder="e.g. Natural products · molecular screening"
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Degrees & licenses</label>
              <textarea
                rows={2}
                value={academicInfo}
                onChange={(e) => setAcademicInfo(e.target.value)}
                placeholder="Degrees, licensure…"
                className={`${fieldClass} resize-y`}
              />
            </div>
            <div>
              <label className={labelClass}>Bio</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Short research bio…"
                className={`${fieldClass} resize-y`}
              />
            </div>
          </div>
        </section>

        <div className="flex items-center justify-end border-t border-[#eef2ef] bg-[#f8fbf9] px-4 py-3 sm:px-5">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f2c20] px-4 py-2 text-[11px] font-bold text-emerald-100 transition hover:bg-[#1e5c44] disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving…" : "Save profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
