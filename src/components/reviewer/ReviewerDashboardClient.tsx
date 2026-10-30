"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Clock,
  FileCheck2,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Leaf,
  ShieldCheck,
  AlertTriangle,
  History,
  Activity,
  Search,
  Filter,
  UserCheck,
  AlertCircle,
  FileText,
  Library,
  Stethoscope,
  Microscope,
  Building2,
  Calendar,
  Lock,
} from "lucide-react";

export interface ReviewAssignmentItem {
  assignmentId: number;
  submissionId: number;
  projectId: number;
  status: "PENDING" | "IN_REVIEW" | "REVISION_REQUIRED" | "RESUBMITTED" | "COMPLETED";
  specialtyNeeded: string;
  reviewRound: number;
  assignedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  projectTitle: string;
  plantName: string;
  plantScientificName: string | null;
  researcherName: string;
  researcherEmail: string;
  versionTag: string;
  submittedAt: string;
  messageToReviewers: string | null;
  highPriorityConcernsCount: number;
  snapshotData?: any;
}

export interface ReviewerProfile {
  specialty: string;
  verificationStatus: "VERIFIED" | "PENDING_VERIFICATION" | "SUSPENDED";
  professionalTitle: string;
  institution: string;
  licenseNumber?: string;
  areasOfExpertise?: string;
}

export interface ReviewerDashboardProps {
  reviewerName: string;
  reviewerProfile: ReviewerProfile;
  stats: {
    assignedCount: number;
    newSubmissionsCount: number;
    inReviewCount: number;
    needsRevisionCount: number;
    completedCount: number;
  };
  assignments: ReviewAssignmentItem[];
  recentActivities: {
    actionType: string;
    description: string;
    createdAt: string;
  }[];
}

