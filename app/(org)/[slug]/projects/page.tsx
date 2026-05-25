"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrgProjects } from "@/hooks/useProject";

import { buildOrgEntryPath } from "../../components/orgWorkspacePaths";
import { useOrgWorkspace } from "../orgWorkspaceContext";
import { ProjectEmptyState } from "./components/projectEmptyState";

export default function OrgProjectsPage() {
  const router = useRouter();
  const { orgId, slug, orgFromList } = useOrgWorkspace();
  const { data: projects, isPending, isError, error, refetch } =
    useOrgProjects(orgId);

  const createProjectHref = `/${encodeURIComponent(slug)}/projects/project-new`;
  const hasProjects = (projects?.length ?? 0) > 0;

  useEffect(() => {
    if (isPending || !hasProjects) return;
    router.replace(buildOrgEntryPath(slug, projects!));
  }, [hasProjects, isPending, projects, router, slug]);

  if (isPending || hasProjects) {
    return (
      <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-4 p-6">
        <Skeleton className="size-16 rounded-2xl" />
        <Skeleton className="h-8 w-56 max-w-full rounded-md" />
        <Skeleton className="h-4 w-72 max-w-full rounded-md" />
        <Skeleton className="h-11 w-40 rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-full flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card/60 px-5 py-6 text-center shadow-md ring-1 ring-white/5 sm:px-6">
          <p className="text-destructive text-sm">
            {error instanceof Error
              ? error.message
              : "Failed to load project information."}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => void refetch()}
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ProjectEmptyState
      orgName={orgFromList.name}
      createProjectHref={createProjectHref}
    />
  );
}
