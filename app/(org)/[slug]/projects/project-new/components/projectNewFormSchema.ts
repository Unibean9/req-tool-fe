import { z } from "zod";

import type { CreateOrgProjectRequest } from "@/lib/api/services/fetchProject";

export type ProjectNewFormErrors = Record<string, string>;

export const projectNewStep0Schema = z.object({
  name: z.string().trim().min(1, "Project name is required"),
  description: z.string().optional(),
});

const PROJECT_NEW_STEP_SCHEMAS = [projectNewStep0Schema] as const;

export function zodIssuesToFieldErrors(
  issues: z.core.$ZodIssue[]
): ProjectNewFormErrors {
  const errors: ProjectNewFormErrors = {};
  for (const issue of issues) {
    const pathKey = issue.path.map(String).join(".");
    if (pathKey && !errors[pathKey]) {
      errors[pathKey] = issue.message;
    }
  }
  return errors;
}

export function validateProjectNewStep(
  step: number,
  form: CreateOrgProjectRequest
) {
  const schema = PROJECT_NEW_STEP_SCHEMAS[step];
  if (!schema) {
    return { success: true as const, errors: {} as ProjectNewFormErrors };
  }
  const result = schema.safeParse({ name: form.name, description: form.description });
  if (result.success) {
    return { success: true as const, errors: {} as ProjectNewFormErrors };
  }
  return {
    success: false as const,
    errors: zodIssuesToFieldErrors(result.error.issues),
  };
}

export function isProjectNewStepValid(
  step: number,
  form: CreateOrgProjectRequest
): boolean {
  return validateProjectNewStep(step, form).success;
}

export function isProjectNewFormValid(form: CreateOrgProjectRequest): boolean {
  return PROJECT_NEW_STEP_SCHEMAS.every((_, index) =>
    isProjectNewStepValid(index, form)
  );
}
