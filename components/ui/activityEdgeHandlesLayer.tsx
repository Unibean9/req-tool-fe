"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { useReactFlow, ViewportPortal } from "@xyflow/react";

import {
  axisAlignedRunNeedsStraightening,
  buildSwimlaneEdgePolyline,
  findClosestPolylineSegmentIndex,
  straightenSwimlaneEdgeSegmentAt,
} from "@/lib/activity/activityEdgeStraighten";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import {
  requestSwimlaneEdgeContextMenu,
  useSwimlaneEdgeContextMenuListener,
  useSwimlaneEdgeSnapshots,
  useSwimlaneFlowEditor,
  type SwimlaneEdgeContextMenuRequest,
  type SwimlaneEdgeDragSnapshot,
} from "./activityFlowEditorContext";
import type { Edge } from "./react-flow";
import type { SwimlaneWaypoint } from "./activity-react-flow";

const HANDLE_SIZE_PX = 14;
/** Vùng bấm (flow portal) lớn hơn chấm hiển thị để dễ chuột phải / kéo. */
const HANDLE_HIT_PX = 28;
/** Portal `body` — phải > `DialogContent` (`z-[210]` trong `components/ui/dialog.tsx`). */
const WAYPOINT_MENU_Z_CLASS = "z-[220]";
const SWIMLANE_EDGE_CONTEXT_HIT_PX = 24;

type EdgeContextMenuState = SwimlaneEdgeContextMenuRequest & {
  waypointIndex: number | null;
  segmentIndex: number;
  showDelete: boolean;
  showStraighten: boolean;
};

function resolveEdgeContextMenuActions(
  request: SwimlaneEdgeContextMenuRequest,
  hitThresholdFlow: number
): EdgeContextMenuState | null {
  const polyline = buildSwimlaneEdgePolyline(request.geometry, request.interior);
  if (polyline.length < 2) return null;

  const flowPoint = { x: request.flowX, y: request.flowY };
  const { segmentIndex, distance: segDist } = findClosestPolylineSegmentIndex(
    polyline,
    flowPoint
  );

  let waypointIndex: number | null = null;
  let waypointDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < request.interior.length; i++) {
    const h = request.interior[i]!;
    const d = Math.hypot(h.x - flowPoint.x, h.y - flowPoint.y);
    if (d < waypointDist) {
      waypointDist = d;
      waypointIndex = i;
    }
  }

  const showDelete =
    waypointIndex != null && waypointDist <= hitThresholdFlow;
  const showStraighten =
    segDist <= hitThresholdFlow &&
    axisAlignedRunNeedsStraightening(polyline, segmentIndex);

  if (!showDelete && !showStraighten) return null;

  return {
    ...request,
    waypointIndex: showDelete ? waypointIndex : null,
    segmentIndex,
    showDelete,
    showStraighten,
  };
}

type WaypointDragState = {
  edgeId: string;
  index: number;
  pointerX: number;
  pointerY: number;
  startX: number;
  startY: number;
  list: SwimlaneWaypoint[];
};

type LabelDragState = {
  edgeId: string;
  pointerX: number;
  pointerY: number;
  offsetX: number;
  offsetY: number;
};

function applyWaypointsToEdge(
  edges: Edge[],
  edgeId: string,
  list: SwimlaneWaypoint[]
): Edge[] {
  return edges.map((e) => {
    if (e.id !== edgeId) return e;
    const data = { ...(e.data ?? {}) } as Record<string, unknown>;
    if (list.length === 0) delete data.waypoints;
    else data.waypoints = list;
    return { ...e, data };
  });
}

type SwimlaneWaypointHandleProps = {
  wp: SwimlaneWaypoint;
  onContextMenu: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerCancel: () => void;
};

