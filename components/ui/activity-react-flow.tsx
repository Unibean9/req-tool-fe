"use client";

import { useLayoutEffect, useMemo } from "react";
import {
  BaseEdge,
  MarkerType,
  NodeResizer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
  type EdgeTypes,
} from "@xyflow/react";

import { cn } from "@/lib/utils";

import {
  requestSwimlaneEdgeContextMenu,
  useSwimlaneFlowEditor,
} from "./activityFlowEditorContext";

import {
  Handle,
  Position,
  defaultReactFlowCanvasProps,
  reactFlowCanvasClassName,
  reactFlowControlsClassName,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "./react-flow";

/** Khóa trong `config.layout` — map `nodeId → delta X` so với tâm lane (persist qua PUT `layout`). */
export const SWIMLANE_LAYOUT_NODE_OFFSET_X = "swimlaneNodeOffsetX";

/** Khớp lane width / kích thước node gợi ý từ BE auto-layout (lane_width = 300px). */
export const swimlaneActivityLayout = {
  laneWidth: 300,
  poolHeight: 640,
  poolHeaderHeight: 36,
  laneHeaderHeight: 36,
  poolBottomPadding: 120,
  actionWidth: 200,
  actionHeight: 60,
  objectNodeWidth: 180,
  objectNodeHeight: 70,
  diamondNodeSize: 80,
  syncBarWidth: 160,
  syncBarHeight: 20,
  initialNodeSize: 32,
  activityFinalNodeSize: 48,
} as const;

type SwimlaneActivityLayout = Record<keyof typeof swimlaneActivityLayout, number>;

/** Cùng trục X/Y trong ngưỡng này → vẽ một đoạn thẳng, không step. */
const SWIMLANE_AXIS_ALIGN_PX = 6;

export const swimlaneReactFlowCanvasProps = {
  ...defaultReactFlowCanvasProps,
  fitViewOptions: { padding: 0.1 },
  minZoom: 0.35,
  maxZoom: 1.2,
  nodesDraggable: true,
  nodesConnectable: true,
  elementsSelectable: true,
  /** Chuột trái: node / waypoint / nhãn dây. Giữ Space + kéo để pan canvas. */
  panOnDrag: false,
  panActivationKeyCode: "Space",
  zoomOnScroll: true,
  panOnScroll: true,
} as const;

export {
  SwimlaneFlowEditorProvider,
  requestSwimlaneEdgeContextMenu,
  useSwimlaneFlowEditor,
} from "./activityFlowEditorContext";
export type {
  SwimlaneEdgeDragSnapshot,
  SwimlaneFlowEditorContextValue,
} from "./activityFlowEditorContext";
export { SwimlaneEdgeHandlesLayer } from "./activityEdgeHandlesLayer";

export const swimlaneReactFlowClassName = cn(
  reactFlowCanvasClassName,
  "h-full bg-background [&_.react-flow__attribution]:hidden"
);

export const swimlaneReactFlowControlsClassName = reactFlowControlsClassName;

export const swimlaneControlFlowEdgeDefaults = {
  type: "swimlaneEditable",
  selectable: true,
  focusable: true,
  markerEnd: { type: MarkerType.ArrowClosed, color: "var(--foreground)" },
  style: {
    strokeWidth: 1.8,
    stroke: "var(--foreground)",
  },
} satisfies Partial<Edge>;

export type SwimlaneLane = {
  id: string;
  title: string;
  width?: number;
  xLeft?: number;
  xCenter?: number;
  xRight?: number;
};

export type SwimlanePoolData = {
  title: string;
  lanes: SwimlaneLane[];
};

export type SwimlaneActionData = {
  index?: number;
  label: string;
  notation?: SwimlaneActivityNodeNotation;
  /** Kích thước từ BE / PUT; optional override so với layout mặc định. */
  width?: number;
  height?: number;
};

export type SwimlaneEventData = {
  kind: "initial" | "activityFinal";
};

export type SwimlanePoolNode = Node<SwimlanePoolData, "swimlanePool">;
export type SwimlaneActionNode = Node<SwimlaneActionData, "swimlaneAction">;
export type SwimlaneEventNode = Node<SwimlaneEventData, "swimlaneEvent">;
export type SwimlaneNode =
  | SwimlanePoolNode
  | SwimlaneActionNode
  | SwimlaneEventNode;

export type SwimlaneActivityAction = {
  id: string;
  laneId: string;
  label: string;
  index?: number;
  notation?: SwimlaneActivityNodeNotation;
  y: number;
  /** Tâm X trong pool (BE: `x` = lane center). */
  x?: number;
  width?: number;
  height?: number;
};

export type SwimlaneActivityEvent = {
  id: string;
  laneId: string;
  y: number;
  x?: number;
};

export type SwimlaneWaypoint = { x: number; y: number };

export type SwimlaneControlFlow = {
  id?: string;
  source: string;
  target: string;
  sourceHandle?: SwimlaneHandleId;
  targetHandle?: SwimlaneHandleId;
  /** Tên edge (override). */
  label?: string;
  /** Điều kiện nhánh (BE `guard`) — hiển thị nếu không có `label`. */
  guard?: string;
  flowType?: "control" | "object";
  labelOffset?: { x: number; y: number };
  /** Điểm gấp khúc tuyệt đối trong pool; bỏ trống = auto-route theo handle. */
  waypoints?: SwimlaneWaypoint[];
};

export type SwimlaneActivityDiagramConfig = {
  id: string;
  title: string;
  lanes: SwimlaneLane[];
  initialNode: SwimlaneActivityEvent;
  activityFinalNode: SwimlaneActivityEvent;
  actions: SwimlaneActivityAction[];
  flows: SwimlaneControlFlow[];
  layout?: Partial<SwimlaneActivityLayout>;
};

export type SwimlaneActivityDiagram = {
  graphKey: string;
  nodes: SwimlaneNode[];
  edges: Edge[];
};

type SwimlaneHandleId =
  | "top-target"
  | "top-source"
  | "top-left-target"
  | "top-right-target"
  | "bottom-target"
  | "bottom-source"
  | "bottom-left-source"
  | "bottom-right-source"
  | "left-target"
  | "left-source"
  | "right-target"
  | "right-source";

export type SwimlaneActivityNodeNotation =
  | "action"
  | "objectNode"
  | "decision"
  | "merge"
  | "fork"
  | "join";

function SwimlaneHandles() {
  return (
    <>
      <Handle
        id="top-target"
        type="target"
        position={Position.Top}
        className="size-2! opacity-0"
      />
      <Handle
        id="top-source"
        type="source"
        position={Position.Top}
        className="size-2! opacity-0"
      />
      <Handle
        id="bottom-target"
        type="target"
        position={Position.Bottom}
        className="size-2! opacity-0"
      />
      <Handle
        id="bottom-source"
        type="source"
        position={Position.Bottom}
        className="size-2! opacity-0"
      />
      <Handle
        id="left-target"
        type="target"
        position={Position.Left}
        className="size-2! opacity-0"
      />
      <Handle
        id="left-source"
        type="source"
        position={Position.Left}
        className="size-2! opacity-0"
      />
      <Handle
        id="right-target"
        type="target"
        position={Position.Right}
        className="size-2! opacity-0"
      />
      <Handle
        id="right-source"
        type="source"
        position={Position.Right}
        className="size-2! opacity-0"
      />
    </>
  );
}

function SwimlanePoolNode({ data, selected }: NodeProps<SwimlanePoolNode>) {
  return (
    <div className="pointer-events-none h-full w-full overflow-hidden border-2 border-foreground bg-transparent text-foreground">
      <NodeResizer
        isVisible={selected}
        minWidth={360}
        minHeight={300}
        lineClassName="!border-primary"
        handleClassName="pointer-events-auto !size-2.5 !border-primary !bg-background"
      />
      <div className="flex h-9 items-center justify-center border-b-2 border-foreground bg-muted/20 px-3 text-sm font-semibold">
        {data.title}
      </div>
      <div
        className="grid h-9 border-b-2 border-foreground bg-muted/10"
        style={{
          gridTemplateColumns: data.lanes
            .map((lane) => `${lane.width ?? swimlaneActivityLayout.laneWidth}px`)
            .join(" "),
        }}
      >
        {data.lanes.map((lane, index) => (
          <div
            key={lane.id}
            className={cn(
              "flex items-center justify-center px-3 text-sm font-semibold",
              index > 0 && "border-l-2 border-foreground"
            )}
          >
            {lane.title}
          </div>
        ))}
      </div>
      <div className="relative h-[calc(100%-4.5rem)]">
        {data.lanes.slice(1).map((lane) => {
          const left = lane.xLeft;
          if (typeof left !== "number" || !Number.isFinite(left)) return null;
          return (
            <span
              key={lane.id}
              className="absolute top-0 bottom-0 border-l-2 border-foreground"
              style={{ left }}
              aria-hidden
            />
          );
        })}
      </div>
    </div>
  );
}

function SwimlaneForkJoinHandles({ kind }: { kind: "fork" | "join" }) {
  const handleClassName = "size-2! opacity-0";

  if (kind === "fork") {
    return (
      <>
        <Handle
          id="top-target"
          type="target"
          position={Position.Top}
          className={handleClassName}
        />
        <Handle
          id="bottom-left-source"
          type="source"
          position={Position.Bottom}
          className={handleClassName}
          style={{ left: "25%" }}
        />
        <Handle
          id="bottom-right-source"
          type="source"
          position={Position.Bottom}
          className={handleClassName}
          style={{ left: "75%" }}
        />
      </>
    );
  }

  return (
    <>
      <Handle
        id="top-left-target"
        type="target"
        position={Position.Top}
        className={handleClassName}
        style={{ left: "25%" }}
      />
      <Handle
        id="top-right-target"
        type="target"
        position={Position.Top}
        className={handleClassName}
        style={{ left: "75%" }}
      />
      <Handle
        id="bottom-source"
        type="source"
        position={Position.Bottom}
        className={handleClassName}
      />
    </>
  );
}

function SwimlaneActionNode({ data }: NodeProps<SwimlaneActionNode>) {
  const notation = data.notation ?? "action";

  if (notation === "fork" || notation === "join") {
    const w =
      typeof data.width === "number" && Number.isFinite(data.width) && data.width > 0
        ? data.width
        : swimlaneActivityLayout.syncBarWidth;
    const h =
      typeof data.height === "number" && Number.isFinite(data.height) && data.height > 0
        ? data.height
        : swimlaneActivityLayout.syncBarHeight;
    return (
      <div className="relative flex items-center justify-center" style={{ width: w, height: h }}>
        <SwimlaneForkJoinHandles kind={notation} />
        <span
          className="block rounded-sm bg-foreground"
          style={{ width: w, height: h }}
          aria-hidden
        />
      </div>
    );
  }

  if (notation === "decision" || notation === "merge") {
    const s = swimlaneActivityLayout.diamondNodeSize;
    return (
      <div
        className="relative flex items-center justify-center"
        style={{ width: s, height: s }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center border-2 border-foreground bg-sky-300"
          style={{
            clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
          }}
        >
          <span
            className={cn(
              "line-clamp-6 max-h-[80%] min-w-0 max-w-[58%] overflow-hidden wrap-break-word px-1 text-center",
              "text-[9px] font-bold leading-snug text-slate-950 wrap-anywhere"
            )}
          >
            {data.label}
          </span>
        </div>
        <div className="relative z-10 h-full w-full">
          <SwimlaneHandles />
        </div>
      </div>
    );
  }

  if (notation === "objectNode") {
    const w =
      typeof data.width === "number" && Number.isFinite(data.width) && data.width > 0
        ? data.width
        : swimlaneActivityLayout.objectNodeWidth;
    const h =
      typeof data.height === "number" && Number.isFinite(data.height) && data.height > 0
        ? data.height
        : swimlaneActivityLayout.objectNodeHeight;
    return (
      <div
        className="relative flex items-center justify-center border-2 border-foreground bg-sky-300 px-3 text-center text-slate-950 shadow-sm"
        style={{ width: w, height: h }}
      >
        <SwimlaneHandles />
        <p className="text-sm font-bold leading-snug">{data.label}</p>
      </div>
    );
  }

  return (
    <div
      className="relative flex items-center justify-center rounded-xl border-2 border-foreground bg-sky-300 px-5 text-center text-slate-950 shadow-sm"
      style={{
        width:
          typeof data.width === "number" && Number.isFinite(data.width) && data.width > 0
            ? data.width
            : swimlaneActivityLayout.actionWidth,
        height:
          typeof data.height === "number" && Number.isFinite(data.height) && data.height > 0
            ? data.height
            : swimlaneActivityLayout.actionHeight,
      }}
    >
      <SwimlaneHandles />
      <div>
        {typeof data.index === "number" ? (
          <p className="text-xs font-bold tabular-nums text-slate-700">
            Action {data.index}
          </p>
        ) : null}
        <p className="mt-1 text-sm font-bold leading-snug">{data.label}</p>
      </div>
    </div>
  );
}

function SwimlaneEventNode({ data }: NodeProps<SwimlaneEventNode>) {
  const isFinal = data.kind === "activityFinal";
  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-full bg-background",
        isFinal ? "size-12 border-2 border-foreground" : "size-8"
      )}
    >
      <SwimlaneHandles />
      <span
        className={cn(
          "rounded-full bg-foreground",
          isFinal ? "size-6" : "size-5"
        )}
        aria-hidden
      />
    </div>
  );
}

