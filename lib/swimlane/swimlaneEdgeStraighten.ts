import type { Edge } from "@/components/ui/react-flow";
import type { Position } from "@xyflow/react";
import type { SwimlaneWaypoint } from "@/components/ui/swimlane-react-flow";

const DEFAULT_EPSILON_PX = 8;

export type SwimlaneEdgeGeometryInput = {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
};

export function buildSwimlaneEdgePolyline(
  geometry: SwimlaneEdgeGeometryInput,
  interior: SwimlaneWaypoint[]
): SwimlaneWaypoint[] {
  return [
    { x: geometry.sourceX, y: geometry.sourceY },
    ...interior.map((p) => ({ x: p.x, y: p.y })),
    { x: geometry.targetX, y: geometry.targetY },
  ];
}

export function findClosestPolylineSegmentIndex(
  polyline: SwimlaneWaypoint[],
  point: SwimlaneWaypoint
): { segmentIndex: number; distance: number } {
  let segmentIndex = 0;
  let distance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < polyline.length - 1; i++) {
    const d = pointToSegmentDistance(point, polyline[i]!, polyline[i + 1]!);
    if (d < distance) {
      distance = d;
      segmentIndex = i;
    }
  }
  return { segmentIndex, distance };
}

type SegmentAxis = "horizontal" | "vertical";

function segmentAxis(
  a: SwimlaneWaypoint,
  b: SwimlaneWaypoint,
  epsilon = DEFAULT_EPSILON_PX
): SegmentAxis | null {
  const dx = Math.abs(b.x - a.x);
  const dy = Math.abs(b.y - a.y);
  const len = Math.hypot(dx, dy);
  if (len < epsilon) return null;
  return dx >= dy ? "horizontal" : "vertical";
}

/** Chuỗi đoạn ngang/dọc liền kề quanh `segmentIndex` còn lệch trục không. */
export function axisAlignedRunNeedsStraightening(
  polyline: SwimlaneWaypoint[],
  segmentIndex: number,
  epsilon = DEFAULT_EPSILON_PX
): boolean {
  if (segmentIndex < 0 || segmentIndex >= polyline.length - 1) return false;
  const axis = segmentAxis(
    polyline[segmentIndex]!,
    polyline[segmentIndex + 1]!,
    epsilon
  );
  if (axis == null) return false;
  const { startVertex, endVertex } = expandAxisAlignedRun(
    polyline,
    segmentIndex,
    axis,
    epsilon
  );
  for (let i = startVertex; i < endVertex; i++) {
    if (
      segmentNeedsStraightening(polyline[i]!, polyline[i + 1]!, epsilon)
    ) {
      return true;
    }
  }
  return false;
}

/** Đoạn gần ngang/dọc nhưng hai đầu chưa cùng một đường thẳng (lệch trục). */
export function segmentNeedsStraightening(
  a: SwimlaneWaypoint,
  b: SwimlaneWaypoint,
  epsilon = DEFAULT_EPSILON_PX
): boolean {
  const axis = segmentAxis(a, b, epsilon);
  if (axis == null) return false;
  if (axis === "horizontal") return Math.abs(b.y - a.y) > epsilon;
  return Math.abs(b.x - a.x) > epsilon;
}

function interiorFromPolyline(polyline: SwimlaneWaypoint[]): SwimlaneWaypoint[] {
  if (polyline.length <= 2) return [];
  return polyline.slice(1, -1).map((p) => ({ x: p.x, y: p.y }));
}

