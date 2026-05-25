"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrgProject, useOrgProjects } from "@/hooks/useProject";

import { PROJECT_BUSINESS_VALUE_LABEL } from "../../project-new/components/projectFormLimits";
import { useOrgWorkspace } from "../../../orgWorkspaceContext";
import { DashboardContextDiagram } from "./components/dashboardContextDiagram";
import { ProjectDashboardHeader, type DashboardTab } from "./components/projectDashboardHeader";
import { ProjectDashboardIndexedList } from "./components/projectDashboardIndexedList";
import { ProjectDashboardProse } from "./components/projectDashboardProse";
import { ProjectDashboardSection } from "./components/projectDashboardSection";

const DASHBOARD_PAIR_ROW_CLASS =
  "grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-x-12 xl:gap-x-16";

function EmptyHint({ children }: { children: string }) {
  return (
    <p className="text-sm leading-relaxed text-muted-foreground italic">
      {children}
    </p>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto">
      <div className="space-y-4 border-b border-border/50 pb-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-5 w-full max-w-2xl" />
        <div className="flex gap-3">
          <Skeleton className="h-12 w-44 rounded-xl" />
          <Skeleton className="h-12 w-36 rounded-xl" />
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
      <Skeleton className="h-28 w-full" />
    </div>
  );
}

export default function ProjectDashboardPage() {
  const params = useParams();
  const { orgId } = useOrgWorkspace();

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

  const {
    data: projects,
    isPending,
    isError,
    error,
    refetch,
  } = useOrgProjects(orgId);

  const listProject = useMemo(
    () => projects?.find((p) => p.slug === projectSlug) ?? null,
    [projects, projectSlug]
  );

  const {
    data: detailProject,
    isPending: isDetailPending,
    isError: isDetailError,
    error: detailError,
    refetch: refetchDetail,
  } = useOrgProject(orgId, listProject?.id ?? null, {
    enabled: Boolean(listProject?.id),
  });

  const project = detailProject ?? listProject;
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");

  if (isPending || (listProject && isDetailPending && !detailProject)) {
    return <DashboardSkeleton />;
  }

  if (isError || isDetailError) {
    const err = detailError ?? error;
    return (
      <div className="rounded-xl border border-border/70 bg-card/50 px-5 py-8 text-center">
        <p className="text-sm text-destructive">
          {err instanceof Error ? err.message : "Failed to load the project."}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => {
            void refetch();
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
      <div className="rounded-xl border border-border/70 bg-card/50 px-5 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          No project found in this organization.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto pb-2">
      <ProjectDashboardHeader
        project={project}
        orgId={orgId}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === "overview" ? (
        <>
          <div className={DASHBOARD_PAIR_ROW_CLASS}>
            <ProjectDashboardSection title="Description" accent="violet">
              {project.description.trim() ? (
                <ProjectDashboardProse>{project.description}</ProjectDashboardProse>
              ) : (
                <EmptyHint>No description provided.</EmptyHint>
              )}
            </ProjectDashboardSection>

            <ProjectDashboardSection title="Context" accent="sky">
              {project.context.trim() ? (
                <ProjectDashboardProse>{project.context}</ProjectDashboardProse>
              ) : (
                <EmptyHint>No context provided.</EmptyHint>
              )}
            </ProjectDashboardSection>
          </div>

          <div className={DASHBOARD_PAIR_ROW_CLASS}>
            <ProjectDashboardSection title="Problems" accent="orange">
              <ProjectDashboardIndexedList
                items={project.problems}
                emptyLabel="No problems listed."
              />
            </ProjectDashboardSection>

            <ProjectDashboardSection title="Proposed Solutions" accent="fuchsia">
              <ProjectDashboardIndexedList
                items={project.proposedSolutions}
                emptyLabel="No proposed solutions yet."
              />
            </ProjectDashboardSection>
          </div>

          <ProjectDashboardSection
            title={PROJECT_BUSINESS_VALUE_LABEL}
            accent="teal"
          >
            {project.roiNotes.trim() ? (
              <ProjectDashboardProse>{project.roiNotes}</ProjectDashboardProse>
            ) : (
              <EmptyHint>No business purpose defined.</EmptyHint>
            )}
          </ProjectDashboardSection>
        </>
      ) : (
        <DashboardContextDiagram projectId={project.id} projectName={project.name} />
      )}
    </div>
  );
}
