"use client";

import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  type MutableRefObject,
} from "react";

import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createSwimlaneActivityDiagram,
  SwimlaneEdgeHandlesLayer,
  SwimlaneFlowEditorProvider,
  swimlaneActivityEdgeTypes,
  swimlaneActivityNodeTypes,
  swimlaneControlFlowEdgeDefaults,
  swimlaneReactFlowCanvasProps,
  swimlaneReactFlowClassName,
  swimlaneReactFlowControlsClassName,
} from "@/components/ui/swimlane-react-flow";
import type { SwimlaneWaypoint } from "@/components/ui/swimlane-react-flow";
import {
  Background,
  Controls,
  FitViewOnGraphChange,
  ReactFlow,
  ReactFlowProvider,
  reconnectEdge,
  reactFlowBackgroundProps,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
} from "@/components/ui/react-flow";
import {
  patchProjectFlowSwimlaneInCaches,
  useProjectFlow,
  useUpdateProjectFlowSwimlane,
} from "@/hooks/useFlow";
import {
  normalizeProjectFlowSwimlaneForPut,
  type ProjectFlow,
  type ProjectFlowSwimlane,
} from "@/lib/api/services/fetchFlow";
import { cn } from "@/lib/utils";

import {
  applyReactFlowLayoutToProjectFlowSwimlane,
  defaultSwimlaneForFlow,
  projectFlowSwimlaneToDiagramConfig,
} from "./flowSwimlaneBridge";
import { FlowSwimlaneLegend } from "./flowSwimlaneLegend";
import { FlowSwimlaneTemplatesPanel } from "./flowSwimlaneTemplatesPanel";

/** Con trực tiếp của `<ReactFlow>` — dùng `getNodes` + `setQueryData` khi kéo (không refetch). */
function SwimlaneDragCacheBridge({
  projectId,
  flowId,
  swimlane,
  onTickRef,
  onStopRef,
}: {
  projectId: string;
  flowId: string;
  swimlane: ProjectFlowSwimlane;
  onTickRef: MutableRefObject<(() => void) | null>;
  onStopRef: MutableRefObject<(() => void) | null>;
}) {
  const queryClient = useQueryClient();
  const { getNodes, getEdges } = useReactFlow();
  const swimlaneRef = useRef(swimlane);
  const rafIdRef = useRef<number | null>(null);

  const flush = useCallback(() => {
    const merged = applyReactFlowLayoutToProjectFlowSwimlane(
      getNodes(),
      getEdges(),
      swimlaneRef.current
    );
    const next = normalizeProjectFlowSwimlaneForPut(merged, flowId);
    patchProjectFlowSwimlaneInCaches(queryClient, projectId, flowId, next);
  }, [flowId, getEdges, getNodes, projectId, queryClient]);

  useLayoutEffect(() => {
    swimlaneRef.current = swimlane;
  }, [swimlane]);

  useLayoutEffect(() => {
    onTickRef.current = () => {
      if (rafIdRef.current != null) return;
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        flush();
      });
    };
    onStopRef.current = () => {
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      flush();
    };
    return () => {
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      onTickRef.current = null;
      onStopRef.current = null;
    };
  }, [flush, onTickRef, onStopRef]);

  return null;
}

const SWIMLANE_DIALOG_CONTENT_CLASS = cn(
  "flex w-[calc(100vw-1.25rem)] max-w-[calc(100vw-1.25rem)] flex-col gap-0 overflow-hidden p-0",
  "h-[calc(100dvh-1.25rem)] max-h-[calc(100dvh-1.25rem)]",
  "sm:max-w-[calc(100vw-1.25rem)]"
);

type FlowSwimlaneToolbarProps = {
  projectId: string;
  flowId: string;
  swimlane: ProjectFlowSwimlane;
  onBusy?: (busy: boolean) => void;
};

