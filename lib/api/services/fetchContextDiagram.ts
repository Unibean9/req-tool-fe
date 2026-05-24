import apiService from "../core";

import type {
  ContextDiagramConfig,
  ContextDiagramLayout,
  ContextStakeholder,
  ContextDataFlow,
} from "@/components/ui/context-diagram";

// ─── Wire types (snake_case from BE) ─────────────────────────────────────────

interface ContextDiagramStakeholderApiRow {
  id: string;
  name: string;
  role: string | null;
}

interface ContextDiagramFlowApiRow {
  id: string;
  source: string;
  target: string;
  label: string;
  curvature: number;
}

interface ContextDiagramLayoutNodeApiRow {
  id: string;
  position: { x: number; y: number };
  width: number;
  height: number;
}

interface ContextDiagramLayoutEdgeApiRow {
  id: string;
  waypoint?: { x: number; y: number } | null;
  source_anchor?: { x: number; y: number } | null;
  target_anchor?: { x: number; y: number } | null;
  label_offset?: { x: number; y: number } | null;
}

interface ContextDiagramLayoutApiRow {
  nodes: ContextDiagramLayoutNodeApiRow[];
  edges: ContextDiagramLayoutEdgeApiRow[];
}

interface ContextDiagramApiRow {
  center_label: string;
  stakeholders: ContextDiagramStakeholderApiRow[];
  flows: ContextDiagramFlowApiRow[];
  layout: ContextDiagramLayoutApiRow | null;
}

interface GetContextDiagramApiResponse {
  success: boolean;
  message?: string | null;
  data: ContextDiagramApiRow;
}

interface PutContextDiagramLayoutApiResponse {
  success: boolean;
  message?: string | null;
}

interface PostContextDiagramFlowApiResponse {
  success: boolean;
  message?: string | null;
  data: ContextDiagramFlowApiRow;
}

interface PatchContextDiagramFlowApiResponse {
  success: boolean;
  message?: string | null;
  data: { id: string; source: string; target: string; label: string; curvature: number };
}

// ─── FE types ─────────────────────────────────────────────────────────────────

/** Combined result from GET — config (for `<ContextDiagram config={…} />`) + layout. */
export interface ContextDiagramData {
  config: ContextDiagramConfig;
  layout: ContextDiagramLayout | null;
}

export interface CreateContextDiagramFlowRequest {
  source: string;
  target: string;
  label: string;
}

export interface UpdateContextDiagramFlowRequest {
  label: string;
}

