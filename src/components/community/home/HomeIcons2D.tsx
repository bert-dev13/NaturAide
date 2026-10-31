"use client";

import React from "react";

interface IconProps {
  className?: string;
}

/**
 * 2D Illustrated Leaf for "Find a Plant"
 */
export function LeafActionIcon({ className = "w-10 h-10" }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="leafGrad1" x1="8" y1="6" x2="32" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="60%" stopColor="#16a34a" />
          <stop offset="100%" stopColor="#14532d" />
        </linearGradient>
        <linearGradient id="leafGrad2" x1="16" y1="12" x2="34" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>
      {/* Soft circular pastel backdrop */}
      <circle cx="20" cy="20" r="18" fill="#ecfdf5" />
      {/* Stem */}
      <path d="M12 30C16 26 21 21 27 15" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" />
      {/* Main Leaf */}
      <path
        d="M28 8C20 8 13 14 13 22C17 25 24 24 29 19C32 16 32 10 28 8Z"
        fill="url(#leafGrad1)"
        stroke="#15803d"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Leaf Spine */}
      <path d="M15 21C18 19 23 15 26 10" stroke="#bbf7d0" strokeWidth="1.2" strokeLinecap="round" />
      {/* Dewdrop Highlight */}
      <circle cx="23" cy="14" r="1.5" fill="#ffffff" fillOpacity="0.9" />
    </svg>
  );
}

/**
 * 2D Illustrated Medical Shield for "Check Safety"
 */
export function ShieldSafetyActionIcon({ className = "w-10 h-10" }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="shieldGrad" x1="12" y1="6" x2="28" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      {/* Soft circular pastel backdrop */}
      <circle cx="20" cy="20" r="18" fill="#fffbeb" />
      {/* Shield Body */}
      <path
        d="M20 7L29 10.5V19.5C29 25.5 25 30.5 20 33C15 30.5 11 25.5 11 19.5V10.5L20 7Z"
        fill="url(#shieldGrad)"
        stroke="#b45309"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* White Botanical Medical Cross */}
      <path
        d="M20 13V25M14 19H26"
        stroke="#ffffff"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      {/* Tiny sprout leaf accent */}
      <path
        d="M23 14C24.5 12.5 26.5 13 26 14.5C25.5 15.5 24 15 23 14Z"
        fill="#86efac"
      />
    </svg>
  );
}

/**
 * 2D Illustrated AI Sparkle Mascot Chat for "Ask NaturAide"
 */
export function AskAiActionIcon({ className = "w-10 h-10" }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="bubbleGrad" x1="8" y1="8" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="sproutGradAi" x1="16" y1="4" x2="24" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      {/* Soft circular pastel backdrop */}
      <circle cx="20" cy="20" r="18" fill="#f5f3ff" />
      {/* Sprout atop bubble */}
      <path
        d="M20 12C18 8 15 8.5 15.5 10C16.5 11.5 19 12 20 12Z"
        fill="url(#sproutGradAi)"
        stroke="#047857"
        strokeWidth="0.8"
      />
      <path
        d="M20 12C22 7.5 25.5 8 25 10C24 11.5 21 12 20 12Z"
        fill="url(#sproutGradAi)"
        stroke="#047857"
        strokeWidth="0.8"
      />
      {/* Chat Bubble */}
      <rect
        x="10"
        y="12"
        width="20"
        height="16"
        rx="8"
        fill="url(#bubbleGrad)"
        stroke="#4338ca"
        strokeWidth="1.2"
      />
      {/* Chat Tail */}
      <path d="M14 26L11 31L18 28" fill="#6366f1" />
      {/* Mascot Friendly Face Inside Bubble */}
      <circle cx="16" cy="19.5" r="1.3" fill="#ffffff" />
      <circle cx="24" cy="19.5" r="1.3" fill="#ffffff" />
      <path d="M18 22C19 23 21 23 22 22" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
      {/* Sparkle Star */}
      <path
        d="M30 8L31 11L34 12L31 13L30 16L29 13L26 12L29 11L30 8Z"
        fill="#fde047"
      />
    </svg>
  );
}

/* ========================================================================= */
/* HEALTH CONCERN 2D ICONS (What do you need help with?)                      */
/* ========================================================================= */

/** 1. Cough & Colds (Respiratory botanical icon) */
export function CoughColdsIcon({ className = "w-7 h-7" }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="16" cy="16" r="15" fill="#ecfdf5" />
      {/* Soothing botanical lungs / leaves */}
      <path
        d="M16 11V18M16 14C13.5 12.5 10 13 9.5 16.5C9 19.5 11.5 22.5 14.5 22.5C15.5 22.5 16 21.5 16 20.5"
        stroke="#059669"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M16 14C18.5 12.5 22 13 22.5 16.5C23 19.5 20.5 22.5 17.5 22.5C16.5 22.5 16 21.5 16 20.5"
        stroke="#10b981"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Little fresh leaf sprout */}
      <path d="M16 8C17 9.5 18.5 10 19 9.5C19.5 9 19 7.5 17.5 7C16.5 7 16 7.5 16 8Z" fill="#34d399" />
    </svg>
  );
}

