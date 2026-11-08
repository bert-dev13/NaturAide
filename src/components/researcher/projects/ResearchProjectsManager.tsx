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
  continueRoute?: string;
  currentSectionNum?: number;
  currentSectionTitle?: string;
  plantId?: string | null;
  plantCustomName?: string | null;
  plantName: string;
  plantScientificName?: string | null;
  plantCategory?: string | null;
  plantImageUrl?: string | null;
  feedbackCount: number;
  completedStagesCount: number;
  approvedSpecialtiesCount?: number;
  statusLabel?: string;
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

  const getStatusBadge = (
    status: string,
    statusLabel?: string,
    approvedCount?: number
  ) => {
    const norm = (status || "").toUpperCase();
    const label = statusLabel || status;

    if (norm === "COMPLETED" || label === "Completed") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200/80">
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
          <span>Completed</span>
        </span>
      );
    }

    if (
      norm === "APPROVED" ||
      label === "Fully Approved — Ready to Complete"
    ) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
          <span>Fully Approved — Ready to Complete</span>
        </span>
      );
    }

    if (
      norm === "REVISION_REQUIRED" ||
      norm === "REVISION_REQUESTED" ||
      label === "Revisions Required"
    ) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200/80">
          <AlertCircle className="w-3 h-3 text-rose-700" />
          <span>Revisions Required</span>
        </span>
      );
    }

    if (
      norm === "UNDER_REVIEW" ||
      norm === "READY_FOR_REVIEW" ||
      label.startsWith("Under Professional Review")
    ) {
      const displayLabel = label.startsWith("Under Professional Review")
        ? label
        : `Under Professional Review — ${approvedCount ?? 0}/3 Approved`;
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200/80">
          <Clock className="w-3 h-3 text-indigo-700" />
          <span>{displayLabel}</span>
        </span>
      );
    }

    if (norm === "IN_PROGRESS" || norm === "ACTIVE" || norm === "DRAFT") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
          <span>In Progress</span>
        </span>
      );
    }

    if (norm === "ARCHIVED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          Archived
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
        {label}
      </span>
    );
  };

  return (
    <div className="w-full max-w-none space-y-6 pb-12">
      {/* 1. TOP HEADER WORKSPACE BANNER */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative w-full overflow-hidden rounded-2xl border border-[#0f2c20]/15 bg-[linear-gradient(120deg,#0f2c20_0%,#134032_48%,#0b271b_100%)] px-4 py-3.5 text-white shadow-[0_12px_28px_-18px_rgba(15,44,32,0.55)] sm:px-5"
      >
        <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-200">
                <Layers className="h-3 w-3 text-emerald-300" />
                Research Workspace
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-100/80">
                6-stage pipeline
              </span>
            </div>
            <h1 className="mt-1.5 text-lg font-semibold tracking-tight text-white sm:text-xl">
              My Research Projects
            </h1>
            <p className="mt-0.5 text-xs text-emerald-100/75">
              Track botanical studies from literature to professional review.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-400 px-3.5 py-2 text-xs font-semibold text-[#091a13] shadow-sm transition hover:bg-emerald-300 active:bg-emerald-500"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>New Project</span>
          </button>
        </div>
      </motion.div>

      {/* 2. STATS & KPI METRICS CARDS */}
      <div className="grid w-full grid-cols-2 gap-3 sm:gap-3.5 lg:grid-cols-4">
        {[
          {
            key: "ALL",
            label: "Total Studies",
            value: tabCounts.ALL,
            hint: "All projects",
            icon: FolderGit2,
            accent: "#0f2c20",
            surface: "bg-[linear-gradient(145deg,#f4f8f5_0%,#ffffff_45%,#eef5f1_100%)]",
            iconWrap: "bg-[#0f2c20] text-emerald-200",
            valueClass: "text-[#0f2c20]",
            bar: "from-[#0f2c20] to-emerald-400",
            glow: "bg-emerald-400/20",
          },
          {
            key: "ACTIVE",
            label: "Active Pipeline",
            value: tabCounts.ACTIVE,
            hint: "In execution",
            icon: FlaskConical,
            accent: "#059669",
            surface: "bg-[linear-gradient(145deg,#ecfdf5_0%,#ffffff_45%,#f0fdfa_100%)]",
            iconWrap: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white",
            valueClass: "text-emerald-800",
            bar: "from-emerald-500 to-teal-300",
            glow: "bg-emerald-400/25",
          },
          {
            key: "UNDER_REVIEW",
            label: "Under Review",
            value: tabCounts.UNDER_REVIEW + tabCounts.REVISION_REQUIRED,
            hint: "Needs attention",
            icon: ClipboardCheck,
            accent: "#d97706",
            surface: "bg-[linear-gradient(145deg,#fffbeb_0%,#ffffff_45%,#fff7ed_100%)]",
            iconWrap: "bg-gradient-to-br from-amber-500 to-orange-500 text-white",
            valueClass: "text-amber-900",
            bar: "from-amber-500 to-orange-300",
            glow: "bg-amber-400/25",
          },
          {
            key: "COMPLETED",
            label: "Completed",
            value: tabCounts.COMPLETED,
            hint: "Dossiers finalized",
            icon: CheckCircle2,
            accent: "#0f766e",
            surface: "bg-[linear-gradient(145deg,#f0fdfa_0%,#ffffff_45%,#ecfeff_100%)]",
            iconWrap: "bg-gradient-to-br from-teal-500 to-cyan-600 text-white",
            valueClass: "text-teal-900",
            bar: "from-teal-500 to-cyan-300",
            glow: "bg-teal-400/25",
          },
        ].map((stat, index) => {
          const Icon = stat.icon;
          const isActive = activeTab === stat.key;
          return (
            <motion.button
              key={stat.key}
              type="button"
              onClick={() => setActiveTab(stat.key)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: 0.04 + index * 0.05, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.985 }}
              aria-pressed={isActive}
              className={`group relative overflow-hidden rounded-2xl border p-3.5 text-left shadow-[0_1px_2px_rgba(15,44,32,0.04)] transition-all duration-300 cursor-pointer ${stat.surface} ${
                isActive
                  ? "border-transparent"
                  : "border-[#d7e4dc]/90 hover:shadow-[0_14px_28px_-18px_rgba(15,44,32,0.35)]"
              }`}
              style={
                isActive
                  ? { boxShadow: `0 0 0 1.5px ${stat.accent}, 0 12px 24px -16px ${stat.accent}55` }
                  : undefined
              }
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
            </motion.button>
          );
        })}
      </div>

      {/* 3. CONTROLS STRIP (FILTERS, SEARCH & SORT) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.12 }}
        className="w-full overflow-hidden rounded-2xl border border-[#d7e4dc]/90 bg-[linear-gradient(180deg,#ffffff_0%,#f7faf8_100%)] shadow-[0_1px_2px_rgba(15,44,32,0.04)]"
      >
        <div className="flex items-center gap-1.5 overflow-x-auto px-3 py-2.5 sm:px-3.5 scrollbar-none">
          {FILTER_TABS.map((tab) => {
            const count = tabCounts[tab.value as keyof TabCounts] ?? 0;
            const isActive = activeTab === tab.value;
            const tone =
              tab.value === "ACTIVE"
                ? { active: "bg-emerald-700 text-white shadow-emerald-700/20", pill: "bg-white/20 text-white", idle: "hover:bg-emerald-50 hover:text-emerald-900" }
                : tab.value === "UNDER_REVIEW"
                  ? { active: "bg-amber-600 text-white shadow-amber-600/20", pill: "bg-white/20 text-white", idle: "hover:bg-amber-50 hover:text-amber-900" }
                  : tab.value === "REVISION_REQUIRED"
                    ? { active: "bg-rose-600 text-white shadow-rose-600/20", pill: "bg-white/20 text-white", idle: "hover:bg-rose-50 hover:text-rose-900" }
                    : tab.value === "COMPLETED"
                      ? { active: "bg-teal-700 text-white shadow-teal-700/20", pill: "bg-white/20 text-white", idle: "hover:bg-teal-50 hover:text-teal-900" }
                      : tab.value === "ARCHIVED"
                        ? { active: "bg-slate-600 text-white shadow-slate-600/20", pill: "bg-white/20 text-white", idle: "hover:bg-slate-100 hover:text-slate-800" }
                        : { active: "bg-[#0f2c20] text-white shadow-[#0f2c20]/25", pill: "bg-white/20 text-white", idle: "hover:bg-[#edf5f0] hover:text-[#0f2c20]" };
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive ? `${tone.active} shadow-md` : `text-[#52645d] ${tone.idle}`
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`min-w-[1.35rem] rounded-md px-1.5 py-0.5 text-center font-mono text-[10px] font-bold tabular-nums ${
                    isActive ? tone.pill : "bg-[#e8f0eb] text-[#5f7468]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 border-t border-[#e4eee8] bg-white/70 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-3.5">
          <div className="relative min-w-0 flex-1 sm:max-w-lg">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-700/70" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, medicinal plant, or objective..."
              className="h-11 w-full rounded-xl border border-[#d5e3da] bg-[#fbfdfb] pl-10 pr-9 text-sm text-[#0f2c20] placeholder:text-[#8aa094] outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/15"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#8aa094] hover:bg-[#edf5f0] hover:text-[#0f2c20] cursor-pointer"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <label className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-[#d5e3da] bg-[#fbfdfb] px-3 text-xs font-semibold text-[#52645d]">
            <ArrowUpDown className="h-3.5 w-3.5 text-emerald-700" />
            <span className="hidden sm:inline">Sort</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="cursor-pointer bg-transparent text-sm font-semibold text-[#0f2c20] outline-none"
            >
              <option value="updatedAt">Recently Updated</option>
              <option value="progress">Highest Progress</option>
              <option value="title">Project Title (A-Z)</option>
              <option value="createdAt">Creation Date</option>
            </select>
          </label>
        </div>
      </motion.div>

      {/* 4. MAIN PROJECT LIST / CARDS */}
      {loading ? (
        <div className="flex w-full flex-col items-center justify-center space-y-3 rounded-2xl border border-[#d7e4dc] bg-white px-8 py-20 shadow-xs">
          <Loader2 className="h-7 w-7 animate-spin text-emerald-700" />
          <p className="text-xs font-medium text-[#6d7f76]">Synchronizing research projects database...</p>
        </div>
      ) : error ? (
        <div className="w-full space-y-2 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800">
          <AlertCircle className="mx-auto h-5 w-5 text-rose-600" />
          <p className="text-sm font-medium">{error}</p>
          <button
            onClick={fetchProjects}
            className="cursor-pointer rounded-lg bg-rose-700 px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-rose-800"
          >
            Retry
          </button>
        </div>
      ) : displayedProjects.length === 0 ? (
        <div className="w-full space-y-3 rounded-2xl border border-[#d7e4dc] bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-[#d7e4dc] bg-[#f4f8f5] text-emerald-800">
            <FolderGit2 className="h-6 w-6" />
          </div>
          <div className="mx-auto max-w-md space-y-1">
            <h3 className="text-base font-semibold text-[#0f2c20]">No research projects found</h3>
            <p className="text-xs leading-relaxed text-[#6d7f76]">
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
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0f2c20] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#164533]"
          >
            {searchQuery ? (
              <span>Clear Search Filter</span>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                <span>Start New Investigation</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 sm:gap-4">
          {displayedProjects.map((project, index) => {
            const activeStageName =
              project.currentSectionTitle ||
              STAGE_DISPLAY_NAMES[project.currentStage] ||
              project.currentStage.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
            const isDone =
              project.status === "COMPLETED" ||
              (completedProject?.id && String(project.id) === String(completedProject.id));
            const isPitahc = isPitahcSpecimen(project.plantName, project.plantScientificName);
            const stageDots = isDone ? 6 : Math.min(6, Math.max(0, project.completedStagesCount || 0));

            return (
              <motion.article
                key={project.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.25), ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -3 }}
                className={`group relative flex flex-col justify-between rounded-2xl border bg-[linear-gradient(165deg,#ffffff_0%,#f8fbf9_100%)] shadow-[0_1px_2px_rgba(15,44,32,0.04)] transition-all duration-300 hover:border-emerald-300/70 hover:shadow-[0_18px_34px_-22px_rgba(15,44,32,0.35)] ${
                  isDone ? "border-teal-200/80" : "border-[#d7e4dc]/95"
                } ${activeMenuId === project.id ? "z-20 overflow-visible" : "overflow-hidden"}`}
              >
                <div className={`absolute inset-x-0 top-0 h-[3px] ${isDone ? "bg-gradient-to-r from-teal-600 via-teal-400 to-cyan-300" : "bg-gradient-to-r from-[#0f2c20] via-emerald-600 to-emerald-300"}`} />

                <div className="space-y-3.5 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      {getStatusBadge(
                        isDone ? "COMPLETED" : project.status,
                        project.statusLabel,
                        project.approvedSpecialtiesCount
                      )}
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#8aa094]">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(project.updatedAt)}
                      </span>
                    </div>

                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === project.id ? null : project.id);
                        }}
                        className="cursor-pointer rounded-lg p-1.5 text-[#8aa094] transition-colors hover:bg-[#edf5f0] hover:text-[#0f2c20]"
                        aria-label="Project options"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {activeMenuId === project.id && (
                        <div
                          className="absolute right-0 top-full z-30 mt-1.5 w-48 rounded-xl border border-[#d7e4dc] bg-white py-1.5 shadow-xl"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link
                            href={`/researcher/projects/${project.id}`}
                            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#234237] transition-colors hover:bg-[#f4f8f5]"
                            onClick={() => setActiveMenuId(null)}
                          >
                            <FolderGit2 className="h-3.5 w-3.5 text-emerald-700" />
                            <span>Open Workspace</span>
                          </Link>
                          <Link
                            href={`/researcher/projects/${project.id}/completion-integration`}
                            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#234237] transition-colors hover:bg-[#f4f8f5]"
                            onClick={() => setActiveMenuId(null)}
                          >
                            <FileText className="h-3.5 w-3.5 text-emerald-700" />
                            <span>View Dossier</span>
                          </Link>
                          <div className="my-1 border-t border-[#e8f0eb]" />
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              setProjectToDelete(project);
                              setDeleteConfirmText("");
                              setDeleteError(null);
                            }}
                            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                            <span>Delete Project</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border border-[#e4eee8] bg-[linear-gradient(135deg,#f4f8f5_0%,#ffffff_100%)] p-2.5">
                    {project.plantImageUrl ? (
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#d7e4dc] shadow-sm">
                        <Image src={project.plantImageUrl} alt={project.plantName} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700">
                        <Leaf className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-sm font-semibold text-[#0f2c20]">{project.plantName}</span>
                        {isPitahc ? (
                          <span className="shrink-0 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                            PITAHC
                          </span>
                        ) : project.plantCategory ? (
                          <span className="max-w-[140px] shrink-0 truncate rounded-md bg-[#e8f0eb] px-1.5 py-0.5 text-[10px] font-semibold text-[#5f7468]">
                            {project.plantCategory}
                          </span>
                        ) : null}
                      </div>
                      {project.plantScientificName && (
                        <p className="truncate text-[12px] italic text-[#6d7f76]">{project.plantScientificName}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Link
                      href={`/researcher/projects/${project.id}`}
                      className="block text-[15px] font-semibold leading-snug text-[#0f2c20] transition-colors line-clamp-2 hover:text-emerald-800"
                      title={project.title}
                    >
                      {project.title}
                    </Link>
                    <p className="line-clamp-2 text-xs leading-relaxed text-[#6d7f76]">
                      {project.researchObjective ||
                        project.shortDescription ||
                        "Botanical investigation advancing through NatureAide computational and benchtop screening stages."}
                    </p>
                  </div>

                  <div className="space-y-2 rounded-xl border border-[#e8f0eb] bg-white/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-semibold text-[#234237]">
                        <Layers className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
                        <span className="truncate">{activeStageName}</span>
                      </span>
                      <span className={`font-mono text-xs font-bold tabular-nums ${isDone ? "text-teal-800" : "text-emerald-800"}`}>
                        {project.progressPercent}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#e8f0eb]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${project.progressPercent}%` }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        className={`h-full rounded-full ${isDone ? "bg-gradient-to-r from-teal-600 to-cyan-400" : "bg-gradient-to-r from-[#0f2c20] to-emerald-500"}`}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <span
                            key={i}
                            className={`h-1.5 w-3 rounded-full ${i < stageDots ? (isDone ? "bg-teal-500" : "bg-emerald-500") : "bg-[#dce8e1]"}`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] font-medium text-[#8aa094]">
                        {isDone ? "All 6 stages complete" : `Stage ${project.completedStagesCount} of 6`}
                      </span>
                    </div>
                    {project.feedbackCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800">
                        <FileText className="h-3 w-3" />
                        {project.feedbackCount} Reviewer Note{project.feedbackCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-[#e8f0eb] bg-[#f7faf8]/90 px-4 py-3 sm:px-5">
                  <Link
                    href={`/researcher/projects/${project.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#52645d] transition-colors hover:text-[#0f2c20]"
                  >
                    <span>Workspace</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href={
                      project.continueRoute ||
                      (isDone
                        ? `/researcher/projects/${project.id}/completion`
                        : getStageUrl(project.id, project.currentStage))
                    }
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:brightness-110 ${
                      isDone ? "bg-gradient-to-r from-teal-700 to-cyan-600" : "bg-gradient-to-r from-[#0f2c20] to-emerald-700"
                    }`}
                  >
                    <span>{isDone ? "View Final Dossier" : "Continue Stage"}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-emerald-200" />
                  </Link>
                </div>
              </motion.article>
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
