"use client";

import { useEffect } from "react";
import { BackgroundVariant, useReactFlow } from "@xyflow/react";

import "@xyflow/react/dist/style.css";

/** Padding / thời lượng fitView — dùng chung cho canvas và `FitViewOnGraphChange`. */
export const REACT_FLOW_FIT_PADDING = 0.22;
export const REACT_FLOW_FIT_DURATION_MS = 220;

/** Props tĩnh mặc định cho canvas đọc-only (org chart, sơ đồ). */
export const defaultReactFlowCanvasProps = {
  fitView: true as const,
  fitViewOptions: { padding: REACT_FLOW_FIT_PADDING },
  minZoom: 0.32,
  maxZoom: 1.35,
  nodesDraggable: false,
  nodesConnectable: false,
  elementsSelectable: false,
  panOnScroll: true,
  zoomOnScroll: true,
} as const;

export const reactFlowCanvasClassName = "rounded-xl";

export const reactFlowBackgroundProps = {
  variant: BackgroundVariant.Dots,
  gap: 18,
  size: 1.2,
  className: "text-border",
} as const;

export const reactFlowControlsClassName =
  "overflow-hidden rounded-lg border border-border bg-card/90 text-foreground shadow-md [&_button]:border-border [&_button]:bg-card [&_button:hover]:bg-accent";


export const orgChartLayout = {
  cardWidth: 200,
  cardHeight: 132,
  hGap: 28,
  vGap: 88,
  centerX: 420,
  groupWidth: 140,
  /** Min width cho badge hub (nhãn nhóm trên sơ đồ). */
  hubMinWidth: 120,
} as const;

/** Style cạnh Bézier mặc định cho org chart (members / sơ đồ tương tự). */
export const orgChartBezierEdgeStyle = {
  stroke: "var(--border)",
  strokeWidth: 1.25,
  opacity: 0.9,
} as const;

/** Gọi `fitView` khi `graphKey` đổi (đặt làm con trực tiếp của `<ReactFlow>`). */
export function FitViewOnGraphChange({ graphKey }: { graphKey: string }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      fitView({
        padding: REACT_FLOW_FIT_PADDING,
        duration: REACT_FLOW_FIT_DURATION_MS,
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [graphKey, fitView]);

  return null;
}

export {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  reconnectEdge,
  useReactFlow,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from "@xyflow/react";

export type { Connection, Edge, Node, NodeProps, NodeTypes } from "@xyflow/react";
