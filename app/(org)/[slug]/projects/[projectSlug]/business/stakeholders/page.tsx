"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { useOrgProjects } from "@/hooks/useProject";

import { useOrgWorkspace } from "../../../../orgWorkspaceContext";
import { StakeHolderTable } from "./components/stakeHolderTable";
import {
  StakeHolderToolbar,
  type StakeholderBusinessActorFilter,
} from "./components/stakeHolderToolbar";

function StakeholdersPageSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="space-y-4">
        <Skeleton className="h-14 w-64" />
        <Skeleton className="h-5 w-full max-w-md" />
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-full max-w-56 sm:w-56" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function ProjectBusinessStakeholdersPage() {
  const params = useParams();
  const { orgId } = useOrgWorkspace();
  const [search, setSearch] = useState("");
  const [businessActorFilter, setBusinessActorFilter] =
    useState<StakeholderBusinessActorFilter>("all");

  const projectSlug = useMemo(() => {
    const raw = params?.projectSlug;
    const s =
      typeof raw === "string"
        ? raw
        : Array.isArray(raw)
          ? (raw[0] ?? "")
          : "";
    try {
      return decodeURIComponent(s).trim();
    } catch {
      return s.trim();
    }
  }, [params?.projectSlug]);

  const { data: projects, isPending: isProjectsPending } = useOrgProjects(orgId);

  const project = useMemo(
    () => projects?.find((p) => p.slug === projectSlug) ?? null,
    [projects, projectSlug]
  );

  if (isProjectsPending) {
    return <StakeholdersPageSkeleton />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <StakeHolderToolbar
        search={search}
        onSearchChange={setSearch}
        businessActorFilter={businessActorFilter}
        onBusinessActorFilterChange={setBusinessActorFilter}
        projectId={project?.id ?? null}
        canCreate={Boolean(project)}
      />
      <StakeHolderTable
        projectId={project?.id ?? null}
        search={search}
        businessActorFilter={businessActorFilter}
      />
    </div>
  );
}
