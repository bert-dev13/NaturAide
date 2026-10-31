"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import {
  LeafActionIcon,
  ShieldSafetyActionIcon,
  AskAiActionIcon,
} from "./HomeIcons2D";

interface ActionItem {
  id: string;
  title: string;
  description: string;
  href: string;
  badge: string;
  cta: string;
  icon: React.ReactNode;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  accentColor: string;
  badgeBg: string;
}

const ACTION_CARDS: ActionItem[] = [
  {
    id: "plants",
    title: "Find a Plant",
    description: "Explore medicinal plants and their documented uses.",
    href: "/community/herbal-guide?tab=plants",
    badge: "12 DOH Plants",
    cta: "Explore Plants",
    icon: <LeafActionIcon className="w-11 h-11" />,
    bgGradient: "bg-gradient-to-br from-[#ecfdf5] via-[#f0fdf4] to-[#e6f7ec]",
    borderColor: "border-emerald-200/80 hover:border-emerald-400",
    textColor: "text-[#0f2c20]",
    accentColor: "text-emerald-800",
    badgeBg: "bg-emerald-100/90 text-emerald-900 border-emerald-300/60",
  },
  {
    id: "safety",
    title: "Check Safety",
    description: "Review precautions and safe-use guidance.",
    href: "/community/guidance",
    badge: "Safe Use",
    cta: "Review Guidance",
    icon: <ShieldSafetyActionIcon className="w-11 h-11" />,
    bgGradient: "bg-gradient-to-br from-[#fffbeb] via-[#fefce8] to-[#fef3c7]/60",
    borderColor: "border-amber-200/80 hover:border-amber-400",
    textColor: "text-[#2b1803]",
    accentColor: "text-amber-900",
    badgeBg: "bg-amber-100/90 text-amber-900 border-amber-300/60",
  },
  {
    id: "ask",
    title: "Ask NaturAide",
    description: "Ask questions in simple language.",
    href: "/community/ask",
    badge: "AI Assistant",
    cta: "Start Asking",
    icon: <AskAiActionIcon className="w-11 h-11" />,
    bgGradient: "bg-gradient-to-br from-[#faf5ff] via-[#f3e8ff]/60 to-[#ecfdf5]/70",
    borderColor: "border-purple-200/80 hover:border-purple-400",
    textColor: "text-[#1e1b4b]",
    accentColor: "text-purple-900",
    badgeBg: "bg-purple-100/90 text-purple-900 border-purple-300/60",
  },
];

export default function QuickActions() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        {ACTION_CARDS.map((card) => (
          <Link
            key={card.id}
            href={card.href}
            className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-[22px]"
          >
            <motion.div
              whileHover={
                shouldReduceMotion
                  ? {}
                  : {
                      y: -4,
                      scale: 1.02,
                      transition: { duration: 0.2, ease: "easeOut" },
                    }
              }
              whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
              className={`p-4 sm:p-5 rounded-[22px] border ${card.borderColor} ${card.bgGradient} shadow-[0_4px_16px_-2px_rgba(15,44,32,0.04)] hover:shadow-[0_10px_24px_-4px_rgba(15,44,32,0.09)] transition-shadow duration-200 flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden`}
            >
              {/* Top row: Icon and minimal badge */}
              <div className="flex items-start justify-between gap-2">
                <motion.div
                  className="shrink-0 drop-shadow-2xs"
                  whileHover={
                    shouldReduceMotion
                      ? {}
                      : { rotate: [-2, 2, 0], scale: 1.06 }
                  }
                  transition={{ duration: 0.3 }}
                >
                  {card.icon}
                </motion.div>
                <span
                  className={`text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full border shadow-2xs ${card.badgeBg}`}
                >
                  {card.badge}
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-1 mt-3">
                <h3
                  className={`font-heading font-black text-base sm:text-lg tracking-tight ${card.textColor}`}
                >
                  {card.title}
                </h3>
                <p className="text-xs text-[#52796f] leading-relaxed font-medium">
                  {card.description}
                </p>
              </div>

              {/* Action Link Footer */}
              <div
                className={`pt-3 flex items-center justify-between text-xs font-bold ${card.accentColor} group-hover:underline`}
              >
                <span>{card.cta}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </section>
  );
}

