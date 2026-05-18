import apiService from "../core";

import type {
  ActorEpicPriority,
  ActorFeature,
  ActorUserStory,
  FeatureStatus,
} from "./fetchActor";
import { ACTOR_EPIC_PRIORITIES, parseFeatureStatus } from "./fetchActor";

export { FEATURE_STATUSES, type FeatureStatus } from "./fetchActor";

interface ActorFeatureRowApi {
  id: string;
  epic_id: string;
  prefix: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  labels: unknown;
  references: unknown;
  warnings: string[];
  total_story_points?: number;
  total_business_value?: number;
  story_count?: number;
  created_at: string;
  updated_at: string;
}

interface ListProjectFeaturesApiResponse {
  success: boolean;
  data: ActorFeatureRowApi[];
  message: string | null;
}

interface FeatureMutationApiResponse {
  success: boolean;
  data: ActorFeatureRowApi;
  message: string | null;
}

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

interface CreateFeatureUserStoryApiResponse {
  success: boolean;
  data: ActorUserStoryRowApi;
  message: string | null;
}

export interface ListProjectFeaturesParams {
  epicId?: string;
  status?: FeatureStatus;
  limit?: number;
  offset?: number;
}

export interface ProjectFeaturesListResponse {
  success: boolean;
  data: ActorFeature[];
  message: string | null;
}

export interface ProjectFeatureDetailResponse {
  success: boolean;
  data: ActorFeature;
  message: string | null;
}

/** PATCH body (camelCase trong app → snake_case trên wire). */
export interface UpdateFeatureRequest {
  title?: string;
  description?: string;
  status?: FeatureStatus;
  priority?: ActorEpicPriority;
  labels?: string[];
}

export interface UpdateFeatureResponse {
  success: boolean;
  data: ActorFeature;
  message: string | null;
}

/** POST .../features/{feature_id}/user-stories */
export interface CreateFeatureUserStoryRequest {
  title: string;
  description: string;
  actorRef: string;
  actionText: string;
  goalText: string;
  priority: ActorEpicPriority;
  labels: string[];
  storyPoints: number;
  businessValue: number;
}

export interface CreateFeatureUserStoryResponse {
  success: boolean;
  data: ActorUserStory;
  message: string | null;
}

function resolveProjectId(projectId: string): string {
  const id = projectId.trim();
  if (!id) throw new Error("project_id là bắt buộc");
  return id;
}

