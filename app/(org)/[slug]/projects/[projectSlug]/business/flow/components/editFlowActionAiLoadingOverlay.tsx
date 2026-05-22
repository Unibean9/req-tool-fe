"use client";

import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";

const OVERLAY_EASE = [0.22, 1, 0.36, 1] as const;

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
          className="absolute inset-0 z-60 flex"
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: OVERLAY_EASE }}
            className={cn(
              "pointer-events-auto relative flex h-full w-full overflow-hidden",
              "bg-card/98 px-5 py-6 shadow-2xl shadow-primary/10 sm:px-10 sm:py-9"
            )}
          >
            <div className="flow-action-ai-scanline" aria-hidden />
            <div
              className="pointer-events-none absolute -top-24 left-1/2 size-96 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute right-10 bottom-8 size-80 rounded-full bg-primary/10 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute bottom-12 left-8 size-72 rounded-full bg-primary/[0.08] blur-3xl"
              aria-hidden
            />
            <FlowAmbientField />

            <div className="relative flex min-h-0 w-full flex-1 flex-col items-center justify-center text-center">
              <div className="flow-action-ai-title-stack max-w-md space-y-2">
                <p className="flow-action-ai-kicker text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
                  AI Activity Diagram Engine
                </p>
                <h2
                  id="flow-action-ai-overlay-title"
                  className="flow-action-ai-title-effect text-balance text-2xl font-bold tracking-tight text-foreground"
                >
                  Đang dựng Activity Diagram
                </h2>
                <p
                  id="flow-action-ai-overlay-desc"
                  className="text-sm leading-relaxed text-muted-foreground"
                >
                  AI đang đồng bộ activity diagram. Vui lòng chờ vài giây.
                </p>
                <div className="flow-action-ai-title-rail" aria-hidden>
                  <span />
                  <span />
                  <span />
                </div>
              </div>

              <FlowComposerEffect />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function FlowAmbientField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <svg
        className="flow-action-ai-ambient-map absolute inset-0 size-full text-primary"
        viewBox="0 0 1000 620"
        fill="none"
        preserveAspectRatio="none"
      >
        <path d="M80 136C214 84 302 94 426 134C552 176 654 164 824 92" />
        <path d="M92 516C240 448 398 470 522 522C652 576 782 558 930 486" />
        <path d="M126 326H304C398 326 398 264 492 264H842" />
        <path d="M158 238H338C430 238 438 386 540 386H890" />
      </svg>

      <span className="flow-action-ai-ambient-ring flow-action-ai-ambient-ring-0" />
      <span className="flow-action-ai-ambient-ring flow-action-ai-ambient-ring-1" />
      <span className="flow-action-ai-ambient-ring flow-action-ai-ambient-ring-2" />

      <span className="flow-action-ai-ambient-shard flow-action-ai-ambient-shard-0" />
      <span className="flow-action-ai-ambient-shard flow-action-ai-ambient-shard-1" />
      <span className="flow-action-ai-ambient-shard flow-action-ai-ambient-shard-2" />
      <span className="flow-action-ai-ambient-shard flow-action-ai-ambient-shard-3" />

      <span className="flow-action-ai-ambient-stream flow-action-ai-ambient-stream-0" />
      <span className="flow-action-ai-ambient-stream flow-action-ai-ambient-stream-1" />
      <span className="flow-action-ai-ambient-stream flow-action-ai-ambient-stream-2" />
      <span className="flow-action-ai-ambient-stream flow-action-ai-ambient-stream-3" />

      <span className="flow-action-ai-ambient-ribbon flow-action-ai-ambient-ribbon-0" />
      <span className="flow-action-ai-ambient-ribbon flow-action-ai-ambient-ribbon-1" />

      <div className="flow-action-ai-matrix-column flow-action-ai-matrix-column-0">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="flow-action-ai-matrix-column flow-action-ai-matrix-column-1">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="flow-action-ai-matrix-column flow-action-ai-matrix-column-2">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