/** Mở rộng các đoạn cùng hướng (ngang/dọc) liền kề — một “đoạn” người dùng nhìn thấy. */
function expandAxisAlignedRun(
  polyline: SwimlaneWaypoint[],
  segmentIndex: number,
  axis: SegmentAxis,
  epsilon = DEFAULT_EPSILON_PX
): { startVertex: number; endVertex: number } {
  let startVertex = segmentIndex;
  let endVertex = segmentIndex + 1;

  while (startVertex > 0) {
    const prev = polyline[startVertex - 1]!;
    const cur = polyline[startVertex]!;
    if (segmentAxis(prev, cur, epsilon) !== axis) break;
    startVertex -= 1;
  }

  while (endVertex < polyline.length - 1) {
    const cur = polyline[endVertex]!;
    const next = polyline[endVertex + 1]!;
    if (segmentAxis(cur, next, epsilon) !== axis) break;
    endVertex += 1;
  }

  return { startVertex, endVertex };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Căn mọi đỉnh trên một “đoạn chạy” ngang/dọc về cùng một đường thẳng (cùng y hoặc cùng x),
 * rồi gỡ điểm thừa collinear → có thể gộp thành một đoạn thẳng duy nhất.
 */
function straightenAxisAlignedRun(
  polyline: SwimlaneWaypoint[],
  startVertex: number,
  endVertex: number,
  axis: SegmentAxis
): SwimlaneWaypoint[] {
  const next = polyline.map((p) => ({ x: p.x, y: p.y }));

  if (axis === "horizontal") {
    const ys: number[] = [];
    for (let i = startVertex; i <= endVertex; i++) {
      ys.push(polyline[i]!.y);
    }
    const y = average(ys);
    for (let i = startVertex; i <= endVertex; i++) {
      next[i]!.y = y;
    }
  } else {
    const xs: number[] = [];
    for (let i = startVertex; i <= endVertex; i++) {
      xs.push(polyline[i]!.x);
    }
    const x = average(xs);
    for (let i = startVertex; i <= endVertex; i++) {
      next[i]!.x = x;
    }
  }

  return next;
}

function polylineChanged(
  before: SwimlaneWaypoint[],
  after: SwimlaneWaypoint[],
  epsilon = 0.5
): boolean {
  if (before.length !== after.length) return true;
  return before.some(
    (p, i) =>
      Math.abs(p.x - after[i]!.x) > epsilon ||
      Math.abs(p.y - after[i]!.y) > epsilon
  );
}

/**
 * Làm thẳng đoạn được click: toàn bộ chuỗi đoạn ngang (hoặc dọc) liền kề
 * nằm trên một đường thẳng, sau đó gỡ waypoint thừa.
 */
export function straightenSwimlaneEdgeSegmentAt(
  geometry: SwimlaneEdgeGeometryInput,
  interior: SwimlaneWaypoint[],
  segmentIndex: number,
  epsilon = DEFAULT_EPSILON_PX
): { waypoints: SwimlaneWaypoint[] | undefined; changed: boolean } {
  const polyline = buildSwimlaneEdgePolyline(geometry, interior);
  if (segmentIndex < 0 || segmentIndex >= polyline.length - 1) {
    return { waypoints: undefined, changed: false };
  }

  const a = polyline[segmentIndex]!;
  const b = polyline[segmentIndex + 1]!;
  const axis = segmentAxis(a, b, epsilon);
  if (axis == null) {
    return { waypoints: undefined, changed: false };
  }

  const { startVertex, endVertex } = expandAxisAlignedRun(
    polyline,
    segmentIndex,
    axis,
    epsilon
  );

  const runNeedsStraighten = (() => {
    for (let i = startVertex; i < endVertex; i++) {
      if (segmentNeedsStraightening(polyline[i]!, polyline[i + 1]!, epsilon)) {
        return true;
      }
    }
    return false;
  })();

  if (!runNeedsStraighten) {
    return { waypoints: undefined, changed: false };
  }

  const straightened = straightenAxisAlignedRun(
    polyline,
    startVertex,
    endVertex,
    axis
  );

  const interiorNext = simplifyCollinearWaypoints(
    interiorFromPolyline(straightened),
    epsilon
  );

  const full = buildSwimlaneEdgePolyline(geometry, interiorNext);
  if (
    interiorNext.length === 0 ||
    areWaypointsNearlyCollinear(full, epsilon)
  ) {
    return { waypoints: undefined, changed: true };
  }

  const changed =
    polylineChanged(interior, interiorNext) ||
    polylineChanged(polyline, straightened);

  return { waypoints: interiorNext, changed };
}

export function pointToSegmentDistance(
  p: SwimlaneWaypoint,
  a: SwimlaneWaypoint,
  b: SwimlaneWaypoint
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-6) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(
    0,
    Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2)
  );
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/** Bỏ điểm nằm gần trên đoạn nối hai điểm kề (gãy khúc thừa trên đoạn thẳng). */
export function simplifyCollinearWaypoints(
  pts: SwimlaneWaypoint[],
  epsilon = DEFAULT_EPSILON_PX
): SwimlaneWaypoint[] {
  if (pts.length <= 2) return pts.map((p) => ({ x: p.x, y: p.y }));
  let list = pts.map((p) => ({ x: p.x, y: p.y }));
  let changed = true;
  while (changed && list.length > 2) {
    changed = false;
    const next: SwimlaneWaypoint[] = [];
    for (let i = 0; i < list.length; i++) {
      if (i > 0 && i < list.length - 1) {
        const prev = list[i - 1]!;
        const cur = list[i]!;
        const nextPt = list[i + 1]!;
        if (pointToSegmentDistance(cur, prev, nextPt) <= epsilon) {
          changed = true;
          continue;
        }
      }
      next.push(list[i]!);
    }
    list = next;
  }
  return list;
}

