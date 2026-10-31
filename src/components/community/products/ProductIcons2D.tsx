"use client";

import React from "react";

interface IconProps {
  className?: string;
}

/** 2D Illustrated All Products Box Icon */
export function AllProducts2DIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3 8L12 3L21 8V17L12 22L3 17V8Z"
        fill="#e6fffa"
        stroke="#0d9488"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M12 3V22M3 8L12 13L21 8" stroke="#0f766e" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="12" cy="8" r="1.5" fill="#14b8a6" />
    </svg>
  );
}

/** 2D Illustrated Tea & Infusion Cup Icon */
export function TeaInfusion2DIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 9H18V14C18 17.5 15.5 19 11 19C6.5 19 4 17.5 4 14V9Z"
        fill="#fef3c7"
        stroke="#d97706"
        strokeWidth="1.4"
      />
      <path d="M18 10.5C19.5 10.5 21 11.5 21 13C21 14.5 19.5 15.5 18 15.5" stroke="#d97706" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8.5 6C8.5 4.5 9.5 4 9.5 3" stroke="#16a34a" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M13.5 6C13.5 4.5 12.5 4 12.5 3" stroke="#059669" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M3 20H19" stroke="#b45309" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** 2D Illustrated Capsule & Tablet Icon */
export function Capsule2DIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect
        x="5.5"
        y="11.5"
        width="13"
        height="7.5"
        rx="3.75"
        transform="rotate(-40 5.5 11.5)"
        fill="#e0f2fe"
        stroke="#0284c7"
        strokeWidth="1.4"
      />
      <path
        d="M9.5 6.8L14.2 12.4"
        stroke="#0369a1"
        strokeWidth="1.3"
      />
      <circle cx="15.5" cy="8.5" r="1.5" fill="#38bdf8" />
    </svg>
  );
}

/** 2D Illustrated Syrup & Liquid Bottle Icon */
export function SyrupLiquid2DIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="9" y="3" width="6" height="3" rx="1" fill="#fed7aa" stroke="#ea580c" strokeWidth="1.2" />
      <path
        d="M7 8C7 7 8 6 9 6H15C16 6 17 7 17 8V19C17 20 16 21 15 21H9C8 21 7 20 7 19V8Z"
        fill="#ffedd5"
        stroke="#ea580c"
        strokeWidth="1.4"
      />
      <rect x="9.5" y="11" width="5" height="5" rx="1" fill="#fdba74" />
      <path d="M12 12.5V14.5M11 13.5H13" stroke="#9a3412" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

/** 2D Illustrated Balms & Ointments Icon */
export function TopicalBalm2DIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <ellipse cx="12" cy="8" rx="8" ry="3.5" fill="#f5d0fe" stroke="#c026d3" strokeWidth="1.3" />
      <path
        d="M4 8V15C4 17.5 7.5 19.5 12 19.5C16.5 19.5 20 17.5 20 15V8"
        fill="#fae8ff"
        stroke="#c026d3"
        strokeWidth="1.3"
      />
      <ellipse cx="12" cy="8" rx="3.5" ry="1.5" fill="#e879f9" />
    </svg>
  );
}

/** 2D Illustrated FDA Registered Shield Icon */
export function RegisteredShield2DIcon({ className = "w-3.5 h-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M10 2L16 4.5V9.5C16 13.8 13.4 17.2 10 18.5C6.6 17.2 4 13.8 4 9.5V4.5L10 2Z"
        fill="#10b981"
      />
      <path
        d="M7 10L9 12L13.5 7.5"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