function FlowSwimlaneToolbar({
  projectId,
  flowId,
  swimlane,
  onBusy,
}: FlowSwimlaneToolbarProps) {
  const { getNodes, getEdges } = useReactFlow();

  const updateSwimlane = useUpdateProjectFlowSwimlane({
    onMutate: () => onBusy?.(true),
    onSettled: () => onBusy?.(false),
  });

  const handleSaveLayout = useCallback(() => {
    const merged = applyReactFlowLayoutToProjectFlowSwimlane(
      getNodes(),
      getEdges(),
      swimlane
    );
    const diagram = normalizeProjectFlowSwimlaneForPut(merged, flowId);
    void updateSwimlane.mutateAsync({
      projectId,
      flowId,
      diagram,
    });
  }, [flowId, getEdges, getNodes, projectId, swimlane, updateSwimlane]);

  const pending = updateSwimlane.isPending;

  return (
    <div className="pointer-events-none absolute top-2 right-2 left-2 z-20 flex flex-wrap items-start justify-between gap-2 sm:left-3 sm:right-3 sm:top-3">
      <div className="pointer-events-auto flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="shadow-sm"
          disabled={pending}
          onClick={handleSaveLayout}
        >
          {pending ? "Đang lưu…" : "Lưu layout"}
        </Button>
      </div>
    </div>
  );
}

type FlowSwimlaneCanvasProps = {
  projectId: string;
  flowId: string;
  swimlane: ProjectFlowSwimlane;
  flowUpdatedAt: string;
  onBusy?: (busy: boolean) => void;
};

function FlowSwimlaneCanvas({
  projectId,
  flowId,
  swimlane,
  flowUpdatedAt,
  onBusy,
}: FlowSwimlaneCanvasProps) {
  const dragCacheTickRef = useRef<(() => void) | null>(null);
  const dragCacheStopRef = useRef<(() => void) | null>(null);

  const diagram = useMemo(() => {
    const config = projectFlowSwimlaneToDiagramConfig(swimlane);
    return createSwimlaneActivityDiagram(config);
  }, [swimlane]);

  const [nodes, , onNodesChange] = useNodesState(diagram.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(diagram.edges);
  const { screenToFlowPosition } = useReactFlow();

  const notifyGeometryChange = useCallback(() => {
    dragCacheTickRef.current?.();
  }, []);

  const editorStore = useMemo(
    () => ({
      setEdges,
      notifyGeometryChange,
    }),
    [notifyGeometryChange, setEdges]
  );

  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      setEdges((eds) => reconnectEdge(oldEdge, newConnection, eds));
    },
    [setEdges]
  );

  const onEdgeDoubleClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      const pos = screenToFlowPosition({
        x: _event.clientX,
        y: _event.clientY,
      });
      setEdges((eds) =>
        eds.map((e) => {
          if (e.id !== edge.id) return e;
          const data = { ...(e.data ?? {}) } as {
            waypoints?: SwimlaneWaypoint[];
          };
          const list = [...(data.waypoints ?? [])];
          list.push({ x: pos.x, y: pos.y });
          return { ...e, data: { ...data, waypoints: list } };
        })
      );
      dragCacheTickRef.current?.();
    },
    [screenToFlowPosition, setEdges]
  );

  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      if (!("source" in connection)) return false;
      const c = connection as Connection & { edgeId?: string };
      const src = nodes.find((n) => n.id === c.source);
      const tgt = nodes.find((n) => n.id === c.target);
      if (!src || !tgt) return false;
      if (src.type === "swimlanePool" || tgt.type === "swimlanePool") return false;
      if (c.edgeId) {
        const old = edges.find((e) => e.id === c.edgeId);
        if (old && (c.source !== old.source || c.target !== old.target)) return false;
      }
      return true;
    },
    [edges, nodes]
  );

  return (
    <div
      className="relative flex h-full min-h-0 w-full min-w-0 flex-1 overflow-hidden rounded-xl border border-border/70 bg-muted/20"
      onContextMenu={(event) => event.preventDefault()}
    >
      <SwimlaneFlowEditorProvider value={editorStore}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onReconnect={onReconnect}
          onEdgeDoubleClick={onEdgeDoubleClick}
          edgesReconnectable
          edgesFocusable
          elevateEdgesOnSelect
          isValidConnection={isValidConnection}
          onNodeDrag={() => dragCacheTickRef.current?.()}
          onNodeDragStop={() => dragCacheStopRef.current?.()}
          nodeTypes={swimlaneActivityNodeTypes}
          edgeTypes={swimlaneActivityEdgeTypes}
          defaultEdgeOptions={swimlaneControlFlowEdgeDefaults}
          {...swimlaneReactFlowCanvasProps}
          className={swimlaneReactFlowClassName}
        >
          <SwimlaneEdgeHandlesLayer />
          <SwimlaneDragCacheBridge
            projectId={projectId}
            flowId={flowId}
            swimlane={swimlane}
            onTickRef={dragCacheTickRef}
            onStopRef={dragCacheStopRef}
          />
          <Background {...reactFlowBackgroundProps} />
          <Controls
            position="bottom-right"
            className={swimlaneReactFlowControlsClassName}
          />
          <FitViewOnGraphChange graphKey={`${diagram.graphKey}-${flowUpdatedAt}`} />
          <FlowSwimlaneToolbar
            projectId={projectId}
            flowId={flowId}
            swimlane={swimlane}
            onBusy={onBusy}
          />
          <FlowSwimlaneLegend />
          <FlowSwimlaneTemplatesPanel
            projectId={projectId}
            flowId={flowId}
          />
        </ReactFlow>
      </SwimlaneFlowEditorProvider>
    </div>
  );
}

