"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ProjectEditFooterProps = {
  currentStepIndex: number;
  totalSteps: number;
  canGoBack: boolean;
  onBack: () => void;
  onCancel: () => void;
  isLastStep: boolean;
  nextDisabled: boolean;
  nextLoading: boolean;
  onNext: () => void;
  className?: string;
};

export function ProjectEditFooter({
  currentStepIndex,
  totalSteps,
  canGoBack,
  onBack,
  onCancel,
  isLastStep,
  nextDisabled,
  nextLoading,
  onNext,
  className,
}: ProjectEditFooterProps) {
  const progress =
    totalSteps > 0
      ? Math.min(100, Math.round(((currentStepIndex + 1) / totalSteps) * 100))
      : 0;

  return (
    <footer
      className={cn(
        "shrink-0 border-t border-border/60 bg-background px-5 py-4 sm:px-6 lg:px-8",
        className
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 sm:max-w-xs">
          <p className="text-sm font-medium text-foreground">
            Bước {currentStepIndex + 1} / {totalSteps}
          </p>
          <div
            className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label="Tiến độ chỉnh sửa dự án"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
          <Button
            type="button"
            variant="ghost"
            className="font-medium text-muted-foreground"
            onClick={onCancel}
            disabled={nextLoading}
          >
            Hủy
          </Button>
          {canGoBack ? (
            <Button
              type="button"
              variant="outline"
              className="gap-2 border-border/90 font-medium"
              onClick={onBack}
              disabled={nextLoading}
            >
              <ArrowLeft className="size-4" aria-hidden />
              Quay lại
            </Button>
          ) : null}
          <Button
            type="button"
            variant="default"
            disabled={nextDisabled || nextLoading}
            onClick={onNext}
            className="gap-2 font-semibold"
          >
            {nextLoading ? (
              "Đang lưu…"
            ) : isLastStep ? (
              "Lưu thay đổi"
            ) : (
              <>
                Tiếp theo
                <ArrowRight className="size-4" aria-hidden />
              </>
            )}
          </Button>
        </div>
      </div>
    </footer>
  );
}
