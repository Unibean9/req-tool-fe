"use client";

import { useEffect, useState } from "react";
import { FolderKanban } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { OrgProject } from "@/lib/api/services/fetchProject";
import {
  orgProjectFormValuesToCreateBody,
  orgProjectFormValuesToUpdateBody,
  orgProjectToFormValues,
  type OrgProjectFormValues,
} from "@/lib/project/orgProjectForm";
import { useCreateOrgProject, useUpdateOrgProject } from "@/hooks/useProject";

import { PROJECT_DESCRIPTION_MAX_CHARS, PROJECT_NAME_MAX_CHARS } from "../project-new/components/projectFormLimits";

export type ProjectUpsertDialogProps = {
  orgId: string;
  /** If provided, dialog is in edit mode. */
  project?: OrgProject | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (project: OrgProject) => void;
};

function emptyForm(): OrgProjectFormValues {
  return { name: "", description: "" };
}

export function ProjectUpsertDialog({
  orgId,
  project,
  open,
  onOpenChange,
  onSuccess,
}: ProjectUpsertDialogProps) {
  const isEdit = Boolean(project);
  const [form, setForm] = useState<OrgProjectFormValues>(emptyForm);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        setForm(project ? orgProjectToFormValues(project) : emptyForm());
        setNameError(null);
      }, 0);
    }
  }, [open, project]);

  const createMutation = useCreateOrgProject({
    onSuccess: (res) => {
      onOpenChange(false);
      onSuccess?.(res.data);
    },
  });

  const updateMutation = useUpdateOrgProject({
    onSuccess: (res) => {
      onOpenChange(false);
      onSuccess?.(res.data);
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;
  const nameTrimmed = form.name.trim();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nameTrimmed) {
      setNameError("Project name is required");
      return;
    }
    setNameError(null);

    if (isEdit && project) {
      updateMutation.mutate({
        orgId,
        projectId: project.id,
        body: orgProjectFormValuesToUpdateBody(form),
      });
    } else {
      createMutation.mutate({
        orgId,
        body: orgProjectFormValuesToCreateBody(form),
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!isPending) onOpenChange(next); }}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit project" : "New project"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update the project name and description."
                : "Enter a name and optional description for your new project."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="upsert-pn-name" className="text-sm font-semibold">
                  Project name <span className="text-destructive">*</span>
                </Label>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {form.name.length} / {PROJECT_NAME_MAX_CHARS}
                </span>
              </div>
              <div className="relative">
                <FolderKanban className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="upsert-pn-name"
                  autoComplete="off"
                  aria-invalid={Boolean(nameError)}
                  placeholder="Enter project name…"
                  value={form.name}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, name: e.target.value.slice(0, PROJECT_NAME_MAX_CHARS) }));
                    if (nameError) setNameError(null);
                  }}
                  disabled={isPending}
                  maxLength={PROJECT_NAME_MAX_CHARS}
                  className={cn(
                    "h-10 pl-9",
                    nameError && "border-destructive focus-visible:ring-destructive/30"
                  )}
                />
              </div>
              {nameError ? (
                <p className="text-sm text-destructive">{nameError}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="upsert-pn-desc" className="text-sm font-semibold">
                  Description
                </Label>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {form.description.length} / {PROJECT_DESCRIPTION_MAX_CHARS}
                </span>
              </div>
              <Textarea
                id="upsert-pn-desc"
                placeholder="Describe the project's purpose and scope…"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value.slice(0, PROJECT_DESCRIPTION_MAX_CHARS) }))
                }
                disabled={isPending}
                maxLength={PROJECT_DESCRIPTION_MAX_CHARS}
                className="min-h-28 resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !nameTrimmed}
            >
              {isPending
                ? isEdit
                  ? "Saving…"
                  : "Creating…"
                : isEdit
                  ? "Save changes"
                  : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
