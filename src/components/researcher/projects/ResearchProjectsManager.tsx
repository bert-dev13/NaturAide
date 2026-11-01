"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderGit2,
  FlaskConical,
  ClipboardCheck,
  CheckCircle2,
  Plus,
  Search,
  ArrowUpDown,
  ArrowRight,
  Clock,
  Leaf,
  Layers,
  AlertCircle,
  X,
  Loader2,
  ChevronRight,
  MoreVertical,
  Trash2,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { getStageUrl } from "@/lib/workflow-stages";
import NewResearchModal from "./NewResearchModal";

export interface ProjectItem {
  id: number;
  title: string;
  shortDescription?: string | null;
  researchObjective?: string | null;
  researchQuestion?: string | null;
  areaOfInterest?: string | null;
  expectedOutcome?: string | null;
  status: string;
  currentStage: string;
  progressPercent: number;
  plantId?: string | null;
  plantCustomName?: string | null;
  plantName: string;
  plantScientificName?: string | null;
  plantCategory?: string | null;
  plantImageUrl?: string | null;
  feedbackCount: number;
  completedStagesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogPlant {
  id: string;
  slug?: string;
  commonName: string;
  scientificName: string;
  category?: string;
  is_pitahc?: number;
  imageUrl?: string | null;
  plant_parts_used?: string | null;
}

export interface TabCounts {
  ALL: number;
  ACTIVE: number;
  UNDER_REVIEW: number;
  REVISION_REQUIRED: number;
  COMPLETED: number;
  ARCHIVED: number;
}

const FILTER_TABS = [
  { label: "All Projects", value: "ALL" },
  { label: "Active Pipeline", value: "ACTIVE" },
  { label: "Under Review", value: "UNDER_REVIEW" },
  { label: "Revisions Needed", value: "REVISION_REQUIRED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Archived", value: "ARCHIVED" },
];

export const STAGE_DISPLAY_NAMES: Record<string, string> = {
  "plant-literature": "01 Plant & Literature",
  "in-silico": "02 In-Silico Analysis",
  docking: "03 Molecular Docking",
  "formulation-safety": "04 Formulation & Safety",
  "completion-integration": "05 Research Integration",
  "expert-review": "06 Final Professional Review",
};

// Check if plant matches the 10 DOH/PITAHC verified medicinal species
function isPitahcSpecimen(name?: string | null, sciName?: string | null): boolean {
  const n = (name || "").toLowerCase();
  const s = (sciName || "").toLowerCase();
  return (
    n.includes("sambong") || s.includes("balsamifera") ||
    n.includes("lagundi") || s.includes("negundo") ||
    n.includes("ampalaya") || s.includes("charantia") ||
    n.includes("bawang") || s.includes("sativum") ||
    n.includes("bayabas") || s.includes("guajava") ||
    n.includes("akapulko") || s.includes("alata") ||
    n.includes("niyog") || s.includes("indica") ||
    n.includes("tsaang") || s.includes("retusa") ||
    n.includes("ulasimang") || n.includes("pansit") || s.includes("pellucida") ||
    n.includes("yerba") || s.includes("cordifolia")
  );
}

export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHour / 24);

    if (diffMin < 2) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Recently";
  }
}

