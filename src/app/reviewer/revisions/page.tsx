"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  RotateCcw,
  Check,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Loader2,
  Sprout,
  Calendar,
  User,
  MessageSquare,
  FileText,
  Clock,
  Filter,
  Search,
  CheckCheck,
  ChevronDown,
  Layers,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  X,
  FileCheck2,
  Cpu,
  FlaskConical,
} from "lucide-react";

interface RevisionFinding {
  findingId: number;
  projectId: number;
  submissionId: number | null;
  reviewRound: number;
  sectionName: string;
  stepNumber: number;
  originalFinding: string;
  requiredAction?: string | null;
  findingTitle: string;
  severity: "CRITICAL" | "MAJOR" | "MINOR" | "INFORMATIONAL" | string;
  findingStatus: "OPEN" | "ADDRESSED" | "RESOLVED" | string;
  researcherResponse?: string | null;
  researcherRepliedAt?: string | null;
  resolvedAt?: string | null;
  areaKey: string;
  areaLabel: string;
  projectTitle: string;
  plantName: string;
  plantScientificName?: string;
  researcherName: string;
  versionTag: string;
  targetUrl: string;
}

interface ProjectSummary {
  id: number;
  title: string;
  plantName: string;
  researcherName: string;
  addressedCount: number;
  openCount: number;
  resolvedCount: number;
}

