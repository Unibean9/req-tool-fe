/** Giới hạn ký tự cho form chi tiết trên canvas (sidebar phải). */

export const REQ_PREFIX_MAX_CHARS = 32;
export const REQ_TITLE_MAX_CHARS = 120;
export const REQ_DESCRIPTION_MAX_CHARS = 1_500;
export const REQ_NFR_NOTE_MAX_CHARS = 500;
export const REQ_LABELS_MAX_CHARS = 200;
export const REQ_REFERENCES_MAX_CHARS = 500;

export const REQ_ACTOR_REF_MAX_CHARS = 48;
export const REQ_ACTION_TEXT_MAX_CHARS = 400;
export const REQ_GOAL_TEXT_MAX_CHARS = 400;
export const REQ_ACCEPTANCE_CRITERION_MAX_CHARS = 280;
export const REQ_ACCEPTANCE_CRITERIA_MAX_COUNT = 15;
export const REQ_STORY_POINTS_MIN = 0;
export const REQ_STORY_POINTS_MAX = 99;

export const REQ_ACTOR_TITLE_MAX_CHARS = 48;
export const REQ_ACTOR_DESCRIPTION_MAX_CHARS = 240;
export const REQ_ACTOR_ROLE_MAX_CHARS = 120;

export function clampText(value: string, max: number): string {
  return value.slice(0, max);
}

export function clampStoryPoints(value: number): number {
  if (!Number.isFinite(value)) return REQ_STORY_POINTS_MIN;
  return Math.min(
    REQ_STORY_POINTS_MAX,
    Math.max(REQ_STORY_POINTS_MIN, Math.round(value))
  );
}
