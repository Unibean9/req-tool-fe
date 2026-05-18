"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import SplitText from "@/components/ui/split-text";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ORG_ONBOARDING_SLIDES } from "./orgOnboardingMessages";

type OrgOnboardingIntroProps = {
  onSkip: () => void;
  onComplete: () => void;
};

const LINE_PAUSE_MS = 480;
const LAST_LINE_PAUSE_MS = 720;
const REDUCED_LINE_PAUSE_MS = 2200;
const REDUCED_LAST_PAUSE_MS = 2800;

const HEADLINE_CLASS =
  "font-heading !overflow-visible w-full text-pretty text-center font-bold leading-[1.1] tracking-[-0.02em] text-foreground text-[clamp(2rem,6.5vw,5.25rem)]";

function OnboardingTopProgress({
  total,
  activeIndex,
}: {
  total: number;
  activeIndex: number;
}) {
  return (
    <motion.div
      className="pointer-events-none absolute inset-x-0 top-0 z-20 flex h-0.5 gap-px px-0"
      role="progressbar"
      aria-valuenow={activeIndex + 1}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Bước ${activeIndex + 1} trên ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-full flex-1 transition-colors duration-500",
            i <= activeIndex ? "bg-brand-mint/90" : "bg-brand-jade/20"
          )}
        />
      ))}
    </motion.div>
  );
}

export function OrgOnboardingIntro({ onSkip, onComplete }: OrgOnboardingIntroProps) {
  const reducedMotion = useReducedMotion();
  const [lineIndex, setLineIndex] = useState(0);
  const lineIndexRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  const onSkipRef = useRef(onSkip);

  const slides = ORG_ONBOARDING_SLIDES;
  const slide = slides[lineIndex] ?? slides[0]!;
  const total = slides.length;
  const linePause = reducedMotion ? REDUCED_LINE_PAUSE_MS : LINE_PAUSE_MS;
  const lastPause = reducedMotion ? REDUCED_LAST_PAUSE_MS : LAST_LINE_PAUSE_MS;

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onSkipRef.current = onSkip;
  }, [onSkip]);

  useEffect(() => {
    lineIndexRef.current = lineIndex;
  }, [lineIndex]);

  const handleLineComplete = useCallback(() => {
    const i = lineIndexRef.current;
    const last = slides.length - 1;
    if (i < last) {
      window.setTimeout(() => setLineIndex(i + 1), linePause);
    } else {
      window.setTimeout(() => onCompleteRef.current(), lastPause);
    }
  }, [linePause, lastPause, slides.length]);

  const advanceManually = useCallback(() => {
    const i = lineIndexRef.current;
    const last = slides.length - 1;
    if (i < last) {
      setLineIndex(i + 1);
    } else {
      onCompleteRef.current();
    }
  }, [slides.length]);

  return (
    <motion.div className="relative flex min-h-dvh w-full flex-1 flex-col overflow-visible">
      <OnboardingTopProgress total={total} activeIndex={lineIndex} />

      <div className="relative z-30 flex shrink-0 items-center justify-between px-5 pt-5 sm:px-8 sm:pt-7">
        <p
          className="font-mono text-[11px] tracking-[0.14em] text-brand-jade/70 uppercase tabular-nums"
          aria-hidden
        >
          <span className="text-brand-mint">{String(lineIndex + 1).padStart(2, "0")}</span>
          <span className="text-brand-jade/45"> / {String(total).padStart(2, "0")}</span>
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 px-3 text-muted-foreground hover:bg-white/5 hover:text-foreground"
          onClick={() => onSkipRef.current()}
        >
          Bỏ qua
        </Button>
      </div>

      <main className="flex min-h-0 flex-1 items-center justify-center overflow-visible px-5 py-4 sm:px-10 sm:py-6 md:px-14">
        <div className="relative w-full max-w-[min(100%,52rem)] overflow-visible">
          <AnimatePresence mode="wait">
            <motion.div
              key={lineIndex}
              role="presentation"
              className="flex w-full flex-col items-center overflow-visible py-2 text-center"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
              animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
              transition={{
                duration: reducedMotion ? 0.15 : 0.42,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <p className="mb-4 font-mono text-[11px] font-medium tracking-[0.2em] text-brand-mint uppercase sm:mb-5 sm:text-xs">
                {slide.kicker}
              </p>

              <div className="w-full overflow-visible px-1 py-1 [&_.split-parent]:!overflow-visible [&_.split-word]:inline-block [&_.split-word]:overflow-visible">
              {reducedMotion ? (
                <h2 className={HEADLINE_CLASS}>{slide.headline}</h2>
              ) : (
                <SplitText
                  text={slide.headline}
                  tag="h2"
                  splitType="words"
                  clipOverflow={false}
                  className={HEADLINE_CLASS}
                  delay={64}
                  duration={1.2}
                  ease="power2.out"
                  from={{ opacity: 0, y: 12 }}
                  to={{ opacity: 1, y: 0 }}
                  threshold={0.05}
                  rootMargin="160px 0px 50% 0px"
                  textAlign="center"
                  onLetterAnimationComplete={handleLineComplete}
                />
              )}
              </div>

              <motion.p
                className="mx-auto mt-5 max-w-[min(100%,36rem)] overflow-visible text-pretty text-center text-base leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg sm:leading-relaxed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: reducedMotion ? 0 : 0.2,
                  duration: reducedMotion ? 0.15 : 0.45,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {slide.detail}
              </motion.p>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <footer className="relative z-30 flex shrink-0 flex-col items-center px-5 pb-8 pt-2 sm:pb-10">
        <Button
          type="button"
          size="lg"
          className="h-12 min-w-44 gap-2 rounded-xl px-8 text-base font-semibold shadow-none"
          onClick={advanceManually}
        >
          {lineIndex < total - 1 ? "Tiếp tục" : "Bắt đầu"}
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </footer>

      {reducedMotion ? (
        <ReducedMotionAutoAdvance
          lineIndex={lineIndex}
          total={total}
          onAdvance={handleLineComplete}
          pauseMs={linePause}
          lastPauseMs={lastPause}
        />
      ) : null}
    </motion.div>
  );
}

function ReducedMotionAutoAdvance({
  lineIndex,
  total,
  onAdvance,
  pauseMs,
  lastPauseMs,
}: {
  lineIndex: number;
  total: number;
  onAdvance: () => void;
  pauseMs: number;
  lastPauseMs: number;
}) {
  useEffect(() => {
    const delay = lineIndex < total - 1 ? pauseMs : lastPauseMs;
    const id = window.setTimeout(onAdvance, delay);
    return () => window.clearTimeout(id);
  }, [lineIndex, total, onAdvance, pauseMs, lastPauseMs]);

  return null;
}
