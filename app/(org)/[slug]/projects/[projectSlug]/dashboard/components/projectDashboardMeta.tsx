"use client";

import { CalendarArrowDown, CalendarArrowUp, Coins } from "lucide-react";

import {
  formatProjectBudget,
  formatProjectIsoDate,
} from "@/lib/project/projectDisplay";
import { cn } from "@/lib/utils";

function ProjectDashboardMetaItem({
  label,
  value,
  icon: Icon,
  accent,
  suffix,
}: {
  label: string;
  value: string;
  icon: typeof CalendarArrowUp;
  accent: "mint" | "sky" | "amber";
  suffix?: string;
}) {
  const accentClass = {
    mint:
      "border-brand-mint/25 bg-brand-mint/10 text-brand-mint shadow-brand-mint/10",
    sky: "border-sky-500/25 bg-sky-500/10 text-sky-600 shadow-sky-500/10 dark:text-sky-300",
    amber:
      "border-amber-500/25 bg-amber-500/10 text-amber-600 shadow-amber-500/10 dark:text-amber-300",
  }[accent];

  return (
    <div className="group min-w-0 rounded-xl border border-border/65 bg-card/70 p-3 shadow-sm transition-[border-color,background-color,box-shadow] duration-200 ease-out hover:border-border hover:bg-card">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg border shadow-sm transition-transform duration-200 ease-out group-hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0",
            accentClass
          )}
          aria-hidden
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-1 flex min-w-0 items-baseline gap-1.5 tabular-nums">
            <span className="truncate text-sm font-semibold tracking-tight text-foreground sm:text-base">
              {value}
            </span>
            {suffix ? (
              <span className="shrink-0 text-xs font-medium text-muted-foreground">
                {suffix}
              </span>
            ) : null}
          </p>
        </div>
      </div>
    </div>
  );
}

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
  const start = formatProjectIsoDate(startDate);
  const end = formatProjectIsoDate(endDate);
  const amount = formatProjectBudget(budget);
  const hasBudget = amount !== "—";

  if (!start && !end && !hasBudget) return null;

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {start ? (
        <ProjectDashboardMetaItem
          label="Start Date"
          value={start}
          icon={CalendarArrowUp}
          accent="mint"
        />
      ) : null}
      {end ? (
        <ProjectDashboardMetaItem
          label="End Date"
          value={end}
          icon={CalendarArrowDown}
          accent="sky"
        />
      ) : null}
      {hasBudget ? (
        <ProjectDashboardMetaItem
          label="Budget"
          value={amount}
          icon={Coins}
          accent="amber"
          suffix="VND"
        />
      ) : null}
    </div>
  );
}
