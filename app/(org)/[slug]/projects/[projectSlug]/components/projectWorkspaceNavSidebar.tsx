"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronsUpDown,
  Check,
  LayoutDashboard,
  LogOut,
  Pencil,
  PersonStanding,
  Plus,
  Search,
  Trash2,
  UserRoundPlus,
  Users,
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useProjectActors, useDeleteProjectActor } from "@/hooks/useActor";
import type { ProjectActor } from "@/lib/api/services/fetchActor";
import { useUserMe } from "@/hooks/useUser";
import type { Org } from "@/lib/api/services/fetchOrg";
import { fetchProject } from "@/lib/api/services/fetchProject";
import { orgProjectsQueryKey } from "@/lib/query/query-keys";
import { cn } from "@/lib/utils";

import { useOrgWorkspace } from "../../../orgWorkspaceContext";
import { CreateOrgDialog } from "../../../../components/createOrgDialog";
import { CreateProjectActorDialog } from "./sub-task/actor/createProjectActorDialog";
import { DeleteProjectActorDialog } from "./sub-task/actor/deleteProjectActorDialog";
import { EditProjectActorDialog } from "./sub-task/actor/editProjectActorDialog";
import {
  buildOrgEntryPath,
  projectWorkspaceSubPathFromPathname,
  replaceOrgSlugInPathname,
} from "../../../../components/orgWorkspacePaths";

const ORG_LIST_GRADIENTS = [
  "from-orange-400 to-rose-600",
  "from-violet-500 to-indigo-700",
  "from-cyan-400 to-teal-600",
  "from-amber-400 to-orange-600",
  "from-fuchsia-500 to-pink-600",
  "from-emerald-400 to-green-700",
  "from-sky-400 to-blue-700",
] as const;

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

function orgListGradientFromSeed(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return ORG_LIST_GRADIENTS[h % ORG_LIST_GRADIENTS.length]!;
}

