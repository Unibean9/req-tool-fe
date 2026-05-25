import {
  INVALID_EDGE_MESSAGE,
  VALID_REQUIREMENT_EDGES,
} from "./requirementsModelConstants";
import type {
  RequirementNode,
  RequirementNodeKind,
} from "./requirementsModelTypes";

export function isValidRequirementConnection(
  sourceKind: RequirementNodeKind,
  targetKind: RequirementNodeKind
): boolean {
  return VALID_REQUIREMENT_EDGES.some(
    ([from, to]) => from === sourceKind && to === targetKind
  );
}

export function validateRequirementConnection(
  nodes: RequirementNode[],
  sourceId: string,
  targetId: string
): { valid: boolean; message?: string } {
  const source = nodes.find((n) => n.id === sourceId);
  const target = nodes.find((n) => n.id === targetId);
  if (!source || !target) {
    return { valid: false, message: "Node not found." };
  }
  const valid = isValidRequirementConnection(
    source.data.kind,
    target.data.kind
  );
  if (!valid) {
    if (source.data.kind === "userStory" && target.data.kind === "epic") {
      return {
        valid: false,
        message: "A User Story must belong to a Feature.",
      };
    }
    return { valid: false, message: INVALID_EDGE_MESSAGE };
  }
  return { valid: true };
}
