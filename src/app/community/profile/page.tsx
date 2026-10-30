"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import MobileAppHeader from "@/components/community/MobileAppHeader";
import LogoutButton from "@/components/LogoutButton";
import {
  User,
  Mail,
  ShieldCheck,
  Lock,
  Globe,
  Heart,
  Save,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Phone,
  BookmarkCheck,
  ChevronRight,
  ShieldAlert,
  Info,
  FileText,
  LogOut,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getScreeningSeverity, getSeverityMeta } from "@/lib/safety-rules";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  // Active expanded panel
  const [activePanel, setActivePanel] = useState<string | null>(null);

  // Profile Edit State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("English");
  const [healthInterests, setHealthInterests] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [screening, setScreening] = useState<any>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [profileRes, screeningRes] = await Promise.all([
          fetch("/api/community/profile"),
          fetch("/api/community/screening"),
        ]);
        const data = await profileRes.json();
        const screeningData = await screeningRes.json();

        if (data.success && data.profile) {
          const p = data.profile;
          setProfile(p);
          setFirstName(p.firstName || "");
          setLastName(p.lastName || "");
          setPhone(p.phone || "");
          setPreferredLanguage(p.preferredLanguage || "English");
          setHealthInterests(p.healthInterests || "");
        }
        if (screeningData.success && screeningData.screening) {
          setScreening(screeningData.screening);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileFeedback(null);
    setSavingProfile(true);

    try {
      const res = await fetch("/api/community/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          preferredLanguage,
          healthInterests,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update profile");
      }
      setProfileFeedback({ type: "success", text: "Profile details updated successfully." });
      setProfile((prev: any) => ({
        ...prev,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim() || prev.name,
      }));
    } catch (err: any) {
      setProfileFeedback({ type: "error", text: err.message || "Failed to save profile." });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: "error", text: "New password and confirmation do not match." });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordFeedback({ type: "error", text: "New password must be at least 6 characters." });
      return;
    }

    setChangingPassword(true);

    try {
      const res = await fetch("/api/community/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to change password");
      }
      setPasswordFeedback({ type: "success", text: "Password changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordFeedback({ type: "error", text: err.message || "Failed to change password." });
    } finally {
      setChangingPassword(false);
    }
  };

  const togglePanel = (panelName: string) => {
    setActivePanel((prev) => (prev === panelName ? null : panelName));
  };

  const displayName = profile?.name || `${firstName} ${lastName}`.trim() || "Community Member";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col min-h-screen">
      {/* App Header */}
      <MobileAppHeader
        showBack={true}
        backHref="/community"
        title="My Profile"
        subtitle="Manage your personal preferences"
      />

      <div className="flex-1 px-4 sm:px-6 py-5 space-y-6">
        {/* User Card */}
        <div className="p-6 rounded-3xl bg-white border border-[#dde6df] text-center space-y-3 shadow-2xs">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-teal-50 border-2 border-emerald-300 flex items-center justify-center text-[#1e5c44] font-heading font-extrabold text-3xl mx-auto shadow-xs">
            {initial}
          </div>

          <div className="space-y-1">
            <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#0f2c20]">
              {displayName}
            </h2>
            <p className="text-xs sm:text-sm text-[#52796f] font-medium">
              {profile?.email}
            </p>
          </div>

          <div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Community Member</span>
            </span>
          </div>
        </div>

        {/* Group 1: Personal & Saved Information */}
        <div className="space-y-2">
          <p className="text-xs sm:text-sm font-bold text-[#52796f] uppercase tracking-wider px-2">
            Account & Activity
          </p>

          <div className="bg-white rounded-3xl border border-[#dde6df] overflow-hidden shadow-2xs divide-y divide-[#f0f4f1]">
            {/* 1. Personal Information Row */}
            <div>
              <button
                type="button"
                onClick={() => togglePanel("personal")}
                className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-[#faf9f5] active:bg-[#edf2ee] transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-800">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#0f2c20]">
                      Personal Information
                    </h3>
                    <p className="text-xs text-[#52796f]">Name, phone, and contact details</p>
                  </div>
                </div>
                {activePanel === "personal" ? (
                  <ChevronUp className="w-5 h-5 text-[#78997f]" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-[#78997f]" />
                )}
              </button>

              {activePanel === "personal" && (
                <div className="p-5 bg-[#faf9f5] border-t border-[#f0f4f1] space-y-4">
                  {profileFeedback && (
                    <div
                      className={`p-3 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 ${
                        profileFeedback.type === "success"
                          ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                          : "bg-rose-50 text-rose-900 border border-rose-200"
                      }`}
                    >
                      {profileFeedback.type === "success" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                      )}
                      <span>{profileFeedback.text}</span>
                    </div>
                  )}

                  <form onSubmit={handleUpdateProfile} className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#0f2c20] mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full px-3.5 py-3 rounded-xl border border-[#dde6df] bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-400 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#0f2c20] mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full px-3.5 py-3 rounded-xl border border-[#dde6df] bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-400 font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0f2c20] mb-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 0917-123-4567"
                        className="w-full px-3.5 py-3 rounded-xl border border-[#dde6df] bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-400 font-medium"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="w-full py-3.5 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-sm font-extrabold flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
                    >
                      {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                      <span>Save Personal Information</span>
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* 2. Saved Information Row */}
            <Link
              href="/community/my-guide"
              className="p-4 sm:p-5 flex items-center justify-between hover:bg-[#faf9f5] active:bg-[#edf2ee] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-800">
                  <BookmarkCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#0f2c20]">
                    Saved Information
                  </h3>
                  <p className="text-xs text-[#52796f]">View your saved plants and recipe guides</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#78997f]" />
            </Link>

            {/* Health Safety Screening Row */}
            {(() => {
              const severity = screening ? getScreeningSeverity(screening) : null;
              const meta = severity ? getSeverityMeta(severity) : null;

              return (
                <Link
                  href={
                    screening?.evaluationResult === "PROFESSIONAL_GUIDANCE_REQUIRED"
                      ? "/community/guidance"
                      : screening
                      ? "/community/screening?retake=true"
                      : "/community/screening"
                  }
                  className="p-4 sm:p-5 flex items-center justify-between hover:bg-[#faf9f5] active:bg-[#edf2ee] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                        severity === "severe"
                          ? "bg-rose-100 text-rose-700"
                          : severity === "moderate"
                          ? "bg-amber-100 text-amber-900"
                          : severity === "low"
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {severity === "severe" ? (
                        <AlertTriangle className="w-5 h-5 text-rose-600 animate-pulse" />
                      ) : severity === "moderate" ? (
                        <AlertCircle className="w-5 h-5 text-amber-700" />
                      ) : severity === "low" ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                      ) : (
                        <ShieldCheck className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#0f2c20]">
                        Health Safety Screening
                      </h3>
                      <p className="text-xs text-[#52796f]">
                        {meta ? `Status: ${meta.title}` : "Initial screening not yet completed"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                        severity === "severe"
                          ? "bg-rose-100 text-rose-900 border-rose-300 font-extrabold"
                          : severity === "moderate"
                          ? "bg-amber-100 text-amber-900 border-amber-300"
                          : severity === "low"
                          ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {screening ? (severity === "severe" ? "High Risk" : severity === "moderate" ? "Caution" : "Low Risk") : "Take"}
                    </span>
                    <ChevronRight className="w-5 h-5 text-[#78997f]" />
                  </div>
                </Link>
              );
            })()}

            {/* 3. Preferences Row */}
            <div>
              <button
                type="button"
                onClick={() => togglePanel("preferences")}
                className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-[#faf9f5] active:bg-[#edf2ee] transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-800">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#0f2c20]">
                      Preferences
                    </h3>
                    <p className="text-xs text-[#52796f]">Language and wellness topics of interest</p>
                  </div>
                </div>
                {activePanel === "preferences" ? (
                  <ChevronUp className="w-5 h-5 text-[#78997f]" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-[#78997f]" />
                )}
              </button>

              {activePanel === "preferences" && (
                <div className="p-5 bg-[#faf9f5] border-t border-[#f0f4f1] space-y-4">
                  <form onSubmit={handleUpdateProfile} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-[#0f2c20] mb-1">
                        Preferred Language
                      </label>
                      <select
                        value={preferredLanguage}
                        onChange={(e) => setPreferredLanguage(e.target.value)}
                        className="w-full px-3.5 py-3 rounded-xl border border-[#dde6df] bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-400 font-medium"
                      >
                        <option value="English">English</option>
                        <option value="Tagalog / Filipino">Tagalog / Filipino</option>
                        <option value="Cebuano">Cebuano</option>
                        <option value="Ilocano">Ilocano</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0f2c20] mb-1">
                        Wellness Concerns of Interest
                      </label>
                      <input
                        type="text"
                        value={healthInterests}
                        onChange={(e) => setHealthInterests(e.target.value)}
                        placeholder="e.g. Cough relief, digestion, sleep"
                        className="w-full px-3.5 py-3 rounded-xl border border-[#dde6df] bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-400 font-medium"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="w-full py-3.5 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-sm font-extrabold flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
                    >
                      {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                      <span>Save Preferences</span>
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* 4. Change Password Row */}
            <div>
              <button
                type="button"
                onClick={() => togglePanel("password")}
                className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-[#faf9f5] active:bg-[#edf2ee] transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-800">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#0f2c20]">
                      Change Password
                    </h3>
                    <p className="text-xs text-[#52796f]">Update your account security credentials</p>
                  </div>
                </div>
                {activePanel === "password" ? (
                  <ChevronUp className="w-5 h-5 text-[#78997f]" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-[#78997f]" />
                )}
              </button>

              {activePanel === "password" && (
                <div className="p-5 bg-[#faf9f5] border-t border-[#f0f4f1] space-y-4">
                  {passwordFeedback && (
                    <div
                      className={`p-3 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 ${
                        passwordFeedback.type === "success"
                          ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                          : "bg-rose-50 text-rose-900 border border-rose-200"
                      }`}
                    >
                      {passwordFeedback.type === "success" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                      )}
                      <span>{passwordFeedback.text}</span>
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-[#0f2c20] mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className="w-full px-3.5 py-3 rounded-xl border border-[#dde6df] bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0f2c20] mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="w-full px-3.5 py-3 rounded-xl border border-[#dde6df] bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0f2c20] mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full px-3.5 py-3 rounded-xl border border-[#dde6df] bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="w-full py-3.5 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-sm font-extrabold flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
                    >
                      {changingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                      <span>Update Password</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Group 2: Safety & About */}
        <div className="space-y-2">
          <p className="text-xs sm:text-sm font-bold text-[#52796f] uppercase tracking-wider px-2">
            Safety & Information
          </p>

          <div className="bg-white rounded-3xl border border-[#dde6df] overflow-hidden shadow-2xs divide-y divide-[#f0f4f1]">
            {/* Help & Safety */}
            <div>
              <button
                type="button"
                onClick={() => togglePanel("helpSafety")}
                className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-[#faf9f5] active:bg-[#edf2ee] transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-800">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#0f2c20]">
                      Help & Safety Guidelines
                    </h3>
                    <p className="text-xs text-[#52796f]">Safe use of herbal remedies & disclaimers</p>
                  </div>
                </div>
                {activePanel === "helpSafety" ? (
                  <ChevronUp className="w-5 h-5 text-[#78997f]" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-[#78997f]" />
                )}
              </button>

              {activePanel === "helpSafety" && (
                <div className="p-5 bg-amber-50/50 border-t border-amber-100 space-y-2 text-xs sm:text-sm text-amber-950">
                  <p className="font-bold">Important Community Health Notice:</p>
                  <p className="leading-relaxed">
                    NaturAide compiles educational summaries of documented traditional plants and scientific evaluations. It is not intended to diagnose, treat, cure, or prevent any illness.
                  </p>
                  <p className="leading-relaxed">
                    Always consult your physician or licensed pharmacist prior to initiating any herbal therapy, especially if you take daily prescription medications.
                  </p>
                </div>
              )}
            </div>

            {/* About NaturAide */}
            <div>
              <button
                type="button"
                onClick={() => togglePanel("aboutApp")}
                className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-[#faf9f5] active:bg-[#edf2ee] transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-800">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#0f2c20]">
                      About NaturAide
                    </h3>
                    <p className="text-xs text-[#52796f]">Version 2.0 &bull; Traditional herbal science</p>
                  </div>
                </div>
                {activePanel === "aboutApp" ? (
                  <ChevronUp className="w-5 h-5 text-[#78997f]" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-[#78997f]" />
                )}
              </button>

              {activePanel === "aboutApp" && (
                <div className="p-5 bg-[#faf9f5] border-t border-[#f0f4f1] space-y-2 text-xs sm:text-sm text-[#3d4a45]">
                  <p className="leading-relaxed">
                    NaturAide connects Philippine traditional healing heritage with rigorous phytochemical and computational research.
                  </p>
                  <p className="text-[#52796f]">
                    Platform Version: <strong>2.0 Mobile-App Edition</strong>
                  </p>
                </div>
              )}
            </div>

            {/* Privacy */}
            <div className="p-4 sm:p-5 flex items-center justify-between text-[#0f2c20]">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#0f2c20]">
                    Privacy & Terms
                  </h3>
                  <p className="text-xs text-[#52796f]">Your data is securely kept and never sold</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-800">Protected</span>
            </div>
          </div>
        </div>

        {/* Group 3: Logout */}
        <div className="pt-2">
          <LogoutButton className="w-full py-4 rounded-2xl bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 font-heading font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-2xs active:scale-95 transition-all cursor-pointer" />
        </div>
      </div>
    </div>
  );
}
