"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import type { Edge } from "./react-flow";
import type { Position } from "@xyflow/react";

import type { SwimlaneWaypoint } from "./activity-react-flow";

export type SwimlaneEdgeGeometrySnapshot = {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
};

export type SwimlaneEdgeDragSnapshot = {
  edgeId: string;
  handles: SwimlaneWaypoint[];
  geometry: SwimlaneEdgeGeometrySnapshot;
  storedWaypoints?: SwimlaneWaypoint[];
  label?: {
    x: number;
    y: number;
    text: string;
    offsetX: number;
    offsetY: number;
  };
};

/** Menu chuột phải trên dây / chấm gãy. */
export type SwimlaneEdgeContextMenuRequest = {
  x: number;
  y: number;
  edgeId: string;
  flowX: number;
  flowY: number;
  interior: SwimlaneWaypoint[];
  geometry: SwimlaneEdgeGeometrySnapshot;
  storedWaypoints?: SwimlaneWaypoint[];
};

const edgeSnapshotRegistry = new Map<string, SwimlaneEdgeDragSnapshot>();
const registryListeners = new Set<() => void>();

let pendingEdgeContextMenu: SwimlaneEdgeContextMenuRequest | null = null;
const edgeContextMenuListeners = new Set<() => void>();

function notifyRegistryListeners() {
  for (const fn of registryListeners) fn();
}

function notifyEdgeContextMenuListeners() {
  for (const fn of edgeContextMenuListeners) fn();
}

export function requestSwimlaneEdgeContextMenu(
  request: SwimlaneEdgeContextMenuRequest
) {
  pendingEdgeContextMenu = request;
  notifyEdgeContextMenuListeners();
}

export function takeSwimlaneEdgeContextMenuRequest(): SwimlaneEdgeContextMenuRequest | null {
  const request = pendingEdgeContextMenu;
  pendingEdgeContextMenu = null;
  return request;
}

export type SwimlaneFlowEditorContextValue = {
  setEdges: Dispatch<SetStateAction<Edge[]>>;
  notifyGeometryChange: () => void;
  publishEdgeSnapshot: (snapshot: SwimlaneEdgeDragSnapshot) => void;
  removeEdgeSnapshot: (edgeId: string) => void;
};

const SwimlaneFlowEditorContext = createContext<SwimlaneFlowEditorContextValue | null>(
  null
);

export function getSwimlaneEdgeSnapshotList(): SwimlaneEdgeDragSnapshot[] {
  return [...edgeSnapshotRegistry.values()];
}

export function SwimlaneFlowEditorProvider({
  value,
  children,
}: {
  value: Omit<
    SwimlaneFlowEditorContextValue,
    "publishEdgeSnapshot" | "removeEdgeSnapshot"
  >;
  children: ReactNode;
}) {
  const publishEdgeSnapshot = useCallback((snapshot: SwimlaneEdgeDragSnapshot) => {
    edgeSnapshotRegistry.set(snapshot.edgeId, snapshot);
    notifyRegistryListeners();
  }, []);

  const removeEdgeSnapshot = useCallback((edgeId: string) => {
    if (edgeSnapshotRegistry.delete(edgeId)) {
      notifyRegistryListeners();
    }
  }, []);

  const fullValue: SwimlaneFlowEditorContextValue = {
    ...value,
    publishEdgeSnapshot,
    removeEdgeSnapshot,
  };

  return (
    <SwimlaneFlowEditorContext.Provider value={fullValue}>
      {children}
    </SwimlaneFlowEditorContext.Provider>
  );
}

export function useSwimlaneFlowEditor(): SwimlaneFlowEditorContextValue {
  const ctx = useContext(SwimlaneFlowEditorContext);
  if (!ctx) {
    throw new Error("useSwimlaneFlowEditor must be used inside SwimlaneFlowEditorProvider");
  }
  return ctx;
}

/** Re-render khi edge đăng ký lại vị trí handle (flow coords). */
export function useSwimlaneEdgeSnapshots(): SwimlaneEdgeDragSnapshot[] {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    const fn = () => bump();
    registryListeners.add(fn);
    return () => {
      registryListeners.delete(fn);
    };
  }, []);
  return getSwimlaneEdgeSnapshotList();
}

/** Lắng nghe menu chuột phải dây (từ edge / chấm gãy). */
export function useSwimlaneEdgeContextMenuListener(
  onRequest: (request: SwimlaneEdgeContextMenuRequest) => void
) {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    const fn = () => {
      const request = takeSwimlaneEdgeContextMenuRequest();
      if (request) onRequest(request);
      bump();
    };
    edgeContextMenuListeners.add(fn);
    return () => {
      edgeContextMenuListeners.delete(fn);
    };
  }, [onRequest]);
}