function FlowComposerEffect() {
  return (
    <div
      className={cn(
        "flow-action-ai-composer relative mt-8 h-[min(58dvh,34rem)] min-h-80 w-full max-w-[86rem] overflow-hidden",
        "border-y border-primary/15"
      )}
      aria-hidden
    >
      <div className="flow-action-ai-composer-aura absolute inset-x-16 top-8 h-40 rounded-full bg-primary/[0.18] blur-3xl" />
      <div className="flow-action-ai-composer-grid absolute inset-0" />
      <div className="flow-action-ai-composer-beam absolute inset-y-0 left-0 w-1/3" />
      <div className="flow-action-ai-composer-diagonal flow-action-ai-composer-diagonal-0" />
      <div className="flow-action-ai-composer-diagonal flow-action-ai-composer-diagonal-1" />
      <div className="flow-action-ai-composer-radar absolute top-1/2 left-1/2 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full" />
      <div className="flow-action-ai-composer-halo absolute top-1/2 left-1/2 size-48 -translate-x-1/2 -translate-y-1/2 rounded-full" />
      <div className="flow-action-ai-composer-orbit-field flow-action-ai-composer-orbit-field-left absolute top-1/2 left-[8%] size-48 -translate-y-1/2 rounded-full" />
      <div className="flow-action-ai-composer-orbit-field flow-action-ai-composer-orbit-field-right absolute top-1/2 right-[8%] size-48 -translate-y-1/2 rounded-full" />
      <span className="flow-action-ai-composer-satellite flow-action-ai-composer-satellite-0" />
      <span className="flow-action-ai-composer-satellite flow-action-ai-composer-satellite-1" />
      <span className="flow-action-ai-composer-satellite flow-action-ai-composer-satellite-2" />
      <span className="flow-action-ai-composer-satellite flow-action-ai-composer-satellite-3" />
      <div className="flow-action-ai-composer-data-stack flow-action-ai-composer-data-stack-left">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="flow-action-ai-composer-data-stack flow-action-ai-composer-data-stack-right">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="absolute top-4 left-4 flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-primary" />
        <span className="size-1.5 rounded-full bg-primary/50" />
        <span className="size-1.5 rounded-full bg-primary/25" />
      </div>
      <div className="absolute top-4 right-4 flex gap-1">
        <span className="flow-action-ai-composer-meter flow-action-ai-composer-meter-0" />
        <span className="flow-action-ai-composer-meter flow-action-ai-composer-meter-1" />
        <span className="flow-action-ai-composer-meter flow-action-ai-composer-meter-2" />
        <span className="flow-action-ai-composer-meter flow-action-ai-composer-meter-3" />
      </div>
      <div className="absolute right-8 bottom-[4.5rem] flex h-16 items-end gap-1.5">
        <span className="flow-action-ai-composer-wave flow-action-ai-composer-wave-0" />
        <span className="flow-action-ai-composer-wave flow-action-ai-composer-wave-1" />
        <span className="flow-action-ai-composer-wave flow-action-ai-composer-wave-2" />
        <span className="flow-action-ai-composer-wave flow-action-ai-composer-wave-3" />
        <span className="flow-action-ai-composer-wave flow-action-ai-composer-wave-4" />
      </div>
      <div className="absolute bottom-[4.5rem] left-8 flex h-16 items-end gap-1.5">
        <span className="flow-action-ai-composer-wave flow-action-ai-composer-wave-2" />
        <span className="flow-action-ai-composer-wave flow-action-ai-composer-wave-4" />
        <span className="flow-action-ai-composer-wave flow-action-ai-composer-wave-1" />
        <span className="flow-action-ai-composer-wave flow-action-ai-composer-wave-3" />
      </div>

      <svg
        className="relative size-full text-primary"
        viewBox="0 0 520 192"
        fill="none"
      >
        <defs>
          <linearGradient id="flow-composer-glow" x1="52" y1="96" x2="468" y2="96">
            <stop stopColor="currentColor" stopOpacity="0" />
            <stop offset="0.5" stopColor="currentColor" stopOpacity="1" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
          <filter id="flow-composer-blur" x="-20%" y="-80%" width="140%" height="260%">
            <feGaussianBlur stdDeviation="4.5" />
          </filter>
        </defs>

        <g className="text-primary">
          <path
            className="stroke-current/15"
            d="M52 56H172C218 56 214 96 260 96H468"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            className="stroke-current/15"
            d="M52 96H468"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            className="stroke-current/15"
            d="M52 136H172C218 136 214 96 260 96H468"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            className="stroke-current/10"
            d="M116 32V160M260 22V170M404 32V160"
            strokeWidth="1"
            strokeLinecap="round"
            strokeDasharray="2 10"
          />

          <path
            className="flow-action-ai-composer-path flow-action-ai-composer-path-a"
            d="M52 56H172C218 56 214 96 260 96H468"
            stroke="url(#flow-composer-glow)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            className="flow-action-ai-composer-path flow-action-ai-composer-path-b"
            d="M52 96H468"
            stroke="url(#flow-composer-glow)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            className="flow-action-ai-composer-path flow-action-ai-composer-path-c"
            d="M52 136H172C218 136 214 96 260 96H468"
            stroke="url(#flow-composer-glow)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          <circle className="flow-action-ai-composer-node" cx="92" cy="56" r="5" />
          <circle className="flow-action-ai-composer-node" cx="92" cy="96" r="5" />
          <circle className="flow-action-ai-composer-node" cx="92" cy="136" r="5" />
          <circle className="flow-action-ai-composer-node" cx="428" cy="56" r="5" />
          <circle className="flow-action-ai-composer-node" cx="428" cy="96" r="5" />
          <circle className="flow-action-ai-composer-node" cx="428" cy="136" r="5" />
          <circle className="flow-action-ai-composer-node flow-action-ai-composer-node-hot" cx="260" cy="36" r="4" />
          <circle className="flow-action-ai-composer-node flow-action-ai-composer-node-hot" cx="192" cy="96" r="4" />
          <circle className="flow-action-ai-composer-node flow-action-ai-composer-node-hot" cx="332" cy="136" r="4" />

          <circle
            className="flow-action-ai-composer-core-glow"
            cx="260"
            cy="96"
            r="24"
            fill="currentColor"
            filter="url(#flow-composer-blur)"
          />
          <circle className="flow-action-ai-composer-core-ring" cx="260" cy="96" r="30" />
          <circle className="flow-action-ai-composer-core-ring flow-action-ai-composer-core-ring-outer" cx="260" cy="96" r="42" />
          <circle className="flow-action-ai-composer-core" cx="260" cy="96" r="12" />
        </g>
      </svg>

      <span className="flow-action-ai-composer-spark flow-action-ai-composer-spark-a" />
      <span className="flow-action-ai-composer-spark flow-action-ai-composer-spark-b" />
      <span className="flow-action-ai-composer-spark flow-action-ai-composer-spark-c" />
      <span className="flow-action-ai-composer-particle flow-action-ai-composer-particle-0" />
      <span className="flow-action-ai-composer-particle flow-action-ai-composer-particle-1" />
      <span className="flow-action-ai-composer-particle flow-action-ai-composer-particle-2" />
      <span className="flow-action-ai-composer-particle flow-action-ai-composer-particle-3" />
      <span className="flow-action-ai-composer-particle flow-action-ai-composer-particle-4" />
      <span className="flow-action-ai-composer-particle flow-action-ai-composer-particle-5" />
      <span className="flow-action-ai-composer-particle flow-action-ai-composer-particle-6" />
      <span className="flow-action-ai-composer-particle flow-action-ai-composer-particle-7" />

      <div className="absolute right-4 bottom-4 left-4 grid grid-cols-5 gap-3">
        <span className="flow-action-ai-composer-chip flow-action-ai-composer-chip-0" />
        <span className="flow-action-ai-composer-chip flow-action-ai-composer-chip-1" />
        <span className="flow-action-ai-composer-chip flow-action-ai-composer-chip-2" />
        <span className="flow-action-ai-composer-chip flow-action-ai-composer-chip-1" />
        <span className="flow-action-ai-composer-chip flow-action-ai-composer-chip-2" />
      </div>
    </div>
  );
}