function dedupeNearPolylinePoints(
  pts: SwimlaneWaypoint[],
  epsilon = 1
): SwimlaneWaypoint[] {
  const out: SwimlaneWaypoint[] = [];
  for (const p of pts) {
    const last = out[out.length - 1];
    if (
      last &&
      Math.abs(last.x - p.x) <= epsilon &&
      Math.abs(last.y - p.y) <= epsilon
    ) {
      continue;
    }
    out.push(p);
  }
  return out;
}

function parseSvgPathPoints(path: string): SwimlaneWaypoint[] {
  const pts: SwimlaneWaypoint[] = [];
  const re = /[ML]\s*(-?\d*\.?\d+)\s*[, ]\s*(-?\d*\.?\d+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(path))) {
    pts.push({ x: Number(m[1]), y: Number(m[2]) });
  }
  return dedupeNearPolylinePoints(pts);
}

/** Điểm gấc khúc nội bộ từ path auto (bỏ đầu/cuối = anchor handle). */
export function extractInteriorWaypointsFromAutoPath(path: string): SwimlaneWaypoint[] {
  const pts = parseSvgPathPoints(path);
  if (pts.length <= 2) return [];
  return pts.slice(1, -1);
}

/** Polyline auto-route (đầu → các góc → cuối) — khớp từng nhánh `getSwimlaneEdgePath`. */
export function getSwimlaneAutoPolylinePoints(
  geometry: SwimlaneEdgeGeometry
): SwimlaneWaypoint[] {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition } =
    geometry;
  const src = { x: sourceX, y: sourceY };
  const tgt = { x: targetX, y: targetY };
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;

  if (Math.abs(dx) <= SWIMLANE_AXIS_ALIGN_PX && Math.abs(dy) > SWIMLANE_AXIS_ALIGN_PX) {
    return [src, tgt];
  }

  if (Math.abs(dy) <= SWIMLANE_AXIS_ALIGN_PX && Math.abs(dx) > SWIMLANE_AXIS_ALIGN_PX) {
    return [src, tgt];
  }

  if (
    sourcePosition === Position.Bottom &&
    targetPosition === Position.Top &&
    dy > SWIMLANE_AXIS_ALIGN_PX
  ) {
    const midY = (sourceY + targetY) / 2;
    return [src, { x: sourceX, y: midY }, { x: targetX, y: midY }, tgt];
  }

  if (
    sourcePosition === Position.Top &&
    targetPosition === Position.Bottom &&
    dy < -SWIMLANE_AXIS_ALIGN_PX
  ) {
    const midY = (sourceY + targetY) / 2;
    return [src, { x: sourceX, y: midY }, { x: targetX, y: midY }, tgt];
  }

  if (
    sourcePosition === Position.Right &&
    targetPosition === Position.Left &&
    dx < -SWIMLANE_AXIS_ALIGN_PX
  ) {
    const midX = (sourceX + targetX) / 2;
    return [src, { x: midX, y: sourceY }, { x: midX, y: targetY }, tgt];
  }

  if (
    sourcePosition === Position.Left &&
    targetPosition === Position.Right &&
    dx > SWIMLANE_AXIS_ALIGN_PX
  ) {
    const midX = (sourceX + targetX) / 2;
    return [src, { x: midX, y: sourceY }, { x: midX, y: targetY }, tgt];
  }

  if (sourcePosition === Position.Bottom && targetPosition === Position.Left) {
    return [src, { x: sourceX, y: targetY }, tgt];
  }

  if (sourcePosition === Position.Bottom && targetPosition === Position.Right) {
    return [src, { x: sourceX, y: targetY }, tgt];
  }

  if (sourcePosition === Position.Right && targetPosition === Position.Top) {
    return [src, { x: targetX, y: sourceY }, tgt];
  }

  if (sourcePosition === Position.Left && targetPosition === Position.Top) {
    return [src, { x: targetX, y: sourceY }, tgt];
  }

  const [path] = getSwimlaneEdgePath(geometry);
  const parsed = parseSvgPathPoints(path);
  if (parsed.length >= 2) return parsed;
  return [src, tgt];
}

