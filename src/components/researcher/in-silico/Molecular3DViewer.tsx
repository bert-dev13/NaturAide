"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Loader2,
  RotateCcw,
  Maximize2,
  Minimize2,
  Camera,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Tag,
  Crosshair,
  X,
} from "lucide-react";

declare global {
  interface Window {
    $3Dmol: any;
  }
}

export interface SelectedResidueInfo {
  residue: string;
  resi: number;
  resn?: string;
  chain?: string;
  atom?: string;
}

interface Props {
  receptorPdb: string;
  ligandPdbqt: string;
  proteinName: string;
  ligandName: string;
  bindingAffinity?: number | null;
  highlightResidues?: string[];
  /** Compact overlay omitted when parent shows complex info */
  showOverlayBadge?: boolean;
  onSelectionChange?: (selection: SelectedResidueInfo | null) => void;
  className?: string;
}

export default function Molecular3DViewer({
  receptorPdb,
  ligandPdbqt,
  proteinName,
  ligandName,
  bindingAffinity,
  highlightResidues = [],
  showOverlayBadge = true,
  onSelectionChange,
  className = "",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const selectedRef = useRef<SelectedResidueInfo | null>(null);
  const [isLoadingScript, setIsLoadingScript] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showProtein, setShowProtein] = useState(true);
  const [showLigand, setShowLigand] = useState(true);
  const [showPocket, setShowPocket] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [colorScheme, setColorScheme] = useState<"spectrum" | "chain" | "secondary">("spectrum");
  const [selected, setSelected] = useState<SelectedResidueInfo | null>(null);
  selectedRef.current = selected;

  // Load 3Dmol.js script from CDN
  useEffect(() => {
    if (typeof window !== "undefined" && window.$3Dmol) {
      setIsLoadingScript(false);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://3Dmol.org/build/3Dmol-min.js";
    script.async = true;
    script.onload = () => setIsLoadingScript(false);
    script.onerror = () => {
      console.error("Failed to load 3Dmol.js library from CDN.");
      setIsLoadingScript(false);
      setRenderError("Could not load the 3D visualization library.");
    };
    document.body.appendChild(script);
  }, []);

  const notifySelection = useCallback(
    (next: SelectedResidueInfo | null) => {
      setSelected(next);
      onSelectionChange?.(next);
    },
    [onSelectionChange]
  );

  const clearSelection = useCallback(() => {
    notifySelection(null);
  }, [notifySelection]);

  const renderModel = useCallback(() => {
    if (!containerRef.current || !window.$3Dmol || isLoadingScript) return;

    setIsRendering(true);
    setRenderError(null);

    try {
      containerRef.current.innerHTML = "";

      const config = { backgroundColor: "0x0b1f16" };
      const viewer = window.$3Dmol.createViewer(containerRef.current, config);
      viewerRef.current = viewer;

      // 1. Receptor
      if (receptorPdb && showProtein) {
        viewer.addModel(receptorPdb, "pdb");
        const cartoonStyle =
          colorScheme === "spectrum"
            ? { color: "spectrum", opacity: 0.82 }
            : colorScheme === "chain"
              ? { colorscheme: "chainHetatm", opacity: 0.82 }
              : { color: "#0d9488", opacity: 0.82 };
        viewer.setStyle({ hetflag: false }, { cartoon: cartoonStyle });

        viewer.setClickable({ hetflag: false }, true, (atom: any) => {
          if (!atom || atom.hetflag) return;
          const resn = atom.resn || "";
          const resi = Number(atom.resi);
          const chain = atom.chain || "A";
          if (!Number.isFinite(resi)) return;
          notifySelection({
            residue: `${resn} ${resi}`.trim(),
            resi,
            resn,
            chain,
            atom: atom.atom || atom.name || undefined,
          });
          try {
            viewer.setStyle(
              { resi, chain },
              {
                stick: { colorscheme: "cyanCarbon", radius: 0.25 },
                cartoon: { color: "#22d3ee" },
              }
            );
            viewer.render();
          } catch {}
        });
      }

      // 2. Ligand
      if (ligandPdbqt && showLigand) {
        viewer.addModel(ligandPdbqt, "pdbqt");
        viewer.setStyle(
          { resn: "UNL" },
          {
            stick: {
              colorscheme: "greenCarbon",
              radius: 0.3,
            },
            sphere: {
              colorscheme: "greenCarbon",
              scale: 0.38,
            },
          }
        );
        viewer.setClickable({ resn: "UNL" }, true, () => {
          notifySelection({
            residue: "Ligand",
            resi: 0,
            resn: "LIG",
            atom: ligandName,
          });
        });
      }

      // 3. Binding pocket = interacting residues (from real analysis)
      if (showPocket && highlightResidues.length > 0 && showProtein) {
        for (const resStr of highlightResidues) {
          const match = String(resStr).match(/(\d+)/);
          const seqNum = match ? parseInt(match[1], 10) : NaN;
          if (!Number.isFinite(seqNum)) continue;

          viewer.setStyle(
            { resi: seqNum },
            {
              stick: { colorscheme: "yellowCarbon", radius: 0.22 },
              cartoon: { color: "#f59e0b" },
            }
          );

          if (showLabels) {
            viewer.addLabel(resStr, {
              fontSize: 11,
              fontColor: "white",
              backgroundColor: "black",
              backgroundOpacity: 0.65,
              position: { resi: seqNum },
            });
          }
        }
      }

      // Re-apply selection highlight if still active
      const current = selectedRef.current;
      if (current && current.resi > 0 && showProtein) {
        viewer.setStyle(
          { resi: current.resi, ...(current.chain ? { chain: current.chain } : {}) },
          {
            stick: { colorscheme: "cyanCarbon", radius: 0.25 },
            cartoon: { color: "#22d3ee" },
          }
        );
      }

      viewer.zoomTo();
      viewer.render();
    } catch (e: any) {
      console.error("Error rendering 3Dmol model:", e);
      setRenderError(e?.message || "Failed to render the 3D structure.");
    } finally {
      setIsRendering(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isLoadingScript,
    receptorPdb,
    ligandPdbqt,
    showProtein,
    showLigand,
    showPocket,
    showLabels,
    colorScheme,
    highlightResidues,
    ligandName,
    notifySelection,
  ]);

  useEffect(() => {
    renderModel();
    return () => {
      if (viewerRef.current) {
        try {
          viewerRef.current.clear();
        } catch {}
      }
    };
  }, [renderModel]);

  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    // Resize viewer after fullscreen toggle
    const t = window.setTimeout(() => {
      try {
        viewerRef.current?.resize?.();
        viewerRef.current?.render?.();
      } catch {}
    }, 80);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [isFullscreen]);

  const handleResetView = () => {
    if (!viewerRef.current) return;
    try {
      viewerRef.current.zoomTo();
      viewerRef.current.render();
    } catch {}
  };

  const handleZoom = (factor: number) => {
    if (!viewerRef.current) return;
    try {
      viewerRef.current.zoom(factor, 200);
      viewerRef.current.render();
    } catch {}
  };

  const handleExportScreenshot = () => {
    if (!viewerRef.current) return;
    try {
      const imgData = viewerRef.current.pngURI();
      const a = document.createElement("a");
      a.href = imgData;
      a.download = `${proteinName}_${ligandName}_docked_3d.png`;
      a.click();
    } catch {
      alert("Failed to export screenshot");
    }
  };

  const toolbarBtn =
    "inline-flex items-center gap-1 rounded-lg border border-white/15 bg-[#0b1f16]/92 px-2 py-1 text-[10px] font-semibold text-white/90 backdrop-blur-sm transition hover:bg-white/10";
  const toolbarBtnOff =
    "inline-flex items-center gap-1 rounded-lg border border-white/10 bg-black/35 px-2 py-1 text-[10px] font-semibold text-white/40 backdrop-blur-sm transition hover:bg-white/5";
  const iconBtn =
    "rounded-lg border border-white/15 bg-[#0b1f16]/92 p-1.5 text-white/85 backdrop-blur-sm hover:bg-white/10 hover:text-white";

  return (
    <div
      className={`relative overflow-hidden border border-[#0f2c20]/80 bg-[#0b1f16] ${
        isFullscreen
          ? "fixed inset-0 z-50 rounded-none"
          : `w-full rounded-2xl ${className || "min-h-[32rem] h-[min(72vh,40rem)]"}`
      }`}
    >
      {showOverlayBadge && (
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
      )}

      {/* Control toolbar */}
      <div className="absolute right-2.5 top-2.5 z-10 flex max-w-[min(100%,28rem)] flex-wrap items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => setShowProtein((v) => !v)}
          className={showProtein ? toolbarBtn : toolbarBtnOff}
          title="Toggle protein visibility"
        >
          {showProtein ? <Eye className="h-3 w-3 text-teal-300" /> : <EyeOff className="h-3 w-3" />}
          Protein
        </button>
        <button
          type="button"
          onClick={() => setShowLigand((v) => !v)}
          className={showLigand ? toolbarBtn : toolbarBtnOff}
          title="Toggle ligand visibility"
        >
          {showLigand ? <Eye className="h-3 w-3 text-emerald-300" /> : <EyeOff className="h-3 w-3" />}
          Ligand
        </button>
        <button
          type="button"
          onClick={() => setShowPocket((v) => !v)}
          className={showPocket ? toolbarBtn : toolbarBtnOff}
          title="Toggle binding-pocket residues"
          disabled={highlightResidues.length === 0}
        >
          <Crosshair className={`h-3 w-3 ${showPocket ? "text-amber-300" : ""}`} />
          Pocket
        </button>
        <button
          type="button"
          onClick={() => setShowLabels((v) => !v)}
          className={showLabels ? toolbarBtn : toolbarBtnOff}
          title="Toggle residue labels"
          disabled={!showPocket || highlightResidues.length === 0}
        >
          <Tag className={`h-3 w-3 ${showLabels ? "text-sky-300" : ""}`} />
          Labels
        </button>
        <select
          value={colorScheme}
          onChange={(e) => setColorScheme(e.target.value as typeof colorScheme)}
          className="rounded-lg border border-white/15 bg-[#0b1f16]/92 px-1.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm"
          title="Protein color scheme"
        >
          <option value="spectrum">Spectrum</option>
          <option value="chain">Chain</option>
          <option value="secondary">Teal</option>
        </select>
        <button type="button" onClick={() => handleZoom(1.2)} className={iconBtn} title="Zoom in">
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => handleZoom(0.8)} className={iconBtn} title="Zoom out">
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={handleResetView} className={iconBtn} title="Reset camera">
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={handleExportScreenshot}
          className={iconBtn}
          title="Screenshot"
        >
          <Camera className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setIsFullscreen((v) => !v)}
          className={iconBtn}
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Selection chip */}
      {selected && (
        <div className="absolute bottom-3 left-3 z-10 flex max-w-sm items-start gap-2 rounded-xl border border-cyan-400/30 bg-[#0b1f16]/92 px-3 py-2 text-[11px] text-white backdrop-blur-sm">
          <div className="min-w-0">
            <p className="font-semibold text-cyan-200">
              {selected.residue === "Ligand" ? "Ligand selected" : "Residue selected"}
            </p>
            <p className="mt-0.5 font-mono text-[10px] text-white/80">
              {selected.residue}
              {selected.chain && selected.resi > 0 ? ` · chain ${selected.chain}` : ""}
              {selected.atom ? ` · ${selected.atom}` : ""}
            </p>
            <p className="mt-1 text-[9px] text-white/45">Click another atom or clear selection</p>
          </div>
          <button
            type="button"
            onClick={() => {
              selectedRef.current = null;
              clearSelection();
              // Rebuild scene without selection highlight
              window.setTimeout(() => renderModel(), 0);
            }}
            className="rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white"
            title="Clear selection"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div
        ref={containerRef}
        className="h-full w-full cursor-grab active:cursor-grabbing"
        style={{ minHeight: isFullscreen ? "100%" : undefined }}
      />

      <p className="pointer-events-none absolute bottom-2 right-3 text-[10px] text-emerald-100/35">
        Drag rotate · scroll zoom · right-drag pan · click residue
      </p>

      {(isLoadingScript || isRendering) && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-[#0b1f16]/80 text-white">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
          <span className="text-xs font-medium">
            {isLoadingScript ? "Loading graphics…" : "Rendering structure…"}
          </span>
        </div>
      )}

      {renderError && !isLoadingScript && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-[#0b1f16]/90 px-4 text-center text-white">
          <p className="text-xs font-semibold text-rose-200">{renderError}</p>
        </div>
      )}
    </div>
  );
}
