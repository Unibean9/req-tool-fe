/**
 * Flow "catalog" actions từ GET flow (`actions: unknown[]`) → form draft.
 * Khác swimlane UML actions trong `fetchFlow`.
 */

export type FlowCatalogActionDraft = {
  id: string;
  order: number;
  description: string;
  actorId: string;
  ruleIds: string[];
};

export function hasFlowCatalogActions(actions: unknown[]): boolean {
  return parseFlowCatalogActions(actions).length > 0;
}

export function parseFlowCatalogActions(actions: unknown[]): FlowCatalogActionDraft[] {
  if (!Array.isArray(actions)) return [];
  const parsed = actions
    .map((raw, index) => {
      if (!raw || typeof raw !== "object") return null;
      const o = raw as Record<string, unknown>;
      const id = String(o.id ?? "").trim();
      if (!id) return null;
      const actorId = String(o.actorId ?? o.actor_id ?? "").trim();
      const description = String(o.description ?? "").trim();
      const order =
        typeof o.order === "number" && Number.isFinite(o.order) ? o.order : index;
      let ruleIds: string[] = [];
      if (Array.isArray(o.rule_ids)) {
        ruleIds = o.rule_ids.map((x) => String(x).trim()).filter(Boolean);
      } else if (Array.isArray(o.ruleIds)) {
        ruleIds = o.ruleIds.map((x) => String(x).trim()).filter(Boolean);
      } else if (Array.isArray(o.rules)) {
        for (const r of o.rules) {
          if (r && typeof r === "object" && "id" in r) {
            const rid = String((r as { id: unknown }).id ?? "").trim();
            if (rid) ruleIds.push(rid);
          } else if (typeof r === "string") {
            const t = r.trim();
            if (t) ruleIds.push(t);
          }
        }
      }
      return { id, order, description, actorId, ruleIds };
    })
    .filter((x): x is FlowCatalogActionDraft => x != null);

  return [...parsed].sort((a, b) => a.order - b.order);
}
