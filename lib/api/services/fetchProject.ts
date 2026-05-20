import apiService from "../core";

/** POST /api/v1/orgs/{org_id}/projects */
export interface CreateOrgProjectRequest {
  name: string;
  description: string;
  context: string;
  problems: string[];
  proposedSolutions: string[];
  /** ISO date `YYYY-MM-DD`. */
  startDate?: string;
  endDate?: string;
  budget?: number;
  executiveSummary?: string;
  roiNotes?: string;
}

/** PATCH /api/v1/orgs/{org_id}/projects/{project_id} */
export interface UpdateOrgProjectRequest {
  name?: string;
  description?: string;
  context?: string;
  problems?: string[];
  proposedSolutions?: string[];
  startDate?: string;
  endDate?: string;
  budget?: number;
  executiveSummary?: string;
  roiNotes?: string;
}

/** Một dự án trên wire (GET list/detail/create/patch). */
export interface OrgProjectApiRow {
  id: string;
  org_id: string;
  name: string;
  slug: string;
  description: string;
  context: string;
  problems: string[];
  proposed_solutions: string[];
  start_date: string;
  end_date: string;
  /** BE trả decimal dạng string (precision lớn). */
  budget: string | number;
  executive_summary: string;
  roi_notes: string;
  created_at: string;
}

/** GET /api/v1/orgs/{org_id}/projects — path param `org_id`. */
export interface ListOrgProjectsParams {
  orgId: string;
}

/** GET /api/v1/orgs/{org_id}/projects/{project_id} — path `org_id`, `project_id`. */
export interface GetOrgProjectParams {
  orgId: string;
  projectId: string;
}

interface OrgProjectMutationApiBody {
  name?: string;
  description?: string;
  context?: string;
  problems?: string[];
  proposed_solutions?: string[];
  start_date?: string;
  end_date?: string;
  budget?: number;
  executive_summary?: string;
  roi_notes?: string;
}

interface DeleteOrgProjectApiResponse {
  success: boolean;
  message?: string | null;
  data?: unknown;
}

interface CreateOrgProjectApiResponse {
  success: boolean;
  data: OrgProjectApiRow;
  message: string | null;
}

interface OrgProjectsListApiResponse {
  success: boolean;
  data: OrgProjectApiRow[];
  message: string | null;
}

interface OrgProjectDetailApiResponse {
  success: boolean;
  data: OrgProjectApiRow;
  message: string | null;
}

interface UpdateOrgProjectApiResponse {
  success: boolean;
  data: OrgProjectApiRow;
  message: string | null;
}

/** Dự án org (camelCase). */
export interface OrgProject {
  id: string;
  orgId: string;
  name: string;
  slug: string;
  description: string;
  context: string;
  problems: string[];
  proposedSolutions: string[];
  startDate: string;
  endDate: string;
  /** Giá trị budget từ BE (decimal string). */
  budget: string | null;
  executiveSummary: string;
  roiNotes: string;
  createdAt: string;
}

export interface CreateOrgProjectResponse {
  success: boolean;
  data: OrgProject;
  message: string | null;
}

export interface OrgProjectsListResponse {
  success: boolean;
  data: OrgProject[];
  message: string | null;
}

export interface OrgProjectDetailResponse {
  success: boolean;
  data: OrgProject;
  message: string | null;
}

export interface UpdateOrgProjectResponse {
  success: boolean;
  data: OrgProject;
  message: string | null;
}

/** GET /api/v1/projects/{project_id}/setup-progress — flags theo từng bước workspace. */
export interface ProjectSetupProgress {
  core: boolean;
  stakeholders: boolean;
  goals: boolean;
  flows: boolean;
  rules: boolean;
  nfrs: boolean;
  requirements: boolean;
}

export interface ProjectSetupProgressBusinessRequirements {
  stakeholders: boolean;
  goals: boolean;
  flows: boolean;
  rules: boolean;
}

export interface ProjectSetupProgressUserRequirements {
  nfrs: boolean;
}

export interface ProjectSetupProgressFunctionalRequirements {
  actors: boolean;
}

export interface ProjectSetupProgressResponse {
  success: boolean;
  data: ProjectSetupProgress;
  message: string | null;
}

/** GET /api/v1/projects/{project_id}/brd/export — plain text BRD export. */
export type ProjectBrdExportResponse = string;

