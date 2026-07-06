"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { OrgProject } from "@/lib/api/services/fetchProject";
import { useDeleteOrgProject } from "@/hooks/useProject";

import { useProjectWorkspaceNav } from "../../../components/projectWorkspaceNavContext";
import { ProjectUpsertDialog } from "../../../../components/projectUpsertDialog";
import { DeleteOrgProjectDialog } from "./deleteOrgProjectDialog";

export type ProjectDashboardHeaderProps = {
  project: OrgProject;
  orgId: string;
};

export function ProjectDashboardHeader({
  project,
  orgId,
}: ProjectDashboardHeaderProps) {
  const { navigateAfterProjectDelete } = useProjectWorkspaceNav();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const deleteMutation = useDeleteOrgProject({
    onSuccess: (_data, variables, context) => {
      setDeleteOpen(false);
      navigateAfterProjectDelete(variables.projectId, context?.nextSlug);
    },
  });

  return (
    <>
      <header className="space-y-3 border-b border-border/50 pb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="text-[11px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
              Title
            </p>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {project.name}
            </h1>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 border-border/80"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="size-3.5" aria-hidden />
              Edit
            </Button>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="gap-1.5"
              onClick={() => setDeleteOpen(true)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="size-3.5" aria-hidden />
              Delete Project
            </Button>
          </div>
        </div>
      </header>

      <ProjectUpsertDialog
        orgId={orgId}
        project={project}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

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
