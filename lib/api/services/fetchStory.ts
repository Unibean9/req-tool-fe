import apiService from "../core";

import type {
  ActorEpicPriority,
  ActorUserStory,
  FeatureStatus,
} from "./fetchActor";
import {
  ACTOR_EPIC_PRIORITIES,
  parseFeatureStatus,
} from "./fetchActor";

export type { FeatureStatus } from "./fetchActor";

interface AcceptanceCriterionApi {
  id?: string;
  label?: string;
  description?: string;
  order?: number;
  text?: string;
  done?: boolean;
}

interface ActorUserStoryRowApi {
  id: string;
  feature_id: string;
  prefix: string;
  title: string;
  description: string;
  actor_ref: string;
  action_text: string;
  goal_text: string;
  status: string;
  priority: string;
  labels: unknown;
  references: unknown;
  story_points: number;
  business_value?: number;
  acceptance_criteria: AcceptanceCriterionApi[];
  created_at: string;
  updated_at: string;
}

interface ListProjectStoriesApiResponse {
  success: boolean;
  data: ActorUserStoryRowApi[];
  message: string | null;
}

interface UserStoryMutationApiResponse {
  success: boolean;
  data: ActorUserStoryRowApi;
  message: string | null;
}

export interface ListProjectStoriesParams {
  featureId?: string;
  status?: FeatureStatus;
  limit?: number;
  offset?: number;
}

export interface ProjectStoriesListResponse {
  success: boolean;
  data: ActorUserStory[];
  message: string | null;
}

export interface ProjectUserStoryDetailResponse {
  success: boolean;
  data: ActorUserStory;
  message: string | null;
}

/** PATCH body item — `acceptance_criteria[]`. */
export interface UpdateUserStoryAcceptanceCriterion {
  label: string;
  order: number;
}

/** PATCH body (camelCase trong app → snake_case trên wire). */
export interface UpdateUserStoryRequest {
  title?: string;
  description?: string;
  actorRef?: string;
  actionText?: string;
  goalText?: string;
  status?: FeatureStatus;
  priority?: ActorEpicPriority;
  labels?: string[];
  storyPoints?: number;
  businessValue?: number;
  /** Gửi full mảng khi cập nhật tiêu chí nghiệm thu. */
  acceptanceCriteria?: UpdateUserStoryAcceptanceCriterion[];
}

export interface UpdateUserStoryResponse {
  success: boolean;
  data: ActorUserStory;
  message: string | null;
}

function resolveProjectId(projectId: string): string {
  const id = projectId.trim();
  if (!id) throw new Error("project_id là bắt buộc");
  return id;
}

function resolveUserStoryId(userStoryId: string): string {
  const id = userStoryId.trim();
  if (!id) throw new Error("user_story_id là bắt buộc");
  return id;
}

function normalizeWireTextListField(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value
      .map((item) => (item == null ? "" : String(item).trim()))
      .filter(Boolean)
      .join(", ");
  }
  return String(value);
}

function parseActorEpicPriority(priority: string): ActorEpicPriority {
  return (ACTOR_EPIC_PRIORITIES as readonly string[]).includes(priority)
    ? (priority as ActorEpicPriority)
    : "medium";
}

function mapAcceptanceCriterion(
  row: AcceptanceCriterionApi,
  index: number
): ActorUserStory["acceptanceCriteria"][number] {
  const label =
    typeof row.label === "string" && row.label.trim()
      ? row.label.trim()
      : typeof row.description === "string" && row.description.trim()
        ? row.description.trim()
        : typeof row.text === "string"
          ? row.text.trim()
          : "";
  const order =
    typeof row.order === "number" && Number.isFinite(row.order)
      ? row.order
      : index;
  return {
    id: row.id ?? `ac-${index}`,
    label,
    order,
  };
}

