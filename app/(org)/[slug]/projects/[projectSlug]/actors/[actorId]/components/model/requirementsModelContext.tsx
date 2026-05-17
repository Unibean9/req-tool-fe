"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";
import { toast } from "sonner";

import {
  useActorCanvasLayout,
  useActorRequirementModel,
  useCreateActorEpic,
  useSaveActorCanvasLayout,
} from "@/hooks/useActor";
import {
  useCreateEpicFeature,
  useDeleteEpic,
  useUpdateEpic,
} from "@/hooks/useEpic";
import {
  useCreateFeatureUserStory,
  useDeleteFeature,
  useUpdateFeature,
} from "@/hooks/useFeature";
import { useDeleteUserStory, useUpdateUserStory } from "@/hooks/useStory";
import type { CanvasLayoutNode } from "@/lib/api/services/fetchActor";

import type {
  PaletteCreatableKind,
  RequirementEdge,
  RequirementNode,
  RequirementNodeData,
  RequirementNodeKind,
  RequirementsModelActorMeta,
  RequirementsModelState,
  RequirementsViewMode,
} from "./requirementsModelTypes";
import {
  REQUIREMENT_EDGE_DEFAULT_OPTIONS,
  REQUIREMENT_INVALID_EDGE_STYLE,
} from "./requirementsModelConstants";
import {
  actorEpicToFlowNode,
  actorEpicToNodeData,
  actorFeatureToFlowNode,
  actorFeatureToNodeData,
  actorUserStoryToFlowNode,
  actorUserStoryToNodeData,
  applyCanvasLayoutToNodes,
  buildModelExcludingPendingDeletes,
  buildRequirementGraphFromPayload,
  buildRequirementModelSignature,
  epicNodeDataToUpdateRequest,
  featureNodeDataToUpdateRequest,
  mergeUserStoryNodeDataFromPatchResponse,
  userStoryNodeDataToUpdateRequest,
} from "./requirementsModelFromApi";
import {
  isEpicNodeData,
  isFeatureNodeData,
  isUserStoryNodeData,
} from "./requirementsModelTypes";
import {
  createOptimisticEpicFlowNode,
  createOptimisticFeatureFlowNode,
  createOptimisticUserStoryFlowNode,
  isOptimisticNodeId,
  parentChildOptimisticEdge,
} from "./requirementsModelOptimistic";
import {
  findNodeAtFlowPosition,
  layoutRequirementTree,
  positionChildBelowParent,
} from "./requirementsModelLayout";
import { validateRequirementConnection } from "./requirementsModelValidation";

const LAYOUT_SAVE_DEBOUNCE_MS = 600;
const EPIC_PATCH_DEBOUNCE_MS = 500;
const FEATURE_PATCH_DEBOUNCE_MS = 500;
const STORY_PATCH_DEBOUNCE_MS = 500;

function nodesToCanvasLayout(nodes: RequirementNode[]): CanvasLayoutNode[] {
  return nodes.map((n) => ({
    id: n.id,
    kind: n.data.kind,
    x: n.position.x,
    y: n.position.y,
    collapsed: n.data.collapsed,
  }));
}

/** Các node con (feature, story, …) nối dưới `rootId`. */
function collectDescendantNodeIds(
  rootId: string,
  edges: RequirementEdge[]
): Set<string> {
  const descendants = new Set<string>();
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop()!;
    for (const edge of edges) {
      if (edge.source !== id || edge.data?.invalid) continue;
      if (!descendants.has(edge.target)) {
        descendants.add(edge.target);
        stack.push(edge.target);
      }
    }
  }
  return descendants;
}

