export const STORY_STATUSES = ["draft", "active", "done", "archived"] as const;
export type StoryStatus = (typeof STORY_STATUSES)[number];

export const STORY_PRIORITIES = ["low", "medium", "high", "critical"] as const;
export type StoryPriority = (typeof STORY_PRIORITIES)[number];

/** Một dòng tiêu chí nghiệm thu — khớp API (`description`, `order`). */
export type AcceptanceCriterion = {
  id: string;
  description: string;
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
    title: "User Story mới",
    description: "",
    actor_ref: "",
    action_text: "",
    goal_text: "",
    status: "draft",
    priority: "low",
    labels: "",
    references: "",
    story_points: 0,
    sprint_id: null,
    acceptance_criteria: [],
    created_at: now,
    updated_at: now,
  };
}
