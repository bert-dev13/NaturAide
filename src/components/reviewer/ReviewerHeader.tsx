"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Bell,
  Layers,
  User,
  Sparkles,
  LayoutDashboard,
} from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import { useLiveDisplayName } from "@/hooks/useLiveDisplayName";

export default function ReviewerHeader({
  user,
}: {
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}) {
  const { name: userName, initial } = useLiveDisplayName(
    user?.name || "Professional Reviewer"
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    async function fetchNotifs() {
      try {
        const res = await fetch("/api/reviewer/notifications");
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
  }, [pathname]);

  useEffect(() => {
    setNotifOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  const markAllRead = async () => {
    try {
      await fetch("/api/reviewer/notifications", {
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

  const navLinks = [
    { name: "Dashboard", href: "/reviewer", icon: LayoutDashboard },
    { name: "Projects", href: "/reviewer/projects", icon: Layers },
    { name: "Ask NatureAide", href: "/reviewer/assistant", icon: Sparkles },
    { name: "Profile", href: "/reviewer/profile", icon: User },
  ];

  const iconBtn =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-[#0b2447] hover:bg-blue-50 transition-colors cursor-pointer";

  return (
    <>
      <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-slate-200/90 bg-[#f8fafc]/90 px-3 backdrop-blur-md sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`${iconBtn} lg:hidden`}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <Link
            href="/reviewer"
            className="group flex min-w-0 items-center gap-2"
            title="NaturAide Review"
          >
            <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white">
              <Image
                src="/images/nature-logo.png"
                alt="NaturAide logo"
                fill
                className="object-contain p-0.5"
                priority
              />
            </div>
            <span className="truncate font-heading text-sm font-bold tracking-tight text-[#071930]">
              NaturAide
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1">
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className={iconBtn}
              title="Notifications"
              aria-label="Review Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 ring-2 ring-[#f8fafc]" />
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
                <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white py-2.5 shadow-lg sm:w-96">
                  <div className="flex items-center justify-between border-b border-slate-100 px-3.5 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#071930]">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="cursor-pointer text-[11px] font-semibold text-blue-700 hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <Link
                          key={n.id}
                          href={n.link || "/reviewer"}
                          onClick={() => setNotifOpen(false)}
                          className={`block p-3 transition-colors hover:bg-slate-50 ${
                            !n.isRead ? "bg-blue-50/40" : ""
                          }`}
                        >
                          <p className="mb-0.5 text-xs font-bold text-[#071930]">{n.title}</p>
                          <p className="line-clamp-2 text-[11px] text-slate-600">{n.message}</p>
                          <span className="mt-1 block text-[10px] text-slate-400">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <Link
            href="/reviewer/profile"
            className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-[11px] font-bold text-blue-800 transition hover:border-blue-300"
            title={userName || "Profile"}
            aria-label={userName || "Profile"}
          >
            {initial}
          </Link>

          <LogoutButton
            iconOnly
            className={`${iconBtn} text-slate-500 hover:bg-rose-50 hover:text-rose-700`}
          />
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-xs lg:hidden">
          <div className="flex h-full w-[280px] max-w-[85vw] flex-col border-r border-[#1e3a5f] bg-[#07172b] p-4 text-white shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-sm font-semibold">NaturAide</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1">
              {navLinks.map((link) => {
                const NavIcon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                      isActive
                        ? "bg-blue-500 text-white"
                        : "text-blue-100/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <NavIcon className="h-4 w-4 shrink-0" />
                    {link.name}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto border-t border-white/10 pt-3">
              <p className="mb-2 truncate text-xs font-medium text-white">{userName}</p>
              <LogoutButton
                label="Sign Out"
                className="w-full justify-center rounded-lg border border-rose-900/60 bg-rose-950/40 px-3 py-2 text-xs font-medium text-rose-300 hover:bg-rose-900/60"
              />
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}
    </>
  );
}
