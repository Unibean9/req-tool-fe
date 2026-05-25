"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, Check, ChevronsUpDown, Plus, Search } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Org } from "@/lib/api/services/fetchOrg";
import { fetchProject } from "@/lib/api/services/fetchProject";
import { orgProjectsQueryKey } from "@/lib/query/query-keys";
import { cn } from "@/lib/utils";

import { useOrgWorkspace } from "../../../orgWorkspaceContext";
import { CreateOrgDialog } from "../../../../components/createOrgDialog";
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
  size?: "sm" | "rail";
}) {
  const fromName = nameToInitials(name);
  const initials =
    fromName ||
    (name.trim().length >= 1 ? name.trim().slice(0, 2).toUpperCase() : "?");

  if (size === "rail") {
    return (
      <span
        className="relative flex size-11 items-center justify-center rounded-lg border-2 border-primary/60 bg-sidebar-accent"
        aria-hidden
      >
        <Building2
          className="size-5 text-white"
          strokeWidth={2}
          aria-hidden
        />
        <span className="absolute right-0 bottom-0 flex size-4 translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border-2 border-primary/60 bg-sidebar-accent">
          <ChevronsUpDown
            className="size-2.5 text-white"
            strokeWidth={2.5}
            aria-hidden
          />
        </span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-xl bg-linear-to-br font-bold text-white shadow-inner shadow-black/25 ring-1 ring-white/15 text-[10px]",
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

export function ProjectWorkspaceOrgRailSwitcher() {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const queryClient = useQueryClient();
  const { slug, orgs, orgFromList } = useOrgWorkspace();

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

  const filteredOrgs = useMemo(() => {
    const q = foldForSearch(orgSearch.trim());
    if (!q) return orgs;
    return orgs.filter(
      (o) => foldForSearch(o.name).includes(q) || foldForSearch(o.slug).includes(q)
    );
  }, [orgs, orgSearch]);

  return (
    <>
      <CreateOrgDialog open={createOrgOpen} onOpenChange={setCreateOrgOpen} />
      <div className="flex shrink-0 items-center justify-center px-2">
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
          <Tooltip>
            <TooltipTrigger
              render={
                <DropdownMenuTrigger
                  className={cn(
                    "group/org-rail flex shrink-0 items-center justify-center outline-none transition-transform",
                    "hover:scale-[1.04] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
                    "data-popup-open:scale-[1.02]"
                  )}
                  aria-label={`Organization: ${orgFromList.name}`}
                >
                  <OrgMiniAvatar
                    name={orgFromList.name}
                    seed={orgFromList.id}
                    size="rail"
                  />
                </DropdownMenuTrigger>
              }
            />
            <TooltipContent side="right" sideOffset={10} align="center">
              <span className="block text-[10px] font-semibold tracking-wide text-background/70 uppercase">
                Tổ chức
              </span>
              {orgFromList.name}
            </TooltipContent>
          </Tooltip>

          <DropdownMenuContent
            side="right"
            align="start"
            sideOffset={12}
            className="w-[min(18rem,calc(100vw-1rem))] overflow-hidden p-0"
          >
            <div className="border-b border-border/60 px-3 py-2.5">
              <p className="mb-2 truncate px-0.5 text-sm font-semibold text-foreground">
                {orgFromList.name}
              </p>
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
                  placeholder="Search organizations…"
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
                    ? "No organizations found."
                    : "No organizations yet."}
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
    </>
  );
}
