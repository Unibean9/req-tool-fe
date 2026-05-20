/**
 * Map React Flow handle ids ↔ wire `source_handle` / `target_handle` (snake_case compound cho fork/join).
 */

export type SwimlaneWireHandle =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top_left"
  | "top_right"
  | "bottom_left"
  | "bottom_right";

const RF_SOURCE_TO_WIRE: Record<string, SwimlaneWireHandle> = {
  "top-source": "top",
  "bottom-source": "bottom",
  "left-source": "left",
  "right-source": "right",
  "bottom-left-source": "bottom_left",
  "bottom-right-source": "bottom_right",
};

const RF_TARGET_TO_WIRE: Record<string, SwimlaneWireHandle> = {
  "top-target": "top",
  "bottom-target": "bottom",
  "left-target": "left",
  "right-target": "right",
  "top-left-target": "top_left",
  "top-right-target": "top_right",
};

const WIRE_SOURCE_TO_RF: Record<string, string> = {
  top: "top-source",
  bottom: "bottom-source",
  left: "left-source",
  right: "right-source",
  top_left: "top-source",
  top_right: "top-source",
  bottom_left: "bottom-left-source",
  bottom_right: "bottom-right-source",
  "top-left": "top-source",
  "top-right": "top-source",
  "bottom-left": "bottom-left-source",
  "bottom-right": "bottom-right-source",
};

const WIRE_TARGET_TO_RF: Record<string, string> = {
  top: "top-target",
  bottom: "bottom-target",
  left: "left-target",
  right: "right-target",
  top_left: "top-left-target",
  top_right: "top-right-target",
  bottom_left: "top-left-target",
  bottom_right: "top-right-target",
  "top-left": "top-left-target",
  "top-right": "top-right-target",
};

function normalizeWireToken(raw: string): string {
  return raw.trim().toLowerCase().replace(/-/g, "_");
}

/** RF handle id → enum wire (giữ compound fork/join). */
export function swimlaneRfHandleIdToWireHandle(
  role: "source" | "target",
  id: string | null | undefined
): SwimlaneWireHandle | undefined {
  if (id == null) return undefined;
  const t = String(id).trim().toLowerCase();
  if (!t) return undefined;
  if (role === "source") {
    if (RF_SOURCE_TO_WIRE[t]) return RF_SOURCE_TO_WIRE[t];
    if (t === "top" || t === "bottom" || t === "left" || t === "right") {
      return t as SwimlaneWireHandle;
    }
    if (t.startsWith("bottom-left") || t === "bottom_left") return "bottom_left";
    if (t.startsWith("bottom-right") || t === "bottom_right") return "bottom_right";
    if (t.startsWith("top")) return "top";
    if (t.startsWith("bottom")) return "bottom";
    if (t.startsWith("left")) return "left";
    if (t.startsWith("right")) return "right";
    return undefined;
  }
  if (RF_TARGET_TO_WIRE[t]) return RF_TARGET_TO_WIRE[t];
  if (t === "top" || t === "bottom" || t === "left" || t === "right") {
    return t as SwimlaneWireHandle;
  }
  if (t.startsWith("top-left") || t === "top_left") return "top_left";
  if (t.startsWith("top-right") || t === "top_right") return "top_right";
  if (t.startsWith("top")) return "top";
  if (t.startsWith("bottom")) return "bottom";
  if (t.startsWith("left")) return "left";
  if (t.startsWith("right")) return "right";
  return undefined;
}

/** Wire handle → RF handle id trên node. */
export function swimlaneWireHandleToRfId(
  role: "source" | "target",
  wire: string | null | undefined
): string | undefined {
  if (wire == null) return undefined;
  const t = normalizeWireToken(wire);
  if (!t) return undefined;
  if (t.includes("_") && !WIRE_SOURCE_TO_RF[t] && !WIRE_TARGET_TO_RF[t]) {
    const hyphen = t.replace(/_/g, "-");
    if (role === "source") {
      return WIRE_SOURCE_TO_RF[hyphen] ?? (hyphen.endsWith("-source") ? hyphen : `${hyphen}-source`);
    }
    return WIRE_TARGET_TO_RF[hyphen] ?? (hyphen.endsWith("-target") ? hyphen : `${hyphen}-target`);
  }
  if (role === "source") return WIRE_SOURCE_TO_RF[t];
  return WIRE_TARGET_TO_RF[t];
}

/** @deprecated Dùng `swimlaneRfHandleIdToWireHandle` khi cần round-trip fork/join. */
export function swimlaneRfHandleIdToWireEnum(
  id: string | null | undefined
): "top" | "bottom" | "left" | "right" | undefined {
  const h = swimlaneRfHandleIdToWireHandle("source", id);
  if (!h) return undefined;
  if (h === "top_left" || h === "top_right") return "top";
  if (h === "bottom_left" || h === "bottom_right") return "bottom";
  return h;
}

export type SwimlaneWaypoint = { x: number; y: number };

export function parseSwimlaneWaypointsFromWire(
  raw: unknown
): SwimlaneWaypoint[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const out: SwimlaneWaypoint[] = [];
  for (const item of raw) {
    if (item == null || typeof item !== "object" || Array.isArray(item)) continue;
    const x = Number((item as { x?: unknown }).x);
    const y = Number((item as { y?: unknown }).y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    out.push({ x, y });
  }
  return out.length > 0 ? out : undefined;
}

export function swimlaneWaypointsToWire(
  waypoints: SwimlaneWaypoint[] | undefined
): { x: number; y: number }[] | undefined {
  if (!waypoints?.length) return undefined;
  const out = waypoints
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
    .map((p) => ({ x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 }));
  return out.length > 0 ? out : undefined;
}
