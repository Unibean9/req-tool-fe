import apiService from "../core";

/** Influence level — wire values `high` | `medium` | `low`. */
export const STAKEHOLDER_INFLUENCE_LEVELS = [
  "low",
  "medium",
  "high",
] as const;
export type StakeholderInfluenceLevel =
  (typeof STAKEHOLDER_INFLUENCE_LEVELS)[number];

/** Actor type — wire values `none` | `business_actor` | `other_actor`. */
export const STAKEHOLDER_ACTOR_TYPES = [
  "none",
  "business_actor",
  "other_actor",
] as const;
export type StakeholderActorType = (typeof STAKEHOLDER_ACTOR_TYPES)[number];

interface ProjectStakeholderRowApi {
  id: string;
  project_id: string;
  name: string;
  role: string;
  impact_area: string;
  influence_level: string;
  notes: string;
  actor_type: string;
  system_description: string;
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

interface DeleteProjectStakeholderApiResponse {
  success: boolean;
  message?: string | null;
  data?: unknown;
}

/** POST/PATCH body (camelCase trong app → snake_case trên wire). */
export interface ProjectStakeholderWriteRequest {
  name: string;
  role: string;
  impactArea: string;
  influenceLevel: StakeholderInfluenceLevel;
  notes: string;
  actorType: StakeholderActorType;
  systemDescription: string;
}

export interface ProjectStakeholder {
  id: string;
  projectId: string;
  name: string;
  role: string;
  impactArea: string;
  influenceLevel: StakeholderInfluenceLevel;
  notes: string;
  actorType: StakeholderActorType;
  systemDescription: string;
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

export interface ListProjectStakeholdersParams {
  /** Khi set, gửi `?actor_type=...`. Khi bỏ qua, không gửi query (danh sách đầy đủ). */
  actorType?: StakeholderActorType;
}

function parseInfluenceLevel(level: string): StakeholderInfluenceLevel {
  return (STAKEHOLDER_INFLUENCE_LEVELS as readonly string[]).includes(level)
    ? (level as StakeholderInfluenceLevel)
    : "medium";
}

function parseActorType(type: string): StakeholderActorType {
  return (STAKEHOLDER_ACTOR_TYPES as readonly string[]).includes(type)
    ? (type as StakeholderActorType)
    : "none";
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
    actorType: parseActorType(row.actor_type),
    systemDescription: row.system_description ?? "",
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
    actor_type: body.actorType,
    system_description: body.systemDescription.trim(),
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

function listStakeholdersQueryString(params?: ListProjectStakeholdersParams) {
  if (params?.actorType === undefined) return "";
  return `?actor_type=${encodeURIComponent(params.actorType)}`;
}

export const fetchStakeHolder = {
  /** GET /api/v1/projects/:project_id/stakeholders — optional `actor_type` query. */
  list: async (
    projectId: string,
    params?: ListProjectStakeholdersParams
  ): Promise<ProjectStakeholdersListResponse> => {
    const qs = listStakeholdersQueryString(params);
    const response = await apiService.get<ListProjectStakeholdersApiResponse>(
      `/api/v1/projects/${encodeURIComponent(projectId)}/stakeholders${qs}`
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
  delete: async (
    projectId: string,
    stakeholderId: string
  ): Promise<{ success: boolean; message: string | null }> => {
    const response = await apiService.delete<
      DeleteProjectStakeholderApiResponse | Record<string, never>
    >(
      `/api/v1/projects/${encodeURIComponent(projectId)}/stakeholders/${encodeURIComponent(stakeholderId)}`
    );
    const payload = response.data as DeleteProjectStakeholderApiResponse | undefined;
    if (payload && typeof payload === "object" && "success" in payload) {
      if (!payload.success) {
        throw new Error(
          typeof payload.message === "string" && payload.message
            ? payload.message
            : "Xóa stakeholder thất bại"
        );
      }
      return {
        success: true,
        message:
          typeof payload.message === "string" ? payload.message : null,
      };
    }
    return { success: true, message: null };
  },
};
