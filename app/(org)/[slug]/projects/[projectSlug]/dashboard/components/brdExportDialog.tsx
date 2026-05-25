"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Download, FileText, RefreshCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

export type BrdExportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null while the BRD is being fetched from the API */
  markdown: string | null;
  loading?: boolean;
  projectName: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function buildPdfBlob(markdown: string, projectName: string): Promise<Blob> {
  const [{ pdf }, { BrdDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./brdPdfDocument"),
  ]);
  // BrdDocument wraps <Document>; cast satisfies pdf()'s ReactElement<DocumentProps> param.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return pdf(React.createElement(BrdDocument, { markdown, projectName }) as any).toBlob();
}

// ── Markdown components (custom styling without @tailwindcss/typography) ─────

const mdComponents: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  h1: ({ children }) => (
    <h1 className="mb-3 mt-6 border-b border-primary/30 pb-2 text-xl font-bold text-primary first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-5 border-l-4 border-primary pl-3 text-base font-bold text-foreground first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1.5 mt-4 text-sm font-bold text-foreground first:mt-0">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mb-1 mt-3 text-xs font-bold uppercase tracking-wide text-muted-foreground first:mt-0">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="mb-3 text-sm leading-relaxed text-foreground last:mb-0">{children}</p>
  ),
  ul: ({ children }) => <ul className="mb-3 space-y-1 pl-4">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 space-y-1 pl-4 [counter-reset:list]">{children}</ol>,
  li: ({ children }) => (
    <li className="flex gap-2 text-sm text-foreground before:mt-1.5 before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:bg-primary">
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
  hr: () => <hr className="my-4 border-border/60" />,
  code: ({ children }) => (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
      {children}
    </code>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-4 border-primary/40 pl-4 text-sm italic text-muted-foreground">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="mb-3 overflow-x-auto rounded border border-border">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-border bg-muted/50 px-3 py-2 text-left text-xs font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => {
    const text = typeof children === "string" ? children : String(children ?? "");
    const lo = text.toLowerCase().trim();
    const priorityCls =
      lo === "high" || lo === "critical"
        ? "font-semibold text-red-500"
        : lo === "medium" || lo === "normal"
          ? "font-semibold text-amber-500"
          : lo === "low" || lo === "minor"
            ? "font-semibold text-primary"
            : "";
    return (
      <td className={`border-b border-border/50 px-3 py-2 text-xs last:border-b-0 ${priorityCls}`}>
        {children}
      </td>
    );
  },
};

// ── Scan animation overlay ────────────────────────────────────────────────────

