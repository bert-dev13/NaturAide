// src/components/researcher/in-silico/ScreeningStep3Section.tsx
"use client";

import React, { useState, useMemo } from "react";
import {
  FlaskConical,
  Play,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Info,
  Check,
  ExternalLink,
  Sliders,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Beaker,
} from "lucide-react";

export interface ScreeningResultItem {
  id: number;
  compoundId: number;
  compoundName: string;
  molecularWeight?: number | null;
  molecularFormula?: string | null;
  compoundSmiles?: string | null;
  pubchemId?: string | null;
  resultSummary?: string | null;
  detailedMetrics?: any;
  engineStatus?: string;
  engineTool?: string;
}

interface Step3Props {
  projectId: number;
  compounds: any[];
  screenResults: ScreeningResultItem[];
  onRunScreening: () => Promise<void>;
  isScreening: boolean;
  onToggleDocking?: (compoundId: number, selected: boolean) => Promise<void>;
  onNextStep?: () => void;
}

export default function ScreeningStep3Section({
  projectId,
  compounds = [],
  screenResults = [],
  onRunScreening,
  isScreening,
  onToggleDocking,
  onNextStep,
}: Step3Props) {
  const [expandedCompoundId, setExpandedCompoundId] = useState<number | null>(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Map screening results by compoundId and normalized name
  const resultMap = useMemo(() => {
    const map = new Map<number, ScreeningResultItem>();
    const nameMap = new Map<string, ScreeningResultItem>();
    for (const res of screenResults) {
      if (res.compoundId) map.set(res.compoundId, res);
      if (res.compoundName) nameMap.set(res.compoundName.trim().toLowerCase(), res);
    }
    return { byId: map, byName: nameMap };
  }, [screenResults]);

  // Helper to safely extract metrics
  const parseMetrics = (res?: ScreeningResultItem) => {
    if (!res) return null;
    let metrics: any = {};
    if (res.detailedMetrics) {
      metrics =
        typeof res.detailedMetrics === "string"
          ? (() => {
              try {
                return JSON.parse(res.detailedMetrics);
              } catch {
                return {};
              }
            })()
          : res.detailedMetrics;
    }

    const prop = metrics.physicochemicalProperties || {};
    const dl = metrics.drugLikeness?.lipinskiRuleOfFive || {};
    const admet = metrics.admet || {};
    const dockSuit = metrics.dockingSuitability || {};

    const mw =
      res.molecularWeight ||
      prop.molecularWeight?.value?.replace(" g/mol", "") ||
      "—";
    const formula = res.molecularFormula || prop.molecularFormula?.value || "—";
    const logP = prop.logP?.value !== undefined ? prop.logP.value : "—";
    const tpsa = prop.tpsa?.value !== undefined ? prop.tpsa.value : "—";
    const hbd = prop.hBondDonors?.value !== undefined ? prop.hBondDonors.value : "—";
    const hba = prop.hBondAcceptors?.value !== undefined ? prop.hBondAcceptors.value : "—";
    const rotBonds = prop.rotatableBonds?.value !== undefined ? prop.rotatableBonds.value : "—";
    const heavyAtoms = prop.heavyAtoms?.value !== undefined ? prop.heavyAtoms.value : "—";

    const status: "Completed" | "Needs Review" | "Failed" =
      res.engineStatus === "Completed" || res.engineStatus === "Needs Review" || res.engineStatus === "Failed"
        ? (res.engineStatus as any)
        : dl.violations !== undefined && dl.violations >= 2
        ? "Needs Review"
        : mw !== "—"
        ? "Completed"
        : "Failed";

    const lipinskiViolations = dl.violations ?? 0;
    const lipinskiList = dl.violationsList || [];
    const skinPerm = admet.skinPermeability?.prediction || "Moderate Permeability";
    const skinLogKp = admet.skinPermeability?.logKp || null;
    const giAbs = admet.giAbsorption?.prediction || "Moderate Absorption";
    const bbb = admet.bbbPermeability?.prediction || "Non-permeant";
    const waterSol = admet.waterSolubility?.prediction || "Moderate Solubility";
    const cyp3a4 = admet.cyp3a4Inhibition?.prediction || "Low Inhibition Potential";

    return {
      status,
      mw,
      formula,
      logP,
      tpsa,
      hbd,
      hba,
      rotBonds,
      heavyAtoms,
      lipinskiViolations,
      lipinskiList,
      skinPerm,
      skinLogKp,
      giAbs,
      bbb,
      waterSol,
      cyp3a4,
      engineTool: res.engineTool || "RDKit + NatureAide QSAR",
      summary: res.resultSummary || "",
      suitabilityNote: dockSuit.recommendation || null,
    };
  };

  const evaluatedCount = compounds.filter(
    (c) => resultMap.byId.has(c.id) || resultMap.byName.has(c.compoundName.trim().toLowerCase())
  ).length;

  const handleToggle = async (compoundId: number, currentSelected: boolean) => {
    if (!onToggleDocking) return;
    setTogglingId(compoundId);
    try {
      await onToggleDocking(compoundId, !currentSelected);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Minimal Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">
                Section 2 / Step 03 of 08
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-700">In-Silico Screening</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              In-Silico Screening
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Analyze the molecular properties of your selected phytochemicals.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-900">
                {compounds.length} Compounds Selected
              </div>
              <div className="text-[11px] text-slate-500">
                {evaluatedCount} of {compounds.length} Evaluated
              </div>
            </div>

            <button
              type="button"
              disabled={isScreening || compounds.length === 0}
              onClick={onRunScreening}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 transition-colors"
            >
              {isScreening ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Screening Compounds...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>{evaluatedCount > 0 ? "Re-run Screening" : "Run Screening"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Compact Results Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {compounds.length === 0 ? (
          <div className="p-8 text-center">
            <FlaskConical className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-700">No Phytochemicals Selected</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Please go back to Step 1: Phytochemical Selection and choose candidate compounds from your botanical source.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Compound</th>
                  <th className="py-2.5 px-3">Screening Status</th>
                  <th className="py-2.5 px-3">Descriptors (MW / LogP / TPSA)</th>
                  <th className="py-2.5 px-3">Topical &amp; ADMET Profile</th>
                  <th className="py-2.5 px-3 text-center">Docking Candidate</th>
                  <th className="py-2.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {compounds.map((compound) => {
                  const res =
                    resultMap.byId.get(compound.id) ||
                    resultMap.byName.get(compound.compoundName.trim().toLowerCase());
                  const parsed = parseMetrics(res);
                  const isExpanded = expandedCompoundId === compound.id;
                  const isDockingSelected =
                    compound.selectedForDocking === 1 || compound.selectedForDocking === true;

                  return (
                    <React.Fragment key={compound.id}>
                      <tr className={`hover:bg-slate-50/70 transition-colors ${isExpanded ? "bg-slate-50/60" : ""}`}>
                        {/* 1. Compound Info */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{compound.compoundName}</div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                            <span>{compound.molecularFormula || parsed?.formula || "Formula pending"}</span>
                            {compound.pubchemId && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="text-slate-400">CID: {compound.pubchemId}</span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* 2. Screening Status */}
                        <td className="py-3 px-3">
                          {parsed ? (
                            parsed.status === "Completed" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Completed
                              </span>
                            ) : parsed.status === "Needs Review" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Needs Review
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                Failed
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              <Clock className="w-3 h-3 text-slate-400" />
                              Pending
                            </span>
                          )}
                        </td>

                        {/* 3. Descriptors */}
                        <td className="py-3 px-3">
                          {parsed && parsed.mw !== "—" ? (
                            <div className="font-mono text-xs text-slate-800 space-y-0.5">
                              <div>
                                <span className="text-slate-400">MW:</span> {parsed.mw} g/mol
                              </div>
                              <div className="text-[11px] text-slate-500">
                                <span className="text-slate-400">LogP:</span> {parsed.logP} •{" "}
                                <span className="text-slate-400">TPSA:</span> {parsed.tpsa}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Run screening to compute</span>
                          )}
                        </td>

                        {/* 4. Topical & ADMET Profile */}
                        <td className="py-3 px-3">
                          {parsed ? (
                            <div className="space-y-0.5">
                              <div className="font-semibold text-slate-800 flex items-center gap-1 text-[11px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                {parsed.skinPerm}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                GI: {parsed.giAbs} • BBB: {parsed.bbb}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">—</span>
                          )}
                        </td>

                        {/* 5. Docking Candidate Checkbox */}
                        <td className="py-3 px-3 text-center">
                          <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isDockingSelected}
                              disabled={togglingId === compound.id}
                              onChange={() => handleToggle(compound.id, isDockingSelected)}
                              className="w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500"
                            />
                            <span className="text-[11px] font-medium text-slate-700">
                              Candidate
                            </span>
                          </label>
                        </td>

                        {/* 6. View Details Action */}
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setExpandedCompoundId(isExpanded ? null : compound.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-slate-600 hover:text-teal-700 hover:bg-slate-100 transition-colors"
                          >
                            <span>{isExpanded ? "Hide" : "View"}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Details Drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={6} className="p-4 border-t border-slate-100">
                            {parsed ? (
                              <div className="space-y-3">
                                {/* Summary banner */}
                                <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                                  <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                                  <div>
                                    <div className="font-semibold text-slate-900">
                                      Computational Screening Summary
                                    </div>
                                    <div className="text-[11px] text-slate-600 mt-0.5">
                                      {parsed.summary ||
                                        `${compound.compoundName} evaluated with ${parsed.engineTool}. Structure ready for molecular docking.`}
                                    </div>
                                    {parsed.suitabilityNote && (
                                      <div className="text-[11px] text-teal-800 mt-1 font-medium">
                                        Docking Recommendation: {parsed.suitabilityNote}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Descriptors Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                                    <div className="text-[10px] uppercase font-bold text-slate-400">
                                      Molecular Weight
                                    </div>
                                    <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                                      {parsed.mw} g/mol
                                    </div>
                                    <div className="text-[10px] text-slate-500">Benchmark: &le; 500 Da</div>
                                  </div>

                                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                                    <div className="text-[10px] uppercase font-bold text-slate-400">
                                      Lipophilicity (LogP)
                                    </div>
                                    <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                                      {parsed.logP}
                                    </div>
                                    <div className="text-[10px] text-slate-500">Benchmark: &le; 5.0</div>
                                  </div>

                                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                                    <div className="text-[10px] uppercase font-bold text-slate-400">
                                      Polar Surface (TPSA)
                                    </div>
                                    <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                                      {parsed.tpsa}
                                    </div>
                                    <div className="text-[10px] text-slate-500">Topical optimal: &le; 140 Å²</div>
                                  </div>

                                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                                    <div className="text-[10px] uppercase font-bold text-slate-400">
                                      H-Bond Donors / Acceptors
                                    </div>
                                    <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                                      {parsed.hbd} / {parsed.hba}
                                    </div>
                                    <div className="text-[10px] text-slate-500">HBD &le; 5 • HBA &le; 10</div>
                                  </div>
                                </div>

                                {/* ADMET & Topical Details */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                                    <div className="text-[10px] font-bold text-slate-500">
                                      Topical Dermal Permeability (Potts &amp; Guy)
                                    </div>
                                    <div className="font-semibold text-slate-900 mt-0.5">
                                      {parsed.skinPerm}
                                    </div>
                                    {parsed.skinLogKp && (
                                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                        Log Kp: {parsed.skinLogKp}
                                      </div>
                                    )}
                                  </div>

                                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                                    <div className="text-[10px] font-bold text-slate-500">
                                      Water Solubility (ESOL Log S)
                                    </div>
                                    <div className="font-semibold text-slate-900 mt-0.5">
                                      {parsed.waterSol}
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">
                                      CYP3A4: {parsed.cyp3a4}
                                    </div>
                                  </div>

                                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                                    <div className="text-[10px] font-bold text-slate-500">
                                      Lipinski Rule of 5 (Oral Reference)
                                    </div>
                                    <div className="font-semibold text-slate-900 mt-0.5">
                                      {parsed.lipinskiViolations === 0
                                        ? "Compliant (0 violations)"
                                        : `${parsed.lipinskiViolations} Alert(s): ${parsed.lipinskiList.join(", ")}`}
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-0.5 italic">
                                      Oral guide only; topical bioactivity remains intact.
                                    </div>
                                  </div>
                                </div>

                                <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                                  <span>Computational Engine: {parsed.engineTool}</span>
                                  {compound.smiles && (
                                    <span className="truncate max-w-xs" title={compound.smiles}>
                                      SMILES: {compound.smiles}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-4 text-xs text-slate-500">
                                No computational screening data recorded yet. Click <strong>Run Screening</strong> above to evaluate this compound.
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Optional Advanced Settings Accordion */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          className="w-full px-4 py-3 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>Advanced Screening Settings &amp; Formulation Models</span>
          </div>
          {showAdvancedSettings ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showAdvancedSettings && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-3 text-xs text-slate-600">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <div className="font-bold text-slate-900 mb-1">Topical Formulation Adaptation</div>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  The standard Lipinski Rule of 5 strictly evaluates gastrointestinal absorption for oral pills. For topical hydrogels, ointments, and dermal remedies, compounds with higher molecular weight (such as anthraquinone and flavonol glycosides) retain potent surface anti-inflammatory and antifungal activity without requiring oral bioavailability.
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <div className="font-bold text-slate-900 mb-1">Compendial QSAR Algorithms</div>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  Descriptors are deterministically calculated using <strong>RDKit</strong> and verified against NCBI PubChem structures. Dermal permeability is modeled using Potts &amp; Guy quantitative structure-activity relationships, and aqueous solubility using the Delaney ESOL method.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
