"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquareWarning,
  Sparkles,
  ArrowRight,
  Filter,
  Search,
  Send,
  Loader2,
  FileCheck2,
  ShieldAlert,
  ShieldCheck,
  Leaf,
  Layers,
  ChevronRight,
  RefreshCw,
  Check,
} from "lucide-react";

interface ProjectItem {
  id: number;
  title: string;
  plantName: string;
  plantScientificName?: string;
  status: string;
  currentStage?: number;
  progressPercent?: number;
  totalFeedback: number;
  openFeedback: number;
}

interface RevisionItem {
  id: number;
  projectId: number;
  projectTitle: string;
  plantName: string;
  plantScientificName?: string;
  reviewerDisplayName?: string;
  reviewerRole?: string;
  sectionName: string;
  title: string;
  comment: string;
  recommendation?: string;
  commentType: string;
  severity: "CRITICAL" | "MAJOR" | "MINOR" | "INFORMATIONAL";
  status: "OPEN" | "ADDRESSED" | "RESOLVED";
  researcherReply?: string | null;
  researcherRepliedAt?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  navPath: string;
}

interface RevisionStats {
  total: number;
  open: number;
  addressed: number;
  resolved: number;
}

export default function ResearcherRevisionsHubClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get("projectId")
    ? parseInt(searchParams.get("projectId")!, 10)
    : null;

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [revisions, setRevisions] = useState<RevisionItem[]>([]);
  const [stats, setStats] = useState<RevisionStats>({
    total: 0,
    open: 0,
    addressed: 0,
    resolved: 0,
  });

  // Filter states
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(initialProjectId);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchRevisions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const url = new URL("/api/researcher/revisions", window.location.origin);
      if (selectedProjectId) {
        url.searchParams.set("projectId", String(selectedProjectId));
      }
      if (filterStatus !== "ALL") {
        url.searchParams.set("status", filterStatus);
      }

      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error(`Failed to load revisions: HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to load revisions data.");
      }

      setProjects(data.projects || []);
      setRevisions(data.revisions || []);
      setStats(data.stats || { total: 0, open: 0, addressed: 0, resolved: 0 });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load revision data.");
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, filterStatus]);

  useEffect(() => {
    fetchRevisions();

    const handleSync = () => fetchRevisions();
    window.addEventListener("natureaide:review-updated", handleSync);
    window.addEventListener("natureaide:revisions-updated", handleSync);
    return () => {
      window.removeEventListener("natureaide:review-updated", handleSync);
      window.removeEventListener("natureaide:revisions-updated", handleSync);
    };
  }, [fetchRevisions]);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtered list based on search and severity
  const filteredRevisions = revisions.filter((item) => {
    if (filterSeverity !== "ALL" && item.severity !== filterSeverity) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchComment = item.comment.toLowerCase().includes(q);
      const matchSection = item.sectionName.toLowerCase().includes(q);
      const matchProject = item.projectTitle.toLowerCase().includes(q);
      const matchPlant = item.plantName.toLowerCase().includes(q);
      if (!matchTitle && !matchComment && !matchSection && !matchProject && !matchPlant) {
        return false;
      }
    }
    return true;
  });

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "CRITICAL":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
            Critical Blocker
          </span>
        );
      case "MAJOR":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
            Major Revision
          </span>
        );
      case "MINOR":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold uppercase tracking-wider bg-yellow-50 text-yellow-800 border border-yellow-200">
            Minor Correction
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold uppercase tracking-wider bg-sky-50 text-sky-800 border border-sky-200">
            Informational Note
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-800 border border-amber-400">
            <Clock className="w-3 h-3 text-amber-600" />
            Action Required
          </span>
        );
      case "ADDRESSED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/15 text-teal-800 border border-teal-400">
            <Check className="w-3 h-3 text-teal-600" />
            Addressed by Researcher
          </span>
        );
      case "RESOLVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-800 border border-emerald-400">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Resolved &amp; Approved
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faf9] text-slate-800 pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs font-bold transition-all ${
            toastMessage.type === "success"
              ? "bg-emerald-600 text-white border-emerald-700"
              : "bg-rose-600 text-white border-rose-700"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-white shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TOP BANNER & METRICS                                                  */}
      {/* ===================================================================== */}
      <div className="bg-gradient-to-r from-[#092218] via-[#0f3424] to-[#0b271b] text-white border-b border-emerald-900/60 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10.5px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                  <MessageSquareWarning className="w-3 h-3 text-amber-400" />
                  Peer Review Revisions Console
                </span>
                <span className="text-xs text-emerald-300 font-mono">Researcher Mode</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-white">
                Review Feedback &amp; Required Revisions
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl leading-relaxed">
                Review scientific observations, critical findings, and required revisions submitted by multidisciplinary reviewers. Directly document your resolutions, jump to specific research steps, and notify reviewers in real-time.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={fetchRevisions}
                disabled={loading}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Sync Revisions</span>
              </button>
            </div>
          </div>

          {/* METRICS CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
              <span className="text-[10.5px] font-bold text-emerald-200 uppercase tracking-wider block">
                Total Feedback
              </span>
              <span className="font-mono text-2xl sm:text-3xl font-black text-white block mt-1">
                {stats.total}
              </span>
              <span className="text-[10px] text-emerald-300/80 mt-0.5 block">
                Across all research projects
              </span>
            </div>

            <div className="bg-amber-500/15 backdrop-blur-md rounded-2xl p-4 border border-amber-400/30">
              <span className="text-[10.5px] font-bold text-amber-300 uppercase tracking-wider block">
                Action Required
              </span>
              <span className="font-mono text-2xl sm:text-3xl font-black text-amber-200 block mt-1">
                {stats.open}
              </span>
              <span className="text-[10px] text-amber-300/80 mt-0.5 block">
                Requires researcher response
              </span>
            </div>

            <div className="bg-teal-500/15 backdrop-blur-md rounded-2xl p-4 border border-teal-400/30">
              <span className="text-[10.5px] font-bold text-teal-300 uppercase tracking-wider block">
                Addressed
              </span>
              <span className="font-mono text-2xl sm:text-3xl font-black text-teal-200 block mt-1">
                {stats.addressed}
              </span>
              <span className="text-[10px] text-teal-300/80 mt-0.5 block">
                Pending reviewer sign-off
              </span>
            </div>

            <div className="bg-emerald-500/15 backdrop-blur-md rounded-2xl p-4 border border-emerald-400/30">
              <span className="text-[10.5px] font-bold text-emerald-300 uppercase tracking-wider block">
                Resolved &amp; Approved
              </span>
              <span className="font-mono text-2xl sm:text-3xl font-black text-emerald-200 block mt-1">
                {stats.resolved}
              </span>
              <span className="text-[10px] text-emerald-300/80 mt-0.5 block">
                Reviewer certified
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MAIN CONTENT AREA                                                     */}
      {/* ===================================================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* FILTER & SEARCH TOOLBAR */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Project Selector */}
            <div className="flex-1 max-w-md space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Filter by Research Project:
              </label>
              <select
                value={selectedProjectId || ""}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value, 10) : null;
                  setSelectedProjectId(val);
                }}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">All Research Projects ({projects.length})</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} · {p.plantName} ({p.openFeedback} open action{p.openFeedback === 1 ? "" : "s"})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setFilterStatus("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  filterStatus === "ALL"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All Status ({stats.total})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("OPEN")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  filterStatus === "OPEN"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                }`}
              >
                Action Required ({stats.open})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("ADDRESSED")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  filterStatus === "ADDRESSED"
                    ? "bg-teal-700 text-white shadow-xs"
                    : "bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200"
                }`}
              >
                Addressed ({stats.addressed})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("RESOLVED")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  filterStatus === "RESOLVED"
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                }`}
              >
                Resolved ({stats.resolved})
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search findings by step name, title, keywords..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
              />
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Severity:</span>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical Only</option>
                <option value="MAJOR">Major Only</option>
                <option value="MINOR">Minor Only</option>
                <option value="INFORMATIONAL">Informational Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-xs font-semibold text-slate-600">Loading revisions &amp; review feedback...</p>
          </div>
        )}

        {/* ERROR STATE */}
        {!loading && error && (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>Failed to load revisions</span>
            </div>
            <p className="text-xs">{error}</p>
            <button
              type="button"
              onClick={fetchRevisions}
              className="mt-2 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && filteredRevisions.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-2xs">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-heading font-extrabold text-slate-900">
                No Pending Revisions Found
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {filterStatus !== "ALL" || filterSeverity !== "ALL" || searchQuery
                  ? "No revisions match your current filter settings. Try clearing your filters."
                  : "All scientific stages comply with quality standards! When reviewers submit comments or revision requirements, they will appear here immediately."}
              </p>
            </div>
            {(filterStatus !== "ALL" || filterSeverity !== "ALL" || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setFilterStatus("ALL");
                  setFilterSeverity("ALL");
                  setSearchQuery("");
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* REVISIONS LIST */}
        {!loading && !error && filteredRevisions.length > 0 && (
          <div className="space-y-5">
            {filteredRevisions.map((item) => {
              const isResolved = item.status === "RESOLVED";
              const isAddressed = item.status === "ADDRESSED";
              const isOpen = item.status === "OPEN";

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                    isOpen
                      ? "border-amber-300 shadow-md ring-1 ring-amber-400/20"
                      : isAddressed
                      ? "border-teal-200 shadow-xs"
                      : "border-slate-200 opacity-90"
                  }`}
                >
                  {/* Card Header Bar */}
                  <div
                    className={`px-5 py-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isOpen
                        ? "bg-amber-50/70 border-amber-200"
                        : isAddressed
                        ? "bg-teal-50/50 border-teal-100"
                        : "bg-slate-50 border-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-bold text-xs text-slate-900">
                        {item.sectionName}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs font-medium text-emerald-800 flex items-center gap-1">
                        <Leaf className="w-3 h-3 text-emerald-600" />
                        {item.plantName}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-500">
                        {item.projectTitle}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {getSeverityBadge(item.severity)}
                      {getStatusBadge(item.status)}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 sm:p-6 space-y-4">
                    {(() => {
                      let displayTitle = item.title || "Review Finding";
                      if (displayTitle.includes(":")) {
                        const parts = displayTitle.split(":");
                        const rest = parts.slice(1).join(":").trim();
                        if (rest.toLowerCase() === (item.comment || "").trim().toLowerCase()) {
                          displayTitle = parts[0].trim();
                        }
                      }

                      const showDistinctRecommendation =
                        item.recommendation &&
                        item.recommendation.trim().toLowerCase() !== (item.comment || "").trim().toLowerCase();

                      return (
                        <>
                          {/* Finding Title & Reviewer Note */}
                          <div className="space-y-1.5">
                            <h4 className="font-heading font-extrabold text-base text-slate-900 tracking-tight">
                              {displayTitle}
                            </h4>
                            <p className="text-xs text-slate-800 font-medium leading-relaxed whitespace-pre-line bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                              {item.comment}
                            </p>
                          </div>

                          {/* Actionable Requirement / Resolution Instructions */}
                          {showDistinctRecommendation && (
                            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-1">
                              <span className="text-[10.5px] font-bold text-amber-900 uppercase tracking-wider block">
                                Required Resolution Action:
                              </span>
                              <p className="text-xs text-amber-950 leading-relaxed font-medium whitespace-pre-line">
                                {item.recommendation}
                              </p>
                            </div>
                          )}
                        </>
                      );
                    })()}

                    {/* Existing Researcher Resolution Response (if addressed or resolved) */}
                    {item.researcherReply && (
                      <div className="p-4 rounded-xl bg-teal-50 border border-teal-200/90 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-teal-900 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-teal-600" />
                            <span>Researcher Resolution &amp; Implementation Note:</span>
                          </span>
                          {item.researcherRepliedAt && (
                            <span className="text-[10.5px] text-teal-700 font-mono">
                              {new Date(item.researcherRepliedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-teal-950 font-medium leading-relaxed whitespace-pre-line">
                          {item.researcherReply}
                        </p>
                      </div>
                    )}

                    {/* RESOLVED BANNER */}
                    {isResolved && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs font-semibold text-emerald-900">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>This finding has been certified and resolved by the scientific reviewer.</span>
                      </div>
                    )}

                    {/* Footer: Single Green Action Button to Open Step in Workspace */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>
                          Evaluated by: <strong className="text-slate-700">{item.reviewerDisplayName || "Multidisciplinary Reviewer"}</strong>
                        </span>
                        <span>•</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>

                      <Link
                        href={item.navPath}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs hover:shadow-sm cursor-pointer active:scale-95"
                      >
                        <span>Open Revision in Step Workspace</span>
                        <ArrowRight className="w-4 h-4 text-emerald-100" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

