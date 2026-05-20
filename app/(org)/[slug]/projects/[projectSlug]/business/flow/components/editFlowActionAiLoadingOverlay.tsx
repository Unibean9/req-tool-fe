"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Layers, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

const OVERLAY_EASE = [0.22, 1, 0.36, 1] as const;

const SWIMLANE_LANE_LABELS = ["Actor A", "Actor B", "Hệ thống"] as const;
const LANE_PULSE_CLASS = [
  "flow-action-ai-lane-pulse-0",
  "flow-action-ai-lane-pulse-1",
  "flow-action-ai-lane-pulse-2",
] as const;

type EditFlowActionAiLoadingOverlayProps = {
  open: boolean;
};

/** Lớp phủ trong dialog — chặn tương tác khi AI/BE khởi tạo swimlane. */
export function EditFlowActionAiLoadingOverlay({
  open,
}: EditFlowActionAiLoadingOverlayProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="flow-action-ai-overlay"
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-labelledby="flow-action-ai-overlay-title"
          aria-describedby="flow-action-ai-overlay-desc"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: OVERLAY_EASE }}
          className="absolute inset-0 z-60 flex items-center justify-center p-4 sm:p-6"
        >
          <div
            className="pointer-events-auto absolute inset-0 bg-background/85 backdrop-blur-lg"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(to_right,hsl(var(--border)/0.45)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.45)_1px,transparent_1px)] [background-size:24px_24px]"
            aria-hidden
          />

          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.32, ease: OVERLAY_EASE }}
            className={cn(
              "pointer-events-auto relative w-full max-w-md overflow-hidden rounded-2xl border border-primary/25",
              "bg-card/98 px-6 py-7 shadow-2xl shadow-primary/15 sm:px-8 sm:py-8"
            )}
          >
            <div
              className="pointer-events-none absolute -top-20 left-1/2 size-56 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl"
              aria-hidden
            />

            <div className="relative flex flex-col items-center text-center">
              <div className="relative mb-6 flex size-20 items-center justify-center">
                <svg
                  className="flow-action-ai-ring-spin absolute inset-0 size-full motion-safe:opacity-100"
                  viewBox="0 0 80 80"
                  aria-hidden
                >
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="none"
                    className="stroke-primary/15"
                    strokeWidth="3"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="none"
                    className="stroke-primary"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="56 160"
                  />
                </svg>
                <span
                  className={cn(
                    "relative flex size-12 items-center justify-center rounded-xl",
                    "bg-linear-to-br from-primary/30 via-primary/15 to-violet-500/25",
                    "ring-1 ring-primary/30"
                  )}
                >
                  <Sparkles
                    className="flow-action-ai-icon-pulse size-6 text-primary motion-safe:opacity-100"
                    aria-hidden
                  />
                </span>
              </div>

              <SwimlaneDiagramPreview />

              <div className="mt-6 space-y-2">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
                  AI · Flow engine
                </p>
                <h2
                  id="flow-action-ai-overlay-title"
                  className="text-balance text-xl font-bold tracking-tight text-foreground sm:text-[1.35rem]"
                >
                  Đang khởi tạo Swimlane Diagram
                </h2>
                <p
                  id="flow-action-ai-overlay-desc"
                  className="text-pretty text-sm leading-relaxed text-muted-foreground"
                >
                  Đồng bộ actions, lanes, nodes và luồng điều khiển. Quá trình có
                  thể mất vài giây — vui lòng không đóng cửa sổ.
                </p>
              </div>

              <div
                className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-muted/80"
                aria-hidden
              >
                <div className="relative h-full w-full overflow-hidden rounded-full">
                  <div className="flow-action-ai-bar-slide absolute inset-y-0 left-0 w-2/5 rounded-full bg-primary/80 motion-safe:opacity-100" />
                  <div className="flow-action-ai-shimmer absolute inset-0 bg-linear-to-r from-transparent via-primary/25 to-transparent motion-safe:opacity-100" />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function SwimlaneDiagramPreview() {
  return (
    <div
      className="w-full max-w-[17.5rem] rounded-xl border border-border/70 bg-muted/25 p-3 shadow-inner"
      aria-hidden
    >
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
        <Layers className="size-3 shrink-0 text-primary/80" aria-hidden />
        <span className="font-semibold">Swimlane preview</span>
      </div>
      <div className="space-y-1.5">
        {SWIMLANE_LANE_LABELS.map((label, laneIndex) => (
          <div
            key={label}
            className={cn(
              "relative h-8 overflow-hidden rounded-md border border-border/60 bg-background/90",
              LANE_PULSE_CLASS[laneIndex]
            )}
          >
            <div className="absolute inset-y-0 left-0 w-[28%] border-r border-dashed border-primary/25 bg-primary/5" />
            <span className="absolute top-1 left-1.5 max-w-[26%] truncate text-[9px] font-medium text-muted-foreground">
              {label}
            </span>
            <motion.span
              className="absolute top-1/2 size-3.5 -translate-y-1/2 rounded-[3px] bg-primary shadow-sm ring-2 ring-background"
              initial={false}
              animate={{ left: ["10%", "68%", "10%"] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: laneIndex * 0.35,
              }}
              aria-hidden
            />
          </div>
        ))}
      </div>
    </div>
  );
}
