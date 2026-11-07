"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Info,
  Sparkles,
  BookOpen,
  FlaskConical,
} from "lucide-react";

export interface FormulationComponentItem {
  id?: number | string;
  componentName: string;
  roleInFormulation: string;
  quantity?: string;
  unit?: string;
  proposedConcentration: string;
  scientificRationale?: string;
  sourceReference?: string;
  isAiSuggested?: boolean;
  evidenceStatus?: "SUPPORTED" | "REQUIRES_EXPERIMENTAL_VALIDATION";
}

interface FormulationCompositionTableProps {
  components: FormulationComponentItem[];
  onChangeComponents: (components: FormulationComponentItem[]) => void;
  isReadOnly?: boolean;
  onOpenAiGenerator: () => void;
  plantName: string;
}

const COMMON_ROLES = [
  "Active Herbal Ingredient",
  "Gelling Agent & Polymer Matrix",
  "Neutralizer & pH Adjuster",
  "Humectant & Permeation Enhancer",
  "Antimicrobial Preservative",
  "Direct Compression Binder",
  "Tablet Disintegrant",
  "Hydrophobic Lubricant",
  "Glidant & Anti-caking Agent",
  "Emulsifying Agent",
  "Aqueous Vehicle / Solvent",
  "Antioxidant / Stabilizer",
  "Bioactive Marker Fraction",
  "Custom Excipient",
];

