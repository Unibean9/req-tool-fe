import apiService from "../core";

interface ProjectFlowRowApi {
  id: string;
  project_id: string;
  title: string;
  description: string;
  order: number;
  created_at: string;
  updated_at: string;
}

interface ProjectFlowApiResponse {
  success: boolean;
  data: ProjectFlowRowApi;
  message: string | null;
}

interface ListProjectFlowsApiResponse {
  success: boolean;
  data: ProjectFlowRowApi[];
  message: string | null;
}

/** POST/PATCH body (camelCase trong app → snake_case trên wire). */
export interface ProjectFlowWriteRequest {
  title: string;
  description: string;
  order: number;
}

export interface ProjectFlow {
  id: string;
  projectId: string;
  title: string;
  description: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFlowResponse {
  success: boolean;
  data: ProjectFlow;
  message: string | null;
}

export type CreateProjectFlowRequest = ProjectFlowWriteRequest;
export type CreateProjectFlowResponse = ProjectFlowResponse;

export type UpdateProjectFlowRequest = ProjectFlowWriteRequest;
export type UpdateProjectFlowResponse = ProjectFlowResponse;

export interface ProjectFlowsListResponse {
  success: boolean;
  data: ProjectFlow[];
  message: string | null;
}

function resolveProjectId(projectId: string): string {
  const id = projectId.trim();
  if (!id) throw new Error("project_id là bắt buộc");
  return id;
}

function resolveFlowId(flowId: string): string {
  const id = flowId.trim();
  if (!id) throw new Error("flow_id là bắt buộc");
  return id;
}

function mapProjectFlowRow(row: ProjectFlowRowApi): ProjectFlow {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title ?? "",
    description: row.description ?? "",
    order: Number(row.order) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toProjectFlowApiBody(body: ProjectFlowWriteRequest) {
  return {
    title: body.title.trim(),
    description: body.description.trim(),
    order: body.order,
  };
}

function mapProjectFlowResponse(
  body: ProjectFlowApiResponse
): ProjectFlowResponse {
  return {
    success: body.success,
    message: body.message ?? null,
    data: mapProjectFlowRow(body.data),
  };
}

function mapProjectFlowsListResponse(
  body: ListProjectFlowsApiResponse
): ProjectFlowsListResponse {
  return {
    success: body.success,
    message: body.message ?? null,
    data: (body.data ?? []).map(mapProjectFlowRow),
  };
}

function assertProjectFlowSuccess(
  body: ProjectFlowApiResponse
): ProjectFlowApiResponse {
  if (!body.success) {
    throw new Error(body.message ?? "Thao tác flow thất bại");
  }
  return body;
}

function assertProjectFlowsListSuccess(
  body: ListProjectFlowsApiResponse
): ListProjectFlowsApiResponse {
  if (!body.success) {
    throw new Error(body.message ?? "Không tải được danh sách flow");
  }
  return body;
}

export const fetchFlow = {
  /** GET /api/v1/projects/{project_id}/flows */
  list: async (projectId: string): Promise<ProjectFlowsListResponse> => {
    const pid = resolveProjectId(projectId);
    const response = await apiService.get<ListProjectFlowsApiResponse>(
      `/api/v1/projects/${encodeURIComponent(pid)}/flows`
    );
    return mapProjectFlowsListResponse(
      assertProjectFlowsListSuccess(response.data)
    );
  },

  /** POST /api/v1/projects/{project_id}/flows */
  create: async (
    projectId: string,
    body: CreateProjectFlowRequest
  ): Promise<CreateProjectFlowResponse> => {
    const pid = resolveProjectId(projectId);
    const response = await apiService.post<ProjectFlowApiResponse>(
      `/api/v1/projects/${encodeURIComponent(pid)}/flows`,
      toProjectFlowApiBody(body)
    );
    assertProjectFlowSuccess(response.data);
    return mapProjectFlowResponse(response.data);
  },

  /** PATCH /api/v1/projects/{project_id}/flows/{flow_id} */
  update: async (
    projectId: string,
    flowId: string,
    body: UpdateProjectFlowRequest
  ): Promise<UpdateProjectFlowResponse> => {
    const pid = resolveProjectId(projectId);
    const fid = resolveFlowId(flowId);
    const response = await apiService.patch<ProjectFlowApiResponse>(
      `/api/v1/projects/${encodeURIComponent(pid)}/flows/${encodeURIComponent(fid)}`,
      toProjectFlowApiBody(body)
    );
    assertProjectFlowSuccess(response.data);
    return mapProjectFlowResponse(response.data);
  },

  /** DELETE /api/v1/projects/{project_id}/flows/{flow_id} */
  delete: async (projectId: string, flowId: string): Promise<void> => {
    const pid = resolveProjectId(projectId);
    const fid = resolveFlowId(flowId);
    await apiService.delete<unknown>(
      `/api/v1/projects/${encodeURIComponent(pid)}/flows/${encodeURIComponent(fid)}`
    );
  },
};
