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
  const [activePose, setActivePose] = useState<number>(1);
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
      {/* Top Overlay Controls */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 backdrop-blur-sm border border-slate-700/80 text-white text-xs space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-emerald-400">{ligandName}</span>
            <span className="text-slate-400">in complex with</span>
            <span className="font-bold text-teal-300">{proteinName}</span>
          </div>
          {bindingAffinity !== undefined && bindingAffinity !== null && (
            <div className="text-[11px] font-mono text-emerald-300">
              Predicted Vina Score (ΔG): <span className="font-bold">{bindingAffinity} kcal/mol</span>
            </div>
          )}
        </div>
      </div>

      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setShowProtein(!showProtein)}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors ${
            showProtein
              ? "bg-slate-800/90 text-white border-slate-600 hover:bg-slate-700"
              : "bg-slate-900/60 text-slate-500 border-slate-800"
          }`}
          title="Toggle Receptor Protein"
        >
          {showProtein ? <Eye className="w-3.5 h-3.5 text-teal-400" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>Receptor</span>
        </button>

        <button
          type="button"
          onClick={() => setShowLigand(!showLigand)}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors ${
            showLigand
              ? "bg-slate-800/90 text-white border-slate-600 hover:bg-slate-700"
              : "bg-slate-900/60 text-slate-500 border-slate-800"
          }`}
          title="Toggle Docked Ligand"
        >
          {showLigand ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>Ligand</span>
        </button>

        <select
          value={colorScheme}
          onChange={(e) => setColorScheme(e.target.value as any)}
          className="px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
        >
          <option value="spectrum">Spectrum</option>
          <option value="chain">Chain Color</option>
          <option value="secondary">Teal Theme</option>
        </select>

        <button
          type="button"
          onClick={handleResetView}
          className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleExportScreenshot}
          className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
          title="Export Screenshot"
        >
          <Camera className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* 3D Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Loading state */}
      {isLoadingScript && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 text-white gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          <span className="text-xs font-medium">Initializing 3D Molecular Graphics Engine...</span>
        </div>
      )}

      {/* Bottom Hint */}
      <div className="absolute bottom-2 left-3 z-10 text-[10px] text-slate-500 select-none pointer-events-none">
        Left-click + Drag to rotate • Right-click + Drag to pan • Scroll to zoom
      </div>
    </div>
  );
}

