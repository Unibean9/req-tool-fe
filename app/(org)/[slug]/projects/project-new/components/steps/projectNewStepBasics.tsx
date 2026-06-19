"use client";

import { FolderKanban } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { CreateOrgProjectRequest } from "@/lib/api/services/fetchProject";

import { ProjectNewFieldError } from "../projectNewFieldError";
import {
  PROJECT_DESCRIPTION_MAX_CHARS,
  PROJECT_NAME_MAX_CHARS,
} from "../projectFormLimits";
import type { ProjectNewFormErrors } from "../projectNewFormSchema";

export function ProjectNewStepBasics({
  form,
  onPatch,
  disabled,
  showSubmitErrors = false,
  errors,
}: {
  form: CreateOrgProjectRequest;
  onPatch: (patch: Partial<CreateOrgProjectRequest>) => void;
  disabled?: boolean;
  showSubmitErrors?: boolean;
  errors?: ProjectNewFormErrors;
}) {
  const nameLen = form.name.length;
  const descriptionLen = (form.description ?? "").length;

  const nameError =
    showSubmitErrors && errors?.name ? errors.name : undefined;
  const descriptionError =
    showSubmitErrors && errors?.description ? errors.description : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Project basics
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Give your project a name and an optional description.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="pn-name" className="text-sm font-semibold">
              Project name <span className="text-destructive">*</span>
            </Label>
            <span
              className="text-xs tabular-nums text-muted-foreground"
              aria-live="polite"
            >
              {nameLen} / {PROJECT_NAME_MAX_CHARS}
            </span>
          </div>
          <div className="relative">
            <FolderKanban className="text-foreground/40 pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2" />
            <Input
              id="pn-name"
              autoComplete="off"
              aria-invalid={Boolean(nameError)}
              placeholder="Enter project name…"
              value={form.name}
              onChange={(e) =>
                onPatch({
                  name: e.target.value.slice(0, PROJECT_NAME_MAX_CHARS),
                })
              }
              disabled={disabled}
              maxLength={PROJECT_NAME_MAX_CHARS}
              className={cn(
                "h-11 border-2 border-border/90 pl-11 dark:border-zinc-600",
                nameError && "border-destructive"
              )}
            />
          </div>
          <ProjectNewFieldError message={nameError} />
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="pn-desc" className="text-sm font-semibold">
              Description
            </Label>
            <span
              className="text-xs tabular-nums text-muted-foreground"
              aria-live="polite"
            >
              {descriptionLen} / {PROJECT_DESCRIPTION_MAX_CHARS}
            </span>
          </div>
          <Textarea
            id="pn-desc"
            aria-invalid={Boolean(descriptionError)}
            placeholder="Describe the project's purpose, scope, and intended audience…"
            value={form.description ?? ""}
            onChange={(e) =>
              onPatch({
                description: e.target.value.slice(
                  0,
                  PROJECT_DESCRIPTION_MAX_CHARS
                ),
              })
            }
            disabled={disabled}
            maxLength={PROJECT_DESCRIPTION_MAX_CHARS}
            className={cn(
              "min-h-36 border-2 border-border/90 sm:min-h-40 dark:border-zinc-600",
              descriptionError && "border-destructive"
            )}
          />
          <ProjectNewFieldError message={descriptionError} />
        </div>
      </div>
    </div>
  );
}
