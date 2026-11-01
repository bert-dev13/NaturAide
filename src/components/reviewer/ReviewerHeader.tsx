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
  ShieldCheck,
} from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
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
    { name: "Review Workspace", href: "/reviewer", icon: LayoutDashboard },
    { name: "All Research Projects", href: "/reviewer/projects", icon: Layers },
    { name: "Ask NatureAide", href: "/reviewer/assistant", icon: Sparkles },
    { name: "Profile", href: "/reviewer/profile", icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3 text-slate-800 shadow-2xs select-none transition-colors">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/reviewer" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-slate-50 p-0.5 border border-slate-200 shadow-2xs group-hover:scale-105 group-hover:border-blue-400 transition-all shrink-0">
              <Image
                src="/images/nature-logo.png"
                alt="NatureAide Logo"
                fill
                sizes="32px"
                className="object-contain p-1"
                priority
              />
            </div>
            <div className="hidden sm:flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-extrabold text-sm text-slate-900 tracking-tight flex items-center gap-1.5">
                  NatureAide
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse" />
                </span>
                <span className="px-1.5 py-0.2 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-extrabold uppercase tracking-wider">
                  Professional
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                Scientific Review Platform
              </span>
            </div>
          </Link>
        </div>

        {/* Right: Notification and Profile */}
        <div className="flex items-center gap-3">
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200 bg-white cursor-pointer shadow-2xs"
              title="Review Notifications"
              aria-label="Review Notifications"
            >
              <Bell className="w-4 h-4 transition-transform group-hover:scale-110" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-white animate-pulse" />
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl py-3 z-50 text-slate-900 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <Link
                        key={n.id}
                        href={n.link || "/reviewer"}
                        onClick={() => setNotifOpen(false)}
                        className={`block p-3.5 hover:bg-slate-50 transition-colors ${
                          !n.isRead ? "bg-blue-50/50" : ""
                        }`}
                      >
                        <p className="text-xs font-bold text-slate-900 mb-0.5">{n.title}</p>
                        <p className="text-[11px] text-slate-600 line-clamp-2">{n.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* General Professional Reviewer User Nav Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2.5 pl-3 border-l border-slate-200 hover:opacity-90 transition-opacity cursor-pointer text-left"
              title="Professional Reviewer Menu"
              aria-label="Professional Reviewer Menu"
            >
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  Professional Reviewer
                </span>
                <span className="text-[10px] font-medium text-slate-500 leading-tight">
                  Scientific Review Platform
                </span>
              </div>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-2xl py-2 z-50 text-slate-900 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">Professional Reviewer</p>
                  <p className="text-[10px] text-slate-500">Scientific Review Platform</p>
                </div>
                <div className="py-1 text-xs">
                  <Link
                    href="/reviewer"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-blue-600 font-semibold transition-colors"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-blue-600" />
                    <span>Review Workspace</span>
                  </Link>
                  <Link
                    href="/reviewer/assistant"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-blue-600 font-semibold transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ask NatureAide</span>
                  </Link>
                  <Link
                    href="/reviewer/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-blue-600 font-semibold transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>Profile</span>
                  </Link>
                </div>
                <div className="pt-1 border-t border-slate-100 px-2">
                  <LogoutButton className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-3 pt-3 border-t border-slate-200 space-y-1 animate-in fade-in">
          {navLinks.map((link) => {
            const NavIcon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <NavIcon className="w-4 h-4 shrink-0 text-blue-600" />
                <span>{link.name}</span>
              </Link>
            );
          })}
          <div className="pt-2">
            <LogoutButton className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors" />
          </div>
        </div>
      )}
    </header>
  );
}
