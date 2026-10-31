"use client";

import React, { useState } from "react";
import {
  UserCard2DIcon,
  EditPencil2DIcon,
} from "./ProfileIcons2D";
import { CheckCircle2, AlertCircle, Loader2, Lock, X } from "lucide-react";

interface PersonalInfoProps {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  onUpdate: (data: { firstName: string; lastName: string; phone: string }) => Promise<void>;
  feedback: { type: "success" | "error"; text: string } | null;
  saving: boolean;
}

export default function PersonalInformationCard({
  firstName,
  lastName,
  phone,
  email,
  onUpdate,
  feedback,
  saving,
}: PersonalInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formFirstName, setFormFirstName] = useState(firstName);
  const [formLastName, setFormLastName] = useState(lastName);
  const [formPhone, setFormPhone] = useState(phone);

  const handleStartEdit = () => {
    setFormFirstName(firstName);
    setFormLastName(lastName);
    setFormPhone(phone);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormFirstName(firstName);
    setFormLastName(lastName);
    setFormPhone(phone);
    setIsEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdate({
      firstName: formFirstName,
      lastName: formLastName,
      phone: formPhone,
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-3xl border border-[#dde6df] shadow-2xs overflow-hidden transition-all duration-200">
      {/* Header */}
      <div className="p-5 sm:p-6 flex items-center justify-between border-b border-[#f0f4f1] bg-gradient-to-r from-emerald-50/50 via-white to-transparent">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800 shadow-2xs">
            <UserCard2DIcon size={22} />
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#0f2c20]">
              Personal Information
            </h3>
            <p className="text-xs text-[#52796f]">
              Your contact details and community profile identity
            </p>
          </div>
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={handleStartEdit}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors cursor-pointer"
          >
            <EditPencil2DIcon size={14} />
            <span>Edit</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#f4f7f5] hover:bg-[#eaeaea] text-[#52796f] text-xs font-bold transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-5 sm:p-6">
        {feedback && (
          <div
            className={`mb-4 p-3.5 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 ${
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

        {!isEditing ? (
          /* View Mode */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-2xl bg-[#faf9f5] border border-[#f0f4f1]">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#719184] mb-0.5">
                First Name
              </span>
              <p className="font-heading font-extrabold text-sm sm:text-base text-[#0f2c20]">
                {firstName || <span className="text-[#a0b5a8] font-normal italic">Not provided</span>}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#faf9f5] border border-[#f0f4f1]">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#719184] mb-0.5">
                Last Name
              </span>
              <p className="font-heading font-extrabold text-sm sm:text-base text-[#0f2c20]">
                {lastName || <span className="text-[#a0b5a8] font-normal italic">Not provided</span>}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#faf9f5] border border-[#f0f4f1]">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#719184]">
                  Email Address
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#8b9e95]">
                  <Lock className="w-3 h-3" />
                  Primary
                </span>
              </div>
              <p className="font-medium text-sm text-[#0f2c20] truncate">
                {email || "—"}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#faf9f5] border border-[#f0f4f1]">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#719184] mb-0.5">
                Phone Number
              </span>
              <p className="font-medium text-sm text-[#0f2c20]">
                {phone || <span className="text-[#a0b5a8] font-normal italic">No phone attached</span>}
              </p>
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#0f2c20] mb-1.5">
                  First Name <span className="text-emerald-700">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formFirstName}
                  onChange={(e) => setFormFirstName(e.target.value)}
                  placeholder="e.g. Maria"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#cde0d4] bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-400 font-medium text-[#0f2c20]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0f2c20] mb-1.5">
                  Last Name <span className="text-emerald-700">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formLastName}
                  onChange={(e) => setFormLastName(e.target.value)}
                  placeholder="e.g. Santos"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#cde0d4] bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-400 font-medium text-[#0f2c20]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0f2c20] mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="e.g. 0917-123-4567"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#cde0d4] bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-400 font-medium text-[#0f2c20]"
              />
              <p className="text-[11px] text-[#719184] mt-1">
                Used for account verification and security updates.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 px-4 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-sm font-extrabold flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98 transition-all"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Save Changes</span>
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="py-3 px-5 rounded-xl bg-[#f0f4f1] hover:bg-[#e4ece6] text-[#2c4e3f] text-sm font-bold cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
