import apiService from "../core";
import {
  parseSwimlaneWaypointsFromWire,
  swimlaneRfHandleIdToWireHandle,
  swimlaneWaypointsToWire,
} from "@/lib/swimlane/swimlaneEdgeWire";

// --- Swimlane (wire snake_case từ BE) ---

interface ProjectFlowSwimlaneLaneWire {
  id: string;
  title: string;
  width?: number;
  x_left?: number;
  x_center?: number;
  x_right?: number;
}

interface ProjectFlowSwimlaneActionWire {
  id: string;
  lane_id: string;
  label: string;
  y: number;
  /** Tọa độ X tuyệt đối trong pool (BE mới). */
  x?: number;
  width?: number;
  height?: number;
  index?: number;
  notation?: string;
}

interface ProjectFlowSwimlaneEventWire {
  id: string;
  lane_id: string;
  y: number;
  /** Tọa độ X tuyệt đối trong pool (BE mới). */
  x?: number;
}

interface ProjectFlowSwimlaneFlowWire {
  id: string;
  source: string;
  target: string;
  flow_type: string;
  /** Tên edge (override); thường chỉ cần `guard`. */
  label?: string | null;
  /** Điều kiện nhánh hiển thị trên dây (vd. "≤ 50M VND"). */
  guard?: string | null;
  source_handle?: string | null;
  target_handle?: string | null;
  label_offset?: { x?: number; y?: number } | null;
  /** Điểm gấp khúc tuyệt đối trong pool (draw.io-style). Bỏ trống = FE auto-route. */
  waypoints?: { x?: number; y?: number }[] | null;
}

interface ProjectFlowSwimlaneWire {
  id: string;
  title: string;
  layout: Record<string, unknown> | null;
  lanes: ProjectFlowSwimlaneLaneWire[];
  actions: ProjectFlowSwimlaneActionWire[];
  flows: ProjectFlowSwimlaneFlowWire[];
  initial_node: ProjectFlowSwimlaneEventWire;
  activity_final_node: ProjectFlowSwimlaneEventWire;
}

export interface ProjectFlowSwimlaneLane {
  id: string;
  title: string;
  /** BE auto-layout: độ rộng lane (min ~280). */
  width?: number;
  xLeft?: number;
  xCenter?: number;
  xRight?: number;
}

export interface ProjectFlowSwimlaneAction {
  id: string;
  laneId: string;
  label: string;
  y: number;
  /** Tọa độ X tuyệt đối trong pool khi BE/FE lưu layout. */
  x?: number;
  width?: number;
  height?: number;
  index?: number;
  notation?: string;
}

export interface ProjectFlowSwimlaneEvent {
  id: string;
  laneId: string;
  y: number;
  x?: number;
}

export interface ProjectFlowSwimlaneFlow {
  id: string;
  source: string;
  target: string;
  flowType: "control" | "object";
  label?: string;
  guard?: string;
  sourceHandle?: string;
  targetHandle?: string;
  labelOffset?: { x: number; y: number };
  waypoints?: { x: number; y: number }[];
}

export interface ProjectFlowSwimlane {
  id: string;
  title: string;
  layout: Record<string, unknown> | null;
  lanes: ProjectFlowSwimlaneLane[];
  actions: ProjectFlowSwimlaneAction[];
  flows: ProjectFlowSwimlaneFlow[];
  initialNode: ProjectFlowSwimlaneEvent;
  activityFinalNode: ProjectFlowSwimlaneEvent;
}

function parseFlowType(raw: string): "control" | "object" {
  return raw === "object" ? "object" : "control";
}

