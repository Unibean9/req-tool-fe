import type { FeatureStatus } from "@/lib/api/services/fetchActor";

export { FEATURE_STATUSES as STORY_STATUSES } from "@/lib/api/services/fetchActor";
export type StoryStatus = FeatureStatus;

export const STORY_PRIORITIES = ["low", "medium", "high", "critical"] as const;
export type StoryPriority = (typeof STORY_PRIORITIES)[number];

/** Một dòng tiêu chí nghiệm thu — khớp API (`label`, `order`). */
export type AcceptanceCriterion = {
  id: string;
  label: string;
  order: number;
};

export function reindexAcceptanceCriteria(
  criteria: AcceptanceCriterion[]
): AcceptanceCriterion[] {
  return criteria.map((c, index) => ({ ...c, order: index }));
}

/** Shape khớp response API User Story. */
export type UserStoryRecord = {
  feature_id: string;
  prefix: string;
  title: string;
  description: string;
  actor_ref: string;
  action_text: string;
  goal_text: string;
  status: StoryStatus;
  priority: StoryPriority;
  labels: string;
  references: string;
  story_points: number;
  business_value: number;
  sprint_id: string | null;
  acceptance_criteria: AcceptanceCriterion[];
  created_at: string;
  updated_at: string;
};

export type UserStoryNodeData = UserStoryRecord & {
  kind: "userStory";
  collapsed: boolean;
};

export function createDefaultUserStoryRecord(featureId: string): UserStoryRecord {
  const now = new Date().toISOString();
  return {
    feature_id: featureId,
    prefix: "",
    title: "New User Story",
    description: "",
    actor_ref: "",
    action_text: "",
    goal_text: "",
    status: "draft",
    priority: "low",
    labels: "",
    references: "",
    story_points: 0,
    business_value: 0,
    sprint_id: null,
    acceptance_criteria: [],
    created_at: now,
    updated_at: now,
  };
}
