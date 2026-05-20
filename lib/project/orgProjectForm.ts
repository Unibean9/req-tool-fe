import type {
  CreateOrgProjectRequest,
  OrgProject,
  UpdateOrgProjectRequest,
} from "@/lib/api/services/fetchProject";

import {
  budgetWireToNumber,
  isProjectEndIsoInvalid,
  isProjectIsoDateBeforeToday,
} from "./projectDisplay";

export type OrgProjectFormValues = {
  name: string;
  description: string;
  context: string;
  problems: string[];
  proposedSolutions: string[];
  startDate: string;
  endDate: string;
  budget: number;
  executiveSummary: string;
  roiNotes: string;
};

export function orgProjectToFormValues(project: OrgProject): OrgProjectFormValues {
  return {
    name: project.name,
    description: project.description,
    context: project.context,
    problems: [...project.problems],
    proposedSolutions: [...project.proposedSolutions],
    startDate: project.startDate,
    endDate: project.endDate,
    budget: budgetWireToNumber(project.budget),
    executiveSummary: project.executiveSummary,
    roiNotes: project.roiNotes,
  };
}

export function orgProjectFormValuesToCreateBody(
  values: OrgProjectFormValues
): CreateOrgProjectRequest {
  return { ...values };
}

export function orgProjectFormValuesToUpdateBody(
  values: OrgProjectFormValues
): UpdateOrgProjectRequest {
  return { ...values };
}

const MIN_TEXT = 20;

export function isOrgProjectFormSubmittable(values: OrgProjectFormValues): boolean {
  const name = values.name.trim();
  const executiveSummary = values.executiveSummary.trim();
  const description = values.description.trim();
  const context = values.context.trim();
  const roiNotes = values.roiNotes.trim();
  if (
    name.length < MIN_TEXT ||
    executiveSummary.length < MIN_TEXT ||
    description.length < MIN_TEXT ||
    context.length < MIN_TEXT
  ) {
    return false;
  }
  if (roiNotes.length > 0 && roiNotes.length < MIN_TEXT) {
    return false;
  }
  const problems = values.problems.map((s) => s.trim()).filter(Boolean);
  const solutions = values.proposedSolutions.map((s) => s.trim()).filter(Boolean);
  if (problems.length < 1 || solutions.length < 1) return false;
  if (!values.startDate.trim() || !values.endDate.trim()) return false;
  if (isProjectIsoDateBeforeToday(values.startDate)) return false;
  if (isProjectIsoDateBeforeToday(values.endDate)) return false;
  if (isProjectEndIsoInvalid(values.startDate, values.endDate)) return false;
  if (values.budget < 0 || !Number.isFinite(values.budget)) return false;
  return true;
}
