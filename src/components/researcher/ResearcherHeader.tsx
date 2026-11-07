"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  PlusCircle,
  Sparkles,
  Bell,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import ResearcherNavSections from "./ResearcherNavSections";

export default function ResearcherHeader({
  user,
}: {
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}) {
  const [userName, setUserName] = useState(user?.name || "");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    if (user?.name) {
      setUserName(user.name);
    }
  }, [user?.name]);

  useEffect(() => {
    const handleProfileUpdate = (e: any) => {
      if (e.detail?.name) {
        setUserName(e.detail.name);
      }
    };
    window.addEventListener("natureaide:user-profile-updated", handleProfileUpdate);
    return () => {
      window.removeEventListener("natureaide:user-profile-updated", handleProfileUpdate);
    };
  }, []);

  useEffect(() => {
    async function fetchNotifs() {
      try {
        const res = await fetch("/api/researcher/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (err) {
        console.error("Notifications fetch error:", err);
      }
    }
    fetchNotifs();

    // Listen to custom cross-window events
    const handleSync = () => fetchNotifs();
    window.addEventListener("natureaide:review-updated", handleSync);
    window.addEventListener("natureaide:revisions-updated", handleSync);
    window.addEventListener("natureaide:project-updated", handleSync);

    // Periodic polling every 12 seconds for real-time alerts
    const interval = setInterval(fetchNotifs, 12000);

    return () => {
      window.removeEventListener("natureaide:review-updated", handleSync);
      window.removeEventListener("natureaide:revisions-updated", handleSync);
      window.removeEventListener("natureaide:project-updated", handleSync);
      clearInterval(interval);
    };
  }, [pathname]);

  const markAllRead = async () => {
    try {
      await fetch("/api/researcher/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: 1 })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {/* TOP HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#dde6df] px-4 sm:px-6 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          {/* Mobile Drawer Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-xl text-[#0f2c20] hover:bg-[#f6f8f6] border border-[#dde6df] cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Brand on Top Bar */}
          <Link href="/researcher" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-white p-0.5 border border-[#dde6df] shadow-2xs group-hover:scale-105 transition-transform shrink-0">
              <Image
                src="/images/nature-logo.png"
                alt="NaturAide logo"
                fill
                className="object-contain p-0.5"
                priority
              />
            </div>
            <span className="font-heading font-extrabold text-base tracking-tight text-[#0f2c20]">
              NaturAide <span className="text-xs font-bold text-emerald-700">Lab</span>
            </span>
          </Link>

          {/* Desktop Breadcrumbs / Context */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-[#6b7c76]">
            <span className="font-bold text-[#1e5c44]">Scientific Research Platform</span>
            <span>/</span>
            <span className="font-medium text-[#131b17]">Workbench</span>
          </div>
        </div>

        {/* Quick Actions Header Right */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            href="/researcher/assistant"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-bold text-emerald-950 bg-emerald-50/90 hover:bg-emerald-100/90 border border-emerald-300/70 shadow-2xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Ask NatureAide</span>
            <span className="sm:hidden">Assistant</span>
          </Link>

          <Link
            href="/researcher/projects?new=true"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-heading font-bold text-white bg-[#0f2c20] hover:bg-[#1e5c44] shadow-xs transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-300" />
            <span>New Research</span>
          </Link>

          {/* Notification Bell Dropdown */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-[#edf2ee] transition-colors border border-[#dde6df] bg-white cursor-pointer shadow-2xs"
              title="Research Notifications"
              aria-label="Research Notifications"
            >
              <Bell className="w-4 h-4 transition-transform group-hover:scale-110" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white animate-pulse" />
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl py-3 z-50 text-slate-900 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n, nIdx) => {
                      const isRev = n.type === "REVISION_REQUESTED" || n.type === "REVISION_REQUIRED";
                      const isApp = n.type === "ACCEPTED_FOR_NEXT_STAGE";

                      return (
                        <div
                          key={`notif-${n.id || nIdx}-${nIdx}`}
                          className={`p-3.5 hover:bg-slate-50 transition-colors ${
                            n.isRead ? "opacity-75" : "bg-emerald-50/20"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div
                              className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                                isRev
                                  ? "bg-amber-100 text-amber-700"
                                  : isApp
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {isRev ? (
                                <AlertCircle className="w-3.5 h-3.5" />
                              ) : isApp ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : (
                                <Clock className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-bold text-slate-900 leading-snug">
                                {n.title}
                              </h4>
                              <p className="text-[11.5px] text-slate-600 mt-0.5 leading-relaxed">
                                {n.message}
                              </p>
                              <div className="flex items-center justify-between mt-2 pt-1">
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {new Date(n.createdAt).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                {n.link && (
                                  <Link
                                    href={n.link}
                                    onClick={() => setNotifOpen(false)}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 transition-colors"
                                  >
                                    <span>{isRev ? "View Revisions" : isApp ? "View Stage" : "View Feedback"}</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[#dde6df]">
            <Link
              href="/researcher/profile"
              className="flex items-center gap-2 text-xs font-bold text-[#0f2c20] hover:text-emerald-700 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-[#edf2ee] text-[#1e5c44] flex items-center justify-center font-bold text-xs border border-[#dde6df]">
                {(userName || "R").charAt(0).toUpperCase()}
              </div>
              <span className="hidden md:inline">{userName}</span>
            </Link>
          </div>

          <LogoutButton
            iconOnly
            className="p-2 rounded-xl text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
          />
        </div>
      </header>

      {/* MOBILE DRAWER / SHEET */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex">
          <div className="w-[280px] max-w-[85vw] bg-[#091f16] text-white border-r border-[#143827] p-4 sm:p-5 flex flex-col justify-between shadow-2xl h-full animate-in slide-in-from-left duration-200">
            {/* Drawer Header (shrink-0) */}
            <div className="flex items-center justify-between pb-3 border-b border-emerald-900/50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white p-1 shrink-0 shadow-xs flex items-center justify-center">
                  <Image
                    src="/images/nature-logo.png"
                    alt="NaturAide Logo"
                    width={22}
                    height={22}
                    className="object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-white">
                    NaturAide
                  </span>
                  <span className="text-[9px] font-medium text-emerald-400/80 tracking-widest uppercase">
                    Platform
                  </span>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close navigation drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Start New Research Action (shrink-0) */}
            <div className="py-3 shrink-0">
              <Link
                href="/researcher/projects?new=true"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-xs transition-colors"
              >
                <PlusCircle className="w-4 h-4 stroke-[2]" />
                <span>Start New Research</span>
              </Link>
            </div>

            {/* Scrollable Navigation Body */}
            <div className="flex-1 overflow-y-auto pr-1 pb-3 custom-scrollbar">
              <ResearcherNavSections onNavigate={() => setMobileOpen(false)} />
            </div>

            {/* User Profile & Sign Out Footer (shrink-0) */}
            <div className="pt-3 border-t border-emerald-900/50 shrink-0 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-white truncate">{userName}</p>
                  <p className="text-[10px] text-emerald-400/70 uppercase tracking-wider">Investigator</p>
                </div>
                <Link
                  href="/researcher/profile"
                  onClick={() => setMobileOpen(false)}
                  className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Profile
                </Link>
              </div>
              <LogoutButton
                label="Sign Out"
                className="w-full justify-center py-2 px-3 rounded-lg text-xs font-medium text-rose-300 bg-rose-950/40 border border-rose-900/60 hover:bg-rose-900/60 transition-colors"
              />
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  );
}
