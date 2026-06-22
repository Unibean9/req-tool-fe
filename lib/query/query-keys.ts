/**
 * Central query keys so GET hooks share one cache surface and mutations
 * can invalidate precisely instead of clearing the whole client.
 */
const ORG_ROOT = ["orgs"] as const;

/** Key danh sách / cache dự án theo org — dùng chung GET + invalidate sau POST/PATCH/DELETE. */
export function orgProjectsQueryKey(orgId: string) {
  return [...ORG_ROOT, "projects", orgId] as const;
}

/** Key chi tiết một dự án. */
export function orgProjectQueryKey(orgId: string, projectId: string) {
  return [...ORG_ROOT, "projects", orgId, projectId] as const;
}

const PROJECTS_ROOT = ["projects"] as const;

/** Key danh sách actors theo `project_id` (GET / POST invalidate). */
export function projectActorsQueryKey(projectId: string) {
  return [...PROJECTS_ROOT, "actors", projectId] as const;
}

/**
 * Key danh sách stakeholders theo `project_id`.
 * `actorType`: `undefined` = không gửi query (toàn bộ); `"none"` | `"business_actor"` | `"other_actor"` = filter API `actor_type`.
 */
export function projectStakeholdersQueryKey(
  projectId: string,
  params?: { actorType?: "none" | "business_actor" | "other_actor" }
) {
  return [
    ...PROJECTS_ROOT,
    "stakeholders",
    projectId,
    params?.actorType ?? "all",
  ] as const;
}

/** Key chi tiết một stakeholder. */
export function projectStakeholderQueryKey(
  projectId: string,
  stakeholderId: string
) {
  return [
    ...PROJECTS_ROOT,
    "stakeholders",
    projectId,
    stakeholderId,
  ] as const;
}

/** Key danh sách flows theo `project_id`. */
export function projectFlowsQueryKey(projectId: string) {
  return [...PROJECTS_ROOT, "flows", projectId] as const;
}

/** Key chi tiết một flow (GET đầy đủ + swimlane). */
export function projectFlowQueryKey(projectId: string, flowId: string) {
  return [...PROJECTS_ROOT, "flows", projectId, flowId] as const;
}

/** Key danh sách template theo flow. */
export function projectFlowTemplatesQueryKey(
  projectId: string,
  flowId: string
) {
  return [...PROJECTS_ROOT, "flows", projectId, flowId, "templates"] as const;
}

/** Key danh sách goals theo `project_id`. */
export function projectGoalsQueryKey(projectId: string) {
  return [...PROJECTS_ROOT, "goals", projectId] as const;
}

/** Key danh sách rules theo `project_id`. */
export function projectRulesQueryKey(projectId: string) {
  return [...PROJECTS_ROOT, "rules", projectId] as const;
}

/** Key danh sách NFR theo `project_id` (+ filter `category` / `priority`). */
export function projectNfrsQueryKey(
  projectId: string,
  params?: { category?: string; priority?: string }
) {
  return [
    ...PROJECTS_ROOT,
    "nfrs",
    projectId,
    params?.category ?? "",
    params?.priority ?? "",
  ] as const;
}

/** Key chi tiết một NFR. */
export function projectNfrQueryKey(projectId: string, nfrId: string) {
  return [...PROJECTS_ROOT, "nfrs", projectId, nfrId] as const;
}

/** Key danh sách business requirements theo `project_id`. */
export function projectBRQueryKey(projectId: string) {
  return [...PROJECTS_ROOT, "business-requirements", projectId] as const;
}

/** Key danh sách out-of-scope theo `project_id` (+ filter `category`). */
export function projectOutOfScopeQueryKey(
  projectId: string,
  params?: { category?: string }
) {
  return [
    ...PROJECTS_ROOT,
    "out-of-scope",
    projectId,
    params?.category ?? "",
  ] as const;
}

/** Key danh sách constraints theo `project_id` (+ filter `type` / `severity`). */
export function projectConstraintsQueryKey(
  projectId: string,
  params?: { type?: string; severity?: string }
) {
  return [
    ...PROJECTS_ROOT,
    "constraints",
    projectId,
    params?.type ?? "",
    params?.severity ?? "",
  ] as const;
}

/** Key danh sách features theo `project_id` (+ filter query). */
export function projectFeaturesQueryKey(
  projectId: string,
  params?: {
    epicId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }
) {
  return [
    ...PROJECTS_ROOT,
    "features",
    projectId,
    params?.epicId ?? "",
    params?.status ?? "",
    params?.limit ?? "",
    params?.offset ?? "",
  ] as const;
}

/** Key chi tiết một feature. */
export function projectFeatureQueryKey(projectId: string, featureId: string) {
  return [...PROJECTS_ROOT, "features", projectId, featureId] as const;
}

