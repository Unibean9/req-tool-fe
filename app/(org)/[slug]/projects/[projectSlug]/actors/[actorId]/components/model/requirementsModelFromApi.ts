import type {
  ActorEpic,
  ActorFeature,
  ActorUserStory,
  CanvasLayoutNode,
  RequirementModelPayload,
} from "@/lib/api/services/fetchActor";
import type { UpdateEpicRequest } from "@/lib/api/services/fetchEpic";
import type { CreateFeatureUserStoryRequest } from "@/lib/api/services/fetchFeature";
import type { UpdateFeatureRequest } from "@/lib/api/services/fetchFeature";
import type { UpdateUserStoryRequest } from "@/lib/api/services/fetchStory";

import type { EpicNodeData } from "../epic/epicTypes";
import type { FeatureNodeData } from "../features/featureTypes";
import type {
  AcceptanceCriterion,
  UserStoryNodeData,
} from "../userStory/storyTypes";
import { REQUIREMENT_EDGE_DEFAULT_OPTIONS } from "./requirementsModelConstants";
import { layoutRequirementTree } from "./requirementsModelLayout";
import { parseWorkItemLabels } from "./requirementWorkItemCard";
import {
  isEpicNodeData,
  isFeatureNodeData,
  isUserStoryNodeData,
} from "./requirementsModelTypes";
import type {
  RequirementEdge,
  RequirementNode,
  RequirementsModelActorMeta,
  RequirementsModelState,
} from "./requirementsModelTypes";

export function actorEpicToNodeData(epic: ActorEpic): EpicNodeData {
  return {
    kind: "epic",
    collapsed: false,
    project_id: epic.projectId,
    prefix: epic.prefix,
    title: epic.title,
    description: epic.description,
    status: epic.status,
    priority: epic.priority,
    labels: epic.labels,
    references: epic.references,
    created_at: epic.createdAt,
    updated_at: epic.updatedAt,
  };
}

export function actorFeatureToNodeData(feature: ActorFeature): FeatureNodeData {
  return {
    kind: "feature",
    collapsed: false,
    epic_id: feature.epicId,
    prefix: feature.prefix,
    title: feature.title,
    description: feature.description,
    status: feature.status,
    priority: feature.priority,
    labels: feature.labels,
    nfr_note: feature.nfrNote,
    references: feature.references,
    warnings: feature.warnings,
    total_story_points: feature.totalStoryPoints,
    total_business_value: feature.totalBusinessValue,
    story_count: feature.storyCount,
    created_at: feature.createdAt,
    updated_at: feature.updatedAt,
  };
}

export function actorUserStoryToNodeData(story: ActorUserStory): UserStoryNodeData {
  return {
    kind: "userStory",
    collapsed: false,
    feature_id: story.featureId,
    prefix: story.prefix,
    title: story.title,
    description: story.description,
    actor_ref: story.actorRef,
    action_text: story.actionText,
    goal_text: story.goalText,
    status: story.status,
    priority: story.priority,
    labels: story.labels,
    references: story.references,
    story_points: story.storyPoints,
    business_value: story.businessValue,
    sprint_id: null,
    acceptance_criteria: story.acceptanceCriteria.map((ac) => ({
      id: ac.id,
      label: ac.label,
      order: ac.order,
    })),
    created_at: story.createdAt,
    updated_at: story.updatedAt,
  };
}

function buildEdges(
  actorId: string,
  payload: RequirementModelPayload
): RequirementEdge[] {
  const edges: RequirementEdge[] = [];

  for (const epic of payload.epics) {
    edges.push({
      id: `e-${actorId}-${epic.id}`,
      source: actorId,
      target: epic.id,
      ...REQUIREMENT_EDGE_DEFAULT_OPTIONS,
    });
  }

  for (const feature of payload.features) {
    edges.push({
      id: `e-${feature.epicId}-${feature.id}`,
      source: feature.epicId,
      target: feature.id,
      ...REQUIREMENT_EDGE_DEFAULT_OPTIONS,
    });
  }

  for (const story of payload.userStories) {
    edges.push({
      id: `e-${story.featureId}-${story.id}`,
      source: story.featureId,
      target: story.id,
      ...REQUIREMENT_EDGE_DEFAULT_OPTIONS,
    });
  }

  return edges;
}

/** Chữ ký nội dung graph — đổi khi thêm/xóa entity hoặc actor đổi. */
export function buildRequirementModelSignature(
  payload: RequirementModelPayload
): string {
  const epicIds = payload.epics.map((e) => e.id).sort().join(",");
  const featureIds = payload.features.map((f) => f.id).sort().join(",");
  const storyIds = payload.userStories.map((s) => s.id).sort().join(",");
  return `${payload.actor.id}|${payload.actor.updatedAt}|${epicIds}|${featureIds}|${storyIds}`;
}

export function payloadToActorMeta(
  payload: RequirementModelPayload
): RequirementsModelActorMeta {
  const { actor } = payload;
  return {
    id: actor.id,
    name: actor.name,
    roleDescription: actor.roleDescription,
  };
}

