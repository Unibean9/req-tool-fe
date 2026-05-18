"use client";

import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  workItemPriorityLabel,
  workItemPriorityPillClass,
  workItemStatusLabel,
  workItemStatusPillClass,
  WorkItemColoredPill,
} from "./requirementWorkItemLabels";

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
    <WorkItemColoredPill
      text={workItemPriorityLabel(priority)}
      colorClass={workItemPriorityPillClass(priority)}
    />
  );
}

export function RequirementStatusPill({ status }: { status: string }) {
  return (
    <WorkItemColoredPill
      text={workItemStatusLabel(status)}
      colorClass={workItemStatusPillClass(status)}
    />
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
