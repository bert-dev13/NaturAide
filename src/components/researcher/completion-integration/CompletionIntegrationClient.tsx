"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileCheck,
  BookOpen,
  Microscope,
  Atom,
  FlaskConical,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Edit3,
  RotateCcw,
  Check,
  AlertTriangle,
  Info,
  ExternalLink,
  Eye,
  Save,
  Lock,
  FileText,
  Layers,
  X,
  Droplets,
  Sprout,
  Target,
  Leaf,
  Dna,
} from "lucide-react";

import {
  ResearchStageHeader,
  ResearchSection,
  HeaderMetric,
  HeaderDivider,
  STAGE_PAGE_CLASS,
  WORKSPACE_PRIMARY_BTN,
  WORKSPACE_SECONDARY_BTN,
  WORKSPACE_TEXTAREA,
} from "@/components/researcher/stage/ResearchWorkspaceUI";
import { ResearchStageFooter } from "@/components/researcher/stage/ResearchStageFooter";

interface Props {
  projectId: number;
}

export default function CompletionIntegrationClient({ projectId }: Props) {
  const router = useRouter();

  // Loading & submission states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Raw data from API
  const [project, setProject] = useState<any>(null);
  const [stageMap, setStageMap] = useState<Record<string, string>>({});
  const [stage1Evidence, setStage1Evidence] = useState<any>(null);
  const [stage2InSilico, setStage2InSilico] = useState<any>(null);
  const [stage3Docking, setStage3Docking] = useState<any>(null);
  const [stage4FormulationSafety, setStage4FormulationSafety] = useState<any>(null);
  const [readiness, setReadiness] = useState<any>({});

  // RESEARCH SYNTHESIS 5 Fields
  const [evidenceAlignment, setEvidenceAlignment] = useState("");
  const [keyFindings, setKeyFindings] = useState<string[]>([]);
  const [keyFindingsText, setKeyFindingsText] = useState("");
  const [scientificInterpretation, setScientificInterpretation] = useState("");
  const [limitations, setLimitations] = useState("");
  const [finalConclusion, setFinalConclusion] = useState("");
  const [isSynthesisApproved, setIsSynthesisApproved] = useState(false);
  const [isEditingSynthesis, setIsEditingSynthesis] = useState(false);

  // Default AI draft (for regenerate)
  const [defaultDraft, setDefaultDraft] = useState<any>(null);

  // Dossier Modal
  const [showDossierModal, setShowDossierModal] = useState(false);

  // Fetch all Stage 5 data
  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch(`/api/researcher/projects/${projectId}/completion-integration`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }
      const data = await res.json();

      setProject(data.project);
      setStageMap(data.stageMap || {});
      setStage1Evidence(data.stage1Evidence);
      setStage2InSilico(data.stage2InSilico);
      setStage3Docking(data.stage3Docking);
      setStage4FormulationSafety(data.stage4FormulationSafety);
      setReadiness(data.readiness || {});

      const s5 = data.stage5Data || {};
      setEvidenceAlignment(s5.evidenceAlignment || "");
      setScientificInterpretation(s5.scientificInterpretation || "");
      setLimitations(s5.limitations || "");
      setFinalConclusion(s5.finalConclusion || "");
      setIsSynthesisApproved(Boolean(s5.isSynthesisApproved));

      // Parse key findings
      let parsedFindings: string[] = [];
      if (typeof s5.keyFindings === "string") {
        try {
          const parsed = JSON.parse(s5.keyFindings);
          if (Array.isArray(parsed)) {
            parsedFindings = parsed;
          } else {
            parsedFindings = s5.keyFindings.split("\n").filter(Boolean);
          }
        } catch {
          parsedFindings = s5.keyFindings.split("\n").filter(Boolean);
        }
      } else if (Array.isArray(s5.keyFindings)) {
        parsedFindings = s5.keyFindings;
      }
      setKeyFindings(parsedFindings);
      setKeyFindingsText(parsedFindings.join("\n"));

      if (s5.defaultDraft) {
        setDefaultDraft(s5.defaultDraft);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load research data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  // Save draft to server
  const handleSaveDraft = async (options?: {
    newSynthesisApproved?: boolean;
    silent?: boolean;
  }) => {
    try {
      setSaving(true);
      setErrorMsg(null);

      const approved =
        options?.newSynthesisApproved !== undefined
          ? options.newSynthesisApproved
          : isSynthesisApproved;

      const payload = {
        action: "save-stage5",
        evidenceAlignment,
        keyFindings: keyFindingsText.split("\n").map((s) => s.trim()).filter(Boolean),
        scientificInterpretation,
        limitations,
        finalConclusion,
        isSynthesisApproved: approved,
      };

      const res = await fetch(`/api/researcher/projects/${projectId}/completion-integration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to save draft.");
      }

      if (!options?.silent) {
        setSuccessMsg("Research synthesis draft saved.");
        setTimeout(() => setSuccessMsg(null), 3000);
      }
      return true;
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save draft.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Toggle or approve synthesis
  const handleApproveSynthesis = async () => {
    const nextVal = !isSynthesisApproved;
    setIsSynthesisApproved(nextVal);
    if (isEditingSynthesis) {
      const updatedFindings = keyFindingsText.split("\n").map((s) => s.trim()).filter(Boolean);
      setKeyFindings(updatedFindings);
      setIsEditingSynthesis(false);
    }
    await handleSaveDraft({ newSynthesisApproved: nextVal });
  };

  // Regenerate draft from initial AI generation
  const handleRegenerateDraft = () => {
    if (!defaultDraft) return;
    if (
      window.confirm(
        "Regenerate Research Synthesis? This will update the synthesis fields using current live Stage 1–4 project data."
      )
    ) {
      setEvidenceAlignment(defaultDraft.evidenceAlignment || "");
      setScientificInterpretation(defaultDraft.scientificInterpretation || "");
      setLimitations(defaultDraft.limitations || "");
      setFinalConclusion(defaultDraft.finalConclusion || "");
      setIsSynthesisApproved(false);

      let parsedFindings: string[] = [];
      try {
        parsedFindings = JSON.parse(defaultDraft.keyFindings);
      } catch {
        parsedFindings = (defaultDraft.keyFindings || "").split("\n").filter(Boolean);
      }
      setKeyFindings(parsedFindings);
      setKeyFindingsText(parsedFindings.join("\n"));

      setSuccessMsg("Synthesis regenerated from live Stage 1–4 data.");
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  // Finalize Stage 5 and navigate to Stage 6
  const handleFinalizeStage5 = async () => {
    if (!readiness.isStage1Done || !readiness.isStage2Done || !readiness.isStage3Done || !readiness.isStage4Done) {
      setErrorMsg("Stages 1 through 4 must all be completed before finalizing Stage 5.");
      return;
    }
    if (!isSynthesisApproved) {
      setErrorMsg("Please approve the Research Synthesis before finalizing.");
      return;
    }

    try {
      setFinalizing(true);
      setErrorMsg(null);

      // Save draft first to ensure DB state matches
      await handleSaveDraft({ silent: true });

      const res = await fetch(`/api/researcher/projects/${projectId}/completion-integration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "finalize-stage5" }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to finalize Stage 5.");
      }

      setSuccessMsg("Stage 5 finalized! Navigating to Stage 6: Final Professional Review...");
      setTimeout(() => {
        router.push(`/researcher/projects/${projectId}/expert-review`);
      }, 900);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to finalize Stage 5.");
    } finally {
      setFinalizing(false);
    }
  };

  // Plant & Stage Details
  const plantName = project?.plantName || "Medicinal Plant";
  const scientificName = project?.plantScientificName || "";
  const isStage5Complete = stageMap["completion-integration"] === "COMPLETED";

  const isReadyToFinalize =
    readiness.isStage1Done &&
    readiness.isStage2Done &&
    readiness.isStage3Done &&
    readiness.isStage4Done &&
    isSynthesisApproved;

  // Render Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfdfa] flex flex-col items-center justify-center p-8">
        <div className="w-12 h-12 border-4 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold text-[#0f2c20]">Loading Stage 5: Research Integration...</h2>
        <p className="text-xs text-[#52645d] mt-1">Retrieving actual research outputs across Stages 1–4</p>
      </div>
    );
  }

  // Render Error state if GET failed
  if (errorMsg && !project) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center font-sans">
        <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-rose-900 max-w-lg w-full shadow-lg space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-rose-950">Unable to load research evidence</h2>
            <p className="text-xs text-rose-800 mt-1.5 leading-relaxed">{errorMsg}</p>
          </div>
          <button
            type="button"
            onClick={() => fetchData()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all hover:scale-[1.02]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={STAGE_PAGE_CLASS}>
      {/* ========================================================
          05 · RESEARCH INTEGRATION HERO HEADER
          ======================================================== */}
      <ResearchStageHeader
        projectId={projectId}
        stageNumber={5}
        stageTitle="Research Integration"
        plantCommonName={plantName}
        plantScientificName={scientificName}
        statusLabel={isStage5Complete ? "Completed" : "In Progress"}
        complete={isStage5Complete}
      />

      {/* Notifications */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs sm:text-sm font-bold text-rose-900 shadow-sm"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span className="flex-1">{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs sm:text-sm font-bold text-emerald-950 shadow-sm"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="flex-1">{successMsg}</span>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
          01 · RESEARCH EVIDENCE
          ┌ Literature ────── In-Silico ────── Docking ────── Formulation ┐
          ======================================================== */}
      <ResearchSection
        id="evidence"
        icon={Layers}
        title="RESEARCH EVIDENCE"
        subtitle="Actual multi-stage research outputs retrieved automatically from Stages 1–4"
        badge="Multi-Stage Evidence"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Column 1: Literature */}
          <div className="rounded-2xl border border-[#e2eae4] bg-[#f7faf8] p-4 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#e2eae4]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-xs font-black uppercase tracking-wider text-[#0f2c20]">
                    Literature
                  </span>
                </div>
                <Link
                  href={`/researcher/projects/${projectId}/plant-literature`}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5 hover:underline"
                >
                  View <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="mt-3 space-y-2.5 text-xs text-[#42544c]">
                <div className="p-2.5 bg-white rounded-xl border border-[#e2eae4]">
                  <div className="font-bold text-[#0f2c20] text-xs">
                    {plantName} {scientificName && <span className="italic font-serif font-normal">({scientificName})</span>}
                  </div>
                  <p className="line-clamp-2 text-[#697d72] text-[11px] mt-1 leading-relaxed">
                    {stage1Evidence?.synthesis?.keyFindings ||
                      stage1Evidence?.review?.background ||
                      "Ethnomedicinal profile and therapeutic context."}
                  </p>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-[#e2eae4] flex items-center justify-between">
                  <span className="text-[#697d72] text-[11px]">Studies:</span>
                  <span className="font-mono font-bold text-[#0f2c20]">
                    {stage1Evidence?.literatureCount || 0} retrieved
                  </span>
                </div>

                {stage1Evidence?.topLiterature && stage1Evidence.topLiterature.length > 0 && (
                  <div className="p-2 rounded-xl bg-white border border-[#e2eae4] text-[11px]">
                    <div className="text-[10px] font-mono font-bold text-[#78997f] uppercase">Sample Paper</div>
                    <div className="font-bold text-[#0f2c20] line-clamp-1 mt-0.5">
                      {stage1Evidence.topLiterature[0].title}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-[#e2eae4] flex items-center justify-between text-[11px]">
              <span className="font-mono text-[10px] text-teal-800 bg-teal-100/90 px-2 py-0.5 rounded-full font-bold">
                LITERATURE
              </span>
              <span className="font-bold text-emerald-800 flex items-center gap-1">
                <Check className="w-3 h-3" /> Verified
              </span>
            </div>
          </div>

          {/* Column 2: In-Silico */}
          <div className="rounded-2xl border border-[#e2eae4] bg-[#f7faf8] p-4 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-colors">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#e2eae4]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-800">
                    <Atom className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-xs font-black uppercase tracking-wider text-[#0f2c20]">
                    In-Silico
                  </span>
                </div>
                <Link
                  href={`/researcher/projects/${projectId}/in-silico`}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5 hover:underline"
                >
                  View <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="mt-3 space-y-2 text-xs text-[#42544c]">
                {stage2InSilico?.results && stage2InSilico.results.length > 0 ? (
                  stage2InSilico.results.map((comp: any, idx: number) => {
                    const metrics = comp.metrics || {};
                    const props = metrics.properties || {};
                    const mw = props.molecularWeight?.value || comp.molecularWeight || "—";
                    const logP = props.logP?.value || "—";
                    const lipinski = metrics.drugLikeness?.lipinskiRuleOfFive?.result || "Evaluated";
                    const isPass = lipinski.toLowerCase().includes("pass");

                    return (
                      <div key={idx} className="p-2.5 rounded-xl bg-white border border-[#e2eae4] text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-[#0f2c20]">{comp.compoundName}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              isPass ? "bg-emerald-100 text-emerald-950" : "bg-amber-100 text-amber-950"
                            }`}
                          >
                            {lipinski}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[10px] text-[#697d72] mt-1 font-mono">
                          <div>MW: {String(mw).split(" ")[0]}</div>
                          <div>LogP: {logP}</div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3 bg-white rounded-xl text-center text-[#697d72]">No records</div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-[#e2eae4] flex items-center justify-between text-[11px]">
              <span className="font-mono text-[10px] text-indigo-800 bg-indigo-100/90 px-2 py-0.5 rounded-full font-bold">
                PREDICTED
              </span>
              <span className="font-bold text-emerald-800 flex items-center gap-1">
                <Check className="w-3 h-3" /> Screened
              </span>
            </div>
          </div>

          {/* Column 3: Docking */}
          <div className="rounded-2xl border border-[#e2eae4] bg-[#f7faf8] p-4 shadow-xs flex flex-col justify-between hover:border-purple-300 transition-colors">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#e2eae4]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-100 text-purple-800">
                    <Microscope className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-xs font-black uppercase tracking-wider text-[#0f2c20]">
                    Docking
                  </span>
                </div>
                <Link
                  href={`/researcher/projects/${projectId}/docking`}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5 hover:underline"
                >
                  View <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="mt-3 space-y-2 text-xs text-[#42544c]">
                {stage3Docking?.runs && stage3Docking.runs.length > 0 ? (
                  stage3Docking.runs.map((run: any, idx: number) => {
                    const affinity = run.bindingAffinity ? `${run.bindingAffinity} kcal/mol` : "N/A";
                    return (
                      <div key={idx} className="p-2.5 rounded-xl bg-white border border-[#e2eae4] text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-[#0f2c20]">{run.ligandName}</span>
                          <span className="font-mono font-black text-purple-900 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 text-[10px]">
                            {affinity}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#697d72] mt-0.5 truncate">
                          {run.targetProtein} · PDB {run.pdbId}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3 bg-white rounded-xl text-center text-[#697d72]">No runs</div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-[#e2eae4] flex items-center justify-between text-[11px]">
              <span className="font-mono text-[10px] text-purple-800 bg-purple-100/90 px-2 py-0.5 rounded-full font-bold">
                PREDICTED
              </span>
              <span className="font-mono text-[10px] text-[#697d72]">Vina v1.2.7</span>
            </div>
          </div>

          {/* Column 4: Formulation */}
          <div className="rounded-2xl border border-[#e2eae4] bg-[#f7faf8] p-4 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-colors">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#e2eae4]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                    <FlaskConical className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-xs font-black uppercase tracking-wider text-[#0f2c20]">
                    Formulation
                  </span>
                </div>
                <Link
                  href={`/researcher/projects/${projectId}/formulation-safety`}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5 hover:underline"
                >
                  View <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="mt-3 space-y-2 text-xs text-[#42544c]">
                {stage4FormulationSafety?.formulation ? (
                  <div className="p-2.5 bg-white rounded-xl border border-[#e2eae4] text-[11px]">
                    <div className="font-black text-[#0f2c20] truncate">
                      {stage4FormulationSafety.formulation.formulationName}
                    </div>
                    <div className="text-[10px] text-[#697d72] mt-0.5">
                      {stage4FormulationSafety.formulation.dosageFormType} · {stage4FormulationSafety.formulation.formulationCode}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded-xl text-center text-[#697d72]">Not configured</div>
                )}

                <div className="p-2.5 bg-white rounded-xl border border-[#e2eae4] text-[11px]">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-[#697d72]">Compounds:</span>
                    <span className="font-bold text-[#0f2c20]">
                      {stage2InSilico?.results?.map((r: any) => r.compoundName).join(", ") || "Active fractions"}
                    </span>
                  </div>
                  <div className="text-[10px] text-amber-800 mt-1">
                    Concentrations not entered by researcher
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-[#e2eae4] flex items-center justify-between text-[11px]">
              <span className="font-mono text-[10px] text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full font-bold">
                FORMULATION
              </span>
              <span className="font-bold text-emerald-800 flex items-center gap-1">
                <Check className="w-3 h-3" /> 5 Areas Done
              </span>
            </div>
          </div>
        </div>
      </ResearchSection>

      {/* ========================================================
          02 · RESEARCH SYNTHESIS
          Evidence Alignment
          Key Findings
          Scientific Interpretation
          Limitations
          Final Conclusion
                     [ Edit ] [ Approve Synthesis ]
          ======================================================== */}
      <ResearchSection
        id="synthesis"
        icon={Sparkles}
        title="RESEARCH SYNTHESIS"
        subtitle="Comprehensive multi-stage synthesis answering what all of this evidence means together"
        badge={isSynthesisApproved ? "Approved by Researcher" : "Review Required"}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRegenerateDraft}
              className={WORKSPACE_SECONDARY_BTN}
              title="Reset to live Stage 1–4 data draft"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Regenerate</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (isEditingSynthesis) {
                  const updatedFindings = keyFindingsText.split("\n").map((s) => s.trim()).filter(Boolean);
                  setKeyFindings(updatedFindings);
                }
                setIsEditingSynthesis(!isEditingSynthesis);
              }}
              className={WORKSPACE_SECONDARY_BTN}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingSynthesis ? "Done Editing" : "Edit"}</span>
            </button>
            <button
              type="button"
              onClick={handleApproveSynthesis}
              className={WORKSPACE_PRIMARY_BTN}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSynthesisApproved ? "Approved ✓" : "Approve Synthesis"}</span>
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* 1. Evidence Alignment */}
          <div className="p-4 rounded-2xl bg-[#f7faf8] border border-[#e2eae4]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-mono text-xs font-black uppercase tracking-wider text-[#0f2c20]">
                Evidence Alignment
              </h3>
              <span className="font-mono text-[10px] font-bold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-full border border-teal-200">
                LITERATURE & PREDICTED
              </span>
            </div>
            {isEditingSynthesis ? (
              <textarea
                rows={4}
                value={evidenceAlignment}
                onChange={(e) => setEvidenceAlignment(e.target.value)}
                className={WORKSPACE_TEXTAREA}
              />
            ) : (
              <p className="text-xs sm:text-sm text-[#33463e] leading-relaxed whitespace-pre-line">
                {evidenceAlignment || "No evidence alignment specified."}
              </p>
            )}
          </div>

          {/* 2. Key Findings */}
          <div className="p-4 rounded-2xl bg-[#f7faf8] border border-[#e2eae4]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-mono text-xs font-black uppercase tracking-wider text-[#0f2c20]">
                Key Findings
              </h3>
              <span className="text-[11px] text-[#697d72]">Core scientific takeaways</span>
            </div>
            {isEditingSynthesis ? (
              <div>
                <textarea
                  rows={5}
                  value={keyFindingsText}
                  onChange={(e) => setKeyFindingsText(e.target.value)}
                  placeholder="One finding per line..."
                  className={WORKSPACE_TEXTAREA}
                />
                <span className="text-[10px] text-[#697d72] mt-1 block">One finding per line</span>
              </div>
            ) : (
              <div className="space-y-2">
                {keyFindings && keyFindings.length > 0 ? (
                  keyFindings.map((finding, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#33463e]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-2" />
                      <span className="leading-relaxed">{finding}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-[#697d72]">No key findings recorded.</div>
                )}
              </div>
            )}
          </div>

          {/* 3. Scientific Interpretation */}
          <div className="p-4 rounded-2xl bg-[#f7faf8] border border-[#e2eae4]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-mono text-xs font-black uppercase tracking-wider text-[#0f2c20]">
                Scientific Interpretation
              </h3>
              <span className="font-mono text-[10px] font-bold text-purple-800 bg-purple-100/80 px-2 py-0.5 rounded-full border border-purple-200">
                PREDICTED AFFINITY & BINDING
              </span>
            </div>
            {isEditingSynthesis ? (
              <textarea
                rows={4}
                value={scientificInterpretation}
                onChange={(e) => setScientificInterpretation(e.target.value)}
                className={WORKSPACE_TEXTAREA}
              />
            ) : (
              <p className="text-xs sm:text-sm text-[#33463e] leading-relaxed whitespace-pre-line">
                {scientificInterpretation || "No scientific interpretation specified."}
              </p>
            )}
          </div>

          {/* 4. Limitations */}
          <div className="p-4 rounded-2xl bg-[#f7faf8] border border-[#e2eae4]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-mono text-xs font-black uppercase tracking-wider text-[#0f2c20]">
                Limitations
              </h3>
              <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded-full border border-slate-300">
                SCIENTIFIC BOUNDARIES
              </span>
            </div>
            {isEditingSynthesis ? (
              <textarea
                rows={4}
                value={limitations}
                onChange={(e) => setLimitations(e.target.value)}
                className={WORKSPACE_TEXTAREA}
              />
            ) : (
              <p className="text-xs sm:text-sm text-[#33463e] leading-relaxed whitespace-pre-line">
                {limitations || "No limitations specified."}
              </p>
            )}
          </div>

          {/* 5. Final Conclusion */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-mono text-xs font-black uppercase tracking-wider text-emerald-950">
                Final Conclusion
              </h3>
              <span className="font-mono text-[10px] font-bold text-emerald-900 bg-emerald-200/80 px-2 py-0.5 rounded-full">
                INTEGRATED CONCLUSION
              </span>
            </div>
            {isEditingSynthesis ? (
              <textarea
                rows={4}
                value={finalConclusion}
                onChange={(e) => setFinalConclusion(e.target.value)}
                className={WORKSPACE_TEXTAREA}
              />
            ) : (
              <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed whitespace-pre-line font-medium">
                {finalConclusion || "No final conclusion specified."}
              </p>
            )}
          </div>
        </div>
      </ResearchSection>

      {/* ========================================================
          03 · FINAL DOSSIER
          ✓ Stage 1
          ✓ Stage 2
          ✓ Stage 3
          ✓ Stage 4
          ✓ Research Synthesis

          Ready for Professional Review
          ======================================================== */}
      <ResearchSection
        id="dossier"
        icon={ShieldCheck}
        title="FINAL DOSSIER"
        subtitle="Verification checklist prior to submitting complete research dossier to Stage 6 Professional Review"
        badge={isReadyToFinalize || isStage5Complete ? "Dossier Ready" : "Pending Approvals"}
        action={
          <button
            type="button"
            onClick={() => setShowDossierModal(true)}
            className={WORKSPACE_SECONDARY_BTN}
          >
            <Eye className="w-3.5 h-3.5 text-emerald-700" />
            <span>Preview Dossier</span>
          </button>
        }
      >
        <div className="space-y-2.5">
          {[
            {
              label: "Stage 1: Plant & Literature Research",
              detail: `${stage1Evidence?.literatureCount || 0} Studies · Botanical profile and ethnomedicinal background`,
              isDone: readiness.isStage1Done,
            },
            {
              label: "Stage 2: In-Silico Analysis",
              detail: `${stage2InSilico?.results?.length || 0} Compounds screened with physicochemical and ADMET properties`,
              isDone: readiness.isStage2Done,
            },
            {
              label: "Stage 3: Molecular Docking",
              detail: `${stage3Docking?.runs?.length || 0} Target runs executed (AutoDock Vina predicted affinities)`,
              isDone: readiness.isStage3Done,
            },
            {
              label: "Stage 4: Formulation & Safety",
              detail: "Prototype extract defined & 5-area safety synthesis completed",
              isDone: readiness.isStage4Done,
            },
            {
              label: "Research Synthesis",
              detail: "Evidence alignment, key findings, scientific interpretation, limitations, and final conclusion approved",
              isDone: isSynthesisApproved,
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs transition-colors ${
                item.isDone
                  ? "bg-emerald-50/50 border-emerald-200 text-emerald-950"
                  : "bg-[#f7faf8] border-[#e2eae4] text-[#52645d]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    item.isDone ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {item.isDone ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <span className="font-bold text-sm text-[#0f2c20]">{item.label}</span>
                  <p className="text-[11px] text-[#697d72] mt-0.5">{item.detail}</p>
                </div>
              </div>
              <span
                className={`font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  item.isDone
                    ? "bg-emerald-100 text-emerald-950 border border-emerald-300"
                    : "bg-amber-100 text-amber-950 border border-amber-300"
                }`}
              >
                {item.isDone ? "COMPLETED" : "PENDING"}
              </span>
            </div>
          ))}
        </div>

        {/* Readiness Banner */}
        <div
          className={`p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            isReadyToFinalize || isStage5Complete
              ? "bg-emerald-50/80 border-emerald-300 text-emerald-950"
              : "bg-amber-50/80 border-amber-300 text-amber-950"
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle2
                className={`w-5 h-5 ${
                  isReadyToFinalize || isStage5Complete ? "text-emerald-700" : "text-amber-700"
                }`}
              />
              <h3 className="text-base font-black">
                {isReadyToFinalize || isStage5Complete
                  ? "Ready for Professional Review"
                  : "Approval Required Before Finalizing"}
              </h3>
            </div>
            <p className="text-xs mt-1 text-[#52645d] leading-relaxed">
              {isReadyToFinalize || isStage5Complete
                ? "All scientific prerequisites and Research Synthesis approvals are complete. Finalize Stage 5 to advance the project to Stage 6."
                : "Please review and approve the Research Synthesis above to unlock Stage 6 Professional Review."}
            </p>
          </div>

          <div className="shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold ${
                isReadyToFinalize || isStage5Complete
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-amber-100 text-amber-800 border border-amber-300"
              }`}
            >
              {isReadyToFinalize || isStage5Complete ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  Ready to Finalize
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                  Approval Required
                </>
              )}
            </span>
          </div>
        </div>
      </ResearchSection>

      <ResearchStageFooter
        projectId={projectId}
        stageNumber={5}
        stageTitle="Safety / Clinical"
        previousStageRoute={`/researcher/projects/${projectId}/formulation-safety`}
        backLabel="Back to Formulation Development"
        onSave={() => handleSaveDraft()}
        saveLabel="Save Draft"
        isSaving={saving}
        onContinue={handleFinalizeStage5}
        isContinuing={finalizing}
        continueLabel="Continue to Knowledge Integration"
        continuingLabel="Advancing to Knowledge Integration..."
        continueDisabled={(!isReadyToFinalize && !isStage5Complete) || finalizing}
      />

      {/* ========================================================
          PREVIEW DOSSIER MODAL
          ======================================================== */}
      <AnimatePresence>
        {showDossierModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#dde6df] overflow-hidden"
            >
              <div className="p-5 border-b border-[#e2eae4] flex items-center justify-between bg-[#f7faf8]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#0f2c20]">
                      Research Dossier Preview · Stages 1–5
                    </h3>
                    <p className="text-xs text-[#52645d]">
                      {project?.title} · {plantName} {scientificName && `(${scientificName})`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDossierModal(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#33463e]">
                {/* Evidence Summary Table */}
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-[#0f2c20] mb-2">
                    Multi-Stage Research Evidence (Stages 1–4)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200">
                      <div className="text-[10px] font-black text-teal-800">STAGE 1 · LITERATURE</div>
                      <div className="font-mono text-base font-black text-teal-950 mt-1">
                        {stage1Evidence?.literatureCount || 0}
                      </div>
                      <div className="text-[11px] text-teal-900/80">Supporting Studies</div>
                    </div>
                    <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200">
                      <div className="text-[10px] font-black text-indigo-800">STAGE 2 · IN-SILICO</div>
                      <div className="font-mono text-base font-black text-indigo-950 mt-1">
                        {stage2InSilico?.results?.length || 0}
                      </div>
                      <div className="text-[11px] text-indigo-900/80">Compounds Screened</div>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200">
                      <div className="text-[10px] font-black text-purple-800">STAGE 3 · DOCKING</div>
                      <div className="font-mono text-base font-black text-purple-950 mt-1">
                        {stage3Docking?.runs?.length || 0}
                      </div>
                      <div className="text-[11px] text-purple-900/80">Docking Runs (Vina)</div>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                      <div className="text-[10px] font-black text-amber-800">STAGE 4 · PROTOTYPE</div>
                      <div className="text-xs font-black text-amber-950 mt-1 truncate">
                        {stage4FormulationSafety?.formulation?.formulationName || "Extract"}
                      </div>
                      <div className="text-[11px] text-amber-900/80">Safety Synthesized</div>
                    </div>
                  </div>
                </div>

                {/* Approved Synthesis Sections */}
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-[#0f2c20] mb-2">
                    Approved Research Synthesis
                  </h4>
                  <div className="space-y-3 p-4 rounded-2xl bg-[#f7faf8] border border-[#e2eae4]">
                    <div>
                      <span className="font-bold text-[#0f2c20] text-xs">Evidence Alignment:</span>
                      <p className="mt-0.5 leading-relaxed">{evidenceAlignment}</p>
                    </div>
                    <div>
                      <span className="font-bold text-[#0f2c20] text-xs">Key Findings:</span>
                      <ul className="mt-1 space-y-1 list-disc list-inside">
                        {keyFindings.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="font-bold text-[#0f2c20] text-xs">Scientific Interpretation:</span>
                      <p className="mt-0.5 leading-relaxed">{scientificInterpretation}</p>
                    </div>
                    <div>
                      <span className="font-bold text-[#0f2c20] text-xs">Limitations:</span>
                      <p className="mt-0.5 leading-relaxed whitespace-pre-line">{limitations}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                      <span className="font-bold text-xs">Final Conclusion:</span>
                      <p className="mt-0.5 leading-relaxed font-medium">{finalConclusion}</p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 text-xs leading-relaxed">
                  <span className="font-bold">Next Stage: Stage 6 — Final Professional Review. </span>
                  Upon finalizing Stage 5, this dossier snapshot is submitted for peer professional evaluation.
                </div>
              </div>

              <div className="p-4 border-t border-[#e2eae4] flex items-center justify-between bg-[#f7faf8]">
                <button
                  type="button"
                  onClick={() => setShowDossierModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-700 hover:text-gray-900"
                >
                  Close Preview
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDossierModal(false);
                    handleFinalizeStage5();
                  }}
                  disabled={!isReadyToFinalize && !isStage5Complete}
                  className={WORKSPACE_PRIMARY_BTN}
                >
                  <span>Finalize & Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
