import apiService from "../core";

// ─── Artifact type enum ───────────────────────────────────────────────────────

export const ARTIFACT_TYPES = [
  "research_output",
  "intent",
  "problem",
  "goal",
  "stakeholder",
  "capability",
  "domain_entity",
  "business_rule",
  "constraint",
  "assumption",
  "risk",
  "open_question",
  "functional_requirement",
  "non_functional_requirement",
  "use_case",
  "epic",
  "story",
  "acceptance_criteria",
] as const;
export type ArtifactType = (typeof ARTIFACT_TYPES)[number];

// ─── Supporting enums ─────────────────────────────────────────────────────────

export const ARTIFACT_STATUSES = [
  "draft",
  "needs_clarification",
  "accepted",
  "rejected",
  "archived",
] as const;
export type ArtifactStatus = (typeof ARTIFACT_STATUSES)[number];

export const ARTIFACT_CURRENT_VERSION_STATUSES = [
  "draft",
  "proposed",
  "accepted",
  "rejected",
  "archived",
] as const;
export type ArtifactCurrentVersionStatus =
  (typeof ARTIFACT_CURRENT_VERSION_STATUSES)[number];

export const ARTIFACT_PRIORITIES = ["must", "should", "could", "wont"] as const;
export type ArtifactPriority = (typeof ARTIFACT_PRIORITIES)[number];

export const ARTIFACT_CHANGE_SOURCES = [
  "manual",
  "ai_output",
  "ai_generation",
  "import",
] as const;
export type ArtifactChangeSource = (typeof ARTIFACT_CHANGE_SOURCES)[number];

export const ARTIFACT_VERSION_REVIEW_STATUSES = [
  "approved",
  "rejected",
  "changes_requested",
] as const;
export type ArtifactVersionReviewStatus =
  (typeof ARTIFACT_VERSION_REVIEW_STATUSES)[number];

export const EVIDENCE_SOURCE_TYPES = [
  "chat",
  "repo_file",
  "document",
  "url",
  "user_input",
  "ai_output",
] as const;
export type EvidenceSourceType = (typeof EVIDENCE_SOURCE_TYPES)[number];

export const ARTIFACT_PHASES = ["brd", "srs", "delivery"] as const;
export type ArtifactPhase = (typeof ARTIFACT_PHASES)[number];

export const WORKFLOW_STEP_KEYS = [
  "intent_vision",
  "capability_map",
  "domain_model",
  "requirements_spec",
  "realization_backlog",
] as const;
export type WorkflowStepKey = (typeof WORKFLOW_STEP_KEYS)[number];

export const ARTIFACT_LIFECYCLE_STATES = [
  "missing",
  "blocked",
  "in_progress",
  "current",
  "stale",
  "orphan",
] as const;
export type ArtifactLifecycleState =
  (typeof ARTIFACT_LIFECYCLE_STATES)[number];

// ─── Wire types (snake_case) ──────────────────────────────────────────────────

