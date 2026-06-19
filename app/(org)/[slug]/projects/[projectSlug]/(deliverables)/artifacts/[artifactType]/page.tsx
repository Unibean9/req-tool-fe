"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";

import { useOrgProjects } from "@/hooks/useProject";
import { ARTIFACT_TYPES, type ArtifactType } from "@/lib/api/services/fetchArtifact";

import { useOrgWorkspace } from "../../../../../orgWorkspaceContext";
import { ArtifactTypePage } from "./components/ArtifactTypePage";

export default function Page() {
  const params = useParams();
  const { orgId } = useOrgWorkspace();

  const projectSlug = useMemo(() => {
    const raw = params?.projectSlug;
    const s =
      typeof raw === "string"
        ? raw
        : Array.isArray(raw)
          ? (raw[0] ?? "")
          : "";
    try {
      return decodeURIComponent(s).trim();
    } catch {
      return s.trim();
    }
  }, [params?.projectSlug]);

  const artifactTypeRaw = useMemo(() => {
    const raw = params?.artifactType;
    return typeof raw === "string"
      ? raw
      : Array.isArray(raw)
        ? (raw[0] ?? "")
        : "";
  }, [params?.artifactType]);

  const artifactType: ArtifactType | null = useMemo(
    () =>
      (ARTIFACT_TYPES as readonly string[]).includes(artifactTypeRaw)
        ? (artifactTypeRaw as ArtifactType)
        : null,
    [artifactTypeRaw]
  );

  const { data: projects, isPending: isProjectsPending } = useOrgProjects(orgId);
  const projectId = useMemo(
    () => projects?.find((p) => p.slug === projectSlug)?.id ?? null,
    [projects, projectSlug]
  );

  if (!artifactType) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Invalid artifact type.</p>
      </div>
    );
  }

  return (
    <ArtifactTypePage
      artifactType={artifactType}
      projectId={projectId}
      isProjectsPending={isProjectsPending}
    />
  );
}
