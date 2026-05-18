"use client";

import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

import { PROJECT_NEW_STEPS } from "./projectNewSteps";

export type ProjectNewSidebarProps = {
  projectsHref: string;
  currentStepIndex: number;
  onStepSelect: (index: number) => void;
  className?: string;
};

export function ProjectNewSidebar({
  projectsHref,
  currentStepIndex,
  onStepSelect,
  className,
}: ProjectNewSidebarProps) {
  return (
    <aside
      className={cn(
        "flex w-[280px] shrink-0 flex-col border-r border-border/70 bg-card/30",
        className
      )}
    >
      <div className="shrink-0 px-6 pt-8 pb-6">
        <Link
          href={projectsHref}
          className="flex items-center gap-3 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45 rounded-lg"
          aria-label="Về danh sách dự án"
        >
          <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg ring-1 ring-border/50">
            <Image
              src="/Logo.png"
              alt=""
              width={40}
              height={40}
              className="size-10 object-contain"
              priority
            />
          </span>
          <p className="truncate font-heading text-base font-semibold tracking-tight text-foreground">
            Dự án mới
          </p>
        </Link>
      </div>

      <nav
        aria-label="Các bước tạo dự án"
        className="flex min-h-0 flex-1 flex-col px-6 py-6"
      >
        <ol className="grid h-full min-h-0 flex-1 grid-rows-3">
          {PROJECT_NEW_STEPS.map((step, index) => {
            const isComplete = index < currentStepIndex;
            const isActive = index === currentStepIndex;
            const isPending = index > currentStepIndex;
            const canSelect = index <= currentStepIndex;
            const isLast = index === PROJECT_NEW_STEPS.length - 1;

            return (
              <li key={step.title} className="relative flex items-start gap-3">
                {!isLast ? (
                  <span
                    className={cn(
                      "absolute top-9 bottom-0 left-3.75 w-px -translate-x-1/2",
                      isComplete ? "bg-primary/50" : "bg-border"
                    )}
                    aria-hidden
                  />
                ) : null}
                <button
                  type="button"
                  disabled={!canSelect}
                  onClick={() => canSelect && onStepSelect(index)}
                  className={cn(
                    "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                    isComplete &&
                      "border-primary bg-primary text-primary-foreground",
                    isActive &&
                      "border-foreground bg-background text-foreground shadow-sm",
                    isPending &&
                      "border-border/80 bg-muted/40 text-muted-foreground",
                    canSelect && !isActive && "cursor-pointer hover:border-primary/60",
                    !canSelect && "cursor-default"
                  )}
                  aria-current={isActive ? "step" : undefined}
                  aria-label={`Bước ${index + 1}: ${step.title}`}
                >
                  {isComplete ? (
                    <Check className="size-4" strokeWidth={2.5} aria-hidden />
                  ) : (
                    index + 1
                  )}
                </button>
                <div className="min-w-0 pt-0.5 text-left">
                  <p
                    className={cn(
                      "text-sm font-semibold leading-tight",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {step.subtitle}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    </aside>
  );
}
