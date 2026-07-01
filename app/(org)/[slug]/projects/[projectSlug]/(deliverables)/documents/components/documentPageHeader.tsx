"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { FileText } from "lucide-react";

import { cn } from "@/lib/utils";

export const DOCUMENT_PAGE_ICON_COLUMN_CLASS = "size-10 shrink-0";
export const DOCUMENT_PAGE_CONTENT_RAIL_CLASS = "min-w-0 w-full flex-1";
export const DOCUMENT_PAGE_ICON_ROW_CLASS = "flex w-full gap-3";
/** Shared 2-col grid: icon rail + main content column (header text & body align). */
export const DOCUMENT_PAGE_GRID_CLASS =
  "grid w-full grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3";
export const DOCUMENT_PAGE_MAIN_COLUMN_CLASS = "col-start-2 min-w-0 w-full";
export const DOCUMENT_PAGE_SCROLL_CLASS =
  "flex min-h-0 flex-1 flex-col overflow-y-auto px-1 py-5 scrollbar-none sm:px-2 sm:py-6";
export const DOCUMENT_PAGE_INNER_CLASS = "flex w-full flex-col gap-5";

export function DocumentPageGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(DOCUMENT_PAGE_GRID_CLASS, className)}>{children}</div>
  );
}

export function DocumentPageMainColumn({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(DOCUMENT_PAGE_MAIN_COLUMN_CLASS, className)}>
      {children}
    </div>
  );
}

type DocumentPageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string | null;
  status?: string;
  meta?: ReactNode;
  action?: ReactNode;
  icon?: LucideIcon;
};

export function DocumentPageHeader({
  eyebrow,
  title,
  description,
  status,
  meta,
  action,
  icon: Icon = FileText,
}: DocumentPageHeaderProps) {
  return (
    <div className="col-span-2 border-b border-border/60 pb-5">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div
          className={cn(
            "min-w-0 flex-1 items-start",
            DOCUMENT_PAGE_ICON_ROW_CLASS,
          )}
        >
          <div
            className={cn(
              "mt-0.5 flex items-center justify-center rounded-xl bg-primary/12 text-brand-mint",
              DOCUMENT_PAGE_ICON_COLUMN_CLASS,
            )}
            aria-hidden
          >
            <Icon className="size-4.5" />
          </div>

          <div className={DOCUMENT_PAGE_CONTENT_RAIL_CLASS}>
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
              <p className="text-xs font-medium text-primary">{eyebrow}</p>
              {meta ? (
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  {meta}
                </div>
              ) : null}
            </div>
            <h1 className="mt-0.5 text-balance font-heading text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {description ? (
              <p className="mt-1 text-pretty text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
            {status ? (
              <p
                className="mt-1 text-sm text-muted-foreground"
                aria-live="polite"
              >
                {status}
              </p>
            ) : null}
          </div>
        </div>

        {action ? (
          <div className="flex shrink-0 items-center sm:pt-0.5">{action}</div>
        ) : null}
      </div>
    </div>
  );
}
