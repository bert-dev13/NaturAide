"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  User,
  Bookmark,
  LogOut,
  Sliders,
  Loader2,
} from "lucide-react";

interface MobileAppHeaderProps {
  user?: {
    id: number;
    name?: string;
    firstName?: string;
    email?: string;
    role?: string;
    avatarUrl?: string;
  } | null;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  backHref?: string;
  rightAction?: React.ReactNode;
}

/**
 * 2D Illustrated Warm Amber Bookmark Icon (Matching Bottom Navbar Language)
 */
function HeaderSavedIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 drop-shadow-2xs">
      <defs>
        <linearGradient id="headerBookmarkGrad" x1="12" y1="3" x2="12" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <path
        d="M6 4C6 3.44772 6.44772 3 7 3H17C17.5523 3 18 3.44772 18 4V21L12 17.5L6 21V4Z"
        fill="url(#headerBookmarkGrad)"
        stroke="#b45309"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Stitch accent */}
      <line
        x1="8"
        y1="6"
        x2="16"
        y2="6"
        stroke="#fef3c7"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeDasharray="1.5 1"
      />
      {/* Tiny center herbal star */}
      <path
        d="M12 9.5L12.7 11.2L14.5 11.4L13.2 12.6L13.6 14.3L12 13.5L10.4 14.3L10.8 12.6L9.5 11.4L11.3 11.2L12 9.5Z"
        fill="#ffffff"
      />
    </svg>
  );
}

