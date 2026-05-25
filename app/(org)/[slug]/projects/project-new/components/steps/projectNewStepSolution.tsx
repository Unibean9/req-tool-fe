"use client";

import type { CreateOrgProjectRequest } from "@/lib/api/services/fetchProject";

import { PROJECT_MIN_TEXT_CHARS } from "../projectFormLimits";
import { ProjectBudgetVndInput } from "../projectBudgetVndInput";
import type { ProjectNewFormErrors } from "../projectNewFormSchema";
import { ProjectNewStringListField } from "../projectNewStringListField";

export function ProjectNewStepSolution({
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
  return (
    <div className="w-full space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Proposed solutions
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A budget and at least one proposal are required — each item must be at least {PROJECT_MIN_TEXT_CHARS}{" "}
          characters.
        </p>
      </div>

      <ProjectBudgetVndInput
        value={form.budget ?? 0}
        onChange={(budget) => onPatch({ budget })}
        disabled={disabled}
        required
        showError={showSubmitErrors}
        error={errors?.budget}
      />

      <ProjectNewStringListField
        id="pn-solution"
        fieldKey="proposedSolutions"
        label="Proposed solutions"
        required
        hint={`One or more approaches — at least ${PROJECT_MIN_TEXT_CHARS} characters each`}
        placeholder="E.g. Integrate a new payment gateway…"
        items={form.proposedSolutions}
        onChange={(proposedSolutions) => onPatch({ proposedSolutions })}
        disabled={disabled}
        addLabel="Add proposal"
        addButtonInHeader
        showSubmitErrors={showSubmitErrors}
        errors={errors}
      />
    </div>
  );
}
