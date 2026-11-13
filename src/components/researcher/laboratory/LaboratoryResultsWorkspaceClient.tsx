"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Beaker,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Pencil,
  Trash2,
  Search,
  ArrowRight,
  ArrowLeft,
  X,
} from "lucide-react";
import {
  LAB_TEST_CATEGORIES,
  COMMON_LAB_UNITS,
  getLabCategoryLabel,
  getTestsForCategory,
  type LabTestCategoryKey,
} from "@/lib/laboratory-results-catalog";

export interface LabResultRecord {
  id: number;
  projectId: number;
  testCategory: string;
  testName: string;
  resultValue: string;
  unit?: string | null;
  dateConducted?: string | null;
  remarks?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface Props {
  project: {
    id: number;
    title: string;
    plantName?: string;
    plantScientificName?: string;
  };
}

const easeOut = [0.22, 1, 0.36, 1] as const;

function formatDateInput(value?: string | null) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

export default function LaboratoryResultsWorkspaceClient({ project }: Props) {
  const [results, setResults] = useState<LabResultRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [listSearch, setListSearch] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [testCategory, setTestCategory] = useState<LabTestCategoryKey>("PHYSICOCHEMICAL");
  const [testName, setTestName] = useState("");
  const [resultValue, setResultValue] = useState("");
  const [unit, setUnit] = useState("");
  const [dateConducted, setDateConducted] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [remarks, setRemarks] = useState("");

  const suggestedTests = useMemo(
    () => getTestsForCategory(testCategory).filter((t) => t !== "Other"),
    [testCategory]
  );

  const isFormValid =
    Boolean(testCategory) &&
    Boolean(testName.trim()) &&
    Boolean(resultValue.trim());

  const loadResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/researcher/projects/${project.id}/laboratory-results`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load results");
      setResults(Array.isArray(data.results) ? data.results : []);
    } catch (err: any) {
      setError(err.message || "Failed to load laboratory results");
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  useEffect(() => {
    // Reset test name when category changes (unless editing fills later)
    if (editingId == null) {
      setTestName("");
    }
  }, [testCategory, editingId]);

  const resetForm = () => {
    setEditingId(null);
    setTestCategory("PHYSICOCHEMICAL");
    setTestName("");
    setResultValue("");
    setUnit("");
    setDateConducted(new Date().toISOString().slice(0, 10));
    setRemarks("");
  };

  const handleEdit = (row: LabResultRecord) => {
    setEditingId(row.id);
    setTestCategory((row.testCategory as LabTestCategoryKey) || "OTHER_CUSTOM");
    setTestName(row.testName || "");
    setResultValue(row.resultValue || "");
    setUnit(row.unit || "");
    setDateConducted(formatDateInput(row.dateConducted) || "");
    setRemarks(row.remarks || "");
    setSuccess(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || saving) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/researcher/projects/${project.id}/laboratory-results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          testCategory,
          testName: testName.trim(),
          resultValue: resultValue.trim(),
          unit: unit.trim() || null,
          dateConducted: dateConducted || null,
          remarks: remarks.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setSuccess(editingId ? "Laboratory result updated." : "Laboratory result saved.");
      resetForm();
      await loadResults();
    } catch (err: any) {
      setError(err.message || "Failed to save laboratory result");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: LabResultRecord) => {
    if (!confirm(`Delete “${row.testName}” result from this project?`)) return;
    setError(null);
    try {
      const res = await fetch(
        `/api/researcher/projects/${project.id}/laboratory-results?resultId=${row.id}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      if (editingId === row.id) resetForm();
      setSuccess("Laboratory result deleted.");
      await loadResults();
    } catch (err: any) {
      setError(err.message || "Failed to delete");
    }
  };

  const displayedResults = useMemo(() => {
    const q = listSearch.trim().toLowerCase();
    return results.filter((r) => {
      if (filterCategory !== "ALL" && r.testCategory !== filterCategory) return false;
      if (!q) return true;
      return (
        r.testName.toLowerCase().includes(q) ||
        (r.resultValue || "").toLowerCase().includes(q) ||
        getLabCategoryLabel(r.testCategory).toLowerCase().includes(q)
      );
    });
  }, [results, filterCategory, listSearch]);

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: easeOut }}
        className="overflow-hidden rounded-2xl border border-[#0f2c20]/12 bg-[linear-gradient(135deg,#0b2419_0%,#0f2c20_55%,#134032_100%)] px-5 py-4 text-white shadow-[0_12px_28px_-20px_rgba(15,44,32,0.55)]"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/80">
              Section 3 · Laboratory Results
            </p>
            <h1 className="mt-1 text-lg font-bold tracking-tight sm:text-xl">
              Record laboratory findings
            </h1>
            <p className="mt-1 max-w-xl text-[12px] text-emerald-100/75">
              Select tests you performed and enter the actual measured results. Values are never
              generated automatically.
            </p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-right text-[11px]">
            <p className="font-semibold text-white">{project.title}</p>
            {project.plantName && (
              <p className="mt-0.5 text-emerald-200/80">
                {project.plantName}
                {project.plantScientificName ? (
                  <em className="ml-1 font-serif not-italic opacity-80">
                    ({project.plantScientificName})
                  </em>
                ) : null}
              </p>
            )}
          </div>
        </div>
      </motion.header>

      {(error || success) && (
        <div
          className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs ${
            error
              ? "border-rose-200 bg-rose-50 text-rose-900"
              : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          {error ? (
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          )}
          <span className="flex-1 font-medium">{error || success}</span>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setSuccess(null);
            }}
            className="text-current/60 hover:text-current"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Entry form */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.04, ease: easeOut }}
        className="rounded-2xl border border-[#d7e4dc] bg-white p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-5"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#e8f0eb] pb-3">
          <h2 className="inline-flex items-center gap-2 text-sm font-bold text-[#0f2c20]">
            <Beaker className="h-4 w-4 text-emerald-700" />
            {editingId ? "Edit laboratory result" : "New laboratory result"}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-[11px] font-semibold text-[#8aa094] hover:text-[#52645d]"
            >
              Cancel edit
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-3.5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                Research project
              </label>
              <div className="rounded-xl border border-[#d5e3da] bg-[#f7faf8] px-3 py-2.5 text-sm font-semibold text-[#0f2c20]">
                {project.title}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                Test category <span className="text-rose-500">*</span>
              </label>
              <select
                value={testCategory}
                onChange={(e) => setTestCategory(e.target.value as LabTestCategoryKey)}
                className="h-10 w-full rounded-xl border border-[#d5e3da] bg-[#fbfdfb] px-3 text-sm font-semibold text-[#0f2c20] outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
              >
                {LAB_TEST_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                Date conducted
              </label>
              <input
                type="date"
                value={dateConducted}
                onChange={(e) => setDateConducted(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#d5e3da] bg-[#fbfdfb] px-3 text-sm font-semibold text-[#0f2c20] outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                Laboratory test <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                list="lab-test-suggestions-workspace"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="e.g. pH, Viscosity, DPPH Assay"
                className="h-10 w-full rounded-xl border border-[#d5e3da] bg-[#fbfdfb] px-3 text-sm font-semibold text-[#0f2c20] outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
              />
              <datalist id="lab-test-suggestions-workspace">
                {suggestedTests.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                Result <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={resultValue}
                onChange={(e) => setResultValue(e.target.value)}
                placeholder="Enter the actual laboratory finding"
                className="h-10 w-full rounded-xl border border-[#d5e3da] bg-[#fbfdfb] px-3 text-sm font-semibold text-[#0f2c20] outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                Unit of measurement
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#d5e3da] bg-[#fbfdfb] px-3 text-sm font-semibold text-[#0f2c20] outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
              >
                <option value="">Not specified</option>
                {COMMON_LAB_UNITS.filter(Boolean).map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
                {unit &&
                  !COMMON_LAB_UNITS.includes(unit as (typeof COMMON_LAB_UNITS)[number]) && (
                    <option value={unit}>{unit}</option>
                  )}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                Remarks
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
                placeholder="Optional notes (method, conditions, observations)"
                className="w-full rounded-xl border border-[#d5e3da] bg-[#fbfdfb] px-3 py-2 text-sm text-[#0f2c20] outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <p className="text-[11px] text-[#8aa094]">
              Suggested tests are optional helpers — enter any custom test when needed.
            </p>
            <button
              type="submit"
              disabled={!isFormValid || saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  {editingId ? "Update result" : "Save Laboratory Result"}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.section>

      {/* Saved results */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.08, ease: easeOut }}
        className="rounded-2xl border border-[#d7e4dc] bg-white p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-5"
      >
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-bold text-[#0f2c20]">
            Saved results{" "}
            <span className="font-mono text-[11px] font-medium text-[#8aa094]">
              {displayedResults.length}
              {displayedResults.length !== results.length ? ` / ${results.length}` : ""}
            </span>
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-8 rounded-lg border border-[#d5e3da] bg-[#fbfdfb] px-2 text-[11px] font-semibold text-[#0f2c20]"
            >
              <option value="ALL">All categories</option>
              {LAB_TEST_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[#8aa094]" />
              <input
                type="text"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                placeholder="Search…"
                className="h-8 w-40 rounded-lg border border-[#d5e3da] bg-[#fbfdfb] py-1 pl-7 pr-2 text-[11px] outline-none focus:border-emerald-600"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-[#8aa094]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading results…
          </div>
        ) : displayedResults.length === 0 ? (
          <div className="rounded-xl bg-[#f7faf8] px-4 py-10 text-center text-[12px] text-[#8aa094]">
            {results.length === 0
              ? "No laboratory results recorded yet for this project."
              : "No results match the current filter."}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#e8f0eb]">
            <table className="w-full min-w-[36rem] table-fixed border-collapse text-left text-[12px]">
              <thead>
                <tr className="border-b border-[#e8f0eb] bg-[#f7faf8] text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                  <th className="px-3 py-2">Laboratory test</th>
                  <th className="w-36 px-2 py-2">Category</th>
                  <th className="w-28 px-2 py-2">Result</th>
                  <th className="w-20 px-2 py-2">Unit</th>
                  <th className="w-28 px-2 py-2">Date</th>
                  <th className="w-20 px-2 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedResults.map((row) => (
                  <tr key={row.id} className="border-b border-[#eef3ef] last:border-0 hover:bg-[#fbfdfb]">
                    <td className="max-w-0 px-3 py-2.5">
                      <p className="truncate font-semibold text-[#0f2c20]">{row.testName}</p>
                      {row.remarks ? (
                        <p className="mt-0.5 truncate text-[10px] text-[#8aa094]">{row.remarks}</p>
                      ) : null}
                    </td>
                    <td className="px-2 py-2.5 text-[#52645d]">
                      {getLabCategoryLabel(row.testCategory)}
                    </td>
                    <td className="px-2 py-2.5 font-semibold text-[#0f2c20]">{row.resultValue}</td>
                    <td className="px-2 py-2.5 font-mono text-[11px] text-[#52645d]">
                      {row.unit || "—"}
                    </td>
                    <td className="px-2 py-2.5 font-mono text-[11px] text-[#52645d]">
                      {formatDateInput(row.dateConducted) || "—"}
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleEdit(row)}
                        className="rounded p-1.5 text-[#8aa094] hover:bg-emerald-50 hover:text-emerald-800"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(row)}
                        className="rounded p-1.5 text-[#8aa094] hover:bg-rose-50 hover:text-rose-600"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>

      <div className="flex flex-wrap items-center justify-between gap-2 pb-8">
        <Link
          href={`/researcher/projects/${project.id}/in-silico`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#d7e4dc] bg-white px-3.5 py-2 text-xs font-semibold text-[#52645d] hover:bg-[#f7faf8]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Section 2
        </Link>
        <Link
          href={`/researcher/projects/${project.id}/submission`}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
        >
          Continue to Section 4 · Paper Submission
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