export default function FormulationCompositionTable({
  components,
  onChangeComponents,
  isReadOnly = false,
  onOpenAiGenerator,
  plantName,
}: FormulationCompositionTableProps) {
  // Modal / Inline editor state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FormulationComponentItem>({
    componentName: "",
    roleInFormulation: "Active Herbal Ingredient",
    proposedConcentration: "",
    scientificRationale: "",
    sourceReference: "",
    isAiSuggested: false,
    evidenceStatus: "REQUIRES_EXPERIMENTAL_VALIDATION",
  });
  const [isAddingNew, setIsAddingNew] = useState(false);

  const handleStartAdd = () => {
    setEditForm({
      componentName: "",
      roleInFormulation: "Active Herbal Ingredient",
      proposedConcentration: "Concentration Requires Experimental Validation",
      scientificRationale: "",
      sourceReference: "",
      isAiSuggested: false,
      evidenceStatus: "REQUIRES_EXPERIMENTAL_VALIDATION",
    });
    setIsAddingNew(true);
    setEditingIndex(null);
  };

  const handleStartEdit = (index: number) => {
    setEditForm({ ...components[index] });
    setEditingIndex(index);
    setIsAddingNew(false);
  };

  const handleSaveEdit = () => {
    if (!editForm.componentName.trim()) return;

    const updated = [...components];
    const isRequires =
      editForm.proposedConcentration.toLowerCase().includes("requires") ||
      editForm.evidenceStatus === "REQUIRES_EXPERIMENTAL_VALIDATION";

    const itemToSave: FormulationComponentItem = {
      ...editForm,
      componentName: editForm.componentName.trim(),
      roleInFormulation: editForm.roleInFormulation.trim(),
      proposedConcentration: editForm.proposedConcentration.trim() || "Concentration Requires Experimental Validation",
      evidenceStatus: isRequires ? "REQUIRES_EXPERIMENTAL_VALIDATION" : "SUPPORTED",
      isAiSuggested: Boolean(editForm.isAiSuggested),
    };

    if (isAddingNew) {
      updated.push(itemToSave);
    } else if (editingIndex !== null && editingIndex >= 0) {
      updated[editingIndex] = itemToSave;
    }

    onChangeComponents(updated);
    setEditingIndex(null);
    setIsAddingNew(false);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setIsAddingNew(false);
  };

  const handleRemove = (index: number) => {
    const updated = components.filter((_, i) => i !== index);
    onChangeComponents(updated);
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-emerald-800">
            Formulation Matrix
          </span>
          <h3 className="text-sm sm:text-base font-black text-[#0f2c20]">
            Preliminary Composition & Excipient Specification
          </h3>
          <p className="text-xs text-[#52645d] mt-0.5">
            Active herbal extracts, functional excipients, and evidence-grounded concentrations
          </p>
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={onOpenAiGenerator}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-950/10 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate AI Formulation</span>
            </button>
            <button
              type="button"
              onClick={handleStartAdd}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#0f2c20] font-bold text-xs shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Add Component</span>
            </button>
          </div>
        )}
      </div>

      {/* Empty State */}
      {components.length === 0 && !isAddingNew && (
        <div className="p-8 sm:p-10 rounded-3xl bg-slate-50 border border-slate-200 text-center space-y-4 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
            <FlaskConical className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h4 className="font-black text-sm text-[#0f2c20]">No Formulation Components Defined Yet</h4>
            <p className="text-xs text-[#52645d] leading-relaxed">
              Generate a preliminary formulation proposal grounded in {plantName} Stage 1-3 findings, or manually add your botanical extract and target excipients.
            </p>
          </div>
          {!isReadOnly && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onOpenAiGenerator}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs shadow-md transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate AI Formulation Proposal</span>
              </button>
              <button
                type="button"
                onClick={handleStartAdd}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-[#0f2c20] cursor-pointer"
              >
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>Manually Add Component</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Composition Table */}
      {(components.length > 0 || isAddingNew) && (
        <div className="overflow-hidden rounded-2xl border border-[#dde6df] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-[#dde6df] text-[#0f2c20] font-black text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 w-[28%]">Component</th>
                  <th className="py-3 px-4 w-[24%]">Function / Role</th>
                  <th className="py-3 px-4 w-[24%]">Proposed Concentration</th>
                  <th className="py-3 px-4 w-[16%]">Scientific Rationale</th>
                  {!isReadOnly && <th className="py-3 px-3 text-right w-[8%]">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {components.map((comp, idx) => {
                  const isEditing = editingIndex === idx;
                  const isRequiresValidation =
                    comp.evidenceStatus === "REQUIRES_EXPERIMENTAL_VALIDATION" ||
                    comp.proposedConcentration.toLowerCase().includes("requires");

                  if (isEditing) {
                    return (
                      <tr key={`edit-${idx}`} className="bg-emerald-50/40">
                        <td className="p-3">
                          <input
                            type="text"
                            value={editForm.componentName}
                            onChange={(e) => setEditForm({ ...editForm, componentName: e.target.value })}
                            placeholder="Component name (e.g. Carbopol 940)"
                            className="w-full p-2 text-xs rounded-lg border border-emerald-400 bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold text-[#0f2c20]"
                          />
                        </td>
                        <td className="p-3">
                          <select
                            value={editForm.roleInFormulation}
                            onChange={(e) => setEditForm({ ...editForm, roleInFormulation: e.target.value })}
                            className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none"
                          >
                            {COMMON_ROLES.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 space-y-1">
                          <input
                            type="text"
                            value={editForm.proposedConcentration}
                            onChange={(e) => setEditForm({ ...editForm, proposedConcentration: e.target.value })}
                            placeholder="e.g. 1.0% w/w or Requires Validation"
                            className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setEditForm({
                                ...editForm,
                                proposedConcentration: "Concentration Requires Experimental Validation",
                                evidenceStatus: "REQUIRES_EXPERIMENTAL_VALIDATION",
                              })
                            }
                            className="text-[10px] text-amber-800 hover:underline font-bold"
                          >
                            Mark &quot;Requires Validation&quot;
                          </button>
                        </td>
                        <td className="p-3 space-y-1">
                          <input
                            type="text"
                            value={editForm.scientificRationale || ""}
                            onChange={(e) => setEditForm({ ...editForm, scientificRationale: e.target.value })}
                            placeholder="Scientific rationale..."
                            className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none"
                          />
                          <input
                            type="text"
                            value={editForm.sourceReference || ""}
                            onChange={(e) => setEditForm({ ...editForm, sourceReference: e.target.value })}
                            placeholder="Citation or reference..."
                            className="w-full p-1.5 text-[10px] rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none"
                          />
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={handleSaveEdit}
                              className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="p-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  const isExtract = comp.roleInFormulation.toLowerCase().includes("active") ||
                    comp.roleInFormulation.toLowerCase().includes("extract");

                  return (
                    <tr key={`${comp.componentName}-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#0f2c20]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>{comp.componentName}</span>
                            {isExtract && (
                              <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase">
                                Active Extract
                              </span>
                            )}
                            {comp.isAiSuggested && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-[9px] font-bold">
                                <Sparkles className="w-2.5 h-2.5 text-teal-600" />
                                <span>AI Suggested</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#52645d] font-medium">
                        {comp.roleInFormulation}
                      </td>
                      <td className="py-3.5 px-4">
                        {isRequiresValidation ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 font-bold text-[10px]">
                            <Info className="w-3 h-3 text-amber-700 shrink-0" />
                            <span>Concentration Requires Experimental Validation</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 font-mono font-bold text-xs">
                            {comp.proposedConcentration}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[#52645d] space-y-0.5 max-w-xs">
                        <p className="line-clamp-2 leading-relaxed text-[11px]">
                          {comp.scientificRationale || "Functional component in the delivery matrix."}
                        </p>
                        {comp.sourceReference && (
                          <p className="text-[10px] text-[#78997f] truncate flex items-center gap-1">
                            <BookOpen className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span title={comp.sourceReference}>{comp.sourceReference}</span>
                          </p>
                        )}
                      </td>
                      {!isReadOnly && (
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(idx)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                              title="Edit component"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemove(idx)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Remove component"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}

                {/* ADD NEW ROW FORM */}
                {isAddingNew && (
                  <tr className="bg-emerald-50/60 border-t-2 border-emerald-500">
                    <td className="p-3">
                      <input
                        type="text"
                        value={editForm.componentName}
                        onChange={(e) => setEditForm({ ...editForm, componentName: e.target.value })}
                        placeholder="Component name (e.g. Carbopol 940)"
                        className="w-full p-2 text-xs rounded-lg border border-emerald-400 bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold text-[#0f2c20]"
                        autoFocus
                      />
                    </td>
                    <td className="p-3">
                      <select
                        value={editForm.roleInFormulation}
                        onChange={(e) => setEditForm({ ...editForm, roleInFormulation: e.target.value })}
                        className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none"
                      >
                        {COMMON_ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3 space-y-1">
                      <input
                        type="text"
                        value={editForm.proposedConcentration}
                        onChange={(e) => setEditForm({ ...editForm, proposedConcentration: e.target.value })}
                        placeholder="e.g. 1.0% w/w or Requires Validation"
                        className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setEditForm({
                            ...editForm,
                            proposedConcentration: "Concentration Requires Experimental Validation",
                            evidenceStatus: "REQUIRES_EXPERIMENTAL_VALIDATION",
                          })
                        }
                        className="text-[10px] text-amber-800 hover:underline font-bold"
                      >
                        Mark &quot;Requires Validation&quot;
                      </button>
                    </td>
                    <td className="p-3 space-y-1">
                      <input
                        type="text"
                        value={editForm.scientificRationale || ""}
                        onChange={(e) => setEditForm({ ...editForm, scientificRationale: e.target.value })}
                        placeholder="Scientific rationale..."
                        className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none"
                      />
                      <input
                        type="text"
                        value={editForm.sourceReference || ""}
                        onChange={(e) => setEditForm({ ...editForm, sourceReference: e.target.value })}
                        placeholder="Citation or reference..."
                        className="w-full p-1.5 text-[10px] rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none"
                      />
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                          title="Save new component"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="p-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
