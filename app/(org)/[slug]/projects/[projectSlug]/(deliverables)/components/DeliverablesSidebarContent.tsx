"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Ban,
  CircleHelp,
  FileSearch,
  HelpCircle,
  LayoutDashboard,
  Lightbulb,
  Scale,
  Target,
  Users,
  UsersRound,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";

// ─── Sub-components ───────────────────────────────────────────────────────────

function SidebarSectionTitle({
  children,
  withDivider = false,
}: {
  children: string;
  withDivider?: boolean;
}) {
  return (
    <div
      className={cn(
        "px-1",
        withDivider && "mt-1 border-t border-border/70 pt-3"
      )}
    >
      <p className="flex items-center gap-2 px-1 pb-2 text-xs font-bold tracking-wide text-foreground/95 uppercase">
        <span
          className="h-3.5 w-0.5 shrink-0 rounded-full bg-brand-mint/90 shadow-[0_0_6px_color-mix(in_oklab,var(--brand-mint)_50%,transparent)]"
          aria-hidden
        />
        <span className="leading-snug">{children}</span>
      </p>
    </div>
  );
}

function SidebarNavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg border border-transparent bg-transparent px-2.5 py-2 text-left text-sm transition-[color,background-color,border-color,box-shadow] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring/45",
        active
          ? "border-primary/30 bg-(--chart-1)/10 font-medium text-foreground"
          : "text-muted-foreground hover:border-border/50 hover:bg-muted/50 hover:text-foreground"
      )}
    >
      <Icon className="size-4 shrink-0 opacity-85" aria-hidden />
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </Link>
  );
}

function pathActive(pathname: string, prefix: string): boolean {
  const p = pathname.split("?")[0] ?? "";
  if (!prefix.endsWith("/") && p === prefix) return true;
  return p === prefix || p.startsWith(`${prefix}/`);
}

// ─── Nav constants ────────────────────────────────────────────────────────────

const BRD_ARTIFACT_NAV = [
  { type: "research_output", label: "Research Output", icon: FileSearch },
  { type: "intent", label: "Intent", icon: Lightbulb },
  { type: "problem", label: "Problem", icon: AlertCircle },
  { type: "goal", label: "Goal", icon: Target },
  { type: "stakeholder", label: "Stakeholder", icon: UsersRound },
  { type: "constraint", label: "Constraint", icon: Ban },
  { type: "assumption", label: "Assumption", icon: HelpCircle },
  { type: "risk", label: "Risk", icon: AlertTriangle },
  { type: "open_question", label: "Open Question", icon: CircleHelp },
  { type: "capability", label: "Capability", icon: Zap },
  { type: "business_rule", label: "Business Rule", icon: Scale },
] as const;


// ─── Main component ───────────────────────────────────────────────────────────

export function DeliverablesSidebarContent({
  orgSlug,
  projectSlug,
}: {
  orgSlug: string;
  projectSlug: string;
}) {
  const pathname = usePathname() ?? "";
  const encOrg = encodeURIComponent(orgSlug);
  const encProj = encodeURIComponent(projectSlug);
  const base = `/${encOrg}/projects/${encProj}`;

  const nav = useMemo(
    () => ({
      dashboard: `${base}/dashboard`,
      members: `${base}/members`,
      artifactsBase: `${base}/artifacts`,
    }),
    [base]
  );

  return (
    <>
      <div className="shrink-0 space-y-1">
        <SidebarSectionTitle>Overview</SidebarSectionTitle>
        <div className="space-y-1 px-0.5">
          <SidebarNavLink
            href={nav.dashboard}
            label="Project overview"
            icon={LayoutDashboard}
            active={pathActive(pathname, nav.dashboard)}
          />
          <SidebarNavLink
            href={nav.members}
            label="Members (Organization)"
            icon={Users}
            active={pathActive(pathname, nav.members)}
          />
        </div>
      </div>

      <div className="shrink-0 space-y-1">
        <SidebarSectionTitle withDivider>BRD</SidebarSectionTitle>
        <div className="space-y-1 px-0.5">
          {BRD_ARTIFACT_NAV.map(({ type, label, icon }) => {
            const href = `${nav.artifactsBase}/${type}`;
            return (
              <SidebarNavLink
                key={type}
                href={href}
                label={label}
                icon={icon}
                active={pathActive(pathname, href)}
              />
            );
          })}
        </div>
      </div>

    </>
  );
}
