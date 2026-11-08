"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2, RotateCcw, Maximize2, Minimize2, Camera, Eye, EyeOff } from "lucide-react";

declare global {
  interface Window {
    $3Dmol: any;
  }
}

interface Props {
  receptorPdb: string;
  ligandPdbqt: string;
  proteinName: string;
  ligandName: string;
  bindingAffinity?: number | null;
  highlightResidues?: string[];
}

export default function Molecular3DViewer({
  receptorPdb,
  ligandPdbqt,
  proteinName,
  ligandName,
  bindingAffinity,
  highlightResidues = [],
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [isLoadingScript, setIsLoadingScript] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showProtein, setShowProtein] = useState<boolean>(true);
  const [showLigand, setShowLigand] = useState<boolean>(true);
  const [colorScheme, setColorScheme] = useState<"spectrum" | "chain" | "secondary">("spectrum");

  // Load 3Dmol.js script from CDN
  useEffect(() => {
    if (typeof window !== "undefined" && window.$3Dmol) {
      setIsLoadingScript(false);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://3Dmol.org/build/3Dmol-min.js";
    script.async = true;
    script.onload = () => {
      setIsLoadingScript(false);
    };
    script.onerror = () => {
      console.error("Failed to load 3Dmol.js library from CDN.");
      setIsLoadingScript(false);
    };
    document.body.appendChild(script);

    return () => {
      // Keep script cached in DOM
    };
  }, []);

  // Initialize or re-render 3Dmol viewer
  const renderModel = () => {
    if (!containerRef.current || !window.$3Dmol || isLoadingScript) return;

    try {
      // Clear container
      containerRef.current.innerHTML = "";

      const config = { backgroundColor: "0x0f172a" }; // slate-900
      const viewer = window.$3Dmol.createViewer(containerRef.current, config);
      viewerRef.current = viewer;

      // 1. Add Receptor
      if (receptorPdb && showProtein) {
        viewer.addModel(receptorPdb, "pdb");
        if (colorScheme === "spectrum") {
          viewer.setStyle({ hetflag: false }, { cartoon: { color: "spectrum", opacity: 0.85 } });
        } else if (colorScheme === "chain") {
          viewer.setStyle({ hetflag: false }, { cartoon: { colorscheme: "chainHetatm", opacity: 0.85 } });
        } else {
          viewer.setStyle({ hetflag: false }, { cartoon: { color: "#0d9488", opacity: 0.85 } });
        }
      }

      // 2. Add Ligand
      if (ligandPdbqt && showLigand) {
        viewer.addModel(ligandPdbqt, "pdbqt");
        viewer.setStyle(
          { resn: "UNL" },
          {
            stick: {
              colorscheme: "greenCarbon",
              radius: 0.28,
            },
            sphere: {
              colorscheme: "greenCarbon",
              scale: 0.35,
            },
          }
        );
      }

      // 3. Highlight key interacting residues
      if (highlightResidues.length > 0 && showProtein) {
        for (const resStr of highlightResidues) {
          const match = String(resStr).match(/(\d+)/);
          const seqNum = match ? parseInt(match[1], 10) : NaN;
          if (!isNaN(seqNum)) {
            viewer.setStyle(
              { resi: seqNum },
              {
                stick: { colorscheme: "yellowCarbon", radius: 0.22 },
                cartoon: { color: "#f59e0b" },
              }
            );
            viewer.addLabel(resStr, {
              fontSize: 10,
              fontColor: "white",
              backgroundColor: "black",
              backgroundOpacity: 0.6,
              position: { resi: seqNum },
            });
          }
        }
      }

      viewer.zoomTo();
      viewer.render();
    } catch (e) {
      console.error("Error rendering 3Dmol model:", e);
    }
  };

  useEffect(() => {
    renderModel();
    return () => {
      if (viewerRef.current) {
        try {
          viewerRef.current.clear();
        } catch {}
      }
    };
  }, [isLoadingScript, receptorPdb, ligandPdbqt, showProtein, showLigand, colorScheme, highlightResidues]);

  const handleResetView = () => {
    if (viewerRef.current) {
      viewerRef.current.zoomTo();
      viewerRef.current.render();
    }
  };

  const handleExportScreenshot = () => {
    if (!viewerRef.current) return;
    try {
      const imgData = viewerRef.current.pngURI();
      const a = document.createElement("a");
      a.href = imgData;
      a.download = `${proteinName}_${ligandName}_docked_3d.png`;
      a.click();
    } catch (e) {
      alert("Failed to export screenshot");
    }
  };

  return (
    <div
      className={`relative bg-slate-950 rounded-xl overflow-hidden border border-slate-800 ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none w-screen h-screen" : "w-full h-[520px]"
      }`}
    >
      {/* Compact overlay */}
      <div className="absolute left-2.5 top-2.5 z-10 max-w-[min(100%,18rem)] rounded-lg border border-white/10 bg-[#0b1f16]/90 px-2.5 py-1.5 text-[11px] text-white backdrop-blur-sm">
        <p className="truncate font-semibold text-emerald-300">
          {ligandName}{" "}
          <span className="font-normal text-white/50">→</span>{" "}
          <span className="text-teal-200">{proteinName}</span>
        </p>
        {bindingAffinity != null && (
          <p className="font-mono text-[10px] text-emerald-200/90">
            {Number(bindingAffinity).toFixed(2)} kcal/mol
          </p>
        )}
      </div>

      <div className="absolute right-2.5 top-2.5 z-10 flex flex-wrap items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => setShowProtein(!showProtein)}
          className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-semibold transition ${
            showProtein
              ? "border-white/20 bg-[#0b1f16]/90 text-white"
              : "border-white/10 bg-black/40 text-white/40"
          }`}
          title="Toggle receptor"
        >
          {showProtein ? <Eye className="h-3 w-3 text-teal-300" /> : <EyeOff className="h-3 w-3" />}
          Protein
        </button>
        <button
          type="button"
          onClick={() => setShowLigand(!showLigand)}
          className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-semibold transition ${
            showLigand
              ? "border-white/20 bg-[#0b1f16]/90 text-white"
              : "border-white/10 bg-black/40 text-white/40"
          }`}
          title="Toggle ligand"
        >
          {showLigand ? <Eye className="h-3 w-3 text-emerald-300" /> : <EyeOff className="h-3 w-3" />}
          Ligand
        </button>
        <select
          value={colorScheme}
          onChange={(e) => setColorScheme(e.target.value as typeof colorScheme)}
          className="rounded-lg border border-white/20 bg-[#0b1f16]/90 px-1.5 py-1 text-[10px] font-medium text-white"
          title="Color scheme"
        >
          <option value="spectrum">Spectrum</option>
          <option value="chain">Chain</option>
          <option value="secondary">Teal</option>
        </select>
        <button
          type="button"
          onClick={handleResetView}
          className="rounded-lg border border-white/20 bg-[#0b1f16]/90 p-1.5 text-white/80 hover:text-white"
          title="Reset view"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={handleExportScreenshot}
          className="rounded-lg border border-white/20 bg-[#0b1f16]/90 p-1.5 text-white/80 hover:text-white"
          title="Screenshot"
        >
          <Camera className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="rounded-lg border border-white/20 bg-[#0b1f16]/90 p-1.5 text-white/80 hover:text-white"
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      <div ref={containerRef} className="h-full w-full cursor-grab active:cursor-grabbing" />

      {isLoadingScript && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#0b1f16]/85 text-white">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
          <span className="text-xs font-medium">Loading graphics…</span>
        </div>
      )}
    </div>
  );
}

