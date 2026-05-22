import apiService from "../core";

export const BR_PRIORITIES = ["low", "medium", "high"] as const;

export type BRPriority = (typeof BR_PRIORITIES)[number];

interface BusinessRequirementRowApi {
  id: string;
  project_id: string;
  description: string;
  priority: string;
  is_critical: boolean;
  created_at: string;
  updated_at: string;
}

interface BusinessRequirementApiResponse {
  success: boolean;
  data: BusinessRequirementRowApi;
  message: string | null;
}

interface ListBusinessRequirementsApiResponse {
  success: boolean;
  data: BusinessRequirementRowApi[];
  message: string | null;
}

export interface BusinessRequirementWriteRequest {
  description: string;
  priority: BRPriority;
  is_critical: boolean;
}

export interface BusinessRequirement {
  id: string;
  projectId: string;
  description: string;
  priority: BRPriority;
  isCritical: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessRequirementResponse {
  success: boolean;
  data: BusinessRequirement;
  message: string | null;
}

export type CreateBusinessRequirementRequest = BusinessRequirementWriteRequest;
export type CreateBusinessRequirementResponse = BusinessRequirementResponse;

export type UpdateBusinessRequirementRequest = BusinessRequirementWriteRequest;
export type UpdateBusinessRequirementResponse = BusinessRequirementResponse;

export interface BusinessRequirementsListResponse {
  success: boolean;
  data: BusinessRequirement[];
  message: string | null;
}

function resolveProjectId(projectId: string): string {
  const id = projectId.trim();
  if (!id) throw new Error("project_id là bắt buộc");
  return id;
}

function resolveBRId(brId: string): string {
  const id = brId.trim();
  if (!id) throw new Error("br_id là bắt buộc");
  return id;
}

function parseBRPriority(priority: string): BRPriority {
  return (BR_PRIORITIES as readonly string[]).includes(priority)
    ? (priority as BRPriority)
    : "medium";
}

function mapBusinessRequirementRow(
  row: BusinessRequirementRowApi
): BusinessRequirement {
  return {
    id: row.id,
    projectId: row.project_id,
    description: row.description ?? "",
    priority: parseBRPriority(row.priority),
    isCritical: row.is_critical ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toBusinessRequirementApiBody(body: BusinessRequirementWriteRequest) {
  return {
    description: body.description.trim(),
    priority: body.priority,
    is_critical: body.is_critical,
  };
}

function assertBusinessRequirementSuccess(
  body: BusinessRequirementApiResponse
): BusinessRequirementApiResponse {
  if (!body.success) {
    throw new Error(body.message ?? "Thao tác business requirement thất bại");
  }
  return body;
}

function assertListBusinessRequirementsSuccess(
  body: ListBusinessRequirementsApiResponse
): ListBusinessRequirementsApiResponse {
  if (!body.success) {
    throw new Error(
      body.message ?? "Không tải được danh sách business requirements"
    );
  }
  return body;
}

function projectBRPath(projectId: string) {
  return `/api/v1/projects/${encodeURIComponent(projectId)}/business-requirements`;
}

function projectBRItemPath(projectId: string, brId: string) {
  return `${projectBRPath(projectId)}/${encodeURIComponent(brId)}`;
}

export const fetchBR = {
  /** GET /api/v1/projects/{project_id}/business-requirements */
  list: async (
    projectId: string
  ): Promise<BusinessRequirementsListResponse> => {
    const pid = resolveProjectId(projectId);
    const response =
      await apiService.get<ListBusinessRequirementsApiResponse>(
        projectBRPath(pid)
      );
    const body = assertListBusinessRequirementsSuccess(response.data);
    return {
      success: body.success,
      message: body.message ?? null,
      data: (body.data ?? []).map(mapBusinessRequirementRow),
    };
  },

  /** POST /api/v1/projects/{project_id}/business-requirements */
  create: async (
    projectId: string,
    item: CreateBusinessRequirementRequest
  ): Promise<CreateBusinessRequirementResponse> => {
    const pid = resolveProjectId(projectId);
    const response = await apiService.post<BusinessRequirementApiResponse>(
      projectBRPath(pid),
      toBusinessRequirementApiBody(item)
    );
    const body = assertBusinessRequirementSuccess(response.data);
    return {
      success: body.success,
      message: body.message ?? null,
      data: mapBusinessRequirementRow(body.data),
    };
  },

  /** PATCH /api/v1/projects/{project_id}/business-requirements/{br_id} */
  update: async (
    projectId: string,
    brId: string,
    body: UpdateBusinessRequirementRequest
  ): Promise<UpdateBusinessRequirementResponse> => {
    const pid = resolveProjectId(projectId);
    const bid = resolveBRId(brId);
    const response = await apiService.patch<BusinessRequirementApiResponse>(
      projectBRItemPath(pid, bid),
      toBusinessRequirementApiBody(body)
    );
    const resBody = assertBusinessRequirementSuccess(response.data);
    return {
      success: resBody.success,
      message: resBody.message ?? null,
      data: mapBusinessRequirementRow(resBody.data),
    };
  },

  /** DELETE /api/v1/projects/{project_id}/business-requirements/{br_id} */
  delete: async (projectId: string, brId: string): Promise<void> => {
    const pid = resolveProjectId(projectId);
    const bid = resolveBRId(brId);
    await apiService.delete<unknown>(projectBRItemPath(pid, bid));
  },
};
