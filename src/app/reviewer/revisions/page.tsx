"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  RotateCcw,
  Check,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Loader2,
  Leaf,
  Calendar,
  User,
  MessageSquare,
  FileText,
  Clock,
} from "lucide-react";

export default function ProfessionalRevisionsPage() {
  const [loading, setLoading] = useState(true);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadRevisions();
  }, []);

  async function loadRevisions() {
    try {
      setLoading(true);
      const res = await fetch("/api/reviewer/revisions");
      if (res.ok) {
        const data = await res.json();
        setRevisions(data.revisions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleResolve = async (findingId: number) => {
    try {
      setResolvingId(findingId);
      const res = await fetch(`/api/reviewer/revisions/${findingId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESOLVE" }),
      });
      if (res.ok) {
        showToast("Finding marked as Resolved ✓");
        setRevisions((prev) =>
          prev.map((r) => (r.findingId === findingId ? { ...r, findingStatus: "RESOLVED" } : r))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResolvingId(null);
    }
  };

  const handleNeedsFurtherRevision = async (findingId: number) => {
    const note = prompt("Please provide additional instructions for the researcher:");
    if (!note) return;

    try {
      setResolvingId(findingId);
      const res = await fetch(`/api/reviewer/revisions/${findingId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "NEEDS_FURTHER_REVISION", notes: note }),
      });
      if (res.ok) {
        showToast("Finding flagged for further revision.");
        setRevisions((prev) =>
          prev.map((r) => (r.findingId === findingId ? { ...r, findingStatus: "OPEN" } : r))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* TOAST ALERT */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* COMPACT SCIENTIFIC HEADER */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-extrabold uppercase tracking-wider">
            Revision Queue
          </span>
          <span className="text-xs text-slate-500">
            {revisions.filter((r) => r.findingStatus !== "RESOLVED").length} Pending Verification
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 tracking-tight">
          Revisions
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Compare researcher responses and updated dossier content against your review findings without rereading the entire dossier.
        </p>
      </div>

      {/* REVISIONS LIST */}
      {loading ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading revisions queue...</p>
        </div>
      ) : revisions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 space-y-3">
          <RotateCcw className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No revisions waiting</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When researchers address your feedback and resubmit their dossiers, they will appear here for comparison and resolution.
          </p>
          <div className="pt-2">
            <Link
              href="/reviewer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
            >
              <span>View Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {revisions.map((rev) => {
            const isResolved = rev.findingStatus === "RESOLVED";

            return (
              <div
                key={rev.findingId}
                className={`p-6 rounded-2xl bg-white border transition-all shadow-xs ${
                  isResolved ? "border-emerald-200 bg-emerald-50/20" : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <div className="space-y-4">
                  {/* Top Metadata */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-extrabold text-base text-slate-900">
                        {rev.plantName} · {rev.areaLabel}
                      </span>
                      <span className="text-xs text-slate-500">({rev.projectTitle})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">
                        Section: <span className="font-semibold text-slate-700">{rev.sectionName}</span>
                      </span>
                      {isResolved ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Resolved</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                          Pending Verification
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 1. ORIGINAL FINDING */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                        Original Finding
                      </span>
                      <span className="text-[10px] font-semibold text-amber-700">
                        Severity: {rev.severity || "MINOR"}
                      </span>
                    </div>
                    <p className="text-slate-900 font-medium leading-relaxed">
                      &quot;{rev.originalFinding}&quot;
                    </p>
                  </div>

                  {/* DOWN ARROW */}
                  <div className="flex justify-center text-slate-400">
                    <span className="text-xs font-bold">↓</span>
                  </div>

                  {/* 2. RESEARCHER RESPONSE */}
                  <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-900 uppercase tracking-wider text-[10px] flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>Researcher Response ({rev.researcherName})</span>
                      </span>
                      {rev.researcherRepliedAt && (
                        <span className="text-[10px] text-blue-700">
                          {new Date(rev.researcherRepliedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-800 leading-relaxed italic">
                      {rev.researcherResponse || "No written response submitted yet."}
                    </p>
                  </div>

                  {/* DOWN ARROW */}
                  <div className="flex justify-center text-slate-400">
                    <span className="text-xs font-bold">↓</span>
                  </div>

                  {/* 3. UPDATED CONTENT CONTEXT */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                      Updated Content ({rev.sectionName})
                    </span>
                    <p className="text-slate-700 text-[11px] leading-relaxed">
                      Targeted modifications recorded in dossier {rev.versionTag}. Inspect full updated simulation parameters and literature alignment.
                    </p>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      {!isResolved && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleResolve(rev.findingId)}
                            disabled={resolvingId === rev.findingId}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Resolved ✓</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleNeedsFurtherRevision(rev.findingId)}
                            disabled={resolvingId === rev.findingId}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            <span>Needs Further Revision</span>
                          </button>
                        </>
                      )}
                    </div>

                    {rev.assignmentId && (
                      <Link
                        href={`/reviewer/reviews/${rev.assignmentId}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
                      >
                        <span>View Full Updated Dossier</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
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
