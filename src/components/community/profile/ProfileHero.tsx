"use client";

import React from "react";
import Image from "next/image";
import {
  WaveHand2DIcon,
  LeafShield2DIcon,
  Sparkle2DIcon,
} from "./ProfileIcons2D";

interface ProfileHeroProps {
  displayName: string;
  firstName?: string;
  email?: string;
  role?: string;
  createdAt?: string | Date;
}

export default function ProfileHero({
  displayName,
  firstName,
  email,
  role = "Community Member",
  createdAt,
}: ProfileHeroProps) {
  const initial = (firstName || displayName || "N").charAt(0).toUpperCase();

  // Format member date if available
  const memberSinceText = React.useMemo(() => {
    if (!createdAt) return null;
    try {
      const d = new Date(createdAt);
      if (isNaN(d.getTime())) return null;
      return `Member since ${d.getFullYear()}`;
    } catch {
      return null;
    }
  }, [createdAt]);

  const greetingName = firstName || displayName.split(" ")[0] || "Friend";

  return (
    <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#f2f8f4] via-[#faf8f2] to-[#edf6f0] border border-[#dcebe0] p-3.5 sm:p-5 shadow-xs">
      {/* Soft botanical ambiance glow */}
      <div
        className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-emerald-200/30 blur-2xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-amber-100/40 blur-2xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-5">
        {/* Left Side: Context, Greeting & User Identity */}
        <div className="flex-1 space-y-2.5 min-w-0">
          {/* Header Row: Label & Mobile Welcome Bubble */}
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/90 border border-emerald-200/80 shadow-2xs backdrop-blur-xs text-[#1e5c44]">
              <LeafShield2DIcon size={14} />
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#1e5c44]">
                My NaturAide
              </span>
            </div>

            {/* Mobile-only compact speech bubble */}
            <div className="md:hidden flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/90 border border-emerald-200/80 text-[10px] font-bold text-[#1e5c44] shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Welcome to your herbal space!</span>
            </div>
          </div>

          {/* Main Greeting & Minimal Subtitle */}
          <div className="space-y-0.5">
            <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-[#0f2c20] tracking-tight flex items-center gap-2">
              <span>Hi, {greetingName}!</span>
              <WaveHand2DIcon size={22} className="inline-block shrink-0 animate-bounce" />
            </h1>
            <p className="text-xs sm:text-[13px] text-[#486b5e] font-medium leading-snug">
              Manage your profile, preferences, and personal herbal experience.
            </p>
          </div>

          {/* Compact User Identity Bar */}
          <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/90 border border-[#ddeae1] shadow-2xs backdrop-blur-xs">
            {/* Initials Avatar */}
            <div className="relative shrink-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-[#1e5c44] flex items-center justify-center text-white font-heading font-extrabold text-base sm:text-lg shadow-2xs border border-white">
                {initial}
              </div>
              <div
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-2xs"
                title="Active Account"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              </div>
            </div>

            {/* User Meta */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-heading font-bold text-sm sm:text-base text-[#0f2c20] truncate">
                  {displayName}
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-[10px] sm:text-[11px] font-bold text-emerald-800">
                  <Sparkle2DIcon size={11} />
                  <span>{role === "admin" ? "Administrator" : "Community Member"}</span>
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs text-[#52796f] mt-0.5">
                {email && (
                  <span className="font-medium truncate max-w-[200px] sm:max-w-none">
                    {email}
                  </span>
                )}
                {email && memberSinceText && (
                  <span className="text-[#a4c0b4] hidden sm:inline">•</span>
                )}
                {memberSinceText && (
                  <span className="text-[11px] text-[#608072] font-semibold whitespace-nowrap">
                    🌿 {memberSinceText}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Compact Mascot & Desktop Speech Bubble */}
        <div className="shrink-0 flex flex-col items-center justify-center relative md:self-center">
          {/* Desktop Speech Bubble */}
          <div className="hidden md:flex relative mb-1.5 px-3 py-1 rounded-full bg-white/95 border border-emerald-200/90 shadow-2xs backdrop-blur-xs text-[11px] font-bold text-[#1e5c44] items-center gap-1.5 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Welcome to your herbal space!</span>
            {/* Bubble pointer */}
            <div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-b border-r border-emerald-200/90 rotate-45"
              aria-hidden="true"
            />
          </div>

          {/* Mascot Image with True Transparency */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 flex items-center justify-center">
            {/* Soft backdrop radial glow */}
            <div
              className="absolute inset-2 rounded-full bg-emerald-100/30 blur-lg pointer-events-none"
              aria-hidden="true"
            />
            <Image
              src="/images/mascot-profile.png"
              alt="NaturAide Profile Mascot"
              width={160}
              height={160}
              unoptimized
              priority
              className="relative z-10 w-auto h-full max-h-28 sm:max-h-32 md:max-h-36 object-contain filter drop-shadow-[0_4px_10px_rgba(20,80,50,0.12)] select-none hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