function mapActorUserStoryRow(row: ActorUserStoryRowApi): ActorUserStory {
  return {
    id: row.id,
    featureId: row.feature_id,
    prefix: row.prefix,
    title: row.title,
    description: row.description,
    actorRef: row.actor_ref,
    actionText: row.action_text,
    goalText: row.goal_text,
    status: parseFeatureStatus(row.status),
    priority: parseActorEpicPriority(row.priority),
    labels: normalizeWireTextListField(row.labels),
    references: normalizeWireTextListField(row.references),
    storyPoints: Number(row.story_points) || 0,
    businessValue: Number(row.business_value) || 0,
    acceptanceCriteria: (row.acceptance_criteria ?? []).map(mapAcceptanceCriterion),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toListProjectStoriesSearchParams(
  params?: ListProjectStoriesParams
): Record<string, string | number> | undefined {
  if (!params) return undefined;
  const searchParams: Record<string, string | number> = {};
  const featureId = params.featureId?.trim();
  if (featureId) searchParams.feature_id = featureId;
  if (params.status) searchParams.status = params.status;
  if (params.limit !== undefined) searchParams.limit = params.limit;
  if (params.offset !== undefined) searchParams.offset = params.offset;
  return Object.keys(searchParams).length > 0 ? searchParams : undefined;
}

function toUpdateUserStoryApiBody(body: UpdateUserStoryRequest) {
  return {
    ...(body.title !== undefined ? { title: body.title.trim() } : {}),
    ...(body.description !== undefined
      ? { description: body.description.trim() }
      : {}),
    ...(body.actorRef !== undefined ? { actor_ref: body.actorRef.trim() } : {}),
    ...(body.actionText !== undefined
      ? { action_text: body.actionText.trim() }
      : {}),
    ...(body.goalText !== undefined ? { goal_text: body.goalText.trim() } : {}),
    ...(body.status !== undefined ? { status: body.status } : {}),
    ...(body.priority !== undefined ? { priority: body.priority } : {}),
    ...(body.labels !== undefined
      ? { labels: body.labels.map((l) => l.trim()).filter(Boolean) }
      : {}),
    ...(body.storyPoints !== undefined ? { story_points: body.storyPoints } : {}),
    ...(body.businessValue !== undefined
      ? { business_value: body.businessValue }
      : {}),
    ...(body.acceptanceCriteria !== undefined
      ? {
          acceptance_criteria: body.acceptanceCriteria.map((ac) => ({
            label: ac.label.trim(),
            order: ac.order,
          })),
        }
      : {}),
  };
}

function assertProjectStoriesListSuccess(
  body: ListProjectStoriesApiResponse
): ListProjectStoriesApiResponse {
  if (!body.success) {
    throw new Error(body.message ?? "Không tải được danh sách user story");
  }
  return body;
}

function assertUserStoryMutationSuccess(
  body: UserStoryMutationApiResponse
): UserStoryMutationApiResponse {
  if (!body.success) {
    throw new Error(body.message ?? "Thao tác user story thất bại");
  }
  return body;
}

function mapProjectStoriesListResponse(
  body: ListProjectStoriesApiResponse
): ProjectStoriesListResponse {
  return {
    success: body.success,
    message: body.message ?? null,
    data: (body.data ?? []).map(mapActorUserStoryRow),
  };
}

function mapProjectUserStoryDetailResponse(
  body: UserStoryMutationApiResponse
): ProjectUserStoryDetailResponse {
  return {
    success: body.success,
    message: body.message ?? null,
    data: mapActorUserStoryRow(body.data),
  };
}

function mapUpdateUserStoryResponse(
  body: UserStoryMutationApiResponse
): UpdateUserStoryResponse {
  return mapProjectUserStoryDetailResponse(body);
}

function projectsStoriesPath(projectId: string) {
  return `/api/v1/projects/${encodeURIComponent(projectId)}/stories`;
}

function userStoryPath(projectId: string, userStoryId: string) {
  return `/api/v1/projects/${encodeURIComponent(projectId)}/user-stories/${encodeURIComponent(userStoryId)}`;
}

export const fetchStory = {
  /** GET /api/v1/projects/{project_id}/stories */
  list: async (
    projectId: string,
    params?: ListProjectStoriesParams
  ): Promise<ProjectStoriesListResponse> => {
    const pid = resolveProjectId(projectId);
    const response = await apiService.get<ListProjectStoriesApiResponse>(
      projectsStoriesPath(pid),
      toListProjectStoriesSearchParams(params)
    );
    return mapProjectStoriesListResponse(
      assertProjectStoriesListSuccess(response.data)
    );
  },

  /** GET /api/v1/projects/{project_id}/stories/{user_story_id} */
  get: async (
    projectId: string,
    userStoryId: string
  ): Promise<ProjectUserStoryDetailResponse> => {
    const pid = resolveProjectId(projectId);
    const sid = resolveUserStoryId(userStoryId);
    const response = await apiService.get<UserStoryMutationApiResponse>(
      `${projectsStoriesPath(pid)}/${encodeURIComponent(sid)}`
    );
    assertUserStoryMutationSuccess(response.data);
    return mapProjectUserStoryDetailResponse(response.data);
  },

  /**
   * PATCH /api/v1/projects/:project_id/user-stories/:user_story_id
   * Sau mutation: `invalidateActorWorkspaceQueries` (requirement-model + canvas-layout).
   */
  update: async (
    projectId: string,
    userStoryId: string,
    body: UpdateUserStoryRequest
  ): Promise<UpdateUserStoryResponse> => {
    const pid = resolveProjectId(projectId);
    const sid = resolveUserStoryId(userStoryId);
    const response = await apiService.patch<UserStoryMutationApiResponse>(
      userStoryPath(pid, sid),
      toUpdateUserStoryApiBody(body)
    );
    assertUserStoryMutationSuccess(response.data);
    return mapUpdateUserStoryResponse(response.data);
  },

  /**
   * DELETE /api/v1/projects/:project_id/user-stories/:user_story_id
   * Sau mutation: `invalidateActorWorkspaceQueries` (requirement-model + canvas-layout).
   */
  delete: async (projectId: string, userStoryId: string): Promise<void> => {
    const pid = resolveProjectId(projectId);
    const sid = resolveUserStoryId(userStoryId);
    await apiService.delete<unknown>(userStoryPath(pid, sid));
  },
};