export default function MobileAppHeader({
  user,
  title,
  subtitle,
  showBack = false,
  backHref,
  rightAction,
}: MobileAppHeaderProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const firstName = user?.firstName || user?.name?.split(" ")[0] || "Friend";

  // Scroll detection to adjust height, shadow & blur
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Dismiss profile dropdown on outside click or escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
      router.push("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ease-out select-none ${
        scrolled
          ? "h-[62px] bg-[#faf8f5]/95 backdrop-blur-[14px] border-b border-[#dde6df] shadow-[0_4px_20px_-4px_rgba(15,44,32,0.06)]"
          : "h-[68px] sm:h-[72px] bg-[#faf8f5]/85 backdrop-blur-md border-b border-[#e5ebe7]/60 shadow-none"
      }`}
    >
      <div className="h-full w-full max-w-4xl mx-auto px-3.5 sm:px-6 flex items-center justify-between gap-3">
        {/* ================================================================= */}
        {/* LEFT AREA: BACK BUTTON OR BRAND IDENTITY                          */}
        {/* ================================================================= */}
        {showBack ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <motion.button
              whileHover={shouldReduceMotion ? {} : { scale: 1.05, x: -2 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.93 }}
              onClick={handleBack}
              aria-label="Go back"
              className="w-10 h-10 rounded-full bg-white border border-[#dde6df] flex items-center justify-center text-[#0f2c20] hover:bg-emerald-50 active:scale-95 transition-all shadow-2xs shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <ArrowLeft className="w-4 h-4 text-[#0f2c20]" />
            </motion.button>

            <Link
              href="/community"
              className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden bg-white p-0.5 border border-[#dde6df] shadow-2xs hover:scale-105 active:scale-95 transition-transform shrink-0"
              title="NaturAide Community Home"
            >
              <Image
                src="/images/nature-logo.png"
                alt="NaturAide Logo"
                fill
                sizes="36px"
                className="object-contain p-0.5"
                priority
              />
            </Link>

            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-heading font-black text-[#0f2c20] truncate tracking-tight leading-snug">
                {title}
              </h1>
              {subtitle && (
                <p className="text-[11px] sm:text-xs text-[#52796f] truncate font-medium">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Clickable Brand Area linking to Community Home */}
            <Link
              href="/community"
              onMouseEnter={() => setIsLogoHovered(true)}
              onMouseLeave={() => setIsLogoHovered(false)}
              className="flex items-center gap-2.5 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl"
            >
              {/* Logo with Entrance Fade/Scale Animation */}
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={shouldReduceMotion ? {} : { scale: 1.04 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className={`relative rounded-xl overflow-hidden bg-white p-0.5 border border-[#dde6df] shadow-2xs transition-all duration-300 shrink-0 ${
                  scrolled ? "w-8 h-8 sm:w-9 sm:h-9" : "w-9 h-9 sm:w-10 sm:h-10"
                }`}
              >
                <Image
                  src="/images/nature-logo.png"
                  alt="NaturAide Logo"
                  fill
                  sizes="40px"
                  className="object-contain p-0.5"
                  priority
                />
              </motion.div>

              {/* Brand Typography & Soft Mint Badge */}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-heading font-black text-base sm:text-lg tracking-tight text-[#0f2c20] group-hover:text-emerald-900 transition-colors">
                    NaturAide
                  </span>

                  {/* Soft Mint COMMUNITY Badge */}
                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-100/90 border border-emerald-300/60 text-[9px] sm:text-[10px] font-black text-[#064e3b] uppercase tracking-wider shadow-2xs">
                    Community
                  </span>

                  {/* Subtle Leaf Decorative Accent */}
                  <motion.span
                    className="hidden sm:inline-block text-emerald-600 origin-bottom"
                    animate={
                      shouldReduceMotion
                        ? {}
                        : isLogoHovered
                        ? { rotate: [0, 10, -6, 0] }
                        : { rotate: 0 }
                    }
                    transition={{ duration: 0.4 }}
                  >
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 0C8 5 3 8 0 8C5 8 8 13 8 16C8 11 13 8 16 8C11 8 8 3 8 0Z" />
                    </svg>
                  </motion.span>
                </div>

                {/* Desktop-only subtle subtitle (hidden on mobile) */}
                <span className="hidden sm:block text-[9.5px] font-semibold text-[#668276] uppercase tracking-wider mt-0.5 truncate">
                  Philippine Herbal Knowledge
                </span>
              </div>
            </Link>
          </div>
        )}

        {/* ================================================================= */}
        {/* RIGHT AREA: 2D COLORFUL ACTIONS & PROFILE DROPDOWN                */}
        {/* ================================================================= */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {rightAction ? (
            rightAction
          ) : (
            <>
              {/* 1. Saved/Bookmarks 2D Action Button */}
              <motion.div
                whileHover={shouldReduceMotion ? {} : { scale: 1.05, y: -2 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.92 }}
                transition={{ type: "spring", stiffness: 450, damping: 22 }}
              >
                <Link
                  href="/community/my-guide"
                  aria-label="View Saved Guides and Bookmarks"
                  title="My Saved Guides"
                  className="w-10 h-10 min-w-[44px] min-h-[44px] rounded-full bg-white hover:bg-amber-50/80 border border-[#dde6df] hover:border-amber-300/80 flex items-center justify-center transition-colors shadow-2xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  <HeaderSavedIcon />
                </Link>
              </motion.div>

              {/* 2. Interactive Profile Avatar with Dropdown */}
              <div className="relative" ref={menuRef}>
                <motion.button
                  whileHover={shouldReduceMotion ? {} : { scale: 1.05, y: -2 }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 450, damping: 22 }}
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="Account Menu"
                  aria-expanded={isMenuOpen}
                  className="w-10 h-10 min-w-[44px] min-h-[44px] rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 border border-emerald-300/80 hover:border-emerald-500 hover:ring-2 hover:ring-emerald-400/40 flex items-center justify-center text-[#064e3b] font-black text-sm shadow-2xs transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  {user?.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={firstName}
                      width={36}
                      height={36}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span>{firstName.charAt(0).toUpperCase()}</span>
                  )}
                </motion.button>

                {/* Animated Profile Dropdown Card */}
                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div
                      initial={
                        shouldReduceMotion
                          ? { opacity: 0 }
                          : { opacity: 0, scale: 0.95, y: -6 }
                      }
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={
                        shouldReduceMotion
                          ? { opacity: 0 }
                          : { opacity: 0, scale: 0.95, y: -6 }
                      }
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="absolute right-0 top-12 w-56 bg-white/98 backdrop-blur-xl border border-[#dde6df] rounded-2xl shadow-[0_12px_32px_-4px_rgba(15,44,32,0.14)] z-50 overflow-hidden"
                    >
                      {/* Header User Preview */}
                      <div className="p-3 bg-gradient-to-br from-[#f2f8f4] to-[#f9faf7] border-b border-[#e5ebe7] flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 border border-emerald-300 text-emerald-950 font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                          {firstName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-heading font-black text-xs text-[#0f2c20] truncate">
                            {user?.name || firstName}
                          </h4>
                          <span className="inline-block text-[9px] font-black text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded border border-emerald-300/60 uppercase tracking-wider mt-0.5">
                            Community Member
                          </span>
                        </div>
                      </div>

                      {/* Dropdown Navigation Actions */}
                      <div className="p-1 space-y-0.5">
                        <Link
                          href="/community/profile"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#0f2c20] hover:bg-emerald-50 hover:text-emerald-950 transition-colors"
                        >
                          <div className="w-6 h-6 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-200/50">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <span>Profile</span>
                        </Link>

                        <Link
                          href="/community/my-guide"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#0f2c20] hover:bg-emerald-50 hover:text-emerald-950 transition-colors"
                        >
                          <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200/50">
                            <Bookmark className="w-3.5 h-3.5" />
                          </div>
                          <span>My Saved Guides</span>
                        </Link>

                        <Link
                          href="/community/screening"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#0f2c20] hover:bg-emerald-50 hover:text-emerald-950 transition-colors"
                        >
                          <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200/50">
                            <Sliders className="w-3.5 h-3.5" />
                          </div>
                          <span>Health Screening</span>
                        </Link>
                      </div>

                      {/* Sign Out Action */}
                      <div className="p-1 border-t border-[#e5ebe7]">
                        <button
                          type="button"
                          onClick={handleLogout}
                          disabled={loggingOut}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer select-none"
                        >
                          {loggingOut ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <LogOut className="w-3.5 h-3.5" />
                          )}
                          <span>{loggingOut ? "Signing out..." : "Sign Out"}</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
