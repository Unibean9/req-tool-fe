import type { Edge, Node } from "@xyflow/react";

import {
  resolveSwimlaneLaneGeometry,
  swimlaneActivityLayout,
  swimlaneCenterXFromPosition,
  type SwimlaneActivityDiagramConfig,
  type SwimlaneActivityNodeNotation,
  type SwimlaneControlFlow,
  type SwimlaneLane,
} from "@/components/ui/activity-react-flow";
import {
  swimlaneRfHandleIdToWireHandle,
  swimlaneWireHandleToRfId,
  type SwimlaneWaypoint,
} from "@/lib/activity/activityEdgeWire";
import {
  type ProjectFlowSwimlane,
  type ProjectFlowSwimlaneFlow,
  type ProjectFlowSwimlaneLane,
} from "@/lib/api/services/fetchFlow";

const NOTATIONS: readonly SwimlaneActivityNodeNotation[] = [
  "action",
  "objectNode",
  "decision",
  "merge",
  "fork",
  "join",
] as const;

function parseNotation(raw: string | undefined): SwimlaneActivityNodeNotation | undefined {
  if (!raw) return undefined;
  return NOTATIONS.includes(raw as SwimlaneActivityNodeNotation)
    ? (raw as SwimlaneActivityNodeNotation)
    : undefined;
}

function mergeLayout(
  raw: Record<string, unknown> | null
): typeof swimlaneActivityLayout {
  const out = { ...swimlaneActivityLayout };
  if (!raw || typeof raw !== "object") return out;
  const keys = [
    "laneWidth",
    "poolHeight",
    "poolHeaderHeight",
    "laneHeaderHeight",
    "poolBottomPadding",
    "actionWidth",
    "actionHeight",
    "objectNodeWidth",
    "objectNodeHeight",
    "diamondNodeSize",
    "syncBarWidth",
    "syncBarHeight",
    "initialNodeSize",
    "activityFinalNodeSize",
  ] as const;
  for (const k of keys) {
    const v = raw[k];
    if (typeof v === "number" && Number.isFinite(v)) {
      (out as Record<string, number>)[k] = v;
    }
  }
  return out;
}

function nodeWidthForNotation(
  notation: SwimlaneActivityNodeNotation | undefined,
  layout: typeof swimlaneActivityLayout
): number {
  if (notation === "objectNode") return layout.objectNodeWidth;
  if (notation === "decision" || notation === "merge") {
    return layout.diamondNodeSize;
  }
  if (notation === "fork" || notation === "join") {
    return layout.syncBarWidth;
  }
  return layout.actionWidth;
}

function actionEffectiveWidth(
  a: ProjectFlowSwimlane["actions"][number],
  notation: SwimlaneActivityNodeNotation | undefined,
  layout: typeof swimlaneActivityLayout
): number {
  if (typeof a.width === "number" && Number.isFinite(a.width) && a.width > 0) {
    return a.width;
  }
  return nodeWidthForNotation(notation, layout);
}

function laneIdFromCenterX(
  centerX: number,
  lanes: ProjectFlowSwimlane["lanes"]
): string {
  const resolved = resolveSwimlaneLaneGeometry(
    lanes.map((l) => ({ id: l.id, title: l.title, width: l.width, xLeft: l.xLeft, xCenter: l.xCenter, xRight: l.xRight }))
  );
  for (let i = 0; i < resolved.length; i++) {
    const lane = resolved[i]!;
    const left = lane.xLeft ?? 0;
    const right =
      lane.xRight ?? left + (lane.width ?? swimlaneActivityLayout.laneWidth);
    const isLast = i === resolved.length - 1;
    if (centerX >= left && (centerX < right || (isLast && centerX <= right))) {
      return lane.id;
    }
  }
  if (resolved.length === 0) return "";
  const idx = Math.min(
    resolved.length - 1,
    Math.max(0, Math.floor(centerX / swimlaneActivityLayout.laneWidth))
  );
  return resolved[idx]!.id;
}

