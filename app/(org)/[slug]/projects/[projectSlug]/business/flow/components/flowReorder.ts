import type { ProjectFlow } from "@/lib/api/services/fetchFlow";

import { FLOW_ORDER_MIN } from "./flowFormLimits";

export function sortFlows(rows: ProjectFlow[]): ProjectFlow[] {
  return [...rows].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  });
}

export type FlowOrderPatch = {
  flow: ProjectFlow;
  order: number;
};

export function planMoveFlowToTop(
  sorted: readonly ProjectFlow[],
  row: ProjectFlow
): FlowOrderPatch[] | null {
  const idx = sorted.findIndex((f) => f.id === row.id);
  if (idx <= 0) return null;

  const first = sorted[0];
  if (first.order > FLOW_ORDER_MIN) {
    return [{ flow: row, order: first.order - 1 }];
  }

  const patches: FlowOrderPatch[] = [];
  for (let i = 0; i < idx; i++) {
    const item = sorted[i];
    patches.push({ flow: item, order: item.order + 1 });
  }
  patches.push({ flow: row, order: FLOW_ORDER_MIN });
  return patches;
}

export function planMoveFlowDown(
  sorted: readonly ProjectFlow[],
  row: ProjectFlow
): FlowOrderPatch[] | null {
  const idx = sorted.findIndex((f) => f.id === row.id);
  if (idx < 0 || idx >= sorted.length - 1) return null;

  const next = sorted[idx + 1];
  return [
    { flow: row, order: next.order },
    { flow: next, order: row.order },
  ];
}

export function canMoveFlowUp(
  sorted: readonly ProjectFlow[],
  row: ProjectFlow
): boolean {
  const idx = sorted.findIndex((f) => f.id === row.id);
  return idx > 0;
}

export function canMoveFlowDown(
  sorted: readonly ProjectFlow[],
  row: ProjectFlow
): boolean {
  const idx = sorted.findIndex((f) => f.id === row.id);
  return idx >= 0 && idx < sorted.length - 1;
}
