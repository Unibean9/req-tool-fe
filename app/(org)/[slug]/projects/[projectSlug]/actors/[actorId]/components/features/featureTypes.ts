import type { FeatureStatus } from "@/lib/api/services/fetchFeature";

export { FEATURE_STATUSES, type FeatureStatus } from "@/lib/api/services/fetchFeature";

export const FEATURE_PRIORITIES = ["low", "medium", "high", "critical"] as const;
export type FeaturePriority = (typeof FEATURE_PRIORITIES)[number];

/** Shape khớp response API Feature. */
export type FeatureRecord = {
  epic_id: string;
  prefix: string;
  title: string;
  description: string;
  status: FeatureStatus;
  priority: FeaturePriority;
  labels: string;
  nfr_note: string;
  references: string;
  warnings: string[];
  total_story_points: number;
  total_business_value: number;
  story_count: number;
  created_at: string;
  updated_at: string;
};

export type FeatureNodeData = FeatureRecord & {
  kind: "feature";
  collapsed: boolean;
};

export function createDefaultFeatureRecord(epicId: string): FeatureRecord {
  const now = new Date().toISOString();
  return {
    epic_id: epicId,
    prefix: "",
    title: "Feature mới",
    description: "",
    status: "draft",
    priority: "medium",
    labels: "",
    nfr_note: "",
    references: "",
    warnings: [],
    total_story_points: 0,
    total_business_value: 0,
    story_count: 0,
    created_at: now,
    updated_at: now,
  };
}