function laneIdFromNodeX(
  positionX: number,
  nodeWidth: number,
  lanes: ProjectFlowSwimlane["lanes"]
): string {
  const centerX = swimlaneCenterXFromPosition(positionX, nodeWidth);
  return laneIdFromCenterX(centerX, lanes);
}

function laneIndexFor(swimlane: ProjectFlowSwimlane, laneId: string): number {
  const i = swimlane.lanes.findIndex((l) => l.id === laneId);
  return i >= 0 ? i : 0;
}

function swimlaneLanesToPutGeometry(
  lanes: ProjectFlowSwimlane["lanes"]
): ProjectFlowSwimlaneLane[] {
  const resolved = resolveSwimlaneLaneGeometry(
    lanes.map(
      (l): SwimlaneLane => ({
        id: l.id,
        title: l.title,
        ...(typeof l.width === "number" && Number.isFinite(l.width) && l.width > 0
          ? { width: l.width }
          : {}),
        ...(typeof l.xLeft === "number" && Number.isFinite(l.xLeft) ? { xLeft: l.xLeft } : {}),
        ...(typeof l.xCenter === "number" && Number.isFinite(l.xCenter)
          ? { xCenter: l.xCenter }
          : {}),
        ...(typeof l.xRight === "number" && Number.isFinite(l.xRight)
          ? { xRight: l.xRight }
          : {}),
      })
    )
  );
  return resolved.map((l) => ({
    id: l.id,
    title: l.title.trim() || l.id,
    ...(typeof l.width === "number" && Number.isFinite(l.width) && l.width > 0
      ? { width: l.width }
      : {}),
    ...(typeof l.xLeft === "number" && Number.isFinite(l.xLeft) ? { xLeft: l.xLeft } : {}),
    ...(typeof l.xCenter === "number" && Number.isFinite(l.xCenter)
      ? { xCenter: l.xCenter }
      : {}),
    ...(typeof l.xRight === "number" && Number.isFinite(l.xRight) ? { xRight: l.xRight } : {}),
  }));
}

function actionNotation(
  swimlane: ProjectFlowSwimlane,
  actionId: string
): SwimlaneActivityNodeNotation | undefined {
  const a = swimlane.actions.find((x) => x.id === actionId);
  return parseNotation(a?.notation);
}

/** Tọa độ `y` (top) của node trong payload swimlane; `null` nếu id không khớp. */
function nodeTopY(swimlane: ProjectFlowSwimlane, nodeId: string): number | null {
  if (nodeId === swimlane.initialNode.id) return swimlane.initialNode.y;
  if (nodeId === swimlane.activityFinalNode.id) return swimlane.activityFinalNode.y;
  const a = swimlane.actions.find((x) => x.id === nodeId);
  return a ? a.y : null;
}

function nodeLaneIndex(swimlane: ProjectFlowSwimlane, nodeId: string): number | null {
  if (nodeId === swimlane.initialNode.id) {
    return laneIndexFor(swimlane, swimlane.initialNode.laneId);
  }
  if (nodeId === swimlane.activityFinalNode.id) {
    return laneIndexFor(swimlane, swimlane.activityFinalNode.laneId);
  }
  const a = swimlane.actions.find((x) => x.id === nodeId);
  return a ? laneIndexFor(swimlane, a.laneId) : null;
}

function targetTopHandleForNotation(
  tgtNotation: SwimlaneActivityNodeNotation | undefined
): "top-target" | "top-left-target" {
  return tgtNotation === "join" ? "top-left-target" : "top-target";
}

/** BE có thể gửi rút gọn (`right`, `bottom`) — id handle trên node là `right-source` / `bottom-source`, v.v. */
const WIRE_SOURCE_HANDLE_ALIASES: Record<string, string> = {
  top: "top-source",
  bottom: "bottom-source",
  left: "left-source",
  right: "right-source",
  "bottom-left": "bottom-left-source",
  "bottom-right": "bottom-right-source",
};

