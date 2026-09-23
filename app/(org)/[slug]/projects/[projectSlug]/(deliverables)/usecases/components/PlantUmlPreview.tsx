"use client";

import { useEffect, useRef, useState } from "react";
import { Code2, Copy, Download, Maximize2, Minimize2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { MOCK_PLANT_UML, MOCK_PLANT_UML_SVG_URL } from "@/lib/usecases/mockPlantUml";

const buttonClass = "inline-flex h-8 items-center gap-1.5 rounded-md border border-border/70 px-2.5 text-xs hover:bg-muted/50 disabled:opacity-40";

export function PlantUmlPreview() {
  const panel = useRef<HTMLElement>(null);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [fullscreen, setFullscreen] = useState(false);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const sync = () => setFullscreen(document.fullscreenElement === panel.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement === panel.current) await document.exitFullscreen();
      else await panel.current?.requestFullscreen();
    } catch { toast.error("Full screen is unavailable."); }
  };
  const downloadSource = () => {
    const url = URL.createObjectURL(new Blob([MOCK_PLANT_UML], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "research-use-cases.puml";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <section ref={panel} className={`flex min-h-[420px] min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/70 bg-background ${fullscreen ? "h-screen w-screen rounded-none" : ""}`}>
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
      <div><h2 className="flex items-center gap-2 text-sm font-semibold">PlantUML <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-300">Mock preview</span></h2><p className="mt-1 text-xs text-muted-foreground">Research platform · sample use case diagram</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1"><button type="button" className={buttonClass} aria-label="Zoom out" disabled={zoom <= 50} onClick={() => setZoom((value) => Math.max(50, value - 25))}><Minus className="size-3.5" /></button><button type="button" className={buttonClass} title="Reset zoom" onClick={() => setZoom(100)}>{zoom}%</button><button type="button" className={buttonClass} aria-label="Zoom in" disabled={zoom >= 250} onClick={() => setZoom((value) => Math.min(250, value + 25))}><Plus className="size-3.5" /></button></div>
        <button type="button" className={buttonClass} aria-expanded={sourceOpen} onClick={() => setSourceOpen((value) => !value)}><Code2 className="size-3.5" />{sourceOpen ? "Hide code" : "View code"}</button>
        <button type="button" className={buttonClass} onClick={downloadSource}><Download className="size-3.5" />Download .puml</button>
        <button type="button" className={buttonClass} onClick={() => void toggleFullscreen()}>{fullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}{fullscreen ? "Exit full screen" : "Full screen"}</button>
      </div>
    </header>
    <div className={`grid min-h-0 flex-1 ${sourceOpen ? "grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]" : "grid-cols-1"}`}>
      <div className="relative min-h-[340px] overflow-auto bg-white p-6 [scrollbar-gutter:stable]" tabIndex={0} role="region" aria-label="PlantUML diagram" aria-busy={state === "loading"}>
        {state === "loading" ? <p role="status" className="absolute left-6 top-6 text-sm text-gray-500">Rendering diagram…</p> : null}
        {state === "error" ? <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-sm text-gray-600"><p>Preview unavailable. You can still view or download the source.</p><button type="button" onClick={() => { setState("loading"); setAttempt((value) => value + 1); }} className="rounded-md border border-gray-300 px-3 py-2">Retry preview</button></div> : null}
        {/* Remote SVG displayed as an image; never inject renderer markup into the DOM. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={attempt} src={MOCK_PLANT_UML_SVG_URL} alt="Sample research platform use case diagram with researchers, administrator, reviewer and include/extend relationships" referrerPolicy="no-referrer" onLoad={() => setState("ready")} onError={() => { setState("error"); toast.error("Could not load the PlantUML preview.", { id: "plantuml-preview" }); }} className={`mx-auto h-auto max-w-none ${state === "ready" ? "" : "hidden"}`} style={{ width: `${zoom}%` }} />
      </div>
      {sourceOpen ? <aside className="flex min-h-0 flex-col border-l border-border/70 bg-card/30"><div className="flex items-center justify-between border-b border-border/60 px-4 py-2"><span className="font-mono text-xs text-muted-foreground">research-use-cases.puml</span><button type="button" className={buttonClass} aria-label="Copy PlantUML source" onClick={() => void navigator.clipboard.writeText(MOCK_PLANT_UML).then(() => toast.success("PlantUML source copied.")).catch(() => toast.error("Could not copy the source."))}><Copy className="size-3.5" /></button></div><pre className="min-h-0 flex-1 overflow-auto p-4 text-[11px] leading-5 text-foreground/85"><code>{MOCK_PLANT_UML}</code></pre></aside> : null}
    </div>
  </section>;
}