type FlowSwimlaneDialogBodyProps = {
  projectId: string;
  flowId: string;
  flowName: string;
  onClose: () => void;
  onBusy?: (busy: boolean) => void;
};

function FlowSwimlaneDialogBody({
  projectId,
  flowId,
  flowName,
  onClose,
  onBusy,
}: FlowSwimlaneDialogBodyProps) {
  const {
    data: flow,
    isPending,
    isError,
    error,
    refetch,
  } = useProjectFlow(projectId, flowId);

  const swimlane = useMemo((): ProjectFlowSwimlane | null => {
    if (!flow) return null;
    return flow.swimlane ?? defaultSwimlaneForFlow(flow.id, flow.name);
  }, [flow]);

  if (isPending || !flow) {
    return (
      <div className="grid gap-3 py-2">
        <DialogHeader>
          <DialogTitle className="text-lg">Swimlane — {flowName}</DialogTitle>
          <DialogDescription>Đang tải sơ đồ…</DialogDescription>
        </DialogHeader>
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="min-h-[50vh] w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !swimlane) {
    return (
      <div className="grid gap-3 py-2">
        <DialogHeader>
          <DialogTitle className="text-lg">Swimlane — {flowName}</DialogTitle>
          <DialogDescription>Không tải được flow.</DialogDescription>
        </DialogHeader>
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Lỗi không xác định."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
            Thử lại
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-5.75rem)] min-h-[min(480px,90dvh)] w-full max-w-full flex-col gap-2 overflow-hidden">
      <DialogHeader className="shrink-0 space-y-1 pb-0">
        <DialogTitle className="text-lg">Swimlane — {flow.name}</DialogTitle>
        <DialogDescription>
          Chỉnh layout swimlane — chú thích góc trái; template flow ở panel phải.
        </DialogDescription>
      </DialogHeader>

      <ReactFlowProvider>
        <FlowSwimlaneCanvas
          key={`${flow.id}-${flow.updatedAt}`}
          projectId={projectId}
          flowId={flow.id}
          swimlane={swimlane}
          flowUpdatedAt={flow.updatedAt}
          onBusy={onBusy}
        />
      </ReactFlowProvider>
    </div>
  );
}

export type FlowSwimlaneDetailDialogProps = {
  projectId: string | null;
  flow: ProjectFlow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBusy?: (busy: boolean) => void;
};

export function FlowSwimlaneDetailDialog({
  projectId,
  flow,
  open,
  onOpenChange,
  onBusy,
}: FlowSwimlaneDetailDialogProps) {
  const pid = projectId?.trim() ?? "";
  const fid = flow?.id?.trim() ?? "";

  const handleOpenChange = useCallback(
    (next: boolean) => {
      onOpenChange(next);
    },
    [onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton
        className={SWIMLANE_DIALOG_CONTENT_CLASS}
      >
        {open && pid && fid && flow ? (
          <div className="box-border flex min-h-0 w-full flex-col overflow-hidden p-4 pt-3">
            <FlowSwimlaneDialogBody
              key={fid}
              projectId={pid}
              flowId={fid}
              flowName={flow.name}
              onClose={() => handleOpenChange(false)}
              onBusy={onBusy}
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
