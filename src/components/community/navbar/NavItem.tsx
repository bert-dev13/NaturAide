"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { NavItemConfig } from "./navConfig";
import {
  HomeIllustratedIcon,
  PlantsIllustratedIcon,
  SavedIllustratedIcon,
  ProfileIllustratedIcon,
} from "./NavIcons";

interface NavItemProps {
  item: NavItemConfig;
  isActive: boolean;
}

export default function NavItem({ item, isActive }: NavItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const renderIcon = () => {
    const props = {
      isActive,
      reducedMotion: shouldReduceMotion ?? false,
      className: "w-7 h-7 sm:w-7.5 sm:h-7.5 drop-shadow-2xs",
    };

    switch (item.id) {
      case "home":
        return <HomeIllustratedIcon {...props} />;
      case "plants":
        return <PlantsIllustratedIcon {...props} />;
      case "saved":
        return <SavedIllustratedIcon {...props} />;
      case "profile":
        return <ProfileIllustratedIcon {...props} />;
      default:
        return null;
    }
  };

  return (
    <Link
      href={item.href}
      aria-label={item.ariaLabel}
      aria-current={isActive ? "page" : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col items-center justify-center min-w-[56px] sm:min-w-[64px] min-h-[48px] py-1 px-1 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 cursor-pointer select-none"
    >
      {/* Icon Area with Soft Pastel Circular Background */}
      <motion.div
        className="relative flex items-center justify-center w-11 h-11 rounded-full"
        initial={false}
        animate={
          shouldReduceMotion
            ? {}
            : {
                y: isActive ? -5 : isHovered ? -3 : 0,
                scale: isActive ? 1.08 : isHovered ? 1.06 : 1,
              }
        }
        whileTap={
          shouldReduceMotion
            ? {}
            : {
                scale: 0.9,
                transition: { type: "spring", stiffness: 500, damping: 18 },
              }
        }
        transition={{
          type: "spring",
          stiffness: 420,
          damping: 25,
          mass: 0.8,
        }}
        style={{
          boxShadow: isHovered
            ? `0 4px 16px ${item.glowColor}`
            : isActive
            ? `0 2px 10px ${item.glowColor}`
            : "none",
        }}
      >
        {/* Soft Pastel Circular Background (appears when active or hovered) */}
        <div
          className="absolute inset-0 rounded-full transition-opacity duration-200 pointer-events-none"
          style={{
            backgroundColor: item.pastelBg,
            opacity: isActive ? 1 : isHovered ? 0.75 : 0,
          }}
        />

        {/* 2D Illustrated Custom Icon */}
        <div className="relative z-10 flex items-center justify-center">
          {renderIcon()}
        </div>
      </motion.div>

      {/* Navigation Label */}
      <span
        className={`text-[10px] sm:text-xs tracking-tight mt-0.5 leading-tight text-center transition-colors duration-200 truncate max-w-full px-0.5 ${
          isActive
            ? "text-[#0f2c20] font-black"
            : isHovered
            ? "font-extrabold"
            : "text-[#52796f] font-semibold"
        }`}
        style={{
          color: isActive
            ? "#0f2c20"
            : isHovered
            ? item.accentColor
            : undefined,
        }}
      >
        {item.label}
      </span>

      {/* Tiny Colored Indicator Underneath */}
      <div className="h-1.5 mt-0.5 flex items-center justify-center">
        {isActive && (
          <motion.div
            layoutId="activeNavIndicator"
            className="w-1.5 h-1.5 rounded-full shadow-2xs"
            style={{ backgroundColor: item.indicatorColor }}
            transition={{
              type: "spring",
              stiffness: 450,
              damping: 30,
            }}
          />
        )}
      </div>
    </Link>
  );
}

