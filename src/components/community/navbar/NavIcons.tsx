"use client";

import React from "react";
import { motion } from "framer-motion";

interface IconProps {
  isActive: boolean;
  reducedMotion?: boolean;
  className?: string;
}

/**
 * 1. Home Illustrated Icon
 * Emerald/green cozy house with a sprouting medicinal leaf that gently unfurls when active.
 */
export function HomeIllustratedIcon({
  isActive,
  reducedMotion = false,
  className = "w-7 h-7 sm:w-8 sm:h-8",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="homeRoofGrad" x1="6" y1="6" x2="26" y2="17" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="homeWallGrad" x1="8" y1="14" x2="24" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f0fdf4" />
          <stop offset="100%" stopColor="#dcfce7" />
        </linearGradient>
      </defs>

      {/* Chimney */}
      <rect x="20.5" y="7.5" width="3" height="6" rx="1" fill="#047857" />

      {/* House Body / Walls */}
      <rect
        x="7.5"
        y="14.5"
        width="17"
        height="12.5"
        rx="3"
        fill="url(#homeWallGrad)"
        stroke="#059669"
        strokeWidth="1.5"
      />

      {/* Arched Doorway */}
      <path
        d="M13 27V21.5C13 19.8431 14.3431 18.5 16 18.5C17.6569 18.5 19 19.8431 19 21.5V27"
        fill="#047857"
      />
      <circle cx="17.8" cy="23.2" r="0.6" fill="#fef08a" />

      {/* Cozy Roof */}
      <path
        d="M5.5 14L15.15 6.28C15.65 5.88 16.35 5.88 16.85 6.28L26.5 14"
        stroke="url(#homeRoofGrad)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Round Attic Window */}
      <circle cx="16" cy="11.5" r="2.2" fill="#fef08a" stroke="#d97706" strokeWidth="1" />

      {/* Sprouting Medicinal Leaf near Chimney - Animates on Active */}
      <motion.g
        style={{ transformOrigin: "23px 7px" }}
        animate={
          isActive && !reducedMotion
            ? {
                rotate: [0, -14, 10, -4, 0],
                scale: [1, 1.25, 1],
              }
            : { rotate: 0, scale: 1 }
        }
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <path
          d="M23 7.5C23 4.5 26.5 3.5 27.5 4.5C28 6.5 26 9.5 23 7.5Z"
          fill="#34d399"
          stroke="#059669"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <path
          d="M24 6.8C25.2 6.2 26.2 5.5 26.8 4.8"
          stroke="#065f46"
          strokeWidth="0.6"
          strokeLinecap="round"
        />
      </motion.g>
    </svg>
  );
}

/**
 * 2. Plants Illustrated Icon
 * Vibrant botanical sprout in a warm terracotta pot with lush medicinal leaves.
 * Leaf rotates gently when active.
 */
export function PlantsIllustratedIcon({
  isActive,
  reducedMotion = false,
  className = "w-7 h-7 sm:w-8 sm:h-8",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="potGrad" x1="10" y1="19" x2="22" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient id="leafGradLeft" x1="8" y1="6" x2="16" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <linearGradient id="leafGradRight" x1="15" y1="4" x2="25" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>

      {/* Plant Pot */}
      <path
        d="M10 20L11.5 27C11.6 27.5 12.1 28 12.6 28H19.4C19.9 28 20.4 27.5 20.5 27L22 20H10Z"
        fill="url(#potGrad)"
      />
      {/* Pot Rim */}
      <rect
        x="9"
        y="18.5"
        width="14"
        height="3"
        rx="1.5"
        fill="#fdba74"
        stroke="#c2410c"
        strokeWidth="1"
      />
      {/* Pot Accent Band */}
      <line x1="11.8" y1="23.5" x2="20.2" y2="23.5" stroke="#fed7aa" strokeWidth="1" strokeLinecap="round" />

      {/* Main Plant Stem and Leaves - Rotates 5-8° when active */}
      <motion.g
        style={{ transformOrigin: "16px 20px" }}
        animate={
          isActive && !reducedMotion
            ? {
                rotate: [0, 8, -5, 3, 0],
              }
            : { rotate: 0 }
        }
        transition={{ duration: 0.65, ease: "easeInOut" }}
      >
        {/* Central Stem */}
        <path
          d="M16 19V11"
          stroke="#15803d"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Left Leaf */}
        <path
          d="M15.5 13.5C12.5 13.5 9 10 9.5 7.5C11.5 7 15 9.5 15.5 13.5Z"
          fill="url(#leafGradLeft)"
          stroke="#15803d"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        {/* Left Leaf Vein */}
        <path
          d="M11 9C12.5 10 14 11.2 15 12"
          stroke="#bbf7d0"
          strokeWidth="0.8"
          strokeLinecap="round"
        />

        {/* Right / Top Leaf */}
        <path
          d="M16 11.5C16.5 7.5 21 4 23.5 4.5C24.5 7.5 20.5 11.5 16 11.5Z"
          fill="url(#leafGradRight)"
          stroke="#15803d"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        {/* Right Leaf Vein */}
        <path
          d="M18 10C19.5 8.5 21.5 7 22.5 5.8"
          stroke="#ffffff"
          strokeWidth="0.8"
          strokeLinecap="round"
        />

        {/* Small Dewdrop Highlight */}
        <circle cx="21" cy="6" r="0.9" fill="#ffffff" />
      </motion.g>
    </svg>
  );
}

