"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Download, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { buildProjectEditPath } from "@/app/(org)/components/orgWorkspacePaths";
import { Button, buttonVariants } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api/getApiErrorMessage";
import type { OrgProject } from "@/lib/api/services/fetchProject";
import { useDeleteOrgProject, useProjectBrdExport } from "@/hooks/useProject";
import { cn } from "@/lib/utils";

import { useOrgWorkspace } from "../../../../orgWorkspaceContext";
import { useProjectWorkspaceNav } from "../../components/projectWorkspaceNavContext";
import { BrdExportDialog } from "./brdExportDialog";
import { DeleteOrgProjectDialog } from "./deleteOrgProjectDialog";
import { ProjectDashboardMeta } from "./projectDashboardMeta";

export type DashboardTab = "overview" | "context-diagram";

export type ProjectDashboardHeaderProps = {
  project: OrgProject;
  orgId: string;
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
};

const TABS: { value: DashboardTab; label: string }[] = [
  { value: "overview", label: "Tổng quan dự án" },
  { value: "context-diagram", label: "Context Diagram" },
];

export function ProjectDashboardHeader({
  project,
  orgId,
  activeTab,
  onTabChange,
}: ProjectDashboardHeaderProps) {
  const { slug } = useOrgWorkspace();
  const pathname = usePathname() ?? "";
  const { navigateAfterProjectDelete } = useProjectWorkspaceNav();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [brdDialogOpen, setBrdDialogOpen] = useState(false);

  const brdQuery = useProjectBrdExport(project.id, { enabled: false });
  const brdMarkdown = brdQuery.data?.data?.markdown ?? null;

  const deleteMutation = useDeleteOrgProject({
    onSuccess: (_data, variables, context) => {
      setDeleteOpen(false);
      navigateAfterProjectDelete(variables.projectId, context?.nextSlug);
    },
  });

  const executiveSummary = project.executiveSummary.trim();
  const editHref = buildProjectEditPath(slug, project.slug, { returnTo: pathname });

  async function handleOpenBrdDialog() {
    setBrdDialogOpen(true);
    if (!brdMarkdown) {
      const result = await brdQuery.refetch();
      if (result.isError) {
        toast.error(getApiErrorMessage(result.error, "Không tải được nội dung BRD"));
      }
    }
  }

  return (
    <>
      <header className="space-y-4 border-b border-border/50">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {project.name}
            </h1>
            {executiveSummary ? (
              <p className={cn("max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base")}>
                {executiveSummary}
              </p>
            ) : (
              <p className="text-sm italic text-muted-foreground">Chưa có tóm tắt.</p>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 border-border/80"
              onClick={() => void handleOpenBrdDialog()}
              disabled={brdQuery.isFetching}
              aria-live="polite"
            >
              <Download
                className={cn("size-3.5", brdQuery.isFetching && "animate-pulse opacity-70")}
                aria-hidden
              />
              {brdQuery.isFetching ? "Đang tải…" : "Tải BRD Template"}
            </Button>

            <Link
              href={editHref}
              className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5 border-border/80" })}
            >
              <Pencil className="size-3.5" aria-hidden />
              Chỉnh sửa
            </Link>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="gap-1.5"
              onClick={() => setDeleteOpen(true)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="size-3.5" aria-hidden />
              Xóa dự án
            </Button>
          </div>
        </div>

        <ProjectDashboardMeta
          startDate={project.startDate}
          endDate={project.endDate}
          budget={project.budget}
        />

        <div className="flex gap-1" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.value}
              onClick={() => onTabChange(tab.value)}
              className={cn(
                "relative px-3 pb-2 pt-1 text-sm font-medium transition-colors after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:transition-opacity",
                activeTab === tab.value
                  ? "text-foreground after:bg-foreground after:opacity-100"
                  : "text-muted-foreground after:opacity-0 hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <BrdExportDialog
        open={brdDialogOpen}
        onOpenChange={setBrdDialogOpen}
        markdown={brdMarkdown}
        loading={brdQuery.isFetching}
        projectName={project.name}
      />

      <DeleteOrgProjectDialog
        open={deleteOpen}
        projectName={project.name}
        deletePending={deleteMutation.isPending}
        onOpenChange={setDeleteOpen}
        onConfirmDelete={() => deleteMutation.mutate({ orgId, projectId: project.id })}
      />
    </>
  );
}
