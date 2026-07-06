import apiService from "../core";

// ─── Request types ────────────────────────────────────────────────────────────

/** POST /api/v1/projects — tạo project bằng `org_id` trong body. */
export interface CreateProjectRequest {
  orgId: string;
  name: string;
  description?: string;
}

/** POST /api/v1/orgs/{org_id}/projects */
export interface CreateOrgProjectRequest {
  name: string;
  description?: string;
}

/** PATCH /api/v1/orgs/{org_id}/projects/{project_id} */
export interface UpdateOrgProjectRequest {
  name?: string;
  description?: string;
}

// ─── Path params ──────────────────────────────────────────────────────────────

export interface ListOrgProjectsParams {
  orgId: string;
}

export interface GetOrgProjectParams {
  orgId: string;
  projectId: string;
}

// ─── Wire types (snake_case) ──────────────────────────────────────────────────

interface OrgProjectApiRow {
  id: string;
  org_id: string;
  name: string;
  slug: string;
  description: string | null;
  executive_summary?: string | null;
  created_at: string;
}

interface OrgProjectApiResponse {
  success: boolean;
  data: OrgProjectApiRow;
  message: string | null;
}

interface OrgProjectListApiResponse {
  success: boolean;
  data: OrgProjectApiRow[];
  message: string | null;
}

interface DeleteOrgProjectApiResponse {
  success: boolean;
  message?: string | null;
  data?: unknown;
}

// ─── FE types (camelCase) ─────────────────────────────────────────────────────

export interface OrgProject {
  id: string;
  orgId: string;
  name: string;
  slug: string;
  description: string | null;
  executiveSummary: string | null;
  createdAt: string;
}

// ─── Response types ───────────────────────────────────────────────────────────

export interface OrgProjectResponse {
  success: boolean;
  data: OrgProject;
  message: string | null;
}

export type CreateOrgProjectResponse = OrgProjectResponse;
export type UpdateOrgProjectResponse = OrgProjectResponse;
export type OrgProjectDetailResponse = OrgProjectResponse;

