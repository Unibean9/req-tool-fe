import apiService from "../core";

export type ProjectGoalPriority = "low" | "medium" | "high";

interface ObjectiveRowApi {
  id: string;
  goal_id: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface ProjectGoalRowApi {
  id: string;
  project_id: string;
  description: string;
  order: number;
  priority: ProjectGoalPriority;
  success_metric: string;
  target_date: string;
  objectives: ObjectiveRowApi[];
  created_at: string;
  updated_at: string;
}

interface ProjectGoalApiResponse {
  success: boolean;
  data: ProjectGoalRowApi;
  message: string | null;
}

interface ListProjectGoalsApiResponse {
  success: boolean;
  data: ProjectGoalRowApi[];
  message: string | null;
}

export interface Objective {
  id: string;
  goalId: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

/** POST/PATCH body (camelCase trong app → snake_case trên wire). */
export interface ProjectGoalWriteRequest {
  description: string;
  order: number;
  priority: ProjectGoalPriority;
  successMetric: string;
  targetDate: string;
  objectives: string[];
}

export interface ProjectGoal {
  id: string;
  projectId: string;
  description: string;
  order: number;
  priority: ProjectGoalPriority;
  successMetric: string;
  targetDate: string;
  objectives: Objective[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectGoalResponse {
  success: boolean;
  data: ProjectGoal;
  message: string | null;
}

export type CreateProjectGoalRequest = ProjectGoalWriteRequest;
export type CreateProjectGoalResponse = ProjectGoalResponse;

export type UpdateProjectGoalRequest = ProjectGoalWriteRequest;
export type UpdateProjectGoalResponse = ProjectGoalResponse;

export interface ProjectGoalsListResponse {
  success: boolean;
  data: ProjectGoal[];
  message: string | null;
}

function resolveProjectId(projectId: string): string {
  const id = projectId.trim();
  if (!id) throw new Error("project_id là bắt buộc");
  return id;
}

function resolveGoalId(goalId: string): string {
  const id = goalId.trim();
  if (!id) throw new Error("goal_id là bắt buộc");
  return id;
}

function mapObjectiveRow(row: ObjectiveRowApi): Objective {
  return {
    id: row.id,
    goalId: row.goal_id,
    description: row.description ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProjectGoalRow(row: ProjectGoalRowApi): ProjectGoal {
  return {
    id: row.id,
    projectId: row.project_id,
    description: row.description ?? "",
    order: Number(row.order) || 0,
    priority: row.priority ?? "medium",
    successMetric: row.success_metric ?? "",
    targetDate: row.target_date ?? "",
    objectives: (row.objectives ?? []).map(mapObjectiveRow),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toProjectGoalApiBody(body: ProjectGoalWriteRequest) {
  return {
    description: body.description.trim(),
    order: body.order,
    priority: body.priority,
    success_metric: body.successMetric,
    target_date: body.targetDate,
    objectives: body.objectives,
  };
}

function mapProjectGoalResponse(
  body: ProjectGoalApiResponse
): ProjectGoalResponse {
  return {
    success: body.success,
    message: body.message ?? null,
    data: mapProjectGoalRow(body.data),
  };
}

function mapProjectGoalsListResponse(
  body: ListProjectGoalsApiResponse
): ProjectGoalsListResponse {
  return {
    success: body.success,
    message: body.message ?? null,
    data: (body.data ?? []).map(mapProjectGoalRow),
  };
}

function assertProjectGoalSuccess(
  body: ProjectGoalApiResponse
): ProjectGoalApiResponse {
  if (!body.success) {
    throw new Error(body.message ?? "Thao tác goal thất bại");
  }
  return body;
}

function assertProjectGoalsListSuccess(
  body: ListProjectGoalsApiResponse
): ListProjectGoalsApiResponse {
  if (!body.success) {
    throw new Error(body.message ?? "Không tải được danh sách goal");
  }
  return body;
}

export const fetchGoal = {
  /** GET /api/v1/projects/{project_id}/goals */
  list: async (projectId: string): Promise<ProjectGoalsListResponse> => {
    const pid = resolveProjectId(projectId);
    const response = await apiService.get<ListProjectGoalsApiResponse>(
      `/api/v1/projects/${encodeURIComponent(pid)}/goals`
    );
    return mapProjectGoalsListResponse(
      assertProjectGoalsListSuccess(response.data)
    );
  },

  /** POST /api/v1/projects/{project_id}/goals */
  create: async (
    projectId: string,
    body: CreateProjectGoalRequest
  ): Promise<CreateProjectGoalResponse> => {
    const pid = resolveProjectId(projectId);
    const response = await apiService.post<ProjectGoalApiResponse>(
      `/api/v1/projects/${encodeURIComponent(pid)}/goals`,
      toProjectGoalApiBody(body)
    );
    assertProjectGoalSuccess(response.data);
    return mapProjectGoalResponse(response.data);
  },

  /** PATCH /api/v1/projects/{project_id}/goals/{goal_id} */
  update: async (
    projectId: string,
    goalId: string,
    body: UpdateProjectGoalRequest
  ): Promise<UpdateProjectGoalResponse> => {
    const pid = resolveProjectId(projectId);
    const gid = resolveGoalId(goalId);
    const response = await apiService.patch<ProjectGoalApiResponse>(
      `/api/v1/projects/${encodeURIComponent(pid)}/goals/${encodeURIComponent(gid)}`,
      toProjectGoalApiBody(body)
    );
    assertProjectGoalSuccess(response.data);
    return mapProjectGoalResponse(response.data);
  },

  /** DELETE /api/v1/projects/{project_id}/goals/{goal_id} */
  delete: async (projectId: string, goalId: string): Promise<void> => {
    const pid = resolveProjectId(projectId);
    const gid = resolveGoalId(goalId);
    await apiService.delete<unknown>(
      `/api/v1/projects/${encodeURIComponent(pid)}/goals/${encodeURIComponent(gid)}`
    );
  },
};
