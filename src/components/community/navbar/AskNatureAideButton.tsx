"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { MascotIllustratedFace } from "./NavIcons";
import { NavItemConfig } from "./navConfig";

interface AskNatureAideButtonProps {
  item: NavItemConfig;
  isActive: boolean;
}

export default function AskNatureAideButton({
  item,
  isActive,
}: AskNatureAideButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  return (
    <Link
      href={item.href}
      aria-label={item.ariaLabel}
      aria-current={isActive ? "page" : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col items-center justify-end -mt-7 sm:-mt-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-full cursor-pointer select-none"
    >
      {/* Floating Center Button */}
      <motion.div
        className="relative"
        initial={false}
        animate={
          shouldReduceMotion
            ? {}
            : {
                y: isActive ? -4 : isHovered ? -3 : 0,
                scale: isHovered ? 1.08 : isActive ? 1.04 : 1,
              }
        }
        whileTap={
          shouldReduceMotion
            ? {}
            : {
                scaleX: 1.12,
                scaleY: 0.88,
                transition: { type: "spring", stiffness: 500, damping: 15 },
              }
        }
        transition={{
          type: "spring",
          stiffness: 420,
          damping: 24,
        }}
      >
        {/* Subtle Ambient Glow Behind Button */}
        <div
          className={`absolute -inset-1 rounded-full blur-md transition-opacity duration-300 pointer-events-none ${
            isActive
              ? "bg-emerald-400/45 opacity-100"
              : isHovered
              ? "bg-emerald-400/35 opacity-100"
              : "opacity-0"
          }`}
        />

        {/* Circular Mascot Disc (56px mobile - 62px sm/desktop) */}
        <div
          className={`relative w-[56px] h-[56px] sm:w-[62px] sm:h-[62px] rounded-full p-[2.5px] bg-white shadow-[0_8px_20px_-3px_rgba(5,150,105,0.42)] transition-shadow duration-200 ${
            isActive ? "ring-2 ring-emerald-500/80 shadow-[0_10px_24px_-2px_rgba(5,150,105,0.55)]" : ""
          }`}
        >
          {/* Inner Botanical Gradient Disc */}
          <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-400 via-emerald-600 to-teal-800 flex items-center justify-center relative overflow-hidden border border-emerald-300/40">
            {/* Glossy Top Arch */}
            <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-full pointer-events-none" />

            {/* Mascot Head with Slow Idle Float and Tilt on Hover */}
            <motion.div
              animate={
                shouldReduceMotion
                  ? {}
                  : {
                      y: [0, -2, 0],
                      rotate: isHovered ? -5 : 0,
                    }
              }
              transition={
                shouldReduceMotion
                  ? {}
                  : {
                      y: {
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      },
                      rotate: {
                        duration: 0.22,
                        ease: "easeOut",
                      },
                    }
              }
              className="flex items-center justify-center shrink-0 z-10"
            >
              <MascotIllustratedFace
                isHovered={isHovered}
                reducedMotion={shouldReduceMotion ?? false}
                className="w-10 h-10 sm:w-11 sm:h-11 drop-shadow-sm"
              />
            </motion.div>

            {/* Sparkle Decorations */}
            {/* Top-Right Sparkle */}
            <motion.span
              className="absolute top-1.5 right-1.5 text-amber-300 pointer-events-none z-20"
              animate={
                shouldReduceMotion
                  ? {}
                  : {
                      scale: isHovered ? [1, 1.35, 1.2] : [0.85, 1.15, 0.85],
                      opacity: isHovered ? 1 : [0.6, 1, 0.6],
                      rotate: [0, 45, 0],
                    }
              }
              transition={{
                duration: isHovered ? 0.3 : 2.4,
                repeat: isHovered ? 0 : Infinity,
                ease: "easeInOut",
              }}
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path
                  d="M6 0L7.3 4.2L12 6L7.3 7.8L6 12L4.7 7.8L0 6L4.7 4.2L6 0Z"
                  fill="#fde047"
                />
              </svg>
            </motion.span>

            {/* Bottom-Left Sparkle */}
            <motion.span
              className="absolute bottom-1.5 left-1.5 text-emerald-200 pointer-events-none z-20"
              animate={
                shouldReduceMotion
                  ? {}
                  : {
                      scale: isHovered ? 1.2 : [1, 0.7, 1],
                      opacity: isHovered ? 0.95 : [0.5, 0.9, 0.5],
                    }
              }
              transition={{
                duration: 2.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.6,
              }}
            >
              <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                <path
                  d="M6 0L7 4.5L12 6L7 7.5L6 12L5 7.5L0 6L5 4.5L6 0Z"
                  fill="#fef08a"
                />
              </svg>
            </motion.span>
          </div>
        </div>
      </motion.div>

      {/* Label Under Centerpiece */}
      <div className="flex flex-col items-center mt-1">
        <span
          className={`text-[10px] sm:text-[11px] font-bold tracking-tight text-center leading-none transition-colors duration-200 ${
            isActive
              ? "text-[#064e3b] font-black"
              : isHovered
              ? "text-emerald-700 font-extrabold"
              : "text-[#52796f] font-semibold"
          }`}
        >
          {item.label}
        </span>

        {/* Tiny Colored Indicator Underneath */}
        <div className="h-1.5 mt-0.5 flex items-center justify-center">
          {isActive && (
            <motion.div
              layoutId="activeNavIndicator"
              className="w-1.5 h-1.5 rounded-full bg-emerald-600 shadow-xs"
              transition={{
                type: "spring",
                stiffness: 450,
                damping: 30,
              }}
            />
          )}
        </div>
      </div>
    </Link>
  );
}

