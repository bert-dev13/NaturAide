import React from "react";
import Link from "next/link";
import { Leaf, ArrowRight } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionHref = "/community/herbal-guide",
  actionLabel = "Explore Herbal Guide",
}: EmptyStateProps) {
  return (
    <div className="p-8 sm:p-10 rounded-3xl bg-white border border-[#dde6df] text-center space-y-4 shadow-2xs">
      <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-[#1e5c44] flex items-center justify-center mx-auto shadow-2xs">
        {icon || <Leaf className="w-8 h-8 text-emerald-600" />}
      </div>

      <div className="space-y-1.5 max-w-sm mx-auto">
        <h3 className="font-heading font-extrabold text-lg sm:text-xl text-[#0f2c20]">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-[#52796f] leading-relaxed">
          {description}
        </p>
      </div>

      {actionHref && (
        <div className="pt-2">
          <Link
            href={actionHref}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs sm:text-sm font-extrabold transition-all shadow-xs active:scale-95"
          >
            <span>{actionLabel}</span>
            <ArrowRight className="w-4 h-4 text-emerald-300" />
          </Link>
        </div>
      )}
    </div>
  );
}
