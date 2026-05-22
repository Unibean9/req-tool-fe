"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { useOrgProjects } from "@/hooks/useProject";

import { useOrgWorkspace } from "../../../../orgWorkspaceContext";
import { RuleTable } from "./components/ruleTable";
import {
  RuleToolbar,
  type RuleDynamicFilter,
  type RuleTypeFilter,
} from "./components/ruleToolbar";

function RulesPageSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="space-y-4">
        <Skeleton className="h-14 w-64" />
        <Skeleton className="h-5 w-full max-w-md" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function ProjectBusinessRulesPage() {
  const params = useParams();
  const { orgId } = useOrgWorkspace();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<RuleTypeFilter>("all");
  const [dynamicFilter, setDynamicFilter] =
    useState<RuleDynamicFilter>("all");

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
    return <RulesPageSkeleton />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <RuleToolbar
        search={search}
        onSearchChange={setSearch}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        dynamicFilter={dynamicFilter}
        onDynamicFilterChange={setDynamicFilter}
        projectId={project?.id ?? null}
        canCreate={Boolean(project)}
      />
      <RuleTable
        projectId={project?.id ?? null}
        search={search}
        typeFilter={typeFilter}
        dynamicFilter={dynamicFilter}
      />
    </div>
  );
}