export interface OrgProjectsListResponse {
  success: boolean;
  data: OrgProject[];
  message: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveOrgId(orgIdOrParams: string | ListOrgProjectsParams): string {
  const id =
    typeof orgIdOrParams === "string" ? orgIdOrParams : orgIdOrParams.orgId;
  const trimmed = id.trim();
  if (!trimmed) throw new Error("org_id là bắt buộc");
  return trimmed;
}

function resolveGetOrgProjectParams(
  orgIdOrParams: string | GetOrgProjectParams,
  projectIdArg?: string
): GetOrgProjectParams {
  if (typeof orgIdOrParams === "object") {
    const orgId = orgIdOrParams.orgId.trim();
    const projectId = orgIdOrParams.projectId.trim();
    if (!orgId) throw new Error("org_id là bắt buộc");
    if (!projectId) throw new Error("project_id là bắt buộc");
    return { orgId, projectId };
  }
  const orgId = orgIdOrParams.trim();
  const projectId = (projectIdArg ?? "").trim();
  if (!orgId) throw new Error("org_id là bắt buộc");
  if (!projectId) throw new Error("project_id là bắt buộc");
  return { orgId, projectId };
}

function mapOrgProjectRow(row: OrgProjectApiRow): OrgProject {
  return {
    id: row.id,
    orgId: row.org_id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? null,
    executiveSummary: row.executive_summary ?? null,
    createdAt: row.created_at,
  };
}

function assertOrgProjectSuccess(
  body: OrgProjectApiResponse
): OrgProjectApiResponse {
  if (!body.success) {
    throw new Error(body.message ?? "Thao tác dự án thất bại");
  }
  return body;
}

function assertOrgProjectListSuccess(
  body: OrgProjectListApiResponse
): OrgProjectListApiResponse {
  if (!body.success) {
    throw new Error(body.message ?? "Không tải được danh sách dự án");
  }
  return body;
}

function assertDeleteOrgProjectSuccess(body: DeleteOrgProjectApiResponse): void {
  if (body && typeof body === "object" && "success" in body && !body.success) {
    throw new Error(body.message ?? "Xóa dự án thất bại");
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const fetchProject = {
  /** GET /api/v1/orgs/{org_id}/projects */
  listOrgProjects: async (
    orgIdOrParams: string | ListOrgProjectsParams
  ): Promise<OrgProjectsListResponse> => {
    const orgId = resolveOrgId(orgIdOrParams);
    const response = await apiService.get<OrgProjectListApiResponse>(
      `/api/v1/orgs/${encodeURIComponent(orgId)}/projects`
    );
    const body = assertOrgProjectListSuccess(response.data);
    return {
      success: body.success,
      message: body.message ?? null,
      data: (body.data ?? []).map(mapOrgProjectRow),
    };
  },

  /** GET /api/v1/orgs/{org_id}/projects/{project_id} */
  getOrgProject: async (
    orgIdOrParams: string | GetOrgProjectParams,
    projectId?: string
  ): Promise<OrgProjectDetailResponse> => {
    const { orgId, projectId: pid } = resolveGetOrgProjectParams(
      orgIdOrParams,
      projectId
    );
    const response = await apiService.get<OrgProjectApiResponse>(
      `/api/v1/orgs/${encodeURIComponent(orgId)}/projects/${encodeURIComponent(pid)}`
    );
    const body = assertOrgProjectSuccess(response.data);
    return {
      success: body.success,
      message: body.message ?? null,
      data: mapOrgProjectRow(body.data),
    };
  },

  /**
   * POST /api/v1/projects — tạo project với `org_id` trong body.
   * Dùng khi không có org context trên URL.
   */
  createProject: async (
    req: CreateProjectRequest
  ): Promise<CreateOrgProjectResponse> => {
    const orgId = req.orgId.trim();
    if (!orgId) throw new Error("org_id là bắt buộc");
    const response = await apiService.post<OrgProjectApiResponse>(
      `/api/v1/projects`,
      {
        org_id: orgId,
        name: req.name.trim(),
        description: req.description?.trim() ?? null,
      }
    );
    const body = assertOrgProjectSuccess(response.data);
    return {
      success: body.success,
      message: body.message ?? null,
      data: mapOrgProjectRow(body.data),
    };
  },

  /** POST /api/v1/orgs/{org_id}/projects */
  createOrgProject: async (
    orgId: string,
    req: CreateOrgProjectRequest
  ): Promise<CreateOrgProjectResponse> => {
    const oid = resolveOrgId(orgId);
    const response = await apiService.post<OrgProjectApiResponse>(
      `/api/v1/orgs/${encodeURIComponent(oid)}/projects`,
      {
        name: req.name.trim(),
        description: req.description?.trim() ?? null,
      }
    );
    const body = assertOrgProjectSuccess(response.data);
    return {
      success: body.success,
      message: body.message ?? null,
      data: mapOrgProjectRow(body.data),
    };
  },

  /** PATCH /api/v1/orgs/{org_id}/projects/{project_id} */
  updateOrgProject: async (
    orgId: string,
    projectId: string,
    req: UpdateOrgProjectRequest
  ): Promise<UpdateOrgProjectResponse> => {
    const { orgId: oid, projectId: pid } = resolveGetOrgProjectParams(
      orgId,
      projectId
    );
    const body: Record<string, unknown> = {};
    if (req.name !== undefined) body.name = req.name.trim();
    if (req.description !== undefined)
      body.description = req.description?.trim() ?? null;
    const response = await apiService.patch<OrgProjectApiResponse>(
      `/api/v1/orgs/${encodeURIComponent(oid)}/projects/${encodeURIComponent(pid)}`,
      body
    );
    const resBody = assertOrgProjectSuccess(response.data);
    return {
      success: resBody.success,
      message: resBody.message ?? null,
      data: mapOrgProjectRow(resBody.data),
    };
  },

  /** DELETE /api/v1/orgs/{org_id}/projects/{project_id} */
  deleteOrgProject: async (orgId: string, projectId: string): Promise<void> => {
    const { orgId: oid, projectId: pid } = resolveGetOrgProjectParams(
      orgId,
      projectId
    );
    const response = await apiService.delete<DeleteOrgProjectApiResponse>(
      `/api/v1/orgs/${encodeURIComponent(oid)}/projects/${encodeURIComponent(pid)}`
    );
    if (response.data && typeof response.data === "object") {
      assertDeleteOrgProjectSuccess(response.data);
    }
  },
};
