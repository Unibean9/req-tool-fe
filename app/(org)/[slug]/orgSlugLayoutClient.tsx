"use client";

import { useMemo, type ReactNode } from "react";
import { notFound, useParams, usePathname } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { useOrgMe } from "@/hooks/useOrg";
import { useUserMe } from "@/hooks/useUser";
import { useAppSelector } from "@/lib/redux/hooks";
import { selectUser } from "@/lib/redux/slices/authSlice";

import {
  isOrgMembersWorkbenchPath,
  isOrgProjectWizardPath,
  isOrgProjectSlugWorkspacePath,
} from "../components/orgWorkspacePaths";

import {
  OrgWorkspaceContext,
  type OrgWorkspaceContextValue,
} from "./orgWorkspaceContext";

function OrgWorkspaceLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border/70 px-4">
        <Skeleton className="size-9 shrink-0 rounded-lg" />
        <Skeleton className="h-6 w-48 rounded-md" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-6">
        <Skeleton className="h-32 w-full max-w-lg rounded-xl" />
      </div>
    </div>
  );
}

function OrgWorkspaceChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const fullBleedMain =
    isOrgProjectWizardPath(pathname) ||
    isOrgProjectSlugWorkspacePath(pathname) ||
    isOrgMembersWorkbenchPath(pathname);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <main
        data-scroll-gutter-scope
        className={
          fullBleedMain
            ? "flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-0"
            : "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-4 sm:p-6"
        }
      >
        {children}
      </main>
    </div>
  );
}

function OrgSlugWorkspace({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const { data: orgs, isPending, isError } = useOrgMe();
  const user = useAppSelector(selectUser);
  const { data: meProfile } = useUserMe();

  const orgFromList = useMemo(
    () => orgs?.find((o) => o.slug === slug) ?? null,
    [orgs, slug]
  );

  const selfId = user?.id?.trim() || meProfile?.id?.trim() || "";
  const ownerOid = orgFromList?.ownerId?.trim() ?? "";
  const canManageOrgMembers = useMemo(
    () => Boolean(ownerOid) && Boolean(selfId) && selfId === ownerOid,
    [ownerOid, selfId]
  );

  if (isPending) {
    return <OrgWorkspaceLoading />;
  }

  if (isError || !orgFromList || !orgs?.length) {
    notFound();
  }

  const value: OrgWorkspaceContextValue = {
    slug,
    orgId: orgFromList.id,
    orgFromList,
    orgs,
    canManageOrgMembers,
    selfUserId: selfId,
  };

  return (
    <OrgWorkspaceContext.Provider value={value}>
      <OrgWorkspaceChrome>{children}</OrgWorkspaceChrome>
    </OrgWorkspaceContext.Provider>
  );
}

export function OrgSlugLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const raw = params?.slug;
  const slug =
    typeof raw === "string"
      ? decodeURIComponent(raw)
      : Array.isArray(raw)
        ? decodeURIComponent(raw[0] ?? "")
        : "";

  if (!slug) {
    return (
      <div className="text-destructive p-6 text-sm">
        Invalid path.
      </div>
    );
  }

  return <OrgSlugWorkspace slug={slug}>{children}</OrgSlugWorkspace>;
}