const WIRE_TARGET_HANDLE_ALIASES: Record<string, string> = {
  top: "top-target",
  bottom: "bottom-target",
  left: "left-target",
  right: "right-target",
  "top-left": "top-left-target",
  "top-right": "top-right-target",
};

function normalizeWireHandleId(
  role: "source" | "target",
  raw: string | undefined
): string | undefined {
  if (raw == null) return undefined;
  const t = raw.trim().toLowerCase();
  if (!t) return undefined;
  if (t.includes("-") && (t.endsWith("-source") || t.endsWith("-target"))) {
    return t;
  }
  const fromWire = swimlaneWireHandleToRfId(role, raw);
  if (fromWire) return fromWire;
  if (role === "source") return WIRE_SOURCE_HANDLE_ALIASES[t];
  return WIRE_TARGET_HANDLE_ALIASES[t];
}

/**
 * Fork chỉ có `bottom-left-source` / `bottom-right-source` (không có `right-source`).
 * Khi sang lane khác, khối cross-lane chung cũ gán `right-source` → React Flow bắt nhầm handle → dây vẽ sai (vd. như nối từ fork xuống tận end).
 */
function forkCrossLaneSourceHandle(
  srcLane: number,
  tgtLane: number
): "bottom-left-source" | "bottom-right-source" {
  const delta = tgtLane - srcLane;
  if (delta > 0) return delta === 1 ? "bottom-left-source" : "bottom-right-source";
  if (delta < 0) return delta === -1 ? "bottom-right-source" : "bottom-left-source";
  return "bottom-left-source";
}

/** Hai nhánh song song cùng lane: tách handle theo target (ổn định). */
function forkSameLaneSourceHandle(targetId: string): "bottom-left-source" | "bottom-right-source" {
  let h = 0;
  for (let i = 0; i < targetId.length; i++) h = (h * 31 + targetId.charCodeAt(i)) | 0;
  return (h & 1) === 0 ? "bottom-left-source" : "bottom-right-source";
}

/**
 * BE có thể không gửi handle trên `flows[]`; nếu để trống, React Flow tự chọn giữa
 * nhiều Handle cùng node → dây có thể nối sai. Gán handle mặc định theo lane + `y`
 * (và ngoại lệ fork/join — fork/join không dùng rule cross-lane `right-source`/`left-source`).
 */
