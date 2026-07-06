"use client";

import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { useProjectArtifacts } from "@/hooks/useArtifact";
import { useDocumentTypes } from "@/hooks/useDocument";
import { type ArtifactType } from "@/lib/api/services/fetchArtifact";

import { ArtifactEmptyState, ArtifactTable } from "./ArtifactTable";
import { ArtifactPageHeader } from "./ArtifactPageHeader";
import { ArtifactTableSkeleton } from "./ArtifactTableSkeleton";

function formatArtifactTypeLabel(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

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
  const { data: documentTypes } = useDocumentTypes();

  const filtered = useMemo(() => {
    return artifacts;
  }, [artifacts]);

  const artifactMetadata = useMemo(() => {
    if (!documentTypes) return null;

    return (
      [...documentTypes.containers, ...documentTypes.items].find(
        (entry) => entry.artifactType === artifactType
      ) ?? null
    );
  }, [artifactType, documentTypes]);

  const label = artifactMetadata?.label ?? formatArtifactTypeLabel(artifactType);
  const description = artifactMetadata?.description ?? null;

  const isInitialLoad = isProjectsPending || (isArtifactsPending && !isFetching);
  const archivedCount = filtered.filter(
    (artifact) => artifact.status === "archived"
  ).length;
  const itemStatus = `${filtered.length} ${
    filtered.length === 1 ? "item" : "items"
  } for ${label}${
    archivedCount > 0 ? `, ${archivedCount} archived` : ""
  }`;

  if (isInitialLoad) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
        <ArtifactPageHeader
          title={label}
          description={description}
          status="Loading artifacts…"
        />
        <ArtifactTableSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
        <ArtifactPageHeader
          title={label}
          description={description}
          status="This artifact type could not be loaded"
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
      <ArtifactPageHeader
        title={label}
        description={description}
        status={itemStatus}
      />

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