export default function ReviewerDashboardClient({
  reviewerName,
  reviewerProfile,
  stats,
  assignments,
  recentActivities,
}: ReviewerDashboardProps) {
  // Tab state: ALL | NEW | IN_REVIEW | REVISION_RETURNED | COMPLETED
  const [activeTab, setActiveTab] = useState<"ALL" | "NEW" | "IN_REVIEW" | "REVISION_RETURNED" | "COMPLETED">("ALL");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState<"NEWEST" | "OLDEST">("NEWEST");
  const [safetyFilter, setSafetyFilter] = useState<"ALL" | "HAS_CONCERNS" | "STANDARD">("ALL");

  const isVerified = reviewerProfile.verificationStatus === "VERIFIED";
  const isPending = reviewerProfile.verificationStatus === "PENDING_VERIFICATION";
  const isSuspended = reviewerProfile.verificationStatus === "SUSPENDED";

  // Filter & Search logic
  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      // Tab filter
      if (activeTab === "NEW") {
        if (item.status !== "PENDING") return false;
      } else if (activeTab === "IN_REVIEW") {
        if (item.status !== "IN_REVIEW") return false;
      } else if (activeTab === "REVISION_RETURNED") {
        if (item.status !== "REVISION_REQUIRED" && item.status !== "RESUBMITTED") return false;
      } else if (activeTab === "COMPLETED") {
        if (item.status !== "COMPLETED") return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesProject = item.projectTitle?.toLowerCase().includes(q);
        const matchesPlant =
          item.plantName?.toLowerCase().includes(q) ||
          item.plantScientificName?.toLowerCase().includes(q);
        const matchesResearcher = item.researcherName?.toLowerCase().includes(q);
        if (!matchesProject && !matchesPlant && !matchesResearcher) return false;
      }

      // Specialty relevance
      if (specialtyFilter === "MY_SPECIALTY") {
        if (item.specialtyNeeded !== reviewerProfile.specialty) return false;
      }

      // Safety concern filter
      if (safetyFilter === "HAS_CONCERNS") {
        if (item.highPriorityConcernsCount === 0) return false;
      } else if (safetyFilter === "STANDARD") {
        if (item.highPriorityConcernsCount > 0) return false;
      }

      return true;
    }).sort((a, b) => {
      const timeA = new Date(a.assignedAt || a.submittedAt).getTime();
      const timeB = new Date(b.assignedAt || b.submittedAt).getTime();
      return sortOrder === "NEWEST" ? timeB - timeA : timeA - timeB;
    });
  }, [assignments, activeTab, searchQuery, specialtyFilter, sortOrder, safetyFilter, reviewerProfile.specialty]);

  return (
    <div className="space-y-8">
      {/* VERIFICATION NOTICE BANNER */}
      {isPending && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block text-amber-900">
              Reviewer Credentials Pending Verification
            </span>
            <p className="text-[11px] text-amber-900/90 leading-relaxed">
              Your professional reviewer profile is currently pending verification by the NaturAide Medical Oversight Board. You may inspect assigned research dossiers, but official review decisions remain locked until verification is confirmed.
            </p>
          </div>
        </div>
      )}

      {isSuspended && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block text-rose-900">
              Review Privileges Suspended
            </span>
            <p className="text-[11px] text-rose-900/90 leading-relaxed">
              Your professional reviewer privileges have been suspended. Please contact the NaturAide Scientific Support team for assistance.
            </p>
          </div>
        </div>
      )}

      {/* HEADER BANNER */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#092218] to-[#123e2d] text-white space-y-4 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-400/10 to-transparent pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-teal-400/20 text-teal-200 border border-teal-400/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
                <span>Specialty: {reviewerProfile.specialty.replace(/_/g, " ")}</span>
              </span>

              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  isVerified
                    ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
                    : "bg-amber-400/20 text-amber-200 border border-amber-400/30"
                }`}
              >
                {reviewerProfile.verificationStatus.replace(/_/g, " ")}
              </span>

              <span className="text-xs text-teal-200/80 font-medium">
                {reviewerProfile.institution}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-white">
              Professional Review Workspace
            </h1>
            <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed">
              Welcome to the Professional Review Workspace. Conduct independent clinical and pharmacological evaluations of locked research dossiers, document risk reviews, and ensure scientific integrity.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <Link
              href="/reviewer/profile"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-400 text-[#092218] hover:bg-teal-300 text-xs font-extrabold shadow-sm transition-all cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Reviewer Profile</span>
            </Link>
          </div>
        </div>
      </div>

      {/* DASHBOARD KPIS (5 REAL COUNTS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Assigned */}
        <button
          type="button"
          onClick={() => setActiveTab("ALL")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === "ALL"
              ? "bg-[#0f2c20] text-white border-[#0f2c20] shadow-sm"
              : "bg-white border-[#dde6df] hover:border-teal-500 text-[#0f2c20]"
          }`}
        >
          <div className="flex items-center justify-between pb-1">
            <span className={`text-xs font-bold ${activeTab === "ALL" ? "text-teal-200" : "text-[#78997f]"}`}>
              Assigned Reviews
            </span>
            <ClipboardList className={`w-4 h-4 ${activeTab === "ALL" ? "text-teal-300" : "text-teal-700"}`} />
          </div>
          <div className="text-2xl font-heading font-extrabold">{stats.assignedCount}</div>
          <p className={`text-[10px] mt-0.5 ${activeTab === "ALL" ? "text-teal-200/70" : "text-[#78997f]"}`}>
            Total active roster
          </p>
        </button>

        {/* New Submissions */}
        <button
          type="button"
          onClick={() => setActiveTab("NEW")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === "NEW"
              ? "bg-amber-600 text-white border-amber-600 shadow-sm"
              : "bg-white border-[#dde6df] hover:border-amber-500 text-[#0f2c20]"
          }`}
        >
          <div className="flex items-center justify-between pb-1">
            <span className={`text-xs font-bold ${activeTab === "NEW" ? "text-amber-100" : "text-[#78997f]"}`}>
              New Submissions
            </span>
            <Clock className={`w-4 h-4 ${activeTab === "NEW" ? "text-amber-200" : "text-amber-600"}`} />
          </div>
          <div className="text-2xl font-heading font-extrabold">{stats.newSubmissionsCount}</div>
          <p className={`text-[10px] mt-0.5 ${activeTab === "NEW" ? "text-amber-100/80" : "text-[#78997f]"}`}>
            Awaiting first review
          </p>
        </button>

        {/* In Review */}
        <button
          type="button"
          onClick={() => setActiveTab("IN_REVIEW")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === "IN_REVIEW"
              ? "bg-teal-700 text-white border-teal-700 shadow-sm"
              : "bg-white border-[#dde6df] hover:border-teal-500 text-[#0f2c20]"
          }`}
        >
          <div className="flex items-center justify-between pb-1">
            <span className={`text-xs font-bold ${activeTab === "IN_REVIEW" ? "text-teal-100" : "text-[#78997f]"}`}>
              In Review
            </span>
            <FileCheck2 className={`w-4 h-4 ${activeTab === "IN_REVIEW" ? "text-teal-200" : "text-teal-700"}`} />
          </div>
          <div className="text-2xl font-heading font-extrabold">{stats.inReviewCount}</div>
          <p className={`text-[10px] mt-0.5 ${activeTab === "IN_REVIEW" ? "text-teal-100/80" : "text-[#78997f]"}`}>
            Under active evaluation
          </p>
        </button>

        {/* Needs Revision */}
        <button
          type="button"
          onClick={() => setActiveTab("REVISION_RETURNED")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === "REVISION_RETURNED"
              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
              : "bg-white border-[#dde6df] hover:border-blue-500 text-[#0f2c20]"
          }`}
        >
          <div className="flex items-center justify-between pb-1">
            <span className={`text-xs font-bold ${activeTab === "REVISION_RETURNED" ? "text-blue-100" : "text-[#78997f]"}`}>
              Needs Revision
            </span>
            <RotateCcw className={`w-4 h-4 ${activeTab === "REVISION_RETURNED" ? "text-blue-200" : "text-blue-600"}`} />
          </div>
          <div className="text-2xl font-heading font-extrabold">{stats.needsRevisionCount}</div>
          <p className={`text-[10px] mt-0.5 ${activeTab === "REVISION_RETURNED" ? "text-blue-100/80" : "text-[#78997f]"}`}>
            Returned / resubmitted
          </p>
        </button>

        {/* Completed */}
        <button
          type="button"
          onClick={() => setActiveTab("COMPLETED")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === "COMPLETED"
              ? "bg-emerald-700 text-white border-emerald-700 shadow-sm"
              : "bg-white border-[#dde6df] hover:border-emerald-500 text-[#0f2c20]"
          }`}
        >
          <div className="flex items-center justify-between pb-1">
            <span className={`text-xs font-bold ${activeTab === "COMPLETED" ? "text-emerald-100" : "text-[#78997f]"}`}>
              Completed
            </span>
            <CheckCircle2 className={`w-4 h-4 ${activeTab === "COMPLETED" ? "text-emerald-200" : "text-emerald-600"}`} />
          </div>
          <div className="text-2xl font-heading font-extrabold">{stats.completedCount}</div>
          <p className={`text-[10px] mt-0.5 ${activeTab === "COMPLETED" ? "text-emerald-100/80" : "text-[#78997f]"}`}>
            Accepted for next stage
          </p>
        </button>
      </div>

      {/* PRIMARY SECTION: ASSIGNED REVIEWS */}
      <div className="p-6 rounded-3xl bg-white border border-[#dde6df] space-y-6 shadow-sm">
        {/* TABS & SEARCH/FILTERS */}
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#edf2ee]">
            <div>
              <h2 className="text-base font-heading font-extrabold text-[#0f2c20] flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-teal-700" />
                <span>Assigned Research Reviews</span>
              </h2>
              <p className="text-xs text-[#78997f]">
                Independent peer evaluations assigned to your clinical / pharmacological portfolio.
              </p>
            </div>

            {/* Interactive Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-[#faf9f5] border border-[#dde6df] text-xs font-bold">
              {[
                { id: "ALL", label: "All" },
                { id: "NEW", label: "New" },
                { id: "IN_REVIEW", label: "In Review" },
                { id: "REVISION_RETURNED", label: "Revision Returned" },
                { id: "COMPLETED", label: "Completed" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-[#0f2c20] text-white shadow-2xs"
                      : "text-[#475550] hover:text-[#0f2c20] hover:bg-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar & 3 Filter Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#78997f] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search project, plant, researcher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#dde6df] bg-[#faf9f5] text-xs text-[#0f2c20] outline-none placeholder:text-[#78997f]"
              />
            </div>

            {/* Specialty Relevance */}
            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="p-2 rounded-xl border border-[#dde6df] bg-[#faf9f5] text-xs font-medium text-[#0f2c20] outline-none"
            >
              <option value="ALL">All Specialties</option>
              <option value="MY_SPECIALTY">Matching My Specialty ({reviewerProfile.specialty})</option>
            </select>

            {/* Safety Concern Level */}
            <select
              value={safetyFilter}
              onChange={(e) => setSafetyFilter(e.target.value as any)}
              className="p-2 rounded-xl border border-[#dde6df] bg-[#faf9f5] text-xs font-medium text-[#0f2c20] outline-none"
            >
              <option value="ALL">All Safety Levels</option>
              <option value="HAS_CONCERNS">⚠ High-Priority Concerns Only</option>
              <option value="STANDARD">Standard Safety Profile</option>
            </select>

            {/* Submission Date Sort */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="p-2 rounded-xl border border-[#dde6df] bg-[#faf9f5] text-xs font-medium text-[#0f2c20] outline-none"
            >
              <option value="NEWEST">Date: Newest First</option>
              <option value="OLDEST">Date: Oldest First</option>
            </select>
          </div>
        </div>

        {/* REVIEW CARDS LIST */}
        {filteredAssignments.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#78997f] space-y-2 border-2 border-dashed border-[#edf2ee] rounded-2xl">
            <FileCheck2 className="w-8 h-8 text-[#b4c8b9] mx-auto" />
            <p className="font-bold text-[#0f2c20]">No assigned reviews match your criteria</p>
            <p className="text-[11px]">
              When a researcher submits a project dossier, it will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAssignments.map((item) => {
              const isMatch = item.specialtyNeeded === reviewerProfile.specialty;

              return (
                <div
                  key={item.assignmentId}
                  className="p-5 rounded-2xl bg-[#faf9f5] border border-[#dde6df] hover:border-teal-500 hover:bg-white hover:shadow-xs transition-all space-y-3 flex flex-col justify-between group"
                >
                  <div className="space-y-2.5">
                    {/* Header tags: Plant, Status, Version */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                          <Leaf className="w-3 h-3 text-emerald-600" />
                          <span>{item.plantName}</span>
                          {item.plantScientificName && (
                            <span className="italic font-normal">({item.plantScientificName})</span>
                          )}
                        </span>

                        <span className="px-2 py-0.5 rounded-md bg-[#092218] text-teal-300 text-[10px] font-bold uppercase tracking-wider">
                          Dossier {item.versionTag}
                        </span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          item.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-950"
                            : item.status === "IN_REVIEW"
                            ? "bg-teal-100 text-teal-950"
                            : item.status === "REVISION_REQUIRED" || item.status === "RESUBMITTED"
                            ? "bg-blue-100 text-blue-950"
                            : "bg-amber-100 text-amber-950"
                        }`}
                      >
                        {item.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    {/* Project Title */}
                    <h3 className="font-heading font-extrabold text-sm text-[#0f2c20] group-hover:text-teal-900 transition-colors line-clamp-2">
                      {item.projectTitle}
                    </h3>

                    {/* Researcher & Specialty metadata */}
                    <div className="text-xs text-[#78997f] space-y-1">
                      <p>
                        Researcher: <strong className="text-[#0f2c20]">{item.researcherName}</strong>
                      </p>
                      {item.specialtyNeeded && (
                        <p className="text-[11px] flex items-center gap-1">
                          <span>Requested Panel:</span>
                          <span className="font-semibold text-[#0f2c20]">
                            {item.specialtyNeeded.replace(/_/g, " ")}
                          </span>
                          {isMatch && (
                            <span className="px-1.5 py-0.2 rounded bg-teal-100 text-teal-900 font-bold text-[9px]">
                              Direct Match
                            </span>
                          )}
                        </p>
                      )}
                    </div>

                    {/* Message to reviewers if provided */}
                    {item.messageToReviewers && (
                      <p className="text-[11px] text-[#475550] italic line-clamp-2 bg-white/80 p-2 rounded-xl border border-[#edf2ee]">
                        &quot;{item.messageToReviewers}&quot;
                      </p>
                    )}

                    {/* Real Safety Attention Flag (ONLY if actual concerns exist!) */}
                    {item.highPriorityConcernsCount > 0 && (
                      <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-[11px] font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>
                          ⚠ {item.highPriorityConcernsCount} High-Priority Safety Concern
                          {item.highPriorityConcernsCount > 1 ? "s" : ""} Flagged
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer & Action */}
                  <div className="pt-3 border-t border-[#edf2ee] flex items-center justify-between gap-2">
                    <span className="text-[10px] text-[#78997f] flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#16a34a]" />
                      <span>Submitted {new Date(item.submittedAt).toLocaleDateString()}</span>
                    </span>

                    <Link
                      href={`/reviewer/reviews/${item.submissionId}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0f2c20] hover:bg-[#1a4a37] text-white text-xs font-bold transition-all shadow-2xs group-hover:bg-teal-700 cursor-pointer"
                    >
                      <span>Review Dossier</span>
                      <ArrowRight className="w-3.5 h-3.5 text-teal-300" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2 COLUMNS: RECENT ACTIVITY (REAL LOGS) & REVIEWER QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Review Activity (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-[#dde6df] space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#edf2ee]">
            <h2 className="font-heading font-extrabold text-base text-[#0f2c20] flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-700" />
              <span>Recent Review Activity</span>
            </h2>
            <span className="text-xs text-[#78997f]">Real audit log</span>
          </div>

          {recentActivities.length === 0 ? (
            <p className="text-xs text-[#78997f] py-6 text-center">No review activity recorded yet.</p>
          ) : (
            <div className="space-y-2 text-xs">
              {recentActivities.slice(0, 5).map((a, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#faf9f5] border border-[#edf2ee]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0" />
                    <span className="font-bold text-[#0f2c20] shrink-0">{a.actionType.replace(/_/g, " ")}:</span>
                    <span className="text-[#475550] truncate">{a.description}</span>
                  </div>
                  <span className="text-[10px] text-[#78997f] shrink-0 ml-2">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions (1 Col) */}
        <div className="p-6 rounded-3xl bg-[#faf9f5] border border-[#dde6df] space-y-3 h-fit">
          <div className="flex items-center gap-2 pb-2 border-b border-[#dde6df]">
            <Building2 className="w-4 h-4 text-[#16a34a]" />
            <h3 className="font-heading font-extrabold text-xs text-[#0f2c20] uppercase tracking-wider">
              Reviewer Quick Actions
            </h3>
          </div>

          <div className="space-y-2 pt-1">
            <Link
              href="/reviewer/reviews"
              className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#dde6df] hover:border-teal-500 hover:bg-[#faf9f5] text-xs font-bold text-[#0f2c20] transition-colors"
            >
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-teal-700" />
                <span>Assigned Reviews</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#78997f]" />
            </Link>

            <Link
              href="/reviewer/evidence"
              className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#dde6df] hover:border-teal-500 hover:bg-[#faf9f5] text-xs font-bold text-[#0f2c20] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Library className="w-4 h-4 text-teal-700" />
                <span>Evidence Library</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#78997f]" />
            </Link>

            <Link
              href="/reviewer/revisions"
              className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#dde6df] hover:border-teal-500 hover:bg-[#faf9f5] text-xs font-bold text-[#0f2c20] transition-colors"
            >
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-teal-700" />
                <span>Revision Requests</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#78997f]" />
            </Link>

            <Link
              href="/reviewer/completed"
              className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#dde6df] hover:border-teal-500 hover:bg-[#faf9f5] text-xs font-bold text-[#0f2c20] transition-colors"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-700" />
                <span>Completed Reviews</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#78997f]" />
            </Link>

            <Link
              href="/reviewer/profile"
              className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#dde6df] hover:border-teal-500 hover:bg-[#faf9f5] text-xs font-bold text-[#0f2c20] transition-colors"
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-teal-700" />
                <span>Reviewer Profile</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#78997f]" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
