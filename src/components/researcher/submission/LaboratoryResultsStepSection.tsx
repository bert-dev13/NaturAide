"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Beaker,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Pencil,
  Trash2,
  X,
  Upload,
  Paperclip,
  Plus,
} from "lucide-react";
import {
  LAB_TEST_CATEGORIES,
  COMMON_LAB_UNITS,
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
  reportFileUrl?: string | null;
  reportFileName?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface LabProgressInfo {
  count: number;
  progressPercent: number;
  status: "NOT_STARTED" | "COMPLETED";
}

interface Props {
  projectId: number;
  projectTitle: string;
  readOnly?: boolean;
  onCountChange?: (count: number) => void;
  /** Fired after successful save/delete with persisted progress from the server. */
  onProgressChange?: (info: LabProgressInfo, fullProgress?: any) => void;
}

function formatDateInput(value?: string | null) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function formatResultDisplay(row: Pick<LabResultRecord, "resultValue" | "unit">) {
  const value = (row.resultValue || "").trim();
  const unit = (row.unit || "").trim();
  if (!value) return "—";
  if (!unit) return value;
  if (value.includes(unit)) return value;
  return `${value} ${unit}`;
}

export default function LaboratoryResultsStepSection({
  projectId,
  projectTitle,
  readOnly = false,
  onCountChange,
  onProgressChange,
}: Props) {
  const [results, setResults] = useState<LabResultRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [testCategory, setTestCategory] = useState<LabTestCategoryKey>("PHYSICOCHEMICAL");
  const [testName, setTestName] = useState("");
  const [resultValue, setResultValue] = useState("");
  const [unit, setUnit] = useState("");
  const [dateConducted, setDateConducted] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [remarks, setRemarks] = useState("");
  const [reportFileUrl, setReportFileUrl] = useState<string | null>(null);
  const [reportFileName, setReportFileName] = useState<string | null>(null);
  const reportInputRef = useRef<HTMLInputElement | null>(null);
  const onCountChangeRef = useRef(onCountChange);
  const onProgressChangeRef = useRef(onProgressChange);
  const prevCategoryRef = useRef(testCategory);

  useEffect(() => {
    onCountChangeRef.current = onCountChange;
  }, [onCountChange]);

  useEffect(() => {
    onProgressChangeRef.current = onProgressChange;
  }, [onProgressChange]);

  const suggestedTests = useMemo(
    () => getTestsForCategory(testCategory).filter((t) => t !== "Other"),
    [testCategory]
  );

  const isFormValid =
    Boolean(testCategory) && Boolean(testName.trim()) && Boolean(resultValue.trim());

  const notifyProgress = useCallback((data: any, rowCount: number) => {
    const info: LabProgressInfo = data?.laboratoryResults || {
      count: rowCount,
      progressPercent: rowCount > 0 ? 100 : 0,
      status: rowCount > 0 ? "COMPLETED" : "NOT_STARTED",
    };
    onCountChangeRef.current?.(info.count);
    onProgressChangeRef.current?.(info, data?.progress);
  }, []);

  const loadResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/laboratory-results`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load results");
      const rows = Array.isArray(data.results) ? data.results : [];
      setResults(rows);
      // Sync count only — do not trigger parent progress refresh on every load
      onCountChangeRef.current?.(
        data?.laboratoryResults?.count ?? rows.length
      );
    } catch (err: any) {
      setError(err.message || "Failed to load laboratory results");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadResults();
  }, [loadResults]);

  // When category changes in an "add" modal, clear the previous test name once
  useEffect(() => {
    if (!modalOpen || editingId != null) {
      prevCategoryRef.current = testCategory;
      return;
    }
    if (prevCategoryRef.current !== testCategory) {
      prevCategoryRef.current = testCategory;
      setTestName("");
    }
  }, [testCategory, editingId, modalOpen]);

  const resetForm = () => {
    setEditingId(null);
    setTestCategory("PHYSICOCHEMICAL");
    setTestName("");
    setResultValue("");
    setUnit("");
    setDateConducted(new Date().toISOString().slice(0, 10));
    setRemarks("");
    setReportFileUrl(null);
    setReportFileName(null);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const openAddModal = () => {
    resetForm();
    setError(null);
    setSuccess(null);
    setModalOpen(true);
  };

  const handleEdit = (row: LabResultRecord) => {
    setEditingId(row.id);
    setTestCategory((row.testCategory as LabTestCategoryKey) || "OTHER_CUSTOM");
    setTestName(row.testName || "");
    setResultValue(row.resultValue || "");
    setUnit(row.unit || "");
    setDateConducted(formatDateInput(row.dateConducted) || "");
    setRemarks(row.remarks || "");
    setReportFileUrl(row.reportFileUrl || null);
    setReportFileName(row.reportFileName || null);
    setSuccess(null);
    setError(null);
    setModalOpen(true);
  };

  const handleReportUpload = async (file: File | null) => {
    if (!file || readOnly) return;
    setUploadingReport(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/researcher/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to upload laboratory report");
      setReportFileUrl(data.url || null);
      setReportFileName(data.filename || file.name);
    } catch (err: any) {
      setError(err.message || "Failed to upload laboratory report");
    } finally {
      setUploadingReport(false);
      if (reportInputRef.current) reportInputRef.current.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || saving || readOnly) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/researcher/projects/${projectId}/laboratory-results`, {
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
          reportFileUrl,
          reportFileName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setSuccess(editingId ? "Laboratory result updated." : "Laboratory result saved.");
      closeModal();
      notifyProgress(data, data.laboratoryResults?.count ?? results.length + (editingId ? 0 : 1));
      await loadResults();
    } catch (err: any) {
      setError(err.message || "Failed to save laboratory result");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: LabResultRecord) => {
    if (readOnly) return;
    if (!confirm(`Delete “${row.testName}”?`)) return;
    setError(null);
    try {
      const res = await fetch(
        `/api/researcher/projects/${projectId}/laboratory-results?resultId=${row.id}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      if (editingId === row.id) closeModal();
      setSuccess("Laboratory result deleted.");
      notifyProgress(data, data.laboratoryResults?.count ?? Math.max(0, results.length - 1));
      await loadResults();
    } catch (err: any) {
      setError(err.message || "Failed to delete");
    }
  };

  const labComplete = results.length > 0;
  const labProgressPercent = labComplete ? 100 : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#d7e4dc] bg-white px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
              <Beaker className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-[#0f2c20]">Laboratory Results</h2>
              <p className="mt-0.5 max-w-xl text-[12px] text-[#6d7f76]">
                Add the laboratory tests you performed and their actual results.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    labComplete
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-[#d7e4dc] bg-[#f7faf8] text-[#8aa094]"
                  }`}
                >
                  {labComplete ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : null}
                  {labComplete ? "Complete" : "Not Started"}
                </span>
                <span className="font-mono text-[11px] font-bold tabular-nums text-[#0f2c20]">
                  {labProgressPercent}%
                </span>
              </div>
            </div>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Laboratory Result
            </button>
          )}
        </div>
      </div>

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

      <section className="rounded-2xl border border-[#d7e4dc] bg-white p-4 shadow-[0_1px_2px_rgba(15,44,32,0.04)] sm:p-5">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-[#8aa094]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading results…
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#d7e4dc] bg-[#f7faf8] px-4 py-12 text-center">
            <p className="text-[13px] font-medium text-[#52645d]">No laboratory results yet</p>
            <p className="mt-1 text-[12px] text-[#8aa094]">
              This step is optional. Add a result when you have measured findings to record.
            </p>
            {!readOnly && (
              <button
                type="button"
                onClick={openAddModal}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Laboratory Result
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#e8f0eb]">
            <table className="w-full table-fixed border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#e8f0eb] bg-[#f7faf8] text-[10px] font-bold uppercase tracking-wider text-[#8aa094]">
                  <th className="px-4 py-2.5">Laboratory Test</th>
                  <th className="px-4 py-2.5">Result</th>
                  {!readOnly && <th className="w-24 px-3 py-2.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {results.map((row) => (
                  <tr key={row.id} className="border-b border-[#eef3ef] last:border-0 hover:bg-[#fbfdfb]">
                    <td className="px-4 py-3 font-semibold text-[#0f2c20]">{row.testName}</td>
                    <td className="px-4 py-3 font-medium text-[#52645d]">
                      {formatResultDisplay(row)}
                    </td>
                    {!readOnly && (
                      <td className="px-3 py-3 text-right">
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
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen && !readOnly && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="lab-result-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f2c20]/60 p-3 sm:p-6 backdrop-blur-[2px]"
          onClick={() => !saving && closeModal()}
        >
          <div
            className="relative flex max-h-[min(92vh,820px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#d7e4dc] bg-white shadow-[0_24px_64px_-28px_rgba(15,44,32,0.55)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative shrink-0 overflow-hidden border-b border-emerald-900/10 bg-[linear-gradient(120deg,#0f2c20_0%,#134032_48%,#0b271b_100%)] px-6 py-5 text-white sm:px-7">
              <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-emerald-400/15 blur-3xl" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3.5">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/30">
                    <Beaker className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300/80">
                      Paper Submission · Laboratory Results
                    </p>
                    <h3
                      id="lab-result-modal-title"
                      className="mt-1 text-base font-bold tracking-tight sm:text-lg"
                    >
                      {editingId ? "Edit Laboratory Result" : "Add Laboratory Result"}
                    </h3>
                    <p className="mt-1 truncate text-[12px] text-emerald-100/75">{projectTitle}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !saving && closeModal()}
                  disabled={saving}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-emerald-100 transition hover:bg-white/20 hover:text-white disabled:opacity-50"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5 sm:px-7 sm:py-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#8aa094]">
                      Test category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={testCategory}
                      onChange={(e) => setTestCategory(e.target.value as LabTestCategoryKey)}
                      className="h-11 w-full rounded-xl border border-[#d5e3da] bg-[#fbfdfb] px-3.5 text-sm font-semibold text-[#0f2c20] outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                    >
                      {LAB_TEST_CATEGORIES.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#8aa094]">
                      Date conducted
                    </label>
                    <input
                      type="date"
                      value={dateConducted}
                      onChange={(e) => setDateConducted(e.target.value)}
                      className="h-11 w-full rounded-xl border border-[#d5e3da] bg-[#fbfdfb] px-3.5 text-sm font-semibold text-[#0f2c20] outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#8aa094]">
                      Laboratory test <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      list="lab-test-suggestions-modal"
                      value={testName}
                      onChange={(e) => setTestName(e.target.value)}
                      placeholder="e.g. pH, Viscosity, DPPH Assay"
                      className="h-11 w-full rounded-xl border border-[#d5e3da] bg-[#fbfdfb] px-3.5 text-sm font-semibold text-[#0f2c20] outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                    />
                    <datalist id="lab-test-suggestions-modal">
                      {suggestedTests.map((t) => (
                        <option key={t} value={t} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#8aa094]">
                      Result <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={resultValue}
                      onChange={(e) => setResultValue(e.target.value)}
                      placeholder="Actual measured value or observation"
                      className="h-11 w-full rounded-xl border border-[#d5e3da] bg-[#fbfdfb] px-3.5 text-sm font-semibold text-[#0f2c20] outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#8aa094]">
                      Unit of measurement
                    </label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="h-11 w-full rounded-xl border border-[#d5e3da] bg-[#fbfdfb] px-3.5 text-sm font-semibold text-[#0f2c20] outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
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
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#8aa094]">
                      Remarks <span className="font-medium normal-case tracking-normal">(optional)</span>
                    </label>
                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows={3}
                      placeholder="Method, conditions, or observations"
                      className="w-full rounded-xl border border-[#d5e3da] bg-[#fbfdfb] px-3.5 py-2.5 text-sm text-[#0f2c20] outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#8aa094]">
                      Laboratory report{" "}
                      <span className="font-medium normal-case tracking-normal">(optional)</span>
                    </label>
                    <input
                      ref={reportInputRef}
                      type="file"
                      accept=".pdf,.docx,.png,.jpg,.jpeg,.csv,.txt"
                      className="hidden"
                      onChange={(e) => {
                        void handleReportUpload(e.target.files?.[0] || null);
                      }}
                    />
                    <div className="flex flex-col gap-3 rounded-xl border border-dashed border-[#cfe0d6] bg-[#fbfdfb] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        {reportFileUrl ? (
                          <div className="flex items-start gap-2">
                            <Paperclip className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                            <div className="min-w-0">
                              <a
                                href={reportFileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="block truncate text-sm font-semibold text-emerald-800 hover:underline"
                              >
                                {reportFileName || "Attached report"}
                              </a>
                              <p className="mt-0.5 text-[11px] text-[#8aa094]">
                                Attached · will be saved with this result
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <Upload className="mt-0.5 h-4 w-4 shrink-0 text-[#8aa094]" />
                            <div>
                              <p className="text-sm font-semibold text-[#52645d]">
                                Attach a PDF, DOCX, or image
                              </p>
                              <p className="mt-0.5 text-[11px] text-[#8aa094]">
                                Optional — results can be saved without a file
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={uploadingReport}
                          onClick={() => reportInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#d5e3da] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#52645d] transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-900 disabled:opacity-50"
                        >
                          {uploadingReport ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Upload className="h-3.5 w-3.5" />
                          )}
                          {reportFileUrl ? "Replace" : "Upload"}
                        </button>
                        {reportFileUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setReportFileUrl(null);
                              setReportFileName(null);
                            }}
                            className="rounded-xl px-3 py-2.5 text-xs font-semibold text-[#8aa094] transition hover:bg-rose-50 hover:text-rose-600"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {error && modalOpen && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-900">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span className="font-medium">{error}</span>
                  </div>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#eef2ef] bg-[#f7faf8]/90 px-6 py-4 sm:px-7">
                <p className="text-[11px] text-[#8aa094]">
                  Values are never generated automatically.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => !saving && closeModal()}
                    disabled={saving}
                    className="rounded-xl border border-[#d5e3da] bg-white px-5 py-2.5 text-xs font-semibold text-[#52645d] transition hover:bg-white disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isFormValid || saving}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        Save Laboratory Result
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
