// src/components/researcher/in-silico/Interaction2DStep6Section.tsx
"use client";

import React, { useState, useMemo } from "react";
import {
  Atom,
  Eye,
  Download,
  Info,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  ChevronDown,
  X,
  FileText,
} from "lucide-react";
import Interaction2DDiagram from "./Interaction2DDiagram";
import { DockingRunItem } from "./DockingExecutionStep4Section";

interface Step6Props {
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
  onNavigateTo3D: () => void;
}

export default function Interaction2DStep6Section({
  projectId,
  plantName,
  runs = [],
  selectedRunId,
  onSelectRunId,
  structureData,
  isLoadingStructures,
  onNavigateTo3D,
}: Step6Props) {
  const [selectedPose, setSelectedPose] = useState<number>(1);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Available completed runs
  const completedRuns = useMemo(() => {
    return runs.filter((r) => r.bindingAffinity !== null && r.bindingAffinity !== undefined);
  }, [runs]);

  // Active run object
  const activeRun = useMemo(() => {
    return runs.find((r) => r.id === selectedRunId) || completedRuns[0] || null;
  }, [runs, selectedRunId, completedRuns]);

  // Raw interaction items from structureData
  const rawInteractions = useMemo(() => {
    return structureData?.interactions?.interactions || [];
  }, [structureData]);

  // Compute category counts
  const categoryCounts = useMemo(() => {
    let hBonds = 0;
    let hydrophobic = 0;
    let saltBridges = 0;
    let other = 0;

    rawInteractions.forEach((item: any) => {
      const type = item.interactionType?.toLowerCase() || "";
      if (type.includes("hydrogen") || type.includes("h-bond")) {
        hBonds++;
      } else if (type.includes("hydrophobic")) {
        hydrophobic++;
      } else if (type.includes("salt") || type.includes("ionic")) {
        saltBridges++;
      } else {
        other++;
      }
    });

    return { hBonds, hydrophobic, saltBridges, other, total: rawInteractions.length };
  }, [rawInteractions]);

  return (
    <div className="space-y-4">
      {/* 1. Header & Selectors Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">
                Section 2 / Step 06 of 08
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-700">2D Interaction Diagrams</span>
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight mt-0.5 flex items-center gap-2">
              <Atom className="w-4 h-4 text-teal-600" />
              Residue Contact &amp; Interaction Map
            </h2>
          </div>

          {/* Compact Dropdown Selectors */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto text-xs">
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
              value={selectedPose}
              onChange={(e) => setSelectedPose(parseInt(e.target.value, 10))}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-700 focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].slice(0, activeRun?.poseCount || 9).map((p) => (
                <option key={p} value={p}>
                  Pose {p} {p === 1 ? "(Lowest Energy)" : ""}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={onNavigateTo3D}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-xs transition-colors"
            >
              <span>3D Viewer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Interaction Summary Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-emerald-800 font-sans block uppercase font-bold">Hydrogen Bonds</span>
            <span className="text-lg font-bold text-emerald-900">{categoryCounts.hBonds}</span>
          </div>
          <ShieldCheck className="w-5 h-5 text-emerald-600 opacity-80" />
        </div>

        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-amber-800 font-sans block uppercase font-bold">Hydrophobic Contacts</span>
            <span className="text-lg font-bold text-amber-900">{categoryCounts.hydrophobic}</span>
          </div>
          <Zap className="w-5 h-5 text-amber-600 opacity-80" />
        </div>

        <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-indigo-800 font-sans block uppercase font-bold">Salt Bridges</span>
            <span className="text-lg font-bold text-indigo-900">{categoryCounts.saltBridges}</span>
          </div>
          <Atom className="w-5 h-5 text-indigo-600 opacity-80" />
        </div>

        <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-700 font-sans block uppercase font-bold">Total Contacts</span>
            <span className="text-lg font-bold text-slate-900">{categoryCounts.total}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsDetailsModalOpen(true)}
            className="text-[11px] font-sans text-teal-700 hover:underline font-bold"
          >
            Table &rarr;
          </button>
        </div>
      </div>

      {/* 3. Main Viewer Canvas */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
        {isLoadingStructures ? (
          <div className="p-16 text-center text-slate-500 space-y-2">
            <Atom className="w-8 h-8 animate-spin mx-auto text-teal-600" />
            <p className="text-xs font-semibold">Calculating atomic residue contacts from docking coordinates...</p>
          </div>
        ) : activeRun && rawInteractions.length > 0 ? (
          <Interaction2DDiagram
            ligandName={activeRun.ligandName}
            proteinName={activeRun.targetProtein}
            pdbId={activeRun.pdbId}
            bindingAffinity={activeRun.bindingAffinity}
            interactions={rawInteractions}
          />
        ) : (
          <div className="p-12 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <Atom className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">No interaction data available for this run</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Select a completed AutoDock Vina simulation above to compute atomic contacts within the catalytic groove.
            </p>
          </div>
        )}
      </div>

      {/* 4. Details Modal */}
      {isDetailsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-xl w-full p-5 space-y-3.5 text-xs max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="font-bold text-slate-900">
                  Residue Contact Table — {activeRun?.ligandName} &amp; {activeRun?.pdbId}
                </h3>
                <p className="text-xs text-slate-500">Atomic contact geometry from docking pose coordinates</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2 px-3">Residue</th>
                    <th className="py-2 px-3">Interaction Type</th>
                    <th className="py-2 px-3 font-mono text-right">Distance (Å)</th>
                    <th className="py-2 px-3 text-right">Geometry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {rawInteractions.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-sans font-semibold text-slate-800">
                        {item.residueName} {item.residueSeq} (Chain {item.chain || "A"})
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-600">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            item.interactionType?.includes("Hydrogen")
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : item.interactionType?.includes("Hydrophobic")
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-indigo-50 text-indigo-800 border border-indigo-200"
                          }`}
                        >
                          {item.interactionType}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        {item.distance ? `${Number(item.distance).toFixed(2)} Å` : "—"}
                      </td>
                      <td className="py-2 px-3 text-right font-sans text-slate-500 text-[10px]">
                        {Number(item.distance) <= 3.2 ? "Optimal Contact" : "Permissible Shell"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold text-xs"
              >
                Close Table
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