function inferFlowHandles(
  swimlane: ProjectFlowSwimlane,
  source: string,
  target: string
): Pick<SwimlaneControlFlow, "sourceHandle" | "targetHandle"> {
  const srcY = nodeTopY(swimlane, source);
  const tgtY = nodeTopY(swimlane, target);
  const srcLane = nodeLaneIndex(swimlane, source);
  const tgtLane = nodeLaneIndex(swimlane, target);
  if (srcY == null || tgtY == null || srcLane == null || tgtLane == null) {
    return {};
  }

  const srcNotation =
    source === swimlane.initialNode.id || source === swimlane.activityFinalNode.id
      ? undefined
      : actionNotation(swimlane, source);
  const tgtNotation =
    target === swimlane.initialNode.id || target === swimlane.activityFinalNode.id
      ? undefined
      : actionNotation(swimlane, target);

  const dy = tgtY - srcY;

  if (srcNotation === "fork" && srcLane !== tgtLane) {
    const tgtHandle =
      tgtNotation === "join" ? ("top-left-target" as const) : ("top-target" as const);
    return {
      sourceHandle: forkCrossLaneSourceHandle(srcLane, tgtLane),
      targetHandle: tgtHandle,
    };
  }

  if (srcNotation === "join" && srcLane !== tgtLane) {
    return {
      sourceHandle: "bottom-source",
      targetHandle: targetTopHandleForNotation(tgtNotation),
    };
  }

  if (srcLane !== tgtLane) {
    if (tgtNotation === "join") {
      return { sourceHandle: "bottom-source", targetHandle: "top-left-target" };
    }
    if (tgtLane > srcLane) {
      return { sourceHandle: "right-source", targetHandle: "left-target" };
    }
    if (tgtLane < srcLane) {
      return { sourceHandle: "left-source", targetHandle: "right-target" };
    }
  }

  if (srcNotation === "fork") {
    const tgtHandle =
      tgtNotation === "join" ? ("top-left-target" as const) : ("top-target" as const);
    return {
      sourceHandle: forkSameLaneSourceHandle(target),
      targetHandle: tgtHandle,
    };
  }

  if (tgtNotation === "join" && dy < -12) {
    return { sourceHandle: "bottom-source", targetHandle: "top-left-target" };
  }

  if (srcNotation === "join") {
    return {
      sourceHandle: "bottom-source",
      targetHandle: targetTopHandleForNotation(tgtNotation),
    };
  }

  if (tgtNotation === "fork" && dy < -12) {
    return { sourceHandle: "bottom-source", targetHandle: "top-target" };
  }

  if (dy > 12) {
    return {
      sourceHandle: "bottom-source",
      targetHandle: targetTopHandleForNotation(tgtNotation),
    };
  }
  if (dy < -12) {
    if (tgtNotation === "join") {
      return { sourceHandle: "bottom-source", targetHandle: "top-left-target" };
    }
    return { sourceHandle: "top-source", targetHandle: "bottom-target" };
  }

  return {
    sourceHandle: "bottom-source",
    targetHandle: targetTopHandleForNotation(tgtNotation),
  };
}

/** Swimlane mặc định khi BE chưa trả `swimlane` (PUT lần đầu để persist). */
export function defaultSwimlaneForFlow(
  flowId: string,
  title: string
): ProjectFlowSwimlane {
  const laneId = "lane-1";
  return {
    id: `${flowId}-swimlane`,
    title: title.trim() || "Activity",
    layout: null,
    lanes: [{ id: laneId, title: "Lane 1" }],
    actions: [],
    initialNode: {
      id: `${flowId}-event-initial`,
      laneId,
      y: 96,
    },
    activityFinalNode: {
      id: `${flowId}-event-final`,
      laneId,
      y: 420,
    },
    flows: [],
  };
}

