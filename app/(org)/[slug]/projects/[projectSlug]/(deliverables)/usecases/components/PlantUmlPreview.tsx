"use client";

import { useEffect, useRef, useState } from "react";
import { Code2, Copy, Download, Maximize2, Minimize2, Minus, Plus, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";

const buttonClass = "inline-flex h-8 items-center gap-1.5 rounded-md border border-border/70 px-2.5 text-xs hover:bg-muted/50 disabled:opacity-40";

type PlantUmlPreviewProps = {
  source: string;
  projectName: string;
  unavailable?: boolean;
  busy?: boolean;
  onSave?: (source: string) => Promise<boolean>;
};

export function PlantUmlPreview({ source, projectName, unavailable = false, busy = false, onSave }: PlantUmlPreviewProps) {
  const panel = useRef<HTMLElement>(null);
  const [draft, setDraft] = useState(source);
  const [savedSource, setSavedSource] = useState(source);
  const [sourceOpen, setSourceOpen] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [fullscreen, setFullscreen] = useState(false);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const hasSource = draft.trim().length > 0;

  useEffect(() => {
    const sync = () => setFullscreen(document.fullscreenElement === panel.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const dirty = draft !== savedSource;

  useEffect(() => {
    if (!hasSource) return;
    let disposed = false;
    // The uncompressed ~h hex endpoint roughly doubles the source size; for a diagram with
    // dozens of use cases that URL is long enough to trip plantuml.com's "header too large"
    // limit, so never render an <img> from it — wait for the compressed URL below.
    void plantUmlSvgUrl(draft).then((url) => {
      if (disposed) return;
      setPreviewUrl(url);
      setAttempt((value) => value + 1);
    });
    return () => { disposed = true; };
  }, [draft, hasSource]);

  useEffect(() => {
    // The <img> below has no built-in timeout: if the network request to the renderer stalls
    // (silently dropped by a firewall, DNS black hole, etc.) neither onLoad nor onError ever
    // fires and the UI is stuck on "Rendering UML preview…" forever. Force a resolution so the
    // user always lands on a retryable error state instead of an infinite spinner.
    if (!hasSource || !previewUrl) return;
    const timeoutId = window.setTimeout(() => {
      setState((current) => {
        if (current !== "loading") return current;
        toast.error("PlantUML preview timed out. The renderer may be unreachable.", { id: "plantuml-preview" });
        return "error";
      });
    }, 20000);
    return () => window.clearTimeout(timeoutId);
  }, [hasSource, previewUrl, attempt]);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement === panel.current) await document.exitFullscreen();
      else await panel.current?.requestFullscreen();
    } catch { toast.error("Full screen is unavailable."); }
  };

  const saveSource = async () => {
    if (!onSave || !draft.trim() || !dirty) return;
    const saved = await onSave(draft);
    if (saved) {
      setSavedSource(draft);
      toast.success("PlantUML source saved.");
    }
  };

  const downloadSource = () => {
    const url = URL.createObjectURL(new Blob([draft], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slugify(projectName)}-use-cases.puml`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <section ref={panel} className={`flex min-h-[520px] min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/70 bg-background ${fullscreen ? "h-screen w-screen rounded-none" : ""}`}>
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          PlantUML source
          <span className={`rounded-full border px-2 py-0.5 text-[10px] ${unavailable ? "border-amber-500/30 bg-amber-500/10 text-amber-300" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"}`}>
            {unavailable ? "Not generated yet" : "Editable"}
          </span>
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">{projectName} · generated from the use case table</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1"><button type="button" className={buttonClass} aria-label="Zoom out" disabled={zoom <= 50} onClick={() => setZoom((value) => Math.max(50, value - 25))}><Minus className="size-3.5" /></button><button type="button" className={buttonClass} title="Reset zoom" onClick={() => setZoom(100)}>{zoom}%</button><button type="button" className={buttonClass} aria-label="Zoom in" disabled={zoom >= 250} onClick={() => setZoom((value) => Math.min(250, value + 25))}><Plus className="size-3.5" /></button></div>
        <button type="button" className={buttonClass} aria-expanded={sourceOpen} onClick={() => setSourceOpen((value) => !value)}><Code2 className="size-3.5" />{sourceOpen ? "Hide editor" : "Edit source"}</button>
        <button type="button" className={buttonClass} disabled={!dirty || busy} onClick={() => setDraft(savedSource)}><RotateCcw className="size-3.5" />Reset</button>
        <button type="button" className={`${buttonClass} border-primary/50 text-primary`} disabled={!dirty || busy || !onSave} onClick={() => void saveSource()}><Save className="size-3.5" />{busy ? "Saving…" : "Save source"}</button>
        <button type="button" className={buttonClass} onClick={downloadSource}><Download className="size-3.5" />Download .puml</button>
        <button type="button" className={buttonClass} onClick={() => void toggleFullscreen()}>{fullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}{fullscreen ? "Exit full screen" : "Full screen"}</button>
      </div>
    </header>
    {dirty ? <div role="status" className="border-b border-amber-500/30 bg-amber-500/5 px-4 py-2 text-xs text-amber-300">Unsaved UML changes. Save the source to keep them with this project.</div> : null}
    <div className={`grid min-h-0 flex-1 ${sourceOpen ? "grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px]" : "grid-cols-1"}`}>
      <div className="relative min-h-[390px] overflow-auto bg-white p-6 [scrollbar-gutter:stable]" tabIndex={0} role="region" aria-label="PlantUML preview" aria-busy={hasSource && state === "loading"}>
        {!hasSource ? <div className="flex min-h-72 flex-col items-center justify-center gap-2 text-sm text-gray-500"><p>No PlantUML has been generated yet.</p><p className="text-xs text-gray-400">Generate the use case model to create a diagram.</p></div> : null}
        {hasSource && state === "loading" ? <p role="status" className="absolute left-6 top-6 text-sm text-gray-500">Rendering UML preview…</p> : null}
        {hasSource && state === "error" ? <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-sm text-gray-600"><p>Preview unavailable. You can still edit or download the source.</p><button type="button" onClick={() => { setState("loading"); setAttempt((value) => value + 1); }} className="rounded-md border border-gray-300 px-3 py-2">Retry preview</button></div> : null}
        {/* The renderer returns an image; no remote markup is injected into the application DOM. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {hasSource && previewUrl ? <img key={`${previewUrl}-${attempt}`} src={previewUrl} alt={`${projectName} use case UML diagram preview`} referrerPolicy="no-referrer" onLoad={() => setState("ready")} onError={() => { setState("error"); toast.error("Could not load the PlantUML preview.", { id: "plantuml-preview" }); }} className={`mx-auto h-auto max-w-none ${state === "ready" ? "" : "hidden"}`} style={{ width: `${zoom}%` }} /> : null}
      </div>
      {sourceOpen ? <aside className="flex min-h-0 flex-col border-l border-border/70 bg-card/30">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-2"><span className="font-mono text-xs text-muted-foreground">{slugify(projectName)}-use-cases.puml</span><button type="button" className={buttonClass} aria-label="Copy PlantUML source" onClick={() => void navigator.clipboard.writeText(draft).then(() => toast.success("PlantUML source copied.")).catch(() => toast.error("Could not copy the source."))}><Copy className="size-3.5" /></button></div>
        <textarea value={draft} onChange={(event) => setDraft(event.target.value)} spellCheck={false} aria-label="Editable PlantUML source" className="min-h-[390px] min-w-0 flex-1 resize-none bg-transparent p-4 font-mono text-[11px] leading-5 text-foreground/90 outline-none focus:ring-2 focus:ring-inset focus:ring-primary/50" />
      </aside> : null}
    </div>
  </section>;
}

async function plantUmlSvgUrl(source: string) {
  try {
    if (typeof CompressionStream === "undefined") return plantUmlHexUrl(source);
    const stream = new CompressionStream("deflate-raw");
    const writer = stream.writable.getWriter();
    await writer.write(new TextEncoder().encode(source));
    await writer.close();
    const compressed = new Uint8Array(await new Response(stream.readable).arrayBuffer());
    return `https://www.plantuml.com/plantuml/svg/${encodePlantUml(compressed)}`;
  } catch {
    // Older browsers may not expose raw deflate. The hex endpoint remains a valid fallback.
    return plantUmlHexUrl(source);
  }
}

function plantUmlHexUrl(source: string) {
  const bytes = new TextEncoder().encode(source);
  const encoded = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `https://www.plantuml.com/plantuml/svg/~h${encoded}`;
}

function encodePlantUml(data: Uint8Array) {
  let output = "";
  for (let index = 0; index < data.length; index += 3) {
    const remaining = data.length - index;
    if (remaining === 1) {
      output += append1Byte(data[index]);
    } else if (remaining === 2) {
      output += append2Bytes(data[index], data[index + 1]);
    } else {
      output += append3Bytes(data[index], data[index + 1], data[index + 2]);
    }
  }
  return output;
}

function append1Byte(first: number) {
  return [first >> 2, (first & 0x3) << 4].map(encode6Bit).join("");
}

function append2Bytes(first: number, second: number) {
  return [first >> 2, ((first & 0x3) << 4) | (second >> 4), (second & 0xf) << 2]
    .map(encode6Bit)
    .join("");
}

function append3Bytes(first: number, second = 0, third = 0) {
  const c1 = first >> 2;
  const c2 = ((first & 0x3) << 4) | (second >> 4);
  const c3 = ((second & 0xf) << 2) | (third >> 6);
  const c4 = third & 0x3f;
  return [c1, c2, c3, c4].map(encode6Bit).join("");
}

function encode6Bit(value: number) {
  if (value < 10) return String.fromCharCode(48 + value);
  if (value < 36) return String.fromCharCode(65 + value - 10);
  if (value < 62) return String.fromCharCode(97 + value - 36);
  if (value === 62) return "-";
  if (value === 63) return "_";
  return "?";
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "reqtool";
}
