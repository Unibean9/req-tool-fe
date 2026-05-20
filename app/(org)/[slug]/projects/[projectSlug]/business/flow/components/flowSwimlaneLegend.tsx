"use client";

import type { ReactNode } from "react";

import {
  AlignHorizontalJustifyCenter,
  MousePointerClick,
  Move,
  Tag,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";

function LegendWaypointIcon({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-3.5 shrink-0 items-center justify-center",
        className
      )}
      aria-hidden
    >
      <span className="size-2.5 rounded-full border-2 border-primary bg-background shadow-sm" />
    </span>
  );
}

function LegendEdgeIcon({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-3.5 shrink-0 items-center justify-center",
        className
      )}
      aria-hidden
    >
      <svg viewBox="0 0 14 14" className="size-3.5 text-foreground/80">
        <path
          d="M1 7 H6 L6 3 L13 3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

type LegendItemProps = {
  icon: ReactNode;
  label: string;
};

function LegendItem({ icon, label }: LegendItemProps) {
  return (
    <li className="flex items-center gap-2 text-xs text-foreground/90">
      <span className="flex min-w-10 shrink-0 items-center justify-center overflow-visible">
        {icon}
      </span>
      <span className="min-w-0 text-pretty leading-snug">{label}</span>
    </li>
  );
}

/** Chú thích thao tác — góc trái dưới canvas swimlane. */
export function FlowSwimlaneLegend() {
  return (
    <div
      className="pointer-events-none absolute bottom-0 left-0 z-20 max-w-54 rounded-tr-lg border border-border/80 border-b-0 border-l-0 bg-card/95 pt-2 pr-2.5 pb-2 pl-2.5 shadow-md backdrop-blur-sm"
      aria-label="Chú thích thao tác swimlane"
    >
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Chú thích
      </p>
      <ul className="space-y-1.5">
        <LegendItem
          icon={<LegendWaypointIcon />}
          label="Kéo chấm tròn — chỉnh đường dây"
        />
        <LegendItem
          icon={
            <AlignHorizontalJustifyCenter
              className="size-3.5 text-foreground/75"
              aria-hidden
            />
          }
          label="Chuột phải đoạn lệch — căn một đường thẳng"
        />
        <LegendItem
          icon={
            <Trash2 className="size-3.5 text-foreground/75" aria-hidden />
          }
          label="Chuột phải trên chấm — xóa điểm gãy"
        />
        <LegendItem
          icon={<Tag className="size-3.5 text-foreground/75" aria-hidden />}
          label="Kéo chữ trên dây — đổi vị trí nhãn"
        />
        <LegendItem
          icon={<LegendEdgeIcon />}
          label="Double-click dây — thêm gãy khúc"
        />
        <LegendItem
          icon={
            <MousePointerClick
              className="size-3.5 text-foreground/75"
              aria-hidden
            />
          }
          label="Kéo đầu dây — đổi điểm nối node"
        />
        <LegendItem
          icon={
            <span
              className="inline-flex shrink-0 items-center justify-center gap-0.5"
              aria-hidden
            >
              <kbd className="rounded border border-border bg-muted px-1 py-px text-[8px] font-medium leading-none whitespace-nowrap">
                Space
              </kbd>
              <Move className="size-3 shrink-0 text-foreground/75" />
            </span>
          }
          label="Giữ Space + kéo — di chuyển canvas"
        />
      </ul>
    </div>
  );
}