function parseSwimlaneFlowLabelOffset(
  raw: ProjectFlowSwimlaneFlowWire["label_offset"]
): { x: number; y: number } | undefined {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const x = Number((raw as { x?: unknown }).x);
  const y = Number((raw as { y?: unknown }).y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return undefined;
  return { x, y };
}

function parseLaneGeometryFromWire(l: ProjectFlowSwimlaneLaneWire): Pick<
  ProjectFlowSwimlaneLane,
  "width" | "xLeft" | "xCenter" | "xRight"
> {
  const width = Number(l.width);
  const xLeft = Number(l.x_left);
  const xCenter = Number(l.x_center);
  const xRight = Number(l.x_right);
  return {
    ...(Number.isFinite(width) && width > 0 ? { width } : {}),
    ...(Number.isFinite(xLeft) ? { xLeft } : {}),
    ...(Number.isFinite(xCenter) ? { xCenter } : {}),
    ...(Number.isFinite(xRight) ? { xRight } : {}),
  };
}

/** @deprecated Dùng `swimlaneRfHandleIdToWireHandle` từ `@/lib/swimlane/swimlaneEdgeWire`. */
export { swimlaneRfHandleIdToWireEnum } from "@/lib/swimlane/swimlaneEdgeWire";

export function mapSwimlaneFromWire(
  raw: ProjectFlowSwimlaneWire | null | undefined
): ProjectFlowSwimlane | null {
  if (!raw || typeof raw !== "object") return null;
  return {
    id: String(raw.id ?? ""),
    title: String(raw.title ?? ""),
    layout:
      raw.layout != null && typeof raw.layout === "object"
        ? (raw.layout as Record<string, unknown>)
        : null,
    lanes: (raw.lanes ?? []).map((l) => ({
      id: String(l.id),
      title: String(l.title ?? ""),
      ...parseLaneGeometryFromWire(l),
    })),
    actions: (raw.actions ?? []).map((a) => {
      const y = Number(a.y) || 0;
      const x = Number(a.x);
      const width = Number(a.width);
      const height = Number(a.height);
      return {
        id: String(a.id),
        laneId: String(a.lane_id ?? ""),
        label: String(a.label ?? ""),
        y,
        ...(Number.isFinite(x) ? { x } : {}),
        ...(Number.isFinite(width) && width > 0 ? { width } : {}),
        ...(Number.isFinite(height) && height > 0 ? { height } : {}),
        ...(typeof a.index === "number" ? { index: a.index } : {}),
        ...(a.notation != null ? { notation: String(a.notation) } : {}),
      };
    }),
    flows: (raw.flows ?? []).map((f) => {
      const id = String(f.id);
      const source = String(f.source ?? "");
      const target = String(f.target ?? "");
      const flowType = parseFlowType(String(f.flow_type ?? "control"));
      const label =
        f.label != null && String(f.label).trim() ? String(f.label).trim() : undefined;
      const guard =
        f.guard != null && String(f.guard).trim() ? String(f.guard).trim() : undefined;
      const sh =
        f.source_handle != null && String(f.source_handle).trim().length > 0
          ? String(f.source_handle).trim()
          : undefined;
      const th =
        f.target_handle != null && String(f.target_handle).trim().length > 0
          ? String(f.target_handle).trim()
          : undefined;
      const labelOffset = parseSwimlaneFlowLabelOffset(f.label_offset);
      const waypoints = parseSwimlaneWaypointsFromWire(f.waypoints);
      return {
        id,
        source,
        target,
        flowType,
        ...(label != null ? { label } : {}),
        ...(guard != null ? { guard } : {}),
        ...(sh != null ? { sourceHandle: sh } : {}),
        ...(th != null ? { targetHandle: th } : {}),
        ...(labelOffset != null ? { labelOffset } : {}),
        ...(waypoints != null ? { waypoints } : {}),
      };
    }),
    initialNode: {
      id: String(raw.initial_node?.id ?? ""),
      laneId: String(raw.initial_node?.lane_id ?? ""),
      y: Number(raw.initial_node?.y) || 0,
      ...(Number.isFinite(Number(raw.initial_node?.x))
        ? { x: Number(raw.initial_node?.x) }
        : {}),
    },
    activityFinalNode: {
      id: String(raw.activity_final_node?.id ?? ""),
      laneId: String(raw.activity_final_node?.lane_id ?? ""),
      y: Number(raw.activity_final_node?.y) || 0,
      ...(Number.isFinite(Number(raw.activity_final_node?.x))
        ? { x: Number(raw.activity_final_node?.x) }
        : {}),
    },
  };
}

/** Body PUT swimlane — camelCase trong app → snake_case trên wire. */
export function toProjectFlowSwimlanePutWire(
  diagram: ProjectFlowSwimlane
): Record<string, unknown> {
  return {
    title: diagram.title,
    lanes: diagram.lanes.map((l) => {
      const row: Record<string, unknown> = { id: l.id, title: l.title };
      if (typeof l.width === "number" && Number.isFinite(l.width) && l.width > 0) {
        row.width = l.width;
      }
      if (typeof l.xLeft === "number" && Number.isFinite(l.xLeft)) {
        row.x_left = l.xLeft;
      }
      if (typeof l.xCenter === "number" && Number.isFinite(l.xCenter)) {
        row.x_center = l.xCenter;
      }
      if (typeof l.xRight === "number" && Number.isFinite(l.xRight)) {
        row.x_right = l.xRight;
      }
      return row;
    }),
    initial_node: {
      id: diagram.initialNode.id,
      lane_id: diagram.initialNode.laneId,
      y: diagram.initialNode.y,
      ...(typeof diagram.initialNode.x === "number" &&
      Number.isFinite(diagram.initialNode.x)
        ? { x: diagram.initialNode.x }
        : {}),
    },
    activity_final_node: {
      id: diagram.activityFinalNode.id,
      lane_id: diagram.activityFinalNode.laneId,
      y: diagram.activityFinalNode.y,
      ...(typeof diagram.activityFinalNode.x === "number" &&
      Number.isFinite(diagram.activityFinalNode.x)
        ? { x: diagram.activityFinalNode.x }
        : {}),
    },
    actions: diagram.actions.map((a) => {
      const row: Record<string, unknown> = {
        id: a.id,
        lane_id: a.laneId,
        label: a.label,
        y: a.y,
      };
      if (typeof a.x === "number" && Number.isFinite(a.x)) row.x = a.x;
      if (typeof a.width === "number" && Number.isFinite(a.width) && a.width > 0) {
        row.width = a.width;
      }
      if (typeof a.height === "number" && Number.isFinite(a.height) && a.height > 0) {
        row.height = a.height;
      }
      if (typeof a.index === "number") row.index = a.index;
      if (a.notation != null) row.notation = a.notation;
      return row;
    }),
    flows: diagram.flows.map((f) => {
      const row: Record<string, unknown> = {
        id: f.id,
        source: f.source,
        target: f.target,
        flow_type: f.flowType,
      };
      if (f.label != null && String(f.label).trim() !== "") {
        row.label = f.label.trim();
      }
      if (f.guard != null && String(f.guard).trim() !== "") {
        row.guard = f.guard.trim();
      }
      const shWire = swimlaneRfHandleIdToWireHandle("source", f.sourceHandle);
      if (shWire != null) row.source_handle = shWire;
      const thWire = swimlaneRfHandleIdToWireHandle("target", f.targetHandle);
      if (thWire != null) row.target_handle = thWire;
      if (
        f.labelOffset != null &&
        Number.isFinite(f.labelOffset.x) &&
        Number.isFinite(f.labelOffset.y)
      ) {
        row.label_offset = { x: f.labelOffset.x, y: f.labelOffset.y };
      }
      const wpWire = swimlaneWaypointsToWire(f.waypoints);
      if (wpWire != null) row.waypoints = wpWire;
      return row;
    }),
    layout: null,
  };
}

/**
 * Chuẩn hóa swimlane trước PUT: BE 422 nếu `lanes` rỗng (lane_id suy ra ""),
 * hoặc event/action thiếu id / lane_id không thuộc `lanes`.
 */
export function normalizeProjectFlowSwimlaneForPut(
  diagram: ProjectFlowSwimlane,
  flowId: string
): ProjectFlowSwimlane {
  const fid = flowId.trim() || "flow";

  let lanes = diagram.lanes
    .map((l) => {
      const id = typeof l.id === "string" ? l.id.trim() : "";
      const title =
        (typeof l.title === "string" ? l.title.trim() : "") ||
        id ||
        "Lane";
      const width = Number(l.width);
      const xLeft = Number(l.xLeft);
      const xCenter = Number(l.xCenter);
      const xRight = Number(l.xRight);
      return {
        id,
        title,
        ...(Number.isFinite(width) && width > 0 ? { width } : {}),
        ...(Number.isFinite(xLeft) ? { xLeft } : {}),
        ...(Number.isFinite(xCenter) ? { xCenter } : {}),
        ...(Number.isFinite(xRight) ? { xRight } : {}),
      };
    })
    .filter((l) => l.id.length > 0);

  if (lanes.length === 0) {
    lanes = [{ id: "lane-1", title: "Lane 1" }];
  }

  const laneIds = new Set(lanes.map((l) => l.id));

  const pickLane = (laneId: string, fallback: string) => {
    const t = (laneId ?? "").trim();
    if (t && laneIds.has(t)) return t;
    const f = (fallback ?? "").trim();
    if (f && laneIds.has(f)) return f;
    return lanes[0]!.id;
  };

  const defaultInitialId = `${fid}-event-initial`;
  const defaultFinalId = `${fid}-event-final`;

  const initialNode = {
    ...diagram.initialNode,
    id: diagram.initialNode.id.trim() || defaultInitialId,
    laneId: pickLane(diagram.initialNode.laneId, lanes[0]!.id),
    y: diagram.initialNode.y,
  };

  const activityFinalNode = {
    ...diagram.activityFinalNode,
    id: diagram.activityFinalNode.id.trim() || defaultFinalId,
    laneId: pickLane(diagram.activityFinalNode.laneId, lanes[0]!.id),
    y: diagram.activityFinalNode.y,
  };

  const actions = diagram.actions.map((a, index) => ({
    ...a,
    id: (a.id ?? "").trim() || `${fid}-action-${index}`,
    laneId: pickLane(a.laneId, lanes[0]!.id),
  }));

  const flows = diagram.flows
    .map((f, index) => {
      const id = (f.id ?? "").trim() || `${fid}-flow-${index}`;
      const source = (f.source ?? "").trim();
      const target = (f.target ?? "").trim();
      const waypoints =
        f.waypoints != null && f.waypoints.length > 0
          ? f.waypoints.filter(
              (p) => Number.isFinite(p.x) && Number.isFinite(p.y)
            )
          : undefined;
      return {
        ...f,
        id,
        source,
        target,
        ...(waypoints != null && waypoints.length > 0 ? { waypoints } : {}),
      };
    })
    .filter((f) => f.source.length > 0 && f.target.length > 0);

  return {
    ...diagram,
    lanes,
    initialNode,
    activityFinalNode,
    actions,
    flows,
  };
}

// --- Flow row ---

interface ProjectFlowRowApi {
  id: string;
  project_id: string;
  code: string;
  name: string;
  description: string;
  actions: unknown[];
  order: number;
  title: string;
  created_at: string;
  updated_at: string;
  swimlane?: ProjectFlowSwimlaneWire | null;
}

interface ProjectFlowApiResponse {
  success: boolean;
  data: ProjectFlowRowApi;
  message: string | null;
}

interface ListProjectFlowsApiResponse {
  success: boolean;
  data: ProjectFlowRowApi[];
  message: string | null;
}

interface DeleteProjectFlowApiResponse {
  success: boolean;
  message?: string | null;
  data?: unknown;
}

/** POST — camelCase app → snake_case wire. */
export interface CreateProjectFlowRequest {
  code: string;
  name: string;
  description: string;
  actions: unknown[];
}

/** PATCH — chỉ `code`, `name`, `description` theo contract. */
export interface UpdateProjectFlowRequest {
  code: string;
  name: string;
  description: string;
}

export interface ProjectFlow {
  id: string;
  projectId: string;
  code: string;
  name: string;
  description: string;
  actions: unknown[];
  order: number;
  title: string;
  swimlane: ProjectFlowSwimlane | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFlowResponse {
  success: boolean;
  data: ProjectFlow;
  message: string | null;
}

export type CreateProjectFlowResponse = ProjectFlowResponse;
export type UpdateProjectFlowResponse = ProjectFlowResponse;

export interface ProjectFlowsListResponse {
  success: boolean;
  data: ProjectFlow[];
  message: string | null;
}

// --- Flow templates (GET .../flows/{flow_id}/templates) ---

interface ProjectFlowTemplateActorWire {
  id: string;
  name: string;
}

interface ProjectFlowTemplateStepWire {
  step: number;
  description: string;
  actor: string;
}

interface ProjectFlowTemplateWire {
  flow_id: string;
  code: string;
  name: string;
  actors: ProjectFlowTemplateActorWire[];
  steps: ProjectFlowTemplateStepWire[];
}

interface ListProjectFlowTemplatesApiResponse {
  success: boolean;
  data: ProjectFlowTemplateWire[];
  message: string | null;
}

export interface ProjectFlowTemplateActor {
  id: string;
  name: string;
}

export interface ProjectFlowTemplateStep {
  step: number;
  description: string;
  actor: string;
}

export interface ProjectFlowTemplate {
  flowId: string;
  code: string;
  name: string;
  actors: ProjectFlowTemplateActor[];
  steps: ProjectFlowTemplateStep[];
}

export interface ProjectFlowTemplatesListResponse {
  success: boolean;
  data: ProjectFlowTemplate[];
  message: string | null;
}

/** Action nghiệp vụ gắn flow (POST/PATCH `.../flows/{flow_id}/actions`) — khác `ProjectFlowSwimlaneAction` (UML). */
interface ProjectFlowActionItemWire {
  id: string;
  flow_id: string;
  actor_id: string;
  order: number;
  description: string;
  rules: unknown[];
  created_at: string;
  updated_at: string;
}

interface ProjectFlowActionsApiResponse {
  success: boolean;
  data: ProjectFlowActionItemWire[];
  message: string | null;
}

export interface ProjectFlowActionItem {
  id: string;
  flowId: string;
  actorId: string;
  order: number;
  description: string;
  rules: unknown[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFlowActionsResponse {
  success: boolean;
  data: ProjectFlowActionItem[];
  message: string | null;
}

/** POST body — không có `id`. */
export interface CreateProjectFlowActionItem {
  order: number;
  description: string;
  actorId: string;
  ruleIds: string[];
}

/** PATCH body — có `id`. */
export interface PatchProjectFlowActionItem {
  id: string;
  order: number;
  description: string;
  actorId: string;
  ruleIds: string[];
}

function resolveProjectId(projectId: string): string {
  const id = projectId.trim();
  if (!id) throw new Error("project_id là bắt buộc");
  return id;
}

function resolveFlowId(flowId: string): string {
  const id = flowId.trim();
  if (!id) throw new Error("flow_id là bắt buộc");
  return id;
}

function mapProjectFlowRow(row: ProjectFlowRowApi): ProjectFlow {
  return {
    id: row.id,
    projectId: row.project_id,
    code: row.code ?? "",
    name: row.name ?? "",
    description: row.description ?? "",
    actions: Array.isArray(row.actions) ? row.actions : [],
    order: Number(row.order) || 0,
    title: row.title ?? "",
    swimlane: mapSwimlaneFromWire(row.swimlane),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toCreateProjectFlowApiBody(body: CreateProjectFlowRequest) {
  return {
    code: body.code.trim(),
    name: body.name.trim(),
    description: body.description.trim(),
    actions: body.actions,
  };
}

function toUpdateProjectFlowApiBody(body: UpdateProjectFlowRequest) {
  return {
    code: body.code.trim(),
    name: body.name.trim(),
    description: body.description.trim(),
  };
}

function mapProjectFlowResponse(body: ProjectFlowApiResponse): ProjectFlowResponse {
  return {
    success: body.success,
    message: body.message ?? null,
    data: mapProjectFlowRow(body.data),
  };
}

function mapProjectFlowsListResponse(
  body: ListProjectFlowsApiResponse
): ProjectFlowsListResponse {
  return {
    success: body.success,
    message: body.message ?? null,
    data: (body.data ?? []).map(mapProjectFlowRow),
  };
}

function assertProjectFlowSuccess(body: ProjectFlowApiResponse): ProjectFlowApiResponse {
  if (!body.success) {
    throw new Error(body.message ?? "Thao tác flow thất bại");
  }
  return body;
}

function assertProjectFlowsListSuccess(
  body: ListProjectFlowsApiResponse
): ListProjectFlowsApiResponse {
  if (!body.success) {
    throw new Error(body.message ?? "Không tải được danh sách flow");
  }
  return body;
}

function mapProjectFlowTemplateRow(
  row: ProjectFlowTemplateWire
): ProjectFlowTemplate {
  return {
    flowId: String(row.flow_id ?? ""),
    code: String(row.code ?? ""),
    name: String(row.name ?? ""),
    actors: (row.actors ?? []).map((a) => ({
      id: String(a.id ?? ""),
      name: String(a.name ?? ""),
    })),
    steps: (row.steps ?? []).map((s) => ({
      step: Number(s.step) || 0,
      description: String(s.description ?? ""),
      actor: String(s.actor ?? ""),
    })),
  };
}

function mapProjectFlowTemplatesListResponse(
  body: ListProjectFlowTemplatesApiResponse
): ProjectFlowTemplatesListResponse {
  return {
    success: body.success,
    message: body.message ?? null,
    data: (body.data ?? []).map(mapProjectFlowTemplateRow),
  };
}

function assertProjectFlowTemplatesListSuccess(
  body: ListProjectFlowTemplatesApiResponse
): ListProjectFlowTemplatesApiResponse {
  if (!body.success) {
    throw new Error(body.message ?? "Không tải được danh sách template flow");
  }
  return body;
}

function mapProjectFlowActionItemRow(
  row: ProjectFlowActionItemWire
): ProjectFlowActionItem {
  return {
    id: row.id,
    flowId: row.flow_id,
    actorId: row.actor_id ?? "",
    order: Number(row.order) || 0,
    description: row.description ?? "",
    rules: Array.isArray(row.rules) ? row.rules : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProjectFlowActionsResponse(
  body: ProjectFlowActionsApiResponse
): ProjectFlowActionsResponse {
  return {
    success: body.success,
    message: body.message ?? null,
    data: (body.data ?? []).map(mapProjectFlowActionItemRow),
  };
}

function assertProjectFlowActionsSuccess(
  body: ProjectFlowActionsApiResponse
): ProjectFlowActionsApiResponse {
  if (!body.success) {
    throw new Error(body.message ?? "Thao tác actions flow thất bại");
  }
  return body;
}

function toCreateFlowActionsWire(items: CreateProjectFlowActionItem[]) {
  return items.map((i) => ({
    order: i.order,
    description: i.description.trim(),
    actor_id: i.actorId.trim(),
    rule_ids: i.ruleIds.map((id) => id.trim()).filter(Boolean),
  }));
}

function toPatchFlowActionsWire(items: PatchProjectFlowActionItem[]) {
  return items.map((i) => ({
    id: i.id.trim(),
    order: i.order,
    description: i.description.trim(),
    actor_id: i.actorId.trim(),
    rule_ids: i.ruleIds.map((id) => id.trim()).filter(Boolean),
  }));
}

function parseSwimlanePutFlowResponse(payload: unknown): ProjectFlowResponse {
  if (payload && typeof payload === "object" && "success" in payload) {
    const envelope = payload as ProjectFlowApiResponse;
    if (envelope.success === false) {
      throw new Error(
        typeof envelope.message === "string" && envelope.message
          ? envelope.message
          : "Cập nhật swimlane thất bại"
      );
    }
    if (envelope.data) {
      return mapProjectFlowResponse(envelope);
    }
  }
  throw new Error("Phản hồi swimlane không hợp lệ");
}

export const fetchFlow = {
  /** GET /api/v1/projects/{project_id}/flows */
  list: async (projectId: string): Promise<ProjectFlowsListResponse> => {
    const pid = resolveProjectId(projectId);
    const response = await apiService.get<ListProjectFlowsApiResponse>(
      `/api/v1/projects/${encodeURIComponent(pid)}/flows`
    );
    return mapProjectFlowsListResponse(assertProjectFlowsListSuccess(response.data));
  },

  /**
   * GET /api/v1/projects/{project_id}/flows/{flow_id}/templates
   */
  listTemplates: async (
    projectId: string,
    flowId: string
  ): Promise<ProjectFlowTemplatesListResponse> => {
    const pid = resolveProjectId(projectId);
    const fid = resolveFlowId(flowId);
    const response = await apiService.get<ListProjectFlowTemplatesApiResponse>(
      `/api/v1/projects/${encodeURIComponent(pid)}/flows/${encodeURIComponent(fid)}/templates`
    );
    return mapProjectFlowTemplatesListResponse(
      assertProjectFlowTemplatesListSuccess(response.data)
    );
  },

  /** GET /api/v1/projects/{project_id}/flows/{flow_id} */
  get: async (projectId: string, flowId: string): Promise<ProjectFlowResponse> => {
    const pid = resolveProjectId(projectId);
    const fid = resolveFlowId(flowId);
    const response = await apiService.get<ProjectFlowApiResponse>(
      `/api/v1/projects/${encodeURIComponent(pid)}/flows/${encodeURIComponent(fid)}`
    );
    assertProjectFlowSuccess(response.data);
    return mapProjectFlowResponse(response.data);
  },

  /** POST /api/v1/projects/{project_id}/flows */
  create: async (
    projectId: string,
    body: CreateProjectFlowRequest
  ): Promise<CreateProjectFlowResponse> => {
    const pid = resolveProjectId(projectId);
    const response = await apiService.post<ProjectFlowApiResponse>(
      `/api/v1/projects/${encodeURIComponent(pid)}/flows`,
      toCreateProjectFlowApiBody(body)
    );
    assertProjectFlowSuccess(response.data);
    return mapProjectFlowResponse(response.data);
  },

  /** PATCH /api/v1/projects/{project_id}/flows/{flow_id} */
  update: async (
    projectId: string,
    flowId: string,
    body: UpdateProjectFlowRequest
  ): Promise<UpdateProjectFlowResponse> => {
    const pid = resolveProjectId(projectId);
    const fid = resolveFlowId(flowId);
    const response = await apiService.patch<ProjectFlowApiResponse>(
      `/api/v1/projects/${encodeURIComponent(pid)}/flows/${encodeURIComponent(fid)}`,
      toUpdateProjectFlowApiBody(body)
    );
    assertProjectFlowSuccess(response.data);
    return mapProjectFlowResponse(response.data);
  },

  /** DELETE /api/v1/projects/{project_id}/flows/{flow_id} */
  delete: async (
    projectId: string,
    flowId: string
  ): Promise<{ success: boolean; message: string | null }> => {
    const pid = resolveProjectId(projectId);
    const fid = resolveFlowId(flowId);
    const response = await apiService.delete<
      DeleteProjectFlowApiResponse | Record<string, never>
    >(
      `/api/v1/projects/${encodeURIComponent(pid)}/flows/${encodeURIComponent(fid)}`
    );
    const payload = response.data as DeleteProjectFlowApiResponse | undefined;
    if (payload && typeof payload === "object" && "success" in payload) {
      if (!payload.success) {
        throw new Error(
          typeof payload.message === "string" && payload.message
            ? payload.message
            : "Xóa flow thất bại"
        );
      }
      return {
        success: true,
        message: typeof payload.message === "string" ? payload.message : null,
      };
    }
    return { success: true, message: null };
  },

  /**
   * PUT /api/v1/projects/{project_id}/flows/{flow_id}/swimlane
   * Body: title, lanes (width, x_left), nodes (x, y, width, height), flows, layout: null.
   * Response: `{ success, data: ProjectFlow }` (swimlane nằm trong `data.swimlane`).
   */
  putSwimlane: async (
    projectId: string,
    flowId: string,
    diagram: ProjectFlowSwimlane
  ): Promise<ProjectFlowResponse> => {
    const pid = resolveProjectId(projectId);
    const fid = resolveFlowId(flowId);
    const normalized = normalizeProjectFlowSwimlaneForPut(diagram, fid);
    const response = await apiService.put<ProjectFlowApiResponse>(
      `/api/v1/projects/${encodeURIComponent(pid)}/flows/${encodeURIComponent(fid)}/swimlane`,
      toProjectFlowSwimlanePutWire(normalized)
    );
    const flowResponse = parseSwimlanePutFlowResponse(response.data);
    if (!flowResponse.data.swimlane) {
      throw new Error("Phản hồi swimlane không hợp lệ");
    }
    return flowResponse;
  },

  /**
   * POST /api/v1/projects/{project_id}/flows/{flow_id}/actions
   * Body: mảng `{ order, description, actor_id, rule_ids }`.
   */
  postActions: async (
    projectId: string,
    flowId: string,
    items: CreateProjectFlowActionItem[]
  ): Promise<ProjectFlowActionsResponse> => {
    const pid = resolveProjectId(projectId);
    const fid = resolveFlowId(flowId);
    const response = await apiService.post<ProjectFlowActionsApiResponse>(
      `/api/v1/projects/${encodeURIComponent(pid)}/flows/${encodeURIComponent(fid)}/actions`,
      toCreateFlowActionsWire(items)
    );
    return mapProjectFlowActionsResponse(
      assertProjectFlowActionsSuccess(response.data)
    );
  },

  /**
   * PATCH /api/v1/projects/{project_id}/flows/{flow_id}/actions
   * Body: mảng `{ id, order, description, actor_id, rule_ids }`.
   */
  patchActions: async (
    projectId: string,
    flowId: string,
    items: PatchProjectFlowActionItem[]
  ): Promise<ProjectFlowActionsResponse> => {
    const pid = resolveProjectId(projectId);
    const fid = resolveFlowId(flowId);
    const response = await apiService.patch<ProjectFlowActionsApiResponse>(
      `/api/v1/projects/${encodeURIComponent(pid)}/flows/${encodeURIComponent(fid)}/actions`,
      toPatchFlowActionsWire(items)
    );
    return mapProjectFlowActionsResponse(
      assertProjectFlowActionsSuccess(response.data)
    );
  },
};
