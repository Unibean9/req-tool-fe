"use client";

import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { useProjectArtifacts } from "@/hooks/useArtifact";
import { type ArtifactType } from "@/lib/api/services/fetchArtifact";

import { ArtifactEmptyState, ArtifactTable } from "./ArtifactTable";
import { ArtifactPageHeader } from "./ArtifactPageHeader";
import { ArtifactTableSkeleton } from "./ArtifactTableSkeleton";

export const ARTIFACT_TYPE_LABELS: Record<ArtifactType, string> = {
  research_output: "Research Output",
  intent: "Intent",
  problem: "Problem",
  goal: "Goal",
  stakeholder: "Stakeholder",
  capability: "Capability",
  domain_entity: "Domain Entity",
  business_rule: "Business Rule",
  constraint: "Constraint",
  assumption: "Assumption",
  risk: "Risk",
  open_question: "Open Question",
  functional_requirement: "Functional Requirement",
  non_functional_requirement: "Non-Functional Requirement",
  use_case: "Use Case",
  epic: "Epic",
  story: "Story",
  acceptance_criteria: "Acceptance Criteria",
};

type ArtifactTypePageProps = {
  artifactType: ArtifactType;
  projectId: string | null;
  isProjectsPending: boolean;
};

export function ArtifactTypePage({
  artifactType,
  projectId,
  isProjectsPending,
}: ArtifactTypePageProps) {
  // Server-side params: stepKey, phase, currentVersionStatus reduce the dataset
  // status, priority, search are applied client-side for instant filtering
  const apiParams = useMemo(
    () => ({
      type: artifactType,
    }),
    [artifactType]
  );

  const {
    data: artifacts = [],
    isPending: isArtifactsPending,
    isFetching,
    isError,
    error,
    refetch,
  } = useProjectArtifacts(projectId, apiParams, {
    enabled: Boolean(projectId),
    keepPreviousData: true,
  });

  const filtered = useMemo(() => {
    return artifacts;
  }, [artifacts]);

  const label = ARTIFACT_TYPE_LABELS[artifactType];

  const isInitialLoad = isProjectsPending || (isArtifactsPending && !isFetching);
  const archivedCount = filtered.filter(
    (artifact) => artifact.status === "archived"
  ).length;
  const itemStatus = `${filtered.length} ${
    filtered.length === 1 ? "item" : "items"
  } in this BRD section${
    archivedCount > 0 ? `, ${archivedCount} archived` : ""
  }`;

  if (isInitialLoad) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
        <ArtifactPageHeader title={label} status="Loading artifacts…" />
        <ArtifactTableSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
        <ArtifactPageHeader
          title={label}
          status="This BRD section could not be loaded"
        />
        <div className="rounded-xl border border-border/70 bg-card/50 px-5 py-8 text-center">
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : "Failed to load artifacts."}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => void refetch()}
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
      <ArtifactPageHeader title={label} status={itemStatus} />

      {/* <ArtifactToolbar
        filters={filters}
        onFiltersChange={patchFilters}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
        isFetching={isFetching}
      /> */}

      {artifacts.length === 0 ? (
        <ArtifactEmptyState typeLabel={label} />
      ) : (
        <ArtifactTable artifacts={filtered} typeLabel={label} />
      )}
    </div>
  );
}
