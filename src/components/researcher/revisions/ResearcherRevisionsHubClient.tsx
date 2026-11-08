"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
    <div className="w-full max-w-none space-y-6 pb-12 text-slate-800">
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

      {/* 1. TOP HEADER — matches My Research Projects */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative w-full overflow-hidden rounded-2xl border border-[#0f2c20]/15 bg-[linear-gradient(120deg,#0f2c20_0%,#134032_48%,#0b271b_100%)] px-4 py-3.5 text-white shadow-[0_12px_28px_-18px_rgba(15,44,32,0.55)] sm:px-5"
      >
        <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-amber-200">
                <MessageSquareWarning className="h-3 w-3 text-amber-300" />
                Revisions Console
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-100/80">
                Researcher
              </span>
            </div>
            <h1 className="mt-1.5 text-lg font-semibold tracking-tight text-white sm:text-xl">
              Review Feedback &amp; Revisions
            </h1>
            <p className="mt-0.5 text-xs text-emerald-100/75">
              Resolve reviewer findings and notify the panel.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchRevisions}
            disabled={loading}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-400 px-3.5 py-2 text-xs font-semibold text-[#091a13] shadow-sm transition hover:bg-emerald-300 active:bg-emerald-500 disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>
        </div>
      </motion.div>

      {/* 2. METRICS */}
      <div className="grid w-full grid-cols-2 gap-3 sm:gap-3.5 lg:grid-cols-4">
        {[
          {
            key: "total",
            label: "Total Feedback",
            value: stats.total,
            hint: "All projects",
            icon: MessageSquareWarning,
            surface: "bg-[linear-gradient(145deg,#f4f8f5_0%,#ffffff_45%,#eef5f1_100%)]",
            bar: "from-[#0f2c20] to-emerald-400",
            valueClass: "text-[#0f2c20]",
            iconWrap: "bg-[#0f2c20] text-emerald-200",
            glow: "bg-emerald-400/20",
          },
          {
            key: "open",
            label: "Action Required",
            value: stats.open,
            hint: "Needs response",
            icon: Clock,
            surface: "bg-[linear-gradient(145deg,#fffbeb_0%,#ffffff_45%,#fff7ed_100%)]",
            bar: "from-amber-500 to-orange-300",
            valueClass: "text-amber-900",
            iconWrap: "bg-gradient-to-br from-amber-500 to-orange-500 text-white",
            glow: "bg-amber-400/25",
          },
          {
            key: "addressed",
            label: "Addressed",
            value: stats.addressed,
            hint: "Awaiting sign-off",
            icon: Check,
            surface: "bg-[linear-gradient(145deg,#f0fdfa_0%,#ffffff_45%,#ecfeff_100%)]",
            bar: "from-teal-500 to-cyan-300",
            valueClass: "text-teal-900",
            iconWrap: "bg-gradient-to-br from-teal-500 to-cyan-600 text-white",
            glow: "bg-teal-400/25",
          },
          {
            key: "resolved",
            label: "Resolved",
            value: stats.resolved,
            hint: "Reviewer certified",
            icon: CheckCircle2,
            surface: "bg-[linear-gradient(145deg,#ecfdf5_0%,#ffffff_45%,#f0fdfa_100%)]",
            bar: "from-emerald-500 to-teal-300",
            valueClass: "text-emerald-900",
            iconWrap: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white",
            glow: "bg-emerald-400/25",
          },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: 0.04 + index * 0.05, ease: [0.22, 1, 0.36, 1] }}
              className={`group relative overflow-hidden rounded-2xl border border-[#d7e4dc]/90 ${stat.surface} p-3.5 shadow-[0_1px_2px_rgba(15,44,32,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-18px_rgba(15,44,32,0.35)]`}
            >
              <div className={`absolute inset-x-0 top-0 h-[2.5px] bg-gradient-to-r ${stat.bar}`} />
              <div className={`pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full blur-2xl ${stat.glow}`} />
              <div className="relative flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6d7f76]">
                    {stat.label}
                  </p>
                  <p className={`mt-1.5 text-2xl font-semibold tabular-nums leading-none tracking-tight sm:text-[1.7rem] ${stat.valueClass}`}>
                    {stat.value}
                  </p>
                  <p className="mt-1.5 text-[11px] font-medium text-[#8aa094]">{stat.hint}</p>
                </div>
                <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm ${stat.iconWrap}`}>
                  <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 3. FILTERS + LIST */}
      <div className="space-y-4">
        {/* FILTER & SEARCH TOOLBAR */}
        <div className="space-y-3 rounded-2xl border border-[#d7e4dc]/90 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            {/* Project Selector */}
            <div className="max-w-md flex-1 space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#6d7f76]">
                Project
              </label>
              <select
                value={selectedProjectId || ""}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value, 10) : null;
                  setSelectedProjectId(val);
                }}
                className="w-full cursor-pointer rounded-xl border border-[#d5e3da] bg-[#fbfdfb] px-3.5 py-2.5 text-xs font-semibold text-[#0f2c20] outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
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
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterStatus("ALL")}
                className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filterStatus === "ALL"
                    ? "bg-[#0f2c20] text-white shadow-sm"
                    : "bg-[#edf5f0] text-[#52645d] hover:bg-[#e2eee7] hover:text-[#0f2c20]"
                }`}
              >
                All ({stats.total})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("OPEN")}
                className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filterStatus === "OPEN"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                }`}
              >
                Action ({stats.open})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("ADDRESSED")}
                className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filterStatus === "ADDRESSED"
                    ? "bg-teal-700 text-white shadow-sm"
                    : "border border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100"
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

