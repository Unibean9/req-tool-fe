"use client";

import type { ReactNode } from "react";
import { Handle, Position } from "@/components/ui/react-flow";
import { cn } from "@/lib/utils";

import {
  REQUIREMENT_CARD_SURFACE_CLASS,
  REQUIREMENT_KIND_STYLES,
} from "./requirementsModelConstants";
import type { RequirementNodeKind } from "./requirementsModelTypes";

const handleClass =
  "!size-2.5 !border-2 !border-background !bg-muted-foreground after:absolute after:inset-[-8px] after:content-['']";

const SECTION_DOT_CLASS = {
  green: "bg-emerald-400",
  blue: "bg-blue-400",
  purple: "bg-violet-400",
  gray: "bg-zinc-400",
  amber: "bg-amber-400",
  sky: "bg-blue-500",
  violet: "bg-violet-400",
  rose: "bg-rose-400",
} as const;

export type WorkItemSectionDot = keyof typeof SECTION_DOT_CLASS;

export function parseWorkItemLabels(raw: string): string[] {
  return raw
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function WorkItemFlowCard({
  kind,
  selected,
  widthClass = "w-[300px]",
  targetTop = false,
  targetLeft = false,
  sourceRight = false,
  sourceBottom = false,
  footer,
  children,
  className,
}: {
  kind: RequirementNodeKind;
  selected?: boolean;
  widthClass?: string;
  targetTop?: boolean;
  targetLeft?: boolean;
  sourceRight?: boolean;
  sourceBottom?: boolean;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const accent = REQUIREMENT_KIND_STYLES[kind];

  return (
    <div
      className={cn(
        "relative rounded-xl border shadow-lg transition-[border-color] duration-200",
        widthClass,
        REQUIREMENT_CARD_SURFACE_CLASS,
        "border-2",
        selected ? accent.borderSelected : accent.border,
        className
      )}
    >
      {targetTop ? (
        <Handle
          type="target"
          position={Position.Top}
          className={handleClass}
        />
      ) : null}
      {targetLeft ? (
        <Handle
          type="target"
          position={Position.Left}
          className={handleClass}
        />
      ) : null}
      {sourceRight ? (
        <Handle
          type="source"
          position={Position.Right}
          className={handleClass}
        />
      ) : null}
      {sourceBottom ? (
        <Handle
          type="source"
          position={Position.Bottom}
          id="quick-add"
          className={handleClass}
        />
      ) : null}

      <div className="px-3.5 py-3">{children}</div>
      {footer ? (
        <div className="border-t border-border/50 px-2 py-1.5">{footer}</div>
      ) : null}
    </div>
  );
}

export function WorkItemCardHeader({ children }: { children: ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

export function WorkItemCardBadgeRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-1.5">{children}</div>;
}

export function WorkItemCardTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-[15px] font-bold leading-snug tracking-tight text-foreground">
      {children}
    </h3>
  );
}

export function WorkItemCardDescription({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[12px] leading-relaxed text-muted-foreground",
        className
      )}
    >
      {children}
    </p>
  );
}

export function WorkItemLabelTags({ labels }: { labels: string }) {
  const tags = parseWorkItemLabels(labels);
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

export function WorkItemCardDivider() {
  return <hr className="my-3 border-border/60" />;
}

export function WorkItemCardSection({
  label,
  dot = "green",
  children,
}: {
  label: string;
  dot?: WorkItemSectionDot;
  children: ReactNode;
}) {
  return (
    <section className="space-y-1">
      <div className="flex items-center gap-1.5">
        <span
          className={cn("size-1.5 shrink-0 rounded-full", SECTION_DOT_CLASS[dot])}
          aria-hidden
        />
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="pl-3 text-[12px] leading-relaxed text-foreground/90">
        {children}
      </div>
    </section>
  );
}

export function WorkItemCardList({
  items,
  max = 3,
}: {
  items: string[];
  max?: number;
}) {
  const visible = items.filter(Boolean).slice(0, max);
  const rest = items.filter(Boolean).length - visible.length;
  if (visible.length === 0) return null;
  return (
    <ol className="list-decimal space-y-1 pl-4 marker:text-muted-foreground">
      {visible.map((text, i) => (
        <li key={`${i}-${text.slice(0, 12)}`} className="text-[12px] leading-snug">
          {text}
        </li>
      ))}
      {rest > 0 ? (
        <li className="list-none pl-0 text-[11px] text-muted-foreground">
          +{rest} more
        </li>
      ) : null}
    </ol>
  );
}
