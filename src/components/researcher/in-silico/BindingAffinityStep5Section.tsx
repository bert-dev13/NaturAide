// src/components/researcher/in-silico/BindingAffinityStep5Section.tsx
"use client";

import React, { useState, useMemo } from "react";
import {
  Activity,
  Layers,
  Atom,
  Eye,
  Filter,
  ArrowUpDown,
  Download,
  Info,
  CheckCircle2,
  X,
  ExternalLink,
  ChevronRight,
  TrendingDown,
} from "lucide-react";
import { DockingRunItem } from "./DockingExecutionStep4Section";

interface Step5Props {
  projectId: number;
  plantName: string;
  runs: DockingRunItem[];
  onSelectRunForVisuals: (runId: number, targetStep: 6 | 7) => void;
}

export default function BindingAffinityStep5Section({
  projectId,
  plantName,
  runs = [],
  onSelectRunForVisuals,
}: Step5Props) {
  const [selectedTarget, setSelectedTarget] = useState("ALL");
  const [selectedLigand, setSelectedLigand] = useState("ALL");
  const [sortOrder, setSortOrder] = useState<"best" | "worst" | "name">("best");
  const [inspectedRun, setInspectedRun] = useState<DockingRunItem | null>(null);

  // Distinct targets and ligands from runs
  const targetOptions = useMemo(() => {
    const map = new Map<string, string>();
    runs.forEach((r) => map.set(r.pdbId, `${r.targetProtein} (${r.pdbId})`));
    return Array.from(map.entries());
  }, [runs]);

  const ligandOptions = useMemo(() => {
    const set = new Set<string>();
    runs.forEach((r) => set.add(r.ligandName));
    return Array.from(set).sort();
  }, [runs]);

  // Completed runs with actual binding affinity numbers
  const completedRuns = useMemo(() => {
    return runs.filter((r) => r.bindingAffinity !== null && r.bindingAffinity !== undefined);
  }, [runs]);

  // Filter & Sort
  const displayedRuns = useMemo(() => {
    let result = completedRuns.filter((r) => {
      if (selectedTarget !== "ALL" && r.pdbId !== selectedTarget) return false;
      if (selectedLigand !== "ALL" && r.ligandName !== selectedLigand) return false;
      return true;
    });

    if (sortOrder === "best") {
      result.sort((a, b) => Number(a.bindingAffinity) - Number(b.bindingAffinity));
    } else if (sortOrder === "worst") {
      result.sort((a, b) => Number(b.bindingAffinity) - Number(a.bindingAffinity));
    } else if (sortOrder === "name") {
      result.sort((a, b) => a.ligandName.localeCompare(b.ligandName));
    }

    return result;
  }, [completedRuns, selectedTarget, selectedLigand, sortOrder]);

  // Top complex
  const topRun = displayedRuns[0] || null;

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">
                Section 2 / Step 05 of 08
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-700">Binding Affinity Results</span>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] text-slate-500 font-mono">
                {displayedRuns.length} Scored Complex{displayedRuns.length === 1 ? "" : "es"}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight mt-0.5 flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600" />
              Predicted Docking Scores &amp; Complex Ranking
            </h2>
          </div>

          {topRun && (
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2 self-start sm:self-auto">
              <TrendingDown className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Top Candidate: <strong className="font-semibold">{topRun.ligandName}</strong> &rarr;{" "}
                <strong className="font-mono">{topRun.pdbId}</strong> ({topRun.bindingAffinity} kcal/mol)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Visual Comparison Chart */}
      {displayedRuns.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-teal-600" />
              Predicted Docking Score Comparison (kcal/mol)
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">More negative = stronger predicted affinity</span>
          </div>

          <div className="space-y-2 pt-1">
            {displayedRuns.slice(0, 8).map((r, idx) => {
              const score = Number(r.bindingAffinity) || 0;
              // Normalize width based on typical range (-12 to -4)
              const percentage = Math.min(100, Math.max(15, (Math.abs(score) / 12) * 100));

              return (
                <div key={r.id} className="space-y-0.5 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-800">
                      #{idx + 1}. {r.ligandName} &rarr; <span className="font-mono text-teal-700">{r.pdbId}</span>
                    </span>
                    <span className="font-mono font-bold text-emerald-700">{score} kcal/mol</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        score <= -8.0 ? "bg-emerald-600" : score <= -6.5 ? "bg-teal-600" : "bg-amber-500"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        {/* Filter by Target */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Filter Target Protein</label>
          <select
            value={selectedTarget}
            onChange={(e) => setSelectedTarget(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
          >
            <option value="ALL">All Targets ({targetOptions.length})</option>
            {targetOptions.map(([pdb, label]) => (
              <option key={pdb} value={pdb}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Ligand */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Filter Ligand Compound</label>
          <select
            value={selectedLigand}
            onChange={(e) => setSelectedLigand(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
          >
            <option value="ALL">All Ligands ({ligandOptions.length})</option>
            {ligandOptions.map((lig) => (
              <option key={lig} value={lig}>
                {lig}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Sort Complexes</label>
          <select
            value={sortOrder}
            onChange={(e: any) => setSortOrder(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
          >
            <option value="best">Best Predicted Score First (Most Negative ΔG)</option>
            <option value="worst">Lowest Score First</option>
            <option value="name">Ligand Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* 4. Results Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {displayedRuns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">Rank</th>
                  <th className="py-2.5 px-3">Ligand Molecule</th>
                  <th className="py-2.5 px-3">Target Receptor</th>
                  <th className="py-2.5 px-3">PDB ID</th>
                  <th className="py-2.5 px-3">Predicted Docking Score (kcal/mol)</th>
                  <th className="py-2.5 px-3">Estimated Fit Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedRuns.map((r, idx) => {
                  const score = Number(r.bindingAffinity) || 0;
                  const isStrong = score <= -7.0;
                  const isModerate = score > -7.0 && score <= -5.0;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-500">
                        #{idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{r.ligandName}</td>
                      <td className="py-2.5 px-3 text-slate-600">{r.targetProtein}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-teal-700">
                        <a
                          href={`https://www.rcsb.org/structure/${r.pdbId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline inline-flex items-center gap-1"
                        >
                          <span>{r.pdbId}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-700 text-sm">
                        {r.bindingAffinity} kcal/mol
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            isStrong
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : isModerate
                              ? "bg-teal-50 text-teal-800 border-teal-300"
                              : "bg-amber-50 text-amber-800 border-amber-300"
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {isStrong ? "High Affinity Candidate" : isModerate ? "Moderate Interaction" : "Weak Interaction"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setInspectedRun(r)}
                          className="px-2 py-1 rounded text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectRunForVisuals(r.id, 6)}
                          className="px-2 py-1 rounded text-[11px] font-semibold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-colors"
                        >
                          2D Map
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectRunForVisuals(r.id, 7)}
                          className="px-2 py-1 rounded text-[11px] font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-colors"
                        >
                          3D Model
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50/50 space-y-2">
            <Activity className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">No completed docking results to display</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Run molecular docking simulations in Step 4 to calculate predicted binding energetics and populate the
              results comparison dashboard.
            </p>
          </div>
        )}
      </div>

      {/* 5. Scientific Interpretation Advisory Note */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-slate-800">Important Scientific Terminology:</span>
          <p className="leading-relaxed">
            AutoDock Vina scoring calculates predicted free energy of binding ($\Delta G$ in kcal/mol). These
            computational estimates model thermodynamic affinity in a semi-rigid active site and must not be described
            as experimentally confirmed bioactivity or therapeutic efficacy without in-vitro assay verification.
          </p>
        </div>
      </div>

      {/* 6. Details Modal */}
      {inspectedRun && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-5 space-y-3.5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Simulation Metadata — {inspectedRun.ligandName} &amp; {inspectedRun.pdbId}
                </h3>
                <p className="text-xs text-slate-500">{inspectedRun.targetProtein}</p>
              </div>
              <button
                type="button"
                onClick={() => setInspectedRun(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 font-mono text-[11px]">
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] font-sans">Predicted Vina Score:</span>
                <span className="font-bold text-emerald-700 text-sm">{inspectedRun.bindingAffinity} kcal/mol</span>
              </div>
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] font-sans">Simulation Engine:</span>
                <span className="font-bold text-slate-800">AutoDock Vina v1.2.7</span>
              </div>
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] font-sans">Conformational Modes:</span>
                <span className="font-bold text-slate-800">{inspectedRun.poseCount || 9} Poses Evaluated</span>
              </div>
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] font-sans">Exhaustiveness:</span>
                <span className="font-bold text-slate-800">{inspectedRun.exhaustiveness || 8} Iterations</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] space-y-1">
              <span className="font-bold text-slate-800">Reproducibility &amp; Protocol:</span>
              <p className="text-slate-600 leading-relaxed">
                Receptor and ligand structures were prepared using Meeko / AutoDock Tools. Grid box parameters centered
                on verified catalytic binding coordinates.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="space-x-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const id = inspectedRun.id;
                    setInspectedRun(null);
                    onSelectRunForVisuals(id, 6);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold border border-teal-200"
                >
                  View 2D Map
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = inspectedRun.id;
                    setInspectedRun(null);
                    onSelectRunForVisuals(id, 7);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-xs"
                >
                  View 3D Model
                </button>
              </div>

              <button
                type="button"
                onClick={() => setInspectedRun(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

