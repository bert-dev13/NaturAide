"use client";

import React, { useState } from "react";
import { Lock2DIcon } from "./ProfileIcons2D";
import LogoutButton from "@/components/LogoutButton";
import { CheckCircle2, AlertCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface AccountSecurityProps {
  onChangePassword: (data: { currentPassword: string; newPassword: string }) => Promise<void>;
  changing: boolean;
  feedback: { type: "success" | "error"; text: string } | null;
  setFeedback: React.Dispatch<React.SetStateAction<{ type: "success" | "error"; text: string } | null>>;
}

export default function AccountSecurityCard({
  onChangePassword,
  changing,
  feedback,
  setFeedback,
}: AccountSecurityProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (newPassword !== confirmPassword) {
      setFeedback({ type: "error", text: "New password and confirmation do not match." });
      return;
    }

    if (newPassword.length < 6) {
      setFeedback({ type: "error", text: "New password must be at least 6 characters." });
      return;
    }

    try {
      await onChangePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      // Handled in parent
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#dde6df] shadow-2xs overflow-hidden">
      {/* Header / Expand Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-[#faf9f5] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-800 shadow-2xs">
            <Lock2DIcon size={22} />
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#0f2c20]">
              Account Security
            </h3>
            <p className="text-xs text-[#52796f]">
              Update password and sign in credentials
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-emerald-800 hidden sm:inline-block">
            {isOpen ? "Close" : "Change Password"}
          </span>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-[#78997f]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[#78997f]" />
          )}
        </div>
      </button>

      {/* Expanded Form */}
      {isOpen && (
        <div className="p-5 sm:p-6 border-t border-[#f0f4f1] bg-[#faf9f5]/70 space-y-4">
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                  : "bg-rose-50 text-rose-900 border border-rose-200"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-[#0f2c20] mb-1.5">
                Current Password <span className="text-emerald-700">*</span>
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#dde6df] bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-400 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#0f2c20] mb-1.5">
                  New Password <span className="text-emerald-700">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#dde6df] bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0f2c20] mb-1.5">
                  Confirm Password <span className="text-emerald-700">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#dde6df] bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-400 font-medium"
                />
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={changing}
                className="py-2.5 px-5 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98 transition-all"
              >
                {changing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sign Out Row */}
      <div className="p-4 sm:p-5 border-t border-[#f0f4f1] bg-[#faf8f5] flex items-center justify-between">
        <div>
          <span className="font-heading font-extrabold text-sm text-[#0f2c20] block">
            Session & Access
          </span>
          <span className="text-xs text-[#719184]">
            Sign out of your active account on this device
          </span>
        </div>

        <LogoutButton className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer shadow-2xs active:scale-95" />
      </div>
    </div>
  );
}

