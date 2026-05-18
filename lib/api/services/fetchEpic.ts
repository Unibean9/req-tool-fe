import apiService from "../core";

import type {
  ActorEpic,
  ActorEpicPriority,
  ActorEpicStatus,
  ActorFeature,
} from "./fetchActor";
import {
  ACTOR_EPIC_PRIORITIES,
  ACTOR_EPIC_STATUSES,
  parseFeatureStatus,
} from "./fetchActor";

interface ActorEpicRowApi {
  id: string;
  project_id: string;
  actor_id: string;
  prefix: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  labels: unknown;
  references: unknown;
  created_at: string;
  updated_at: string;
}

interface ActorFeatureRowApi {
  id: string;
  epic_id: string;
  prefix: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  labels: unknown;
  nfr_note?: string;
  references: unknown;
  warnings: string[];
  total_story_points?: number;
  total_business_value?: number;
  story_count?: number;
  created_at: string;
  updated_at: string;
}

interface EpicMutationApiResponse {
  success: boolean;
  data: ActorEpicRowApi;
  message: string | null;
}

interface CreateEpicFeatureApiResponse {
  success: boolean;
  data: ActorFeatureRowApi;
  message: string | null;
}

/** PATCH body (camelCase trong app → snake_case trên wire). */
export interface UpdateEpicRequest {
  title?: string;
  description?: string;
  status?: ActorEpicStatus;
  priority?: ActorEpicPriority;
  labels?: string[];
}

export interface UpdateEpicResponse {
  success: boolean;
  data: ActorEpic;
  message: string | null;
}

/** POST .../epics/{epic_id}/features */
export interface CreateEpicFeatureRequest {
  title: string;
  description: string;
  priority: ActorEpicPriority;
  labels: string[];
}

export interface CreateEpicFeatureResponse {
  success: boolean;
  data: ActorFeature;
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

function mapActorEpicRow(row: ActorEpicRowApi): ActorEpic {
  return {
    id: row.id,
    projectId: row.project_id,
    actorId: row.actor_id,
    prefix: row.prefix,
    title: row.title,
    description: row.description,
    status: parseActorEpicStatus(row.status),
    priority: parseActorEpicPriority(row.priority),
    labels: normalizeWireTextListField(row.labels),
    references: normalizeWireTextListField(row.references),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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
    nfrNote: row.nfr_note ?? "",
    references: normalizeWireTextListField(row.references),
    warnings: row.warnings ?? [],
    totalStoryPoints: Number(row.total_story_points) || 0,
    totalBusinessValue: Number(row.total_business_value) || 0,
    storyCount: Number(row.story_count) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toUpdateEpicApiBody(body: UpdateEpicRequest) {
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

function toCreateEpicFeatureApiBody(body: CreateEpicFeatureRequest) {
  return {
    title: body.title.trim(),
    description: body.description.trim(),
    priority: body.priority,
    labels: body.labels.map((l) => l.trim()).filter(Boolean),
  };
}

function assertCreateEpicFeatureSuccess(
  body: CreateEpicFeatureApiResponse
): CreateEpicFeatureApiResponse {
  if (!body.success) {
    throw new Error(body.message ?? "Tạo feature thất bại");
  }
  return body;
}

function mapUpdateEpicResponse(body: EpicMutationApiResponse): UpdateEpicResponse {
  return {
    success: body.success,
    message: body.message ?? null,
    data: mapActorEpicRow(body.data),
  };
}

function mapCreateEpicFeatureResponse(
  body: CreateEpicFeatureApiResponse
): CreateEpicFeatureResponse {
  return {
    success: body.success,
    message: body.message ?? null,
    data: mapActorFeatureRow(body.data),
  };
}

function epicPath(projectId: string, epicId: string) {
  return `/api/v1/projects/${encodeURIComponent(projectId)}/epics/${encodeURIComponent(epicId)}`;
}

export const fetchEpic = {
  /**
   * PATCH /api/v1/projects/:project_id/epics/:epic_id
   * Sau mutation: `invalidateActorWorkspaceQueries` (requirement-model + canvas-layout).
   */
  update: async (
    projectId: string,
    epicId: string,
    body: UpdateEpicRequest
  ): Promise<UpdateEpicResponse> => {
    const response = await apiService.patch<EpicMutationApiResponse>(
      epicPath(projectId, epicId),
      toUpdateEpicApiBody(body)
    );
    return mapUpdateEpicResponse(response.data);
  },

  /**
   * DELETE /api/v1/projects/:project_id/epics/:epic_id
   * Sau mutation: `invalidateActorWorkspaceQueries` (requirement-model + canvas-layout).
   */
  delete: async (projectId: string, epicId: string): Promise<void> => {
    await apiService.delete<unknown>(epicPath(projectId, epicId));
  },

  /**
   * POST /api/v1/projects/:project_id/epics/:epic_id/features
   * Sau mutation: `invalidateActorWorkspaceQueries` (requirement-model + canvas-layout).
   */
  createFeature: async (
    projectId: string,
    epicId: string,
    body: CreateEpicFeatureRequest
  ): Promise<CreateEpicFeatureResponse> => {
    const response = await apiService.post<CreateEpicFeatureApiResponse>(
      `${epicPath(projectId, epicId)}/features`,
      toCreateEpicFeatureApiBody(body)
    );
    assertCreateEpicFeatureSuccess(response.data);
    return mapCreateEpicFeatureResponse(response.data);
  },
};
