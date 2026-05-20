import apiService from "../core";

interface ProjectRuleRowApi {
  id: string;
  project_id: string;
  rule_def: string;
  type: string;
  is_dynamic: boolean;
  source: string;
  created_at: string;
  updated_at: string;
}

interface ProjectRuleApiResponse {
  success: boolean;
  data: ProjectRuleRowApi;
  message: string | null;
}

interface ListProjectRulesApiResponse {
  success: boolean;
  data: ProjectRuleRowApi[];
  message: string | null;
}

export const PROJECT_RULE_TYPES = [
  "constraint",
  "calculation",
  "validation",
  "process",
  "policy",
  "regulation",
] as const;

export type ProjectRuleType = (typeof PROJECT_RULE_TYPES)[number];

/** POST/PATCH body (camelCase trong app → snake_case trên wire). */
export interface ProjectRuleWriteRequest {
  ruleDef: string;
  type: ProjectRuleType;
  isDynamic: boolean;
  source: string;
}

export interface ProjectRule {
  id: string;
  projectId: string;
  ruleDef: string;
  type: ProjectRuleType;
  isDynamic: boolean;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRuleResponse {
  success: boolean;
  data: ProjectRule;
  message: string | null;
}

export type CreateProjectRuleRequest = ProjectRuleWriteRequest;
export type CreateProjectRuleResponse = ProjectRuleResponse;

export type UpdateProjectRuleRequest = ProjectRuleWriteRequest;
export type UpdateProjectRuleResponse = ProjectRuleResponse;

export interface ProjectRulesListResponse {
  success: boolean;
  data: ProjectRule[];
  message: string | null;
}

function resolveProjectId(projectId: string): string {
  const id = projectId.trim();
  if (!id) throw new Error("project_id là bắt buộc");
  return id;
}

function resolveRuleId(ruleId: string): string {
  const id = ruleId.trim();
  if (!id) throw new Error("rule_id là bắt buộc");
  return id;
}

function parseProjectRuleType(type: string): ProjectRuleType {
  return (PROJECT_RULE_TYPES as readonly string[]).includes(type)
    ? (type as ProjectRuleType)
    : "constraint";
}

function mapProjectRuleRow(row: ProjectRuleRowApi): ProjectRule {
  return {
    id: row.id,
    projectId: row.project_id,
    ruleDef: row.rule_def ?? "",
    type: parseProjectRuleType(row.type),
    isDynamic: Boolean(row.is_dynamic),
    source: row.source ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toProjectRuleApiBody(body: ProjectRuleWriteRequest) {
  return {
    rule_def: body.ruleDef.trim(),
    type: body.type,
    is_dynamic: body.isDynamic,
    source: body.source.trim(),
  };
}

function mapProjectRuleResponse(
  body: ProjectRuleApiResponse
): ProjectRuleResponse {
  return {
    success: body.success,
    message: body.message ?? null,
    data: mapProjectRuleRow(body.data),
  };
}

function mapProjectRulesListResponse(
  body: ListProjectRulesApiResponse
): ProjectRulesListResponse {
  return {
    success: body.success,
    message: body.message ?? null,
    data: (body.data ?? []).map(mapProjectRuleRow),
  };
}

function assertProjectRuleSuccess(
  body: ProjectRuleApiResponse
): ProjectRuleApiResponse {
  if (!body.success) {
    throw new Error(body.message ?? "Thao tác rule thất bại");
  }
  return body;
}

function assertProjectRulesListSuccess(
  body: ListProjectRulesApiResponse
): ListProjectRulesApiResponse {
  if (!body.success) {
    throw new Error(body.message ?? "Không tải được danh sách rule");
  }
  return body;
}

export const fetchRule = {
  /** GET /api/v1/projects/{project_id}/rules */
  list: async (projectId: string): Promise<ProjectRulesListResponse> => {
    const pid = resolveProjectId(projectId);
    const response = await apiService.get<ListProjectRulesApiResponse>(
      `/api/v1/projects/${encodeURIComponent(pid)}/rules`
    );
    return mapProjectRulesListResponse(
      assertProjectRulesListSuccess(response.data)
    );
  },

  /** POST /api/v1/projects/{project_id}/rules */
  create: async (
    projectId: string,
    body: CreateProjectRuleRequest
  ): Promise<CreateProjectRuleResponse> => {
    const pid = resolveProjectId(projectId);
    const response = await apiService.post<ProjectRuleApiResponse>(
      `/api/v1/projects/${encodeURIComponent(pid)}/rules`,
      toProjectRuleApiBody(body)
    );
    assertProjectRuleSuccess(response.data);
    return mapProjectRuleResponse(response.data);
  },

  /** PATCH /api/v1/projects/{project_id}/rules/{rule_id} */
  update: async (
    projectId: string,
    ruleId: string,
    body: UpdateProjectRuleRequest
  ): Promise<UpdateProjectRuleResponse> => {
    const pid = resolveProjectId(projectId);
    const rid = resolveRuleId(ruleId);
    const response = await apiService.patch<ProjectRuleApiResponse>(
      `/api/v1/projects/${encodeURIComponent(pid)}/rules/${encodeURIComponent(rid)}`,
      toProjectRuleApiBody(body)
    );
    assertProjectRuleSuccess(response.data);
    return mapProjectRuleResponse(response.data);
  },

  /** DELETE /api/v1/projects/{project_id}/rules/{rule_id} */
  delete: async (projectId: string, ruleId: string): Promise<void> => {
    const pid = resolveProjectId(projectId);
    const rid = resolveRuleId(ruleId);
    await apiService.delete<unknown>(
      `/api/v1/projects/${encodeURIComponent(pid)}/rules/${encodeURIComponent(rid)}`
    );
  },
};
