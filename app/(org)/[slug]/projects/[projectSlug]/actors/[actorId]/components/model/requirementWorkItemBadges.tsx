"use client";

import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  workItemPriorityLabel,
  workItemStatusLabel,
} from "./requirementWorkItemLabels";

const PRIORITY_PILL_CLASS: Record<string, string> = {
  low: "border-border/70 bg-muted/60 text-muted-foreground",
  medium:
    "border-amber-500/30 bg-amber-500/15 text-amber-800 dark:text-amber-300",
  high: "border-red-500/35 bg-red-500/15 text-red-700 dark:text-red-300",
  critical:
    "border-red-500/50 bg-red-500/25 font-semibold text-red-800 dark:text-red-200",
};

export function RequirementPrefixCode({ prefix }: { prefix: string }) {
  const code = prefix.trim();
  if (!code) return null;
  return (
    <p className="font-mono text-[11px] font-medium tracking-wide text-muted-foreground">
      {code}
    </p>
  );
}

export function RequirementPriorityPill({ priority }: { priority: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold",
        PRIORITY_PILL_CLASS[priority] ?? PRIORITY_PILL_CLASS.low
      )}
    >
      {workItemPriorityLabel(priority)}
    </span>
  );
}

export function RequirementStatusPill({ status }: { status: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-md border border-border/70 bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-foreground/90">
      {workItemStatusLabel(status)}
    </span>
  );
}

export function RequirementStoryPointsPill({ points }: { points: number }) {
  if (points <= 0) return null;
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md border border-border/70 bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-foreground/90">
      <Zap className="size-3 text-amber-500" aria-hidden />
      {points} pts
    </span>
  );
}

/** @deprecated dùng RequirementPrefixCode */
export function RequirementPrefixBadge({ prefix }: { prefix: string }) {
  return <RequirementPrefixCode prefix={prefix} />;
}

/** @deprecated dùng RequirementStatusPill */
export function RequirementStatusBadge({ status }: { status: string }) {
  return <RequirementStatusPill status={status} />;
}

/** @deprecated dùng RequirementPriorityPill */
export function RequirementPriorityBadge({ priority }: { priority: string }) {
  return <RequirementPriorityPill priority={priority} />;
}
