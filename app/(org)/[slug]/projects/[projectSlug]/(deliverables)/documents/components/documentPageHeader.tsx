"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { FileText } from "lucide-react";

import { cn } from "@/lib/utils";

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
    <header className="shrink-0 border-b border-border/60 pb-5">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={cn(
              "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-brand-mint",
            )}
            aria-hidden
          >
            <Icon className="size-[1.125rem]" />
          </div>

          <div className="min-w-0 flex-1">
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
    </header>
  );
}