export interface PutContextDiagramLayoutRequest {
  nodes: { id: string; position: { x: number; y: number }; width?: number; height?: number }[];
  edges: {
    id: string;
    waypoint?: { x: number; y: number };
    sourceAnchor?: { x: number; y: number };
    targetAnchor?: { x: number; y: number };
    labelOffset?: { x: number; y: number };
  }[];
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapStakeholder(row: ContextDiagramStakeholderApiRow): ContextStakeholder {
  return {
    id: row.id,
    name: row.name,
    role: row.role ?? undefined,
  };
}

function mapFlow(row: ContextDiagramFlowApiRow): ContextDataFlow {
  return {
    id: row.id,
    source: row.source,
    target: row.target,
    label: row.label,
    curvature: row.curvature,
  };
}

function mapLayout(row: ContextDiagramLayoutApiRow | null): ContextDiagramLayout | null {
  if (!row) return null;
  return {
    nodes: row.nodes.map((n) => ({
      id: n.id,
      position: n.position,
      ...(n.width > 0 ? { width: n.width } : {}),
      ...(n.height > 0 ? { height: n.height } : {}),
    })),
    edges: row.edges.map((e) => ({
      id: e.id,
      ...(e.waypoint != null ? { waypoint: e.waypoint } : {}),
      ...(e.source_anchor != null ? { sourceAnchor: e.source_anchor } : {}),
      ...(e.target_anchor != null ? { targetAnchor: e.target_anchor } : {}),
      ...(e.label_offset != null ? { labelOffset: e.label_offset } : {}),
    })),
  };
}

function mapContextDiagramRow(row: ContextDiagramApiRow): ContextDiagramData {
  return {
    config: {
      centerLabel: row.center_label,
      stakeholders: (row.stakeholders ?? []).map(mapStakeholder),
      flows: (row.flows ?? []).map(mapFlow),
    },
    layout: mapLayout(row.layout),
  };
}

/** camelCase layout → snake_case body for PUT. */
function toLayoutApiBody(layout: PutContextDiagramLayoutRequest) {
  return {
    nodes: layout.nodes,
    edges: layout.edges.map((e) => ({
      id: e.id,
      ...(e.waypoint != null ? { waypoint: e.waypoint } : {}),
      ...(e.sourceAnchor != null ? { source_anchor: e.sourceAnchor } : {}),
      ...(e.targetAnchor != null ? { target_anchor: e.targetAnchor } : {}),
      ...(e.labelOffset != null ? { label_offset: e.labelOffset } : {}),
    })),
  };
}

// ─── Assertions ───────────────────────────────────────────────────────────────

function resolveProjectId(projectId: string): string {
  const id = projectId.trim();
  if (!id) throw new Error("project_id là bắt buộc");
  return id;
}

function assertSuccess<T extends { success: boolean; message?: string | null }>(
  body: T,
  fallback: string
): T {
  if (!body.success) throw new Error(body.message ?? fallback);
  return body;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const fetchContextDiagram = {
  /** GET /api/v1/projects/{projectId}/context-diagram */
  get: async (projectId: string): Promise<ContextDiagramData> => {
    const pid = resolveProjectId(projectId);
    const res = await apiService.get<GetContextDiagramApiResponse>(
      `/api/v1/projects/${encodeURIComponent(pid)}/context-diagram`
    );
    assertSuccess(res.data, "Không tải được context diagram");
    return mapContextDiagramRow(res.data.data);
  },

  /** PUT /api/v1/projects/{projectId}/context-diagram/canvas-layout */
  putLayout: async (
    projectId: string,
    layout: PutContextDiagramLayoutRequest
  ): Promise<void> => {
    const pid = resolveProjectId(projectId);
    const res = await apiService.put<PutContextDiagramLayoutApiResponse>(
      `/api/v1/projects/${encodeURIComponent(pid)}/context-diagram/canvas-layout`,
      toLayoutApiBody(layout)
    );
    assertSuccess(res.data, "Lưu layout thất bại");
  },

  /** POST /api/v1/projects/{projectId}/context-diagram/flows */
  postFlow: async (
    projectId: string,
    body: CreateContextDiagramFlowRequest
  ): Promise<ContextDataFlow> => {
    const pid = resolveProjectId(projectId);
    const res = await apiService.post<PostContextDiagramFlowApiResponse>(
      `/api/v1/projects/${encodeURIComponent(pid)}/context-diagram/flows`,
      body
    );
    assertSuccess(res.data, "Tạo luồng dữ liệu thất bại");
    return mapFlow(res.data.data);
  },

  /** PATCH /api/v1/projects/{projectId}/context-diagram/flows/{flowId} */
  patchFlow: async (
    projectId: string,
    flowId: string,
    body: UpdateContextDiagramFlowRequest
  ): Promise<{ id: string; source: string; target: string; label: string; curvature: number }> => {
    const pid = resolveProjectId(projectId);
    const fid = flowId.trim();
    if (!fid) throw new Error("flow_id là bắt buộc");
    const res = await apiService.patch<PatchContextDiagramFlowApiResponse>(
      `/api/v1/projects/${encodeURIComponent(pid)}/context-diagram/flows/${encodeURIComponent(fid)}`,
      body
    );
    assertSuccess(res.data, "Cập nhật luồng dữ liệu thất bại");
    return res.data.data;
  },

  /** POST /api/v1/projects/{projectId}/context-diagram/sync */
  sync: async (projectId: string): Promise<ContextDiagramData> => {
    const pid = resolveProjectId(projectId);
    const res = await apiService.post<GetContextDiagramApiResponse>(
      `/api/v1/projects/${encodeURIComponent(pid)}/context-diagram/sync`
    );
    assertSuccess(res.data, "Đồng bộ context diagram thất bại");
    return mapContextDiagramRow(res.data.data);
  },

  /** DELETE /api/v1/projects/{projectId}/context-diagram/flows/{flowId} */
  deleteFlow: async (projectId: string, flowId: string): Promise<void> => {
    const pid = resolveProjectId(projectId);
    const fid = flowId.trim();
    if (!fid) throw new Error("flow_id là bắt buộc");
    await apiService.delete(
      `/api/v1/projects/${encodeURIComponent(pid)}/context-diagram/flows/${encodeURIComponent(fid)}`
    );
    // DELETE returns 204 No Content — Axios throws on 4xx/5xx, so reaching here means success
  },
};
