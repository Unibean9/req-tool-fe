"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrgProjects } from "@/hooks/useProject";

import { useOrgWorkspace } from "../../../orgWorkspaceContext";
import { ProjectDashboardHeader } from "./components/projectDashboardHeader";
import { ProjectDashboardIndexedList } from "./components/projectDashboardIndexedList";
import { ProjectDashboardSection } from "./components/projectDashboardSection";

const DASHBOARD_PAIR_ROW_CLASS =
  "grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-x-12 xl:gap-x-16";

function showEditSoon() {
  toast.message("Chức năng chỉnh sửa sẽ có trong bản cập nhật tới.");
}

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
      <div className="space-y-3">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-5 w-full" />
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-44 w-full" />
      </div>
      <Skeleton className="h-48 w-full" />
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

  const project = useMemo(
    () => projects?.find((p) => p.slug === projectSlug) ?? null,
    [projects, projectSlug]
  );

  if (isPending) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-border/70 bg-card/50 px-5 py-8 text-center">
        <p className="text-sm text-destructive">
          {error instanceof Error
            ? error.message
            : "Không tải được dự án."}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => void refetch()}
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
      <ProjectDashboardHeader
        title={project.name}
        description={project.description || undefined}
        orgId={orgId}
        projectId={project.id}
        onEdit={showEditSoon}
      />

      <div className={DASHBOARD_PAIR_ROW_CLASS}>
        <ProjectDashboardSection title="Ngữ cảnh" accent="sky">
          {project.context ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
              {project.context}
            </p>
          ) : (
            <EmptyHint>Chưa có ngữ cảnh.</EmptyHint>
          )}
        </ProjectDashboardSection>

        <ProjectDashboardSection title="Vấn đề" accent="orange">
          <ProjectDashboardIndexedList
            items={project.problems}
            emptyLabel="Chưa có vấn đề nào."
          />
        </ProjectDashboardSection>
      </div>

      <ProjectDashboardSection title="Giải pháp đề xuất" accent="fuchsia">
        <ProjectDashboardIndexedList
          items={project.proposedSolutions}
          emptyLabel="Chưa có đề xuất giải pháp."
          className="[&_li]:rounded-xl [&_li]:border [&_li]:border-border/70 [&_li]:bg-card/40 [&_li]:p-4 [&_li]:shadow-sm"
        />
      </ProjectDashboardSection>
    </div>
  );
}
