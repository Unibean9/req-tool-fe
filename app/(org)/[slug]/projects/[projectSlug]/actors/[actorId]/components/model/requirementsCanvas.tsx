"use client";

import { useCallback, useMemo } from "react";
import { LayoutGrid } from "lucide-react";
import { MiniMap } from "@xyflow/react";

import {
  Background,
  Controls,
  FitViewOnGraphChange,
  ReactFlow,
  ReactFlowProvider,
  reactFlowBackgroundProps,
  reactFlowCanvasClassName,
  useReactFlow,
} from "@/components/ui/react-flow";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  REQUIREMENT_EDGE_DEFAULT_OPTIONS,
  REQUIREMENTS_PALETTE_DRAG_MIME,
} from "./requirementsModelConstants";
import { REQUIREMENTS_WORKSPACE_TOOLBAR_CLASS } from "./requirementsWorkspaceUi";
import { requirementsFlowNodeTypes } from "./requirementsFlowNodes";
import type { PaletteDragPayload } from "./requirementsModelTypes";
import { useRequirementsModel } from "./requirementsModelContext";

function RequirementsCanvasInner() {
  const { screenToFlowPosition } = useReactFlow();
  const {
    visibleNodes,
    visibleEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNodeFromPalette,
    selectNode,
    closePanel,
    runAutoLayout,
    viewMode,
    setViewMode,
  } = useRequirementsModel();

  /** Chỉ fitView khi đổi góc nhìn — không khi thêm node (tránh nhảy viewport lúc thả palette). */
  const fitViewKey = useMemo(() => viewMode, [viewMode]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData(REQUIREMENTS_PALETTE_DRAG_MIME);
      if (!raw) return;
      let payload: PaletteDragPayload;
      try {
        payload = JSON.parse(raw) as PaletteDragPayload;
      } catch {
        return;
      }
      const position = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });
      addNodeFromPalette(payload.kind, position);
    },
    [addNodeFromPalette, screenToFlowPosition]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string; data?: { kind?: string } }) => {
      if (node.data?.kind === "actor") {
        closePanel();
        return;
      }
      selectNode(node.id);
    },
    [closePanel, selectNode]
  );

  const onPaneClick = useCallback(() => {
    closePanel();
  }, [closePanel]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className={cn(REQUIREMENTS_WORKSPACE_TOOLBAR_CLASS, "flex-wrap")}>
        <span className="shrink-0 text-xs font-medium text-muted-foreground">
          Góc nhìn:
        </span>
        {(
          [
            ["epic", "Epic view"],
            ["feature", "Feature view"],
            ["full", "Full tree"],
          ] as const
        ).map(([mode, label]) => (
          <Button
            key={mode}
            type="button"
            size="xs"
            variant={viewMode === mode ? "secondary" : "ghost"}
            onClick={() => setViewMode(mode)}
          >
            {label}
          </Button>
        ))}
        <Button
          type="button"
          size="xs"
          variant="outline"
          className="ml-auto gap-1"
          onClick={runAutoLayout}
        >
          <LayoutGrid className="size-3.5" />
          Auto-layout
        </Button>
      </div>
      <p className="shrink-0 border-b border-border/60 bg-muted/20 px-3 py-1.5 text-[11px] text-muted-foreground">
        Click thẻ để sửa · Epic: nút + thêm Feature · Kéo Feature thả{" "}
        <strong className="font-medium text-foreground">lên</strong> thẻ Epic ·
        Góc nhìn &quot;Epic view&quot; ẩn Feature — dùng Full tree sau khi thêm
      </p>

      <div className="relative min-h-0 flex-1" onDragOver={onDragOver} onDrop={onDrop}>
        <ReactFlow
          nodes={visibleNodes}
          edges={visibleEdges}
          nodeTypes={requirementsFlowNodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          defaultEdgeOptions={REQUIREMENT_EDGE_DEFAULT_OPTIONS}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={1.5}
          nodesDraggable
          nodesConnectable
          elementsSelectable
          panOnScroll
          zoomOnScroll
          className={cn(
            reactFlowCanvasClassName,
            "h-full min-h-0 bg-muted/10 [&_.react-flow__attribution]:hidden",
            "[&_.react-flow__edge-path]:!stroke-[hsl(240_5%_58%)]",
            "[&_.react-flow__edge.animated_.react-flow__edge-path]:!stroke-[hsl(240_5%_64%)]",
            "[&_.react-flow__edge-path]:!stroke-width-[2.5]"
          )}
        >
          <Background {...reactFlowBackgroundProps} />
          <Controls className="!border-border !bg-card/90 !shadow-md" />
          <MiniMap
            className="!bottom-3 !left-3 !h-24 !w-36 !rounded-lg !border !border-border !bg-card/90"
            maskColor="rgb(0 0 0 / 0.55)"
            pannable
            zoomable
          />
          <FitViewOnGraphChange graphKey={fitViewKey} />
        </ReactFlow>
      </div>
    </div>
  );
}

export function RequirementsCanvas({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/80 bg-background",
        className
      )}
    >
      <ReactFlowProvider>
        <RequirementsCanvasInner />
      </ReactFlowProvider>
    </div>
  );
}
