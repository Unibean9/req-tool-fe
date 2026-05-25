export const PROJECT_NAME_MAX_CHARS = 80;
export const PROJECT_DESCRIPTION_MAX_CHARS = 2000;
export const PROJECT_CONTEXT_MAX_CHARS = 1000;
export const PROJECT_SHORT_SUMMARY_MAX_CHARS = 500;
export const PROJECT_EXECUTIVE_SUMMARY_MAX_CHARS = 2000;
export const PROJECT_BUSINESS_VALUE_LABEL =
  "Business Value" as const;

export const PROJECT_ROI_NOTES_MAX_CHARS = 2000;

export const PROJECT_MIN_TEXT_CHARS = 20;
export const PROJECT_MIN_TEXT_MESSAGE = `Must be at least ${PROJECT_MIN_TEXT_CHARS} characters`;
export const PROJECT_LIST_MIN_MESSAGE = "At least one item is required";

/** Each row = input h-10 (2.5rem, border-box) + space-y-2 between rows. */
export function projectStringListViewportHeight(visibleRows: number): string {
  const gaps = Math.max(0, visibleRows - 1);
  return `calc(${visibleRows} * 2.5rem + ${gaps} * 0.5rem)`;
}

/** Default scrollable list: 7 rows fit; item 8+ scrolls within the container. */
export const PROJECT_STRING_LIST_DEFAULT_VISIBLE_ROWS = 7;

/** Static classes (Tailwind does not build dynamically composed class names). */
const PROJECT_LIST_VIEWPORT_6 =
  "h-[calc(6*2.5rem+5*0.5rem)] min-h-[calc(6*2.5rem+5*0.5rem)]";
const PROJECT_LIST_VIEWPORT_7 =
  "h-[calc(7*2.5rem+6*0.5rem)] min-h-[calc(7*2.5rem+6*0.5rem)]";

export function projectStringListViewportClassForRows(
  visibleRows: number
): string {
  if (visibleRows === 6) return PROJECT_LIST_VIEWPORT_6;
  if (visibleRows === 7) return PROJECT_LIST_VIEWPORT_7;
  return PROJECT_LIST_VIEWPORT_7;
}

export function projectStringListViewportHeightForRows(
  visibleRows: number
): string {
  return projectStringListViewportHeight(visibleRows);
}

/** Problems / stakeholders: 7 rows fit; item 8+ scrolls within the container. */
export const PROJECT_PROBLEMS_VISIBLE_ROWS = PROJECT_STRING_LIST_DEFAULT_VISIBLE_ROWS;

export const PROJECT_PROBLEMS_LIST_VIEWPORT_CLASS =
  projectStringListViewportClassForRows(PROJECT_PROBLEMS_VISIBLE_ROWS);

export const PROJECT_PROBLEMS_LIST_VIEWPORT_HEIGHT =
  projectStringListViewportHeightForRows(PROJECT_PROBLEMS_VISIBLE_ROWS);

export const PROJECT_STAKEHOLDERS_LIST_VISIBLE_ROWS =
  PROJECT_STRING_LIST_DEFAULT_VISIBLE_ROWS;

export const PROJECT_STAKEHOLDERS_LIST_VIEWPORT_CLASS =
  projectStringListViewportClassForRows(PROJECT_STAKEHOLDERS_LIST_VISIBLE_ROWS);

export const PROJECT_STAKEHOLDERS_LIST_VIEWPORT_HEIGHT =
  projectStringListViewportHeightForRows(PROJECT_STAKEHOLDERS_LIST_VISIBLE_ROWS);

/** Flows / rules — same 7-row list layout as stakeholders. */
export const PROJECT_FLOWS_RULES_LIST_VIEWPORT_CLASS =
  PROJECT_STAKEHOLDERS_LIST_VIEWPORT_CLASS;
export const PROJECT_FLOWS_RULES_LIST_VIEWPORT_HEIGHT =
  PROJECT_STAKEHOLDERS_LIST_VIEWPORT_HEIGHT;
