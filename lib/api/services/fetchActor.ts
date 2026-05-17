import apiService from "../core";

interface ProjectActorRowApi {
  id: string;
  project_id: string;
  name: string;
  role_description: string;
  created_at: string;
}

interface CreateProjectActorApiResponse {
  success: boolean;
  data: ProjectActorRowApi;
  message: string | null;
}

interface ListProjectActorsApiResponse {
  success: boolean;
  data: ProjectActorRowApi[];
  message: string | null;
}

/** POST body (camelCase trong app → snake_case trên wire). */
export interface CreateProjectActorRequest {
  name: string;
  roleDescription: string;
}

export interface ProjectActor {
  id: string;
  projectId: string;
  name: string;
  roleDescription: string;
  createdAt: string;
}

export interface CreateProjectActorResponse {
  success: boolean;
  data: ProjectActor;
  message: string | null;
}

/** PATCH — cùng body/envelope với POST. */
export type UpdateProjectActorRequest = CreateProjectActorRequest;

export type UpdateProjectActorResponse = CreateProjectActorResponse;

export interface ProjectActorsListResponse {
  success: boolean;
  data: ProjectActor[];
  message: string | null;
}

export const ACTOR_EPIC_PRIORITIES = [
  "low",
  "medium",
  "high",
  "critical",
] as const;
export type ActorEpicPriority = (typeof ACTOR_EPIC_PRIORITIES)[number];

export const ACTOR_EPIC_STATUSES = [
  "draft",
  "active",
  "done",
  "archived",
] as const;
export type ActorEpicStatus = (typeof ACTOR_EPIC_STATUSES)[number];

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

interface CreateActorEpicApiResponse {
  success: boolean;
  data: ActorEpicRowApi;
  message: string | null;
}

/** POST body (camelCase trong app → snake_case trên wire). */
export interface CreateActorEpicRequest {
  title: string;
  description: string;
  priority: ActorEpicPriority;
  labels: string[];
}

