"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileCheck2,
  Clock3,
  AlertTriangle,
  CheckCircle2,
  Search,
  ArrowRight,
  SlidersHorizontal,
  ShieldCheck,
  Sprout,
  UserCheck,
  X,
  Check,
  Loader2,
} from "lucide-react";
import { EXPERT_REVIEW_AREAS, type ExpertReviewAreaKey } from "@/lib/expert-review-areas";
import { useReviewerProject } from "@/context/ReviewerProjectContext";
import { useLiveDisplayName } from "@/hooks/useLiveDisplayName";

interface SpecialtyBadge {
  areaKey: ExpertReviewAreaKey;
  label: string;
  status?: "Pending" | "In Review" | "Revision Required" | "Approved";
}

interface ResearchRow {
  projectId: number;
  submissionId: number;
  title: string;
  plantName: string;
  plantScientificName: string;
  researcherName: string;
  versionTag: string;
  reviewRound: number;
  assignedSpecialties: SpecialtyBadge[];
  allSpecialties: Array<{
    areaKey: ExpertReviewAreaKey;
    order: number;
    label: string;
    shortLabel: string;
    status: "Pending" | "In Review" | "Revision Required" | "Approved";
    rawStatus: string;
    isAssignedToMe: boolean;
    assignmentId: number | null;
  }>;
  reviewStatus: "Pending" | "In Review" | "Revision Required" | "Approved";
  lastUpdated: string;
  isLocked: boolean;
}

interface Props {
  user: {
    id: number;
    name: string;
    email: string;
  };
  profile: any;
  initialAssignedSpecialties: SpecialtyBadge[];
  metrics: {
    assignedResearch: number;
    pendingReviews: number;
    revisionsRequested: number;
    completedReviews: number;
  };
  initialResearchList: ResearchRow[];
}

function getReviewStatusBadge(status: "Pending" | "In Review" | "Revision Required" | "Approved") {
  switch (status) {
    case "Approved":
      return {
        label: "Approved",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dotColor: "bg-emerald-500",
      };
    case "Revision Required":
      return {
        label: "Revision Required",
        className: "bg-amber-50 text-amber-800 border-amber-200",
        dotColor: "bg-amber-500",
      };
    case "In Review":
      return {
        label: "In Review",
        className: "bg-sky-50 text-sky-700 border-sky-200",
        dotColor: "bg-sky-500",
      };
    case "Pending":
    default:
      return {
        label: "Pending",
        className: "bg-slate-100 text-slate-700 border-slate-200",
        dotColor: "bg-slate-400",
      };
  }
}

function formatShortDate(dateStr?: string) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return "—";
  }
}