export function projectFlowSwimlaneToDiagramConfig(
  swimlane: ProjectFlowSwimlane
): SwimlaneActivityDiagramConfig {
  const layoutPartial =
    swimlane.layout && typeof swimlane.layout === "object"
      ? (swimlane.layout as SwimlaneActivityDiagramConfig["layout"])
      : undefined;

  return {
    id: swimlane.id.trim() || "swimlane",
    title: swimlane.title.trim() || "Activity",
    lanes: swimlane.lanes.map(
      (l): SwimlaneLane => ({
        id: l.id,
        title: l.title.trim() || l.id,
        ...(typeof l.width === "number" && Number.isFinite(l.width) && l.width > 0
          ? { width: l.width }
          : {}),
        ...(typeof l.xLeft === "number" && Number.isFinite(l.xLeft) ? { xLeft: l.xLeft } : {}),
        ...(typeof l.xCenter === "number" && Number.isFinite(l.xCenter)
          ? { xCenter: l.xCenter }
          : {}),
        ...(typeof l.xRight === "number" && Number.isFinite(l.xRight)
          ? { xRight: l.xRight }
          : {}),
      })
    ),
    initialNode: { ...swimlane.initialNode },
    activityFinalNode: { ...swimlane.activityFinalNode },
    actions: swimlane.actions.map((a) => ({
      id: a.id,
      laneId: a.laneId,
      label: a.label,
      y: a.y,
      ...(typeof a.x === "number" && Number.isFinite(a.x) ? { x: a.x } : {}),
      ...(typeof a.width === "number" && Number.isFinite(a.width) && a.width > 0
        ? { width: a.width }
        : {}),
      ...(typeof a.height === "number" && Number.isFinite(a.height) && a.height > 0
        ? { height: a.height }
        : {}),
      ...(typeof a.index === "number" ? { index: a.index } : {}),
      notation: parseNotation(a.notation),
    })),
    flows: swimlane.flows.map((f) => {
      const inferred = inferFlowHandles(swimlane, f.source, f.target);
      const flow: SwimlaneControlFlow = {
        id: f.id,
        source: f.source,
        target: f.target,
        flowType: f.flowType,
      };
      const wireSh = normalizeWireHandleId("source", f.sourceHandle);
      const wireTh = normalizeWireHandleId("target", f.targetHandle);
      if (wireSh) {
        flow.sourceHandle = wireSh as SwimlaneControlFlow["sourceHandle"];
      } else if (inferred.sourceHandle) {
        flow.sourceHandle = inferred.sourceHandle;
      }
      if (wireTh) {
        flow.targetHandle = wireTh as SwimlaneControlFlow["targetHandle"];
      } else if (inferred.targetHandle) {
        flow.targetHandle = inferred.targetHandle;
      }
      const lab = f.label?.trim();
      if (lab) flow.label = lab;
      const g = f.guard?.trim();
      if (g) flow.guard = g;
      if (
        f.labelOffset != null &&
        Number.isFinite(f.labelOffset.x) &&
        Number.isFinite(f.labelOffset.y)
      ) {
        flow.labelOffset = { x: f.labelOffset.x, y: f.labelOffset.y };
      }
      if (f.waypoints != null && f.waypoints.length > 0) {
        flow.waypoints = f.waypoints.map((p) => ({ x: p.x, y: p.y }));
      }
      return flow;
    }),
    ...(layoutPartial ? { layout: layoutPartial } : {}),
  };
}

/** Gộp vị trí node từ React Flow vào payload PUT swimlane (giữ flows / label như bản gốc). */
export function applyReactFlowNodesToProjectFlowSwimlane(
  nodes: Node[],
  base: ProjectFlowSwimlane
): ProjectFlowSwimlane {
  const layout = mergeLayout(base.layout);

  const nextActions = base.actions.map((a) => {
    const n = nodes.find((x) => x.id === a.id && x.type === "swimlaneAction");
    if (!n || n.type !== "swimlaneAction") return a;
    const data = n.data as {
      notation?: string;
      index?: number;
      width?: number;
      height?: number;
    };
    const notationFromNode = parseNotation(data.notation);
    const notationForLayout =
      notationFromNode ?? parseNotation(a.notation);
    const nw =
      typeof data.width === "number" && Number.isFinite(data.width) && data.width > 0
        ? data.width
        : actionEffectiveWidth(a, notationForLayout, layout);
    const nh =
      typeof data.height === "number" && Number.isFinite(data.height) && data.height > 0
        ? data.height
        : undefined;
    const laneId = laneIdFromNodeX(n.position.x, nw, base.lanes);
    const resolvedLane = laneId || a.laneId;
    const idx =
      typeof data.index === "number" && Number.isFinite(data.index)
        ? data.index
        : a.index;
    return {
      ...a,
      laneId: resolvedLane,
      y: Math.round(n.position.y),
      x: swimlaneCenterXFromPosition(n.position.x, nw),
      width: nw,
      ...(nh != null ? { height: nh } : {}),
      ...(typeof idx === "number" ? { index: idx } : {}),
      ...(notationFromNode != null
        ? { notation: notationFromNode }
        : a.notation != null
          ? { notation: a.notation }
          : {}),
    };
  });

  let initialNode = { ...base.initialNode };
  let activityFinalNode = { ...base.activityFinalNode };

  for (const n of nodes) {
    if (n.type !== "swimlaneEvent" || !n.data || typeof n.data !== "object") continue;
    const kind = (n.data as { kind?: string }).kind;
    if (kind === "initial" && n.id === base.initialNode.id) {
      const evSize = layout.initialNodeSize;
      const laneId = laneIdFromNodeX(n.position.x, evSize, base.lanes);
      const resolvedLane = laneId || base.initialNode.laneId;
      initialNode = {
        ...base.initialNode,
        laneId: resolvedLane,
        y: Math.round(n.position.y),
        x: swimlaneCenterXFromPosition(n.position.x, evSize),
      };
    }
    if (kind === "activityFinal" && n.id === base.activityFinalNode.id) {
      const evSize = layout.activityFinalNodeSize;
      const laneId = laneIdFromNodeX(n.position.x, evSize, base.lanes);
      const resolvedLane = laneId || base.activityFinalNode.laneId;
      activityFinalNode = {
        ...base.activityFinalNode,
        laneId: resolvedLane,
        y: Math.round(n.position.y),
        x: swimlaneCenterXFromPosition(n.position.x, evSize),
      };
    }
  }

  const lanes = swimlaneLanesToPutGeometry(base.lanes);

  return {
    ...base,
    lanes,
    actions: nextActions,
    initialNode,
    activityFinalNode,
    layout: null,
  };
}