/** Dây auto chỉ còn đoạn thẳng source→target (không có góc gấc khúc). */
export function isSwimlaneAutoEdgeStraight(geometry: SwimlaneEdgeGeometry): boolean {
  return getSwimlaneAutoPolylinePoints(geometry).length <= 2;
}

/** Đỉnh gấc khúc trên dây auto (không gồm anchor). Dây thẳng → không handle. */
export function getSwimlaneAutoInteriorWaypoints(
  geometry: SwimlaneEdgeGeometry
): SwimlaneWaypoint[] {
  const pts = getSwimlaneAutoPolylinePoints(geometry);
  if (pts.length <= 2) return [];
  return pts.slice(1, -1).map((p) => ({ x: p.x, y: p.y }));
}

export type SwimlaneEdgeGeometry = {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
};

/**
 * Điểm gấc khúc có thể kéo: từ `waypoints` đã lưu, hoặc suy ra từ auto-route.
 * Dây auto thẳng (không góc) → không chấm; double-click dây hoặc kéo sau chỉnh vẫn tạo waypoint.
 */
export function resolveSwimlaneEditableWaypoints(
  stored: SwimlaneWaypoint[] | undefined,
  geometry: SwimlaneEdgeGeometry
): SwimlaneWaypoint[] {
  if (stored != null && stored.length > 0) {
    return stored.map((p) => ({ x: p.x, y: p.y }));
  }
  return getSwimlaneAutoInteriorWaypoints(geometry);
}

