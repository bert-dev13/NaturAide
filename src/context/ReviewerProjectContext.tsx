"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export interface ReviewFlowStage {
  number: string;
  stageNumber: number;
  stageName: string;
  professionalExpert: string;
  expertise: string;
  areaKey: string;
  status: "APPROVED" | "IN_REVIEW" | "REVISION_REQUIRED" | "NOT_SUBMITTED";
  statusLabel: string;
  actionUrl: string;
  reviewerName?: string | null;
  approvedAt?: string | null;
}

export interface ActiveProjectInfo {
  id: number;
  title: string;
  plantName: string;
  plantScientificName?: string | null;
  status?: string;
  stages?: ReviewFlowStage[];
}

interface ReviewerProjectContextType {
  activeProject: ActiveProjectInfo | null;
  setActiveProject: (project: ActiveProjectInfo | null) => void;
  clearActiveProject: () => void;
  refreshActiveProject: () => void;
}

const ReviewerProjectContext = createContext<ReviewerProjectContextType>({
  activeProject: null,
  setActiveProject: () => {},
  clearActiveProject: () => {},
  refreshActiveProject: () => {},
});

const STORAGE_KEY = "natureaide_active_review_project";

export function ReviewerProjectProvider({ children }: { children: React.ReactNode }) {
  const [activeProject, setActiveProjectState] = useState<ActiveProjectInfo | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed.id === "number") {
            return parsed;
          }
        }
      } catch (e) {
        console.error("Failed to read active project from localStorage:", e);
      }
    }
    return null;
  });

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setActiveProject = useCallback((project: ActiveProjectInfo | null) => {
    setActiveProjectState(project);
    if (typeof window !== "undefined") {
      try {
        if (project) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {
        console.error("Failed to save active project to localStorage:", e);
      }
    }
  }, []);

  const clearActiveProject = useCallback(() => {
    setActiveProject(null);
  }, [setActiveProject]);

  const fetchProjectDetails = useCallback((pid: number) => {
    fetch(`/api/reviewer/projects/${pid}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.project) {
          setActiveProject({
            id: data.project.id,
            title: data.project.title,
            plantName: data.project.plantName,
            plantScientificName: data.project.plantScientificName || null,
            status: data.project.overallStatus || data.project.projectStatus || "Under Review",
            stages: data.project.stages || [],
          });
        }
      })
      .catch((err) => {
        console.error("Failed to fetch project details:", err);
      });
  }, [setActiveProject]);

  const refreshActiveProject = useCallback(() => {
    if (activeProject?.id) {
      fetchProjectDetails(activeProject.id);
    }
  }, [activeProject?.id, fetchProjectDetails]);

  // Derive and auto-sync active project from URL route when available
  useEffect(() => {
    let projectIdFromUrl: number | null = null;

    // 1. Direct path check: /reviewer/projects/:id
    const projectMatch = pathname?.match(/^\/reviewer\/projects\/(\d+)/);
    if (projectMatch) {
      const parsed = parseInt(projectMatch[1], 10);
      if (!isNaN(parsed)) projectIdFromUrl = parsed;
    }

    // 2. Query param check: ?projectId=:id (e.g. /reviewer/checking/:role?projectId=:id)
    if (!projectIdFromUrl && searchParams) {
      const qProj = searchParams.get("projectId");
      if (qProj) {
        const parsed = parseInt(qProj, 10);
        if (!isNaN(parsed)) projectIdFromUrl = parsed;
      }
    }

    if (projectIdFromUrl && (!activeProject || activeProject.id !== projectIdFromUrl || !activeProject.stages)) {
      fetchProjectDetails(projectIdFromUrl);
    }
  }, [pathname, searchParams, activeProject, fetchProjectDetails]);

  return (
    <ReviewerProjectContext.Provider
      value={{
        activeProject,
        setActiveProject,
        clearActiveProject,
        refreshActiveProject,
      }}
    >
      {children}
    </ReviewerProjectContext.Provider>
  );
}

export function useReviewerProject() {
  return useContext(ReviewerProjectContext);
}