/** Infinite scroll features — không gắn `offset` vào key. */
export function projectFeaturesInfiniteQueryKey(
  projectId: string,
  params?: { epicId?: string; status?: string; limit?: number }
) {
  return [
    ...PROJECTS_ROOT,
    "features",
    projectId,
    "infinite",
    params?.epicId ?? "",
    params?.status ?? "",
    params?.limit ?? "",
  ] as const;
}

/** Key danh sách user stories theo `project_id` (+ filter query). */
export function projectStoriesQueryKey(
  projectId: string,
  params?: {
    featureId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }
) {
  return [
    ...PROJECTS_ROOT,
    "stories",
    projectId,
    params?.featureId ?? "",
    params?.status ?? "",
    params?.limit ?? "",
    params?.offset ?? "",
  ] as const;
}

/** Key chi tiết một user story (GET .../stories/{id}). */
export function projectStoryQueryKey(projectId: string, userStoryId: string) {
  return [...PROJECTS_ROOT, "stories", projectId, userStoryId] as const;
}

/** Key tiến độ setup workspace dự án. */
export function projectSetupProgressQueryKey(projectId: string) {
  return [...PROJECTS_ROOT, projectId, "setup-progress"] as const;
}

/** Prefix cache của toàn bộ biến thể BRD Markdown export theo `project_id`. */
export function projectBrdExportQueryRoot(projectId: string) {
  return [...PROJECTS_ROOT, projectId, "exports", "brd.md"] as const;
}

/** Key nội dung BRD Markdown export theo `project_id` + `include_wont`. */
export function projectBrdExportQueryKey(
  projectId: string,
  params?: { includeWont?: boolean }
) {
  return [
    ...projectBrdExportQueryRoot(projectId),
    params?.includeWont ?? false,
  ] as const;
}

/** Root cache của toàn bộ artifact list theo `project_id`. */
export function projectArtifactsQueryRoot(projectId: string) {
  return [...PROJECTS_ROOT, "artifacts", projectId] as const;
}

/** Prefix cache của artifact list theo `project_id` + `type`. */
export function projectArtifactsByTypeQueryKey(
  projectId: string,
  type: string
) {
  return [...projectArtifactsQueryRoot(projectId), type] as const;
}

/** Key danh sách artifact theo `project_id` + filter params. */
export function projectArtifactsQueryKey(
  projectId: string,
  params?: {
    type?: string;
    status?: string;
    stepKey?: string;
    phase?: string;
    priority?: string;
    currentVersionStatus?: string;
  }
) {
  return [
    ...projectArtifactsQueryRoot(projectId),
    params?.type ?? "",
    params?.status ?? "",
    params?.stepKey ?? "",
    params?.phase ?? "",
    params?.priority ?? "",
    params?.currentVersionStatus ?? "",
  ] as const;
}

/** Key chi tiết một artifact. */
export function projectArtifactQueryKey(projectId: string, artifactId: string) {
  return [...PROJECTS_ROOT, "artifacts", projectId, artifactId] as const;
}

/** Key danh sách evidence của artifact. */
export function projectArtifactEvidenceQueryKey(
  projectId: string,
  artifactId: string
) {
  return [
    ...PROJECTS_ROOT,
    "artifacts",
    projectId,
    artifactId,
    "evidence",
  ] as const;
}

/** Key artifact graph theo `project_id`. */
export function projectArtifactGraphQueryKey(projectId: string) {
  return [...PROJECTS_ROOT, projectId, "artifact-graph"] as const;
}

/** Key chi tiết một agent session. */
export function projectAgentSessionQueryKey(projectId: string, sessionId: string) {
  return [...PROJECTS_ROOT, projectId, "agent-sessions", sessionId] as const;
}

/** Key lịch sử messages của agent session. */
export function projectAgentSessionMessagesQueryKey(projectId: string, sessionId: string) {
  return [...PROJECTS_ROOT, projectId, "agent-sessions", sessionId, "messages"] as const;
}

/** Key danh sách tool calls cần duyệt của agent session. */
export function projectAgentSessionToolCallsQueryKey(projectId: string, sessionId: string) {
  return [...PROJECTS_ROOT, projectId, "agent-sessions", sessionId, "tool-calls"] as const;
}

/** Key active workflow run theo `project_id`. */
export function projectWorkflowRunCurrentQueryKey(projectId: string) {
  return [...PROJECTS_ROOT, projectId, "workflow-runs", "current"] as const;
}

/** Key danh sách workflow steps của active run. */
export function projectWorkflowStepsQueryKey(projectId: string) {
  return [...PROJECTS_ROOT, projectId, "workflow-steps"] as const;
}

/** Key workflow progress theo `project_id`. */
export function projectWorkflowProgressQueryKey(projectId: string) {
  return [...PROJECTS_ROOT, projectId, "workflow-progress"] as const;
}

/** Key markdown export theo `project_id`, tên file và params. */
export function projectExportQueryKey(
  projectId: string,
  name: string,
  params?: { includeWont?: boolean }
) {
  return [
    ...PROJECTS_ROOT,
    projectId,
    "exports",
    name,
    params?.includeWont ?? false,
  ] as const;
}

