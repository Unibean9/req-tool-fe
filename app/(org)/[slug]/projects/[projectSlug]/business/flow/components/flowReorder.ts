import type { ProjectFlow } from "@/lib/api/services/fetchFlow";

/** Sắp xếp theo `order` từ BE, tie-break theo `name`. */
export function sortFlows(rows: ProjectFlow[]): ProjectFlow[] {
  return [...rows].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}