interface ProjectSetupProgressApiRow {
  core: boolean;
  business_requirements?: Partial<ProjectSetupProgressBusinessRequirements>;
  user_requirements?: Partial<ProjectSetupProgressUserRequirements>;
  functional_requirements?: Partial<ProjectSetupProgressFunctionalRequirements>;
  /** Backward compatibility với response phẳng cũ trong local/dev. */
  stakeholders?: boolean;
  goals?: boolean;
  flows?: boolean;
  rules?: boolean;
  nfrs?: boolean;
  requirements?: boolean;
}

interface ProjectSetupProgressApiResponse {
  success: boolean;
  data: ProjectSetupProgressApiRow;
  message: string | null;
}

function trimField(s: string): string {
  return s.trim();
}

function normalizeStringList(items: string[]): string[] {
  return items.map((s) => s.trim()).filter(Boolean);
}

function mapStringListFromApi(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((s) => String(s).trim()).filter(Boolean);
}

function parseIsoDateField(value: unknown): string {
  if (value == null) return "";
  const t = String(value).trim();
  if (!t) return "";
  return t.length >= 10 ? t.slice(0, 10) : t;
}

function parseBudgetFromApi(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "string") {
    const t = value.trim();
    return t.length > 0 ? t : null;
  }
  return null;
}

function parseBudgetForApiBody(value: number | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return 0;
}

/** Hiển thị mảng dự án trong textarea (mỗi dòng một mục). */
export function orgProjectListToLines(
  items: string[] | null | undefined
): string {
  return (items ?? []).join("\n");
}

