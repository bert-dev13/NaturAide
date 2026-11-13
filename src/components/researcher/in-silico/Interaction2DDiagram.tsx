"use client";

import React, { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { ProteinLigandInteraction } from "@/lib/interaction-analysis-service";

interface Props {
  ligandName: string;
  proteinName: string;
  pdbId: string;
  bindingAffinity?: number | null;
  interactions: ProteinLigandInteraction[] | any[];
  /** Max unique residues to draw (keeps the map readable) */
  maxNodes?: number;
  typeFilter?: "ALL" | "HBond" | "Hydrophobic" | "Salt";
}

function normalize(item: any): ProteinLigandInteraction {
  const resName = item.resName || item.residueName || "";
  const resSeq = item.resSeq ?? item.residueSeq ?? "";
  const distance =
    item.distanceAngstroms ??
    (item.distance != null ? Number(item.distance) : 0);
  return {
    residue: item.residue || `${resName} ${resSeq}`.trim(),
    resName,
    resSeq: Number(resSeq) || 0,
    chain: item.chain || "A",
    interactionType: item.interactionType || "Van der Waals",
    distanceAngstroms: Number(distance) || 0,
    proteinAtom: item.proteinAtom || item.atomName || "—",
    ligandAtom: item.ligandAtom || "—",
  } as ProteinLigandInteraction;
}

function typeKey(t: string) {
  const s = (t || "").toLowerCase();
  if (s.includes("hydrogen") || s.includes("h-bond")) return "HBond";
  if (s.includes("hydrophobic")) return "Hydrophobic";
  if (s.includes("salt") || s.includes("ionic")) return "Salt";
  return "Other";
}

function typeColor(t: string) {
  const k = typeKey(t);
  if (k === "HBond") return { stroke: "#34d399", dash: "none", label: "Hydrogen Bond" };
  if (k === "Hydrophobic") return { stroke: "#fbbf24", dash: "5 4", label: "Hydrophobic" };
  if (k === "Salt") return { stroke: "#a5b4fc", dash: "2 2", label: "Salt Bridge" };
  return { stroke: "#94a3b8", dash: "3 3", label: "Other Contact" };
}

/**
 * Pick a readable set of unique residues: closest contact per residue,
 * prefer H-bonds / salt bridges, then by distance.
 */
function selectDiagramNodes(
  items: ProteinLigandInteraction[],
  maxNodes: number,
  typeFilter: Props["typeFilter"]
) {
  let list = items.map(normalize).filter((i) => i.resName && i.distanceAngstroms > 0);

  if (typeFilter && typeFilter !== "ALL") {
    list = list.filter((i) => typeKey(i.interactionType) === typeFilter);
  }

  const byRes = new Map<string, ProteinLigandInteraction>();
  for (const i of list) {
    const key = `${i.resName}${i.resSeq}`;
    const existing = byRes.get(key);
    if (!existing || i.distanceAngstroms < existing.distanceAngstroms) {
      byRes.set(key, i);
    }
  }

  const priority = (t: string) => {
    const k = typeKey(t);
    if (k === "HBond") return 0;
    if (k === "Salt") return 1;
    if (k === "Hydrophobic") return 2;
    return 3;
  };

  return Array.from(byRes.values())
    .sort((a, b) => {
      const p = priority(a.interactionType) - priority(b.interactionType);
      if (p !== 0) return p;
      return a.distanceAngstroms - b.distanceAngstroms;
    })
    .slice(0, maxNodes);
}

export default function Interaction2DDiagram({
  ligandName,
  pdbId,
  bindingAffinity,
  interactions,
  maxNodes = 14,
  typeFilter = "ALL",
}: Props) {
  const reduceMotion = Boolean(useReducedMotion());
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const nodes = useMemo(
    () => selectDiagramNodes(interactions as any[], maxNodes, typeFilter),
    [interactions, maxNodes, typeFilter]
  );

  const diagramData = useMemo(() => {
    const total = Math.max(nodes.length, 1);
    // Expand radius when many residues so labels do not collide
    const radius = nodes.length > 10 ? 168 : nodes.length > 6 ? 152 : 140;
    const cx = 240;
    const cy = 220;
    return nodes.map((item, index) => {
      const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
      const { stroke, dash } = typeColor(item.interactionType);
      return {
        ...item,
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
        stroke,
        dash,
      };
    });
  }, [nodes]);

  const shortLigand =
    ligandName.length > 18 ? `${ligandName.slice(0, 16)}…` : ligandName;

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Do not steal page scroll. Zoom only with Ctrl/Cmd+wheel (or free scroll in fullscreen).
  const onWheel = (e: React.WheelEvent) => {
    const intentionalZoom = isFullscreen || e.ctrlKey || e.metaKey;
    if (!intentionalZoom) return;
    e.preventDefault();
    if (reduceMotion) return;
    setZoom((z) => Math.min(2.4, Math.max(0.6, z - e.deltaY * 0.0015)));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !dragStart.current) return;
    setPan({
      x: dragStart.current.panX + (e.clientX - dragStart.current.x),
      y: dragStart.current.panY + (e.clientY - dragStart.current.y),
    });
  };

  const onPointerUp = () => {
    setDragging(false);
    dragStart.current = null;
  };

  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullscreen]);

  const mapBody = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2.5 sm:px-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">
            {shortLigand}{" "}
            <span className="font-mono text-emerald-300">→ {pdbId}</span>
          </p>
          <p className="text-[11px] text-emerald-100/55">
            {nodes.length === 1
              ? "Top 1 residue contact"
              : `Top ${nodes.length} residue contacts`}
            {typeFilter !== "ALL" ? " · filtered" : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {bindingAffinity != null && (
            <span className="rounded-lg border border-emerald-700/50 bg-emerald-950/80 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-300">
              {Number(bindingAffinity).toFixed(2)} kcal/mol
            </span>
          )}
          <div className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-black/25 p-0.5">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.4, z + 0.15))}
              className="rounded-md p-1.5 text-emerald-100/80 hover:bg-white/10 hover:text-white"
              title="Zoom in"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
              className="rounded-md p-1.5 text-emerald-100/80 hover:bg-white/10 hover:text-white"
              title="Zoom out"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={resetView}
              className="rounded-md p-1.5 text-emerald-100/80 hover:bg-white/10 hover:text-white"
              title="Reset view"
              aria-label="Reset view"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen((v) => !v)}
              className="rounded-md p-1.5 text-emerald-100/80 hover:bg-white/10 hover:text-white"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        className={`relative overflow-hidden ${isFullscreen ? "flex-1" : "min-h-[28rem] sm:min-h-[32rem]"}`}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ cursor: dragging ? "grabbing" : "grab" }}
      >
        <motion.div
          className="flex h-full min-h-[28rem] items-center justify-center p-2 sm:min-h-[32rem] sm:p-4"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: reduceMotion || dragging ? "none" : "transform 0.15s ease-out",
          }}
        >
          <svg
            viewBox="0 0 480 440"
            className={`h-auto w-full ${isFullscreen ? "max-h-[calc(100vh-8rem)] max-w-5xl" : "max-w-3xl"}`}
            role="img"
            aria-label={`2D interaction map for ${ligandName} with ${pdbId}`}
          >
            <circle
              cx="240"
              cy="220"
              r="52"
              fill="#047857"
              fillOpacity="0.35"
              stroke="#34d399"
              strokeWidth="2.5"
            />
            <text
              x="240"
              y="214"
              textAnchor="middle"
              fill="#fff"
              fontSize="13"
              fontWeight="700"
            >
              {shortLigand.length > 14 ? `${shortLigand.slice(0, 12)}…` : shortLigand}
            </text>
            <text
              x="240"
              y="232"
              textAnchor="middle"
              fill="#6ee7b7"
              fontSize="10"
              fontFamily="monospace"
              fontWeight="600"
            >
              LIGAND
            </text>

            {diagramData.map((node, idx) => (
              <g key={`${node.resName}${node.resSeq}-${idx}`}>
                <line
                  x1="240"
                  y1="220"
                  x2={node.x}
                  y2={node.y}
                  stroke={node.stroke}
                  strokeWidth="2"
                  strokeDasharray={node.dash}
                  opacity="0.92"
                />
                <rect
                  x={(240 + node.x) / 2 - 16}
                  y={(220 + node.y) / 2 - 8}
                  width="32"
                  height="16"
                  rx="4"
                  fill="#052e1c"
                  stroke={node.stroke}
                  strokeWidth="1"
                />
                <text
                  x={(240 + node.x) / 2}
                  y={(220 + node.y) / 2 + 4}
                  textAnchor="middle"
                  fill={node.stroke}
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="700"
                >
                  {node.distanceAngstroms.toFixed(1)}
                </text>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="24"
                  fill="#0f2c20"
                  stroke={node.stroke}
                  strokeWidth="2"
                />
                <text
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize="10"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  {node.resName}
                  {node.resSeq}
                </text>
              </g>
            ))}
          </svg>
        </motion.div>
        <p className="pointer-events-none absolute bottom-2 left-3 text-[10px] text-emerald-100/40">
          {isFullscreen ? "Scroll zoom · drag pan" : "Ctrl+scroll zoom · drag pan · use +/− buttons"}
        </p>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1.5 border-t border-white/10 px-3 py-2.5 text-[10px] sm:px-4">
        <span className="inline-flex items-center gap-1.5 text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400" /> Hydrogen Bond
        </span>
        <span className="inline-flex items-center gap-1.5 text-amber-300">
          <span className="h-2 w-2 rounded-full bg-amber-400" /> Hydrophobic Interaction
        </span>
        <span className="inline-flex items-center gap-1.5 text-indigo-300">
          <span className="h-2 w-2 rounded-full bg-indigo-400" /> Salt Bridge
        </span>
        <span className="inline-flex items-center gap-1.5 text-slate-300">
          <span className="h-2 w-2 rounded-full bg-slate-400" /> Other Contacts
        </span>
      </div>
    </>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[#0b1f16]">
        {mapBody}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-[#0f2c20]/80 bg-[#0b1f16] shadow-[0_8px_28px_-16px_rgba(15,44,32,0.55)]">
      {mapBody}
    </div>
  );
}
