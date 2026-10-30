"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  ArrowRight,
  Clock,
  FileCheck2,
  RotateCcw,
  CheckCircle2,
  Leaf,
  Dna,
  Pill,
  FlaskConical,
  Stethoscope,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Calendar,
  User,
  Filter,
  LayoutDashboard,
} from "lucide-react";
import {
  EXPERT_REVIEW_AREAS,
  normalizeReviewAreaKey,
  expertReviewAreaLabel,
  type ExpertReviewAreaKey,
} from "@/lib/expert-review-areas";

const AREA_ICONS: Record<string, React.ElementType> = {
  pharmacognosy: Leaf,
  bioinformatics: Dna,
  pharmacology: Pill,
  formulation: FlaskConical,
  clinical_safety: Stethoscope,
};

export interface ReviewItem {
  assignmentId: number;
  submissionId: number;
  projectId: number;
  projectTitle: string;
  plantName: string;
  plantScientificName?: string | null;
  researcherName: string;
  researcherEmail: string;
  submittedAt: string;
  reviewRound: number;
  specialtyNeeded: string;
  reviewAreaKey: ExpertReviewAreaKey;
  reviewAreaLabel: string;
  professionTitle?: string;
  isAssignedToCurrentUser?: boolean;
  assignedReviewerName?: string | null;
  history?: any[];
  assignmentStatus: string;
  displayStatus: string;
  totalFindingsCount?: number;
  openFindingsCount?: number;
}