function SwimlaneWaypointHandle({
  wp,
  onContextMenu,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: SwimlaneWaypointHandleProps) {
  return (
    <div
      className="nodrag nopan pointer-events-auto flex cursor-grab items-center justify-center active:cursor-grabbing"
      style={{
        position: "absolute",
        left: wp.x,
        top: wp.y,
        width: HANDLE_HIT_PX,
        height: HANDLE_HIT_PX,
        transform: "translate(-50%, -50%)",
      }}
      title="Kéo chỉnh dây · chuột phải: menu đoạn"
      onContextMenu={onContextMenu}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <div
        className="rounded-full border-2 border-primary bg-background shadow-md"
        style={{ width: HANDLE_SIZE_PX, height: HANDLE_SIZE_PX }}
      />
    </div>
  );
}

/** Handle HTML trong `.react-flow__viewport-portal` — `left/top` = tọa độ flow (cùng hệ với edge). */
export function SwimlaneEdgeHandlesLayer() {
  const snapshots = useSwimlaneEdgeSnapshots();
  const { setEdges, notifyGeometryChange } = useSwimlaneFlowEditor();
  const { getZoom } = useReactFlow();

  const waypointDragRef = useRef<WaypointDragState | null>(null);
  const labelDragRef = useRef<LabelDragState | null>(null);
  const [dragPreview, setDragPreview] = useState<{
    edgeId: string;
    list: SwimlaneWaypoint[];
  } | null>(null);
  const [labelPreview, setLabelPreview] = useState<{
    edgeId: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [edgeMenu, setEdgeMenu] = useState<EdgeContextMenuState | null>(null);
  const edgeMenuRef = useRef<HTMLDivElement | null>(null);

  const applyWaypoints = useCallback(
    (edgeId: string, list: SwimlaneWaypoint[], notify: boolean) => {
      setEdges((eds) => applyWaypointsToEdge(eds, edgeId, list));
      if (notify) notifyGeometryChange();
    },
    [notifyGeometryChange, setEdges]
  );

  const selectEdge = useCallback(
    (edgeId: string) => {
      setEdges((eds) =>
        eds.map((e) => ({
          ...e,
          selected: e.id === edgeId,
        }))
      );
    },
    [setEdges]
  );

  const showEdgeContextMenu = useCallback(
    (request: SwimlaneEdgeContextMenuRequest) => {
      const threshold =
        SWIMLANE_EDGE_CONTEXT_HIT_PX / Math.max(getZoom(), 0.05);
      const resolved = resolveEdgeContextMenuActions(request, threshold);
      if (!resolved) return;
      selectEdge(request.edgeId);
      setEdgeMenu(resolved);
    },
    [getZoom, selectEdge, setEdgeMenu]
  );

  useSwimlaneEdgeContextMenuListener(showEdgeContextMenu);

  const straightenSegment = useCallback(
    (menu: EdgeContextMenuState) => {
      const { waypoints, changed } = straightenSwimlaneEdgeSegmentAt(
        menu.geometry,
        menu.interior,
        menu.segmentIndex
      );
      if (!changed) {
        toast.message("Đoạn này đã thẳng");
        setEdgeMenu(null);
        return;
      }
      setEdges((eds) =>
        eds.map((e) => {
          if (e.id !== menu.edgeId) return e;
          const data = { ...(e.data ?? {}) } as Record<string, unknown>;
          if (waypoints == null || waypoints.length === 0) delete data.waypoints;
          else data.waypoints = waypoints;
          return { ...e, data };
        })
      );
      notifyGeometryChange();
      setEdgeMenu(null);
    },
    [notifyGeometryChange, setEdges, setEdgeMenu]
  );

  const deleteWaypoint = useCallback(
    (edgeId: string, index: number, list: SwimlaneWaypoint[]) => {
      const next = list.filter((_, i) => i !== index);
      waypointDragRef.current = null;
      setDragPreview(null);
      applyWaypoints(edgeId, next, true);
    },
    [applyWaypoints]
  );

  const applyLabelOffset = useCallback(
    (edgeId: string, offset: { x: number; y: number }, notify: boolean) => {
      setEdges((eds) =>
        eds.map((e) => {
          if (e.id !== edgeId) return e;
          const data = { ...(e.data ?? {}) };
          if (offset.x === 0 && offset.y === 0) delete data.labelOffset;
          else data.labelOffset = offset;
          return { ...e, data };
        })
      );
      if (notify) notifyGeometryChange();
    },
    [notifyGeometryChange, setEdges]
  );

  useEffect(() => {
    if (!edgeMenu) return;
    const close = () => setEdgeMenu(null);
    const onPointerDown = (event: PointerEvent) => {
      if (edgeMenuRef.current?.contains(event.target as Node)) return;
      close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const attachId = window.setTimeout(() => {
      window.addEventListener("pointerdown", onPointerDown, true);
    }, 0);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(attachId);
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [edgeMenu]);

  const handlesForSnapshot = useCallback(
    (snap: SwimlaneEdgeDragSnapshot): SwimlaneWaypoint[] => {
      if (dragPreview?.edgeId === snap.edgeId) return dragPreview.list;
      return snap.handles;
    },
    [dragPreview]
  );

  return (
    <ViewportPortal>
      <div
        className={cn("pointer-events-none z-10")}
        aria-hidden={snapshots.length === 0}
      >
        {snapshots.map((snap) => {
          const label = snap.label;
          const offsetX =
            labelPreview?.edgeId === snap.edgeId
              ? labelPreview.offsetX
              : (label?.offsetX ?? 0);
          const offsetY =
            labelPreview?.edgeId === snap.edgeId
              ? labelPreview.offsetY
              : (label?.offsetY ?? 0);
          const handleList = handlesForSnapshot(snap).map((p) => ({
            x: p.x,
            y: p.y,
          }));

          return (
            <div key={snap.edgeId}>
              {handleList.map((wp, index) => (
                <SwimlaneWaypointHandle
                  key={`${snap.edgeId}-wp-${index}`}
                  wp={wp}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    requestSwimlaneEdgeContextMenu({
                      x: event.clientX,
                      y: event.clientY,
                      edgeId: snap.edgeId,
                      flowX: wp.x,
                      flowY: wp.y,
                      interior: handleList,
                      geometry: snap.geometry,
                      storedWaypoints: snap.storedWaypoints,
                    });
                  }}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    event.currentTarget.setPointerCapture(event.pointerId);
                    const listCopy = handleList.map((p) => ({
                      x: p.x,
                      y: p.y,
                    }));
                    waypointDragRef.current = {
                      edgeId: snap.edgeId,
                      index,
                      pointerX: event.clientX,
                      pointerY: event.clientY,
                      startX: wp.x,
                      startY: wp.y,
                      list: listCopy,
                    };
                    setDragPreview({
                      edgeId: snap.edgeId,
                      list: listCopy,
                    });
                  }}
                  onPointerMove={(event) => {
                    const d = waypointDragRef.current;
                    if (
                      !d ||
                      d.edgeId !== snap.edgeId ||
                      d.index !== index
                    ) {
                      return;
                    }
                    event.stopPropagation();
                    const zoom = getZoom();
                    const list = [...d.list];
                    list[index] = {
                      x: d.startX + (event.clientX - d.pointerX) / zoom,
                      y: d.startY + (event.clientY - d.pointerY) / zoom,
                    };
                    waypointDragRef.current = { ...d, list };
                    setDragPreview({ edgeId: snap.edgeId, list });
                    applyWaypoints(snap.edgeId, list, false);
                  }}
                  onPointerUp={(event) => {
                    const d = waypointDragRef.current;
                    if (!d || d.edgeId !== snap.edgeId) return;
                    event.stopPropagation();
                    event.currentTarget.releasePointerCapture(
                      event.pointerId
                    );
                    waypointDragRef.current = null;
                    setDragPreview(null);
                    applyWaypoints(d.edgeId, d.list, true);
                  }}
                  onPointerCancel={() => {
                    waypointDragRef.current = null;
                    setDragPreview(null);
                  }}
                />
              ))}
              {label ? (
                <div
                  className="nodrag nopan pointer-events-auto cursor-grab select-none rounded-sm bg-background/90 px-1 text-xs font-bold text-foreground shadow-sm active:cursor-grabbing"
                  style={{
                    position: "absolute",
                    left: label.x + offsetX,
                    top: label.y + offsetY,
                    transform: "translate(-50%, -50%)",
                  }}
                  onPointerDown={(
                    event: ReactPointerEvent<HTMLDivElement>
                  ) => {
                    event.stopPropagation();
                    event.preventDefault();
                    event.currentTarget.setPointerCapture(event.pointerId);
                    labelDragRef.current = {
                      edgeId: snap.edgeId,
                      pointerX: event.clientX,
                      pointerY: event.clientY,
                      offsetX,
                      offsetY,
                    };
                  }}
                  onPointerMove={(
                    event: ReactPointerEvent<HTMLDivElement>
                  ) => {
                    const d = labelDragRef.current;
                    if (!d || d.edgeId !== snap.edgeId) return;
                    event.stopPropagation();
                    const zoom = getZoom();
                    setLabelPreview({
                      edgeId: snap.edgeId,
                      offsetX:
                        d.offsetX + (event.clientX - d.pointerX) / zoom,
                      offsetY:
                        d.offsetY + (event.clientY - d.pointerY) / zoom,
                    });
                  }}
                  onPointerUp={(event: ReactPointerEvent<HTMLDivElement>) => {
                    const d = labelDragRef.current;
                    if (!d || d.edgeId !== snap.edgeId) return;
                    event.stopPropagation();
                    event.currentTarget.releasePointerCapture(
                      event.pointerId
                    );
                    labelDragRef.current = null;
                    const ox =
                      labelPreview?.edgeId === snap.edgeId
                        ? labelPreview.offsetX
                        : offsetX;
                    const oy =
                      labelPreview?.edgeId === snap.edgeId
                        ? labelPreview.offsetY
                        : offsetY;
                    setLabelPreview(null);
                    applyLabelOffset(snap.edgeId, { x: ox, y: oy }, true);
                  }}
                  onPointerCancel={() => {
                    labelDragRef.current = null;
                    setLabelPreview(null);
                  }}
                >
                  {label.text}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      {edgeMenu &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={edgeMenuRef}
            role="menu"
            className={cn(
              "fixed min-w-44 overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md",
              WAYPOINT_MENU_Z_CLASS
            )}
            style={{ left: edgeMenu.x, top: edgeMenu.y }}
            onContextMenu={(event) => event.preventDefault()}
          >
            {edgeMenu.showStraighten ? (
              <button
                type="button"
                role="menuitem"
                className="flex w-full cursor-default items-center rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-accent focus:bg-accent"
                onClick={() => straightenSegment(edgeMenu)}
              >
                Làm thẳng dây
              </button>
            ) : null}
            {edgeMenu.showDelete && edgeMenu.waypointIndex != null ? (
              <button
                type="button"
                role="menuitem"
                className="flex w-full cursor-default items-center rounded-md px-2 py-1.5 text-left text-sm text-destructive outline-none hover:bg-destructive/10 focus:bg-destructive/10"
                onClick={() => {
                  deleteWaypoint(
                    edgeMenu.edgeId,
                    edgeMenu.waypointIndex!,
                    edgeMenu.interior
                  );
                  setEdgeMenu(null);
                }}
              >
                Xóa điểm gãy
              </button>
            ) : null}
          </div>,
          document.body
        )}
    </ViewportPortal>
  );
}
