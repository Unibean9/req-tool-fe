"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { buildProjectNewPath } from "@/app/(org)/components/orgWorkspacePaths";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { OrgProject } from "@/lib/api/services/fetchProject";
import { formatProjectDateRange } from "@/lib/project/projectDisplay";
import { cn } from "@/lib/utils";

import { ProjectWorkspaceOrgRailSwitcher } from "./projectWorkspaceOrgRailSwitcher";
import { ProjectWorkspaceNavSidebar } from "./projectWorkspaceNavSidebar";
import {
  getNextProjectSlugAfterDelete,
  getRedirectSlugWhenCurrentMissing,
  projectSubPathFromPathname,
} from "./projectWorkspaceNav";
import { ProjectWorkspaceNavProvider } from "./projectWorkspaceNavContext";

const PROJECT_RAIL_GRADIENTS = [
  "from-orange-400 to-rose-600",
  "from-violet-500 to-indigo-700",
  "from-cyan-400 to-teal-600",
  "from-amber-400 to-orange-600",
  "from-fuchsia-500 to-pink-600",
  "from-emerald-400 to-green-700",
  "from-sky-400 to-blue-700",
] as const;

/** Chỉ animate scale — bo góc tròn ↔ vuông đổi tức thì khi hover/active. */
const RAIL_ICON_SCALE_MOTION =
  "transition-transform duration-200 ease-out will-change-transform";

/** Chiều cao thanh (px) — giống Discord: peek ngắn → selected dài, animate height. */
const RAIL_INDICATOR_FULL_H = 40;
const RAIL_INDICATOR_PEEK_H = 20;
const RAIL_INDICATOR_IDLE_H = 8;

/** Kéo dài khi chọn — chậm, ease-out để thấy rõ chuyển động (không “bụp”). */
const RAIL_INDICATOR_GROW_TWEEN = {
  duration: 0.38,
  ease: [0.22, 1, 0.36, 1] as const,
};

const RAIL_INDICATOR_PEEK_TWEEN = {
  duration: 0.2,
  ease: [0.33, 1, 0.68, 1] as const,
};

function projectRailGradient(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PROJECT_RAIL_GRADIENTS[h % PROJECT_RAIL_GRADIENTS.length]!;
}

/** 2 ký tự: từ đầu + cuối nếu nhiều từ; ngược lại 2 ký tự đầu (giống nameToInitials org). */
function projectInitials(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0]![0] ?? "";
    const last = parts[parts.length - 1]![0] ?? "";
    return `${first}${last}`.toLocaleUpperCase("vi-VN");
  }
  return t.slice(0, Math.min(2, t.length)).toLocaleUpperCase("vi-VN");
}

