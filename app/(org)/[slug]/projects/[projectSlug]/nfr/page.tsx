"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { useOrgProjects } from "@/hooks/useProject";

import { useOrgWorkspace } from "../../../orgWorkspaceContext";
import { NfrList } from "./components/nfrList";
import type { NfrCategoryFilter, NfrPriorityFilter } from "./components/nfrCategoryMeta";
import {
  NfrToolbar,
  nfrToolbarFiltersToListParams,
} from "./components/nfrToolbar";

function NfrPageSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="space-y-4">
        <Skeleton className="h-14 w-64" />
        <Skeleton className="h-5 w-full max-w-md" />
        <Skeleton className="h-10 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-10 w-40" />
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

export default function ProjectNfrPage() {
  const params = useParams();
  const { orgId } = useOrgWorkspace();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState<NfrCategoryFilter>("all");
  const [priorityFilter, setPriorityFilter] =
    useState<NfrPriorityFilter>("all");

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

  const listParams = useMemo(
    () => nfrToolbarFiltersToListParams(categoryFilter, priorityFilter),
    [categoryFilter, priorityFilter]
  );

  if (isProjectsPending) {
    return <NfrPageSkeleton />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
      <NfrToolbar
        search={search}
        onSearchChange={setSearch}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        projectId={project?.id ?? null}
        canCreate={Boolean(project)}
      />
      <NfrList
        projectId={project?.id ?? null}
        search={search}
        listParams={listParams}
      />
    </div>
  );
}
