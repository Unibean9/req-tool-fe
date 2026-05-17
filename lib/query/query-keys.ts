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
