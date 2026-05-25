"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { CreateOrgProjectRequest } from "@/lib/api/services/fetchProject";

import { PROJECT_CONTEXT_MAX_CHARS, PROJECT_MIN_TEXT_CHARS } from "../projectFormLimits";
import { ProjectNewFieldError } from "../projectNewFieldError";
import { resolveProjectNewTextFieldError } from "../projectNewFieldValidation";
import type { ProjectNewFormErrors } from "../projectNewFormSchema";
import { ProjectNewStringListField } from "../projectNewStringListField";

export function ProjectNewStepContext({
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
  const contextLen = form.context.length;
  const contextError = resolveProjectNewTextFieldError(
    form.context,
    errors?.context,
    showSubmitErrors
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Context and problems
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          All fields are required — the context and each problem must be at least{" "}
          {PROJECT_MIN_TEXT_CHARS} characters; at least one problem is required.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="pn-context" className="text-sm font-semibold">
              Context <span className="text-destructive">*</span>
            </Label>
            <span
              className="text-xs tabular-nums text-muted-foreground"
              aria-live="polite"
            >
              {contextLen} / {PROJECT_CONTEXT_MAX_CHARS}
            </span>
          </div>
          <div className="relative">
            <Textarea
              id="pn-context"
              aria-invalid={Boolean(contextError)}
              placeholder="Describe the current state, systems in use, or relevant background…"
              value={form.context}
              onChange={(e) =>
                onPatch({
                  context: e.target.value.slice(0, PROJECT_CONTEXT_MAX_CHARS),
                })
              }
              disabled={disabled}
              maxLength={PROJECT_CONTEXT_MAX_CHARS}
              className={cn(
                "min-h-36 border-2 border-border/90 sm:min-h-40 dark:border-zinc-600",
                contextError && "border-destructive"
              )}
            />
          </div>
          <ProjectNewFieldError message={contextError} />
        </div>

        <ProjectNewStringListField
          id="pn-problems"
          fieldKey="problems"
          label="Problems to solve"
          required
          hint={`At least one item, each at least ${PROJECT_MIN_TEXT_CHARS} characters`}
          placeholder="E.g. Slow payments, missing reports…"
          items={form.problems}
          onChange={(problems) => onPatch({ problems })}
          disabled={disabled}
          addLabel="Add problem"
          addButtonInHeader
          showSubmitErrors={showSubmitErrors}
          errors={errors}
        />
      </div>
    </div>
  );
}
