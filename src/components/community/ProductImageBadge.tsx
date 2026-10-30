import React from "react";
import { CheckCircle2, Sparkles, AlertCircle, Info } from "lucide-react";

export type ProductBadgeType = "AUTHENTIC_PRODUCT" | "AI_REPRESENTATIVE" | "PLACEHOLDER";

interface ProductImageBadgeProps {
  imageType?: ProductBadgeType | string | null;
  className?: string;
  showDisclosure?: boolean;
}

export default function ProductImageBadge({
  imageType,
  className = "",
  showDisclosure = false,
}: ProductImageBadgeProps) {
  const isAuthentic = imageType === "AUTHENTIC_PRODUCT";
  const isAi = imageType === "AI_REPRESENTATIVE";

  if (isAuthentic) {
    return (
      <span
        title="Verified authentic commercial product photo."
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold shrink-0 ${className}`}
      >
        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
        <span>Product Photo</span>
      </span>
    );
  }

  if (isAi) {
    return (
      <span
        title="AI-generated representative image. Actual product packaging may differ."
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-bold shrink-0 cursor-help ${className}`}
      >
        <Sparkles className="w-3 h-3 text-teal-600 shrink-0" />
        <span>Representative Image</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold shrink-0 ${className}`}
    >
      <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
      <span>Photo Not Available</span>
    </span>
  );
}

export function ProductImageDisclosureNotice({ className = "" }: { className?: string }) {
  return (
    <p
      title="AI-generated representative image. Actual product packaging may differ."
      className={`text-[11px] text-[#52796f] flex items-center gap-1.5 ${className}`}
    >
      <Info className="w-3.5 h-3.5 text-teal-700 shrink-0" />
      <span>AI-generated representative image. Actual product packaging may differ.</span>
    </p>
  );
}