function mergeReactFlowEdgesIntoSwimlane(
  edges: Edge[],
  base: ProjectFlowSwimlane
): ProjectFlowSwimlane {
  const byId = new Map(edges.map((e) => [e.id, e]));
  const flows = base.flows.map((f) => {
    const e =
      byId.get(f.id) ??
      edges.find((x) => x.source === f.source && x.target === f.target);
    if (!e) return f;
    const d = (e.data ?? {}) as {
      guard?: string;
      edgeLabel?: string;
      labelOffset?: { x: number; y: number };
      waypoints?: SwimlaneWaypoint[];
    };
    const next: ProjectFlowSwimlaneFlow = { ...f };

    if (e.sourceHandle != null && String(e.sourceHandle).trim() !== "") {
      const w = swimlaneRfHandleIdToWireHandle("source", String(e.sourceHandle));
      if (w) next.sourceHandle = w;
    }
    if (e.targetHandle != null && String(e.targetHandle).trim() !== "") {
      const w = swimlaneRfHandleIdToWireHandle("target", String(e.targetHandle));
      if (w) next.targetHandle = w;
    }

    if (d.waypoints != null && d.waypoints.length > 0) {
      const wp = d.waypoints.filter(
        (p) => Number.isFinite(p.x) && Number.isFinite(p.y)
      );
      if (wp.length > 0) next.waypoints = wp;
      else delete next.waypoints;
    } else {
      delete next.waypoints;
    }

    if (
      d.labelOffset != null &&
      Number.isFinite(d.labelOffset.x) &&
      Number.isFinite(d.labelOffset.y)
    ) {
      if (d.labelOffset.x === 0 && d.labelOffset.y === 0) {
        delete next.labelOffset;
      } else {
        next.labelOffset = { x: d.labelOffset.x, y: d.labelOffset.y };
      }
    }

    if (d.guard != null && String(d.guard).trim() !== "") {
      next.guard = String(d.guard).trim();
    } else if (d.guard === "") {
      delete next.guard;
    }

    if (d.edgeLabel != null && String(d.edgeLabel).trim() !== "") {
      next.label = String(d.edgeLabel).trim();
    } else if (d.edgeLabel === "") {
      delete next.label;
    }

    return next;
  });
  return { ...base, flows };
}

/** Gộp node + edge (handle, guard/label, label_offset) trước PUT swimlane. */
export function applyReactFlowLayoutToProjectFlowSwimlane(
  nodes: Node[],
  edges: Edge[],
  base: ProjectFlowSwimlane
): ProjectFlowSwimlane {
  const withNodes = applyReactFlowNodesToProjectFlowSwimlane(nodes, base);
  return mergeReactFlowEdgesIntoSwimlane(edges, withNodes);
}
