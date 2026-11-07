"use client";

import React, { useMemo } from "react";
import { ProteinLigandInteraction } from "@/lib/interaction-analysis-service";
import { Atom, ShieldCheck, Zap } from "lucide-react";

interface Props {
  ligandName: string;
  proteinName: string;
  pdbId: string;
  bindingAffinity?: number | null;
  interactions: ProteinLigandInteraction[];
}

export default function Interaction2DDiagram({
  ligandName,
  proteinName,
  pdbId,
  bindingAffinity,
  interactions,
}: Props) {
  // Compute positions of residues in a circle around the central ligand
  const diagramData = useMemo(() => {
    const total = Math.max(interactions.length, 1);
    const radius = 140;
    const centerX = 200;
    const centerY = 190;

    return interactions.map((item, index) => {
      const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      // Color coding by interaction type
      let color = "#10b981"; // emerald for H-bond
      let dash = "none";
      if (item.interactionType === "Hydrophobic Contact") {
        color = "#f59e0b"; // amber
        dash = "4,4";
      } else if (item.interactionType === "Salt Bridge") {
        color = "#6366f1"; // indigo
        dash = "2,2";
      } else {
        color = "#64748b"; // slate
        dash = "3,3";
      }

      return {
        ...item,
        x,
        y,
        color,
        dash,
      };
    });
  }, [interactions]);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-5 text-white space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Atom className="w-4 h-4 text-emerald-400" />
            2D Protein-Ligand Interaction Map ({ligandName} &amp; {pdbId})
          </h4>
          <p className="text-[11px] text-slate-400">
            Computational residue contact geometry (Å) based on elemental distances. In-silico predictions.
          </p>
        </div>

        {bindingAffinity !== undefined && bindingAffinity !== null && (
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800/60 self-start sm:self-auto" title="Predicted AutoDock Vina binding score">
            Predicted Vina Score: {bindingAffinity} kcal/mol
          </span>
        )}
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* SVG Diagram Canvas */}
        <div className="w-full max-w-[420px] aspect-square flex items-center justify-center relative bg-slate-950/70 rounded-xl border border-slate-800/80 p-2">
          <svg viewBox="0 0 400 380" className="w-full h-full">
            {/* Center Ligand Core */}
            <circle cx="200" cy="190" r="48" fill="#047857" fillOpacity="0.25" stroke="#10b981" strokeWidth="2.5" />
            <text x="200" y="185" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">
              {ligandName.length > 14 ? ligandName.slice(0, 12) + "…" : ligandName}
            </text>
            <text x="200" y="202" textAnchor="middle" fill="#6ee7b7" fontSize="10" fontFamily="monospace">
              [LIGAND CORE]
            </text>

            {/* Connecting interaction lines and residue nodes */}
            {diagramData.map((node, idx) => (
              <g key={idx}>
                {/* Contact Ray Line */}
                <line
                  x1="200"
                  y1="190"
                  x2={node.x}
                  y2={node.y}
                  stroke={node.color}
                  strokeWidth="1.8"
                  strokeDasharray={node.dash}
                  opacity="0.85"
                />

                {/* Distance pill badge */}
                <rect
                  x={(200 + node.x) / 2 - 16}
                  y={(190 + node.y) / 2 - 8}
                  width="32"
                  height="16"
                  rx="4"
                  fill="#0f172a"
                  stroke={node.color}
                  strokeWidth="0.8"
                />
                <text
                  x={(200 + node.x) / 2}
                  y={(190 + node.y) / 2 + 3.5}
                  textAnchor="middle"
                  fill={node.color}
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {node.distanceAngstroms}Å
                </text>

                {/* Residue Node Circle */}
                <circle cx={node.x} cy={node.y} r="22" fill="#1e293b" stroke={node.color} strokeWidth="2" />
                <text
                  x={node.x}
                  y={node.y + 3.5}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="9.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {node.resName}
                  {node.resSeq}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Legend and Tabular Contact Inspector */}
        <div className="flex-1 space-y-4 w-full">
          {/* Interaction Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-slate-300">Hydrogen Bond</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
              <span className="text-slate-300">Hydrophobic</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="w-3 h-3 rounded-full bg-indigo-500 shrink-0" />
              <span className="text-slate-300">Salt Bridge</span>
            </div>
          </div>

          {/* Contact Details List */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Residue</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Distance</th>
                  <th className="py-2 px-3">Protein Atom</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 max-h-48 overflow-y-auto">
                {interactions.slice(0, 8).map((inter, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-mono font-bold text-white">{inter.residue}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          inter.interactionType === "Hydrogen Bond"
                            ? "bg-emerald-950/80 text-emerald-400 border-emerald-800"
                            : inter.interactionType === "Hydrophobic Contact"
                            ? "bg-amber-950/80 text-amber-300 border-amber-800"
                            : "bg-indigo-950/80 text-indigo-300 border-indigo-800"
                        }`}
                      >
                        {inter.interactionType}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-emerald-400 font-semibold">{inter.distanceAngstroms} Å</td>
                    <td className="py-2 px-3 font-mono text-slate-400">{inter.proteinAtom}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

