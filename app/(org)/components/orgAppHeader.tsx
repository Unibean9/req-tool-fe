"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  Check,
  FolderKanban,
  KeyRound,
  LogOut,
  Plus,
  Search,
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
import { startNavigationProgress } from "@/components/ui/navigation-progress";
import { useAuth } from "@/hooks/useAuth";
import { useMobile } from "@/hooks/use-mobile";
import { useOrgMe } from "@/hooks/useOrg";
import { useUserMe } from "@/hooks/useUser";
import {
  fetchProject,
  type OrgProjectsListResponse,
} from "@/lib/api/services/fetchProject";
import type { Org } from "@/lib/api/services/fetchOrg";
import type { UserProfile } from "@/lib/api/services/fetchUser";
import { orgProjectsQueryKey } from "@/lib/query/query-keys";
import { cn } from "@/lib/utils";

import { LlmProviderConfigDialog } from "@/components/shared/LlmProviderConfigDialog";
import { CreateOrgDialog } from "./createOrgDialog";
import { buildOrgEntryPath } from "./orgWorkspacePaths";

/** Initials từ họ tên (ưu tiên chữ cái đầu họ + đệm/cuối cho tên nhiều từ). */
function nameToInitials(fullName: string | undefined): string {
  const name = (fullName ?? "").trim();
  if (!name) return "";
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0]![0] ?? "";
    const last = parts[parts.length - 1]![0] ?? "";
    return `${first}${last}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function userInitials(
  email: string | undefined,
  fullName: string | undefined
): string {
  const fromName = nameToInitials(fullName);
  if (fromName) return fromName;
  const local = (email ?? "").split("@")[0]?.trim();
  if (local && local.length >= 2) return local.slice(0, 2).toUpperCase();
  if (local) return local[0]!.toUpperCase();
  return "?";
}

/** Chuẩn hóa chữ để tìm (bỏ dấu, lowercase). */
function foldForSearch(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

const ORG_LIST_GRADIENTS = [
  "from-orange-400 to-rose-600",
  "from-violet-500 to-indigo-700",
  "from-cyan-400 to-teal-600",
  "from-amber-400 to-orange-600",
  "from-fuchsia-500 to-pink-600",
  "from-emerald-400 to-green-700",
  "from-sky-400 to-blue-700",
] as const;

function orgListGradientFromSeed(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return ORG_LIST_GRADIENTS[h % ORG_LIST_GRADIENTS.length]!;
}

function OrgPickerAvatar({ name, seed }: { name: string; seed: string }) {
  const fromName = nameToInitials(name);
  const initials =
    fromName ||
    (name.trim().length >= 1 ? name.trim().slice(0, 2).toUpperCase() : "?");
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-[10px] font-bold text-white shadow-inner shadow-black/15 ring-1 ring-white/15",
        orgListGradientFromSeed(seed)
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
}

type OrgAccountDropdownMenuProps = {
  triggerAvatarClassName: string;
  orgSearchInputRef: RefObject<HTMLInputElement | null>;
  orgMenuQuery: string;
  setOrgMenuQuery: (v: string) => void;
  filteredOrgs: Org[];
  isOrgsPending: boolean;
  currentOrg: Org | null;
  orgSlug: string | null;
  profile: UserProfile | undefined;
  displayName: string | undefined;
  email: string | undefined;
  initials: string;
  avatarUrl: string | null;
  avatarAlt: string;
  isProfilePending: boolean;
  switchingOrgId: string | null;
  onSwitchOrg: (org: Org) => void;
  setCreateOrgOpen: (open: boolean) => void;
  setLlmConfigOpen: (open: boolean) => void;
  logout: () => void | Promise<void>;
  isLoggingOut: boolean;
};

function OrgAccountDropdownMenu({
  triggerAvatarClassName,
  orgSearchInputRef,
  orgMenuQuery,
  setOrgMenuQuery,
  filteredOrgs,
  isOrgsPending,
  currentOrg,
  orgSlug,
  profile,
  displayName,
  email,
  initials,
  avatarUrl,
  avatarAlt,
  isProfilePending,
  switchingOrgId,
  onSwitchOrg,
  setCreateOrgOpen,
  setLlmConfigOpen,
  logout,
  isLoggingOut,
}: OrgAccountDropdownMenuProps) {
  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (!open) {
          setOrgMenuQuery("");
          return;
        }
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            orgSearchInputRef.current?.focus();
          });
        });
      }}
    >
      <DropdownMenuTrigger
        className={cn(
          "rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45",
          "data-popup-open:ring-2 data-popup-open:ring-ring/35",
          triggerAvatarClassName
        )}
      >
        <Avatar
          size="lg"
          className="size-12 cursor-pointer ring-2 ring-border/40 transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={avatarAlt} />
          ) : null}
          <AvatarFallback
            className={cn(
              "bg-primary/25 text-sm font-bold tracking-tight text-foreground",
              isProfilePending && "animate-pulse"
            )}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[min(20rem,calc(100vw-1.5rem))] min-w-72 overflow-hidden p-0"
      >
        <DropdownMenuGroup className="p-3 pb-2">
          <DropdownMenuLabel className="p-0 font-normal">
            <span className="block truncate text-sm font-semibold text-foreground">
              {displayName || email || "Tài khoản"}
            </span>
            {currentOrg ? (
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {currentOrg.name}
              </span>
            ) : profile?.githubLogin ? (
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                @{profile.githubLogin}
              </span>
            ) : null}
            {email ? (
              <span
                className={cn(
                  "mt-0.5 block truncate text-xs text-muted-foreground",
                  (currentOrg || profile?.githubLogin) && "mt-1"
                )}
              >
                {email}
              </span>
            ) : null}
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-0" />

        <div className="px-2 pt-2 pb-1">
          <p className="px-1 pb-1.5 text-xs font-medium text-muted-foreground">
            Organizations
          </p>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              ref={orgSearchInputRef}
              type="text"
              inputMode="search"
              autoComplete="off"
              placeholder="Search organizations…"
              value={orgMenuQuery}
              onChange={(e) => setOrgMenuQuery(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
              }}
              className="h-9 border-border/80 bg-muted/50 pr-2 pl-9 text-sm shadow-none"
              aria-label="Search organizations"
            />
          </div>
        </div>

        <div
          className={cn(
            "max-h-36 overflow-y-auto px-1 pb-1",
            "no-scrollbar scrollbar-none"
          )}
        >
          {isOrgsPending ? (
            <div className="flex flex-col gap-1.5 px-1 py-1">
              <Skeleton className="h-9 w-full rounded-lg" />
              <Skeleton className="h-9 w-full rounded-lg" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
          ) : filteredOrgs.length === 0 ? (
            <p className="px-2 py-2 text-center text-xs text-muted-foreground">
              {orgMenuQuery.trim()
                ? "No organizations found."
                : "No organizations yet."}
            </p>
          ) : (
            filteredOrgs.map((org) => {
              const active = org.slug === orgSlug;
              const isSwitching = switchingOrgId === org.id;
              return (
                <DropdownMenuItem
                  key={org.id}
                  disabled={Boolean(switchingOrgId)}
                  className={cn(
                    "cursor-default gap-2.5 rounded-lg py-2 pr-2 pl-2",
                    active && "bg-muted/60"
                  )}
                  onClick={() => {
                    if (active || switchingOrgId) return;
                    onSwitchOrg(org);
                  }}
                >
                  <OrgPickerAvatar name={org.name} seed={org.id} />
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-sm font-medium",
                      active ? "text-muted-foreground" : "text-foreground"
                    )}
                  >
                    {isSwitching ? "Switching…" : org.name}
                  </span>
                  {active ? (
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

        <DropdownMenuSeparator className="my-0" />

        <div className="p-1">
          <DropdownMenuItem
            className="cursor-default gap-2 rounded-lg py-2 font-medium"
            onClick={() => setCreateOrgOpen(true)}
          >
            <Plus className="size-4 text-muted-foreground" aria-hidden />
            Create organization
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="my-0" />

        <div className="p-1">
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="cursor-default gap-2 rounded-lg py-2 font-medium"
              onClick={() => setLlmConfigOpen(true)}
            >
              <KeyRound className="size-4 text-muted-foreground" aria-hidden />
              LLM Settings
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </div>

        <DropdownMenuSeparator className="my-0" />

        <div className="p-1">
          <DropdownMenuGroup>
            <DropdownMenuItem
              variant="destructive"
              disabled={isLoggingOut}
              className="rounded-lg"
              onClick={() => void logout()}
            >
              <LogOut className="size-4" />
              {isLoggingOut ? "Logging out…" : "Logout"}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function OrgMobileTabLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-w-13 shrink-0 flex-col items-center gap-0.5 rounded-lg px-1.5 py-1 text-center text-[10px] font-semibold leading-tight transition-colors",
        active
          ? "text-brand-mint"
          : "text-muted-foreground active:bg-muted/50"
      )}
    >
      <Icon
        className={cn("size-5 shrink-0", active && "text-brand-mint")}
        aria-hidden
      />
      <span className="max-w-18 leading-tight">{label}</span>
      {active ? (
        <span className="h-0.75 w-6 shrink-0 rounded-full bg-chart-4" aria-hidden />
      ) : (
        <span className="h-0.75 w-6 shrink-0 opacity-0" aria-hidden />
      )}
    </Link>
  );
}

function OrgWorkspaceMobileBottomNav({
  className,
  orgSlug,
  showOrgTabs,
  isProjectsTab,
  isMembersTab,
  accountMenu,
}: {
  className?: string;
  orgSlug: string | null;
  showOrgTabs: boolean;
  isProjectsTab: boolean;
  isMembersTab: boolean;
  accountMenu: ReactNode;
}) {
  return (
    <nav
      className={cn(
        "fixed right-0 bottom-0 left-0 z-40 flex items-center gap-1 border-t border-border/70 bg-background/95 px-1 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md supports-backdrop-filter:bg-background/90",
        className
      )}
      aria-label="Workspace navigation"
    >
      <Link
        href="/"
        className="flex shrink-0 flex-col items-center gap-0.5 rounded-lg px-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring/45"
      >
        <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg ring-1 ring-border/50">
          <Image
            src="/Logo.png"
            alt="Requirements | Bean9"
            width={36}
            height={36}
            className="size-9 rounded-[inherit] object-contain"
            priority
          />
        </span>
        <span className="text-[9px] font-medium text-muted-foreground">Trang chủ</span>
      </Link>
      {showOrgTabs && orgSlug ? (
        <div className="flex min-w-0 flex-1 items-stretch justify-around gap-0.5 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden">
          <OrgMobileTabLink
            href={`/${encodeURIComponent(orgSlug!)}/projects`}
            label="Projects"
            icon={FolderKanban}
            active={isProjectsTab}
          />
          <OrgMobileTabLink
            href={`/${encodeURIComponent(orgSlug!)}/members`}
            label="Members"
            icon={Users}
            active={isMembersTab}
          />
        </div>
      ) : (
        <div className="min-w-0 flex-1" />
      )}
      <div className="flex shrink-0 items-center pl-0.5">{accountMenu}</div>
    </nav>
  );
}

const TAB_EASE = [0.22, 1, 0.36, 1] as const;

type OrgWorkspaceTabProps = {
  href: string;
  label: string;
  active: boolean;
};

function OrgWorkspaceTab({ href, label, active }: OrgWorkspaceTabProps) {
  return (
    <Link
      href={href}
      className={cn(
        "relative z-0 inline-flex min-h-9 items-center justify-center rounded-lg px-3 py-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/45",
        active
          ? "text-brand-mint"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <span className="inline-flex flex-col items-stretch gap-1.5">
        <span className="font-heading text-center text-sm font-semibold tracking-tight">
          {label}
        </span>
        {active ? (
          <motion.span
            layoutId="org-workspace-tab-underline"
            className="h-0.75 w-full shrink-0 rounded-full bg-chart-4"
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            aria-hidden
          />
        ) : null}
      </span>
    </Link>
  );
}

export function OrgAppHeader({ className }: { className?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, logout, isLoggingOut } = useAuth();
  const { data: profile, isPending: isProfilePending } = useUserMe();
  const { data: orgs, isPending: isOrgsPending } = useOrgMe();
  const [orgMenuQuery, setOrgMenuQuery] = useState("");
  const [createOrgOpen, setCreateOrgOpen] = useState(false);
  const [llmConfigOpen, setLlmConfigOpen] = useState(false);
  const [switchingOrgId, setSwitchingOrgId] = useState<string | null>(null);
  const orgSearchInputRef = useRef<HTMLInputElement | null>(null);

  const email = profile?.email ?? user?.email;
  const displayName =
    profile?.fullName?.trim() || user?.userNname?.trim() || undefined;
  const initials = userInitials(email, profile?.fullName ?? displayName);
  const avatarUrl = profile?.githubAvatarUrl?.trim() || null;
  const avatarAlt = displayName
    ? `Avatar — ${displayName}`
    : email
      ? `Avatar — ${email}`
      : "Account avatar";

  const pathname = usePathname() ?? "";
  const segments = pathname.split("/").filter(Boolean);
  const orgSlug = segments[0] ?? null;
  const showOrgTabs = Boolean(orgSlug);
  const section = segments[1];
  const isProjectsTab = section === "projects";
  const isMembersTab = section === "members";

  const switchToOrg = useCallback(
    async (org: Org) => {
      if (org.slug === orgSlug) return;
      setSwitchingOrgId(org.id);
      startNavigationProgress();
      const key = orgProjectsQueryKey(org.id);
      const goMembers = section === "members";

      try {
        if (goMembers) {
          router.push(`/${encodeURIComponent(org.slug)}/members`);
          return;
        }

        let projects =
          queryClient.getQueryData<OrgProjectsListResponse>(key)?.data;

        if (!projects) {
          const res = await queryClient.fetchQuery({
            queryKey: key,
            queryFn: () => fetchProject.listOrgProjects(org.id),
          });
          projects = res.data;
        }

        router.push(buildOrgEntryPath(org.slug, projects));
      } catch {
        router.push(
          goMembers
            ? `/${encodeURIComponent(org.slug)}/members`
            : `/${encodeURIComponent(org.slug)}/projects`
        );
      } finally {
        setSwitchingOrgId(null);
      }
    },
    [orgSlug, queryClient, router, section]
  );

  const filteredOrgs = useMemo(() => {
    const list = orgs ?? [];
    const q = foldForSearch(orgMenuQuery.trim());
    if (!q) return list;
    return list.filter(
      (o) =>
        foldForSearch(o.name).includes(q) ||
        foldForSearch(o.slug).includes(q)
    );
  }, [orgs, orgMenuQuery]);

  const currentOrg: Org | null =
    orgSlug && orgs?.length
      ? (orgs.find((o) => o.slug === orgSlug) ?? null)
      : null;

  const isMobile = useMobile();

  const accountMenu = (
    <OrgAccountDropdownMenu
      triggerAvatarClassName=""
      orgSearchInputRef={orgSearchInputRef}
      orgMenuQuery={orgMenuQuery}
      setOrgMenuQuery={setOrgMenuQuery}
      filteredOrgs={filteredOrgs}
      isOrgsPending={isOrgsPending}
      currentOrg={currentOrg}
      orgSlug={orgSlug}
      profile={profile}
      displayName={displayName}
      email={email}
      initials={initials}
      avatarUrl={avatarUrl}
      avatarAlt={avatarAlt}
      isProfilePending={isProfilePending}
      switchingOrgId={switchingOrgId}
      onSwitchOrg={(org) => void switchToOrg(org)}
      setCreateOrgOpen={setCreateOrgOpen}
      setLlmConfigOpen={setLlmConfigOpen}
      logout={logout}
      isLoggingOut={isLoggingOut}
    />
  );

  return (
    <>
      <CreateOrgDialog open={createOrgOpen} onOpenChange={setCreateOrgOpen} />
      <LlmProviderConfigDialog open={llmConfigOpen} onOpenChange={setLlmConfigOpen} />
      {isMobile ? (
        <OrgWorkspaceMobileBottomNav
          className={className}
          orgSlug={orgSlug}
          showOrgTabs={showOrgTabs}
          isProjectsTab={isProjectsTab}
          isMembersTab={isMembersTab}
          accountMenu={accountMenu}
        />
      ) : (
        <header
          className={cn(
            "sticky top-0 z-30 flex min-h-16 shrink-0 items-center border-b border-border/70 bg-background/95 px-4 py-2.5 backdrop-blur-sm supports-backdrop-filter:bg-background/85 sm:px-5",
            className
          )}
        >
          <div className="flex min-w-0 flex-1 items-center justify-start">
            <Link
              href="/"
              className="flex min-w-0 items-center gap-3 rounded-xl py-0.5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45"
            >
              <span className="relative shrink-0 rounded-xl ring-1 ring-border/50 shadow-md shadow-black/10 dark:shadow-black/30">
                <Image
                  src="/Logo.png"
                  alt="Requirements | Bean9"
                  width={48}
                  height={48}
                  className="size-12 rounded-[inherit] object-contain"
                  priority
                />
              </span>
              <span className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Bean9
              </span>
            </Link>
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-center px-1">
            <AnimatePresence mode="wait">
              {showOrgTabs && orgSlug ? (
                <motion.div
                  key={orgSlug}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: TAB_EASE }}
                  className="flex max-w-full justify-center overflow-x-auto"
                >
                  <LayoutGroup id="org-header-tabs">
                    <nav
                      className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:gap-x-4"
                      aria-label="Organization workspace"
                    >
                      <OrgWorkspaceTab
                        href={`/${encodeURIComponent(orgSlug)}/projects`}
                        label="Projects"
                        active={isProjectsTab}
                      />
                      <OrgWorkspaceTab
                        href={`/${encodeURIComponent(orgSlug)}/members`}
                        label="Members"
                        active={isMembersTab}
                      />
                    </nav>
                  </LayoutGroup>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-end">
            {accountMenu}
          </div>
        </header>
      )}
    </>
  );
}
