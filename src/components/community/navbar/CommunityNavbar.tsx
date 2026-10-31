"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { COMMUNITY_NAV_ITEMS, isNavActive } from "./navConfig";
import NavItem from "./NavItem";
import AskNatureAideButton from "./AskNatureAideButton";

export default function CommunityNavbar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Community Navigation"
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
    >
      <div className="w-full max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-3xl sm:px-4 sm:pb-3 pointer-events-auto">
        {/* Floating navbar bar */}
        <div className="relative bg-[#fdfcf9]/95 backdrop-blur-xl border-t sm:border border-[#e2ebe4] shadow-[0_-4px_24px_-2px_rgba(15,44,32,0.08),0_12px_28px_rgba(15,44,32,0.06)] rounded-t-3xl sm:rounded-3xl px-2 sm:px-4 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] sm:py-2 min-h-[72px] sm:min-h-[78px] flex items-center">
          {/* Subtle botanical top highlight line */}
          <div className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent pointer-events-none" />

          {/* 5 Navigation Items */}
          <div className="grid grid-cols-5 items-end justify-items-center w-full">
            {COMMUNITY_NAV_ITEMS.map((item) => {
              const active = isNavActive(item, pathname);

              if (item.isCenterpiece) {
                return (
                  <AskNatureAideButton
                    key={item.id}
                    item={item}
                    isActive={active}
                  />
                );
              }

              return (
                <NavItem
                  key={item.id}
                  item={item}
                  isActive={active}
                />
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

