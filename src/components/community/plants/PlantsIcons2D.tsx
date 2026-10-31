"use client";

import React from "react";

interface IconProps {
  className?: string;
}

/** 2D Botanical Directory Badge Icon */
export function DirectoryTrustIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <defs>
        <linearGradient id="trustDirGrad" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.2" />
      <path
        d="M12 5C12 5 7 9.5 7 13.5C7 16.5 9.2 19 12 19C14.8 19 17 16.5 17 13.5C17 9.5 12 5 12 5Z"
        fill="url(#trustDirGrad)"
      />
      <path d="M12 9V17M10 13L12 11L14 13" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 2D Illustrated Search Icon */
export function Search2DIcon({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="11" cy="11" r="7" fill="#ecfdf5" stroke="#059669" strokeWidth="1.8" />
      <path d="M16.5 16.5L21 21" stroke="#047857" strokeWidth="2.2" strokeLinecap="round" />
      {/* Little leaf shine inside glass */}
      <circle cx="9" cy="9" r="1.5" fill="#34d399" />
    </svg>
  );
}

/** Filter Category: All Plants */
export function AllPlants2DIcon({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className}>
      <circle cx="14" cy="14" r="13" fill="#ecfdf5" />
      <path
        d="M14 6C14 6 10 9 10 12C10 14.5 12 16 14 16C16 16 18 14.5 18 12C18 9 14 6 14 6Z"
        fill="#10b981"
      />
      <path
        d="M9 13C9 13 6 16 6 18.5C6 20.5 7.5 22 9.5 22C11.5 22 13 20.5 13 18.5C13 16 9 13 9 13Z"
        fill="#34d399"
      />
      <path
        d="M19 13C19 13 22 16 22 18.5C22 20.5 20.5 22 18.5 22C16.5 22 15 20.5 15 18.5C15 16 19 13 19 13Z"
        fill="#059669"
      />
    </svg>
  );
}

/** Filter Category: Cough & Respiratory */
export function Respiratory2DIcon({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className}>
      <circle cx="14" cy="14" r="13" fill="#ecfdf5" />
      <path
        d="M14 8V17M14 12C11.5 10.5 8 11.5 7.5 14.5C7 17.5 9.5 20 12.5 20C13.5 20 14 19 14 18"
        stroke="#059669"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M14 12C16.5 10.5 20 11.5 20.5 14.5C21 17.5 18.5 20 15.5 20C14.5 20 14 19 14 18"
        stroke="#10b981"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="14" cy="7" r="1.5" fill="#34d399" />
    </svg>
  );
}

/** Filter Category: Skin Concerns */
export function Skin2DIcon({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className}>
      <circle cx="14" cy="14" r="13" fill="#fdf4ff" />
      <path
        d="M14 7C14 7 8 14 8 17.5C8 20.8 10.7 23 14 23C17.3 23 20 20.8 20 17.5C20 14 14 7 14 7Z"
        fill="#f0abfc"
        stroke="#c026d3"
        strokeWidth="1.4"
      />
      <path d="M14 13C12.5 14.5 12 17 14 19.5C15.5 17.5 16 15.5 14 13Z" fill="#ffffff" />
    </svg>
  );
}

/** Filter Category: Digestive Health */
export function Digestion2DIcon({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className}>
      <circle cx="14" cy="14" r="13" fill="#fffbeb" />
      <path
        d="M8 12H20V16.5C20 19.5 17.5 21.5 14 21.5C10.5 21.5 8 19.5 8 16.5V12Z"
        fill="#fef08a"
        stroke="#d97706"
        strokeWidth="1.4"
      />
      <path d="M20 13.5C21.2 13.5 22 14.5 22 15.5C22 16.5 21.2 17.5 20 17.5" stroke="#d97706" strokeWidth="1.3" />
      <path d="M11.5 9.5C11.5 8 12.5 7.5 12.5 6.5" stroke="#16a34a" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M16.5 9.5C16.5 8 15.5 7.5 15.5 6.5" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M6.5 22.5H21.5" stroke="#b45309" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

/** Filter Category: Urinary & Kidney Health */
export function Urinary2DIcon({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className}>
      <circle cx="14" cy="14" r="13" fill="#f0f9ff" />
      <path
        d="M14 6C14 6 8 13.5 8 17C8 20.3 10.7 23 14 23C17.3 23 20 20.3 20 17C20 13.5 14 6 14 6Z"
        fill="#bae6fd"
        stroke="#0284c7"
        strokeWidth="1.4"
      />
      {/* Sambong leaf inside droplet */}
      <path
        d="M14 11C15.5 13 17 15.5 16 18C14.5 19 12.5 17 12 15C12.5 13 13.5 11.5 14 11Z"
        fill="#34d399"
        stroke="#059669"
        strokeWidth="0.8"
      />
    </svg>
  );
}