/**
 * Sau hydrate từ API: giữ vị trí đang hiển thị trên canvas.
 * Node mới từ server (chưa có trên canvas) lấy vị trí từ optimistic tương ứng.
 */
export function mergeHydratedNodesWithLivePositions(
  hydrated: RequirementNode[],
  live: RequirementNode[],
  pendingOptimisticIds: ReadonlySet<string>
): { nodes: RequirementNode[]; consumedOptimisticIds: Set<string> } {
  const liveById = new Map(live.map((n) => [n.id, n]));
  const optimisticCandidates = live.filter((n) => pendingOptimisticIds.has(n.id));
  const consumedOptimisticIds = new Set<string>();

  const takeOptimisticPosition = (
    node: RequirementNode
  ): { x: number; y: number } | undefined => {
    for (const candidate of optimisticCandidates) {
      if (consumedOptimisticIds.has(candidate.id)) continue;
      if (candidate.data.kind !== node.data.kind) continue;

      if (isFeatureNodeData(node.data) && isFeatureNodeData(candidate.data)) {
        if (node.data.epic_id !== candidate.data.epic_id) continue;
      }
      if (isUserStoryNodeData(node.data) && isUserStoryNodeData(candidate.data)) {
        if (node.data.feature_id !== candidate.data.feature_id) continue;
      }

      consumedOptimisticIds.add(candidate.id);
      return candidate.position;
    }
    return undefined;
  };

  const nodes = hydrated.map((node) => {
    const fromLive = liveById.get(node.id);
    if (fromLive) {
      return {
        ...node,
        position: fromLive.position,
        data: { ...node.data, collapsed: fromLive.data.collapsed },
      };
    }

    const fromOptimistic = takeOptimisticPosition(node);
    if (fromOptimistic) {
      return {
        ...node,
        position: fromOptimistic,
      };
    }

    return node;
  });

  return { nodes, consumedOptimisticIds };
}

/** Gắn position / collapsed từ GET canvas-layout lên nodes đã build. */
export function applyCanvasLayoutToNodes(
  nodes: RequirementNode[],
  layoutNodes: CanvasLayoutNode[]
): RequirementNode[] {
  if (!layoutNodes.length) return nodes;
  const byId = new Map(layoutNodes.map((n) => [n.id, n]));
  return nodes.map((node) => {
    const saved = byId.get(node.id);
    if (!saved) return node;
    return {
      ...node,
      position: { x: saved.x, y: saved.y },
      data: {
        ...node.data,
        collapsed: saved.collapsed ?? node.data.collapsed,
      },
    };
  });
}

/** Chuyển response GET requirement-model → state React Flow. */
export function buildRequirementGraphFromPayload(
  payload: RequirementModelPayload,
  actorId: string,
  options?: { canvasLayout?: CanvasLayoutNode[] }
): RequirementsModelState & { actorMeta: RequirementsModelActorMeta } {
  const actorNode: RequirementNode = {
    id: actorId,
    type: "actor",
    position: { x: 0, y: 0 },
    draggable: true,
    deletable: false,
    selectable: false,
    data: {
      kind: "actor",
      title: payload.actor.name,
      description: payload.actor.roleDescription,
      roleDescription: payload.actor.roleDescription,
      collapsed: false,
    },
  };

  const epicNodes: RequirementNode[] = payload.epics.map((epic) => ({
    id: epic.id,
    type: "epic",
    position: { x: 0, y: 0 },
    data: actorEpicToNodeData(epic),
  }));

  const featureNodes: RequirementNode[] = payload.features.map((feature) => ({
    id: feature.id,
    type: "feature",
    position: { x: 0, y: 0 },
    data: actorFeatureToNodeData(feature),
  }));

  const storyNodes: RequirementNode[] = payload.userStories.map((story) => ({
    id: story.id,
    type: "userStory",
    position: { x: 0, y: 0 },
    data: actorUserStoryToNodeData(story),
  }));

  const edges = buildEdges(actorId, payload);
  const baseNodes = [actorNode, ...epicNodes, ...featureNodes, ...storyNodes];
  const savedLayout = options?.canvasLayout ?? [];
  const nodes =
    savedLayout.length > 0
      ? applyCanvasLayoutToNodes(baseNodes, savedLayout)
      : layoutRequirementTree(baseNodes, edges, actorId);

  return {
    actorMeta: payloadToActorMeta(payload),
    nodes,
    edges,
  };
}

export function actorEpicToFlowNode(
  epic: ActorEpic,
  position: { x: number; y: number }
): RequirementNode {
  return {
    id: epic.id,
    type: "epic",
    position,
    selected: true,
    deletable: true,
    data: actorEpicToNodeData(epic),
  };
}

export function actorFeatureToFlowNode(
  feature: ActorFeature,
  position: { x: number; y: number }
): RequirementNode {
  return {
    id: feature.id,
    type: "feature",
    position,
    selected: true,
    deletable: true,
    data: actorFeatureToNodeData(feature),
  };
}