/** 2. Skin Concerns (Gentle botanical balm/droplet) */
export function SkinConcernsIcon({ className = "w-7 h-7" }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="16" cy="16" r="15" fill="#fdf4ff" />
      {/* Soothing droplet */}
      <path
        d="M16 8C16 8 10 16 10 19.5C10 22.8 12.7 25.5 16 25.5C19.3 25.5 22 22.8 22 19.5C22 16 16 8 16 8Z"
        fill="#f0abfc"
        stroke="#c026d3"
        strokeWidth="1.5"
      />
      {/* Herbal Leaf Inside Droplet */}
      <path
        d="M16 15C14.5 16.5 14 19 16 21.5C17.5 19.5 18 17.5 16 15Z"
        fill="#ffffff"
        stroke="#a21caf"
        strokeWidth="0.8"
      />
    </svg>
  );
}

/** 3. Digestive Health (Steaming botanical herbal tea) */
export function DigestiveIcon({ className = "w-7 h-7" }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="16" cy="16" r="15" fill="#fffbeb" />
      {/* Tea cup */}
      <path
        d="M9 14H23V19C23 22 20.5 24 16 24C11.5 24 9 22 9 19V14Z"
        fill="#fef08a"
        stroke="#d97706"
        strokeWidth="1.6"
      />
      {/* Handle */}
      <path d="M23 15.5C24.5 15.5 25.5 16.5 25.5 18C25.5 19.5 24.5 20.5 23 20.5" stroke="#d97706" strokeWidth="1.5" />
      {/* Herbal steam curls */}
      <path d="M13 11C13 9.5 14.5 9 14.5 7.5" stroke="#16a34a" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M19 11C19 9.5 17.5 9 17.5 7.5" stroke="#10b981" strokeWidth="1.4" strokeLinecap="round" />
      {/* Tea saucer */}
      <path d="M7 25H25" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** 4. Urinary & Kidney Health (Pure water droplet with sambong leaf) */
export function UrinaryHealthIcon({ className = "w-7 h-7" }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="16" cy="16" r="15" fill="#f0f9ff" />
      {/* Crystal clear water droplet */}
      <path
        d="M16 7C16 7 9.5 15.5 9.5 19.5C9.5 23 12.4 26 16 26C19.6 26 22.5 23 22.5 19.5C22.5 15.5 16 7 16 7Z"
        fill="#bae6fd"
        stroke="#0284c7"
        strokeWidth="1.5"
      />
      {/* Herbal medicinal leaf accent */}
      <path
        d="M16 13C17.5 15 19 17.5 18 20C16.5 21 14.5 19 14 17C14.5 15 15.5 13.5 16 13Z"
        fill="#34d399"
        stroke="#059669"
        strokeWidth="0.8"
      />
      <circle cx="13" cy="18" r="1" fill="#ffffff" />
    </svg>
  );
}

/** 5. Immune Support (Botanical wellness shield) */
export function ImmuneIcon({ className = "w-7 h-7" }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="16" cy="16" r="15" fill="#fefce8" />
      {/* Shield */}
      <path
        d="M16 7L23 10V16C23 21 20 24.5 16 26C12 24.5 9 21 9 16V10L16 7Z"
        fill="#fef08a"
        stroke="#ca8a04"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Sprout in center */}
      <path
        d="M16 19V13M16 15C14.5 13.5 12.5 14 13 15.5C13.5 16.5 15 16.5 16 16M16 14C17.5 12.5 19.5 13 19 14.5C18.5 15.5 17 15.5 16 15"
        stroke="#15803d"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** 6. Heart Health (Vibrant heart with sprout) */
export function HeartHealthIcon({ className = "w-7 h-7" }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="16" cy="16" r="15" fill="#fff1f2" />
      {/* Warm Heart */}
      <path
        d="M16 24C16 24 9 19.5 9 14C9 11 11.2 9 13.8 9C15.2 9 16.4 9.8 17 11C17.6 9.8 18.8 9 20.2 9C22.8 9 25 11 25 14C25 19.5 18 24 16 24Z"
        fill="#fecdd3"
        stroke="#e11d48"
        strokeWidth="1.5"
      />
      {/* Sprouting leaf on top */}
      <path
        d="M17 11C18 7.5 21 7 21.5 8.5C22 10 19.5 11 17 11Z"
        fill="#4ade80"
        stroke="#16a34a"
        strokeWidth="0.8"
      />
    </svg>
  );
}

/** 7. Joint & Muscle (Soothing motion & herbal relief) */
export function JointMuscleIcon({ className = "w-7 h-7" }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="16" cy="16" r="15" fill="#f5f3ff" />
      {/* Soothing circular bands */}
      <circle cx="16" cy="16" r="6" fill="#ddd6fe" stroke="#7c3aed" strokeWidth="1.4" />
      <path d="M16 7V10M16 22V25M7 16H10M22 16H25" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" />
      {/* Herb Leaf on Joint */}
      <path
        d="M16 13C14.5 14.5 14 17 16 19C17.5 17 18 15 16 13Z"
        fill="#22c55e"
        stroke="#15803d"
        strokeWidth="0.8"
      />
    </svg>
  );
}

/** 8. All Health Topics / Directory Compass */
export function AllTopicsIcon({ className = "w-7 h-7" }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="16" cy="16" r="15" fill="#ecfdf5" />
      {/* Botanical grid / 4 leaves */}
      <rect x="9.5" y="9.5" width="5.5" height="5.5" rx="2" fill="#34d399" />
      <rect x="17" y="9.5" width="5.5" height="5.5" rx="2" fill="#10b981" />
      <rect x="9.5" y="17" width="5.5" height="5.5" rx="2" fill="#059669" />
      <rect x="17" y="17" width="5.5" height="5.5" rx="2" fill="#047857" />
      <circle cx="16" cy="16" r="2.5" fill="#ffffff" stroke="#059669" strokeWidth="1.2" />
    </svg>
  );
}

