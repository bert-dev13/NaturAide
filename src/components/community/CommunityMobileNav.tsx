"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  MessageSquareHeart,
  User,
  BookmarkCheck,
  Bookmark,
  Coffee,
} from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

const MOBILE_BOTTOM_NAV = [
  { name: "Home", href: "/community", icon: Home },
  { name: "Herbal Guide", href: "/community/herbal-guide", icon: BookOpen },
  { name: "Ask", href: "/community/ask", icon: MessageSquareHeart },
  { name: "My Guide", href: "/community/my-guide", icon: BookmarkCheck },
  { name: "Profile", href: "/community/profile", icon: User },
];

export default function CommunityMobileNav({
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
    <>
      {/* MOBILE TOP HEADER */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e2ebe4] px-4 py-3 flex items-center justify-between">
        <Link href="/community" className="flex items-center gap-2.5 group">
          <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-white p-0.5 border border-[#dde6df] shadow-2xs group-hover:scale-105 transition-transform">
            <Image
              src="/images/nature-logo.png"
              alt="NaturAide logo"
              fill
              className="object-contain p-0.5"
            />
          </div>
          <span className="font-heading font-extrabold text-lg text-[#0f2c20] tracking-tight">
            NaturAide
          </span>
        </Link>

        {/* Secondary quick links on mobile */}
        <div className="flex items-center gap-2">
          <Link
            href="/community/saved"
            className={`p-2 rounded-xl border border-[#dde6df] transition-colors ${
              pathname === "/community/saved"
                ? "bg-[#0f2c20] text-white border-[#0f2c20]"
                : "bg-[#f6f8f6] text-[#1e5c44]"
            }`}
            title="Saved Items"
            aria-label="Saved items"
          >
            <Bookmark className="w-4 h-4" />
          </Link>
          <Link
            href="/community/preparation-guide"
            className={`p-2 rounded-xl border border-[#dde6df] transition-colors ${
              pathname === "/community/preparation-guide"
                ? "bg-[#0f2c20] text-white border-[#0f2c20]"
                : "bg-[#f6f8f6] text-[#1e5c44]"
            }`}
            title="Preparation Guides"
            aria-label="Preparation guides"
          >
            <Coffee className="w-4 h-4" />
          </Link>
          <LogoutButton iconOnly className="p-2 rounded-xl text-rose-700 bg-rose-50 border border-rose-200" />
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#e2ebe4] px-2 py-2 flex items-center justify-around shadow-lg">
        {MOBILE_BOTTOM_NAV.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/community"
              ? pathname === "/community"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
                isActive
                  ? "text-[#0f2c20] font-bold"
                  : "text-[#78997f] hover:text-[#0f2c20]"
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive ? "bg-[#0f2c20] text-white shadow-2xs" : "bg-transparent"
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight font-medium">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
