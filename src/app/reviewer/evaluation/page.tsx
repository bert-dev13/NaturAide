import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import { ClipboardCheck, ArrowRight, Layers } from "lucide-react";

export const instant = false;

export default async function ReviewerEvaluationPage() {
  const session = await getSession();
  if (!session || session.role !== "REVIEWER") {
    redirect("/login");
  }

  // Find the most recently submitted or active project
  let targetProjectId: number | null = null;
  try {
    const [rows]: any = await pool.query(
      `SELECT id FROM research_projects ORDER BY updatedAt DESC, id DESC LIMIT 1`
    );
    if (rows && rows.length > 0) {
      targetProjectId = rows[0].id;
    }
  } catch (e) {
    console.error("Failed to query project for evaluation page:", e);
  }

  if (targetProjectId) {
    redirect(`/reviewer/projects/${targetProjectId}?tab=evaluation`);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
          <ClipboardCheck className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-slate-900">
            Professional Multidisciplinary Review Panel
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Please select an active research project from the Review Queue to access the 3-role professional evaluation panel.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/reviewer/projects"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
          >
            <Layers className="w-4 h-4" />
            <span>Go to Review Queue</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