/** Parse textarea thành mảng gửi API (mỗi dòng không rỗng = một mục). */
export function linesToOrgProjectList(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function toCreateOrgProjectApiBody(
  body: CreateOrgProjectRequest
): OrgProjectMutationApiBody {
  return {
    name: trimField(body.name),
    description: trimField(body.description),
    context: trimField(body.context),
    problems: normalizeStringList(body.problems),
    proposed_solutions: normalizeStringList(body.proposedSolutions),
    start_date: parseIsoDateField(body.startDate),
    end_date: parseIsoDateField(body.endDate),
    budget: parseBudgetForApiBody(body.budget),
    executive_summary: trimField(body.executiveSummary ?? ""),
    roi_notes: trimField(body.roiNotes ?? ""),
  };
}

function toUpdateOrgProjectApiBody(
  body: UpdateOrgProjectRequest
): OrgProjectMutationApiBody {
  return {
    ...(body.name !== undefined ? { name: trimField(body.name) } : {}),
    ...(body.description !== undefined
      ? { description: trimField(body.description) }
      : {}),
    ...(body.context !== undefined ? { context: trimField(body.context) } : {}),
    ...(body.problems !== undefined
      ? { problems: normalizeStringList(body.problems) }
      : {}),
    ...(body.proposedSolutions !== undefined
      ? {
          proposed_solutions: normalizeStringList(body.proposedSolutions),
        }
      : {}),
    ...(body.startDate !== undefined
      ? { start_date: parseIsoDateField(body.startDate) }
      : {}),
    ...(body.endDate !== undefined
      ? { end_date: parseIsoDateField(body.endDate) }
      : {}),
    ...(body.budget !== undefined
      ? { budget: parseBudgetForApiBody(body.budget) }
      : {}),
    ...(body.executiveSummary !== undefined
      ? { executive_summary: trimField(body.executiveSummary) }
      : {}),
    ...(body.roiNotes !== undefined
      ? { roi_notes: trimField(body.roiNotes) }
      : {}),
  };
}

function resolveOrgId(orgIdOrParams: string | ListOrgProjectsParams): string {
  const id =
    typeof orgIdOrParams === "string" ? orgIdOrParams : orgIdOrParams.orgId;
  const trimmed = id.trim();
  if (!trimmed) {
    throw new Error("org_id là bắt buộc");
  }
  return trimmed;
}

function resolveGetOrgProjectParams(
  orgIdOrParams: string | GetOrgProjectParams,
  projectIdArg?: string
): GetOrgProjectParams {
  if (typeof orgIdOrParams === "object") {
    const orgId = orgIdOrParams.orgId.trim();
    const projectId = orgIdOrParams.projectId.trim();
    if (!orgId) throw new Error("org_id là bắt buộc");
    if (!projectId) throw new Error("project_id là bắt buộc");
    return { orgId, projectId };
  }
  const orgId = orgIdOrParams.trim();
  const projectId = (projectIdArg ?? "").trim();
  if (!orgId) throw new Error("org_id là bắt buộc");
  if (!projectId) throw new Error("project_id là bắt buộc");
  return { orgId, projectId };
}

function mapOrgProjectRow(row: OrgProjectApiRow): OrgProject {
  return {
    id: row.id,
    orgId: row.org_id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    context: row.context ?? "",
    problems: mapStringListFromApi(row.problems),
    proposedSolutions: mapStringListFromApi(row.proposed_solutions),
    startDate: parseIsoDateField(row.start_date),
    endDate: parseIsoDateField(row.end_date),
    budget: parseBudgetFromApi(row.budget),
    executiveSummary: String(row.executive_summary ?? "").trim(),
    roiNotes: String(row.roi_notes ?? "").trim(),
    createdAt: row.created_at,
  };
}

function mapCreateOrgProjectResponse(
  body: CreateOrgProjectApiResponse
): CreateOrgProjectResponse {
  return {
    success: body.success,
    message: body.message ?? null,
    data: mapOrgProjectRow(body.data),
  };
}

function mapOrgProjectsListResponse(
  body: OrgProjectsListApiResponse
): OrgProjectsListResponse {
  return {
    success: body.success,
    message: body.message ?? null,
    data: (body.data ?? []).map(mapOrgProjectRow),
  };
}

function assertOrgProjectsListSuccess(
  body: OrgProjectsListApiResponse
): OrgProjectsListApiResponse {
  if (!body.success) {
    throw new Error(body.message ?? "Không tải được danh sách dự án");
  }
  return body;
}

function assertOrgProjectDetailSuccess(
  body: OrgProjectDetailApiResponse
): OrgProjectDetailApiResponse {
  if (!body.success) {
    throw new Error(body.message ?? "Không tải được dự án");
  }
  if (!body.data?.id) {
    throw new Error("Dữ liệu dự án không hợp lệ");
  }
  return body;
}

function assertOrgProjectMutationSuccess<T extends { success: boolean; message?: string | null }>(
  body: T,
  fallbackMessage: string
): T {
  if (!body.success) {
    throw new Error(body.message ?? fallbackMessage);
  }
  if (!("data" in body) || !(body as { data?: { id?: string } }).data?.id) {
    throw new Error("Dữ liệu dự án không hợp lệ");
  }
  return body;
}

function assertDeleteOrgProjectSuccess(body: DeleteOrgProjectApiResponse): void {
  if (body && typeof body === "object" && "success" in body && body.success === false) {
    throw new Error(body.message ?? "Xóa dự án thất bại");
  }
}

function mapOrgProjectDetailResponse(
  body: OrgProjectDetailApiResponse
): OrgProjectDetailResponse {
  return {
    success: body.success,
    message: body.message ?? null,
    data: mapOrgProjectRow(body.data),
  };
}

function mapUpdateOrgProjectResponse(
  body: UpdateOrgProjectApiResponse
): UpdateOrgProjectResponse {
  return {
    success: body.success,
    message: body.message ?? null,
    data: mapOrgProjectRow(body.data),
  };
}

function resolveProjectId(projectId: string): string {
  const id = projectId.trim();
  if (!id) throw new Error("project_id là bắt buộc");
  return id;
}

function mapProjectSetupProgressRow(
  row: ProjectSetupProgressApiRow
): ProjectSetupProgress {
  const business = row.business_requirements ?? {};
  const user = row.user_requirements ?? {};
  const functional = row.functional_requirements ?? {};

  return {
    core: Boolean(row.core),
    stakeholders: Boolean(business.stakeholders ?? row.stakeholders),
    goals: Boolean(business.goals ?? row.goals),
    flows: Boolean(business.flows ?? row.flows),
    rules: Boolean(business.rules ?? row.rules),
    nfrs: Boolean(user.nfrs ?? row.nfrs),
    requirements: Boolean(functional.actors ?? row.requirements),
  };
}

function mapProjectSetupProgressResponse(
  body: ProjectSetupProgressApiResponse
): ProjectSetupProgressResponse {
  return {
    success: body.success,
    message: body.message ?? null,
    data: mapProjectSetupProgressRow(body.data),
  };
}

function assertProjectSetupProgressSuccess(
  body: ProjectSetupProgressApiResponse
): ProjectSetupProgressApiResponse {
  if (!body.success) {
    throw new Error(body.message ?? "Không tải được tiến độ setup dự án");
  }
  return body;
}

export const fetchProject = {
  /**
   * GET /api/v1/orgs/{org_id}/projects
   * @param orgIdOrParams — `org_id` trên path (string hoặc `{ orgId }`)
   */
  listOrgProjects: async (
    orgIdOrParams: string | ListOrgProjectsParams
  ): Promise<OrgProjectsListResponse> => {
    const orgId = resolveOrgId(orgIdOrParams);
    const response = await apiService.get<OrgProjectsListApiResponse>(
      `/api/v1/orgs/${encodeURIComponent(orgId)}/projects`
    );
    return mapOrgProjectsListResponse(
      assertOrgProjectsListSuccess(response.data)
    );
  },

  /**
   * GET /api/v1/orgs/{org_id}/projects/{project_id}
   * @param orgIdOrParams — `org_id` + `project_id` (object hoặc hai string)
   */
  getOrgProject: async (
    orgIdOrParams: string | GetOrgProjectParams,
    projectId?: string
  ): Promise<OrgProjectDetailResponse> => {
    const { orgId, projectId: pid } = resolveGetOrgProjectParams(
      orgIdOrParams,
      projectId
    );
    const response = await apiService.get<OrgProjectDetailApiResponse>(
      `/api/v1/orgs/${encodeURIComponent(orgId)}/projects/${encodeURIComponent(pid)}`
    );
    return mapOrgProjectDetailResponse(
      assertOrgProjectDetailSuccess(response.data)
    );
  },

  /**
   * POST /api/v1/orgs/{org_id}/projects
   * Body: name, description, context, problems, proposed_solutions, start_date, end_date,
   * budget, executive_summary, roi_notes.
   */
  createProject: async (
    orgId: string,
    body: CreateOrgProjectRequest
  ): Promise<CreateOrgProjectResponse> => {
    const oid = resolveOrgId(orgId);
    const response = await apiService.post<CreateOrgProjectApiResponse>(
      `/api/v1/orgs/${encodeURIComponent(oid)}/projects`,
      toCreateOrgProjectApiBody(body)
    );
    return mapCreateOrgProjectResponse(
      assertOrgProjectMutationSuccess(response.data, "Tạo dự án thất bại")
    );
  },

  /**
   * PATCH /api/v1/orgs/{org_id}/projects/{project_id}
   * Body: name, description, context, problems, proposed_solutions, start_date, end_date,
   * budget, executive_summary, roi_notes.
   */
  updateOrgProject: async (
    orgId: string,
    projectId: string,
    body: UpdateOrgProjectRequest
  ): Promise<UpdateOrgProjectResponse> => {
    const { orgId: oid, projectId: pid } = resolveGetOrgProjectParams(
      orgId,
      projectId
    );
    const response = await apiService.patch<UpdateOrgProjectApiResponse>(
      `/api/v1/orgs/${encodeURIComponent(oid)}/projects/${encodeURIComponent(pid)}`,
      toUpdateOrgProjectApiBody(body)
    );
    return mapUpdateOrgProjectResponse(
      assertOrgProjectMutationSuccess(response.data, "Cập nhật dự án thất bại")
    );
  },

  /** DELETE /api/v1/orgs/{org_id}/projects/{project_id} — `{ success, message }`. */
  deleteOrgProject: async (orgId: string, projectId: string): Promise<void> => {
    const { orgId: oid, projectId: pid } = resolveGetOrgProjectParams(
      orgId,
      projectId
    );
    const response = await apiService.delete<DeleteOrgProjectApiResponse>(
      `/api/v1/orgs/${encodeURIComponent(oid)}/projects/${encodeURIComponent(pid)}`
    );
    if (response.data && typeof response.data === "object") {
      assertDeleteOrgProjectSuccess(response.data);
    }
  },

  /** GET /api/v1/projects/{project_id}/setup-progress */
  getSetupProgress: async (
    projectId: string
  ): Promise<ProjectSetupProgressResponse> => {
    const pid = resolveProjectId(projectId);
    const response = await apiService.get<ProjectSetupProgressApiResponse>(
      `/api/v1/projects/${encodeURIComponent(pid)}/setup-progress`
    );
    return mapProjectSetupProgressResponse(
      assertProjectSetupProgressSuccess(response.data)
    );
  },

  /** GET /api/v1/projects/{project_id}/brd/export */
  getBrdExport: async (
    projectId: string
  ): Promise<ProjectBrdExportResponse> => {
    const pid = resolveProjectId(projectId);
    const response = await apiService.get<ProjectBrdExportResponse>(
      `/api/v1/projects/${encodeURIComponent(pid)}/brd/export`
    );
    return response.data;
  },
};