/** Map panel epic → PATCH body (field API hỗ trợ). */
export function epicNodeDataToUpdateRequest(data: EpicNodeData): UpdateEpicRequest {
  return {
    title: data.title,
    description: data.description,
    status: data.status,
    priority: data.priority,
    labels: parseWorkItemLabels(data.labels),
  };
}

/** Map panel feature → PATCH body (field API hỗ trợ). */
export function featureNodeDataToUpdateRequest(
  data: FeatureNodeData
): UpdateFeatureRequest {
  return {
    title: data.title,
    description: data.description,
    status: data.status,
    priority: data.priority,
    labels: parseWorkItemLabels(data.labels),
  };
}

/** Gắn id từ API lên dòng local khi khớp order + label (giữ draft rỗng). */
function syncAcceptanceCriteriaIds(
  local: AcceptanceCriterion[],
  fromApi: AcceptanceCriterion[]
): AcceptanceCriterion[] {
  return local.map((lc, index) => {
    const trimmed = lc.label.trim();
    if (!trimmed) return lc;
    const match =
      fromApi.find(
        (ac) => ac.order === lc.order && ac.label.trim() === trimmed
      ) ?? fromApi[index];
    return match ? { ...lc, id: match.id } : lc;
  });
}

/** Sau PATCH: field từ API, tiêu chí giữ bản local (tránh response cũ / BE bỏ dòng rỗng). */
export function mergeUserStoryNodeDataFromPatchResponse(
  local: UserStoryNodeData,
  fromApi: UserStoryNodeData,
  lockedActorRef: string
): UserStoryNodeData {
  return {
    ...fromApi,
    acceptance_criteria: syncAcceptanceCriteriaIds(
      local.acceptance_criteria,
      fromApi.acceptance_criteria
    ),
    actor_ref: lockedActorRef,
    collapsed: local.collapsed,
  };
}

/** Map panel user story → PATCH body (field API hỗ trợ). */
export function userStoryNodeDataToUpdateRequest(
  data: UserStoryNodeData,
  lockedActorRef: string
): UpdateUserStoryRequest {
  const actorRef = data.actor_ref.trim() || lockedActorRef.trim();
  const allCriteria = data.acceptance_criteria;
  const nonEmptyCriteria = allCriteria
    .filter((ac) => ac.label.trim())
    .map((ac, index) => ({
      label: ac.label.trim(),
      order: ac.order ?? index,
    }));

  let acceptanceCriteria: UpdateUserStoryRequest["acceptanceCriteria"];
  if (nonEmptyCriteria.length > 0) {
    acceptanceCriteria = nonEmptyCriteria;
  } else if (allCriteria.length === 0) {
    acceptanceCriteria = [];
  }

  return {
    title: data.title,
    description: data.description,
    actorRef,
    actionText: data.action_text,
    goalText: data.goal_text,
    status: data.status,
    priority: data.priority,
    labels: parseWorkItemLabels(data.labels),
    storyPoints: data.story_points,
    businessValue: data.business_value,
    ...(acceptanceCriteria !== undefined ? { acceptanceCriteria } : {}),
  };
}

/** Map panel / quick-add user story → POST body. */
export function userStoryNodeDataToCreateRequest(
  data: UserStoryNodeData,
  actorRefFallback: string
): CreateFeatureUserStoryRequest {
  return {
    title: data.title.trim() || "User Story mới",
    description: data.description,
    actorRef: data.actor_ref.trim() || actorRefFallback,
    actionText: data.action_text,
    goalText: data.goal_text,
    priority: data.priority,
    labels: parseWorkItemLabels(data.labels),
    storyPoints: data.story_points,
    businessValue: data.business_value,
  };
}

export function actorUserStoryToFlowNode(
  story: ActorUserStory,
  position: { x: number; y: number }
): RequirementNode {
  return {
    id: story.id,
    type: "userStory",
    position,
    selected: true,
    deletable: true,
    data: actorUserStoryToNodeData(story),
  };
}

/** Loại entity đang chờ DELETE khỏi payload cache cũ khi hydrate. */
export function buildModelExcludingPendingDeletes(
  payload: RequirementModelPayload,
  pendingEpicIds: ReadonlySet<string>,
  pendingFeatureIds: ReadonlySet<string>,
  pendingUserStoryIds: ReadonlySet<string> = new Set()
): RequirementModelPayload {
  const features = payload.features.filter(
    (f) => !pendingEpicIds.has(f.epicId) && !pendingFeatureIds.has(f.id)
  );
  const removedFeatureIds = new Set([
    ...pendingFeatureIds,
    ...payload.features
      .filter((f) => pendingEpicIds.has(f.epicId))
      .map((f) => f.id),
  ]);
  return {
    ...payload,
    epics: payload.epics.filter((e) => !pendingEpicIds.has(e.id)),
    features,
    userStories: payload.userStories.filter(
      (s) =>
        !removedFeatureIds.has(s.featureId) && !pendingUserStoryIds.has(s.id)
    ),
  };
}
