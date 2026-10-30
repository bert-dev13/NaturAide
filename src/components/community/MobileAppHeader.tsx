"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bookmark } from "lucide-react";

interface MobileAppHeaderProps {
  user?: {
    id: number;
    name?: string;
    firstName?: string;
    email?: string;
  } | null;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  backHref?: string;
  rightAction?: React.ReactNode;
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

  const hour = new Date().getHours();
  let greetingTime = "Good morning";
  if (hour >= 12 && hour < 17) greetingTime = "Good afternoon";
  else if (hour >= 17) greetingTime = "Good evening";

  const firstName = user?.firstName || user?.name?.split(" ")[0] || "Friend";

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#faf9f5]/95 backdrop-blur-md border-b border-[#e5ebe7] px-4 py-3 sm:px-6 transition-all">
      <div className="flex items-center justify-between gap-3">
        {showBack ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={handleBack}
              aria-label="Go back"
              className="w-10 h-10 rounded-full bg-white border border-[#dde6df] flex items-center justify-center text-[#0f2c20] hover:bg-[#edf2ee] active:scale-95 transition-all shadow-2xs shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Link
              href="/community"
              className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl overflow-hidden bg-white p-0.5 border border-[#dde6df] shadow-2xs hover:scale-105 active:scale-95 transition-transform shrink-0"
              title="NaturAide Community Home"
            >
              <Image
                src="/images/nature-logo.png"
                alt="NaturAide Logo"
                fill
                className="object-contain p-0.5"
                priority
              />
            </Link>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-heading font-extrabold text-[#0f2c20] truncate tracking-tight leading-tight">
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
          <div className="flex items-center gap-3 min-w-0">
            {/* NaturAide App Logo */}
            <Link
              href="/community"
              className="flex items-center gap-2.5 shrink-0 group active:scale-95 transition-transform"
            >
              <div className="relative w-10 h-10 rounded-2xl overflow-hidden bg-white p-0.5 border border-[#dde6df] shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <Image
                  src="/images/nature-logo.png"
                  alt="NaturAide Logo"
                  fill
                  className="object-contain p-0.5"
                  priority
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-extrabold text-base sm:text-lg tracking-tight text-[#0f2c20] leading-none">
                    NaturAide
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 uppercase tracking-wider">
                    Community
                  </span>
                </div>
                <p className="text-xs text-[#52796f] truncate font-medium mt-0.5">
                  {greetingTime}, <span className="font-bold text-[#0f2c20]">{firstName}</span>
                </p>
              </div>
            </Link>
          </div>
        )}

        {/* Right side actions */}
        <div className="flex items-center gap-2 shrink-0">
          {rightAction ? (
            rightAction
          ) : (
            <>
              {/* Saved / Bookmarks button */}
              <Link
                href="/community/my-guide"
                aria-label="Saved Bookmarks"
                title="Saved Bookmarks"
                className="w-10 h-10 rounded-full bg-white border border-[#dde6df] flex items-center justify-center text-[#2d6a4f] hover:text-[#0f2c20] hover:bg-[#edf2ee] active:scale-95 transition-all shadow-2xs"
              >
                <Bookmark className="w-4 h-4" />
              </Link>

              {/* Avatar to Profile */}
              <Link
                href="/community/profile"
                aria-label="Profile"
                className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-teal-50 border border-emerald-200 flex items-center justify-center text-[#1e5c44] font-bold text-sm hover:ring-2 hover:ring-emerald-400 active:scale-95 transition-all shadow-2xs"
              >
                {firstName.charAt(0).toUpperCase()}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
