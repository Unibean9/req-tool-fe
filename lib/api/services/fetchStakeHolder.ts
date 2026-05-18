import apiService from "../core";

/** Influence level — wire values `high` | `medium` | `low`. */
export const STAKEHOLDER_INFLUENCE_LEVELS = [
  "low",
  "medium",
  "high",
] as const;
export type StakeholderInfluenceLevel =
  (typeof STAKEHOLDER_INFLUENCE_LEVELS)[number];

interface ProjectStakeholderRowApi {
  id: string;
  project_id: string;
  name: string;
  role: string;
  impact_area: string;
  influence_level: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface ProjectStakeholderApiResponse {
  success: boolean;
  data: ProjectStakeholderRowApi;
  message: string | null;
}

interface ListProjectStakeholdersApiResponse {
  success: boolean;
  data: ProjectStakeholderRowApi[];
  message: string | null;
}

/** POST/PATCH body (camelCase trong app → snake_case trên wire). */
export interface ProjectStakeholderWriteRequest {
  name: string;
  role: string;
  impactArea: string;
  influenceLevel: StakeholderInfluenceLevel;
  notes: string;
}

export interface ProjectStakeholder {
  id: string;
  projectId: string;
  name: string;
  role: string;
  impactArea: string;
  influenceLevel: StakeholderInfluenceLevel;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectStakeholderResponse {
  success: boolean;
  data: ProjectStakeholder;
  message: string | null;
}

export type CreateProjectStakeholderRequest = ProjectStakeholderWriteRequest;
export type CreateProjectStakeholderResponse = ProjectStakeholderResponse;

export type UpdateProjectStakeholderRequest = ProjectStakeholderWriteRequest;
export type UpdateProjectStakeholderResponse = ProjectStakeholderResponse;

export interface ProjectStakeholdersListResponse {
  success: boolean;
  data: ProjectStakeholder[];
  message: string | null;
}

function parseInfluenceLevel(level: string): StakeholderInfluenceLevel {
  return (STAKEHOLDER_INFLUENCE_LEVELS as readonly string[]).includes(level)
    ? (level as StakeholderInfluenceLevel)
    : "medium";
}

function mapProjectStakeholderRow(
  row: ProjectStakeholderRowApi
): ProjectStakeholder {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    role: row.role,
    impactArea: row.impact_area,
    influenceLevel: parseInfluenceLevel(row.influence_level),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toProjectStakeholderApiBody(body: ProjectStakeholderWriteRequest) {
  return {
    name: body.name.trim(),
    role: body.role.trim(),
    impact_area: body.impactArea.trim(),
    influence_level: body.influenceLevel,
    notes: body.notes.trim(),
  };
}

function mapProjectStakeholderResponse(
  body: ProjectStakeholderApiResponse
): ProjectStakeholderResponse {
  return {
    success: body.success,
    message: body.message ?? null,
    data: mapProjectStakeholderRow(body.data),
  };
}

function mapProjectStakeholdersListResponse(
  body: ListProjectStakeholdersApiResponse
): ProjectStakeholdersListResponse {
  return {
    success: body.success,
    message: body.message ?? null,
    data: body.data.map(mapProjectStakeholderRow),
  };
}

export const fetchStakeHolder = {
  /** GET /api/v1/projects/:project_id/stakeholders */
  list: async (projectId: string): Promise<ProjectStakeholdersListResponse> => {
    const response = await apiService.get<ListProjectStakeholdersApiResponse>(
      `/api/v1/projects/${encodeURIComponent(projectId)}/stakeholders`
    );
    return mapProjectStakeholdersListResponse(response.data);
  },

  /** GET /api/v1/projects/:project_id/stakeholders/:stakeholder_id */
  get: async (
    projectId: string,
    stakeholderId: string
  ): Promise<ProjectStakeholderResponse> => {
    const response = await apiService.get<ProjectStakeholderApiResponse>(
      `/api/v1/projects/${encodeURIComponent(projectId)}/stakeholders/${encodeURIComponent(stakeholderId)}`
    );
    return mapProjectStakeholderResponse(response.data);
  },

  /** POST /api/v1/projects/:project_id/stakeholders */
  create: async (
    projectId: string,
    body: CreateProjectStakeholderRequest
  ): Promise<CreateProjectStakeholderResponse> => {
    const response = await apiService.post<ProjectStakeholderApiResponse>(
      `/api/v1/projects/${encodeURIComponent(projectId)}/stakeholders`,
      toProjectStakeholderApiBody(body)
    );
    return mapProjectStakeholderResponse(response.data);
  },

  /** PATCH /api/v1/projects/:project_id/stakeholders/:stakeholder_id */
  update: async (
    projectId: string,
    stakeholderId: string,
    body: UpdateProjectStakeholderRequest
  ): Promise<UpdateProjectStakeholderResponse> => {
    const response = await apiService.patch<ProjectStakeholderApiResponse>(
      `/api/v1/projects/${encodeURIComponent(projectId)}/stakeholders/${encodeURIComponent(stakeholderId)}`,
      toProjectStakeholderApiBody(body)
    );
    return mapProjectStakeholderResponse(response.data);
  },

  /** DELETE /api/v1/projects/:project_id/stakeholders/:stakeholder_id */
  delete: async (projectId: string, stakeholderId: string): Promise<void> => {
    await apiService.delete<unknown>(
      `/api/v1/projects/${encodeURIComponent(projectId)}/stakeholders/${encodeURIComponent(stakeholderId)}`
    );
  },
};