export default function ReviewWorkspaceClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const areaParam = searchParams.get("area") || "";
  const statusParam = searchParams.get("status") || "ALL";

  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState(statusParam);
  const [isPendingTransition, startTransition] = useTransition();

  const currentAreaKey = areaParam ? normalizeReviewAreaKey(areaParam) : null;
  const currentAreaLabel = currentAreaKey ? expertReviewAreaLabel(currentAreaKey) : null;

  useEffect(() => {
    setActiveStatus(statusParam);
  }, [statusParam]);

  useEffect(() => {
    async function loadReviews() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (activeStatus && activeStatus !== "ALL") {
          params.set("status", activeStatus);
        }
        if (currentAreaKey) {
          params.set("area", currentAreaKey);
        }
        if (searchQuery.trim()) {
          params.set("q", searchQuery.trim());
        }

        const res = await fetch(`/api/reviewer/reviews?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setReviews(data.reviews || []);
        } else {
          setReviews([]);
        }
      } catch (err) {
        console.error("Error loading reviews:", err);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    }
    loadReviews();
  }, [activeStatus, currentAreaKey, searchQuery]);

  const handleStatusFilterChange = (status: string) => {
    setActiveStatus(status);
    const params = new URLSearchParams(searchParams.toString());
    if (status === "ALL") {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    startTransition(() => {
      router.push(`/reviewer?${params.toString()}`);
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "APPROVED":
        return {
          label: "Approved",
          className: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: CheckCircle2,
        };
      case "REVISION_REQUIRED":
      case "RESUBMITTED":
        return {
          label: "Revision Required",
          className: "bg-amber-50 text-amber-700 border-amber-200",
          icon: RotateCcw,
        };
      case "IN_REVIEW":
        return {
          label: "In Review",
          className: "bg-blue-50 text-blue-700 border-blue-200",
          icon: FileCheck2,
        };
      case "PENDING":
      default:
        return {
          label: "Pending Review",
          className: "bg-slate-100 text-slate-700 border-slate-200",
          icon: Clock,
        };
    }
  };

  const getActionConfig = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "APPROVED":
        return { label: "View Check →", icon: CheckCircle2, primary: false };
      case "REVISION_REQUIRED":
      case "RESUBMITTED":
        return { label: "Review Changes →", icon: RotateCcw, primary: true };
      case "IN_REVIEW":
        return { label: "Continue Checking →", icon: ArrowRight, primary: true };
      case "PENDING":
      default:
        return { label: "Start Checking →", icon: ArrowRight, primary: true };
    }
  };

  return (
    <div className="space-y-6">
      {/* PREMIUM SCIENTIFIC BLUE HERO HEADER */}
      <div className="relative overflow-hidden p-6 sm:p-7 rounded-2xl bg-gradient-to-r from-[#071d3a] via-[#0b2b54] to-[#123e73] border border-blue-400/30 text-white shadow-lg shadow-blue-950/20">
        {/* Animated ambient background orbs */}
        <div className="absolute -top-16 -right-16 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-10 left-1/3 w-40 h-40 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/25 text-blue-200 border border-blue-400/40 text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-300 animate-pulse" />
                <span>{currentAreaLabel ? `${currentAreaLabel} Evaluation` : "Professional Evaluation"}</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-blue-200/90 border border-white/15 text-[11px] font-semibold backdrop-blur-sm">
                {reviews.length} Research Dossier{reviews.length === 1 ? "" : "s"} Assigned
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/30 border border-blue-400/40 text-blue-300 flex items-center justify-center shrink-0 shadow-inner">
                <LayoutDashboard className="w-5 h-5 text-blue-300" />
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-extrabold text-white tracking-tight drop-shadow-xs">
                {currentAreaLabel ? `${currentAreaLabel} Reviews` : "Professional Review Workspace"}
              </h1>
            </div>

            <p className="text-xs sm:text-sm text-blue-200/85 leading-relaxed max-w-2xl">
              {currentAreaLabel
                ? `Examine and evaluate scientific research dossiers specifically assigned to your ${currentAreaLabel} specialty.`
                : "Review assigned scientific research dossiers and provide professional evaluation across your authorized scientific disciplines."}
            </p>
          </div>

          {currentAreaKey && (
            <div className="shrink-0">
              <Link
                href="/reviewer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all hover:scale-102 shadow-xs cursor-pointer"
              >
                <span>View All Areas</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-300" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { key: "ALL", label: "All" },
            { key: "PENDING", label: "Pending" },
            { key: "IN_REVIEW", label: "In Review" },
            { key: "REVISIONS", label: "Revisions" },
            { key: "COMPLETED", label: "Completed" },
          ].map((tab) => {
            const isSelected = activeStatus === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleStatusFilterChange(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plant, title, researcher..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-400 text-xs text-slate-800 outline-none transition-colors"
          />
        </div>
      </div>

      {/* ASSIGNED DOSSIER ROWS (FULL-WIDTH CLEAN ROWS) */}
      {loading ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Loading assigned research dossiers...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 space-y-3">
          <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">
            {activeStatus !== "ALL"
              ? `No ${activeStatus.toLowerCase().replace("_", " ")} reviews in this queue`
              : "No Assigned Reviews Found"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeStatus !== "ALL"
              ? "Try switching to the 'All' filter or clearing your search query."
              : "When researchers submit finalized research dossiers for your assigned specialty, they will appear here."}
          </p>
          {activeStatus !== "ALL" && (
            <button
              onClick={() => handleStatusFilterChange("ALL")}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
            >
              View All Reviews
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((rev) => {
            const badge = getStatusBadge(rev.assignmentStatus);
            const action = getActionConfig(rev.assignmentStatus);
            const BadgeIcon = badge.icon;
            const AreaIcon = AREA_ICONS[rev.reviewAreaKey] || Leaf;

            return (
              <div
                key={rev.assignmentId}
                className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 transition-all shadow-2xs hover:shadow-sm"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Scientific Botanical Identity & Details */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
                        {rev.plantName}
                      </span>
                      {rev.plantScientificName && (
                        <span className="text-xs italic text-slate-500">
                          ({rev.plantScientificName})
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold flex items-center gap-1.5">
                        <AreaIcon className="w-3.5 h-3.5 text-blue-600" />
                        <span>{rev.professionTitle || rev.reviewAreaLabel}</span>
                        <span className="text-blue-400 font-normal">·</span>
                        <span className="text-blue-800 font-extrabold">{rev.reviewAreaLabel}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                        {rev.isAssignedToCurrentUser ? "Assigned Specialty" : "Professional Review Active"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500">Project:</span>
                      <span className="font-semibold text-slate-800 truncate">
                        {rev.projectTitle}
                      </span>
                    </div>

                    {/* Metadata strip: Researcher, Submitted date, Cycle, Status */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-500 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Researcher:</span>
                        <span className="font-semibold text-slate-800">{rev.researcherName}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Submitted:</span>
                        <span className="font-semibold text-slate-800">
                          {new Date(rev.submittedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span>Review Cycle:</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 font-bold text-slate-800 text-[11px]">
                          {rev.reviewRound || 1}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-bold ${badge.className}`}>
                          <BadgeIcon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Primary Scientific Action */}
                  <div className="shrink-0 flex items-center gap-2 pt-2 lg:pt-0">
                    <Link
                      href={`/reviewer/checking/${rev.reviewAreaKey || "pharmacognosy"}?assignmentId=${rev.assignmentId}`}
                      className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                        action.primary
                          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-700/20"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
                      }`}
                    >
                      <span>{action.label}</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

