"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Filter,
  ArrowUpDown,
  ArrowRight,
  Clock,
  Leaf,
  Layers,
  Sprout,
  Cpu,
  Network,
  Microscope,
  AlertCircle,
  X,
  Loader2,
  ChevronRight,
  Sparkles,
  MoreVertical,
  Trash2,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { getStageUrl } from "@/lib/workflow-stages";

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
  slug: string;
  commonName: string;
  scientificName: string;
  category: string;
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
  const [creatingProject, setCreatingProject] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // New Project Form Fields
  const [newTitle, setNewTitle] = useState("");
  const [newObjective, setNewObjective] = useState("");
  const [selectedPlantId, setSelectedPlantId] = useState("");
  const [customPlantName, setCustomPlantName] = useState("");
  const [isCustomPlant, setIsCustomPlant] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newArea, setNewArea] = useState("");
  const [newOutcome, setNewOutcome] = useState("");

  // Action Menu & Delete Modal State
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<ProjectItem | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
      showToast("Research project deleted");
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

  // Create Project Handler
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setCreateError("Research Project Title is required.");
      return;
    }
    if (!isCustomPlant && !selectedPlantId) {
      setCreateError("Please select a target medicinal plant or provide a novel specimen.");
      return;
    }
    if (isCustomPlant && !customPlantName.trim()) {
      setCreateError("Please provide the custom plant specimen name.");
      return;
    }

    setCreatingProject(true);
    setCreateError(null);

    try {
      const payload = {
        title: newTitle.trim(),
        researchObjective: newObjective.trim() || undefined,
        shortDescription: newObjective.trim().slice(0, 200) || undefined,
        plantId: isCustomPlant ? undefined : selectedPlantId || undefined,
        plantCustomName: isCustomPlant ? customPlantName.trim() : undefined,
        researchQuestion: newQuestion.trim() || undefined,
        areaOfInterest: newArea.trim() || "Herbal Pharmacology & Bioactive Compounds",
        expectedOutcome: newOutcome.trim() || "Empirical scientific dossier & validation benchmarks",
      };

      const res = await fetch("/api/researcher/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create research project");
      }

      setShowNewModal(false);
      // Navigate to the newly initialized workspace
      router.push(`/researcher/projects/${data.projectId}`);
    } catch (err: any) {
      console.error("Create project error:", err);
      setCreateError(err.message || "An unexpected error occurred while creating project");
      setCreatingProject(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const norm = (status || "").toUpperCase();
    switch (norm) {
      case "IN_PROGRESS":
      case "ACTIVE":
      case "DRAFT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        );
      case "UNDER_REVIEW":
      case "READY_FOR_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-700" />
            Under Review
          </span>
        );
      case "REVISION_REQUIRED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-700" />
            Revisions Needed
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
            <CheckCircle2 className="w-3 h-3 text-teal-700" />
            Completed
          </span>
        );
      case "ARCHIVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            Archived
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700">
            {norm.replace(/_/g, " ")}
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-none space-y-6 pb-12">
      {/* 1. TOP HEADER HERO BANNER */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full rounded-3xl bg-gradient-to-r from-[#0f2c20] via-[#164533] to-[#1e5c44] text-white p-6 sm:p-8 shadow-sm relative overflow-hidden"
      >
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold tracking-wide uppercase">
              <Sprout className="w-3.5 h-3.5" />
              <span>NatureAide Lab • Research Workspace</span>
            </div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              My Research Projects
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Orchestrate botanical investigations, in-silico computational screening, molecular docking,
              and peer validation across the standardized 6-stage NatureAide pipeline.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-[#091a13] font-heading font-extrabold text-sm shadow-md transition-all hover:scale-102 active:scale-98 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Research Project</span>
          </button>
        </div>
      </motion.div>

      {/* 2. STATS & KPI METRICS CARDS */}
      <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="bg-white rounded-2xl border border-[#dde6df] p-4 shadow-2xs hover:shadow-xs transition-shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#78997f] uppercase tracking-wider">
              Total Studies
            </span>
            <div className="p-2 rounded-xl bg-slate-100 text-[#0f2c20]">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-heading font-extrabold text-[#0f2c20]">
              {tabCounts.ALL}
            </span>
            <span className="text-[11px] text-[#78997f]">investigations</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="bg-white rounded-2xl border border-[#dde6df] p-4 shadow-2xs hover:shadow-xs transition-shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Active Pipeline
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <FlaskConical className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-heading font-extrabold text-emerald-700">
              {tabCounts.ACTIVE}
            </span>
            <span className="text-[11px] text-[#78997f]">in execution</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.15 }}
          className="bg-white rounded-2xl border border-[#dde6df] p-4 shadow-2xs hover:shadow-xs transition-shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Under Review
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-heading font-extrabold text-amber-700">
              {tabCounts.UNDER_REVIEW + tabCounts.REVISION_REQUIRED}
            </span>
            <span className="text-[11px] text-[#78997f]">evaluating</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.2 }}
          className="bg-white rounded-2xl border border-[#dde6df] p-4 shadow-2xs hover:shadow-xs transition-shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
              Completed
            </span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-heading font-extrabold text-teal-700">
              {tabCounts.COMPLETED}
            </span>
            <span className="text-[11px] text-[#78997f]">published & integrated</span>
          </div>
        </motion.div>
      </div>

      {/* 3. CONTROLS STRIP (FILTERS, SEARCH & SORT) */}
      <div className="w-full bg-white rounded-2xl border border-[#dde6df] p-3 sm:p-4 shadow-2xs space-y-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {FILTER_TABS.map((tab) => {
            const count = tabCounts[tab.value as keyof TabCounts] ?? 0;
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#0f2c20] text-white shadow-xs"
                    : "bg-[#f6f8f6] text-[#475550] hover:bg-[#edf2ee] hover:text-[#0f2c20]"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isActive
                      ? "bg-emerald-400 text-[#091a13]"
                      : "bg-[#dde6df] text-[#475550]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-[#f0f4f1]">
          {/* Search Box */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78997f]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, medicinal plant, or objective..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#f6f8f6] border border-[#dde6df] text-xs text-[#0f2c20] placeholder-[#78997f] focus:outline-none focus:border-[#16a34a] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#78997f] hover:text-[#0f2c20]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#78997f]" />
            <span className="text-xs font-semibold text-[#475550]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#f6f8f6] border border-[#dde6df] text-xs font-bold text-[#0f2c20] focus:outline-none focus:border-[#16a34a] cursor-pointer"
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
        <div className="w-full py-20 flex flex-col items-center justify-center space-y-3 bg-white rounded-3xl border border-[#dde6df] p-8">
          <Loader2 className="w-8 h-8 text-[#16a34a] animate-spin" />
          <p className="text-xs text-[#475550] font-bold">
            Synchronizing research projects database...
          </p>
        </div>
      ) : error ? (
        <div className="w-full p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-center space-y-2">
          <AlertCircle className="w-6 h-6 mx-auto text-rose-600" />
          <p className="text-sm font-bold">{error}</p>
          <button
            onClick={fetchProjects}
            className="px-4 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : displayedProjects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full bg-white rounded-3xl border border-[#dde6df] p-12 text-center space-y-4 shadow-2xs"
        >
          <div className="w-16 h-16 rounded-3xl bg-[#f6f8f6] text-[#78997f] flex items-center justify-center mx-auto border border-[#dde6df]">
            <FolderGit2 className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="font-heading font-extrabold text-base text-[#0f2c20]">
              No research projects match this filter
            </h3>
            <p className="text-xs text-[#78997f] leading-relaxed">
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0f2c20] hover:bg-[#164533] text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
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
        </motion.div>
      ) : (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          <AnimatePresence>
            {displayedProjects.map((project, idx) => {
              const activeStageName =
                STAGE_DISPLAY_NAMES[project.currentStage] ||
                project.currentStage.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
              const isDone = project.status === "COMPLETED";

              return (
                <motion.article
                  key={project.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.04 }}
                  className={`bg-white rounded-3xl border border-[#dde6df] hover:border-[#16a34a] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group relative ${
                    activeMenuId === project.id ? "z-20 overflow-visible" : "overflow-hidden"
                  }`}
                >
                  {/* Card Content Area */}
                  <div className="p-5 space-y-4">
                    {/* Header: Status, Timestamp & Three-dot Actions Menu */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(project.status)}
                        <span className="text-[11px] font-bold text-[#78997f] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#78997f]" />
                          <span>{formatRelativeTime(project.updatedAt)}</span>
                        </span>
                      </div>

                      {/* Small Actions Menu (Three dots) */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === project.id ? null : project.id);
                          }}
                          className="p-1 rounded-lg text-[#78997f] hover:text-[#0f2c20] hover:bg-[#edf2ee] transition-colors cursor-pointer"
                          aria-label="Project actions"
                          title="Actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuId === project.id && (
                          <div
                            className="absolute right-0 top-full mt-1.5 w-48 rounded-2xl bg-white border border-[#dde6df] shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link
                              href={`/researcher/projects/${project.id}`}
                              className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-[#0f2c20] hover:bg-[#f6f8f6] transition-colors"
                              onClick={() => setActiveMenuId(null)}
                            >
                              <FolderGit2 className="w-3.5 h-3.5 text-[#52796f]" />
                              <span>Open Workspace</span>
                            </Link>

                            <Link
                              href={`/researcher/projects/${project.id}/completion-integration`}
                              className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-[#0f2c20] hover:bg-[#f6f8f6] transition-colors"
                              onClick={() => setActiveMenuId(null)}
                            >
                              <FileText className="w-3.5 h-3.5 text-[#52796f]" />
                              <span>View Dossier</span>
                            </Link>

                            <div className="my-1 border-t border-[#edf2ee]" />

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                setProjectToDelete(project);
                                setDeleteConfirmText("");
                                setDeleteError(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Delete Project</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Plant Specimen Banner */}
                    <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#f6f8f6] border border-[#edf2ee]">
                      {project.plantImageUrl ? (
                        <div className="w-10 h-10 rounded-xl overflow-hidden relative shrink-0 border border-[#dde6df]">
                          <Image
                            src={project.plantImageUrl}
                            alt={project.plantName}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                          <Leaf className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-heading font-extrabold text-xs text-[#0f2c20] truncate">
                            {project.plantName}
                          </span>
                          {project.plantCategory && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#dde6df] text-[#0f2c20] shrink-0">
                              {project.plantCategory}
                            </span>
                          )}
                        </div>
                        {project.plantScientificName && (
                          <p className="text-[11px] italic text-[#78997f] truncate">
                            {project.plantScientificName}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Project Title & Objective */}
                    <div className="space-y-1.5">
                      <Link
                        href={`/researcher/projects/${project.id}`}
                        className="font-heading font-extrabold text-base text-[#0f2c20] hover:text-[#16a34a] transition-colors line-clamp-2 block leading-snug"
                        title={project.title}
                      >
                        {project.title}
                      </Link>
                      <p className="text-xs text-[#475550] line-clamp-2 leading-relaxed">
                        {project.researchObjective ||
                          project.shortDescription ||
                          "Botanical investigation advancing through NatureAide computational and benchtop screening stages."}
                      </p>
                    </div>

                    {/* 6-Stage Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#0f2c20] text-[11px] flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-[#16a34a]" />
                          <span>{activeStageName}</span>
                        </span>
                        <span className="font-extrabold text-[#16a34a] text-xs">
                          {project.progressPercent}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#edf2ee] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#16a34a] to-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${project.progressPercent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#78997f]">
                        <span>Stage {project.completedStagesCount} of 6 Completed</span>
                        {project.feedbackCount > 0 && (
                          <span className="text-amber-700 font-bold">
                            {project.feedbackCount} Reviewer Note{project.feedbackCount > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="px-5 py-3.5 bg-[#fbfdfb] border-t border-[#edf2ee] flex items-center justify-between gap-2">
                    <Link
                      href={`/researcher/projects/${project.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#0f2c20] hover:text-[#16a34a] transition-colors"
                    >
                      <span>Workspace</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>

                    <Link
                      href={isDone ? getStageUrl(project.id, "completion-integration") : getStageUrl(project.id, project.currentStage)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0f2c20] hover:bg-[#164533] text-white text-xs font-bold shadow-xs hover:shadow transition-all group-hover:scale-102"
                    >
                      <span>{isDone ? "View Final Dossier" : "Continue Stage"}</span>
                      <ArrowRight className="w-3 h-3 text-emerald-300" />
                    </Link>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* 5. CREATE NEW PROJECT MODAL */}
      <AnimatePresence>
        {showNewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !creatingProject && setShowNewModal(false)}
              className="fixed inset-0 bg-[#091a13]/70 backdrop-blur-xs"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#dde6df] overflow-hidden z-10 my-8"
            >
              {/* Header */}
              <div className="p-5 sm:p-6 bg-gradient-to-r from-[#0f2c20] to-[#164533] text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-300">
                    <Sprout className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-lg text-white">
                      Start New Research Investigation
                    </h3>
                    <p className="text-xs text-emerald-200/80">
                      Initializes the 6-stage NatureAide scientific pipeline
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  disabled={creatingProject}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleCreateProject} className="p-5 sm:p-6 space-y-4">
                {createError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{createError}</span>
                  </div>
                )}

                {/* Plant Selection */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#0f2c20]">
                      Target Medicinal Plant Specimen <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomPlant(!isCustomPlant)}
                      className="text-[11px] font-bold text-[#16a34a] hover:underline"
                    >
                      {isCustomPlant ? "← Choose from Catalog" : "+ Use Custom Specimen"}
                    </button>
                  </div>

                  {!isCustomPlant ? (
                    <select
                      value={selectedPlantId}
                      onChange={(e) => setSelectedPlantId(e.target.value)}
                      disabled={loadingPlants || creatingProject}
                      className="w-full p-2.5 rounded-xl bg-[#f6f8f6] border border-[#dde6df] text-xs font-medium text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                    >
                      <option value="">
                        {loadingPlants ? "Loading botanical catalog..." : "-- Select Verified Medicinal Plant --"}
                      </option>
                      {plantsCatalog.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.commonName} ({p.scientificName}) {p.is_pitahc ? "★ PITAHC" : ""}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={customPlantName}
                      onChange={(e) => setCustomPlantName(e.target.value)}
                      placeholder="e.g. Piper retrofractum Vahl (Chavica officinarum)"
                      disabled={creatingProject}
                      className="w-full p-2.5 rounded-xl bg-[#f6f8f6] border border-[#dde6df] text-xs font-medium text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                    />
                  )}
                </div>

                {/* Project Title */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0f2c20]">
                    Research Project Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. In-Silico & Empirical Evaluation of Blumea balsamifera in Renal Stone Dissolution"
                    disabled={creatingProject}
                    className="w-full p-2.5 rounded-xl bg-[#f6f8f6] border border-[#dde6df] text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a]"
                  />
                </div>

                {/* Objective */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0f2c20]">
                    Primary Research Objective
                  </label>
                  <textarea
                    rows={3}
                    value={newObjective}
                    onChange={(e) => setNewObjective(e.target.value)}
                    placeholder="Describe the therapeutic mechanism, target enzyme or pathway, and intended clinical application..."
                    disabled={creatingProject}
                    className="w-full p-2.5 rounded-xl bg-[#f6f8f6] border border-[#dde6df] text-xs text-[#0f2c20] focus:outline-none focus:border-[#16a34a] leading-relaxed"
                  />
                </div>

                {/* Target Therapeutic Area & Research Question */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#0f2c20]">
                      Therapeutic Area
                    </label>
                    <input
                      type="text"
                      value={newArea}
                      onChange={(e) => setNewArea(e.target.value)}
                      placeholder="e.g. Urolithiasis & Anti-Inflammatory"
                      disabled={creatingProject}
                      className="w-full p-2 rounded-xl bg-[#f6f8f6] border border-[#dde6df] text-xs text-[#0f2c20]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#0f2c20]">
                      Core Research Question
                    </label>
                    <input
                      type="text"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      placeholder="e.g. Do sesquiterpene lactones inhibit crystal nucleation?"
                      disabled={creatingProject}
                      className="w-full p-2 rounded-xl bg-[#f6f8f6] border border-[#dde6df] text-xs text-[#0f2c20]"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#f0f4f1]">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    disabled={creatingProject}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#475550] hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingProject}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0f2c20] hover:bg-[#164533] text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer transition-all"
                  >
                    {creatingProject ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Initializing 6 Stages...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-emerald-300" />
                        <span>Create & Open Project</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. DELETE PROJECT CONFIRMATION MODAL */}
      <AnimatePresence>
        {projectToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setProjectToDelete(null)}
              className="fixed inset-0 bg-[#091a13]/70 backdrop-blur-xs"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#dde6df] overflow-hidden z-10 my-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 sm:p-6 bg-gradient-to-r from-rose-950 via-rose-900 to-[#1c080e] text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-300">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-base sm:text-lg text-white">
                      Delete Research Project?
                    </h3>
                    <p className="text-xs text-rose-200/90 font-medium line-clamp-1">
                      {projectToDelete.plantName} — {projectToDelete.title}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !isDeleting && setProjectToDelete(null)}
                  className="p-1.5 rounded-xl text-rose-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  disabled={isDeleting}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 space-y-4 text-xs text-[#475550]">
                {/* General Warning */}
                <p className="text-xs sm:text-sm text-[#0f2c20] font-medium leading-relaxed">
                  Deleting this project will permanently remove its research workspace and associated project data.
                </p>

                {/* Affected Data List */}
                <div className="p-3.5 rounded-2xl bg-[#faf9f5] border border-[#dde6df] space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#78997f]">
                    Affected project data:
                  </span>
                  <ul className="space-y-1 text-xs text-[#2c3e38] list-disc list-inside">
                    <li>Stage 1–6 research records</li>
                    <li>Selected literature and project evidence</li>
                    <li>Compounds and computational screening results</li>
                    <li>Molecular docking runs and binding poses</li>
                    <li>Formulation and preclinical safety assessments</li>
                    <li>Research synthesis dossier</li>
                    <li>Professional review records</li>
                  </ul>
                </div>

                {/* Stronger Warning for Under Review / Completed */}
                {(projectToDelete.status === "UNDER_REVIEW" ||
                  projectToDelete.status === "READY_FOR_REVIEW" ||
                  projectToDelete.status === "COMPLETED") && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-amber-950">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Formal Review &amp; Dossier Records</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      This project has already entered professional review. Deleting it will also remove its associated review and dossier records.
                    </p>
                  </div>
                )}

                {/* Error Banner */}
                {deleteError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{deleteError}</span>
                  </div>
                )}

                {/* Confirmation Input */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-semibold text-[#0f2c20]">
                    To confirm deletion, type <span className="font-mono font-bold text-rose-700">DELETE</span> below:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    disabled={isDeleting}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-rose-300 focus:border-rose-600 bg-rose-50/20 text-xs font-mono font-bold text-[#0f2c20] outline-none transition-all placeholder:text-rose-300 placeholder:font-sans"
                    autoFocus
                  />
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#f0f4f1]">
                  <button
                    type="button"
                    onClick={() => setProjectToDelete(null)}
                    disabled={isDeleting}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#475550] hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteProject}
                    disabled={deleteConfirmText.trim() !== "DELETE" || isDeleting}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Deleting Project...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
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

      {/* 7. TOAST NOTIFICATION */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#0f2c20] text-white shadow-xl border border-emerald-500/30 text-xs font-bold"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 2) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}