/** Filter Category: Blood Sugar */
export function BloodSugar2DIcon({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className}>
      <circle cx="14" cy="14" r="13" fill="#f0fdf4" />
      {/* Ampalaya leaf / balance marker */}
      <path
        d="M14 7L19 11C19 16 16.5 20 14 22C11.5 20 9 16 9 11L14 7Z"
        fill="#86efac"
        stroke="#16a34a"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="14" cy="14" r="2.2" fill="#15803d" />
      <path d="M14 9V19M11 14H17" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

/** Filter Category: Pain & Comfort */
export function PainComfort2DIcon({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className}>
      <circle cx="14" cy="14" r="13" fill="#f5f3ff" />
      <circle cx="14" cy="14" r="6" fill="#ddd6fe" stroke="#7c3aed" strokeWidth="1.3" />
      <path d="M14 6V9M14 19V22M6 14H9M19 14H22" stroke="#a78bfa" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="14" cy="14" r="2" fill="#22c55e" />
    </svg>
  );
}

/** Filter Category: Joint & Uric Acid */
export function JointUric2DIcon({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className}>
      <circle cx="14" cy="14" r="13" fill="#ecfdf5" />
      {/* Heart-shaped leaf (Ulasimang Bato / Pansit-pansitan) */}
      <path
        d="M14 19.5C14 19.5 8 15 8 11.5C8 9.5 9.5 8 11.5 8C12.8 8 13.6 8.8 14 9.5C14.4 8.8 15.2 8 16.5 8C18.5 8 20 9.5 20 11.5C20 15 14 19.5 14 19.5Z"
        fill="#a7f3d0"
        stroke="#059669"
        strokeWidth="1.4"
      />
      <circle cx="14" cy="13.5" r="1.5" fill="#047857" />
    </svg>
  );
}

/** 2D Illustrated Verified Seal Badge Icon */
export function VerifiedSealBadge2DIcon({ className = "w-3.5 h-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="9" fill="#10b981" />
      <path
        d="M6 10L8.5 12.5L14 7"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 2D Illustrated Traditional Preparation Teapot Icon */
export function PrepTeapot2DIcon({ className = "w-3.5 h-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M4 8.5C4 7 5.5 6 7 6H13C14.5 6 16 7 16 8.5V12C16 14.5 13.8 16 10 16C6.2 16 4 14.5 4 12V8.5Z"
        fill="#fed7aa"
        stroke="#ea580c"
        strokeWidth="1.2"
      />
      <path d="M16 9.5C17.5 9.5 18.5 10.5 18.5 11.5C18.5 12.5 17.5 13.5 16 13.5" stroke="#ea580c" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M4 10.5L2 9.5" stroke="#ea580c" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M7 4C7 4 8.5 3 10 3C11.5 3 13 4 13 4" stroke="#16a34a" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/** 2D Illustrated Scientific Reference Icon */
export function SciRefScroll2DIcon({ className = "w-3.5 h-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="9" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1" />
      <path
        d="M6.5 6H13.5C14.3 6 15 6.7 15 7.5V13.5C15 14.3 14.3 15 13.5 15H6.5C5.7 15 5 14.3 5 13.5V7.5C5 6.7 5.7 6 6.5 6Z"
        fill="#ffffff"
        stroke="#0369a1"
        strokeWidth="1.1"
      />
      <path d="M7.5 9H12.5M7.5 12H11" stroke="#0284c7" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

/** 2D Animated Link Arrow Icon */
export function CardArrow2DIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="9" fill="#ecfdf5" />
      <path
        d="M8 6.5L12.5 10L8 13.5"
        stroke="#059669"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

