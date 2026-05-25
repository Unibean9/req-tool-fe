"use client";

import { useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrgProject, useOrgProjects } from "@/hooks/useProject";
import {
  buildProjectWorkspacePath,
  resolveWizardExitHref,
} from "@/app/(org)/components/orgWorkspacePaths";

import { useOrgWorkspace } from "../../orgWorkspaceContext";
import { ProjectEditWizard } from "./components/projectEditWizard";

function decodeProjectSlugParam(raw: string | null): string {
  const t = (raw ?? "").trim();
  if (!t) return "";
  try {
    return decodeURIComponent(t).trim();
  } catch {
    return t;
  }
}

function EditWizardSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden bg-background">
      <Skeleton className="hidden w-65 shrink-0 lg:block" />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 p-6">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="min-h-60 flex-1 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    </div>
  );
}

function OrgProjectEditPageContent() {
  const searchParams = useSearchParams();
  const { orgId, slug } = useOrgWorkspace();
  const encSlug = encodeURIComponent(slug);

  const projectSlug = useMemo(
    () => decodeProjectSlugParam(searchParams.get("project")),
    [searchParams]
  );

  const defaultExitHref = projectSlug
    ? buildProjectWorkspacePath(slug, projectSlug, "dashboard")
    : `/${encSlug}/projects`;

  const dashboardHref = resolveWizardExitHref(
    slug,
    searchParams.get("returnTo"),
    defaultExitHref
  );

  const {
    data: projects,
    isPending: listPending,
    isError: listError,
    error: listErr,
    refetch: refetchList,
  } = useOrgProjects(orgId);

  const listProject = useMemo(
    () => projects?.find((p) => p.slug === projectSlug) ?? null,
    [projects, projectSlug]
  );

  const {
    data: detailProject,
    isPending: detailPending,
    isError: detailError,
    error: detailErr,
    refetch: refetchDetail,
  } = useOrgProject(orgId, listProject?.id ?? null, {
    enabled: Boolean(listProject?.id),
  });

  const project = detailProject ?? listProject;

  if (!projectSlug) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Missing project parameter. Open edit mode from the project dashboard.
        </p>
        <Link
          href={`/${encSlug}/projects`}
          className={buttonVariants({ variant: "outline" })}
        >
          Back to projects
        </Link>
      </div>
    );
  }

  if (listPending || (listProject && detailPending && !detailProject)) {
    return <EditWizardSkeleton />;
  }

  if (listError || detailError) {
    const err = detailErr ?? listErr;
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-sm text-destructive">
          {err instanceof Error ? err.message : "Failed to load the project."}
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void refetchList();
            void refetchDetail();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Project not found in this organization.
        </p>
        <Link
          href={dashboardHref}
          className={buttonVariants({ variant: "outline" })}
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <ProjectEditWizard
      key={project.id}
      orgId={orgId}
      project={project}
      dashboardHref={dashboardHref}
    />
  );
}

export default function OrgProjectEditPage() {
  return (
    <Suspense fallback={<EditWizardSkeleton />}>
      <OrgProjectEditPageContent />
    </Suspense>
  );
}
