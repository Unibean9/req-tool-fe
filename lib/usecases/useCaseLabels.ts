import type {
  UseCaseLevel,
  UseCasePriority,
  UseCaseRelationshipType,
  UseCaseStatus,
} from "@/lib/api/services/useCaseModel";

export const USE_CASE_LEVEL_META: Record<UseCaseLevel, {
  label: string;
  shortLabel: string;
  description: string;
}> = {
  L0: {
    label: "Capability group",
    shortLabel: "Capability",
    description: "A top-level business capability from the PRD.",
  },
  L1: {
    label: "Use case",
    shortLabel: "Use case",
    description: "A user goal or functional requirement under a capability group.",
  },
  L2: {
    label: "Sub-use case",
    shortLabel: "Sub-use case",
    description: "A detailed child flow under a use case.",
  },
};

export const USE_CASE_STATUS_META: Record<UseCaseStatus, {
  label: string;
  description: string;
}> = {
  Confirmed: {
    label: "Confirmed",
    description: "Directly supported by the stored BRD/PRD evidence.",
  },
  Inferred: {
    label: "Inferred",
    description: "Derived from the available BRD/PRD context.",
  },
  Suggested: {
    label: "Suggested",
    description: "A proposal that still needs human review.",
  },
};

export const USE_CASE_PRIORITY_META: Record<UseCasePriority, {
  label: string;
  description: string;
}> = {
  Must: { label: "Required", description: "Needed for the current scope." },
  Should: { label: "Recommended", description: "Important, but can follow the required scope." },
  Could: { label: "Optional", description: "Useful when time and scope allow." },
};

export const USE_CASE_RELATION_META: Record<UseCaseRelationshipType, {
  label: string;
  outgoing: string;
  incoming: string;
}> = {
  association: {
    label: "Association",
    outgoing: "Associated with",
    incoming: "Associated with",
  },
  include: {
    label: "«include»",
    outgoing: "Always reuses",
    incoming: "Included by",
  },
  extend: {
    label: "«extend»",
    outgoing: "Optionally extends",
    incoming: "Extended by",
  },
  generalization: {
    label: "Generalization",
    outgoing: "Specializes",
    incoming: "Generalized by",
  },
  "part-of": {
    label: "Hierarchy",
    outgoing: "Contains",
    incoming: "Contained by",
  },
};

export const USE_CASE_LEVEL_FILTERS: Array<"all" | UseCaseLevel> = ["all", "L0", "L1", "L2"];

