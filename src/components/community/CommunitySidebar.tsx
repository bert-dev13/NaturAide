"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  BookOpen,
  Coffee,
  MessageSquareHeart,
  BookmarkCheck,
  User,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

const NAV_ITEMS = [
  {
    name: "Home",
    href: "/community",
    icon: Home,
    description: "Daily overview & quick actions",
  },
  {
    name: "Herbal Guide",
    href: "/community/herbal-guide",
    icon: BookOpen,
    description: "Medicinal plants & herbal products",
  },
  {
    name: "Ask NaturAide",
    href: "/community/ask",
    icon: MessageSquareHeart,
    description: "Friendly educational chatbot",
  },
  {
    name: "My Guide",
    href: "/community/my-guide",
    icon: BookmarkCheck,
    description: "Personal saved collection & notes",
  },
  {
    name: "Profile",
    href: "/community/profile",
    icon: User,
    description: "Account & screening profile",
  },
];

export default function CommunitySidebar({
  user,
}: {
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    firstName?: string;
  };
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-72 flex-col justify-between bg-white border-r border-[#e2ebe4] min-h-screen sticky top-0 px-5 py-6 select-none shadow-xs">
      <div>
        {/* LOGO & BRAND */}
        <Link href="/" className="flex items-center gap-3 px-2 py-1 mb-8 group cursor-pointer">
          <div className="w-10 h-10 rounded-2xl overflow-hidden bg-[#0f2c20] p-1.5 shadow-sm group-hover:scale-105 transition-transform">
            <Image
              src="/images/nature-logo.png"
              alt="NaturAide logo"
              width={32}
              height={32}
              className="object-contain w-full h-full invert brightness-200"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-extrabold text-xl text-[#0f2c20] tracking-tight flex items-center gap-1">
              NaturAide
              <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
            </span>
            <span className="text-[11px] font-bold text-[#16a34a] uppercase tracking-wider">
              Community Platform
            </span>
          </div>
        </Link>

        {/* NAVIGATION LINKS */}
        <nav className="space-y-1.5">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#78997f] mb-2">
            Navigation
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/community"
                ? pathname === "/community"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all group ${
                  isActive
                    ? "bg-[#0f2c20] text-white shadow-sm"
                    : "text-[#2f3a35] hover:bg-[#f6f8f6] hover:text-[#0f2c20]"
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-colors ${
                    isActive
                      ? "bg-white/15 text-[#ccfbf1]"
                      : "bg-[#edf2ee] text-[#1e5c44] group-hover:bg-[#dde6df]"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                </div>
                <div className="flex-1">
                  <div className="leading-snug">{item.name}</div>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-emerald-300" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* FOOTER USER CARD & LOGOUT */}
      <div className="pt-6 border-t border-[#e2ebe4] space-y-4">
        <div className="p-3.5 rounded-2xl bg-[#faf6ee] border border-[#ecdecc]/70 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#1e5c44] text-[#ccfbf1] font-heading font-extrabold text-sm flex items-center justify-center shadow-xs">
            {(user.firstName || user.name || "U").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#131b17] truncate">{user.name}</p>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-[#16a34a]">
              <ShieldCheck className="w-3 h-3 text-[#16a34a]" />
              <span>Community Member</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <Link
            href="/"
            className="text-xs font-medium text-[#78997f] hover:text-[#0f2c20] transition-colors"
          >
            ← Public Site
          </Link>
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}