function OrgMiniAvatar({
  name,
  seed,
  size = "sm",
}: {
  name: string;
  seed: string;
  size?: "sm" | "md";
}) {
  const fromName = nameToInitials(name);
  const initials =
    fromName ||
    (name.trim().length >= 1 ? name.trim().slice(0, 2).toUpperCase() : "?");
  return (
    <span
      className={cn(
        "shrink-0 items-center justify-center rounded-xl bg-linear-to-br font-bold text-white shadow-inner shadow-black/15 ring-1 ring-white/15",
        size === "md"
          ? "flex size-10 text-sm"
          : "flex size-7 text-[10px]",
        orgListGradientFromSeed(seed)
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
}

function foldForSearch(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
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
  canManageActors,
}: {
  projectId: string | null;
  projectsLoaded: boolean;
  actorsBase: string;
  pathname: string;
  dashboardHref: string;
  /** Chỉ owner tổ chức (`owner_id`) được sửa/xóa actor — đồng bộ `OrgWorkspaceContext.canManageOrgMembers` */
  canManageActors: boolean;
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
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-none",
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
          <ul className="list-none space-y-px py-0" role="list">
            {actors.map((actor) => {
              const actorHref = `${actorsBase}/${encodeURIComponent(actor.id)}`;
              const active = pathsEqualIgnoreQuery(pathname, actorHref);
              if (!canManageActors) {
                return (
                  <li key={actor.id} className="min-w-0">
                    <Link
                      href={actorHref}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-1.5 text-left text-sm transition-[color,background-color,border-color,box-shadow] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        active
                          ? "border-primary/30 bg-(--chart-1)/10 font-medium text-foreground shadow-sm ring-1 ring-primary/15"
                          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      )}
                    >
                      <PersonStanding
                        className="size-4 shrink-0 text-muted-foreground opacity-85"
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate">{actor.name}</span>
                    </Link>
                  </li>
                );
              }
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
        open={canManageActors && deleteTarget != null}
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
        open={canManageActors && editTarget != null}
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
  canManageActors,
}: {
  projectId: string | null;
  projectsLoaded: boolean;
  actorsBase: string;
  pathname: string;
  dashboardHref: string;
  /** Chỉ owner tổ chức mới có nút thêm/sửa/xóa actor */
  canManageActors: boolean;
}) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const canAdd =
    canManageActors &&
    projectsLoaded &&
    typeof projectId === "string" &&
    projectId.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mt-1 shrink-0 border-t border-border/70 px-1 pt-3">
        <div
          className={cn(
            "flex items-center gap-2 px-0.5 pb-2",
            canManageActors ? "justify-between" : ""
          )}
        >
          <p className="flex min-w-0 flex-1 items-center gap-2 m-0 text-xs font-bold tracking-wide text-foreground/95 uppercase">
            <span
              className="h-3.5 w-0.5 shrink-0 rounded-full bg-brand-mint/90 shadow-[0_0_6px_color-mix(in_oklab,var(--brand-mint)_50%,transparent)]"
              aria-hidden
            />
            <span className="leading-snug">Actors</span>
          </p>
          {canManageActors ? (
            <div className="-mr-px flex shrink-0 items-center gap-px pr-px">
              <span
                className="pointer-events-none size-6 shrink-0"
                aria-hidden
              />
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
          ) : null}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-0.5">
        <ProjectWorkspaceActorsNav
          projectId={projectId}
          projectsLoaded={projectsLoaded}
          actorsBase={actorsBase}
          pathname={pathname}
          dashboardHref={dashboardHref}
          canManageActors={canManageActors}
        />
      </div>

      <CreateProjectActorDialog
        projectId={projectId}
        open={canManageActors && createDialogOpen}
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const { slug, orgs, orgFromList, canManageOrgMembers } = useOrgWorkspace();
  const encOrg = encodeURIComponent(orgSlug);
  const encProj = encodeURIComponent(projectSlug);
  const base = `/${encOrg}/projects/${encProj}`;

  const { user, logout, isLoggingOut } = useAuth();
  const { data: profile, isPending: isProfilePending } = useUserMe();
  const [createOrgOpen, setCreateOrgOpen] = useState(false);
  const [orgSearch, setOrgSearch] = useState("");
  const [switchingOrgId, setSwitchingOrgId] = useState<string | null>(null);
  const orgSearchRef = useRef<HTMLInputElement | null>(null);

  const switchToOrg = useCallback(
    async (org: Org) => {
      if (org.slug === slug) return;
      setSwitchingOrgId(org.id);
      const subPath = projectWorkspaceSubPathFromPathname(pathname);
      const key = orgProjectsQueryKey(org.id);

      try {
        let projects =
          queryClient.getQueryData<Awaited<
            ReturnType<typeof fetchProject.listOrgProjects>
          >>(key)?.data;

        if (!projects) {
          const res = await queryClient.fetchQuery({
            queryKey: key,
            queryFn: () => fetchProject.listOrgProjects(org.id),
          });
          projects = res.data;
        }

        router.push(buildOrgEntryPath(org.slug, projects, subPath));
      } catch {
        router.push(replaceOrgSlugInPathname(pathname, org.slug));
      } finally {
        setSwitchingOrgId(null);
      }
    },
    [slug, pathname, queryClient, router]
  );

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

  const filteredOrgs = useMemo(() => {
    const q = foldForSearch(orgSearch.trim());
    if (!q) return orgs;
    return orgs.filter(
      (o) => foldForSearch(o.name).includes(q) || foldForSearch(o.slug).includes(q)
    );
  }, [orgs, orgSearch]);

  const nav = useMemo(
    () => ({
      dashboard: `${base}/dashboard`,
      members: `${base}/members`,
      actorsBase: `${base}/actors`,
    }),
    [base]
  );

  return (
    <>
      <CreateOrgDialog open={createOrgOpen} onOpenChange={setCreateOrgOpen} />
      <aside
        className={cn(
          "flex h-full min-h-0 w-70 shrink-0 flex-col border-r border-border/60 bg-muted/20",
          className
        )}
        aria-label="Điều hướng dự án"
      >
        <div className="shrink-0 border-b border-border/60 px-3 pb-3 pt-3">
          <DropdownMenu
            onOpenChange={(open) => {
              if (!open) {
                setOrgSearch("");
                return;
              }
              requestAnimationFrame(() => {
                requestAnimationFrame(() => orgSearchRef.current?.focus());
              });
            }}
          >
            <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-lg px-1 py-1.5 outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/45">
              <OrgMiniAvatar
                name={orgFromList.name}
                seed={orgFromList.id}
                size="md"
              />
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-semibold leading-tight text-foreground">
                  {orgFromList.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  Tổ chức
                </p>
              </div>
              <ChevronsUpDown
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="start"
              sideOffset={6}
              className="w-[min(18rem,calc(100vw-1rem))] p-0 overflow-hidden"
            >
              <div className="border-b border-border/60 px-3 py-2.5">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    ref={orgSearchRef}
                    type="text"
                    inputMode="search"
                    autoComplete="off"
                    placeholder="Tìm tổ chức…"
                    value={orgSearch}
                    onChange={(e) => setOrgSearch(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="h-8 border-border/70 bg-muted/40 pr-2 pl-9 text-sm shadow-none"
                  />
                </div>
              </div>

              <div className="max-h-52 overflow-y-auto py-1 scrollbar-none">
                {filteredOrgs.length === 0 ? (
                  <p className="px-3 py-3 text-center text-xs text-muted-foreground">
                    {orgSearch.trim()
                      ? "Không tìm thấy tổ chức."
                      : "Chưa có tổ chức nào."}
                  </p>
                ) : (
                  filteredOrgs.map((org) => {
                    const active = org.slug === slug;
                    const switching = switchingOrgId === org.id;
                    return (
                      <DropdownMenuItem
                        key={org.id}
                        className="mx-1 gap-2.5 rounded-lg py-2 pr-2 pl-2"
                        disabled={switchingOrgId != null}
                        onClick={() => void switchToOrg(org)}
                      >
                        <OrgMiniAvatar name={org.name} seed={org.id} />
                        <span
                          className={cn(
                            "min-w-0 flex-1 truncate text-sm font-medium",
                            active ? "text-muted-foreground" : "text-foreground"
                          )}
                        >
                          {org.name}
                        </span>
                        {switching ? (
                          <span className="text-[10px] text-muted-foreground">
                            …
                          </span>
                        ) : active ? (
                          <Check
                            className="size-4 shrink-0 text-primary"
                            aria-hidden
                          />
                        ) : null}
                      </DropdownMenuItem>
                    );
                  })
                )}
              </div>

              <div className="border-t border-border/60 p-1">
                <DropdownMenuItem
                  className="gap-2 rounded-lg py-2 font-medium"
                  onClick={() => setCreateOrgOpen(true)}
                >
                  <Plus className="size-4 text-muted-foreground" aria-hidden />
                  Tạo tổ chức
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-4 px-2 py-4">
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
                href={nav.members}
                label="Thành viên"
                icon={Users}
                active={pathActive(pathname, nav.members)}
              />
            </div>
          </div>

          <ProjectWorkspaceActorsSection
            projectId={projectId}
            projectsLoaded={projectsLoaded}
            actorsBase={nav.actorsBase}
            pathname={pathname}
            dashboardHref={nav.dashboard}
            canManageActors={canManageOrgMembers}
          />
        </nav>

        <div className="shrink-0 border-t border-border/60 px-2 pt-2 pb-1">
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
