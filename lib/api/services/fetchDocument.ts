import apiService from "../core";
import {
  type ArtifactChangeSource,
  type ArtifactCurrentVersionStatus,
  type ArtifactPriority,
  type ArtifactStatus,
  type ArtifactVersion,
  type ArtifactVersionReviewStatus,
} from "./fetchArtifact";

// ─── Document enums ───────────────────────────────────────────────────────────

export const DOCUMENT_TYPES = ["brd", "prd", "sad"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_CHANGE_SOURCES = [
  "manual",
  "import",
  "ai_generation",
  "review",
  "system",
] as const;
export type DocumentChangeSource = (typeof DOCUMENT_CHANGE_SOURCES)[number];

// ─── Wire types (snake_case) ──────────────────────────────────────────────────

interface ArtifactVersionApiRow {
  id: string;
  artifact_id: string;
  version_number?: number;
  title?: string | null;
  body: string;
  status?: string | null;
  parent_version_id?: string | null;
  change_source: string;
  change_summary: string | null;
  review_status?: string | null;
  created_by_id: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

interface DocumentRegistryEntryApi {
  artifact_type: string;
  label: string;
  description: string;
  children: string[];
  is_container: boolean;
}

interface DocumentRegistryApi {
  containers: DocumentRegistryEntryApi[];
  items: DocumentRegistryEntryApi[];
}

interface DocumentItemSlotApi {
  artifact_type: string;
  label: string;
  description: string;
  artifact_id: string | null;
  parent_id: string | null;
  status: string | null;
  title: string | null;
  current_version_id: string | null;
  current_version: ArtifactVersionApiRow | null;
  versions: ArtifactVersionApiRow[];
}

export interface DocumentViewApi {
  document_type: string;
  label: string;
  description: string;
  artifact_id: string | null;
  project_id: string;
  status: string | null;
  title: string | null;
  current_version_id: string | null;
  items: DocumentItemSlotApi[];
}

interface DocumentItemViewApi {
  artifact_type: string;
  label: string;
  description: string;
  artifact_id: string;
  parent_id: string;
  status: string | null;
  priority: string | null;
  code: string | null;
  title: string;
  confidence: number | null;
  metadata: Record<string, unknown>;
  current_version_id: string;
  current_version: ArtifactVersionApiRow | null;
  versions: ArtifactVersionApiRow[];
  created_at: string;
}

interface DocumentRegistryApiResponse {
  success: boolean;
  data: DocumentRegistryApi;
  message: string | null;
}

interface DocumentViewApiResponse {
  success: boolean;
  data: DocumentViewApi;
  message: string | null;
}

interface DocumentItemViewApiResponse {
  success: boolean;
  data: DocumentItemViewApi;
  message: string | null;
}

// ─── Client types (camelCase) ─────────────────────────────────────────────────

export interface DocumentRegistryEntry {
  artifactType: string;
  label: string;
  description: string;
  children: string[];
  isContainer: boolean;
}

export interface DocumentRegistry {
  containers: DocumentRegistryEntry[];
  items: DocumentRegistryEntry[];
}

export interface DocumentItemSlot {
  artifactType: string;
  label: string;
  description: string;
  artifactId: string | null;
  parentId: string | null;
  status: ArtifactStatus | null;
  title: string | null;
  currentVersionId: string | null;
  currentVersion: ArtifactVersion | null;
  versions: ArtifactVersion[];
}

export interface DocumentView {
  documentType: DocumentType;
  label: string;
  description: string;
  artifactId: string | null;
  projectId: string;
  status: ArtifactStatus | null;
  title: string | null;
  currentVersionId: string | null;
  items: DocumentItemSlot[];
}

export interface DocumentItemView {
  artifactType: string;
  label: string;
  description: string;
  artifactId: string;
  parentId: string;
  status: ArtifactStatus;
  priority: ArtifactPriority | null;
  code: string | null;
  title: string;
  confidence: number | null;
  metadata: Record<string, unknown>;
  currentVersionId: string;
  currentVersion: ArtifactVersion | null;
  versions: ArtifactVersion[];
  createdAt: string;
}

export interface DocumentRegistryResponse {
  success: boolean;
  data: DocumentRegistry;
  message: string | null;
}

export interface DocumentViewResponse {
  success: boolean;
  data: DocumentView;
  message: string | null;
}

export interface DocumentItemViewResponse {
  success: boolean;
  data: DocumentItemView;
  message: string | null;
}

export interface UpsertDocumentItemRequest {
  title?: string | null;
  body: string;
  status?: ArtifactStatus;
  priority?: ArtifactPriority | null;
  code?: string | null;
  confidence?: number | null;
  metadata?: Record<string, unknown>;
  change_source?: DocumentChangeSource;
  change_summary?: string | null;
}

// ─── Path helpers ─────────────────────────────────────────────────────────────

function resolveProjectId(projectId: string): string {
  const id = projectId.trim();
  if (!id) throw new Error("project_id là bắt buộc");
  return id;
}

function resolveDocumentType(documentType: string): DocumentType {
  const value = documentType.trim().toLowerCase();
  if (!(DOCUMENT_TYPES as readonly string[]).includes(value)) {
    throw new Error("document_type không hợp lệ");
  }
  return value as DocumentType;
}

function documentsBasePath(projectId: string) {
  return `/api/v1/projects/${encodeURIComponent(resolveProjectId(projectId))}/documents`;
}

function documentPath(projectId: string, documentType: string) {
  return `${documentsBasePath(projectId)}/${encodeURIComponent(resolveDocumentType(documentType))}`;
}

function documentItemPath(
  projectId: string,
  documentType: string,
  itemType: string
) {
  return `${documentPath(projectId, documentType)}/${encodeURIComponent(itemType.trim())}`;
}

// ─── Parsing helpers ──────────────────────────────────────────────────────────

function parseDocumentType(value: string): DocumentType {
  const normalized = value.trim().toLowerCase();
  return (DOCUMENT_TYPES as readonly string[]).includes(normalized)
    ? (normalized as DocumentType)
    : "brd";
}

function parseArtifactStatus(value: string | null | undefined): ArtifactStatus | null {
  if (!value) return null;
  const statuses = [
    "draft",
    "needs_clarification",
    "accepted",
    "rejected",
    "archived",
  ] as const;
  return (statuses as readonly string[]).includes(value)
    ? (value as ArtifactStatus)
    : "draft";
}

function parseArtifactPriority(
  value: string | null | undefined
): ArtifactPriority | null {
  if (!value) return null;
  const priorities = ["must", "should", "could", "wont"] as const;
  return (priorities as readonly string[]).includes(value)
    ? (value as ArtifactPriority)
    : null;
}

function parseChangeSource(value: string): ArtifactChangeSource {
  const sources = [
    "manual",
    "import",
    "ai_generation",
    "ai_output",
    "review",
    "system",
  ] as const;
  return (sources as readonly string[]).includes(value)
    ? (value as ArtifactChangeSource)
    : "manual";
}

function parseVersionStatus(
  value: string | null | undefined
): ArtifactCurrentVersionStatus | null {
  if (!value) return null;
  const statuses = [
    "draft",
    "proposed",
    "accepted",
    "rejected",
    "archived",
  ] as const;
  return (statuses as readonly string[]).includes(value)
    ? (value as ArtifactCurrentVersionStatus)
    : null;
}

function parseReviewStatus(
  value: string | null | undefined
): ArtifactVersionReviewStatus | null {
  if (!value) return null;
  const statuses = ["approved", "rejected", "changes_requested"] as const;
  return (statuses as readonly string[]).includes(value)
    ? (value as ArtifactVersionReviewStatus)
    : null;
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
    status: parseVersionStatus(row.status),
    parentVersionId: row.parent_version_id ?? null,
    changeSource: parseChangeSource(row.change_source),
    changeSummary: row.change_summary ?? null,
    reviewStatus: parseReviewStatus(row.review_status),
    sourceDocumentId: null,
    createdById: row.created_by_id,
    createdAt: row.created_at,
    metadata: row.metadata ?? {},
  };
}

function mapRegistryEntry(row: DocumentRegistryEntryApi): DocumentRegistryEntry {
  return {
    artifactType: row.artifact_type,
    label: row.label,
    description: row.description,
    children: row.children ?? [],
    isContainer: row.is_container,
  };
}

function mapDocumentItemSlot(row: DocumentItemSlotApi): DocumentItemSlot {
  return {
    artifactType: row.artifact_type,
    label: row.label,
    description: row.description,
    artifactId: row.artifact_id,
    parentId: row.parent_id,
    status: parseArtifactStatus(row.status),
    title: row.title,
    currentVersionId: row.current_version_id,
    currentVersion: mapArtifactVersionRow(row.current_version),
    versions: (row.versions ?? [])
      .map(mapArtifactVersionRow)
      .filter((v): v is ArtifactVersion => v !== null),
  };
}

function mapDocumentView(row: DocumentViewApi): DocumentView {
  return {
    documentType: parseDocumentType(row.document_type),
    label: row.label,
    description: row.description,
    artifactId: row.artifact_id,
    projectId: row.project_id,
    status: parseArtifactStatus(row.status),
    title: row.title,
    currentVersionId: row.current_version_id,
    items: (row.items ?? []).map(mapDocumentItemSlot),
  };
}

function mapDocumentItemView(row: DocumentItemViewApi): DocumentItemView {
  return {
    artifactType: row.artifact_type,
    label: row.label,
    description: row.description,
    artifactId: row.artifact_id,
    parentId: row.parent_id,
    status: parseArtifactStatus(row.status) ?? "draft",
    priority: parseArtifactPriority(row.priority),
    code: row.code,
    title: row.title,
    confidence: row.confidence,
    metadata: row.metadata ?? {},
    currentVersionId: row.current_version_id,
    currentVersion: mapArtifactVersionRow(row.current_version),
    versions: (row.versions ?? [])
      .map(mapArtifactVersionRow)
      .filter((v): v is ArtifactVersion => v !== null),
    createdAt: row.created_at,
  };
}

export function mapDocumentViewFromApi(row: DocumentViewApi): DocumentView {
  return mapDocumentView(row);
}

/** Seed item cache from document list slot (body/status, no extra GET). */
export function buildDocumentItemResponseFromSlot(
  slot: DocumentItemSlot
): DocumentItemViewResponse {
  if (!slot.artifactId) {
    throw new Error("Cannot build document item view without artifactId");
  }

  return {
    success: true,
    message: null,
    data: {
      artifactType: slot.artifactType,
      label: slot.label,
      description: slot.description,
      artifactId: slot.artifactId,
      parentId: slot.parentId ?? "",
      status: slot.status ?? "draft",
      priority: null,
      code: null,
      title: slot.title ?? slot.label,
      confidence: null,
      metadata: {},
      currentVersionId: slot.currentVersionId ?? "",
      currentVersion: slot.currentVersion,
      versions: slot.versions,
      createdAt: slot.currentVersion?.createdAt ?? new Date(0).toISOString(),
    },
  };
}

export function isHydratedDocumentItemCache(
  response: DocumentItemViewResponse | undefined
): boolean {
  return Boolean(response?.data && response.data.versions.length === 0);
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const fetchDocument = {
  /** GET /api/v1/documents/types */
  getTypes: async (): Promise<DocumentRegistryResponse> => {
    const res = await apiService.get<DocumentRegistryApiResponse>(
      "/api/v1/documents/types"
    );
    return {
      success: res.data.success,
      message: res.data.message ?? null,
      data: {
        containers: (res.data.data.containers ?? []).map(mapRegistryEntry),
        items: (res.data.data.items ?? []).map(mapRegistryEntry),
      },
    };
  },

  /** GET /api/v1/projects/{project_id}/documents/{document_type} */
  get: async (
    projectId: string,
    documentType: DocumentType
  ): Promise<DocumentViewResponse> => {
    const res = await apiService.get<DocumentViewApiResponse>(
      documentPath(projectId, documentType)
    );
    return {
      success: res.data.success,
      message: res.data.message ?? null,
      data: mapDocumentView(res.data.data),
    };
  },

  /** POST /api/v1/projects/{project_id}/documents/{document_type} */
  create: async (
    projectId: string,
    documentType: DocumentType
  ): Promise<DocumentViewResponse> => {
    const res = await apiService.post<DocumentViewApiResponse>(
      documentPath(projectId, documentType)
    );
    return {
      success: res.data.success,
      message: res.data.message ?? null,
      data: mapDocumentView(res.data.data),
    };
  },

  /** GET /api/v1/projects/{project_id}/documents/{document_type}/{item_type} */
  getItem: async (
    projectId: string,
    documentType: DocumentType,
    itemType: string
  ): Promise<DocumentItemViewResponse> => {
    const res = await apiService.get<DocumentItemViewApiResponse>(
      documentItemPath(projectId, documentType, itemType)
    );
    return {
      success: res.data.success,
      message: res.data.message ?? null,
      data: mapDocumentItemView(res.data.data),
    };
  },

  /** POST /api/v1/projects/{project_id}/documents/{document_type}/{item_type} */
  upsertItem: async (
    projectId: string,
    documentType: DocumentType,
    itemType: string,
    req: UpsertDocumentItemRequest
  ): Promise<DocumentItemViewResponse> => {
    const res = await apiService.post<DocumentItemViewApiResponse>(
      documentItemPath(projectId, documentType, itemType),
      req
    );
    return {
      success: res.data.success,
      message: res.data.message ?? null,
      data: mapDocumentItemView(res.data.data),
    };
  },
};

export function isDocumentType(value: string): value is DocumentType {
  return (DOCUMENT_TYPES as readonly string[]).includes(value);
}