/** Mọi điểm gần như cùng một đoạn thẳng → không cần lưu waypoint. */
export function areWaypointsNearlyCollinear(
  pts: SwimlaneWaypoint[],
  epsilon = DEFAULT_EPSILON_PX
): boolean {
  if (pts.length <= 1) return false;
  const a = pts[0]!;
  const b = pts[pts.length - 1]!;
  return pts.every((p) => pointToSegmentDistance(p, a, b) <= epsilon);
}

/**
 * Chuẩn hóa waypoint một dây: bỏ điểm thừa trên đoạn thẳng; nếu còn “cong nhẹ”
 * trên một hướng thì xóa hết để FE auto-route lại.
 */
export function straightenSwimlaneEdgeWaypoints(
  stored: SwimlaneWaypoint[] | undefined,
  epsilon = DEFAULT_EPSILON_PX
): SwimlaneWaypoint[] | undefined {
  if (stored == null || stored.length === 0) return undefined;
  const simplified = simplifyCollinearWaypoints(stored, epsilon);
  if (simplified.length === 0) return undefined;
  if (areWaypointsNearlyCollinear(simplified, epsilon)) return undefined;
  if (simplified.length < stored.length) {
    return simplified.length > 0 ? simplified : undefined;
  }
  return stored;
}

export function applyStraightenToSwimlaneEdges(edges: Edge[]): {
  edges: Edge[];
  changedCount: number;
} {
  let changedCount = 0;
  const next = edges.map((e) => {
    const data = { ...(e.data ?? {}) } as { waypoints?: SwimlaneWaypoint[] };
    const wp = data.waypoints;
    if (wp == null || wp.length === 0) return e;

    const result = straightenSwimlaneEdgeWaypoints(wp);
    const unchanged =
      (result == null && wp.length === 0) ||
      (result != null &&
        result.length === wp.length &&
        result.every(
          (p, i) => Math.abs(p.x - wp[i]!.x) < 0.5 && Math.abs(p.y - wp[i]!.y) < 0.5
        ));
    if (unchanged) return e;

    changedCount += 1;
    const newData = { ...data };
    if (result == null || result.length === 0) delete newData.waypoints;
    else newData.waypoints = result;
    return { ...e, data: newData };
  });
  return { edges: next, changedCount };
}
