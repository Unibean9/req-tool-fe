"use client";

import { Coins } from "lucide-react";

import { formatProjectBudget } from "@/lib/project/projectDisplay";
import { cn } from "@/lib/utils";

export function ProjectDashboardBudgetStat({
  budget,
  className,
}: {
  budget: string | null;
  className?: string;
}) {
  const amount = formatProjectBudget(budget);
  if (amount === "—") return null;

  return (
    <div
      className={cn(
        "inline-flex min-w-42 items-center gap-3 rounded-xl border border-border/70 bg-linear-to-br from-muted/50 to-card/80 px-3.5 py-2.5 shadow-sm",
        className
      )}
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/80 text-muted-foreground"
        aria-hidden
      >
        <Coins className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
          Ngân sách
        </p>
        <p className="mt-0.5 flex items-baseline gap-1.5 tabular-nums">
          <span className="text-base font-semibold tracking-tight text-foreground">
            {amount}
          </span>
          <span className="text-xs font-medium text-muted-foreground">VNĐ</span>
        </p>
      </div>
    </div>
  );
}