function DiscordRailItem({
  href,
  active,
  title,
  subtitle,
  className,
  children,
}: {
  href: string;
  active?: boolean;
  title: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const showPeek = !active && (pressed || hovered);
  const indicatorHeight = active
    ? RAIL_INDICATOR_FULL_H
    : showPeek
      ? RAIL_INDICATOR_PEEK_H
      : RAIL_INDICATOR_IDLE_H;
  const indicatorOpacity = active || showPeek ? 1 : 0;
  const isGrowingLong = indicatorHeight === RAIL_INDICATOR_FULL_H;

  return (
    <div
      className="group/rail relative flex w-full items-center justify-center py-0.5"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => {
        setHovered(false);
        if (!active) setPressed(false);
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-0 z-10 flex h-10 w-1 -translate-y-1/2 items-center"
      >
        <motion.span
          initial={false}
          animate={{ height: indicatorHeight, opacity: indicatorOpacity }}
          transition={{
            height: isGrowingLong
              ? RAIL_INDICATOR_GROW_TWEEN
              : RAIL_INDICATOR_PEEK_TWEEN,
            opacity: RAIL_INDICATOR_PEEK_TWEEN,
          }}
          className="w-full shrink-0 rounded-r-full bg-foreground shadow-sm"
        />
      </span>
      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              href={href}
              aria-label={title}
              aria-current={active ? "page" : undefined}
              onPointerDown={() => setPressed(true)}
              onPointerUp={() => {
                if (!active) setPressed(false);
              }}
              onPointerCancel={() => {
                if (!active) setPressed(false);
              }}
              className={cn(
                RAIL_ICON_SCALE_MOTION,
                "relative flex size-12 shrink-0 scale-100 items-center justify-center overflow-hidden rounded-full text-lg font-bold leading-none tracking-tight text-white shadow-md outline-none active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring/50",
                "group-hover/rail:scale-[1.06] group-hover/rail:rounded-2xl",
                active && "scale-[1.04] rounded-2xl",
                className
              )}
            >
              {children}
            </Link>
          }
        />
        <TooltipContent side="right" sideOffset={10} align="center">
          <span className="block font-medium">{title}</span>
          {subtitle ? (
            <span className="mt-0.5 block text-xs text-background/80">
              {subtitle}
            </span>
          ) : null}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export function ProjectWorkspaceLayout({
  orgSlug,
  projectSlug,
  projects,
  isProjectsPending,
  children,
}: {
  orgSlug: string;
  projectSlug: string;
  projects: OrgProject[];
  isProjectsPending: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const encOrg = encodeURIComponent(orgSlug);
  const encProj = encodeURIComponent(projectSlug);
  const base = `/${encOrg}/projects/${encProj}`;
  const newProjectHref = buildProjectNewPath(orgSlug, { returnTo: pathname });
  const currentSubPath = projectSubPathFromPathname(pathname, base);
  const isMembersView =
    pathname === `${base}/members` || pathname === `${base}/members/`;
  const currentProject = projects.find((p) => p.slug === projectSlug);
  const projectId = currentProject?.id ?? null;

  const navigateAfterProjectDelete = useCallback(
    (deletedProjectId: string, nextSlugOverride?: string | null) => {
      const subPath = projectSubPathFromPathname(pathname, base);
      const nextSlug =
        nextSlugOverride ??
        getNextProjectSlugAfterDelete(projects, deletedProjectId);
      if (nextSlug) {
        router.replace(
          `/${encOrg}/projects/${encodeURIComponent(nextSlug)}/${subPath}`
        );
        return;
      }
      router.replace(`/${encOrg}/projects`);
    },
    [base, encOrg, pathname, projects, router]
  );

  useEffect(() => {
    if (isProjectsPending) return;
    if (projects.some((p) => p.slug === projectSlug)) return;

    const subPath = projectSubPathFromPathname(pathname, base);
    const redirectSlug = getRedirectSlugWhenCurrentMissing(
      projects,
      projectSlug
    );

    if (!redirectSlug) {
      router.replace(`/${encOrg}/projects`);
      return;
    }

    router.replace(
      `/${encOrg}/projects/${encodeURIComponent(redirectSlug)}/${subPath}`
    );
  }, [
    base,
    encOrg,
    isProjectsPending,
    pathname,
    projectSlug,
    projects,
    router,
  ]);

  return (
    <ProjectWorkspaceNavProvider value={{ navigateAfterProjectDelete }}>
    <div className="flex h-full min-h-0 w-full flex-1 flex-row overflow-hidden bg-background">
      {/* Rail 1 — danh sách dự án (kiểu Discord) */}
      <aside
        className="flex w-21 shrink-0 flex-col items-center bg-sidebar py-3"
        aria-label="Tổ chức và dự án"
      >
        <ProjectWorkspaceOrgRailSwitcher />

        <span
          className="my-2.5 h-0.5 w-11 shrink-0 rounded-full bg-white/50 shadow-[0_0_8px_color-mix(in_oklab,var(--primary)_40%,transparent)]"
          aria-hidden
        />

        <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-2 overflow-y-auto px-2.5 py-1 scrollbar-none">
          {isProjectsPending ? (
            <>
              <Skeleton className="size-12 shrink-0 rounded-full" />
              <Skeleton className="size-12 shrink-0 rounded-full" />
              <Skeleton className="size-12 shrink-0 rounded-full" />
            </>
          ) : (
            projects.map((p) => {
              const active = p.slug === projectSlug;
              const href = `/${encOrg}/projects/${encodeURIComponent(p.slug)}/${currentSubPath}`;
              const dateHint = formatProjectDateRange(p.startDate, p.endDate);
              return (
                <DiscordRailItem
                  key={p.id}
                  href={href}
                  active={active}
                  title={p.name}
                  subtitle={dateHint || undefined}
                  className={cn(
                    "bg-linear-to-br shadow-inner shadow-black/25 ring-1 ring-white/10",
                    projectRailGradient(p.id)
                  )}
                >
                  {projectInitials(p.name)}
                </DiscordRailItem>
              );
            })
          )}
        </div>

        <span
          className="my-2.5 h-0.5 w-11 shrink-0 rounded-full bg-white/50 shadow-[0_0_8px_color-mix(in_oklab,var(--primary)_40%,transparent)]"
          aria-hidden
        />

        <Link
          href={newProjectHref}
          title="Thêm dự án"
          aria-label="Thêm dự án"
          className={cn(
            RAIL_ICON_SCALE_MOTION,
            "group/add flex size-12 shrink-0 scale-100 items-center justify-center rounded-full bg-muted/50 text-primary outline-none active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring/50 hover:scale-[1.06] hover:rounded-2xl hover:bg-primary hover:text-primary-foreground"
          )}
        >
          <Plus className="size-5 transition-transform group-hover/add:scale-110" aria-hidden />
        </Link>
      </aside>

      <ProjectWorkspaceNavSidebar
        orgSlug={orgSlug}
        projectSlug={projectSlug}
        projectId={projectId}
        projectsLoaded={!isProjectsPending}
      />

      <main
        data-scroll-gutter-scope
        data-project-scroll-gutter
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background",
          isMembersView ? "p-0" : "p-4 sm:p-6"
        )}
      >
        {children}
      </main>
    </div>
    </ProjectWorkspaceNavProvider>
  );
}