export function buildSwimlaneEdgePathFromGeometry(
  geometry: SwimlaneEdgeGeometry,
  stored?: SwimlaneWaypoint[]
): [path: string, labelX: number, labelY: number] {
  if (stored != null && stored.length > 0) {
    return buildSwimlaneEdgeSvgPath({ ...geometry, waypoints: stored });
  }
  return getSwimlaneEdgePath(geometry);
}

export function buildSwimlaneEdgeSvgPath({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  waypoints,
}: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  waypoints?: SwimlaneWaypoint[];
}): [path: string, labelX: number, labelY: number] {
  if (waypoints != null && waypoints.length > 0) {
    const pts = [
      { x: sourceX, y: sourceY },
      ...waypoints,
      { x: targetX, y: targetY },
    ];
    const path = pts
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`)
      .join(" ");
    const mid = waypoints[Math.floor(waypoints.length / 2)]!;
    return [path, mid.x, mid.y];
  }
  return getSwimlaneEdgePath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });
}

function SwimlaneEditableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  label,
  data,
}: EdgeProps) {
  const { publishEdgeSnapshot, removeEdgeSnapshot } = useSwimlaneFlowEditor();
  const { screenToFlowPosition } = useReactFlow();
  const edgeData = (data ?? {}) as {
    labelOffset?: { x: number; y: number };
    waypoints?: SwimlaneWaypoint[];
  };
  const labelOffset = edgeData.labelOffset ?? { x: 0, y: 0 };
  const storedWaypoints = edgeData.waypoints;
  const geometry = useMemo(
    (): SwimlaneEdgeGeometry => ({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
    }),
    [sourcePosition, sourceX, sourceY, targetPosition, targetX, targetY]
  );
  const interiorHandles = useMemo(
    () => resolveSwimlaneEditableWaypoints(storedWaypoints, geometry),
    [storedWaypoints, geometry]
  );
  const [edgePath, labelX, labelY] = useMemo(
    () => buildSwimlaneEdgePathFromGeometry(geometry, storedWaypoints),
    [geometry, storedWaypoints]
  );
  const defaultOffset = defaultEdgeLabelOffset({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  const labelBaseX = labelX + defaultOffset.x;
  const labelBaseY = labelY + defaultOffset.y;

  const handleEdgeContextMenu = (
    event: React.MouseEvent<SVGPathElement, MouseEvent>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const flow = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    requestSwimlaneEdgeContextMenu({
      x: event.clientX,
      y: event.clientY,
      edgeId: id,
      flowX: flow.x,
      flowY: flow.y,
      interior: interiorHandles.map((p) => ({ x: p.x, y: p.y })),
      geometry,
      storedWaypoints: storedWaypoints?.map((p) => ({ x: p.x, y: p.y })),
    });
  };

  useLayoutEffect(() => {
    publishEdgeSnapshot({
      edgeId: id,
      handles: interiorHandles,
      geometry,
      storedWaypoints: storedWaypoints?.map((p) => ({ x: p.x, y: p.y })),
      ...(label
        ? {
            label: {
              x: labelBaseX,
              y: labelBaseY,
              text: String(label),
              offsetX: labelOffset.x,
              offsetY: labelOffset.y,
            },
          }
        : {}),
    });
    return () => removeEdgeSnapshot(id);
  }, [
    geometry,
    id,
    interiorHandles,
    label,
    labelBaseX,
    labelBaseY,
    labelOffset.x,
    labelOffset.y,
    publishEdgeSnapshot,
    removeEdgeSnapshot,
    storedWaypoints,
  ]);

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="react-flow__edge-interaction nopan"
        onContextMenu={handleEdgeContextMenu}
      />
    </>
  );
}

export const swimlaneActivityNodeTypes = {
  swimlanePool: SwimlanePoolNode,
  swimlaneAction: SwimlaneActionNode,
  swimlaneEvent: SwimlaneEventNode,
} satisfies NodeTypes;

export const swimlaneActivityEdgeTypes = {
  swimlaneEditable: SwimlaneEditableEdge,
} satisfies EdgeTypes;

function laneIndexFor(lanes: SwimlaneLane[], laneId: string): number {
  const index = lanes.findIndex((lane) => lane.id === laneId);
  return index >= 0 ? index : 0;
}

/** Chuẩn hóa geometry lane (BE hoặc fallback width cố định). */
export function resolveSwimlaneLaneGeometry(lanes: SwimlaneLane[]): SwimlaneLane[] {
  let cursor = 0;
  const fallbackW = swimlaneActivityLayout.laneWidth;
  return lanes.map((lane) => {
    const width = Math.max(
      280,
      typeof lane.width === "number" && Number.isFinite(lane.width) && lane.width > 0
        ? lane.width
        : fallbackW
    );
    const xLeft =
      typeof lane.xLeft === "number" && Number.isFinite(lane.xLeft) ? lane.xLeft : cursor;
    const xCenter =
      typeof lane.xCenter === "number" && Number.isFinite(lane.xCenter)
        ? lane.xCenter
        : xLeft + width / 2;
    const xRight =
      typeof lane.xRight === "number" && Number.isFinite(lane.xRight)
        ? lane.xRight
        : xLeft + width;
    cursor = xRight;
    return { ...lane, width, xLeft, xCenter, xRight };
  });
}

export function poolWidthFromLanes(lanes: SwimlaneLane[]): number {
  const resolved = resolveSwimlaneLaneGeometry(lanes);
  if (resolved.length === 0) return swimlaneActivityLayout.laneWidth;
  const last = resolved[resolved.length - 1]!;
  return last.xRight ?? swimlaneActivityLayout.laneWidth * resolved.length;
}

/** BE `x` = tâm node → React Flow `position.x` (góc trái). */
export function swimlanePositionXFromCenter(centerX: number, nodeWidth: number): number {
  return Math.round(centerX - nodeWidth / 2);
}

/** React Flow `position.x` → tâm X gửi PUT. */
export function swimlaneCenterXFromPosition(positionX: number, nodeWidth: number): number {
  return Math.round(positionX + nodeWidth / 2);
}

function laneCenteredX({
  lanes,
  laneId,
  nodeWidth,
  fallbackLaneWidth,
}: {
  lanes: SwimlaneLane[];
  laneId: string;
  nodeWidth: number;
  fallbackLaneWidth: number;
}): number {
  const resolved = resolveSwimlaneLaneGeometry(lanes);
  const lane = resolved.find((l) => l.id === laneId);
  if (lane && typeof lane.xCenter === "number") {
    return swimlanePositionXFromCenter(lane.xCenter, nodeWidth);
  }
  const li = laneIndexFor(resolved, laneId);
  return li * fallbackLaneWidth + (fallbackLaneWidth - nodeWidth) / 2;
}

function nodeWidthForNotation(
  notation: SwimlaneActivityNodeNotation | undefined,
  layout: SwimlaneActivityLayout
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

function nodeHeightForNotation(
  notation: SwimlaneActivityNodeNotation | undefined,
  layout: SwimlaneActivityLayout
): number {
  if (notation === "objectNode") return layout.objectNodeHeight;
  if (notation === "decision" || notation === "merge") {
    return layout.diamondNodeSize;
  }
  if (notation === "fork" || notation === "join") {
    return layout.syncBarHeight;
  }
  return layout.actionHeight;
}

function effectiveActionNodeWidth(
  action: SwimlaneActivityAction,
  layout: SwimlaneActivityLayout
): number {
  if (typeof action.width === "number" && Number.isFinite(action.width) && action.width > 0) {
    return action.width;
  }
  return nodeWidthForNotation(action.notation, layout);
}

function effectiveActionNodeHeight(
  action: SwimlaneActivityAction,
  layout: SwimlaneActivityLayout
): number {
  if (typeof action.height === "number" && Number.isFinite(action.height) && action.height > 0) {
    return action.height;
  }
  return nodeHeightForNotation(action.notation, layout);
}

function getSwimlaneEdgePath({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
}): [path: string, labelX: number, labelY: number] {
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;

  if (Math.abs(dx) <= SWIMLANE_AXIS_ALIGN_PX && Math.abs(dy) > SWIMLANE_AXIS_ALIGN_PX) {
    const x = (sourceX + targetX) / 2;
    return [`M ${x},${sourceY} L ${x},${targetY}`, x, (sourceY + targetY) / 2];
  }

  if (Math.abs(dy) <= SWIMLANE_AXIS_ALIGN_PX && Math.abs(dx) > SWIMLANE_AXIS_ALIGN_PX) {
    const y = (sourceY + targetY) / 2;
    return [
      `M ${sourceX},${y} L ${targetX},${y}`,
      (sourceX + targetX) / 2,
      y,
    ];
  }

  if (
    sourcePosition === Position.Bottom &&
    targetPosition === Position.Top &&
    dy > SWIMLANE_AXIS_ALIGN_PX
  ) {
    const midY = (sourceY + targetY) / 2;
    return [
      `M ${sourceX},${sourceY} L ${sourceX},${midY} L ${targetX},${midY} L ${targetX},${targetY}`,
      (sourceX + targetX) / 2,
      midY,
    ];
  }

  if (
    sourcePosition === Position.Top &&
    targetPosition === Position.Bottom &&
    dy < -SWIMLANE_AXIS_ALIGN_PX
  ) {
    const midY = (sourceY + targetY) / 2;
    return [
      `M ${sourceX},${sourceY} L ${sourceX},${midY} L ${targetX},${midY} L ${targetX},${targetY}`,
      (sourceX + targetX) / 2,
      midY,
    ];
  }

  if (
    sourcePosition === Position.Right &&
    targetPosition === Position.Left &&
    dx < -SWIMLANE_AXIS_ALIGN_PX
  ) {
    const midX = (sourceX + targetX) / 2;
    return [
      `M ${sourceX},${sourceY} L ${midX},${sourceY} L ${midX},${targetY} L ${targetX},${targetY}`,
      midX,
      (sourceY + targetY) / 2,
    ];
  }

  if (
    sourcePosition === Position.Left &&
    targetPosition === Position.Right &&
    dx > SWIMLANE_AXIS_ALIGN_PX
  ) {
    const midX = (sourceX + targetX) / 2;
    return [
      `M ${sourceX},${sourceY} L ${midX},${sourceY} L ${midX},${targetY} L ${targetX},${targetY}`,
      midX,
      (sourceY + targetY) / 2,
    ];
  }

  if (sourcePosition === Position.Bottom && targetPosition === Position.Left) {
    return [
      `M ${sourceX},${sourceY} L ${sourceX},${targetY} L ${targetX},${targetY}`,
      (sourceX + targetX) / 2,
      targetY,
    ];
  }

  if (sourcePosition === Position.Bottom && targetPosition === Position.Right) {
    return [
      `M ${sourceX},${sourceY} L ${sourceX},${targetY} L ${targetX},${targetY}`,
      (sourceX + targetX) / 2,
      targetY,
    ];
  }

  if (sourcePosition === Position.Right && targetPosition === Position.Top) {
    return [
      `M ${sourceX},${sourceY} L ${targetX},${sourceY} L ${targetX},${targetY}`,
      targetX,
      (sourceY + targetY) / 2,
    ];
  }

  if (sourcePosition === Position.Left && targetPosition === Position.Top) {
    return [
      `M ${sourceX},${sourceY} L ${targetX},${sourceY} L ${targetX},${targetY}`,
      targetX,
      (sourceY + targetY) / 2,
    ];
  }

  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 0,
    offset: 0,
  });
  return [path, labelX, labelY];
}

function readSwimlaneNodeOffsetX(
  layout: typeof swimlaneActivityLayout & Record<string, unknown>
): Record<string, number> {
  const raw = layout[SWIMLANE_LAYOUT_NODE_OFFSET_X];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
  }
  return out;
}

function defaultEdgeLabelOffset({
  sourceX,
  sourceY,
  targetX,
  targetY,
}: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}): { x: number; y: number } {
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  if (Math.abs(dx) > Math.abs(dy)) {
    return { x: 0, y: dy >= 0 ? -18 : 18 };
  }
  if (Math.abs(dy) > Math.abs(dx)) {
    return { x: dx >= 0 ? 64 : -64, y: 0 };
  }
  return { x: dx >= 0 ? 36 : -36, y: dy >= 0 ? -18 : 18 };
}

export function createSwimlaneActivityDiagram(
  config: SwimlaneActivityDiagramConfig
): SwimlaneActivityDiagram {
  const layout = {
    ...swimlaneActivityLayout,
    ...config.layout,
  } as typeof swimlaneActivityLayout & Record<string, unknown>;
  const nodeOffsetX = readSwimlaneNodeOffsetX(layout);
  const resolvedLanes = resolveSwimlaneLaneGeometry(config.lanes);
  const poolWidth = poolWidthFromLanes(resolvedLanes);
  const maxActionBottom = config.actions.reduce(
    (bottom, action) =>
      Math.max(bottom, action.y + effectiveActionNodeHeight(action, layout)),
    0
  );
  const maxEventBottom = Math.max(
    config.initialNode.y + layout.initialNodeSize,
    config.activityFinalNode.y + layout.activityFinalNodeSize
  );
  const poolHeight = Math.max(
    layout.poolHeight,
    maxActionBottom,
    maxEventBottom
  ) + layout.poolBottomPadding;

  const poolNode: SwimlanePoolNode = {
    id: `${config.id}-pool`,
    type: "swimlanePool",
    position: { x: 0, y: 0 },
    data: {
      title: config.title,
      lanes: resolvedLanes,
    },
    draggable: false,
    selectable: false,
    style: {
      width: poolWidth,
      height: poolHeight,
      zIndex: 0,
      pointerEvents: "none",
    },
  };

  const actionNodes: SwimlaneActionNode[] = config.actions.map((action) => {
    const nw = effectiveActionNodeWidth(action, layout);
    const hasCenterX =
      typeof action.x === "number" && Number.isFinite(action.x);
    const baseX = hasCenterX
      ? swimlanePositionXFromCenter(action.x!, nw)
      : laneCenteredX({
          lanes: resolvedLanes,
          laneId: action.laneId,
          nodeWidth: nw,
          fallbackLaneWidth: layout.laneWidth,
        });
    const offsetX = hasCenterX ? 0 : (nodeOffsetX[action.id] ?? 0);
    return {
    id: action.id,
    type: "swimlaneAction",
    position: {
      x: baseX + offsetX,
      y: action.y,
    },
    data: {
      index: action.index,
      label: action.label,
      notation: action.notation ?? "action",
      ...(typeof action.width === "number" && Number.isFinite(action.width) && action.width > 0
        ? { width: action.width }
        : {}),
      ...(typeof action.height === "number" &&
      Number.isFinite(action.height) &&
      action.height > 0
        ? { height: action.height }
        : {}),
    },
    draggable: true,
    zIndex: 10,
  };
  });

  const initialHasCenterX =
    typeof config.initialNode.x === "number" && Number.isFinite(config.initialNode.x);
  const initialBaseX = initialHasCenterX
    ? swimlanePositionXFromCenter(config.initialNode.x!, layout.initialNodeSize)
    : laneCenteredX({
        lanes: resolvedLanes,
        laneId: config.initialNode.laneId,
        nodeWidth: layout.initialNodeSize,
        fallbackLaneWidth: layout.laneWidth,
      });
  const initialNode: SwimlaneEventNode = {
    id: config.initialNode.id,
    type: "swimlaneEvent",
    position: {
      x: initialBaseX + (initialHasCenterX ? 0 : (nodeOffsetX[config.initialNode.id] ?? 0)),
      y: config.initialNode.y,
    },
    data: { kind: "initial" },
    draggable: true,
    zIndex: 10,
  };

  const finalHasCenterX =
    typeof config.activityFinalNode.x === "number" &&
    Number.isFinite(config.activityFinalNode.x);
  const finalBaseX = finalHasCenterX
    ? swimlanePositionXFromCenter(
        config.activityFinalNode.x!,
        layout.activityFinalNodeSize
      )
    : laneCenteredX({
        lanes: resolvedLanes,
        laneId: config.activityFinalNode.laneId,
        nodeWidth: layout.activityFinalNodeSize,
        fallbackLaneWidth: layout.laneWidth,
      });
  const activityFinalNode: SwimlaneEventNode = {
    id: config.activityFinalNode.id,
    type: "swimlaneEvent",
    position: {
      x: finalBaseX + (finalHasCenterX ? 0 : (nodeOffsetX[config.activityFinalNode.id] ?? 0)),
      y: config.activityFinalNode.y,
    },
    data: { kind: "activityFinal" },
    draggable: true,
    zIndex: 10,
  };

  const edges: Edge[] = config.flows.map((flow) => {
    const edgeLabel =
      (flow.label?.trim() || flow.guard?.trim() || undefined) ?? undefined;
    return {
      ...swimlaneControlFlowEdgeDefaults,
      id: flow.id ?? `${flow.source}-to-${flow.target}`,
      source: flow.source,
      target: flow.target,
      sourceHandle: flow.sourceHandle,
      targetHandle: flow.targetHandle,
      label: edgeLabel,
      data: {
        guard: flow.guard,
        edgeLabel: flow.label,
        labelOffset: flow.labelOffset,
        ...(flow.waypoints != null && flow.waypoints.length > 0
          ? { waypoints: flow.waypoints }
          : {}),
      },
      labelShowBg: false,
      labelStyle: {
        fill: "var(--foreground)",
        fontSize: 12,
        fontWeight: 700,
      },
      style: {
        ...swimlaneControlFlowEdgeDefaults.style,
      },
    };
  });

  return {
    graphKey: config.id,
    nodes: [poolNode, initialNode, ...actionNodes, activityFinalNode],
    edges,
  };
}
