// src/components/researcher/in-silico/Molecular3DStep7Section.tsx
"use client";

import React, { useState, useMemo } from "react";
import {
  Layers,
  Atom,
  Eye,
  EyeOff,
  Maximize2,
  RotateCcw,
  Camera,
  ChevronDown,
  Info,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import Molecular3DViewer from "./Molecular3DViewer";
import { DockingRunItem } from "./DockingExecutionStep4Section";

interface Step7Props {
  projectId: number;
  plantName: string;
  runs: DockingRunItem[];
  selectedRunId: number | null;
  onSelectRunId: (runId: number) => void;
  structureData: {
    receptorPdb: string;
    ligandPdbqt: string;
    interactions: any;
  } | null;
  isLoadingStructures: boolean;
}

export default function Molecular3DStep7Section({
  projectId,
  plantName,
  runs = [],
  selectedRunId,
  onSelectRunId,
  structureData,
  isLoadingStructures,
}: Step7Props) {
  const [activePose, setActivePose] = useState<number>(1);
  const [proteinStyle, setProteinStyle] = useState<"cartoon" | "surface" | "stick">("cartoon");
  const [colorScheme, setColorScheme] = useState<"spectrum" | "chain" | "secondary">("spectrum");
  const [showProtein, setShowProtein] = useState<boolean>(true);
  const [showLigand, setShowLigand] = useState<boolean>(true);

  // Available completed runs
  const completedRuns = useMemo(() => {
    return runs.filter((r) => r.bindingAffinity !== null && r.bindingAffinity !== undefined);
  }, [runs]);

  // Active run
  const activeRun = useMemo(() => {
    return runs.find((r) => r.id === selectedRunId) || completedRuns[0] || null;
  }, [runs, selectedRunId, completedRuns]);

  return (
    <div className="space-y-4">
      {/* 1. Header & Controls Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">
                Section 2 / Step 07 of 08
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-700">3D Molecular Viewer</span>
              {activeRun && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-[11px] font-mono text-emerald-700 font-bold">
                    {activeRun.bindingAffinity} kcal/mol
                  </span>
                </>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight mt-0.5 flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" />
              Interactive 3D Protein-Ligand Complex Viewer
            </h2>
          </div>

          {/* Compact Dropdown Selectors */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Run Selector */}
            <select
              value={activeRun?.id || ""}
              onChange={(e) => onSelectRunId(parseInt(e.target.value, 10))}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
            >
              {completedRuns.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.ligandName} &rarr; {r.pdbId} ({r.bindingAffinity} kcal/mol)
                </option>
              ))}
            </select>

            {/* Pose Selector */}
            <select
              value={activePose}
              onChange={(e) => setActivePose(parseInt(e.target.value, 10))}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-700 focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].slice(0, activeRun?.poseCount || 9).map((p) => (
                <option key={p} value={p}>
                  Pose {p} {p === 1 ? "(Rank #1)" : ""}
                </option>
              ))}
            </select>

            {/* Color Scheme */}
            <select
              value={colorScheme}
              onChange={(e: any) => setColorScheme(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
            >
              <option value="spectrum">Spectrum Colors</option>
              <option value="chain">Chain Specific</option>
              <option value="secondary">Teal Uniform</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Full-Width 3Dmol.js Viewer Canvas */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 shadow-md overflow-hidden relative">
        {isLoadingStructures ? (
          <div className="p-24 text-center text-slate-400 space-y-2">
            <Layers className="w-8 h-8 animate-spin mx-auto text-teal-400" />
            <p className="text-xs font-semibold">Streaming 3D crystallographic receptor and docked pose...</p>
          </div>
        ) : structureData?.receptorPdb && structureData?.ligandPdbqt ? (
          <Molecular3DViewer
            receptorPdb={structureData.receptorPdb}
            ligandPdbqt={structureData.ligandPdbqt}
            proteinName={activeRun?.targetProtein || "Target Receptor"}
            ligandName={activeRun?.ligandName || "Docked Ligand"}
            bindingAffinity={activeRun?.bindingAffinity}
            highlightResidues={structureData.interactions?.uniqueResidues || []}
          />
        ) : (
          <div className="p-20 text-center text-slate-400 space-y-2">
            <Layers className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-300">No 3D coordinate model loaded</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Select a completed AutoDock Vina simulation above to stream receptor ribbons and conformational poses.
            </p>
          </div>
        )}
      </div>

      {/* 3. Hardware Acceleration & Scientific Navigation Guidance */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <span className="font-bold text-slate-800">3D Interaction Controls:</span>
          <p className="text-[11px] text-slate-500">
            • <strong>Left Click + Drag:</strong> Rotate molecular complex • <strong>Middle Click / Scroll:</strong> Zoom in/out •{" "}
            <strong>Right Click + Drag:</strong> Pan camera translation across catalytic binding site.
          </p>
        </div>
        <span className="font-mono text-[10px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 shrink-0">
          WebGL 2.0 Accelerated
        </span>
      </div>
    </div>
  );
}

