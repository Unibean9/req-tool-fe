"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ProjectDashboardSectionAccent =
  | "sky"
  | "orange"
  | "violet"
  | "teal"
  | "emerald"
  | "amber"
  | "fuchsia";

const ACCENT_DOT_CLASS: Record<ProjectDashboardSectionAccent, string> = {
  sky: "bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.45)]",
  orange: "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.45)]",
  violet: "bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.45)]",
  teal: "bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.45)]",
  emerald: "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.45)]",
  amber: "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.45)]",
  fuchsia: "bg-fuchsia-400 shadow-[0_0_10px_rgba(232,121,249,0.45)]",
};

export function ProjectDashboardSection({
  title,
  accent,
  children,
  className,
}: {
  title: string;
  accent: ProjectDashboardSectionAccent;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <h2 className="flex items-center gap-2.5 border-b border-border/50 pb-2 text-[11px] font-bold tracking-[0.12em] text-foreground uppercase">
        <span
          className={cn(
            "size-2 shrink-0 rounded-full",
            ACCENT_DOT_CLASS[accent]
          )}
          aria-hidden
        />
        {title}
      </h2>
      {children}
    </section>
  );
}