interface ArtifactVersionApiRow {
  id: string;
  artifact_id: string;
  version_number?: number;
  title?: string;
  body: string;
  status?: string;
  parent_version_id?: string | null;
  change_source: string;
  change_summary: string | null;
  review_status?: string | null;
  source_document_id?: string | null;
  created_by_id: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

interface ArtifactApiRow {
  id: string;
  project_id: string;
  current_version_id: string | null;
  type: string;
  status: string;
  priority: string | null;
  code: string | null;
  title: string;
  confidence: number | null;
  nfr_category: string | null;
  stakeholder_role: string | null;
  created_by_id: string;
  created_at: string;
  metadata: Record<string, unknown>;
  current_version: ArtifactVersionApiRow | null;
  lifecycle_state?: string | null;
  lifecycle_reason?: string | null;
}

interface ArtifactVersionReviewApiRow {
  id: string;
  artifact_id: string;
  artifact_version_id: string;
  reviewed_by_id: string;
  review_status: string;
  comment: string | null;
  created_at: string;
}

interface ArtifactEvidenceApiRow {
  id: string;
  artifact_id: string;
  artifact_version_id: string | null;
  source_document_id: string | null;
  source_type: string;
  locator: string;
  excerpt: string | null;
  confidence: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface ArtifactGraphNodeApiRow {
  id: string;
  artifact_id?: string | null;
  type?: string | null;
  artifact_type?: string | null;
  status?: string | null;
  title?: string | null;
  label?: string | null;
  code?: string | null;
  lifecycle_state?: string | null;
  lifecycle_reason?: string | null;
  [key: string]: unknown;
}

interface ArtifactGraphEdgeApiRow {
  id?: string | null;
  source?: string | null;
  target?: string | null;
  source_artifact_id?: string | null;
  target_artifact_id?: string | null;
  relation_type?: string | null;
  type?: string | null;
  [key: string]: unknown;
}

// ─── API response wrappers ────────────────────────────────────────────────────

interface ArtifactApiResponse {
  success: boolean;
  data: ArtifactApiRow;
  message: string | null;
}

interface ArtifactListApiResponse {
  success: boolean;
  data: ArtifactApiRow[];
  message: string | null;
}

interface ArtifactVersionReviewApiResponse {
  success: boolean;
  data: ArtifactVersionReviewApiRow;
  message: string | null;
}

interface ArtifactEvidenceListApiResponse {
  success: boolean;
  data: ArtifactEvidenceApiRow[];
  message: string | null;
}

interface ArtifactEvidenceApiResponse {
  success: boolean;
  data: ArtifactEvidenceApiRow;
  message: string | null;
}

interface ArtifactGraphApiResponse {
  success: boolean;
  data: {
    nodes?: ArtifactGraphNodeApiRow[];
    edges?: ArtifactGraphEdgeApiRow[];
    links?: ArtifactGraphEdgeApiRow[];
    warnings?: unknown[];
    [key: string]: unknown;
  };
  message: string | null;
}

// ─── FE types (camelCase) ─────────────────────────────────────────────────────

export interface ArtifactVersion {
  id: string;
  artifactId: string;
  versionNumber: number | null;
  title: string | null;
  body: string;
  status: ArtifactCurrentVersionStatus | null;
  parentVersionId: string | null;
  changeSource: ArtifactChangeSource;
  changeSummary: string | null;
  reviewStatus: ArtifactVersionReviewStatus | null;
  sourceDocumentId: string | null;
  createdById: string;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface Artifact {
  id: string;
  projectId: string;
  currentVersionId: string | null;
  type: ArtifactType;
  status: ArtifactStatus;
  priority: ArtifactPriority | null;
  code: string | null;
  title: string;
  confidence: number | null;
  nfrCategory: string | null;
  stakeholderRole: string | null;
  createdById: string;
  createdAt: string;
  metadata: Record<string, unknown>;
  currentVersion: ArtifactVersion | null;
  lifecycleState: ArtifactLifecycleState | null;
  lifecycleReason: string | null;
}

export interface ArtifactVersionReview {
  id: string;
  artifactId: string;
  artifactVersionId: string;
  reviewedById: string;
  reviewStatus: ArtifactVersionReviewStatus;
  comment: string | null;
  createdAt: string;
}

export interface ArtifactEvidence {
  id: string;
  artifactId: string;
  artifactVersionId: string | null;
  sourceDocumentId: string | null;
  sourceType: EvidenceSourceType;
  locator: string;
  excerpt: string | null;
  confidence: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ArtifactGraphNode {
  id: string;
  artifactId: string;
  type: ArtifactType | null;
  status: ArtifactStatus | null;
  title: string;
  label: string | null;
  code: string | null;
  lifecycleState: ArtifactLifecycleState | null;
  lifecycleReason: string | null;
  raw: Record<string, unknown>;
}

export interface ArtifactGraphEdge {
  id: string;
  source: string;
  target: string;
  relationType: string | null;
  raw: Record<string, unknown>;
}

// ─── Request types ────────────────────────────────────────────────────────────

export interface CreateArtifactRequest {
  type: ArtifactType;
  title: string;
  body: string;
  status?: ArtifactStatus;
  priority?: ArtifactPriority | null;
  code?: string | null;
  confidence?: number | null;
  nfrCategory?: string | null;
  stakeholderRole?: string | null;
  metadata?: Record<string, unknown>;
  changeSource?: ArtifactChangeSource;
  changeSummary?: string | null;
  sourceDocumentId?: string | null;
}

export interface UpdateArtifactRequest {
  title?: string;
  body?: string;
  status?: ArtifactStatus;
  priority?: ArtifactPriority | null;
  code?: string | null;
  confidence?: number | null;
  nfrCategory?: string | null;
  stakeholderRole?: string | null;
  metadata?: Record<string, unknown>;
  changeSource?: ArtifactChangeSource;
  changeSummary?: string | null;
  sourceDocumentId?: string | null;
}

export interface ListArtifactsParams {
  type?: ArtifactType;
  status?: ArtifactStatus;
  stepKey?: WorkflowStepKey;
  phase?: ArtifactPhase;
  priority?: ArtifactPriority;
  currentVersionStatus?: ArtifactCurrentVersionStatus;
}

export interface ReviewArtifactVersionRequest {
  reviewStatus: ArtifactVersionReviewStatus;
  comment?: string | null;
}

export interface CreateArtifactEvidenceRequest {
  artifactVersionId?: string | null;
  sourceDocumentId?: string | null;
  sourceType: EvidenceSourceType;
  locator: string;
  excerpt?: string | null;
  confidence?: number | null;
  metadata?: Record<string, unknown>;
}

// ─── Response types ───────────────────────────────────────────────────────────

export interface ArtifactResponse {
  success: boolean;
  data: Artifact;
  message: string | null;
}

export interface ArtifactListResponse {
  success: boolean;
  data: Artifact[];
  message: string | null;
}

export interface ArtifactVersionReviewResponse {
  success: boolean;
  data: ArtifactVersionReview;
  message: string | null;
}

export interface ArtifactEvidenceListResponse {
  success: boolean;
  data: ArtifactEvidence[];
  message: string | null;
}

export interface ArtifactEvidenceResponse {
  success: boolean;
  data: ArtifactEvidence;
  message: string | null;
}

export interface ArtifactGraphResponse {
  success: boolean;
  data: {
    nodes: ArtifactGraphNode[];
    edges: ArtifactGraphEdge[];
    warnings: unknown[];
  };
  message: string | null;
}

// ─── Path helpers ─────────────────────────────────────────────────────────────

function artifactsBasePath(projectId: string) {
  return `/api/v1/projects/${encodeURIComponent(projectId)}/artifacts`;
}

function artifactPath(projectId: string, artifactId: string) {
  return `${artifactsBasePath(projectId)}/${encodeURIComponent(artifactId)}`;
}

function artifactVersionPath(
  projectId: string,
  artifactId: string,
  versionId: string
) {
  return `${artifactPath(projectId, artifactId)}/versions/${encodeURIComponent(versionId)}`;
}

function artifactEvidenceBasePath(projectId: string, artifactId: string) {
  return `${artifactPath(projectId, artifactId)}/evidence`;
}

function artifactGraphPath(projectId: string) {
  return `/api/v1/projects/${encodeURIComponent(projectId)}/artifact-graph`;
}

// ─── Resolver helpers ─────────────────────────────────────────────────────────

function resolveProjectId(projectId: string): string {
  const id = projectId.trim();
  if (!id) throw new Error("project_id là bắt buộc");
  return id;
}

function resolveArtifactId(artifactId: string): string {
  const id = artifactId.trim();
  if (!id) throw new Error("artifact_id là bắt buộc");
  return id;
}

function resolveVersionId(versionId: string): string {
  const id = versionId.trim();
  if (!id) throw new Error("version_id là bắt buộc");
  return id;
}

// ─── Mapping helpers ──────────────────────────────────────────────────────────

function parseArtifactType(value: string): ArtifactType {
  return (ARTIFACT_TYPES as readonly string[]).includes(value)
    ? (value as ArtifactType)
    : "functional_requirement";
}

function parseArtifactStatus(value: string): ArtifactStatus {
  if ((ARTIFACT_STATUSES as readonly string[]).includes(value))
    return value as ArtifactStatus;
  // Legacy mapping
  if (value === "in_review" || value === "needs_clarification") return "needs_clarification";
  if (value === "changes_requested") return "needs_clarification";
  return "draft";
}

function parseArtifactPriority(
  value: string | null | undefined
): ArtifactPriority | null {
  if (!value) return null;
  return (ARTIFACT_PRIORITIES as readonly string[]).includes(value)
    ? (value as ArtifactPriority)
    : null;
}

function parseArtifactChangeSource(value: string): ArtifactChangeSource {
  return (ARTIFACT_CHANGE_SOURCES as readonly string[]).includes(value)
    ? (value as ArtifactChangeSource)
    : "manual";
}

function parseArtifactCurrentVersionStatus(
  value: string | null | undefined
): ArtifactCurrentVersionStatus | null {
  if (!value) return null;
  return (ARTIFACT_CURRENT_VERSION_STATUSES as readonly string[]).includes(value)
    ? (value as ArtifactCurrentVersionStatus)
    : null;
}

function parseArtifactLifecycleState(
  value: string | null | undefined
): ArtifactLifecycleState | null {
  if (!value) return null;
  return (ARTIFACT_LIFECYCLE_STATES as readonly string[]).includes(value)
    ? (value as ArtifactLifecycleState)
    : null;
}

function parseArtifactVersionReviewStatus(
  value: string
): ArtifactVersionReviewStatus {
  return (ARTIFACT_VERSION_REVIEW_STATUSES as readonly string[]).includes(value)
    ? (value as ArtifactVersionReviewStatus)
    : "changes_requested";
}

function parseNullableArtifactVersionReviewStatus(
  value: string | null | undefined
): ArtifactVersionReviewStatus | null {
  if (!value) return null;
  return (ARTIFACT_VERSION_REVIEW_STATUSES as readonly string[]).includes(value)
    ? (value as ArtifactVersionReviewStatus)
    : null;
}

function parseEvidenceSourceType(value: string): EvidenceSourceType {
  return (EVIDENCE_SOURCE_TYPES as readonly string[]).includes(value)
    ? (value as EvidenceSourceType)
    : "document";
}

function mapArtifactVersionRow(
  row: ArtifactVersionApiRow | null | undefined
): ArtifactVersion | null {
  if (!row) return null;
  return {
    id: row.id,
    artifactId: row.artifact_id,
    versionNumber:
      typeof row.version_number === "number" ? row.version_number : null,
    title:
      typeof row.title === "string" && row.title.trim()
        ? row.title.trim()
        : null,
    body: row.body ?? "",
    status: parseArtifactCurrentVersionStatus(row.status),
    parentVersionId: row.parent_version_id ?? null,
    changeSource: parseArtifactChangeSource(row.change_source),
    changeSummary: row.change_summary ?? null,
    reviewStatus: parseNullableArtifactVersionReviewStatus(row.review_status),
    sourceDocumentId: row.source_document_id ?? null,
    createdById: row.created_by_id,
    createdAt: row.created_at,
    metadata: row.metadata ?? {},
  };
}

function mapArtifactRow(row: ArtifactApiRow): Artifact {
  return {
    id: row.id,
    projectId: row.project_id,
    currentVersionId: row.current_version_id ?? null,
    type: parseArtifactType(row.type),
    status: parseArtifactStatus(row.status),
    priority: parseArtifactPriority(row.priority),
    code: row.code ?? null,
    title: row.title ?? "",
    confidence: row.confidence ?? null,
    nfrCategory: row.nfr_category ?? null,
    stakeholderRole: row.stakeholder_role ?? null,
    createdById: row.created_by_id,
    createdAt: row.created_at,
    metadata: row.metadata ?? {},
    currentVersion: mapArtifactVersionRow(row.current_version),
    lifecycleState: parseArtifactLifecycleState(row.lifecycle_state),
    lifecycleReason: row.lifecycle_reason ?? null,
  };
}

function mapArtifactVersionReviewRow(
  row: ArtifactVersionReviewApiRow
): ArtifactVersionReview {
  return {
    id: row.id,
    artifactId: row.artifact_id,
    artifactVersionId: row.artifact_version_id,
    reviewedById: row.reviewed_by_id,
    reviewStatus: parseArtifactVersionReviewStatus(row.review_status),
    comment: row.comment ?? null,
    createdAt: row.created_at,
  };
}

function mapArtifactEvidenceRow(
  row: ArtifactEvidenceApiRow
): ArtifactEvidence {
  return {
    id: row.id,
    artifactId: row.artifact_id,
    artifactVersionId: row.artifact_version_id ?? null,
    sourceDocumentId: row.source_document_id ?? null,
    sourceType: parseEvidenceSourceType(row.source_type),
    locator: row.locator ?? "",
    excerpt: row.excerpt ?? null,
    confidence: row.confidence ?? null,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

function mapArtifactGraphNodeRow(
  row: ArtifactGraphNodeApiRow
): ArtifactGraphNode {
  const rawArtifactId =
    typeof row.artifact_id === "string" && row.artifact_id.trim()
      ? row.artifact_id.trim()
      : row.id;
  const rawType =
    typeof row.artifact_type === "string"
      ? row.artifact_type
      : typeof row.type === "string"
        ? row.type
        : null;
  const rawStatus =
    typeof row.status === "string" ? row.status : null;
  const title =
    (typeof row.title === "string" && row.title.trim()) ||
    (typeof row.label === "string" && row.label.trim()) ||
    rawArtifactId;

  return {
    id: row.id,
    artifactId: rawArtifactId,
    type: rawType ? parseArtifactType(rawType) : null,
    status: rawStatus ? parseArtifactStatus(rawStatus) : null,
    title,
    label:
      typeof row.label === "string" && row.label.trim()
        ? row.label.trim()
        : null,
    code: row.code ?? null,
    lifecycleState: parseArtifactLifecycleState(row.lifecycle_state),
    lifecycleReason: row.lifecycle_reason ?? null,
    raw: row,
  };
}

function mapArtifactGraphEdgeRow(
  row: ArtifactGraphEdgeApiRow,
  index: number
): ArtifactGraphEdge | null {
  const source =
    (typeof row.source_artifact_id === "string" &&
      row.source_artifact_id.trim()) ||
    (typeof row.source === "string" && row.source.trim()) ||
    "";
  const target =
    (typeof row.target_artifact_id === "string" &&
      row.target_artifact_id.trim()) ||
    (typeof row.target === "string" && row.target.trim()) ||
    "";
  if (!source || !target) return null;

  const relationType =
    (typeof row.relation_type === "string" && row.relation_type.trim()) ||
    (typeof row.type === "string" && row.type.trim()) ||
    null;

  return {
    id: row.id ?? `${source}:${target}:${relationType ?? "related"}:${index}`,
    source,
    target,
    relationType,
    raw: row,
  };
}

// ─── Assertion helpers ────────────────────────────────────────────────────────

function assertArtifactSuccess(
  body: ArtifactApiResponse
): ArtifactApiResponse {
  if (!body.success)
    throw new Error(body.message ?? "Thao tác artifact thất bại");
  return body;
}

function assertArtifactListSuccess(
  body: ArtifactListApiResponse
): ArtifactListApiResponse {
  if (!body.success)
    throw new Error(body.message ?? "Không tải được danh sách artifact");
  return body;
}

function assertArtifactVersionReviewSuccess(
  body: ArtifactVersionReviewApiResponse
): ArtifactVersionReviewApiResponse {
  if (!body.success)
    throw new Error(body.message ?? "Review artifact thất bại");
  return body;
}

function assertArtifactEvidenceListSuccess(
  body: ArtifactEvidenceListApiResponse
): ArtifactEvidenceListApiResponse {
  if (!body.success)
    throw new Error(body.message ?? "Không tải được evidence");
  return body;
}

function assertArtifactEvidenceSuccess(
  body: ArtifactEvidenceApiResponse
): ArtifactEvidenceApiResponse {
  if (!body.success)
    throw new Error(body.message ?? "Thao tác evidence thất bại");
  return body;
}

function assertArtifactGraphSuccess(
  body: ArtifactGraphApiResponse
): ArtifactGraphApiResponse {
  if (!body.success)
    throw new Error(body.message ?? "Không tải được artifact graph");
  return body;
}

// ─── Body builders ────────────────────────────────────────────────────────────

function toCreateArtifactBody(req: CreateArtifactRequest) {
  return {
    type: req.type,
    title: req.title.trim(),
    body: req.body,
    status: req.status ?? "draft",
    priority: req.priority ?? null,
    code: req.code?.trim() ?? null,
    confidence: req.confidence ?? null,
    nfr_category: req.nfrCategory?.trim() ?? null,
    stakeholder_role: req.stakeholderRole?.trim() ?? null,
    metadata: req.metadata ?? {},
    change_source: req.changeSource ?? "manual",
    change_summary: req.changeSummary ?? null,
    source_document_id: req.sourceDocumentId ?? null,
  };
}

function toUpdateArtifactBody(req: UpdateArtifactRequest) {
  const body: Record<string, unknown> = {
    change_source: req.changeSource ?? "manual",
  };
  if (req.title !== undefined) body.title = req.title.trim();
  if (req.body !== undefined) body.body = req.body;
  if (req.status !== undefined) body.status = req.status;
  if (req.priority !== undefined) body.priority = req.priority;
  if (req.code !== undefined) body.code = req.code?.trim() ?? null;
  if (req.confidence !== undefined) body.confidence = req.confidence;
  if (req.nfrCategory !== undefined)
    body.nfr_category = req.nfrCategory?.trim() ?? null;
  if (req.stakeholderRole !== undefined)
    body.stakeholder_role = req.stakeholderRole?.trim() ?? null;
  if (req.metadata !== undefined) body.metadata = req.metadata;
  if (req.changeSummary !== undefined) body.change_summary = req.changeSummary;
  if (req.sourceDocumentId !== undefined)
    body.source_document_id = req.sourceDocumentId;
  return body;
}

function toListArtifactsParams(params: ListArtifactsParams | undefined) {
  if (!params) return undefined;
  const p: Record<string, string> = {};
  if (params.type) p.type = params.type;
  if (params.status) p.status = params.status;
  if (params.stepKey) p.step_key = params.stepKey;
  if (params.phase) p.phase = params.phase;
  if (params.priority) p.priority = params.priority;
  if (params.currentVersionStatus)
    p.current_version_status = params.currentVersionStatus;
  return Object.keys(p).length > 0 ? p : undefined;
}

function toReviewArtifactVersionBody(req: ReviewArtifactVersionRequest) {
  return {
    review_status: req.reviewStatus,
    comment: req.comment ?? null,
  };
}

function toCreateArtifactEvidenceBody(req: CreateArtifactEvidenceRequest) {
  return {
    artifact_version_id: req.artifactVersionId ?? null,
    source_document_id: req.sourceDocumentId ?? null,
    source_type: req.sourceType,
    locator: req.locator.trim(),
    excerpt: req.excerpt ?? null,
    confidence: req.confidence ?? null,
    metadata: req.metadata ?? {},
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const fetchArtifact = {
  /** GET /api/v1/projects/{project_id}/artifacts */
  list: async (
    projectId: string,
    params?: ListArtifactsParams
  ): Promise<ArtifactListResponse> => {
    const pid = resolveProjectId(projectId);
    const response = await apiService.get<ArtifactListApiResponse>(
      artifactsBasePath(pid),
      toListArtifactsParams(params)
    );
    const body = assertArtifactListSuccess(response.data);
    return {
      success: body.success,
      message: body.message ?? null,
      data: (body.data ?? []).map(mapArtifactRow),
    };
  },

  /** GET /api/v1/projects/{project_id}/artifacts/{artifact_id} */
  getById: async (
    projectId: string,
    artifactId: string
  ): Promise<ArtifactResponse> => {
    const pid = resolveProjectId(projectId);
    const aid = resolveArtifactId(artifactId);
    const response = await apiService.get<ArtifactApiResponse>(
      artifactPath(pid, aid)
    );
    const body = assertArtifactSuccess(response.data);
    return {
      success: body.success,
      message: body.message ?? null,
      data: mapArtifactRow(body.data),
    };
  },

  /** POST /api/v1/projects/{project_id}/artifacts */
  create: async (
    projectId: string,
    req: CreateArtifactRequest
  ): Promise<ArtifactResponse> => {
    const pid = resolveProjectId(projectId);
    const response = await apiService.post<ArtifactApiResponse>(
      artifactsBasePath(pid),
      toCreateArtifactBody(req)
    );
    const body = assertArtifactSuccess(response.data);
    return {
      success: body.success,
      message: body.message ?? null,
      data: mapArtifactRow(body.data),
    };
  },

  /** PATCH /api/v1/projects/{project_id}/artifacts/{artifact_id} */
  update: async (
    projectId: string,
    artifactId: string,
    req: UpdateArtifactRequest
  ): Promise<ArtifactResponse> => {
    const pid = resolveProjectId(projectId);
    const aid = resolveArtifactId(artifactId);
    const response = await apiService.patch<ArtifactApiResponse>(
      artifactPath(pid, aid),
      toUpdateArtifactBody(req)
    );
    const body = assertArtifactSuccess(response.data);
    return {
      success: body.success,
      message: body.message ?? null,
      data: mapArtifactRow(body.data),
    };
  },

  /** DELETE /api/v1/projects/{project_id}/artifacts/{artifact_id} */
  delete: async (projectId: string, artifactId: string): Promise<void> => {
    const pid = resolveProjectId(projectId);
    const aid = resolveArtifactId(artifactId);
    await apiService.delete<unknown>(artifactPath(pid, aid));
  },

  /** GET /api/v1/projects/{project_id}/artifact-graph */
  getGraph: async (projectId: string): Promise<ArtifactGraphResponse> => {
    const pid = resolveProjectId(projectId);
    const response = await apiService.get<ArtifactGraphApiResponse>(
      artifactGraphPath(pid)
    );
    const body = assertArtifactGraphSuccess(response.data);
    const rawEdges = body.data.edges ?? body.data.links ?? [];
    return {
      success: body.success,
      message: body.message ?? null,
      data: {
        nodes: (body.data.nodes ?? []).map(mapArtifactGraphNodeRow),
        edges: rawEdges
          .map(mapArtifactGraphEdgeRow)
          .filter((edge): edge is ArtifactGraphEdge => edge !== null),
        warnings: Array.isArray(body.data.warnings)
          ? body.data.warnings
          : [],
      },
    };
  },

  /** POST /api/v1/projects/{project_id}/artifacts/{artifact_id}/versions/{version_id}/review */
  reviewVersion: async (
    projectId: string,
    artifactId: string,
    versionId: string,
    req: ReviewArtifactVersionRequest
  ): Promise<ArtifactVersionReviewResponse> => {
    const pid = resolveProjectId(projectId);
    const aid = resolveArtifactId(artifactId);
    const vid = resolveVersionId(versionId);
    const response = await apiService.post<ArtifactVersionReviewApiResponse>(
      `${artifactVersionPath(pid, aid, vid)}/review`,
      toReviewArtifactVersionBody(req)
    );
    const body = assertArtifactVersionReviewSuccess(response.data);
    return {
      success: body.success,
      message: body.message ?? null,
      data: mapArtifactVersionReviewRow(body.data),
    };
  },

  /** POST /api/v1/projects/{project_id}/artifacts/{artifact_id}/versions/{version_id}/restore */
  restoreVersion: async (
    projectId: string,
    artifactId: string,
    versionId: string
  ): Promise<ArtifactResponse> => {
    const pid = resolveProjectId(projectId);
    const aid = resolveArtifactId(artifactId);
    const vid = resolveVersionId(versionId);
    const response = await apiService.post<ArtifactApiResponse>(
      `${artifactVersionPath(pid, aid, vid)}/restore`
    );
    const body = assertArtifactSuccess(response.data);
    return {
      success: body.success,
      message: body.message ?? null,
      data: mapArtifactRow(body.data),
    };
  },

  /** GET /api/v1/projects/{project_id}/artifacts/{artifact_id}/evidence */
  listEvidence: async (
    projectId: string,
    artifactId: string
  ): Promise<ArtifactEvidenceListResponse> => {
    const pid = resolveProjectId(projectId);
    const aid = resolveArtifactId(artifactId);
    const response = await apiService.get<ArtifactEvidenceListApiResponse>(
      artifactEvidenceBasePath(pid, aid)
    );
    const body = assertArtifactEvidenceListSuccess(response.data);
    return {
      success: body.success,
      message: body.message ?? null,
      data: (body.data ?? []).map(mapArtifactEvidenceRow),
    };
  },

  /** POST /api/v1/projects/{project_id}/artifacts/{artifact_id}/evidence */
  createEvidence: async (
    projectId: string,
    artifactId: string,
    req: CreateArtifactEvidenceRequest
  ): Promise<ArtifactEvidenceResponse> => {
    const pid = resolveProjectId(projectId);
    const aid = resolveArtifactId(artifactId);
    const response = await apiService.post<ArtifactEvidenceApiResponse>(
      artifactEvidenceBasePath(pid, aid),
      toCreateArtifactEvidenceBody(req)
    );
    const body = assertArtifactEvidenceSuccess(response.data);
    return {
      success: body.success,
      message: body.message ?? null,
      data: mapArtifactEvidenceRow(body.data),
    };
  },
};
