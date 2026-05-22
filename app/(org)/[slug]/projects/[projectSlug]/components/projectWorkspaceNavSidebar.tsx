"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import {
  Ban,
  Check,
  CircleSlash,
  ClipboardList,
  LayoutDashboard,
  Link2,
  LogOut,
  Pencil,
  PersonStanding,
  Gauge,
  Scale,
  Target,
  Trash2,
  UserRoundPlus,
  Users,
  UsersRound,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useAuth } from "@/hooks/useAuth";
import { useProjectSetupProgress } from "@/hooks/useProject";
import { useProjectActors, useDeleteProjectActor } from "@/hooks/useActor";
import type { ProjectActor } from "@/lib/api/services/fetchActor";
import { useUserMe } from "@/hooks/useUser";
import type { ProjectSetupProgress } from "@/lib/api/services/fetchProject";
import { cn } from "@/lib/utils";

import { useOrgWorkspace } from "../../../orgWorkspaceContext";
import { CreateProjectActorDialog } from "./sub-task/actor/createProjectActorDialog";
import { DeleteProjectActorDialog } from "./sub-task/actor/deleteProjectActorDialog";
import { EditProjectActorDialog } from "./sub-task/actor/editProjectActorDialog";
function nameToInitials(fullName: string | undefined): string {
  const name = (fullName ?? "").trim();
  if (!name) return "";
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function userInitials(email: string | undefined, fullName: string | undefined): string {
  const fromName = nameToInitials(fullName);
  if (fromName) return fromName;
  const local = (email ?? "").split("@")[0]?.trim();
  if (local && local.length >= 2) return local.slice(0, 2).toUpperCase();
  if (local) return local[0]!.toUpperCase();
  return "?";
}

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

const PROJECT_BUSINESS_NAV = [
  { segment: "goals", label: "Goals", icon: Target },
  { segment: "requirements", label: "Business Requirements", icon: ClipboardList },
  { segment: "stakeholders", label: "Stakeholders", icon: UsersRound },
  { segment: "rules", label: "Rules", icon: Scale },
  { segment: "flow", label: "Business Flows", icon: Workflow },
  { segment: "constraints", label: "Constraints", icon: Ban },
  { segment: "out-of-scope", label: "Out Of Scope", icon: CircleSlash },
] as const;

const SETUP_PROGRESS_STEP_COUNT = 7;

const SETUP_PROGRESS_STEPS: {
  key: keyof ProjectSetupProgress;
  label: string;
  group: "Core" | "Business requirements" | "User requirements" | "Functional requirements";
  icon: LucideIcon;
  /** Path segment(s) sau `{org}/projects/{project}` */
  hrefPath: string;
}[] = [
  {
    key: "core",
    label: "Core setup",
    group: "Core",
    icon: LayoutDashboard,
    hrefPath: "dashboard",
  },
  {
    key: "stakeholders",
    label: "Stakeholders",
    group: "Business requirements",
    icon: UsersRound,
    hrefPath: "business/stakeholders",
  },
  {
    key: "goals",
    label: "Goals",
    group: "Business requirements",
    icon: Target,
    hrefPath: "business/goals",
  },
  {
    key: "flows",
    label: "Flows",
    group: "Business requirements",
    icon: Workflow,
    hrefPath: "business/flow",
  },
  {
    key: "rules",
    label: "Rules",
    group: "Business requirements",
    icon: Scale,
    hrefPath: "business/rules",
  },
  {
    key: "nfrs",
    label: "NFRs",
    group: "User requirements",
    icon: Gauge,
    hrefPath: "nfr",
  },
  {
    key: "requirements",
    label: "Actors",
    group: "Functional requirements",
    icon: PersonStanding,
    hrefPath: "actors",
  },
];

function setupProgressStepHref(base: string, hrefPath: string): string {
  return `${base}/${hrefPath}`;
}

type SetupProgressStepState = (typeof SETUP_PROGRESS_STEPS)[number] & {
  done: boolean;
  href: string;
};

function resolveSetupProgressStepHref(
  base: string,
  step: (typeof SETUP_PROGRESS_STEPS)[number],
  firstActorId: string | undefined
): string {
  if (step.key === "requirements") {
    if (firstActorId) {
      return `${base}/actors/${encodeURIComponent(firstActorId)}`;
    }
    return `${base}/dashboard`;
  }
  return setupProgressStepHref(base, step.hrefPath);
}

function setupProgressPercent(doneCount: number): number {
  return Math.round((doneCount / SETUP_PROGRESS_STEP_COUNT) * 100);
}

function setupProgressStatusLabel(percent: number): string {
  if (percent === 100) return "Sẵn sàng";
  if (percent >= 60) return "Gần xong";
  if (percent > 0) return "Đang tiến hành";
  return "Chưa bắt đầu";
}

function SetupProgressHoverPanel({
  steps,
  percent,
  doneCount,
  pathname,
}: {
  steps: SetupProgressStepState[];
  percent: number;
  doneCount: number;
  pathname: string;
}) {
  const groupedSteps = SETUP_PROGRESS_STEPS.map((step) => step.group).filter(
    (group, index, groups) => groups.indexOf(group) === index
  ).map((group) => ({
    group,
    steps: steps.filter((step) => step.group === group),
  }));

  return (
    <div className="overflow-hidden rounded-xl bg-popover text-popover-foreground">
      <div className="border-b border-border/60 bg-muted/30 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold tracking-tight text-foreground">
              Tiến độ setup
            </p>
            <p className="text-xs leading-snug text-muted-foreground">
              Theo dõi từng khu vực để hoàn thành cấu trúc dự án.
            </p>
          </div>
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
            <span className="text-lg font-bold tabular-nums text-primary">
              {percent}%
            </span>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="rounded-full bg-background/80 px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm ring-1 ring-border/60">
            {setupProgressStatusLabel(percent)}
          </span>
          <span className="text-xs font-medium text-muted-foreground tabular-nums">
            {doneCount} / {SETUP_PROGRESS_STEP_COUNT}
          </span>
        </div>
        <div className="mt-3 flex gap-1.5" aria-hidden>
          {steps.map((step) => (
            <span
              key={step.key}
              className={cn(
                "h-1.5 min-w-0 flex-1 rounded-full transition-colors",
                step.done ? "bg-primary" : "bg-background"
              )}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3 px-3 py-3">
        {groupedSteps.map(({ group, steps: groupSteps }) => {
          const groupDoneCount = groupSteps.filter((step) => step.done).length;
          return (
            <section key={group} className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <p className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                  {group}
                </p>
                <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                  {groupDoneCount}/{groupSteps.length}
                </span>
              </div>
              <ul className="list-none space-y-1">
                {groupSteps.map((step) => {
                  const Icon = step.icon;
                  const active = pathActive(pathname, step.href);
                  return (
                    <li key={step.key}>
                      <Link
                        href={step.href}
                        className={cn(
                          "group flex items-center gap-3 rounded-lg px-2 py-2 outline-none transition-colors",
                          "hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring/45",
                          active && "bg-muted ring-1 ring-border/70"
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors",
                            step.done
                              ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
                              : "border-border bg-background text-muted-foreground group-hover:text-foreground"
                          )}
                        >
                          {step.done ? (
                            <Check
                              className="size-4"
                              strokeWidth={2.5}
                              aria-hidden
                            />
                          ) : (
                            <Icon className="size-3.5" strokeWidth={1.75} aria-hidden />
                          )}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                          {step.label}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            step.done
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {step.done ? "Hoàn thành" : "Chưa hoàn thành"}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function ProjectWorkspaceSetupProgress({
  base,
  pathname,
  projectId,
  projectsLoaded,
}: {
  base: string;
  pathname: string;
  projectId: string | null;
  projectsLoaded: boolean;
}) {
  const enabled = projectsLoaded && Boolean(projectId?.trim());
  const { data, isPending, isError } = useProjectSetupProgress(
    enabled ? projectId : null
  );
  const { data: actors = [] } = useProjectActors(enabled ? projectId : null);
  const firstActorId = actors[0]?.id;

  const steps = useMemo(
    () =>
      SETUP_PROGRESS_STEPS.map((step) => ({
        ...step,
        done: Boolean(data?.[step.key]),
        href: resolveSetupProgressStepHref(base, step, firstActorId),
      })),
    [base, data, firstActorId]
  );

  const doneCount = steps.filter((s) => s.done).length;
  const percent = setupProgressPercent(doneCount);

  if (!enabled) return null;

  const progressBody = (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-card/70 px-3 py-2.5 outline-none transition-colors",
        "hover:border-border hover:bg-card",
        "focus-visible:ring-2 focus-visible:ring-ring/45"
      )}
    >
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="block text-xs font-semibold text-foreground">
            Tiến độ setup
          </span>
          <span className="mt-0.5 block text-[10px] text-muted-foreground">
            {setupProgressStatusLabel(percent)}
          </span>
        </div>
        <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-bold tabular-nums text-primary">
          {percent}%
        </span>
      </div>
      <div
        className="flex gap-1.5"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={`Setup progress ${doneCount} of ${SETUP_PROGRESS_STEP_COUNT} complete`}
      >
        {steps.map((step) => (
          <span
            key={step.key}
            className={cn(
              "h-1.5 min-w-0 flex-1 rounded-full transition-colors",
              step.done ? "bg-primary" : "bg-muted"
            )}
            aria-hidden
          />
        ))}
      </div>
      <p className="mt-2 text-[10px] font-medium tabular-nums text-muted-foreground">
        {doneCount}/{SETUP_PROGRESS_STEP_COUNT} completed · Hover to view steps
      </p>
    </div>
  );

  if (isPending) {
    return (
      <div className="px-0.5 pb-2">
        <Skeleton className="h-17 w-full rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="px-1 pb-2 text-[11px] leading-snug text-muted-foreground">
        Không tải được tiến độ setup.
      </p>
    );
  }

  return (
    <div className="px-0.5 pb-2">
      <HoverCard>
        <HoverCardTrigger
          render={
            <button
              type="button"
              className="w-full cursor-default text-left outline-none"
              aria-label={`Setup progress ${percent} percent. Hover for details.`}
            >
              {progressBody}
            </button>
          }
        />
        <HoverCardContent
          side="top"
          sideOffset={10}
          align="start"
          className="w-80 border-border/70 bg-popover p-0 shadow-xl ring-0"
        >
          <SetupProgressHoverPanel
            steps={steps}
            percent={percent}
            doneCount={doneCount}
            pathname={pathname}
          />
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}

function pathsEqualIgnoreQuery(a: string, b: string): boolean {
  const norm = (s: string) => {
    const p = s.split("?")[0] ?? "";
    return p.replace(/\/+$/, "") || "/";
  };
  return norm(a) === norm(b);
}

function ProjectWorkspaceActorsNav({
  projectId,
  projectsLoaded,
  actorsBase,
  pathname,
  dashboardHref,
}: {
  projectId: string | null;
  projectsLoaded: boolean;
  actorsBase: string;
  pathname: string;
  dashboardHref: string;
}) {
  const [deleteTarget, setDeleteTarget] = useState<{
    actorId: string;
    name: string;
  } | null>(null);

  const [editTarget, setEditTarget] = useState<ProjectActor | null>(null);
  const [editMutationBusy, setEditMutationBusy] = useState(false);

  const actorsAtDeleteConfirmRef = useRef<ProjectActor[]>([]);

  const router = useRouter();

  const deleteActorMutation = useDeleteProjectActor({
    onSuccess: (_void, variables) => {
      setDeleteTarget(null);

      const actorsList = actorsAtDeleteConfirmRef.current;
      const deletedId = variables.actorId;
      const deletedHref = `${actorsBase}/${encodeURIComponent(deletedId)}`;
      if (!pathsEqualIgnoreQuery(pathname, deletedHref)) return;

      const remaining = actorsList.filter((a) => a.id !== deletedId);
      if (remaining.length === 0) {
        router.replace(dashboardHref);
        return;
      }

      const idx = actorsList.findIndex((a) => a.id === deletedId);
      const nextActor =
        idx >= 0
          ? idx + 1 < actorsList.length
            ? actorsList[idx + 1]
            : idx > 0
              ? actorsList[idx - 1]
              : undefined
          : undefined;

      const fallback = remaining[0]!;
      const target =
        nextActor && nextActor.id !== deletedId ? nextActor : fallback;
      router.replace(`${actorsBase}/${encodeURIComponent(target.id)}`);
    },
  });

  const deletePending = deleteActorMutation.isPending;
  const actorRowBusy = deletePending || editMutationBusy;

  const { data: actors = [], isPending, isError } = useProjectActors(
    projectsLoaded ? projectId : null
  );

  async function confirmDeleteActor() {
    if (!projectId || !deleteTarget) return;
    actorsAtDeleteConfirmRef.current = actors;
    await deleteActorMutation.mutateAsync({
      projectId,
      actorId: deleteTarget.actorId,
    });
  }

  if (!projectsLoaded) {
    return (
      <div className="space-y-0.5 py-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!projectId) {
    return (
      <p className="px-2 py-1.5 text-xs leading-snug text-muted-foreground">
        Không tìm thấy dự án trong workspace này.
      </p>
    );
  }

  return (
    <div className="flex shrink-0 flex-col">
      <div
        className={cn(
          "max-h-60 overflow-y-auto overscroll-contain scrollbar-none",
          "[&::-webkit-scrollbar]:hidden"
        )}
      >
        {isPending ? (
          <div className="space-y-0.5 py-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <p className="px-2 py-1.5 text-xs leading-snug text-muted-foreground">
            Không tải được actors.
          </p>
        ) : actors.length === 0 ? (
          <p className="px-2 py-1.5 text-xs leading-snug text-muted-foreground">
            Chưa có actors.
          </p>
        ) : (
          <ul className="list-none space-y-px py-0">
            {actors.map((actor) => {
              const actorHref = `${actorsBase}/${encodeURIComponent(actor.id)}`;
              const active = pathsEqualIgnoreQuery(pathname, actorHref);
              return (
                <li key={actor.id} className="min-w-0">
                  <div
                    className={cn(
                      "flex items-center rounded-lg border border-transparent transition-colors",
                      active
                        ? "border-primary/30 bg-(--chart-1)/10 font-medium shadow-sm ring-1 ring-primary/15"
                        : "hover:bg-muted/40"
                    )}
                  >
                    <Link
                      href={actorHref}
                      className={cn(
                        "flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-[color] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        active
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <PersonStanding
                        className="size-4 shrink-0 text-muted-foreground opacity-85"
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate">{actor.name}</span>
                    </Link>
                    <div className="-mr-px flex shrink-0 items-center gap-px pr-px">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Chỉnh sửa actor ${actor.name}`}
                        title="Chỉnh sửa"
                        disabled={actorRowBusy}
                        className="size-6 shrink-0 text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                        onClick={() => setEditTarget(actor)}
                      >
                        <Pencil className="size-3" aria-hidden />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Xóa actor ${actor.name}`}
                        title="Xóa actor"
                        disabled={actorRowBusy}
                        className="size-6 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() =>
                          setDeleteTarget({ actorId: actor.id, name: actor.name })
                        }
                      >
                        <Trash2 className="size-3" aria-hidden />
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <DeleteProjectActorDialog
        open={deleteTarget != null}
        target={deleteTarget}
        deletePending={deletePending}
        onOpenChange={(next) => {
          if (!next) setDeleteTarget(null);
        }}
        onConfirmDelete={confirmDeleteActor}
      />
      <EditProjectActorDialog
        projectId={projectId}
        actor={editTarget}
        open={editTarget != null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        onRowInteractBusy={setEditMutationBusy}
      />
    </div>
  );
}

function ProjectWorkspaceActorsSection({
  projectId,
  projectsLoaded,
  actorsBase,
  pathname,
  dashboardHref,
}: {
  projectId: string | null;
  projectsLoaded: boolean;
  actorsBase: string;
  pathname: string;
  dashboardHref: string;
}) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const canAdd =
    projectsLoaded &&
    typeof projectId === "string" &&
    projectId.length > 0;

  return (
    <div className="flex shrink-0 flex-col">
      <div className="shrink-0 px-0.5 pb-2">
        <div className="flex items-center justify-between gap-2 px-0.5">
          <p className="m-0 flex min-w-0 flex-1 items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground">
            <span className="leading-snug">Actors</span>
          </p>
          <div className="-mr-px flex shrink-0 items-center gap-px pr-px">
            <span className="pointer-events-none size-6 shrink-0" aria-hidden />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Thêm actor"
              title="Thêm actor"
              disabled={!canAdd}
              className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => setCreateDialogOpen(true)}
            >
              <UserRoundPlus className="size-3" aria-hidden />
            </Button>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 flex-col px-0.5">
        <ProjectWorkspaceActorsNav
          projectId={projectId}
          projectsLoaded={projectsLoaded}
          actorsBase={actorsBase}
          pathname={pathname}
          dashboardHref={dashboardHref}
        />
      </div>

      <CreateProjectActorDialog
        projectId={projectId}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        disabled={!canAdd}
      />
    </div>
  );
}

type ProjectWorkspaceNavSidebarProps = {
  orgSlug: string;
  projectSlug: string;
  projectId: string | null;
  projectsLoaded: boolean;
  className?: string;
};

export function ProjectWorkspaceNavSidebar({
  orgSlug,
  projectSlug,
  projectId,
  projectsLoaded,
  className,
}: ProjectWorkspaceNavSidebarProps) {
  const pathname = usePathname() ?? "";
  const { orgFromList } = useOrgWorkspace();
  const encOrg = encodeURIComponent(orgSlug);
  const encProj = encodeURIComponent(projectSlug);
  const base = `/${encOrg}/projects/${encProj}`;

  const { user, logout, isLoggingOut } = useAuth();
  const { data: profile, isPending: isProfilePending } = useUserMe();
  const email = profile?.email ?? user?.email;
  const displayName =
    profile?.fullName?.trim() || user?.userNname?.trim() || undefined;
  const initials = userInitials(email, profile?.fullName ?? displayName);
  const avatarUrl = profile?.githubAvatarUrl?.trim() || null;
  const avatarAlt = displayName
    ? `Ảnh đại diện — ${displayName}`
    : email
      ? `Ảnh đại diện — ${email}`
      : "Ảnh đại diện tài khoản";

  const nav = useMemo(
    () => ({
      dashboard: `${base}/dashboard`,
      github: `${base}/github`,
      members: `${base}/members`,
      actorsBase: `${base}/actors`,
      businessBase: `${base}/business`,
      nfr: `${base}/nfr`,
    }),
    [base]
  );

  return (
    <>
      <aside
        className={cn(
          "flex h-full min-h-0 w-70 shrink-0 flex-col border-r border-border/60 bg-muted/20",
          className
        )}
        aria-label="Điều hướng dự án"
      >

        <nav className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-2 py-4 scrollbar-none [&::-webkit-scrollbar]:hidden">
          <div className="shrink-0 space-y-1">
            <SidebarSectionTitle>Tổng quan</SidebarSectionTitle>
            <div className="space-y-1 px-0.5">
              <SidebarNavLink
                href={nav.dashboard}
                label="Tổng quan dự án"
                icon={LayoutDashboard}
                active={pathActive(pathname, nav.dashboard)}
              />
              <SidebarNavLink
                href={nav.github}
                label="Liên kết với Github"
                icon={Link2}
                active={pathActive(pathname, nav.github)}
              />
              <SidebarNavLink
                href={nav.members}
                label="Thành viên (Tổ chức)"
                icon={Users}
                active={pathActive(pathname, nav.members)}
              />
            </div>
          </div>

          <div className="shrink-0 space-y-1">
            <SidebarSectionTitle withDivider>
              BRD
            </SidebarSectionTitle>
            <div className="space-y-1 px-0.5">
              {PROJECT_BUSINESS_NAV.map(({ segment, label, icon }) => {
                const href = `${nav.businessBase}/${segment}`;
                return (
                  <SidebarNavLink
                    key={segment}
                    href={href}
                    label={label}
                    icon={icon}
                    active={pathActive(pathname, href)}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex shrink-0 flex-col">
            <SidebarSectionTitle withDivider>User Requirements</SidebarSectionTitle>
            <div className="shrink-0 space-y-1 px-0.5 pb-2">
              <SidebarNavLink
                href={nav.nfr}
                label="NFRs"
                icon={Gauge}
                active={pathActive(pathname, nav.nfr)}
              />
            </div>
            <ProjectWorkspaceActorsSection
              projectId={projectId}
              projectsLoaded={projectsLoaded}
              actorsBase={nav.actorsBase}
              pathname={pathname}
              dashboardHref={nav.dashboard}
            />
          </div>
        </nav>

        <div className="shrink-0 border-t border-border/60 px-2 pt-2 pb-1">
          <ProjectWorkspaceSetupProgress
            base={base}
            pathname={pathname}
            projectId={projectId}
            projectsLoaded={projectsLoaded}
          />
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg border border-border/50 bg-card/50 px-2 py-2 outline-none transition-colors hover:bg-muted/60",
                "focus-visible:ring-2 focus-visible:ring-ring/45 data-popup-open:bg-muted/60"
              )}
            >
              <Avatar className="size-9 shrink-0 border border-border/60">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={avatarAlt} />
                ) : null}
                <AvatarFallback
                  className={cn(
                    "text-xs font-bold",
                    isProfilePending && "animate-pulse"
                  )}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-semibold text-foreground">
                  {displayName || email || "Tài khoản"}
                </p>
                {orgFromList ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {orgFromList.name}
                  </p>
                ) : email ? (
                  <p className="truncate text-xs text-muted-foreground">{email}</p>
                ) : null}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <span className="block truncate text-sm font-medium">
                    {displayName || "Tài khoản"}
                  </span>
                  {email ? (
                    <span className="block truncate text-xs text-muted-foreground">
                      {email}
                    </span>
                  ) : null}
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={isLoggingOut}
                onClick={() => void logout()}
              >
                <LogOut className="size-4" aria-hidden />
                {isLoggingOut ? "Đang đăng xuất…" : "Đăng xuất"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  );
}
