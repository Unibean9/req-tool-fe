"use client";

import {
  Activity,
  FileCheck,
  Shield,
  Sparkles,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { ACTOR_EPIC_PRIORITIES } from "@/lib/api/services/fetchActor";
import {
  NFR_CATEGORIES,
  type NfrCategory,
  type NfrPriority,
} from "@/lib/api/services/fetchNfr";
import { cn } from "@/lib/utils";

export type NfrCategoryFilter = NfrCategory | "all";
export type NfrPriorityFilter = NfrPriority | "all";

export const NFR_PRIORITY_LABELS_VI: Record<NfrPriority, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  critical: "Khẩn cấp",
};

export const NFR_PRIORITY_PILL_CLASS: Record<NfrPriority, string> = {
  low: "border-border/70 bg-muted/60 text-muted-foreground",
  medium:
    "border-amber-500/30 bg-amber-500/15 text-amber-800 dark:text-amber-300",
  high: "border-orange-500/35 bg-orange-500/15 text-orange-800 dark:text-orange-300",
  critical:
    "border-red-500/50 bg-red-500/25 font-semibold text-red-800 dark:text-red-200",
};

type NfrCategoryMeta = {
  label: string;
  badgeLabel: string;
  icon: LucideIcon;
  iconBoxClass: string;
  iconClass: string;
  badgeClass: string;
};

export const NFR_CATEGORY_META: Record<NfrCategory, NfrCategoryMeta> = {
  performance: {
    label: "Performance",
    badgeLabel: "PERFORMANCE",
    icon: Zap,
    iconBoxClass: "bg-[#FDF2E9] dark:bg-amber-950/45",
    iconClass: "text-[#C05621] dark:text-amber-400",
    badgeClass:
      "border-amber-500/25 bg-[#FDF2E9] text-[#9C4221] dark:bg-amber-950/55 dark:text-amber-300",
  },
  security: {
    label: "Security",
    badgeLabel: "SECURITY",
    icon: Shield,
    iconBoxClass: "bg-rose-50 dark:bg-rose-950/40",
    iconClass: "text-rose-700 dark:text-rose-400",
    badgeClass:
      "border-rose-500/25 bg-rose-50 text-rose-800 dark:bg-rose-950/55 dark:text-rose-300",
  },
  usability: {
    label: "Usability",
    badgeLabel: "USABILITY",
    icon: Sparkles,
    iconBoxClass: "bg-violet-50 dark:bg-violet-950/40",
    iconClass: "text-violet-700 dark:text-violet-400",
    badgeClass:
      "border-violet-500/25 bg-violet-50 text-violet-800 dark:bg-violet-950/55 dark:text-violet-300",
  },
  reliability: {
    label: "Reliability",
    badgeLabel: "RELIABILITY",
    icon: Activity,
    iconBoxClass: "bg-sky-50 dark:bg-sky-950/40",
    iconClass: "text-sky-700 dark:text-sky-400",
    badgeClass:
      "border-sky-500/25 bg-sky-50 text-sky-800 dark:bg-sky-950/55 dark:text-sky-300",
  },
  compliance: {
    label: "Compliance",
    badgeLabel: "COMPLIANCE",
    icon: FileCheck,
    iconBoxClass: "bg-emerald-50 dark:bg-emerald-950/40",
    iconClass: "text-emerald-700 dark:text-emerald-400",
    badgeClass:
      "border-emerald-500/25 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/55 dark:text-emerald-300",
  },
  maintainability: {
    label: "Maintainability",
    badgeLabel: "MAINTAINABILITY",
    icon: Wrench,
    iconBoxClass: "bg-slate-100 dark:bg-slate-800/60",
    iconClass: "text-slate-700 dark:text-slate-300",
    badgeClass:
      "border-slate-500/25 bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-300",
  },
};

export function nfrCategoryLabel(category: NfrCategory): string {
  return NFR_CATEGORY_META[category].label;
}

export function nfrPriorityLabel(priority: NfrPriority): string {
  return NFR_PRIORITY_LABELS_VI[priority] ?? priority;
}

export function nfrPriorityPillClass(priority: NfrPriority): string {
  return NFR_PRIORITY_PILL_CLASS[priority] ?? NFR_PRIORITY_PILL_CLASS.low;
}

export function NfrMetaBadge({
  text,
  className,
}: {
  text: string;
  className: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
        className
      )}
    >
      {text}
    </span>
  );
}

export function NfrPriorityBadge({ priority }: { priority: NfrPriority }) {
  return (
    <NfrMetaBadge
      text={nfrPriorityLabel(priority)}
      className={nfrPriorityPillClass(priority)}
    />
  );
}

export function nfrPriorityFilterLabel(value: NfrPriorityFilter): string {
  if (value === "all") return "Tất cả";
  return NFR_PRIORITY_LABELS_VI[value];
}

export function NfrCategoryOptionContent({
  category,
  className,
}: {
  category: NfrCategory;
  className?: string;
}) {
  const meta = NFR_CATEGORY_META[category];
  const Icon = meta.icon;
  return (
    <span className={cn("flex min-w-0 items-center gap-2", className)}>
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded",
          meta.iconBoxClass
        )}
        aria-hidden
      >
        <Icon className={cn("size-3", meta.iconClass)} />
      </span>
      <span className="truncate">{meta.label}</span>
    </span>
  );
}

export function NfrCategoryFilterDisplay({
  value,
  className,
}: {
  value: NfrCategoryFilter;
  className?: string;
}) {
  if (value === "all") {
    return <span className={cn("truncate", className)}>Tất cả</span>;
  }
  return <NfrCategoryOptionContent category={value} className={className} />;
}

export const NFR_CATEGORY_FILTER_OPTIONS: {
  value: NfrCategoryFilter;
  label: string;
}[] = [
  { value: "all", label: "Tất cả" },
  ...NFR_CATEGORIES.map((c) => ({
    value: c,
    label: NFR_CATEGORY_META[c].label,
  })),
];

export const NFR_PRIORITY_FILTER_OPTIONS: {
  value: NfrPriorityFilter;
  label: string;
}[] = [
  { value: "all", label: "Tất cả" },
  ...ACTOR_EPIC_PRIORITIES.map((p) => ({
    value: p,
    label: NFR_PRIORITY_LABELS_VI[p],
  })),
];
