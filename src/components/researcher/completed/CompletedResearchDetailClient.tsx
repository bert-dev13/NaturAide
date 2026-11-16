"use client";

import React, { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Calendar,
  Leaf,
  FileText,
  Download,
  Eye,
  Cpu,
  History,
  Lock,
  UserCheck,
  ShieldCheck,
  FlaskConical,
  Beaker,
  BookOpen,
  ClipboardList,
  ChevronRight,
  LayoutDashboard,
  BadgeCheck,
  FolderOpen,
  Microscope,
  Tag,
  Sparkles,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import type { CompletedResearchDetail } from "@/lib/research-approval-completion-service";
import { parseCompiledSections } from "@/lib/research-summary-utils";

interface Props {
  detail: CompletedResearchDetail;
}

type DossierTab = "overview" | "review" | "documents" | "summary";

const TABS: Array<{
  id: DossierTab;
  label: string;
  short: string;
  icon: LucideIcon;
}> = [
  { id: "overview", label: "Overview", short: "Overview", icon: LayoutDashboard },
  { id: "review", label: "Professional Review", short: "Review", icon: BadgeCheck },
  { id: "documents", label: "Research Documents", short: "Documents", icon: FolderOpen },
  { id: "summary", label: "Saved Research Summary", short: "Summary", icon: ClipboardList },
];

const SUMMARY_SECTION_META: Record<
  string,
  { title: string; icon: LucideIcon; chip: string; border: string }
> = {
  "1": {
    title: "Botanical & Extraction Information",
    icon: Leaf,
    chip: "bg-emerald-100 text-emerald-900 border-emerald-200",
    border: "border-l-emerald-500",
  },
  "2": {
    title: "Formulation Development",
    icon: FlaskConical,
    chip: "bg-teal-100 text-teal-900 border-teal-200",
    border: "border-l-teal-500",
  },
  "3": {
    title: "Batch Analysis & Quality Control Findings",
    icon: Beaker,
    chip: "bg-lime-100 text-lime-900 border-lime-200",
    border: "border-l-lime-500",
  },
  "4": {
    title: "In-Silico Phytochemical Screening",
    icon: Microscope,
    chip: "bg-sky-100 text-sky-900 border-sky-200",
    border: "border-l-sky-500",
  },
  "5": {
    title: "Molecular Docking Results",
    icon: Cpu,
    chip: "bg-cyan-100 text-cyan-950 border-cyan-200",
    border: "border-l-cyan-600",
  },
  "6": {
    title: "Computational Findings & Target Binding Synthesis",
    icon: Sparkles,
    chip: "bg-emerald-100 text-emerald-950 border-emerald-200",
    border: "border-l-emerald-700",
  },
  "7": {
    title: "Computational Limitations & In-Vitro Verification Requirements",
    icon: AlertTriangle,
    chip: "bg-amber-100 text-amber-950 border-amber-200",
    border: "border-l-amber-500",
  },
};

const SPECIALTY_ACCENTS = [
  {
    icon: FlaskConical,
    bar: "bg-emerald-500",
    iconWrap: "bg-emerald-100 text-emerald-800 border-emerald-200",
    soft: "bg-gradient-to-br from-emerald-50 to-white",
  },
  {
    icon: Cpu,
    bar: "bg-teal-500",
    iconWrap: "bg-teal-100 text-teal-800 border-teal-200",
    soft: "bg-gradient-to-br from-teal-50 to-white",
  },
  {
    icon: Microscope,
    bar: "bg-sky-500",
    iconWrap: "bg-sky-100 text-sky-800 border-sky-200",
    soft: "bg-gradient-to-br from-sky-50 to-white",
  },
];

function parseTab(raw: string | null): DossierTab {
  if (raw === "review" || raw === "documents" || raw === "summary" || raw === "overview") {
    return raw;
  }
  return "overview";
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

function sectionTitleFromBlock(key: string, block: string) {
  const firstLine = block.split("\n")[0] || "";
  const cleaned = firstLine.replace(/^\d+\.\s*/, "").trim();
  return cleaned || SUMMARY_SECTION_META[key]?.title || `Section ${key}`;
}

function sectionBodyFromBlock(block: string) {
  return block.split("\n").slice(1).join("\n").trim();
}

type ParsedLine =
  | { kind: "kv"; label: string; value: string }
  | { kind: "list"; items: string[] }
  | { kind: "para"; text: string }
  | { kind: "heading"; text: string };

function parseSummaryLines(text: string): ParsedLine[] {
  const lines = text.split("\n");
  const result: ParsedLine[] = [];
  let listBuffer: string[] = [];

  const flushList = () => {
    if (!listBuffer.length) return;
    result.push({ kind: "list", items: [...listBuffer] });
    listBuffer = [];
  };

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) {
      flushList();
      continue;
    }

    const dash = trimmed.match(/^[-•]\s+(.*)$/);
    const numbered = trimmed.match(/^\d+\.\s+(.*)$/);
    if (dash) {
      listBuffer.push(dash[1]);
      continue;
    }
    if (numbered && /docked|kcal|bound|—|constituent|agent|humectant|vehicle/i.test(trimmed)) {
      listBuffer.push(numbered[1]);
      continue;
    }

    flushList();

    if (/^(Formulation Composition|Leading Ligand|Selected Phytochemicals)/i.test(trimmed) && trimmed.endsWith(":")) {
      result.push({ kind: "heading", text: trimmed.replace(/:$/, "") });
      continue;
    }

    const kv = trimmed.match(/^([^:]{2,56}):\s*(.+)$/);
    if (kv) {
      result.push({ kind: "kv", label: kv[1], value: kv[2] });
      continue;
    }

    result.push({ kind: "para", text: trimmed });
  }

  flushList();
  return result;
}