/** Key context diagram theo `project_id`. */
export function projectContextDiagramQueryKey(projectId: string) {
  return [...PROJECTS_ROOT, projectId, "context-diagram"] as const;
}

/** Key mô hình yêu cầu (epic / feature / story) theo actor. */
export function actorRequirementModelQueryKey(projectId: string, actorId: string) {
  return [
    ...PROJECTS_ROOT,
    projectId,
    "actors",
    actorId,
    "requirement-model",
  ] as const;
}

/** Key layout canvas React Flow theo actor. */
export function actorCanvasLayoutQueryKey(projectId: string, actorId: string) {
  return [
    ...PROJECTS_ROOT,
    projectId,
    "actors",
    actorId,
    "canvas-layout",
  ] as const;
}

/** Namespace org — `satisfies` buộc đủ key. */
type OrgQueryKeys = {
  readonly all: typeof ORG_ROOT;
  readonly me: () => readonly ["orgs", "me"];
  readonly detail: (orgId: string) => readonly ["orgs", "detail", string];
  readonly members: (orgId: string) => readonly ["orgs", "members", string];
  readonly membersPage: (
    orgId: string,
    q: string,
    role: string,
    limit: number,
    offset: number
  ) => readonly ["orgs", "members", string, "page", string, string, number, number];
  readonly membersInfinite: (
    orgId: string,
    q: string,
    role: string,
    limit: number
  ) => readonly ["orgs", "members", string, "infinite", string, string, number];
  readonly memberSearch: (
    orgId: string,
    q: string
  ) => readonly ["orgs", "members", string, "search", string];
  readonly projects: typeof orgProjectsQueryKey;
  readonly project: typeof orgProjectQueryKey;
};

export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    session: () => [...queryKeys.auth.all, "session"] as const,
  },
  orgs: {
    all: ORG_ROOT,
    me: () => [...ORG_ROOT, "me"] as const,
    detail: (orgId: string) => [...ORG_ROOT, "detail", orgId] as const,
    members: (orgId: string) => [...ORG_ROOT, "members", orgId] as const,
    membersPage: (orgId: string, q: string, role: string, limit: number, offset: number) =>
      [...ORG_ROOT, "members", orgId, "page", q, role, limit, offset] as const,
    membersInfinite: (orgId: string, q: string, role: string, limit: number) =>
      [...ORG_ROOT, "members", orgId, "infinite", q, role, limit] as const,
    memberSearch: (orgId: string, q: string) =>
      [...ORG_ROOT, "members", orgId, "search", q] as const,
    projects: orgProjectsQueryKey,
    project: orgProjectQueryKey,
  } satisfies OrgQueryKeys,
  projects: {
    all: PROJECTS_ROOT,
    actors: projectActorsQueryKey,
    stakeholders: projectStakeholdersQueryKey,
    stakeholder: projectStakeholderQueryKey,
    flows: projectFlowsQueryKey,
    flow: projectFlowQueryKey,
    flowTemplates: projectFlowTemplatesQueryKey,
    goals: projectGoalsQueryKey,
    rules: projectRulesQueryKey,
    nfrs: projectNfrsQueryKey,
    nfr: projectNfrQueryKey,
    br: projectBRQueryKey,
    outOfScope: projectOutOfScopeQueryKey,
    constraints: projectConstraintsQueryKey,
    features: projectFeaturesQueryKey,
    featuresInfinite: projectFeaturesInfiniteQueryKey,
    feature: projectFeatureQueryKey,
    stories: projectStoriesQueryKey,
    story: projectStoryQueryKey,
    setupProgress: projectSetupProgressQueryKey,
    brdExport: projectBrdExportQueryKey,
    contextDiagram: projectContextDiagramQueryKey,
    artifacts: projectArtifactsQueryKey,
    artifact: projectArtifactQueryKey,
    artifactEvidence: projectArtifactEvidenceQueryKey,
    artifactGraph: projectArtifactGraphQueryKey,
    workflowRunCurrent: projectWorkflowRunCurrentQueryKey,
    workflowSteps: projectWorkflowStepsQueryKey,
    workflowProgress: projectWorkflowProgressQueryKey,
    export: projectExportQueryKey,
  },
  users: {
    all: ["users"] as const,
    me: () => [...queryKeys.users.all, "me"] as const,
    search: (q: string, limit: number, offset: number) =>
      [...queryKeys.users.all, "search", q, limit, offset] as const,
    /** Infinite scroll — cùng `q` + `limit`, không gắn offset vào key. */
    searchInfinite: (q: string, limit: number) =>
      [...queryKeys.users.all, "searchInfinite", q, limit] as const,
  },
  llmProviderConfigs: {
    all: ["llm-provider-configs"] as const,
    list: () => ["llm-provider-configs", "list"] as const,
    detail: (configId: string) => ["llm-provider-configs", "detail", configId] as const,
  },
} as const;
