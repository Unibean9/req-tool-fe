import apiService from "../core";

import type {
  ActorEpicPriority,
  ActorEpicStatus,
  ActorFeature,
  ActorUserStory,
} from "./fetchActor";
import {
  ACTOR_EPIC_PRIORITIES,
  ACTOR_EPIC_STATUSES,
} from "./fetchActor";

interface ActorFeatureRowApi {
  id: string;
  epic_id: string;
  prefix: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  labels: unknown;
  nfr_note: string;
  references: unknown;
  warnings: string[];
  created_at: string;
  updated_at: string;
}

interface AcceptanceCriterionApi {
  id?: string;
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
  acceptance_criteria: AcceptanceCriterionApi[];
  created_at: string;
  updated_at: string;
}

interface FeatureMutationApiResponse {
  success: boolean;
  data: ActorFeatureRowApi;
  message: string | null;
}

interface CreateFeatureUserStoryApiResponse {
  success: boolean;
  data: ActorUserStoryRowApi;
  message: string | null;
}

/** PATCH body (camelCase trong app → snake_case trên wire). */
export interface UpdateFeatureRequest {
  title?: string;
  description?: string;
  status?: ActorEpicStatus;
  priority?: ActorEpicPriority;
  labels?: string[];
  nfrNote?: string;
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
}

export interface CreateFeatureUserStoryResponse {
  success: boolean;
  data: ActorUserStory;
  message: string | null;
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

function parseActorEpicStatus(status: string): ActorEpicStatus {
  return (ACTOR_EPIC_STATUSES as readonly string[]).includes(status)
    ? (status as ActorEpicStatus)
    : "draft";
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
    status: parseActorEpicStatus(row.status),
    priority: parseActorEpicPriority(row.priority),
    labels: normalizeWireTextListField(row.labels),
    nfrNote: row.nfr_note,
    references: normalizeWireTextListField(row.references),
    warnings: row.warnings ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAcceptanceCriterion(
  row: AcceptanceCriterionApi,
  index: number
): { id: string; description: string; order: number } {
  const description =
    typeof row.description === "string" && row.description.trim()
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
    description,
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
    status: parseActorEpicStatus(row.status),
    priority: parseActorEpicPriority(row.priority),
    labels: normalizeWireTextListField(row.labels),
    references: normalizeWireTextListField(row.references),
    storyPoints: row.story_points,
    acceptanceCriteria: (row.acceptance_criteria ?? []).map(mapAcceptanceCriterion),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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
    ...(body.nfrNote !== undefined ? { nfr_note: body.nfrNote.trim() } : {}),
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
  };
}

function mapUpdateFeatureResponse(
  body: FeatureMutationApiResponse
): UpdateFeatureResponse {
  return {
    success: body.success,
    message: body.message ?? null,
    data: mapActorFeatureRow(body.data),
  };
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

function featurePath(projectId: string, featureId: string) {
  return `/api/v1/projects/${encodeURIComponent(projectId)}/features/${encodeURIComponent(featureId)}`;
}

export const fetchFeature = {
  /**
   * PATCH /api/v1/projects/:project_id/features/:feature_id
   * Sau mutation: `invalidateActorWorkspaceQueries` (requirement-model + canvas-layout).
   */
  update: async (
    projectId: string,
    featureId: string,
    body: UpdateFeatureRequest
  ): Promise<UpdateFeatureResponse> => {
    const response = await apiService.patch<FeatureMutationApiResponse>(
      featurePath(projectId, featureId),
      toUpdateFeatureApiBody(body)
    );
    return mapUpdateFeatureResponse(response.data);
  },

  /**
   * DELETE /api/v1/projects/:project_id/features/:feature_id
   * Sau mutation: `invalidateActorWorkspaceQueries` (requirement-model + canvas-layout).
   */
  delete: async (projectId: string, featureId: string): Promise<void> => {
    await apiService.delete<unknown>(featurePath(projectId, featureId));
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
    const response = await apiService.post<CreateFeatureUserStoryApiResponse>(
      `${featurePath(projectId, featureId)}/user-stories`,
      toCreateFeatureUserStoryApiBody(body)
    );
    return mapCreateFeatureUserStoryResponse(response.data);
  },
};
