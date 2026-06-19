"use client";

import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { useProjectArtifacts } from "@/hooks/useArtifact";
import { type ArtifactType } from "@/lib/api/services/fetchArtifact";

import { ArtifactEmptyState, ArtifactTable } from "./ArtifactTable";
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

  if (isInitialLoad) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="h-8 min-w-50 flex-1 animate-pulse rounded-lg bg-muted" />
          <div className="h-8 w-28 animate-pulse rounded-lg bg-muted" />
          <div className="h-8 w-28 animate-pulse rounded-lg bg-muted" />
          <div className="h-8 w-28 animate-pulse rounded-lg bg-muted" />
        </div>
        <ArtifactTableSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{label}</h1>
        </div>
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{label}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {filtered.length}
          {filtered.length !== artifacts.length
            ? ` of ${artifacts.length}`
            : ""}{" "}
          {artifacts.length === 1 ? "item" : "items"}
        </p>
      </div>

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
