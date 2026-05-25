import { z } from "zod";

import type { CreateOrgProjectRequest } from "@/lib/api/services/fetchProject";
import {
  isProjectEndIsoInvalid,
  isProjectIsoDateBeforeToday,
  parseProjectIsoDate,
} from "@/lib/project/projectDisplay";

import {
  PROJECT_LIST_MIN_MESSAGE,
  PROJECT_MIN_TEXT_CHARS,
  PROJECT_MIN_TEXT_MESSAGE,
} from "./projectFormLimits";

export type ProjectNewFormErrors = Record<string, string>;

const projectTextSchema = z
  .string()
  .trim()
  .min(PROJECT_MIN_TEXT_CHARS, PROJECT_MIN_TEXT_MESSAGE);

function projectListSchema(fieldLabel: string) {
  return z.array(z.string()).superRefine((items, ctx) => {
    const filled = items
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    if (filled.length < 1) {
      ctx.addIssue({
        code: "custom",
        message: PROJECT_LIST_MIN_MESSAGE,
        path: [],
      });
    }

    items.forEach((item, index) => {
      const trimmed = item.trim();
      if (trimmed.length === 0) return;
      if (trimmed.length < PROJECT_MIN_TEXT_CHARS) {
        ctx.addIssue({
          code: "custom",
          message: PROJECT_MIN_TEXT_MESSAGE,
          path: [index],
        });
      }
    });

    void fieldLabel;
  });
}

export const projectNewStep0Schema = z.object({
  name: projectTextSchema,
  executiveSummary: projectTextSchema,
  description: projectTextSchema,
});

export const projectNewStep1Schema = z.object({
  context: projectTextSchema,
  problems: projectListSchema("problems"),
});

export const projectNewStep2Schema = z.object({
  budget: z.coerce.number().min(0, "Budget cannot be negative"),
  proposedSolutions: projectListSchema("proposed solutions"),
});

export const projectNewStep3Schema = z
  .object({
    startDate: z.string().trim().min(1, "Select a start date"),
    endDate: z.string().trim().min(1, "Select an end date"),
    roiNotes: z
      .string()
      .trim()
      .superRefine((val, ctx) => {
        if (val.length === 0) return;
        if (val.length < PROJECT_MIN_TEXT_CHARS) {
          ctx.addIssue({
            code: "custom",
            message: PROJECT_MIN_TEXT_MESSAGE,
          });
        }
      }),
  })
  .superRefine((data, ctx) => {
    if (!data.startDate.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Select a start date",
        path: ["startDate"],
      });
    } else if (!parseProjectIsoDate(data.startDate)) {
      ctx.addIssue({
        code: "custom",
        message: "Invalid start date",
        path: ["startDate"],
      });
    } else if (isProjectIsoDateBeforeToday(data.startDate)) {
      ctx.addIssue({
        code: "custom",
        message: "Start date cannot be in the past",
        path: ["startDate"],
      });
    }

    if (!data.endDate.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Select an end date",
        path: ["endDate"],
      });
    } else if (!parseProjectIsoDate(data.endDate)) {
      ctx.addIssue({
        code: "custom",
        message: "Invalid end date",
        path: ["endDate"],
      });
    } else if (isProjectIsoDateBeforeToday(data.endDate)) {
      ctx.addIssue({
        code: "custom",
        message: "End date cannot be in the past",
        path: ["endDate"],
      });
    } else if (isProjectEndIsoInvalid(data.startDate, data.endDate)) {
      ctx.addIssue({
        code: "custom",
        message: "End date must be after start date",
        path: ["endDate"],
      });
    }
  });

const PROJECT_NEW_STEP_SCHEMAS = [
  projectNewStep0Schema,
  projectNewStep1Schema,
  projectNewStep2Schema,
  projectNewStep3Schema,
] as const;

const STEP_FIELD_KEYS: (keyof CreateOrgProjectRequest)[][] = [
  ["name", "executiveSummary", "description"],
  ["context", "problems"],
  ["budget", "proposedSolutions"],
  ["startDate", "endDate", "roiNotes"],
];

function pickStepFields(
  step: number,
  form: CreateOrgProjectRequest
): Record<string, unknown> {
  const keys = STEP_FIELD_KEYS[step] ?? [];
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    out[key] = form[key];
  }
  return out;
}

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
  const result = schema.safeParse(pickStepFields(step, form));
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
