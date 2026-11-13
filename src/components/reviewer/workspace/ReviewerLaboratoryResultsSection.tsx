"use client";

import React, { useEffect, useState } from "react";
import { Beaker, Loader2, AlertTriangle } from "lucide-react";

interface LabResultRecord {
  id: number;
  testName: string;
  resultValue: string;
  unit?: string | null;
}

interface Props {
  projectId: number;
}

function formatResultDisplay(row: Pick<LabResultRecord, "resultValue" | "unit">) {
  const value = (row.resultValue || "").trim();
  const unit = (row.unit || "").trim();
  if (!value) return "—";
  if (!unit) return value;
  if (value.includes(unit)) return value;
  return `${value} ${unit}`;
}

export default function ReviewerLaboratoryResultsSection({ projectId }: Props) {
  const [results, setResults] = useState<LabResultRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/researcher/projects/${projectId}/laboratory-results`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || "Failed to load laboratory results");
        return data;
      })
      .then((data) => {
        if (!cancelled) setResults(Array.isArray(data?.results) ? data.results : []);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.message || "Failed to load laboratory results");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const labComplete = results.length > 0;
  const labProgressPercent = labComplete ? 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
            <Beaker className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-[#071930]">Laboratory Results</h2>
            <p className="text-[11px] text-slate-500">
              Laboratory tests recorded by the researcher · read-only
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  labComplete
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-slate-50 text-slate-500"
                }`}
              >
                {labComplete ? "Complete" : "Not Started"}
              </span>
              <span className="font-mono text-[11px] font-bold tabular-nums text-slate-800">
                {labProgressPercent}%
              </span>
            </div>
          </div>
        </div>
        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
          Read-only
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading laboratory results…
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
          The researcher has not recorded laboratory results for this project yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full table-fixed border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-2.5">Laboratory Test</th>
                <th className="px-4 py-2.5">Result</th>
              </tr>
            </thead>
            <tbody>
              {results.map((row) => (
                <tr key={row.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 font-semibold text-slate-900">{row.testName}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {formatResultDisplay(row)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
