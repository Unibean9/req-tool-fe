import apiService from "../core";

import type {
  ActorEpicPriority,
  ActorEpicStatus,
  ActorUserStory,
} from "./fetchActor";
import {
  ACTOR_EPIC_PRIORITIES,
  ACTOR_EPIC_STATUSES,
} from "./fetchActor";

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

interface UserStoryMutationApiResponse {
  success: boolean;
  data: ActorUserStoryRowApi;
  message: string | null;
}

/** PATCH body item — `acceptance_criteria[]`. */
export interface UpdateUserStoryAcceptanceCriterion {
  description: string;
  order: number;
}

/** PATCH body (camelCase trong app → snake_case trên wire). */
export interface UpdateUserStoryRequest {
  title?: string;
  description?: string;
  actorRef?: string;
  actionText?: string;
  goalText?: string;
  status?: ActorEpicStatus;
  priority?: ActorEpicPriority;
  labels?: string[];
  storyPoints?: number;
  /** Gửi full mảng khi cập nhật tiêu chí nghiệm thu. */
  acceptanceCriteria?: UpdateUserStoryAcceptanceCriterion[];
}

export interface UpdateUserStoryResponse {
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

function mapAcceptanceCriterion(
  row: AcceptanceCriterionApi,
  index: number
): ActorUserStory["acceptanceCriteria"][number] {
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
    ...(body.acceptanceCriteria !== undefined
      ? {
          acceptance_criteria: body.acceptanceCriteria.map((ac) => ({
            description: ac.description.trim(),
            order: ac.order,
          })),
        }
      : {}),
  };
}

function mapUpdateUserStoryResponse(
  body: UserStoryMutationApiResponse
): UpdateUserStoryResponse {
  return {
    success: body.success,
    message: body.message ?? null,
    data: mapActorUserStoryRow(body.data),
  };
}

function userStoryPath(projectId: string, userStoryId: string) {
  return `/api/v1/projects/${encodeURIComponent(projectId)}/user-stories/${encodeURIComponent(userStoryId)}`;
}

export const fetchStory = {
  /**
   * PATCH /api/v1/projects/:project_id/user-stories/:user_story_id
   * Sau mutation: `invalidateActorWorkspaceQueries` (requirement-model + canvas-layout).
   */
  update: async (
    projectId: string,
    userStoryId: string,
    body: UpdateUserStoryRequest
  ): Promise<UpdateUserStoryResponse> => {
    const response = await apiService.patch<UserStoryMutationApiResponse>(
      userStoryPath(projectId, userStoryId),
      toUpdateUserStoryApiBody(body)
    );
    return mapUpdateUserStoryResponse(response.data);
  },

  /**
   * DELETE /api/v1/projects/:project_id/user-stories/:user_story_id
   * Sau mutation: `invalidateActorWorkspaceQueries` (requirement-model + canvas-layout).
   */
  delete: async (projectId: string, userStoryId: string): Promise<void> => {
    await apiService.delete<unknown>(userStoryPath(projectId, userStoryId));
  },
};
