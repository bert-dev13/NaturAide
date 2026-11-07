"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Bot,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Layers,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  Send,
  Loader2,
  FileText,
  Dna,
  FlaskConical,
  ShieldAlert,
  ShieldCheck,
  Check,
  ArrowRight,
  Info,
} from "lucide-react";
import { expertReviewAreaLabel } from "@/lib/expert-review-areas";
import { AiReviewBrief, AiChecklistItem, AiSourceReference } from "@/lib/review-ai-service";

interface Props {
  assignmentId: number;
  onNavigateToSection?: (sectionId: string, anchorId?: string) => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  citations?: string[];
  model?: string;
  timestamp: string;
}

export default function AiResearchReviewBrief({
  assignmentId,
  onNavigateToSection,
}: Props) {
  const [brief, setBrief] = useState<AiReviewBrief | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSpecialty, setActiveSpecialty] = useState<string>("OVERALL");
  const [authorizedSpecialties, setAuthorizedSpecialties] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [regenerating, setRegenerating] = useState<boolean>(false);

  // Checklist state
  const [checklist, setChecklist] = useState<AiChecklistItem[]>([]);
  const [togglingItem, setTogglingItem] = useState<string | null>(null);

  // Ask AI Chat State
  const [showChat, setShowChat] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  const fetchBrief = async (specialty?: string, forceRegen?: boolean) => {
    try {
      if (forceRegen) setRegenerating(true);
      else setLoading(true);
      setError(null);

      const targetSpec = specialty || activeSpecialty;
      const url = `/api/reviewer/reviews/${assignmentId}/ai-brief?specialty=${encodeURIComponent(targetSpec)}`;
      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to load AI review brief");
      }

      setBrief(json.brief);
      setChecklist(json.brief?.checklistItems || []);
      if (json.authorizedSpecialties && json.authorizedSpecialties.length > 0) {
        setAuthorizedSpecialties(json.authorizedSpecialties);
      }
      if (json.activeSpecialty) {
        setActiveSpecialty(json.activeSpecialty);
      }
    } catch (err: any) {
      console.error("AI brief error:", err);
      setError(err.message || "Unable to generate review brief");
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  };

  useEffect(() => {
    fetchBrief();
  }, [assignmentId]);

  const handleSwitchSpecialty = (specKey: string) => {
    setActiveSpecialty(specKey);
    fetchBrief(specKey);
  };

  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      const res = await fetch(`/api/reviewer/reviews/${assignmentId}/ai-brief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialty: activeSpecialty }),
      });
      if (res.ok) {
        await fetchBrief(activeSpecialty);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRegenerating(false);
    }
  };

  const handleToggleChecklistItem = async (item: AiChecklistItem) => {
    const nextChecked = !item.checked;
    setTogglingItem(item.id);

    // Optimistic UI update
    setChecklist((prev) =>
      prev.map((c) => (c.id === item.id ? { ...c, checked: nextChecked } : c))
    );

    try {
      await fetch(`/api/reviewer/reviews/${assignmentId}/checklist-toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemKey: item.id,
          checked: nextChecked,
          specialty: activeSpecialty,
        }),
      });
    } catch (err) {
      console.error("Checklist toggle error:", err);
      // Revert on failure
      setChecklist((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, checked: !nextChecked } : c))
      );
    } finally {
      setTogglingItem(null);
    }
  };

  const handleSendChat = async (questionText?: string) => {
    const query = (questionText || chatInput).trim();
    if (!query || chatLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch(`/api/reviewer/reviews/${assignmentId}/ask-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get AI answer");
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: data.answer || "No response generated.",
        citations: data.citations || [],
        model: data.model,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: "ai",
        text: `Error: ${err.message || "Failed to process question."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  const completedChecksCount = checklist.filter((c) => c.checked).length;
  const totalChecksCount = checklist.length;

  const renderBadge = (badge: AiSourceReference["badge"]) => {
    switch (badge) {
      case "VERIFIED_RECORD":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            Verified Record
          </span>
        );
      case "LAB_OBSERVATION":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-100/90 px-2 py-0.5 rounded border border-blue-300">
            <FlaskConical className="w-3 h-3 text-blue-700" />
            Lab Observation
          </span>
        );
      case "COMPUTATIONAL_PREDICTION":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-800 bg-indigo-100/90 px-2 py-0.5 rounded border border-indigo-300">
            <Dna className="w-3 h-3 text-indigo-700" />
            Computational Prediction
          </span>
        );
      case "AI_INTERPRETATION":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-800 bg-purple-100/90 px-2 py-0.5 rounded border border-purple-300">
            <Sparkles className="w-3 h-3 text-purple-700" />
            AI Synthesis
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-100/90 px-2 py-0.5 rounded border border-rose-300">
            <AlertTriangle className="w-3 h-3 text-rose-700" />
            Requires Verification
          </span>
        );
    }
  };

  return (
    <div className="bg-linear-to-b from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl border border-slate-800 shadow-xl overflow-hidden transition-all duration-300">
      {/* 1. TOP HEADER BAR */}
      <div className="px-5 sm:px-7 py-4.5 bg-slate-900/90 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base sm:text-lg font-heading font-extrabold text-white tracking-tight">
                AI Research Review Brief
              </h2>
              <span className="text-[11px] font-mono font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/50">
                {brief?.versionTag || "v1.0"}
              </span>
              {brief?.isCached && (
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                  Cached Snapshot
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Evidence-grounded synthesis to assist multidisciplinary professional review · Does not replace professional judgment.
            </p>
          </div>
        </div>

        {/* Actions Header Right */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          <button
            onClick={() => setShowChat(!showChat)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              showChat
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700"
            }`}
            title="Ask AI about this dossier"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ask AI About This Research</span>
          </button>

          <button
            onClick={handleRegenerate}
            disabled={regenerating || loading}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            title="Regenerate synthesis from snapshot"
            aria-label="Regenerate brief"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? "animate-spin text-emerald-400" : ""}`} />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            title={isExpanded ? "Collapse brief" : "Expand brief"}
            aria-label="Toggle brief"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. SPECIALIZATION SELECTOR TABS */}
      <div className="px-5 sm:px-7 py-2.5 bg-slate-950/60 border-b border-slate-800/60 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mr-1 shrink-0">
          Perspective:
        </span>

        {/* Overall Synthesis */}
        <button
          onClick={() => handleSwitchSpecialty("OVERALL")}
          className={`px-3 py-1 rounded-xl font-bold transition-all shrink-0 cursor-pointer text-xs ${
            activeSpecialty === "OVERALL"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          }`}
        >
          Overall Synthesis
        </button>

        {/* Authorized or All Specializations */}
        {(authorizedSpecialties.length > 0
          ? authorizedSpecialties
          : ["pharmacognosy", "bioinformatics", "pharmacology", "formulation", "clinical_safety"]
        ).map((specKey) => {
          const isActive = activeSpecialty === specKey;
          return (
            <button
              key={specKey}
              onClick={() => handleSwitchSpecialty(specKey)}
              className={`px-3 py-1 rounded-xl font-bold transition-all shrink-0 cursor-pointer text-xs flex items-center gap-1.5 ${
                isActive
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-xs"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <span>{expertReviewAreaLabel(specKey)}</span>
            </button>
          );
        })}
      </div>

      {/* 3. MAIN EXPANDABLE BRIEF CONTENT */}
      {isExpanded && (
        <div className="p-5 sm:p-7 space-y-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-7 h-7 text-emerald-400 animate-spin" />
              <p className="text-xs font-semibold">Generating evidence-grounded review brief...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-900/60 text-rose-200 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">{error}</p>
                <p className="text-slate-400 text-[11px] mt-0.5">You can still inspect the full research dossier below.</p>
              </div>
              <button
                onClick={() => fetchBrief(activeSpecialty, true)}
                className="px-3 py-1 rounded-lg bg-rose-900/80 hover:bg-rose-800 text-white font-bold cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : brief ? (
            <>
              {/* ROW 1: EXECUTIVE SUMMARY & OBJECTIVES */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                <div className="md:col-span-8 p-4.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400/90 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      1. Executive Research Summary
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Grounded from Dossier &amp; Manuscript
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                    {brief.executiveSummary}
                  </p>
                </div>

                <div className="md:col-span-4 p-4.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400/90 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    2. Research Objectives
                  </span>
                  <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                    {brief.researchObjectives}
                  </p>
                </div>
              </div>

              {/* ROW 2: DOMAIN FINDINGS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Formulation Findings */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                      <FlaskConical className="w-3.5 h-3.5 text-teal-400" />
                      Formulation Development
                    </span>
                    <button
                      onClick={() => onNavigateToSection?.("section1-formulation", "sec-formulation-matrix")}
                      className="text-[10px] font-bold text-teal-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      View <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {brief.formulationFindings}
                  </p>
                </div>

                {/* In-Silico Screening Findings */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      In-Silico Screening
                    </span>
                    <button
                      onClick={() => onNavigateToSection?.("section2-insilico", "sec-compounds")}
                      className="text-[10px] font-bold text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      View <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {brief.insilicoFindings}
                  </p>
                </div>

                {/* Molecular Docking Results */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <Dna className="w-3.5 h-3.5 text-purple-400" />
                      AutoDock Vina Results
                    </span>
                    <button
                      onClick={() => onNavigateToSection?.("section2-insilico", "sec-docking")}
                      className="text-[10px] font-bold text-purple-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      View <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {brief.molecularDockingResults}
                  </p>
                </div>

                {/* Scientific Evidence */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Supporting Literature
                    </span>
                    <button
                      onClick={() => onNavigateToSection?.("section3-manuscript", "sec-evidence")}
                      className="text-[10px] font-bold text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      View <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {brief.scientificEvidence}
                  </p>
                </div>
              </div>

              {/* ROW 3: POTENTIAL CONCERNS, MISSING EVIDENCE & VERIFICATION POINTS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Potential Methodological Concerns */}
                <div className="p-4.5 rounded-2xl bg-amber-950/20 border border-amber-900/50 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                      Potential Concerns
                    </span>
                  </div>
                  <p className="text-xs text-amber-100/90 whitespace-pre-line leading-relaxed">
                    {brief.potentialConcerns}
                  </p>
                </div>

                {/* Missing or Insufficient Evidence */}
                <div className="p-4.5 rounded-2xl bg-rose-950/20 border border-rose-900/50 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="text-xs font-bold text-rose-300 uppercase tracking-wide">
                      Missing Evidence / Unverified
                    </span>
                  </div>
                  <p className="text-xs text-rose-100/90 whitespace-pre-line leading-relaxed">
                    {brief.missingEvidence}
                  </p>
                </div>

                {/* Suggested Points for Professional Verification */}
                <div className="p-4.5 rounded-2xl bg-blue-950/20 border border-blue-900/50 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="text-xs font-bold text-blue-300 uppercase tracking-wide">
                      Verification Points
                    </span>
                  </div>
                  <p className="text-xs text-blue-100/90 whitespace-pre-line leading-relaxed">
                    {brief.verificationPoints}
                  </p>
                </div>
              </div>

              {/* ROW 4: INTERACTIVE REVIEW CHECKLIST */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs sm:text-sm font-heading font-extrabold text-white">
                      AI-Assisted Review Checklist ({activeSpecialty === "OVERALL" ? "Comprehensive" : expertReviewAreaLabel(activeSpecialty)})
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Review Progress:</span>
                    <span className="font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/40">
                      {completedChecksCount} / {totalChecksCount} Verified
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {checklist.map((item) => (
                    <label
                      key={item.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        item.checked
                          ? "bg-emerald-950/30 border-emerald-800/60 text-slate-200"
                          : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(item.checked)}
                        disabled={togglingItem === item.id}
                        onChange={() => handleToggleChecklistItem(item)}
                        className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {item.category}
                          </span>
                          {item.critical && (
                            <span className="text-[9px] font-bold text-amber-400 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-800/40">
                              Essential
                            </span>
                          )}
                        </div>
                        <p className={`text-xs ${item.checked ? "line-through text-slate-400" : "text-slate-200"}`}>
                          {item.text}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* ROW 5: EVIDENCE-GROUNDED SOURCE REFERENCES */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-blue-400" />
                    <h4 className="text-xs sm:text-sm font-heading font-extrabold text-white">
                      Clickable Source Evidence Links (Jump to Dossier)
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Click any source reference below to scroll directly to the raw submission evidence
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(brief.sourceReferences || []).map((ref) => (
                    <button
                      key={ref.id}
                      onClick={() => onNavigateToSection?.(ref.sectionId, ref.anchorId)}
                      className="p-3 rounded-xl bg-slate-950/50 hover:bg-slate-950 border border-slate-800 hover:border-blue-500/50 transition-all text-left group cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        {renderBadge(ref.badge)}
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <p className="text-xs font-bold text-slate-200 group-hover:text-blue-300 transition-colors">
                        {ref.label}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {ref.detail}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          {/* 4. ASK AI ABOUT THIS RESEARCH PANEL (INLINE EXPANDED) */}
          {showChat && (
            <div className="mt-6 p-5 sm:p-6 rounded-2xl bg-slate-950 border border-emerald-900/50 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <Bot className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-heading font-extrabold text-white">
                      Ask AI About This Research Dossier
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Grounded exclusively in this submission snapshot ({brief?.versionTag || "v1.0"}).
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChat(false)}
                  className="text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Close
                </button>
              </div>

              {/* Quick Prompt Suggestions */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mr-1">
                  Suggested:
                </span>
                {[
                  "What are the main findings?",
                  "What formulation concerns require verification?",
                  "Summarize the docking results",
                  "Which research evidence is missing?",
                  "What should I check before approving?",
                  "Explain the concentration calculations",
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendChat(prompt)}
                    disabled={chatLoading}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] font-medium text-slate-300 border border-slate-800 hover:border-emerald-500/40 transition-colors cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Chat Message Stream */}
              <div className="max-h-80 overflow-y-auto space-y-3 pr-1 divide-y divide-slate-800/40">
                {chatMessages.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500 italic">
                    Ask any question regarding the submitted plant taxonomy, hydrogel formulation matrix, AutoDock Vina calculations, or manuscript evidence.
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div key={msg.id} className="pt-3 first:pt-0 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="font-bold uppercase tracking-wider">
                          {msg.sender === "user" ? "Reviewer Inquiry" : "NatureAide Research AI"}
                        </span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <div
                        className={`p-3 rounded-xl text-xs sm:text-sm leading-relaxed ${
                          msg.sender === "user"
                            ? "bg-slate-900 text-emerald-200 border border-slate-800"
                            : "bg-emerald-950/30 text-slate-200 border border-emerald-900/40"
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.text}</p>
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-emerald-900/40 flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-slate-400 font-semibold">Citations:</span>
                            {msg.citations.map((c, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div className="pt-3 flex items-center gap-2 text-xs text-emerald-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing submission snapshot...</span>
                  </div>
                )}
              </div>

              {/* Chat Input Field */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChat();
                }}
                className="flex items-center gap-2 pt-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a question about this submitted dossier..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Ask</span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

