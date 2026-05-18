import type { ProjectGoal } from "@/lib/api/services/fetchGoal";

import { GOAL_ORDER_MIN } from "./goalFormLimits";

export function sortGoals(rows: ProjectGoal[]): ProjectGoal[] {
  return [...rows].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export type GoalOrderPatch = {
  goal: ProjectGoal;
  order: number;
};

export function planMoveGoalToTop(
  sorted: readonly ProjectGoal[],
  row: ProjectGoal
): GoalOrderPatch[] | null {
  const idx = sorted.findIndex((g) => g.id === row.id);
  if (idx <= 0) return null;

  const first = sorted[0];
  if (first.order > GOAL_ORDER_MIN) {
    return [{ goal: row, order: first.order - 1 }];
  }

  const patches: GoalOrderPatch[] = [];
  for (let i = 0; i < idx; i++) {
    const item = sorted[i];
    patches.push({ goal: item, order: item.order + 1 });
  }
  patches.push({ goal: row, order: GOAL_ORDER_MIN });
  return patches;
}

export function planMoveGoalDown(
  sorted: readonly ProjectGoal[],
  row: ProjectGoal
): GoalOrderPatch[] | null {
  const idx = sorted.findIndex((g) => g.id === row.id);
  if (idx < 0 || idx >= sorted.length - 1) return null;

  const next = sorted[idx + 1];
  return [
    { goal: row, order: next.order },
    { goal: next, order: row.order },
  ];
}

export function canMoveGoalUp(
  sorted: readonly ProjectGoal[],
  row: ProjectGoal
): boolean {
  const idx = sorted.findIndex((g) => g.id === row.id);
  return idx > 0;
}

export function canMoveGoalDown(
  sorted: readonly ProjectGoal[],
  row: ProjectGoal
): boolean {
  const idx = sorted.findIndex((g) => g.id === row.id);
  return idx >= 0 && idx < sorted.length - 1;
}
