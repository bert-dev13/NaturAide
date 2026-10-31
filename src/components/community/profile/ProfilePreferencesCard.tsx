"use client";

import React, { useState } from "react";
import { Globe2DIcon } from "./ProfileIcons2D";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface ProfilePreferencesProps {
  preferredLanguage: string;
  healthInterests: string;
  onUpdate: (data: { preferredLanguage: string; healthInterests: string }) => Promise<void>;
  saving: boolean;
}

export default function ProfilePreferencesCard({
  preferredLanguage,
  healthInterests,
  onUpdate,
  saving,
}: ProfilePreferencesProps) {
  return (
    <PreferencesForm
      key={`${preferredLanguage}-${healthInterests}`}
      initialLang={preferredLanguage || "English"}
      initialInterests={healthInterests || ""}
      onUpdate={onUpdate}
      saving={saving}
    />
  );
}

function PreferencesForm({
  initialLang,
  initialInterests,
  onUpdate,
  saving,
}: {
  initialLang: string;
  initialInterests: string;
  onUpdate: (data: { preferredLanguage: string; healthInterests: string }) => Promise<void>;
  saving: boolean;
}) {
  const [lang, setLang] = useState(initialLang);
  const [interests, setInterests] = useState(initialInterests);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      await onUpdate({
        preferredLanguage: lang,
        healthInterests: interests,
      });
      setFeedback({ type: "success", text: "Preferences saved successfully." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update preferences.";
      setFeedback({ type: "error", text: message });
    }
  };

  const sampleInterests = [
    "Cough & Cold",
    "Digestive Health",
    "Joint Comfort",
    "Sleep & Calm",
    "Skin Healing",
  ];

  const handleAddInterestTag = (tag: string) => {
    if (!interests.toLowerCase().includes(tag.toLowerCase())) {
      const updated = interests.trim() ? `${interests.trim()}, ${tag}` : tag;
      setInterests(updated);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#dde6df] shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="p-5 sm:p-6 flex items-center justify-between border-b border-[#f0f4f1] bg-gradient-to-r from-blue-50/40 via-white to-transparent">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-800 shadow-2xs">
            <Globe2DIcon size={22} />
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#0f2c20]">
              Preferences & Topics
            </h3>
            <p className="text-xs text-[#52796f]">
              Customize your language and health focus areas
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 sm:p-6 space-y-4">
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#0f2c20] mb-1.5">
              Preferred Language
            </label>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#dde6df] bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-400 font-medium text-[#0f2c20] cursor-pointer"
            >
              <option value="English">English</option>
              <option value="Tagalog / Filipino">Tagalog / Filipino</option>
              <option value="Cebuano">Cebuano</option>
              <option value="Ilocano">Ilocano</option>
            </select>
            <p className="text-[11px] text-[#719184] mt-1">
              Used for herbal guide titles and AI guidance responses.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0f2c20] mb-1.5">
              Wellness Concerns of Interest
            </label>
            <input
              type="text"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="e.g. Cough relief, digestion, sleep"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#dde6df] bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-400 font-medium text-[#0f2c20]"
            />

            {/* Quick Suggestions */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              <span className="text-[10px] font-bold text-[#8b9e95] uppercase">Quick add:</span>
              {sampleInterests.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleAddInterestTag(item)}
                  className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#f0f4f1] hover:bg-emerald-100 text-[#2c4e3f] transition-colors cursor-pointer"
                >
                  + {item}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-5 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98 transition-all"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Preferences</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
