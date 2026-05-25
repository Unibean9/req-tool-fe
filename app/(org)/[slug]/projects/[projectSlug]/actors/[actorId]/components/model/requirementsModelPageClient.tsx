"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrgProjects } from "@/hooks/useProject";

import { useOrgWorkspace } from "../../../../../../orgWorkspaceContext";
import { RequirementsCanvas } from "./requirementsCanvas";
import { RequirementsDetailPanel } from "./requirementsDetailPanel";
import {
  RequirementsModelProvider,
  useRequirementsModel,
} from "./requirementsModelContext";
import { RequirementsPalette } from "./requirementsPalette";

const shellClassName = "flex min-h-0 flex-1 flex-col overflow-hidden";

function RequirementsModelWorkspace() {
  const [paletteOpen, setPaletteOpen] = useState(true);
  const { isLoading, isError, error, refetch } = useRequirementsModel();

  if (isLoading) {
    return (
      <div className="relative mt-4 flex min-h-105 flex-1 flex-col gap-3 overflow-hidden rounded-xl border border-border/80 p-4 sm:mt-6">
        <Skeleton className="h-11 w-full max-w-md" />
        <Skeleton className="min-h-80 flex-1 rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="relative mt-4 flex min-h-105 flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-border/80 p-6 sm:mt-6">
        <p className="max-w-md text-center text-sm text-muted-foreground">
          {error?.message ?? "Failed to load the requirements model."}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="relative mt-4 flex min-h-105 flex-1 overflow-hidden rounded-xl border border-border/80 sm:mt-6">
      <RequirementsPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <RequirementsCanvas className="min-h-105 flex-1 rounded-none border-0" />
      <RequirementsDetailPanel />
    </div>
  );
}

function RequirementsModelPageContent() {
  const { actorMeta } = useRequirementsModel();

  return (
    <div className={shellClassName}>
      <header className="flex shrink-0 flex-col gap-2">
        <h1 className="font-heading min-w-0 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Mô hình yêu cầu · {actorMeta.name || "Actor"}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          Create and manage the requirements model for this actor
        </p>
      </header>

      <RequirementsModelWorkspace />
    </div>
  );
}

export function RequirementsModelPageClient({ actorId }: { actorId: string }) {
  const params = useParams();
  const projectSlug =
    typeof params.projectSlug === "string" ? params.projectSlug : "";
  const { orgId } = useOrgWorkspace();
  const { data: projects = [], isPending: projectsLoading } = useOrgProjects(orgId);

  const projectId = useMemo(() => {
    if (!projectSlug) return null;
    return projects.find((p) => p.slug === projectSlug)?.id ?? null;
  }, [projectSlug, projects]);

  if (projectsLoading) {
    return (
      <div className={shellClassName}>
        <Skeleton className="h-10 w-72" />
        <Skeleton className="mt-6 min-h-105 flex-1 rounded-xl" />
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className={shellClassName}>
        <p className="text-sm text-muted-foreground">
          Project could not be determined. Go back to the workspace and select a project.
        </p>
      </div>
    );
  }

  return (
    <RequirementsModelProvider
      key={`${projectId}-${actorId}`}
      projectId={projectId}
      actorId={actorId}
    >
      <RequirementsModelPageContent />
    </RequirementsModelProvider>
  );
}