type RequirementsModelContextValue = {
  nodes: RequirementNode[];
  edges: RequirementEdge[];
  visibleNodes: RequirementNode[];
  visibleEdges: RequirementEdge[];
  viewMode: RequirementsViewMode;
  setViewMode: (mode: RequirementsViewMode) => void;
  selectedNodeId: string | null;
  panelOpen: boolean;
  selectNode: (id: string | null) => void;
  closePanel: () => void;
  updateNodeData: (id: string, patch: Partial<RequirementNodeData>) => void;
  setNodes: React.Dispatch<React.SetStateAction<RequirementNode[]>>;
  setEdges: React.Dispatch<React.SetStateAction<RequirementEdge[]>>;
  onNodesChange: OnNodesChange<RequirementNode>;
  onEdgesChange: OnEdgesChange<RequirementEdge>;
  onConnect: OnConnect;
  actorMeta: RequirementsModelActorMeta;
  addNodeFromPalette: (
    kind: PaletteCreatableKind,
    position: { x: number; y: number }
  ) => void;
  quickAddFeature: (epicNodeId: string) => void;
  quickAddUserStory: (featureNodeId: string) => void;
  deleteNode: (nodeId: string) => void;
  toggleNodeCollapsed: (nodeId: string) => void;
  runAutoLayout: () => void;
  persistCanvasLayout: () => void;
  suggestedActorsForStory: () => string[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isCreatingEpic: boolean;
  isUpdatingEpic: boolean;
  isDeletingEpic: boolean;
  isCreatingFeature: boolean;
  isUpdatingFeature: boolean;
  isDeletingFeature: boolean;
  isCreatingUserStory: boolean;
  isUpdatingUserStory: boolean;
  isDeletingUserStory: boolean;
  isSavingLayout: boolean;
  refetch: () => void;
};

const RequirementsModelContext =
  createContext<RequirementsModelContextValue | null>(null);

function filterByViewMode(
  state: RequirementsModelState,
  viewMode: RequirementsViewMode
): RequirementsModelState {
  const hideKinds = new Set<RequirementNodeKind>();
  if (viewMode === "epic") {
    hideKinds.add("feature");
    hideKinds.add("userStory");
  } else if (viewMode === "feature") {
    hideKinds.add("userStory");
  }
  const visibleIds = new Set(
    state.nodes.filter((n) => !hideKinds.has(n.data.kind)).map((n) => n.id)
  );
  const collapsedHidden = new Set<string>();
  for (const n of state.nodes) {
    if (!n.data.collapsed) continue;
    const childEdges = state.edges.filter((e) => e.source === n.id);
    const stack = childEdges.map((e) => e.target);
    while (stack.length) {
      const id = stack.pop()!;
      if (collapsedHidden.has(id)) continue;
      collapsedHidden.add(id);
      state.edges
        .filter((e) => e.source === id)
        .forEach((e) => stack.push(e.target));
    }
  }
  const nodes = state.nodes.filter(
    (n) => visibleIds.has(n.id) && !collapsedHidden.has(n.id)
  );
  const nodeIdSet = new Set(nodes.map((n) => n.id));
  const edges = state.edges.filter(
    (e) =>
      nodeIdSet.has(e.source) &&
      nodeIdSet.has(e.target) &&
      !e.data?.invalid
  );
  return { nodes, edges };
}

const EMPTY_ACTOR_META: RequirementsModelActorMeta = {
  id: "",
  name: "Actor",
  roleDescription: "",
};

export function RequirementsModelProvider({
  projectId,
  actorId,
  children,
}: {
  projectId: string | null;
  actorId: string;
  children: ReactNode;
}) {
  const {
    data: requirementModel,
    isPending: isRequirementModelLoading,
    isError: isRequirementModelError,
    error: requirementModelError,
    refetch: refetchRequirementModel,
  } = useActorRequirementModel(projectId, actorId);

  const {
    data: canvasLayout,
    isPending: isCanvasLayoutLoading,
    isError: isCanvasLayoutError,
    refetch: refetchCanvasLayout,
  } = useActorCanvasLayout(projectId, actorId);

  const isLoading = isRequirementModelLoading || isCanvasLayoutLoading;
  const isError = isRequirementModelError;
  const error = requirementModelError;

  const refetch = useCallback(() => {
    void refetchRequirementModel();
    void refetchCanvasLayout();
  }, [refetchRequirementModel, refetchCanvasLayout]);

  const [actorMeta, setActorMeta] = useState<RequirementsModelActorMeta>(
    EMPTY_ACTOR_META
  );
  const [nodes, setNodes, onNodesChangeBase] = useNodesState<RequirementNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<RequirementEdge>([]);
  const [graphHydrated, setGraphHydrated] = useState(false);

  const [viewMode, setViewMode] = useState<RequirementsViewMode>("full");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const panelOpen = selectedNodeId != null;

  const layoutSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const epicPatchTimersRef = useRef(
    new Map<string, ReturnType<typeof setTimeout>>()
  );
  const featurePatchTimersRef = useRef(
    new Map<string, ReturnType<typeof setTimeout>>()
  );
  const storyPatchTimersRef = useRef(
    new Map<string, ReturnType<typeof setTimeout>>()
  );
  const requirementModelSigRef = useRef<string | null>(null);
  /** Epic đang chờ DELETE — tránh hydrate từ cache cũ làm node hiện lại. */
  const pendingEpicDeleteIdsRef = useRef<Set<string>>(new Set());
  /** Feature đang chờ DELETE — cùng mục đích với epic. */
  const pendingFeatureDeleteIdsRef = useRef<Set<string>>(new Set());
  /** User story đang chờ DELETE. */
  const pendingUserStoryDeleteIdsRef = useRef<Set<string>>(new Set());
  /** Node optimistic đang chờ POST (id tạm). */
  const pendingOptimisticIdsRef = useRef<Set<string>>(new Set());
  /** Optimistic đã hủy trước khi POST xong — onSuccess sẽ xóa entity trên server. */
  const cancelledOptimisticIdsRef = useRef<Set<string>>(new Set());
  /** Tắt persist sau 501 — endpoint canvas-layout thường optional trên BE. */
  const canvasLayoutPersistEnabledRef = useRef(true);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const actorMetaRef = useRef(actorMeta);
  nodesRef.current = nodes;
  edgesRef.current = edges;
  actorMetaRef.current = actorMeta;

  const saveCanvasLayoutMutation = useSaveActorCanvasLayout({
    onError: (error) => {
      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof (error as { code: unknown }).code === "number"
          ? (error as { code: number }).code
          : undefined;
      if (code === 501) {
        canvasLayoutPersistEnabledRef.current = false;
      }
    },
  });
  const createEpicMutation = useCreateActorEpic({
    invalidateRequirementModel: false,
    showSuccessToast: true,
  });
  const updateEpicMutation = useUpdateEpic({
    invalidateRequirementModel: false,
    invalidateCanvasLayout: false,
    showSuccessToast: false,
    onSuccess: (res, variables) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== variables.epicId || !isEpicNodeData(n.data)) return n;
          return {
            ...n,
            data: {
              ...actorEpicToNodeData(res.data),
              collapsed: n.data.collapsed,
            },
          };
        })
      );
    },
  });
  const createEpicFeatureMutation = useCreateEpicFeature({
    invalidateRequirementModel: false,
    invalidateCanvasLayout: false,
    showSuccessToast: true,
  });
  const updateFeatureMutation = useUpdateFeature({
    invalidateRequirementModel: false,
    invalidateCanvasLayout: false,
    showSuccessToast: false,
    onSuccess: (res, variables) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== variables.featureId || !isFeatureNodeData(n.data)) {
            return n;
          }
          return {
            ...n,
            data: {
              ...actorFeatureToNodeData(res.data),
              collapsed: n.data.collapsed,
            },
          };
        })
      );
    },
  });
  const createFeatureUserStoryMutation = useCreateFeatureUserStory({
    invalidateRequirementModel: false,
    invalidateCanvasLayout: false,
    showSuccessToast: true,
  });
  const updateUserStoryMutation = useUpdateUserStory({
    invalidateRequirementModel: false,
    invalidateCanvasLayout: false,
    showSuccessToast: false,
    onSuccess: (res, variables) => {
      const lockedActorRef = actorMetaRef.current.name.trim() || "Actor";
      const fromApi = actorUserStoryToNodeData(res.data);
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== variables.userStoryId || !isUserStoryNodeData(n.data)) {
            return n;
          }
          const live = nodesRef.current.find((row) => row.id === n.id);
          const localData =
            live && isUserStoryNodeData(live.data) ? live.data : n.data;
          return {
            ...n,
            data: mergeUserStoryNodeDataFromPatchResponse(
              localData,
              fromApi,
              lockedActorRef
            ),
          };
        })
      );
    },
  });

  useEffect(() => {
    setGraphHydrated(false);
    requirementModelSigRef.current = null;
    pendingEpicDeleteIdsRef.current.clear();
    pendingFeatureDeleteIdsRef.current.clear();
    pendingUserStoryDeleteIdsRef.current.clear();
    pendingOptimisticIdsRef.current.clear();
    cancelledOptimisticIdsRef.current.clear();
    canvasLayoutPersistEnabledRef.current = true;
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
    setActorMeta({ id: actorId, name: "Actor", roleDescription: "" });
  }, [actorId, projectId, setEdges, setNodes]);

  useEffect(() => {
    if (!requirementModel || isCanvasLayoutLoading) return;

    const savedLayout =
      canvasLayout && !isCanvasLayoutError ? canvasLayout.nodes : [];

    const modelForBuild = buildModelExcludingPendingDeletes(
      requirementModel,
      pendingEpicDeleteIdsRef.current,
      pendingFeatureDeleteIdsRef.current,
      pendingUserStoryDeleteIdsRef.current
    );

    const modelSig = buildRequirementModelSignature(modelForBuild);
    const modelChanged = requirementModelSigRef.current !== modelSig;

    if (modelChanged || !graphHydrated) {
      requirementModelSigRef.current = modelSig;
      const graph = buildRequirementGraphFromPayload(modelForBuild, actorId, {
        canvasLayout: savedLayout,
      });
      setActorMeta(graph.actorMeta);
      const optimisticIds = pendingOptimisticIdsRef.current;
      if (optimisticIds.size === 0) {
        setNodes(graph.nodes);
        setEdges(graph.edges);
      } else {
        const idSet = new Set(optimisticIds);
        const optimisticNodes = nodesRef.current.filter((n) => idSet.has(n.id));
        const optimisticEdges = edgesRef.current.filter(
          (e) => idSet.has(e.source) || idSet.has(e.target)
        );
        setNodes([...graph.nodes, ...optimisticNodes]);
        setEdges([...graph.edges, ...optimisticEdges]);
      }
      setGraphHydrated(true);
      for (const id of [...pendingEpicDeleteIdsRef.current]) {
        if (!requirementModel.epics.some((e) => e.id === id)) {
          pendingEpicDeleteIdsRef.current.delete(id);
        }
      }
      for (const id of [...pendingFeatureDeleteIdsRef.current]) {
        if (!requirementModel.features.some((f) => f.id === id)) {
          pendingFeatureDeleteIdsRef.current.delete(id);
        }
      }
      for (const id of [...pendingUserStoryDeleteIdsRef.current]) {
        if (!requirementModel.userStories.some((s) => s.id === id)) {
          pendingUserStoryDeleteIdsRef.current.delete(id);
        }
      }
      return;
    }

    if (savedLayout.length > 0) {
      setNodes((nds) => applyCanvasLayoutToNodes(nds, savedLayout));
    }
  }, [
    requirementModel,
    canvasLayout,
    isCanvasLayoutLoading,
    isCanvasLayoutError,
    actorId,
    graphHydrated,
    setEdges,
    setNodes,
  ]);

  const scheduleLayoutSave = useCallback(() => {
    if (
      !projectId?.trim() ||
      !graphHydrated ||
      !canvasLayoutPersistEnabledRef.current
    ) {
      return;
    }
    if (layoutSaveTimerRef.current) {
      clearTimeout(layoutSaveTimerRef.current);
    }
    layoutSaveTimerRef.current = setTimeout(() => {
      saveCanvasLayoutMutation.mutate({
        projectId,
        actorId,
        body: { nodes: nodesToCanvasLayout(nodesRef.current) },
      });
    }, LAYOUT_SAVE_DEBOUNCE_MS);
  }, [actorId, graphHydrated, projectId, saveCanvasLayoutMutation]);

  const deleteEpicMutation = useDeleteEpic({
    invalidateRequirementModel: true,
    invalidateCanvasLayout: false,
    showSuccessToast: true,
    onSuccess: () => {
      scheduleLayoutSave();
    },
  });
  const deleteFeatureMutation = useDeleteFeature({
    invalidateRequirementModel: true,
    invalidateCanvasLayout: false,
    showSuccessToast: true,
    onSuccess: () => {
      scheduleLayoutSave();
    },
  });
  const deleteUserStoryMutation = useDeleteUserStory({
    invalidateRequirementModel: true,
    invalidateCanvasLayout: false,
    showSuccessToast: true,
    onSuccess: () => {
      scheduleLayoutSave();
    },
  });

  useEffect(
    () => () => {
      if (layoutSaveTimerRef.current) {
        clearTimeout(layoutSaveTimerRef.current);
      }
      for (const timer of epicPatchTimersRef.current.values()) {
        clearTimeout(timer);
      }
      epicPatchTimersRef.current.clear();
      for (const timer of featurePatchTimersRef.current.values()) {
        clearTimeout(timer);
      }
      featurePatchTimersRef.current.clear();
      for (const timer of storyPatchTimersRef.current.values()) {
        clearTimeout(timer);
      }
      storyPatchTimersRef.current.clear();
    },
    []
  );

  const scheduleEpicPatch = useCallback(
    (epicId: string) => {
      if (!projectId?.trim() || !graphHydrated) return;

      const existing = epicPatchTimersRef.current.get(epicId);
      if (existing) clearTimeout(existing);

      epicPatchTimersRef.current.set(
        epicId,
        setTimeout(() => {
          epicPatchTimersRef.current.delete(epicId);
          const node = nodesRef.current.find((n) => n.id === epicId);
          if (!node || !isEpicNodeData(node.data)) return;

          updateEpicMutation.mutate({
            projectId,
            actorId,
            epicId,
            body: epicNodeDataToUpdateRequest(node.data),
          });
        }, EPIC_PATCH_DEBOUNCE_MS)
      );
    },
    [actorId, graphHydrated, projectId, updateEpicMutation]
  );

  const scheduleFeaturePatch = useCallback(
    (featureId: string) => {
      if (!projectId?.trim() || !graphHydrated) return;

      const existing = featurePatchTimersRef.current.get(featureId);
      if (existing) clearTimeout(existing);

      featurePatchTimersRef.current.set(
        featureId,
        setTimeout(() => {
          featurePatchTimersRef.current.delete(featureId);
          const node = nodesRef.current.find((n) => n.id === featureId);
          if (!node || !isFeatureNodeData(node.data)) return;

          updateFeatureMutation.mutate({
            projectId,
            actorId,
            featureId,
            body: featureNodeDataToUpdateRequest(node.data),
          });
        }, FEATURE_PATCH_DEBOUNCE_MS)
      );
    },
    [actorId, graphHydrated, projectId, updateFeatureMutation]
  );

  const scheduleStoryPatch = useCallback(
    (userStoryId: string) => {
      if (!projectId?.trim() || !graphHydrated) return;

      const existing = storyPatchTimersRef.current.get(userStoryId);
      if (existing) clearTimeout(existing);

      storyPatchTimersRef.current.set(
        userStoryId,
        setTimeout(() => {
          storyPatchTimersRef.current.delete(userStoryId);
          const node = nodesRef.current.find((n) => n.id === userStoryId);
          if (!node || !isUserStoryNodeData(node.data)) return;

          const lockedActorRef =
            actorMetaRef.current.name.trim() || "Actor";
          updateUserStoryMutation.mutate({
            projectId,
            actorId,
            userStoryId,
            body: userStoryNodeDataToUpdateRequest(node.data, lockedActorRef),
          });
        }, STORY_PATCH_DEBOUNCE_MS)
      );
    },
    [actorId, graphHydrated, projectId, updateUserStoryMutation]
  );

  const onNodesChange: OnNodesChange<RequirementNode> = useCallback(
    (changes) => {
      const filtered = changes.filter(
        (change) => !(change.type === "remove" && change.id === actorId)
      );

      const epicIdsToDelete: string[] = [];
      const featureIdsToDelete: string[] = [];
      const userStoryIdsToDelete: string[] = [];
      if (projectId?.trim()) {
        for (const change of filtered) {
          if (change.type !== "remove") continue;
          const node = nodesRef.current.find((n) => n.id === change.id);
          if (!node) continue;
          if (isEpicNodeData(node.data)) {
            epicIdsToDelete.push(change.id);
          } else if (isFeatureNodeData(node.data)) {
            featureIdsToDelete.push(change.id);
          } else if (isUserStoryNodeData(node.data)) {
            userStoryIdsToDelete.push(change.id);
          }
        }
      }

      if (
        epicIdsToDelete.length > 0 ||
        featureIdsToDelete.length > 0 ||
        userStoryIdsToDelete.length > 0
      ) {
        const removeIds = new Set<string>();
        for (const epicId of epicIdsToDelete) {
          removeIds.add(epicId);
          for (const id of collectDescendantNodeIds(
            epicId,
            edgesRef.current
          )) {
            removeIds.add(id);
          }
        }
        for (const featureId of featureIdsToDelete) {
          removeIds.add(featureId);
          for (const id of collectDescendantNodeIds(
            featureId,
            edgesRef.current
          )) {
            removeIds.add(id);
          }
        }
        for (const storyId of userStoryIdsToDelete) {
          removeIds.add(storyId);
        }
        onNodesChangeBase(
          filtered.filter(
            (change) => change.type !== "remove" || !removeIds.has(change.id)
          )
        );
        setNodes((nds) => nds.filter((n) => !removeIds.has(n.id)));
        setEdges((eds) =>
          eds.filter(
            (e) => !removeIds.has(e.source) && !removeIds.has(e.target)
          )
        );
      } else {
        onNodesChangeBase(filtered);
      }

      for (const epicId of epicIdsToDelete) {
        const patchTimer = epicPatchTimersRef.current.get(epicId);
        if (patchTimer) {
          clearTimeout(patchTimer);
          epicPatchTimersRef.current.delete(epicId);
        }
        pendingEpicDeleteIdsRef.current.add(epicId);
        deleteEpicMutation.mutate(
          { projectId: projectId!, actorId, epicId },
          {
            onError: () => {
              pendingEpicDeleteIdsRef.current.delete(epicId);
              refetch();
            },
          }
        );
      }
      for (const featureId of featureIdsToDelete) {
        const patchTimer = featurePatchTimersRef.current.get(featureId);
        if (patchTimer) {
          clearTimeout(patchTimer);
          featurePatchTimersRef.current.delete(featureId);
        }
        pendingFeatureDeleteIdsRef.current.add(featureId);
        deleteFeatureMutation.mutate(
          { projectId: projectId!, actorId, featureId },
          {
            onError: () => {
              pendingFeatureDeleteIdsRef.current.delete(featureId);
              refetch();
            },
          }
        );
      }
      for (const userStoryId of userStoryIdsToDelete) {
        const patchTimer = storyPatchTimersRef.current.get(userStoryId);
        if (patchTimer) {
          clearTimeout(patchTimer);
          storyPatchTimersRef.current.delete(userStoryId);
        }
        pendingUserStoryDeleteIdsRef.current.add(userStoryId);
        deleteUserStoryMutation.mutate(
          { projectId: projectId!, actorId, userStoryId },
          {
            onError: () => {
              pendingUserStoryDeleteIdsRef.current.delete(userStoryId);
              refetch();
            },
          }
        );
      }
      const shouldSave = filtered.some(
        (change) =>
          change.type === "position" &&
          "dragging" in change &&
          change.dragging === false
      );
      if (shouldSave) scheduleLayoutSave();
    },
    [
      actorId,
      deleteEpicMutation,
      deleteFeatureMutation,
      deleteUserStoryMutation,
      onNodesChangeBase,
      projectId,
      refetch,
      scheduleLayoutSave,
      setEdges,
      setNodes,
    ]
  );

  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({ ...n, selected: n.id === selectedNodeId }))
    );
  }, [selectedNodeId, setNodes]);

  const { visibleNodes, visibleEdges } = useMemo(() => {
    const filtered = filterByViewMode({ nodes, edges }, viewMode);
    return { visibleNodes: filtered.nodes, visibleEdges: filtered.edges };
  }, [nodes, edges, viewMode]);

  const selectNode = useCallback((id: string | null) => {
    setSelectedNodeId(id);
  }, []);

  const closePanel = useCallback(() => setSelectedNodeId(null), []);

  const updateNodeData = useCallback(
    (id: string, patch: Partial<RequirementNodeData>) => {
      const node = nodesRef.current.find((n) => n.id === id);
      if (!node) return;

      const lockedActorRef = actorMetaRef.current.name.trim() || "Actor";
      let nextData = { ...node.data, ...patch } as RequirementNodeData;
      if (isUserStoryNodeData(nextData)) {
        nextData = { ...nextData, actor_ref: lockedActorRef };
      }

      setNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, data: nextData } : n))
      );

      if (isOptimisticNodeId(id)) return;
      if (isEpicNodeData(nextData)) scheduleEpicPatch(id);
      if (isFeatureNodeData(nextData)) scheduleFeaturePatch(id);
      if (isUserStoryNodeData(nextData)) scheduleStoryPatch(id);
    },
    [scheduleEpicPatch, scheduleFeaturePatch, scheduleStoryPatch, setNodes]
  );

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      const result = validateRequirementConnection(
        nodes,
        connection.source,
        connection.target
      );
      if (!result.valid) {
        setEdges((eds) =>
          addEdge(
            {
              ...connection,
              id: `invalid-${connection.source}-${connection.target}`,
              animated: true,
              style: { ...REQUIREMENT_INVALID_EDGE_STYLE },
              data: { invalid: true, message: result.message },
            },
            eds
          )
        );
        setTimeout(() => {
          setEdges((eds) =>
            eds.filter(
              (e) =>
                !(
                  e.source === connection.source &&
                  e.target === connection.target &&
                  e.data?.invalid
                )
            )
          );
        }, 900);
        return;
      }
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            ...REQUIREMENT_EDGE_DEFAULT_OPTIONS,
          },
          eds
        )
      );
    },
    [nodes, setEdges]
  );

  const appendOptimisticCreate = useCallback(
    (node: RequirementNode, edge: RequirementEdge) => {
      pendingOptimisticIdsRef.current.add(node.id);
      setNodes((nds) => [
        ...nds.map((n) => ({ ...n, selected: false })),
        { ...node, selected: true },
      ]);
      setEdges((eds) => addEdge(edge, eds));
      setSelectedNodeId(node.id);
    },
    [setEdges, setNodes]
  );

  const reconcileOptimisticCreate = useCallback(
    (
      tempId: string,
      serverNode: RequirementNode,
      parentId: string
    ) => {
      pendingOptimisticIdsRef.current.delete(tempId);
      cancelledOptimisticIdsRef.current.delete(tempId);
      const prev = nodesRef.current.find((n) => n.id === tempId);
      const position = prev?.position ?? serverNode.position;
      const collapsed = prev?.data.collapsed ?? serverNode.data.collapsed;

      setNodes((nds) =>
        nds
          .filter((n) => n.id !== serverNode.id)
          .map((n) => {
            if (n.id !== tempId) {
              return { ...n, selected: false };
            }
            return {
              ...serverNode,
              position,
              selected: true,
              data: { ...serverNode.data, collapsed },
            };
          })
      );
      setEdges((eds) =>
        eds.map((e) => {
          if (e.target !== tempId) return e;
          return {
            ...e,
            id: `e-${parentId}-${serverNode.id}`,
            source: parentId,
            target: serverNode.id,
            ...REQUIREMENT_EDGE_DEFAULT_OPTIONS,
          };
        })
      );
      setSelectedNodeId((cur) => (cur === tempId ? serverNode.id : cur));
    },
    [setEdges, setNodes]
  );

  const rollbackOptimisticCreate = useCallback(
    (tempId: string, options?: { markCancelled?: boolean }) => {
      if (options?.markCancelled) {
        cancelledOptimisticIdsRef.current.add(tempId);
      }
      pendingOptimisticIdsRef.current.delete(tempId);
      setNodes((nds) => nds.filter((n) => n.id !== tempId));
      setEdges((eds) =>
        eds.filter((e) => e.source !== tempId && e.target !== tempId)
      );
      setSelectedNodeId((cur) => (cur === tempId ? null : cur));
    },
    [setEdges, setNodes]
  );

  const createFeatureUnderEpic = useCallback(
    (epicNodeId: string, position: { x: number; y: number }) => {
      if (!projectId?.trim()) return;

      const optimisticNode = createOptimisticFeatureFlowNode(epicNodeId, position);
      const tempId = optimisticNode.id;
      appendOptimisticCreate(
        optimisticNode,
        parentChildOptimisticEdge(epicNodeId, tempId)
      );

      createEpicFeatureMutation.mutate(
        {
          projectId,
          actorId,
          epicId: epicNodeId,
          body: {
            title: "Feature mới",
            description: "",
            priority: "medium",
            labels: [],
            nfrNote: "",
          },
        },
        {
          onSuccess: (res) => {
            if (cancelledOptimisticIdsRef.current.has(tempId)) {
              cancelledOptimisticIdsRef.current.delete(tempId);
              deleteFeatureMutation.mutate({
                projectId,
                actorId,
                featureId: res.data.id,
              });
              return;
            }
            if (!pendingOptimisticIdsRef.current.has(tempId)) return;
            reconcileOptimisticCreate(
              tempId,
              actorFeatureToFlowNode(res.data, position),
              epicNodeId
            );
            setViewMode((mode) => (mode === "epic" ? "full" : mode));
            scheduleLayoutSave();
          },
          onError: () => {
            rollbackOptimisticCreate(tempId, { markCancelled: true });
          },
        }
      );
    },
    [
      actorId,
      appendOptimisticCreate,
      createEpicFeatureMutation,
      deleteFeatureMutation,
      projectId,
      reconcileOptimisticCreate,
      rollbackOptimisticCreate,
      scheduleLayoutSave,
      setViewMode,
    ]
  );

  const createUserStoryUnderFeature = useCallback(
    (featureNodeId: string, position: { x: number; y: number }) => {
      if (!projectId?.trim()) return;

      const lockedActorRef = actorMeta.name.trim() || "Actor";
      const optimisticNode = createOptimisticUserStoryFlowNode(
        featureNodeId,
        lockedActorRef,
        position
      );
      const tempId = optimisticNode.id;
      appendOptimisticCreate(
        optimisticNode,
        parentChildOptimisticEdge(featureNodeId, tempId)
      );

      createFeatureUserStoryMutation.mutate(
        {
          projectId,
          actorId,
          featureId: featureNodeId,
          body: {
            title: "User Story mới",
            description: "",
            actorRef: lockedActorRef,
            actionText: "",
            goalText: "",
            priority: "medium",
            labels: [],
            storyPoints: 0,
          },
        },
        {
          onSuccess: (res) => {
            if (cancelledOptimisticIdsRef.current.has(tempId)) {
              cancelledOptimisticIdsRef.current.delete(tempId);
              deleteUserStoryMutation.mutate({
                projectId,
                actorId,
                userStoryId: res.data.id,
              });
              return;
            }
            if (!pendingOptimisticIdsRef.current.has(tempId)) return;

            const base = actorUserStoryToFlowNode(res.data, position);
            const serverNode: RequirementNode = isUserStoryNodeData(base.data)
              ? {
                  ...base,
                  data: { ...base.data, actor_ref: lockedActorRef },
                }
              : base;
            reconcileOptimisticCreate(tempId, serverNode, featureNodeId);
            setViewMode((mode) =>
              mode === "epic" || mode === "feature" ? "full" : mode
            );
            scheduleLayoutSave();
          },
          onError: () => {
            rollbackOptimisticCreate(tempId, { markCancelled: true });
          },
        }
      );
    },
    [
      actorId,
      actorMeta.name,
      appendOptimisticCreate,
      createFeatureUserStoryMutation,
      deleteUserStoryMutation,
      projectId,
      reconcileOptimisticCreate,
      rollbackOptimisticCreate,
      scheduleLayoutSave,
      setViewMode,
    ]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      if (nodeId === actorId || !projectId?.trim()) return;

      const node = nodesRef.current.find((n) => n.id === nodeId);
      if (!node) return;

      if (isOptimisticNodeId(nodeId)) {
        rollbackOptimisticCreate(nodeId, { markCancelled: true });
        return;
      }

      const epicPatchTimer = epicPatchTimersRef.current.get(nodeId);
      if (epicPatchTimer) {
        clearTimeout(epicPatchTimer);
        epicPatchTimersRef.current.delete(nodeId);
      }
      const featurePatchTimer = featurePatchTimersRef.current.get(nodeId);
      if (featurePatchTimer) {
        clearTimeout(featurePatchTimer);
        featurePatchTimersRef.current.delete(nodeId);
      }
      const storyPatchTimer = storyPatchTimersRef.current.get(nodeId);
      if (storyPatchTimer) {
        clearTimeout(storyPatchTimer);
        storyPatchTimersRef.current.delete(nodeId);
      }

      const removeIds = new Set<string>([nodeId]);
      if (isEpicNodeData(node.data) || isFeatureNodeData(node.data)) {
        for (const id of collectDescendantNodeIds(nodeId, edgesRef.current)) {
          removeIds.add(id);
        }
      }
      setNodes((nds) => nds.filter((n) => !removeIds.has(n.id)));
      setEdges((eds) =>
        eds.filter(
          (e) => !removeIds.has(e.source) && !removeIds.has(e.target)
        )
      );
      setSelectedNodeId((prev) => (prev === nodeId ? null : prev));

      if (isEpicNodeData(node.data)) {
        pendingEpicDeleteIdsRef.current.add(nodeId);
        deleteEpicMutation.mutate(
          { projectId, actorId, epicId: nodeId },
          {
            onError: () => {
              pendingEpicDeleteIdsRef.current.delete(nodeId);
              refetch();
            },
          }
        );
      } else if (isFeatureNodeData(node.data)) {
        pendingFeatureDeleteIdsRef.current.add(nodeId);
        deleteFeatureMutation.mutate(
          { projectId, actorId, featureId: nodeId },
          {
            onError: () => {
              pendingFeatureDeleteIdsRef.current.delete(nodeId);
              refetch();
            },
          }
        );
      } else if (isUserStoryNodeData(node.data)) {
        pendingUserStoryDeleteIdsRef.current.add(nodeId);
        deleteUserStoryMutation.mutate(
          { projectId, actorId, userStoryId: nodeId },
          {
            onError: () => {
              pendingUserStoryDeleteIdsRef.current.delete(nodeId);
              refetch();
            },
          }
        );
      }
    },
    [
      actorId,
      deleteEpicMutation,
      deleteFeatureMutation,
      deleteUserStoryMutation,
      projectId,
      refetch,
      rollbackOptimisticCreate,
      setEdges,
      setNodes,
    ]
  );

  const addNodeFromPalette = useCallback(
    (kind: PaletteCreatableKind, position: { x: number; y: number }) => {
      if (!projectId?.trim()) return;

      if (kind === "epic") {
        const optimisticNode = createOptimisticEpicFlowNode(projectId, position);
        const tempId = optimisticNode.id;
        appendOptimisticCreate(
          optimisticNode,
          parentChildOptimisticEdge(actorId, tempId)
        );

        createEpicMutation.mutate(
          {
            projectId,
            actorId,
            body: {
              title: "Epic mới",
              description: "",
              priority: "medium",
              labels: [],
            },
          },
          {
            onSuccess: (res) => {
              if (cancelledOptimisticIdsRef.current.has(tempId)) {
                cancelledOptimisticIdsRef.current.delete(tempId);
                deleteEpicMutation.mutate({
                  projectId,
                  actorId,
                  epicId: res.data.id,
                });
                return;
              }
              if (!pendingOptimisticIdsRef.current.has(tempId)) return;
              reconcileOptimisticCreate(
                tempId,
                actorEpicToFlowNode(res.data, position),
                actorId
              );
              scheduleLayoutSave();
            },
            onError: () => {
              rollbackOptimisticCreate(tempId, { markCancelled: true });
            },
          }
        );
        return;
      }

      if (kind === "feature") {
        const epic = findNodeAtFlowPosition(
          nodesRef.current,
          position,
          "epic"
        );
        if (!epic) {
          toast.message(
            "Thả Feature lên thẻ Epic, hoặc bấm nút + trên Epic."
          );
          return;
        }
        const siblingCount = edgesRef.current.filter(
          (e) => e.source === epic.id && !e.data?.invalid
        ).length;
        createFeatureUnderEpic(
          epic.id,
          positionChildBelowParent(epic, "feature", siblingCount)
        );
        return;
      }

      if (kind === "userStory") {
        const feature = findNodeAtFlowPosition(
          nodesRef.current,
          position,
          "feature"
        );
        if (!feature) {
          toast.message("Thả User Story lên thẻ Feature, hoặc bấm nút + trên Feature.");
          return;
        }
        const siblingCount = edgesRef.current.filter(
          (e) => e.source === feature.id && !e.data?.invalid
        ).length;
        createUserStoryUnderFeature(
          feature.id,
          positionChildBelowParent(feature, "userStory", siblingCount)
        );
        return;
      }
    },
    [
      actorId,
      appendOptimisticCreate,
      createEpicMutation,
      createFeatureUnderEpic,
      createUserStoryUnderFeature,
      deleteEpicMutation,
      projectId,
      reconcileOptimisticCreate,
      rollbackOptimisticCreate,
      scheduleLayoutSave,
    ]
  );

  const quickAddFeature = useCallback(
    (epicNodeId: string) => {
      const epic = nodesRef.current.find((n) => n.id === epicNodeId);
      if (!epic) return;

      const siblingCount = edgesRef.current.filter(
        (e) => e.source === epicNodeId && !e.data?.invalid
      ).length;
      createFeatureUnderEpic(
        epicNodeId,
        positionChildBelowParent(epic, "feature", siblingCount)
      );
    },
    [createFeatureUnderEpic]
  );

  const quickAddUserStory = useCallback(
    (featureNodeId: string) => {
      const feature = nodesRef.current.find((n) => n.id === featureNodeId);
      if (!feature) return;

      const siblingCount = edgesRef.current.filter(
        (e) => e.source === featureNodeId && !e.data?.invalid
      ).length;
      createUserStoryUnderFeature(
        featureNodeId,
        positionChildBelowParent(feature, "userStory", siblingCount)
      );
    },
    [createUserStoryUnderFeature]
  );

  const toggleNodeCollapsed = useCallback(
    (nodeId: string) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, collapsed: !n.data.collapsed } }
            : n
        )
      );
      scheduleLayoutSave();
    },
    [scheduleLayoutSave, setNodes]
  );

  const persistCanvasLayout = useCallback(() => {
    if (!projectId?.trim() || !canvasLayoutPersistEnabledRef.current) return;
    saveCanvasLayoutMutation.mutate({
      projectId,
      actorId,
      body: { nodes: nodesToCanvasLayout(nodes) },
    });
  }, [actorId, nodes, projectId, saveCanvasLayoutMutation]);

  const runAutoLayout = useCallback(() => {
    setNodes((nds) => {
      const laid = layoutRequirementTree(nds, edges, actorId);
      nodesRef.current = laid;
      return laid;
    });
    scheduleLayoutSave();
  }, [actorId, edges, scheduleLayoutSave, setNodes]);

  const suggestedActorsForStory = useCallback(() => {
    const root = nodes.find((n) => n.id === actorId);
    if (root?.data.kind === "actor") {
      const name = root.data.title.trim() || actorMeta.name.trim();
      return name ? [name] : [];
    }
    return actorMeta.name.trim() ? [actorMeta.name.trim()] : [];
  }, [actorId, actorMeta.name, nodes]);

  const value: RequirementsModelContextValue = {
    actorMeta,
    nodes,
    edges,
    visibleNodes,
    visibleEdges,
    viewMode,
    setViewMode,
    selectedNodeId,
    panelOpen,
    selectNode,
    closePanel,
    updateNodeData,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNodeFromPalette,
    quickAddFeature,
    quickAddUserStory,
    deleteNode,
    toggleNodeCollapsed,
    runAutoLayout,
    persistCanvasLayout,
    suggestedActorsForStory,
    isLoading,
    isError,
    error: error ?? null,
    isCreatingEpic: createEpicMutation.isPending,
    isUpdatingEpic: updateEpicMutation.isPending,
    isDeletingEpic: deleteEpicMutation.isPending,
    isCreatingFeature: createEpicFeatureMutation.isPending,
    isUpdatingFeature: updateFeatureMutation.isPending,
    isDeletingFeature: deleteFeatureMutation.isPending,
    isCreatingUserStory: createFeatureUserStoryMutation.isPending,
    isUpdatingUserStory: updateUserStoryMutation.isPending,
    isDeletingUserStory: deleteUserStoryMutation.isPending,
    isSavingLayout: saveCanvasLayoutMutation.isPending,
    refetch,
  };

  return (
    <RequirementsModelContext.Provider value={value}>
      {children}
    </RequirementsModelContext.Provider>
  );
}

export function useRequirementsModel() {
  const ctx = useContext(RequirementsModelContext);
  if (!ctx) {
    throw new Error(
      "useRequirementsModel must be used within RequirementsModelProvider"
    );
  }
  return ctx;
}
