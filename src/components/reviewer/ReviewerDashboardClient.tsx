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
    <div className="w-full max-w-[1440px] mx-auto space-y-6 pb-12">
      {/* 1. COMPACT DASHBOARD HEADER */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                Professional Reviewer Platform
              </span>
              {profile?.professionalTitle && (
                <span className="text-xs font-medium text-slate-500">
                  {profile.professionalTitle}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Reviewer Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Signed in as <span className="font-semibold text-slate-800">{user.name}</span> — Reviewing assigned multidisciplinary research submissions.
            </p>
          </div>

          {/* Assigned Specialties Display & Admin/Role Assignment Trigger */}
          <div className="flex flex-col sm:items-end gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Assigned Specialties ({assignedSpecialties.length})
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedAreaKeys(assignedSpecialties.map((s) => s.areaKey));
                  setSpecialtyMessage(null);
                  setShowSpecialtyModal(true);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-3 h-3" />
                Assign Specialties
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {EXPERT_REVIEW_AREAS.map((area) => {
                const isAssigned = assignedSpecialties.some((s) => s.areaKey === area.key);
                if (!isAssigned) return null;
                return (
                  <span
                    key={area.key}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 text-white shadow-2xs"
                  >
                    <span className="text-[10px] font-mono text-indigo-300 font-bold">
                      0{area.order}
                    </span>
                    <span>{area.label}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. FOUR COMPACT METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <button
          type="button"
          onClick={() => setStatusFilter("ALL")}
          className={`text-left p-4 sm:p-5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === "ALL"
              ? "bg-white border-indigo-500 ring-2 ring-indigo-500/10 shadow-xs"
              : "bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Assigned Research</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {metrics.assignedResearch}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">Total active research dossiers</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("PENDING")}
          className={`text-left p-4 sm:p-5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === "PENDING"
              ? "bg-white border-sky-500 ring-2 ring-sky-500/10 shadow-xs"
              : "bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending Reviews</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Clock3 className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {metrics.pendingReviews}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">Awaiting review or in progress</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("REVISION_REQUIRED")}
          className={`text-left p-4 sm:p-5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === "REVISION_REQUIRED"
              ? "bg-white border-amber-500 ring-2 ring-amber-500/10 shadow-xs"
              : "bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Revisions Requested</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {metrics.revisionsRequested}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">Returned for researcher revision</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("APPROVED")}
          className={`text-left p-4 sm:p-5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === "APPROVED"
              ? "bg-white border-emerald-500 ring-2 ring-emerald-500/10 shadow-xs"
              : "bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Completed Reviews</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {metrics.completedReviews}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">Approved across assigned areas</p>
        </button>
      </div>

      {/* 3. COMPACT RESEARCH LIST */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Assigned Research Submissions</h2>
            <p className="text-xs text-slate-500">
              Select a research project to open the multidisciplinary Review Workspace.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, plant, researcher..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-800"
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
                          <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
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
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200/90 hover:border-indigo-200 transition-colors cursor-pointer"
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors cursor-pointer"
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
                <UserCheck className="w-4 h-4 text-indigo-600" />
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
                          ? "bg-indigo-50/60 border-indigo-500 text-slate-900"
                          : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-600">
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
                            ? "bg-indigo-600 border-indigo-600 text-white"
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
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
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
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors cursor-pointer"
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
