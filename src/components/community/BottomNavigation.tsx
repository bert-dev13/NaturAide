"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  BookmarkCheck,
  MessageSquareHeart,
  User,
} from "lucide-react";

const NAV_ITEMS = [
  {
    label: "Home",
    shortLabel: "Home",
    href: "/community",
    icon: Home,
    exact: true,
  },
  {
    label: "Herbal Guide",
    shortLabel: "Herbal Guide",
    href: "/community/herbal-guide",
    icon: BookOpen,
    exact: false,
    matchPrefixes: ["/community/herbal-guide", "/community/plants", "/community/products", "/community/herbal-finder", "/community/preparation"],
  },
  {
    label: "Ask NaturAide",
    shortLabel: "Ask NaturAide",
    href: "/community/ask",
    icon: MessageSquareHeart,
    exact: false,
  },
  {
    label: "My Guide",
    shortLabel: "My Guide",
    href: "/community/my-guide",
    icon: BookmarkCheck,
    exact: false,
  },
  {
    label: "Profile",
    shortLabel: "Profile",
    href: "/community/profile",
    icon: User,
    exact: false,
  },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-[#dde6df] shadow-lg transition-all"
    >
      <div className="max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto px-2 py-1.5 sm:py-2">
        <div className="grid grid-cols-5 items-center">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            let isActive = false;
            if (item.exact) {
              isActive = pathname === item.href;
            } else if (item.matchPrefixes) {
              isActive = item.matchPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
            } else {
              isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all cursor-pointer select-none active:scale-95 ${
                  isActive
                    ? "text-[#0f2c20]"
                    : "text-[#6b7c76] hover:text-[#0f2c20]"
                }`}
              >
                <div
                  className={`w-10 h-7 sm:w-12 sm:h-8 rounded-full flex items-center justify-center transition-all ${
                    isActive
                      ? "bg-emerald-100 text-[#0f2c20]"
                      : "text-[#6b7c76]"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform ${
                      isActive ? "stroke-[2.5px] scale-110 text-[#0f2c20]" : "stroke-[1.75px]"
                    }`}
                  />
                </div>
                <span
                  className={`text-[10px] sm:text-xs font-bold tracking-tight mt-0.5 leading-tight text-center truncate max-w-full px-0.5 ${
                    isActive ? "text-[#0f2c20] font-extrabold" : "text-[#52796f]"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
