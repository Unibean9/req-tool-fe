"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { useOrgProjects } from "@/hooks/useProject";

import { useOrgWorkspace } from "../../../../orgWorkspaceContext";
import { BRTable } from "./components/brTable";
import { BRToolbar, type BRPriorityFilter } from "./components/brToolbar";

function BRPageSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="space-y-4">
        <Skeleton className="h-14 w-72" />
        <Skeleton className="h-5 w-full max-w-lg" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function ProjectBusinessRequirementsPage() {
  const params = useParams();
  const { orgId } = useOrgWorkspace();
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<BRPriorityFilter>("all");

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
    return <BRPageSkeleton />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <BRToolbar
        search={search}
        onSearchChange={setSearch}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        projectId={project?.id ?? null}
        canCreate={Boolean(project)}
      />
      <BRTable
        projectId={project?.id ?? null}
        search={search}
        priorityFilter={priorityFilter}
      />
    </div>
  );
}
