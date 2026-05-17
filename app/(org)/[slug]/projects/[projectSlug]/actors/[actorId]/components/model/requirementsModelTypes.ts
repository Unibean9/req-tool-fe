import type { Edge, Node } from "@/components/ui/react-flow";

import type { EpicNodeData } from "../epic/epicTypes";
import type { FeatureNodeData } from "../features/featureTypes";
import type { UserStoryNodeData } from "../userStory/storyTypes";

export type RequirementNodeKind = "actor" | "epic" | "feature" | "userStory";

export type RequirementsViewMode = "full" | "epic" | "feature";

export type RequirementsModelActorMeta = {
  id: string;
  name: string;
  roleDescription: string;
};

export type ActorNodeData = {
  kind: "actor";
  title: string;
  description: string;
  roleDescription?: string;
  collapsed: boolean;
};

export type RequirementNodeData =
  | ActorNodeData
  | EpicNodeData
  | FeatureNodeData
  | UserStoryNodeData;

export type RequirementNode = Node<RequirementNodeData>;

export type RequirementEdge = Edge & {
  data?: { invalid?: boolean; message?: string };
};

export type RequirementsModelState = {
  nodes: RequirementNode[];
  edges: RequirementEdge[];
};

/** Chỉ Epic / Feature / User Story được kéo từ palette (actor cố định theo route). */
export type PaletteCreatableKind = Exclude<RequirementNodeKind, "actor">;

export type PaletteDragPayload = {
  kind: PaletteCreatableKind;
};

export function isActorNodeData(
  data: RequirementNodeData
): data is ActorNodeData {
  return data.kind === "actor";
}

export function isEpicNodeData(data: RequirementNodeData): data is EpicNodeData {
  return data.kind === "epic";
}

export function isFeatureNodeData(
  data: RequirementNodeData
): data is FeatureNodeData {
  return data.kind === "feature";
}

export function isUserStoryNodeData(
  data: RequirementNodeData
): data is UserStoryNodeData {
  return data.kind === "userStory";
}
