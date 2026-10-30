"use client";

import React from "react";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Lock,
  CircleDot,
  Circle,
  FileText,
  ShieldCheck,
  Tag,
  Paperclip,
  Globe,
} from "lucide-react";

export type StatusVariant =
  | "COMPLETED"
  | "CURRENT"
  | "IN_PROGRESS"
  | "UNDER_REVIEW"
  | "NEEDS_REVISION"
  | "REVISION_REQUESTED"
  | "LOCKED"
  | "UPCOMING"
  | "NOT_STARTED"
  | "DRAFT"
  | "APPROVED"
  | "REJECTED"
  | "INTEGRATED"
  | "VERIFIED_NATURAIDE"
  | "EXTERNAL_SOURCE"
  | "UPLOADED_DOCUMENT"
  | "MANUAL_ENTRY";

interface StageStatusBadgeProps {
  status: string;
  size?: "sm" | "md";
  className?: string;
  showIcon?: boolean;
}

export default function StageStatusBadge({
  status,
  size = "sm",
  className = "",
  showIcon = true,
}: StageStatusBadgeProps) {
  const norm = (status || "NOT_STARTED").toUpperCase().replace(/\s+/g, "_");

  let badgeStyle = "bg-slate-100 text-slate-700 border-slate-200";
  let Icon = Circle;
  let label = status.replace(/_/g, " ");

  switch (norm) {
    case "COMPLETED":
    case "COMPLETE":
    case "APPROVED":
    case "INTEGRATED":
      badgeStyle = "bg-emerald-50 text-emerald-800 border-emerald-200";
      Icon = CheckCircle2;
      break;

    case "CURRENT":
    case "IN_PROGRESS":
    case "ACTIVE":
      badgeStyle = "bg-teal-50 text-teal-900 border-teal-200";
      Icon = CircleDot;
      label = norm === "CURRENT" ? "In Progress" : label;
      break;

    case "UNDER_REVIEW":
    case "SUBMITTED":
    case "PENDING_REVIEW":
      badgeStyle = "bg-amber-50 text-amber-900 border-amber-200";
      Icon = Clock;
      break;

    case "NEEDS_REVISION":
    case "REVISION_REQUESTED":
    case "CHANGES_REQUESTED":
      badgeStyle = "bg-orange-50 text-orange-900 border-orange-200";
      Icon = AlertCircle;
      break;

    case "LOCKED":
      badgeStyle = "bg-slate-100 text-slate-500 border-slate-200";
      Icon = Lock;
      break;

    case "VERIFIED_NATURAIDE":
    case "VERIFIED_NATUREAIDE":
      badgeStyle = "bg-emerald-50 text-emerald-800 border-emerald-200";
      Icon = ShieldCheck;
      label = "Verified NaturAide";
      break;

    case "EXTERNAL_SOURCE":
      badgeStyle = "bg-sky-50 text-sky-800 border-sky-200";
      Icon = Globe;
      label = "External Source";
      break;

    case "UPLOADED_DOCUMENT":
    case "UPLOADED_RESULT":
      badgeStyle = "bg-purple-50 text-purple-800 border-purple-200";
      Icon = Paperclip;
      label = "Uploaded Document";
      break;

    case "MANUAL_ENTRY":
      badgeStyle = "bg-amber-50 text-amber-800 border-amber-200";
      Icon = Tag;
      label = "Manual Entry";
      break;

    case "DRAFT":
      badgeStyle = "bg-slate-100 text-slate-700 border-slate-200";
      Icon = FileText;
      break;

    case "UPCOMING":
    case "NOT_STARTED":
    default:
      badgeStyle = "bg-slate-100 text-slate-600 border-slate-200";
      Icon = Circle;
      break;
  }

  const sizeClasses =
    size === "sm"
      ? "text-[11px] px-2.5 py-0.5 gap-1.5 font-bold"
      : "text-xs px-3 py-1 gap-2 font-bold";

  return (
    <span
      className={`inline-flex items-center rounded-full border tracking-wide uppercase shadow-2xs whitespace-nowrap ${sizeClasses} ${badgeStyle} ${className}`}
    >
      {showIcon && <Icon className={size === "sm" ? "w-3 h-3 shrink-0" : "w-3.5 h-3.5 shrink-0"} />}
      <span>{label}</span>
    </span>
  );
}
