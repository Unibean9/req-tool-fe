"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { useOrgProjects } from "@/hooks/useProject";

import { useOrgWorkspace } from "../../../../orgWorkspaceContext";
import { OutOfScopeTable } from "./components/outOfScopeTable";
import {
  OutOfScopeToolbar,
  type OutOfScopeCategoryFilter,
} from "./components/outOfScopeToolbar";

function OutOfScopePageSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="space-y-4">
        <Skeleton className="h-14 w-72" />
        <Skeleton className="h-5 w-full max-w-lg" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function ProjectBusinessOutOfScopePage() {
  const params = useParams();
  const { orgId } = useOrgWorkspace();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState<OutOfScopeCategoryFilter>("all");

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

  const { data: projects, isPending: isProjectsPending } =
    useOrgProjects(orgId);

  const project = useMemo(
    () => projects?.find((p) => p.slug === projectSlug) ?? null,
    [projects, projectSlug]
  );

  if (isProjectsPending) {
    return <OutOfScopePageSkeleton />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <OutOfScopeToolbar
        search={search}
        onSearchChange={setSearch}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        projectId={project?.id ?? null}
        canCreate={Boolean(project)}
      />
      <OutOfScopeTable
        projectId={project?.id ?? null}
        search={search}
        categoryFilter={categoryFilter}
      />
    </div>
  );
}
