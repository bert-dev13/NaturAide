"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Building2,
  GraduationCap,
  Microscope,
  Mail,
  ShieldCheck,
  Save,
  CheckCircle2,
  Lock,
  Sparkles,
  BookOpen,
} from "lucide-react";

export default function ResearcherProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form fields
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
        const updatedName = data.name || `${firstName.trim()} ${lastName.trim()}`.trim() || profile?.name;
        
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

        // Broadcast to sidebar, header, and active tabs immediately
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("natureaide:user-profile-updated", {
              detail: { name: updatedName, firstName, lastName },
            })
          );
        }

        router.refresh();
        setToastMessage("Academic profile updated successfully.");
        setTimeout(() => setToastMessage(null), 3000);
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

  if (loading) {
    return (
      <div className="w-full py-24 text-center space-y-3">
        <div className="w-8 h-8 mx-auto border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-[#78997f] font-semibold">
          Loading Researcher Academic Profile...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none space-y-6 pb-12">
      {/* 1. TOP HERO HEADER BANNER (GREEN ACCENT, FULL WIDTH) */}
      <div className="w-full rounded-3xl bg-gradient-to-r from-[#0f2c20] via-[#164533] to-[#1e5c44] text-white p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-heading font-extrabold uppercase tracking-wider border border-emerald-400/30">
                Verified Academic Profile
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-emerald-100 text-xs font-bold border border-white/10">
                Role: {profile?.role || "RESEARCHER"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-white tracking-tight">
              Researcher Credentials & Settings
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Manage your verified institutional affiliation, research discipline, and academic biography associated with your medicinal plant dossiers.
            </p>
          </div>

          <div className="shrink-0 hidden md:flex items-center gap-3">
            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 text-right">
              <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-300">Affiliated Investigator</p>
              <p className="text-sm font-heading font-extrabold text-white truncate max-w-[220px]">
                {firstName || lastName ? `${firstName} ${lastName}`.trim() : profile?.name || "Dr. Investigator"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="w-full p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2.5 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. EDIT PROFILE FORM (FULL WIDTH) */}
      <form
        onSubmit={handleSaveProfile}
        className="w-full rounded-3xl bg-white border border-[#dde6df] shadow-sm divide-y divide-[#edf2ee]"
      >
        {/* Form Header */}
        <div className="p-6 sm:p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <User className="w-5 h-5 text-[#16a34a]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-heading font-extrabold text-[#0f2c20]">
                Academic Credentials & Affiliation
              </h2>
              <p className="text-xs text-[#6b7c76]">
                Institutional registry and formal academic qualifications for peer dossiers.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#f4f7f4] text-[#475550] text-xs font-mono font-bold border border-[#dde6df]">
            User ID: #{profile?.id}
          </span>
        </div>

        {/* Section 1: Personal & Account Identity */}
        <div className="p-6 sm:p-8 space-y-4">
          <h3 className="text-xs font-heading font-extrabold text-[#1e5c44] uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Identity & Account Credentials</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0f2c20]">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="w-full p-3 rounded-xl border border-[#dde6df] bg-[#faf9f5] focus:bg-white text-xs outline-none focus:border-emerald-600 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0f2c20]">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="w-full p-3 rounded-xl border border-[#dde6df] bg-[#faf9f5] focus:bg-white text-xs outline-none focus:border-emerald-600 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0f2c20]">Primary Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={profile?.email || ""}
                  className="w-full p-3 pr-9 rounded-xl border border-[#dde6df] bg-slate-100 text-xs text-slate-500 cursor-not-allowed outline-none font-medium"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
              <span className="text-[10.5px] text-[#78997f] block">
                Managed via system authentication. Contact support to change.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0f2c20]">System Role</label>
              <div className="relative">
                <input
                  type="text"
                  disabled
                  value={profile?.role || "RESEARCHER"}
                  className="w-full p-3 pr-9 rounded-xl border border-[#dde6df] bg-slate-100 text-xs font-bold text-slate-700 cursor-not-allowed outline-none"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
              <span className="text-[10.5px] text-[#78997f] block">
                Role is server-enforced and cannot be manually modified.
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Institutional Affiliation & Department */}
        <div className="p-6 sm:p-8 space-y-4">
          <h3 className="text-xs font-heading font-extrabold text-[#1e5c44] uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>Institutional Affiliation</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0f2c20]">Institution / University</label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. University of the Philippines Manila"
                className="w-full p-3 rounded-xl border border-[#dde6df] bg-[#faf9f5] focus:bg-white text-xs outline-none focus:border-emerald-600 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0f2c20]">Department / College</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. College of Pharmacy, Department of Pharmacology"
                className="w-full p-3 rounded-xl border border-[#dde6df] bg-[#faf9f5] focus:bg-white text-xs outline-none focus:border-emerald-600 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Research Specialization & Academic Licenses */}
        <div className="p-6 sm:p-8 space-y-4">
          <h3 className="text-xs font-heading font-extrabold text-[#1e5c44] uppercase tracking-wider flex items-center gap-2">
            <Microscope className="w-4 h-4 text-emerald-600" />
            <span>Research Specialization & Licensure</span>
          </h3>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0f2c20]">Research Specialization / Field</label>
              <input
                type="text"
                value={researchField}
                onChange={(e) => setResearchField(e.target.value)}
                placeholder="e.g. Pharmacognosy, Natural Products Chemistry, Molecular Docking"
                className="w-full p-3 rounded-xl border border-[#dde6df] bg-[#faf9f5] focus:bg-white text-xs outline-none focus:border-emerald-600 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0f2c20]">
                Academic Degrees & Professional Licenses
              </label>
              <textarea
                rows={2}
                value={academicInfo}
                onChange={(e) => setAcademicInfo(e.target.value)}
                placeholder="e.g. Ph.D. in Pharmaceutical Sciences, Licensed Pharmacist (PRC #0012345)"
                className="w-full p-3 rounded-xl border border-[#dde6df] bg-[#faf9f5] focus:bg-white text-xs outline-none focus:border-emerald-600 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0f2c20]">Short Biography / Research Profile</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief summary of research experience, published monographs, and ethnobotanical projects..."
                className="w-full p-3 rounded-xl border border-[#dde6df] bg-[#faf9f5] focus:bg-white text-xs outline-none focus:border-emerald-600 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Form Action Footer */}
        <div className="p-6 sm:p-8 bg-[#fafcf9] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#6b7c76] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Profile details are visible to reviewers on submitted dossiers.</span>
          </p>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-heading font-extrabold shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            <span>{saving ? "Saving Changes..." : "Save Academic Profile"}</span>
          </button>
        </div>
      </form>

      {/* 3. PLATFORM SIGNATURE FOOTER */}
      <div className="pt-4 text-center text-xs text-[#78997f]">
        NaturAide — Where Nature Meets Scientific Evidence
      </div>
    </div>
  );
}
