"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertCircle,
  Loader2,
  Leaf,
  Dna,
  Pill,
  FlaskConical,
  Stethoscope,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useReviewerProject } from "@/context/ReviewerProjectContext";

interface AreaItem {
  number: string;
  key: string;
  profession: string;
  checkingArea: string;
  description: string;
  status: string;
  isReady: boolean;
  isCompleted: boolean;
  assignmentId: number | null;
  actionLabel: string;
  actionUrl: string;
  assessment?: string | null;
  comments?: string | null;
  reviewerName?: string | null;
  approvedAt?: string | null;
}

interface ProjectData {
  id: number;
  title: string;
  shortDescription?: string;
  researchObjective?: string;
  currentStage?: string;
  plantName: string;
  plantScientificName?: string | null;
  plantFamily?: string | null;
  researcherName: string;
  researcherEmail: string;
  cycle: number;
  versionTag: string;
  submittedAt: string;
  updatedAt: string;
  overallStatus: string;
  completedReviewsCount: number;
  totalRequiredReviews: number;
  areas: AreaItem[];
}

const ROLE_ICONS: Record<string, React.ElementType> = {
  pharmacognosy: Leaf,
  bioinformatics: Dna,
  pharmacology: Pill,
  formulation: FlaskConical,
  clinical_safety: Stethoscope,
};

export default function ProjectReviewWorkspaceClient({
  projectId,
}: {
  projectId: number;
}) {
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectData | null>(null);
  const { setActiveProject } = useReviewerProject();

  useEffect(() => {
    if (project) {
      setActiveProject({
        id: project.id,
        title: project.title,
        plantName: project.plantName,
        plantScientificName: project.plantScientificName || null,
        status: project.overallStatus,
      });
    }
  }, [project, setActiveProject]);

  useEffect(() => {
    async function loadProject() {
      try {
        setLoading(true);
        const res = await fetch(`/api/reviewer/projects/${projectId}`);
        if (res.ok) {
          const data = await res.json();
          setProject(data.project || null);
        }
      } catch (err) {
        console.error("Failed to load project review data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/70 p-12 text-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-600">Loading project review workspace...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50/70 p-12 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-800">Project Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          The requested project could not be found or you may not have access.
        </p>
        <Link
          href="/reviewer/projects"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All Research Projects
        </Link>
      </div>
    );
  }

  const percentComplete = Math.round(
    (project.completedReviewsCount / project.totalRequiredReviews) * 100
  );

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 pb-16">
      {/* 1. COMPACT HEADER */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-6 shadow-xs">
        <div className="max-w-5xl mx-auto">
          {/* Back link */}
          <Link
            href="/reviewer/projects"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-3 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>All Research Projects</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-200/60">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  PROJECT REVIEW
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-heading">
                {project.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-xs text-slate-600">
                <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                  {project.plantName}
                </span>
                {project.plantScientificName && (
                  <span className="italic text-slate-500 font-serif text-[12px]">
                    · {project.plantScientificName}
                  </span>
                )}
                {project.plantFamily && (
                  <span className="text-slate-400 text-[11px]">
                    ({project.plantFamily})
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/reviewer/assistant"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                Ask NatureAide
              </Link>
            </div>
          </div>

          {/* Meta Info Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-100 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Researcher
              </span>
              <span className="font-semibold text-slate-800 block mt-0.5">
                {project.researcherName}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Review Cycle
              </span>
              <span className="font-semibold text-slate-800 block mt-0.5">
                Cycle {project.cycle} ({project.versionTag})
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Overall Status
              </span>
              <span className="inline-flex items-center gap-1.5 mt-0.5 font-bold text-blue-700">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                {project.overallStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SCIENTIFIC REVIEW PROGRESS */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 mt-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs mb-2">
            <div>
              <h2 className="font-bold text-slate-900 text-sm font-heading">
                Professional Review Progress
              </h2>
              <p className="text-slate-500 text-[11.5px] mt-0.5">
                {project.completedReviewsCount} of {project.totalRequiredReviews} areas complete
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-slate-600">
              {percentComplete}%
            </span>
          </div>

          {/* Thin progress line */}
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                percentComplete === 100
                  ? "bg-emerald-500"
                  : percentComplete > 0
                  ? "bg-blue-600"
                  : "bg-slate-300"
              }`}
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. ALL FIVE PROFESSIONAL CHECKING AREAS */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 mt-6">
        <div className="mb-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Professional Checking Areas
          </h2>
        </div>

        <div className="space-y-3">
          {project.areas.map((area) => {
            const Icon = ROLE_ICONS[area.key] || Leaf;

            return (
              <div
                key={area.key}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      area.isCompleted
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : area.status === "In Review"
                        ? "bg-sky-50 text-sky-700 border-sky-200"
                        : area.status === "Revision Requested" || area.status === "Revision Submitted"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : area.isReady
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-slate-50 text-slate-400 border-slate-200"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Hierarchy & Details */}
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      {area.profession}
                    </span>
                    <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 mt-0.5">
                      {area.checkingArea}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {area.description}
                    </p>

                    {/* Status Note if Not Ready */}
                    {!area.isReady && (
                      <p className="text-[11px] text-slate-400 mt-1.5 italic">
                        Waiting for the corresponding research data.
                      </p>
                    )}

                    {/* Review Details if Completed/Approved */}
                    {area.isCompleted && (area.reviewerName || area.approvedAt) && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                        {area.reviewerName && (
                          <span className="inline-flex items-center gap-1">
                            <span className="text-slate-400 font-medium">Reviewed by:</span>
                            <span className="font-semibold text-slate-800">{area.reviewerName}</span>
                          </span>
                        )}
                        {area.approvedAt && (
                          <span className="inline-flex items-center gap-1">
                            <span className="text-slate-400 font-medium">Approved:</span>
                            <span className="font-semibold text-emerald-700">
                              {new Date(area.approvedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Badge & Action Button */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2.5 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {/* Status badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      area.isCompleted
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : area.status === "In Review"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : area.status === "Revision Requested" || area.status === "Revision Submitted"
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : area.isReady
                        ? "bg-amber-50 text-amber-800 border border-amber-200"
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        area.isCompleted
                          ? "bg-emerald-500"
                          : area.status === "In Review"
                          ? "bg-blue-500"
                          : area.status === "Revision Requested" || area.status === "Revision Submitted"
                          ? "bg-rose-500"
                          : area.isReady
                          ? "bg-amber-500"
                          : "bg-slate-400"
                      }`}
                    />
                    {area.status}
                  </span>

                  {/* Action button */}
                  {area.isReady ? (
                    <Link
                      href={area.actionUrl}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                        area.isCompleted
                          ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                          : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
                      }`}
                    >
                      <span>{area.actionLabel || `Open ${area.checkingArea} Review →`}</span>
                    </Link>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                      Stage Incomplete
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

