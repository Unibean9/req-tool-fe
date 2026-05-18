import apiService from "../core";

import type { ActorEpicPriority } from "./fetchActor";
import { ACTOR_EPIC_PRIORITIES } from "./fetchActor";

export const NFR_CATEGORIES = [
  "performance",
  "security",
  "usability",
  "reliability",
  "compliance",
  "maintainability",
] as const;

export type NfrCategory = (typeof NFR_CATEGORIES)[number];

export type NfrPriority = ActorEpicPriority;

interface ProjectNfrRowApi {
  id: string;
  project_id: string;
  category: string;
  description: string;
  priority: string;
  feature_ids: string[];
  created_at: string;
  updated_at: string;
}

interface ProjectNfrApiResponse {
  success: boolean;
  data: ProjectNfrRowApi;
  message: string | null;
}

interface ListProjectNfrsApiResponse {
  success: boolean;
  data: ProjectNfrRowApi[];
  message: string | null;
}

/** POST/PATCH body (camelCase trong app → snake_case trên wire). */
export interface ProjectNfrWriteRequest {
  category: NfrCategory;
  description: string;
  priority: NfrPriority;
  featureIds: string[];
}

export interface ProjectNfr {
  id: string;
  projectId: string;
  category: NfrCategory;
  description: string;
  priority: NfrPriority;
  featureIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectNfrResponse {
  success: boolean;
  data: ProjectNfr;
  message: string | null;
}

export type CreateProjectNfrRequest = ProjectNfrWriteRequest;
export type CreateProjectNfrResponse = ProjectNfrResponse;

export type UpdateProjectNfrRequest = ProjectNfrWriteRequest;
export type UpdateProjectNfrResponse = ProjectNfrResponse;

export interface ListProjectNfrsParams {
  category?: NfrCategory;
  priority?: NfrPriority;
}

export interface ProjectNfrsListResponse {
  success: boolean;
  data: ProjectNfr[];
  message: string | null;
}

function resolveProjectId(projectId: string): string {
  const id = projectId.trim();
  if (!id) throw new Error("project_id là bắt buộc");
  return id;
}

function resolveNfrId(nfrId: string): string {
  const id = nfrId.trim();
  if (!id) throw new Error("nfr_id là bắt buộc");
  return id;
}

function parseNfrCategory(category: string): NfrCategory {
  return (NFR_CATEGORIES as readonly string[]).includes(category)
    ? (category as NfrCategory)
    : "performance";
}

function parseNfrPriority(priority: string): NfrPriority {
  return (ACTOR_EPIC_PRIORITIES as readonly string[]).includes(priority)
    ? (priority as NfrPriority)
    : "medium";
}

function mapProjectNfrRow(row: ProjectNfrRowApi): ProjectNfr {
  return {
    id: row.id,
    projectId: row.project_id,
    category: parseNfrCategory(row.category),
    description: row.description ?? "",
    priority: parseNfrPriority(row.priority),
    featureIds: (row.feature_ids ?? []).map((id) => String(id).trim()).filter(Boolean),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toProjectNfrApiBody(body: ProjectNfrWriteRequest) {
  return {
    category: body.category,
    description: body.description.trim(),
    priority: body.priority,
    feature_ids: body.featureIds.map((id) => id.trim()).filter(Boolean),
  };
}

function toListProjectNfrsSearchParams(
  params?: ListProjectNfrsParams
): Record<string, string> | undefined {
  if (!params) return undefined;
  const searchParams: Record<string, string> = {};
  if (params.category) searchParams.category = params.category;
  if (params.priority) searchParams.priority = params.priority;
  return Object.keys(searchParams).length > 0 ? searchParams : undefined;
}

function mapProjectNfrResponse(body: ProjectNfrApiResponse): ProjectNfrResponse {
  return {
    success: body.success,
    message: body.message ?? null,
    data: mapProjectNfrRow(body.data),
  };
}

function mapProjectNfrsListResponse(
  body: ListProjectNfrsApiResponse
): ProjectNfrsListResponse {
  return {
    success: body.success,
    message: body.message ?? null,
    data: (body.data ?? []).map(mapProjectNfrRow),
  };
}

function assertProjectNfrSuccess(body: ProjectNfrApiResponse): ProjectNfrApiResponse {
  if (!body.success) {
    throw new Error(body.message ?? "Thao tác NFR thất bại");
  }
  return body;
}

function assertProjectNfrsListSuccess(
  body: ListProjectNfrsApiResponse
): ListProjectNfrsApiResponse {
  if (!body.success) {
    throw new Error(body.message ?? "Không tải được danh sách NFR");
  }
  return body;
}

function projectsNfrsPath(projectId: string) {
  return `/api/v1/projects/${encodeURIComponent(projectId)}/nfrs`;
}

function projectNfrPath(projectId: string, nfrId: string) {
  return `${projectsNfrsPath(projectId)}/${encodeURIComponent(nfrId)}`;
}

export const fetchNfr = {
  /** GET /api/v1/projects/{project_id}/nfrs */
  list: async (
    projectId: string,
    params?: ListProjectNfrsParams
  ): Promise<ProjectNfrsListResponse> => {
    const pid = resolveProjectId(projectId);
    const response = await apiService.get<ListProjectNfrsApiResponse>(
      projectsNfrsPath(pid),
      toListProjectNfrsSearchParams(params)
    );
    return mapProjectNfrsListResponse(
      assertProjectNfrsListSuccess(response.data)
    );
  },

  /** GET /api/v1/projects/{project_id}/nfrs/{nfr_id} */
  get: async (projectId: string, nfrId: string): Promise<ProjectNfrResponse> => {
    const pid = resolveProjectId(projectId);
    const nid = resolveNfrId(nfrId);
    const response = await apiService.get<ProjectNfrApiResponse>(
      projectNfrPath(pid, nid)
    );
    return mapProjectNfrResponse(assertProjectNfrSuccess(response.data));
  },

  /** POST /api/v1/projects/{project_id}/nfrs */
  create: async (
    projectId: string,
    body: CreateProjectNfrRequest
  ): Promise<CreateProjectNfrResponse> => {
    const pid = resolveProjectId(projectId);
    const response = await apiService.post<ProjectNfrApiResponse>(
      projectsNfrsPath(pid),
      toProjectNfrApiBody(body)
    );
    return mapProjectNfrResponse(assertProjectNfrSuccess(response.data));
  },

  /** PATCH /api/v1/projects/{project_id}/nfrs/{nfr_id} */
  update: async (
    projectId: string,
    nfrId: string,
    body: UpdateProjectNfrRequest
  ): Promise<UpdateProjectNfrResponse> => {
    const pid = resolveProjectId(projectId);
    const nid = resolveNfrId(nfrId);
    const response = await apiService.patch<ProjectNfrApiResponse>(
      projectNfrPath(pid, nid),
      toProjectNfrApiBody(body)
    );
    return mapProjectNfrResponse(assertProjectNfrSuccess(response.data));
  },

  /** DELETE /api/v1/projects/{project_id}/nfrs/{nfr_id} */
  delete: async (projectId: string, nfrId: string): Promise<void> => {
    const pid = resolveProjectId(projectId);
    const nid = resolveNfrId(nfrId);
    await apiService.delete<unknown>(projectNfrPath(pid, nid));
  },
};
