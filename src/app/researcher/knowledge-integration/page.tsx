"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Share2,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  FolderGit2,
  Leaf,
  Sparkles,
} from "lucide-react";

export default function GlobalKnowledgeIntegrationPage() {
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<any[]>([]);

  useEffect(() => {
    async function loadAllProposals() {
      try {
        setLoading(true);
        const res = await fetch("/api/researcher/knowledge-integration");
        if (res.ok) {
          const data = await res.json();
          setProposals(data.proposals || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAllProposals();
  }, []);

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#dde6df] space-y-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-[#0f2c20] text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider">
            Editorial Pipeline
          </span>
          <span className="text-xs text-[#78997f]">
            {proposals.length} Knowledge Base Proposals
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#0f2c20] tracking-tight">
          Knowledge Integration Submissions
        </h1>
        <p className="text-xs sm:text-sm text-[#475550] max-w-2xl leading-relaxed">
          Track proposals submitted to the NatureAide Editorial Review Board for translating validated discoveries into the public Community Plant Guide.
        </p>
      </div>

      {/* DEMARCATION NOTICE */}
      <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs space-y-1">
        <div className="flex items-center gap-2 font-bold text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-700" />
          <span>Scientific Governance Rule</span>
        </div>
        <p className="text-[11px] text-amber-900/90 leading-relaxed font-normal">
          Completed research does <strong>NOT</strong> automatically become a public medical recommendation. Every proposal is evaluated by editorial board reviewers for clinical veracity before being published into Community-facing content.
        </p>
      </div>

      {/* PROPOSALS LIST */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#78997f] animate-pulse">
          Loading knowledge proposals...
        </div>
      ) : proposals.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-[#dde6df] text-center space-y-3">
          <Share2 className="w-10 h-10 text-[#b4c8b9] mx-auto" />
          <h3 className="font-heading font-bold text-sm text-[#0f2c20]">
            No Knowledge Proposals Submitted Yet
          </h3>
          <p className="text-xs text-[#78997f] max-w-sm mx-auto">
            Open any of your completed research projects and visit Stage 5: Research Integration to propose additions to the NatureAide public guide.
          </p>
          <div className="pt-2">
            <Link
              href="/researcher/projects"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0f2c20] text-white text-xs font-bold hover:bg-[#1e5c44]"
            >
              <span>Go to My Projects</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map((p) => {
            const isApproved = p.status === "APPROVED";
            const isProposed = p.status === "PROPOSED" || p.status === "UNDER_REVIEW";

            return (
              <div
                key={p.id}
                className="p-6 rounded-3xl bg-white border border-[#dde6df] hover:border-[#16a34a] space-y-3 shadow-2xs transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#edf2ee]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#0f2c20] text-emerald-300 text-[10px] font-extrabold uppercase">
                      {p.proposalType}
                    </span>
                    {p.plantName && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold flex items-center gap-1">
                        <Leaf className="w-3 h-3 text-emerald-600" />
                        <span>{p.plantName}</span>
                      </span>
                    )}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        isApproved
                          ? "bg-emerald-100 text-emerald-900"
                          : isProposed
                          ? "bg-blue-100 text-blue-900"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      Status: {p.status}
                    </span>
                  </div>

                  <span className="text-[10px] text-[#78997f]">
                    Submitted {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-heading font-extrabold text-base text-[#0f2c20]">
                      {p.title}
                    </h3>
                    <p className="text-xs text-[#78997f]">
                      Source: Project #{p.projectId} — {p.projectTitle}
                    </p>
                  </div>

                  <Link
                    href={`/researcher/projects/${p.projectId}/completion-integration`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#16a34a] hover:text-[#0f2c20] shrink-0"
                  >
                    <span>View in Project Dossier</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#faf9f5] border border-[#dde6df] text-xs text-[#0f2c20]">
                  <span className="text-[10px] font-bold text-[#16a34a] uppercase block mb-1">
                    Proposed Public Content:
                  </span>
                  <p className="text-[#475550] leading-relaxed">{p.proposedContent}</p>
                </div>

                <div className="text-xs text-[#78997f]">
                  <span className="font-bold text-[#0f2c20] text-[11px] block">
                    Evidence Basis:
                  </span>
                  <p>{p.evidenceBasis}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
