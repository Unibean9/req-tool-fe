"use client";

import { cn } from "@/lib/utils";

/** Nhãn tiếng Việt cho status / priority (form + badge canvas). */

/** Trạng thái được phép chọn trong panel edit epic / feature / story. */
export const PANEL_EDITABLE_STATUSES = ["draft", "in_progress"] as const;
export type PanelEditableStatus = (typeof PANEL_EDITABLE_STATUSES)[number];

export function isPanelEditableStatus(
  status: string
): status is PanelEditableStatus {
  return (PANEL_EDITABLE_STATUSES as readonly string[]).includes(status);
}

export const WORK_ITEM_STATUS_LABELS_VI: Record<string, string> = {
  draft: "Nháp",
  active: "Đang làm",
  in_progress: "Đang xử lý",
  done: "Hoàn thành",
  archived: "Lưu trữ",
  rejected: "Từ chối",
  duplicate: "Trùng lặp",
  wont_fix: "Không sửa",
  deferred: "Hoãn",
};

export const WORK_ITEM_PRIORITY_LABELS_VI: Record<string, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  critical: "Khẩn cấp",
};

export function workItemStatusLabel(status: string): string {
  return WORK_ITEM_STATUS_LABELS_VI[status] ?? status;
}

export function workItemPriorityLabel(priority: string): string {
  return WORK_ITEM_PRIORITY_LABELS_VI[priority] ?? priority;
}

export const WORK_ITEM_STATUS_PILL_CLASS: Record<string, string> = {
  draft: "border-zinc-400/40 bg-zinc-500/15 text-zinc-700 dark:text-zinc-300",
  active: "border-sky-500/35 bg-sky-500/15 text-sky-800 dark:text-sky-300",
  in_progress: "border-sky-500/35 bg-sky-500/15 text-sky-800 dark:text-sky-300",
  done: "border-emerald-500/35 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
  archived: "border-zinc-400/40 bg-zinc-500/10 text-muted-foreground",
  rejected: "border-red-500/40 bg-red-500/15 text-red-800 dark:text-red-300",
  duplicate: "border-amber-500/40 bg-amber-500/15 text-amber-900 dark:text-amber-300",
  wont_fix: "border-slate-500/40 bg-slate-500/15 text-slate-700 dark:text-slate-300",
  deferred:
    "border-violet-500/35 bg-violet-500/15 text-violet-800 dark:text-violet-300",
};

export const WORK_ITEM_PRIORITY_PILL_CLASS: Record<string, string> = {
  low: "border-border/70 bg-muted/60 text-muted-foreground",
  medium:
    "border-amber-500/30 bg-amber-500/15 text-amber-800 dark:text-amber-300",
  high: "border-orange-500/35 bg-orange-500/15 text-orange-800 dark:text-orange-300",
  critical:
    "border-red-500/50 bg-red-500/25 font-semibold text-red-800 dark:text-red-200",
};

export function workItemStatusPillClass(status: string): string {
  return WORK_ITEM_STATUS_PILL_CLASS[status] ?? WORK_ITEM_STATUS_PILL_CLASS.draft!;
}

export function workItemPriorityPillClass(priority: string): string {
  return (
    WORK_ITEM_PRIORITY_PILL_CLASS[priority] ?? WORK_ITEM_PRIORITY_PILL_CLASS.low!
  );
}

export function WorkItemColoredPill({
  text,
  colorClass,
  className,
}: {
  text: string;
  colorClass: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold leading-none",
        colorClass,
        className
      )}
    >
      {text}
    </span>
  );
}
