"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrgProject, useOrgProjects } from "@/hooks/useProject";

import { PROJECT_BUSINESS_VALUE_LABEL } from "../../project-new/components/projectFormLimits";
import { useOrgWorkspace } from "../../../orgWorkspaceContext";
import { ProjectDashboardHeader } from "./components/projectDashboardHeader";
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

  if (isPending || (listProject && isDetailPending && !detailProject)) {
    return <DashboardSkeleton />;
  }

  if (isError || isDetailError) {
    const err = detailError ?? error;
    return (
      <div className="rounded-xl border border-border/70 bg-card/50 px-5 py-8 text-center">
        <p className="text-sm text-destructive">
          {err instanceof Error ? err.message : "Không tải được dự án."}
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
          Thử lại
        </Button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="rounded-xl border border-border/70 bg-card/50 px-5 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Không tìm thấy dự án trong tổ chức.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto pb-2">
      <ProjectDashboardHeader project={project} orgId={orgId} />

      <div className={DASHBOARD_PAIR_ROW_CLASS}>
        <ProjectDashboardSection title="Mô tả" accent="violet">
          {project.description.trim() ? (
            <ProjectDashboardProse>{project.description}</ProjectDashboardProse>
          ) : (
            <EmptyHint>Chưa có mô tả chi tiết.</EmptyHint>
          )}
        </ProjectDashboardSection>

        <ProjectDashboardSection title="Ngữ cảnh" accent="sky">
          {project.context.trim() ? (
            <ProjectDashboardProse>{project.context}</ProjectDashboardProse>
          ) : (
            <EmptyHint>Chưa có ngữ cảnh.</EmptyHint>
          )}
        </ProjectDashboardSection>
      </div>

      <div className={DASHBOARD_PAIR_ROW_CLASS}>
        <ProjectDashboardSection title="Vấn đề" accent="orange">
          <ProjectDashboardIndexedList
            items={project.problems}
            emptyLabel="Chưa có vấn đề nào."
          />
        </ProjectDashboardSection>

        <ProjectDashboardSection title="Giải pháp đề xuất" accent="fuchsia">
          <ProjectDashboardIndexedList
            items={project.proposedSolutions}
            emptyLabel="Chưa có đề xuất giải pháp."
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
          <EmptyHint>Chưa có mục đích kinh doanh.</EmptyHint>
        )}
      </ProjectDashboardSection>
    </div>
  );
}
