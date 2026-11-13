"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Plus,
  Bell,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import ResearcherNavSections from "./ResearcherNavSections";
import { useLiveDisplayName } from "@/hooks/useLiveDisplayName";

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
  const { name: userName, initial } = useLiveDisplayName(user?.name || "");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    let controller: AbortController | null = null;

    function isBenignFetchError(err: unknown) {
      if (!err || typeof err !== "object") return false;
      const name = "name" in err ? String((err as { name?: string }).name) : "";
      const message = "message" in err ? String((err as { message?: string }).message) : "";
      return (
        name === "AbortError" ||
        message === "Failed to fetch" ||
        message.includes("aborted") ||
        message.includes("network error")
      );
    }

    async function fetchNotifs() {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }

      controller?.abort();
      controller = new AbortController();

      try {
        const res = await fetch("/api/researcher/notifications", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (cancelled || !res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } catch (err) {
        if (cancelled || isBenignFetchError(err)) return;
        console.error("Notifications fetch error:", err);
      }
    }

    fetchNotifs();

    const handleSync = () => fetchNotifs();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchNotifs();
    };

    window.addEventListener("natureaide:review-updated", handleSync);
    window.addEventListener("natureaide:revisions-updated", handleSync);
    window.addEventListener("natureaide:project-updated", handleSync);
    document.addEventListener("visibilitychange", handleVisibility);

    const interval = setInterval(fetchNotifs, 20000);

    return () => {
      cancelled = true;
      controller?.abort();
      window.removeEventListener("natureaide:review-updated", handleSync);
      window.removeEventListener("natureaide:revisions-updated", handleSync);
      window.removeEventListener("natureaide:project-updated", handleSync);
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    setNotifOpen(false);
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

  const iconBtn =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#3d5248] hover:text-[#0f2c20] hover:bg-[#edf2ee] transition-colors cursor-pointer";

  return (
    <>
      <header className="sticky top-0 z-40 h-12 bg-[#faf9f5]/90 backdrop-blur-md border-b border-[#e6ebe7] px-3 sm:px-5 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`${iconBtn} lg:hidden`}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <Link
            href="/researcher"
            className="flex items-center gap-2.5 min-w-0 group"
            title="NaturAide Research Platform"
          >
            <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-white border border-[#d7e4dc] shadow-sm shrink-0">
              <Image
                src="/images/nature-logo.png"
                alt="NaturAide logo"
                fill
                className="object-contain p-0.5"
                priority
              />
            </div>
            <div className="min-w-0 leading-tight">
              <span className="block font-heading font-bold text-[15px] tracking-tight text-[#0f2c20] truncate">
                NaturAide
              </span>
              <span className="hidden sm:block text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-700/80">
                Research
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1">
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className={iconBtn}
              title="Notifications"
              aria-label="Research Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 ring-2 ring-[#faf9f5]" />
              )}
            </button>

            {notifOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-40 cursor-default"
                  aria-label="Close notifications"
                  onClick={() => setNotifOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white border border-[#e6ebe7] shadow-lg py-2.5 z-50 text-slate-900">
                  <div className="flex items-center justify-between px-3.5 pb-2 border-b border-[#eef2ef]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#0f2c20]">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-[#eef2ef]">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((n, nIdx) => {
                        const isRev =
                          n.type === "REVISION_REQUESTED" || n.type === "REVISION_REQUIRED";
                        const isApp = n.type === "ACCEPTED_FOR_NEXT_STAGE";

                        return (
                          <div
                            key={`notif-${n.id || nIdx}-${nIdx}`}
                            className={`p-3 hover:bg-[#f6f8f6] transition-colors ${
                              n.isRead ? "opacity-70" : "bg-emerald-50/30"
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div
                                className={`p-1.5 rounded-md shrink-0 mt-0.5 ${
                                  isRev
                                    ? "bg-amber-100 text-amber-700"
                                    : isApp
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-slate-100 text-slate-600"
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
                                <h4 className="text-xs font-bold text-[#0f2c20] leading-snug">
                                  {n.title}
                                </h4>
                                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                                  {n.message}
                                </p>
                                <div className="flex items-center justify-between mt-2">
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
                                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900"
                                    >
                                      <span>
                                        {isRev
                                          ? "View Revisions"
                                          : isApp
                                          ? "View Stage"
                                          : "View Feedback"}
                                      </span>
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
              </>
            )}
          </div>

          <Link
            href="/researcher/profile"
            className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#edf2ee] text-[#1e5c44] text-[11px] font-bold border border-[#e6ebe7] hover:border-[#c5d4cb] transition-colors"
            title={userName || "Profile"}
            aria-label={userName || "Profile"}
          >
            {initial}
          </Link>

          <LogoutButton
            iconOnly
            className={`${iconBtn} text-[#6b7c76] hover:text-rose-700 hover:bg-rose-50`}
          />
        </div>
      </header>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex">
          <div className="w-[280px] max-w-[85vw] bg-[#091f16] text-white border-r border-[#143827] p-4 sm:p-5 flex flex-col justify-between shadow-2xl h-full animate-in slide-in-from-left duration-200">
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
                <span className="font-semibold text-sm text-white">NaturAide</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close navigation drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3 shrink-0">
              <Link
                href="/researcher/projects?new=true"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4 stroke-[2]" />
                <span>New Research</span>
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 pb-3 custom-scrollbar">
              <ResearcherNavSections onNavigate={() => setMobileOpen(false)} />
            </div>

            <div className="pt-3 border-t border-emerald-900/50 shrink-0 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-white truncate">{userName}</p>
                  <p className="text-[10px] text-emerald-400/70 uppercase tracking-wider">
                    Investigator
                  </p>
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