/**
 * 3. NaturAide Mascot Face (for Ask NaturAide Centerpiece Button)
 * Friendly botanical sprout buddy with expressive eyes, smile, rosy blush, and leafy antenna sprout.
 */
export function MascotIllustratedFace({
  isHovered = false,
  reducedMotion = false,
  className = "w-9 h-9 sm:w-10 sm:h-10",
}: {
  isHovered?: boolean;
  reducedMotion?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Mascot Face Tone */}
        <radialGradient id="mascotFaceGrad" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#f4fbf7" />
          <stop offset="100%" stopColor="#d1fae5" />
        </radialGradient>
        {/* Sprout Leaf Gradient */}
        <linearGradient id="mascotSproutGrad" x1="14" y1="2" x2="22" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>

      {/* Head Sprout Leaves (Top Antenna) */}
      <motion.g
        style={{ transformOrigin: "18px 10px" }}
        animate={
          isHovered && !reducedMotion
            ? { rotate: [-8, 8, -4, 0] }
            : { rotate: 0 }
        }
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {/* Left Sprout Leaf */}
        <path
          d="M18 10C15 6 11 6.5 11.5 8.5C12.5 10.5 16 11 18 10Z"
          fill="url(#mascotSproutGrad)"
          stroke="#047857"
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
        {/* Right Sprout Leaf */}
        <path
          d="M18 10C21 5.5 25.5 6 25 8C24 10 20 11 18 10Z"
          fill="url(#mascotSproutGrad)"
          stroke="#047857"
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
        {/* Tiny Stem Cap */}
        <circle cx="18" cy="10" r="1.3" fill="#047857" />
      </motion.g>

      {/* Mascot Round Head */}
      <circle
        cx="18"
        cy="21.5"
        r="11.5"
        fill="url(#mascotFaceGrad)"
        stroke="#047857"
        strokeWidth="1.6"
      />

      {/* Rosy Blush Cheeks (Filipino Warmth) */}
      <ellipse cx="11" cy="23.5" rx="2.2" ry="1.4" fill="#fb7185" fillOpacity="0.65" />
      <ellipse cx="25" cy="23.5" rx="2.2" ry="1.4" fill="#fb7185" fillOpacity="0.65" />

      {/* Friendly Eyes with Sparkle Catchlights */}
      <g>
        {/* Left Eye */}
        <ellipse cx="13.2" cy="19.5" rx="1.8" ry="2.2" fill="#064e3b" />
        <circle cx="14" cy="18.6" r="0.8" fill="#ffffff" />
        <circle cx="12.7" cy="20.4" r="0.4" fill="#ffffff" />

        {/* Right Eye */}
        <ellipse cx="22.8" cy="19.5" rx="1.8" ry="2.2" fill="#064e3b" />
        <circle cx="23.6" cy="18.6" r="0.8" fill="#ffffff" />
        <circle cx="22.3" cy="20.4" r="0.4" fill="#ffffff" />
      </g>

      {/* Cheerful Happy Open Smile */}
      <path
        d="M15.2 23.2C15.8 25.4 20.2 25.4 20.8 23.2"
        stroke="#064e3b"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Tiny tongue highlight */}
      <path
        d="M16.5 24.3C17.2 25.2 18.8 25.2 19.5 24.3"
        fill="#f87171"
      />
    </svg>
  );
}

/**
 * 4. Saved Illustrated Icon
 * Warm amber/orange 2D bookmark ribbon with soft gold highlight and herbal star emblem.
 * Animates fill and scale when active.
 */