function ScanOverlay({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="scan"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6 } }}
          className="pointer-events-none absolute inset-0 z-10 overflow-hidden backdrop-blur-[3px]"
          style={{ background: "rgba(9,20,19,0.72)" }}
        >
          {/* Subtle grid */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(64,138,113,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(64,138,113,0.06) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          {/* Wide glow sweep — trails the primary line */}
          <motion.div
            className="absolute left-0 right-0 h-48"
            style={{
              top: 0,
              background:
                "linear-gradient(180deg, transparent 0%, rgba(64,138,113,0.05) 30%, rgba(64,138,113,0.18) 60%, rgba(64,138,113,0.05) 85%, transparent 100%)",
            }}
            animate={{ top: ["-12rem", "calc(100% + 2rem)", "-12rem"] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.4 }}
          />

          {/* Primary scan line */}
          <motion.div
            className="absolute left-0 right-0 h-0.5"
            style={{
              top: 0,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(64,138,113,0.2) 10%, #408a71 30%, #b0e4cc 50%, #408a71 70%, rgba(64,138,113,0.2) 90%, transparent 100%)",
              boxShadow:
                "0 0 22px 7px rgba(64,138,113,0.55), 0 0 2px 0 rgba(176,228,204,0.9)",
            }}
            animate={{ top: ["-2px", "calc(100% + 2px)", "-2px"] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.4 }}
          />

          {/* Secondary line — counter direction, dimmer, offset timing */}
          <motion.div
            className="absolute left-0 right-0 h-px"
            style={{
              top: "100%",
              background:
                "linear-gradient(90deg, transparent 0%, transparent 20%, rgba(64,138,113,0.5) 40%, rgba(176,228,204,0.65) 50%, rgba(64,138,113,0.5) 60%, transparent 80%, transparent 100%)",
              boxShadow: "0 0 8px 2px rgba(64,138,113,0.28)",
              opacity: 0.5,
            }}
            animate={{ top: ["calc(100% + 2px)", "-2px", "calc(100% + 2px)"] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
          />

          {/* Center status */}
          <div className="flex h-full items-center justify-center">
            <motion.div
              className="flex flex-col items-center gap-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.18, duration: 0.4, ease: "easeOut" }}
            >
              {/* Rings */}
              <div className="relative flex size-16 items-center justify-center">
                {/* Pulse ring */}
                <motion.div
                  className="absolute size-16 rounded-full border border-primary/25"
                  animate={{ scale: [1, 1.45, 1], opacity: [0.65, 0, 0.65] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
                />
                {/* Outer rotating ring */}
                <motion.div
                  className="absolute size-12 rounded-full border-[1.5px]"
                  style={{
                    borderColor: "transparent",
                    borderTopColor: "#408a71",
                    borderRightColor: "rgba(64,138,113,0.22)",
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.7, repeat: Infinity, ease: "linear" }}
                />
                {/* Inner counter-rotating ring */}
                <motion.div
                  className="absolute size-7 rounded-full border"
                  style={{
                    borderColor: "transparent",
                    borderTopColor: "#b0e4cc",
                    borderLeftColor: "rgba(176,228,204,0.32)",
                  }}
                  animate={{ rotate: -360 }}
                  transition={{ duration: 2.3, repeat: Infinity, ease: "linear" }}
                />
                {/* Center dot */}
                <motion.div
                  className="size-2 rounded-full bg-primary"
                  animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.4, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>

              {/* Label pill */}
              <motion.div
                className="rounded-full border border-primary/30 bg-background/85 px-5 py-2 shadow-lg backdrop-blur-sm"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="text-[11px] font-medium tracking-wide text-primary">
                  Generating PDF…
                </span>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Main dialog ───────────────────────────────────────────────────────────────

export function BrdExportDialog({
  open,
  onOpenChange,
  markdown,
  loading = false,
  projectName,
}: BrdExportDialogProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const pdfUrlRef = useRef<string | null>(null);

  const mdFileName = "BRD Template.md";
  const pdfFileName = "BRD Template.pdf";

  // Revoke blob URL on unmount only
  useEffect(() => {
    return () => {
      if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
    };
  }, []);

  // Reset PDF state in the open-change handler, not an effect
  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        if (pdfUrlRef.current) {
          URL.revokeObjectURL(pdfUrlRef.current);
          pdfUrlRef.current = null;
        }
        setPdfUrl(null);
        setConverting(false);
      }
      onOpenChange(next);
    },
    [onOpenChange]
  );

  const handleConvert = useCallback(async () => {
    if (converting || !markdown) return;
    setConverting(true);
    try {
      const blob = await buildPdfBlob(markdown, projectName);
      if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
      const url = URL.createObjectURL(blob);
      pdfUrlRef.current = url;
      setPdfUrl(url);
    } finally {
      setConverting(false);
    }
  }, [converting, markdown, projectName]);

  const handleDownloadMd = useCallback(() => {
    if (!markdown) return;
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    downloadBlob(blob, mdFileName);
  }, [markdown, mdFileName]);

  const handleDownloadPdf = useCallback(async () => {
    if (!markdown) return;
    if (pdfUrl) {
      const a = document.createElement("a");
      a.href = pdfUrl;
      a.download = pdfFileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }
    setConverting(true);
    try {
      const blob = await buildPdfBlob(markdown, projectName);
      if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
      const url = URL.createObjectURL(blob);
      pdfUrlRef.current = url;
      setPdfUrl(url);
      downloadBlob(blob, pdfFileName);
    } finally {
      setConverting(false);
    }
  }, [pdfUrl, pdfFileName, markdown, projectName]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="h-[92vh] w-[95vw] max-w-[95vw] overflow-hidden sm:max-w-[95vw]"
        contentClassName="flex h-full flex-col overflow-hidden p-0"
        showCloseButton={false}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-border/70 bg-background px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <FileText className="size-3.5 text-primary-foreground" />
            </div>
            <DialogTitle className="text-sm font-semibold">
              BRD Template — {projectName}
            </DialogTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 rounded-lg px-3 text-xs"
              onClick={handleDownloadMd}
              disabled={loading || !markdown}
            >
              <Download className="size-3" />
              Download .md
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 rounded-lg px-3 text-xs"
              onClick={() => void handleDownloadPdf()}
              disabled={converting || loading || !markdown}
            >
              <Download className="size-3" />
              Download .pdf
            </Button>
            <DialogClose
              render={
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <path
                      d="M1 1L13 13M13 1L1 13"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="sr-only">Close</span>
                </button>
              }
            />
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Left – Markdown preview */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden border-r border-border/60">
            <div className="flex items-center gap-2 border-b border-border/50 bg-muted/30 px-4 py-2">
              <span
                className={cn(
                  "size-1.5 rounded-full transition-colors",
                  loading ? "animate-pulse bg-amber-400" : "bg-primary"
                )}
              />
              <span className="text-[11px] font-medium text-muted-foreground">
                {loading ? "Loading content…" : "Markdown"}
              </span>
            </div>
            <ScrollArea className="min-h-0 flex-1">
              {loading || !markdown ? (
                <div className="space-y-3 px-8 py-6">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-3 animate-pulse rounded bg-muted"
                      style={{ width: `${55 + ((i * 37) % 45)}%` }}
                    />
                  ))}
                </div>
              ) : (
                <div className="px-8 py-6">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                    {markdown}
                  </ReactMarkdown>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Middle – Convert button */}
          <div className="flex w-14 shrink-0 flex-col items-center justify-center gap-3 bg-muted/10">
            <motion.button
              type="button"
              onClick={() => void handleConvert()}
              disabled={converting || loading || !markdown}
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-full border bg-background shadow-sm",
                "transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
              whileTap={!converting ? { scale: 0.88 } : undefined}
              whileHover={!converting ? { scale: 1.08 } : undefined}
              title={pdfUrl ? "Regenerate PDF" : "Generate PDF"}
            >
              <AnimatePresence mode="wait" initial={false}>
                {converting ? (
                  <motion.div
                    key="spin"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
                  />
                ) : pdfUrl ? (
                  <motion.div
                    key="refresh"
                    initial={{ opacity: 0, rotate: 90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <RefreshCcw className="size-4" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="arrow"
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 4 }}
                  >
                    <ChevronRight className="size-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
            <span
              className="select-none text-[10px] leading-snug text-muted-foreground"
              style={{ writingMode: "vertical-lr" }}
            >
              {converting ? "Generating…" : pdfUrl ? "Regenerate" : "Generate PDF"}
            </span>
          </div>

          {/* Right – PDF preview */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border/50 bg-muted/30 px-4 py-2">
              <span
                className={cn(
                  "size-1.5 rounded-full transition-colors",
                  pdfUrl ? "bg-emerald-500" : "bg-muted-foreground/30"
                )}
              />
              <span className="text-[11px] font-medium text-muted-foreground">PDF Preview</span>
            </div>
            <div className="relative flex-1 overflow-hidden">
              <ScanOverlay visible={converting} />

              {pdfUrl ? (
                <iframe
                  key={pdfUrl}
                  src={`${pdfUrl}#toolbar=0&navpanes=0`}
                  className="h-full w-full border-none"
                  title="BRD PDF Preview"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
                  <div className="flex h-16 w-14 items-end justify-center rounded-sm border-2 border-dashed border-muted-foreground/20 pb-2">
                    <FileText className="size-7 opacity-20" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">No PDF yet</p>
                    <p className="mt-1 text-xs opacity-60">Click the → button to generate a PDF from the markdown content</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
