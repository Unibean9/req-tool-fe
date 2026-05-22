import apiService from "../core";

export const OUT_OF_SCOPE_CATEGORIES = [
  "feature",
  "integration",
  "user_group",
  "process",
  "technical",
] as const;

export type OutOfScopeCategory = (typeof OUT_OF_SCOPE_CATEGORIES)[number];

interface OutOfScopeItemRowApi {
  id: string;
  project_id: string;
  description: string;
  category: string;
  order: number;
  created_at: string;
  updated_at: string;
}

interface OutOfScopeItemApiResponse {
  success: boolean;
  data: OutOfScopeItemRowApi;
  message: string | null;
}

interface ListOutOfScopeItemsApiResponse {
  success: boolean;
  data: OutOfScopeItemRowApi[];
  message: string | null;
}

interface DeleteOutOfScopeItemApiResponse {
  success: boolean;
  message: string | null;
}

export interface OutOfScopeItemWriteRequest {
  description: string;
  category: OutOfScopeCategory;
  order: number;
}

export interface OutOfScopeItem {
  id: string;
  projectId: string;
  description: string;
  category: OutOfScopeCategory;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface OutOfScopeItemResponse {
  success: boolean;
  data: OutOfScopeItem;
  message: string | null;
}

export interface CreateOutOfScopeItemRequest {
  id?: string;
  description: string;
  category: OutOfScopeCategory;
  order: number;
}
export type CreateOutOfScopeItemResponse = OutOfScopeItemResponse;

export type UpdateOutOfScopeItemRequest = OutOfScopeItemWriteRequest;
export type UpdateOutOfScopeItemResponse = OutOfScopeItemResponse;

export interface ListOutOfScopeItemsParams {
  category?: OutOfScopeCategory;
}

export interface OutOfScopeItemsListResponse {
  success: boolean;
  data: OutOfScopeItem[];
  message: string | null;
}

function resolveProjectId(projectId: string): string {
  const id = projectId.trim();
  if (!id) throw new Error("project_id là bắt buộc");
  return id;
}

function resolveItemId(itemId: string): string {
  const id = itemId.trim();
  if (!id) throw new Error("item_id là bắt buộc");
  return id;
}

function parseOutOfScopeCategory(category: string): OutOfScopeCategory {
  return (OUT_OF_SCOPE_CATEGORIES as readonly string[]).includes(category)
    ? (category as OutOfScopeCategory)
    : "feature";
}

function mapOutOfScopeItemRow(row: OutOfScopeItemRowApi): OutOfScopeItem {
  return {
    id: row.id,
    projectId: row.project_id,
    description: row.description ?? "",
    category: parseOutOfScopeCategory(row.category),
    order: row.order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toOutOfScopeItemApiBody(body: OutOfScopeItemWriteRequest) {
  return {
    description: body.description.trim(),
    category: body.category,
    order: body.order,
  };
}

function toListOutOfScopeItemsSearchParams(
  params?: ListOutOfScopeItemsParams
): Record<string, string> | undefined {
  if (!params) return undefined;
  const searchParams: Record<string, string> = {};
  if (params.category) searchParams.category = params.category;
  return Object.keys(searchParams).length > 0 ? searchParams : undefined;
}

function assertOutOfScopeItemSuccess(
  body: OutOfScopeItemApiResponse
): OutOfScopeItemApiResponse {
  if (!body.success) {
    throw new Error(body.message ?? "Thao tác out-of-scope thất bại");
  }
  return body;
}

function assertListOutOfScopeItemsSuccess(
  body: ListOutOfScopeItemsApiResponse
): ListOutOfScopeItemsApiResponse {
  if (!body.success) {
    throw new Error(body.message ?? "Không tải được danh sách out-of-scope");
  }
  return body;
}

function projectOutOfScopePath(projectId: string) {
  return `/api/v1/projects/${encodeURIComponent(projectId)}/out-of-scope`;
}

function projectOutOfScopeItemPath(projectId: string, itemId: string) {
  return `${projectOutOfScopePath(projectId)}/${encodeURIComponent(itemId)}`;
}

export const fetchOutOfScope = {
  /** GET /api/v1/projects/{project_id}/out-of-scope */
  list: async (
    projectId: string,
    params?: ListOutOfScopeItemsParams
  ): Promise<OutOfScopeItemsListResponse> => {
    const pid = resolveProjectId(projectId);
    const response = await apiService.get<ListOutOfScopeItemsApiResponse>(
      projectOutOfScopePath(pid),
      toListOutOfScopeItemsSearchParams(params)
    );
    const body = assertListOutOfScopeItemsSuccess(response.data);
    return {
      success: body.success,
      message: body.message ?? null,
      data: (body.data ?? []).map(mapOutOfScopeItemRow),
    };
  },

  /** POST /api/v1/projects/{project_id}/out-of-scope */
  create: async (
    projectId: string,
    item: CreateOutOfScopeItemRequest
  ): Promise<CreateOutOfScopeItemResponse> => {
    const pid = resolveProjectId(projectId);
    const response = await apiService.post<OutOfScopeItemApiResponse>(
      projectOutOfScopePath(pid),
      {
        ...(item.id ? { id: item.id } : {}),
        ...toOutOfScopeItemApiBody(item),
      }
    );
    const body = assertOutOfScopeItemSuccess(response.data);
    return {
      success: body.success,
      message: body.message ?? null,
      data: mapOutOfScopeItemRow(body.data),
    };
  },

  /** PATCH /api/v1/projects/{project_id}/out-of-scope/{item_id} */
  update: async (
    projectId: string,
    itemId: string,
    body: UpdateOutOfScopeItemRequest
  ): Promise<UpdateOutOfScopeItemResponse> => {
    const pid = resolveProjectId(projectId);
    const iid = resolveItemId(itemId);
    const response = await apiService.patch<OutOfScopeItemApiResponse>(
      projectOutOfScopeItemPath(pid, iid),
      toOutOfScopeItemApiBody(body)
    );
    const resBody = assertOutOfScopeItemSuccess(response.data);
    return {
      success: resBody.success,
      message: resBody.message ?? null,
      data: mapOutOfScopeItemRow(resBody.data),
    };
  },

  /** DELETE /api/v1/projects/{project_id}/out-of-scope/{item_id} */
  delete: async (projectId: string, itemId: string): Promise<void> => {
    const pid = resolveProjectId(projectId);
    const iid = resolveItemId(itemId);
    await apiService.delete<DeleteOutOfScopeItemApiResponse>(
      projectOutOfScopeItemPath(pid, iid)
    );
  },
};
