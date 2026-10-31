"use client";

import React from "react";

interface IconProps {
  className?: string;
}

/** 2D Illustrated Library Book / Shelf Badge Icon */
export function Library2DIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.2" />
      <path
        d="M7 6.5C7 6.5 9 5.5 12 7C15 5.5 17 6.5 17 6.5V17C17 17 15 16 12 17.5C9 16 7 17 7 17V6.5Z"
        fill="#ffffff"
        stroke="#d97706"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M12 7V17.5" stroke="#b45309" strokeWidth="1.2" />
      {/* Tiny leaf bookmark ribbon */}
      <path d="M12 7L13.5 10L12 12" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/** 2D Illustrated Warm Gold Bookmark Icon */
export function BookmarkGold2DIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M6 4C6 2.9 6.9 2 8 2H16C17.1 2 18 2.9 18 4V21L12 17.5L6 21V4Z"
        fill="#fbbf24"
        stroke="#d97706"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="8" r="2" fill="#ffffff" />
    </svg>
  );
}

/** 2D Illustrated Saved Plant Icon */
export function SavedPlant2DIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.2" />
      <path
        d="M12 6C12 6 8.5 9 8.5 12C8.5 14 10 15.5 12 15.5C14 15.5 15.5 14 15.5 12C15.5 9 12 6 12 6Z"
        fill="#34d399"
      />
      <path d="M12 12V18" stroke="#059669" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M12 15C13.5 14 15 14.5 15.5 14" stroke="#059669" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/** 2D Illustrated Saved Product Icon */
export function SavedProduct2DIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" fill="#f0fdfa" stroke="#0d9488" strokeWidth="1.2" />
      <path
        d="M6 9L12 6L18 9V15L12 18L6 15V9Z"
        fill="#99f6e4"
        stroke="#0f766e"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M12 6V18M6 9L12 12L18 9" stroke="#0f766e" strokeWidth="1.2" />
    </svg>
  );
}

/** 2D Illustrated Saved Guide Recipe Icon */
export function SavedGuide2DIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" fill="#fffbeb" stroke="#f59e0b" strokeWidth="1.2" />
      <path
        d="M6 10H18V13.5C18 16.5 15.5 18 12 18C8.5 18 6 16.5 6 13.5V10Z"
        fill="#fef08a"
        stroke="#d97706"
        strokeWidth="1.3"
      />
      <path d="M18 11.5C19.2 11.5 20 12.5 20 13.5C20 14.5 19.2 15.5 18 15.5" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M10 7C10 5.5 11 5 11 4" stroke="#16a34a" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M14 7C14 5.5 13 5 13 4" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/** 2D Illustrated Recent History Clock Icon */
export function SavedRecent2DIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" fill="#f8fafc" stroke="#64748b" strokeWidth="1.2" />
      <circle cx="12" cy="12" r="8" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.1" />
      <path d="M12 7.5V12L15 14" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

