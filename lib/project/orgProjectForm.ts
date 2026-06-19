import type {
  CreateOrgProjectRequest,
  OrgProject,
  UpdateOrgProjectRequest,
} from "@/lib/api/services/fetchProject";

export type OrgProjectFormValues = {
  name: string;
  description: string;
};

export function orgProjectToFormValues(project: OrgProject): OrgProjectFormValues {
  return {
    name: project.name,
    description: project.description ?? "",
  };
}

export function orgProjectFormValuesToCreateBody(
  values: OrgProjectFormValues
): CreateOrgProjectRequest {
  return {
    name: values.name.trim(),
    description: values.description.trim() || undefined,
  };
}

export function orgProjectFormValuesToUpdateBody(
  values: OrgProjectFormValues
): UpdateOrgProjectRequest {
  return {
    name: values.name.trim(),
    description: values.description.trim() || undefined,
  };
}

export function isOrgProjectFormSubmittable(values: OrgProjectFormValues): boolean {
  return values.name.trim().length >= 1;
}
