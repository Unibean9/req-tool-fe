"use client";

import { Eye, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { PROJECT_NEW_STEPS } from "../../project-new/components/projectNewSteps";

export function ProjectEditToolbar({
  currentStepIndex,
  onPreview,
  onExit,
  className,
}: {
  currentStepIndex: number;
  onPreview: () => void;
  onExit: () => void;
  className?: string;
}) {
  const step = PROJECT_NEW_STEPS[currentStepIndex];

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-between gap-4 px-5 pt-4 sm:px-8 lg:px-10",
        className
      )}
    >
      <p className="min-w-0 truncate text-sm text-muted-foreground lg:hidden">
        {step?.title ?? ""} · Step {currentStepIndex + 1}/{PROJECT_NEW_STEPS.length}
      </p>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-border/90 font-medium"
          onClick={onPreview}
        >
          <Eye className="size-4" aria-hidden />
          Preview
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-border/90 font-medium"
          onClick={onExit}
        >
          <LogOut className="size-4" aria-hidden />
          Exit
        </Button>
      </div>
    </div>
  );
}