export default function ResearchProjectsManager() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [tabCounts, setTabCounts] = useState<TabCounts>({
    ALL: 0,
    ACTIVE: 0,
    UNDER_REVIEW: 0,
    REVISION_REQUIRED: 0,
    COMPLETED: 0,
    ARCHIVED: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("updatedAt");

  // New Project Modal State
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [plantsCatalog, setPlantsCatalog] = useState<CatalogPlant[]>([]);
  const [loadingPlants, setLoadingPlants] = useState<boolean>(false);

  // Action Menu & Delete Modal State
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<ProjectItem | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Completion Success Dialog State
  const [completedProject, setCompletedProject] = useState<{ id: string; plantName: string } | null>(null);

  useEffect(() => {
    if (searchParams.get("completed") === "true") {
      const projId = searchParams.get("projectId") || "";
      const pName = searchParams.get("plantName") || searchParams.get("projectTitle") || "Botanical";
      const key = `natureaide_completed_modal_shown_${projId}`;

      if (typeof window !== "undefined") {
        const alreadyShown = sessionStorage.getItem(key);
        if (!alreadyShown) {
          sessionStorage.setItem(key, "true");
          setCompletedProject({ id: projId, plantName: pName });
        }
        // Clean search parameters from URL so refreshing won't trigger modal again
        window.history.replaceState({}, "", "/researcher/projects");
      }
    }
  }, [searchParams]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  // Close dropdown menu on outside click
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveMenuId(null);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Handle Project Deletion
  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    if (deleteConfirmText.trim() !== "DELETE") return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/researcher/projects/${projectToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete project");
      }

      const deletedId = projectToDelete.id;
      const deletedStatus = (projectToDelete.status || "").toUpperCase();

      // Remove from list immediately
      setProjects((prev) => prev.filter((p) => p.id !== deletedId));

      // Refresh / recalculate tabCounts immediately
      setTabCounts((prev) => {
        const isCompleted = deletedStatus === "COMPLETED";
        const isReview = deletedStatus === "UNDER_REVIEW" || deletedStatus === "READY_FOR_REVIEW";
        const isRevision = deletedStatus === "REVISION_REQUIRED";
        const isActive =
          deletedStatus === "IN_PROGRESS" ||
          deletedStatus === "ACTIVE" ||
          deletedStatus === "DRAFT";
        const isArchived = deletedStatus === "ARCHIVED";

        return {
          ...prev,
          ALL: Math.max(0, prev.ALL - 1),
          ACTIVE: isActive ? Math.max(0, prev.ACTIVE - 1) : prev.ACTIVE,
          UNDER_REVIEW: isReview ? Math.max(0, prev.UNDER_REVIEW - 1) : prev.UNDER_REVIEW,
          REVISION_REQUIRED: isRevision ? Math.max(0, prev.REVISION_REQUIRED - 1) : prev.REVISION_REQUIRED,
          COMPLETED: isCompleted ? Math.max(0, prev.COMPLETED - 1) : prev.COMPLETED,
          ARCHIVED: isArchived ? Math.max(0, prev.ARCHIVED - 1) : prev.ARCHIVED,
        };
      });

      // Close modal & reset fields
      setProjectToDelete(null);
      setDeleteConfirmText("");
      showToast("Research project deleted successfully");
    } catch (err: any) {
      console.error("Delete project error:", err);
      setDeleteError(err.message || "Failed to delete project. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle URL ?new=true param
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setShowNewModal(true);
    }
  }, [searchParams]);

  // Fetch Projects Data
  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (activeTab !== "ALL") params.set("status", activeTab);
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      params.set("sort", sortBy);

      const res = await fetch(`/api/researcher/projects?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load projects (${res.status})`);
      }
      const data = await res.json();
      if (data.success) {
        setProjects(data.projects || []);
        if (data.tabCounts) setTabCounts(data.tabCounts);
      } else {
        throw new Error(data.error || "Unable to retrieve projects");
      }
    } catch (err: any) {
      console.error("Fetch projects error:", err);
      setError(err.message || "An error occurred while loading projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [activeTab, sortBy]);

  // Fetch Plants Catalog when modal opens
  useEffect(() => {
    if (showNewModal && plantsCatalog.length === 0) {
      setLoadingPlants(true);
      fetch("/api/researcher/plants")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.plants) {
            setPlantsCatalog(data.plants);
          }
        })
        .catch((err) => console.error("Failed to load plants catalog:", err))
        .finally(() => setLoadingPlants(false));
    }
  }, [showNewModal, plantsCatalog.length]);

  // Local filter for search query typing
  const displayedProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.plantName?.toLowerCase().includes(q) ||
        p.plantScientificName?.toLowerCase().includes(q) ||
        p.shortDescription?.toLowerCase().includes(q) ||
        p.researchObjective?.toLowerCase().includes(q)
    );
  }, [projects, searchQuery]);

  const getStatusBadge = (status: string) => {
    const norm = (status || "").toUpperCase();
    switch (norm) {
      case "IN_PROGRESS":
      case "ACTIVE":
      case "DRAFT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Active
          </span>
        );
      case "UNDER_REVIEW":
      case "READY_FOR_REVIEW":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/80">
            <Clock className="w-3 h-3 text-amber-700" />
            Under Review
          </span>
        );
      case "REVISION_REQUIRED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200/80">
            <AlertCircle className="w-3 h-3 text-rose-700" />
            Revisions Needed
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200/80">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
            COMPLETED
          </span>
        );
      case "ARCHIVED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Archived
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-none space-y-6 pb-12">
      {/* 1. TOP HEADER WORKSPACE BANNER */}
      <div className="w-full bg-[#0f2c20] rounded-xl border border-emerald-900/60 p-6 sm:p-7 shadow-sm text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium tracking-wider uppercase text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 rounded px-2.5 py-0.5">
                Research Workspace
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              My Research Projects
            </h1>
            <p className="text-sm text-emerald-100/80 leading-relaxed">
              Manage botanical investigations, in-silico computational screening, molecular docking,
              and peer validation dossiers across the 6-stage scientific pipeline.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-[#091a13] text-sm font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Research Project</span>
          </button>
        </div>
      </div>

      {/* 2. STATS & KPI METRICS CARDS */}
      <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Studies */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Total Studies</span>
            <FolderGit2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
              {tabCounts.ALL}
            </div>
            <span className="text-xs text-slate-400">investigations enrolled</span>
          </div>
        </div>

        {/* Active Pipeline */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-xs font-medium uppercase tracking-wider">Active Pipeline</span>
            <FlaskConical className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-semibold text-emerald-800 tracking-tight">
              {tabCounts.ACTIVE}
            </div>
            <span className="text-xs text-slate-400">in execution</span>
          </div>
        </div>

        {/* Under Review */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-xs font-medium uppercase tracking-wider">Under Review</span>
            <ClipboardCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-semibold text-amber-800 tracking-tight">
              {tabCounts.UNDER_REVIEW + tabCounts.REVISION_REQUIRED}
            </div>
            <span className="text-xs text-slate-400">evaluating &amp; revisions</span>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-teal-800">
            <span className="text-xs font-medium uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-semibold text-teal-800 tracking-tight">
              {tabCounts.COMPLETED}
            </div>
            <span className="text-xs text-slate-400">dossiers finalized</span>
          </div>
        </div>
      </div>

      {/* 3. CONTROLS STRIP (FILTERS, SEARCH & SORT) */}
      <div className="w-full bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-xs space-y-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {FILTER_TABS.map((tab) => {
            const count = tabCounts[tab.value as keyof TabCounts] ?? 0;
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#0f2c20] text-white"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-medium ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2.5 border-t border-slate-100">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, medicinal plant, or objective..."
              className="w-full h-10 pl-9 pr-8 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-600">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 px-3 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 cursor-pointer transition-colors"
            >
              <option value="updatedAt">Recently Updated</option>
              <option value="progress">Highest Progress</option>
              <option value="title">Project Title (A-Z)</option>
              <option value="createdAt">Creation Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. MAIN PROJECT LIST / CARDS */}
      {loading ? (
        <div className="w-full py-20 flex flex-col items-center justify-center space-y-3 bg-white rounded-xl border border-slate-200/90 p-8 shadow-xs">
          <Loader2 className="w-7 h-7 text-emerald-700 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">
            Synchronizing research projects database...
          </p>
        </div>
      ) : error ? (
        <div className="w-full p-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-center space-y-2">
          <AlertCircle className="w-5 h-5 mx-auto text-rose-600" />
          <p className="text-sm font-medium">{error}</p>
          <button
            onClick={fetchProjects}
            className="px-3.5 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-medium cursor-pointer transition-colors"
          >
            Retry
          </button>
        </div>
      ) : displayedProjects.length === 0 ? (
        <div className="w-full bg-white rounded-xl border border-slate-200/90 p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center mx-auto border border-slate-200/80">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-semibold text-slate-900">
              No research projects found
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {searchQuery
                ? `No investigations found matching "${searchQuery}". Try clearing search keywords.`
                : "No projects in this category yet. Begin a new botanical study to initiate the 6-stage workflow."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (searchQuery) setSearchQuery("");
              else setShowNewModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0f2c20] hover:bg-[#164533] text-white text-xs font-medium shadow-xs cursor-pointer transition-colors"
          >
            {searchQuery ? (
              <span>Clear Search Filter</span>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Start New Investigation</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {displayedProjects.map((project) => {
            const activeStageName =
              STAGE_DISPLAY_NAMES[project.currentStage] ||
              project.currentStage.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
            const isDone =
              project.status === "COMPLETED" ||
              (completedProject?.id && String(project.id) === String(completedProject.id));
            const isPitahc = isPitahcSpecimen(project.plantName, project.plantScientificName);

            return (
              <div
                key={project.id}
                className={`bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative ${
                  activeMenuId === project.id ? "z-20 overflow-visible" : "overflow-hidden"
                }`}
              >
                {/* Card Content Area */}
                <div className="p-5 space-y-3.5">
                  {/* Header: Status, Timestamp & Actions Menu */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(isDone ? "COMPLETED" : project.status)}
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatRelativeTime(project.updatedAt)}</span>
                      </span>
                    </div>

                    {/* Actions Menu */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === project.id ? null : project.id);
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        aria-label="Project options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === project.id && (
                        <div
                          className="absolute right-0 top-full mt-1.5 w-48 rounded-lg bg-white border border-slate-200 shadow-xl py-1.5 z-30"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link
                            href={`/researcher/projects/${project.id}`}
                            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            onClick={() => setActiveMenuId(null)}
                          >
                            <FolderGit2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>Open Workspace</span>
                          </Link>

                          <Link
                            href={`/researcher/projects/${project.id}/completion-integration`}
                            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            onClick={() => setActiveMenuId(null)}
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                            <span>View Dossier</span>
                          </Link>

                          <div className="my-1 border-t border-slate-100" />

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              setProjectToDelete(project);
                              setDeleteConfirmText("");
                              setDeleteError(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Delete Project</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Plant Specimen Strip */}
                  <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50/80 border border-slate-100">
                    {project.plantImageUrl ? (
                      <div className="w-9 h-9 rounded-md overflow-hidden relative shrink-0 border border-slate-200/80">
                        <Image
                          src={project.plantImageUrl}
                          alt={project.plantName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
                        <Leaf className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-xs text-slate-900 truncate">
                          {project.plantName}
                        </span>
                        {isPitahc ? (
                          <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded px-1.5 py-0.2 shrink-0">
                            PITAHC
                          </span>
                        ) : project.plantCategory ? (
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-200/60 rounded px-1.5 py-0.2 shrink-0 truncate max-w-[140px]">
                            {project.plantCategory}
                          </span>
                        ) : null}
                      </div>
                      {project.plantScientificName && (
                        <p className="text-[11px] italic text-slate-500 truncate">
                          {project.plantScientificName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Project Title & Objective */}
                  <div className="space-y-1">
                    <Link
                      href={`/researcher/projects/${project.id}`}
                      className="font-semibold text-sm text-slate-900 hover:text-emerald-800 transition-colors line-clamp-2 leading-snug block"
                      title={project.title}
                    >
                      {project.title}
                    </Link>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {project.researchObjective ||
                        project.shortDescription ||
                        "Botanical investigation advancing through NatureAide computational and benchtop screening stages."}
                    </p>
                  </div>

                  {/* 6-Stage Progress Indicator */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 text-xs flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <span>{activeStageName}</span>
                      </span>
                      <span className="font-mono font-medium text-slate-700 text-xs">
                        {project.progressPercent}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isDone ? "bg-teal-600" : "bg-emerald-600"
                        }`}
                        style={{ width: `${project.progressPercent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Stage {project.completedStagesCount} of 6 Completed</span>
                      {project.feedbackCount > 0 && (
                        <span className="text-amber-700 font-medium flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span>
                            {project.feedbackCount} Reviewer Note{project.feedbackCount > 1 ? "s" : ""}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="px-5 py-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    href={`/researcher/projects/${project.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    <span>Workspace</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    href={isDone ? getStageUrl(project.id, "completion-integration") : getStageUrl(project.id, project.currentStage)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0f2c20] hover:bg-[#164533] text-white text-xs font-medium transition-colors"
                  >
                    <span>{isDone ? "View Final Dossier" : "Continue Stage"}</span>
                    <ArrowRight className="w-3 h-3 text-emerald-300" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. CREATE NEW PROJECT MODAL */}
      <NewResearchModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        plantsCatalog={plantsCatalog}
        loadingPlants={loadingPlants}
      />

      {/* 6. DELETE PROJECT CONFIRMATION MODAL */}
      <AnimatePresence>
        {projectToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => !isDeleting && setProjectToDelete(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200/90 overflow-hidden z-10 my-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-200/80 bg-white flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-700 shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Delete Research Project?
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {projectToDelete.plantName} — {projectToDelete.title}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !isDeleting && setProjectToDelete(null)}
                  className="p-1.5 -mr-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  disabled={isDeleting}
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 text-xs text-slate-600">
                <p className="text-sm text-slate-800 leading-relaxed">
                  Deleting this project will permanently remove its research workspace and associated scientific records.
                </p>

                {/* Affected Data List */}
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Affected project data:
                  </span>
                  <ul className="space-y-1 text-xs text-slate-600 list-disc list-inside">
                    <li>Stage 1–6 investigation milestones</li>
                    <li>Curated literature and reference evidence</li>
                    <li>Phytochemical screening &amp; molecular docking poses</li>
                    <li>Formulation and safety profiles</li>
                    <li>Review records &amp; integration dossiers</li>
                  </ul>
                </div>

                {/* Stronger Warning for Under Review / Completed */}
                {(projectToDelete.status === "UNDER_REVIEW" ||
                  projectToDelete.status === "READY_FOR_REVIEW" ||
                  projectToDelete.status === "COMPLETED") && (
                  <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-medium text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Formal Review &amp; Dossier Records</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      This project has already entered professional review. Deleting it will also remove its associated formal review records.
                    </p>
                  </div>
                )}

                {/* Error Banner */}
                {deleteError && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{deleteError}</span>
                  </div>
                )}

                {/* Confirmation Input */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-medium text-slate-700">
                    To confirm deletion, type <span className="font-mono font-bold text-rose-700">DELETE</span> below:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    disabled={isDeleting}
                    className="w-full h-10 px-3.5 rounded-lg border border-rose-300 focus:border-rose-600 focus:ring-1 focus:ring-rose-600 bg-rose-50/20 text-xs font-mono font-bold text-slate-900 outline-none transition-colors placeholder:text-rose-300 placeholder:font-sans"
                    autoFocus
                  />
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setProjectToDelete(null)}
                    disabled={isDeleting}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteProject}
                    disabled={deleteConfirmText.trim() !== "DELETE" || isDeleting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Deleting Project...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Project</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-lg bg-slate-900 text-white text-xs font-medium shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 7. RESEARCH COMPLETED SUCCESS MODAL */}
      <AnimatePresence>
        {completedProject && (
          <ResearchCompletedSuccessModal
            completedProject={completedProject}
            onClose={() => setCompletedProject(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ResearchCompletedSuccessModal({
  completedProject,
  onClose,
}: {
  completedProject: { id: string | number | null; plantName: string };
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Full-viewport overlay covering header/navbar/sidebar/footer */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity cursor-pointer"
        aria-hidden="true"
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 10 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="pointer-events-auto relative w-full max-w-md rounded-3xl bg-white border border-[#dde6df] shadow-2xl p-6 sm:p-8 space-y-5 text-slate-900 text-center my-auto"
        >
          {/* Subtle Animated Check Icon */}
          <motion.div
            initial={{ scale: 0.6, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.08 }}
            className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25"
          >
            <CheckCircle2 className="w-8 h-8 text-white" />
          </motion.div>

          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-[#0f2c20] tracking-tight">
              Research Completed Successfully
            </h3>
            <div className="space-y-1.5 text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              <p className="font-semibold text-slate-800 text-[13px]">
                {completedProject.plantName} research has been successfully completed.
              </p>
              <p className="text-slate-500 leading-relaxed">
                All research stages and required professional reviews have been finalized.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
            {completedProject.id && (
              <Link
                href={`/researcher/projects/${completedProject.id}`}
                onClick={onClose}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#0f2c20] hover:bg-[#164130] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <span>View Research Project</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </Link>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </div>,
    document.body
  );
}
