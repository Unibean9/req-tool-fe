import { REQUIREMENT_NODE_DEFAULT_TITLES } from "./requirementsModelConstants";
import type {
  RequirementNodeData,
  RequirementNodeKind,
  RequirementsModelActorMeta,
} from "./requirementsModelTypes";
import { createDefaultEpicRecord } from "../epic/epicTypes";
import { createDefaultFeatureRecord } from "../features/featureTypes";
import { createDefaultUserStoryRecord } from "../userStory/storyTypes";

export function defaultActorMetaForId(actorId: string): RequirementsModelActorMeta {
  return {
    id: actorId,
    name: "Actor",
    roleDescription: "",
  };
}

export function createDefaultNodeData(
  kind: RequirementNodeKind,
  opts?: {
    projectId?: string;
    epicId?: string;
    featureId?: string;
    actorRef?: string;
  }
): RequirementNodeData {
  const projectId = opts?.projectId ?? "";

  switch (kind) {
    case "actor":
      return {
        kind: "actor",
        title: REQUIREMENT_NODE_DEFAULT_TITLES.actor,
        description: "",
        roleDescription: "",
        collapsed: false,
      };
    case "epic":
      return {
        kind: "epic",
        collapsed: false,
        ...createDefaultEpicRecord(projectId),
      };
    case "feature":
      return {
        kind: "feature",
        collapsed: false,
        ...createDefaultFeatureRecord(opts?.epicId ?? ""),
      };
    case "userStory": {
      const base = createDefaultUserStoryRecord(opts?.featureId ?? "");
      return {
        kind: "userStory",
        collapsed: false,
        ...base,
        actor_ref: opts?.actorRef?.trim() || base.actor_ref,
      };
    }
  }
}
