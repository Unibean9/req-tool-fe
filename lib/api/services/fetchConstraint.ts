import apiService from "../core";

export const CONSTRAINT_TYPES = [
  "budget",
  "timeline",
  "technical",
  "resource",
  "regulatory",
] as const;

export const CONSTRAINT_SEVERITIES = ["high", "medium", "low"] as const;

export type ConstraintType = (typeof CONSTRAINT_TYPES)[number];
export type ConstraintSeverity = (typeof CONSTRAINT_SEVERITIES)[number];

interface ProjectConstraintRowApi {
  id: string;
  project_id: string;
  type: string;
  description: string;
  severity: string;
  created_at: string;
  updated_at: string;
}

interface ProjectConstraintApiResponse {
  success: boolean;
  data: ProjectConstraintRowApi;
  message: string | null;
}

interface ListProjectConstraintsApiResponse {
  success: boolean;
  data: ProjectConstraintRowApi[];
  message: string | null;
}

export interface ProjectConstraintWriteRequest {
  type: ConstraintType;
  description: string;
  severity: ConstraintSeverity;
}

export interface ProjectConstraint {
  id: string;
  projectId: string;
  type: ConstraintType;
  description: string;
  severity: ConstraintSeverity;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectConstraintResponse {
  success: boolean;
  data: ProjectConstraint;
  message: string | null;
}

export type CreateProjectConstraintRequest = ProjectConstraintWriteRequest;
export type CreateProjectConstraintResponse = ProjectConstraintResponse;

export type UpdateProjectConstraintRequest = ProjectConstraintWriteRequest;
export type UpdateProjectConstraintResponse = ProjectConstraintResponse;

export interface ListProjectConstraintsParams {
  type?: ConstraintType;
  severity?: ConstraintSeverity;
}

export interface ProjectConstraintsListResponse {
  success: boolean;
  data: ProjectConstraint[];
  message: string | null;
}

function resolveProjectId(projectId: string): string {
  const id = projectId.trim();
  if (!id) throw new Error("project_id là bắt buộc");
  return id;
}

function resolveConstraintId(constraintId: string): string {
  const id = constraintId.trim();
  if (!id) throw new Error("constraint_id là bắt buộc");
  return id;
}

function parseConstraintType(type: string): ConstraintType {
  return (CONSTRAINT_TYPES as readonly string[]).includes(type)
    ? (type as ConstraintType)
    : "budget";
}

function parseConstraintSeverity(severity: string): ConstraintSeverity {
  return (CONSTRAINT_SEVERITIES as readonly string[]).includes(severity)
    ? (severity as ConstraintSeverity)
    : "medium";
}

function mapProjectConstraintRow(
  row: ProjectConstraintRowApi
): ProjectConstraint {
  return {
    id: row.id,
    projectId: row.project_id,
    type: parseConstraintType(row.type),
    description: row.description ?? "",
    severity: parseConstraintSeverity(row.severity),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toProjectConstraintApiBody(body: ProjectConstraintWriteRequest) {
  return {
    type: body.type,
    description: body.description.trim(),
    severity: body.severity,
  };
}

function toListProjectConstraintsSearchParams(
  params?: ListProjectConstraintsParams
): Record<string, string> | undefined {
  if (!params) return undefined;
  const searchParams: Record<string, string> = {};
  if (params.type) searchParams.type = params.type;
  if (params.severity) searchParams.severity = params.severity;
  return Object.keys(searchParams).length > 0 ? searchParams : undefined;
}

function mapProjectConstraintResponse(
  body: ProjectConstraintApiResponse
): ProjectConstraintResponse {
  return {
    success: body.success,
    message: body.message ?? null,
    data: mapProjectConstraintRow(body.data),
  };
}

function mapProjectConstraintsListResponse(
  body: ListProjectConstraintsApiResponse
): ProjectConstraintsListResponse {
  return {
    success: body.success,
    message: body.message ?? null,
    data: (body.data ?? []).map(mapProjectConstraintRow),
  };
}

function assertProjectConstraintSuccess(
  body: ProjectConstraintApiResponse
): ProjectConstraintApiResponse {
  if (!body.success) {
    throw new Error(body.message ?? "Thao tác constraint thất bại");
  }
  return body;
}

function assertProjectConstraintsListSuccess(
  body: ListProjectConstraintsApiResponse
): ListProjectConstraintsApiResponse {
  if (!body.success) {
    throw new Error(body.message ?? "Không tải được danh sách constraint");
  }
  return body;
}

function projectConstraintsPath(projectId: string) {
  return `/api/v1/projects/${encodeURIComponent(projectId)}/constraints`;
}

function projectConstraintPath(projectId: string, constraintId: string) {
  return `${projectConstraintsPath(projectId)}/${encodeURIComponent(constraintId)}`;
}

export const fetchConstraint = {
  /** GET /api/v1/projects/{project_id}/constraints */
  list: async (
    projectId: string,
    params?: ListProjectConstraintsParams
  ): Promise<ProjectConstraintsListResponse> => {
    const pid = resolveProjectId(projectId);
    const response = await apiService.get<ListProjectConstraintsApiResponse>(
      projectConstraintsPath(pid),
      toListProjectConstraintsSearchParams(params)
    );
    return mapProjectConstraintsListResponse(
      assertProjectConstraintsListSuccess(response.data)
    );
  },

  /** POST /api/v1/projects/{project_id}/constraints */
  create: async (
    projectId: string,
    body: CreateProjectConstraintRequest
  ): Promise<CreateProjectConstraintResponse> => {
    const pid = resolveProjectId(projectId);
    const response = await apiService.post<ProjectConstraintApiResponse>(
      projectConstraintsPath(pid),
      toProjectConstraintApiBody(body)
    );
    return mapProjectConstraintResponse(
      assertProjectConstraintSuccess(response.data)
    );
  },

  /** PATCH /api/v1/projects/{project_id}/constraints/{constraint_id} */
  update: async (
    projectId: string,
    constraintId: string,
    body: UpdateProjectConstraintRequest
  ): Promise<UpdateProjectConstraintResponse> => {
    const pid = resolveProjectId(projectId);
    const cid = resolveConstraintId(constraintId);
    const response = await apiService.patch<ProjectConstraintApiResponse>(
      projectConstraintPath(pid, cid),
      toProjectConstraintApiBody(body)
    );
    return mapProjectConstraintResponse(
      assertProjectConstraintSuccess(response.data)
    );
  },

  /** DELETE /api/v1/projects/{project_id}/constraints/{constraint_id} */
  delete: async (projectId: string, constraintId: string): Promise<void> => {
    const pid = resolveProjectId(projectId);
    const cid = resolveConstraintId(constraintId);
    await apiService.delete<unknown>(projectConstraintPath(pid, cid));
  },
};