export function SavedIllustratedIcon({
  isActive,
  reducedMotion = false,
  className = "w-7 h-7 sm:w-8 sm:h-8",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="bookmarkGradActive" x1="16" y1="5" x2="16" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="bookmarkGradInactive" x1="16" y1="5" x2="16" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="100%" stopColor="#fef3c7" />
        </linearGradient>
      </defs>

      {/* Top Ring / Loop */}
      <rect
        x="13.5"
        y="3"
        width="5"
        height="3"
        rx="1.5"
        fill="#f59e0b"
        stroke="#b45309"
        strokeWidth="1"
      />

      {/* Bookmark Ribbon Body */}
      <motion.path
        d="M9.5 5.5H22.5C23.6 5.5 24.5 6.4 24.5 7.5V27.5L16 22.5L7.5 27.5V7.5C7.5 6.4 8.4 5.5 9.5 5.5Z"
        fill={isActive ? "url(#bookmarkGradActive)" : "url(#bookmarkGradInactive)"}
        stroke="#d97706"
        strokeWidth="1.6"
        strokeLinejoin="round"
        animate={
          isActive && !reducedMotion
            ? {
                scale: [0.94, 1.12, 1],
              }
            : { scale: 1 }
        }
        transition={{ duration: 0.45, ease: "easeOut" }}
      />

      {/* Bookmark Top Stitch / Fold Accent */}
      <line
        x1="10.5"
        y1="9"
        x2="21.5"
        y2="9"
        stroke={isActive ? "#fef3c7" : "#fde68a"}
        strokeWidth="1"
        strokeLinecap="round"
        strokeDasharray="2 1.5"
      />

      {/* Center Herbal Badge / Star Emblem */}
      <motion.g
        animate={
          isActive && !reducedMotion
            ? {
                scale: [1, 1.3, 1],
                rotate: [0, 15, 0],
              }
            : { scale: 1, rotate: 0 }
        }
        style={{ transformOrigin: "16px 15px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <path
          d="M16 11.5L17.2 14.2L20 14.6L18 16.5L18.5 19.3L16 18L13.5 19.3L14 16.5L12 14.6L14.8 14.2L16 11.5Z"
          fill={isActive ? "#ffffff" : "#f59e0b"}
        />
        {/* Tiny center twinkle */}
        <circle cx="16" cy="15.5" r="0.75" fill={isActive ? "#f59e0b" : "#ffffff"} />
      </motion.g>
    </svg>
  );
}

/**
 * 5. Profile Illustrated Icon
 * Friendly 2D wellness community avatar with soft blue/teal hair, warm face, and leaf pin.
 * Receives a soft circular highlight when active.
 */
export function ProfileIllustratedIcon({
  isActive,
  reducedMotion = false,
  className = "w-7 h-7 sm:w-8 sm:h-8",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="profileHairGrad" x1="10" y1="6" x2="22" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <linearGradient id="profileShirtGrad" x1="8" y1="21" x2="24" y2="29" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0891b2" />
          <stop offset="100%" stopColor="#0e7490" />
        </linearGradient>
      </defs>

      {/* Active Soft Circular Halo Glow */}
      {isActive && (
        <motion.circle
          cx="16"
          cy="16"
          r="14"
          fill="#e0f2fe"
          fillOpacity="0.6"
          initial={reducedMotion ? false : { scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.6 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Shoulders / Shirt */}
      <path
        d="M8.5 28C8.5 24 11.5 21 16 21C20.5 21 23.5 24 23.5 28H8.5Z"
        fill="url(#profileShirtGrad)"
        stroke="#0369a1"
        strokeWidth="1.2"
      />

      {/* Herbal Leaf Pin on Collar */}
      <circle cx="18.5" cy="24" r="1.3" fill="#22c55e" />
      <circle cx="18.5" cy="24" r="0.6" fill="#86efac" />

      {/* Neck */}
      <rect x="14.5" y="18" width="3" height="3.5" rx="1.5" fill="#fed7aa" />

      {/* Face */}
      <circle
        cx="16"
        cy="14"
        r="6"
        fill="#ffedd5"
        stroke="#f97316"
        strokeWidth="0.8"
      />

      {/* Friendly Smile & Eyes */}
      <circle cx="14" cy="13.5" r="0.8" fill="#1e293b" />
      <circle cx="18" cy="13.5" r="0.8" fill="#1e293b" />
      <path
        d="M14.5 16C15 17 17 17 17.5 16"
        stroke="#c2410c"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
      {/* Soft Rosy Cheeks */}
      <circle cx="13" cy="15" r="0.9" fill="#fca5a5" fillOpacity="0.7" />
      <circle cx="19" cy="15" r="0.9" fill="#fca5a5" fillOpacity="0.7" />

      {/* Friendly Hair */}
      <path
        d="M10.5 13.5C10.5 9 12.5 7.5 16 7.5C19.5 7.5 21.5 9 21.5 13.5C21.5 14 21 13 20 12C18.5 10.5 13.5 10.5 12 12C11 13 10.5 14 10.5 13.5Z"
        fill="url(#profileHairGrad)"
      />
    </svg>
  );
}

