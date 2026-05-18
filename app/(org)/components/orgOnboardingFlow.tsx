"use client";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

import { OrgOnboardingIntro } from "./orgOnboardingIntro";

type OrgOnboardingFlowProps = {
  onComplete: () => void;
};

function OrgOnboardingAtmosphere({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 overflow-hidden bg-brand-abyss"
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0.15 : 0.45 }}
    >
      <motion.div
        className="absolute inset-0 overflow-visible opacity-40"
        style={{
          backgroundImage: [
            "linear-gradient(color-mix(in oklab, var(--brand-jade) 12%, transparent) 1px, transparent 1px)",
            "linear-gradient(90deg, color-mix(in oklab, var(--brand-jade) 12%, transparent) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "72px 72px",
          maskImage:
            "radial-gradient(ellipse 75% 65% at 50% 50%, black 25%, transparent 80%)",
        }}
        animate={
          reducedMotion
            ? undefined
            : {
                backgroundPosition: ["0px 0px", "72px 72px"],
              }
        }
        transition={
          reducedMotion
            ? undefined
            : { duration: 28, repeat: Infinity, ease: "linear" }
        }
      />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_65%_at_18%_12%,color-mix(in_oklab,var(--brand-jade)_22%,transparent),transparent_58%)]" />
      <motion.div
        className="absolute -right-24 bottom-0 size-[min(52vw,28rem)] rounded-full bg-brand-mint/12 blur-[100px]"
        animate={
          reducedMotion
            ? undefined
            : { opacity: [0.45, 0.75, 0.45], scale: [1, 1.06, 1] }
        }
        transition={
          reducedMotion
            ? undefined
            : { duration: 9, repeat: Infinity, ease: "easeInOut" }
        }
      />
      <motion.div
        className="absolute -top-20 left-[8%] size-[min(40vw,22rem)] rounded-full bg-brand-canopy/25 blur-[90px]"
        animate={
          reducedMotion
            ? undefined
            : { opacity: [0.35, 0.55, 0.35], x: [0, 12, 0] }
        }
        transition={
          reducedMotion
            ? undefined
            : { duration: 11, repeat: Infinity, ease: "easeInOut" }
        }
      />

      <div
        className="absolute inset-0 opacity-[0.055] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_50%_at_50%_48%,color-mix(in_oklab,var(--brand-jade)_14%,transparent),transparent_72%)]" />
    </motion.div>
  );
}

export function OrgOnboardingFlow({ onComplete }: OrgOnboardingFlowProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className="fixed inset-0 z-100 flex min-h-dvh flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{
        opacity: 0,
        scale: reducedMotion ? 1 : 0.985,
        filter: reducedMotion ? "none" : "blur(10px)",
      }}
      transition={{ duration: reducedMotion ? 0.2 : 0.42, ease: [0.4, 0, 0.2, 1] }}
    >
      <OrgOnboardingAtmosphere reducedMotion={!!reducedMotion} />

      <div
        className={cn(
          "relative z-10 flex min-h-dvh w-full flex-1 flex-col overflow-visible",
          "ring-1 ring-inset ring-white/[0.04]"
        )}
      >
        <OrgOnboardingIntro onSkip={onComplete} onComplete={onComplete} />
      </div>
    </motion.div>
  );
}
