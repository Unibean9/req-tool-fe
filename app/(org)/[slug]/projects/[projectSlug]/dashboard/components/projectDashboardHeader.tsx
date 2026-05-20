"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { buildProjectEditPath } from "@/app/(org)/components/orgWorkspacePaths";
import { Button, buttonVariants } from "@/components/ui/button";
import type { OrgProject } from "@/lib/api/services/fetchProject";
import { useDeleteOrgProject } from "@/hooks/useProject";
import { cn } from "@/lib/utils";

import { useOrgWorkspace } from "../../../../orgWorkspaceContext";
import { useProjectWorkspaceNav } from "../../components/projectWorkspaceNavContext";
import { DeleteOrgProjectDialog } from "./deleteOrgProjectDialog";
import { ProjectDashboardMeta } from "./projectDashboardMeta";

export type ProjectDashboardHeaderProps = {
  project: OrgProject;
  orgId: string;
};

export function ProjectDashboardHeader({
  project,
  orgId,
}: ProjectDashboardHeaderProps) {
  const { slug } = useOrgWorkspace();
  const pathname = usePathname() ?? "";
  const { navigateAfterProjectDelete } = useProjectWorkspaceNav();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteMutation = useDeleteOrgProject({
    onSuccess: (_data, variables, context) => {
      setDeleteOpen(false);
      navigateAfterProjectDelete(variables.projectId, context?.nextSlug);
    },
  });

  const executiveSummary = project.executiveSummary.trim();
  const editHref = buildProjectEditPath(slug, project.slug, {
    returnTo: pathname,
  });

  return (
    <>
      <header className="space-y-4 border-b border-border/50 pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {project.name}
            </h1>
            {executiveSummary ? (
              <p
                className={cn(
                  "max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base"
                )}
              >
                {executiveSummary}
              </p>
            ) : (
              <p className="text-sm italic text-muted-foreground">
                Chưa có mô tả ngắn.
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              href={editHref}
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "gap-1.5 border-border/80",
              })}
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
      </header>

      <DeleteOrgProjectDialog
        open={deleteOpen}
        projectName={project.name}
        deletePending={deleteMutation.isPending}
        onOpenChange={setDeleteOpen}
        onConfirmDelete={() =>
          deleteMutation.mutate({ orgId, projectId: project.id })
        }
      />
    </>
  );
}
