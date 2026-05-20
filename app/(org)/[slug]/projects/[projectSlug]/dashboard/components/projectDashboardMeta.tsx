"use client";

import { CalendarRange } from "lucide-react";

import {
  formatProjectBudget,
  formatProjectDateRange,
} from "@/lib/project/projectDisplay";
import { cn } from "@/lib/utils";

import { ProjectDashboardBudgetStat } from "./projectDashboardBudgetStat";

export function ProjectDashboardMeta({
  startDate,
  endDate,
  budget,
  className,
}: {
  startDate: string;
  endDate: string;
  budget: string | null;
  className?: string;
}) {
  const range = formatProjectDateRange(startDate, endDate);
  const hasBudget = formatProjectBudget(budget) !== "—";

  if (!range && !hasBudget) return null;

  return (
    <div
      className={cn("flex flex-wrap items-stretch gap-2.5 sm:gap-3", className)}
    >
      {range ? (
        <div className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-muted/30 px-3.5 py-2.5 text-sm text-foreground/90 shadow-sm">
          <CalendarRange
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <span className="font-medium tabular-nums">{range}</span>
        </div>
      ) : null}
      <ProjectDashboardBudgetStat budget={budget} />
    </div>
  );
}