function resolveFeatureId(featureId: string): string {
  const id = featureId.trim();
  if (!id) throw new Error("feature_id là bắt buộc");
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

function mapActorFeatureRow(row: ActorFeatureRowApi): ActorFeature {
  return {
    id: row.id,
    epicId: row.epic_id,
    prefix: row.prefix,
    title: row.title,
    description: row.description,
    status: parseFeatureStatus(row.status),
    priority: parseActorEpicPriority(row.priority),
    labels: normalizeWireTextListField(row.labels),
    nfrNote: "",
    references: normalizeWireTextListField(row.references),
    warnings: row.warnings ?? [],
    totalStoryPoints: Number(row.total_story_points) || 0,
    totalBusinessValue: Number(row.total_business_value) || 0,
    storyCount: Number(row.story_count) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAcceptanceCriterion(
  row: AcceptanceCriterionApi,
  index: number
): { id: string; label: string; order: number } {
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

function toListProjectFeaturesSearchParams(
  params?: ListProjectFeaturesParams
): Record<string, string | number> | undefined {
  if (!params) return undefined;
  const searchParams: Record<string, string | number> = {};
  const epicId = params.epicId?.trim();
  if (epicId) searchParams.epic_id = epicId;
  if (params.status) searchParams.status = params.status;
  if (params.limit !== undefined) searchParams.limit = params.limit;
  if (params.offset !== undefined) searchParams.offset = params.offset;
  return Object.keys(searchParams).length > 0 ? searchParams : undefined;
}

function toUpdateFeatureApiBody(body: UpdateFeatureRequest) {
  return {
    ...(body.title !== undefined ? { title: body.title.trim() } : {}),
    ...(body.description !== undefined
      ? { description: body.description.trim() }
      : {}),
    ...(body.status !== undefined ? { status: body.status } : {}),
    ...(body.priority !== undefined ? { priority: body.priority } : {}),
    ...(body.labels !== undefined
      ? { labels: body.labels.map((l) => l.trim()).filter(Boolean) }
      : {}),
  };
}

function toCreateFeatureUserStoryApiBody(body: CreateFeatureUserStoryRequest) {
  return {
    title: body.title.trim(),
    description: body.description.trim(),
    actor_ref: body.actorRef.trim(),
    action_text: body.actionText.trim(),
    goal_text: body.goalText.trim(),
    priority: body.priority,
    labels: body.labels.map((l) => l.trim()).filter(Boolean),
    story_points: body.storyPoints,
    business_value: body.businessValue,
  };
}

function assertCreateFeatureUserStorySuccess(
  body: CreateFeatureUserStoryApiResponse
): CreateFeatureUserStoryApiResponse {
  if (!body.success) {
    throw new Error(body.message ?? "Tạo user story thất bại");
  }
  return body;
}

function assertProjectFeaturesListSuccess(
  body: ListProjectFeaturesApiResponse
): ListProjectFeaturesApiResponse {
  if (!body.success) {
    throw new Error(body.message ?? "Không tải được danh sách feature");
  }
  return body;
}

function assertFeatureMutationSuccess(
  body: FeatureMutationApiResponse
): FeatureMutationApiResponse {
  if (!body.success) {
    throw new Error(body.message ?? "Thao tác feature thất bại");
  }
  return body;
}

function mapProjectFeaturesListResponse(
  body: ListProjectFeaturesApiResponse
): ProjectFeaturesListResponse {
  return {
    success: body.success,
    message: body.message ?? null,
    data: (body.data ?? []).map(mapActorFeatureRow),
  };
}

function mapProjectFeatureDetailResponse(
  body: FeatureMutationApiResponse
): ProjectFeatureDetailResponse {
  return {
    success: body.success,
    message: body.message ?? null,
    data: mapActorFeatureRow(body.data),
  };
}

function mapUpdateFeatureResponse(
  body: FeatureMutationApiResponse
): UpdateFeatureResponse {
  return mapProjectFeatureDetailResponse(body);
}

function mapCreateFeatureUserStoryResponse(
  body: CreateFeatureUserStoryApiResponse
): CreateFeatureUserStoryResponse {
  return {
    success: body.success,
    message: body.message ?? null,
    data: mapActorUserStoryRow(body.data),
  };
}

function projectsFeaturesPath(projectId: string) {
  return `/api/v1/projects/${encodeURIComponent(projectId)}/features`;
}

function featurePath(projectId: string, featureId: string) {
  return `${projectsFeaturesPath(projectId)}/${encodeURIComponent(featureId)}`;
}

export const fetchFeature = {
  /** GET /api/v1/projects/{project_id}/features */
  list: async (
    projectId: string,
    params?: ListProjectFeaturesParams
  ): Promise<ProjectFeaturesListResponse> => {
    const pid = resolveProjectId(projectId);
    const response = await apiService.get<ListProjectFeaturesApiResponse>(
      projectsFeaturesPath(pid),
      toListProjectFeaturesSearchParams(params)
    );
    return mapProjectFeaturesListResponse(
      assertProjectFeaturesListSuccess(response.data)
    );
  },

  /** GET /api/v1/projects/{project_id}/features/{feature_id} */
  get: async (
    projectId: string,
    featureId: string
  ): Promise<ProjectFeatureDetailResponse> => {
    const pid = resolveProjectId(projectId);
    const fid = resolveFeatureId(featureId);
    const response = await apiService.get<FeatureMutationApiResponse>(
      featurePath(pid, fid)
    );
    assertFeatureMutationSuccess(response.data);
    return mapProjectFeatureDetailResponse(response.data);
  },

  /**
   * PATCH /api/v1/projects/:project_id/features/:feature_id
   * Sau mutation: `invalidateActorWorkspaceQueries` (requirement-model + canvas-layout).
   */
  update: async (
    projectId: string,
    featureId: string,
    body: UpdateFeatureRequest
  ): Promise<UpdateFeatureResponse> => {
    const pid = resolveProjectId(projectId);
    const fid = resolveFeatureId(featureId);
    const response = await apiService.patch<FeatureMutationApiResponse>(
      featurePath(pid, fid),
      toUpdateFeatureApiBody(body)
    );
    assertFeatureMutationSuccess(response.data);
    return mapUpdateFeatureResponse(response.data);
  },

  /**
   * DELETE /api/v1/projects/:project_id/features/:feature_id
   * Sau mutation: `invalidateActorWorkspaceQueries` (requirement-model + canvas-layout).
   */
  delete: async (projectId: string, featureId: string): Promise<void> => {
    const pid = resolveProjectId(projectId);
    const fid = resolveFeatureId(featureId);
    await apiService.delete<unknown>(featurePath(pid, fid));
  },

  /**
   * POST /api/v1/projects/:project_id/features/:feature_id/user-stories
   * Sau mutation: `invalidateActorWorkspaceQueries` (requirement-model + canvas-layout).
   */
  createUserStory: async (
    projectId: string,
    featureId: string,
    body: CreateFeatureUserStoryRequest
  ): Promise<CreateFeatureUserStoryResponse> => {
    const pid = resolveProjectId(projectId);
    const fid = resolveFeatureId(featureId);
    const response = await apiService.post<CreateFeatureUserStoryApiResponse>(
      `${featurePath(pid, fid)}/user-stories`,
      toCreateFeatureUserStoryApiBody(body)
    );
    assertCreateFeatureUserStorySuccess(response.data);
    return mapCreateFeatureUserStoryResponse(response.data);
  },
};
