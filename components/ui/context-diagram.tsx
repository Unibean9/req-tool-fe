"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BaseEdge,
  ConnectionMode,
  EdgeLabelRenderer,
  getBezierPath,
  Panel,
  useNodesState,
  useEdgesState,
  type Connection,
  type EdgeProps,
  type EdgeTypes,
} from "@xyflow/react";
import { RefreshCw, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Background,
  defaultReactFlowCanvasProps,
  Handle,
  Position,
  reactFlowBackgroundProps,
  REACT_FLOW_FIT_DURATION_MS,
  REACT_FLOW_FIT_PADDING,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@/components/ui/react-flow";

// ─── Public Types ─────────────────────────────────────────────────────────────

export interface ContextStakeholder {
  id: string;
  name: string;
  role?: string;
}

export interface ContextDataFlow {
  id: string;
  /** "center" or a stakeholder id */
  source: string;
  /** "center" or a stakeholder id */
  target: string;
  label: string;
  curvature?: number;
}

export interface ContextDiagramConfig {
  centerLabel: string;
  stakeholders: ContextStakeholder[];
  flows: ContextDataFlow[];
}

export interface ContextDiagramLayout {
  nodes: { id: string; position: { x: number; y: number }; width?: number; height?: number }[];
  edges: {
    id: string;
    waypoint?: { x: number; y: number };
    sourceAnchor?: { x: number; y: number };
    targetAnchor?: { x: number; y: number };
    labelOffset?: { x: number; y: number };
  }[];
}

// ─── Layout constants ─────────────────────────────────────────────────────────

const CENTER_R    = 90;   // circle radius px
const ORBIT_R     = 300;  // orbit distance from center to stakeholder center
const S_W         = 220;  // stakeholder node width
const S_H         = 80;   // stakeholder node height
const CX          = 420;  // canvas origin X
const CY          = 350;  // canvas origin Y
const HANDLE_OFF  = 14;   // px offset from side-midpoint for source vs target handles

// ─── Geometry helpers ─────────────────────────────────────────────────────────

type Side = "t" | "r" | "b" | "l";
const OPP: Record<Side, Side> = { t: "b", b: "t", l: "r", r: "l" };

function angleToSide(rad: number): Side {
  const deg = ((rad * 180) / Math.PI + 180) % 360 - 180;
  if (deg >= -135 && deg < -45) return "t";
  if (deg >= -45  && deg <  45) return "r";
  if (deg >=  45  && deg < 135) return "b";
  return "l";
}

function sideToPosition(side: Side): Position {
  if (side === "t") return Position.Top;
  if (side === "r") return Position.Right;
  if (side === "b") return Position.Bottom;
  return Position.Left;
}

function pointToSide(point: Waypoint, center: Waypoint, width: number, height: number): Side {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const xRatio = Math.abs(dx) / (width / 2);
  const yRatio = Math.abs(dy) / (height / 2);

  if (xRatio > yRatio) return dx >= 0 ? "r" : "l";
  return dy >= 0 ? "b" : "t";
}

// ─── Graph builder ─────────────────────────────────────────────────────────────

function buildGraph(cfg: ContextDiagramConfig): { nodes: Node[]; edges: Edge[] } {
  const n = cfg.stakeholders.length;
  const step = (2 * Math.PI) / Math.max(n, 1);
  const start = -Math.PI / 2;

  const angleMap = new Map<string, number>();
  cfg.stakeholders.forEach((s, i) => angleMap.set(s.id, start + i * step));

  const nodes: Node[] = [
    {
      id: "center",
      type: "contextCenter",
      position: { x: CX - CENTER_R, y: CY - CENTER_R },
      data: { label: cfg.centerLabel, width: D, height: D },
    },
    ...cfg.stakeholders.map((s, i) => {
      const θ = start + i * step;
      return {
        id: s.id,
        type: "contextStakeholder",
        position: {
          x: CX + ORBIT_R * Math.cos(θ) - S_W / 2,
          y: CY + ORBIT_R * Math.sin(θ) - S_H / 2,
        },
        data: { name: s.name, role: s.role, width: S_W, height: S_H },
      };
    }),
  ];

  const edges: Edge[] = cfg.flows.map((f) => {
    const stakeholderId =
      f.source === "center" ? f.target
      : f.target === "center" ? f.source
      : null;

    // Source and target handles: s-{side} / t-{side}
    // Outgoing (center→sh): uses center's s-{side} and stakeholder's t-{opp}
    // Incoming (sh→center): uses stakeholder's s-{opp} and center's t-{side}
    let sourceHandle = "s-r";
    let targetHandle = "t-l";

    if (stakeholderId) {
      const θ = angleMap.get(stakeholderId) ?? 0;
      const side = angleToSide(θ);
      if (f.source === "center") {
        sourceHandle = `s-${side}`;
        targetHandle = `t-${OPP[side]}`;
      } else {
        sourceHandle = `s-${OPP[side]}`;
        targetHandle = `t-${side}`;
      }
    }

    const isOutgoing = f.source === "center";

    return {
      id: f.id,
      source: f.source,
      target: f.target,
      sourceHandle,
      targetHandle,
      type: "contextEdge",
      data: { label: f.label, isOutgoing, curvature: f.curvature },
      style: { strokeWidth: 2, stroke: "var(--foreground)" },
    } satisfies Edge;
  });

  return { nodes, edges };
}

// ─── Custom Edge (curved + bendable) ─────────────────────────────────────────

type Waypoint = { x: number; y: number };
type EdgeAnchor = "source" | "target";

/** Rotation (degrees, SVG clockwise) so a rightward arrow tip aligns with the approach direction. */
function targetAngle(pos: Position): number {
  if (pos === Position.Right)  return 180;
  if (pos === Position.Top)    return 90;
  if (pos === Position.Bottom) return 270;
  return 0; // Position.Left — edge enters from left, tip points right
}

function snapPointToNodeBoundary(point: Waypoint, node: Node | undefined): Waypoint {
  if (!node) return point;

  const { w: width, h: height } = nodeSize(node);
  const center = {
    x: node.position.x + width / 2,
    y: node.position.y + height / 2,
  };
  const dx = point.x - center.x;
  const dy = point.y - center.y;

  if (dx === 0 && dy === 0) {
    return { x: center.x + width / 2, y: center.y };
  }

  if (node.id === "center") {
    const radius = width / 2;
    const distance = Math.hypot(dx, dy);
    return {
      x: center.x + (dx / distance) * radius,
      y: center.y + (dy / distance) * radius,
    };
  }

  const scale = Math.min((width / 2) / Math.abs(dx || 1), (height / 2) / Math.abs(dy || 1));

  return {
    x: center.x + dx * scale,
    y: center.y + dy * scale,
  };
}

// ─── Anchor coordinate helpers ────────────────────────────────────────────────
// sourceAnchor / targetAnchor are stored as offsets RELATIVE TO the node center.
// This way they follow the node when it is dragged.

function nodeSize(node: Node | undefined): { w: number; h: number } {
  if (!node) return { w: S_W, h: S_H };
  const d = node.data as { width?: number; height?: number };
  if (node.type === "contextCenter") return { w: d.width ?? D, h: d.height ?? D };
  return { w: d.width ?? S_W, h: d.height ?? S_H };
}

/** Absolute canvas position → relative offset from node center (what we store). */
function absoluteToRelative(abs: Waypoint, node: Node): Waypoint {
  const { w, h } = nodeSize(node);
  return {
    x: abs.x - (node.position.x + w / 2),
    y: abs.y - (node.position.y + h / 2),
  };
}

/** Stored relative offset → absolute canvas position using current node position. */
function relativeToAbsolute(rel: Waypoint, node: Node | undefined): Waypoint {
  if (!node) return rel;
  const { w, h } = nodeSize(node);
  return {
    x: node.position.x + w / 2 + rel.x,
    y: node.position.y + h / 2 + rel.y,
  };
}

/** Which side of the node does a stored relative offset point to? */
function positionFromRelative(rel: Waypoint, node: Node | undefined, fallback: Position): Position {
  if (!node) return fallback;
  const { w, h } = nodeSize(node);
  return sideToPosition(pointToSide(rel, { x: 0, y: 0 }, w, h));
}

function ContextEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  data,
  style,
  selected,
}: EdgeProps) {
  const { getNode, setEdges, screenToFlowPosition } = useReactFlow();
  const showHandles = !!selected;
  const activeStyle = showHandles
    ? { ...(style as React.CSSProperties), stroke: "var(--color-primary)" }
    : (style as React.CSSProperties | undefined);
  const label = data?.label as string | undefined;
  const isOutgoing = (data?.isOutgoing as boolean) ?? false;
  const dataCurvature = data?.curvature as number | undefined;
  const waypoint = data?.waypoint as Waypoint | undefined;
  const sourceAnchor = data?.sourceAnchor as Waypoint | undefined;
  const targetAnchor = data?.targetAnchor as Waypoint | undefined;
  const labelOffset = (data?.labelOffset as Waypoint | undefined) ?? { x: 0, y: 0 };
  const sourceNode = getNode(source);
  const targetNode = getNode(target);
  // Anchors are stored as relative offsets from node center → convert to absolute
  // using the *current* node position so they track the node when it moves.
  const pathSource = sourceAnchor
    ? relativeToAbsolute(sourceAnchor, sourceNode)
    : { x: sourceX, y: sourceY };
  const pathTarget = targetAnchor
    ? relativeToAbsolute(targetAnchor, targetNode)
    : { x: targetX, y: targetY };
  const pathSourcePosition = sourceAnchor
    ? positionFromRelative(sourceAnchor, sourceNode, sourcePosition)
    : sourcePosition;
  const pathTargetPosition = targetAnchor
    ? positionFromRelative(targetAnchor, targetNode, targetPosition)
    : targetPosition;

  const curvature = dataCurvature ?? (isOutgoing ? 0.25 : 0.5);

  let edgePath: string;
  let labelX: number;
  let labelY: number;

  if (waypoint) {
    // Quadratic bezier through user-defined control point
    edgePath = `M ${pathSource.x} ${pathSource.y} Q ${waypoint.x} ${waypoint.y} ${pathTarget.x} ${pathTarget.y}`;
    // Midpoint of quadratic bezier (t=0.5)
    labelX = 0.25 * pathSource.x + 0.5 * waypoint.x + 0.25 * pathTarget.x;
    labelY = 0.25 * pathSource.y + 0.5 * waypoint.y + 0.25 * pathTarget.y;
  } else {
    [edgePath, labelX, labelY] = getBezierPath({
      sourceX: pathSource.x,
      sourceY: pathSource.y,
      sourcePosition: pathSourcePosition,
      targetX: pathTarget.x,
      targetY: pathTarget.y,
      targetPosition: pathTargetPosition,
      curvature,
    });
  }

  // Drag handle position: at the waypoint if set, otherwise at the label midpoint
  const dragX = waypoint?.x ?? labelX;
  const dragY = waypoint?.y ?? labelY;

  const handleDragStart = useCallback(
    (e: React.MouseEvent<Element>) => {
      e.stopPropagation();
      e.preventDefault();

      const onMove = (ev: MouseEvent) => {
        const pos = screenToFlowPosition({ x: ev.clientX, y: ev.clientY });
        setEdges((eds) =>
          eds.map((edge) =>
            edge.id === id
              ? { ...edge, data: { ...edge.data, waypoint: pos } }
              : edge
          )
        );
      };
      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [id, setEdges, screenToFlowPosition]
  );

  // Double-click the drag handle to reset the waypoint
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<Element>) => {
      e.stopPropagation();
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === id
            ? { ...edge, data: { ...edge.data, waypoint: undefined } }
            : edge
        )
      );
    },
    [id, setEdges]
  );

  const handleAnchorDragStart = useCallback(
    (anchor: EdgeAnchor, e: React.MouseEvent<Element>) => {
      e.stopPropagation();
      e.preventDefault();

      const dataKey = anchor === "source" ? "sourceAnchor" : "targetAnchor";

      const onMove = (ev: MouseEvent) => {
        const anchorNode = anchor === "source" ? getNode(source) : getNode(target);
        const absPos = snapPointToNodeBoundary(
          screenToFlowPosition({ x: ev.clientX, y: ev.clientY }),
          anchorNode
        );
        // Store as relative offset from node center so it follows the node when dragged
        const relPos = anchorNode ? absoluteToRelative(absPos, anchorNode) : absPos;
        setEdges((eds) =>
          eds.map((edge) =>
            edge.id === id
              ? { ...edge, data: { ...edge.data, [dataKey]: relPos } }
              : edge
          )
        );
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [getNode, id, setEdges, source, screenToFlowPosition, target]
  );

  const handleAnchorDoubleClick = useCallback(
    (anchor: EdgeAnchor, e: React.MouseEvent<Element>) => {
      e.stopPropagation();
      const dataKey = anchor === "source" ? "sourceAnchor" : "targetAnchor";

      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === id
            ? { ...edge, data: { ...edge.data, [dataKey]: undefined } }
            : edge
        )
      );
    },
    [id, setEdges]
  );

  const handleLabelDragStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      e.preventDefault();

      const startFlow = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const baseOffset = (data?.labelOffset as Waypoint | undefined) ?? { x: 0, y: 0 };

      const onMove = (ev: MouseEvent) => {
        const cur = screenToFlowPosition({ x: ev.clientX, y: ev.clientY });
        setEdges((eds) =>
          eds.map((edge) =>
            edge.id === id
              ? {
                  ...edge,
                  data: {
                    ...edge.data,
                    labelOffset: {
                      x: baseOffset.x + cur.x - startFlow.x,
                      y: baseOffset.y + cur.y - startFlow.y,
                    },
                  },
                }
              : edge
          )
        );
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [data?.labelOffset, id, setEdges, screenToFlowPosition]
  );

  const handleLabelDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === id
            ? { ...edge, data: { ...edge.data, labelOffset: undefined } }
            : edge
        )
      );
    },
    [id, setEdges]
  );

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={activeStyle} />

      {/* Custom arrowhead — angle follows actual path tangent at endpoint */}
      <polygon
        points="0,0 -9,-4.5 -9,4.5"
        fill={(activeStyle?.stroke as string | undefined) ?? "var(--color-border)"}
        transform={`translate(${pathTarget.x},${pathTarget.y}) rotate(${
          waypoint
            ? (Math.atan2(pathTarget.y - waypoint.y, pathTarget.x - waypoint.x) * 180) / Math.PI
            : targetAngle(pathTargetPosition)
        })`}
        style={{ pointerEvents: "none" }}
      />

      {/* Wide transparent path — enlarges click area for edge selection */}
      <path
        d={edgePath}
        stroke="transparent"
        strokeWidth={16}
        fill="none"
        style={{ pointerEvents: "all", cursor: "default" }}
      />

      <EdgeLabelRenderer>
        {/* Anchor + bend dots — rendered in HTML overlay so they sit above nodes */}
        {(["source", "target"] as const).map((anchor) => {
          const pos = anchor === "source" ? pathSource : pathTarget;
          return (
            <div
              key={anchor}
              className={`nodrag nopan absolute transition-opacity duration-150 ${showHandles ? "opacity-100" : "opacity-0"}`}
              style={{
                transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px)`,
                pointerEvents: showHandles ? "all" : "none",
                cursor: "grab",
                zIndex: 1000,
              }}
              onMouseDown={(e) => handleAnchorDragStart(anchor, e)}
              onDoubleClick={(e) => handleAnchorDoubleClick(anchor, e)}
            >
              <svg width="1" height="1" style={{ overflow: "visible" }}>
                <circle cx="0" cy="0" r="4" fill="var(--background)" stroke="var(--color-primary)" strokeWidth={1.5}
                  style={{ filter: "drop-shadow(0 1px 2px rgb(0 0 0 / 0.4))" }} />
              </svg>
            </div>
          );
        })}

        {/* Bend handle */}
        <div
          className={`nodrag nopan absolute transition-opacity duration-150 ${showHandles ? "opacity-100" : "opacity-0"}`}
          style={{
            transform: `translate(-50%, -50%) translate(${dragX}px, ${dragY}px)`,
            pointerEvents: showHandles ? "all" : "none",
            cursor: "grab",
            zIndex: 1000,
          }}
          onMouseDown={handleDragStart}
          onDoubleClick={handleDoubleClick}
        >
          <svg width="1" height="1" style={{ overflow: "visible" }}>
            <circle cx="0" cy="0" r="4" fill="var(--background)" stroke="var(--color-primary)" strokeWidth={1.5}
              style={{ filter: "drop-shadow(0 1px 2px rgb(0 0 0 / 0.4))" }} />
          </svg>
        </div>

        {label ? (
          <div
            className="nodrag nopan absolute cursor-grab select-none text-[10px] font-semibold leading-tight text-white"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX + labelOffset.x}px, ${labelY + labelOffset.y}px)`,
              pointerEvents: "all",
            }}
            onMouseDown={handleLabelDragStart}
            onDoubleClick={handleLabelDoubleClick}
          >
            {label}
          </div>
        ) : null}
      </EdgeLabelRenderer>
    </>
  );
}