function parseIngredientItem(item: string) {
  const m = item.match(/^(.+?)\s*\(([^)]+)\)\s*[—\-–]\s*(.+)$/);
  if (m) return { name: m[1].trim(), amount: m[2].trim(), role: m[3].trim() };
  const m2 = item.match(/^(.+?)\s*[—\-–]\s*(.+)$/);
  if (m2) return { name: m2[1].trim(), amount: "", role: m2[2].trim() };
  return { name: item, amount: "", role: "" };
}

function parseDockingItem(item: string) {
  const m = item.match(
    /^(.+?)\s+docked to\s+(.+?)\s*\(PDB:\s*([^)]+)\)\s*[—\-–]\s*Predicted Binding Affinity:\s*(.+)$/i
  );
  if (m) {
    return { ligand: m[1].trim(), target: m[2].trim(), pdb: m[3].trim(), affinity: m[4].trim() };
  }
  return null;
}

function SummaryBody({ text, sectionKey }: { text: string; sectionKey: string }) {
  const blocks = useMemo(() => parseSummaryLines(text), [text]);

  if (!text.trim()) {
    return <p className="text-sm text-slate-500">No content recorded for this section.</p>;
  }

  const nodes: React.ReactNode[] = [];

  blocks.forEach((block, idx) => {
    if (block.kind === "kv") {
      nodes.push(
        <div
          key={`kv-${idx}`}
          className="grid gap-1 rounded-lg bg-white px-3 py-2.5 sm:grid-cols-[11.5rem_1fr] sm:gap-4"
        >
          <dt className="text-[11px] font-bold uppercase tracking-[0.06em] text-emerald-800">
            {block.label}
          </dt>
          <dd className="text-sm font-medium leading-relaxed text-slate-900">{block.value}</dd>
        </div>
      );
      return;
    }

    if (block.kind === "heading") {
      nodes.push(
        <p
          key={`h-${idx}`}
          className="mt-3 mb-1 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500"
        >
          {block.text}
        </p>
      );
      return;
    }

    if (block.kind === "list") {
      const dockingRows = block.items.map(parseDockingItem);
      const allDocking = dockingRows.every(Boolean);
      const looksLikeIngredients =
        sectionKey === "2" ||
        block.items.some((i) => /%|constituent|agent|humectant|vehicle|extract/i.test(i));

      if (allDocking) {
        nodes.push(
          <div key={`dock-${idx}`} className="mt-1 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[34rem] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="px-3 py-2 font-bold">Ligand</th>
                  <th className="px-3 py-2 font-bold">Target</th>
                  <th className="px-3 py-2 font-bold">PDB</th>
                  <th className="px-3 py-2 font-bold">Affinity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {dockingRows.map((row, i) =>
                  row ? (
                    <tr key={i}>
                      <td className="px-3 py-2 font-semibold text-slate-900">{row.ligand}</td>
                      <td className="px-3 py-2 text-slate-800">{row.target}</td>
                      <td className="px-3 py-2 font-mono text-slate-600">{row.pdb}</td>
                      <td className="px-3 py-2 font-mono font-bold text-emerald-800">
                        {row.affinity}
                      </td>
                    </tr>
                  ) : null
                )}
              </tbody>
            </table>
          </div>
        );
        return;
      }

      if (looksLikeIngredients) {
        const rows = block.items.map(parseIngredientItem);
        nodes.push(
          <div key={`ing-${idx}`} className="mt-1 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[28rem] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="px-3 py-2 font-bold">Ingredient</th>
                  <th className="px-3 py-2 font-bold">Amount</th>
                  <th className="px-3 py-2 font-bold">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rows.map((row, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-semibold text-slate-900">{row.name}</td>
                    <td className="px-3 py-2 font-mono text-slate-700">{row.amount || "—"}</td>
                    <td className="px-3 py-2 text-slate-700">{row.role || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        return;
      }

      nodes.push(
        <ul key={`list-${idx}`} className="mt-1 space-y-2">
          {block.items.map((item, i) => (
            <li
              key={i}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed text-slate-800"
            >
              {item}
            </li>
          ))}
        </ul>
      );
      return;
    }

    nodes.push(
      <p key={`p-${idx}`} className="text-sm leading-relaxed text-slate-800">
        {block.text}
      </p>
    );
  });

  // Group consecutive kv rows into one definition card
  const grouped: React.ReactNode[] = [];
  let kvGroup: React.ReactNode[] = [];
  const flushKv = (key: string) => {
    if (!kvGroup.length) return;
    grouped.push(
      <dl key={key} className="grid gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 p-2">
        {kvGroup}
      </dl>
    );
    kvGroup = [];
  };

  nodes.forEach((node, i) => {
    const isKv =
      React.isValidElement(node) &&
      typeof node.key === "string" &&
      String(node.key).startsWith("kv-");
    if (isKv) {
      kvGroup.push(node);
    } else {
      flushKv(`kvg-${i}`);
      grouped.push(node);
    }
  });
  flushKv("kvg-end");

  return <div className="space-y-3">{grouped}</div>;
}

export default function CompletedResearchDetailClient({ detail }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = parseTab(searchParams.get("tab"));

  const [docPanel, setDocPanel] = useState<"computational" | "history" | null>(null);

  const setTab = useCallback(
    (tab: DossierTab) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === "overview") params.delete("tab");
      else params.set("tab", tab);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      if (tab !== "documents") setDocPanel(null);
    },
    [pathname, router, searchParams]
  );

  const manuscriptViewUrl = `/api/researcher/projects/${detail.projectId}/manuscript/file`;
  const manuscriptDownloadUrl = `/api/researcher/projects/${detail.projectId}/manuscript/file?download=1`;

  const showScientificName =
    detail.scientificName &&
    !detail.plantName.toLowerCase().includes(detail.scientificName.toLowerCase());

  const summarySections = useMemo(() => {
    const parsed = parseCompiledSections(detail.executiveSummary || "");
    const keys = Object.keys(parsed).sort((a, b) => Number(a) - Number(b));
    if (keys.length === 0 && detail.executiveSummary?.trim()) {
      return [
        {
          key: "0",
          title: "Saved Research Summary",
          body: detail.executiveSummary.trim(),
        },
      ];
    }
    return keys.map((key) => ({
      key,
      title: sectionTitleFromBlock(key, parsed[key]),
      body: sectionBodyFromBlock(parsed[key]),
    }));
  }, [detail.executiveSummary]);

  const approvalCountLabel = `${detail.approvalState.approvedCount} of ${detail.approvalState.totalSpecialties} Approved`;

  const docItems = [
    {
      label: "Research Summary",
      ready: Boolean(detail.executiveSummary?.trim()),
      icon: FileText,
      tone: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
    {
      label: "Research Paper Manuscript",
      ready: Boolean(detail.manuscript?.hasFile),
      icon: BookOpen,
      tone: "bg-teal-100 text-teal-800 border-teal-200",
    },
    {
      label: "Computational Results",
      ready:
        detail.computationalResults.dockingCount > 0 ||
        detail.computationalResults.screeningCount > 0,
      icon: Cpu,
      tone: "bg-sky-100 text-sky-800 border-sky-200",
    },
    {
      label: "Professional Review History",
      ready: detail.approvalState.submissionHistory.length > 0,
      icon: History,
      tone: "bg-amber-100 text-amber-900 border-amber-200",
    },
  ];

  return (
    <div className="w-full min-w-0 max-w-none space-y-4 overflow-x-hidden pb-16 text-slate-900">
      {/* Compact dossier header */}
      <header className="w-full min-w-0 overflow-hidden rounded-2xl border border-[#0f2c20]/15 bg-white shadow-sm">
        <div className="bg-[linear-gradient(120deg,#0b2419_0%,#0f2c20_55%,#14532d_100%)] px-4 py-3.5 text-white sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link
              href="/researcher/completed"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-100/90 transition hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Archive
            </Link>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/35 bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-100">
                <ShieldCheck className="h-3 w-3" />
                Verified
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-100">
                <Lock className="h-3 w-3" />
                {detail.approvedVersionTag}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-50">
                <CheckCircle2 className="h-3 w-3" />
                {approvalCountLabel}
              </span>
            </div>
          </div>

          <div className="mt-2.5 min-w-0">
            <p className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300">
              <Award className="h-3.5 w-3.5" />
              Completed Dossier
            </p>
            <h1 className="mt-1 break-words text-lg font-bold tracking-tight text-white sm:text-xl">
              {detail.title}
            </h1>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-white/10 bg-white/10 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-200/80">
                Medicinal plant
              </p>
              <p className="mt-0.5 truncate text-xs font-semibold text-white">
                {detail.plantName}
                {showScientificName ? (
                  <span className="font-normal italic text-emerald-100/80">
                    {" "}
                    ({detail.scientificName})
                  </span>
                ) : null}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/10 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-200/80">
                Research category
              </p>
              <p className="mt-0.5 truncate text-xs font-semibold text-white">
                {detail.targetCondition || "—"}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/10 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-200/80">
                Dosage form
              </p>
              <p className="mt-0.5 truncate text-xs font-semibold text-white">
                {detail.dosageForm || "—"}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/10 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-200/80">
                Completed
              </p>
              <p className="mt-0.5 truncate text-xs font-semibold text-white" suppressHydrationWarning>
                {formatDate(detail.completedAt)}
              </p>
            </div>
          </div>
        </div>

        <nav
          aria-label="Dossier sections"
          className="overflow-x-auto border-t border-slate-200 bg-slate-50/80 px-2 scrollbar-none sm:px-3"
        >
          <div className="flex min-w-0 items-stretch gap-0.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTab(tab.id)}
                  className={`relative inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-3 text-xs font-semibold transition sm:px-3.5 sm:text-[13px] ${
                    isActive
                      ? "text-emerald-900"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? "text-emerald-700" : "text-slate-400"}`} />
                  <span className="sm:hidden">{tab.short}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  {isActive ? (
                    <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-emerald-600" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      <div key={activeTab} className="w-full min-w-0">
        {activeTab === "overview" && (
          <div className="grid w-full min-w-0 gap-4 lg:grid-cols-[1.35fr_1fr]">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800">
                  <LayoutDashboard className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Project overview</h2>
                  <p className="text-xs text-slate-500">Verified research identity and approval status</p>
                </div>
              </div>

              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  {
                    label: "Research title",
                    icon: FileText,
                    value: detail.title,
                    tone: "border-emerald-100 bg-emerald-50/50",
                  },
                  {
                    label: "Medicinal plant",
                    icon: Leaf,
                    value: detail.plantName,
                    sub: showScientificName ? detail.scientificName : null,
                    tone: "border-teal-100 bg-teal-50/50",
                  },
                  {
                    label: "Research category",
                    icon: Tag,
                    value: detail.targetCondition || detail.dosageForm || "—",
                    tone: "border-lime-100 bg-lime-50/50",
                  },
                  {
                    label: "Verification",
                    icon: ShieldCheck,
                    value: `Verified · ${detail.approvedVersionTag}`,
                    highlight: true,
                    tone: "border-emerald-200 bg-emerald-50",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className={`min-w-0 rounded-xl border p-3.5 ${item.tone}`}>
                      <dt className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600">
                        <Icon className="h-3.5 w-3.5 text-emerald-700" />
                        {item.label}
                      </dt>
                      <dd
                        className={`mt-1.5 break-words text-sm font-semibold leading-snug ${
                          item.highlight ? "text-emerald-900" : "text-slate-900"
                        }`}
                      >
                        {item.value}
                        {item.sub ? (
                          <span className="mt-0.5 block text-xs font-medium italic text-slate-600">
                            {item.sub}
                          </span>
                        ) : null}
                      </dd>
                    </div>
                  );
                })}
              </dl>

              <div className="mt-4 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white">
                      <BadgeCheck className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.1em] text-emerald-900">
                        Professional Review
                      </p>
                      <p className="mt-0.5 text-sm text-emerald-900/80">
                        Multidisciplinary approval across all review specialties.
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-900">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    {approvalCountLabel}
                  </span>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-teal-200 bg-teal-50 text-teal-800">
                    <FolderOpen className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Document availability</h2>
                    <p className="text-xs text-slate-500">Locked archive assets</p>
                  </div>
                </div>
                <ul className="mt-3 space-y-2">
                  {docItems.map((doc) => {
                    const Icon = doc.icon;
                    return (
                      <li
                        key={doc.label}
                        className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5"
                      >
                        <span className="inline-flex min-w-0 items-center gap-2.5 text-sm font-semibold text-slate-800">
                          <span
                            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${doc.tone}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="truncate">{doc.label}</span>
                        </span>
                        <span
                          className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            doc.ready
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          {doc.ready ? "Available" : "Missing"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-lime-200 bg-lime-50 text-lime-800">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Quick navigation</h2>
                    <p className="text-xs text-slate-500">Jump to dossier sections</p>
                  </div>
                </div>
                <div className="mt-3 grid gap-2">
                  {TABS.filter((t) => t.id !== "overview").map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setTab(tab.id)}
                        className="group inline-flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-sm font-semibold text-slate-900 transition hover:border-emerald-300 hover:bg-emerald-50"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Icon className="h-4 w-4 text-emerald-700" />
                          {tab.label}
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-700" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === "review" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-white">
                  <BadgeCheck className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Professional Review</h2>
                  <p className="text-xs text-slate-500">
                    Multidisciplinary approval records for this completed dossier.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-900">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                {approvalCountLabel}
              </span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {detail.approvalState.specialties.map((spec, idx) => {
                const accent = SPECIALTY_ACCENTS[idx % SPECIALTY_ACCENTS.length];
                const Icon = accent.icon;
                return (
                  <article
                    key={spec.areaKey}
                    className={`relative min-w-0 overflow-hidden rounded-xl border border-slate-200 ${accent.soft} p-4`}
                  >
                    <div className={`absolute inset-y-0 left-0 w-1 ${accent.bar}`} />
                    <div className="flex items-start justify-between gap-2 pl-1">
                      <span
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${accent.iconWrap}`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        {spec.status}
                      </span>
                    </div>
                    <p className="mt-3 font-mono text-[10px] font-bold tracking-wider text-slate-500">
                      ROLE {spec.code}
                    </p>
                    <h3 className="mt-1 text-sm font-bold leading-snug text-slate-900">
                      {spec.specialty}
                    </h3>
                    <p className="mt-2 inline-flex items-start gap-1.5 text-xs font-medium text-slate-700">
                      <UserCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" />
                      <span>{spec.roleTitle}</span>
                    </p>
                    <p
                      className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-white/80 px-2 py-1 text-[11px] font-semibold text-slate-600"
                      suppressHydrationWarning
                    >
                      <Calendar className="h-3 w-3 text-emerald-600" />
                      Approved {formatDate(spec.decisionDate)}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === "documents" && (
          <div className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-teal-700 text-white">
                  <FolderOpen className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Research Documents</h2>
                  <p className="text-xs text-slate-500">
                    Open, download, or inspect locked records from this verified project.
                  </p>
                </div>
              </div>

              <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                <div className="flex flex-col gap-3 bg-gradient-to-r from-emerald-50/80 to-white p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-100 text-emerald-800">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">Research Summary</p>
                      <p className="truncate text-xs text-slate-600">
                        Complete executive research synthesis ({detail.approvedVersionTag})
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTab("summary")}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-900 hover:bg-emerald-50"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View Summary
                  </button>
                </div>

                <div className="flex flex-col gap-3 bg-gradient-to-r from-teal-50/80 to-white p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-200 bg-teal-100 text-teal-800">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">Research Paper Manuscript</p>
                      <p className="truncate text-xs text-slate-600">
                        {detail.manuscript?.fileName || "Approved research manuscript"}
                      </p>
                    </div>
                  </div>
                  {detail.manuscript?.hasFile ? (
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <a
                        href={manuscriptViewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-teal-300 bg-white px-3 py-2 text-xs font-bold text-teal-900 hover:bg-teal-50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </a>
                      <a
                        href={manuscriptDownloadUrl}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </a>
                    </div>
                  ) : (
                    <span className="text-xs italic text-slate-400">No file attached</span>
                  )}
                </div>

                <div className="flex flex-col gap-3 bg-gradient-to-r from-sky-50/80 to-white p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-200 bg-sky-100 text-sky-800">
                      <Cpu className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">Computational Results</p>
                      <p className="truncate text-xs text-slate-600">
                        {detail.computationalResults.phytochemicalsCount} phytochemicals ·{" "}
                        {detail.computationalResults.dockingCount} completed docking runs
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setDocPanel((prev) => (prev === "computational" ? null : "computational"))
                    }
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-sky-300 bg-white px-3 py-2 text-xs font-bold text-sky-900 hover:bg-sky-50"
                  >
                    <Cpu className="h-3.5 w-3.5" />
                    {docPanel === "computational" ? "Hide Results" : "View Results"}
                  </button>
                </div>

                <div className="flex flex-col gap-3 bg-gradient-to-r from-amber-50/80 to-white p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-100 text-amber-900">
                      <History className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">
                        Professional Review History
                      </p>
                      <p className="truncate text-xs text-slate-600">
                        {detail.approvalState.submissionHistory.length} submission{" "}
                        {detail.approvalState.submissionHistory.length === 1
                          ? "version"
                          : "versions"}{" "}
                        &amp; reviewer decisions
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setDocPanel((prev) => (prev === "history" ? null : "history"))
                    }
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-950 hover:bg-amber-50"
                  >
                    <History className="h-3.5 w-3.5" />
                    {docPanel === "history" ? "Hide History" : "View History"}
                  </button>
                </div>
              </div>
            </section>

            {docPanel === "computational" && (
              <section className="space-y-5 rounded-2xl border border-sky-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <h3 className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Microscope className="h-4 w-4 text-sky-700" />
                    In-Silico Screening &amp; Molecular Docking
                  </h3>
                  <span className="rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-900">
                    {detail.computationalResults.phytochemicalsCount} compounds ·{" "}
                    {detail.computationalResults.dockingCount} docking runs
                  </span>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-600">
                    Selected Phytochemicals &amp; Lipinski Screening
                  </h4>
                  {detail.computationalResults.screenings.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full min-w-[36rem] border-collapse text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                            <th className="px-3 py-2.5 font-bold">Compound</th>
                            <th className="px-3 py-2.5 font-bold">MW</th>
                            <th className="px-3 py-2.5 font-bold">LogP</th>
                            <th className="px-3 py-2.5 font-bold">TPSA</th>
                            <th className="px-3 py-2.5 font-bold">Lipinski</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {detail.computationalResults.screenings.map((s) => (
                            <tr key={s.id}>
                              <td className="px-3 py-2.5 font-semibold text-slate-900">
                                {s.compoundName}
                              </td>
                              <td className="px-3 py-2.5 font-mono text-slate-700">
                                {s.molecularWeight ?? "—"}
                              </td>
                              <td className="px-3 py-2.5 font-mono text-slate-700">
                                {s.logP ?? "—"}
                              </td>
                              <td className="px-3 py-2.5 font-mono text-slate-700">
                                {s.tpsa ?? "—"}
                              </td>
                              <td className="px-3 py-2.5">
                                <span
                                  className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                                    s.passedLipinski
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-amber-100 text-amber-900"
                                  }`}
                                >
                                  {s.passedLipinski ? "Pass" : "Violation"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {detail.computationalResults.phytochemicals.map((p) => (
                        <span
                          key={p.id}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-900"
                        >
                          {p.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-600">
                    Top Molecular Docking Complexes
                  </h4>
                  {detail.computationalResults.dockingResults.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full min-w-[36rem] border-collapse text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                            <th className="px-3 py-2.5 font-bold">Ligand</th>
                            <th className="px-3 py-2.5 font-bold">Target Protein</th>
                            <th className="px-3 py-2.5 font-bold">PDB ID</th>
                            <th className="px-3 py-2.5 font-bold">Affinity</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {detail.computationalResults.dockingResults.slice(0, 15).map((d) => (
                            <tr key={d.id}>
                              <td className="px-3 py-2.5 font-semibold text-slate-900">
                                {d.ligandName}
                              </td>
                              <td className="px-3 py-2.5 text-slate-800">{d.targetName}</td>
                              <td className="px-3 py-2.5 font-mono text-slate-700">
                                {d.pdbId || "—"}
                              </td>
                              <td className="px-3 py-2.5 font-mono font-bold text-emerald-800">
                                {d.bindingAffinity !== null
                                  ? `${d.bindingAffinity} kcal/mol`
                                  : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No docking runs recorded.</p>
                  )}
                </div>
              </section>
            )}

            {docPanel === "history" && (
              <section className="space-y-4 rounded-2xl border border-amber-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <h3 className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
                    <History className="h-4 w-4 text-amber-700" />
                    Professional Review &amp; Submission History
                  </h3>
                  <span className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-950">
                    {detail.approvalState.submissionHistory.length}{" "}
                    {detail.approvalState.submissionHistory.length === 1 ? "version" : "versions"}
                  </span>
                </div>

                <div className="space-y-3">
                  {detail.approvalState.submissionHistory.map((sub) => (
                    <div
                      key={sub.submissionId}
                      className="rounded-xl border border-amber-100 bg-amber-50/40 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-900">
                            {sub.versionTag}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            Round {sub.versionNumber}
                          </span>
                          <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-900">
                            {sub.status}
                          </span>
                        </div>
                        {sub.submittedAt ? (
                          <span
                            suppressHydrationWarning
                            className="font-mono text-[11px] font-semibold text-slate-600"
                          >
                            Submitted {formatDate(sub.submittedAt)}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white px-3">
                        {sub.specialties.map((sp) => (
                          <div key={sp.areaKey} className="space-y-1 py-2.5 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex min-w-0 items-center gap-2">
                                <span className="font-mono font-bold text-slate-400">{sp.code}</span>
                                <span className="font-bold text-slate-900">{sp.specialty}</span>
                              </div>
                              <span
                                className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                                  sp.status === "Approved"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : sp.status === "Revision Required"
                                      ? "bg-rose-100 text-rose-800"
                                      : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {sp.status}
                              </span>
                            </div>
                            {sp.comments ? (
                              <p className="pl-6 text-slate-600">&ldquo;{sp.comments}&rdquo;</p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab === "summary" && (
          <section className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-white">
                    <ClipboardList className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Saved Research Summary</h2>
                    <p className="text-xs text-slate-500">
                      Locked dossier · {detail.approvedVersionTag} · 7 structured sections
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700">
                  <Lock className="h-3 w-3" />
                  Read-only
                </span>
              </div>

              {summarySections.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                  No executive research summary recorded.
                </div>
              ) : (
                <div className="space-y-3">
                  {summarySections.map((section, index) => {
                    const meta =
                      SUMMARY_SECTION_META[section.key] ||
                      SUMMARY_SECTION_META[String(index + 1)];
                    const Icon = meta?.icon || FileText;
                    const chip = meta?.chip || "bg-emerald-100 text-emerald-900 border-emerald-200";
                    const border = meta?.border || "border-l-emerald-500";
                    return (
                      <article
                        key={section.key}
                        className={`rounded-2xl border border-slate-200 border-l-4 bg-white shadow-sm ${border}`}
                      >
                        <div className="flex items-start gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
                          <span
                            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${chip}`}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                              Section {String(index + 1).padStart(2, "0")}
                            </p>
                            <h3 className="text-sm font-bold leading-snug text-slate-900 sm:text-[15px]">
                              {section.title}
                            </h3>
                          </div>
                        </div>
                        <div className="px-4 py-4 sm:px-5">
                          <SummaryBody text={section.body} sectionKey={section.key} />
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
          </section>
        )}
      </div>
    </div>
  );
}
