import { REQUIREMENT_EDGE_DEFAULT_OPTIONS } from "./requirementsModelConstants";
import { createDefaultNodeData } from "./requirementsModelDefaults";
import type { RequirementEdge, RequirementNode } from "./requirementsModelTypes";

export const OPTIMISTIC_NODE_ID_PREFIX = "optimistic:";

export function isOptimisticNodeId(id: string): boolean {
  return id.startsWith(OPTIMISTIC_NODE_ID_PREFIX);
}

function createOptimisticNodeId(kind: "epic" | "feature" | "userStory"): string {
  return `${OPTIMISTIC_NODE_ID_PREFIX}${kind}:${crypto.randomUUID()}`;
}

export function createOptimisticEpicFlowNode(
  projectId: string,
  position: { x: number; y: number }
): RequirementNode {
  return {
    id: createOptimisticNodeId("epic"),
    type: "epic",
    position,
    selected: true,
    deletable: true,
    data: createDefaultNodeData("epic", { projectId }),
  };
}

export function createOptimisticFeatureFlowNode(
  epicId: string,
  position: { x: number; y: number }
): RequirementNode {
  return {
    id: createOptimisticNodeId("feature"),
    type: "feature",
    position,
    selected: true,
    deletable: true,
    data: createDefaultNodeData("feature", { epicId }),
  };
}

export function createOptimisticUserStoryFlowNode(
  featureId: string,
  actorRef: string,
  position: { x: number; y: number }
): RequirementNode {
  return {
    id: createOptimisticNodeId("userStory"),
    type: "userStory",
    position,
    selected: true,
    deletable: true,
    data: createDefaultNodeData("userStory", {
      featureId,
      actorRef,
    }),
  };
}

export function parentChildOptimisticEdge(
  parentId: string,
  childId: string
): RequirementEdge {
  return {
    id: `e-${parentId}-${childId}`,
    source: parentId,
    target: childId,
    ...REQUIREMENT_EDGE_DEFAULT_OPTIONS,
  };
}
