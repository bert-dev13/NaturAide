"use client";

import React, { useMemo } from "react";
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
  if (k === "HBond") return { stroke: "#10b981", dash: "none" };
  if (k === "Hydrophobic") return { stroke: "#f59e0b", dash: "4 3" };
  if (k === "Salt") return { stroke: "#818cf8", dash: "2 2" };
  return { stroke: "#94a3b8", dash: "3 3" };
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

  // Unique residue → closest contact
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
  maxNodes = 12,
  typeFilter = "ALL",
}: Props) {
  const nodes = useMemo(
    () => selectDiagramNodes(interactions as any[], maxNodes, typeFilter),
    [interactions, maxNodes, typeFilter]
  );

  const diagramData = useMemo(() => {
    const total = Math.max(nodes.length, 1);
    const radius = 132;
    const cx = 200;
    const cy = 190;
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
    ligandName.length > 16 ? `${ligandName.slice(0, 14)}…` : ligandName;

  return (
    <div className="w-full overflow-hidden rounded-xl border border-[#0f2c20]/80 bg-[#0b1f16]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-white">
            {shortLigand}{" "}
            <span className="font-mono text-emerald-300">→ {pdbId}</span>
          </p>
          <p className="text-[10px] text-emerald-100/50">
            Top {nodes.length} residue contacts
          </p>
        </div>
        {bindingAffinity != null && (
          <span className="rounded-lg border border-emerald-700/50 bg-emerald-950/80 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
            {Number(bindingAffinity).toFixed(2)} kcal/mol
          </span>
        )}
      </div>

      <div className="mx-auto max-w-[420px] p-3">
        <svg viewBox="0 0 400 380" className="h-auto w-full">
          <circle
            cx="200"
            cy="190"
            r="44"
            fill="#047857"
            fillOpacity="0.3"
            stroke="#34d399"
            strokeWidth="2"
          />
          <text
            x="200"
            y="186"
            textAnchor="middle"
            fill="#fff"
            fontSize="11"
            fontWeight="700"
          >
            {shortLigand.length > 12 ? `${shortLigand.slice(0, 10)}…` : shortLigand}
          </text>
          <text
            x="200"
            y="202"
            textAnchor="middle"
            fill="#6ee7b7"
            fontSize="9"
            fontFamily="monospace"
          >
            LIGAND
          </text>

          {diagramData.map((node, idx) => (
            <g key={`${node.resName}${node.resSeq}-${idx}`}>
              <line
                x1="200"
                y1="190"
                x2={node.x}
                y2={node.y}
                stroke={node.stroke}
                strokeWidth="1.6"
                strokeDasharray={node.dash}
                opacity="0.9"
              />
              <rect
                x={(200 + node.x) / 2 - 14}
                y={(190 + node.y) / 2 - 7}
                width="28"
                height="14"
                rx="3"
                fill="#052e1c"
                stroke={node.stroke}
                strokeWidth="0.8"
              />
              <text
                x={(200 + node.x) / 2}
                y={(190 + node.y) / 2 + 3}
                textAnchor="middle"
                fill={node.stroke}
                fontSize="8"
                fontFamily="monospace"
                fontWeight="700"
              >
                {node.distanceAngstroms.toFixed(1)}
              </text>
              <circle
                cx={node.x}
                cy={node.y}
                r="20"
                fill="#0f2c20"
                stroke={node.stroke}
                strokeWidth="1.8"
              />
              <text
                x={node.x}
                y={node.y + 3}
                textAnchor="middle"
                fill="#fff"
                fontSize="9"
                fontWeight="700"
                fontFamily="monospace"
              >
                {node.resName}
                {node.resSeq}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-white/10 px-3 py-2 text-[10px]">
        <span className="inline-flex items-center gap-1 text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> H-bond
        </span>
        <span className="inline-flex items-center gap-1 text-amber-300">
          <span className="h-2 w-2 rounded-full bg-amber-500" /> Hydrophobic
        </span>
        <span className="inline-flex items-center gap-1 text-indigo-300">
          <span className="h-2 w-2 rounded-full bg-indigo-400" /> Salt bridge
        </span>
      </div>
    </div>
  );
}
