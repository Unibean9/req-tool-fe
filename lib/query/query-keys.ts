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
 * `isBusinessActor`: `undefined` = không gửi query (toàn bộ); `true` / `false` = filter API `is_business_actor`.
 */
export function projectStakeholdersQueryKey(
  projectId: string,
  params?: { isBusinessActor?: boolean }
) {
  const filterKey =
    params?.isBusinessActor === undefined
      ? "all"
      : params.isBusinessActor
        ? "business_actor"
        : "not_business_actor";
  return [...PROJECTS_ROOT, "stakeholders", projectId, filterKey] as const;
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

/** Key nội dung BRD export theo `project_id`. */
export function projectBrdExportQueryKey(projectId: string) {
  return [...PROJECTS_ROOT, projectId, "brd", "export"] as const;
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
    constraints: projectConstraintsQueryKey,
    features: projectFeaturesQueryKey,
    featuresInfinite: projectFeaturesInfiniteQueryKey,
    feature: projectFeatureQueryKey,
    stories: projectStoriesQueryKey,
    story: projectStoryQueryKey,
    setupProgress: projectSetupProgressQueryKey,
    brdExport: projectBrdExportQueryKey,
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
} as const;