// ─── Handle helpers ───────────────────────────────────────────────────────────

/** All routing handles: invisible but sized so React Flow can compute edge endpoints. */
const H = "!h-2 !w-2 !min-h-0 !min-w-0 !border-0 !bg-transparent opacity-0 !p-0";
const CONNECT_HANDLE =
  "!border-0 !bg-transparent opacity-0 !p-0";
const CONNECT_HANDLE_THICKNESS = 18;

/** Handles with slight offset so outgoing (s-*) and incoming (t-*) edges on the same
 *  side of a node start/end at different physical points, giving visual separation. */
function NodeHandles({ w, h, off = HANDLE_OFF }: { w: number; h: number; off?: number }) {
  const hw = w / 2;
  const hh = h / 2;
  return (
    <>
      <Handle type="source" position={Position.Top}    id="s-t" className={H} style={{ left: hw - off, transform: "translate(-50%, -50%)" }} />
      <Handle type="target" position={Position.Top}    id="t-t" className={H} style={{ left: hw + off, transform: "translate(-50%, -50%)" }} />
      <Handle type="source" position={Position.Right}  id="s-r" className={H} style={{ top: hh - off,  transform: "translate(50%, -50%)" }} />
      <Handle type="target" position={Position.Right}  id="t-r" className={H} style={{ top: hh + off,  transform: "translate(50%, -50%)" }} />
      <Handle type="source" position={Position.Bottom} id="s-b" className={H} style={{ left: hw - off, transform: "translate(-50%, 50%)" }} />
      <Handle type="target" position={Position.Bottom} id="t-b" className={H} style={{ left: hw + off, transform: "translate(-50%, 50%)" }} />
      <Handle type="source" position={Position.Left}   id="s-l" className={H} style={{ top: hh - off,  transform: "translate(-50%, -50%)" }} />
      <Handle type="target" position={Position.Left}   id="t-l" className={H} style={{ top: hh + off,  transform: "translate(-50%, -50%)" }} />

      <Handle
        type="source"
        position={Position.Top}
        id="connect-t"
        className={CONNECT_HANDLE}
        style={{ left: hw, width: w, height: CONNECT_HANDLE_THICKNESS, transform: "translate(-50%, -50%)" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="connect-r"
        className={CONNECT_HANDLE}
        style={{ top: hh, width: CONNECT_HANDLE_THICKNESS, height: h, transform: "translate(50%, -50%)" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="connect-b"
        className={CONNECT_HANDLE}
        style={{ left: hw, width: w, height: CONNECT_HANDLE_THICKNESS, transform: "translate(-50%, 50%)" }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="connect-l"
        className={CONNECT_HANDLE}
        style={{ top: hh, width: CONNECT_HANDLE_THICKNESS, height: h, transform: "translate(-50%, -50%)" }}
      />
    </>
  );
}

function ConnectionHints({ shape }: { shape: "circle" | "rect" }) {
  const baseClass =
    "pointer-events-none absolute bg-primary/90 opacity-0 shadow-[0_0_10px_color-mix(in_srgb,var(--color-primary)_55%,transparent)] transition-opacity duration-150 group-hover:opacity-100";

  if (shape === "circle") {
    return (
      <>
        <span className={`${baseClass} left-1/2 top-0 h-1 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full`} />
        <span className={`${baseClass} right-0 top-1/2 h-7 w-1 -translate-y-1/2 translate-x-1/2 rounded-full`} />
        <span className={`${baseClass} bottom-0 left-1/2 h-1 w-7 -translate-x-1/2 translate-y-1/2 rounded-full`} />
        <span className={`${baseClass} left-0 top-1/2 h-7 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full`} />
      </>
    );
  }

  return (
    <>
      <span className={`${baseClass} left-1/2 top-0 h-1 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full`} />
      <span className={`${baseClass} right-0 top-1/2 h-8 w-1 -translate-y-1/2 translate-x-1/2 rounded-full`} />
      <span className={`${baseClass} bottom-0 left-1/2 h-1 w-9 -translate-x-1/2 translate-y-1/2 rounded-full`} />
      <span className={`${baseClass} left-0 top-1/2 h-8 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full`} />
    </>
  );
}

// ─── Custom Nodes ─────────────────────────────────────────────────────────────

const D = CENTER_R * 2; // diameter

function ContextCenterNode({ data }: NodeProps) {
  const w = (data.width as number | undefined) ?? D;
  const h = (data.height as number | undefined) ?? D;
  return (
    <div
      style={{ width: w, height: h }}
      className="group relative flex items-center justify-center rounded-full border-2 border-primary bg-primary text-center shadow-lg"
    >
      <NodeHandles w={w} h={h} />
      <ConnectionHints shape="circle" />
      <span className="px-3 text-sm font-semibold leading-snug text-white">
        {data.label as string}
      </span>
    </div>
  );
}

function ContextStakeholderNode({ data }: NodeProps) {
  const w = (data.width as number | undefined) ?? S_W;
  const h = (data.height as number | undefined) ?? S_H;
  return (
    <div
      style={{ width: w, height: h }}
      className="group relative flex flex-col items-center justify-center rounded border border-sky-300 bg-sky-200 px-3 py-1.5 text-center shadow-sm"
    >
      <NodeHandles w={w} h={h} />
      <ConnectionHints shape="rect" />
      <p className="text-xs font-semibold leading-tight text-sky-900">
        {data.name as string}
      </p>
    </div>
  );
}

const NODE_TYPES: NodeTypes = {
  contextCenter: ContextCenterNode,
  contextStakeholder: ContextStakeholderNode,
};

const EDGE_TYPES: EdgeTypes = {
  contextEdge: ContextEdge,
};

// ─── Canvas ───────────────────────────────────────────────────────────────────

const CANVAS_PROPS = {
  ...defaultReactFlowCanvasProps,
  nodesDraggable: true,
  nodesConnectable: true,
  elementsSelectable: true,
  zoomOnScroll: true,
  panOnScroll: true,
  panOnDrag: true,
  connectionMode: ConnectionMode.Loose,
  connectionRadius: 40,
} as const;

function ContextDiagramCanvas({
  config,
  layout,
  onSaveLayout,
  isSavingLayout = false,
  onSync,
  isSyncing = false,
  onCreateFlow,
  onDeleteFlow,
}: {
  config: ContextDiagramConfig;
  layout?: ContextDiagramLayout | null;
  onSaveLayout?: (layout: ContextDiagramLayout) => void;
  isSavingLayout?: boolean;
  onSync?: () => void;
  isSyncing?: boolean;
  onCreateFlow?: (flow: { source: string; target: string; label: string }) => void;
  onDeleteFlow?: (flowId: string) => void;
}) {
  const { nodes: init, edges: initEdges } = useMemo(() => {
    const { nodes, edges } = buildGraph(config);
    if (!layout) return { nodes, edges };

    // Apply saved node positions and dimensions from API
    const posMap = new Map(layout.nodes.map((n) => [n.id, n]));
    const nodesWithLayout = nodes.map((n) => {
      const saved = posMap.get(n.id);
      if (!saved) return n;
      const w = saved.width && saved.width > 0 ? saved.width : undefined;
      const h = saved.height && saved.height > 0 ? saved.height : undefined;
      return {
        ...n,
        position: saved.position,
        ...(w != null && h != null
          ? { data: { ...(n.data as Record<string, unknown>), width: w, height: h } }
          : {}),
      };
    });

    // Apply saved edge custom data (waypoint, anchors, labelOffset)
    const edgeMap = new Map(layout.edges.map((e) => [e.id, e]));
    const edgesWithLayout = edges.map((e) => {
      const saved = edgeMap.get(e.id);
      if (!saved) return e;
      return {
        ...e,
        data: {
          ...e.data,
          ...(saved.waypoint ? { waypoint: saved.waypoint } : {}),
          ...(saved.sourceAnchor ? { sourceAnchor: saved.sourceAnchor } : {}),
          ...(saved.targetAnchor ? { targetAnchor: saved.targetAnchor } : {}),
          ...(saved.labelOffset ? { labelOffset: saved.labelOffset } : {}),
        },
      };
    });

    return { nodes: nodesWithLayout, edges: edgesWithLayout };
  }, [config, layout]);

  const [nodes, setNodes, onNodesChange] = useNodesState(init);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);
  const onInit = useCallback(() => {}, []);

  // Sync nodes/edges when server data changes (e.g. after stakeholder add/remove triggers refetch)
  const prevInitRef = useRef(init);
  useEffect(() => {
    if (prevInitRef.current === init) return;
    prevInitRef.current = init;
    setNodes(init);
    setEdges(initEdges);
  }, [init, initEdges, setNodes, setEdges]);

  const { fitView } = useReactFlow();
  const hasFitted = useRef(false);
  useEffect(() => {
    if (hasFitted.current) return;
    hasFitted.current = true;
    const frame = requestAnimationFrame(() => {
      fitView({ padding: REACT_FLOW_FIT_PADDING, duration: REACT_FLOW_FIT_DURATION_MS });
    });
    return () => cancelAnimationFrame(frame);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [pendingConn, setPendingConn] = useState<{
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
  } | null>(null);
  const [pendingLabel, setPendingLabel] = useState("");
  const [contextMenu, setContextMenu] = useState<{ edgeId: string; x: number; y: number } | null>(null);

  const handleSave = useCallback(() => {
    if (!onSaveLayout) return;
    onSaveLayout({
      nodes: nodes.map((n) => {
          const d = n.data as { width?: number; height?: number };
          return { id: n.id, position: n.position, width: d.width ?? 0, height: d.height ?? 0 };
        }),
      edges: edges
        .filter((e) => e.data?.waypoint || e.data?.sourceAnchor || e.data?.targetAnchor || e.data?.labelOffset)
        .map((e) => ({
          id: e.id,
          waypoint: e.data?.waypoint as { x: number; y: number } | undefined,
          sourceAnchor: e.data?.sourceAnchor as { x: number; y: number } | undefined,
          targetAnchor: e.data?.targetAnchor as { x: number; y: number } | undefined,
          labelOffset: e.data?.labelOffset as { x: number; y: number } | undefined,
        })),
    });
  }, [nodes, edges, onSaveLayout]);

  const handleConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;
    setPendingConn({
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
    });
    setPendingLabel("");
  }, []);

  const handleCreateFlow = useCallback(() => {
    if (!pendingConn || !pendingLabel.trim()) return;

    // Compute s-*/t-* handles from current node positions, same logic as buildGraph.
    // onConnect fires with connect-* handles (large hit-area) which misalign the edge.
    let sourceHandle = "s-r";
    let targetHandle = "t-l";
    const stakeholderId =
      pendingConn.source === "center" ? pendingConn.target
      : pendingConn.target === "center" ? pendingConn.source
      : null;
    if (stakeholderId) {
      const centerNode = nodes.find((n) => n.id === "center");
      const shNode = nodes.find((n) => n.id === stakeholderId);
      if (centerNode && shNode) {
        const { w: cw, h: ch } = nodeSize(centerNode);
        const { w: sw, h: sh } = nodeSize(shNode);
        const cx = centerNode.position.x + cw / 2;
        const cy = centerNode.position.y + ch / 2;
        const sx = shNode.position.x + sw / 2;
        const sy = shNode.position.y + sh / 2;
        const side = angleToSide(Math.atan2(sy - cy, sx - cx));
        if (pendingConn.source === "center") {
          sourceHandle = `s-${side}`;
          targetHandle = `t-${OPP[side]}`;
        } else {
          sourceHandle = `s-${OPP[side]}`;
          targetHandle = `t-${side}`;
        }
      }
    }

    const id = `flow-${pendingConn.source}-${pendingConn.target}-${Date.now()}`;
    const newEdge: Edge = {
      id,
      source: pendingConn.source,
      target: pendingConn.target,
      sourceHandle,
      targetHandle,
      type: "contextEdge",
      data: { label: pendingLabel.trim(), isOutgoing: pendingConn.source === "center" },
      style: { strokeWidth: 2, stroke: "var(--foreground)" },
    };
    setEdges((eds) => [...eds, newEdge]);
    onCreateFlow?.({ source: pendingConn.source, target: pendingConn.target, label: pendingLabel.trim() });
    setPendingConn(null);
    setPendingLabel("");
  }, [pendingConn, pendingLabel, nodes, setEdges, onCreateFlow]);

  const isValidConnection = useCallback((connection: Connection | Edge) => {
    const source = connection.source ?? null;
    const target = connection.target ?? null;
    if (!source || !target || source === target) return false;
    // Only center ↔ stakeholder; no stakeholder-to-stakeholder
    return (source === "center") !== (target === "center");
  }, []);

  const handleEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    setContextMenu({ edgeId: edge.id, x: event.clientX, y: event.clientY });
  }, []);

  const handleDeleteEdge = useCallback((edgeId: string) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
    onDeleteFlow?.(edgeId);
    setContextMenu(null);
  }, [setEdges, onDeleteFlow]);

  return (
    <>
      <ReactFlow
        {...CANVAS_PROPS}
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={onInit}
        onConnect={handleConnect}
        isValidConnection={isValidConnection}
        onEdgeContextMenu={handleEdgeContextMenu}
        className="rounded-xl bg-card/30"
      >
        <Background {...reactFlowBackgroundProps} />
        <Panel position="top-right">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 border-border/80 bg-card/90 text-xs backdrop-blur-sm"
              onClick={onSync}
              disabled={isSyncing || !onSync}
            >
              <RefreshCw className={`size-3 ${isSyncing ? "animate-spin" : ""}`} aria-hidden />
              {isSyncing ? "Syncing…" : "Sync business flow"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 border-border/80 bg-card/90 text-xs backdrop-blur-sm"
              onClick={handleSave}
              disabled={isSavingLayout || !onSaveLayout}
            >
              <Save className="size-3" aria-hidden />
              {isSavingLayout ? "Saving…" : "Update layout"}
            </Button>
          </div>
        </Panel>
      </ReactFlow>

      {/* Dialog: enter label for new connection */}
      <Dialog open={!!pendingConn} onOpenChange={(open) => { if (!open) setPendingConn(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Set data flow name</DialogTitle>
          </DialogHeader>
          <Input
            value={pendingLabel}
            onChange={(e) => setPendingLabel(e.target.value)}
            placeholder="e.g. send request, receive feedback..."
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") handleCreateFlow(); }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingConn(null)}>Hủy</Button>
            <Button onClick={handleCreateFlow} disabled={!pendingLabel.trim()}>Tạo dây</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edge right-click context menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-50 min-w-36 overflow-hidden rounded-md border border-border bg-card py-1 shadow-md"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
              onClick={() => handleDeleteEdge(contextMenu.edgeId)}
            >
              <Trash2 className="size-3.5" />
              Delete flow
            </button>
          </div>
        </>
      )}

    </>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

export function ContextDiagram({
  config,
  layout,
  onSaveLayout,
  isSavingLayout,
  onSync,
  isSyncing,
  onCreateFlow,
  onDeleteFlow,
}: {
  config: ContextDiagramConfig;
  layout?: ContextDiagramLayout | null;
  onSaveLayout?: (layout: ContextDiagramLayout) => void;
  isSavingLayout?: boolean;
  onSync?: () => void;
  isSyncing?: boolean;
  onCreateFlow?: (flow: { source: string; target: string; label: string }) => void;
  onDeleteFlow?: (flowId: string) => void;
}) {
  return (
    <ReactFlowProvider>
      <div className="h-full w-full">
        <ContextDiagramCanvas
          config={config}
          layout={layout}
          onSaveLayout={onSaveLayout}
          isSavingLayout={isSavingLayout}
          onSync={onSync}
          isSyncing={isSyncing}
          onCreateFlow={onCreateFlow}
          onDeleteFlow={onDeleteFlow}
        />
      </div>
    </ReactFlowProvider>
  );
}
