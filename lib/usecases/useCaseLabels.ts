import type {
  EvidenceType,
  UseCasePriority,
  UseCaseRelationshipType,
} from "@/lib/api/services/useCaseModel";

export const USE_CASE_EVIDENCE_META: Record<EvidenceType, { label: string; description: string }> = {
  explicit: { label: "Explicit", description: "Directly supported by the stored BRD/PRD evidence." },
  inferred: { label: "Inferred", description: "Derived from the available BRD/PRD context." },
};

export const USE_CASE_PRIORITY_META: Record<UseCasePriority, { label: string; description: string }> = {
  required: { label: "Required", description: "Needed for the current scope." },
  recommended: { label: "Recommended", description: "Useful for the intended product scope." },
  optional: { label: "Optional", description: "Can be deferred when scope is constrained." },
};

export const USE_CASE_RELATION_META: Record<
  UseCaseRelationshipType,
  { label: string; outgoing: string; incoming: string }
> = {
  include: { label: "«include»", outgoing: "Includes", incoming: "Included by" },
  extend: { label: "«extend»", outgoing: "Extends", incoming: "Extended by" },
  generalization: { label: "Generalization", outgoing: "Specializes", incoming: "Generalized by" },
};

/** Legacy labels kept only for unused compatibility dialogs from the previous L0/L1/L2 screen. */
export const USE_CASE_LEVEL_META = {
  L0: { label: "System", description: "Legacy compatibility value." },
  L1: { label: "Module", description: "Legacy compatibility value." },
  L2: { label: "Use case", description: "Legacy compatibility value." },
} as const;

export const USE_CASE_STATUS_META = {
  Confirmed: { label: "Explicit", description: "Legacy compatibility value." },
  Inferred: { label: "Inferred", description: "Legacy compatibility value." },
  Suggested: { label: "Inferred", description: "Legacy compatibility value." },
} as const;