export default function ReviewerRevisionsPage() {
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get("projectId")
    ? parseInt(searchParams.get("projectId")!, 10)
    : null;

  const [loading, setLoading] = useState(true);
  const [revisions, setRevisions] = useState<RevisionFinding[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(initialProjectId);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ADDRESSED" | "OPEN" | "RESOLVED">("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadRevisions = useCallback(async () => {
    try {
      setLoading(true);
      const url = selectedProjectId
        ? `/api/reviewer/revisions?projectId=${selectedProjectId}`
        : "/api/reviewer/revisions";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const rawList: RevisionFinding[] = data.revisions || [];
        const seen = new Set<number>();
        const unique = rawList.filter((item) => {
          if (seen.has(item.findingId)) return false;
          seen.add(item.findingId);
          return true;
        });
        setRevisions(unique);
        if (data.projects) setProjects(data.projects);
      }
    } catch (err) {
      console.error("Error loading revisions:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    loadRevisions();

    const handleSync = () => loadRevisions();
    window.addEventListener("natureaide:revisions-updated", handleSync);
    window.addEventListener("natureaide:review-updated", handleSync);
    return () => {
      window.removeEventListener("natureaide:revisions-updated", handleSync);
      window.removeEventListener("natureaide:review-updated", handleSync);
    };
  }, [loadRevisions]);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtered Revisions List
  const filteredRevisions = useMemo(() => {
    return revisions.filter((r) => {
      // Status Filter
      if (statusFilter !== "ALL" && r.findingStatus !== statusFilter) {
        return false;
      }
      // Severity Filter
      if (severityFilter !== "ALL" && r.severity !== severityFilter) {
        return false;
      }
      // Project Filter
      if (selectedProjectId && r.projectId !== selectedProjectId) {
        return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesText =
          (r.projectTitle || "").toLowerCase().includes(q) ||
          (r.plantName || "").toLowerCase().includes(q) ||
          (r.sectionName || "").toLowerCase().includes(q) ||
          (r.findingTitle || "").toLowerCase().includes(q) ||
          (r.originalFinding || "").toLowerCase().includes(q) ||
          (r.researcherResponse || "").toLowerCase().includes(q);
        if (!matchesText) return false;
      }
      return true;
    });
  }, [revisions, statusFilter, severityFilter, selectedProjectId, searchQuery]);

  // Counts
  const totalCount = revisions.length;
  const addressedCount = revisions.filter((r) => r.findingStatus === "ADDRESSED").length;
  const openCount = revisions.filter((r) => r.findingStatus === "OPEN").length;
  const resolvedCount = revisions.filter((r) => r.findingStatus === "RESOLVED").length;

  return (
    <div className="w-full max-w-[1440px] mx-auto space-y-4 pb-28">
      {/* TOAST ALERT */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl text-xs font-bold shadow-xl border flex items-center gap-2 animate-in fade-in duration-200 ${
            toastMessage.type === "success"
              ? "bg-slate-900 text-white border-slate-700"
              : "bg-rose-900 text-white border-rose-700"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* =================================================================== */}
      {/* 1. COMPREHENSIVE HEADER BANNER (Consistent Scientific Header)       */}
      {/* =================================================================== */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-[linear-gradient(120deg,#071930_0%,#0b2447_48%,#0f3460_100%)] px-4 py-3.5 text-white shadow-[0_12px_28px_-18px_rgba(7,25,48,0.55)] sm:px-5">
        <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="relative flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-400/30 bg-blue-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-blue-200">
                <RotateCcw className="h-3 w-3 text-blue-300" />
                Verification hub
              </span>
              {addressedCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-200">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                  {addressedCount} awaiting
                </span>
              )}
            </div>
            <h1 className="mt-1.5 text-lg font-semibold tracking-tight sm:text-xl">Revisions queue</h1>
            <p className="mt-0.5 max-w-xl text-xs text-blue-100/75">
              Verify researcher fixes without rereading full dossiers.
            </p>
          </div>
          <button
            type="button"
            onClick={loadRevisions}
            disabled={loading}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-blue-100 transition hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. STATS CARDS (Awaiting Verification, Open, Resolved)             */}
      {/* =================================================================== */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* Total Findings */}
        <div
          onClick={() => setStatusFilter("ALL")}
          className={`cursor-pointer rounded-2xl border p-3.5 transition-all ${
            statusFilter === "ALL"
              ? "bg-white border-blue-500 shadow-md ring-2 ring-blue-500/20"
              : "bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Findings
            </span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">{totalCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Across evaluated projects</p>
        </div>

        {/* Action Required / Addressed */}
        <div
          onClick={() => setStatusFilter("ADDRESSED")}
          className={`cursor-pointer rounded-2xl border p-3.5 transition-all ${
            statusFilter === "ADDRESSED"
              ? "bg-amber-50/50 border-amber-500 shadow-md ring-2 ring-amber-500/20"
              : "bg-white border-slate-200/90 hover:border-amber-300 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Awaiting Verification
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-950 font-mono">{addressedCount}</div>
          <p className="text-[11px] text-amber-700 mt-1">Researcher replied • Reviewer action required</p>
        </div>

        {/* Open Findings */}
        <div
          onClick={() => setStatusFilter("OPEN")}
          className={`cursor-pointer rounded-2xl border p-3.5 transition-all ${
            statusFilter === "OPEN"
              ? "bg-blue-50/50 border-blue-500 shadow-md ring-2 ring-blue-500/20"
              : "bg-white border-slate-200/90 hover:border-blue-300 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Pending Researcher
            </span>
            <AlertTriangle className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">{openCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Waiting for researcher edits</p>
        </div>

        {/* Resolved Findings */}
        <div
          onClick={() => setStatusFilter("RESOLVED")}
          className={`cursor-pointer rounded-2xl border p-3.5 transition-all ${
            statusFilter === "RESOLVED"
              ? "bg-emerald-50/50 border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
              : "bg-white border-slate-200/90 hover:border-emerald-300 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Resolved &amp; Closed
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-950 font-mono">{resolvedCount}</div>
          <p className="text-[11px] text-emerald-700 mt-1">Verified scientific fixes</p>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. FILTER CONTROLS BAR (Project, Search, Severity)                  */}
      {/* =================================================================== */}
      <div className="flex flex-col justify-between gap-2.5 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(7,25,48,0.04)] md:flex-row md:items-center">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          {/* Project Selector Dropdown */}
          <div className="relative min-w-[220px]">
            <select
              value={selectedProjectId || ""}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value, 10) : null;
                setSelectedProjectId(val);
              }}
              className="w-full px-3 py-2 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer appearance-none"
            >
              <option value="">All Research Projects ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.plantName})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Severity Filter */}
          <div className="relative">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer appearance-none"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">🔴 Critical</option>
              <option value="MAJOR">🟠 Major</option>
              <option value="MINOR">🟡 Minor</option>
              <option value="INFORMATIONAL">🔵 Informational</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search findings, botanical, or responses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Clear Filters Button if any active */}
        {(selectedProjectId || statusFilter !== "ALL" || severityFilter !== "ALL" || searchQuery) && (
          <button
            type="button"
            onClick={() => {
              setSelectedProjectId(null);
              setStatusFilter("ALL");
              setSeverityFilter("ALL");
              setSearchQuery("");
            }}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors self-start md:self-auto cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* =================================================================== */}
      {/* 4. REVISIONS LIST                                                   */}
      {/* =================================================================== */}
      {loading ? (
        <div className="p-16 text-center rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Loading revisions queue...</p>
        </div>
      ) : filteredRevisions.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
            <RotateCcw className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">No revisions match your filter</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {revisions.length === 0
                ? "No revision findings have been submitted for your assigned projects yet."
                : "Try adjusting your status, severity, or search filters above."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRevisions.map((rev, index) => {
            const isResolved = rev.findingStatus === "RESOLVED";
            const isAddressed = rev.findingStatus === "ADDRESSED";

            // Clean title if it contains duplicate comment
            let cleanTitle = rev.findingTitle || "Review Finding";
            if (cleanTitle.includes(":")) {
              const parts = cleanTitle.split(":");
              const rest = parts.slice(1).join(":").trim();
              if (rest.toLowerCase() === (rev.originalFinding || "").trim().toLowerCase()) {
                cleanTitle = parts[0].trim();
              }
            }

            // Severity color pill
            const severityStyle =
              rev.severity === "CRITICAL"
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : rev.severity === "MAJOR"
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : rev.severity === "MINOR"
                ? "bg-yellow-50 text-yellow-800 border-yellow-200"
                : "bg-blue-50 text-blue-700 border-blue-200";

            return (
              <div
                key={`rev-${rev.findingId}-${index}`}
                className={`space-y-3 rounded-2xl border bg-white p-4 shadow-[0_1px_2px_rgba(7,25,48,0.04)] transition-all ${
                  isAddressed
                    ? "border-amber-300 ring-2 ring-amber-400/15"
                    : isResolved
                    ? "border-emerald-200 bg-emerald-50/15"
                    : "border-slate-200/90 hover:border-slate-300"
                }`}
              >
                {/* Header Row: Subject, Botanical, Section & Status Badges */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading font-extrabold text-base text-slate-900 tracking-tight">
                        {rev.projectTitle}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-medium">
                        <Sprout className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{rev.plantName}</span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="font-mono text-xs text-slate-500">
                        {rev.versionTag || "v1.0"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200 text-[11px]">
                        {rev.sectionName}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span>
                        Researcher: <strong className="text-slate-700">{rev.researcherName}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Status Pills */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${severityStyle}`}>
                      {rev.severity || "MAJOR"}
                    </span>

                    {isResolved ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Resolved ✓</span>
                      </span>
                    ) : isAddressed ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span>Action Required · Addressed by Researcher</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Pending Researcher Action</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Body 1: Reviewer Original Finding & Required Action */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[10.5px]">
                      Finding / Reviewer Note
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {cleanTitle}
                    </span>
                  </div>
                  <p className="text-slate-900 text-xs sm:text-sm font-medium leading-relaxed">
                    &ldquo;{rev.originalFinding}&rdquo;
                  </p>
                  {rev.requiredAction && rev.requiredAction !== rev.originalFinding && (
                    <div className="pt-2 border-t border-slate-200/60 text-slate-600 text-xs">
                      <strong className="text-slate-700">Required Action:</strong> {rev.requiredAction}
                    </div>
                  )}
                </div>

                {/* Body 2: Researcher Implementation & Response Box */}
                {rev.researcherResponse ? (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 to-cyan-50/50 border border-blue-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-900 uppercase tracking-wider text-[10.5px] flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-700" />
                        <span>Researcher Implementation Note ({rev.researcherName})</span>
                      </span>
                      {rev.researcherRepliedAt && (
                        <span suppressHydrationWarning className="text-[11px] font-mono text-blue-700">
                          {new Date(rev.researcherRepliedAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-900 text-xs sm:text-sm font-medium leading-relaxed">
                      {rev.researcherResponse}
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-slate-50/60 border border-dashed border-slate-200 text-xs text-slate-400 italic">
                    The researcher has not submitted a response note yet.
                  </div>
                )}

                {/* Footer Action Bar: 1 Single Button to Inspect in Step Workspace */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    {isResolved ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Resolved</span>
                      </span>
                    ) : isAddressed ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span>Resubmission Ready to Inspect</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Pending Researcher Action</span>
                      </span>
                    )}
                  </div>

                  <Link
                    href={rev.targetUrl}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                  >
                    <span>Open Revision in Step Workspace</span>
                    <ArrowRight className="w-4 h-4 text-emerald-100" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