export default function ReviewerDashboardClient({
  user,
  profile,
  initialAssignedSpecialties,
  metrics: initialMetrics,
  initialResearchList,
}: Props) {
  const router = useRouter();
  const { setActiveProject } = useReviewerProject();
  const { name: liveName, firstName: liveFirstName } = useLiveDisplayName(user?.name || "");
  const welcomeName = liveFirstName || liveName || user?.name || "Reviewer";

  const [assignedSpecialties, setAssignedSpecialties] = useState<SpecialtyBadge[]>(
    initialAssignedSpecialties
  );
  const [researchList, setResearchList] = useState<ResearchRow[]>(initialResearchList);
  const [metrics, setMetrics] = useState(initialMetrics);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Specialty assignment modal state
  const [showSpecialtyModal, setShowSpecialtyModal] = useState(false);
  const [selectedAreaKeys, setSelectedAreaKeys] = useState<ExpertReviewAreaKey[]>(
    initialAssignedSpecialties.map((s) => s.areaKey)
  );
  const [isSavingSpecialties, setIsSavingSpecialties] = useState(false);
  const [specialtyMessage, setSpecialtyMessage] = useState<string | null>(null);

  const filteredList = useMemo(() => {
    return researchList.filter((item) => {
      if (statusFilter === "PENDING" && item.reviewStatus !== "Pending" && item.reviewStatus !== "In Review") {
        return false;
      }
      if (statusFilter === "REVISION_REQUIRED" && item.reviewStatus !== "Revision Required") {
        return false;
      }
      if (statusFilter === "APPROVED" && item.reviewStatus !== "Approved") {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(q);
        const matchesPlant =
          item.plantName?.toLowerCase().includes(q) ||
          item.plantScientificName?.toLowerCase().includes(q);
        const matchesResearcher = item.researcherName?.toLowerCase().includes(q);
        const matchesSpecialty = item.assignedSpecialties.some((s) =>
          s.label.toLowerCase().includes(q)
        );
        return matchesTitle || matchesPlant || matchesResearcher || matchesSpecialty;
      }

      return true;
    });
  }, [researchList, statusFilter, searchQuery]);

  const handleToggleSpecialty = (key: ExpertReviewAreaKey) => {
    setSelectedAreaKeys((prev) => {
      if (prev.includes(key)) {
        if (prev.length <= 1) return prev; // keep at least 1 specialty
        return prev.filter((k) => k !== key);
      }
      return [...prev, key];
    });
  };

  const handleSaveSpecialties = async () => {
    setIsSavingSpecialties(true);
    setSpecialtyMessage(null);
    try {
      const res = await fetch("/api/reviewer/specialties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialties: selectedAreaKeys }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update specialties");

      // Refresh dashboard data
      const dashRes = await fetch("/api/reviewer/dashboard");
      const dashData = await dashRes.json();
      if (dashRes.ok && dashData.success) {
        setAssignedSpecialties(dashData.assignedSpecialties);
        setResearchList(dashData.researchList);
        setMetrics(dashData.metrics);
      }
      setShowSpecialtyModal(false);
      router.refresh();
    } catch (err: any) {
      setSpecialtyMessage(err.message || "Error saving specialties");
    } finally {
      setIsSavingSpecialties(false);
    }
  };

  const handleOpenReview = (row: ResearchRow, preferredSpecialty?: string) => {
    setActiveProject({
      id: row.projectId,
      title: row.title,
      plantName: row.plantName,
      plantScientificName: row.plantScientificName,
      stages: row.allSpecialties.map((s) => ({
        stageNumber: s.order,
        stageKey: s.areaKey,
        status: s.rawStatus,
        statusLabel: s.status,
      })),
    });

    const firstSpecialty =
      preferredSpecialty || row.assignedSpecialties[0]?.areaKey || "pharmacognosy";
    router.push(`/reviewer/projects/${row.projectId}?tab=section1&specialty=${firstSpecialty}`);
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto space-y-4 pb-12 text-slate-800">
      {/* 1. Compact navy hero */}
      <div className="relative w-full overflow-hidden rounded-2xl border border-blue-500/20 bg-[linear-gradient(120deg,#071930_0%,#0b2447_48%,#0f3460_100%)] px-4 py-3.5 text-white shadow-[0_12px_28px_-18px_rgba(7,25,48,0.55)] sm:px-5">
        <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-14 left-1/4 h-28 w-28 rounded-full bg-sky-300/10 blur-3xl" />
        <div className="relative flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-blue-200">
                <ShieldCheck className="h-3 w-3 text-blue-300" />
                Review Workbench
              </span>
              {profile?.professionalTitle && (
                <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-blue-100/80">
                  {profile.professionalTitle}
                </span>
              )}
            </div>
            <h1 className="mt-1.5 text-lg font-semibold tracking-tight text-white sm:text-xl">
              Welcome back, {welcomeName}
            </h1>
            <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-blue-100/75">
              Multidisciplinary peer review across assigned scientific dossiers.
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <button
              type="button"
              onClick={() => {
                setSelectedAreaKeys(assignedSpecialties.map((s) => s.areaKey));
                setSpecialtyMessage(null);
                setShowSpecialtyModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-400/30 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-100 transition hover:bg-blue-500/20 cursor-pointer"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Assign Specialties ({assignedSpecialties.length})
            </button>
            <div className="flex flex-wrap items-center gap-1.5">
              {EXPERT_REVIEW_AREAS.map((area) => {
                const isAssigned = assignedSpecialties.some((s) => s.areaKey === area.key);
                if (!isAssigned) return null;
                return (
                  <span
                    key={area.key}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-blue-50"
                  >
                    <span className="font-mono text-[10px] font-bold text-blue-300">0{area.order}</span>
                    <span>{area.label}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Compact KPI metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => setStatusFilter("ALL")}
          className={`group relative overflow-hidden rounded-2xl border text-left transition-all cursor-pointer p-3.5 shadow-[0_1px_2px_rgba(7,25,48,0.04)] ${
            statusFilter === "ALL"
              ? "border-blue-500 bg-gradient-to-br from-blue-50/80 to-white ring-2 ring-blue-500/10"
              : "border-slate-200 bg-gradient-to-br from-slate-50/50 to-white hover:border-slate-300"
          }`}
        >
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-gradient-to-r from-blue-400 to-blue-600" />
          <div className="relative flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Assigned</p>
              <p className="mt-1.5 text-2xl font-semibold tabular-nums text-slate-900 sm:text-[1.7rem]">
                {metrics.assignedResearch}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">Active dossiers</p>
            </div>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <FileCheck2 className="h-3.5 w-3.5" />
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("PENDING")}
          className={`group relative overflow-hidden rounded-2xl border text-left transition-all cursor-pointer p-3.5 shadow-[0_1px_2px_rgba(7,25,48,0.04)] ${
            statusFilter === "PENDING"
              ? "border-sky-500 bg-gradient-to-br from-sky-50/80 to-white ring-2 ring-sky-500/10"
              : "border-slate-200 bg-gradient-to-br from-slate-50/50 to-white hover:border-slate-300"
          }`}
        >
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-gradient-to-r from-sky-400 to-sky-600" />
          <div className="relative flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Pending</p>
              <p className="mt-1.5 text-2xl font-semibold tabular-nums text-slate-900 sm:text-[1.7rem]">
                {metrics.pendingReviews}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">In progress</p>
            </div>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <Clock3 className="h-3.5 w-3.5" />
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("REVISION_REQUIRED")}
          className={`group relative overflow-hidden rounded-2xl border text-left transition-all cursor-pointer p-3.5 shadow-[0_1px_2px_rgba(7,25,48,0.04)] ${
            statusFilter === "REVISION_REQUIRED"
              ? "border-amber-500 bg-gradient-to-br from-amber-50/80 to-white ring-2 ring-amber-500/10"
              : "border-slate-200 bg-gradient-to-br from-slate-50/50 to-white hover:border-slate-300"
          }`}
        >
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-gradient-to-r from-amber-400 to-amber-600" />
          <div className="relative flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Revisions</p>
              <p className="mt-1.5 text-2xl font-semibold tabular-nums text-slate-900 sm:text-[1.7rem]">
                {metrics.revisionsRequested}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">Returned</p>
            </div>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="h-3.5 w-3.5" />
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("APPROVED")}
          className={`group relative overflow-hidden rounded-2xl border text-left transition-all cursor-pointer p-3.5 shadow-[0_1px_2px_rgba(7,25,48,0.04)] ${
            statusFilter === "APPROVED"
              ? "border-emerald-500 bg-gradient-to-br from-emerald-50/80 to-white ring-2 ring-emerald-500/10"
              : "border-slate-200 bg-gradient-to-br from-slate-50/50 to-white hover:border-slate-300"
          }`}
        >
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-gradient-to-r from-emerald-400 to-emerald-600" />
          <div className="relative flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Completed</p>
              <p className="mt-1.5 text-2xl font-semibold tabular-nums text-slate-900 sm:text-[1.7rem]">
                {metrics.completedReviews}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">Approved</p>
            </div>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </span>
          </div>
        </button>
      </div>

      {/* 3. COMPACT RESEARCH LIST */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-slate-200/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-600" />
            <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">
              Assigned submissions
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, plant, researcher..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800"
              />
            </div>
            {statusFilter !== "ALL" && (
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {filteredList.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-700">No matching research submissions found</p>
            <p className="text-xs text-slate-500">
              Submitted research projects from the Researcher Workspace will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-5">Research Title</th>
                  <th className="py-3 px-4">Plant Name</th>
                  <th className="py-3 px-4">Researcher</th>
                  <th className="py-3 px-4">Assigned Specialty</th>
                  <th className="py-3 px-4">Review Status</th>
                  <th className="py-3 px-4">Last Updated</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 text-xs">
                {filteredList.map((row) => {
                  const statusBadge = getReviewStatusBadge(row.reviewStatus);
                  return (
                    <tr
                      key={row.submissionId}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Research Title */}
                      <td className="py-3.5 px-5 max-w-[280px]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 leading-snug">
                            {row.title}
                          </span>
                          <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200/70">
                            {row.versionTag}
                          </span>
                        </div>
                      </td>

                      {/* Plant Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <Sprout className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <div>
                            <p className="font-semibold text-slate-800">{row.plantName}</p>
                            {row.plantScientificName && (
                              <p className="text-[11px] italic font-serif text-slate-500">
                                {row.plantScientificName}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Researcher */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-700">{row.researcherName}</span>
                      </td>

                      {/* Assigned Specialty */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[290px]">
                          {row.assignedSpecialties.map((spec) => {
                            const specBadge = getReviewStatusBadge(spec.status || "Pending");
                            return (
                              <button
                                key={spec.areaKey}
                                type="button"
                                onClick={() => handleOpenReview(row, spec.areaKey)}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200/90 hover:border-blue-200 transition-colors cursor-pointer"
                                title={`Open ${spec.label} Review (${spec.status || "Pending"})`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${specBadge.dotColor}`} />
                                <span>{spec.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </td>

                      {/* Review Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusBadge.className}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dotColor}`} />
                          {statusBadge.label}
                        </span>
                      </td>

                      {/* Last Updated */}
                      <td suppressHydrationWarning className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatShortDate(row.lastUpdated)}
                      </td>

                      {/* Open Review Action */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenReview(row)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-colors cursor-pointer"
                        >
                          <span>Open Review</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. SPECIALTY ASSIGNMENT MODAL (Single or Multiple Specialties per Reviewer Account) */}
      {showSpecialtyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Assign Reviewer Specialties ({user.name})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSpecialtyModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Assign one or multiple professional review specialties to this qualified reviewer account. All assigned specialties appear within the same account without separate logins.
              </p>

              <div className="space-y-2">
                {EXPERT_REVIEW_AREAS.map((area) => {
                  const isSelected = selectedAreaKeys.includes(area.key);
                  return (
                    <button
                      key={area.key}
                      type="button"
                      onClick={() => handleToggleSpecialty(area.key)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? "bg-blue-50/60 border-blue-500 text-slate-900"
                          : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-600">
                            0{area.order}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            {area.label}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            — {area.professionTitle}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 pl-6">{area.detail}</p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${
                          isSelected
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {specialtyMessage && (
                <p className="text-xs font-medium text-rose-600">{specialtyMessage}</p>
              )}
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() =>
                  setSelectedAreaKeys(EXPERT_REVIEW_AREAS.map((a) => a.key))
                }
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                Select All 3 Roles
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSpecialtyModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSavingSpecialties}
                  onClick={handleSaveSpecialties}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isSavingSpecialties && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Specialties</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