export interface ActorEpic {
  id: string;
  projectId: string;
  actorId: string;
  prefix: string;
  title: string;
  description: string;
  status: ActorEpicStatus;
  priority: ActorEpicPriority;
  labels: string;
  references: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActorEpicResponse {
  success: boolean;
  data: ActorEpic;
  message: string | null;
}

interface RequirementModelActorApi {
  id: string;
  project_id: string;
  name: string;
  role_description: string;
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
  /** Legacy wire — một số endpoint cũ */
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

interface RequirementModelPayloadApi {
  actor: RequirementModelActorApi;
  epics: ActorEpicRowApi[];
  features: ActorFeatureRowApi[];
  user_stories: ActorUserStoryRowApi[];
}

interface RequirementModelApiResponse {
  success: boolean;
  data: RequirementModelPayloadApi;
  message: string | null;
}

export interface RequirementModelActor {
  id: string;
  projectId: string;
  name: string;
  roleDescription: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActorFeature {
  id: string;
  epicId: string;
  prefix: string;
  title: string;
  description: string;
  status: ActorEpicStatus;
  priority: ActorEpicPriority;
  labels: string;
  nfrNote: string;
  references: string;
  warnings: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ActorAcceptanceCriterion {
  id: string;
  description: string;
  order: number;
}

export interface ActorUserStory {
  id: string;
  featureId: string;
  prefix: string;
  title: string;
  description: string;
  actorRef: string;
  actionText: string;
  goalText: string;
  status: ActorEpicStatus;
  priority: ActorEpicPriority;
  labels: string;
  references: string;
  storyPoints: number;
  acceptanceCriteria: ActorAcceptanceCriterion[];
  createdAt: string;
  updatedAt: string;
}

export interface RequirementModelPayload {
  actor: RequirementModelActor;
  epics: ActorEpic[];
  features: ActorFeature[];
  userStories: ActorUserStory[];
}

export interface RequirementModelResponse {
  success: boolean;
  data: RequirementModelPayload;
  message: string | null;
}

export const CANVAS_LAYOUT_NODE_KINDS = [
  "actor",
  "epic",
  "feature",
  "userStory",
] as const;
export type CanvasLayoutNodeKind = (typeof CANVAS_LAYOUT_NODE_KINDS)[number];

/** Node layout trên canvas (camelCase trong app). */
export interface CanvasLayoutNode {
  id: string;
  kind: CanvasLayoutNodeKind;
  x: number;
  y: number;
  collapsed?: boolean;
}

export interface SaveCanvasLayoutRequest {
  nodes: CanvasLayoutNode[];
}

export interface CanvasLayoutPayload {
  nodes: CanvasLayoutNode[];
}

export interface GetCanvasLayoutResponse {
  success: boolean;
  data: CanvasLayoutPayload;
  message: string | null;
}

interface CanvasLayoutPayloadApi {
  nodes: CanvasLayoutNodeApi[];
}

interface GetCanvasLayoutApiResponse {
  success: boolean;
  data: CanvasLayoutPayloadApi;
  message: string | null;
}

interface CanvasLayoutNodeApi {
  id: string;
  kind: string;
  x: number;
  y: number;
  collapsed?: boolean;
}

interface SaveCanvasLayoutApiBody {
  nodes: CanvasLayoutNodeApi[];
}

function canvasLayoutKindToWire(kind: CanvasLayoutNodeKind): string {
  return kind === "userStory" ? "user_story" : kind;
}

function canvasLayoutKindFromWire(kind: string): CanvasLayoutNodeKind {
  if (kind === "user_story") return "userStory";
  return (CANVAS_LAYOUT_NODE_KINDS as readonly string[]).includes(kind)
    ? (kind as CanvasLayoutNodeKind)
    : "epic";
}

function toSaveCanvasLayoutApiBody(
  body: SaveCanvasLayoutRequest
): SaveCanvasLayoutApiBody {
  return {
    nodes: body.nodes.map((node) => ({
      id: node.id,
      kind: canvasLayoutKindToWire(node.kind),
      x: node.x,
      y: node.y,
      ...(node.collapsed !== undefined ? { collapsed: node.collapsed } : {}),
    })),
  };
}

function mapCanvasLayoutNode(row: CanvasLayoutNodeApi): CanvasLayoutNode {
  return {
    id: row.id,
    kind: canvasLayoutKindFromWire(row.kind),
    x: row.x,
    y: row.y,
    ...(row.collapsed !== undefined ? { collapsed: row.collapsed } : {}),
  };
}

function mapGetCanvasLayoutResponse(
  body: GetCanvasLayoutApiResponse
): GetCanvasLayoutResponse {
  return {
    success: body.success,
    message: body.message ?? null,
    data: {
      nodes: (body.data?.nodes ?? []).map(mapCanvasLayoutNode),
    },
  };
}

function mapProjectActorRow(row: ProjectActorRowApi): ProjectActor {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    roleDescription: row.role_description,
    createdAt: row.created_at,
  };
}

function toCreateProjectActorApiBody(body: CreateProjectActorRequest) {
  return {
    name: body.name.trim(),
    role_description: body.roleDescription.trim(),
  };
}

function mapCreateProjectActorResponse(
  body: CreateProjectActorApiResponse
): CreateProjectActorResponse {
  return {
    success: body.success,
    message: body.message ?? null,
    data: mapProjectActorRow(body.data),
  };
}

function mapProjectActorsListResponse(
  body: ListProjectActorsApiResponse
): ProjectActorsListResponse {
  return {
    success: body.success,
    message: body.message ?? null,
    data: body.data.map(mapProjectActorRow),
  };
}

/**
 * Wire có thể trả string hoặc string[] — UI canvas dùng một chuỗi (vd. tags/references cách nhau bởi dấu phẩy).
 */
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

function toCreateActorEpicApiBody(body: CreateActorEpicRequest) {
  return {
    title: body.title.trim(),
    description: body.description.trim(),
    priority: body.priority,
    labels: body.labels.map((l) => l.trim()).filter(Boolean),
  };
}

function mapCreateActorEpicResponse(
  body: CreateActorEpicApiResponse
): CreateActorEpicResponse {
  return {
    success: body.success,
    message: body.message ?? null,
    data: mapActorEpicRow(body.data),
  };
}

function mapRequirementModelActor(row: RequirementModelActorApi): RequirementModelActor {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    roleDescription: row.role_description,
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
): ActorAcceptanceCriterion {
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

function mapRequirementModelResponse(
  body: RequirementModelApiResponse
): RequirementModelResponse {
  return {
    success: body.success,
    message: body.message ?? null,
    data: {
      actor: mapRequirementModelActor(body.data.actor),
      epics: body.data.epics.map(mapActorEpicRow),
      features: body.data.features.map(mapActorFeatureRow),
      userStories: body.data.user_stories.map(mapActorUserStoryRow),
    },
  };
}

export const fetchActor = {
  /** GET /api/v1/projects/:project_id/actors */
  list: async (projectId: string): Promise<ProjectActorsListResponse> => {
    const response = await apiService.get<ListProjectActorsApiResponse>(
      `/api/v1/projects/${encodeURIComponent(projectId)}/actors`
    );
    return mapProjectActorsListResponse(response.data);
  },

  /** POST /api/v1/projects/:project_id/actors */
  create: async (
    projectId: string,
    body: CreateProjectActorRequest
  ): Promise<CreateProjectActorResponse> => {
    const response = await apiService.post<CreateProjectActorApiResponse>(
      `/api/v1/projects/${encodeURIComponent(projectId)}/actors`,
      toCreateProjectActorApiBody(body)
    );
    return mapCreateProjectActorResponse(response.data);
  },

  /** PATCH /api/v1/projects/:project_id/actors/:actor_id */
  update: async (
    projectId: string,
    actorId: string,
    body: UpdateProjectActorRequest
  ): Promise<UpdateProjectActorResponse> => {
    const response = await apiService.patch<CreateProjectActorApiResponse>(
      `/api/v1/projects/${encodeURIComponent(projectId)}/actors/${encodeURIComponent(actorId)}`,
      toCreateProjectActorApiBody(body)
    );
    return mapCreateProjectActorResponse(response.data);
  },

  /** DELETE /api/v1/projects/:project_id/actors/:actor_id */
  delete: async (projectId: string, actorId: string): Promise<void> => {
    await apiService.delete<unknown>(
      `/api/v1/projects/${encodeURIComponent(projectId)}/actors/${encodeURIComponent(actorId)}`
    );
  },

  /** GET /api/v1/projects/:project_id/actors/:actor_id/requirement-model */
  getRequirementModel: async (
    projectId: string,
    actorId: string
  ): Promise<RequirementModelResponse> => {
    const response = await apiService.get<RequirementModelApiResponse>(
      `/api/v1/projects/${encodeURIComponent(projectId)}/actors/${encodeURIComponent(actorId)}/requirement-model`
    );
    return mapRequirementModelResponse(response.data);
  },

  /**
   * POST /api/v1/projects/:project_id/actors/:actor_id/epics
   * Sau mutation: invalidate `actorRequirementModelQueryKey` + `actorCanvasLayoutQueryKey`
   * (`invalidateActorWorkspaceQueries` trong `lib/query/invalidateActorWorkspace.ts`).
   */
  createEpic: async (
    projectId: string,
    actorId: string,
    body: CreateActorEpicRequest
  ): Promise<CreateActorEpicResponse> => {
    const response = await apiService.post<CreateActorEpicApiResponse>(
      `/api/v1/projects/${encodeURIComponent(projectId)}/actors/${encodeURIComponent(actorId)}/epics`,
      toCreateActorEpicApiBody(body)
    );
    return mapCreateActorEpicResponse(response.data);
  },

  /** GET /api/v1/projects/:project_id/actors/:actor_id/canvas-layout */
  getCanvasLayout: async (
    projectId: string,
    actorId: string
  ): Promise<GetCanvasLayoutResponse> => {
    const response = await apiService.get<GetCanvasLayoutApiResponse>(
      `/api/v1/projects/${encodeURIComponent(projectId)}/actors/${encodeURIComponent(actorId)}/canvas-layout`
    );
    return mapGetCanvasLayoutResponse(response.data);
  },

  /** PUT /api/v1/projects/:project_id/actors/:actor_id/canvas-layout — 200, không body */
  saveCanvasLayout: async (
    projectId: string,
    actorId: string,
    body: SaveCanvasLayoutRequest
  ): Promise<void> => {
    await apiService.put<void>(
      `/api/v1/projects/${encodeURIComponent(projectId)}/actors/${encodeURIComponent(actorId)}/canvas-layout`,
      toSaveCanvasLayoutApiBody(body)
    );
  },
};
