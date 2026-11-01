"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Clock,
  RotateCcw,
  CheckCircle2,
  FileCheck2,
  Layers,
  Loader2,
  AlertCircle,
  ExternalLink,
  Leaf,
  Dna,
  Pill,
  FlaskConical,
  Stethoscope,
  ChevronRight,
} from "lucide-react";
import { useReviewerProject } from "@/context/ReviewerProjectContext";

interface AreaItem {
  key: string;
  profession: string;
  checkingArea: string;
  status: string;
  displayStatus: string;
  isReady: boolean;
  isCompleted: boolean;
  assignmentId: number | null;
  actionUrl: string;
}

interface ProjectSummaryItem {
  projectId: number;
  title: string;
  shortDescription?: string;
  plantName: string;
  plantScientificName?: string | null;
  researcherName: string;
  researcherEmail: string;
  currentStage?: string;
  reviewRound: number;
  overallStatus: string;
  requiresAttention: boolean;
  completedReviewsCount: number;
  totalRequiredReviews: number;
  updatedAt: string;
  attentionAreas: AreaItem[];
  areas: AreaItem[];
  action: {
    label: string;
    href: string;
  };
}

interface SummaryStats {
  needsReviewCount: number;
  inProgressCount: number;
  revisionsCount: number;
  completedCount: number;
  totalCount: number;
}

const ROLE_ICONS: Record<string, React.ElementType> = {
  pharmacognosy: Leaf,
  bioinformatics: Dna,
  pharmacology: Pill,
  formulation: FlaskConical,
  clinical_safety: Stethoscope,
};

export default function ReviewWorkspaceClient() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectSummaryItem[]>([]);
  const { setActiveProject } = useReviewerProject();

  const handleSelectProject = (project: ProjectSummaryItem) => {
    setActiveProject({
      id: project.projectId,
      title: project.title,
      plantName: project.plantName,
      plantScientificName: project.plantScientificName || null,
      status: project.overallStatus,
    });
  };
  const [summary, setSummary] = useState<SummaryStats>({
    needsReviewCount: 0,
    inProgressCount: 0,
    revisionsCount: 0,
    completedCount: 0,
    totalCount: 0,
  });

  useEffect(() => {
    async function loadWorkspaceData() {
      try {
        setLoading(true);
        const res = await fetch("/api/reviewer/projects");
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects || []);
          if (data.summary) {
            setSummary(data.summary);
          }
        }
      } catch (err) {
        console.error("Failed to load review workspace data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadWorkspaceData();
  }, []);

  // Filter projects requiring immediate attention
  const attentionProjects = projects.filter((p) => p.requiresAttention);

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 pb-16">
      {/* 1. COMPACT HEADER */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-6 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-200/60">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Reviewer Workspace
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-heading">
              Scientific Review Workspace
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Monitor active research and professional checking progress.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/reviewer/projects"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              All Research Projects
            </Link>

            <Link
              href="/reviewer/assistant"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              Ask NatureAide
            </Link>
          </div>
        </div>

        {/* 2. COMPACT OVERVIEW STRIP */}
        <div className="max-w-6xl mx-auto mt-6 pt-5 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Active Reviews
            </span>
            <div className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="font-bold text-slate-900">{summary.needsReviewCount}</span>
              <span className="text-slate-500">Needs Review</span>
            </div>
            <span className="text-slate-300 hidden sm:inline">·</span>
            <div className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="font-bold text-slate-900">{summary.inProgressCount}</span>
              <span className="text-slate-500">In Review</span>
            </div>
            <span className="text-slate-300 hidden sm:inline">·</span>
            <div className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="font-bold text-slate-900">{summary.revisionsCount}</span>
              <span className="text-slate-500">Revisions</span>
            </div>
            <span className="text-slate-300 hidden sm:inline">·</span>
            <div className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-bold text-slate-900">{summary.completedCount}</span>
              <span className="text-slate-500">Completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. REQUIRES ATTENTION SECTION */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
              Requires Attention
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                {attentionProjects.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Research projects currently awaiting professional review or revisions.
            </p>
          </div>

          <Link
            href="/reviewer/projects"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
          >
            <span>View All Research Projects</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
            <Loader2 className="w-7 h-7 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-600">Loading active review items...</p>
          </div>
        ) : attentionProjects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center shadow-xs">
            <CheckCircle2 className="w-9 h-9 text-emerald-500 mx-auto mb-2.5" />
            <h3 className="text-sm font-bold text-slate-800 font-heading">
              All active professional reviews are up to date
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              There are no pending review actions requiring immediate attention right now.
            </p>
            <Link
              href="/reviewer/projects"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              Browse All Research Projects
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {attentionProjects.map((project) => {
              // Find the top attention area
              const primaryArea = project.attentionAreas[0] || project.areas[0];
              const Icon = ROLE_ICONS[primaryArea.key] || Leaf;

              return (
                <div
                  key={project.projectId}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Link
                        href={`/reviewer/projects/${project.projectId}`}
                        onClick={() => handleSelectProject(project)}
                        className="font-heading font-bold text-sm sm:text-base text-slate-900 group-hover:text-blue-600 transition-colors truncate"
                      >
                        {project.title}
                      </Link>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        Cycle {project.reviewRound}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-2 text-xs text-slate-600">
                      <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                        {project.plantName}
                      </span>
                      {project.plantScientificName && (
                        <span className="italic text-slate-500 font-serif text-[11.5px]">
                          · {project.plantScientificName}
                        </span>
                      )}
                      <span className="text-slate-300">|</span>
                      <span className="text-slate-500">
                        Researcher: <strong className="text-slate-700 font-medium">{project.researcherName}</strong>
                      </span>
                    </div>

                    {/* Attention badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {project.attentionAreas.map((area) => (
                        <span
                          key={area.key}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                            area.status === "Revision Requested" || area.status === "Revision Submitted"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : area.status === "In Review"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              area.status === "Revision Requested" || area.status === "Revision Submitted"
                                ? "bg-rose-500"
                                : area.status === "In Review"
                                ? "bg-blue-500"
                                : "bg-amber-500"
                            }`}
                          />
                          {area.checkingArea} · {area.displayStatus}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2.5 shrink-0 sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <Link
                      href={primaryArea.actionUrl}
                      onClick={() => handleSelectProject(project)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
                    >
                      <span>Open Review →</span>
                    </Link>

                    <Link
                      href={`/reviewer/projects/${project.projectId}`}
                      onClick={() => handleSelectProject(project)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Open Project Workspace"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
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
